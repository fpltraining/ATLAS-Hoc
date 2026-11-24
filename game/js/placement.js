/* Bài kiểm tra đầu vào tiếng Anh · "Ngày đầu tới Brightford" (dữ liệu: data/placement_en.js).
   Kai dẫn người học đi một vòng thành phố: mỗi câu diễn ra ở một nơi (ảnh nơi đó, người ở đó nói với bạn).
   5 phần, theo cách các bài kiểm tra đầu vào chuẩn (Duolingo English Test, EF SET, Cambridge) đang làm:
   1. Từ vựng kiểu Có/Không (như "Read and Select" của Duolingo, LexTALE): mỗi cấp 12 từ, 8 thật 4 giả; chạm từ giả bị trừ,
      2 từ đã chạm được hỏi lại nghĩa để kiểm chứng. Điểm cấp = từ thật biết / 8 − từ giả chạm / 4, đạt từ 0,75.
   2–5. Nghe · Đọc · Phản xạ giao tiếp · Nói: thích ứng (adaptive), bắt đầu ở cấp từ vựng vừa đo; đạt thì lên, chưa đạt thì xuống
      tới khi tìm được cấp cao nhất làm được. Cấp A2 trở lên cần đúng 3 câu trước khi sai 2 câu (đoán mò chỉ khoảng 5% qua được một cấp).
   Trình độ chung = trung vị các kỹ năng, nhưng không vượt cấp từ vựng (thiếu từ nền thì chưa xếp lên cao).
   Mỗi cấp rút ngẫu nhiên từ kho câu, câu đã gặp ở lần làm trước để sau cùng (G.S.dauVaoDaHoi), nên làm lại sau 30 ngày gặp câu mới.
   Kết quả có thêm bản đồ Brightford: nơi bạn đã tự lo được sáng lên, nơi cần học khoá lại.
   Kết quả lưu G.S.dauVao = { lv, nghe, doc, gt, noi, luc, dung, tong } (giờ Việt Nam), lịch sử ở G.S.dauVaoLs.
   Game dùng kết quả để chỉnh độ khó: người mới hiện nghĩa đáp án, từ A2 mở khoá thi vượt các phòng A1. */
var G = window.G || (window.G = {});

