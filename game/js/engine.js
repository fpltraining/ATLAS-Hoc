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
  G.enterScene = function (id, at) {
    scene = G.SCENES[id]; sceneId = id;
    resize(); // màn bản đồ vừa hiện ra: đo lại kích thước canvas
    var sp = at || scene.spawn || { x: scene.w / 2, y: scene.walk.y1 - 40 };
    var wk = scene.walk;   // luôn đặt nhân vật trong vùng đi được
    P.x = clamp(sp.x, wk.x0 + 5, wk.x1 - 5); P.y = clamp(sp.y, wk.y0 + 5, wk.y1 - 5); P.dir = sp.dir || 'up';
    K.x = P.x - 50; K.y = P.y + 30;
    target = null; pending = null; fade = 1;
    G.S.viTri = { canh: id, x: Math.round(P.x), y: Math.round(P.y) };
    G.save();
    camSnap = true; spawnTown(); fx = [];
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
        var lb = b.ride === 'bus' ? 'Đợi xe buýt' + (b.toward === 'home' ? ' về nhà' : ' tới trường') : b.ride === 'metro' ? 'Vào ga tàu điện' : b.home ? 'Nhà của bạn' : 'Vào ' + b.name;
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
      list.push({ x: TX(), y: TY() + 40, r: 110, npc: nid, label: 'Nói chuyện với ' + G.NPCS[nid].name, act: function () { G.openLife(scene.life); } });
    }
    if (scene.kind === 'classroom' && G.currentRoom) {
      var tid = G.ROOM_TEACHER[G.currentRoom];
      if (tid) list.push({ x: TX(), y: TY() + 40, r: 110, npc: tid, label: 'Nói chuyện với ' + G.NPCS[tid].name, act: function () { G.openLesson(G.currentRoom); } });
    }
    if (scene.exit) list.push({ x: scene.exit.x, y: scene.exit.y, r: 70, label: scene.exit.label, act: useExit });
    return list;
  }

  /* lời Kai khi vào hành lang: chỉ phòng nên học tiếp */
  function hallHint() {
    var d = doorsHere(), zh = scene.city === 'zh';
    for (var i = 0; i < d.length; i++) if (!G.roomPassed(d[i].room)) return i === 0 ? 'Đây là ' + scene.title + '. Phòng ' + d[0].label + ' ở cửa đầu tiên bên trái!' : 'Phòng nên học tiếp: ' + d[i].label + ' (cửa thứ ' + (i + 1) + ' từ trái sang).';
    return zh ? 'Bạn đã tốt nghiệp HSK1! HSK2 sẽ mở ở bản cập nhật sau.' : 'Bạn đã tốt nghiệp A1! Cấp A2 sẽ mở ở bản cập nhật sau.';
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
    if (b.home) { G.kaiSay(sceneId === 'home_en' ? 'Nhà của bạn đây. Hôm nay đi học nhé: ra bến xe buýt hoặc ga tàu điện!' : ''); return; }
    if (b.go) { G.sfx('door'); G.enterScene(b.go.scene, { x: b.go.x, y: b.go.y, dir: 'up' }); G.kaiSay(hallHint()); }
    else G.kaiSay(b.soon);
  }

  var lastDoor = 0;
  function useDoor(idx) {
    var door = doorsHere()[idx];
    if (!G.roomOpen(idx, doorsHere())) { G.sfx('wrong'); G.kaiSay('Cửa ' + door.label + ' còn khoá. Qua bài kiểm tra phòng trước (từ 8/10) để mở nhé.'); return; }
    if (!G.ROOMS[door.room]) { G.kaiSay('Phòng ' + door.label + ' sẽ có trong bản cập nhật sau.'); return; }
    lastDoor = idx;
    G.currentRoom = door.room;
    G.sfx('door');
    G.enterScene(scene.classroom, { x: 768, y: 930, dir: 'up' });
    var t = G.NPCS[G.ROOM_TEACHER[door.room]];
    G.kaiSay('Đi lên gặp ' + t.name + ' rồi bấm "Nói chuyện" để bắt đầu học.');
  }

  function useExit() {
    var to = scene.exit.to;
    G.sfx('door');
    if (to.building) {
      var bs = G.SCENES[to.scene].buildings;
      for (var i = 0; i < bs.length; i++) if (bs[i].id === to.building) { G.enterScene(to.scene, { x: bs[i].x, y: bs[i].y + 70, dir: 'down' }); return; }
    }
    if (to.door) { G.enterScene(to.scene, { x: G[G.SCENES[to.scene].doors][lastDoor].x, y: G.HALL_DOOR_Y + 60, dir: 'down' }); return; }
    G.enterScene(to.scene);
  }

  /* ---------- va chạm ---------- */
  function blocked(x, y) {
    var w = scene.walk;
    if (x < w.x0 || x > w.x1 || y < w.y0 || y > w.y1) return true;
    if (scene.buildings) {
      for (var i = 0; i < scene.buildings.length; i++) {
        var b = scene.buildings[i];
        if (x > b.x - 125 && x < b.x + 125 && y > b.y - 190 && y < b.y - 4) return true;
      }
    }
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
    if (joy.on && (Math.abs(joy.dx) > 0.15 || Math.abs(joy.dy) > 0.15)) { vx = joy.dx; vy = joy.dy; target = null; pending = null; }
    else if (keys.l || keys.r || keys.u || keys.d) { vx = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); vy = (keys.d ? 1 : 0) - (keys.u ? 1 : 0); target = null; pending = null; }
    else if (target) {
      var tx = target.x - P.x, ty = target.y - P.y, dist = Math.sqrt(tx * tx + ty * ty);
      if (dist < 8 || (pending && near && near.label === pendingLabel)) {
        target = null;
        if (pending) { var p = pending; pending = null; p(); }
      } else { vx = tx / dist; vy = ty / dist; }
    }
    var len = Math.sqrt(vx * vx + vy * vy);
    P.moving = len > 0.01;
    if (P.moving) {
      dustT -= dt; if (dustT <= 0) { dustT = 0.22; fx.push({ k: 'dust', x: P.x + (Math.random() - 0.5) * 14, y: P.y + 2, t: 0, life: 0.5 }); }
      vx /= Math.max(1, len); vy /= Math.max(1, len);
      var step = SPEED * dt;
      var moved = tryMove(vx, vy, step);
      if (!moved && target) {
        // lách vòng vật cản: thử xoay hướng đi dần sang trái hoặc phải, nhớ phía đã chọn cho mượt
        var base = [0.6, 1.2, 1.5708, 2.1];
        var angs = [];
        for (var bi = 0; bi < base.length; bi++) { if (detour) angs.push(detour * base[bi]); else { angs.push(base[bi]); angs.push(-base[bi]); } }
        if (detour) for (var bj = 0; bj < base.length; bj++) angs.push(-detour * base[bj]);
        for (var ai = 0; ai < angs.length && !moved; ai++) {
          var c = Math.cos(angs[ai]), sn = Math.sin(angs[ai]);
          var rx = vx * c - vy * sn, ry = vx * sn + vy * c;
          if (tryMove(rx, ry, step)) { moved = true; detour = angs[ai] > 0 ? 1 : -1; vx = rx; vy = ry; }
        }
        if (!moved) {
          if (pending && near) { var q = pending; pending = null; target = null; q(); }
          else target = null;
        }
      } else if (moved && target) { stuckFree += dt; if (stuckFree > 0.6) { detour = 0; stuckFree = 0; } }
      if (Math.abs(vx) > Math.abs(vy)) P.dir = vx < 0 ? 'left' : 'right'; else P.dir = vy < 0 ? 'up' : 'down';
      P.t += dt;
    }
    // Kai đi theo sau, cách một khoảng
    var kx = P.x - 60 - K.x, ky = P.y + 20 - K.y, kd = Math.sqrt(kx * kx + ky * ky);
    if (kd > 30) { K.x += (kx / kd) * Math.min(kd, SPEED * 0.95 * dt * (kd > 160 ? 1.6 : 1)); K.y += (ky / kd) * Math.min(kd, SPEED * 0.95 * dt * (kd > 160 ? 1.6 : 1)); }

    // chỗ tương tác gần nhất → nút hành động
    var ts = triggers(), best = null, bd = 1e9;
    for (var i = 0; i < ts.length; i++) { var dx = ts[i].x - P.x, dy = ts[i].y - P.y, d = Math.sqrt(dx * dx + dy * dy); if (d < ts[i].r && d < bd) { bd = d; best = ts[i]; } }
    if (best !== near) { near = best; G.showAction(near); }

    // camera: phóng đủ để ảnh nền phủ kín màn hình
    zoom = Math.max(baseZoom, W / scene.w, H / scene.h);
    var vw = W / zoom, vh = H / zoom;
    var cx = clamp(P.x - vw / 2, 0, Math.max(0, scene.w - vw)) - (vw > scene.w ? (vw - scene.w) / 2 : 0);
    var cy = clamp(P.y - vh / 2, 0, Math.max(0, scene.h - vh)) - (vh > scene.h ? (vh - scene.h) / 2 : 0);
    // camera đi theo mượt (trễ nhẹ), vào cảnh mới thì đặt ngay
    if (camSnap) { cam.x = cx; cam.y = cy; camSnap = false; }
    else { var kf = Math.min(1, dt * 7); cam.x += (cx - cam.x) * kf; cam.y += (cy - cam.y) * kf; }
    updateTown(dt); updateFx(dt);
    if (fade > 0) fade = Math.max(0, fade - dt * 3);
  }

  var detour = 0, stuckFree = 0;
  function tryMove(dx, dy, step) {
    var nx = P.x + dx * step, ny = P.y + dy * step;
    if (!blocked(nx, ny)) { P.x = nx; P.y = ny; return true; }
    return false;
  }

  /* vị trí giáo viên trong lớp (theo ảnh lớp học) */
  function TX() { return (scene.teacher || {}).x || 768; }
  function TY() { return (scene.teacher || {}).y || 520; }


  /* ---------- Việc tiếp theo: tính theo tiến độ, chỉ đường trong cảnh hiện tại ---------- */
  function bld(id) { var bs = scene.buildings || []; for (var i = 0; i < bs.length; i++) if (bs[i].id === id) return bs[i]; return null; }
  function nextRoom() {
    var d = G.EN_HALL_DOORS;
    for (var i = 0; i < d.length; i++) if (G.ROOMS[d[i].room] && !G.roomPassed(d[i].room)) return { door: d[i], idx: i };
    return null;
  }
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
    var what = nr ? 'Học phòng ' + nr.door.label + ' với ' + tName : lf ? 'Nói chuyện ở ' + G.LIFE[lf].title : 'Ôn lại một phòng bất kỳ để lấy thêm sao';
    var id = sceneId;
    if (id === 'home_en') { var bs = bld('busstop'); return { text: 'Ra bến xe buýt đi tới trường · ' + what, x: bs.x, y: bs.y + 18, h: 230, label: 'Đợi xe buýt tới trường' }; }
    if (scene.city === 'zh') { var ap = bld('airport'); return ap ? { text: 'Bay về Brightford để học tiếng Anh', x: ap.x, y: ap.y + 18, h: 260, label: 'Vào Sân bay' } : (scene.exit ? { text: 'Ra ngoài, bay về Brightford', x: scene.exit.x, y: scene.exit.y, h: 120, label: scene.exit.label } : null); }
    if (id === 'city_en') {
      if (!nr && lf) { var lb = null, bs2 = scene.buildings; for (var i = 0; i < bs2.length; i++) if (bs2[i].life === lf) lb = bs2[i]; if (lb) return { text: what + ' (+20 XP mỗi tình huống)', x: lb.x, y: lb.y + 18, h: 260, label: 'Vào ' + lb.name }; }
      var sc = bld('school'); return { text: 'Vào Trường Anh ngữ · ' + what, x: sc.x, y: sc.y + 18, h: 260, label: 'Vào ' + sc.name };
    }
    if (scene.kind === 'hall') {
      if (!nr) return { text: lf ? 'Ra phố · ' + what : what, x: lf ? scene.exit.x : G.EN_HALL_DOORS[0].x, y: lf ? scene.exit.y : G.HALL_DOOR_Y, h: lf ? 120 : 220, label: lf ? scene.exit.label : 'Vào phòng ' + G.EN_HALL_DOORS[0].label };
      return { text: 'Vào cửa ' + nr.door.label + ' (cửa thứ ' + (nr.idx + 1) + ' từ trái) · ' + tName, x: nr.door.x, y: G.HALL_DOOR_Y, h: 230, label: 'Vào phòng ' + nr.door.label };
    }
    if (scene.kind === 'classroom') {
      var here = G.currentRoom, hn = G.NPCS[G.ROOM_TEACHER[here]];
      if (nr && here !== nr.door.room) return { text: 'Phòng này đã qua. Ra hành lang, sang phòng ' + nr.door.label, x: scene.exit.x, y: scene.exit.y, h: 120, label: scene.exit.label };
      var p = G.S.phong[here];
      return { text: 'Gặp ' + hn.name + ' · ' + (p ? 'Kiểm tra lại để đạt từ 8/10' : 'Học → Luyện → Kiểm tra'), x: TX(), y: TY() + 40, h: 220, label: 'Nói chuyện với ' + hn.name };
    }
    if (scene.kind === 'shop') return { text: 'Gặp ' + G.NPCS[scene.npc].name + ' và chọn một tình huống', x: TX(), y: TY() + 40, h: 220, label: 'Nói chuyện với ' + G.NPCS[scene.npc].name };
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
      target = { x: ts[i].x, y: ts[i].y + (scene.kind === 'city' ? 10 : 0) }; pending = ts[i].act; pendingLabel = ts[i].label; return;
    }
    target = { x: curGoal.x, y: curGoal.y }; pending = null;
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
  var LINES = [
    ['Morning!', 'Chào buổi sáng!'], ['Nice day, huh?', 'Trời đẹp nhỉ?'], ['Hey, how\'s it going?', 'Chào, dạo này sao rồi?'],
    ['Love your outfit!', 'Đồ bạn mặc đẹp ghê!'], ['Oops, sorry!', 'Ối, xin lỗi nha!'], ['Have a good one!', 'Chúc một ngày vui!'],
    ['Running late, gotta go!', 'Trễ rồi, phải đi đây!'], ['Is the café open yet?', 'Quán cà phê mở chưa nhỉ?'],
    ['Good luck at school!', 'Học tốt nhé!'], ['What a beautiful morning!', 'Buổi sáng đẹp quá!'],
    ['Excuse me, where\'s the bus stop?', 'Xin lỗi, bến xe buýt ở đâu vậy?'], ['See you around!', 'Gặp lại sau nhé!']
  ];
  G.TOWN_LINES = LINES;
  function freeSpot() {
    var w = scene.walk;
    for (var i = 0; i < 40; i++) {
      var x = w.x0 + 40 + Math.random() * (w.x1 - w.x0 - 80), y = w.y0 + 60 + Math.random() * (w.y1 - w.y0 - 100);
      if (!blocked(x, y) && !blocked(x, y - 30)) return { x: x, y: y };
    }
    return { x: (w.x0 + w.x1) / 2, y: (w.y0 + w.y1) / 2 };
  }
  function spawnTown() {
    town = [];
    if (scene.kind !== 'city' || !G.randomAvatar || !G.asset('body_hoodie_down.png').ok) return;
    var n = sceneId === 'home_en' ? 3 : 6;
    for (var i = 0; i < n; i++) {
      var sp = freeSpot(), tg = freeSpot();
      town.push({ av: G.randomAvatar(), x: sp.x, y: sp.y, tx: tg.x, ty: tg.y, dir: 'down', t: Math.random() * 6, sp: 60 + Math.random() * 40, wait: Math.random() * 2, say: null, sayT: 0, talkCd: 5 + Math.random() * 15 });
    }
  }
  function updateTown(dt) {
    for (var i = 0; i < town.length; i++) {
      var p = town[i];
      if (p.sayT > 0) p.sayT -= dt;
      p.talkCd -= dt;
      // đứng gần người chơi thì thỉnh thoảng chào (chỉ hiện chữ, bấm vào mới đọc to)
      var dx = P.x - p.x, dy = P.y - p.y;
      if (p.talkCd <= 0 && dx * dx + dy * dy < 170 * 170) { p.say = LINES[Math.floor(Math.random() * LINES.length)]; p.sayT = 3; p.talkCd = 18 + Math.random() * 15; p.wait = 1.5; p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); }
      if (p.wait > 0) { p.wait -= dt; p.moving = false; continue; }
      var mx = p.tx - p.x, my = p.ty - p.y, d = Math.sqrt(mx * mx + my * my);
      if (d < 6) { p.wait = 1 + Math.random() * 3; var tg = freeSpot(); p.tx = tg.x; p.ty = tg.y; p.moving = false; continue; }
      var st = Math.min(d, p.sp * dt), nx = p.x + mx / d * st, ny = p.y + my / d * st;
      if (blocked(nx, ny)) { var t2 = freeSpot(); p.tx = t2.x; p.ty = t2.y; p.wait = 0.5; p.moving = false; continue; }
      p.x = nx; p.y = ny; p.moving = true; p.t += dt;
      p.dir = Math.abs(mx) > Math.abs(my) ? (mx < 0 ? 'left' : 'right') : (my < 0 ? 'up' : 'down');
    }
  }
  function drawTownie(p) {
    shadow(p.x, p.y, 20);
    G.drawAvatar(ctx, p.av, p.x, p.y + 4, 100, p.dir, p.t * 9, p.moving);
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

    // các thứ có chiều sâu: vẽ theo y tăng dần
    drawNearGlow();
    drawFx('dust');
    var items = [];
    if (scene.buildings) for (var i = 0; i < scene.buildings.length; i++) items.push({ y: scene.buildings[i].y, draw: drawBuilding, o: scene.buildings[i] });
    if (scene.kind === 'classroom' && G.currentRoom) items.push({ y: TY(), draw: drawTeacher, o: G.ROOM_TEACHER[G.currentRoom] });
    if (scene.kind === 'shop') items.push({ y: TY(), draw: drawTeacher, o: scene.npc });
    for (var ti = 0; ti < town.length; ti++) items.push({ y: town[ti].y, draw: drawTownie, o: town[ti] });
    items.push({ y: K.y, draw: drawKai });
    items.push({ y: P.y, draw: drawPlayer });
    items.sort(function (a, b) { return a.y - b.y; });
    for (var j = 0; j < items.length; j++) items[j].draw(items[j].o);

    if (scene.kind === 'hall') drawDoorPlates();
    updateQuest();
    if (target) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(target.x, target.y, 16, 8, 0, 0, 6.283); ctx.stroke(); }

    // ngày và đêm theo giờ Việt Nam
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var hr = G.vnParts().h;
    var night = scene.kind === 'city' ? (hr >= 19 || hr < 5 ? 0.42 : hr >= 18 ? 0.22 : hr < 6 ? 0.22 : 0) : 0;
    drawSky();
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
    if (fade > 0) { ctx.fillStyle = 'rgba(27,33,64,' + fade + ')'; ctx.fillRect(0, 0, W, H); }
  }

  function drawBackground() {
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
    G.drawAsset(ctx, b.img, b.x - 150, b.y - 290, 300, 300);
    // biển tên
    var label = b.name, w = Math.max(110, label.length * 13 + 30);
    ctx.fillStyle = b.go ? 'rgba(200,85,61,.95)' : 'rgba(27,33,64,.82)';
    G.roundRect(ctx, b.x - w / 2, b.y + 8, w, 34, 17); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 18px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, b.x, b.y + 26);
  }

  function shadow(x, y, r) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.38, 0, 0, 6.283); ctx.fill(); }

  function drawPlayer() {
    // bóng dưới chân co giãn theo nhịp bước
    var sh = P.moving ? 1 - Math.abs(Math.sin(P.t * 9)) * 0.12 : 1;
    if (G.S.nhanVat === 'custom' && G.S.avatar) {
      shadow(P.x, P.y, 24 * sh);
      G.drawAvatar(ctx, G.S.avatar, P.x, P.y + 4, 112, P.dir, P.t * 9, P.moving);
      return;
    }
    var who = G.S.nhanVat || 'han';
    var dir = P.dir === 'right' ? 'left' : P.dir, flip = P.dir === 'right';
    var name = 'player_' + who + '_' + dir + '.png';
    shadow(P.x, P.y, 26 * sh);
    G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, name, X, Y, S, S, flip); }, P.x, P.y + 8, 120, P.dir, P.t * 9, P.moving, 0.72);
  }
  function drawKai() {
    var bob = Math.sin(Date.now() / 260) * 4;
    shadow(K.x, K.y, 16);
    G.drawAsset(ctx, 'kai_follow.png', K.x - 38, K.y - 82 + bob, 76, 76);
  }
  function drawTeacher(id) {
    var n = G.NPCS[id];
    var tx = TX(), ty = TY();
    shadow(tx, ty, 34);
    G.walkDraw(ctx, function (c, X, Y, S) { G.drawAsset(c, n.img, X, Y, S, S); }, tx, ty, 170, 'down', 0, false, 0.72);
    ctx.fillStyle = 'rgba(27,33,64,.85)';
    G.roundRect(ctx, tx - 70, ty + 8, 140, 30, 15); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = '700 17px -apple-system, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(n.name, tx, ty + 23);
  }
  function drawDoorPlates() {
    var DR = doorsHere();
    for (var d = 0; d < DR.length; d++) {
      var door = DR[d], open = G.roomOpen(d, DR), p = G.S.phong[door.room];
      var stars = p ? (p.sao === 3 ? '★★★' : p.sao === 2 ? '★★☆' : p.sao === 1 ? '★☆☆' : '') : '';
      // khoá xích trên cửa chưa mở (có hình door_lock.png thì vẽ, chưa có thì chỉ hiện biển 🔒)
      if (!open && G.asset('door_lock.png').ok) G.drawAsset(ctx, 'door_lock.png', door.x - 75, 110, 150, 150);
      ctx.fillStyle = open ? 'rgba(47,122,99,.95)' : 'rgba(27,33,64,.85)';
      G.roundRect(ctx, door.x - 64, 150, 128, 50, 12); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '800 19px -apple-system, system-ui, sans-serif';
      ctx.fillText((open ? '' : '🔒 ') + door.label, door.x, 166);
      ctx.font = '600 15px -apple-system, system-ui, sans-serif';
      ctx.fillStyle = '#ffd56b';
      ctx.fillText(stars || (open ? 'Đang mở' : 'Khoá'), door.x, 187);
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
      if (Math.abs(dx) < hitR && dy > -260 && dy < 60) { hit = t; break; }
    }
    if (hit) { target = { x: hit.x, y: hit.y + (scene.kind === 'city' ? 10 : 0) }; pending = hit.act; pendingLabel = hit.label; }
    else { target = w; pending = null; }
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
  G.debugState = function () { return { x: P.x, y: P.y, cx: cam.x, cy: cam.y, zoom: zoom, scene: sceneId, near: near ? near.label : null }; };
})();
