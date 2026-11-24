/* Nội thất các tiệm (ảnh): G.drawRoom vẽ nền và cửa sổ theo trời, G.drawRoomFront vẽ lại mảng quầy đè lên người bán,
   G.drawStandee vẽ bảng thông tin đứng trên sàn (bấm để đọc). */
var G = window.G || (window.G = {});

(function () {
  function rr(c, x, y, w, h, r) { G.roundRect(c, x, y, w, h, r); }
  function line(c, w) { c.strokeStyle = '#3a2418'; c.lineWidth = w || 4; }

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

  /* nền tiệm: ảnh nội thất (chưa tải xong thì tô màu nền), cửa sổ theo trời */
  G.drawRoom = function (c, sc) {
    if (!sc.lay) return;
    var a = G.asset(sc.lay.bg);
    if (a.ok) c.drawImage(a.img, 0, 0, sc.w, sc.h); else { c.fillStyle = '#efe4d2'; c.fillRect(0, 0, sc.w, sc.h); }
    winFx(c, sc);
  };
  /* quầy trước mặt người bán */
  G.drawRoomFront = function (c, sc) {
    if (!sc.lay) return;
    // vẽ lại đúng mảng quầy trong ảnh đè lên người bán
    var a = G.asset(sc.lay.bg), f = sc.lay.front, gl = sc.lay.glass;
    if (!a.ok) return;
    var kx = a.img.naturalWidth / sc.w, ky = a.img.naturalHeight / sc.h;
    // vách kính (ngân hàng): vẽ mờ để thấy người bên trong
    if (gl) { c.save(); c.globalAlpha = gl[4]; c.drawImage(a.img, gl[0] * kx, gl[1] * ky, gl[2] * kx, gl[3] * ky, gl[0], gl[1], gl[2], gl[3]); c.restore(); }
    c.drawImage(a.img, f[0] * kx, f[1] * ky, f[2] * kx, f[3] * ky, f[0], f[1], f[2], f[3]);
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
    c.font = '700 13px sans-serif'; var tw = c.measureText('bấm để đọc').width + 16;
    c.fillStyle = 'rgba(27,33,64,.85)'; rr(c, x - tw / 2, y + 62, tw, 22, 11); c.fill();
    c.fillStyle = '#ffd56b'; c.fillText('bấm để đọc', x, y + 73);
    c.restore();
  };

  /* bảng thông tin: bấm để đọc */
  G.openBoard = function (b) {
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    G.setTitle(b.title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = '';
    body.appendChild(G.el('div.wk-hint', G.ic3('book', 'ic3-s'), ' Đọc bảng như ngoài đời. Bấm từng dòng để nghe và xem nghĩa.'));
    var doc = G.el('div.wk-doc');
    b.lines.forEach(function (ln) {
      var vi = G.el('div.small.faint', { style: { display: 'none' } }, ln[1]);
      doc.appendChild(G.el('div.bd-line', { onclick: function () { vi.style.display = vi.style.display === 'none' ? '' : 'none'; G.say(ln[0], 'en'); } }, G.el('b', ln[0]), vi));
    });
    body.appendChild(doc);
    if (b.q) body.appendChild(G.el('p', G.el('b', G.ic3('question', 'ic3-s'), ' ' + b.q[0]), G.el('div.small.faint', 'Gợi ý: ' + b.q[1])));
    G.markStudy();
  };
})();
