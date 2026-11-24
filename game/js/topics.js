/* Từ theo chủ đề: 15 nhóm từ của ATLAS (1334 từ: nền tảng đọc tin, số đếm, ngày giờ, tiền, công sở, kinh tế, khí hậu…).
   Mỗi chủ đề gắn với một tầng (data/topic_en_index.js): Tầng 1 nền tảng + số đếm, Tầng 2 ngày giờ,
   Tầng 3 tiền, bán hàng, công sở, doanh nghiệp, Tầng 4 các chủ đề đọc tin. Chủ đề mở khi tới tầng đó.
   Một lượt: 10 thẻ từ (từ, phiên âm, nghĩa, câu ví dụ có giọng đọc) → nghe chọn nghĩa 10 câu.
   Từ đã học vào kho ôn (G.S.cau) và được đánh dấu ở G.S.tuChuDe[chủ đề][từ] = 1.
   Số từ chưa học được cộng vào giờ còn lại của lộ trình (G.topicHours, lobby.js), nên phần học mỗi ngày tự tính cả từ.
   Giờ theo giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  var ROUND = 10, MIN_PER_WORD = 2;   // 2 phút / từ: thẻ, câu ví dụ, nghe chọn nghĩa và các lần ôn
  var POS = { n: 'danh từ', v: 'động từ', adj: 'tính từ', adv: 'trạng từ', num: 'số', phr: 'cụm từ', det: 'từ hạn định', conj: 'liên từ', prep: 'giới từ' };
  var DATA = null, ROWS = {}, waiting = null;

  function day(n) { return G.vnDay(Date.now() + (n || 0) * 86400000); }
  function list() { return G.TOPICS_EN || []; }
  function byId(id) { var a = list(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function store() { G.S.tuChuDe = G.S.tuChuDe || {}; return G.S.tuChuDe; }
  function known(id, w) { var s = store()[id]; return !!((s && s[w]) || (G.S.cau && G.S.cau[w])); }
  function isOpen(t) { return t.floor <= (G.enFloorNow ? G.enFloorNow() : 1); }
  function floorName(f) { var r = G.ROADMAP_EN && G.ROADMAP_EN[f - 1]; return r ? r.name : 'Tầng ' + f; }

  /* kho từ đầy đủ (180 KB) chỉ tải khi mở bảng, có trong bộ nhớ offline (sw.js) */
  function load(cb) {
    if (DATA) { cb(); return; }
    if (waiting) { waiting.push(cb); return; }
    waiting = [cb];
    fetch('data/topic_en.json').then(function (r) { return r.json(); }).then(function (j) {
      DATA = j.t;
      for (var id in DATA) if (DATA.hasOwnProperty(id)) { var m = {}; DATA[id].forEach(function (r) { m[r[0]] = r; }); ROWS[id] = m; }
      var q = waiting; waiting = null; q.forEach(function (f) { f(); });
    }).catch(function () { waiting = null; G.toast('Chưa tải được kho từ theo chủ đề. Mở khi có mạng một lần nhé.'); });
  }

  /* mức nhớ một chủ đề: số từ đã học, số từ đến hạn ôn, trung bình hộp ôn (0 → 6) */
  G.topicStat = function (id) {
    var t = byId(id); if (!t) return null;
    var all = G.S.cau || {}, today = day(0), n = 0, sum = 0, due = [], learned = 0;
    for (var i = 0; i < t.w.length; i++) {
      var w = t.w[i], c = all[w];
      if (known(id, w)) learned++;
      if (!c) continue;
      n++; sum += c.box || 0;
      if (c.due <= today) due.push(w);
    }
    var avg = n ? sum / n : 0, lv;
    if (!n) lv = 'none';
    else if (due.length >= Math.max(3, Math.ceil(n * 0.3))) lv = 'warn';
    else lv = avg >= 4 ? 'l4' : avg >= 2 ? 'l3' : 'l2';
    return { t: t, id: id, all: t.w.length, learned: learned, n: n, avg: avg, due: due, lv: lv, open: isOpen(t) };
  };
  /* giờ học từ theo chủ đề của một tầng: tổng và phần còn lại (cộng vào lộ trình) */
  G.topicHours = function (floor) {
    var all = 0, left = 0;
    list().forEach(function (t) {
      if (t.floor !== floor) return;
      all += t.w.length;
      for (var i = 0; i < t.w.length; i++) if (!known(t.id, t.w[i])) left++;
    });
    return { words: all, all: all * MIN_PER_WORD / 60, left: left * MIN_PER_WORD / 60, wordsLeft: left };
  };
  G.topicTotals = function () {
    var all = 0, got = 0, open = 0;
    list().forEach(function (t) { var s = G.topicStat(t.id); all += s.all; got += s.learned; if (s.open) open++; });
    return { all: all, got: got, open: open, topics: list().length };
  };
  G.topicsOfFloor = function (floor) { return list().filter(function (t) { return t.floor === floor; }); };
  /* chủ đề nên học tiếp: chủ đề đang mở đầu tiên còn từ chưa học */
  function nextTopic() {
    var a = list();
    for (var i = 0; i < a.length; i++) if (isOpen(a[i])) { var s = G.topicStat(a[i].id); if (s.learned < s.all) return s; }
    return null;
  }
  G.topicNext = function () { var s = nextTopic(); return s ? { id: s.id, name: s.t.name, left: s.all - s.learned } : null; };
  /* câu ví dụ của từ chủ đề trong thẻ ôn (practice.js): điền khi kho từ đã tải */
  G.topicExEl = function (c) {
    var box = G.el('div.wex.tp-rvex');
    function fill() {
      var r = ROWS[c.cd] && ROWS[c.cd][c.en]; if (!r || !r[4]) { box.style.display = 'none'; return; }
      box.appendChild(G.el('div', r[4], G.sayBtns(r[4], 'en'))); box.appendChild(G.el('div.faint', r[5]));
    }
    if (DATA) fill(); else load(fill);
    return box;
  };

  function panelOpen(title) {
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    G.setTitle(title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = ''; body.scrollTop = 0;
    G.viewIn(body);
    return body;
  }
  function bar(p) { var i = G.el('i'); i.style.transform = 'scaleX(' + Math.max(0, Math.min(1, p)) + ')'; return G.el('span.tp-bar', i); }

  /* ---------- danh sách 15 chủ đề, chia theo tầng ---------- */
  G.openTopics = function () {
    var body = panelOpen('📚 Từ theo chủ đề');
    var tot = G.topicTotals(), nx = nextTopic(), nGot = G.el('b', '0');
    body.appendChild(G.el('div.tp-top',
      G.el('div.tp-num', nGot, G.el('span', '/' + tot.all + ' từ đã học')),
      G.el('div.small.faint', '15 nhóm từ để đọc tin và đi làm: số đếm, tiền, công sở, kinh tế, khí hậu… Mỗi lượt 10 từ có câu ví dụ và giọng đọc, học xong tự vào kho ôn.')));
    G.countUp(nGot, 0, tot.got, { dur: 800 });
    if (nx) body.appendChild(G.el('button.big.bic.seal.tp-go', { onclick: function () { G.openTopic(nx.id); } },
      G.bigIc(nx.t.ic, 'Học tiếp: ' + nx.t.name), G.el('span', (nx.all - nx.learned) + ' từ chưa học · lượt tới ' + Math.min(ROUND, nx.all - nx.learned) + ' từ')));
    [1, 2, 3, 4].forEach(function (f) {
      var ts = G.topicsOfFloor(f); if (!ts.length) return;
      body.appendChild(G.el('h2.sec', floorName(f)));
      body.appendChild(G.el('div.tp-grid', ts.map(function (t) {
        var s = G.topicStat(t.id);
        return G.el('button.tp-card' + (s.open ? '' : '.lock'), { onclick: function () { if (s.open) G.openTopic(t.id); else G.toast('🔒 Chủ đề này mở khi bạn lên ' + floorName(f) + '.'); } },
          G.ic3(t.ic, 'tp-ic'),
          G.el('div.tp-txt', G.el('b', t.name),
            G.el('span.small', s.open ? s.learned + '/' + s.all + ' từ' + (s.due.length ? ' · ' + s.due.length + ' từ đến hạn ôn' : '') : 'Mở ở ' + floorName(f).split(' · ')[0] + ' · ' + s.all + ' từ'),
            s.open ? bar(s.learned / s.all) : null));
      })));
    });
    G.enter(body.querySelectorAll('.tp-card'), { gap: 30, y: 8, dur: 340 });
  };

  /* ---------- một chủ đề ---------- */
  G.openTopic = function (id) {
    var t = byId(id); if (!t) return;
    var body = panelOpen(t.name);
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    load(function () {
      body = panelOpen(t.name);
      var s = G.topicStat(id), left = s.all - s.learned;
      var nL = G.el('b', '0'), nD = G.el('b', '0'), nM = G.el('b', s.n ? '0' : '–');
      body.appendChild(G.el('div.tp-head', G.ic3(t.ic, 'tp-ic'), G.el('div', G.el('b', t.name), G.el('div.small.faint', floorName(t.floor) + ' · ' + s.all + ' từ · khoảng ' + Math.max(1, Math.round(left * MIN_PER_WORD / 60)) + ' giờ để học hết'))));
      body.appendChild(G.el('div.mm-sum',
        G.el('div.mm-k.ok', nL, G.el('span', 'từ đã học / ' + s.all)),
        G.el('div.mm-k.warn', nD, G.el('span', 'từ đến hạn ôn hôm nay')),
        G.el('div.mm-k', nM, G.el('span', 'mức nhớ trung bình'))));
      G.countUp(nL, 0, s.learned, { dur: 700 }); G.countUp(nD, 0, s.due.length, { dur: 700, delay: 80 });
      if (s.n) G.countUp(nM, 0, Math.round(s.avg / 6 * 100), { dur: 700, delay: 160, suf: '%' });
      // một nút chính: còn từ mới thì học, hết từ mới thì ôn
      body.appendChild(G.el('div.menu3',
        left ? G.el('button.big.bic.seal', { onclick: function () { learn(id); } }, G.bigIc('book', 'Học ' + Math.min(ROUND, left) + ' từ mới'),
          G.el('span', 'Thẻ từ có câu ví dụ và giọng đọc, rồi nghe chọn nghĩa · khoảng ' + Math.max(3, Math.round(Math.min(ROUND, left) * 0.8)) + ' phút'))
          : G.el('div.result.pass', G.el('b', 'Đã học hết ' + s.all + ' từ của chủ đề này'), G.el('div', 'Từ nào sắp quên sẽ tự quay lại trong Ôn câu đã học.')),
        s.learned >= 4 ? G.el('button.big.bic', { onclick: function () { quiz(id, pickLearned(id), false); } }, G.bigIc('headphone', 'Nghe chọn nghĩa'),
          G.el('span', Math.min(ROUND, s.learned) + ' câu từ các từ đã học, từ yếu ra trước')) : null,
        s.due.length ? G.el('button.big.bic' + (left ? '' : '.seal'), { onclick: function () { G.openReviewOf(s.due); } }, G.bigIc('repeat', 'Ôn ' + s.due.length + ' từ sắp quên'),
          G.el('span', 'Nhìn nghĩa, tự nói từ tiếng Anh')) : null));
      // từ đã học, từ yếu lên trước; chạm để nghe
      var learnedRows = DATA[id].filter(function (r) { return known(id, r[0]); });
      if (learnedRows.length) {
        var all = G.S.cau || {};
        learnedRows.sort(function (a, b) { var x = all[a[0]], y = all[b[0]]; return (x ? x.box || 0 : 9) - (y ? y.box || 0 : 9); });
        var box = G.el('div.tp-words'), shown = 0;
        var more = G.el('button.btn.tp-more', { onclick: function () { draw(learnedRows.length); } });
        var draw = function (n) {
          for (; shown < Math.min(n, learnedRows.length); shown++) box.appendChild(wordRow(learnedRows[shown]));
          more.style.display = shown < learnedRows.length ? '' : 'none';
          more.textContent = 'Xem cả ' + learnedRows.length + ' từ';
        };
        body.appendChild(G.el('h2.sec', 'Từ đã học · chạm để nghe'));
        body.appendChild(box); body.appendChild(more);
        draw(12);
      }
      body.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.openTopics }, '‹ Tất cả chủ đề'), G.el('span')));
      G.enter(body.querySelectorAll('.menu3 > *'), { gap: 60, y: 8 });
    });
  };
  function lvOf(w) { var c = G.S.cau && G.S.cau[w]; if (!c) return 'none'; if (c.due <= day(0)) return 'warn'; return c.box >= 4 ? 'l4' : c.box >= 2 ? 'l3' : 'l2'; }
  function wordRow(r) {
    return G.el('button.tp-w', { onclick: function () { G.say(r[0], 'en'); } }, G.el('i.mm-c.' + lvOf(r[0])), G.el('b', r[0]), G.el('span', r[3]));
  }
  function pickLearned(id) {
    var all = G.S.cau || {};
    var rows = G.shuffle(DATA[id].filter(function (r) { return known(id, r[0]); }));
    rows.sort(function (a, b) { var x = all[a[0]], y = all[b[0]]; return (x ? x.box || 0 : 0) - (y ? y.box || 0 : 0); });
    return rows.slice(0, ROUND);
  }

  /* ---------- học một lượt: 10 thẻ từ ---------- */
  function learn(id) {
    var t = byId(id), rows = DATA[id].filter(function (r) { return !known(id, r[0]); }).slice(0, ROUND);
    if (!rows.length) { G.openTopic(id); return; }
    var k = 0;
    (function card() {
      var r = rows[k], body = panelOpen(t.name + ' · thẻ ' + (k + 1) + '/' + rows.length);
      var s = store(); s[id] = s[id] || {};
      if (!s[id][r[0]]) { s[id][r[0]] = 1; if (G.srsAdd) G.srsAdd({ t: 'item', en: r[0], vi: r[3], cd: id }); G.save(); }
      body.appendChild(G.el('div.tp-prog', bar((k + 1) / rows.length)));
      var cardEl = G.el('div.wcard',
        G.el('div.wbig', r[0], G.sayBtns(r[0], 'en')),
        G.el('div.wipa', (r[1] ? r[1] + ' · ' : '') + (POS[r[2]] || r[2])),
        G.el('div.wvi', r[3]),
        r[4] ? G.el('div.wex', G.el('div', r[4], G.sayBtns(r[4], 'en')), G.el('div.faint', r[5])) : null);
      body.appendChild(cardEl);
      body.appendChild(G.el('div.small.faint.tp-hint', 'Nghe rồi nói to theo cả từ và câu ví dụ, như đang nói với người thật.'));
      G.say(r[0], 'en');
      body.appendChild(G.el('div.row',
        k > 0 ? G.el('button.btn', { onclick: function () { k--; card(); } }, '‹ Trước') : G.el('button.btn', { onclick: function () { G.openTopic(id); } }, '‹ Chủ đề'),
        k < rows.length - 1 ? G.el('button.btn.seal', { onclick: function () { k++; card(); } }, 'Tiếp ›')
          : G.el('button.btn.seal', { onclick: function () { quiz(id, rows, true); } }, 'Nghe chọn nghĩa ›')));
      G.enter(cardEl.children, { gap: 50, y: 8, dur: 320 });
    })();
  }

  /* ---------- nghe chọn nghĩa: chỉ nghe, không nhìn chữ, chọn 1 trong 4 nghĩa ---------- */
  function quiz(id, rows, fromRound) {
    var t = byId(id), k = 0, got = 0, miss = [];
    var pool = DATA[id];
    (function q() {
      var body = panelOpen(t.name + ' · nghe ' + Math.min(k + 1, rows.length) + '/' + rows.length);
      if (k >= rows.length) { done(body); return; }
      var r = rows[k], opts = [r[3]], tries = 0;
      while (opts.length < 4 && tries++ < 60) { var o = pool[Math.floor(Math.random() * pool.length)][3]; if (opts.indexOf(o) < 0) opts.push(o); }
      opts = G.shuffle(opts);
      body.appendChild(G.el('div.tp-prog', bar(k / rows.length)));
      var word = G.el('div.wbig.sm.tp-reveal', { style: { visibility: 'hidden' } }, r[0]);
      body.appendChild(G.el('div.qbox', G.el('div.qtext', 'Nghe và chọn nghĩa đúng', G.sayBtns(r[0], 'en')), word));
      G.say(r[0], 'en');
      var box = G.el('div.opts'), answered = false;
      opts.forEach(function (o) {
        var b = G.el('button.opt', { 'data-v': o, onclick: function () {
          if (answered) return; answered = true;
          var ok = o === r[3];
          b.className = 'opt ' + (ok ? 'ok' : 'no');
          if (!ok) { var kids = box.children; for (var i = 0; i < kids.length; i++) if (kids[i].getAttribute('data-v') === r[3]) kids[i].className = 'opt ok'; }
          word.style.visibility = '';
          G.sfx(ok ? 'right' : 'wrong');
          if (ok) got++; else miss.push(r);
          // nghe sai: từ này quay lại ngay hôm nay trong Ôn câu đã học
          if (!ok && G.S.cau && G.S.cau[r[0]]) { G.S.cau[r[0]].box = 0; G.S.cau[r[0]].due = day(0); G.save(); }
          setTimeout(function () { k++; q(); }, ok ? 800 : 1600);
        } }, o);
        box.appendChild(b);
      });
      body.appendChild(box);
      G.enter(box.children, { gap: 45, y: 8, dur: 340 });
    })();
    function done(body) {
      G.markStudy(); G.addXp(5 + got); G.sfx('done');
      if (fromRound && G.markTask) G.markTask('tu');
      if (got === rows.length && G.confetti) G.confetti();
      var s = G.topicStat(id), left = s.all - s.learned, n = G.el('b', '0');
      body.appendChild(G.el('div.result.pass.tp-res',
        got >= rows.length - 1 && G.lottieIc ? G.lottieIc('party', 'tp-party') : null,
        G.el('div.tp-num', n, G.el('span', '/' + rows.length + ' nghe đúng')),
        G.el('div', (fromRound ? 'Học xong ' + rows.length + ' từ mới · ' : '') + '+' + (5 + got) + ' XP · chủ đề ' + s.learned + '/' + s.all + ' từ'),
        G.el('div.small.faint', miss.length ? 'Từ nghe sai sẽ quay lại hôm nay trong Ôn câu đã học: ' + miss.map(function (r) { return r[0]; }).join(', ') + '.' : 'Từ mới sẽ quay lại ôn từ ngày mai, đúng lúc sắp quên.')));
      G.countUp(n, 0, got, { dur: 600 });
      body.appendChild(G.el('div.row',
        G.el('button.btn', { onclick: function () { G.openTopic(id); } }, '‹ Về chủ đề'),
        left ? G.el('button.btn.seal', { onclick: function () { learn(id); } }, 'Học tiếp ' + Math.min(ROUND, left) + ' từ ›')
          : G.el('button.btn.seal', { onclick: G.openTopics }, 'Chủ đề khác ›')));
    }
  }
})();
