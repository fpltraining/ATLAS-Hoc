/* Vẽ cảnh bằng canvas, camera theo nhân vật, di chuyển bằng chạm / cần điều khiển / phím mũi tên,
   va chạm với nhà, cửa và NPC có nút hành động. */
var G = window.G || (window.G = {});

(function () {
  var cv, ctx, W = 0, H = 0, dpr = 1, zoom = 1, baseZoom = 1;
  var scene = null, sceneId = '';
  var P = { x: 768, y: 300, dir: 'down', moving: false, t: 0 };
  var K = { x: 740, y: 260 };
  var target = null, pending = null, pendingLabel = '';
  var joy = { on: false, dx: 0, dy: 0 };
  var keys = {};
  var cam = { x: 0, y: 0 };
  var last = 0, fade = 0, running = false;
  var near = null;
  var SPEED = 260;

  G.engineInit = function () {
    cv = document.getElementById('world');
    ctx = cv.getContext('2d');
    window.addEventListener('resize', resize);
    resize();
    bindInput();
  };

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    // nhìn thấy khoảng 720 đơn vị theo chiều ngắn của màn hình
    baseZoom = Math.max(0.55, Math.min(1.3, Math.min(W, H) / 640));
    zoom = baseZoom;
  }

  /* ---------- cảnh ---------- */
  /* lớp chặn theo ảnh nền (data/walkmask.js): giải mã một lần thành mảng 0/1 theo ô */
  var MASKS = {};
  function maskOf(sc) {
    var src = G.WALKMASK && sc.bg && G.WALKMASK[sc.bg];
    if (!src) return null;
    if (MASKS[sc.bg]) return MASKS[sc.bg];
    var rows = src.r, w = rows[0].length * 4, cells = [];
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < w; x++) cells.push((parseInt(rows[y].charAt(x >> 2), 16) >> (3 - (x & 3))) & 1);
    return (MASKS[sc.bg] = { c: src.c, w: w, h: rows.length, a: cells });
  }
  var mask = null;
  G.enterScene = function (id, at) {
    scene = G.SCENES[id]; sceneId = id;
    mask = maskOf(scene);
    resize(); // màn bản đồ vừa hiện ra: đo lại kích thước canvas
    var sp = at || scene.spawn || { x: scene.w / 2, y: scene.walk.y1 - 40 };
    var wk = scene.walk;   // luôn đặt nhân vật trong vùng đi được
    P.x = clamp(sp.x, wk.x0 + 5, wk.x1 - 5); P.y = clamp(sp.y, wk.y0 + 5, wk.y1 - 5); P.dir = sp.dir || 'up';
    unstick();
    K.x = P.x - 50; K.y = P.y + 30;
    target = null; pending = null; path = []; fade = 1;
    G.S.viTri = { canh: id, x: Math.round(P.x), y: Math.round(P.y) };
    G.save();
    camSnap = true; spawnTown(); fx = []; hudT = 0; weatherHint(); makePuddles();
    if (G.rainSound) G.rainSound(scene.kind === 'city' && G.weather() === 'rain');
    document.getElementById('hud-title').textContent = scene.title;
    if (!running) { running = true; last = 0; requestAnimationFrame(loop); }
  };
  G.stopEngine = function () { running = false; };
  /* quay lại cảnh đang đứng (sau khi thoát xe) */
  G.resumeScene = function () { G.enterScene(sceneId, { x: P.x, y: P.y + 30, dir: 'down' }); };
  /* xuống xe ở trạm của thành phố đích */
  G.arriveBy = function (type, toward) {
    var sc = toward === 'school' ? 'city_en' : 'home_en', bs = G.SCENES[sc].buildings;
    for (var i = 0; i < bs.length; i++) if (bs[i].ride === type) { G.enterScene(sc, { x: bs[i].x, y: bs[i].y + 80, dir: 'down' }); break; }
    G.kaiSay(toward === 'school' ? 'Tới trung tâm rồi! Trường Anh ngữ là toà có biển đỏ. Đi tới đó nhé.' : 'Về tới khu phố Maple rồi. Nghỉ ngơi thôi!');
  };

  /* Danh sách thứ có thể tương tác trong cảnh hiện tại */
  function triggers() {
    var list = [];
    if (scene.buildings) {
      for (var i = 0; i < scene.buildings.length; i++) {
        var b = scene.buildings[i];
        var lb = b.ride === 'bus' ? 'Đợi xe buýt' + (b.toward === 'home' ? ' về nhà' : ' tới trường') : b.ride === 'metro' ? 'Vào ga tàu điện' : b.home ? 'Vào nhà · đọc truyện, ôn từ' : 'Vào ' + b.name;
        list.push({ x: b.x, y: b.y + 18, r: 70, label: lb, act: (function (bb) { return function () { useBuilding(bb); }; })(b) });
      }
    }
    if (scene.kind === 'hall') {
      var DR = doorsHere();
      for (var d = 0; d < DR.length; d++) {
        var door = DR[d];
        list.push({ x: door.x, y: G.HALL_DOOR_Y, r: 80, label: 'Vào phòng ' + door.label, act: (function (idx) { return function () { useDoor(idx); }; })(d) });
      }
    }
    if (scene.kind === 'shop') {
      var nid = scene.npc;
      var tp = talkPt();
      list.push({ x: tp.x, y: tp.y, r: 120, npc: nid, label: 'Nói chuyện với ' + G.NPCS[nid].name, act: function () { G.openLife(scene.life); } });
      (scene.boards || []).forEach(function (bd) { list.push({ x: bd.x, y: Math.max(scene.walk.y0 + 20, bd.y + 120), r: 110, board: bd, label: 'Đọc bảng ' + bd.title, act: function () { G.openBoard(bd); } }); });
    }
    if (scene.kind === 'classroom' && G.currentRoom) {
      var tid = G.ROOM_TEACHER[G.currentRoom];
      if (tid) list.push({ x: TX(), y: TY() + 40, r: 110, npc: tid, label: 'Nói chuyện với ' + G.NPCS[tid].name, act: function () { G.openLesson(G.currentRoom); } });
    }
    var PP = people();
    for (var pi = 0; pi < PP.length; pi++) {
      var pp = PP[pi], pn = G.NPCS[pp.npc];
      var shop = G.SHOPS && G.SHOPS[pp.life];
      if (shop) list.push({ x: pp.x, y: pp.y + 40, r: 95, npc: pp.npc, tall: pp.bs, label: 'Vào ' + shop.title, act: (function (sh, q) { return function () { enterShop(sh, q); }; })(shop, pp) });
      else list.push({ x: pp.x, y: pp.y + 40, r: 95, npc: pp.npc, label: 'Nói chuyện với ' + pn.name, act: (function (lf) { return function () { G.openLife(lf); }; })(pp.life) });
    }
    if (scene.exit) list.push({ x: scene.exit.x, y: scene.exit.y, r: 70, label: scene.exit.label, act: useExit });
    (scene.gates || []).forEach(function (g) { list.push({ x: g.x, y: g.y, r: 80, label: g.label, act: function () { useGate(g); } }); });
    return list;
  }

  /* lời Kai khi vào hành lang: chỉ phòng nên học tiếp */
  function hallHint() {
    var d = doorsHere(), zh = scene.city === 'zh';
    if (!zh && scene.floor) {   // lớp cần học ở tầng khác: chỉ ra thang máy
      var nr = nextRoom();
      if (nr && nr.floor !== scene.floor) return 'Đây là ' + scene.title + '. Lớp của bạn ở Tầng ' + nr.floor + ' · ' + G.floorInfo(nr.floor).name + ': đi thang máy bên phải nhé!';
    }
    for (var i = 0; i < d.length; i++) if (!G.roomPassed(d[i].room)) return i === 0 ? 'Đây là ' + scene.title + '. Phòng ' + d[0].label + ' ở cửa đầu tiên bên trái!' : 'Phòng nên học tiếp: ' + d[i].label + ' (cửa thứ ' + (i + 1) + ' từ trái sang).';
    return zh ? 'Bạn đã tốt nghiệp HSK1! HSK2 sẽ mở ở bản cập nhật sau.' : scene.floor === 1 ? 'Bạn đã xong Tầng 1 · Nền tảng! Đi thang máy lên Tầng 2 học A1.' : 'Bạn đã tốt nghiệp A1! Tầng 3 (A2 – B1) đang được xây.';
  }

  function useBuilding(b) {
    if (b.ride) { G.sfx('door'); G.openRide(b.ride, b.toward); return; }
    if (b.fly) { G.sfx('door'); G.openFlight(scene.city, b.fly); return; }
    if (b.life) {
      var L = G.LIFE[b.life];
      if (!G.roomPassed(L.unlock)) { G.sfx('wrong'); G.kaiSay(b.name + ' chưa mở. ' + L.unlockText); return; }
      G.sfx('door'); G.enterScene(L.scene, { x: 768, y: 930, dir: 'up' });
      G.kaiSay('Đi tới gặp ' + G.NPCS[L.npc].name + ' rồi bấm "Nói chuyện". Ở đây chỉ nói tiếng Anh nhé!');
      return;
    }
    if (b.home) { G.sfx('door'); G.openHome(); return; }
    if (b.go) { G.sfx('door'); G.enterScene(b.go.scene === 'en_hall' ? G.hallOfFloor(G.enFloorNow()) : b.go.scene, { x: b.go.x, y: b.go.y, dir: 'up' }); G.kaiSay(hallHint()); }
    else G.kaiSay(b.soon);
  }

  var lastDoor = 0;
  function useDoor(idx) {
    var door = doorsHere()[idx];
    if (!G.roomOpen(idx, doorsHere())) {
      var pv = G.ROOMS[doorsHere()[idx - 1].room];
      G.sfx('wrong'); G.kaiSay('Cửa ' + door.label + ' còn khoá. ' + (pv && pv.group ? 'Qua hết ' + pv.group.length + ' buổi của phòng ' + pv.label + ' (mỗi buổi kiểm tra từ 8/10) để mở nhé.' : 'Qua bài kiểm tra phòng trước (từ 8/10) để mở nhé.')); return;
    }
    if (!G.ROOMS[door.room]) { G.kaiSay('Phòng ' + door.label + ' sẽ có trong bản cập nhật sau.'); return; }
    lastDoor = idx;
    G.currentRoom = door.room;
    G.sfx('door');
    G.enterScene(scene.classroom, { x: 768, y: 930, dir: 'up' });
    var t = G.NPCS[G.ROOM_TEACHER[door.room]];
    G.kaiSay('Đi lên gặp ' + t.name + ' rồi bấm "Nói chuyện" để bắt đầu học.');
  }

  /* bước vào tiệm (khu riêng), nhớ chỗ đứng ngoài phố để ra lại đúng chỗ */
  function enterShop(sh, pp) {
    G._outside = { scene: sceneId, x: pp.x, y: pp.y + 70 };
    var ex = G.SCENES[sh.scene] && G.SCENES[sh.scene].exit;
    G.sfx('door'); G.enterScene(sh.scene, ex ? { x: ex.x, y: ex.y - 70, dir: 'up' } : { x: 768, y: 760, dir: 'up' });
    G.kaiSay('Vào ' + sh.title + ' rồi! Gặp ' + G.NPCS[G.LIFE[scene.life].npc].name + ' ở quầy để nói chuyện, hoặc đọc bảng thông tin trên tường.');
  }
  /* cổng sang khu khác của thành phố (trung tâm ↔ phố mua sắm) */
  function useGate(g) {
    if (g.to.floors) { openFloors(); return; }
    G.sfx('door'); G.enterScene(g.to.scene, { x: g.to.x, y: g.to.y, dir: g.to.dir || 'down' });
    if (g.to.scene === 'street_en') G.kaiSay('Đây là Phố mua sắm: bưu điện, ngân hàng, hiệu thuốc, tiệm tóc và siêu thị. Vào tiệm nào cũng có người để nói chuyện!');
  }
  /* thang máy: chọn tầng (tầng chưa mở thì nói cách mở, tầng đang xây thì báo sắp có) */
  function openFloors() {
    var cur = scene.floor || 0, wrap;
    function close() { if (wrap && wrap.parentNode) wrap.parentNode.removeChild(wrap); }
    function go(f) {
      close();
      if (f.n === cur) return;
      G.S.tangEn = f.n; G.save();
      G.sfx('door');
      var lg = (G.SCENES[f.scene].gates || [])[0];
      G.enterScene(f.scene, lg ? { x: lg.x - 70, y: lg.y + 30, dir: 'left' } : null);
      G.kaiSay('Ding! Tầng ' + f.n + ' · ' + f.name + '. ' + hallHint());
    }
    var rows = G.EN_FLOORS.slice().reverse().map(function (f) {
      var open = G.floorUnlocked(f.n), grad = G.S.totNghiep.en && f.grad && G.S.totNghiep.en[f.grad];
      var tag = f.soon ? '🚧 Đang xây' : f.n === cur ? '📍 Bạn đang ở đây' : grad ? '🎓 Đã tốt nghiệp' : open ? 'Đã mở' : '🔒 Tốt nghiệp Nền tảng để mở';
      return G.el('button.fl-row' + (f.soon || !open ? '.off' : '') + (f.n === cur ? '.cur' : ''), { onclick: function () {
        if (f.soon) { G.sfx('wrong'); G.toast('Tầng ' + f.n + ' · ' + f.name + ' đang được xây. Sắp mở!'); return; }
        if (!open) { G.sfx('wrong'); G.toast('Tầng ' + f.n + ' mở khi bạn tốt nghiệp Tầng 1 · Nền tảng (thi đạt 16/20).'); return; }
        go(f);
      } },
        G.el('b.fl-n', String(f.n)),
        G.el('span.fl-t', G.el('b', 'Tầng ' + f.n + ' · ' + f.name + ' '), G.el('span.fl-cefr', f.cefr), G.el('span.small', f.sub), G.el('span.fl-tag', tag)));
    });
    wrap = G.el('div.modal', { onclick: function (e) { if (e.target === wrap) close(); } }, G.el('div.choose.floors',
      G.el('h2', '🛗 Thang máy'),
      G.el('p.small', 'Chọn tầng muốn tới. Mỗi tầng là một cấp độ, học xong tầng dưới thì lên tầng trên.'),
      G.el('div.fl-list', rows),
      G.el('button.btn', { onclick: close }, 'Đóng')));
    document.body.appendChild(wrap);
  }
  G.openFloors = openFloors;
  function gateTo(id) { var gs = scene.gates || []; for (var i = 0; i < gs.length; i++) if (gs[i].to.scene === id) return gs[i]; return null; }
  function useExit() {
    var to = scene.exit.to;
    G.sfx('door');
    if (to.back) { var o = G._outside || { scene: 'city_en' }; G.enterScene(o.scene, o.x ? { x: o.x, y: o.y, dir: 'down' } : null); return; }
    if (to.building) {
      var bs = G.SCENES[to.scene].buildings;
      for (var i = 0; i < bs.length; i++) if (bs[i].id === to.building) { G.enterScene(to.scene, { x: bs[i].x, y: bs[i].y + 70, dir: 'down' }); return; }
    }
    if (to.door) {
      var hs = G.currentRoom && G.currentRoom.indexOf('en') === 0 ? G.hallOfFloor(G.floorOfRoom(G.currentRoom)) : to.scene;
      G.enterScene(hs, { x: G[G.SCENES[hs].doors][lastDoor].x, y: G.HALL_DOOR_Y + 60, dir: 'down' }); return;
    }
    G.enterScene(to.scene);
  }

  /* ---------- va chạm ---------- */
  function blocked(x, y) {
    var w = scene.walk;
    if (x < w.x0 || x > w.x1 || y < w.y0 || y > w.y1) return true;
    if (scene.buildings) {
      for (var i = 0; i < scene.buildings.length; i++) {
        var b = scene.buildings[i], bk = (b.s || 300) / 300;
        if (x > b.x - 125 * bk && x < b.x + 125 * bk && y > b.y - 190 * bk && y < b.y - 4) return true;
      }
    }
    if (scene.props) for (var pj = 0; pj < scene.props.length; pj++) { var pr = scene.props[pj], ddx = x - pr.x, ddy = (y - pr.y) * 2; if (ddx * ddx + ddy * ddy < pr.r * pr.r) return true; }
    var PP = people();
    for (var pq = 0; pq < PP.length; pq++) {
      var po = PP[pq];
      if (po.bimg) { var bk0 = (po.bs || 210) / 210; if (Math.abs(x - po.x) < 90 * bk0 && y > po.y - 120 * bk0 && y < po.y + 6) return true; continue; }   // tiệm có hình toà nhà
      var pd = x - po.x, pe = (y - po.y) * 2; if (pd * pd + pe * pe < 26 * 26) return true;
    }
    if (mask) {   // vật vẽ trong ảnh nền: cây, ghế, đài phun nước, cột đèn, bàn ghế, nước…
      var mx = (x / mask.c) | 0, my = (y / mask.c) | 0;
      if (mx >= 0 && my >= 0 && mx < mask.w && my < mask.h && mask.a[my * mask.w + mx]) return true;
    }
    if (scene.blocks) for (var bk = 0; bk < scene.blocks.length; bk++) { var B = scene.blocks[bk]; if (x > B[0] && x < B[2] && y > B[1] && y < B[3]) return true; }   // đồ đạc trong ảnh nội thất
    if ((scene.kind === 'classroom' || scene.kind === 'shop') && Math.abs(x - TX()) < 60 && Math.abs(y - TY() + 20) < 36) return true; // giáo viên
    return false;
  }

  /* ---------- vòng lặp ---------- */
  function loop(ts) {
    if (!running) return;
    if (!W || cv.clientWidth !== W || cv.clientHeight !== H) resize();
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  function update(dt) {
    var vx = 0, vy = 0;
    if (joy.on && (Math.abs(joy.dx) > 0.15 || Math.abs(joy.dy) > 0.15)) { vx = joy.dx; vy = joy.dy; target = null; pending = null; path = []; }
    else if (keys.l || keys.r || keys.u || keys.d) { vx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); vy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0); target = null; pending = null; path = []; }
    else if (target) {
      var tx = target.x - P.x, ty = target.y - P.y, dist = Math.sqrt(tx * tx + ty * ty);
      if (pending && near && near.label === pendingLabel) {
        target = null; path = []; var p0 = pending; pending = null; p0();
      } else if (dist < 8) {
        if (path.length) { target = path.shift(); tx = target.x - P.x; ty = target.y - P.y; dist = Math.sqrt(tx * tx + ty * ty) || 1; vx = tx / dist; vy = ty / dist; }
        else { target = null; if (pending) { var p = pending; pending = null; p(); } }
      } else { vx = tx / dist; vy = ty / dist; }
    }
    var len = Math.sqrt(vx * vx + vy * vy);
    P.moving = len > 0.01;
    if (P.moving) {
      dustT -= dt; if (dustT <= 0) { dustT = 0.22; fx.push({ k: 'dust', x: P.x + (Math.random() - 0.5) * 14, y: P.y + 2, t: 0, life: 0.5 }); }
      vx /= Math.max(1, len); vy /= Math.max(1, len);
      var step = SPEED * dt;
      if (target && step > dist) step = dist;   // không vượt quá điểm đích
      var ox = P.x, oy = P.y;
      var moved = slideMove(vx, vy, step);
      var prog = Math.abs(P.x - ox) + Math.abs(P.y - oy);
      if (target) {
        // đi chậm hẳn hoặc đứng im quá lâu: tìm đường lại, vẫn kẹt thì dừng
        if (prog < step * 0.25) stuckT += dt; else stuckT = Math.max(0, stuckT - dt);
        if (stuckT > 0.35) {
          stuckT = 0;
          var fin = finalT || target, pa = pending, pl = pendingLabel;
          if (replans < 2) { replans++; var rp = replans; goTo(fin.x, fin.y, pa, pl); replans = rp; }
          else { target = null; path = []; if (pending && near) { var q = pending; pending = null; q(); } else pending = null; }
        }
      }
      if (!moved) P.moving = false;
      if (Math.abs(vx) > Math.abs(vy)) P.dir = vx < 0 ? 'left' : 'right'; else P.dir = vy < 0 ? 'up' : 'down';
      P.t += dt;
    }
    // Kai đi theo sau, cách một khoảng
    var kx = P.x - 60 - K.x, ky = P.y + 20 - K.y, kd = Math.sqrt(kx * kx + ky * ky);
    // hướng của Kai: theo hướng đang bay, đứng yên thì quay về phía người chơi
    var kvx = kd > 30 ? kx : P.x - K.x, kvy = kd > 30 ? ky : P.y - K.y;
    K.moving = kd > 30;
    if (K.moving) K.t = (K.t || 0) + dt;
    if (Math.abs(kvx) > 4 || Math.abs(kvy) > 4) K.dir = Math.abs(kvx) > Math.abs(kvy) * 0.8 ? (kvx < 0 ? 'left' : 'right') : (kvy < 0 ? 'up' : 'down');
    if (kd > 30) { K.x += (kx / kd) * Math.min(kd, SPEED * 0.95 * dt * (kd > 160 ? 1.6 : 1)); K.y += (ky / kd) * Math.min(kd, SPEED * 0.95 * dt * (kd > 160 ? 1.6 : 1)); }

    // chỗ tương tác gần nhất → nút hành động
    var ts = triggers(), best = null, bd = 1e9;
    for (var i = 0; i < ts.length; i++) { var dx = ts[i].x - P.x, dy = ts[i].y - P.y, d = Math.sqrt(dx * dx + dy * dy); if (d < ts[i].r && d < bd) { bd = d; best = ts[i]; } }
    if (best !== near) { near = best; G.showAction(near); }

    // camera: phóng đủ để ảnh nền phủ kín màn hình
    zoom = Math.max(baseZoom, W / scene.w, H / scene.h);
    var vw = W / zoom, vh = H / zoom;
    var cx = clamp(P.x - vw / 2, 0, Math.max(0, scene.w - vw)) - (vw > scene.w ? (vw - scene.w) / 2 : 0);
    // chừa chỗ cho thanh trên + thanh nhiệm vụ: mép trên bản đồ hiện ngay dưới hai thanh này
    var topUI = 128 / zoom;
    var cy = clamp(P.y - vh / 2, -topUI, Math.max(-topUI, scene.h - vh)) - (vh > scene.h + topUI ? (vh - scene.h - topUI) / 2 : 0);
    // camera đi theo mượt (trễ nhẹ), vào cảnh mới thì đặt ngay
    if (camSnap) { cam.x = cx; cam.y = cy; camSnap = false; }
    else { var kf = Math.min(1, dt * 7); cam.x += (cx - cam.x) * kf; cam.y += (cy - cam.y) * kf; }
    updateTown(dt); updateFx(dt);
    if (fade > 0) fade = Math.max(0, fade - dt * 3);
  }

  var detour = 0, stuckFree = 0, stuckT = 0, path = [], replans = 0;
  function tryMove(dx, dy, step) {
    var nx = P.x + dx * step, ny = P.y + dy * step;
    if (!blocked(nx, ny)) { P.x = nx; P.y = ny; return true; }
    return false;
  }
  /* đi theo hướng (dx,dy); chạm tường thì trượt dọc tường thay vì đứng khựng */
  function slideMove(dx, dy, step) {
    if (tryMove(dx, dy, step)) return true;
    if (Math.abs(dx) > 0.2 && tryMove(dx > 0 ? 1 : -1, 0, step * Math.abs(dx))) return true;
    if (Math.abs(dy) > 0.2 && tryMove(0, dy > 0 ? 1 : -1, step * Math.abs(dy))) return true;
    var a = [0.5, -0.5, 0.9, -0.9];
    for (var i = 0; i < a.length; i++) {
      var c = Math.cos(a[i]), sn = Math.sin(a[i]);
      if (tryMove(dx * c - dy * sn, dx * sn + dy * c, step * 0.8)) return true;
    }
    return false;
  }

  /* ---------- tìm đường A* trên lưới ô 20 đơn vị ---------- */
  var CELL = 20;
  function freeAt(x, y) { return !blocked(x, y); }
  function nearestFree(x, y) {
    if (freeAt(x, y)) return { x: x, y: y };
    for (var r = CELL / 2; r < 400; r += CELL / 2) {
      for (var k = 0; k < 16; k++) {
        var a = k * Math.PI / 8, qx = x + Math.cos(a) * r, qy = y + Math.sin(a) * r;
        if (freeAt(qx, qy)) return { x: qx, y: qy };
      }
    }
    return null;
  }
  function lineFree(x0, y0, x1, y1) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy), n = Math.ceil(d / 8);
    for (var i = 1; i <= n; i++) if (blocked(x0 + dx * i / n, y0 + dy * i / n)) return false;
    return true;
  }
  function findPath(sx, sy, gx, gy) {
    if (lineFree(sx, sy, gx, gy)) return [{ x: gx, y: gy }];
    var cols = Math.ceil(scene.w / CELL), rows = Math.ceil(scene.h / CELL), N = cols * rows;
    var free = {}, g = {}, came = {}, closed = {};
    function ok(i) { if (free[i] === undefined) free[i] = freeAt((i % cols) * CELL + CELL / 2, Math.floor(i / cols) * CELL + CELL / 2); return free[i]; }
    function cx(i) { return (i % cols) * CELL + CELL / 2; }
    function cy(i) { return Math.floor(i / cols) * CELL + CELL / 2; }
    function idx(x, y) { return clamp(Math.floor(y / CELL), 0, rows - 1) * cols + clamp(Math.floor(x / CELL), 0, cols - 1); }
    var st = idx(sx, sy), go = idx(gx, gy);
    if (!ok(go)) { var nf = nearestFree(gx, gy); if (nf) { gx = nf.x; gy = nf.y; go = idx(gx, gy); } }   // vẫn kẹt thì A* tự chọn chỗ gần nhất đi được
    function h(i) { var ax = Math.abs(cx(i) - gx), ay = Math.abs(cy(i) - gy); return Math.max(ax, ay) + 0.414 * Math.min(ax, ay); }
    // hàng đợi ưu tiên (đống nhị phân)
    var heap = [], fv = {};
    function push(i) { heap.push(i); var c = heap.length - 1; while (c > 0) { var pa = (c - 1) >> 1; if (fv[heap[pa]] <= fv[heap[c]]) break; var t = heap[pa]; heap[pa] = heap[c]; heap[c] = t; c = pa; } }
    function pop() { var top = heap[0], end = heap.pop(); if (heap.length) { heap[0] = end; var c = 0; for (;;) { var l = 2 * c + 1, r = l + 1, m = c; if (l < heap.length && fv[heap[l]] < fv[heap[m]]) m = l; if (r < heap.length && fv[heap[r]] < fv[heap[m]]) m = r; if (m === c) break; var t = heap[m]; heap[m] = heap[c]; heap[c] = t; c = m; } } return top; }
    g[st] = 0; fv[st] = h(st); push(st);
    var D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    var found = false, steps = 0, best = st, bestH = h(st);
    while (heap.length && steps < N) {
      var cur = pop(); steps++;
      if (closed[cur]) continue; closed[cur] = 1;
      if (cur === go) { found = true; break; }
      var hc = h(cur); if (hc < bestH) { bestH = hc; best = cur; }
      var c0 = cur % cols, r0 = Math.floor(cur / cols);
      for (var k = 0; k < 8; k++) {
        var c1 = c0 + D[k][0], r1 = r0 + D[k][1];
        if (c1 < 0 || r1 < 0 || c1 >= cols || r1 >= rows) continue;
        var ni = r1 * cols + c1;
        if (closed[ni] || !ok(ni)) continue;
        if (D[k][2] > 1 && (!ok(r0 * cols + c1) || !ok(r1 * cols + c0))) continue; // không cắt góc
        var ng = g[cur] + D[k][2] * CELL;
        if (g[ni] === undefined || ng < g[ni]) { g[ni] = ng; came[ni] = cur; fv[ni] = ng + h(ni); push(ni); }
      }
    }
    if (!found) {   // đích nằm sau vật cản / giữa nước: đi tới chỗ đi được gần đích nhất
      if (best === st) return null;
      go = best; gx = cx(best); gy = cy(best);
    }
    var pts = [{ x: gx, y: gy }];
    for (var q = came[go]; q !== undefined && q !== st; q = came[q]) pts.unshift({ x: cx(q), y: cy(q) });
    // làm mượt: bỏ các điểm trung gian nếu đi thẳng được
    var out = [], fx0 = sx, fy0 = sy, iA = 0;
    while (iA < pts.length) {
      var j = pts.length - 1;
      while (j > iA && !lineFree(fx0, fy0, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]); fx0 = pts[j].x; fy0 = pts[j].y; iA = j + 1;
    }
    return out;
  }
  /* đặt đích đi tới: tìm đường vòng qua nhà, cây, xe… */
  function goTo(x, y, act, label) {
    pending = act || null; pendingLabel = label || '';
    var w = scene.walk;
    x = clamp(x, w.x0 + 4, w.x1 - 4); y = clamp(y, w.y0 + 4, w.y1 - 4);
    var pth = findPath(P.x, P.y, x, y);
    if (!pth || !pth.length) { target = null; path = []; if (pending && near) { var q = pending; pending = null; q(); } return; }
    path = pth; target = path.shift(); stuckT = 0; replans = 0; finalT = pth.length ? pth[pth.length - 1] : target;
  }
  var finalT = null;
  /* vị trí lưu cũ nằm trong vật cản (bản đồ đổi) thì đẩy ra chỗ trống gần nhất */
  function unstick() { if (blocked(P.x, P.y)) { var f = nearestFree(P.x, P.y); if (f) { P.x = f.x; P.y = f.y; } } }

  /* vị trí giáo viên trong lớp (theo ảnh lớp học) */
  function TX() { return (scene.teacher || {}).x || 768; }
  /* chỗ đứng nói chuyện với người bán (tiệm có ảnh: ngay trước quầy) */
  function talkPt() { return scene.talk || { x: TX(), y: scene.room ? TY() + 120 : TY() + 40 }; }
  function TY() { return (scene.teacher || {}).y || 520; }


  /* ---------- Việc tiếp theo: tính theo tiến độ, chỉ đường trong cảnh hiện tại ---------- */
  function bld(id) { var bs = scene.buildings || []; for (var i = 0; i < bs.length; i++) if (bs[i].id === id) return bs[i]; return null; }
  function nextRoom() {
    var now = G.enFloorNow(), order = [now], f, i;
    for (f = 1; f <= G.EN_FLOORS.length; f++) if (f !== now && G.floorUnlocked(f)) order.push(f);
    for (var k = 0; k < order.length; k++) {
      var d = G[G.floorInfo(order[k]).doors];
      for (i = 0; i < d.length; i++) if (G.ROOMS[d[i].room] && !G.roomPassed(d[i].room)) return { door: d[i], idx: i, floor: order[k] };
    }
    return null;
  }
  function liftGate() { var gs = scene.gates || []; for (var i = 0; i < gs.length; i++) if (gs[i].to.floors) return gs[i]; return null; }
  function nextLife() {   // nơi đời sống đã mở mà chưa xong cả 3 tình huống
    for (var k in G.LIFE) {
      if (!G.LIFE.hasOwnProperty(k) || G.LIFE[k].lang !== 'en' || !G.roomPassed(G.LIFE[k].unlock)) continue;
      var st = G.S.doiSong[k], n = 0; if (st) for (var t in st.xong) if (st.xong.hasOwnProperty(t)) n++;
      if (n < G.LIFE[k].talks.length) return k;
    }
    return null;
  }
  /* trả về { text, x, y, h (độ cao dấu), label (nút hành động khớp) } hoặc null */
  function goal() {
    var nr = nextRoom(), lf = nr ? null : nextLife();
    var tName = nr ? G.NPCS[G.ROOM_TEACHER[nr.door.room]].name : '';
    var ses = nr && G.ROOMS[nr.door.room].group ? G.ROOMS[G.curSession(nr.door.room)] : null;   // phòng nhóm: buổi đang học
    var what = nr ? (ses ? 'Học Buổi ' + ses.n + ' (phòng ' + nr.door.label + ') với ' + tName : 'Học phòng ' + nr.door.label + ' với ' + tName) : lf ? 'Nói chuyện ở ' + G.LIFE[lf].title : 'Ôn lại một phòng bất kỳ để lấy thêm sao';
    var id = sceneId;
    var td = G.today().viec;
    // người mới (đầu vào dưới A1) chưa qua phòng đầu: chỉ thẳng tới trường học trước, nói chuyện ngoài phố để sau
    var fd = G[G.floorInfo(G.enFloorNow()).doors][0], fr = G.ROOMS[fd.room];
    var newbie = !!(G.S.dauVao && G.S.dauVao.lv <= 1 && !G.roomPassed(fr && fr.group ? fr.group[0] : fd.room));
    var mn = id === 'home_en' && !newbie ? morningNext() : null;
    if (mn === 'en-home') { var hm0 = bld('home'); return { text: 'Buổi sáng: vào nhà ăn sáng và nói chuyện với mẹ', x: hm0.x, y: hm0.y + 18, h: 260, label: 'Vào nhà · đọc truyện, ôn từ' }; }
    if (mn) { var pm = personOf(mn), nm = G.NPCS[G.LIFE[mn].npc].name; if (pm) return { text: 'Buổi sáng: ' + G.LIFE[mn].title + ' · nói chuyện với ' + nm, x: pm.x, y: pm.y + 40, h: 150, label: 'Nói chuyện với ' + nm }; }
    // sau giờ học: mỗi ngày gợi ý một nơi (siêu thị, hiệu thuốc, ngân hàng, bưu điện, cắt tóc, gym), xoay vòng theo ngày
    var AFTER = ['en-super', 'en-pharmacy', 'en-bank', 'en-post', 'en-barber'], doneAfter = talkedToday('en-gym');
    for (var ai = 0; ai < AFTER.length; ai++) if (talkedToday(AFTER[ai])) doneAfter = true;
    if ((id === 'city_en' || id === 'street_en') && td.bai && !doneAfter && G.LIFE[AFTER[0]]) {
      var pickA = AFTER[(+G.vnDay().slice(8, 10)) % AFTER.length], pa = personOf(pickA);
      if (pa) { var na = G.NPCS[G.LIFE[pickA].npc].name, shA = G.SHOPS && G.SHOPS[pickA]; return { text: 'Sau giờ học: ghé ' + G.LIFE[pickA].title + ' · nói chuyện với ' + na, x: pa.x, y: pa.y + 40, h: pa.bs ? pa.bs * 0.75 : 150, label: shA ? 'Vào ' + shA.title : 'Nói chuyện với ' + na }; }
      var gS = gateTo('street_en');   // tiệm nằm ở Phố mua sắm: chỉ ra cổng
      if (gS) return { text: 'Sau giờ học: sang Phố mua sắm, ghé ' + G.LIFE[pickA].title, x: gS.x, y: gS.y, h: 170, label: gS.label };
    }
    if (id === 'street_en') { var gB = gateTo('city_en'); return { text: 'Về trung tâm · ' + what, x: gB.x, y: gB.y, h: 170, label: gB.label }; }
    if (id === 'city_en' && !newbie && G.LIFE['en-gate'] && !talkedToday('en-gate') && personOf('en-gate')) { var pg = personOf('en-gate'); return { text: 'Chào Ms. Nora ở cổng trường trước khi vào lớp', x: pg.x, y: pg.y + 40, h: 150, label: 'Nói chuyện với Ms. Nora' }; }
    if (id === 'home_en' && td.bai && (!td.doc || !td.on)) { var hm = bld('home'); return { text: 'Vào nhà ' + (!td.doc ? 'đọc 1 chương truyện' : 'ôn từ khó') + ' (việc hôm nay)', x: hm.x, y: hm.y + 18, h: 260, label: 'Vào nhà · đọc truyện, ôn từ' }; }
    if (id === 'home_en') { var bs = bld('busstop'); return { text: 'Ra bến xe buýt đi tới trường · ' + what, x: bs.x, y: bs.y + 18, h: 230, label: 'Đợi xe buýt tới trường' }; }
    if (scene.city === 'zh') { var ap = bld('airport'); return ap ? { text: 'Bay về Brightford để học tiếng Anh', x: ap.x, y: ap.y + 18, h: 260, label: 'Vào Sân bay' } : (scene.exit ? { text: 'Ra ngoài, bay về Brightford', x: scene.exit.x, y: scene.exit.y, h: 120, label: scene.exit.label } : null); }
    if (id === 'city_en') {
      if (!nr && lf) { var lb = null, bs2 = scene.buildings; for (var i = 0; i < bs2.length; i++) if (bs2[i].life === lf) lb = bs2[i]; if (lb) return { text: what + ' (+20 XP mỗi tình huống)', x: lb.x, y: lb.y + 18, h: 260, label: 'Vào ' + lb.name }; }
      var sc = bld('school'); return { text: 'Vào Trường Anh ngữ · ' + what, x: sc.x, y: sc.y + 18, h: 260, label: 'Vào ' + sc.name };
    }
    if (scene.kind === 'hall' && td.bai && G.LIFE['en-canteen'] && !talkedToday('en-canteen') && personOf('en-canteen')) {
      var pc = personOf('en-canteen'); return { text: 'Giờ ăn trưa: ra căng tin gặp Ms. Pat', x: pc.x, y: pc.y + 40, h: 150, label: 'Nói chuyện với Ms. Pat' };
    }
    if (scene.kind === 'hall') {
      var lg = liftGate();
      if (nr && scene.floor && nr.floor !== scene.floor && lg) return { text: 'Đi thang máy ' + (nr.floor > scene.floor ? 'lên' : 'xuống') + ' Tầng ' + nr.floor + ' · ' + G.floorInfo(nr.floor).name, x: lg.x, y: lg.y, h: 170, label: lg.label };
      var d0 = doorsHere()[0];
      if (!nr) return { text: lf ? 'Ra phố · ' + what : what, x: lf ? scene.exit.x : d0.x, y: lf ? scene.exit.y : G.HALL_DOOR_Y, h: lf ? 120 : 220, label: lf ? scene.exit.label : 'Vào phòng ' + d0.label };
      return { text: 'Vào cửa ' + nr.door.label + ' (cửa thứ ' + (nr.idx + 1) + ' từ trái) · ' + tName, x: nr.door.x, y: G.HALL_DOOR_Y, h: 230, label: 'Vào phòng ' + nr.door.label };
    }
    if (scene.kind === 'classroom') {
      var here = G.currentRoom, hn = G.NPCS[G.ROOM_TEACHER[here]];
      if (nr && here !== nr.door.room) return { text: 'Phòng này đã qua. Ra hành lang, sang phòng ' + nr.door.label, x: scene.exit.x, y: scene.exit.y, h: 120, label: scene.exit.label };
      var p = G.S.phong[here], hg = G.ROOMS[here] && G.ROOMS[here].group ? G.ROOMS[G.curSession(here)] : null;
      return { text: 'Gặp ' + hn.name + ' · ' + (hg ? 'Buổi ' + hg.n + ': Học → Luyện → Kiểm tra' : p ? 'Kiểm tra lại để đạt từ 8/10' : 'Học → Luyện → Kiểm tra'), x: TX(), y: TY() + 40, h: 220, label: 'Nói chuyện với ' + hn.name };
    }
    if (scene.kind === 'shop') return { text: 'Gặp ' + G.NPCS[scene.npc].name + ' và chọn một tình huống', x: talkPt().x, y: talkPt().y, h: scene.lay ? talkPt().y - scene.lay.front[1] - 40 : 220, label: 'Nói chuyện với ' + G.NPCS[scene.npc].name };
    return null;
  }
  var curGoal = null, lastGoalText = '';
  function updateQuest() {
    curGoal = goal();
    var q = document.getElementById('quest');
    if (!q) return;
    q.style.display = curGoal ? '' : 'none';
    if (curGoal && curGoal.text !== lastGoalText) { lastGoalText = curGoal.text; document.getElementById('quest-text').textContent = curGoal.text; }
  }
  /* bấm thanh nhiệm vụ: tự đi tới chỗ cần đến rồi làm luôn */
  G.goQuest = function () {
    if (!curGoal) return;
    var ts = triggers();
    for (var i = 0; i < ts.length; i++) if (ts[i].label === curGoal.label) {
      if (near === ts[i]) { ts[i].act(); return; }
      goTo(ts[i].x, ts[i].y + (scene.kind === 'city' ? 10 : 0), ts[i].act, ts[i].label); return;
    }
    goTo(curGoal.x, curGoal.y);
  };
  /* dấu 📍 trên đích; nếu đích ngoài màn hình thì mũi tên ở mép chỉ hướng */
  function drawGoalMark() {
    if (!curGoal) return;
    var t = Date.now() / 300, gx = curGoal.x, gy = curGoal.y - curGoal.h + Math.sin(t) * 8;
    var sx = (gx - cam.x) * zoom, sy = (gy - cam.y) * zoom, m = 36, top = 130, bot = 150;
    ctx.save();
    if (sx > m && sx < W - m && sy > top && sy < H - bot) {
      ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -cam.x * dpr * zoom, -cam.y * dpr * zoom);
      ctx.font = '44px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
      ctx.fillText('📍', gx, gy);
      ctx.strokeStyle = 'rgba(200,85,61,.7)'; ctx.lineWidth = 4;
      var r = 22 + (Math.sin(t) + 1) * 6; ctx.beginPath(); ctx.ellipse(curGoal.x, curGoal.y, r, r * 0.4, 0, 0, 6.283); ctx.stroke();
    } else {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var cx = W / 2, cy = (top + H - bot) / 2, dx = sx - cx, dy = sy - cy;
      var k = Math.min(Math.abs((W / 2 - m) / (dx || 1e-6)), Math.abs(((H - top - bot) / 2) / (dy || 1e-6)));
      var ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);
      ctx.translate(ax, ay); ctx.rotate(ang);
      ctx.fillStyle = 'rgba(200,85,61,.95)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -14); ctx.lineTo(-6, 0); ctx.lineTo(-12, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }


  /* ================= Thế giới sống: người đi đường, hiệu ứng ================= */
  var camSnap = true, town = [], fx = [], dustT = 0, birdT = 4, leafT = 0;
  var RAIN_LINES = [['Ugh, it\'s pouring!', 'Trời ơi, mưa như trút!'], ['Did you bring an umbrella?', 'Bạn có mang ô không?'], ['I\'m soaked!', 'Mình ướt sũng rồi!'], ['It\'s raining again.', 'Lại mưa nữa rồi.']];
  var LINES = [
    ['Morning!', 'Chào buổi sáng!'], ['Nice day, huh?', 'Trời đẹp nhỉ?'], ['Hey, how\'s it going?', 'Chào, dạo này sao rồi?'],
    ['Love your outfit!', 'Đồ bạn mặc đẹp ghê!'], ['Oops, sorry!', 'Ối, xin lỗi nha!'], ['Have a good one!', 'Chúc một ngày vui!'],
    ['Running late, gotta go!', 'Trễ rồi, phải đi đây!'], ['Is the café open yet?', 'Quán cà phê mở chưa nhỉ?'],
    ['Good luck at school!', 'Học tốt nhé!'], ['What a beautiful morning!', 'Buổi sáng đẹp quá!'],
    ['Excuse me, where\'s the bus stop?', 'Xin lỗi, bến xe buýt ở đâu vậy?'], ['See you around!', 'Gặp lại sau nhé!']
  ];
  function freeSpot() {
    var w = scene.walk;
    for (var i = 0; i < 40; i++) {
      var x = w.x0 + 40 + Math.random() * (w.x1 - w.x0 - 80), y = w.y0 + 60 + Math.random() * (w.y1 - w.y0 - 100);
      if (!blocked(x, y) && !blocked(x, y - 30)) return { x: x, y: y };
    }
    return { x: (w.x0 + w.x1) / 2, y: (w.y0 + w.y1) / 2 };
  }
  /* người đi đường: dùng bộ hình vẽ sẵn 3 hướng (person_<tên>_down/up/left.png, G.TOWNIE_SETS).
     Nhân vật ghép từ lớp hình (tóc, áo rời) bị lệch nên không dùng cho người đi đường nữa; chưa có hình thì phố vắng người. */
  function spawnTown() {
    town = [];
    var sets = (G.TOWNIE_SETS || []).filter(function (s) { return G.asset('person_' + s + '_down.png').ok; });
    if (scene.kind !== 'city' || !sets.length) return;
    var n = Math.min(sets.length, sceneId === 'home_en' ? 3 : 6), pick = G.shuffle(sets.slice());
    for (var i = 0; i < n; i++) {
      var sp = freeSpot(), tg = freeSpot();
      town.push({ set: pick[i], x: sp.x, y: sp.y, tx: tg.x, ty: tg.y, dir: 'down', t: Math.random() * 6, sp: 60 + Math.random() * 40, wait: Math.random() * 2, say: null, sayT: 0, talkCd: 5 + Math.random() * 15 });
    }
  }
  G.TOWNIE_SETS = G.TOWNIE_SETS || [];
  for (var tsI = 0; tsI < G.TOWNIE_SETS.length; tsI++) G.asset('person_' + G.TOWNIE_SETS[tsI] + '_down.png');   // tải sẵn
  function updateTown(dt) {
    for (var i = 0; i < town.length; i++) {
      var p = town[i];
      if (p.sayT > 0) p.sayT -= dt;
      p.talkCd -= dt;
      // đứng gần người chơi thì thỉnh thoảng chào (chỉ hiện chữ, bấm vào mới đọc to)
      var dx = P.x - p.x, dy = P.y - p.y;
      if (p.talkCd <= 0 && dx * dx + dy * dy < 170 * 170) { var LL = raining() && Math.random() < 0.6 ? RAIN_LINES : LINES; p.say = LL[Math.floor(Math.random() * LL.length)]; p.sayT = 3; p.talkCd = 18 + Math.random() * 15; p.wait = 1.5; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); }
      if (p.wait > 0) { p.wait -= dt; p.moving = false; continue; }
      var mx = p.tx - p.x, my = p.ty - p.y, d = Math.sqrt(mx * mx + my * my);
      if (d < 6) { p.wait = raining() ? 4 + Math.random() * 6 : 1 + Math.random() * 3; /* mưa: hay đứng lại che ô */ var tg = freeSpot(); p.tx = tg.x; p.ty = tg.y; p.moving = false; continue; }
      var st = Math.min(d, p.sp * (raining() ? 0.7 : 1) * dt), nx = p.x + mx / d * st, ny = p.y + my / d * st;
      if (blocked(nx, ny)) { var t2 = freeSpot(); p.tx = t2.x; p.ty = t2.y; p.wait = 0.5; p.moving = false; continue; }
      p.x = nx; p.y = ny; p.moving = true; p.t += dt;
      p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
    }
  }
  function drawProp(o) {
    shadow(o.x, o.y, o.r * 0.9 + 6);
    // cây đung đưa nhẹ trong gió
    var sway = /oak|palm|tree/.test(o.img) ? Math.sin(Date.now() / 900 + o.x) * 0.025 : 0;
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(sway); ctx.translate(-o.x, -o.y);
    G.drawAsset(ctx, o.img, o.x - o.s / 2, o.y - o.s * 0.96, o.s, o.s);
    ctx.restore();
  }
  function drawTownie(p) {
    shadow(p.x, p.y, 20);
    var d = p.dir === 'right' ? 'left' : p.dir, nm = 'person_' + p.set + '_' + d + '.png';
    if (!G.asset(nm).ok) nm = 'person_' + p.set + '_down.png';
    var S = 112, u = null, sw = 0, up = /_up\.png$/.test(nm);
    if (raining()) {
      if (p.uc === undefined) p.uc = Math.floor(Math.random() * 6);
      u = holdAt(nm, p.x - S / 2, p.y + 6 - S, S, p.dir === 'right', p.moving ? -Math.abs(Math.sin(p.t * 9)) * S * 0.028 : 0, /_left\.png$/.test(nm));
      sw = p.moving ? Math.sin(p.t * 9) * 0.035 : 0;
      umbrella(u, p.uc, sw, 'pole');
    }
    G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, nm, X, Y, S, S, p.dir === 'right'); }, p.x, p.y + 6, S, p.dir, p.t * 9, p.moving, 0.72);
    if (u) umbrella(u, p.uc, sw, 'top', !up);
    if (p.sayT > 0 && p.say) bubble(p.x, p.y - 108, p.say[0], Math.min(1, p.sayT * 2));
  }
  function bubble(x, y, text, a) {
    ctx.save(); ctx.globalAlpha = a;
    ctx.font = '700 18px -apple-system, system-ui, sans-serif';
    var w = ctx.measureText(text).width + 24;
    ctx.fillStyle = '#fff'; ctx.strokeStyle = 'rgba(27,33,64,.35)'; ctx.lineWidth = 2;
    G.roundRect(ctx, x - w / 2, y - 36, w, 34, 14); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x, y + 8); ctx.lineTo(x + 7, y - 3); ctx.fill();
    ctx.fillStyle = '#1b2140'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y - 19);
    ctx.restore();
  }
  /* bấm vào người đi đường: họ nói một câu (có giọng đọc), Kai dịch nghĩa */
  function tapTownie(w) {
    for (var i = 0; i < town.length; i++) {
      var p = town[i];
      if (Math.abs(w.x - p.x) < 40 && w.y < p.y + 10 && w.y > p.y - 110) {
        p.say = LINES[Math.floor(Math.random() * LINES.length)]; p.sayT = 3.5; p.wait = 2.5; p.talkCd = 10;
        var dx = P.x - p.x, dy = P.y - p.y; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        G.say(p.say[0], 'en'); G.kaiSay('"' + p.say[0] + '" nghĩa là: ' + p.say[1]);
        return true;
      }
    }
    return false;
  }
  /* hiệu ứng: bụi chân, lá rơi, chim bay */
  function updateFx(dt) {
    for (var i = fx.length - 1; i >= 0; i--) { var f = fx[i]; f.t += dt; if (f.k === 'leaf') { f.x += f.vx * dt; f.y += f.vy * dt; f.r += dt * 2; } if (f.k === 'bird') f.x += f.vx * dt; if (f.t > f.life) fx.splice(i, 1); }
    if (scene.kind !== 'city') return;
    leafT -= dt;
    if (leafT <= 0) { leafT = 0.6 + Math.random() * 0.8; var vw = W / zoom; fx.push({ k: 'leaf', x: cam.x + Math.random() * vw, y: cam.y - 10, vx: 20 + Math.random() * 30, vy: 40 + Math.random() * 30, r: Math.random() * 6, t: 0, life: 9, c: ['#e58fa5', '#f2bf3c', '#7fbf7a'][Math.floor(Math.random() * 3)] }); }
    birdT -= dt;
    if (birdT <= 0) { birdT = 12 + Math.random() * 14; var by = cam.y + 60 + Math.random() * 200; for (var b = 0; b < 4; b++) fx.push({ k: 'bird', x: cam.x - 60 - b * 26, y: by + (b % 2) * 18 + b * 6, vx: 140, t: 0, life: 14, ph: b }); }
  }
  function drawFx(kind) {
    for (var i = 0; i < fx.length; i++) {
      var f = fx[i]; if (f.k !== kind) continue;
      if (kind === 'dust') { var a = 1 - f.t / f.life; ctx.fillStyle = 'rgba(200,190,170,' + (0.45 * a) + ')'; ctx.beginPath(); ctx.ellipse(f.x, f.y, 6 + f.t * 18, (6 + f.t * 18) * 0.45, 0, 0, 6.283); ctx.fill(); }
      if (kind === 'leaf') { ctx.save(); ctx.translate(f.x + Math.sin(f.t * 2) * 12, f.y); ctx.rotate(f.r); ctx.fillStyle = f.c; ctx.globalAlpha = Math.min(1, (f.life - f.t)); ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.6, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
      if (kind === 'bird') { var fl = Math.sin(f.t * 10 + f.ph) * 6; ctx.strokeStyle = 'rgba(27,33,64,.65)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(f.x - 9, f.y - fl); ctx.quadraticCurveTo(f.x - 4, f.y - 2, f.x, f.y); ctx.quadraticCurveTo(f.x + 4, f.y - 2, f.x + 9, f.y - fl); ctx.stroke(); }
    }
  }
  /* lá rơi, chim bay và bóng mây trôi (vẽ trên cùng, theo camera) */
  /* ---------- thời tiết và buổi trong ngày (theo giờ Việt Nam) ----------
     Mỗi khung 3 giờ có thời tiết riêng, cố định trong khung đó: nắng / nhiều mây / mưa (khoảng 1/5 số khung).
     G.debugWeather('rain' | 'cloudy' | 'clear' | null) để xem thử. */
  var WX_FORCE = null, HOUR_FORCE = null;
  G.debugWeather = function (w, h) { WX_FORCE = w; HOUR_FORCE = h === undefined ? null : h; };
  function hourNow() { return HOUR_FORCE !== null ? HOUR_FORCE : G.vnParts().h; }
  G.weather = function () {
    if (WX_FORCE) return WX_FORCE;
    var p = G.vnParts(), seed = p.y * 1000 + p.m * 37 + p.d * 101 + Math.floor(p.h / 3) * 13;
    var r = Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
    return r < 0.2 ? 'rain' : r < 0.45 ? 'cloudy' : 'clear';
  };
  G.dayPart = function () {
    var h = hourNow();
    return h >= 5 && h < 10 ? 'sang' : h >= 10 && h < 14 ? 'trua' : h >= 14 && h < 17 ? 'chieu' : h >= 17 && h < 19 ? 'hoanghon' : 'toi';
  };
  var PART_NAME = { sang: '🌅 Sáng', trua: '☀️ Trưa', chieu: '🌤 Chiều', hoanghon: '🌇 Hoàng hôn', toi: '🌙 Tối' };
  function raining() { return scene && scene.kind === 'city' && G.weather() === 'rain'; }
  /* chiếc ô cầm trong tay (vẽ bằng code). Bàn tay lấy từ G.HANDS (vị trí bàn tay trên từng hình); cán đi từ bàn tay
     lên giữa tán, tán che trên đầu và nghiêng theo cán. Cán vẽ trước người (part 'pole': nằm sau bàn tay, sau thân),
     tán và nắm tay vẽ sau người (part 'top'), nên bàn tay nắm đúng cán ô. */
  var UCOL = ['#c8553d', '#2f7a63', '#4a68d8', '#e0a43a', '#b46fc0', '#1b2140'];
  /* img: tên hình đang vẽ; X, Y, S: khung hình; flip: hình lật; dy: độ nhún khi bước; side: hình nhìn ngang */
  function holdAt(img, X, Y, S, flip, dy, side) {
    var h = (G.HANDS && G.HANDS[img]) || [68, 74, '#f6c9a8', 6];
    var hx = X + (flip ? 100 - h[0] : h[0]) * S / 100, hy = Y + h[1] * S / 100 + (dy || 0), top = Y + h[3] * S / 100 + (dy || 0);
    var cx = X + S / 2;
    // nhìn trước / sau: cán dựng sát cạnh đầu, hơi ngả ra ngoài; nhìn ngang: ngả ra sau lưng như tựa lên vai
    var ux = side ? cx + (flip ? -1 : 1) * S * 0.12 : hx + (hx >= cx ? 1 : -1) * S * 0.04;
    return { hx: hx, hy: hy, ux: ux, uy: top - S * 0.025, S: S, col: h[2] };
  }
  /* ô của nhân vật ghép (thân body_<áo>_<hướng>.png): x, footY, h như G.drawAvatar; phase: nhịp bước (null = đứng) */
  function avatarHold(av, x, footY, h, dir, phase) {
    var d = dir === 'right' ? 'left' : dir;
    return holdAt('body_' + av.ao + '_' + d + '.png', x - h / 2, footY - h, h, dir === 'right', phase == null ? 0 : -Math.abs(Math.sin(phase)) * h * 0.028, d === 'left');
  }
  function umbrella(u, ci, sway, part, fist) {
    var S = u.S, R = S * 0.38, lw = Math.max(2, S * 0.024);
    var vx = u.ux - u.hx, vy = u.uy - u.hy, L = Math.sqrt(vx * vx + vy * vy), ang = Math.atan2(vx, -vy) + (sway || 0);
    ctx.save(); ctx.translate(u.hx, u.hy); ctx.rotate(ang);
    ctx.strokeStyle = '#3a2418'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (part === 'pole') {
      var ext = S * 0.075, hr = S * 0.035;
      ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(0, ext); ctx.lineTo(0, -L); ctx.stroke();      // cán
      ctx.beginPath(); ctx.arc(-hr, ext, hr, 0, Math.PI); ctx.stroke();                             // móc cong ở đuôi cán
    } else {
      var cy = -L, w = R / 2, i, a;
      ctx.fillStyle = UCOL[ci % UCOL.length]; ctx.lineWidth = Math.max(2, S * 0.026);
      ctx.beginPath(); ctx.moveTo(-R, cy); ctx.quadraticCurveTo(0, cy - R * 0.98, R, cy);         // vòm tán
      for (i = 3; i >= 0; i--) { a = -R + (i + 0.5) * w; ctx.quadraticCurveTo(a, cy - R * 0.2, a - w / 2, cy); }   // mép sóng
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = Math.max(1.5, S * 0.017);         // gân tán
      ctx.beginPath(); ctx.moveTo(0, cy - R * 0.48); ctx.lineTo(-R * 0.5, cy - R * 0.06); ctx.moveTo(0, cy - R * 0.48); ctx.lineTo(R * 0.5, cy - R * 0.06); ctx.stroke();
      ctx.fillStyle = '#3a2418'; ctx.beginPath(); ctx.arc(0, cy - R * 0.5, Math.max(2, S * 0.024), 0, 6.283); ctx.fill();   // núm
      if (fist) {   // các ngón tay nắm quanh cán (vẽ đè lên cán)
        ctx.fillStyle = u.col; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = Math.max(1.5, S * 0.016);
        ctx.beginPath(); ctx.ellipse(0, 0, S * 0.03, S * 0.036, 0, 0, 6.283); ctx.fill(); ctx.stroke();
      }
    }
    ctx.restore();
  }
  /* mưa: hạt mưa rơi theo màn hình + vũng nước bắn tung toé trên mặt đất */
  var drops = [], splash = [], rainLast = 0, flashT = 0, puddles = [];
  /* vũng nước trên mặt đất (toạ độ thế giới), gợn sóng khi mưa */
  function makePuddles() {
    puddles = [];
    if (!scene || scene.kind !== 'city') return;
    for (var i = 0; i < 9; i++) { var f = freeSpot(); puddles.push({ x: f.x, y: f.y, rx: 40 + Math.random() * 50, ry: 12 + Math.random() * 10, ph: Math.random() * 6 }); }
  }
  function drawPuddles() {
    if (!raining()) return;
    var t = Date.now() / 1000;
    for (var i = 0; i < puddles.length; i++) {
      var p = puddles[i];
      ctx.fillStyle = 'rgba(120,150,190,.28)'; ctx.beginPath(); ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(p.x - p.rx * 0.3, p.y - p.ry * 0.3, p.rx * 0.35, p.ry * 0.25, 0, 0, 6.283); ctx.fill();
      for (var k = 0; k < 2; k++) {
        var q = ((t * 0.9 + p.ph + k * 0.5) % 1), rx = q * p.rx * 0.7, ry = q * p.ry * 0.7;
        ctx.strokeStyle = 'rgba(230,240,255,' + (0.5 * (1 - q)).toFixed(2) + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(p.x + (k ? p.rx * 0.3 : -p.rx * 0.2), p.y, rx, ry, 0, 0, 6.283); ctx.stroke();
      }
    }
  }
  /* đèn đường sáng lên lúc hoàng hôn và buổi tối */
  var LAMPS = {
    city_en: [[663, 287], [871, 287], [663, 693], [871, 693], [663, 953], [447, 60], [1093, 420], [400, 540]],
    street_en: [[76, 530], [1492, 530], [344, 866], [1200, 866]]
  };
  function drawLamps() {
    var part = G.dayPart(); if (part !== 'toi' && part !== 'hoanghon') return;
    var L0 = LAMPS[sceneId];
    if (!L0 && scene.props) { L0 = []; for (var lp = 0; lp < scene.props.length; lp++) if (/lamp/.test(scene.props[lp].img)) L0.push([scene.props[lp].x, scene.props[lp].y - scene.props[lp].s * 0.85]); }
    if (!L0 || !L0.length) return;
    var a = (part === 'toi' ? 0.55 : 0.3) * (0.92 + Math.sin(Date.now() / 900) * 0.08);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < L0.length; i++) {
      var g = ctx.createRadialGradient(L0[i][0], L0[i][1], 4, L0[i][0], L0[i][1] + 40, 170);
      g.addColorStop(0, 'rgba(255,214,140,' + a + ')'); g.addColorStop(1, 'rgba(255,214,140,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(L0[i][0], L0[i][1] + 40, 170, 120, 0, 0, 6.283); ctx.fill();
    }
    ctx.restore();
  }
  function drawRain() {
    var now = Date.now(), dt = rainLast ? Math.min(0.05, (now - rainLast) / 1000) : 0; rainLast = now;
    var want = Math.round(W * H / 4200);
    // 3 lớp mưa: xa (mảnh, chậm, mờ) → gần (dày, nhanh, rõ); gió đổi hướng nhẹ theo thời gian
    while (drops.length < want) { var z = Math.random(); drops.push({ x: Math.random() * (W + 200) - 100, y: Math.random() * H, z: z, v: 500 + z * 700, l: 8 + z * 20 }); }
    var wind = 0.12 + Math.sin(now / 4000) * 0.08;
    ctx.save();
    var sk = ctx.createLinearGradient(0, 0, 0, H); sk.addColorStop(0, 'rgba(30,40,70,.30)'); sk.addColorStop(1, 'rgba(40,52,84,.14)');
    ctx.fillStyle = sk; ctx.fillRect(0, 0, W, H);
    for (var layer = 0; layer < 3; layer++) {
      ctx.strokeStyle = 'rgba(215,228,255,' + (0.25 + layer * 0.2) + ')'; ctx.lineWidth = 0.8 + layer * 0.7; ctx.beginPath();
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i]; if (Math.floor(d.z * 3) !== layer) continue;
        d.y += d.v * dt; d.x -= d.v * dt * wind;
        if (d.y > H) { if (layer === 2 && Math.random() < 0.35) splash.push({ x: d.x, y: H * (0.3 + Math.random() * 0.7), t: 0 }); d.y = -20; d.x = Math.random() * (W + 200) - 100; }
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.l * wind, d.y - d.l);
      }
      ctx.stroke();
    }
    // chớp xa thỉnh thoảng
    if (!flashT && Math.random() < dt / 35) flashT = 0.6;
    if (flashT > 0) { flashT = Math.max(0, flashT - dt); var fa = flashT > 0.45 ? 0.35 : flashT > 0.3 ? 0.05 : flashT > 0.2 ? 0.22 : 0; if (fa) { ctx.fillStyle = 'rgba(235,240,255,' + fa + ')'; ctx.fillRect(0, 0, W, H); } }
    ctx.strokeStyle = 'rgba(220,235,255,.6)'; ctx.lineWidth = 1.2;
    for (var j = splash.length - 1; j >= 0; j--) {
      var s0 = splash[j]; s0.t += dt; if (s0.t > 0.35) { splash.splice(j, 1); continue; }
      ctx.globalAlpha = 1 - s0.t / 0.35; ctx.beginPath(); ctx.ellipse(s0.x, s0.y, 3 + s0.t * 26, 1 + s0.t * 8, 0, 0, 6.283); ctx.stroke();
    }
    ctx.restore();
  }
  /* ánh sáng theo buổi: sáng hồng nhạt, trưa sáng gắt, chiều vàng, hoàng hôn cam tím */
  function drawDayTint() {
    var part = G.dayPart(), wx = G.weather(), c = null;
    if (part === 'sang') c = ['rgba(255,196,160,.16)', 'rgba(255,230,200,0)'];
    else if (part === 'trua') c = ['rgba(255,252,225,.10)', 'rgba(255,252,225,.04)'];
    else if (part === 'chieu') c = ['rgba(255,190,100,.14)', 'rgba(255,170,80,.06)'];
    else if (part === 'hoanghon') c = ['rgba(240,120,110,.26)', 'rgba(120,80,160,.18)'];
    if (c) { var g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (wx === 'cloudy') { ctx.fillStyle = 'rgba(90,100,120,.10)'; ctx.fillRect(0, 0, W, H); }
  }
  var wxSaid = '';
  function weatherHint() {
    if (scene.kind !== 'city') return;
    var key = G.vnDay() + G.weather() + Math.floor(G.vnParts().h / 3);
    if (wxSaid === key) return; wxSaid = key;
    var w = G.weather();
    if (w === 'rain') setTimeout(function () { G.kaiSay('🌧 Trời mưa rồi! Người ta hay nói: "It\'s raining." · "Don\'t forget your umbrella!" (Đừng quên mang ô!)'); }, 1800);
  }
  var hudT = 0;
  function hudWeather() {
    if (Date.now() - hudT < 4000) return; hudT = Date.now();
    var el = document.getElementById('hud-title'); if (!el) return;
    var w = G.weather(), ic = scene.kind === 'city' ? (w === 'rain' ? ' · 🌧 Mưa' : w === 'cloudy' ? ' · ☁️ Nhiều mây' : '') : '';
    el.textContent = scene.title + (scene.kind === 'city' ? ' · ' + PART_NAME[G.dayPart()] + ic : '');
  }

  function drawSky() {
    if (scene.kind !== 'city') return;
    ctx.save();
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -cam.x * dpr * zoom, -cam.y * dpr * zoom);
    var t = Date.now() / 1000;
    for (var c = 0; c < 3; c++) {   // bóng mây lướt qua mặt đất
      var cx = ((t * 18 + c * 700) % (scene.w + 800)) - 400, cy = 180 + c * 320;
      var g = ctx.createRadialGradient(cx, cy, 20, cx, cy, 260);
      g.addColorStop(0, 'rgba(20,30,60,.10)'); g.addColorStop(1, 'rgba(20,30,60,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, 300, 170, 0, 0, 6.283); ctx.fill();
    }
    drawFx('leaf'); drawFx('bird');
    var dt2 = (t * 70) % (scene.w + 600) - 300, dy2 = 260 + Math.sin(t * 1.3) * 18 + (sceneId === 'home_en' ? 200 : 0);
    if (G.asset('prop_drone.png').ok) G.drawAsset(ctx, 'prop_drone.png', dt2 - 45, dy2 - 45, 90, 90);
    ctx.restore();
  }
  /* chỗ đang đứng gần (cửa, người): vòng sáng vàng nhấp nháy */
  function drawNearGlow() {
    if (!near) return;
    var a = 0.35 + Math.sin(Date.now() / 220) * 0.15;
    var g = ctx.createRadialGradient(near.x, near.y, 4, near.x, near.y, 70);
    g.addColorStop(0, 'rgba(255,213,107,' + a + ')'); g.addColorStop(1, 'rgba(255,213,107,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(near.x, near.y, 80, 34, 0, 0, 6.283); ctx.fill();
  }

  function doorsHere() { return G[scene.doors] || []; }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- vẽ ---------- */
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1b2140';
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -cam.x * dpr * zoom, -cam.y * dpr * zoom);

    drawBackground();
    if (scene.kind === 'city') drawPuddles();

    // các thứ có chiều sâu: vẽ theo y tăng dần
    drawNearGlow();
    drawFx('dust');
    var items = [];
    if (scene.buildings) for (var i = 0; i < scene.buildings.length; i++) items.push({ y: scene.buildings[i].y, draw: drawBuilding, o: scene.buildings[i] });
    if (scene.props) for (var pi = 0; pi < scene.props.length; pi++) items.push({ y: scene.props[pi].y, draw: drawProp, o: scene.props[pi] });
    if (scene.kind === 'classroom' && G.currentRoom) items.push({ y: TY(), draw: drawTeacher, o: G.ROOM_TEACHER[G.currentRoom] });
    if (scene.kind === 'shop') items.push({ y: TY(), draw: drawTeacher, o: scene.npc });
    if (scene.room && G.drawRoomFront) items.push({ y: TY() + 30, draw: function () { G.drawRoomFront(ctx, scene); } });
    if (scene.lay && G.drawStandee) for (var sb = 0; sb < (scene.boards || []).length; sb++) items.push({ y: scene.boards[sb].y + 70, draw: function (b) { G.drawStandee(ctx, b); }, o: scene.boards[sb] });
    for (var ti = 0; ti < town.length; ti++) items.push({ y: town[ti].y, draw: drawTownie, o: town[ti] });
    if (G.S.nhanVat !== 'kai') items.push({ y: K.y, draw: drawKai });   // chơi bằng Kai thì không có robot đi theo
    var PP = people(); for (var pk = 0; pk < PP.length; pk++) items.push({ y: PP[pk].y, draw: drawPerson, o: PP[pk] });
    if (scene.gates) for (var gk = 0; gk < scene.gates.length; gk++) items.push({ y: scene.gates[gk].y, draw: drawGate, o: scene.gates[gk] });
    items.push({ y: P.y, draw: drawPlayer });
    items.sort(function (a, b) { return a.y - b.y; });
    for (var j = 0; j < items.length; j++) items[j].draw(items[j].o);
    if (scene.buildings) for (var bl = 0; bl < scene.buildings.length; bl++) drawBuildingLabel(scene.buildings[bl]);
    // huy hiệu rank lơ lửng trên đầu nhân vật
    if (G.drawRankBadge) G.drawRankBadge(ctx, P.x, P.y - (raining() ? 170 : 104), P.moving, Date.now() / 1000);   // trời mưa: huy hiệu nằm trên chiếc ô

    if (scene.kind === 'hall') drawDoorPlates();
    updateQuest();
    if (target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(target.x, target.y, 16, 8, 0, 0, 6.283); ctx.stroke(); }

    // ngày và đêm theo giờ Việt Nam
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var hr = hourNow();
    var night = scene.kind === 'city' ? (hr >= 19 || hr < 5 ? 0.42 : hr >= 18 ? 0.22 : hr < 6 ? 0.22 : 0) : 0;
    drawSky();
    if (scene.kind === 'city') {
      ctx.save(); ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -cam.x * dpr * zoom, -cam.y * dpr * zoom); drawLamps(); ctx.restore();
      drawDayTint(); if (raining()) drawRain();
    }
    hudWeather();
    if (night) {
      // ban đêm: trời tối, quanh nhân vật có quầng sáng như đèn đường
      var px = (P.x - cam.x) * zoom, py = (P.y - 50 - cam.y) * zoom;
      var gn = ctx.createRadialGradient(px, py, 40, px, py, Math.max(W, H) * 0.55);
      gn.addColorStop(0, 'rgba(20,24,60,0)'); gn.addColorStop(1, 'rgba(20,24,60,' + night + ')');
      ctx.fillStyle = gn; ctx.fillRect(0, 0, W, H);
    }
    // viền tối nhẹ quanh màn hình cho có chiều sâu
    var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(10,12,30,0)'); vg.addColorStop(1, 'rgba(10,12,30,.28)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    drawGoalMark();
    if (G.drawRadar) G.drawRadar({ scene: scene, id: sceneId, P: P, goal: curGoal, people: people(), talked: talkedToday, dpr: dpr });
    if (fade > 0) { ctx.fillStyle = 'rgba(27,33,64,' + fade + ')'; ctx.fillRect(0, 0, W, H); }
  }

  function drawBackground() {
    if (scene.room && G.drawRoom) { G.drawRoom(ctx, scene); return; }   // tiệm vẽ bằng code
    var a = G.asset(scene.bg);
    if (a.ok) { ctx.drawImage(a.img, 0, 0, scene.w, scene.h); return; }
    // nền tạm vẽ bằng code, kèm tên file cần đặt
    if (scene.kind === 'city') {
      ctx.fillStyle = '#cfe3c8'; ctx.fillRect(0, 0, scene.w, scene.h);
    } else {
      ctx.fillStyle = '#efe4d2'; ctx.fillRect(0, 0, scene.w, scene.h);
      ctx.fillStyle = '#d9c7a8'; ctx.fillRect(0, 0, scene.w, 400);
      ctx.fillStyle = '#c8b28c'; ctx.fillRect(0, 392, scene.w, 10);
      ctx.fillStyle = '#b89a6c'; ctx.fillRect(708, 990, 120, 34);
      if (scene.kind === 'hall') { var DD = doorsHere(); for (var d = 0; d < DD.length; d++) G.drawPlaceholder(ctx, G.roomOpen(d, DD) ? 'door_open.png' : 'door_locked.png', DD[d].x - 70, 120, 140, 190); }
      if (scene.kind === 'classroom') { ctx.fillStyle = '#2f5d50'; ctx.fillRect(468, 120, 600, 230); }
    }
    ctx.save();
    ctx.font = '600 22px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(27,33,64,.7)';
    ctx.textAlign = 'left';
    ctx.fillText('Ảnh tạm · cần file: ' + scene.bg, 24, scene.kind === 'city' ? 40 : 440);
    ctx.restore();
  }

  function drawBuilding(b) {
    var S = b.s || 300;
    if (b.s) shadow(b.x, b.y - 4, S * 0.36);   // nhà giấy: bóng mềm dưới đế
    G.drawAsset(ctx, b.img, b.x - S / 2, b.y + 2.5 - S * 0.975, S, S);   // chân hình (97,5% khung) đặt ở b.y
  }
  /* biển tên nhà vẽ sau cùng để nhân vật không che chữ */
  function drawBuildingLabel(b) {
    var label = b.name, w = Math.max(110, label.length * 13 + 30);
    // nhân vật đứng đè lên biển tên thì biển mờ đi để thấy mặt nhân vật
    var over = Math.abs(P.x - b.x) < w / 2 + 30 && P.y > b.y + 8 && P.y - 120 < b.y + 42;
    ctx.save(); if (over) ctx.globalAlpha = 0.3;
    ctx.fillStyle = b.go ? 'rgba(200,85,61,.95)' : 'rgba(27,33,64,.82)';
    G.roundRect(ctx, b.x - w / 2, b.y + 8, w, 34, 17); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 18px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, b.x, b.y + 26);
    ctx.restore();
  }

  function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.38, 0, 0, 6.283); ctx.fill(); }

  /* người đứng trên bản đồ để nói chuyện (G.PEOPLE): mẹ, hàng xóm, xe bánh, du khách, bảo vệ, cổng trường */
  function people() { return (G.PEOPLE && G.PEOPLE[sceneId]) || []; }
  function talkedToday(life) { var d = G.today(); return !!(d.sang && d.sang[life]); }
  /* xe bánh nhỏ vẽ bằng code: phía sau (cột, mái sọc) vẽ trước người bán, quầy vẽ sau để người bán đứng sau quầy */
  function drawStallBack(o) {
    var x = o.x, y = o.y - 6;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.ellipse(x, y + 10, 92, 18, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#3a2418'; ctx.fillRect(x - 78, y - 150, 6, 100); ctx.fillRect(x + 72, y - 150, 6, 100);
    ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 4;
    for (var i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#f8f4ee' : '#c8553d'; ctx.fillRect(x - 84 + i * 28, y - 176, 28, 28); }
    ctx.strokeRect(x - 84, y - 176, 168, 28);
    ctx.restore();
  }
  function drawStallFront(o) {
    var x = o.x, y = o.y - 6;
    ctx.save();
    ctx.fillStyle = '#f8f4ee'; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 4;
    G.roundRect(ctx, x - 80, y - 58, 160, 64, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2f7a63'; G.roundRect(ctx, x - 80, y - 10, 160, 16, 6); ctx.fill();
    ctx.font = '700 15px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c8553d'; ctx.fillText((o.icon || '🥐') + ' ' + o.stall, x, y - 32);
    ctx.restore();
  }
  /* biển chỉ đường ở cổng sang khu khác */
  function drawGate(g) {
    var x = g.x + (g.side === 'left' ? 26 : -26), y = g.y, t = Date.now() / 1000;
    ctx.save();
    shadow(x, y, 14);
    ctx.fillStyle = '#6b4226'; ctx.strokeStyle = '#3a2418'; ctx.lineWidth = 3; ctx.fillRect(x - 5, y - 112, 10, 112); ctx.strokeRect(x - 5, y - 112, 10, 112);
    ctx.font = '800 18px -apple-system, system-ui, sans-serif'; var w = ctx.measureText(g.sign).width + 28;
    var bx = Math.max(6, Math.min(scene.w - w - 6, x - w / 2));
    ctx.fillStyle = '#f8f2eb'; ctx.lineWidth = 4; G.roundRect(ctx, bx, y - 150, w, 42, 12); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8553d'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(g.sign, bx + w / 2, y - 128);
    // mũi tên nhấp nháy dưới đất chỉ hướng đi tiếp
    var dx = g.side === 'left' ? -1 : 1, ax = g.x + dx * (8 + Math.sin(t * 4) * 6);
    ctx.fillStyle = 'rgba(200,85,61,' + (0.55 + Math.sin(t * 4) * 0.25).toFixed(2) + ')';
    ctx.beginPath(); ctx.moveTo(ax + dx * 22, y + 18); ctx.lineTo(ax - dx * 6, y + 4); ctx.lineTo(ax - dx * 6, y + 32); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function talkBubble(x, y) {
    var t = Date.now() / 1000, by = y + Math.sin(t * 3 + x) * 4;
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1b2140'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, by, 18, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💬', x, by + 1);
    ctx.restore();
  }
  function nameTag(text, x, y) {
    ctx.save(); ctx.font = '700 15px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width + 18; ctx.fillStyle = 'rgba(27,33,64,.8)'; G.roundRect(ctx, x - w / 2, y - 12, w, 24, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(text, x, y); ctx.restore();
  }
  /* tiệm nhỏ có hình toà nhà: vẽ toà nhà thay cho quầy, người bán ở bên trong */
  function drawShopHouse(o) {
    var S = o.bs || 210;
    G.drawAsset(ctx, o.bimg, o.x - S / 2, o.y + 14 - S, S, S);
    if (!talkedToday(o.life)) talkBubble(o.x + S * 0.37, o.y - S + 24);
    nameTag((o.icon || '') + ' ' + o.stall, o.x, o.y + 28);
  }
  /* NPC có ảnh riêng (ChatGPT) thì dùng ảnh, chưa có thì ghép từ lớp hình */
  function npcImg(n) { return n.img || null; }   // có ảnh riêng thì luôn dùng ảnh (đang tải thì chưa vẽ, không hiện nhân vật ghép)
  function drawPerson(o) {
    var n = G.NPCS[o.npc]; if (!n) return;
    if (o.bimg && G.asset(o.bimg).ok) { drawShopHouse(o); return; }
    var im = npcImg(n); if (!im && !n.av) return;
    if (o.stall) drawStallBack(o);
    var dx = P.x - o.x, dy = P.y - o.y, close = dx * dx + dy * dy < 200 * 200;
    var dir = close ? (Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down')) : o.dir;
    var py = o.stall ? o.y - 40 : o.y;   // người bán đứng sau quầy
    var top = im ? 138 : 118;
    shadow(o.x, py, 20);
    var u = raining() && !o.stall ? (im ? holdAt(im, o.x - 62, py + 4 - 124, 124, false, 0, false) : avatarHold(n.av, o.x, py + 4, 104, dir, null)) : null;
    if (u) umbrella(u, (o.x >> 3) % 6, 0, 'pole');
    if (im) G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, im, X, Y, S, S); }, o.x, py + 4, 124, 'down', 0, false, 0.72);
    else G.drawAvatar(ctx, n.av, o.x, py + 4, 104, dir, 0, false);
    if (u) umbrella(u, (o.x >> 3) % 6, 0, 'top', im || dir !== 'up');
    if (o.stall) { drawStallFront(o); py = o.y + 6; }   // tên người bán nằm dưới quầy
    // bong bóng 💬 nhấp nhô khi hôm nay chưa nói chuyện
    if (!talkedToday(o.life)) talkBubble(o.x, o.stall ? o.y - 210 : py - top);
    nameTag(n.name, o.x, py + 22);
  }
  /* lộ trình buổi sáng: ở nhà với mẹ → chào hàng xóm → mua bánh sáng (mỗi ngày gợi ý một lần) */
  var MORNING = ['en-home', 'en-neighbor', 'en-bakery'];
  function morningNext() {
    for (var i = 0; i < MORNING.length; i++) if (G.LIFE[MORNING[i]] && !talkedToday(MORNING[i])) return MORNING[i];
    return null;
  }
  function personOf(life) { var PP = people(); for (var i = 0; i < PP.length; i++) if (PP[i].life === life) return PP[i]; return null; }

  function drawPlayer() {
    // bóng dưới chân co giãn theo nhịp bước
    var sh = P.moving ? 1 - Math.abs(Math.sin(P.t * 14)) * 0.12 : 1;
    if (G.S.nhanVat === 'custom' && G.S.avatar) {
      shadow(P.x, P.y, 24 * sh);
      var ua = raining() ? avatarHold(G.S.avatar, P.x, P.y + 4, 112, P.dir, P.moving ? P.t * 14 : null) : null, swa = P.moving ? Math.sin(P.t * 14) * 0.035 : 0;
      if (ua) umbrella(ua, 0, swa, 'pole');
      G.drawAvatar(ctx, G.S.avatar, P.x, P.y + 4, 112, P.dir, P.t * 14, P.moving);
      if (ua) umbrella(ua, 0, swa, 'top', P.dir !== 'up');
      return;
    }
    var who = G.S.nhanVat || 'han';
    if (who === 'kai') {   // chơi bằng robot Kai: dùng hình Kai 3 hướng, to hơn khi đi theo
      var kd = P.dir, kside = kd === 'left' || kd === 'right';
      var kn = kd === 'up' && G.asset('kai_up.png').ok ? 'kai_up.png' : kside && G.asset('kai_left.png').ok ? 'kai_left.png' : 'kai_follow.png';
      var kf = kn === 'kai_left.png' ? kd === 'right' : kd === 'left';
      var kb = G.hopLift(104, P.t * 14, P.moving);
      shadow(P.x, P.y, 22 * sh);
      var ku = raining() ? holdAt(kn, P.x - 52, P.y + 4 - 104 - kb, 104, kf, 0, kn === 'kai_left.png') : null;
      if (ku) umbrella(ku, 3, 0, 'pole');
      G.hopDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, kn, X, Y, S, S, kf); }, P.x, P.y + 4, 104, P.t * 14, P.moving);
      if (ku) umbrella(ku, 3, 0, 'top', kd !== 'up');
      return;
    }
    var dir = P.dir === 'right' ? 'left' : P.dir, flip = P.dir === 'right';
    var name = 'player_' + who + '_' + dir + '.png';
    shadow(P.x, P.y, 26 * sh);
    var paper = G.PAPER_FIG[who];
    var u = raining() ? holdAt(name, P.x - 60, P.y + 8 - 120, 120, flip, P.moving ? -(paper ? G.hopLift(120, P.t * 14, true) : Math.abs(Math.sin(P.t * 14)) * 120 * 0.028) : 0, dir === 'left') : null;
    var sw = P.moving ? Math.sin(P.t * 14) * (paper ? 0.07 : 0.03) : 0;   // tượng giấy: ô lắc cùng nhịp với người
    if (u) umbrella(u, 0, sw, 'pole');
    if (paper) G.hopDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, name, X, Y, S, S, flip); }, P.x, P.y + 8, 120, P.t * 14, P.moving);
    // tay cầm ô giữ yên (nhìn ngang: tay phía trước; nhìn trước / sau: tay bên phải màn hình)
    else G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, name, X, Y, S, S, flip); }, P.x, P.y + 8, 120, P.dir, P.t * 14, P.moving, 0.72, G.ARMS[name], u ? (dir === 'left' ? 0 : 1) : -1);
    if (u) umbrella(u, 0, sw, 'top', dir !== 'up');
  }
  function drawKai() {
    var bob = Math.sin(Date.now() / 260) * 4, dir = K.dir || 'down';
    shadow(K.x, K.y, 16);
    // có hình riêng từng hướng (kai_up / kai_left) thì dùng; chưa có thì lật hình mặt trước theo hướng đi
    var side = dir === 'left' || dir === 'right';
    var name = dir === 'up' && G.asset('kai_up.png').ok ? 'kai_up.png' : side && G.asset('kai_left.png').ok ? 'kai_left.png' : 'kai_follow.png';
    var flip = name === 'kai_left.png' ? dir === 'right' : dir === 'left';
    if (G.PAPER_FIG.kai) { G.hopDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, name, X, Y, S, S, flip); }, K.x, K.y - 6, 76, (K.t || 0) * 14, K.moving); return; }
    var tilt = K.moving ? (dir === 'left' ? -0.12 : dir === 'right' ? 0.12 : 0) : 0;
    ctx.save(); ctx.translate(K.x, K.y - 44 + bob); ctx.rotate(tilt); ctx.translate(-K.x, -(K.y - 44 + bob));
    G.drawAsset(ctx, name, K.x - 38, K.y - 82 + bob, 76, 76, flip);
    ctx.restore();
  }
  function drawTeacher(id) {
    var n = G.NPCS[id];
    var tx = TX(), ty = TY();
    shadow(tx, ty, 34);
    var im = npcImg(n);
    if (im) G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, im, X, Y, S, S); }, tx, ty, 170, 'down', 0, false, 0.72);
    else if (n.av) G.drawAvatar(ctx, n.av, tx, ty + 4, 150, 'down', 0, false);
    var ly = scene.lay ? ty - 186 : ty + 8;   // tiệm có ảnh: quầy che phía dưới nên tên đặt trên đầu
    ctx.fillStyle = 'rgba(27,33,64,.85)';
    G.roundRect(ctx, tx - 70, ly, 140, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 17px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.name, tx, ly + 15);
  }
  function drawDoorPlates() {
    var DR = doorsHere();
    for (var d = 0; d < DR.length; d++) {
      var door = DR[d], open = G.roomOpen(d, DR), p = G.S.phong[door.room], rg = G.ROOMS[door.room];
      var stars = p ? (p.sao === 3 ? '★★★' : p.sao === 2 ? '★★☆' : p.sao === 1 ? '★☆☆' : '') : '';
      if (rg && rg.group) { var dn = 0; for (var q = 0; q < rg.group.length; q++) if (G.roomPassed(rg.group[q])) dn++; stars = dn ? dn + '/' + rg.group.length + ' buổi' : ''; }
      // khoá xích trên cửa chưa mở (có hình door_lock.png thì vẽ, chưa có thì chỉ hiện biển 🔒)
      if (!open && G.asset('door_lock.png').ok) G.drawAsset(ctx, 'door_lock.png', door.x - 70, 120, 140, 140);
      ctx.fillStyle = open ? 'rgba(47,122,99,.95)' : 'rgba(27,33,64,.85)';
      G.roundRect(ctx, door.x - 64, 250, 128, 50, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 19px -apple-system, system-ui, sans-serif';
      var lbl = (open ? '' : '🔒 ') + door.label;
      if (ctx.measureText(lbl).width > 118) ctx.font = '800 15px -apple-system, system-ui, sans-serif';
      ctx.fillText(lbl, door.x, 266);
      ctx.font = '600 15px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#ffd56b';
      ctx.fillText(stars || (open ? 'Đang mở' : 'Khoá'), door.x, 287);
    }
  }

  /* ---------- điều khiển ---------- */
  function toWorld(cx, cy) { var r = cv.getBoundingClientRect(); return { x: (cx - r.left) / zoom + cam.x, y: (cy - r.top) / zoom + cam.y }; }

  function tapAt(cx, cy) {
    var w = toWorld(cx, cy);
    if (tapTownie(w)) return;
    var ts = triggers(), hit = null;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      // chạm vào nhà / cửa / NPC: đi tới rồi làm luôn
      var dx = w.x - t.x, dy = w.y - t.y;
      var hitR = t.npc ? 120 : scene.kind === 'hall' && t.y === G.HALL_DOOR_Y ? 110 : 90;
      if (t.board) { if (Math.abs(w.x - t.board.x) < 110 && Math.abs(w.y - t.board.y) < 90) { hit = t; break; } continue; }   // bấm thẳng vào bảng trên tường
      if (Math.abs(dx) < hitR && dy > -(t.tall ? t.tall + 40 : 260) && dy < 60) { hit = t; break; }
    }
    if (hit) goTo(hit.x, hit.y + (scene.kind === 'city' ? 10 : 0), hit.act, hit.label);
    else goTo(w.x, w.y);
  }

  function bindInput() {
    cv.addEventListener('click', function (e) { tapAt(e.clientX, e.clientY); });
    var base = document.getElementById('joy'), knob = document.getElementById('joy-knob');
    function jm(e) {
      var t = e.touches ? e.touches[0] : e;
      var r = base.getBoundingClientRect();
      var dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
      var m = Math.sqrt(dx * dx + dy * dy), max = r.width / 2;
      if (m > max) { dx = dx / m * max; dy = dy / m * max; }
      joy.dx = dx / max; joy.dy = dy / max;
      knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      e.preventDefault();
    }
    function je() { joy.on = false; joy.dx = 0; joy.dy = 0; knob.style.transform = ''; }
    base.addEventListener('touchstart', function (e) { joy.on = true; jm(e); }, { passive: false });
    base.addEventListener('touchmove', jm, { passive: false });
    base.addEventListener('touchend', je);
    base.addEventListener('touchcancel', je);
    base.addEventListener('mousedown', function (e) {
      joy.on = true; jm(e);
      function mv(ev) { jm(ev); }
      function up() { je(); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); }
      window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
    });
    var MAP = { ArrowLeft: 'l', ArrowRight: 'r', ArrowUp: 'u', ArrowDown: 'd', a: 'l', d: 'r', w: 'u', s: 'd' };
    window.addEventListener('keydown', function (e) {
      if (document.getElementById('panel').className.indexOf('open') >= 0 || !running) return;
      if (MAP[e.key]) { keys[MAP[e.key]] = true; e.preventDefault(); }
      if ((e.key === 'Enter' || e.key === ' ') && near) { e.preventDefault(); near.act(); }
    });
    window.addEventListener('keyup', function (e) { if (MAP[e.key]) keys[MAP[e.key]] = false; });
  }

  G.doNear = function () { if (near) near.act(); };
  /* để thử tự động: vị trí nhân vật, camera, cảnh, chỗ tương tác gần nhất */
  G.debugGo = function (x, y) { goTo(x, y); return { path: path.length + (target ? 1 : 0) }; };
  G.debugTown = function () { return town.map(function (t) { return { x: Math.round(t.x), y: Math.round(t.y), av: t.av }; }); };
  G.debugState = function () { return { target: !!target, moving: P.moving, x: P.x, y: P.y, cx: cam.x, cy: cam.y, zoom: zoom, scene: sceneId, near: near ? near.label : null }; };
})();
