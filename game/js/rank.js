/* Rank kiểu Liên Quân và huy hiệu thành tích, gộp từ giao diện cũ vào game.

   Điểm rank = XP trong game + điểm đã có ở giao diện cũ (đọc một lần từ máy, không mất).
   Đồng → Bạc → Vàng → Bạch Kim → Kim Cương → Tinh Anh (mỗi rank 4 bậc IV → I) → Cao Thủ → Chiến Tướng → Chiến Thần.
   Huy hiệu rank lơ lửng trên đầu nhân vật, lấp lánh khi đi. Lên rank hay mở huy hiệu thì có màn ăn mừng. */
var G = window.G || (window.G = {});

(function () {
  G.RANKS = [
    { name: 'Đồng', min: 0, color: '#b07a4a' },
    { name: 'Bạc', min: 300, color: '#8f9bab' },
    { name: 'Vàng', min: 800, color: '#d6a531' },
    { name: 'Bạch Kim', min: 1600, color: '#3fb5b8' },
    { name: 'Kim Cương', min: 3000, color: '#5b7cf0' },
    { name: 'Tinh Anh', min: 5000, color: '#8d5cf0' },
    { name: 'Cao Thủ', min: 8000, color: '#e0442a' },
    { name: 'Chiến Tướng', min: 12000, color: '#b8282c' },
    { name: 'Chiến Thần', min: 18000, color: '#c8962b' }
  ];
  var TIERS = ['IV', 'III', 'II', 'I'];

  G.rankPoints = function () { return (G.S.xp || 0) + (G.S.diemCu || 0); };
  G.rankOf = function (total) {
    var R = G.RANKS, i = 0;
    while (i + 1 < R.length && total >= R[i + 1].min) i++;
    var r = R[i], nx = R[i + 1];
    var out = { i: i, name: r.name, color: r.color, img: 'rank_' + (i + 1) + '.webp', tier: '', label: r.name, pct: 100, next: null, left: 0 };
    if (!nx) return out;
    var span = nx.min - r.min, tiered = i <= 5;
    var k = tiered ? Math.min(3, Math.floor((total - r.min) / span * 4)) : 0;
    var tMin = r.min + (tiered ? span / 4 * k : 0), tSpan = tiered ? span / 4 : span;
    out.tier = tiered ? TIERS[k] : '';
    out.label = tiered ? r.name + ' ' + TIERS[k] : r.name;
    out.pct = Math.max(0, Math.min(100, Math.round((total - tMin) / tSpan * 100)));
    out.next = tiered && k < 3 ? r.name + ' ' + TIERS[k + 1] : nx.name;
    out.left = Math.ceil(tMin + tSpan - total);
    return out;
  };

  /* ---------- huy hiệu ---------- */
  function wordsLearned() {
    var n = 0, id;
    for (id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'en' && (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id]))) n += G.ROOMS[id].items.length;
    for (id in (G.S.truyen || {})) n += (G.S.truyen[id] || 0) * 5;   // mỗi chương truyện có khoảng 5 từ đáng nhớ
    return n;
  }
  function anyTask() { for (var d in G.S.ngay) { var v = G.S.ngay[d].viec || {}; for (var k in v) return true; } return false; }
  function fullDay() { for (var d in G.S.ngay) { var v = G.S.ngay[d].viec || {}, n = 0; for (var k in v) n++; if (n >= 4) return true; } return false; }
  function chapters() { var n = 0; for (var id in (G.S.truyen || {})) n += G.S.truyen[id] || 0; return n; }
  function bestStreak() { var c = G.S.chuoi || {}; return Math.max(c.daiNhat || 0, c.hienTai || 0); }
  function gradEn() { return !!(G.S.totNghiep && G.S.totNghiep.en && G.S.totNghiep.en.A1); }

  G.BADGES = [
    { id: 'first', img: 'badge_1.webp', name: 'Bước đầu tiên', how: 'Xong việc học đầu tiên', ok: anyTask },
    { id: 'streak3', img: 'badge_2.webp', name: 'Chuỗi 3 ngày', how: 'Học 3 ngày liên tiếp', ok: function () { return bestStreak() >= 3; } },
    { id: 'streak7', img: 'badge_3.webp', name: 'Chuỗi 7 ngày', how: 'Học 7 ngày liên tiếp', ok: function () { return bestStreak() >= 7; } },
    { id: 'streak30', img: 'badge_4.webp', name: 'Chuỗi 30 ngày', how: 'Học 30 ngày liên tiếp', ok: function () { return bestStreak() >= 30; } },
    { id: 'words100', img: 'badge_5.webp', name: '100 từ', how: 'Học được 100 từ và cụm từ', ok: function () { return wordsLearned() >= 100; } },
    { id: 'words500', img: 'badge_6.webp', name: '500 từ', how: 'Học được 500 từ và cụm từ', ok: function () { return wordsLearned() >= 500; } },
    { id: 'story1', img: 'badge_7.webp', name: 'Truyện đầu tiên', how: 'Đọc xong một chương truyện', ok: function () { return chapters() >= 1; } },
    { id: 'speak', img: 'badge_8.webp', name: 'Giọng nói chuẩn', how: 'Nói qua micro đạt từ 90 điểm 20 lần', ok: function () { return (G.S.noiTot || 0) >= 20; } },
    { id: 'reader', img: 'badge_9.webp', name: 'Mọt sách', how: 'Đọc xong 20 chương truyện', ok: function () { return chapters() >= 20; } },
    { id: 'enA1', img: 'badge_10.webp', name: 'Tốt nghiệp A1', how: 'Qua bài thi cuối cấp A1 tiếng Anh', ok: gradEn },
    { id: 'perfect', img: 'badge_11.webp', name: 'Điểm tuyệt đối', how: 'Đúng hết bài kiểm tra của một phòng học', ok: function () { return !!G.S.tuyetDoi; } },
    { id: 'fullday', img: 'badge_12.webp', name: 'Ngày trọn vẹn', how: 'Xong cả 4 việc trong một ngày', ok: fullDay }
  ];
  G.badgeGot = function (id) { return !!(G.S.huyHieu && G.S.huyHieu[id]); };

  /* kiểm tra rank và huy hiệu mới; gọi sau mỗi lần cộng điểm / xong việc */
  var lastLabel = null, busy = false;
  G.checkAchievements = function () {
    if (!G.S || busy) return;
    // đang học / nói chuyện / đi xe: chờ xong rồi mới ăn mừng, không chen ngang
    var pn = document.getElementById('panel'), ride = document.getElementById('ride');
    if ((pn && /open/.test(pn.className)) || (ride && ride.style.display !== 'none' && ride.parentNode && ride.innerHTML) || document.querySelector('.modal')) {
      clearTimeout(G._achWait); G._achWait = setTimeout(G.checkAchievements, 2500); return;
    }
    busy = true;
    try {
      G.S.huyHieu = G.S.huyHieu || {};
      var c = G.S.chuoi || {}; if ((c.hienTai || 0) > (c.daiNhat || 0)) c.daiNhat = c.hienTai;
      var fresh = [];
      for (var i = 0; i < G.BADGES.length; i++) {
        var b = G.BADGES[i];
        if (!G.S.huyHieu[b.id]) { var ok = false; try { ok = b.ok(); } catch (e) { ok = false; } if (ok) { G.S.huyHieu[b.id] = G.vnNow(); fresh.push(b); } }
      }
      var r = G.rankOf(G.rankPoints());
      var up = lastLabel !== null && r.label !== lastLabel && (G.S.rankDaThay || '') !== r.label;
      lastLabel = r.label;
      if (fresh.length || up) {
        if (up) G.S.rankDaThay = r.label;
        G.save();
        celebrate(up ? r : null, fresh);
      }
    } finally { busy = false; }
  };
  G.initRank = function () { lastLabel = G.rankOf(G.rankPoints()).label; G.S.rankDaThay = G.S.rankDaThay || lastLabel; };

  function celebrate(r, badges) {
    var items = [];
    if (r) items.push({ img: r.img, t: 'Lên rank ' + r.label + '!', s: 'Tiếp tục học để lên ' + (r.next || 'cao hơn nữa') + '.' });
    for (var i = 0; i < badges.length; i++) items.push({ img: badges[i].img, t: 'Huy hiệu mới: ' + badges[i].name, s: badges[i].how });
    var k = 0;
    function show() {
      if (k >= items.length) return;
      var it = items[k++];
      var wrap = G.el('div.modal.ach', G.el('div.ach-card',
        G.el('div.ach-glow', G.imgEl(it.img, 'ach-img')),
        G.el('b', it.t), G.el('div.small.faint', it.s),
        G.el('button.btn.seal', { onclick: function () { document.body.removeChild(wrap); show(); } }, 'Tuyệt! ›')));
      document.body.appendChild(wrap);
      if (G.confetti) G.confetti();
      if (G.sfx) G.sfx('done');
    }
    show();
  }

  /* ---------- huy hiệu rank trên đầu nhân vật (vẽ trên canvas) ---------- */
  G.drawRankBadge = function (ctx, x, headY, moving, t) {
    var r = G.rankOf(G.rankPoints());
    var a = G.asset(r.img); if (!a.ok) return;
    var bob = Math.sin(t * 2.2) * 3, sz = 46, cx = x, cy = headY - 24 + bob;
    // quầng sáng nhấp nháy theo màu rank, sáng hơn khi đang đi
    var pulse = 0.35 + 0.25 * Math.sin(t * (moving ? 7 : 3)) + (moving ? 0.2 : 0);
    var g = ctx.createRadialGradient(cx, cy, 2, cx, cy, sz * 0.9);
    g.addColorStop(0, 'rgba(255,240,180,' + pulse.toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, sz * 0.9, 0, 6.283); ctx.fill();
    ctx.drawImage(a.img, cx - sz / 2, cy - sz / 2, sz, sz);
    // tia lấp lánh chạy quanh huy hiệu
    var n = moving ? 3 : 1;
    for (var i = 0; i < n; i++) {
      var ph = t * (moving ? 3.2 : 1.6) + i * 2.1, al = Math.max(0, Math.sin(ph * 2));
      if (al < 0.05) continue;
      var sx = cx + Math.cos(ph) * sz * 0.55, sy = cy + Math.sin(ph) * sz * 0.45, L = 5 + al * 4;
      ctx.save(); ctx.globalAlpha = al; ctx.strokeStyle = '#fff8d6'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(sx - L, sy); ctx.lineTo(sx + L, sy); ctx.moveTo(sx, sy - L); ctx.lineTo(sx, sy + L); ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------- khối Rank & huy hiệu (sảnh, bảng Hôm nay) ---------- */
  G.rankCard = function () {
    var pts = G.rankPoints(), r = G.rankOf(pts);
    var bar = G.el('div.rk-bar', G.el('i')); bar.firstChild.style.width = r.pct + '%'; bar.firstChild.style.background = r.color;
    return G.el('div.rk-card',
      G.el('div.rk-emb', G.imgEl(r.img, 'rk-img')),
      G.el('div.rk-txt', G.el('div.kicker', 'Rank của bạn'), G.el('b.rk-name', { style: { color: r.color } }, r.label),
        bar, G.el('div.small.faint', r.next ? 'Còn ' + r.left + ' điểm nữa lên ' + r.next + ' · tổng ' + pts + ' điểm' : 'Rank cao nhất · ' + pts + ' điểm')));
  };
  G.badgeGrid = function () {
    var got = 0; for (var i = 0; i < G.BADGES.length; i++) if (G.badgeGot(G.BADGES[i].id)) got++;
    return G.el('div',
      G.el('div.small.faint', 'Đã mở ' + got + '/' + G.BADGES.length + ' huy hiệu'),
      G.el('div.bd-grid', G.BADGES.map(function (b) {
        var ok = G.badgeGot(b.id);
        return G.el('div.bd' + (ok ? '' : '.lock'), G.imgEl(b.img, 'bd-img'), G.el('b', b.name), G.el('span.small.faint', ok ? 'Mở ' + G.S.huyHieu[b.id].slice(0, 10).split('-').reverse().join('/') : b.how));
      })));
  };

  /* ---------- mang điểm và huy hiệu từ giao diện cũ sang (một lần, không tạo CSDL mới) ---------- */
  G.importOldProgress = function () {
    if (!G.S || G.S.daGopCu || !window.indexedDB) return;
    var req;
    try { req = indexedDB.open('atlas'); } catch (e) { return; }
    req.onupgradeneeded = function () { try { req.transaction.abort(); } catch (e) { /* chưa từng dùng giao diện cũ */ } };
    req.onerror = function () { G.S.daGopCu = G.vnNow(); G.save(); };
    req.onsuccess = function () {
      var db = req.result;
      if (!db.objectStoreNames.contains('kv')) { db.close(); G.S.daGopCu = G.vnNow(); G.save(); return; }
      var tx = db.transaction('kv', 'readonly'), st = tx.objectStore('kv'), xp = st.get('xp');
      tx.oncomplete = function () {
        var old = xp.result && xp.result.total ? xp.result.total : 0;
        G.S.diemCu = old; G.S.daGopCu = G.vnNow(); G.save(); db.close();
        if (old) { G.toast('Đã mang ' + old + ' điểm từ giao diện cũ sang rank của bạn.'); G.initRank(); }
      };
      tx.onerror = function () { db.close(); };
    };
  };
})();
