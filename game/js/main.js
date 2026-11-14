/* Khởi động: nạp tiến độ, Ngôi nhà chung, vào thành phố, lời Kai, nút hành động, pháo giấy, hỏi xác nhận. */
var G = window.G || (window.G = {});

(function () {
  G.S = G.load();

  G.updateHud = function () {
    document.getElementById('hud-xp').textContent = G.S.xp + ' XP';
  };

  G.goCity = function (id) {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('play').style.display = 'block';
    G.updateHud();
    // vị trí đã lưu thuộc thành phố này thì đi tiếp từ đó, không thì vào cổng chính của thành phố
    var v = G.S.viTri, sv = v && G.SCENES[v.canh];
    if (sv && sv.city === id && sv.kind !== 'classroom') G.enterScene(v.canh, { x: v.x, y: v.y, dir: 'down' });
    else if (id === 'zh') G.enterScene('city_zh');
    else G.enterScene('home_en');
    var sc = G.S.viTri.canh;
    G.kaiSay(sc === 'home_en' ? 'Chào ' + G.playerName() + '! Đi học thôi: bến xe buýt ở góc trên bên phải, ga tàu điện ở góc dưới bên phải.'
      : sc === 'city_en' ? 'Trường Anh ngữ ở góc dưới bên trái, có biển màu đỏ. Bến xe buýt và ga tàu điện để về nhà ở hai góc dưới.'
      : sc === 'city_zh' ? '欢迎！Chào mừng tới Trường Lạc trấn. Học viện Hán ngữ ở góc dưới bên trái, sân bay ở phía trên.' : 'Tiếp tục học nào!');
  };

  G.goLobby = function () {
    G.stopEngine();
    document.getElementById('create').style.display = 'none';
    G.closeLesson();
    document.getElementById('play').style.display = 'none';
    document.getElementById('lobby').style.display = 'block';
    G.renderLobby();
    window.scrollTo(0, 0);
  };

  /* Kai nói một câu ngắn ở góc màn hình */
  var kaiTimer = 0;
  G.kaiSay = function (text) {
    var k = document.getElementById('kai');
    document.getElementById('kai-text').textContent = text;
    k.className = 'kai show';
    clearTimeout(kaiTimer);
    kaiTimer = setTimeout(function () { k.className = 'kai'; }, 5200);
  };

  /* Nút hành động khi đứng gần cửa / NPC */
  G.showAction = function (t) {
    var b = document.getElementById('act');
    if (!t) { b.className = 'act'; return; }
    b.textContent = t.label + ' ›';
    b.className = 'act show';
  };

  G.confirm = function (msg, yes) {
    var wrap = G.el('div.modal', G.el('div.choose',
      G.el('p', msg),
      G.el('div.row', G.el('button.btn', { onclick: function () { document.body.removeChild(wrap); } }, 'Huỷ'),
        G.el('button.btn.seal', { onclick: function () { document.body.removeChild(wrap); yes(); } }, 'Đồng ý'))
    ));
    document.body.appendChild(wrap);
  };

  G.confetti = function () {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var c = document.createElement('canvas');
    c.className = 'confetti';
    document.body.appendChild(c);
    var w = c.width = innerWidth, h = c.height = innerHeight, g = c.getContext('2d');
    var cols = ['#c8553d', '#2f7a63', '#f2bf3c', '#4a68d8', '#8bbac0'], ps = [];
    for (var i = 0; i < 110; i++) ps.push({ x: w / 2 + (Math.random() - 0.5) * 140, y: h * 0.35, vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 10 - 5, r: Math.random() * 7 + 5, a: Math.random() * 6, c: cols[i % cols.length] });
    var t0 = Date.now();
    (function f() {
      var k = (Date.now() - t0) / 1700;
      g.clearRect(0, 0, w, h);
      for (var j = 0; j < ps.length; j++) { var p = ps[j]; p.vy += 0.3; p.x += p.vx; p.y += p.vy; p.a += 0.2; g.save(); g.globalAlpha = Math.max(0, 1 - k * k); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore(); }
      if (k < 1) requestAnimationFrame(f); else c.parentNode.removeChild(c);
    })();
  };

  function start() {
    G.engineInit();
    G.lessonInit();
    document.getElementById('hud-home').onclick = G.goLobby;
    document.getElementById('act').onclick = G.doNear;
    if (!G.S.nhanVat) {
      // lần đầu: tạo nhân vật → lời mở đầu → ra khỏi nhà
      G.openCreator(function () { G.introStory(function () { G.goCity('en'); }); });
    } else G.renderLobby();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
