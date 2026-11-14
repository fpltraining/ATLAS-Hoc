/* Học trong một phòng: 1 Học (thẻ từ) → 2 Luyện (3 trò, không chấm) → 3 Kiểm tra (10 câu, đạt từ 8/10).
   Điểm: luyện đúng +2 XP, kiểm tra đúng +5 XP. Sao: 8/10 = 1, 9/10 = 2, 10/10 = 3. */
var G = window.G || (window.G = {});

(function () {
  var panel, body, R = null, lang = 'en';

  G.lessonInit = function () {
    panel = document.getElementById('panel');
    body = document.getElementById('panel-body');
    document.getElementById('panel-close').onclick = closePanel;
  };

  function closePanel() { panel.className = 'panel'; if (window.speechSynthesis) speechSynthesis.cancel(); }
  G.closeLesson = closePanel;

  function teacher() { return G.NPCS[R.teacher]; }
  function say(t) { G.say(t, lang); }
  function speakBtn(t) { return G.el('button.speak', { 'aria-label': 'Nghe', onclick: function (e) { e.stopPropagation(); say(t); } }, '🔊'); }

  function head(step, sub) {
    var steps = ['Học', 'Luyện', 'Kiểm tra'];
    return G.el('div.lhead',
      G.el('div.lsteps', steps.map(function (s, i) { return G.el('span' + (i === step ? '.on' : i < step ? '.done' : ''), (i + 1) + ' · ' + s); })),
      G.el('div.lsub', sub || '')
    );
  }
  function teacherLine(text, en) {
    var n = teacher();
    var pic = G.el('div.tpic');
    pic.appendChild(G.imgEl(n.img.replace('.png', '_talk.png'), 'tpic-img', n.img));
    return G.el('div.tline', pic, G.el('div.tbubble', G.el('b', n.name), G.el('div', text), en ? speakBtn(en) : null));
  }

  G.openLesson = function (roomId) {
    R = G.ROOMS[roomId];
    lang = R.lang;
    panel.className = 'panel open';
    document.getElementById('panel-title').textContent = R.title;
    G.markStudy();
    G.warmAudio(R.items.map(function (x) { return x.en; }).concat(R.items.map(function (x) { return x.ex; })), lang);
    showHome();
  };

  /* màn đầu: lời giáo viên + 3 bước */
  function showHome() {
    var p = G.S.phong[R.id];
    body.innerHTML = '';
    body.appendChild(teacherLine(R.intro[1], null));
    body.appendChild(G.el('div.tline.small', G.el('div.tbubble.en', G.el('div', R.intro[0]), speakBtn(R.intro[0]))));
    say(R.intro[0]);
    body.appendChild(G.el('div.menu3',
      G.el('button.big', { onclick: function () { learn(0); } }, G.el('b', '1 · Học'), G.el('span', R.items.length + ' từ và câu, nghe và xem nghĩa')),
      G.el('button.big', { onclick: practice }, G.el('b', '2 · Luyện'), G.el('span', '3 trò ngắn, sai thì làm lại')),
      G.el('button.big.seal', { onclick: test }, G.el('b', '3 · Kiểm tra'), G.el('span', p ? 'Lần trước: ' + p.diem + '/10 ' + stars(p.sao) : '10 câu, đạt từ 8 câu là qua phòng'))
    ));
  }
  function stars(n) { return n === 3 ? '★★★' : n === 2 ? '★★☆' : n === 1 ? '★☆☆' : ''; }

  /* ---------- 1. Học: thẻ từ ---------- */
  function learn(i) {
    var it = R.items[i];
    body.innerHTML = '';
    body.appendChild(head(0, 'Thẻ ' + (i + 1) + '/' + R.items.length + ' · bấm 🔊 để nghe, nói to theo'));
    var card = G.el('div.wcard',
      G.el('div.wbig', it.en, speakBtn(it.en)),
      G.el('div.wvi', it.vi),
      G.el('div.wex', G.el('div', it.ex, speakBtn(it.ex)), G.el('div.faint', it.exVi))
    );
    body.appendChild(card);
    say(it.en);
    body.appendChild(G.el('div.row',
      i > 0 ? G.el('button.btn', { onclick: function () { learn(i - 1); } }, '‹ Trước') : G.el('span'),
      i < R.items.length - 1
        ? G.el('button.btn.seal', { onclick: function () { learn(i + 1); } }, 'Tiếp ›')
        : G.el('button.btn.seal', { onclick: practice }, 'Sang phần Luyện ›')
    ));
  }

  /* ---------- câu hỏi trắc nghiệm dùng chung ---------- */
  function mcq(q, onDone) {
    body.appendChild(q.headEl);
    var box = G.el('div.qbox');
    box.appendChild(G.el('div.qtext', q.prompt, q.audio ? speakBtn(q.audio) : null));
    if (q.audio && q.autoplay !== false) say(q.audio);
    var opts = G.el('div.opts');
    var answered = false;
    q.options.forEach(function (o) {
      var b = G.el('button.opt', { onclick: function () {
        if (answered) return;
        var ok = o === q.answer;
        if (!q.exam) {
          if (ok) { answered = true; b.className = 'opt ok'; G.sfx('right'); setTimeout(function () { onDone(true); }, 650); }
          else { b.className = 'opt no'; G.sfx('wrong'); }
          return;
        }
        answered = true;
        b.className = 'opt ' + (ok ? 'ok' : 'no');
        if (!ok) { var kids = opts.children; for (var k = 0; k < kids.length; k++) if (kids[k].textContent === q.answer) kids[k].className = 'opt ok'; }
        G.sfx(ok ? 'right' : 'wrong');
        setTimeout(function () { onDone(ok); }, ok ? 650 : 1300);
      } }, o);
      opts.appendChild(b);
    });
    box.appendChild(opts);
    body.appendChild(box);
  }

  function qListen(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: 'Nghe và chọn nghĩa đúng', audio: it.en, answer: it.vi, options: G.shuffle([it.vi].concat(G.pick(R.items, 3, it).map(function (x) { return x.vi; }))), item: it };
  }
  function qMeaning(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: '“' + it.vi + '” nói thế nào?', answer: it.en, options: G.shuffle([it.en].concat(G.pick(R.items, 3, it).map(function (x) { return x.en; }))), item: it };
  }
  function qWord(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: it.en, audio: it.en, autoplay: false, answer: it.vi, options: G.shuffle([it.vi].concat(G.pick(R.items, 3, it).map(function (x) { return x.vi; }))), item: it };
  }

  /* ---------- 2. Luyện: 3 trò ---------- */
  function practice() {
    var games = [
      { name: 'Nghe chọn nghĩa', make: qListen },
      { name: 'Nhìn nghĩa chọn câu', make: qMeaning }
    ];
    var gi = 0;
    function runGame() {
      if (gi >= games.length) { order(0); return; }
      var gm = games[gi];
      var list = G.shuffle(R.items).slice(0, 6);
      var k = 0;
      (function next() {
        if (k >= list.length) { gi++; runGame(); return; }
        body.innerHTML = '';
        var hd = head(1, 'Trò ' + (gi + 1) + '/3 · ' + gm.name + ' · câu ' + (k + 1) + '/' + list.length);
        mcq(gm.make(list[k], hd, false), function () { G.addXp(2); k++; next(); });
      })();
    }
    runGame();
  }

  /* trò 3: sắp xếp câu ví dụ */
  function order(k) {
    var list = R.items.filter(function (x) { return x.ex.split(' ').length >= 3; });
    list = G.shuffle(list).slice(0, 4);
    (function step(n) {
      if (n >= list.length) { practiceDone(); return; }
      var it = list[n];
      var words = it.ex.split(' ');
      var picked = [];
      body.innerHTML = '';
      body.appendChild(head(1, 'Trò 3/3 · Sắp xếp câu · câu ' + (n + 1) + '/' + list.length));
      var line = G.el('div.oline');
      var pool = G.el('div.opool');
      body.appendChild(G.el('div.qbox', G.el('div.qtext', '“' + it.exVi + '”', speakBtn(it.ex)), line, pool));
      function draw() {
        line.innerHTML = '';
        picked.forEach(function (w, i) { line.appendChild(G.el('button.chip.on', { onclick: function () { picked.splice(i, 1); draw(); } }, w.t)); });
        pool.innerHTML = '';
        shuffled.forEach(function (w) { if (picked.indexOf(w) < 0) pool.appendChild(G.el('button.chip', { onclick: function () { picked.push(w); draw(); check(); } }, w.t)); });
      }
      var shuffled = G.shuffle(words.map(function (t, i) { return { t: t, i: i }; }));
      function check() {
        if (picked.length < words.length) return;
        var s = picked.map(function (w) { return w.t; }).join(' ');
        if (s === it.ex) { G.sfx('right'); G.addXp(2); say(it.ex); line.className = 'oline ok'; setTimeout(function () { step(n + 1); }, 1100); }
        else { G.sfx('wrong'); line.className = 'oline no'; setTimeout(function () { picked = []; line.className = 'oline'; draw(); }, 900); }
      }
      draw();
    })(0);
  }

  function practiceDone() {
    body.innerHTML = '';
    body.appendChild(head(1, 'Xong phần Luyện'));
    body.appendChild(teacherLine('Luyện tốt lắm! Giờ làm bài kiểm tra 10 câu nhé. Đạt từ 8 câu là cửa phòng tiếp theo sẽ mở.', 'Well done!'));
    body.appendChild(G.el('div.row', G.el('button.btn', { onclick: function () { learn(0); } }, 'Xem lại thẻ'), G.el('button.btn.seal', { onclick: test }, 'Làm kiểm tra ›')));
    G.sfx('done');
  }

  /* ---------- 3. Kiểm tra ---------- */
  function test() {
    var pool = G.shuffle(R.items).slice(0, 10);
    var makers = [qListen, qMeaning, qWord];
    var right = 0, k = 0, wrong = [];
    (function next() {
      if (k >= pool.length) { finish(right, wrong); return; }
      body.innerHTML = '';
      var hd = head(2, 'Câu ' + (k + 1) + '/10 · đúng ' + right);
      var q = makers[k % 3](pool[k], hd, true);
      mcq(q, function (ok) {
        if (ok) { right++; G.addXp(5); } else { wrong.push(q.item); G.addHard(lang, q.item.en); }
        k++; next();
      });
    })();
  }

  function finish(right, wrong) {
    var pass = right >= 8;
    var sao = right >= 10 ? 3 : right >= 9 ? 2 : right >= 8 ? 1 : 0;
    var p = G.S.phong[R.id] || { sao: 0, diem: 0, lan: 0 };
    var firstPass = pass && !(p.diem >= 8);
    p.lan += 1;
    if (right >= p.diem) { p.diem = right; p.sao = Math.max(p.sao, sao); p.luc = G.vnNow(); }
    G.S.phong[R.id] = p;
    G.save();
    body.innerHTML = '';
    body.appendChild(head(2, 'Kết quả'));
    body.appendChild(G.el('div.result' + (pass ? '.pass' : ''),
      G.el('div.rscore', right + '/10'),
      G.imgEl('player_' + (G.S.nhanVat || 'han') + '_' + (pass ? 'happy' : 'think') + '.png', 'rface'),
      G.el('div.rstars', pass ? stars(sao) : '☆☆☆'),
      G.el('div', pass ? (firstPass ? 'Qua phòng! Cửa phòng tiếp theo đã mở.' : 'Qua phòng! Kết quả tốt nhất đã được lưu.') : 'Chưa đạt 8/10. Xem lại thẻ và luyện thêm rồi thử lại nhé.')
    ));
    if (wrong.length) {
      body.appendChild(G.el('div.wrongs', G.el('b', 'Câu cần ôn lại:'), wrong.map(function (it) { return G.el('div', G.el('span', it.en), ' · ', G.el('span.faint', it.vi), speakBtn(it.en)); })));
    }
    body.appendChild(teacherLine(pass ? R.outro : 'Don’t worry. Practice makes perfect!', pass ? R.outro : 'Don’t worry. Practice makes perfect!'));
    body.appendChild(G.el('div.row',
      G.el('button.btn', { onclick: test }, 'Làm lại'),
      G.el('button.btn.seal', { onclick: function () { closePanel(); if (pass) G.kaiSay(firstPass ? 'Tuyệt! Phòng ' + R.title.split(' ·')[0] + ' đạt ' + stars(sao) + '. Phòng tiếp theo sẽ có ở giai đoạn 2.' : 'Giỏi lắm!'); } }, pass ? 'Xong ›' : 'Đóng')
    ));
    G.sfx(pass ? 'done' : 'wrong');
    if (pass) G.confetti();
    G.updateHud();
  }
})();
