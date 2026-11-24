/* Viết chữ Hán từng nét (Trường Lạc trấn, anh Han yêu cầu 24/11/2026).
   Mỗi chữ: xem nét chạy theo đúng thứ tự, rồi 4 lượt gợi ý giảm dần (tô theo chữ mờ có mũi tên → chỉ chữ mờ → ô trống →
   viết theo trí nhớ). Chấm từng nét theo đường xương sống của nét mẫu (G.Pen, pen.js dựng từ js/pen của ATLAS):
   đúng nét thì nét đẹp lại theo mẫu, sai thì báo lỗi (sai chiều, sai thứ tự, lệch chỗ) và hiện mũi tên.
   Viết bằng Apple Pencil hoặc ngón tay (đã dùng bút thì không nhận tì tay).
   Dữ liệu nét: ../data/strokes (hanzi-writer-data, Arphic Public License); nghĩa từng chữ ../data/char-vi.json;
   pinyin, âm Hán Việt: G.zhPyOf / G.zhHvOf (zh.js). Điểm lưu ở G.S.vietChu[chữ] = { n, best, last, luc } (hồ sơ tiếng Trung).
   Ô kẻ 田字格 là đường kẻ giao diện (như viền bảng), chữ mẫu vẽ từ dữ liệu nét (như hiện chữ), không phải tranh. */
var G = window.G || (window.G = {});

