/* Trường Lạc trấn: đo và thi tiếng Trung (25/11/2026), cùng chuẩn với phần tiếng Anh.
   1. Bài đầu vào G.openZhPlacement: Từ vựng (nhìn chữ Hán, chọn nghĩa, HSK 1–5, đạt 5/6 mới lên cấp) → Nghe → Đọc
      (câu của đề thi thử HSK 1–4, thích ứng theo cấp từ vựng). Trình độ = trung vị 3 kỹ năng, không vượt cấp từ vựng.
      Kết quả gợi ý phòng bắt đầu (G.S.zhStart): các phòng trước đó mở sẵn, học lại được.
   2. Thi chứng chỉ cuối tầng G.openZhExam (phòng zh-x1…zh-x4): hiểu (nghe, đọc, xếp câu; Tầng 2–3 dùng đề thi thử HSK 2 và 4)
      + nói (đọc to câu của tầng, máy chấm từng chữ và thanh). Đạt 60% phần hiểu và 60 điểm nói → Chứng chỉ (G.graduate).
   3. Kiểm tra tuần G.openZhWeekly: nghe, đọc hiểu, nói từ các bài đã học; lưu G.S.tuan như tiếng Anh (biểu đồ dùng chung).
   Dữ liệu: data/zh_exam.js (tools/build-zh-exam.mjs) tải khi cần. */
var G = window.G || (window.G = {});