(function () {
  var P, PARTS, root, box, done, opts, res, pi, nAsk, nRight, seen = {}, asked = [], lastPl = '', pronRes = null;

  /* icon 3D cho từng phần (thay emoji đầu dòng) */
  var PIC = { tv: 'books', nghe: 'headphone', doc: 'book', gt: 'talk', noi: 'mic' };
  function pic(p) { return G.ic3 ? G.ic3(PIC[p.id] || 'star', 'ic3-s') : null; }
  G.levelName = function (lv) { var p = G.PLACE_EN; return p.levels[lv] + ' · ' + p.names[lv]; };

  G.openPlacement = function (cb, o) {
    P = G.PLACE_EN; done = cb; opts = o || {};
    // kiểm tra nhanh (lần đầu mở app): chỉ phần Từ vựng, khoảng 3 phút; bài đầy đủ làm sau ở Sảnh
    PARTS = opts.quick ? P.parts.filter(function (p) { return p.id === 'tv'; }) : P.parts;
    root = document.getElementById('placement');
    if (!root) { root = G.el('div', { id: 'placement' }); document.body.appendChild(root); }
    root.style.display = 'block';
    G._placementOpen = true;
    intro();
  };
  function close() {
    root.style.display = 'none'; root.innerHTML = ''; G._placementOpen = false;
    if (G.hush) G.hush();
    if (done) done();
  }
  function screen() {
    root.innerHTML = '';
    box = G.el('div.pl-wrap');
    root.appendChild(box);
    root.scrollTop = 0;
    return box;
  }
  function head(kicker, title, sub) {
    box.appendChild(G.el('div.pl-head', G.el('div.kicker', kicker), G.el('h1', title), sub ? G.el('p.small.faint', sub) : null));
  }

  /* ---------- màn mở đầu ---------- */
  function intro() {
    screen();
    if (opts.quick) head(opts.first ? 'Bước 1/2 · khoảng 3 phút' : 'Khoảng 3 phút', 'Kiểm tra nhanh vốn từ', 'Chạm những từ bạn biết nghĩa, app xếp bạn vào đúng tầng để học ngay. Bài đầy đủ 4 kỹ năng (Nghe, Đọc, Giao tiếp, Nói) làm sau ở Sảnh để xếp chính xác hơn.');
    else head(opts.mandatory ? 'Bắt buộc trước khi học tiếp' : 'Làm lại để đo tiến bộ',
      'Ngày đầu tới Brightford', 'Kiểm tra trình độ tiếng Anh theo khung CEFR quốc tế, từ A0 (mới bắt đầu) tới B2. Kai dẫn bạn đi một vòng thành phố: sân bay, xe buýt, quán cà phê, chợ, bệnh viện, ngân hàng… Ở mỗi nơi, người ta nói với bạn, bạn nghe, đọc, đáp lời như thật.');
    var intro = P.places.airport;
    var sc = G.el('div.pl-scene.pl-scene-intro'); sc.style.backgroundImage = 'url("' + G.assetUrl(intro.bg) + '")';
    sc.appendChild(G.imgEl('kai_follow.png', 'pl-npc pl-kai-big'));
    sc.appendChild(G.el('div.pl-scene-say', G.el('b', 'Kai'), G.el('span', 'Chào mừng tới Brightford! Đi một vòng với mình nhé. Xong vòng này, mình biết bạn đã tự lo được ở đâu trong thành phố.')));
    box.appendChild(sc);
    box.appendChild(G.el('div.pl-parts', PARTS.map(function (p) {
      return G.el('div.pl-part', G.el('b', pic(p), p.name), G.el('span.small.faint', p.what));
    })));
    if (!opts.quick) box.appendChild(G.el('div.pl-note',
      G.el('div', G.ic3('stopwatch', 'ic3-s'), ' Bài tự điều chỉnh theo bạn: người mới khoảng 4 phút, người đã học khoảng 12–15 phút.'),
      G.el('div', G.ic3('books', 'ic3-s'), ' Phần đầu là Từ vựng: có từ giả trộn vào, chỉ chạm từ bạn thật sự biết nghĩa.'),
      G.el('div', 'Không tra từ. Không biết thì bấm “Không biết”, như vậy kết quả mới đúng.'),
      G.el('div', G.ic3('seedling', 'ic3-s'), ' Chưa biết tiếng Anh cũng làm bình thường: bấm “Không biết”, bài sẽ tự dừng sau vài câu.'),
      G.el('div', G.ic3('speaker', 'ic3-s'), ' Bật loa hoặc đeo tai nghe để làm phần Nghe.')));
    box.appendChild(G.el('button.btn.seal.big1.pl-go', { onclick: start }, 'Bắt đầu kiểm tra ›'));
    // đã học ở máy khác: đăng nhập lấy tiến độ; tiến độ trên mây có sẵn kết quả kiểm tra thì tải lại app là khỏi làm lại
    if ((opts.first || opts.mandatory) && G.cloudReady && G.cloudReady() && !G.cloudUser())
      box.appendChild(G.el('button.btn.ghost.pl-cloud', { onclick: function () { G.openCloudLogin(function (what) { if (what === 'pulled') setTimeout(function () { location.reload(); }, 900); }); } }, G.ic3 ? G.ic3('cloud', 'ic3-s') : null, 'Đã có tài khoản / học trên máy khác? Đăng nhập'));
    if (opts.canSkip) box.appendChild(G.el('button.btn.ghost.pl-later', { onclick: close }, 'Để sau'));
  }
  function start() {
    res = { tv: null, nghe: null, doc: null, gt: null, noi: null }; pi = 0; nAsk = 0; nRight = 0; asked = []; lastPl = ''; pronRes = null;
    seen = {}; var ds = G.S.dauVaoDaHoi || []; for (var i = 0; i < ds.length; i++) seen[ds[i]] = 1;
    part();
  }
  /* khoá của một câu (để nhớ câu đã gặp) */
  function keyOf(pid, it) { return pid + '|' + (it.a || it.t || it.p || it.read || it.ask); }
  /* rút câu của một cấp: ngẫu nhiên, câu chưa gặp ở lần trước đứng trước */
  function pick(pid, L) {
    var a = G.shuffle(L), u = [], o = [];
    for (var i = 0; i < a.length; i++) (seen[keyOf(pid, a[i])] ? o : u).push(a[i]);
    return u.concat(o);
  }

  /* ---------- từng phần ---------- */
  function part() {
    if (pi >= PARTS.length) { pronStep(); return; }
    var p = PARTS[pi];
    screen();
    head(opts.quick ? 'Kiểm tra nhanh · 3 phút' : 'Phần ' + (pi + 1) + '/' + PARTS.length, p.name, p.what);
    if (p.id === 'noi' && !G.canListen) {
      box.appendChild(G.el('p', 'Máy này chưa hỗ trợ micro chấm điểm, nên bỏ qua phần Nói. Kết quả tính theo 3 phần còn lại.'));
      box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { pi++; part(); } }, 'Xem kết quả ›'));
      return;
    }
    if (p.id === 'noi' && !G.micOn()) {
      box.appendChild(G.el('p', 'Micro đang tắt. Bật micro để đo kỹ năng nói, hoặc bỏ qua phần này.'));
      box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { G.setMic(true); runPart(p); } }, G.ic3('mic', 'ic3-s'), ' Bật micro và làm phần Nói'));
      box.appendChild(G.el('button.btn', { onclick: function () { pi++; part(); } }, 'Bỏ qua phần Nói'));
      return;
    }
    box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { runPart(p); } }, 'Bắt đầu ›'));
  }

  /* đi từ cấp 1 lên 5: đúng 2 câu đầu thì lên cấp, sai cả 2 thì dừng, đúng 1 thì làm câu thứ 3.
     Đúng 1 sai 2 (có thể do bấm nhầm): thêm 2 câu xác nhận, đúng cả 2 thì vẫn lên cấp. Phần Nói: mỗi cấp một bài, chưa đạt thì thử bài thứ hai. */
  function runPart(p) {
    if (p.id === 'tv') { runVocab(p); return; }
    // thích ứng: bắt đầu ở cấp từ vựng vừa đo (ít nhất Pre-A1); đạt thì lên, chưa đạt thì xuống
    var bank = P[p.id], lv = Math.max(1, Math.min(5, res.tv || 1)), passed = 0, tried = false, dir = 0;
    function itemsOf(l) { return bank.filter(function (it) { return it.lv === l; }); }
    function up() { passed = lv; if (dir < 0) { end(); return; } dir = 1; lv++; level(); }
    function down() { if (dir > 0) { end(); return; } dir = -1; lv--; if (lv < 1) { end(); return; } level(); }
    function level() {
      var L = itemsOf(lv);
      if (lv > 5 || !L.length) { end(); return; }
      var q = pick(p.id, L), k = 0;
      if (p.id === 'noi') {
        var again = false;
        (function speakOne() {
          ask(p, q[k++], lv, function (ok) {
            if (ok === null) { end(); return; }   // chuyển sang không dùng micro: dừng phần nói
            tried = true;
            if (ok) { up(); return; }
            if (!again && k < q.length) { again = true; speakOne(); return; }   // máy nghe nhầm: cho thử bài thứ hai
            down();
          });
        })();
        return;
      }
      // Pre-A1, A1: đúng 2 câu là lên (người mới làm nhanh); A2 trở lên: đúng 3 câu trước khi sai 2 câu
      var right = 0, wrong = 0, confirm = false, need = lv >= 3 ? 3 : 2;
      (function one() {
        if (k >= q.length) { if (right >= need) up(); else down(); return; }
        ask(p, q[k++], lv, function (ok) {
          if (ok) right++; else wrong++;
          if (confirm) { if (!ok) down(); else if (right >= 2) up(); else one(); return; }
          if (right >= need) { up(); return; }
          if (wrong >= 2) {
            if (need === 2 && right === 1 && q.length - k >= 2) { confirm = true; right = 0; wrong = 0; one(); return; }
            down(); return;
          }
          one();
        });
      })();
    }
    function end() {
      res[p.id] = p.id === 'noi' && !tried ? null : passed;
      pi++; part();
    }
    level();
  }

  /* ---------- phần Từ vựng: Có/Không có từ giả, đi từ Pre-A1 lên, dừng ở cấp đầu tiên chưa đạt ---------- */
  function runVocab(p) {
    var V = G.VOCAB_TEST_EN, F = G.VOCAB_FAKE_EN, lv = 1, passed = 0, used = {};
    if (!V || !F) { res.tv = null; pi++; part(); return; }
    function wk(x) { return typeof x === 'string' ? x : x[0]; }
    function draw(list, n) { return G.shuffle(list.filter(function (x) { return !used[wk(x)]; })).slice(0, n); }
    (function band() {
      if (lv > 5 || !V[lv]) { fin(); return; }
      var real = draw(V[lv], 8), fake = draw(F[lv], 4);
      real.concat(fake).forEach(function (x) { used[wk(x)] = 1; });
      grid(lv, real, fake, function (tapReal, tapFake) {
        // kiểm chứng: hỏi lại nghĩa 2 từ đã chạm; trả lời sai một từ thì trừ 2 từ (coi như chạm quá tay)
        var check = G.shuffle(tapReal.slice()).slice(0, 2), k = 0, bad = 0;
        (function next() {
          if (k >= check.length) {
            var hits = Math.max(0, tapReal.length - bad * 2), score = hits / 8 - tapFake.length / 4;
            if (score >= 0.75) { passed = lv; lv++; band(); } else fin();
            return;
          }
          meaning(check[k++], V[lv], function (ok) { if (!ok) bad++; next(); });
        })();
      });
    })();
    function fin() { res.tv = passed; pi++; part(); }
  }
  function vocabTop(sub) {
    box.className = 'pl-wrap pl-qs pl-tvw';
    var dots = G.el('div.pl-prog', PARTS.map(function (q, i) { return G.el('i' + (i < pi ? '.done' : i === pi ? '.on' : '')); }));
    box.appendChild(G.el('div.pl-top', G.el('span.small.faint', pic(PARTS[pi]), PARTS[pi].name + ' · ' + sub), dots));
  }
  function grid(lv, real, fake, cb) {
    screen(); vocabTop('màn ' + lv + '/5');
    var all = G.shuffle(real.map(function (x) { return { w: x[0], real: true }; }).concat(fake.map(function (w) { return { w: w, real: false }; })));
    box.appendChild(G.el('div.pl-yn-h', G.el('b', 'Chạm những từ bạn biết nghĩa'), G.el('span.small.faint', 'Có 4 từ không có thật trộn vào. Chạm nhầm từ giả bị trừ điểm, không chắc thì đừng chạm.')));
    var g = G.el('div.pl-yn', all.map(function (x) {
      var b = G.el('button.pl-yn-w', { 'aria-pressed': 'false', onclick: function () { x.on = !x.on; b.className = 'pl-yn-w' + (x.on ? ' on' : ''); b.setAttribute('aria-pressed', x.on ? 'true' : 'false'); } }, x.w);
      return b;
    }));
    box.appendChild(g);
    G.enter(g.children, { gap: 25, y: 6, dur: 300 });
    box.appendChild(G.el('div.row.pl-yn-go',
      G.el('button.btn.ghost', { onclick: function () { cb([], []); } }, 'Không biết từ nào'),
      G.el('button.btn.seal', { onclick: function () {
        var tr = [], tf = [];
        all.forEach(function (x) { if (!x.on) return; if (x.real) { for (var i = 0; i < real.length; i++) if (real[i][0] === x.w) tr.push(real[i]); } else tf.push(x.w); });
        cb(tr, tf);
      } }, 'Xong ›')));
  }
  function meaning(row, pool, cb) {
    screen(); vocabTop('kiểm chứng');
    var seg = function (s) { return s.toLowerCase().split(/[,;/]/)[0].trim(); }, opts = [row[1]], tries = 0;
    while (opts.length < 4 && tries++ < 80) {
      var o = pool[Math.floor(Math.random() * pool.length)][1];
      if (opts.every(function (x) { return seg(x) !== seg(o) && x.indexOf(seg(o)) < 0 && o.indexOf(seg(x)) < 0; })) opts.push(o);
    }
    var card = G.el('div.pl-card');
    card.appendChild(G.el('div.small.faint', 'Bạn vừa chạm từ này. Nghĩa của nó là gì?'));
    card.appendChild(G.el('div.pl-tvword', row[0], G.sayBtns ? G.sayBtns(row[0], 'en') : null));
    var picked = false;
    card.appendChild(G.el('div.pl-opts', G.shuffle(opts).map(function (o) {
      return G.el('button.opt', { onclick: function (e) { if (picked) return; picked = true; e.currentTarget.className = 'opt pl-picked'; answer(o === row[1], cb); } }, o);
    })));
    card.appendChild(G.el('button.btn.ghost.pl-idk', { onclick: function () { if (picked) return; picked = true; answer(false, cb); } }, 'Không biết'));
    box.appendChild(card);
  }

  /* nơi diễn ra câu hỏi và người nói */
  function placeOf(it) { return P.places[it.pl] || P.places.airport; }
  function whoOf(it) { var w = P.who[it.who || placeOf(it).who]; return w || null; }
  /* cảnh: ảnh nơi đó, tên nơi, người nói đứng trong cảnh (phần Đọc không có người nói) */
  function scene(p, it) {
    var pl = placeOf(it), w = whoOf(it), sc = G.el('div.pl-scene');
    sc.style.backgroundImage = 'url("' + G.assetUrl(pl.bg) + '")';
    sc.appendChild(G.el('span.pl-place', G.ic3('pin', 'ic3-s'), ' ' + pl.name));
    if (pl.prop) sc.appendChild(G.imgEl(pl.prop, 'pl-prop'));
    if (w && w[1] && p.id !== 'doc') sc.appendChild(G.imgEl(w[1].replace('.png', '_talk.png'), 'pl-npc', w[1]));
    return sc;
  }
  /* Kai dẫn đường: chỉ nói khi tới nơi mới */
  function kaiLine(it) {
    if (it.pl === lastPl) return null;
    lastPl = it.pl;
    return G.el('div.pl-kai', G.imgEl('kai_follow.png', 'pl-kai-img'), G.el('span', placeOf(it).kai));
  }
  /* ---------- một câu hỏi ---------- */
  function ask(p, it, lv, cb) {
    screen();
    asked.push(keyOf(p.id, it)); G._plCur = it;   // G._plCur: để kiểm tra tự động
    box.className = 'pl-wrap pl-qs';   // màn câu hỏi: điện thoại nằm ngang xếp cảnh bên trái, câu hỏi bên phải
    var dots = G.el('div.pl-prog', PARTS.map(function (q, i) { return G.el('i' + (i < pi ? '.done' : i === pi ? '.on' : '')); }));
    box.appendChild(G.el('div.pl-top', G.el('span.small.faint', pic(p), p.name + ' · câu ' + (nAsk + 1)), dots));
    var kl = kaiLine(it); if (kl) box.appendChild(kl);
    box.appendChild(scene(p, it));
    if (p.id === 'noi') { askSpeak(it, cb); return; }
    var card = G.el('div.pl-card'), w = whoOf(it);
    if (p.id === 'nghe') {
      card.appendChild(G.el('div.pl-bub.pl-bub-npc', G.el('b.pl-bub-name', (w ? w[0] : '') + ' nói:'),
        G.el('div.pl-listen',
          G.el('button.pl-play', { onclick: function () { G.say(it.a, 'en'); } }, G.ic3('speaker', 'ic3-s'), ' Nghe lại'),
          G.el('button.pl-play.slow', { onclick: function () { G.saySlow(it.a, 'en'); } }, G.ic3('turtle', 'ic3-s'), ' Nghe chậm'))));
      setTimeout(function () { G.say(it.a, 'en'); }, 450);
    } else if (p.id === 'doc') {
      var sign = it.t.length <= 26 && it.t.indexOf(':') < 0;
      card.appendChild(G.el('div' + (sign ? '.pl-sign' : '.pl-msg'), it.t));
    } else if (p.id === 'gt') {
      card.appendChild(G.el('div.pl-bub.pl-bub-npc', G.el('b.pl-bub-name', w ? w[0] : ''),
        G.el('div.pl-bub-row', G.el('div', it.p), G.el('button.pl-mini', { 'aria-label': 'Nghe', onclick: function () { G.say(it.p, 'en'); } }, G.ic3('speaker', 'ic3-s')))));
      card.appendChild(G.el('div.small.faint', 'Bạn đáp lại thế nào cho tự nhiên?'));
      setTimeout(function () { G.say(it.p, 'en'); }, 450);
    }
    if (it.q) card.appendChild(G.el('div.pl-q', it.q));
    var picked = false;
    var order = G.shuffle(it.o.map(function (o, i) { return i; }));
    card.appendChild(G.el('div.pl-opts', order.map(function (i) {
      return G.el('button.opt', { onclick: function (e) {
        if (picked) return; picked = true;
        e.currentTarget.className = 'opt pl-picked';
        answer(i === 0, cb);
      } }, it.o[i]);
    })));
    card.appendChild(G.el('button.btn.ghost.pl-idk', { onclick: function () { if (picked) return; picked = true; answer(false, cb); } }, 'Không biết'));
    box.appendChild(card);
  }
  /* không báo đúng/sai từng câu (để không đoán theo), chỉ chuyển câu nhẹ nhàng */
  function answer(ok, cb) {
    nAsk++; if (ok) nRight++;
    if (G.hush) G.hush();
    setTimeout(function () { cb(ok); }, 260);
  }

  function askSpeak(it, cb) {
    var card = G.el('div.pl-card');
    box.appendChild(card);
    if (it.read) {
      card.appendChild(G.el('div.small.faint', 'Đọc to câu này:'));
      card.appendChild(G.speakCard({ text: it.read, lang: 'en', onDone: function (sc) {
        if (sc === null || sc === undefined) { cb(null); return; }   // bỏ qua hoặc tắt micro
        nAsk++; var ok = sc >= it.pass; if (ok) nRight++;
        cb(ok);
      } }));
      return;
    }
    // tự trả lời câu hỏi: đếm số từ máy nghe được và có từ nối hợp ý không
    var tries = 0, out = G.el('div.pl-heard'), w = whoOf(it);
    card.appendChild(G.el('div.pl-bub.pl-bub-npc', G.el('b.pl-bub-name', w ? w[0] : ''),
      G.el('div.pl-bub-row', G.el('div', it.ask), G.el('button.pl-mini', { 'aria-label': 'Nghe', onclick: function () { G.say(it.ask, 'en'); } }, G.ic3('speaker', 'ic3-s')))));
    card.appendChild(G.el('div.small.faint', it.vi));
    var mic = G.el('button.mk-mic', { onclick: go }, G.el('span', G.ic3('mic', 'ic3-s')), G.el('b', 'Bấm rồi nói'));
    card.appendChild(G.el('div.pl-microw', mic, out));
    card.appendChild(G.el('div.row',
      G.el('button.btn.ghost', { onclick: function () { nAsk++; cb(false); } }, 'Không trả lời được'),
      G.el('button.btn.ghost', { onclick: function () { cb(null); } }, 'Bỏ qua phần Nói')));
    setTimeout(function () { G.say(it.ask, 'en'); }, 350);
    function go() {
      if (mic.className.indexOf('on') >= 0) return;
      mic.className = 'mk-mic on'; out.innerHTML = ''; out.appendChild(G.el('div.small', G.ic3('mic', 'ic3-s'), ' Đang nghe… nói xong máy tự dừng'));
      G.listen('en', function (err, alts) {
        mic.className = 'mk-mic';
        out.innerHTML = '';
        if (err) { out.appendChild(G.el('div.mk-err', err.msg || 'Chưa nghe rõ, thử lại nhé.')); return; }
        tries++;
        var heard = (alts && alts[0]) || '', w = G.words(heard), low = ' ' + heard.toLowerCase() + ' ';
        var hasAny = !it.any || it.any.some(function (a) { return low.indexOf(' ' + a + ' ') >= 0; });
        var ok = w.length >= it.min && hasAny;
        out.appendChild(G.el('div.small', 'Máy nghe: “' + heard + '” · ' + w.length + ' từ'));
        if (ok || tries >= 2) {
          nAsk++; if (ok) nRight++;
          setTimeout(function () { cb(ok); }, 900);
        } else out.appendChild(G.el('div.small.faint', 'Nói dài hơn một chút (khoảng ' + it.min + ' từ trở lên) rồi bấm micro lần nữa.'));
      });
    }
  }

  /* phần thêm (1 phút): bắt lỗi phát âm hay gặp của người Việt, chỉ khi đã làm phần Nói bằng micro */
  function pronStep() {
    if (!G.pronCheck || res.noi === null || res.noi === undefined || !(G.micOn && G.micOn())) { finish(); return; }
    screen();
    head('Phần thêm · 1 phút', 'Bắt lỗi phát âm', 'Đọc to 12 từ ngắn. Người Việt hay đọc card thành car, three thành tree, cats thành cat… Máy nghe xem bạn có mắc lỗi nào, rồi gợi ý cách sửa và bài luyện riêng.');
    box.appendChild(G.el('button.btn.seal.big1', { onclick: function () {
      G.pronCheck(root, function (kq) { pronRes = kq; root.innerHTML = ''; box = G.el('div.pl-wrap'); root.appendChild(box); finish(); });
    } }, 'Bắt đầu ›'));
    box.appendChild(G.el('button.btn', { onclick: finish }, 'Bỏ qua, xem kết quả'));
  }

  /* ---------- mục tiêu học và thời gian mỗi ngày → dự kiến khi nào đạt (cùng cách tính với thanh kéo ở Sảnh) ---------- */
  var GOALS = [
    { id: 'giaotiep', icon: '💬', ic3: 'talk', name: 'Giao tiếp hằng ngày', step: 2 },
    { id: 'dulich', icon: '✈️', ic3: 'plane', name: 'Đi du lịch', step: 2 },
    { id: 'dilam', icon: '💼', ic3: 'work', name: 'Đi làm, công việc', step: 3 },
    { id: 'con', icon: '🧒', ic3: 'child', name: 'Học cùng con', step: 1 },
    { id: 'thi', icon: '🎓', ic3: 'grad', name: 'Thi chứng chỉ, du học', step: 4 }
  ];
  G.GOALS_EN = GOALS;
  G.goalOf = function () { var m = G.S.mucTieu; for (var i = 0; i < GOALS.length; i++) if (m && GOALS[i].id === m.id) return GOALS[i]; return null; };
  /* ---------- mốc thời gian: người học chọn muốn đạt mục tiêu trong bao lâu; app tính mỗi ngày cần học bao nhiêu
     (giờ còn lại tới mục tiêu ÷ số ngày học còn lại, tính lại mỗi ngày: học chậm thì phần mỗi ngày tăng, nhanh thì giảm) ---------- */
  var MOCS = [3, 6, 9, 12, 18, 24];
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function fmtDay(s) { var a = s.split('-'); return +a[2] + '/' + +a[1] + '/' + a[0]; }
  function stepOf() { var g = G.goalOf(); return g ? g.step : 4; }   // chưa chọn mục tiêu: tới Tốt nghiệp ConnectLife (nói, đọc hiểu, nghe trôi chảy)
  function hoursTo(step, dpw) { if (!G.etaPlan) return 0; var r = G.etaPlan(60, dpw)[step]; return r ? r.cum : 0; }
  function ceil5(x) { return Math.ceil(x / 5) * 5; }
  G.planNeed = function (months, step, dpw) { var h = hoursTo(step, dpw); return h <= 0 ? 0 : ceil5(h * 60 / (months * 30.4 * dpw / 7)); };
  G.setPlan = function (months) {
    var cd = G.S.caiDat = G.S.caiDat || {}, dpw = cd.ngayTuan || 5, step = stepOf(), need = Math.max(10, G.planNeed(months, step, dpw));
    var e = G.vnParts(Date.now() + months * 30.4 * 86400000);
    G.S.mocHoc = { thang: months, buoc: step, tu: G.vnDay(), den: e.y + '-' + pad2(e.m) + '-' + pad2(e.d), phut0: need };
    cd.phutNgay = need; ptAt = 0; G.save(); if (G.updateHud) G.updateHud();
  };
  /* tiến độ hôm nay theo mốc: { phut cần học hôm nay, den, ngay còn lại, xong, het (quá mốc), cham, nhanh } */
  var ptCache = null, ptAt = 0;
  G.planToday = function () {
    var m = G.S.mocHoc; if (!m || !G.etaPlan) return null;
    if (ptCache && Date.now() - ptAt < 60000) return ptCache;
    var cd = G.S.caiDat || {}, dpw = cd.ngayTuan || 5, end = Date.parse(m.den + 'T23:59:59+07:00');
    var daysLeft = (end - Date.now()) / 86400000, h = hoursTo(m.buoc, dpw);
    var o = { thang: m.thang, den: m.den, ngay: Math.max(0, Math.ceil(daysLeft)), xong: h <= 0, het: daysLeft <= 0, phut0: m.phut0 };
    o.phut = o.xong || o.het ? (cd.phutNgay || m.phut0) : Math.min(240, Math.max(10, ceil5(h * 60 / Math.max(1, daysLeft * dpw / 7))));
    o.cham = !o.xong && !o.het && o.phut > m.phut0 * 1.1; o.nhanh = !o.xong && !o.het && o.phut < m.phut0 * 0.9;
    ptCache = o; ptAt = Date.now(); return o;
  };
  /* một dòng nói rõ kế hoạch: đạt gì, trước ngày nào, mỗi ngày bao lâu */
  G.planLine = function () {
    var m = G.S.mocHoc, g = G.goalOf(), cd = G.S.caiDat || {}, dpw = cd.ngayTuan || 5;
    if (!m) return 'Chọn mốc thời gian: app tính mỗi ngày cần học bao nhiêu và giao đủ phần đó mỗi ngày.';
    var pt = G.planToday(), st = G.ROADMAP_EN[m.buoc] || {}, who = g ? g.name + ': ' : '';
    if (pt.xong) return 'Bạn đã đạt ' + st.name + '! Chọn mục tiêu cao hơn để học tiếp.';
    if (pt.het) return 'Mốc ' + fmtDay(m.den) + ' đã qua mà chưa đạt ' + st.name + '. Chọn mốc mới, app tính lại phần học mỗi ngày.';
    return who + 'đạt ' + st.name + ' (' + st.cefr + ') trước ' + fmtDay(m.den) + ' (mốc ' + m.thang + ' tháng). Học ' + dpw + ' ngày/tuần, mỗi ngày học khoảng ' + pt.phut + ' phút' + (dpw < 7 ? ', còn lại nghỉ' : '') + '.' +
      (pt.cham ? ' Đang chậm so với mốc nên phần học mỗi ngày đã tăng để kịp.' : pt.nhanh ? ' Bạn đang nhanh hơn tiến độ.' : '');
  };
  G.goalLine = function () { return G.planLine(); };
  /* ngày học trong tuần (1 = thứ Hai … 7 = Chủ nhật, giờ Việt Nam); chưa chọn thì trải đều theo số ngày mỗi tuần */
  var SPREAD = { 2: [2, 5], 3: [1, 3, 5], 4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6], 7: [1, 2, 3, 4, 5, 6, 7] };
  function dowOf(t) { var d = new Date(t + 7 * 3600000).getUTCDay(); return d === 0 ? 7 : d; }
  G.studyDays = function () { var cd = G.S.caiDat || {}; return cd.ngayHoc && cd.ngayHoc.length >= 2 ? cd.ngayHoc.slice() : (SPREAD[cd.ngayTuan || 5] || SPREAD[5]).slice(); };
  G.isStudyDay = function (t) { return G.studyDays().indexOf(dowOf(t || Date.now())) >= 0; };

  /* ---------- thẻ "Kế hoạch của bạn" (kết quả đầu vào, Sảnh) ----------
     Con số kết quả là trung tâm (phút mỗi ngày, ngày mỗi tuần, tháng); chọn ngày học trên dải 7 ngày; mục tiêu là thẻ chữ lớn;
     thời gian là thước có nấc; cuối thẻ là chặng đường tới mục tiêu. Không emoji.
     Chuyển động: số chạy tới giá trị mới rồi nảy nhẹ, chạm thì nhún, núm thước và thanh chặng đường trượt êm
     (tắt khi máy bật Giảm chuyển động). */
  var DAYN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  function calm() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function bump(el) { el.classList.remove('pv-bump'); void el.offsetWidth; el.classList.add('pv-bump'); }
  function countTo(el, to, txt) {
    el._tk = (el._tk || 0) + 1;
    if (txt !== undefined) { el.textContent = txt; el.removeAttribute('data-v'); return; }
    var from = el.hasAttribute('data-v') ? +el.getAttribute('data-v') : 0, tk = el._tk;
    el.setAttribute('data-v', to);
    G.countUp(el, from, to, { dur: 560, done: function () { if (el._tk === tk && from !== to && !calm()) bump(el); } });
  }
  function lvOf(st) { return st.final ? 'Tốt nghiệp' : st.floor === 1 ? 'Nền tảng' : st.cefr.split('→').pop().replace(/^\s+|\s+$/g, ''); }
  function ddmm(s) { var a = s.split('-'); return +a[2] + '/' + +a[1]; }
  G.goalCard = function (onChange) {
    var cd = G.S.caiDat = G.S.caiDat || {};
    function changed() { if (G.S.mocHoc) G.setPlan(G.S.mocHoc.thang); else G.save(); draw(); if (onChange) onChange(); }
    var title = G.el('div.pv-title'), sub = G.el('div.pv-sub');
    var nMin = G.el('b.pv-num'), nDay = G.el('b.pv-num'), nMon = G.el('b.pv-num');
    var week = G.el('div.pv-week'), goals = G.el('div.pv-goals'), stops = G.el('div.pv-stops'), fill = G.el('span.pv-fill'), thumb = G.el('span.pv-thumb'), thumbw = G.el('span.pv-thumbw', thumb);
    var bar = G.el('i'), pct = G.el('b.pv-pctn'), road = G.el('div.pv-road'), note = G.el('div.pv-note'), weekHint = G.el('span.pv-hint'), rulerHint = G.el('span.pv-hint');
    var root = G.el('div.pv',
      G.el('div.pv-head', G.el('span.pv-kicker', 'Kế hoạch của bạn'), title, sub),
      G.el('div.pv-stats',
        G.el('div.pv-stat.main', nMin, G.el('span', 'phút mỗi ngày')),
        G.el('div.pv-stat', nDay, G.el('span', 'ngày mỗi tuần')),
        G.el('div.pv-stat', nMon, G.el('span', 'tháng'))),
      G.el('div.pv-sec.pv-s-goal',
        G.el('div.pv-lab', G.el('b', 'Mục tiêu')),
        goals),
      G.el('div.pv-sec.pv-s-week',
        G.el('div.pv-lab', G.el('b', 'Ngày học trong tuần'), weekHint),
        week),
      G.el('div.pv-sec.pv-s-time',
        G.el('div.pv-lab', G.el('b', 'Đạt mục tiêu trong'), rulerHint),
        G.el('div.pv-ruler', G.el('span.pv-track'), fill, thumbw, stops)),
      G.el('div.pv-sec.pv-way',
        G.el('div.pv-lab', G.el('b', 'Chặng đường'), G.el('span.pv-hint', pct, ' đã đi')),
        G.el('div.pv-bar', bar), road),
      note);
    function draw() {
      var g = G.goalOf(), m = G.S.mocHoc, step = stepOf(), tg = m ? m.buoc : step, days = G.studyDays(), dpw = days.length;
      var pt = G.planToday ? G.planToday() : null, st = G.ROADMAP_EN[tg] || {};
      title.textContent = g ? g.name : 'Bạn học tiếng Anh để làm gì?';
      sub.textContent = !m ? 'Chọn mục tiêu, ngày học và thời gian. App tính mỗi ngày cần học bao lâu và giao đủ phần đó.' :
        pt && pt.xong ? 'Bạn đã đạt mục tiêu này. Chọn mục tiêu cao hơn để học tiếp.' :
        (st.final ? 'Tốt nghiệp ConnectLife' : 'Đạt trình độ ' + lvOf(st)) + ' trước ' + fmtDay(m.den);
      var empty = !m || (pt && pt.xong);
      nMin.parentNode.className = 'pv-stat main' + (empty ? ' empty' : '');
      countTo(nMin, pt && !pt.xong ? pt.phut : 0, empty ? (m ? 'Đã đạt' : 'Chọn mốc') : undefined);
      countTo(nDay, dpw);
      countTo(nMon, m ? m.thang : 0, m ? undefined : '–');
      // mục tiêu
      goals.innerHTML = '';
      GOALS.forEach(function (x) {
        var r = G.ROADMAP_EN[x.step] || {};
        goals.appendChild(G.el('button.pv-goal' + (g && g.id === x.id ? '.on' : ''), { 'aria-pressed': g && g.id === x.id ? 'true' : 'false', onclick: function () { G.S.mucTieu = { id: x.id, luc: G.vnNow() }; changed(); } },
          G.ic3(x.ic3), G.el('div', G.el('b', x.name), G.el('span', r.final ? 'Đầu ra giao tiếp' : 'Trình độ ' + lvOf(r)))));
      });
      // ngày học
      week.innerHTML = '';
      DAYN.forEach(function (lb, i) {
        var d = i + 1, on = days.indexOf(d) >= 0;
        week.appendChild(G.el('button.pv-day' + (on ? '.on' : '') + (d === dowOf(Date.now()) ? '.today' : ''), { 'aria-pressed': on ? 'true' : 'false', 'aria-label': (on ? 'Ngày học ' : 'Ngày nghỉ ') + lb, onclick: function () {
          var ds = G.studyDays(), k = ds.indexOf(d);
          if (k >= 0) { if (ds.length <= 2) { G.toast('Học ít nhất 2 ngày mỗi tuần để không quên bài.'); return; } ds.splice(k, 1); } else ds.push(d);
          ds.sort(function (x, y) { return x - y; }); cd.ngayHoc = ds; cd.ngayTuan = ds.length; changed();
        } }, lb));
      });
      weekHint.textContent = dpw + ' ngày học, ' + (7 - dpw) + ' ngày nghỉ';
      // thước thời gian
      stops.innerHTML = '';
      var sel = -1;
      MOCS.forEach(function (mo, i) {
        var need = G.planNeed(mo, step, dpw), hard = need > 240, on = !!m && m.thang === mo;
        if (on) sel = i;
        stops.appendChild(G.el('button.pv-stop' + (on ? '.on' : '') + (hard ? '.hard' : ''), { style: { left: (i / (MOCS.length - 1) * 100) + '%' }, 'aria-pressed': on ? 'true' : 'false', onclick: function () {
          if (hard) { G.toast('Mốc ' + mo + ' tháng cần hơn 4 giờ mỗi ngày, quá gấp. Chọn mốc dài hơn nhé.'); return; }
          G.setPlan(mo); draw(); if (onChange) onChange();
        } }, G.el('i'), G.el('b', mo + ''), G.el('span', need <= 0 ? 'đã đạt' : hard ? 'quá gấp' : Math.max(10, need) + ' ph')));
      });
      var left = sel < 0 ? 0 : sel / (MOCS.length - 1) * 100;
      thumbw.style.transform = 'translateX(' + left + '%)'; fill.style.transform = 'scaleX(' + (left / 100) + ')';
      thumb.className = 'pv-thumb' + (sel < 0 ? ' off' : '');
      rulerHint.textContent = sel < 0 ? 'chạm một mốc (tháng)' : 'tháng · phút mỗi ngày';
      // chặng đường: phần đã học trên tổng số giờ tới mục tiêu, các mốc trình độ và tháng dự kiến
      var rows = G.etaPlan ? G.etaPlan(pt && !pt.xong ? pt.phut : (cd.phutNgay || 40), dpw) : [], all = 0, i;
      for (i = 0; i <= tg && i < G.ROADMAP_EN.length; i++) all += (G.ROADMAP_EN[i].hours || 0) + (G.topicHours && !G.ROADMAP_EN[i].final ? G.topicHours(G.ROADMAP_EN[i].floor).all : 0);
      var leftH = rows[tg] ? rows[tg].cum : all, prog = all ? Math.max(0, Math.min(1, 1 - leftH / all)) : 0;
      bar.style.transform = 'scaleX(' + prog + ')';
      countTo(pct, Math.round(prog * 100)); pct.setAttribute('data-suf', '%');
      // theo thứ tự thời gian: các mốc đã qua, hôm nay, các mốc sắp tới
      road.innerHTML = '';
      var nowPt = G.el('div.pv-pt.now', G.el('i'), G.el('b', 'Hôm nay'), G.el('span', ddmm(G.vnDay())));
      rows.forEach(function (r, k) {
        if (k > tg) return;
        var done = r.left <= 0;
        if (!done && nowPt) { road.appendChild(nowPt); nowPt = null; }
        road.appendChild(G.el('div.pv-pt' + (done ? '.done' : '') + (k === tg ? '.goal' : ''), G.el('i'), G.el('b', lvOf(G.ROADMAP_EN[k])),
          G.el('span', done ? 'đã qua' : m ? r.month.replace('tháng ', 'th ') : r.span)));
      });
      if (nowPt) road.appendChild(nowPt);
      note.textContent = !m ? 'Chặng đường đang ước tính theo 40 phút mỗi ngày. Chọn mốc thời gian để app tính và giao đủ phần mỗi ngày.' :
        pt && pt.cham ? 'Đang chậm so với mốc, phần mỗi ngày đã tăng để kịp.' : pt && pt.nhanh ? 'Bạn đang nhanh hơn tiến độ, phần mỗi ngày đã giảm.' :
        'Học đủ phần mỗi ngày là kịp mốc. Ngày nghỉ trong lịch không làm đứt chuỗi.';
    }
    draw();
    // lần đầu hiện thẻ: các phần trượt lên lần lượt (anime.js)
    G.enter([root.querySelector('.pv-head')].concat([].slice.call(root.querySelectorAll('.pv-stat, .pv-sec, .pv-note'))), { gap: 60 });
    root.redraw = draw;
    return root;
  };

  /* ---------- kết quả ---------- */
  function skillMid(r) {
    var v = [r.nghe, r.doc, r.gt]; if (r.noi !== null && r.noi !== undefined) v.push(r.noi);
    v.sort(function (a, b) { return a - b; });
    return v[Math.floor((v.length - 1) / 2)];   // trung vị (lấy giá trị thấp hơn khi số phần chẵn)
  }
  // trình độ chung: trung vị các kỹ năng, không vượt cấp từ vựng (từ là nền của cả nghe, đọc, nói)
  function overall(r) { var m = skillMid(r); return r.tv === null || r.tv === undefined ? m : Math.min(m, r.tv); }
  /* tầng nên học theo trình độ: A0, Pre-A1 → Tầng 1 Nền tảng; A1 → Tầng 2; A2 → Tầng 3; B1 trở lên → Tầng 4 */
  G.floorForLevel = function (lv) { return lv >= 4 ? 4 : lv === 3 ? 3 : lv === 2 ? 2 : 1; };
  function finish() {
    // kiểm tra nhanh: xếp theo vốn từ, tối đa A2 (lên thẳng Tầng 4 cần bài đầy đủ)
    var lv = opts.quick ? Math.min(res.tv || 0, 3) : overall(res);
    var rec = { lv: lv, tv: res.tv, nghe: res.nghe, doc: res.doc, gt: res.gt, noi: res.noi, luc: G.vnNow(), dung: nRight, tong: nAsk, ban: 2 };
    if (opts.quick) rec.nhanh = 1;
    var floorWas = G.enFloorNow ? G.enFloorNow() : 1;
    var prev = G.S.dauVao;
    G.S.dauVao = rec;
    if (G.track) G.track('dau_vao', { lv: rec.lv, tv: rec.tv, nhanh: rec.nhanh ? 1 : 0 });
    G.S.dauVaoLs = (G.S.dauVaoLs || []).concat([rec]).slice(-12);
    G.S.dauVaoDaHoi = asked.slice(0, 120);   // lần sau rút câu khác
    if (G.S.caiDat) delete G.S.caiDat.nghiaDapAn;   // để nghĩa đáp án tự bật/tắt theo trình độ mới
    G.save();
    G.sfx && G.sfx('done');
    screen();
    head('Kết quả đầu vào', G.levelName(lv), 'Đúng ' + nRight + '/' + nAsk + ' câu · ' + rec.luc.slice(0, 16) + ' (giờ Việt Nam)');
    box.appendChild(G.el('div.pl-lv', G.el('b', P.levels[lv]), G.el('span', P.names[lv])));
    box.appendChild(G.el('div.pl-skills', P.parts.map(function (p) {
      var v = res[p.id];
      return G.el('div.pl-skill', G.el('span.pl-sk-name', pic(p), p.name),
        G.el('span.pl-bar', [1, 2, 3, 4, 5].map(function (k) { return G.el('i' + (v !== null && v >= k ? '.on' : '')); })),
        G.el('b.pl-sk-lv', v === null ? 'chưa đo' : P.levels[v]));
    })));
    if (prev && prev.luc) box.appendChild(G.el('p.small', (lv > prev.lv ? 'Tiến bộ: ' : lv < prev.lv ? 'Lùi một chút: ' : 'Giữ nguyên: ') + 'lần trước ' + P.levels[prev.lv] + ' (' + prev.luc.slice(0, 10) + ') → lần này ' + P.levels[lv]));
    if (res.tv !== null && res.tv !== undefined && lv < skillMid(res)) box.appendChild(G.el('p.small.pl-cap', 'Nghe, đọc, giao tiếp của bạn ở mức ' + P.levels[skillMid(res)] + ', nhưng vốn từ mới ở mức ' + P.levels[res.tv] + '. Trình độ chung tính theo vốn từ, vì thiếu từ nền thì học lên cao sẽ hổng. Học từ ở tầng dưới nhanh thôi, thấy dễ thì thi vượt.'));
    if (opts.quick) box.appendChild(G.el('p.small.pl-cap', 'Đây là kết quả nhanh theo vốn từ. Khi rảnh, làm bài đầy đủ 4 kỹ năng ở Sảnh (12–15 phút) để xếp chính xác hơn, giỏi thì lên thẳng Tầng 4.'));
    box.appendChild(G.el('div.pl-can', G.el('b', 'Bạn đang ở mức: '), P.cando[lv]));
    // tầng nên học theo kết quả này; khác tầng đang học thì cho chọn (tiến độ cũ giữ nguyên, thang máy vẫn đi được tầng đã học)
    var fl = G.floorForLevel(lv), moveBtn = null;
    if (prev && fl !== floorWas) {
      var fName = function (n) { var r = G.ROADMAP_EN && G.ROADMAP_EN[n - 1]; return r ? r.name : 'Tầng ' + n; };
      moveBtn = G.el('button.btn.seal', { onclick: function () { G.S.tangEn = fl; G.save(); if (G.updateHud) G.updateHud(); moveBtn.disabled = true; moveBtn.textContent = 'Đã chuyển sang ' + fName(fl); G.toast('📍 Từ giờ học ở ' + fName(fl) + '. Tiến độ cũ vẫn giữ nguyên.'); } }, 'Học ở ' + fName(fl) + ' ›');
      box.appendChild(G.el('div.pl-floor', G.el('b', 'Tầng nên học: ' + fName(fl)), G.el('span.small', 'Bạn đang học ở ' + fName(floorWas) + '. Chuyển tầng không mất tiến độ: phòng đã học vẫn vào lại được bằng thang máy.'), moveBtn));
    }
    box.appendChild(cityMap(lv));
    if (pronRes && G.pronCard) {   // vừa bắt lỗi phát âm: 3 lỗi hay mắc nhất, cách sửa, nút luyện ngay
      var det = {}; pronRes.loi.forEach(function (x) { det[x.tag] = x.heard; });
      box.appendChild(G.pronCard(function () { G.openPronPractice(function () {}); }, det));
    }
    box.appendChild(G.goalCard());
    box.appendChild(G.el('div.pl-plan', G.el('b', 'App sẽ chỉnh cho bạn:'), G.el('ul', plan(lv).map(function (t) { return G.el('li', t); }))));
    box.appendChild(G.el('p.small.faint', 'Học khoảng 30 ngày thì làm lại ở Sảnh → “Trình độ đầu vào” để xem mình lên cấp chưa.'));
    box.appendChild(G.el('button.btn.big1.pl-go' + (moveBtn ? '' : '.seal'), { onclick: close }, opts.first ? 'Tiếp: chọn nhân vật ›' : opts.canSkip ? 'Xong ›' : 'Vào học ›'));
  }
  /* bản đồ Brightford của bạn: nơi đã tự lo được (đủ cấp) sáng lên, nơi cần học khoá lại kèm cấp cần đạt */
  function cityMap(lv) {
    var ids = [], n = 0, k;
    for (k in P.places) if (P.places.hasOwnProperty(k)) { ids.push(k); if (lv >= P.places[k].lv) n++; }
    var wrap = G.el('div.pl-map', G.el('div.pl-map-head', G.el('b', G.ic3('map', 'ic3-s'), ' Bản đồ Brightford của bạn'),
      G.el('span.small', 'Tự lo được ' + n + '/' + ids.length + ' nơi. Nơi có 🔒 sẽ mở dần khi bạn học lên.')));
    P.areas.forEach(function (ar) {
      var row = G.el('div.pl-map-row');
      ids.forEach(function (id) {
        var pl = P.places[id]; if (pl.area !== ar.id) return;
        var ok = lv >= pl.lv, th = G.el('div.pl-map-pic'); th.style.backgroundImage = 'url("' + G.assetUrl(pl.bg) + '")';
        if (pl.prop) th.appendChild(G.imgEl(pl.prop, 'pl-map-prop'));
        row.appendChild(G.el('div.pl-map-card' + (ok ? '.ok' : '.off'), th,
          G.el('div.pl-map-name', G.el('b', G.ic3(ok ? 'check' : 'lock', 'ic3-s'), ' ' + pl.name), G.el('span.small', ok ? 'Tự lo được' : 'Cần ' + P.levels[pl.lv]))));
      });
      wrap.appendChild(G.el('div.pl-map-area', G.el('div.pl-map-an', ar.name), row));
    });
    return wrap;
  }
  function plan(lv) {
    if (lv <= 1) return [
      'Hiện nghĩa tiếng Việt dưới mọi câu, kể cả các câu trả lời để chọn.',
      'Nên học phòng A1-1 ở Trường Anh ngữ trước, rồi mới nói chuyện ngoài phố.',
      'Bấm 🐢 để nghe chậm, nghe lại bao nhiêu lần cũng được.'
    ];
    if (lv === 2) return [
      'Học lần lượt các phòng A1-1 → A1-4 rồi thi cuối cấp A1.',
      'Mỗi sáng nói chuyện với mẹ, hàng xóm, tiệm bánh; nghĩa đáp án ẩn đi để bạn tự hiểu (bật lại được).',
      'Đọc truyện ở kệ dễ, nghe chậm khi cần.'
    ];
    return [
      'Mở khoá cả 4 phòng A1: vào thẳng phần Kiểm tra từng phòng để lấy sao.',
      'Ưu tiên Phố mua sắm và “Tự nói” để luyện phản xạ thật.',
      lv >= 4 ? 'Đọc kệ Tin tức, Tiểu luận B2 và truyện dài.' : 'Đọc kệ Tin tức và truyện bí ẩn, làm Kiểm tra tuần mỗi tuần.'
    ];
  }
})();