(function () {
  var IDX = null, LOADED = {}, CH = {}, VI = null;
  function getJSON(url, cb) {
    var x = new XMLHttpRequest();
    x.open('GET', url);
    x.onload = function () { var j = null; try { j = JSON.parse(x.responseText); } catch (e) { j = null; } cb(x.status >= 200 && x.status < 300 && j ? null : 'err', j); };
    x.onerror = function () { cb('err', null); };
    x.send();
  }
  function getIdx(cb) { if (IDX) { cb(); return; } getJSON('../data/strokes/index.json', function (e, j) { IDX = j || {}; cb(); }); }
  /* nạp dữ liệu nét của các chữ (theo từng tệp, tuần tự cho nhẹ máy chủ) */
  function loadChars(chars, cb) {
    getIdx(function () {
      var need = [];
      chars.forEach(function (c) { var f = IDX[c]; if (f && !LOADED[f] && need.indexOf(f) < 0) need.push(f); });
      (function next() {
        if (!need.length) { cb(); return; }
        var f = need.shift();
        getJSON('../data/strokes/' + f + '.json', function (e, j) { LOADED[f] = 1; if (j) for (var k in j) if (j.hasOwnProperty(k)) CH[k] = j[k]; next(); });
      })();
    });
  }
  function loadVi(cb) { if (VI) { cb(); return; } getJSON('../data/char-vi.json', function (e, j) { VI = j || {}; cb(); }); }
  function strokeData(ch) {
    var d = CH[ch]; if (!d) return null;
    if (!d.n) d.n = { strokes: d.s, medians: d.m, mediansView: d.m.map(function (m) { return m.map(function (p) { return [p[0], 900 - p[1]]; }); }) };
    return d.n;
  }
  function isHan(c) { return /[㐀-鿿]/.test(c); }
  G.zhChars = function (s) { var out = []; String(s || '').split('').forEach(function (c) { if (isHan(c) && out.indexOf(c) < 0) out.push(c); }); return out; };

  var ROUNDS = [
    { ghost: true, arrow: true, miss: 0, text: 'Tô theo chữ mờ, mũi tên chỉ chiều nét' },
    { ghost: true, arrow: false, miss: 1, text: 'Chỉ còn chữ mờ, sai một lần mới hiện mũi tên' },
    { ghost: false, arrow: false, miss: 1, text: 'Ô trống, sai một lần hiện mũi tên' },
    { ghost: false, arrow: false, miss: 2, text: 'Viết theo trí nhớ, sai hai lần mới hiện mũi tên' }
  ];
  var LEVEL = 'vua';   // độ chặt khi chấm (G.Pen.STRICTNESS: de / vua / nghiem)

  function panelOpen(title) {
    var panel = document.getElementById('panel');
    panel.className = 'panel open';
    G.setTitle(title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body');
    body.innerHTML = ''; body.className = 'panel-body';
    G.viewIn(body);
    return body;
  }
  function vietOf(ch) { var v = G.S.vietChu || {}; return v[ch]; }
  function saveScore(ch, score) {
    var v = G.S.vietChu || (G.S.vietChu = {}), p = v[ch] || { n: 0, best: 0, last: 0 };
    v[ch] = { n: p.n + 1, best: Math.max(p.best, score), last: score, luc: G.vnNow() };
    G.save();
  }

  /* ---------- chọn chữ cho nhiệm vụ Viết chữ: chữ của bài đã học chưa viết → chữ nền tảng chưa viết → chữ viết yếu nhất ---------- */
  var BASIC = ['一', '二', '三', '十', '人', '大', '口', '中', '日', '月', '山', '水', '火', '木', '女', '子', '小', '上', '下', '不'];
  function learnedChars() {
    var out = [];
    for (var id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'zh' && (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id])))
      (G.ROOMS[id].items || []).forEach(function (it) { G.zhChars(it.zh).forEach(function (c) { if (out.indexOf(c) < 0) out.push(c); }); });
    return out;
  }
  G.writePick = function (n) {
    n = n || 5;
    var have = function (c) { return !IDX || !!IDX[c]; }, out = [];
    function add(list) { for (var i = 0; i < list.length && out.length < n; i++) if (have(list[i]) && out.indexOf(list[i]) < 0) out.push(list[i]); }
    var learned = learnedChars();
    add(learned.filter(function (c) { return !vietOf(c); }));
    add(BASIC.filter(function (c) { return !vietOf(c); }));
    var written = Object.keys(G.S.vietChu || {}).filter(have).sort(function (a, b) { return (vietOf(a).best - vietOf(b).best) || ((vietOf(a).luc || '') < (vietOf(b).luc || '') ? -1 : 1); });
    add(written);
    return out;
  };
  /* nhiệm vụ Viết chữ hôm nay: 5 chữ */
  G.openWriteToday = function () {
    var body = panelOpen('Viết chữ Hán');
    body.appendChild(G.el('div.small.faint', 'Đang tải dữ liệu nét…'));
    getIdx(function () { G.openWrite(G.writePick(5), { quest: true }); });
  };
  G.writeStats = function () { var v = G.S.vietChu || {}, n = 0, good = 0; for (var k in v) if (v.hasOwnProperty(k)) { n++; if (v[k].best >= 75) good++; } return { n: n, good: good }; };

  /* ---------- màn viết: chars = danh sách chữ Hán ---------- */
  var cur = null;   // màn đang mở (để dừng hoạt hình, gỡ bảng viết khi đóng hoặc mở màn khác)
  function stop() { if (cur) { cur.stopAnim(); if (cur.pad) cur.pad.destroy(); cur = null; } }
  G.openWrite = function (chars, opts) {
    opts = opts || {};
    stop();
    G.zhLoadDict && G.zhLoadDict();
    var body = panelOpen('Viết chữ Hán'), gen = G.panelGen;
    body.appendChild(G.el('div.small.faint', 'Đang tải dữ liệu nét…'));
    loadChars(chars, function () {
      loadVi(function () {
        G.zhLoadDict ? G.zhLoadDict(function () { if (G.panelLive(gen)) run(chars.filter(function (c) { return !!strokeData(c); }), opts); }) : run(chars, opts);
      });
    });
  };

  function run(chars, opts) {
    if (!chars.length) { var b0 = panelOpen('Viết chữ Hán'); b0.appendChild(G.el('div.result', G.el('b', 'Chưa có dữ liệu nét cho các chữ này'), G.el('div', 'Mở khi có mạng một lần để tải dữ liệu nét.'))); return; }
    var S = { i: 0, round: 0, roundScores: [], expect: 0, attempts: 0, results: [], anim: 0, scores: [] };
    var body = panelOpen('Viết chữ Hán · 1/' + chars.length);
    body.classList.add('wr-body');
    var padEl = G.el('div.pad'), hintEl = G.el('div.pad-hint');
    padEl.appendChild(hintEl);
    var bigCh = G.el('div.wr-ch'), pyEl = G.el('div.py.wr-py'), hvEl = G.el('div.wr-hv'), viEl = G.el('div.small.faint'), counter = G.el('span.wr-count');
    var dots = G.el('div.wr-dots'), fb = G.el('div.wr-fb'), nextBtn = G.el('button.btn.seal.wr-next', { style: { display: 'none' }, onclick: nextChar }, 'Chữ tiếp ›');
    var tools = G.el('div.row.wr-tools',
      G.el('button.btn.sm', { onclick: function () { playAnim(); } }, G.ic3('play', 'ic3-s'), ' Xem nét'),
      G.el('button.btn.sm', { onclick: function () { G.say(chars[S.i], 'zh'); } }, G.ic3('speaker', 'ic3-s'), ' Đọc'),
      G.el('button.btn.sm', { onclick: function () { if (pad && !S.anim && pad.strokes.length) pad.undo(); } }, 'Xoá nét'),
      G.el('button.btn.sm', { onclick: function () { resetChar(); } }, 'Làm lại'));
    var side = G.el('div.wr-side', G.el('div.wr-head', G.el('div', bigCh), G.el('div', pyEl, hvEl, viEl), counter), dots, fb, tools, nextBtn);
    body.appendChild(G.el('div.wr-wrap', padEl, side));

    var pad = new G.Pen.WritingPad(padEl, { grid: 'tian', brush: 'but-chi', penOnly: false, penSound: false, onStroke: onStroke });
    cur = { pad: pad, stopAnim: stopAnim, S: S, chars: chars, data: function () { return strokeData(chars[S.i]); } };
    G._wr = cur;   // cho bộ soát tự động (tools/qa/driver.js) viết thử

    function d() { return strokeData(chars[S.i]); }
    function info() {
      var ch = chars[S.i], dd = d();
      G.setTitle('Viết chữ Hán · ' + (S.i + 1) + '/' + chars.length);
      bigCh.textContent = ch;
      pyEl.textContent = G.zhPyOf ? G.zhPyOf(ch) : '';
      hvEl.textContent = G.zhHvOf && G.zhHvOf(ch) ? 'Hán Việt: ' + G.zhHvOf(ch) : '';
      viEl.textContent = (VI && VI[ch]) || '';
      counter.textContent = 'Lượt ' + Math.min(S.round + 1, ROUNDS.length) + '/' + ROUNDS.length;
      dots.innerHTML = '';
      for (var i = 0; i < dd.medians.length; i++) {
        var r = S.results[i];
        dots.appendChild(G.el('i.' + (r ? (r.pass ? 'ok' : 'bad') : i === S.expect ? 'now' : 'x')));
      }
      hintEl.textContent = S.anim ? hintEl.textContent : S.expect >= dd.medians.length ? 'Xong ' + dd.medians.length + ' nét' : 'Nét ' + (S.expect + 1) + ' / ' + dd.medians.length;
    }
    function applyHint() {
      var r = ROUNDS[S.round];
      pad.setHint({ ghost: r.ghost, upTo: S.expect, median: r.arrow || S.attempts >= r.miss && r.miss ? S.expect : null });
    }
    function say(t, cls) { fb.className = 'wr-fb' + (cls ? ' ' + cls : ''); fb.textContent = ''; if (typeof t === 'string') fb.textContent = t; else fb.appendChild(t); }
    function resetRound() {
      stopAnim();
      S.expect = 0; S.attempts = 0; S.results = [];
      pad.clearInk(); pad.lock(false);
      applyHint(); info();
      say('Lượt ' + (S.round + 1) + '/' + ROUNDS.length + ': ' + ROUNDS[S.round].text + '.');
    }
    function resetChar() { S.round = 0; S.roundScores = []; nextBtn.style.display = 'none'; resetRound(); playAnim(); }
    function onStroke(units) {
      var dd = d();
      if (S.anim || S.expect >= dd.medians.length) { pad.undo(); return; }
      var res = G.Pen.gradeInOrder(units, dd.mediansView, S.expect, LEVEL);
      if (res.pass) {
        S.results[S.expect] = res;
        pad.snapLastToModel(S.expect); pad.flash(true);
        S.expect++; S.attempts = 0;
        say(G.el('span', G.el('b', 'Nét ' + S.expect + ': ' + G.Pen.verdict(res.score).text + ' '), G.el('span.small', '(' + res.score + '/100)')), 'ok');
        if (S.expect >= dd.medians.length) finishRound(); else { applyHint(); info(); }
        if (G.sfx) G.sfx('tap');
        return;
      }
      S.attempts++;
      pad.undo(); pad.flash(false);
      var msg = (res.issues && res.issues[0] && res.issues[0].msg) || 'Nét chưa khớp, thử lại nhé.';
      say(G.el('span', G.el('b', 'Nét ' + (S.expect + 1) + ': '), msg), 'bad');
      applyHint(); info();
    }
    function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? Math.round(s / a.length) : 0; }
    function finishRound() {
      var sc = avg(S.results.map(function (r) { return r.score; }));
      S.roundScores.push(sc);
      if (S.round >= ROUNDS.length - 1) { finishChar(); return; }
      // hai lượt đầu viết rất tốt (từ 90) thì bỏ lượt chỉ còn chữ mờ, sang ô trống luôn
      var skip = S.round === 1 && (S.roundScores[0] + S.roundScores[1]) / 2 >= 90, nr = S.round + (skip ? 2 : 1);
      say('Xong lượt ' + (S.round + 1) + ' · ' + sc + ' điểm. ' + (skip ? 'Viết tốt nên bỏ qua lượt 3. ' : '') + 'Lượt ' + (nr + 1) + ': ' + ROUNDS[nr].text.toLowerCase() + '.', 'ok');
      pad.lock(true);
      setTimeout(function () { if (cur && cur.S === S) { S.round = nr; resetRound(); } }, 900);
    }
    function finishChar() {
      pad.setHint({ ghost: false });
      var sc = avg(S.roundScores), v = G.Pen.verdict(sc);
      S.scores.push(sc);
      saveScore(chars[S.i], sc);
      say(G.el('div.wr-done', G.el('b.wr-score', String(sc)), G.el('div', G.el('b', v.text), G.el('div.small', 'Xong chữ ' + chars[S.i] + ' · ' + S.roundScores.length + ' lượt (' + S.roundScores.join(' · ') + ')'))), sc >= 55 ? 'ok' : 'bad');
      info();
      G.say(chars[S.i], 'zh');
      nextBtn.textContent = S.i >= chars.length - 1 ? 'Xong ›' : 'Chữ tiếp ›';
      nextBtn.style.display = '';
    }
    function nextChar() {
      if (S.i >= chars.length - 1) { summary(); return; }
      S.i++;
      pad.setChar(d());
      resetChar();
    }
    function summary() {
      stop();
      var a = avg(S.scores), v = G.Pen.verdict(a), xp = 5 + chars.length * 2;
      G.markStudy(); G.markTask('viet'); G.addXp(xp);
      if (G.track) G.track('viet_xong', { n: chars.length, diem: a });
      var b = panelOpen('Viết chữ Hán · xong');
      b.appendChild(G.el('div.result' + (a >= 55 ? '.pass' : ''), G.el('b', 'Xong ' + chars.length + ' chữ · ' + a + ' điểm · ' + v.text),
        G.el('div', chars.map(function (c, i) { return c + ' ' + S.scores[i]; }).join(' · ') + ' · +' + xp + ' XP'),
        G.el('div.small.faint', 'Chữ viết dưới 75 điểm sẽ quay lại ở lượt viết sau. Viết đúng thứ tự nét thì chữ đẹp và nhớ lâu hơn.')));
      b.appendChild(G.el('div.row', G.el('button.btn', { onclick: function () { G.openWrite(chars, opts); } }, 'Viết lại'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
    }
    /* hoạt hình thứ tự nét: từng nét chạy theo đúng chiều bút */
    function stopAnim() { if (S.anim) { cancelAnimationFrame(S.anim); S.anim = 0; } }
    function playAnim() {
      stopAnim();
      var dd = d(); if (!dd) return;
      pad.clearInk(); pad.lock(true);
      var ctx = pad.inkCtx, size = pad.size, ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1b2140', idx = 0, t0 = 0;
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function frame(now) {
        if (!t0) t0 = now;
        var m = dd.medians[idx], len = 0;
        for (var k = 1; k < m.length; k++) len += Math.sqrt(Math.pow(m[k][0] - m[k - 1][0], 2) + Math.pow(m[k][1] - m[k - 1][1], 2));
        var dur = calm ? 1 : Math.max(320, Math.min(1100, len * 1.5)), p = Math.min(1, Math.max(0, (now - t0) / dur));
        ctx.clearRect(0, 0, size, size);
        if (idx > 0) G.Pen.drawChar(ctx, dd.strokes, size, { color: ink, upTo: idx });
        G.Pen.drawPartialStroke(ctx, dd.strokes[idx], m, size, p, ink);
        hintEl.textContent = 'Nét ' + (idx + 1) + ' / ' + dd.medians.length;
        if (p >= 1) {
          idx++; t0 = now + (calm ? 0 : 180);
          if (idx >= dd.strokes.length) { S.anim = 0; pad.lock(false); pad.clearInk(); applyHint(); info(); return; }
        }
        S.anim = requestAnimationFrame(frame);
      }
      S.anim = requestAnimationFrame(frame);
    }
    pad.setChar(d());
    resetChar();
  }
  // đóng bảng / mở bảng khác: gỡ bảng viết đang mở
  var oldClose = G.closeLesson;
  G.closeLesson = function () { stop(); return oldClose.apply(this, arguments); };
})();
