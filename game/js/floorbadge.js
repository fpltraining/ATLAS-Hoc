/* Huy hiệu trên đầu theo tầng của Trường Anh ngữ Brightford (hình giấy anh Han đặt ChatGPT: fbadge_1 … fbadge_4.png).
   Có chứng chỉ tầng nào thì đội huy hiệu tầng đó; bài kiểm tra đầu vào cũng tính (A1 → tầng 1, A2 → tầng 2, B1 → tầng 3, B2 → tầng 4).
   Chưa có huy hiệu nào thì trên đầu để trống. Rank 9 bậc theo điểm (Đồng → Chiến Thần) chỉ còn ở trang hồ sơ.
   Chưa có tệp hình thì giữ huy hiệu rank cũ trên đầu như trước. */
var G = window.G || (window.G = {});

(function () {
  G.FLOOR_BADGES = [
    { n: 1, img: 'fbadge_1.png', name: 'Tân binh Brightford', floor: 'Tầng 1 · Nền tảng', how: 'Đạt chứng chỉ Tầng 1 · Nền tảng' },
    { n: 2, img: 'fbadge_2.png', name: 'Nhà thám hiểm', floor: 'Tầng 2 · A1', how: 'Đạt chứng chỉ Tầng 2 · A1' },
    { n: 3, img: 'fbadge_3.png', name: 'Ngôi sao thành phố', floor: 'Tầng 3 · A2 – B1', how: 'Đạt chứng chỉ Tầng 3 · A2 – B1' },
    { n: 4, img: 'fbadge_4.png', name: 'Bậc thầy ngôn ngữ', floor: 'Tầng 4 · B1 – B2', how: 'Đạt chứng chỉ Tầng 4 · B1 – B2' }
  ];
  function has(n) { return !!(G.ASSET_REV && G.ASSET_REV[n]); }
  G.floorBadgeReady = function () { return has('fbadge_1.png'); };

  /* số huy hiệu đã có (0 … 4): tầng đã tốt nghiệp, hoặc trình độ đầu vào */
  G.floorBadgeLevel = function () {
    var t = (G.S.totNghiep && G.S.totNghiep.en) || {}, n = 0, i;
    for (i = 0; i < (G.EN_FLOORS || []).length; i++) { var f = G.EN_FLOORS[i]; if (f.grad && t[f.grad]) n = Math.max(n, f.n); }
    var lv = G.S.dauVao ? G.S.dauVao.lv : 0;   // 0 A0, 1 Pre-A1, 2 A1, 3 A2, 4 B1, 5 B2
    return Math.min(4, Math.max(n, lv - 1, 0));
  };
  G.floorBadge = function () { var n = G.floorBadgeLevel(); return n ? G.FLOOR_BADGES[n - 1] : null; };

  /* vẽ trên đầu nhân vật: huy hiệu nhún nhẹ, vệt sáng quét chéo qua mỗi ~3,5 giây, vài đốm sao lấp lánh quanh viền */
  G.drawHeadBadge = function (ctx, x, headY, moving, t) {
    if (!G.floorBadgeReady()) { if (G.drawRankBadge) G.drawRankBadge(ctx, x, headY, moving, t); return; }
    var b = G.floorBadge(); if (!b) return;
    var a = G.asset(b.img); if (!a.ok) return;
    var sz = 54, bob = Math.sin(t * 2.2) * 3, cx = x, cy = headY - 26 + bob, R = sz * 0.47;
    ctx.save();
    ctx.fillStyle = 'rgba(60,40,20,.18)'; ctx.beginPath(); ctx.ellipse(cx, cy + R + 4, R * 0.7, 4, 0, 0, 6.283); ctx.fill();
    ctx.drawImage(a.img, cx - sz / 2, cy - sz / 2, sz, sz);
    // vệt sáng quét chéo (chỉ trong hình tròn)
    var ph = (t % 3.5) / 3.5;
    if (ph < 0.32) {
      var k = ph / 0.32, gx = cx - R * 1.6 + k * R * 3.2;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.clip();
      var g = ctx.createLinearGradient(gx - 12, cy - 12, gx + 12, cy + 12);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,252,235,.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
    ctx.restore();
    // đốm sao 4 cánh nhấp nháy quanh viền
    for (var i = 0; i < 3; i++) {
      var q = t * (moving ? 2.4 : 1.4) + i * 2.3, al = Math.max(0, Math.sin(q * 1.7));
      if (al < 0.08) continue;
      var ang = i * 2.1 + 0.6, sx = cx + Math.cos(ang) * R * 1.12, sy = cy + Math.sin(ang) * R * 1.12, L = 3 + al * 4;
      ctx.save(); ctx.globalAlpha = al; ctx.fillStyle = '#fff6c8';
      ctx.beginPath(); ctx.moveTo(sx, sy - L); ctx.quadraticCurveTo(sx, sy, sx + L, sy); ctx.quadraticCurveTo(sx, sy, sx, sy + L);
      ctx.quadraticCurveTo(sx, sy, sx - L, sy); ctx.quadraticCurveTo(sx, sy, sx, sy - L); ctx.fill();
      ctx.restore();
    }
  };

  /* thẻ huy hiệu cho trang hồ sơ: 4 huy hiệu, cái đã có lấp lánh, cái chưa có xám kèm cách nhận */
  G.floorBadgeGrid = function () {
    if (!G.floorBadgeReady()) return null;
    var lv = G.floorBadgeLevel();
    return G.el('div.fb-grid', G.FLOOR_BADGES.map(function (b) {
      var got = b.n <= lv, cur = b.n === lv;
      return G.el('div.fb' + (got ? '' : '.lock') + (cur ? '.cur' : ''),
        G.el('div.fb-pic.shine', G.imgEl(b.img, 'fb-img')),
        G.el('b', got ? null : G.ic3('lock', 'ic3-s'), b.name),
        G.el('span.small', b.floor),
        G.el('span.small.faint', cur ? 'Đang đội trên đầu' : got ? 'Đã có' : b.how));
    }));
  };

  /* có huy hiệu mới (tốt nghiệp tầng, kiểm tra đầu vào, lấy tiến độ từ máy khác): màn chúc mừng một lần */
  var fbT = 0;
  G.checkFloorBadge = function () {
    if (!G.floorBadgeReady() || !G.S) return;
    var lv = G.floorBadgeLevel(), seen = G.S.hhTang || 0;
    if (lv <= seen) { if (lv < seen) { G.S.hhTang = lv; G.save(); } return; }
    // đang có màn khác (bằng tốt nghiệp, kiểm tra, chọn nhân vật, bảng bài học) thì chờ, hiện sau khi màn đó đóng
    var pl = document.getElementById('placement'), cr = document.getElementById('create'), pn = document.getElementById('panel');
    if (document.querySelector('.modal, .cgate') || (pn && pn.classList.contains('open')) || (pl && pl.style.display !== 'none' && pl.offsetParent) || (cr && cr.style.display !== 'none')) {
      clearTimeout(fbT); if ((G._fbTries = (G._fbTries || 0) + 1) < 900) fbT = setTimeout(G.checkFloorBadge, 2500);
      return;
    }
    G._fbTries = 0;
    var b = G.FLOOR_BADGES[lv - 1];
    G.S.hhTang = lv; G.save();
    G.sfx('done'); if (G.confetti) G.confetti();
    var wrap = G.el('div.modal.fb-modal', G.el('div.choose.fb-card',
      G.el('div.kicker', 'Huy hiệu mới'),
      G.el('div.fb-big.shine', G.imgEl(b.img, 'fb-img')),
      G.el('h2', b.name),
      G.el('p.small', b.floor + ' · Huy hiệu này hiện trên đầu nhân vật của bạn, ai gặp cũng biết trình độ của bạn.'),
      G.el('button.clay-btn', { onclick: function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } }, 'Đội lên đầu ›')));
    document.body.appendChild(wrap);
  };
})();
