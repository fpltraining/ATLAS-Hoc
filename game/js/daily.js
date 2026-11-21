/* Hôm nay: kế hoạch học mỗi ngày (mặc định 2 giờ) gom hết vào game.
   4 việc: Học bài ở trường · Đọc truyện ở nhà · Nói chuyện ngoài phố · Ôn từ khó ở nhà.
   Đếm phút học thật (trang đang mở và có thao tác trong 60 giây gần nhất), theo giờ Việt Nam.
   Nhà của bạn = góc học: đọc truyện song ngữ (kho truyện của app) và ôn từ khó. */
var G = window.G || (window.G = {});

(function () {
  var GOAL_MIN = 120;   // mặc định khi chưa chọn mốc thời gian (Sảnh → Mục tiêu và mốc thời gian)
  /* phút cần học hôm nay: theo mốc thời gian người học chọn (G.planToday), chưa chọn mốc thì theo số phút đã đặt */
  function goalMin() {
    var pt = G.planToday && G.planToday();
    if (pt && !pt.xong && !pt.het) return pt.phut;
    return (G.S && G.S.caiDat && G.S.caiDat.phutNgay) || GOAL_MIN;
  }
  var TASKS = [
    { id: 'bai', icon: '🏫', name: 'Học bài ở trường', hint: 'Học, luyện hoặc kiểm tra một phòng', min: 45 },
    { id: 'doc', icon: '📖', name: 'Đọc 1 chương truyện', hint: 'Về nhà, mở góc đọc truyện', min: 25 },
    { id: 'noi', icon: '💬', name: 'Nói chuyện ngoài phố', hint: 'Quán cà phê, chợ, bệnh viện hoặc đi xe buýt', min: 30 },
    { id: 'on', icon: '🔁', name: 'Ôn câu đã học', hint: 'Về nhà, ôn các câu sắp quên', min: 20 }
  ];

  function today() {
    var k = G.vnDay(), n = G.S.ngay || (G.S.ngay = {});
    if (!n[k]) n[k] = { giay: 0, viec: {} };
    // chỉ giữ 60 ngày gần nhất
    var ks = []; for (var x in n) if (n.hasOwnProperty(x)) ks.push(x);
    if (ks.length > 60) { ks.sort(); delete n[ks[0]]; }
    return n[k];
  }
  G.today = today;

  /* đánh dấu xong một việc hôm nay */
  G.markTask = function (id) {
    var d = today();
    if (d.viec[id]) return;
    d.viec[id] = G.vnNow().slice(11, 16);
    G.save();
    var t = null; for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) t = TASKS[i];
    if (t) G.toast('✅ Xong việc hôm nay: ' + t.name);
    if (G.achSoon) G.achSoon();
    if (G.updateHud) G.updateHud();
  };

  /* % hôm nay: một nửa theo số việc xong, một nửa theo phút học / 120 */
  G.dayProgress = function () {
    var d = today(), done = 0;
    for (var i = 0; i < TASKS.length; i++) if (d.viec[TASKS[i].id]) done++;
    var mins = Math.floor(d.giay / 60);
    var gm = goalMin(), pct = Math.min(100, Math.round(((done / TASKS.length) + Math.min(1, mins / gm)) / 2 * 100));
    return { done: done, all: TASKS.length, mins: mins, goal: gm, pct: pct };
  };

  /* đếm thời gian học thật */
  var lastInput = Date.now();
  function touch() { lastInput = Date.now(); }
  window.addEventListener('pointerdown', touch, true);
  window.addEventListener('keydown', touch, true);
  window.addEventListener('touchstart', touch, true);
  setInterval(function () {
    if (!G.S || !G.S.nhanVat) return;
    if (document.visibilityState && document.visibilityState !== 'visible') return;
    if (Date.now() - lastInput > 60000) return;
    var d = today(), before = Math.floor(d.giay / 60);
    d.giay += 10;
    G.save();
    if (Math.floor(d.giay / 60) !== before && G.updateHud) G.updateHud();
  }, 10000);

  /* ---------- bảng "Hôm nay" ---------- */
  function panelOpen(title) {
    var panel = document.getElementById('panel');
    panel.className = 'panel open';
    document.getElementById('panel-title').textContent = title;
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body');
    body.innerHTML = ''; body.className = 'panel-body';
    return body;
  }
  G.openToday = function () {
    var body = panelOpen('Hôm nay · ' + G.vnDay().split('-').reverse().join('/'));
    var p = G.dayProgress(), d = today();
    var ring = G.el('div.td-ring', G.el('b', p.pct + '%'));
    ring.style.setProperty('--p', p.pct);
    body.appendChild(G.el('div.td-head', ring,
      G.el('div', G.el('b', p.mins + ' / ' + p.goal + ' phút'), G.el('div.small.faint', p.done + '/' + p.all + ' việc · chuỗi ' + G.S.chuoi.hienTai + ' ngày'))));
    if (G.planLine) body.appendChild(G.el('div.td-plan', G.el('b', '📅 Tiến độ theo mốc'), G.el('div.small', G.planLine()),
      G.S.mocHoc ? null : G.el('button.btn.sm', { onclick: function () { G.goLobby && G.goLobby(); } }, 'Chọn mốc ở Sảnh')));
    if (G.rankCard) body.appendChild(G.rankCard());
    body.appendChild(G.el('div.td-list', TASKS.map(function (t) {
      var ok = !!d.viec[t.id];
      return G.el('div.td-item' + (ok ? '.ok' : ''),
        G.el('span.td-ic', ok ? '✅' : t.icon),
        G.el('div.td-txt', G.el('b', t.name), G.el('div.small.faint', ok ? 'Xong lúc ' + d.viec[t.id] : t.hint + ' · khoảng ' + t.min + ' phút')),
        !ok && (t.id === 'doc' || t.id === 'on') ? G.el('button.btn.sm', { onclick: function () { t.id === 'doc' ? G.openReader() : G.openReview(); } }, 'Làm ngay') : null);
    })));
    // kiểm tra tuần + sổ mình nói được
    if (G.openWeekly) body.appendChild(G.el('div.td-week',
      G.el('button.big' + (G.weeklyInfo().due ? '.seal' : ''), { onclick: G.openWeekly }, G.el('b', '📝 Kiểm tra tuần'), G.el('span', weekLine())),
      G.el('button.big', { onclick: G.openCanDo }, G.el('b', '📒 Mình nói được'), G.el('span', G.canDoStats().n + '/' + G.canDoStats().total + ' việc'))));
    // các cuộc nói chuyện hôm nay
    var ht = d.hoiThoai || [];
    body.appendChild(G.el('div.td-talks',
      G.el('b', '💬 Nói chuyện hôm nay · ' + ht.length + ' tình huống'),
      ht.length ? G.el('div.td-talk-list', ht.slice().reverse().map(function (h) {
        return G.el('div.td-talk', G.el('span.small.faint', h.luc), G.el('span', h.ten + ' · ' + h.tinhHuong), h.diem !== null && h.diem !== undefined ? G.el('span.mk-chip.' + G.scoreLabel(h.diem)[1], '🎤 ' + h.diem) : G.el('span.small.faint', 'không micro'));
      })) : G.el('div.small.faint', 'Chưa nói chuyện với ai hôm nay. Ra phố gặp mẹ, ông Ben, xe bánh Sunny… (người có 💬 trên đầu).')));
    // luyện nói: điểm hôm nay + bật/tắt micro
    var sp = d.noi && d.noi.n ? Math.round(d.noi.tong / d.noi.n) : null;
    var micBox = G.el('div.td-mic');
    function drawMic() {
      micBox.innerHTML = '';
      var on = G.micOn();
      micBox.appendChild(G.el('div.td-txt', G.el('b.td-mic-h', G.el('img.mk-ic', { src: G.assetUrl('ic_mic_ok.png'), alt: '' }), 'Luyện nói'),
        G.el('div.small.faint', sp !== null ? 'Hôm nay nói ' + d.noi.n + ' câu · điểm trung bình ' + sp + '/100 · ' + G.scoreLabel(sp)[0]
          : on ? 'Micro đang bật: nói câu trong bài học và ngoài phố, máy chấm 0–100 (chấm vừa phải).'
          : 'Đang học không micro: nghe mẫu rồi nhắc lại to, tự bấm "đã nói xong".')));
      micBox.appendChild(G.el('div.td-seg',
        G.el('button' + (on ? '.on' : ''), { onclick: function () { if (!G.canListen) { G.toast('Máy này chưa nghe được giọng nói. Trên iPhone/iPad hãy mở bằng Safari và bật Siri.'); return; } G.setMic(true); drawMic(); } }, G.el('img.mk-ic', { src: G.assetUrl('ic_mic.png'), alt: '' }), 'Dùng micro'),
        G.el('button' + (!on ? '.on' : ''), { onclick: function () { G.setMic(false); drawMic(); } }, G.el('img.mk-ic', { src: G.assetUrl('ic_lips.png'), alt: '' }), 'Không dùng micro')));
    }
    drawMic();
    body.appendChild(micBox);
    body.appendChild(G.el('p.small.faint', 'Làm đủ 4 việc và học đủ ' + p.goal + ' phút là tròn vòng hôm nay, đúng tiến độ theo mốc. Thanh 📍 Việc tiếp theo luôn chỉ chỗ cần đến.'));
  };

  function weekLine() {
    if (!G.weeklyInfo) return '';
    var w = G.weeklyInfo();
    return w.last ? (w.due ? 'Đến hạn! ' : '') + 'Lần trước ' + w.last.tong + '/100 · ' + (w.days === 0 ? 'hôm nay' : w.days + ' ngày trước') : 'Nghe · Đọc · Nói tự do, khoảng 15 phút';
  }
  G.weekLine = weekLine;
  /* ---------- Nhà của bạn: góc học ---------- */
  G.openHome = function () {
    var body = panelOpen('🏠 Nhà của bạn');
    var d = today(), n = G.S.tuKho.length;
    var momDone = !!(d.sang && d.sang['en-home']);
    body.appendChild(G.el('div.menu3',
      G.LIFE['en-home'] ? G.el('button.big' + (momDone ? '.done' : '.seal'), { onclick: function () { G.openLife('en-home'); } },
        G.el('b', (momDone ? '✓ ' : '') + '👩 Nói chuyện với mẹ'), G.el('span', 'Buổi sáng ở nhà: thức dậy, ăn sáng, chuẩn bị đi học')) : null,
      G.el('button.big' + (d.viec.doc ? '.done' : ''), { onclick: G.openReader }, G.el('b', (d.viec.doc ? '✓ ' : '') + '📖 Đọc truyện'), G.el('span', 'Truyện song ngữ theo cấp, bấm câu để xem nghĩa, nghe giọng đọc')),
      G.el('button.big' + (d.viec.on ? '.done' : ''), { onclick: G.openReview }, G.el('b', (d.viec.on ? '✓ ' : '') + '🔁 Ôn câu đã học'), G.el('span', G.srsDue ? (G.srsDue().length ? G.srsDue().length + ' câu đến hạn ôn hôm nay' : 'Không có câu đến hạn · ôn thêm tuỳ ý') : '')),
      G.el('button.big' + (G.weeklyInfo && G.weeklyInfo().due ? '.seal' : ''), { onclick: G.openWeekly }, G.el('b', '📝 Kiểm tra tuần'), G.el('span', weekLine())),
      G.el('button.big', { onclick: G.openCanDo }, G.el('b', '📒 Mình nói được'), G.el('span', G.canDoStats ? G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được bằng tiếng Anh' : '')),
      G.el('button.big', { onclick: G.openToday }, G.el('b', '📋 Kế hoạch hôm nay'), G.el('span', G.dayProgress().done + '/4 việc · ' + G.dayProgress().mins + ' phút'))));
  };

  /* ---------- Đọc truyện ---------- */
  var IDX = null;
  function loadIndex(cb) {
    if (IDX) { cb(IDX); return; }
    fetch('../data/stories/index.json').then(function (r) { return r.json(); }).then(function (j) {
      var order = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
      // hiện tất cả truyện tiếng Anh, xếp theo kệ (Brightford 2080 đầu tiên), trong kệ theo cấp
      IDX = j.filter(function (s) { return s.lang === 'en'; });
      IDX.sort(function (a, b) { return (shelfRank(a) * 10 + (order[a.level] || 9)) - (shelfRank(b) * 10 + (order[b.level] || 9)); });
      cb(IDX);
    }).catch(function () { G.toast('Chưa tải được kho truyện. Mở khi có mạng một lần nhé.'); });
  }
  var SHELF = ['future', 'ai', 'true', 'mystery', 'news', 'essay', 'long'];
  var SHELF_NAME = { future: '🌆 Brightford 2080 · vấn đề xã hội tương lai', ai: '🤖 Chuyện về AI', true: '📜 Chuyện có thật', mystery: '🔭 Bí ẩn chưa có lời giải', news: '📰 Tin tức 2025–2026', essay: '🧠 Bài luận B2 · kỹ năng sống', long: '📚 Truyện dài' };
  function shelfRank(s) { var i = SHELF.indexOf(s.shelf); return i < 0 ? SHELF.length : i; }
  function readN(id) { return (G.S.truyen && G.S.truyen[id]) || 0; }
  G.openReader = function () {
    var body = panelOpen('📖 Đọc truyện');
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    loadIndex(function (list) {
      body.innerHTML = '';
      // gợi ý: truyện đang đọc dở, không có thì truyện dễ nhất chưa đọc
      var next = null;
      for (var i = 0; i < list.length && !next; i++) { var r = readN(list[i].id); if (r > 0 && r < list[i].chapters.length) next = list[i]; }
      for (var j = 0; j < list.length && !next; j++) if (readN(list[j].id) < list[j].chapters.length) next = list[j];
      if (next) body.appendChild(G.el('button.big.seal.rd-next', { onclick: function () { chapter(next, readN(next.id)); } },
        G.el('b', '▶ Đọc tiếp: ' + next.title), G.el('span', next.vi + ' · chương ' + (readN(next.id) + 1) + '/' + next.chapters.length + ' · ' + next.level)));
      var lv = '';
      list.forEach(function (s) {
        var grp = s.shelf || 'long';
        if (grp !== lv) { lv = grp; body.appendChild(G.el('h3.rd-lv', SHELF_NAME[grp] || '📚 Truyện khác')); }
        var r = readN(s.id);
        body.appendChild(G.el('button.rd-story' + (s.shelf === 'future' ? '.future' : ''), { onclick: function () { chapter(s, Math.min(r, s.chapters.length - 1)); } },
          G.el('b', s.title), G.el('span.small.faint', s.vi + ' · ' + s.level + ' · ' + s.chapters.length + ' chương'),
          s.blurb ? G.el('span.small.rd-blurb', s.blurb) : null,
          G.el('span.rd-prog', r >= s.chapters.length ? '✓ Đã đọc' : r ? r + '/' + s.chapters.length : '')));
      });
    });
  };
  function chapter(s, k) {
    var body = panelOpen('📖 ' + s.title);
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    fetch('../data/stories/' + s.id + '.json').then(function (r) { return r.json(); }).then(function (full) {
      var ch = full.chapters[k];
      body.innerHTML = '';
      body.appendChild(G.el('div.lhead', G.el('div.lsub', 'Chương ' + ch.n + '/' + full.chapters.length + ' · ' + ch.title + ' · ' + (ch.vi || '') + ' · bấm câu để nghe')));
      // tốc độ đọc: thường / chậm (nhớ cho lần sau)
      var cd = G.S.caiDat || (G.S.caiDat = {});
      var spd = G.el('div.td-seg.rd-speed');
      function drawSpd() {
        spd.innerHTML = '';
        spd.appendChild(G.el('button' + (!cd.docCham ? '.on' : ''), { onclick: function () { cd.docCham = false; G.save(); drawSpd(); } }, '🔊 Tốc độ thường'));
        spd.appendChild(G.el('button' + (cd.docCham ? '.on' : ''), { onclick: function () { cd.docCham = true; G.save(); drawSpd(); } }, '🐢 Đọc chậm'));
      }
      drawSpd(); body.appendChild(spd);
      // hiện / ẩn nghĩa tiếng Việt (mặc định hiện, nhớ cho lần sau)
      var viBtn = G.el('button.btn.sm.rd-vibtn', { onclick: function () { cd.anNghia = !cd.anNghia; G.save(); applyVi(); } });
      function applyVi() { body.className = 'panel-body' + (cd.anNghia ? ' rd-hidevi' : ''); viBtn.textContent = cd.anNghia ? '👀 Hiện nghĩa tiếng Việt' : '🙈 Ẩn nghĩa (tự đọc)'; }
      body.appendChild(viBtn); applyVi();
      (ch.paras || []).forEach(function (para) {
        body.appendChild(G.el('div.rd-para', para.map(function (ln) {
          // nghĩa tiếng Việt luôn hiện ngay dưới câu (ẩn được bằng nút "Ẩn nghĩa" để tự luyện đọc); bấm câu để nghe
          var vi = G.el('div.rd-vi.show', ln[1]);
          return G.el('div.rd-line', { onclick: function () { G.say(ln[0], 'en', !!(G.S.caiDat && G.S.caiDat.docCham)); } }, G.el('span', ln[0]), vi);
        })));
      });
      if (ch.vocab && ch.vocab.length) body.appendChild(G.el('div.rd-box',
        G.el('b', '📝 Từ đáng nhớ'),
        G.el('div.rd-vocab', ch.vocab.map(function (v) { return G.el('button.rd-w', { onclick: function () { G.say(v[0], 'en', !!(G.S.caiDat && G.S.caiDat.docCham)); } }, G.el('b', v[0]), ' · ' + v[1]); }))));
      if (ch.think && ch.think.length) body.appendChild(G.el('div.rd-box.think',
        G.el('b', '💭 Suy ngẫm'),
        G.el('ol', ch.think.map(function (q) { return G.el('li', q); })),
        G.el('div.small.faint', 'Nghĩ hoặc nói to câu trả lời bằng tiếng Việt, rồi thử nói một câu bằng tiếng Anh.')));
      body.appendChild(G.el('div.row',
        G.el('button.btn', { onclick: G.openReader }, '‹ Kho truyện'),
        G.el('button.btn.seal', { onclick: function () {
          G.S.truyen = G.S.truyen || {};
          if ((G.S.truyen[s.id] || 0) <= k) { G.S.truyen[s.id] = k + 1; G.addXp(10); }
          G.markStudy(); G.markTask('doc'); G.sfx('done');
          if (k + 1 < full.chapters.length) chapter(s, k + 1); else { G.confetti(); G.openReader(); }
        } }, k + 1 < full.chapters.length ? 'Đọc xong · chương sau ›' : 'Đọc xong truyện 🎉')));
      body.scrollTop = 0;
    }).catch(function () { body.innerHTML = ''; body.appendChild(G.el('p', 'Chưa tải được chương này. Thử lại khi có mạng.')); });
  }

  /* Ôn câu đã học: xem js/practice.js (G.openReview) */
})();
