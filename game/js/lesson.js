/* Học trong một phòng: 1 Học (thẻ từ) → 2 Luyện (4 trò, có nói qua micro) → 3 Kiểm tra (10 câu, đạt từ 8/10).
   Điểm: luyện đúng +2 XP, kiểm tra đúng +5 XP. Sao: 8/10 = 1, 9/10 = 2, 10/10 = 3. */
var G = window.G || (window.G = {});

(function () {
  var panel, body, R = null, lang = 'en';

  G.lessonInit = function () {
    panel = document.getElementById('panel');
    body = document.getElementById('panel-body');
    document.getElementById('panel-close').onclick = closePanel;
    document.getElementById('panel-py').onclick = function () { G.S.caiDat.hienPinyin = !G.S.caiDat.hienPinyin; G.save(); setPy(); };
  };
  /* ẩn / hiện pinyin (lưu trong cài đặt) */
  function setPy() {
    var on = G.S.caiDat.hienPinyin !== false;
    panel.className = panel.className.replace(/ ?nopy/g, '') + (on ? '' : ' nopy');
    document.getElementById('panel-py').textContent = on ? 'Pinyin: hiện' : 'Pinyin: ẩn';
  }

  function closePanel() { panel.className = 'panel'; if (window.speechSynthesis) speechSynthesis.cancel(); }
  G.closeLesson = closePanel;

  function teacher() { return G.NPCS[R.teacher]; }
  /* chữ của ngôn ngữ đang học (tiếng Anh hoặc chữ Hán) và pinyin */
  function T(it) { return it.en || it.zh; }
  function pyEl(t) { return lang === 'zh' && t ? G.el('div.py', t) : null; }
  function label(v) {   // nhãn đáp án: chữ Hán kèm pinyin
    if (lang !== 'zh') return v;
    for (var i = 0; i < R.items.length; i++) if (R.items[i].zh === v) return G.el('span.zhopt', G.el('span', v), G.el('span.py', R.items[i].py));
    return v;
  }
  function say(t) { G.say(t, lang); }
  function speakBtn(t) { return G.sayBtns(t, lang); }

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
    if (G.ROOMS[roomId] && G.ROOMS[roomId].group) { openGroup(G.ROOMS[roomId]); return; }
    R = G.ROOMS[roomId];
    lang = R.lang;
    panel.className = 'panel open';
    document.getElementById('panel-title').textContent = R.title;
    G.markStudy();
    G.warmAudio(R.items.map(T).concat(R.items.map(function (x) { return x.ex; })), lang);
    var pb = document.getElementById('panel-py');
    pb.style.display = lang === 'zh' ? '' : 'none';
    setPy();
    showHome();
  };

  /* phòng nhiều buổi (Tầng 1 · Nền tảng): danh sách buổi, buổi đang học tô xanh, buổi chưa mở có khoá */
  function openGroup(g) {
    R = g; lang = 'en';
    panel.className = 'panel open';
    document.getElementById('panel-title').textContent = g.title;
    document.getElementById('panel-py').style.display = 'none';
    body.innerHTML = '';
    var cur = G.curSession(g.id);
    body.appendChild(teacherLine(g.intro[1], null));
    body.appendChild(G.el('div.tline.small', G.el('div.tbubble.en', G.el('div', g.intro[0]), speakBtn(g.intro[0]))));
    body.appendChild(G.el('div.ses-list', g.group.map(function (sid, k) {
      var r = G.ROOMS[sid], p = G.S.phong[sid], done = G.roomPassed(sid), open = G.sessionOpen(g.id, k), d = G.S.dangHoc && G.S.dangHoc[sid];
      var sub = done ? stars(p.sao) + ' · ' + p.diem + '/' + (r.testN || 10) + ' · học lại'
        : !open ? 'Qua buổi ' + (r.n - 1) + ' để mở'
        : d && (d.the || d.hocXong || d.luyenXong) ? 'Đang học dở · học tiếp'
        : r.sound !== undefined ? 'Âm: ' + G.FOUND_SOUNDS[r.sound].title + ' · 20 từ mới' : 'Ngữ pháp: ' + r.gram.t + ' · ' + r.items.length + ' câu';
      return G.el('button.big' + (sid === cur && !done ? '.cur' : '') + (open ? '' : '.off'), { onclick: function () {
        if (!open) { G.sfx('wrong'); G.toast('Qua buổi ' + (r.n - 1) + ' (kiểm tra từ 8/10) để mở buổi ' + r.n + '.'); return; }
        G.openLesson(sid);
      } }, G.el('b', (done ? '✓ ' : open ? '' : '🔒 ') + r.title), G.el('span', sub));
    })));
  }

  /* màn đầu: lời giáo viên + 3 bước */
  function showHome() {
    var p = G.S.phong[R.id], d = st(), snd = R.sound !== undefined;
    body.innerHTML = '';
    if (R.parent) body.appendChild(G.el('button.btn.back-ses', { onclick: function () { G.openLesson(R.parent); } }, '‹ Các buổi của phòng ' + G.ROOMS[R.parent].label));
    body.appendChild(teacherLine(R.intro[1], null));
    body.appendChild(G.el('div.tline.small', G.el('div.tbubble.en', G.el('div', R.intro[0]), pyEl(R.introPy), speakBtn(R.intro[0]))));
    say(R.intro[0]);
    body.appendChild(G.el('div.menu3',
      G.el('button.big' + (d.hocXong ? '.done' : ''), { onclick: function () { learn(d.the > 0 && !d.hocXong ? Math.min(d.the, R.items.length - 1) : snd ? -2 : R.gram ? -1 : 0); } },
        G.el('b', (d.hocXong ? '✓ ' : '') + (R.final ? '1 · Ôn tập' : '1 · Học')),
        G.el('span', d.hocXong ? 'Đã học xong ' + R.items.length + ' thẻ · xem lại' : d.the > 0 ? 'Học tiếp từ thẻ ' + (d.the + 1) + '/' + R.items.length
          : snd ? 'Âm “' + G.FOUND_SOUNDS[R.sound].title + '”, ngữ pháp “' + R.gram.t + '” và ' + R.items.length + ' từ mới'
          : R.gram ? 'Ngữ pháp “' + R.gram.t + '” và ' + R.items.length + ' câu dùng thật'
          : R.items.length + ' từ và câu' + (R.final ? ' của cả cấp ' + R.final.level : ', nghe và xem nghĩa'))),
      G.el('button.big' + (d.luyenXong ? '.done' : ''), { onclick: practice },
        G.el('b', (d.luyenXong ? '✓ ' : '') + '2 · Luyện'),
        G.el('span', d.luyenXong ? 'Đã luyện xong · luyện lại' : d.tro > 0 ? 'Làm tiếp trò ' + (d.tro + 1) + '/4' : '4 trò ngắn: nghe, chọn câu, nói qua micro, xếp câu')),
      G.el('button.big.seal', { onclick: test }, G.el('b', '3 · Kiểm tra'), G.el('span', p ? 'Lần trước: ' + p.diem + '/' + TN() + ' ' + stars(p.sao) : TN() + ' câu, đạt từ ' + PN() + ' câu là ' + (R.final ? 'tốt nghiệp' : R.parent ? 'qua buổi' : 'qua phòng')))
    ));
  }
  /* tiến độ đang học dở của phòng (lưu ngay, mở lại học tiếp, cập nhật app không mất) */
  function st() { G.S.dangHoc = G.S.dangHoc || {}; return G.S.dangHoc[R.id] || (G.S.dangHoc[R.id] = { the: 0, hocXong: '', tro: 0, luyenXong: '' }); }
  function keep(k, v) { var d = st(); d[k] = v; d.luc = G.vnNow(); G.save(); }
  function TN() { return R.testN || 10; }   // số câu kiểm tra
  function PN() { return R.passN || 8; }    // số câu cần đúng để qua
  function stars(n) { return n === 3 ? '★★★' : n === 2 ? '★★☆' : n === 1 ? '★☆☆' : ''; }

  /* ---------- 1. Học: thẻ từ ---------- */
  function learn(i) {
    if (i === -2) { soundPage(); return; }
    if (i === -1) { gramPage(); return; }
    var it = R.items[i];
    if (G.srsAdd && lang === 'en') G.srsAdd({ t: 'item', en: it.en, vi: it.vi });
    if (i > st().the) keep('the', i);
    if (i === R.items.length - 1 && !st().hocXong) keep('hocXong', G.vnNow());
    body.innerHTML = ''; body.scrollTop = 0;
    body.appendChild(head(0, 'Thẻ ' + (i + 1) + '/' + R.items.length + ' · bấm 🔊 để nghe, nói to theo'));
    var card = G.el('div.wcard',
      G.el('div.wbig', T(it), speakBtn(T(it))),
      pyEl(it.py),
      it.ipa ? G.el('div.wipa', it.ipa) : null,
      G.el('div.wvi', it.vi),
      G.el('div.wex', G.el('div', it.ex, speakBtn(it.ex)), pyEl(it.exPy), G.el('div.faint', it.exVi))
    );
    body.appendChild(card);
    say(T(it));
    body.appendChild(G.el('div.row',
      i > 0 || R.gram ? G.el('button.btn', { onclick: function () { learn(i - 1); } }, i > 0 ? '‹ Trước' : '‹ Ngữ pháp') : G.el('span'),
      i < R.items.length - 1
        ? G.el('button.btn.seal', { onclick: function () { learn(i + 1); } }, 'Tiếp ›')
        : G.el('button.btn.seal', { onclick: practice }, 'Sang phần Luyện ›')
    ));
  }

  /* buổi Nền tảng: âm khó của hôm nay (nghe từng cặp từ rồi đọc to) */
  function soundPage() {
    var s = G.FOUND_SOUNDS[R.sound];
    function sb(w) { return G.el('button.btn', { onclick: function () { say(w); } }, '🔊 ' + w); }
    var pairs = [];
    s.pairs.forEach(function (p) { pairs.push(sb(p[0])); pairs.push(sb(p[1])); });
    body.innerHTML = ''; body.scrollTop = 0;
    body.appendChild(head(0, 'Âm hôm nay · nghe từng cặp ba lần rồi tự đọc to'));
    body.appendChild(G.el('div.wcard',
      G.el('div.wbig', s.title),
      G.el('p.gram-b', G.el('b', 'Vì sao quan trọng: '), s.why),
      G.el('p.gram-b', G.el('b', 'Cách làm: '), s.how),
      G.el('div.snd-pairs', pairs)
    ));
    body.appendChild(G.el('div.row', G.el('span'), G.el('button.btn.seal', { onclick: function () { learn(-1); } }, 'Tiếp: ngữ pháp ›')));
  }
  /* buổi Nền tảng: một điểm ngữ pháp, 4 câu mẫu có nghĩa */
  function gramPage() {
    var g = R.gram;
    body.innerHTML = ''; body.scrollTop = 0;
    body.appendChild(head(0, 'Ngữ pháp · đọc cách dùng, bấm 🔊 nghe câu mẫu'));
    body.appendChild(G.el('div.wcard',
      G.el('div.wbig', g.t),
      G.el('p.gram-b', g.b),
      G.el('div.gram-ex', g.ex.map(function (e) { return G.el('div', G.el('div', e[0], speakBtn(e[0])), G.el('div.faint', e[1])); }))
    ));
    say(g.ex[0][0]);
    body.appendChild(G.el('div.row',
      R.sound !== undefined ? G.el('button.btn', { onclick: function () { learn(-2); } }, '‹ Âm hôm nay') : G.el('span'),
      G.el('button.btn.seal', { onclick: function () { learn(0); } }, 'Tiếp: ' + R.items.length + (R.sound !== undefined ? ' từ mới ›' : ' câu dùng thật ›'))));
  }

  /* ---------- câu hỏi trắc nghiệm dùng chung ---------- */
  function mcq(q, onDone) {
    body.appendChild(q.headEl);
    var box = G.el('div.qbox');
    box.appendChild(G.el('div.qtext', q.prompt, q.audio ? speakBtn(q.audio) : null, q.sub ? pyEl(q.sub) : null));
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
        if (!ok) { var kids = opts.children; for (var k = 0; k < kids.length; k++) if (kids[k].getAttribute('data-v') === q.answer) kids[k].className = 'opt ok'; }
        G.sfx(ok ? 'right' : 'wrong');
        setTimeout(function () { onDone(ok); }, ok ? 650 : 1300);
      }, 'data-v': o }, label(o));
      opts.appendChild(b);
    });
    box.appendChild(opts);
    body.appendChild(box);
  }

  function qListen(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: 'Nghe và chọn nghĩa đúng', audio: T(it), answer: it.vi, options: G.shuffle([it.vi].concat(G.pick(R.items, 3, it).map(function (x) { return x.vi; }))), item: it };
  }
  function qMeaning(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: '“' + it.vi + '” nói thế nào?', answer: T(it), options: G.shuffle([T(it)].concat(G.pick(R.items, 3, it).map(T))), item: it };
  }
  function qWord(it, headEl, exam) {
    return { headEl: headEl, exam: exam, prompt: T(it), sub: it.py, audio: T(it), autoplay: false, answer: it.vi, options: G.shuffle([it.vi].concat(G.pick(R.items, 3, it).map(function (x) { return x.vi; }))), item: it };
  }

  /* ---------- 2. Luyện: 4 trò ---------- */
  function practice() {
    var games = [
      { name: 'Nghe chọn nghĩa', make: qListen },
      { name: 'Nhìn nghĩa chọn câu', make: qMeaning }
    ];
    var gi = st().luyenXong ? 0 : st().tro || 0;
    if (gi === 2) { speakGame(); return; }
    if (gi >= 3) { order(0); return; }
    function runGame() {
      if (gi >= games.length) { speakGame(); return; }
      var gm = games[gi];
      keep('tro', gi);
      var list = G.shuffle(R.items).slice(0, 6);
      var k = 0;
      (function next() {
        if (k >= list.length) { gi++; runGame(); return; }
        body.innerHTML = '';
        var hd = head(1, 'Trò ' + (gi + 1) + '/4 · ' + gm.name + ' · câu ' + (k + 1) + '/' + list.length);
        mcq(gm.make(list[k], hd, false), function () { G.addXp(2); k++; next(); });
      })();
    }
    runGame();
  }

  /* trò 3: nói theo câu ví dụ (micro chấm 0–100, không có micro thì nghe rồi nhắc lại) */
  function speakGame() {
    keep('tro', 2);
    var list = G.shuffle(R.items).slice(0, 4), k = 0, sum = 0, n = 0;
    (function next() {
      if (k >= list.length) { order(0); return; }
      body.innerHTML = '';
      body.appendChild(head(1, 'Trò 3/4 · Nói theo · câu ' + (k + 1) + '/' + list.length + (n ? ' · điểm TB ' + Math.round(sum / n) : '')));
      body.appendChild(G.speakCard({ text: list[k].ex, vi: list[k].exVi, lang: lang, onDone: function (sc) {
        if (sc !== null) { sum += sc; n++; G.logSpeak(sc); }
        k++; next();
      } }));
    })();
  }

  /* trò 4: sắp xếp câu ví dụ */
  function order(k) {
    keep('tro', 3);
    function toks(x) { return (x.w || x.ex).split(' '); }   // tiếng Trung: tách theo từ đã đánh dấu
    var list = R.items.filter(function (x) { return toks(x).length >= 3; });
    list = G.shuffle(list).slice(0, 4);
    (function step(n) {
      if (n >= list.length) { practiceDone(); return; }
      var it = list[n];
      var words = toks(it);
      var picked = [];
      body.innerHTML = '';
      body.appendChild(head(1, 'Trò 4/4 · Sắp xếp câu · câu ' + (n + 1) + '/' + list.length));
      var line = G.el('div.oline');
      var pool = G.el('div.opool');
      body.appendChild(G.el('div.qbox', G.el('div.qtext', '“' + it.exVi + '”', speakBtn(it.ex)), pyEl(it.exPy), line, pool));
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
        if (s === words.join(' ')) { G.sfx('right'); G.addXp(2); say(it.ex); line.className = 'oline ok'; setTimeout(function () { step(n + 1); }, 1100); }
        else { G.sfx('wrong'); line.className = 'oline no'; setTimeout(function () { picked = []; line.className = 'oline'; draw(); }, 900); }
      }
      draw();
    })(0);
  }

  function practiceDone() {
    var dd = st(); dd.luyenXong = G.vnNow(); dd.tro = 0; G.save();
    body.innerHTML = '';
    body.appendChild(head(1, 'Xong phần Luyện'));
    if (lang === 'en') G.markTask('bai');
    body.appendChild(teacherLine('Luyện tốt lắm! Giờ làm bài kiểm tra ' + TN() + ' câu nhé. Đạt từ ' + PN() + ' câu là ' + (R.final ? 'tốt nghiệp ' + R.final.level + '.' : R.parent ? 'qua buổi này.' : 'cửa phòng tiếp theo sẽ mở.'), 'Well done!'));
    body.appendChild(G.el('div.row', G.el('button.btn', { onclick: function () { learn(0); } }, 'Xem lại thẻ'), G.el('button.btn.seal', { onclick: test }, 'Làm kiểm tra ›')));
    G.sfx('done');
  }

  /* ---------- 3. Kiểm tra ---------- */
  function test() {
    var pool = G.shuffle(R.items).slice(0, TN());
    var makers = [qListen, qMeaning, qWord];
    var right = 0, k = 0, wrong = [];
    (function next() {
      if (k >= pool.length) { finish(right, wrong); return; }
      body.innerHTML = '';
      var hd = head(2, 'Câu ' + (k + 1) + '/' + pool.length + ' · đúng ' + right);
      var q = makers[k % 3](pool[k], hd, true);
      mcq(q, function (ok) {
        if (ok) { right++; G.addXp(5); } else { wrong.push(q.item); G.addHard(lang, T(q.item)); }
        k++; next();
      });
    })();
  }

  function finish(right, wrong) {
    var N = TN(), pass = right >= PN();
    if (lang === 'en') G.markTask('bai');
    var sao = right >= N ? 3 : right >= Math.ceil(N * 0.9) ? 2 : pass ? 1 : 0;
    var p = G.S.phong[R.id] || { sao: 0, diem: 0, lan: 0 };
    var firstPass = pass && !(p.diem >= PN());
    p.lan += 1;
    if (right >= p.diem) { p.diem = right; p.sao = Math.max(p.sao, sao); p.luc = G.vnNow(); }
    G.S.phong[R.id] = p;
    if (right >= N) G.S.tuyetDoi = G.S.tuyetDoi || G.vnNow();
    G.save();
    if (G.achSoon) G.achSoon();
    body.innerHTML = '';
    body.appendChild(head(2, 'Kết quả'));
    body.appendChild(G.el('div.result' + (pass ? '.pass' : ''),
      G.el('div.rscore', right + '/' + N),
      G.playerPic(112, 'rface', pass ? 'happy' : 'think'),
      G.el('div.rstars', pass ? stars(sao) : '☆☆☆'),
      G.el('div', pass ? (R.final ? 'Đạt! Bạn đã tốt nghiệp ' + R.final.level + '.' : R.parent ? (firstPass ? 'Qua buổi ' + R.n + '! Buổi tiếp theo đã mở.' : 'Qua buổi ' + R.n + '! Kết quả tốt nhất đã được lưu.') : firstPass ? 'Qua phòng! Cửa phòng tiếp theo đã mở.' : 'Qua phòng! Kết quả tốt nhất đã được lưu.') : 'Chưa đạt ' + PN() + '/' + N + '. Xem lại thẻ và luyện thêm rồi thử lại nhé.')
    ));
    if (wrong.length) {
      body.appendChild(G.el('div.wrongs', G.el('b', 'Câu cần ôn lại:'), wrong.map(function (it) { return G.el('div', G.el('span', T(it)), it.py ? G.el('span.py.inl', ' ' + it.py) : null, ' · ', G.el('span.faint', it.vi), speakBtn(T(it))); })));
    }
    body.appendChild(teacherLine(pass ? R.outro : 'Don’t worry. Practice makes perfect!', pass ? R.outro : 'Don’t worry. Practice makes perfect!'));
    body.appendChild(G.el('div.row',
      G.el('button.btn', { onclick: test }, 'Làm lại'),
      G.el('button.btn.seal', { onclick: function () {
        var par = R.parent;
        if (par && pass) { afterPass(firstPass, sao, right); G.openLesson(par); return; }   // buổi Nền tảng: về danh sách buổi để học buổi sau
        closePanel(); if (pass) afterPass(firstPass, sao, right);
      } }, pass ? (R.final ? 'Nhận bằng ›' : R.parent ? 'Các buổi tiếp theo ›' : 'Xong ›') : 'Đóng')
    ));
    G.sfx(pass ? 'done' : 'wrong');
    if (pass) G.confetti();
    G.updateHud();
  }

  /* sau khi qua phòng: báo cửa mới mở, hoặc lễ tốt nghiệp nếu là phòng thi cuối cấp */
  function afterPass(firstPass, sao, right) {
    if (R.final) {
      var done = G.S.totNghiep[R.final.lang] && G.S.totNghiep[R.final.lang][R.final.level];
      if (!done) { G.graduate(R.final.lang, R.final.level, right, TN(), R.final.levelEn); return; }
      G.kaiSay('Bạn đã có bằng ' + R.final.level + ' rồi. Giỏi lắm!');
      return;
    }
    var rid = R.id;
    if (R.parent) {   // buổi trong phòng nhóm: mở buổi sau; qua hết buổi thì báo cửa phòng sau
      var gp = G.ROOMS[R.parent];
      if (!G.roomPassed(gp.id)) {
        if (firstPass) { G.sfx('door'); G.kaiSay('Tuyệt! Buổi ' + R.n + ' đạt ' + stars(sao) + '. Buổi ' + (R.n + 1) + ' đã mở, học tiếp nhé!'); G.toast('🔓 Đã mở Buổi ' + (R.n + 1)); }
        else G.kaiSay('Giỏi lắm! Kết quả tốt nhất đã được lưu.');
        return;
      }
      rid = gp.id;
    }
    var doors = G.doorsOf(rid), next = null;
    for (var i = 0; i < doors.length - 1; i++) if (doors[i].room === rid) next = doors[i + 1];
    if (firstPass && next) { G.sfx('door'); G.kaiSay('Tuyệt! ' + R.title.split(' ·')[0] + ' đạt ' + stars(sao) + '. Cửa ' + next.label + ' vừa mở, ra hành lang để vào nhé!'); G.toast('🔓 Đã mở ' + next.label); }
    else G.kaiSay('Giỏi lắm! Kết quả tốt nhất đã được lưu.');
  }
})();