(function () {
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
  function loadExam(cb) { if (G.zhLoadDict) G.zhLoadDict(); if (G.ZH_EXAMS) { cb(); return; } G.zhScript('data/zh_exam.js', cb); }   // pinyin từng chữ để chấm nói
  function itemsOf(lv, kinds) {   // câu của các đề thi thử ở cấp lv theo loại
    var out = [];
    for (var id in G.ZH_EXAMS) if (G.ZH_EXAMS.hasOwnProperty(id) && G.ZH_EXAMS[id].level === lv)
      G.ZH_EXAMS[id].sections.forEach(function (s) { s.items.forEach(function (it) { if (kinds.indexOf(it.t) >= 0) out.push(it); }); });
    return G.shuffle(out);
  }

  /* ---------- một câu hỏi trắc nghiệm (cùng kiểu thẻ với bài học) ---------- */
  function mcq(body, o, done) {
    var box = G.el('div.qbox'), answered = false;
    if (o.head) body.appendChild(o.head);
    box.appendChild(G.el('div.qtext', o.prompt, o.audio ? G.sayBtns(o.audio, 'zh') : null));
    if (o.sub) box.appendChild(G.el('div.small.faint', o.sub));
    var opts = G.el('div.opts');
    o.options.forEach(function (t, i) {
      var b = G.el('button.opt' + (/[㐀-鿿]/.test(t) ? '.zhopt' : ''), { 'data-v': t, onclick: function () {
        if (answered) return; answered = true;
        var ok = i === o.answer;
        b.className = 'opt ' + (ok ? 'ok' : 'no');
        if (!ok) opts.children[o.answer].className = 'opt ok';
        G.sfx(ok ? 'right' : 'wrong');
        setTimeout(function () { done(ok); }, ok ? 600 : 1300);
      } }, t);
      opts.appendChild(b);
    });
    box.appendChild(opts);
    body.appendChild(box);
    if (o.audio) setTimeout(function () { G.say(o.audio, 'zh'); }, 250);
  }
  /* câu đề thi → câu hỏi trắc nghiệm */
  function fromExam(it) {
    if (it.t === 'listenWord') return { prompt: 'Nghe và chọn chữ đúng', audio: it.audio, options: it.opts, answer: it.a };
    if (it.t === 'listenMean') return { prompt: 'Nghe và chọn nghĩa đúng', audio: it.audio, options: it.opts, answer: it.a };
    if (it.t === 'listenPick') return { prompt: 'Nghe và chọn câu vừa nghe', audio: it.audio, options: it.opts, answer: it.a };
    if (it.t === 'fill') return { prompt: it.q, sub: 'Chọn từ điền vào chỗ trống', options: it.opts, answer: it.a };
    if (it.t === 'readMean') return { prompt: it.q, sub: 'Câu này nghĩa là gì?', options: it.opts, answer: it.a };
    return null;
  }
  /* xếp câu (phần Viết của đề HSK): chạm cụm từ theo thứ tự, chạm lại để bỏ */
  function orderQ(body, it, done) {
    var order = G.shuffle(it.chunks.map(function (c, i) { return i; })), picked = [];
    var line = G.el('div.oline'), pool = G.el('div.opool');
    body.appendChild(G.el('div.qbox', G.el('div.qtext', 'Sắp xếp thành câu đúng'), G.el('div.small.faint.zx-vi', it.vi || ''), line, pool));
    function draw() {
      line.innerHTML = ''; pool.innerHTML = '';
      picked.forEach(function (ci, k) { line.appendChild(G.el('button.chip.on', { onclick: function () { picked.splice(k, 1); draw(); } }, it.chunks[ci])); });
      order.forEach(function (ci) {
        if (picked.indexOf(ci) >= 0) return;
        pool.appendChild(G.el('button.chip', { onclick: function () { picked.push(ci); draw(); if (picked.length === it.chunks.length) check(); } }, it.chunks[ci]));
      });
    }
    function check() {
      var ok = picked.map(function (ci) { return it.chunks[ci]; }).join('') === it.answer.join('');
      G.sfx(ok ? 'right' : 'wrong');
      line.className = 'oline ' + (ok ? 'ok' : 'no');
      body.appendChild(G.el('div.small' + (ok ? '' : '.faint'), (ok ? 'Đúng: ' : 'Câu đúng: ') + it.cn, G.el('div.py', it.py)));
      setTimeout(function () { done(ok); }, ok ? 700 : 1600);
    }
    draw();
  }
  function head(t, k, n) { return G.el('div.lhead', G.el('div.lsub', t + ' · câu ' + (k + 1) + '/' + n)); }
  /* chạy một dãy câu hỏi, trả số câu đúng */
  function runSet(title, list, onEnd) {
    var k = 0, right = 0;
    (function next() {
      if (k >= list.length) { onEnd(right, list.length); return; }
      var body = panelOpen(title), it = list[k];
      var after = function (ok) { if (ok) right++; k++; next(); };
      if (it.t === 'order') { body.appendChild(head(title, k, list.length)); orderQ(body, it, after); return; }
      var q = it.prompt ? it : fromExam(it);
      if (!q) { k++; next(); return; }
      q.head = head(title, k, list.length);
      mcq(body, q, after);
    })();
  }
  /* mọi mục của các phòng thuộc tầng fl (thi Nền tảng: từ một chữ, bộ thủ cũng tính) */
  function floorItems(fl) {
    var out = [];
    for (var id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'zh' && G.ROOMS[id].items && G.zhFloorOf(id) === fl) out = out.concat(G.ROOMS[id].items);
    return out;
  }
  /* câu của các buổi đã học (tầng fl, hoặc mọi buổi đã có tiến độ) */
  function learned(fl) {
    var out = [];
    for (var id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'zh' && G.ROOMS[id].items && (fl ? G.zhFloorOf(id) === fl : (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id]))))
      G.ROOMS[id].items.forEach(function (it) { if (it.ex && it.exVi && it.ex.length > 1) out.push(it); });
    return out;
  }
  function meaningQs(items, n, listen) {   // nghe / đọc câu ví dụ → chọn nghĩa
    var pool = G.shuffle(items).slice(0, n);
    return pool.map(function (it) {
      var others = G.pick(items.filter(function (x) { return x.exVi !== it.exVi; }), 3, null).map(function (x) { return x.exVi; });
      var opts = G.shuffle([it.exVi].concat(others));
      return listen ? { prompt: 'Nghe và chọn nghĩa đúng', audio: it.ex, options: opts, answer: opts.indexOf(it.exVi) }
        : { prompt: it.ex, sub: 'Câu này nghĩa là gì?', options: opts, answer: opts.indexOf(it.exVi) };
    });
  }
  /* phần nói: đọc to n câu, máy chấm từng chữ và thanh (không micro thì tự nhắc lại, không tính điểm) */
  function speakSet(title, items, onEnd) {
    var list = G.shuffle(items).slice(0, 5), k = 0, sum = 0, n = 0;
    (function one() {
      if (k >= list.length) { onEnd(n ? Math.round(sum / n) : null); return; }
      var body = panelOpen(title + ' · ' + (k + 1) + '/' + list.length), it = list[k];
      body.appendChild(G.el('p.small.faint', 'Đọc to câu này. Có micro thì máy chấm từng chữ và thanh điệu.'));
      body.appendChild(G.speakCard({ text: it.ex, py: it.exPy, vi: it.exVi, lang: 'zh', onDone: function (sc) { if (typeof sc === 'number') { sum += sc; n++; } k++; one(); } }));
    })();
  }

  /* ---------- 1. Bài đầu vào ---------- */
  var LV_NAME = ['Mới bắt đầu', 'HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5'];
  G.zhLevelName = function (lv) { return LV_NAME[lv] || 'HSK ' + lv; };
  /* phòng bắt đầu theo trình độ: đã vững HSK n thì học từ bài đầu của HSK n + 1 (bài trước vẫn mở để ôn); chưa vững HSK 1 thì từ Phát âm */
  function startFor(lv) {
    if (lv <= 0) return 'zh-py';
    var want = Math.min(5, lv + 1), floors = [2, 3, 4];
    for (var i = 0; i < floors.length; i++) {
      var idx = G.ZH_INDEX[floors[i]] || [];
      for (var j = 0; j < idx.length; j++) if (idx[j][2] >= want) return idx[j][0];
    }
    return 'zh-l001';
  }
  G.zhStartFor = startFor;
  G.openZhPlacement = function (after) {
    var body = panelOpen('Đo trình độ tiếng Trung');
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    loadExam(function () {
      var b = panelOpen('Đo trình độ tiếng Trung');
      b.appendChild(G.el('div.wcard', G.el('b', 'Khoảng 8–12 phút, 3 phần'),
        G.el('p', '1. Từ vựng: nhìn chữ Hán, chọn nghĩa (từ HSK 1 lên HSK 5, chưa biết thì chọn "Chưa biết").'),
        G.el('p', '2. Nghe: nghe câu, chọn nghĩa hoặc câu đúng.  3. Đọc: điền từ, chọn nghĩa.'),
        G.el('p.small.faint', 'Làm thật để app xếp đúng phòng. Đổi lúc nào cũng được, không mất tiến độ.')));
      b.appendChild(G.el('div.row', after ? G.el('button.btn', { onclick: function () { G.closeLesson(); if (after) after(); } }, 'Để sau') : G.el('span'),
        G.el('button.btn.seal', { onclick: vocabPart }, 'Bắt đầu ›')));
    });
    var res = { tv: 0, nghe: 0, doc: 0 };
    function vocabPart() {
      var lv = 1;
      (function level() {
        if (lv > 5) { res.tv = 5; listenPart(); return; }
        var pool = G.shuffle(G.ZH_VOCAB[lv] || []).slice(0, 6);
        var qs = pool.map(function (w) {
          var others = G.pick((G.ZH_VOCAB[lv] || []).filter(function (x) { return x[2] !== w[2]; }), 3, null).map(function (x) { return x[2]; });
          var opts = G.shuffle([w[2]].concat(others)).concat(['Chưa biết từ này']);
          return { prompt: w[0], sub: 'Từ này nghĩa là gì?', options: opts, answer: opts.indexOf(w[2]) };
        });
        runSet('Từ vựng · ' + LV_NAME[lv], qs, function (right) {
          if (right >= 5) { res.tv = lv; lv++; level(); } else listenPart();
        });
      })();
    }
    function adaptive(kinds, name, done) {
      var L = Math.max(1, Math.min(4, res.tv)), tried = {};
      (function go() {
        tried[L] = 1;
        var qs = itemsOf(L, kinds).slice(0, 4);
        if (!qs.length) { done(Math.max(0, L - 1)); return; }
        runSet(name + ' · ' + LV_NAME[L], qs, function (right) {
          if (right >= 3) { if (L < 4 && L < res.tv && !tried[L + 1]) { L++; go(); } else done(L); }
          else if (L > 1 && !tried[L - 1]) { L--; go(); } else done(L - 1);
        });
      })();
    }
    function listenPart() { adaptive(['listenWord', 'listenMean', 'listenPick'], 'Nghe', function (v) { res.nghe = v; readPart(); }); }
    function readPart() { adaptive(['fill', 'readMean'], 'Đọc', function (v) { res.doc = v; finish(); }); }
    function finish() {
      var v = [res.tv, res.nghe, res.doc].sort(function (a, b) { return a - b; }), lv = Math.min(res.tv, v[1]);
      var start = startFor(lv);
      G.S.dauVao = { lv: lv, tv: res.tv, nghe: res.nghe, doc: res.doc, noi: null, luc: G.vnNow(), ban: 2, zh: 1 };
      G.S.zhStart = start; G.save();
      if (G.track) G.track('dau_vao_zh', { lv: lv });
      var body = panelOpen('Kết quả trình độ tiếng Trung'), sk = [['tv', 'Từ vựng'], ['nghe', 'Nghe'], ['doc', 'Đọc']];
      var R0 = G.ZH_INDEX && G.zhTitleOf ? G.zhTitleOf(start) : start;
      body.appendChild(G.el('div.lv-card',
        G.el('div.lv-top', G.el('div.lv-big', G.el('b', LV_NAME[lv]), G.el('span', 'Trình độ chung')),
          G.el('div.lv-txt', G.el('span.sh-k', 'Bạn bắt đầu từ'), G.el('b', R0), G.el('span', lv ? 'Các phòng trước đó vẫn mở để ôn.' : 'Học pinyin và thanh điệu trước, rồi lên HSK 1.'))),
        G.el('div.pl-skills.lv-sk', sk.map(function (k) {
          var x = res[k[0]];
          return G.el('div.pl-skill', G.el('span.pl-sk-name', k[1]), G.el('span.pl-bar', [1, 2, 3, 4, 5].map(function (j) { return G.el('i' + (x >= j ? '.on' : '')); })), G.el('b.pl-sk-lv', LV_NAME[x]));
        }))));
      body.appendChild(G.el('div.row', G.el('button.btn', { onclick: function () { G.closeLesson(); if (after) after(); else G.goLobby(); } }, 'Về Sảnh'),
        G.el('button.btn.seal', { onclick: function () { G.zhOpen(start); } }, 'Bắt đầu học ›')));
    }
  };

  /* ---------- 2. Thi chứng chỉ cuối tầng ---------- */
  G.ZH_CERTS = {
    'zh-x1': { floor: 1, level: 'Nền tảng', title: 'Thi Nền tảng · pinyin, thanh điệu, bộ thủ' },
    'zh-x2': { floor: 2, level: 'HSK 2', exam: 'hsk2-1', title: 'Thi chứng chỉ HSK 2' },
    'zh-x3': { floor: 3, level: 'HSK 4', exam: 'hsk4-1', title: 'Thi chứng chỉ HSK 4' },
    'zh-x4': { floor: 4, level: 'HSK 5', title: 'Thi chứng chỉ HSK 5' }
  };
  G.openZhExam = function (id) {
    var C = G.ZH_CERTS[id]; if (!C) return;
    var body = panelOpen(C.title);
    body.appendChild(G.el('div.small.faint', 'Đang tải đề…'));
    loadExam(function () { G.zhLoad(C.floor, function () {
      var items = learned(C.floor), qs;
      if (C.exam && G.ZH_EXAMS[C.exam]) {
        qs = [];
        G.ZH_EXAMS[C.exam].sections.forEach(function (s) { s.items.forEach(function (it) { qs.push(it); }); });
      } else if (C.floor === 1) {
        // nghe chọn pinyin (thanh điệu) từ các phòng phát âm + nghĩa của bộ thủ
        var f1 = floorItems(1);
        var pr = f1.filter(function (it) { return !/^bộ /.test(it.vi) && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(it.py) && G.zhPyOptions(it).length >= 3; });
        qs = G.shuffle(pr).slice(0, 12).map(function (it) { var o = G.zhPyOptions(it); return { prompt: 'Nghe và chọn pinyin đúng', audio: it.zh, options: o, answer: o.indexOf(it.py) }; });
        var rd = f1.filter(function (it) { return it.hv && /^bộ /.test(it.vi); });
        qs = qs.concat(G.shuffle(rd).slice(0, 8).map(function (it) { var others = G.pick(rd.filter(function (x) { return x.vi !== it.vi; }), 3, null).map(function (x) { return x.vi; }); var o = G.shuffle([it.vi].concat(others)); return { prompt: it.zh, sub: 'Bộ thủ này là gì?', options: o, answer: o.indexOf(it.vi) }; }));
      } else {
        qs = meaningQs(items, 10, true).concat(meaningQs(items, 10, false));
      }
      var b = panelOpen(C.title);
      b.appendChild(G.el('div.wcard', G.el('b', '2 phần: hiểu (' + qs.length + ' câu) và nói (' + (C.floor > 1 ? 'tự nói 4 tình huống' : 'đọc to 5 câu') + ')'),
        G.el('p', 'Đạt khi đúng từ 60% phần hiểu và nói từ 60 điểm. Đạt thì nhận Chứng chỉ ConnectLife tiếng Trung · ' + C.level + '.'),
        G.el('p.small.faint', C.floor > 1 ? 'Không có micro thì gõ câu trả lời bằng chữ Hán hoặc pinyin.' : 'Không có micro thì phần nói tự nhắc lại, chứng chỉ ghi "chưa chấm nói".')));
      b.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.closeLesson }, 'Để sau'), G.el('button.btn.seal', { onclick: function () {
        runSet(C.title, qs, function (right, total) {
          var b2 = panelOpen(C.title + ' · phần nói');
          b2.appendChild(G.el('div.result' + (right / total >= 0.6 ? '.pass' : ''), G.el('b', 'Phần hiểu: ' + right + '/' + total), G.el('div', right / total >= 0.6 ? 'Đạt phần hiểu. Sang phần nói nhé.' : 'Chưa đạt 60% phần hiểu. Vẫn làm thử phần nói để biết mình ở đâu.')));
          var free = C.floor > 1 && G.FREE_ZH && G.openFree;   // Tầng 2–4: tự nói theo tình huống, không câu gợi ý (như chứng chỉ tiếng Anh)
          b2.appendChild(G.el('p.small.faint', free ? 'Phần nói: 4 tình huống ngoài đời, tự nói bằng câu của bạn (bấm micro, hoặc gõ chữ Hán / pinyin). Máy chấm theo ý chính.' : 'Phần nói: đọc to 5 câu, máy chấm từng chữ và thanh điệu.'));
          b2.appendChild(G.el('div.row', G.el('span'), G.el('button.btn.seal', { onclick: function () {
            if (free) G.openFree(G.shuffle(G.FREE_ZH).slice(0, 4), C.title + ' · nói', null, function (avg) { result(id, C, right, total, avg); });
            else speakSet(C.title + ' · nói', items.length ? items : learned(0), function (noi) { result(id, C, right, total, noi); });
          } }, 'Sang phần nói ›')));
        });
      } }, 'Vào thi ›')));
    }); });
  };
  function result(id, C, right, total, noi) {
    var ratio = right / total, passU = ratio >= 0.6, passN = noi === null || noi >= 60, pass = passU && passN;
    var p = G.S.phong[id], diem = Math.round(ratio * 10), sao = ratio >= 0.9 ? 3 : ratio >= 0.75 ? 2 : 1;
    // điểm phòng thi lưu theo thang qua phòng của app (từ 8 là qua, G.roomPassed); điểm thật ở chứng chỉ (G.S.totNghiep.zh)
    if (pass && (!p || Math.max(8, diem) > p.diem)) G.S.phong[id] = { sao: sao, diem: Math.max(8, diem), luc: G.vnNow(), lan: ((p && p.lan) || 0) + 1 };
    G.save();
    if (pass) { G.closeLesson(); G.graduate('zh', C.level, right, total, C.level, noi === null ? undefined : noi); return; }
    var b = panelOpen(C.title + ' · kết quả');
    b.appendChild(G.el('div.result', G.el('b', 'Chưa đạt · hiểu ' + right + '/' + total + (noi !== null ? ' · nói ' + noi + '/100' : '')),
      G.el('div', !passU ? 'Phần hiểu cần từ 60%. Ôn các phòng của tầng rồi thi lại.' : 'Phần nói cần từ 60 điểm. Luyện nói theo câu mẫu rồi thi lại.')));
    b.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.closeLesson }, 'Về Sảnh'), G.el('button.btn.seal', { onclick: function () { G.openZhExam(id); } }, 'Thi lại ›')));
  }

  /* ---------- 3. Kiểm tra tuần (nút Kiểm tra tuần ở Sảnh, bảng Hôm nay: đang học tiếng Trung thì vào bài tiếng Trung) ---------- */
  var baseWeekly = G.openWeekly;
  G.openWeekly = function () { if (G.lang && G.lang() === 'zh') { G.openZhWeekly(); return; } return baseWeekly.apply(this, arguments); };
  G.openZhWeekly = function () {
    if (G.zhLoadDict) G.zhLoadDict();
    var items = learned(0).filter(function (it) { return it.ex !== it.zh; });   // câu ví dụ thật (phòng phát âm chỉ có từ)
    if (items.length < 8) items = learned(0);
    if (items.length < 8) { G.toast('Học thêm vài phòng ở Học viện Hán ngữ rồi làm kiểm tra tuần nhé.'); return; }
    var sc = { nghe: 0, doc: 0, noi: 0 };
    runSet('Kiểm tra tuần · Nghe', meaningQs(items, 5, true), function (r1, t1) {
      sc.nghe = Math.round(r1 / t1 * 100);
      runSet('Kiểm tra tuần · Đọc hiểu', meaningQs(items, 5, false), function (r2, t2) {
        sc.doc = Math.round(r2 / t2 * 100);
        speakSet('Kiểm tra tuần · Nói', items, function (noi) {
          sc.noi = noi === null ? 0 : noi;
          var tong = Math.round((sc.nghe + sc.doc + (noi === null ? (sc.nghe + sc.doc) / 2 : sc.noi)) / 3);
          G.S.tuan = G.S.tuan || [];
          G.S.tuan.push({ ngay: G.vnDay(), luc: G.vnNow(), nghe: sc.nghe, doc: sc.doc, noi: noi === null ? null : sc.noi, tong: tong });
          G.markStudy(); G.addXp(15); G.save();
          if (tong >= 90 && G.confetti) G.confetti();
          var b = panelOpen('Kiểm tra tuần · kết quả');
          b.appendChild(G.el('div.result.pass', G.el('b', 'Tổng ' + tong + '/100'), G.el('div', 'Nghe ' + sc.nghe + ' · Đọc ' + sc.doc + ' · Nói ' + (noi === null ? 'chưa chấm (không micro)' : sc.noi) + ' · +15 XP')));
          if (G.weeklyChart) b.appendChild(G.weeklyChart());
          b.appendChild(G.el('div.row', G.el('span'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
        });
      });
    });
  };
})();
