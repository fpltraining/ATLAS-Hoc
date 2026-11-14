/* Đi xe buýt và tàu điện tới trường / về nhà.
   Xe buýt: nói chuyện với tài xế, quẹt thẻ, nghe "Next stop: …" và bấm chuông xuống đúng trạm.
   Tàu điện: mua vé ở máy, chọn đúng sân ga theo sơ đồ tuyến, nghe "This is …" và xuống khi cửa mở. */
var G = window.G || (window.G = {});

(function () {
  var ROUTES = {
    bus: {
      name: 'Xe buýt số 7', school: ['Maple Street', 'Green Park', 'City Library', 'Brightford High School', 'Central Station'],
      home: ['Brightford High School', 'City Library', 'Green Park', 'Maple Street', 'Lakeside'],
      goal: { school: 'Brightford High School', home: 'Maple Street' }
    },
    metro: {
      name: 'Tàu điện tuyến Xanh', line: ['Hill Park', 'Maple', 'Riverside', 'Sky Garden', 'Brightford High', 'Downtown', 'Airport'],
      school: ['Maple', 'Riverside', 'Sky Garden', 'Brightford High', 'Downtown', 'Airport'],
      home: ['Brightford High', 'Sky Garden', 'Riverside', 'Maple', 'Hill Park'],
      goal: { school: 'Brightford High', home: 'Maple' }
    }
  };
  var SEG = 4.2, STOP_BUS = 1.4, STOP_METRO = 3.6, ARRIVE = 2.2;

  var R = null, root, cv, ctx, W = 0, H = 0, dpr = 1, raf = 0, last = 0;
  var ui = {};

  G.openRide = function (type, toward) {
    var rt = ROUTES[type];
    R = {
      type: type, toward: toward, rt: rt, stops: rt[toward], goal: rt.goal[toward],
      phase: 'arrive', t: 0, cur: 0, seg: 1, bell: false, scroll: 0, signName: rt[toward][0], hideText: !!G.S.caiDat.chiNghe
    };
    R.target = R.stops.indexOf(R.goal);
    G.stopEngine();
    build();
    if (type === 'bus') { setPhase('arrive'); kai('Xe buýt số 7 đang tới. Lên xe rồi nói với tài xế bạn muốn đi đâu.'); }
    else { setPhase('ticket'); }
    last = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  };

  function build() {
    root = document.getElementById('ride');
    if (!root) { root = G.el('div.ride', { id: 'ride' }); document.body.appendChild(root); }
    root.innerHTML = '';
    root.className = 'ride open';
    cv = G.el('canvas.ride-cv');
    ctx = cv.getContext('2d');
    ui.title = G.el('b');
    ui.goal = G.el('span.ride-goal');
    ui.route = G.el('div.ride-route');
    ui.box = G.el('div.ride-box');
    ui.kai = G.el('div.ride-kai');
    root.appendChild(G.el('div.ride-top',
      G.el('div.ride-title', ui.title, ui.goal),
      G.el('button.hud-btn', { onclick: cancel, 'aria-label': 'Thoát' }, '✕')));
    root.appendChild(cv);
    root.appendChild(G.el('div.ride-ui', ui.route, ui.box, ui.kai));
    ui.title.textContent = R.rt.name;
    ui.goal.textContent = 'Cần xuống: ' + R.goal;
    drawRoute();
  }

  function kai(text) { ui.kai.innerHTML = ''; ui.kai.appendChild(G.el('span.rk-face', '🤖')); ui.kai.appendChild(G.el('span', text)); }

  function drawRoute() {
    ui.route.innerHTML = '';
    var atStop = R.phase !== 'ride';
    for (var i = 0; i < R.stops.length; i++) {
      var cls = ['rs'];
      if (i === R.cur && atStop) cls.push('here');
      if (i < R.cur || (i === R.cur && !atStop)) cls.push('past');
      if (i === R.target) cls.push('goal');
      if (!atStop && i === R.seg) cls.push('next');
      ui.route.appendChild(G.el('div.' + cls.join('.'), G.el('i'), G.el('span', R.stops[i])));
    }
  }

  function cancel() {
    G.confirm('Thoát khỏi ' + (R.type === 'bus' ? 'xe buýt' : 'tàu điện') + ' và quay lại?', function () { close(); G.resumeScene(); });
  }
  function close() {
    cancelAnimationFrame(raf);
    if (root) { root.className = 'ride'; root.innerHTML = ''; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    R = null;
  }

  /* ---------- các bước ---------- */
  function setPhase(p) {
    R.phase = p; R.t = 0;
    ui.box.innerHTML = '';
    if (p === 'board') boardDialog(0);
    if (p === 'ticket') ticketMachine(0);
    if (p === 'platform') platform();
    if (p === 'ride') rideUi();
    if (p === 'stop') stopUi();
    drawRoute();
  }

  function greet() { var h = G.vnParts().h; return h < 12 ? 'Good morning!' : h < 18 ? 'Good afternoon!' : 'Good evening!'; }

  function talk(who, pic, en, vi) {
    G.say(en, 'en');
    return G.el('div.rd-talk', pic ? G.imgEl(pic, 'rd-pic') : G.el('div.rd-pic.machine', '🎫'),
      G.el('div.rd-bub', G.el('b', who), G.el('div.en', en), vi ? G.el('div.small.faint', vi) : null,
        G.el('button.spk', { onclick: function () { G.say(en, 'en'); }, 'aria-label': 'Nghe lại' }, '🔊')));
  }

  function choices(opts, right, onRight, onWrong) {
    var list = G.shuffle(opts.slice());
    return G.el('div.rd-opts', list.map(function (o) {
      return G.el('button.opt', { onclick: function (e) {
        if (o === right) { e.currentTarget.className = 'opt ok'; G.sfx('right'); G.say(o, 'en'); setTimeout(onRight, 700); }
        else { e.currentTarget.className = 'opt no'; G.sfx('wrong'); onWrong(); }
      } }, o);
    }));
  }

  /* xe buýt: nói chuyện với tài xế */
  function boardDialog(step) {
    ui.box.innerHTML = '';
    if (step === 0) {
      ui.box.appendChild(talk('Mr. Joe · tài xế', 'npc_driver.png', greet() + ' Where are you going?', 'Tài xế hỏi: Bạn đi đâu?'));
      ui.box.appendChild(choices(['To ' + R.goal + ', please.', 'I\'m fine, thank you.', 'Yes, I am a student.'], 'To ' + R.goal + ', please.',
        function () { boardDialog(1); }, function () { kai('Tài xế hỏi bạn đi đâu. Hãy nói "To … , please." kèm tên trạm.'); }));
      if ((G.S.diLai.bus || 0) >= 3) ui.box.appendChild(G.el('button.btn.sm.rd-skip', { onclick: function () { finish(true, true); } }, '⏩ Đi nhanh tới nơi'));
    } else if (step === 1) {
      ui.box.appendChild(talk('Mr. Joe · tài xế', 'npc_driver.png', 'That\'s two dollars. Please tap your card here.', 'Hai đô la. Quẹt thẻ ở đây nhé.'));
      ui.box.appendChild(choices(['Okay. Here you go.', 'I\'m going to school.', 'Good night!'], 'Okay. Here you go.',
        function () { boardDialog(2); }, function () { kai('Tài xế bảo bạn quẹt thẻ. Trả lời "Okay. Here you go." (Vâng, đây ạ).'); }));
    } else {
      G.sfx('door');
      ui.box.appendChild(talk('Mr. Joe · tài xế', 'npc_driver.png', 'Thank you. Have a nice day!', 'Cảm ơn. Chúc một ngày tốt lành!'));
      kai('Ngồi xuống nào. Nghe "Next stop: ' + R.goal + '" thì bấm chuông để xuống.');
      setTimeout(function () { if (R && R.phase === 'board') setPhase('ride'); }, 1800);
    }
  }

  /* tàu điện: máy bán vé */
  function ticketMachine(step) {
    ui.box.innerHTML = '';
    if (step === 0) {
      kai('Mua vé ở máy nhé. Chọn ga ' + R.goal + '.');
      ui.box.appendChild(talk('Máy bán vé', null, 'Where are you going? Please choose a station.', 'Bạn đi đâu? Chọn ga.'));
      var others = R.rt.line.filter(function (s) { return s !== R.stops[0]; });
      ui.box.appendChild(G.el('div.rd-opts.grid', others.map(function (s) {
        return G.el('button.opt', { onclick: function (e) {
          if (s === R.goal) { e.currentTarget.className = 'opt ok'; G.sfx('right'); setTimeout(function () { ticketMachine(1); }, 600); }
          else { e.currentTarget.className = 'opt no'; G.sfx('wrong'); kai('Đó là ga ' + s + '. Ga bạn cần là ' + R.goal + '.'); }
        } }, s);
      })));
    } else if (step === 1) {
      kai('Bạn đi một mình, mua 1 vé.');
      ui.box.appendChild(talk('Máy bán vé', null, 'How many tickets?', 'Bao nhiêu vé?'));
      ui.box.appendChild(choices(['One', 'Two', 'Three'], 'One', function () { ticketMachine(2); }, function () { kai('Chỉ cần 1 vé: "One".'); }));
    } else {
      ui.box.appendChild(talk('Máy bán vé', null, 'That\'s two dollars fifty. Please tap your card.', 'Hai đô năm mươi xu. Quẹt thẻ nhé.'));
      ui.box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { G.sfx('done'); setPhase('platform'); } }, '💳 Quẹt thẻ'));
    }
  }

  /* tàu điện: chọn sân ga theo sơ đồ tuyến */
  function platform() {
    var line = R.rt.line, endA = line[line.length - 1], endB = line[0];
    var right = R.toward === 'school' ? endA : endB;
    kai('Xem sơ đồ: bạn đang ở ga ' + R.stops[0] + '. Ga ' + R.goal + ' nằm về phía nào?');
    ui.box.appendChild(G.el('div.rd-map', line.map(function (s) {
      return G.el('span' + (s === R.stops[0] ? '.me' : s === R.goal ? '.goal' : ''), s);
    })));
    ui.box.appendChild(G.el('div.small.faint', 'Sơ đồ tuyến Xanh. Đỏ: ga bạn đang đứng. Xanh: ga cần tới.'));
    ui.box.appendChild(choices(['Platform 1 → toward ' + endA, 'Platform 2 → toward ' + endB], 'Platform ' + (right === endA ? '1' : '2') + ' → toward ' + right,
      function () { setPhase('arrive'); kai('Tàu tới rồi! Nghe "This is ' + R.goal + '" thì bấm Xuống tàu khi cửa mở.'); },
      function () { kai('Hướng đó đi xa ga ' + R.goal + '. "toward" nghĩa là "về phía".'); }));
  }

  function rideUi() {
    var name = R.stops[R.seg];
    var en = R.type === 'bus' ? 'Next stop: ' + name + '.' : 'The next station is ' + name + '.';
    R.annEn = en;
    G.say(en, 'en');
    ui.box.appendChild(announce(en, R.type === 'bus' ? 'Trạm kế tiếp: ' + name : 'Ga kế tiếp: ' + name));
    if (R.type === 'bus') {
      ui.box.appendChild(G.el('button.btn.big1.rd-act' + (R.bell ? '.on' : ''), { onclick: ringBell }, R.bell ? '🔔 Đã bấm chuông, xe sẽ dừng' : '🔔 Bấm chuông xuống xe'));
    } else ui.box.appendChild(G.el('button.btn.big1.rd-act.off', { disabled: true }, '🚪 Cửa đang đóng'));
  }
  function stopUi() {
    var name = R.stops[R.cur];
    if (R.type === 'metro') {
      var en = 'This is ' + name + '.' + (R.cur === R.stops.length - 1 ? ' This is the last stop.' : ' Please mind the gap.');
      G.say(en, 'en');
      ui.box.appendChild(announce(en, 'Đây là ga ' + name + '. Chú ý khoảng trống giữa tàu và sân ga.'));
      ui.box.appendChild(G.el('button.btn.seal.big1.rd-act', { onclick: function () { finish(R.cur === R.target); } }, '🚪 Xuống tàu ở ga này'));
    } else {
      ui.box.appendChild(announce(name, 'Xe đang dừng ở trạm ' + name));
      ui.box.appendChild(G.el('button.btn.seal.big1.rd-act', { onclick: function () { finish(R.cur === R.target); } }, '⬇ Xuống ở trạm này'));
    }
  }
  function announce(en, vi) {
    var t = G.el('div.en', en), v = G.el('div.small.faint', vi);
    if (R.hideText) { t.className = 'en hide'; v.style.display = 'none'; }
    return G.el('div.rd-ann',
      G.el('div.rd-ann-top', G.el('span.small', '📢 Thông báo'),
        G.el('button.spk', { onclick: function () { G.say(en, 'en'); }, 'aria-label': 'Nghe lại' }, '🔊'),
        G.el('button.btn.sm', { onclick: function () { R.hideText = !R.hideText; G.S.caiDat.chiNghe = R.hideText; G.save(); t.className = 'en' + (R.hideText ? ' hide' : ''); v.style.display = R.hideText ? 'none' : ''; } }, R.hideText ? 'Hiện chữ' : 'Chỉ nghe')),
      t, v);
  }
  function ringBell() {
    if (R.phase !== 'ride' || R.bell) return;
    R.bell = true; G.sfx('door');
    var b = ui.box.querySelector('.rd-act');
    if (b) { b.className = 'btn big1 rd-act on'; b.textContent = '🔔 Đã bấm chuông, xe sẽ dừng'; }
  }

  /* ---------- kết thúc ---------- */
  function finish(ok, skipped) {
    R.phase = 'end';
    drawRoute();
    ui.box.innerHTML = '';
    var here = R.stops[R.cur];
    if (ok) {
      G.S.diLai[R.type] = (G.S.diLai[R.type] || 0) + 1;
      var xp = skipped ? 0 : 10;
      if (xp) G.addXp(xp); else G.save();
      G.updateHud();
      G.sfx('done');
      if (!skipped) G.confetti();
      ui.box.appendChild(G.el('div.result.pass',
        G.el('b', R.toward === 'school' ? 'Tới trường rồi!' : 'Về tới nhà rồi!'),
        G.el('div', skipped ? 'Đi nhanh không cộng XP.' : 'Xuống đúng ' + (R.type === 'bus' ? 'trạm' : 'ga') + ' ' + here + '. +' + xp + ' XP'),
        G.el('div.rd-vocab', vocab().map(function (v) { return G.el('div', G.el('b', v[0]), ' · ', v[1]); }))
      ));
      ui.box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { var t = R.toward, ty = R.type; close(); G.arriveBy(ty, t); } }, R.toward === 'school' ? 'Đi vào trường ›' : 'Về nhà ›'));
    } else {
      G.sfx('wrong');
      var over = R.cur >= R.stops.length - 1 && R.cur !== R.target;
      ui.box.appendChild(G.el('div.result',
        G.el('b', over ? 'Đi quá ' + (R.type === 'bus' ? 'trạm' : 'ga') + ' rồi!' : 'Xuống nhầm ' + (R.type === 'bus' ? 'trạm' : 'ga') + '!'),
        G.el('div', 'Đây là ' + here + '. Bạn cần xuống ở ' + R.goal + '.'),
        G.el('div.small', R.type === 'bus' ? 'Nghe "Next stop: ' + R.goal + '" rồi bấm chuông ngay.' : 'Đợi tàu đến và nghe "This is ' + R.goal + '" rồi mới xuống.')));
      ui.box.appendChild(G.el('button.btn.seal.big1', { onclick: retry }, '↻ Đi lại chuyến khác'));
    }
  }
  function vocab() {
    if (R.type === 'bus') return [['Where are you going?', 'Bạn đi đâu?'], ['Next stop', 'Trạm kế tiếp'], ['tap your card', 'quẹt thẻ'], ['Here you go.', 'Đây ạ (khi đưa gì đó)']];
    return [['station', 'ga'], ['platform', 'sân ga'], ['toward', 'về phía'], ['Please mind the gap.', 'Chú ý khoảng trống (giữa tàu và sân ga).']];
  }
  function retry() {
    R.cur = 0; R.seg = 1; R.bell = false; R.signName = R.stops[0];
    setPhase('arrive');
    kai('Chuyến sau tới rồi. Lần này nghe kỹ nhé!');
  }

  /* ---------- vòng lặp ---------- */
  function loop(ts) {
    if (!R) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
    last = ts;
    step(dt);
    draw();
    raf = requestAnimationFrame(loop);
  }

  function step(dt) {
    R.t += dt;
    R.scroll += speedK() * (W || 360) * 0.95 * dt;
    if (R.phase === 'arrive' && R.t >= ARRIVE) {
      R.signName = R.stops[R.cur];
      if (R.type === 'bus' && R.cur === 0 && !R.boarded) { R.boarded = true; setPhase('board'); }
      else setPhase('ride');
    }
    if (R.phase === 'ride') {
      if (R.t > SEG * 0.45) R.signName = R.stops[R.seg];
      if (R.t >= SEG) {
        R.cur = R.seg;
        if (R.type === 'bus' && R.bell) { finish(R.cur === R.target); return; }
        if (R.cur >= R.stops.length - 1) { finish(R.cur === R.target); return; }
        setPhase('stop');
      }
    }
    if (R.phase === 'stop' && R.t >= (R.type === 'bus' ? STOP_BUS : STOP_METRO)) {
      R.seg = R.cur + 1; setPhase('ride');
    }
  }

  /* tốc độ xe: tăng dần lúc chạy, giảm dần lúc tới trạm */
  function speedK() {
    if (R.phase !== 'ride') return 0;
    var k = R.t / SEG;
    if (k < 0.15) return k / 0.15;
    if (k > 0.75) return Math.max(0, (1 - k) / 0.25);
    return 1;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }

  /* Vẽ cảnh đi xe: toàn bộ là hình đặt từ ChatGPT, thiếu hình thì hiện ô màu ghi tên file.
     ride_bg_*.png là dải phố dài lặp lại được, cuộn ngang khi xe chạy; mặt đường / đường ray ở 12% dưới cùng. */
  function draw() {
    if (!W || cv.clientWidth !== W || cv.clientHeight !== H) resize();
    if (!W || !H) return;
    var g = ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#e9e2d4'; g.fillRect(0, 0, W, H);
    var bgName = R.type === 'bus' ? 'ride_bg_bus.png' : 'ride_bg_metro.png';
    var bg = G.asset(bgName);
    if (bg.ok) {
      var bw = bg.img.width * H / bg.img.height, off = (R.scroll * 0.8) % bw;
      for (var x = -off; x < W; x += bw) g.drawImage(bg.img, x, 0, bw + 1, H);
    } else G.drawPlaceholder(g, bgName, 6, 6, W - 12, H - 12);

    var ground = H * 0.88;
    var vx = W * 0.42;
    if (R.phase === 'arrive') { var a = Math.min(1, R.t / ARRIVE); vx = -W * 0.7 + (W * 1.12) * (1 - Math.pow(1 - a, 3)); }
    if (R.signName) {
      var sx = W * 0.82;
      if (R.phase === 'ride') { var k2 = R.t / SEG; sx = k2 < 0.45 ? W * 0.82 - W * 1.4 * (k2 / 0.45) * (k2 / 0.45) : W * 0.82 + W * 1.4 * Math.pow((1 - k2) / 0.55, 2); }
      drawSign(g, sx, R.signName);
    }
    var vName = R.type === 'bus' ? 'vehicle_bus.png' : (R.phase === 'stop' ? 'vehicle_metro_open.png' : 'vehicle_metro.png');
    var v = G.asset(vName);
    if (!v.ok && vName === 'vehicle_metro_open.png') { vName = 'vehicle_metro.png'; v = G.asset(vName); }
    var vw = Math.min(W * 0.78, H * 1.9), vh = v.ok ? vw * v.img.height / v.img.width : vw * 0.4;
    var shake = R.phase === 'ride' ? Math.sin(R.t * 30) * 1.2 * speedK() : 0;
    if (v.ok) g.drawImage(v.img, vx - vw / 2, ground - vh + shake, vw, vh);
    else G.drawPlaceholder(g, vName, vx - vw / 2, ground - vh, vw, vh);

    // trời tối theo giờ Việt Nam
    var hr = G.vnParts().h, night = hr >= 19 || hr < 5 ? 0.35 : hr >= 17 ? 0.12 : 0;
    if (night) { g.fillStyle = 'rgba(20,24,60,' + night + ')'; g.fillRect(0, 0, W, H); }
  }

  /* biển tên trạm (chữ của giao diện) */
  function drawSign(g, x, name) {
    g.font = '800 ' + Math.max(13, Math.round(H * 0.06)) + 'px -apple-system, system-ui, sans-serif';
    var tw = g.measureText(name).width + 26, sh = Math.max(28, H * 0.11), y = H * 0.08;
    g.fillStyle = R.type === 'bus' ? '#2f7a63' : '#1b2140';
    G.roundRect(g, x - tw / 2, y, tw, sh, 10); g.fill();
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(name, x, y + sh / 2);
  }
})();
