/* Trình lái trong trang cho tools/qa-run.mjs: bấm nút và chọn đáp án như một người học thật.
   Biết đáp án đúng bằng dữ liệu bài (G.ROOMS, G.LIFE, G.READ_TASKS, G.FREE_TALK, G.CERT_SPEAK, G.FIX_EN, truyện).
   Chạy trong trình duyệt (Playwright addInitScript), không phải code game. */
// Trình lái trong trang: tìm đúng nút và đáp án như một người học thật (dùng dữ liệu bài để biết đáp án đúng)
window.__qa = (function () {
  function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)).filter(vis); }
  function byText(sel, re, root) { return all(sel, root).filter(function (e) { return re.test(e.textContent.replace(/\s+/g, ' ').trim()); })[0] || null; }
  function click(e) { if (!e) return false; e.click(); return true; }
  var said = [];
  function hookSay() { if (G.say && !G.say.__qa) { var o = G.say; G.say = function (t) { said.push(t); return o.apply(this, arguments); }; G.say.__qa = 1; } }
  function vocab(maxLv) {
    var pl = document.getElementById('placement'); if (!pl || pl.style.display === 'none') return 'gone';
    var go = byText('#placement button', /^Bắt đầu/); if (go) { click(go); return 'start'; }
    var grid = pl.querySelector('.pl-yn');
    if (grid && vis(grid)) {
      var tx = (pl.querySelector('.pl-top') || {}).textContent || '', m = /màn (\d)/.exec(tx), lv = m ? +m[1] : 9;
      if (lv <= maxLv) {
        var real = {}; (G.VOCAB_TEST_EN[lv] || []).forEach(function (x) { real[x[0]] = 1; });
        all('.pl-yn-w', pl).forEach(function (b) { if (real[b.textContent.trim()] && b.className.indexOf(' on') < 0) b.click(); });
      }
      click(byText('#placement .pl-yn-go button', /Xong/)); return 'grid ' + lv;
    }
    var w = pl.querySelector('.pl-tvword');
    if (w && vis(w)) {
      var word = w.firstChild.nodeValue.trim(), vi = null;
      for (var k in G.VOCAB_TEST_EN) G.VOCAB_TEST_EN[k].forEach(function (x) { if (x[0] === word) vi = x[1]; });
      var o = all('#placement .pl-opts .opt').filter(function (b) { return b.textContent === vi; })[0];
      click(o || pl.querySelector('.pl-idk')); return 'meaning ' + word;
    }
    var nx = byText('#placement button', /Tiếp: chọn nhân vật|Vào học|Xong ›|Xem kết quả/); if (nx) { click(nx); return 'result'; }
    return 'wait';
  }
  // bài học: R = phòng đang mở
  function lesson(id) {
    hookSay();
    var R = G.ROOMS[id], body = document.getElementById('panel-body');
    if (!document.getElementById('panel').classList.contains('open')) return 'closed';
    var s;
    // màn chính của buổi: Học → Luyện → Kiểm tra theo nút đang tô cam
    if ((s = byText('#panel-body button.big.seal', /1 · Học|1 · Ôn tập|2 · Luyện|3 · Kiểm tra|3 · Thi/))) { click(s); return 'home:' + s.textContent.slice(0, 10); }
    if ((s = byText('#panel-body .mk-sw', /Không dùng micro/))) { click(s); return 'mic-off'; }
    if ((s = byText('#panel-body button', /^Mình đã nói xong/))) { click(s); return 'said'; }
    // xếp câu
    var line = body.querySelector('.oline'), pool = body.querySelector('.opool');
    if (line && pool && vis(pool) && pool.children.length) {
      var q = body.querySelector('.qtext').firstChild.nodeValue.replace(/[“”]/g, ''), it = R.items.filter(function (x) { return x.exVi === q; })[0];
      if (!it) return 'order?';
      var words = it.ex.split(' '), have = [].map.call(line.children, function (c) { return c.textContent; });
      var nextW = words[have.length]; var c = [].filter.call(pool.children, function (x) { return x.textContent === nextW; })[0];
      click(c); return 'order ' + nextW;
    }
    // trắc nghiệm: tìm đáp án đúng theo dữ liệu
    var qt = body.querySelector('.qbox .qtext'), opts = all('#panel-body .opts .opt');
    if (qt && opts.length && !body.querySelector('.opt.ok')) {
      var t = qt.firstChild && qt.firstChild.nodeType === 3 ? qt.firstChild.nodeValue : qt.textContent, ans = null, m2;
      if (/^Nghe và chọn nghĩa đúng/.test(t)) { var last = said[said.length - 1]; R.items.forEach(function (x) { if (x.en === last) ans = x.vi; }); }
      else if ((m2 = /^“(.*)” nói thế nào\?$/.exec(t))) { R.items.forEach(function (x) { if (x.vi === m2[1]) ans = x.en; }); }
      else { R.items.forEach(function (x) { if (x.en === t) ans = x.vi; }); }
      var b = opts.filter(function (o) { return o.getAttribute('data-v') === ans; })[0];
      if (!b) { b = opts.filter(function (o) { return o.className.indexOf(' no') < 0; })[0]; }
      click(b); return 'mcq ' + (ans ? 'ok' : 'guess');
    }
    if ((s = byText('#panel-body button.seal', /^Tiếp|Sang phần Luyện|Làm kiểm tra/))) { click(s); return 'next:' + s.textContent.slice(0, 16); }
    if ((s = byText('#panel-body .result button.seal, #panel-body .row button.seal', /Các buổi tiếp theo|Xong ›|Nhận chứng chỉ|Sang phần 2/))) { click(s); return 'finish'; }
    return 'wait';
  }
  return { vis: vis, all: all, byText: byText, click: click, vocab: vocab, lesson: lesson, said: said };
})();
// các bước chung khi làm nhiệm vụ: lời mời tài khoản, huy hiệu, micro, nói xong, ôn câu, trắc nghiệm còn lại
window.__qa.common = function () {
  var q = window.__qa, s;
  var cg = document.querySelector('.cgate'); if (cg && q.vis(cg)) { s = q.byText('.cgate button', /Để sau/); if (s) { s.click(); return 'cgate-later'; } }
  var md = q.all('.modal').filter(function (m) { return m.querySelector('button'); })[0];
  if (md) { s = q.byText('.modal button', /Tuyệt|Đóng|Tiếp|Xong|OK|›/); if (s) { s.click(); return 'modal:' + s.textContent.trim().slice(0, 12); } }
  var cp = document.querySelector('.chest-pop'); if (cp) { cp.click(); return 'chest-close'; }
  if ((s = q.byText('#panel-body .mk-sw', /Không dùng micro/))) { s.click(); return 'mic-off'; }
  if ((s = q.byText('#panel-body button', /^Mình đã nói xong/))) { s.click(); return 'said'; }
  return null;
};
// Kiểm tra tuần / Nói tự do / Bắt lỗi câu: trả lời bằng dữ liệu
window.__qa.weekly = function () {
  var q = window.__qa, s, nm = G.playerName();
  if ((s = q.byText('#panel-body button.seal', /^Tiếp ›|Bắt đầu phần nói/))) { s.click(); return 'next'; }
  var opts = q.all('#panel-body .opts .opt');
  var hid = document.querySelector('#panel-body .wk-hidden .en');
  if (hid && opts.length && !document.querySelector('#panel-body .opt.ok, #panel-body .opt.no')) {
    var t = hid.textContent, ans = null, ask = (document.querySelector('#panel-body .wk-q') || {}).textContent || '';
    for (var k in G.LIFE) (G.LIFE[k].talks || []).forEach(function (tk) { tk.turns.forEach(function (u) { if (u.npc.replace(/\{name\}/g, nm) === t) ans = /vừa nói gì/.test(ask) ? u.vi.replace(/\{name\}/g, nm) : u.ok.replace(/\{name\}/g, nm); }); });
    var b = opts.filter(function (o) { return o.textContent === ans; })[0] || opts[0]; b.click(); return 'listen ' + (ans ? 'ok' : 'guess');
  }
  var pre = document.querySelector('#panel-body .wk-doc pre');
  if (pre && opts.length && !document.querySelector('#panel-body .opt.ok, #panel-body .opt.no')) {
    var it = G.READ_TASKS.filter(function (x) { return x.text === pre.textContent; })[0];
    var b2 = opts.filter(function (o) { return it && o.textContent === it.opts[it.ok]; })[0] || opts[0]; b2.click(); return 'read ' + (it ? 'ok' : 'guess');
  }
  var ta = document.querySelector('#panel-body textarea.fr-in');
  if (ta && !document.querySelector('#panel-body .fr-res .mk-score')) {
    var qq = (document.querySelector('#panel-body .tbubble .en') || {}).textContent, pool = G.FREE_TALK.slice(); for (var cs in (G.CERT_SPEAK || {})) pool = pool.concat(G.CERT_SPEAK[cs]); var f = pool.filter(function (x) { return x.q === qq; })[0];
    ta.value = f ? f.sample[0] : 'Hello, nice to meet you.';
    var kb = q.byText('#panel-body .fr-box button', /Kiểm|Chấm|Gửi/); if (kb) kb.click(); return 'type ' + (f ? 'sample' : '?');
  }
  if ((s = q.byText('#panel-body button.seal', /Xong ›/))) return 'done';
  return 'wait';
};
window.__qa.fix = function () {
  var q = window.__qa, s;
  var ch = q.all('#panel-body .fx-ch');
  if (ch.length && !document.querySelector('#panel-body .fx-res')) {
    var parts = ch.map(function (c) { return c.textContent; }).join('|');
    var it = G.FIX_EN.filter(function (x) { return x[0] === parts; })[0];
    (it ? ch[it[1]] : ch[0]).click(); return 'pick ' + (it ? 'ok' : 'guess');
  }
  if ((s = q.byText('#panel-body button.seal', /Câu tiếp|Xem kết quả/))) { s.click(); return 'next'; }
  if (document.querySelector('#panel-body .tp-res')) return 'done';
  return 'wait';
};
