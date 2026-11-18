/* Nội thất các tiệm vẽ bằng code (chưa cần ảnh): tường, sàn, cửa sổ nhìn ra trời (theo buổi, có mưa), quầy, đồ đạc.
   Mỗi tiệm có bảng thông tin tiếng Anh treo tường (bấm để đọc, nghe, xem nghĩa).
   G.drawRoom(ctx, scene) vẽ nền; G.drawRoomFront(ctx, scene) vẽ quầy phía trước người bán. */
var G = window.G || (window.G = {});

(function () {
  function rr(c, x, y, w, h, r) { G.roundRect(c, x, y, w, h, r); }
  function emoji(c, e, x, y, s) { c.font = s + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(e, x, y); }
  function line(c, w) { c.strokeStyle = '#3a2418'; c.lineWidth = w || 4; }

  /* cửa sổ: nhìn ra trời theo buổi, có mưa */
  function windowView(c, x, y, w, h) {
    var part = G.dayPart ? G.dayPart() : 'trua', rain = G.weather && G.weather() === 'rain';
    var sky = { sang: ['#ffd9c2', '#bfe3f2'], trua: ['#9fd3f0', '#d8f0fb'], chieu: ['#ffd38a', '#bfe0ee'], hoanghon: ['#f08a6c', '#7b5fa8'], toi: ['#1b2140', '#3a4680'] }[part];
    if (rain) sky = part === 'toi' ? ['#151a33', '#2b3355'] : ['#8a96a8', '#b9c2cf'];
    c.save(); rr(c, x, y, w, h, 10); c.clip();
    var g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]); c.fillStyle = g; c.fillRect(x, y, w, h);
    // toà nhà phía xa
    c.fillStyle = part === 'toi' ? '#2a3260' : 'rgba(60,80,110,.35)';
    for (var i = 0; i < 6; i++) { var bw = w / 6; c.fillRect(x + i * bw + 4, y + h - 40 - (i * 37 % 50), bw - 8, 80); }
    if (part === 'toi') { c.fillStyle = '#ffd56b'; for (var j = 0; j < 10; j++) c.fillRect(x + 10 + (j * 47 % (w - 20)), y + h - 30 - (j * 13 % 30), 5, 6); }
    if (rain) {
      var t = Date.now() / 1000; c.strokeStyle = 'rgba(230,240,255,.7)'; c.lineWidth = 1.5; c.beginPath();
      for (var k = 0; k < 26; k++) { var rx = x + ((k * 53 + t * 40) % w), ry = y + ((k * 97 + t * 520) % h); c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 14); }
      c.stroke();
    }
    c.restore();
    line(c, 6); rr(c, x, y, w, h, 10); c.stroke();
    c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h / 2); c.lineTo(x + w, y + h / 2); c.lineWidth = 4; c.stroke();
  }
  function wall(c, sc, R) {
    c.fillStyle = R.wall; c.fillRect(0, 0, sc.w, 430);
    // hoạ tiết tường
    c.fillStyle = 'rgba(255,255,255,.08)'; for (var x = 0; x < sc.w; x += 64) c.fillRect(x, 0, 30, 430);
    c.fillStyle = R.trim; c.fillRect(0, 380, sc.w, 50);
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(0, 426, sc.w, 8);
    // sàn
    if (R.floor === 'wood') {
      c.fillStyle = '#c99a63'; c.fillRect(0, 430, sc.w, sc.h - 430);
      c.strokeStyle = 'rgba(90,55,25,.35)'; c.lineWidth = 3;
      for (var y = 430; y < sc.h; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(sc.w, y); c.stroke(); for (var x2 = ((y / 48) % 2) * 120; x2 < sc.w; x2 += 240) { c.beginPath(); c.moveTo(x2, y); c.lineTo(x2, y + 48); c.stroke(); } }
    } else {
      var a = R.floor === 'check' ? ['#f2ede4', '#2c3550'] : ['#e9eef0', '#d5dde2'];
      for (var yy = 430, r = 0; yy < sc.h; yy += 64, r++) for (var xx = 0, k = 0; xx < sc.w; xx += 64, k++) { c.fillStyle = a[(r + k) % 2]; c.fillRect(xx, yy, 64, 64); }
    }
    // cửa ra vào phía dưới
    c.fillStyle = '#b89a6c'; rr(c, 690, sc.h - 40, 156, 40, 8); c.fill();
    c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(0, sc.h - 6, sc.w, 6);
  }
  function sign(c, x, y, text, col) {
    c.save(); c.font = '800 34px -apple-system, system-ui, sans-serif'; var w = c.measureText(text).width + 60;
    c.fillStyle = col || '#1b2140'; rr(c, x - w / 2, y - 32, w, 64, 16); c.fill(); line(c, 4); c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 2); c.restore();
  }
  function shelf(c, x, y, w, rows, items) {
    c.fillStyle = '#8a5a3b'; rr(c, x, y, w, rows * 70 + 20, 8); c.fill(); line(c, 4); c.stroke();
    c.fillStyle = '#f3e3c8'; for (var r = 0; r < rows; r++) c.fillRect(x + 10, y + 10 + r * 70, w - 20, 60);
    for (var r2 = 0; r2 < rows; r2++) for (var i = 0, n = Math.floor((w - 20) / 46); i < n; i++) emoji(c, items[(r2 * 3 + i) % items.length], x + 33 + i * 46, y + 42 + r2 * 70, 34);
  }
  function plant(c, x, y) { c.fillStyle = '#c8553d'; rr(c, x - 26, y - 40, 52, 44, 8); c.fill(); line(c, 3); c.stroke(); emoji(c, '🪴', x, y - 70, 70); }
  function clock(c, x, y) { c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, 34, 0, 6.283); c.fill(); line(c, 5); c.stroke(); var h = G.vnParts().h % 12, m = G.vnParts().mi; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(h / 6 * Math.PI) * 18, y - Math.cos(h / 6 * Math.PI) * 18); c.moveTo(x, y); c.lineTo(x + Math.sin(m / 30 * Math.PI) * 26, y - Math.cos(m / 30 * Math.PI) * 26); c.stroke(); }

  /* đồ đạc riêng từng tiệm (vẽ trên tường / sàn phía sau người bán) */
  var DECOR = {
    barber: function (c, sc) {
      for (var i = 0; i < 3; i++) {   // 3 gương + ghế cắt tóc
        var mx = 900 + i * 190;
        c.fillStyle = '#e8f3f7'; rr(c, mx, 120, 140, 200, 70); c.fill(); line(c, 6); c.stroke();
        c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(mx + 30, 150, 14, 120);
        c.fillStyle = '#1b2140'; rr(c, mx + 30, 470, 80, 90, 14); c.fill(); line(c, 4); c.stroke();
        c.fillStyle = '#c8553d'; rr(c, mx + 22, 440, 96, 40, 12); c.fill(); c.stroke();
        c.fillStyle = '#888'; c.fillRect(mx + 64, 560, 12, 50); c.fillRect(mx + 40, 606, 60, 10);
      }
      // cột sọc đỏ trắng
      var t = Date.now() / 300;
      c.save(); rr(c, 300, 130, 50, 230, 25); c.clip(); c.fillStyle = '#fff'; c.fillRect(300, 130, 50, 230);
      c.strokeStyle = '#c8553d'; c.lineWidth = 14; for (var k = -10; k < 20; k++) { var yy = 130 + ((k * 40 + t * 10) % 300); c.beginPath(); c.moveTo(300, yy); c.lineTo(350, yy - 30); c.stroke(); }
      c.restore(); line(c, 5); rr(c, 300, 130, 50, 230, 25); c.stroke();
      emoji(c, '✂️', 420, 405, 36); emoji(c, '🪒', 470, 405, 36); emoji(c, '🧴', 860, 405, 36);
    },
    post: function (c, sc) {
      // tường hộp thư
      c.fillStyle = '#b07a4a'; rr(c, 860, 100, 520, 270, 10); c.fill(); line(c, 5); c.stroke();
      for (var r = 0; r < 4; r++) for (var k = 0; k < 7; k++) { c.fillStyle = '#d9b27c'; rr(c, 875 + k * 72, 115 + r * 62, 62, 52, 6); c.fill(); c.lineWidth = 2; c.stroke(); c.fillStyle = '#3a2418'; c.fillRect(875 + k * 72 + 26, 115 + r * 62 + 22, 10, 6); }
      // chồng bưu kiện
      for (var b = 0; b < 4; b++) emoji(c, '📦', 260 + (b % 2) * 70, 600 - Math.floor(b / 2) * 64, 70);
      emoji(c, '✉️', 1360, 560, 54); emoji(c, '📮', 1400, 640, 90);
    },
    bank: function (c, sc) {
      // máy ATM
      c.fillStyle = '#5b6b7f'; rr(c, 1180, 160, 200, 300, 16); c.fill(); line(c, 5); c.stroke();
      c.fillStyle = '#9fd3f0'; rr(c, 1210, 200, 140, 90, 8); c.fill(); c.lineWidth = 3; c.stroke();
      c.fillStyle = '#2c3550'; for (var i = 0; i < 9; i++) { rr(c, 1222 + (i % 3) * 42, 310 + Math.floor(i / 3) * 34, 34, 26, 5); c.fill(); }
      c.fillStyle = '#fff'; c.font = '800 22px sans-serif'; c.textAlign = 'center'; c.fillText('ATM', 1280, 186);
      emoji(c, '💳', 1280, 430, 34);
      plant(c, 140, 520); plant(c, 1420, 560); clock(c, 380, 200);
    },
    super: function (c, sc) {
      shelf(c, 80, 140, 330, 3, ['🍎', '🥛', '🍞', '🧃', '🥫', '🍌', '🥚', '🧀', '🍪']);
      emoji(c, '🍉', 1120, 330, 60); emoji(c, '🍊', 1170, 340, 50);
      // tủ lạnh kính
      c.fillStyle = '#d9eef5'; rr(c, 470, 110, 220, 290, 10); c.fill(); line(c, 5); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(580, 110); c.lineTo(580, 400); c.stroke();
      emoji(c, '🥛', 520, 180, 40); emoji(c, '🧃', 630, 180, 40); emoji(c, '🧈', 520, 260, 40); emoji(c, '🍦', 630, 260, 40); emoji(c, '🥚', 575, 340, 40);
      emoji(c, '🛒', 1380, 700, 90);
    },
    pharmacy: function (c, sc) {
      shelf(c, 90, 140, 300, 3, ['💊', '🧴', '🩹', '🌡️', '😷', '🧼', '🪥', '💧', '🩺']);
      // dấu thập xanh phát sáng
      var pulse = 0.6 + Math.sin(Date.now() / 500) * 0.25;
      c.fillStyle = 'rgba(80,220,140,' + pulse.toFixed(2) + ')'; c.fillRect(948, 120, 40, 120); c.fillRect(908, 160, 120, 40);
      line(c, 4); c.strokeRect(948, 120, 40, 120); c.strokeRect(908, 160, 120, 40);
    },
    gym: function (c, sc) {
      // gương lớn + giá tạ + máy chạy bộ
      c.fillStyle = '#dfeef3'; rr(c, 80, 90, 600, 270, 10); c.fill(); line(c, 6); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(140, 110, 24, 220); c.fillRect(190, 110, 10, 220);
      c.fillStyle = '#3a3f4b'; rr(c, 1080, 400, 360, 30, 8); c.fill(); for (var i = 0; i < 5; i++) { c.fillStyle = '#1b2140'; c.fillRect(1100 + i * 70, 370, 40, 30); c.fillStyle = '#c8553d'; c.fillRect(1094 + i * 70, 364, 12, 42); c.fillRect(1134 + i * 70, 364, 12, 42); }
      emoji(c, '🏃', 1100, 250, 90); emoji(c, '🧘', 880, 620, 80); emoji(c, '🏋️', 260, 620, 80);
      c.fillStyle = '#2f7a63'; rr(c, 760, 560, 240, 40, 12); c.fill();
    }
  };

  /* tiệm có ảnh nội thất: cửa sổ trong ảnh đổi màu theo buổi, có mưa rơi */
  function winFx(c, sc) {
    var part = G.dayPart ? G.dayPart() : 'trua', rain = G.weather && G.weather() === 'rain';
    var col = { sang: 'rgba(255,217,194,.22)', chieu: 'rgba(255,211,138,.2)', hoanghon: 'rgba(240,138,108,.34)', toi: 'rgba(20,26,64,.64)' }[part] || null;
    if (rain) col = part === 'toi' ? 'rgba(15,20,45,.68)' : 'rgba(110,122,145,.46)';
    if (!col) return;
    var t = Date.now() / 1000;
    (sc.lay.wins || []).forEach(function (w) {
      var o = w[0] === 'o', bx = o ? w[1] - w[3] : w[1], by = o ? w[2] - w[3] : w[2], bw = o ? w[3] * 2 : w[3], bh = o ? w[3] * 2 : w[4];
      c.save(); c.beginPath();
      if (o) c.arc(w[1], w[2], w[3], 0, 6.283); else c.rect(bx, by, bw, bh);
      c.clip();
      c.fillStyle = col; c.fillRect(bx, by, bw, bh);
      if (part === 'toi' && !rain) { c.fillStyle = '#ffe9a8'; for (var j = 0; j < 7; j++) { c.beginPath(); c.arc(bx + 10 + (j * 61 % (bw - 20)), by + 10 + (j * 37 % (bh * 0.6)), 2.2, 0, 6.283); c.fill(); } }   // sao đêm
      if (rain) {
        c.strokeStyle = 'rgba(230,240,255,.75)'; c.lineWidth = 2; c.beginPath();
        for (var k = 0; k < 30; k++) { var rx = bx + ((k * 53 + t * 40) % bw), ry = by + ((k * 97 + t * 520) % bh); c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 16); }
        c.stroke();
      }
      c.restore();
    });
  }

  G.drawRoom = function (c, sc) {
    var R = sc.room;
    if (sc.lay) {
      var a = G.asset(sc.lay.bg);
      if (a.ok) c.drawImage(a.img, 0, 0, sc.w, sc.h); else { c.fillStyle = '#efe4d2'; c.fillRect(0, 0, sc.w, sc.h); }
      winFx(c, sc);
      return;
    }
    wall(c, sc, R);
    if (R.window) windowView(c, R.window[0], R.window[1], R.window[2], R.window[3]);
    if (DECOR[R.kind]) DECOR[R.kind](c, sc);
    sign(c, sc.w / 2, 56, R.sign, R.signCol);
    // bảng thông tin tiếng Anh
    (sc.boards || []).forEach(function (b) {
      c.fillStyle = '#2b3a33'; rr(c, b.x - 95, b.y - 70, 190, 140, 10); c.fill(); c.strokeStyle = '#8a5a3b'; c.lineWidth = 8; c.stroke();
      c.fillStyle = '#fff'; c.font = '800 20px -apple-system, system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.title, b.x, b.y - 44);
      c.font = '600 15px -apple-system, system-ui, sans-serif'; c.fillStyle = '#d8f0e4';
      for (var i = 0; i < Math.min(3, b.lines.length); i++) c.fillText(b.lines[i][0].slice(0, 22), b.x, b.y - 14 + i * 24);
      c.fillStyle = '#ffd56b'; c.font = '700 14px sans-serif'; c.fillText('👆 bấm để đọc', b.x, b.y + 84);
    });
  };
  /* quầy trước mặt người bán */
  G.drawRoomFront = function (c, sc) {
    if (sc.lay) {   // tiệm có ảnh: vẽ lại đúng mảng quầy trong ảnh đè lên người bán
      var a = G.asset(sc.lay.bg), f = sc.lay.front;
      if (a.ok) { var kx = a.img.naturalWidth / sc.w, ky = a.img.naturalHeight / sc.h; c.drawImage(a.img, f[0] * kx, f[1] * ky, f[2] * kx, f[3] * ky, f[0], f[1], f[2], f[3]); }
      return;
    }
    var R = sc.room, tx = sc.teacher.x, ty = sc.teacher.y, w = R.counterW || 420;
    c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(tx, ty + 70, w / 2 + 20, 24, 0, 0, 6.283); c.fill();
    c.fillStyle = R.counter || '#8a5a3b'; rr(c, tx - w / 2, ty - 10, w, 84, 12); c.fill(); line(c, 5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(tx - w / 2 + 10, ty - 4, w - 20, 10);
    (R.onCounter || []).forEach(function (e, i, a) { emoji(c, e, tx - w / 2 + (i + 1) * w / (a.length + 1), ty - 30, 44); });
  };

  /* bảng đứng trên sàn (tiệm có ảnh nội thất): bấm để đọc */
  G.drawStandee = function (c, b) {
    var x = b.x, y = b.y;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(x, y + 74, 84, 14, 0, 0, 6.283); c.fill();
    line(c, 6); c.beginPath(); c.moveTo(x - 72, y + 74); c.lineTo(x - 58, y - 50); c.moveTo(x + 72, y + 74); c.lineTo(x + 58, y - 50); c.stroke();
    c.fillStyle = '#2b3a33'; rr(c, x - 90, y - 70, 180, 124, 10); c.fill(); c.strokeStyle = '#8a5a3b'; c.lineWidth = 7; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.font = '800 17px -apple-system, system-ui, sans-serif'; c.fillText(b.title, x, y - 46);
    c.font = '600 13px -apple-system, system-ui, sans-serif'; c.fillStyle = '#d8f0e4';
    for (var i = 0; i < Math.min(3, b.lines.length); i++) c.fillText(b.lines[i][0].slice(0, 24), x, y - 20 + i * 20);
    c.font = '700 13px sans-serif'; var tw = c.measureText('👆 bấm để đọc').width + 16;
    c.fillStyle = 'rgba(27,33,64,.85)'; rr(c, x - tw / 2, y + 62, tw, 22, 11); c.fill();
    c.fillStyle = '#ffd56b'; c.fillText('👆 bấm để đọc', x, y + 73);
    c.restore();
  };

  /* bảng thông tin: bấm để đọc */
  G.openBoard = function (b) {
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    document.getElementById('panel-title').textContent = '📋 ' + b.title;
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = '';
    body.appendChild(G.el('div.wk-hint', '📖 Đọc bảng như ngoài đời. Bấm từng dòng để nghe và xem nghĩa.'));
    var doc = G.el('div.wk-doc');
    b.lines.forEach(function (ln) {
      var vi = G.el('div.small.faint', { style: { display: 'none' } }, ln[1]);
      doc.appendChild(G.el('div.bd-line', { onclick: function () { vi.style.display = vi.style.display === 'none' ? '' : 'none'; G.say(ln[0], 'en'); } }, G.el('b', ln[0]), vi));
    });
    body.appendChild(doc);
    if (b.q) body.appendChild(G.el('p', G.el('b', '❓ ' + b.q[0]), G.el('div.small.faint', 'Gợi ý: ' + b.q[1])));
    G.markStudy();
  };
})();
