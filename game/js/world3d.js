/* Bản đồ 3D kiểu sách pop-up: lớp vẽ chính của các khu ngoài phố.
   Engine (js/engine.js) vẫn giữ mọi logic: đi lại, va chạm, cửa, nhiệm vụ, nói chuyện. Tệp này chỉ dựng và vẽ:
   ba tờ bản đồ ghép liền (Khu phố Maple · Trung tâm · Phố mua sắm) đi bộ xuyên suốt, nhà cây bật lên như sách pop-up
   khi tới gần, người đi đường, xe cộ, chim, trời theo giờ Việt Nam (sáng → khuya, hoàng hôn, sao, trăng, mây đen kéo tới
   trước mưa), tiếng chim, dế, gió, và xe đưa đón học sinh chạy trên đường.
   Camera xoay quanh nhân vật kiểu GTA: tay trái đi (cần điều khiển, theo hướng camera), tay phải vuốt để xoay góc nhìn.
   Mọi tấm giấy (người, nhà, cây, xe, ô) luôn quay mặt về camera; hướng khung hình người, xe tính theo góc camera.
   Máy không có WebGL thì engine tự vẽ bản 2D (không còn nút chọn 2D). */
var G = window.G || (window.G = {});

(function () {
  var U = 0.01;                          // 1 px bản đồ 2D = 0.01 đơn vị 3D
  var LEAN = 0.3;                        // tấm giấy ngả về sau (rad) để nhìn từ trên xuống không bị dẹt
  var WALK_FPS = 7 / (Math.PI / 2);      // nhịp khung bước giống hệt bản 2D (pha 14 rad/giây × 0,5 → 4,46 khung/giây)
  var POP_UP = 5.4, POP_DOWN = 6.8;      // bán kính dựng / gập (đơn vị 3D)
  /* các khu ghép liền: gốc toạ độ (px) của từng tờ bản đồ trong thành phố chung */
  G.WORLD3D = G.WORLD3D || { home_en: { ox: -1536, oy: 0 }, city_en: { ox: 0, oy: 0 }, street_en: { ox: 1536, oy: 128 } };
  var W3 = G.W3D = { ready: false, active: false };
  function has(n) { return !!(G.ASSET_REV && G.ASSET_REV[n]); }

  W3.can = function () {
    if (W3._can !== undefined) return W3._can;
    var ok = !!window.THREE;
    if (ok) { try { var c = document.createElement('canvas'); ok = !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { ok = false; } }
    return (W3._can = ok);
  };
  W3.enabled = function () { return W3.can(); };   // chỉ còn bản 3D (anh Han chốt): máy không có WebGL mới vẽ 2D
  W3.inWorld = function (id) { return !!G.WORLD3D[id]; };

  var R, SC, CAM, HEMI, SUN, cv3, Wc = 1, Hc = 1, loader, TEX = {}, TEXF = {}, MATS = {}, DMATS = {};
  var PLANE, FOLD_T, FOLD_B, BLOBG, BLOBM, GLOW, DIST = [];
  var FLATS = [], POPS = [], BUILD = [], SWAY = [], LAMPS = [], FADE = [], PLATES = [], TLS = [], NPCW = [], TOWN = [], CARS = [], BIRDS = [], PICK = [], STAND = [];
  var P3 = null, K3 = null, mark, ring, PIN, T = 0, night = 0, wxNow = { cloud: 0.1, rain: 0, gather: 0, kind: 'clear' };
  var FX = 0, FZ = 0, zoomK = 1, camPos, camLook, snap = true, ST = null, isTouch = 'ontouchstart' in window;
  /* góc camera: YAW quay quanh nhân vật (0 = nhìn về phía bắc như bản cũ), PITCH nâng / hạ góc nhìn (lệch so với mặc định) */
  var YAW = 0, PITCH = 0, BILL = [], billYaw = null;
  function bill(g) { g.rotation.order = 'YXZ'; g.rotation.y = YAW; BILL.push(g); return g; }   // tấm giấy luôn quay về camera
  function applyYaw() {
    if (billYaw === YAW) return; billYaw = YAW;
    for (var i = BILL.length - 1; i >= 0; i--) { var g = BILL[i]; if (!g.parent) { BILL.splice(i, 1); continue; } g.rotation.y = YAW; }
  }
  /* (vx, vz) thế giới → (sang phải màn hình, xuống màn hình) theo góc camera */
  function rel(vx, vz) { var c = Math.cos(YAW), sn = Math.sin(YAW); return [vx * c - vz * sn, vx * sn + vz * c]; }
  /* vector "lên trên" của tấm giấy ngả (h đơn vị): dùng cho bong bóng, dấu nhiệm vụ, toạ độ màn hình */
  function upv(h) { var sl = Math.sin(LEAN) * h; return [-Math.sin(YAW) * sl, Math.cos(LEAN) * h, -Math.cos(YAW) * sl]; }
  W3.yaw = function () { return YAW; };
  W3.orbit = function (dy, dp) {
    YAW += dy; while (YAW > Math.PI) YAW -= 2 * Math.PI; while (YAW < -Math.PI) YAW += 2 * Math.PI;
    PITCH = Math.max(-0.22, Math.min(0.42, PITCH + (dp || 0)));
    camBtn();
  };
  /* nút đưa camera về hướng cũ (hiện khi đã xoay) */
  var camEl = null, camBack = 0;
  function camBtn() {
    if (!camEl) {
      var play = document.getElementById('play'); if (!play) return;
      camEl = document.createElement('button'); camEl.id = 'camreset'; camEl.className = 'cam-reset'; camEl.setAttribute('aria-label', 'Đưa góc nhìn về hướng cũ');
      camEl.textContent = '🧭'; camEl.onclick = function (e) { e.stopPropagation(); camBack = 1; };
      play.appendChild(camEl);
    }
    camEl.style.display = W3.active && (Math.abs(YAW) > 0.12 || Math.abs(PITCH) > 0.08) ? 'block' : 'none';
  }

  /* ---------- hình ---------- */
  function tex(n) {
    if (TEX[n]) return TEX[n];
    var t = loader.load(G.assetUrl(n), function (tt) { if (R.initTexture) R.initTexture(tt); });   // đưa lên GPU ngay khi tải xong: đổi khung bước không bị khựng
    t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(4, R.capabilities.getMaxAnisotropy());
    return (TEX[n] = t);
  }
  /* bản lật ngang (cho hình chim, xe nhìn một phía): Sprite không lật được bằng scale âm */
  function texFlip(n) {
    if (TEXF[n]) return TEXF[n];
    var t = loader.load(G.assetUrl(n), function (tt) { if (R.initTexture) R.initTexture(tt); });
    t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1;
    return (TEXF[n] = t);
  }
  function ready(t) { return !!(t && t.image && t.image.width); }
  /* tấm giấy: sáng tối theo nắng nhưng luôn giữ một nền sáng (emissive) để hình không bị tối khi nắng chiếu xiên */
  var PLANE_C = null;   // mặt phẳng 1×1 tâm ở giữa (ô cầm tay)
  function mat(n) { return MATS[n] || (MATS[n] = new THREE.MeshLambertMaterial({ map: tex(n), emissive: 0x5a5a5a, emissiveMap: tex(n), alphaTest: 0.5, side: THREE.DoubleSide })); }
  function dmat(n) { return DMATS[n] || (DMATS[n] = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex(n), alphaTest: 0.5 })); }
  function setMap(m, n) {   // đổi hình của một tấm (cả lớp sáng nền), chỉ khi hình mới đã tải xong
    var t = tex(n); if (m.material.map === t || !ready(t)) return;
    m.material.map = t; m.material.emissiveMap = t; m.customDepthMaterial = dmat(n);
  }
  /* tấm giấy gấp đôi theo chiều dọc: nếp giữa nhô về phía người xem, hai nửa hứng nắng khác nhau */
  function folded(depth) {
    var gm = new THREE.PlaneGeometry(1, 1, 2, 1); gm.translate(0, 0.5, 0);
    var pos = gm.attributes.position;
    for (var i = 0; i < pos.count; i++) if (Math.abs(pos.getX(i)) < 0.01) pos.setZ(i, depth);
    pos.needsUpdate = true; gm.computeVertexNormals(); return gm;
  }
  /* tấm giấy đứng: chân tại (gx, gy) px toàn thành phố, cỡ s px, foot = tỉ lệ chân trong khung hình */
  function card(n, gx, gy, s, foot, opt) {
    opt = opt || {};
    var g = new THREE.Group(), m = new THREE.Mesh(opt.fold === 'tree' ? FOLD_T : opt.fold === 'b' ? FOLD_B : PLANE, opt.own ? mat(n).clone() : mat(n));
    m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = dmat(n);
    m.position.y = -(1 - (foot || 0.96));
    g.add(m); g.scale.set(s * U, s * U, s * U);
    g.position.set(gx * U, 0, gy * U); g.rotation.x = -LEAN; bill(g);
    SC.add(g); g.userData.mesh = m;
    if (opt.pop !== false) {   // người, xe đi lại thì luôn đứng; mọi vật khác bật lên khi tới gần
      var pp = { g: g, a: 0, v: 0, up: false, wait: 0, x: g.position.x, z: g.position.z, jit: Math.random() * 0.12, r: s * U * (opt.fold === 'b' ? 0.42 : 0.18) };
      g.rotation.x = -Math.PI / 2; g.userData.pop = pp; POPS.push(pp);
    }
    return g;
  }
  function blob(r) { var b = new THREE.Mesh(BLOBG, BLOBM); b.scale.set(r * 2, 1, r * 0.9); b.position.y = 0.012; SC.add(b); return b; }
  function canvasTex(w, h, paint) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; paint(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  }
  function plate(text, gx, gy, pop) {   // biển tên nổi (luôn quay về phía camera); pop: hiện theo vật đã dựng
    var c = document.createElement('canvas'), x = c.getContext('2d'); x.font = '800 44px -apple-system, system-ui, sans-serif';
    var w = Math.ceil(x.measureText(text).width) + 56; c.width = w; c.height = 72; x = c.getContext('2d');
    x.fillStyle = 'rgba(27,33,64,.86)'; x.beginPath(); if (x.roundRect) x.roundRect(0, 0, w, 72, 36); else x.rect(0, 0, w, 72); x.fill();
    x.fillStyle = '#fff'; x.font = '800 44px -apple-system, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, w / 2, 38);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }));
    sp.scale.set(w / 72 * 0.24, 0.24, 1); sp.position.set(gx * U, 0.16, gy * U + 0.25); sp.renderOrder = 10; sp.userData.pop = pop; SC.add(sp); PLATES.push(sp); return sp;
  }

  /* ---------- người, robot đi bằng khung hình (đứng → bước 1 → đứng → bước 2), cùng nhịp với bản 2D ---------- */
  function walker(base, gx, gy, S, foot) {
    var w = { base: base, x: gx * U, z: gy * U, dir: 'down', t: 0, moving: false, S: S, foot: foot || 0.957, vx: 0 };
    w.g = card(firstFrame(base), gx, gy, S, w.foot, { own: true, pop: false });
    w.blob = blob(0.24 * S / 120);
    ['down', 'up', 'left'].forEach(function (d) { ['', '_w1', '_w2'].forEach(function (s) { if (has(base + '_' + d + s + '.png')) tex(base + '_' + d + s + '.png'); }); });   // tải sẵn mọi khung
    return w;
  }
  function firstFrame(base) { return has(base + '_down.png') ? base + '_down.png' : base + '_left.png'; }
  function frameOf(w) {
    var d = w.dir === 'right' ? 'left' : w.dir, flip = w.dir === 'right', b = w.base;
    if (d === 'up' && w.moving && !has(b + '_up_w1.png') && has(b + '_left_w1.png')) { d = 'left'; flip = w.vx > 0; }   // chưa có khung bước nhìn sau: bước ngang theo hướng đi
    if (!has(b + '_' + d + '.png')) { d = has(b + '_down.png') ? 'down' : 'left'; if (d === 'down') flip = false; }
    var n = b + '_' + d + '.png', walk = has(b + '_' + d + '_w1.png') && has(b + '_' + d + '_w2.png'), lift = 0;
    if (w.moving && walk) {
      var f = Math.floor(w.t * WALK_FPS) % 4;
      if (f === 1) n = b + '_' + d + '_w1.png'; else if (f === 3) n = b + '_' + d + '_w2.png'; else lift = 0.018;   // hai chân khép: thân cao hơn một chút
    } else if (w.moving) lift = Math.abs(Math.sin(w.t * 14)) * 0.07;   // chưa có khung bước: nhún nhảy kiểu tượng giấy
    return { n: n, flip: flip, lift: lift };
  }
  function drawWalker(w) {
    keepDir(w);
    var fr = frameOf(w), m = w.g.userData.mesh;
    setMap(m, fr.n); w.fr = fr;
    w.g.scale.x = (fr.flip ? -1 : 1) * w.S * U;
    w.g.position.set(w.x, fr.lift * w.S * U, w.z); w.blob.position.set(w.x, 0.012, w.z);
    if (w.um) placeUmbrella(w);
  }
  /* hướng nhìn có độ trễ (giống bản 2D): đi chéo không nhấp nháy. (vx, vz) là hướng trong thế giới; khung hình chọn theo góc camera */
  function setDir(w, vx, vz) {
    w.hx = vx; w.hz = vz; w.hyaw = YAW;
    var q = rel(vx, vz), ax = Math.abs(q[0]), az = Math.abs(q[1]), horiz = w.dir === 'left' || w.dir === 'right';
    if (horiz ? az > ax * 1.3 : ax > az * 1.3) horiz = !horiz;
    w.dir = horiz ? (q[0] < 0 ? 'left' : 'right') : (q[1] < 0 ? 'up' : 'down'); w.vx = q[0];
  }
  function faceTo(w, dx, dz) {
    w.hx = dx; w.hz = dz; w.hyaw = YAW;
    var q = rel(dx, dz); w.dir = Math.abs(q[0]) > Math.abs(q[1]) * 0.8 ? (q[0] < 0 ? 'left' : 'right') : (q[1] < 0 ? 'up' : 'down');
  }
  var DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  /* camera xoay mà người đứng yên: chọn lại khung hình theo hướng cũ trong thế giới */
  function keepDir(w) { if (w.hx !== undefined && w.hyaw !== YAW) setDir(w, w.hx, w.hz); }

  /* ô che mưa (cầm trên đầu) cho người đi ngoài phố */
  var UCOL = ['#c8553d', '#2f7a63', '#4a68d8', '#e0a43a', '#b46fc0', '#1b2140'], UTEX = [];
  function umbrellaTex(i) {
    if (has('umbrella_' + (i % 6 + 1) + '.png')) return tex('umbrella_' + (i % 6 + 1) + '.png');   // ô vẽ giấy (đặt hình)
    if (UTEX[i]) return UTEX[i];
    return (UTEX[i] = canvasTex(128, 128, function (x) {
      var R0 = 56, cy = 50;
      x.strokeStyle = '#3a2418'; x.lineCap = 'round'; x.lineWidth = 5;
      x.beginPath(); x.moveTo(64, cy); x.lineTo(64, 122); x.stroke();
      x.beginPath(); x.arc(58, 122, 6, 0, Math.PI); x.stroke();
      x.fillStyle = UCOL[i % UCOL.length]; x.lineWidth = 4;
      x.beginPath(); x.moveTo(64 - R0, cy); x.quadraticCurveTo(64, cy - R0 * 0.98, 64 + R0, cy);
      for (var k = 3; k >= 0; k--) { var a = 64 - R0 + (k + 0.5) * R0 / 2; x.quadraticCurveTo(a, cy - R0 * 0.2, a - R0 / 4, cy); }
      x.closePath(); x.fill(); x.stroke();
      x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(64, cy - 27); x.lineTo(36, cy - 3); x.moveTo(64, cy - 27); x.lineTo(92, cy - 3); x.stroke();
    }));
  }
  /* phần cán của hình ô (từ mép tán trở xuống): vẽ đè lên bàn tay để cán nằm đúng trong lòng bàn tay */
  var TEXP = {};
  function texPart(n, rim) {
    if (TEXP[n]) return TEXP[n];
    var t = loader.load(G.assetUrl(n), function (tt) { if (R.initTexture) R.initTexture(tt); });
    t.encoding = THREE.sRGBEncoding; t.repeat.set(1, 1 - rim); t.offset.set(0, 0);
    return (TEXP[n] = t);
  }
  function umMat(t) { return new THREE.MeshLambertMaterial({ map: t, emissive: 0x5a5a5a, emissiveMap: t, alphaTest: 0.4, side: THREE.DoubleSide }); }
  function addUmbrella(w, i) {
    if (!PLANE_C) PLANE_C = new THREE.PlaneGeometry(1, 1);
    var n = 'umbrella_' + (i % 6 + 1) + '.png', gp = (G.UMB_GRIP && G.UMB_GRIP[n]) || [0.5, 0.86, 0.72];
    var cm = new THREE.Mesh(PLANE_C, umMat(umbrellaTex(i))), inner = new THREE.Group(); inner.add(cm); cm.castShadow = true;
    var hm = null;
    if (has(n)) {   // tấm thứ hai: chỉ phần cán + móc, nằm trước bàn tay
      hm = new THREE.Mesh(PLANE_C, umMat(texPart(n, gp[2]))); hm.scale.set(1, 1 - gp[2], 1); hm.position.y = -gp[2] / 2; inner.add(hm);
    }
    var g = new THREE.Group(); g.add(inner); g.rotation.x = -LEAN; bill(g); g.visible = false; SC.add(g);
    w.um = g; w.umIn = inner; w.umC = cm; w.umH = hm; w.umName = n; w.umGrip = gp;
  }
  /* ô trong tay: điểm cầm trên cán (G.UMB_GRIP) đặt đúng lòng bàn tay của khung hình đang vẽ (G.HANDS, có cả khung bước),
     cán ngả về phía đầu. Nhìn trước / ngang: tán nằm sau đầu, phần cán vẽ đè lên tay; nhìn sau lưng: cả ô ở phía người xem. */
  function placeUmbrella(w) {
    var on = wxNow.rain > 0.25 && w.g.visible;
    w.um.visible = on; if (!on) return;
    var fr = w.fr, d = w.dir === 'right' ? 'left' : w.dir, n, back = w.dir === 'up';
    if (fr) n = fr.n;
    else if (w.base === 'custom' && G.S.avatar) n = 'body_' + G.S.avatar.ao + '_' + d + '.png';
    else n = (w.base || 'kai') + '_' + d + '.png';
    var hd = G.HANDS && (G.HANDS[n] || G.HANDS[n.replace(/_w[12]\.png$/, '.png')]), hx = hd ? hd[0] / 100 : 0.7, hy = hd ? hd[1] / 100 : 0.72;
    if (fr ? fr.flip : w.dir === 'right') hx = 1 - hx;
    var S = w.S * U, lift = fr ? fr.lift * S : 0;
    var lx = (hx - 0.5) * S, ly = ((w.foot || 0.957) - hy) * S + lift;   // lòng bàn tay trên tấm hình (tính từ chân)
    var k = S * 0.9, gp = w.umGrip;
    var th = (lx > 0.01 ? 1 : lx < -0.01 ? -1 : 0) * 0.3;
    var ox = (0.5 - gp[0]) * k, oy = (gp[1] - 0.5) * k, rx = ox * Math.cos(th) - oy * Math.sin(th), ry = ox * Math.sin(th) + oy * Math.cos(th);
    w.um.position.set(w.x, 0, w.z);
    w.umIn.position.set(lx + rx, ly + ry, 0); w.umIn.rotation.z = th; w.umIn.scale.set(k, k, 1);
    w.umC.position.z = back ? 0.03 : -0.03;          // tán: sau đầu (nhìn trước / ngang) hoặc phía người xem (nhìn sau lưng)
    if (w.umH) w.umH.position.z = back ? 0.04 : 0.035;   // cán: luôn trước bàn tay
  }

  /* ---------- dựng thành phố (một lần) ---------- */
  W3.init = function () {
    if (W3.ready) return true;
    if (!W3.can()) return false;
    try { build(); W3.ready = true; }
    catch (e) { W3._can = false; if (window.console) console.warn('3D lỗi, dùng bản 2D', e); return false; }
    return true;
  };
  function build() {
    cv3 = document.getElementById('world3d');
    R = new THREE.WebGLRenderer({ canvas: cv3, antialias: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(isTouch ? 1.6 : 2, window.devicePixelRatio || 1));   // iPad / iPhone: bớt điểm ảnh cho mượt
    R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFSoftShadowMap;
    R.outputEncoding = THREE.sRGBEncoding;
    SC = new THREE.Scene();
    SC.fog = new THREE.Fog(0xf3e6cf, 16, 40);
    SC.background = new THREE.Color(0xf3e6cf);
    CAM = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    HEMI = new THREE.HemisphereLight(0xfff6e6, 0xc9d6a8, 0.8); SC.add(HEMI);
    SUN = new THREE.DirectionalLight(0xfff1d6, 0.6);
    SUN.castShadow = true; var ms = isTouch ? 1024 : 2048; SUN.shadow.mapSize.set(ms, ms);
    var shc = SUN.shadow.camera; shc.left = -13; shc.right = 13; shc.top = 13; shc.bottom = -13; shc.near = 1; shc.far = 70;
    SUN.shadow.bias = -0.0006; SUN.shadow.normalBias = 0.02;
    SC.add(SUN); SC.add(SUN.target);
    loader = new THREE.TextureLoader();
    PLANE = new THREE.PlaneGeometry(1, 1); PLANE.translate(0, 0.5, 0);
    FOLD_T = folded(0.16); FOLD_B = folded(0.06);
    var blobTex = canvasTex(64, 64, function (x) {
      var gr = x.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(40,25,10,.45)'); gr.addColorStop(1, 'rgba(40,25,10,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    });
    BLOBM = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false });
    BLOBG = new THREE.PlaneGeometry(1, 1); BLOBG.rotateX(-Math.PI / 2);
    GLOW = canvasTex(128, 128, function (x) {
      var gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(0.3, 'rgba(255,200,110,.5)'); gr.addColorStop(1, 'rgba(255,190,90,0)');
      x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
    });

    /* mặt đất: đồng cỏ màu nước trải tới chân trời (grass_tile.webp: ghép từ cỏ trong các tờ bản đồ, lặp liền mép)
       + tờ bản đồ từng khu; ngoài các khu có cây, bụi, đá rải ra để nhìn xa không thấy mép bản đồ */
    var grass = tex('grass_tile.webp'); grass.wrapS = grass.wrapT = THREE.RepeatWrapping; grass.repeat.set(43, 31);
    var base = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), new THREE.MeshLambertMaterial({ map: grass, color: 0xf6f3e6 }));
    base.rotation.x = -Math.PI / 2; base.position.set(0, -0.01, 10.24); base.receiveShadow = true; SC.add(base);
    for (var id in G.WORLD3D) if (G.WORLD3D.hasOwnProperty(id) && G.SCENES[id]) DIST.push({ id: id, ox: G.WORLD3D[id].ox, oy: G.WORLD3D[id].oy, s: G.SCENES[id] });
    DIST.forEach(function (d) {
      var s = d.s, gm = new THREE.Mesh(new THREE.PlaneGeometry(s.w * U, s.h * U), new THREE.MeshLambertMaterial({ map: tex(s.bg) }));
      gm.rotation.x = -Math.PI / 2; gm.position.set((d.ox + s.w / 2) * U, 0, (d.oy + s.h / 2) * U); gm.receiveShadow = true; SC.add(gm);
    });
    buildShadows();
    DIST.forEach(buildDistrict);
    buildCountry();
    buildTown(); buildCars(); buildBirds(); buildSky(); buildRiver();
    /* dấu chạm đất, vòng sáng chỗ tương tác, dấu nhiệm vụ */
    mark = new THREE.Mesh(new THREE.RingGeometry(0.12, 0.17, 32), new THREE.MeshBasicMaterial({ color: 0xfff8ea, transparent: true, opacity: 0, depthWrite: false }));
    mark.rotation.x = -Math.PI / 2; mark.position.y = 0.02; SC.add(mark);
    ring = new THREE.Mesh(BLOBG, new THREE.MeshBasicMaterial({ map: GLOW, transparent: true, depthWrite: false, opacity: 0 }));
    ring.scale.set(1.7, 1, 0.75); ring.position.y = 0.016; SC.add(ring);
    PIN = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(96, 96, function (x) { x.font = '78px -apple-system, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('📍', 48, 52); }), depthTest: false, transparent: true }));
    PIN.scale.set(0.5, 0.5, 1); PIN.renderOrder = 12; PIN.visible = false; SC.add(PIN);
    camPos = new THREE.Vector3(); camLook = new THREE.Vector3();
    addEventListener('resize', resize); resize();
  }
  /* bóng mây trôi trên mặt đất */
  var cloudTex = null, cloudsM = null;
  function buildShadows() {
    cloudTex = canvasTex(256, 256, function (x) {
      for (var i = 0; i < 9; i++) {
        var cx = Math.random() * 256, cy = Math.random() * 256, r = 30 + Math.random() * 50;
        for (var ox = -256; ox <= 256; ox += 256) for (var oy = -256; oy <= 256; oy += 256) {
          var gr = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, r); gr.addColorStop(0, 'rgba(30,30,50,.55)'); gr.addColorStop(1, 'rgba(30,30,50,0)');
          x.fillStyle = gr; x.beginPath(); x.arc(cx + ox, cy + oy, r, 0, 6.283); x.fill();
        }
      }
    });
    cloudTex.wrapS = cloudTex.wrapT = THREE.RepeatWrapping; cloudTex.repeat.set(3, 2);
    cloudTex.repeat.set(4.7, 3.4);
    cloudsM = new THREE.Mesh(new THREE.PlaneGeometry(220, 160), new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.16, depthWrite: false }));
    cloudsM.rotation.x = -Math.PI / 2; cloudsM.position.set(0, 0.02, 10.24); SC.add(cloudsM);
  }
  var BUBBLE_T = null;
  function talkBubble() {
    if (!BUBBLE_T) BUBBLE_T = canvasTex(128, 128, function () {});
    if (!BUBBLE_T._ic) {   // bong bóng chat kiểu giấy (hình đặt, Đơn N) vẽ lên khi tải xong
      BUBBLE_T._ic = new Image();
      BUBBLE_T._ic.onload = function () { BUBBLE_T.image.getContext('2d').drawImage(BUBBLE_T._ic, 0, 0, 128, 128); BUBBLE_T.needsUpdate = true; };
      BUBBLE_T._ic.src = G.assetUrl('talk_bubble_paper.png');
    }
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: BUBBLE_T, depthTest: false, transparent: true }));
    sp.scale.set(0.34, 0.34, 1); sp.renderOrder = 11; sp.visible = false; SC.add(sp); return sp;
  }
  /* vùng quê quanh thành phố: cây, bụi, đá (hình đã đặt) rải ngoài các tờ bản đồ, luôn đứng, mờ dần theo sương xa */
  function buildCountry() {
    var seed = 20261124; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var RECT = DIST.map(function (d) { return [d.ox * U - 0.25, d.oy * U - 0.25, (d.ox + d.s.w) * U + 0.25, (d.oy + d.s.h) * U + 0.25]; });
    var x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
    RECT.forEach(function (r) { x0 = Math.min(x0, r[0]); z0 = Math.min(z0, r[1]); x1 = Math.max(x1, r[2]); z1 = Math.max(z1, r[3]); });
    function inside(x, z) { for (var i = 0; i < RECT.length; i++) { var r = RECT[i]; if (x > r[0] && x < r[2] && z > r[1] && z < r[3]) return true; } return false; }
    var KIND = [['pc_tree_green.png', 230, 'tree'], ['pc_tree_birch.png', 220, 'tree'], ['pc_tree_maple.png', 220, 'tree'], ['pc_tree_orange.png', 220, 'tree'],
      ['pc_tree_pine.png', 250, 'tree'], ['pc_tree_small.png', 160, 'tree'], ['pc_tree_green.png', 260, 'tree'], ['pc_tree_pine.png', 280, 'tree'],
      ['pc_bush_orange.png', 120, 'tree'], ['pc_bush_white.png', 120, 'tree'], ['pc_rock_moss.png', 95, null], ['pc_rock.png', 85, null]];
    var STEP = 2.1, n = 0, M = 16;   // rải trong dải 16 đơn vị quanh thành phố (xa hơn đã chìm trong sương)
    for (var z = z0 - M; z < z1 + M; z += STEP) for (var x = x0 - M; x < x1 + M; x += STEP) {
      var px = x + (rnd() - 0.5) * STEP * 0.9, pz = z + (rnd() - 0.5) * STEP * 0.9;
      if (inside(px, pz)) continue;
      var edge = Math.max(x0 - px, px - x1, z0 - pz, pz - z1, 0);   // càng xa thành phố càng thưa
      if (rnd() > (edge < 3 ? 0.5 : 0.32)) continue;
      var k = KIND[Math.floor(rnd() * KIND.length)], s = k[1] * (0.8 + rnd() * 0.45);
      card(k[0], px / U, pz / U, s, 0.96, { fold: k[2], pop: false });
      n++;
    }
    W3.countryN = n;
  }
  function buildDistrict(d) {
    var s = d.s;
    (s.buildings || []).forEach(function (b) {
      var S = b.s || 300, g = card(b.img, d.ox + b.x, d.oy + b.y, S, 0.975, { own: true, fold: 'b' });
      FADE.push(g); blob(S * U * 0.38).position.set((d.ox + b.x) * U, 0.012, (d.oy + b.y - 10) * U);
      BUILD.push({ x: (d.ox + b.x) * U, z: (d.oy + b.y + 20) * U, b: b });
      g.userData.mesh.userData.pick = { kind: 'b', id: d.id, x: b.x, y: b.y + 18 }; PICK.push(g.userData.mesh);
      plate(b.name, d.ox + b.x, d.oy + b.y + 26, g.userData.pop);
    });
    (s.props || []).forEach(function (p) {
      if (p.flat) {   // nằm sát mặt nước / mặt đất (lá sen)
        var fm = new THREE.Mesh(BLOBG, new THREE.MeshLambertMaterial({ map: tex(p.img), transparent: true, alphaTest: 0.4, depthWrite: false }));
        fm.scale.set(p.s * U, 1, p.s * U); fm.position.set((d.ox + p.x) * U, 0.02, (d.oy + p.y) * U); fm.renderOrder = 1; SC.add(fm); FLATS.push({ m: fm, ph: Math.random() * 6 });
        return;
      }
      var g = card(p.img, d.ox + p.x, d.oy + p.y, p.s, 0.96, { own: /tree|fountain/.test(p.img), fold: /tree|bush/.test(p.img) ? 'tree' : /fountain|kiosk|cart|news/.test(p.img) ? 'b' : null });
      if (/tree/.test(p.img)) { SWAY.push({ g: g, ph: Math.random() * 6, k: 0.6 + Math.random() * 0.5 }); FADE.push(g); }
      if (/traffic_light/.test(p.img)) TLS.push({ x: (d.ox + p.x) * U, z: (d.oy + p.y) * U, s: p.s, pop: g.userData.pop });
      if (/lamp/.test(p.img)) {
        var gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
        gl.scale.set(0.9, 0.9, 1); gl.position.set((d.ox + p.x) * U, p.s * U * 0.82, (d.oy + p.y) * U - 0.25); SC.add(gl);
        var pool = new THREE.Mesh(BLOBG, new THREE.MeshBasicMaterial({ map: GLOW, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
        pool.scale.set(2.2, 1, 1.4); pool.position.set((d.ox + p.x) * U, 0.015, (d.oy + p.y) * U + 0.1); SC.add(pool);
        gl.userData.pop = pool.userData.pop = g.userData.pop; LAMPS.push(gl, pool);
      }
    });
    ((G.PEOPLE && G.PEOPLE[d.id]) || []).forEach(function (o) {
      var n = G.NPCS[o.npc], e = { o: o, d: d, bub: talkBubble() };
      if (o.bimg) {   // tiệm nhỏ có hình toà nhà: người bán ở bên trong
        var bs = o.bs || 210, g = card(o.bimg, d.ox + o.x, d.oy + o.y + 14, bs, 0.975, { own: true, fold: 'b' }); FADE.push(g);
        g.userData.mesh.userData.pick = { kind: 'npc', id: d.id, x: o.x, y: o.y + 40 }; PICK.push(g.userData.mesh);
        plate(o.stall, d.ox + o.x, d.oy + o.y + 40, g.userData.pop);
        e.pop = g.userData.pop; e.bx = (d.ox + o.x + bs * 0.33) * U; e.bh = bs * 0.92 * U; e.bz = (d.oy + o.y + 14) * U; NPCW.push(e); return;
      }
      if (!n || !n.img) return;
      var py = o.stall ? o.y - (o.simg ? 58 : 40) : o.y;
      if (!o.stall && has('walk_' + o.npc + '_down.png')) {   // có khung bước: đứng, đi dạo, quay mặt như bản 2D
        e.w = walker('walk_' + o.npc, d.ox + o.x, d.oy + py, 124, 0.957); addUmbrella(e.w, (o.x >> 3) % 6);
        e.w.g.userData.mesh.userData.pick = { kind: 'npc', id: d.id, x: o.x, y: o.y + 40 }; PICK.push(e.w.g.userData.mesh);
        e.plate = plate(n.name, d.ox + o.x, d.oy + py + 22, null);
      } else {
        var np = card(n.img, d.ox + o.x, d.oy + py, 124, 0.957); blob(0.22).position.set((d.ox + o.x) * U, 0.012, (d.oy + py) * U);
        STAND.push({ g: np, ph: Math.random() * 6 }); e.pop = np.userData.pop;
        np.userData.mesh.userData.pick = { kind: 'npc', id: d.id, x: o.x, y: o.y + 40 }; PICK.push(np.userData.mesh);
        plate(n.name, d.ox + o.x, d.oy + py + 22, np.userData.pop);
      }
      if (o.simg) { var cs = o.ss || 280; card(o.simg, d.ox + o.x, d.oy + o.y + 12, cs, 0.975); }
      e.py = py; NPCW.push(e);
    });
  }

  /* ---------- người đi đường: mỗi khu vài người, đi tới điểm ngẫu nhiên rồi dừng nghỉ, gặp người chơi thì chào ---------- */
  function blockedW(wx, wz) { return G.blockedWorld ? G.blockedWorld(wx / U, wz / U) : false; }
  function tryMove(o, vx, vz, step) {
    var nx = o.x + vx * step, nz = o.z + vz * step;
    if (!blockedW(nx, nz)) { o.x = nx; o.z = nz; return true; }
    if (Math.abs(vx) > 0.2 && !blockedW(o.x + (vx > 0 ? 1 : -1) * step * Math.abs(vx), o.z)) { o.x += (vx > 0 ? 1 : -1) * step * Math.abs(vx); return true; }
    if (Math.abs(vz) > 0.2 && !blockedW(o.x, o.z + (vz > 0 ? 1 : -1) * step * Math.abs(vz))) { o.z += (vz > 0 ? 1 : -1) * step * Math.abs(vz); return true; }
    return false;
  }
  function freeSpot(d) {
    for (var k = 0; k < 60; k++) { var x = (d.ox + 80 + Math.random() * (d.s.w - 160)) * U, z = (d.oy + 120 + Math.random() * (d.s.h - 200)) * U; if (!blockedW(x, z)) return { x: x, z: z }; }
    return { x: (d.ox + d.s.w / 2) * U, z: (d.oy + d.s.h / 2) * U };
  }
  function buildTown() {
    var SETS = (G.TOWNIE_SETS || []).filter(function (s) { return has('person_' + s + '_down_w1.png') || has('person_' + s + '_left_w1.png'); });
    DIST.forEach(function (d, di) {
      var n = d.id === 'home_en' ? 4 : 6;
      for (var i = 0; i < n && SETS.length; i++) {
        var sp = freeSpot(d), w = walker('person_' + SETS[(i + di * 3) % SETS.length], sp.x / U, sp.z / U, 118, 0.957);
        w.d = d; w.wait = Math.random() * 2; w.sp = 1.0 + Math.random() * 0.35; w.t = Math.random() * 3; w.talkCd = 6 + Math.random() * 14; w.sayT = 0;
        addUmbrella(w, i + di); w.g.userData.mesh.userData.pick = { kind: 'walker', w: w }; PICK.push(w.g.userData.mesh);
        TOWN.push(w);
      }
    });
  }
  function updateTown(dt) {
    var rainK = wxNow.rain > 0.25 ? 0.7 : 1;
    for (var i = 0; i < TOWN.length; i++) {
      var w = TOWN[i];
      if (w.sayT > 0) w.sayT -= dt;
      w.talkCd -= dt;
      var pdx = FX - w.x, pdz = FZ - w.z, pd = pdx * pdx + pdz * pdz;
      if (w.talkCd <= 0 && pd < 1.7 * 1.7 && ST && !ST.P.hidden && W3.greet) { W3.greet(w); w.talkCd = 18 + Math.random() * 15; w.wait = Math.max(w.wait, 1.5); faceTo(w, pdx, pdz); }
      if (w.wait > 0) { w.wait -= dt; w.moving = false; }
      else {
        if (!w.goal) { var g = freeSpot(w.d), gdx = g.x - w.x, gdz = g.z - w.z, gl = Math.hypot(gdx, gdz); if (gl > 5) { g.x = w.x + gdx / gl * 5; g.z = w.z + gdz / gl * 5; } w.goal = g; }
        var ex = w.goal.x - w.x, ez = w.goal.z - w.z, el = Math.hypot(ex, ez);
        if (el < 0.08) { w.goal = null; w.wait = wxNow.rain > 0.25 ? 3 + Math.random() * 5 : 0.8 + Math.random() * 3; w.moving = false; }
        else if (!tryMove(w, ex / el, ez / el, Math.min(el, w.sp * rainK * dt))) { w.goal = null; w.wait = 0.3; w.moving = false; }
        else { w.moving = true; w.t += dt; setDir(w, ex, ez); }
      }
      if (!w.moving && pd < 1.4 && w.sayT <= 0) faceTo(w, pdx, pdz);   // gặp người chơi thì quay mặt lại
      drawWalker(w);
    }
  }
  W3.walkers = function () { return TOWN; };

  /* ---------- xe cộ: chạy hai chiều trên đường Phố mua sắm, giữ khoảng cách, dừng khi có người đi ngang, theo đèn ---------- */
  var CAR_T = [], LANES = [], X0 = 0, X1 = 0, CROSS0 = 0, CROSS1 = 0, LIGHT = 'green';
  var LIGHT_Y = { red: 0.209, yellow: 0.327, green: 0.445 }, LIGHT_C = { red: 0xff5a4a, yellow: 0xffc23a, green: 0x5fe08a };
  function carCard(n, h, k) {
    var w = h * k, m = new THREE.Mesh(PLANE, new THREE.MeshLambertMaterial({ map: tex(n), emissive: 0x5a5a5a, emissiveMap: tex(n), alphaTest: 0.5, side: THREE.DoubleSide, transparent: true }));
    m.castShadow = true; m.receiveShadow = true; m.customDepthMaterial = dmat(n);
    var g = new THREE.Group(); g.add(m); g.scale.set(w * U, h * U, h * U); g.rotation.x = -LEAN; bill(g); g.userData.mesh = m; SC.add(g);
    var b = blob(w * U * 0.45); b.material = BLOBM.clone(); b.scale.set(w * U * 0.95, 1, 0.32);
    return { g: g, b: b, w: w };
  }
  function buildCars() {
    CAR_T = [
      { n: 'car_red', h: 86, k: 403 / 219, v: 190 }, { n: 'car_taxi', h: 86, k: 415 / 221, v: 210 }, { n: 'car_blue', h: 86, k: 434 / 214, v: 180 },
      { n: 'car_van', h: 104, k: 409 / 256, v: 160 }, { n: 'bus', h: 118, k: 510 / 214, v: 140 },
      { n: 'ride_bike', h: 96, k: 261 / 256, v: 95 }, { n: 'ride_scooter', h: 96, k: 253 / 256, v: 165 }
    ].filter(function (t) { return has(t.n + '_side.png'); });
    var st = null; DIST.forEach(function (d) { if (d.id === 'street_en') st = d; });
    if (!st) return;
    LANES = [{ y: st.oy + 488, dir: -1 }, { y: st.oy + 622, dir: 1 }];
    X0 = st.ox + 30; X1 = st.ox + st.s.w - 30; CROSS0 = st.ox + 704; CROSS1 = st.ox + 836;
    LANES.forEach(function (L) { L.next = 1 + Math.random() * 3; spawnCar(L, X0 + 300 + Math.random() * 500); });
    TLS.forEach(function (t) {
      t.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x5fe08a, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
      t.glow.scale.set(0.42, 0.42, 1); SC.add(t.glow);
    });
  }
  function spawnCar(L, x) {
    if (!CAR_T.length) return;
    var t = CAR_T[Math.floor(Math.random() * CAR_T.length)], c = carCard(t.n + '_side.png', t.h, t.k);
    c.t = t; c.L = L; c.x = x !== undefined ? x : (L.dir > 0 ? X0 : X1); c.v = t.v * (0.85 + Math.random() * 0.3); c.max = c.v; c.ph = Math.random() * 6;
    c.g.scale.x = (L.dir > 0 ? -1 : 1) * c.w * U;   // hình xe hướng sang trái: chạy sang phải thì lật
    CARS.push(c); return c;
  }
  function updateCars(dt) {
    var i, j;
    if (!LANES.length) return;
    var cyc = T % 18; LIGHT = cyc < 9 ? 'green' : cyc < 11.5 ? 'yellow' : 'red';
    TLS.forEach(function (t) {
      var h = (0.96 - LIGHT_Y[LIGHT]) * t.s * U;
      var tv = upv(h); t.glow.position.set(t.x + tv[0] + Math.sin(YAW) * 0.03, tv[1], t.z + tv[2] + Math.cos(YAW) * 0.03);
      t.glow.material.color.setHex(LIGHT_C[LIGHT]); t.glow.material.opacity = (0.75 + 0.25 * Math.sin(T * 6)) * (t.pop ? Math.max(0, Math.min(1, t.pop.a)) : 1);
    });
    LANES.forEach(function (L) {
      L.next -= dt;
      if (L.next <= 0) {
        var last = null; for (j = 0; j < CARS.length; j++) if (CARS[j].L === L && (!last || (L.dir > 0 ? CARS[j].x < last.x : CARS[j].x > last.x))) last = CARS[j];
        if (!last || Math.abs(last.x - (L.dir > 0 ? X0 : X1)) > 360) { spawnCar(L); L.next = 3 + Math.random() * 6; } else L.next = 1;
      }
    });
    var peds = TOWN.slice(); if (P3 && P3.g.visible) peds.push(P3); if (K3 && K3.g.visible) peds.push(K3);
    for (i = CARS.length - 1; i >= 0; i--) {
      var c = CARS[i], L = c.L, front = c.x + L.dir * c.w / 2, want = c.max;
      for (j = 0; j < CARS.length; j++) { var o = CARS[j]; if (o === c || o.L !== L) continue; var gap = (o.x - c.x) * L.dir - (o.w + c.w) / 2; if (gap > 0 && gap < 220) want = Math.min(want, o.v * (gap > 90 ? 1 : 0)); }
      for (j = 0; j < peds.length; j++) { var q = peds[j], px = q.x / U, pz = q.z / U, ahead = (px - front) * L.dir; if (Math.abs(pz - L.y) < 80 && ahead > -20 && ahead < 200) want = 0; }   // người trên đường trước mũi xe: phanh
      if (TLS.length && LIGHT !== 'green') {   // đèn đỏ / vàng: dừng trước vạch qua đường (đã qua vạch thì đi tiếp)
        var line = L.dir > 0 ? CROSS0 - 18 : CROSS1 + 18, toLine = (line - front) * L.dir;
        if (toLine > (LIGHT === 'yellow' ? 30 : -4) && toLine < 190) want = Math.min(want, toLine < 12 ? 0 : c.max * Math.min(1, toLine / 190));
      }
      c.v += (want - c.v) * Math.min(1, dt * (want < c.v ? 4 : 1.2));
      c.x += L.dir * c.v * dt;
      var edge = Math.min(c.x - X0, X1 - c.x), op = Math.max(0, Math.min(1, edge / 140));
      var mm = c.g.userData.mesh.material; mm.opacity = op; mm.alphaTest = 0.5 * op;
      var bump = c.v > 5 ? Math.abs(Math.sin(T * 14 + c.ph)) * 0.008 : 0;
      c.g.position.set(c.x * U, bump, L.y * U); c.b.position.set(c.x * U, 0.012, L.y * U); c.b.material.opacity = op;
      c.g.scale.x = (L.dir * Math.cos(YAW) > 0 ? -1 : 1) * c.w * U;   // hình xe hướng sang trái: chạy sang phải màn hình thì lật
      if ((L.dir > 0 && c.x > X1) || (L.dir < 0 && c.x < X0)) { SC.remove(c.g); SC.remove(c.b); CARS.splice(i, 1); }
    }
  }

  /* ---------- chim bay ngang trời: luôn quay đầu theo hướng bay (hình nhìn trái thì dùng bản lật khi bay sang phải) ---------- */
  var BIRD_R = { 1: true, 2: true, 4: true };   // hình chim 1, 2, 4 nhìn sang phải; 3, 5 nhìn sang trái
  function birdReset(b, first) {
    b.dir = Math.random() < 0.5 ? -1 : 1;
    b.x = first ? FX + (Math.random() * 2 - 1) * 5 : FX - b.dir * 9; b.z = FZ - 2.5 + Math.random() * 4; b.y = 2.2 + Math.random() * 1.4;
    b.v = 1.4 + Math.random() * 0.9; b.ph = Math.random() * 6;
    var faceRight = !!BIRD_R[b.k], flip = faceRight !== (b.dir > 0);
    b.sp.material.map = flip ? b.tf : b.tn; b.sp.material.needsUpdate = true;
  }
  function buildBirds() {
    for (var bi = 1; bi <= 5; bi++) {
      if (!has('bird_' + bi + '.png')) continue;
      var tn = tex('bird_' + bi + '.png'), tf = texFlip('bird_' + bi + '.png');
      var bsp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tn, transparent: true, alphaTest: 0.3 }));
      var bw = bi === 4 ? 0.74 : bi === 3 ? 0.6 : 0.5; bsp.scale.set(bw, 0.43, 1); SC.add(bsp);
      var bsh = blob(0.18); bsh.material = BLOBM.clone(); bsh.material.opacity = 0.35;
      var bd = { sp: bsp, sh: bsh, k: bi, h: 0.43, tn: tn, tf: tf }; birdReset(bd, true); BIRDS.push(bd);
    }
  }
  function updateBirds(dt) {
    var want = (1 - night) * (1 - Math.min(1, wxNow.gather * 1.3 + wxNow.rain));   // tối, sắp mưa, mưa: chim bay đi trú
    BIRDS.forEach(function (b, i) {
      var show = i < Math.round(BIRDS.length * want + 0.2);
      b.x += b.dir * b.v * dt; b.z += Math.sin(T * 0.4 + b.ph) * dt * 0.2;
      if (Math.abs(b.x - FX) > 10) { birdReset(b, false); b.sp.visible = show; b.sh.visible = show; }
      var flap = Math.sin(T * 9 + b.ph);
      b.sp.scale.y = b.h * (0.82 + 0.18 * Math.abs(flap)); b.sp.position.set(b.x, b.y + flap * 0.05, b.z);
      b.sh.position.set(b.x + 0.3, 0.013, b.z + 0.2); b.sh.material.opacity = 0.3 * (1 - night) * (1 - wxNow.cloud * 0.7);
    });
  }

  /* ---------- trời: dải trời phía trên màn hình (màu theo giờ, mặt trời, trăng, sao, mây giấy, mây đen trước mưa) ---------- */
  var skyEl = null, skyGrad, skySun, skyMoon, skyStars, skyDark, skyGlare, CLOUDS = [], skyT = 0, SKYIMG = null;
  /* tranh trời theo giờ: [giờ bắt đầu, tranh, tranh thay khi chưa có (kèm chỉnh sáng tạm), màu chân trời]. Chuyển dần 40 phút trước mốc sau. */
  var SKYK = [
    [4.5, 'sky_dawn', null, '', 0x979a9a], [5.9, 'sky_sunrise', null, '', 0xb2a89f], [7.4, 'sky_morning', null, '', 0xc0c4bd],
    [10.5, 'sky_noon', null, '', 0xb6bbb3], [15.3, 'sky_afternoon', 'sky_noon', 'sepia(.22) saturate(1.1)', 0xbdb4a2],
    [17.2, 'sky_sunset', 'sky_sunrise', 'saturate(1.25) hue-rotate(-8deg)', 0xb49a8c], [18.5, 'sky_dusk', 'sky_dawn', 'brightness(.9)', 0x8a8a96],
    [19.5, 'sky_night', 'sky_dawn', 'brightness(.5) saturate(.85)', 0x4a5266], [23.5, 'sky_latenight', 'sky_dawn', 'brightness(.36) saturate(.7)', 0x323a4e]
  ];
  function skyKey(i) {
    var k = SKYK[(i + SKYK.length) % SKYK.length], n = has(k[1] + '.webp') ? k[1] : k[2];
    return { url: 'url(' + G.assetUrl(n + '.webp') + ')', f: has(k[1] + '.webp') ? '' : k[3], fog: k[4] };
  }
  var skyShown = ['', '', '', '', ''];
  function skyImages(hour, cloud, dark, out) {
    var h = hour < SKYK[0][0] ? hour + 24 : hour, i = 0;
    while (i < SKYK.length - 1 && h >= SKYK[i + 1][0]) i++;
    var nextH = i + 1 < SKYK.length ? SKYK[i + 1][0] : SKYK[0][0] + 24, fadeK = Math.max(0, Math.min(1, (h - (nextH - 0.66)) / 0.66));
    var a = skyKey(i), b = skyKey(i + 1), wx = ' grayscale(' + (cloud * 0.55).toFixed(2) + ') brightness(' + (1 - dark * 0.45).toFixed(2) + ')';
    if (skyShown[0] !== a.url) { SKYIMG[0].style.backgroundImage = a.url; skyShown[0] = a.url; }
    if (skyShown[1] !== b.url) { SKYIMG[1].style.backgroundImage = b.url; skyShown[1] = b.url; }
    var fa = (a.f + wx).trim(), fb = (b.f + wx).trim(), op = fadeK.toFixed(2);
    if (skyShown[2] !== fa) { SKYIMG[0].style.filter = fa; skyShown[2] = fa; }
    if (skyShown[3] !== fb) { SKYIMG[1].style.filter = fb; skyShown[3] = fb; }
    if (skyShown[4] !== op) { SKYIMG[1].style.opacity = op; skyShown[4] = op; }
    var w = wxNow, wn = w.rain > 0.5 ? 'sky_rain' : w.gather > 0.25 || w.rain > 0.05 ? 'sky_storm' : w.cloud > 0.45 ? 'sky_cloudy' : '';
    var wo = wn ? Math.min(1, wn === 'sky_cloudy' ? (w.cloud - 0.35) * 1.6 : Math.max(w.gather, w.rain) * 1.2) : 0, night0 = Math.max(0, Math.min(1, Math.abs(hour - 13) > 6.5 ? 1 : 0));
    if (wn && has(wn + '.webp')) {
      var wu = 'url(' + G.assetUrl(wn + '.webp') + ')'; if (skyShown[5] !== wu) { SKYIMG[2].style.backgroundImage = wu; skyShown[5] = wu; }
    } else wo = 0;
    var wf = night0 ? 'brightness(.42) saturate(.8)' : '', wos = (wo * (night0 ? 0.85 : 1)).toFixed(2);
    if (skyShown[6] !== wos) { SKYIMG[2].style.opacity = wos; skyShown[6] = wos; }
    if (skyShown[7] !== wf) { SKYIMG[2].style.filter = wf; skyShown[7] = wf; }
    cA.setHex(a.fog); cB.setHex(b.fog); out.copy(cA).lerp(cB, fadeK);
  }
  function buildSky() {
    skyEl = document.getElementById('sky3d');
    if (!skyEl) return;
    skyEl.innerHTML = '';
    skyGrad = el('div', 'sk-grad'); skyStars = el('canvas', 'sk-stars'); skySun = el('div', 'sk-sun'); skyMoon = el('div', 'sk-moon');
    if (has('sky_morning.webp')) {   // tranh trời đặt vẽ: hai lớp tranh chuyển dần theo giờ (thay dải màu, mặt trời, trăng, sao vẽ bằng code)
      SKYIMG = [el('div', 'sk-img'), el('div', 'sk-img'), el('div', 'sk-img')]; skyEl.className = 'sky3d img';
      skyEl.appendChild(SKYIMG[0]); skyEl.appendChild(SKYIMG[1]); skyEl.appendChild(SKYIMG[2]); SKYIMG[2].style.opacity = '0';   // lớp 3: trời mây / sắp bão / mưa
    }
    var cl = el('div', 'sk-clouds'); skyDark = el('div', 'sk-dark');
    if (!SKYIMG) { skyEl.appendChild(skyGrad); skyEl.appendChild(skyStars); skyEl.appendChild(skySun); skyEl.appendChild(skyMoon); }
    skyEl.appendChild(cl); skyEl.appendChild(skyDark);
    skyGlare = document.getElementById('glare3d');
    skyStars.width = 600; skyStars.height = 200;
    var x = skyStars.getContext('2d');
    for (var i = 0; i < 140; i++) { var r = Math.random(); x.fillStyle = 'rgba(255,255,240,' + (0.35 + r * 0.65).toFixed(2) + ')'; x.beginPath(); x.arc(Math.random() * 600, Math.random() * 200, r < 0.9 ? 0.8 : 1.6, 0, 6.283); x.fill(); }
    for (var di = 1; di <= 4; di++) {   // mây đen: chỉ hiện khi sắp mưa, mưa
      if (!has('cloud_dark_' + di + '.png')) continue;
      var dm = document.createElement('img'); dm.src = G.assetUrl('cloud_dark_' + di + '.png'); dm.alt = ''; var dw = 20 + Math.random() * 12; dm.style.width = dw + 'vw'; cl.appendChild(dm);
      CLOUDS.push({ el: dm, w: dw, x: di * 27 - 20, y: -4 + Math.random() * 10, v: 0.6 + Math.random() * 0.5, par: 0.9 + Math.random(), dark: true });
    }
    for (var ci = 1; ci <= 5; ci++) {
      if (!has('cloud_' + ci + '.png')) continue;
      for (var rep = 0; rep < 2; rep++) {   // hai lớp: lớp xa nhỏ, lớp gần to (trời nhiều mây thì hiện cả hai lớp)
        var im = document.createElement('img'); im.src = G.assetUrl('cloud_' + ci + '.png'); im.alt = '';
        var cw = rep ? 15 + Math.random() * 9 : 9 + Math.random() * 6; im.style.width = cw + 'vw'; cl.appendChild(im);
        CLOUDS.push({ el: im, w: cw, x: ci * 24 - 10 + rep * 47, y: rep ? 2 + Math.random() * 8 : -6 + Math.random() * 6, v: 0.35 + Math.random() * 0.4, par: 0.8 + Math.random() * 1.2, far: !rep });
      }
    }
  }
  function el(tag, cls) { var e = document.createElement(tag); e.className = cls; return e; }
  /* màu trời theo giờ: [giờ, đỉnh trời, chân trời (cũng là màu sương xa)] */
  var SKY = [
    [0, 0x0b1030, 0x1c2340], [4.6, 0x0e1638, 0x283152], [5.4, 0x3b3f75, 0xd99c90], [6.2, 0x7fa6d6, 0xffcfa6],
    [7.5, 0x93c3ef, 0xf6e4c8], [12, 0x86bff2, 0xf3ead8], [16, 0x95bde6, 0xf3e1c2], [17.4, 0xd9a37f, 0xf8c690],
    [18.1, 0xa8668e, 0xf29467], [18.8, 0x46407e, 0x8a6a8e], [19.6, 0x1a2050, 0x343660], [24, 0x0b1030, 0x1c2340]
  ];
  /* ánh sáng mặt đất: [giờ, trời (bán cầu), đất, cường độ bán cầu, màu nắng, cường độ nắng] */
  var PAL = [
    [0, 0x4a5a99, 0x223022, 0.32, 0x8899cc, 0.18], [5, 0x6a74a8, 0x2c3a2a, 0.36, 0x9aa6d6, 0.2], [6, 0xffd9b8, 0x9aa47a, 0.42, 0xffb070, 0.7],
    [8, 0xfff3e0, 0xc9d6a8, 0.5, 0xffe7c4, 0.95], [12, 0xffffff, 0xd2dcb4, 0.52, 0xfff6e8, 1.0], [16, 0xfff0d8, 0xc9d0a0, 0.5, 0xffe0b0, 0.95],
    [17.6, 0xffcfa0, 0xb0a070, 0.46, 0xffa860, 0.85], [18.4, 0xf0a0a0, 0x8c7a66, 0.4, 0xff8a50, 0.6], [19.3, 0x7a6aa0, 0x34343a, 0.36, 0xb08ab0, 0.2],
    [24, 0x4a5a99, 0x223022, 0.32, 0x8899cc, 0.18]
  ];
  var cA = new THREE.Color(), cB = new THREE.Color(), cZ = new THREE.Color(), cH = new THREE.Color(), GRAY = new THREE.Color(0x8e96a8), DARK = new THREE.Color(0x4b5266);
  function mixHex(a, b, k, out) { cA.setHex(a); cB.setHex(b); return out.copy(cA).lerp(cB, k); }
  function seg(tab, h) { var i = 0; while (i < tab.length - 2 && h >= tab[i + 1][0]) i++; return { a: tab[i], b: tab[i + 1], k: (h - tab[i][0]) / (tab[i + 1][0] - tab[i][0]) }; }
  function css(c) { return '#' + c.getHexString(); }
  function applyTime(hour, dt) {
    var w = wxNow, cloud = w.cloud, dark = Math.min(1, w.gather * 0.6 + w.rain * 0.55);   // mây đen: sắp mưa và mưa
    var s = seg(SKY, hour); mixHex(s.a[1], s.b[1], s.k, cZ); mixHex(s.a[2], s.b[2], s.k, cH);
    var ang = (hour - 6) / 12 * Math.PI, up = Math.sin(ang);
    night = up < -0.02 ? 1 : up < 0.18 ? 1 - (up + 0.02) / 0.2 : 0;
    var day = 1 - night;
    cZ.lerp(GRAY, cloud * 0.55 * day).lerp(DARK, dark * 0.6 * day); cH.lerp(GRAY, cloud * 0.4 * day).lerp(DARK, dark * 0.45 * day);
    if (SKYIMG) { skyImages(hour, cloud, dark, cZ); cH.lerp(cZ, 0.55); }   // sương xa hoà với chân trời trong tranh
    SC.fog.color.copy(cH); SC.background.copy(cH);
    var p = seg(PAL, hour);
    mixHex(p.a[1], p.b[1], p.k, HEMI.color); mixHex(p.a[2], p.b[2], p.k, HEMI.groundColor); HEMI.intensity = (p.a[3] + (p.b[3] - p.a[3]) * p.k) * (1 - 0.18 * cloud - 0.12 * dark);
    mixHex(p.a[4], p.b[4], p.k, SUN.color); SUN.color.lerp(GRAY, cloud * 0.5); SUN.intensity = (p.a[5] + (p.b[5] - p.a[5]) * p.k) * (1 - 0.55 * cloud - 0.3 * dark);
    // đường đi của mặt trời: đông (phải) → hơi về phía sau thành phố lúc trưa → tây (trái); bóng ngả về phía người xem
    var dir = new THREE.Vector3(Math.cos(ang), Math.max(0.1, up) * 1.25 + 0.08, -0.45 - 0.15 * up);
    if (up < 0) dir.set(-0.35, 1.1, -0.4);   // đêm: ánh trăng nhạt
    var cy0 = Math.cos(YAW), sy0 = Math.sin(YAW); dir.set(dir.x * cy0 + dir.z * sy0, dir.y, -dir.x * sy0 + dir.z * cy0);   // xoay theo camera
    SUN.position.set(FX, 0, FZ).add(dir.normalize().multiplyScalar(30)); SUN.target.position.set(FX, 0, FZ);
    var lampOn = Math.max(night, dark * 0.6 * day);
    for (var l = 0; l < LAMPS.length; l++) { var lp = LAMPS[l].userData.pop; LAMPS[l].material.opacity = lampOn * (l % 2 ? 0.55 : 0.95) * (lp ? Math.max(0, Math.min(1, lp.a)) : 1); }
    cloudsM.material.opacity = 0.12 + cloud * 0.22;
    cloudTex.offset.x += dt * (0.0035 + w.gather * 0.01 + w.rain * 0.006); cloudTex.offset.y += dt * 0.0012;
    skyT -= dt; if (skyT > 0 || !skyEl) return; skyT = 0.2;   // dải trời: cập nhật 5 lần/giây là đủ mượt
    if (!SKYIMG) skyGrad.style.background = 'linear-gradient(' + css(cZ) + ', ' + css(cH) + ')';
    var sx = 50 + Math.cos(ang) * 44, sy = 88 - Math.max(-0.2, up) * 92, hz = Math.max(0, 1 - up * 3);   // mặt trời gần chân trời thì to, cam
    skySun.style.left = sx.toFixed(1) + '%'; skySun.style.top = sy.toFixed(1) + '%';
    skySun.style.opacity = up > -0.08 ? ((1 - cloud * 0.85) * Math.min(1, (up + 0.08) * 6)).toFixed(2) : '0';
    skySun.style.background = 'radial-gradient(circle, ' + (hz > 0.5 ? '#ffe2b0' : '#fffbe6') + ' 0 38%, ' + (hz > 0.5 ? 'rgba(255,150,80,.55)' : 'rgba(255,236,170,.5)') + ' 42%, rgba(255,200,120,0) 70%)';
    var ma = ang + Math.PI, mu = Math.sin(ma);
    skyMoon.style.left = (50 + Math.cos(ma) * 40).toFixed(1) + '%'; skyMoon.style.top = (88 - Math.max(-0.2, mu) * 90).toFixed(1) + '%';
    skyMoon.style.opacity = (night * (1 - cloud * 0.8) * (mu > 0 ? 1 : 0)).toFixed(2);
    skyStars.style.opacity = (night * (1 - cloud) * 0.95).toFixed(2);
    skyDark.style.opacity = (dark * 0.85).toFixed(2);
    var cb = (1 - night * 0.55) * (1 - dark * 0.5), cg = Math.min(1, cloud * 0.6 + dark * 0.4);
    var flt = 'brightness(' + cb.toFixed(2) + ') grayscale(' + cg.toFixed(2) + ')' + (hour > 17.2 && hour < 19 ? ' sepia(.35) saturate(1.4)' : '');
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i];
      if (c.dark) { c.el.style.opacity = Math.min(1, dark * 1.3).toFixed(2); c.el.style.filter = night > 0.5 ? 'brightness(.5)' : 'none'; continue; }
      c.el.style.filter = flt; c.el.style.opacity = c.far ? (SKYIMG ? 0 : 0.55 + cloud * 0.35).toFixed(2) : (cloud > 0.4 ? Math.min(0.95, (cloud - 0.4) * 2.2) : 0).toFixed(2);
    }
    if (skyGlare) {
      var gi = up > 0 ? (0.16 + 0.32 * (1 - up)) * (1 - cloud) : 0;
      skyGlare.style.background = gi > 0.01 ? 'radial-gradient(circle at ' + sx.toFixed(0) + '% -8%, rgba(255,' + (hz > 0.5 ? 180 : 214) + ',150,' + gi.toFixed(2) + '), rgba(255,214,150,0) 55%)' : 'none';
    }
  }
  function updateClouds(dt) {
    var wind = 1 + wxNow.gather * 2.5 + wxNow.rain * 1.5;   // mây đen kéo tới nhanh hơn
    for (var i = 0; i < CLOUDS.length; i++) {
      var c = CLOUDS[i]; c.x += c.v * dt * wind;
      var x = ((c.x - FX * c.par + YAW * 60 * (c.par + 0.3)) % (100 + c.w) + (100 + c.w)) % (100 + c.w) - c.w;
      c.el.style.transform = 'translate(' + (x * Wc / 100).toFixed(1) + 'px,' + (c.y * Hc / 100).toFixed(1) + 'px)';
    }
  }

  /* ---------- bật lên khi tới gần: lò xo có nảy, vật gần dựng trước, tiếng giấy lật khe khẽ ---------- */
  var lastFlip = 0;
  function flip(vol) {
    var now = performance.now(), AC = G.audioReady && G.audioReady();
    if (!AC || now - lastFlip < 70 || !soundOn()) return; lastFlip = now;
    if (G.sfxFile && G.sfxFile('sfx_paper_pop_' + (1 + Math.floor(Math.random() * 3)), Math.min(0.45, vol * 7), 0.9 + Math.random() * 0.25)) return;   // tiếng giấy thật
    try {
      var len = 0.09, buf = AC.createBuffer(1, Math.floor(AC.sampleRate * len), AC.sampleRate), ch = buf.getChannelData(0);
      for (var i = 0; i < ch.length; i++) { var k = i / ch.length; ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - k, 3) * (k < 0.08 ? k / 0.08 : 1); }
      var src = AC.createBufferSource(), f = AC.createBiquadFilter(), gn = AC.createGain();
      src.buffer = buf; f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1400; f.Q.value = 0.9; gn.gain.value = vol;
      src.connect(f); f.connect(gn); gn.connect(AC.destination); src.start();
    } catch (e) { /* không có âm thanh thì thôi */ }
  }
  function updatePops(dt) {
    // bán kính dựng theo khung nhìn: màn càng rộng (máy tính, iPad ngang) hoặc lùi camera càng xa thì vùng dựng càng rộng,
    // để vật nằm trong màn hình luôn đứng lên; vật to (nhà) tính từ mép chứ không từ tâm
    var ax = Math.max(1, (CAM.aspect || 1.45) / 1.45) * Math.max(1, zoomK), az = Math.max(1, zoomK);
    for (var i = 0; i < POPS.length; i++) {
      var p = POPS[i], rq = rel(p.x - FX, p.z - FZ), dx = rq[0] / ax, dz = rq[1] * (rq[1] < 0 ? 0.7 : 1) / az, d = Math.max(0, Math.sqrt(dx * dx + dz * dz) - p.r);
      if (snap) { p.up = d < POP_UP; p.a = p.up ? 1 : 0; p.v = 0; p.wait = 0; }
      else if (!p.up && d < POP_UP) { p.up = true; p.wait = p.jit + d / POP_UP * 0.22; }
      else if (p.up && d > POP_DOWN) { p.up = false; p.wait = p.jit * 0.5; }
      if (p.wait > 0) { p.wait -= dt; if (p.wait <= 0 && p.up && d < POP_UP + 0.5) flip(0.05 * (1 - d / POP_UP) + 0.012); else if (p.wait > 0) continue; }
      var tgt = p.up ? 1 : 0, k = p.up ? 110 : 60, damp = p.up ? 10 : 14;
      if (Math.abs(tgt - p.a) < 0.001 && Math.abs(p.v) < 0.001) continue;
      p.v += ((tgt - p.a) * k - p.v * damp) * dt; p.a += p.v * dt;
      if (!p.up && p.a < 0) { p.a = 0; p.v = 0; }
      p.g.rotation.x = -Math.PI / 2 + p.a * (Math.PI / 2 - LEAN);
      p.g.userData.mesh.castShadow = p.a > 0.25;
    }
  }

  /* ---------- âm thanh riêng của bản 3D: tiếng máy xe đưa đón, vịt kêu khi lại gần bờ sông ----------
     (tiếng nền chung: chim, phố, dế, gió, mưa, sông do engine lo, G.ambSet trong audio.js) */
  function soundOn() { return !(G.S && G.S.caiDat && G.S.caiDat.amThanh === false); }
  function quiet() { var pn = document.getElementById('panel'); return document.hidden || !W3.active || (pn && /\bopen\b/.test(pn.className)); }
  var AMB = { duckT: 4 };
  function ambient(dt) {
    if (!G.ambSet) return;
    var on = soundOn() && !quiet(), sv = 0;
    if (SH && on) {
      var dd = Math.sqrt((SH.x * U - FX) * (SH.x * U - FX) + (SH.y * U - FZ) * (SH.y * U - FZ));
      sv = W3.riding() ? 0.3 + Math.min(1, SH.v / 300) * 0.25 : (0.15 + Math.min(1, SH.v / 250) * 0.4) * Math.max(0, 1 - dd / 12);
    }
    G.ambSet('shuttle', sv);
    if (on && RV && DUCKS.length && Math.abs(FX - (RV.d.ox + 768) * U) < 9) {
      AMB.duckT -= dt;
      if (AMB.duckT <= 0) {
        AMB.duckT = 6 + Math.random() * 12;
        var best = 1e9; for (var i = 0; i < DUCKS.length; i++) { var p = DUCKS[i].sp.position; best = Math.min(best, Math.sqrt((p.x - FX) * (p.x - FX) + (p.z - FZ) * (p.z - FZ))); }
        if (best < 6 && G.sfxFile) G.sfxFile('sfx_duck', 0.35 * (1 - best / 7), 0.92 + Math.random() * 0.16);
      }
    }
  }

  /* ---------- nhân vật chính, Kai ---------- */
  var avCanvas = null, avTex = null, avMesh = null;
  function ensurePlayer(who) {
    var base = who === 'kai' ? 'kai' : who === 'custom' ? 'custom' : 'player_' + who;
    if (P3 && P3.base === base) return;
    if (P3) { SC.remove(P3.g); SC.remove(P3.blob); if (P3.um) SC.remove(P3.um); }
    if (base === 'custom') {   // nhân vật tự tạo: ghép lớp hình lên một tấm canvas, cập nhật mỗi khung
      avCanvas = document.createElement('canvas'); avCanvas.width = avCanvas.height = 256;
      avTex = new THREE.CanvasTexture(avCanvas); avTex.encoding = THREE.sRGBEncoding;
      var m = new THREE.Mesh(PLANE, new THREE.MeshLambertMaterial({ map: avTex, emissive: 0x5a5a5a, emissiveMap: avTex, alphaTest: 0.5, side: THREE.DoubleSide }));
      m.castShadow = true; m.position.y = -0.02; var g = new THREE.Group(); g.add(m); g.scale.set(1.2, 1.2, 1.2); g.rotation.x = -LEAN; bill(g); g.userData.mesh = m; SC.add(g);
      P3 = { base: 'custom', g: g, blob: blob(0.26), S: 120, x: 0, z: 0, dir: 'down', t: 0 }; avMesh = m;
    } else P3 = walker(base, 0, 0, who === 'kai' ? 104 : 120, who === 'kai' ? 490 / 512 : 0.957);
    addUmbrella(P3, who === 'kai' ? 3 : 0);
    if (K3) { SC.remove(K3.g); SC.remove(K3.blob); if (K3.um) SC.remove(K3.um); K3 = null; }
    if (who !== 'kai') {
      if (G.hasWalk && G.hasWalk('kai', 'down')) K3 = walker('kai', 0, 0, 86, 490 / 512);
      else { K3 = { base: null, x: 0, z: 0, dir: 'down', t: 0, S: 82 }; K3.g = card('kai_follow.png', 0, 0, 82, 497 / 512, { own: true, pop: false }); K3.blob = blob(0.18); }
    }
  }
  function drawPlayer(st) {
    var p = st.P, d = G.WORLD3D[st.id];
    var px = (d.ox + p.x) * U, pz = (d.oy + p.y) * U;
    headTo(P3, px, pz, p.dir, p.moving);
    P3.x = px; P3.z = pz; P3.moving = p.moving; P3.t = p.t;
    P3.g.visible = P3.blob.visible = !p.hidden;
    if (P3.base === 'custom') {
      var x = avCanvas.getContext('2d'); x.clearRect(0, 0, 256, 256);
      keepDir(P3);
      if (G.S.avatar && G.drawAvatar) G.drawAvatar(x, G.S.avatar, 128, 250, 240, P3.dir, p.t * 14, p.moving);
      avTex.needsUpdate = true;
      P3.g.position.set(P3.x, 0, P3.z); P3.blob.position.set(P3.x, 0.012, P3.z); if (P3.um) placeUmbrella(P3);
    } else drawWalker(P3);
    if (!K3) return;
    var k = st.K, kx = (d.ox + k.x) * U, kz = (d.oy + k.y) * U;
    headTo(K3, kx, kz, k.dir || 'down', !!k.moving);
    K3.x = kx; K3.z = kz; K3.moving = !!k.moving; K3.t = k.t || 0;
    if (!K3.base) keepDir(K3);
    K3.g.visible = K3.blob.visible = !p.hidden;
    if (K3.base) drawWalker(K3);
    else {
      var kn = K3.dir === 'up' ? 'kai_up.png' : (K3.dir === 'left' || K3.dir === 'right') ? 'kai_left.png' : 'kai_follow.png';
      setMap(K3.g.userData.mesh, kn);
      K3.g.scale.x = (kn === 'kai_left.png' ? (K3.dir === 'right' ? -1 : 1) : 1) * 82 * U;
      K3.g.position.set(K3.x, K3.moving ? Math.abs(Math.sin(K3.t * 7)) * 0.06 : 0, K3.z); K3.blob.position.set(K3.x, 0.012, K3.z);
    }
  }
  /* hướng của người chơi / Kai: đang đi thì theo quãng vừa đi trong thế giới; đứng yên mà engine đổi hướng (vd. quay vào cửa) thì theo hướng đó */
  function headTo(w, nx, nz, edir, moving) {
    var dx = nx - (w.lx === undefined ? nx : w.lx), dz = nz - (w.lz === undefined ? nz : w.lz);
    if (moving && dx * dx + dz * dz > 1e-8) setDir(w, dx, dz);
    else if (w.hx === undefined || (!moving && edir !== w.edir)) { var v = DIRV[edir] || DIRV.down; setDir(w, v[0], v[1]); }
    w.lx = nx; w.lz = nz; w.edir = edir;
  }
  function talked(life) { var d = G.today && G.today(); return !!(d && d.sang && d.sang[life]); }
  var talkT = 0;
  function updateNpcs(dt, st) {
    talkT -= dt; var chk = talkT <= 0; if (chk) talkT = 0.5;
    for (var i = 0; i < NPCW.length; i++) {
      var e = NPCW[i], o = e.o, d = e.d, here = d.id === st.id;
      if (chk) e.need = o.life && !talked(o.life);
      if (e.w) {
        var w = e.w, ox = here ? o.x : (o.hx !== undefined ? o.hx : o.x);
        w.x = (d.ox + ox) * U; w.z = (d.oy + e.py) * U;
        var dx = FX - w.x, dz = FZ - w.z, close = dx * dx + dz * dz < 4;
        w.moving = here && !!o.pmov; w.t = o.pt || 0;
        if (w.moving) { var pv = DIRV[o.pdir] || DIRV.down; setDir(w, pv[0], pv[1]); } else if (close) faceTo(w, dx, dz); else { w.dir = 'down'; w.hx = undefined; }
        drawWalker(w);
        e.plate.position.set(w.x, 0.16, w.z + 0.47);
        var pd2 = Math.sqrt(dx * dx + dz * dz); e.plate.material.opacity = pd2 < 6 ? 1 : Math.max(0, 1 - (pd2 - 6) / 3); e.plate.visible = e.plate.material.opacity > 0.02;
        e.bub.visible = !!e.need && pd2 < 6.5;
        if (e.bub.visible) { var hv = upv(1.42 + Math.sin(T * 3 + i) * 0.04); e.bub.position.set(w.x + hv[0], hv[1], w.z + hv[2]); }
      } else {
        var a = e.pop ? e.pop.a : 1, ex0 = (e.bx !== undefined ? e.bx : (d.ox + o.x) * U) - FX, ez0 = (e.bz !== undefined ? e.bz : (d.oy + (e.py || o.y)) * U) - FZ;
        e.bub.visible = !!e.need && a > 0.7 && ex0 * ex0 + ez0 * ez0 < 42;
        if (e.bub.visible) {
          var bx = e.bx !== undefined ? e.bx : (d.ox + o.x) * U, bz = e.bz !== undefined ? e.bz : (d.oy + e.py) * U, bh = (e.bh || (o.stall ? 2.1 : 1.42)) + Math.sin(T * 3 + i) * 0.04;
          var bv = upv(bh); e.bub.position.set(bx + bv[0], bv[1], bz + bv[2]);
        }
      }
    }
  }

  /* ---------- sông: cá bơi dưới nước (lặn qua gầm cầu, thỉnh thoảng nhảy lên), vịt bơi, mặt nước lấp lánh ---------- */
  var FISH = [], DUCKS = [], JUMP = null, SPARK = [], RV = null, jumpT = 4;
  function chanAt(y) {   // lòng sông tại y (px trong tờ bản đồ sông)
    var c = RV.ch, i = Math.max(0, Math.min(c.length - 2, Math.floor((y - c[0][0]) / (c[1][0] - c[0][0]))));
    var a = c[i], b = c[i + 1], k = Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0])));
    return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  }
  function underBridge(y) { for (var i = 0; i < RV.bridges.length; i++) if (y > RV.bridges[i][0] - 10 && y < RV.bridges[i][1] + 10) return true; return false; }
  function buildRiver() {
    if (!G.RIVER || !G.WORLD3D[G.RIVER.id]) return;
    RV = G.RIVER; RV.d = G.WORLD3D[RV.id];
    for (var i = 0; i < 8; i++) {
      var n = 'fish_' + (i % 4 + 1) + '.png'; if (!has(n)) continue;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex(n), transparent: true, alphaTest: 0.3, depthWrite: false, opacity: 0.92 }));
      m.rotation.x = -Math.PI / 2; m.renderOrder = 2; SC.add(m);
      var sz = 46 + Math.random() * 26;
      FISH.push({ m: m, y: 40 + Math.random() * 940, v: (Math.random() < 0.5 ? -1 : 1) * (30 + Math.random() * 40), u: Math.random(), ph: Math.random() * 6, sz: sz, rest: 0 });
    }
    for (var k = 1; k <= 2; k++) {
      if (!has('duck_' + k + '.png')) continue;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('duck_' + k + '.png'), transparent: true, alphaTest: 0.3 }));
      sp.scale.set(0.62, 0.43, 1); SC.add(sp);
      DUCKS.push({ sp: sp, tn: tex('duck_' + k + '.png'), tf: texFlip('duck_' + k + '.png'), y: k === 1 ? 260 : 640, v: (k === 1 ? 1 : -1) * 18, u: 0.3 + k * 0.2, ph: k * 2 });
    }
    if (has('fish_jump.png')) { JUMP = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex('fish_jump.png'), transparent: true, alphaTest: 0.3 })); JUMP.visible = false; SC.add(JUMP); }
    if (has('water_sparkle.png')) {   // hai lớp lấp lánh trên lòng sông, chớp tắt xen kẽ
      var st = tex('water_sparkle.png'); st.wrapS = st.wrapT = THREE.RepeatWrapping;
      for (var L = 0; L < 2; L++) {
        var cv2 = document.createElement('canvas'); cv2.width = 256; cv2.height = 1024; var x2 = cv2.getContext('2d');
        for (var y = 0; y < 1024; y += 8) {
          if (underBridge(y)) continue;
          var cc = chanAt(y), x0 = cc[0] - 640, x1 = cc[1] - 640;
          x2.fillStyle = '#fff'; x2.fillRect(Math.max(0, x0 + 14), y, Math.max(0, x1 - x0 - 28), 8);
        }
        var cb = document.createElement('canvas'); cb.width = 256; cb.height = 1024; var xb = cb.getContext('2d');   // làm mềm mép
        xb.filter = 'blur(10px)'; xb.drawImage(cv2, 0, 0); if (xb.filter === 'blur(10px)') cv2 = cb;
        var am = new THREE.CanvasTexture(cv2);
        var mm = new THREE.Mesh(new THREE.PlaneGeometry(256 * U, 1024 * U), new THREE.MeshBasicMaterial({ map: st, alphaMap: am, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
        mm.rotation.x = -Math.PI / 2; mm.position.set((RV.d.ox + 768) * U, 0.018 + L * 0.001, (RV.d.oy + 512) * U); mm.renderOrder = 1; SC.add(mm);
        SPARK.push(mm);
      }
    }
  }
  function updateRiver(dt) {
    if (!RV) return;
    var near = Math.abs(FX - (RV.d.ox + 768) * U) < 14, i;
    for (i = 0; i < FISH.length; i++) {
      var f = FISH[i];
      f.m.visible = near; if (!near) continue;
      f.y += f.v * dt;
      if (f.y < 20 || f.y > 1000) { f.v = -f.v; f.y = Math.max(20, Math.min(1000, f.y)); }
      if (Math.random() < dt * 0.08) f.v = -f.v;   // thỉnh thoảng quay đầu
      var cc = chanAt(f.y), x = cc[0] + 16 + (cc[1] - cc[0] - 32) * (f.u + Math.sin(T * 0.5 + f.ph) * 0.12), dive = underBridge(f.y);
      f.m.material.opacity += ((dive ? 0 : 0.92) - f.m.material.opacity) * Math.min(1, dt * 5);
      var wig = Math.sin(T * 6 + f.ph) * 0.12, dir = f.v > 0 ? Math.PI / 2 : -Math.PI / 2;   // hình cá nhìn sang phải: xoay theo hướng bơi (dọc sông)
      f.m.rotation.z = -dir + wig; f.m.scale.set(f.sz * U, f.sz * 0.5 * U, 1);
      f.m.position.set((RV.d.ox + x) * U, 0.017, (RV.d.oy + f.y) * U);
    }
    for (i = 0; i < DUCKS.length; i++) {
      var k = DUCKS[i]; k.sp.visible = near; if (!near) continue;
      k.y += k.v * dt; if (k.y < 60 || k.y > 980 || underBridge(k.y + (k.v > 0 ? 40 : -40))) { k.v = -k.v; k.y += k.v * dt * 2; }
      var ck = chanAt(k.y), xk = ck[0] + (ck[1] - ck[0]) * k.u;
      var m2 = k.v > 0 ? k.tf : k.tn; if (k.sp.material.map !== m2) { k.sp.material.map = m2; k.sp.material.needsUpdate = true; }   // hình vịt nhìn trái
      k.sp.position.set((RV.d.ox + xk) * U, 0.2 + Math.sin(T * 2 + k.ph) * 0.015, (RV.d.oy + k.y) * U);
    }
    if (JUMP) {   // cá nhảy khỏi mặt nước gần người chơi
      jumpT -= dt;
      if (near && jumpT <= 0 && !JUMP.visible) {
        jumpT = 5 + Math.random() * 7;
        var jy = Math.max(30, Math.min(990, FZ / U - RV.d.oy + (Math.random() * 2 - 1) * 260));
        if (!underBridge(jy)) { var cj = chanAt(jy); JUMP.visible = true; JUMP.userData = { t: 0, x: (RV.d.ox + (cj[0] + cj[1]) / 2) * U, z: (RV.d.oy + jy) * U }; if (G.sfxFile) G.sfxFile('sfx_fish_splash'); }
      }
      if (JUMP.visible) {
        var J = JUMP.userData; J.t += dt; var q = J.t / 1.1, hgt = Math.sin(Math.min(1, q) * Math.PI) * 0.5;
        JUMP.scale.set(0.55, 0.6, 1); JUMP.position.set(J.x, 0.22 + hgt, J.z); JUMP.material.opacity = q < 0.85 ? 1 : (1 - q) / 0.15;
        if (q >= 1) JUMP.visible = false;
      }
    }
    for (i = 0; i < SPARK.length; i++) { var o = SPARK[i]; o.visible = near; o.material.opacity = 0.75 * (0.5 + 0.5 * Math.sin(T * 1.7 + i * Math.PI)) * (1 - night * 0.6); }
    for (i = 0; i < FLATS.length; i++) FLATS[i].m.rotation.y = Math.sin(T * 0.6 + FLATS[i].ph) * 0.06;   // lá sen dập dềnh
  }

  /* ---------- xe đưa đón học sinh: chạy theo đường (điểm px toàn thành phố), camera đi theo xe ---------- */
  var SH = null;
  W3.shuttle = function (pts, stopAt, onBoard, onDone) {
    if (!W3.ready || SH) return false;
    var n = has('shuttle_side.png') ? 'shuttle' : 'car_van';   // xe đưa đón riêng (khi anh Han đặt hình) hoặc tạm dùng xe van
    var c = carCard(n + '_side.png', 112, 409 / 256);
    ['_side', '_front', '_back'].forEach(function (s) { if (has(n + s + '.png')) tex(n + s + '.png'); });
    SH = { n: n, c: c, pts: pts, i: 0, x: pts[0].x, y: pts[0].y, v: 0, stopAt: stopAt, phase: 'come', t: 0, onBoard: onBoard, onDone: onDone, face: 'side', fl: false };
    return true;
  };
  W3.shuttlePos = function () { return SH ? { x: SH.x, y: SH.y, phase: SH.phase } : null; };
  W3.riding = function () { return !!SH && SH.phase !== 'come'; };
  function updateShuttle(dt) {
    if (!SH) return;
    var s = SH;
    if (s.phase === 'board' || s.phase === 'drop') {
      s.t += dt; s.v = 0;
      if (s.phase === 'board' && s.t > 1.1) { s.phase = 'go'; s.t = 0; if (s.onBoard) s.onBoard(); if (!(G.sfxFile && G.sfxFile('sfx_shuttle_door', 0.4))) G.sfx && G.sfx('door'); }
      if (s.phase === 'drop' && s.t > 0.8) { var done = s.onDone; SC.remove(s.c.g); SC.remove(s.c.b); SH = null; if (done) done(); return; }
    } else {
      var last = s.phase === 'come' ? s.stopAt : s.pts.length - 1;
      var tgt = s.pts[Math.min(s.i + 1, last)], dx = tgt.x - s.x, dy = tgt.y - s.y, dist = Math.sqrt(dx * dx + dy * dy);
      var remain = dist; for (var k = s.i + 1; k < last; k++) remain += Math.hypot(s.pts[k + 1].x - s.pts[k].x, s.pts[k + 1].y - s.pts[k].y);
      var want = Math.min(330, 60 + remain * 1.6);   // chậm dần khi tới trạm
      s.v += (want - s.v) * Math.min(1, dt * 2.2);
      var st = s.v * dt;
      if (dist <= st || dist < 1) {
        s.x = tgt.x; s.y = tgt.y; s.i = Math.min(s.i + 1, last);
        if (s.i >= last) { s.phase = s.phase === 'come' ? 'board' : 'drop'; s.t = 0; if (s.phase === 'board' && G.sfxFile) { G.sfxFile('sfx_horn_soft', 0.3); } }
      } else {
        s.x += dx / dist * st; s.y += dy / dist * st;
        s.hx = dx; s.hz = dy;
      }
    }
    if (s.hx !== undefined) {   // hình ngang / trước / sau theo hướng chạy so với camera
      var rq = rel(s.hx, s.hz), ax = Math.abs(rq[0]), ay = Math.abs(rq[1]);
      s.face = ax > ay * 0.8 ? 'side' : rq[1] > 0 ? 'front' : 'back'; s.fl = rq[0] > 0;
    }
    var nm = s.n + '_' + s.face + '.png'; if (!has(nm)) nm = s.n + '_side.png';
    var m = s.c.g.userData.mesh; setMap(m, nm);
    var im = m.material.map.image, h = 112, wpx = im && im.width ? h * im.width / im.height : h * 1.6;
    s.c.g.scale.set((s.face === 'side' && s.fl ? -1 : 1) * wpx * U, h * U, h * U);
    var bump = s.v > 5 ? Math.abs(Math.sin(T * 13)) * 0.01 : 0;
    s.c.g.position.set(s.x * U, bump, s.y * U); s.c.b.position.set(s.x * U, 0.012, s.y * U); s.c.b.scale.set(wpx * U * 0.95, 1, 0.34);
  }

  /* ---------- camera, vẽ ---------- */
  function resize() {
    if (!cv3) return;
    var w = cv3.clientWidth || innerWidth, h = cv3.clientHeight || innerHeight;
    if (w === Wc && h === Hc) return;
    Wc = w; Hc = h; R.setSize(w, h, false); CAM.aspect = w / h; CAM.updateProjectionMatrix();
  }
  function camera(dt) {
    if (camBack) {   // bấm 🧭: xoay về hướng cũ
      YAW *= 1 - Math.min(1, dt * 6); PITCH *= 1 - Math.min(1, dt * 6);
      if (Math.abs(YAW) < 0.003 && Math.abs(PITCH) < 0.003) { YAW = 0; PITCH = 0; camBack = 0; }
      camBtn();
    }
    applyYaw();
    var cy = Math.cos(YAW), sy = Math.sin(YAW);
    var hd0 = 8.4 * zoomK + 0.6, vh0 = 5.2 * zoomK - 0.7, Rr = Math.sqrt(hd0 * hd0 + vh0 * vh0), el = Math.atan2(vh0, hd0) + PITCH;
    var lx = FX - sy * 0.6, lz = FZ - cy * 0.6, k = snap ? 1 : 1 - Math.exp(-dt * 6);
    // nhìn thẳng về phía bắc (góc cũ): không để lộ khoảng giấy trắng ngoài mép bản đồ; xoay đi thì bớt dần việc giữ mép
    var wgt = Math.max(0, 1 - Math.abs(YAW) / 0.5);
    if (wgt > 0) {
      var hw = 2.6 * zoomK * CAM.aspect, X0 = 1e9, X1 = -1e9, zMax = 0, cx0 = lx, cz0 = lz;
      for (var i = 0; i < DIST.length; i++) {
        var dd = DIST[i]; X0 = Math.min(X0, dd.ox * U); X1 = Math.max(X1, (dd.ox + dd.s.w) * U);
        if (FX >= dd.ox * U - 1 && FX < (dd.ox + dd.s.w) * U + 1) zMax = Math.max(zMax, (dd.oy + dd.s.h) * U);
      }
      if (X1 - X0 > hw * 2) cx0 = Math.max(X0 + hw, Math.min(X1 - hw, cx0));
      if (zMax) cz0 = Math.min(cz0, zMax - 0.6 - 3.48 * zoomK);
      lx += (cx0 - lx) * wgt; lz += (cz0 - lz) * wgt;
    }
    camLook.x += (lx - camLook.x) * k; camLook.y = 0.7; camLook.z += (lz - camLook.z) * k;
    var hd = Rr * Math.cos(el), vh = Rr * Math.sin(el);
    camPos.set(camLook.x + sy * hd, camLook.y + vh, camLook.z + cy * hd);
    CAM.position.copy(camPos); CAM.lookAt(camLook);
  }
  W3.show = function (on) {
    W3.active = !!on;
    var c = document.getElementById('world3d'), s = document.getElementById('sky3d'), gl = document.getElementById('glare3d'), tl = document.getElementById('tilt3d');
    if (c) c.style.display = on ? 'block' : 'none';
    if (s) s.style.display = on ? 'block' : 'none';
    if (gl) gl.style.display = on ? 'block' : 'none';
    if (tl) tl.style.display = on ? 'block' : 'none';
    var pl = document.getElementById('play'); if (pl) pl.className = on ? 'w3d' : '';
    if (on) { snap = true; resize(); }
    else if (G.ambSet) G.ambSet('shuttle', 0);
    camBtn();
  };
  W3.snap = function () { snap = true; };
  W3.zoom = function (k) { if (k !== undefined) zoomK = Math.max(0.6, Math.min(1.7, k)); return zoomK; };
  /* engine gọi mỗi khung: st = { id, P, K, who, hour, wx, near, goal, target, dt } */
  W3.frame = function (st) {
    if (!W3.ready) return;
    var dt = st.dt; ST = st; T += dt; wxNow = st.wx || wxNow;
    resize();
    ensurePlayer(st.who);
    var d = G.WORLD3D[st.id];
    if (SH && SH.phase !== 'come') { FX = SH.x * U; FZ = SH.y * U; } else { FX = (d.ox + st.P.x) * U; FZ = (d.oy + st.P.y) * U; }
    drawPlayer(st);
    updateNpcs(dt, st); updateTown(dt); updateCars(dt); updateRiver(dt); updateShuttle(dt); updateBirds(dt); updateClouds(dt); updatePops(dt);
    var wind = 1 + wxNow.gather * 2 + wxNow.rain * 1.4;   // gió mạnh trước cơn mưa: cây lắc nhiều hơn
    for (var i = 0; i < SWAY.length; i++) { var sw = SWAY[i]; sw.g.rotation.z = (Math.sin(T * 1.3 * sw.k * Math.min(1.8, wind) + sw.ph) * 0.025 + Math.sin(T * 0.37 + sw.ph) * 0.012) * wind; }
    for (i = 0; i < STAND.length; i++) { var sd = STAND[i]; sd.g.scale.y = 1.24 * (1 + Math.sin(T * 1.6 + sd.ph) * 0.012); }
    // nhà, cây che nhân vật thì mờ đi
    for (i = 0; i < FADE.length; i++) {
      var f = FADE[i], mm = f.userData.mesh.material, sx = Math.abs(f.scale.x) * 0.42;
      var fq = rel(f.position.x - FX, f.position.z - FZ);
      var hide = fq[1] > 0.05 && fq[1] < Math.abs(f.scale.y) * 0.8 && Math.abs(fq[0]) < sx && (!f.userData.pop || f.userData.pop.a > 0.5);
      var want = hide ? 0.35 : 1;
      if (Math.abs(mm.opacity - want) > 0.01) { mm.transparent = true; mm.opacity += (want - mm.opacity) * Math.min(1, dt * 6); mm.alphaTest = 0.5 * mm.opacity; }
      else if (want === 1 && mm.transparent) { mm.transparent = false; mm.opacity = 1; mm.alphaTest = 0.5; }
    }
    for (i = 0; i < PLATES.length; i++) {
      var pl = PLATES[i]; if (!pl.userData.pop) continue;
      var pd2 = Math.hypot(pl.position.x - FX, pl.position.z - FZ);
      pl.material.opacity = (pd2 < 6 ? 1 : Math.max(0, 1 - (pd2 - 6) / 3)) * Math.max(0, Math.min(1, (pl.userData.pop.a - 0.6) / 0.4)); pl.visible = pl.material.opacity > 0.02;
    }
    // dấu chạm đất, vòng sáng chỗ tương tác, dấu 📍 nhiệm vụ
    if (st.tap) { mark.position.x = (d.ox + st.tap.x) * U; mark.position.z = (d.oy + st.tap.y) * U; mark.material.opacity = 0.9; mark.scale.set(1, 1, 1); }
    if (mark.material.opacity > 0) { mark.material.opacity = Math.max(0, mark.material.opacity - dt * 0.9); mark.scale.multiplyScalar(1 + dt * 0.6); }
    ring.material.opacity = st.near && !st.P.hidden ? 0.45 + Math.sin(T * 4.5) * 0.15 : 0;
    if (st.near) ring.position.set((d.ox + st.near.x) * U, 0.016, (d.oy + st.near.y) * U);
    PIN.visible = !!st.goal && !st.P.hidden;
    if (st.goal) { var gv = upv((st.goal.h || 200) * U + 0.42 + Math.sin(T * 3.3) * 0.08); PIN.position.set((d.ox + st.goal.x) * U + gv[0], gv[1], (d.oy + st.goal.y) * U + gv[2]); }
    applyTime(st.hour, dt);
    ambient(dt);
    camera(dt);
    snap = false;
    R.render(SC, CAM);
  };
  /* toạ độ màn hình (px CSS trong khung game) của điểm (x, y) px cảnh id, cao h px (trên tấm giấy ngả) */
  var V = null;
  W3.project = function (id, x, y, h) {
    var d = id ? G.WORLD3D[id] : { ox: 0, oy: 0 }; if (!d || !CAM) return null;
    if (!V) V = new THREE.Vector3();
    var uv = upv((h || 0) * U), X = (d.ox + x) * U + uv[0], Y = uv[1], Z = (d.oy + y) * U + uv[2];
    V.set(X, Y, Z).project(CAM); var sx = (V.x + 1) / 2 * Wc, sy = (1 - V.y) / 2 * Hc, front = V.z < 1;
    V.set(X + 0.1 * Math.cos(YAW), Y, Z - 0.1 * Math.sin(YAW)).project(CAM); var k = Math.abs((V.x + 1) / 2 * Wc - sx) / 10;
    return { x: sx, y: sy, k: k, vis: front };
  };
  /* chạm màn hình: người đi đường / nhà / NPC được chạm, không thì điểm trên mặt đất (px toàn thành phố) */
  var RAY = null, GROUND = null, HIT = null;
  W3.pick = function (cx, cy) {
    if (!W3.ready) return null;
    if (!RAY) { RAY = new THREE.Raycaster(); GROUND = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); HIT = new THREE.Vector3(); }
    RAY.setFromCamera({ x: cx / Wc * 2 - 1, y: -(cy / Hc) * 2 + 1 }, CAM);
    var hs = RAY.intersectObjects(PICK, false);
    for (var i = 0; i < hs.length; i++) {
      var pk = hs[i].object.userData.pick, gp = hs[i].object.parent;
      if (!gp.visible || (gp.userData.pop && gp.userData.pop.a < 0.5)) continue;   // vật đang nằm rạp thì bỏ qua
      return pk;
    }
    if (!RAY.ray.intersectPlane(GROUND, HIT)) return null;
    return { kind: 'ground', gx: HIT.x / U, gy: HIT.z / U };
  };
  W3.state = function () {
    var up = 0; for (var q = 0; q < POPS.length; q++) if (POPS[q].a > 0.9) up++;
    return { pops: POPS.length, up: up, walkers: TOWN.length, cars: CARS.length, birds: BIRDS.length, clouds: CLOUDS.length, light: LIGHT, night: night, zoom: zoomK,
      fx: FX / U, fz: FZ / U, shuttle: SH ? { x: Math.round(SH.x), y: Math.round(SH.y), phase: SH.phase, face: SH.face } : null,
      birdFlip: BIRDS.map(function (b) { return (b.sp.material.map === b.tf ? 'flip' : 'norm') + (b.dir > 0 ? '>' : '<') + b.k; }),
      player: P3 ? { map: P3.g.userData.mesh.material.map.image ? P3.g.userData.mesh.material.map.image.src.split('/').pop().split('?')[0] : '', y: +P3.g.position.y.toFixed(4) } : null };
  };
  W3.debugTime = function (dt) { T += dt; };
})();
