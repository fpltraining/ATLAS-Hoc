/* Bay giữa hai thành phố: làm thủ tục ở quầy (bằng ngôn ngữ nơi đi), nghe thông báo trên máy bay, hạ cánh.
   Hình: nhân viên quầy npc_grace.png / npc_zhou.png, nền trời flight_bg.png (cuộn ngang), máy bay plane.png. */
var G = window.G || (window.G = {});

(function () {
  var CITY = { en: 'Brightford', zh: 'Trường Lạc trấn' };
  var DESK = {
    en: { who: 'Officer Grace · quầy thủ tục', img: 'npc_grace.png', lang: 'en', steps: [
      { q: 'Good morning! Where are you flying to?', vi: 'Chào buổi sáng! Bạn bay đi đâu?', ok: 'To Changle Town, please.', bad: ['I like apples.', 'It is Monday.'], hint: 'Nhân viên hỏi bạn bay đi đâu. Trả lời "To … , please."' },
      { q: 'May I see your passport, please?', vi: 'Cho tôi xem hộ chiếu nhé?', ok: 'Here you are.', bad: ['No, thank you.', 'I am fine.'], hint: 'Đưa hộ chiếu thì nói "Here you are." (Của bạn đây.)' },
      { q: 'Here is your boarding pass. Your gate is number three.', vi: 'Đây là thẻ lên máy bay. Cửa số ba.', ok: 'Thank you very much!', bad: ['Good night!', 'I am hungry.'], hint: 'Cảm ơn nhân viên nhé!' }
    ], air: ['Ladies and gentlemen, welcome aboard. Please fasten your seat belt.', 'We will land soon. Thank you for flying with us.'],
      airVi: ['Kính chào quý khách, chào mừng lên máy bay. Vui lòng thắt dây an toàn.', 'Máy bay sắp hạ cánh. Cảm ơn quý khách.'] },
    zh: { who: '周小姐 Cô Chu · quầy thủ tục', img: 'npc_zhou.png', lang: 'zh', steps: [
      { q: '你好！你去哪儿？', py: 'Nǐ hǎo! Nǐ qù nǎr?', vi: 'Chào bạn! Bạn đi đâu?', ok: ['我去Brightford。', 'Wǒ qù Brightford.'], bad: [['我饿了。', 'Wǒ è le.'], ['今天星期一。', 'Jīntiān xīngqīyī.']], hint: 'Cô Chu hỏi bạn đi đâu. Trả lời "我去… (Wǒ qù …)".' },
      { q: '请给我你的护照。', py: 'Qǐng gěi wǒ nǐ de hùzhào.', vi: 'Cho tôi xem hộ chiếu của bạn.', ok: ['给你。', 'Gěi nǐ.'], bad: [['没关系。', 'Méi guānxi.'], ['再见。', 'Zàijiàn.']], hint: 'Đưa đồ cho ai thì nói "给你 (Gěi nǐ)": của bạn đây.' },
      { q: '这是你的登机牌。三号门。', py: 'Zhè shì nǐ de dēngjīpái. Sān hào mén.', vi: 'Đây là thẻ lên máy bay. Cửa số ba.', ok: ['谢谢！', 'Xièxie!'], bad: [['对不起。', 'Duìbuqǐ.'], ['我叫Han。', 'Wǒ jiào Han.']], hint: 'Cảm ơn cô Chu nhé: "谢谢 (Xièxie)".' }
    ], air: ['女士们，先生们，欢迎登机。请系好安全带。', '飞机马上就要降落了。谢谢！'],
      airPy: ['Nǚshìmen, xiānshengmen, huānyíng dēngjī. Qǐng jì hǎo ānquándài.', 'Fēijī mǎshàng jiù yào jiàngluò le. Xièxie!'],
      airVi: ['Kính chào quý khách, chào mừng lên máy bay. Vui lòng thắt dây an toàn.', 'Máy bay sắp hạ cánh. Cảm ơn quý khách.'] }
  };

  var F = null, root, cv, ctx, raf = 0, last = 0, ui = {};

  G.openFlight = function (from, to) {
    G.stopEngine();
    F = { from: from, to: to, d: DESK[from], t: 0, phase: 'desk', scroll: 0, ann: -1 };
    root = document.getElementById('ride');
    if (!root) { root = G.el('div.ride', { id: 'ride' }); document.body.appendChild(root); }
    root.innerHTML = ''; root.className = 'ride open';
    cv = G.el('canvas.ride-cv'); ctx = cv.getContext('2d');
    ui.box = G.el('div.ride-box'); ui.kai = G.el('div.ride-kai');
    root.appendChild(G.el('div.ride-top',
      G.el('div.ride-title', G.el('b', '✈ Bay sang ' + CITY[to]), G.el('span.ride-goal', from === 'en' ? 'Làm thủ tục bằng tiếng Anh' : 'Làm thủ tục bằng tiếng Trung')),
      G.el('button.hud-btn', { onclick: cancel, 'aria-label': 'Thoát' }, '✕')));
    root.appendChild(cv);
    root.appendChild(G.el('div.ride-ui', ui.box, ui.kai));
    kai('Ra quầy làm thủ tục. Trả lời nhân viên để lấy thẻ lên máy bay nhé.');
    desk(0);
    last = 0; cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  };

  function kai(text) { ui.kai.innerHTML = ''; ui.kai.appendChild(G.el('span.rk-face', '🤖')); ui.kai.appendChild(G.el('span', text)); }
  function close() { cancelAnimationFrame(raf); if (root) { root.className = 'ride'; root.innerHTML = ''; } if (window.speechSynthesis) speechSynthesis.cancel(); F = null; }
  function cancel() { var from = F.from; G.confirm('Huỷ chuyến bay và quay lại sân bay?', function () { close(); G.resumeScene(); }); }

  function bubble(who, img, text, py, vi, lang) {
    G.say(text, lang);
    return G.el('div.rd-talk', G.imgEl(img, 'rd-pic'),
      G.el('div.rd-bub', G.el('b', who), G.el('div.en', text), py ? G.el('div.py', py) : null, G.el('div.small.faint', vi),
        G.el('button.spk', { onclick: function () { G.say(text, lang); }, 'aria-label': 'Nghe lại' }, '🔊')));
  }

  function desk(i) {
    var d = F.d, st = d.steps[i];
    ui.box.innerHTML = '';
    if (i >= d.steps.length) { board(); return; }
    ui.box.appendChild(bubble(d.who, d.img, st.q, st.py, st.vi, d.lang));
    var opts = [st.ok].concat(st.bad);
    ui.box.appendChild(G.el('div.rd-opts', G.shuffle(opts).map(function (o) {
      var txt = typeof o === 'string' ? o : o[0], py = typeof o === 'string' ? null : o[1];
      return G.el('button.opt', { onclick: function (e) {
        if (o === st.ok) { e.currentTarget.className = 'opt ok'; G.sfx('right'); G.say(txt, d.lang); setTimeout(function () { desk(i + 1); }, 800); }
        else { e.currentTarget.className = 'opt no'; G.sfx('wrong'); kai(st.hint); }
      } }, py ? G.el('span.zhopt', G.el('span', txt), G.el('span.py', py)) : txt);
    })));
  }

  function board() {
    G.sfx('done');
    kai('Có thẻ lên máy bay rồi! Lên máy bay và nghe thông báo nhé.');
    F.phase = 'fly'; F.t = 0; announce(0);
  }
  function announce(k) {
    var d = F.d; F.ann = k;
    ui.box.innerHTML = '';
    G.say(d.air[k], d.lang);
    ui.box.appendChild(G.el('div.rd-ann',
      G.el('div.rd-ann-top', G.el('span.small', '📢 Thông báo trên máy bay'), G.el('button.spk', { onclick: function () { G.say(d.air[k], d.lang); }, 'aria-label': 'Nghe lại' }, '🔊')),
      G.el('div.en', d.air[k]), d.airPy ? G.el('div.py', d.airPy[k]) : null, G.el('div.small.faint', d.airVi[k])));
  }
  function land() {
    F.phase = 'land';
    G.S.bay = (G.S.bay || 0) + 1;
    G.addXp(10); G.updateHud(); G.sfx('done');
    ui.box.appendChild(G.el('div.result.pass', G.el('b', 'Đã hạ cánh ở ' + CITY[F.to] + '!'), G.el('div', '+10 XP')));
    ui.box.appendChild(G.el('button.btn.seal.big1', { onclick: function () {
      var to = F.to; close();
      var sc = to === 'zh' ? 'city_zh' : 'city_en', bs = G.SCENES[sc].buildings;
      for (var i = 0; i < bs.length; i++) if (bs[i].fly) G.enterScene(sc, { x: bs[i].x, y: bs[i].y + 90, dir: 'down' });
      G.kaiSay(to === 'zh' ? '欢迎来到长乐镇！Học viện Hán ngữ ở góc dưới bên trái.' : 'Welcome back to Brightford! Trường Anh ngữ ở góc dưới bên trái.');
    } }, 'Xuống máy bay ›'));
  }

  function loop(ts) {
    if (!F) return;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0; last = ts;
    if (F.phase === 'fly') {
      F.t += dt; F.scroll += dt * 160;
      if (F.ann === 0 && F.t > 5) announce(1);
      if (F.t > 10) land();
    }
    draw();
    raf = requestAnimationFrame(loop);
  }

  function draw() {
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    var g = ctx; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#9fd3e0'; g.fillRect(0, 0, W, H);
    if (F.phase === 'desk') {   // ở quầy: hình sân bay của thành phố đi
      var hall = G.asset('interior_' + F.from + '_airport.png');
      if (hall.ok) { var s = Math.max(W / hall.img.width, H / hall.img.height); g.drawImage(hall.img, (W - hall.img.width * s) / 2, (H - hall.img.height * s) / 2, hall.img.width * s, hall.img.height * s); }
      else G.drawPlaceholder(g, 'interior_' + F.from + '_airport.png', 6, 6, W - 12, H - 12);
      return;
    }
    var bg = G.asset('flight_bg.png');
    if (bg.ok) { var bw = bg.img.width * H / bg.img.height, off = F.scroll % bw; for (var x = -off; x < W; x += bw) g.drawImage(bg.img, x, 0, bw + 1, H); }
    else G.drawPlaceholder(g, 'flight_bg.png', 6, 6, W - 12, H - 12);
    var pw = Math.min(W * 0.5, H * 1.1), ph = pw * 0.5, bob = Math.sin(Date.now() / 400) * 6;
    var pl = G.asset('plane.png');
    if (pl.ok) { ph = pw * pl.img.height / pl.img.width; g.drawImage(pl.img, W / 2 - pw / 2, H / 2 - ph / 2 + bob, pw, ph); }
    else G.drawPlaceholder(g, 'plane.png', W / 2 - pw / 2, H / 2 - ph / 2 + bob, pw, ph);
  }
})();
