/* Đảm bảo đầu ra, theo kiểu đời sống thật (không học thuật):
   1. Ôn lại thông minh (G.openReview): mọi câu đã học — từ phòng học và câu đáp khi nói chuyện ngoài phố —
      quay lại đúng lúc sắp quên (hộp 0 → 6: sau 0, 1, 2, 4, 7, 15, 30 ngày). Nhìn nghĩa / nghe người kia nói → tự nói câu tiếng Anh.
   2. Nói tự do (G.openFree): có người hỏi, bạn tự trả lời bằng câu của mình. Chấm theo ý chính, không bắt đúng từng chữ.
   3. Kiểm tra tuần (G.openWeekly): Nghe không nhìn chữ · Đọc đồ thật (biển báo, tin nhắn, email…) · Nói tự do. Lưu kết quả theo tuần.
   4. Sổ "Mình nói được" (G.openCanDo): những việc bạn đã xử lý được bằng tiếng Anh — đây là đầu ra đo được.
   Giờ theo giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  var GAP = [0, 1, 2, 4, 7, 15, 30];
  function day(n) { return G.vnDay(Date.now() + (n || 0) * 86400000); }
  function panelOpen(title) {
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    document.getElementById('panel-title').textContent = title;
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = ''; body.scrollTop = 0;
    return body;
  }
  function S() { G.S.cau = G.S.cau || {}; return G.S.cau; }

  /* ---------- 1. kho câu đã học + ôn lại ---------- */
  G.srsAdd = function (c) {
    if (!c || !c.en) return;
    var all = S(), k = c.en;
    if (all[k]) return;
    c.box = 0; c.due = day(1); c.lan = 0; c.them = G.vnNow();
    all[k] = c; G.save();
  };
  function seed() {
    if (G.S.cauSeeded) return;
    var id, i;
    for (id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'en' && (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id]))) {
      var R = G.ROOMS[id];
      for (i = 0; i < R.items.length; i++) { G.srsAdd({ t: 'item', en: R.items[i].en, vi: R.items[i].vi }); }
    }
    for (id in G.S.doiSong) if (G.S.doiSong.hasOwnProperty(id) && G.LIFE[id]) {
      var xs = G.S.doiSong[id].xong || {};
      for (var ti in xs) if (xs.hasOwnProperty(ti)) G.srsAddTalk(id, +ti);
    }
    G.S.cauSeeded = G.vnNow(); G.save();
  }
  G.srsAddTalk = function (placeId, ti) {
    var L = G.LIFE[placeId]; if (!L || !L.talks[ti]) return;
    var t = L.talks[ti];
    for (var i = 0; i < t.turns.length; i++) {
      var u = t.turns[i], nm = G.playerName();
      G.srsAdd({ t: 'reply', en: u.ok.replace(/\{name\}/g, nm), npc: u.npc.replace(/\{name\}/g, nm), npcVi: u.vi, who: L.npc, noi: L.title });
    }
  };
  G.srsDue = function () {
    var all = S(), out = [], today = day(0);
    for (var k in all) if (all.hasOwnProperty(k) && all[k].due <= today) out.push(all[k]);
    out.sort(function (a, b) { return a.due < b.due ? -1 : a.due > b.due ? 1 : a.box - b.box; });
    return out;
  };
  G.srsCount = function () { var n = 0; for (var k in S()) n++; return n; };
  function grade(c, ok) {
    c.lan = (c.lan || 0) + 1;
    if (ok) { c.box = Math.min(GAP.length - 1, (c.box || 0) + 1); c.due = day(GAP[c.box]); }
    else { c.box = 0; c.due = day(1); }   // quên: mai gặp lại
    G.save();
  }
  // từ làm sai trong bài kiểm tra phòng học → vào kho câu, đến hạn ngay
  function pullHard() {
    for (var i = G.S.tuKho.length - 1; i >= 0; i--) {
      var w = String(G.S.tuKho[i].id || G.S.tuKho[i]); if (w.indexOf('en:') !== 0) continue;
      w = w.slice(3);
      var it = null;
      for (var id in G.ROOMS) if (G.ROOMS.hasOwnProperty(id) && G.ROOMS[id].lang === 'en') for (var j = 0; j < G.ROOMS[id].items.length; j++) if (G.ROOMS[id].items[j].en === w) it = G.ROOMS[id].items[j];
      if (it) { G.srsAdd({ t: 'item', en: it.en, vi: it.vi }); var c = S()[it.en]; c.box = 0; c.due = day(0); }
      G.S.tuKho.splice(i, 1);
    }
    G.save();
  }

  G.openReview = function () {
    seed(); pullHard();
    var q = G.srsDue().slice(0, 15), extra = false;
    if (!q.length) {
      var body0 = panelOpen('🔁 Ôn câu đã học');
      var total = G.srsCount();
      body0.appendChild(G.el('div.result.pass', G.el('b', total ? 'Hôm nay không có câu nào đến hạn ôn 🎉' : 'Kho câu đang trống'),
        G.el('div', total ? 'Bạn đang giữ ' + total + ' câu trong trí nhớ. Câu nào sắp quên sẽ tự quay lại.' : 'Học một phòng hoặc nói chuyện ngoài phố, câu sẽ tự vào kho để ôn.')));
      if (total) body0.appendChild(G.el('button.btn.seal.big1', { onclick: function () {
        var all = S(), arr = []; for (var k in all) if (all.hasOwnProperty(k)) arr.push(all[k]);
        run(G.shuffle(arr).slice(0, 5), true);
      } }, 'Ôn thêm 5 câu ngẫu nhiên'));
      return;
    }
    run(q, extra);
  };
  function run(q, extra) {
    var k = 0, got = 0;
    (function card() {
      var body = panelOpen('🔁 Ôn câu đã học · ' + (k + 1) + '/' + q.length);
      if (k >= q.length) {
        G.markStudy(); G.markTask('on'); G.addXp(5 + got); G.sfx('done');
        body.appendChild(G.el('div.result.pass', G.el('b', 'Ôn xong ' + q.length + ' câu'), G.el('div', 'Nhớ ' + got + '/' + q.length + ' · +' + (5 + got) + ' XP'),
          G.el('div.small.faint', 'Câu nhớ tốt sẽ quay lại sau vài ngày, câu quên sẽ gặp lại sớm.')));
        body.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.openHome }, '‹ Về góc học'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
        return;
      }
      var c = q[k], done = false;
      var prompt = c.t === 'reply'
        ? G.el('div.rv-q', G.el('div.small.faint', '💬 ' + (c.noi || 'Nói chuyện') + ' · người kia nói:'), G.el('div.wbig.sm', c.npc, G.sayBtns(c.npc, 'en')), G.el('div.faint', c.npcVi), G.el('b', 'Bạn đáp thế nào?'))
        : G.el('div.rv-q', G.el('div.small.faint', 'Nói bằng tiếng Anh:'), G.el('div.wbig.sm', c.vi));
      if (c.t === 'reply') G.say(c.npc, 'en');
      body.appendChild(G.el('div.wcard', prompt));
      var ans = G.el('div.rv-ans', { style: { display: 'none' } }, G.el('div.small.faint', 'Câu tiếng Anh:'), G.el('div.wbig.sm', c.en, G.sayBtns(c.en, 'en')));
      body.appendChild(ans);
      var row = G.el('div.row', { style: { display: 'none' } },
        G.el('button.btn', { onclick: function () { grade(c, false); k++; card(); } }, '😕 Quên rồi'),
        G.el('button.btn.seal', { onclick: function () { grade(c, true); got++; k++; card(); } }, '😊 Nhớ'));
      function reveal() { if (done) return; done = true; ans.style.display = ''; row.style.display = ''; G.say(c.en, 'en'); }
      // nói bằng micro: máy chấm, đạt từ 75 thì tự tính là nhớ
      if (G.micOn()) {
        var res = G.el('div.mk-res');
        var mic = G.el('button.mk-mic', { onclick: function () {
          mic.className = 'mk-mic on';
          G.listen('en', function (err, alts) {
            mic.className = 'mk-mic';
            if (err) { res.innerHTML = ''; res.appendChild(G.el('div.mk-err', err.msg || err)); return; }
            var r = G.scoreSpeech(c.en, alts); res.innerHTML = '';
            res.appendChild(G.el('div.mk-score.' + G.scoreLabel(r.score)[1], G.el('b', r.score), G.el('span', '/100')));
            res.appendChild(G.el('div.small.faint', 'Máy nghe: “' + r.heard + '”'));
            reveal();
            if (r.score >= 75) { G.sfx('right'); setTimeout(function () { if (q[k] === c) { grade(c, true); got++; k++; card(); } }, 1600); }
          });
        } }, G.el('img.mk-mic-img', { src: 'assets/ic_mic.png', alt: '' }), G.el('span', 'Bấm rồi nói'));
        body.appendChild(G.el('div.mk-row', mic, res));
      }
      body.appendChild(G.el('button.btn.big1.rv-show', { onclick: function (e) { reveal(); e.currentTarget.style.display = 'none'; } }, 'Xem đáp án'));
      body.appendChild(row);
    })();
  }

  /* ---------- 2. nói tự do ---------- */
  function edit1(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    var i = 0, j = 0, d = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++d > 1) return 2;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return d + (a.length - i) + (b.length - j);
  }
  function has(words, w) {
    for (var i = 0; i < words.length; i++) if (words[i] === w || (w.length >= 4 && edit1(words[i], w) <= 1)) return true;
    return false;
  }
  /* chấm câu tự nói: mỗi ý có ít nhất một cách nói xuất hiện là đạt ý đó */
  G.scoreFree = function (text, need) {
    var words = G.words(text), hit = [], n = 0;
    for (var g = 0; g < need.length; g++) {
      var ok = false;
      for (var a = 0; a < need[g].length && !ok; a++) {
        var aw = G.words(need[g][a]), all = aw.length > 0;
        for (var b = 0; b < aw.length; b++) if (!has(words, aw[b])) all = false;
        if (all) ok = true;
      }
      hit.push(ok); if (ok) n++;
    }
    var sc = need.length ? Math.round(n / need.length * 100) : 0;
    if (words.length < 3) sc = Math.min(sc, 40);    // trả lời cụt quá
    return { score: sc, hit: hit };
  };
  /* một câu hỏi tự nói; onDone(score) */
  function freeCard(body, it, onDone) {
    var n = G.NPCS[it.npc] || {}, pic = G.el('div.tpic');
    if (n.img) pic.appendChild(G.imgEl(n.img.replace('.png', '_talk.png'), 'tpic-img', n.img)); else if (n.av) pic.appendChild(G.avatarCanvas(n.av, 56, 'down', 'tpic-img'));
    body.appendChild(G.el('div.fr-sit', G.el('b', '🎯 Tình huống'), G.el('div', it.sit)));
    body.appendChild(G.el('div.tline', pic, G.el('div.tbubble', G.el('b', n.name || ''), G.el('div.en', it.q), G.el('div.small.faint', it.vi), G.sayBtns(it.q, 'en'))));
    G.say(it.q, 'en');
    var res = G.el('div.fr-res'), box = G.el('div.fr-box'), fin = false;
    var input = G.el('textarea.fr-in', { rows: 2, placeholder: 'Hoặc gõ câu trả lời bằng tiếng Anh…' });
    function check(text) {
      var r = G.scoreFree(text, it.need);
      res.innerHTML = '';
      res.appendChild(G.el('div.mk-score.' + G.scoreLabel(r.score)[1], G.el('b', r.score), G.el('span', '/100')));
      res.appendChild(G.el('div.small', 'Bạn nói: “' + text + '”'));
      res.appendChild(G.el('div.fr-ideas', it.need.map(function (g, i) { return G.el('span.' + (r.hit[i] ? 'w-ok' : 'w-miss'), (r.hit[i] ? '✓ ' : '✗ ') + g[0]); })));
      res.appendChild(G.el('div.fr-sample', G.el('b', 'Có thể nói:'), it.sample.map(function (s) { return G.el('div', s, G.sayBtns(s, 'en')); })));
      G.sfx(r.score >= 60 ? 'right' : 'wrong');
      G.S.tuNoi = G.S.tuNoi || {}; G.S.tuNoi[it.id] = Math.max(G.S.tuNoi[it.id] || 0, r.score); G.save();
      if (!fin) { fin = true; next.style.display = ''; }
      return r.score;
    }
    var last = 0;
    var next = G.el('button.btn.seal', { style: { display: 'none' }, onclick: function () { onDone(last); } }, 'Tiếp ›');
    if (G.micOn()) {
      var mic = G.el('button.mk-mic', { onclick: function () {
        mic.className = 'mk-mic on';
        G.listen('en', function (err, alts) {
          mic.className = 'mk-mic';
          if (err) { res.innerHTML = ''; res.appendChild(G.el('div.mk-err', err.msg || err)); return; }
          // lấy cách nghe được điểm cao nhất
          var best = alts[0], bs = -1;
          for (var i = 0; i < alts.length; i++) { var s = G.scoreFree(alts[i], it.need).score; if (s > bs) { bs = s; best = alts[i]; } }
          last = check(best);
        });
      } }, G.el('img.mk-mic-img', { src: 'assets/ic_mic.png', alt: '' }), G.el('span', 'Bấm rồi tự nói'));
      box.appendChild(G.el('div.mk-row', mic, G.el('div.small.faint', 'Tự nói bằng câu của bạn, không cần giống mẫu. Máy chấm theo ý chính.')));
    }
    box.appendChild(input);
    box.appendChild(G.el('div.row', G.el('button.btn', { onclick: function () { var v = input.value.replace(/^\s+|\s+$/g, ''); if (!v) { G.toast('Gõ câu trả lời trước nhé'); return; } last = check(v); } }, 'Kiểm tra câu gõ'), next));
    body.appendChild(box); body.appendChild(res);
  }
  G.openFree = function (list, title, back) {
    var k = 0, sum = 0;
    (function one() {
      var body = panelOpen((title || '💡 Nói tự do') + ' · ' + (k + 1) + '/' + list.length);
      if (k >= list.length) {
        var avg = Math.round(sum / list.length);
        G.markStudy(); G.markTask('noi'); G.addXp(10); G.logSpeak(avg);
        body.appendChild(G.el('div.result' + (avg >= 60 ? '.pass' : ''), G.el('b', 'Điểm tự nói: ' + avg + '/100'), G.el('div', avg >= 60 ? 'Bạn tự xử lý được tình huống bằng câu của mình!' : 'Xem lại câu mẫu, lần sau thử nói đủ các ý nhé.')));
        body.appendChild(G.el('div.row', back ? G.el('button.btn', { onclick: back }, '‹ Quay lại') : G.el('span'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
        return;
      }
      freeCard(body, list[k], function (sc) { sum += sc; k++; one(); });
    })();
  };
  G.freeFor = function (placeId) { return G.FREE_TALK.filter(function (f) { return f.place === placeId; }); };

  /* ---------- 3. kiểm tra tuần ---------- */
  function lifeTurns() {
    var out = [], id, any = false;
    for (id in G.S.doiSong) if (G.S.doiSong.hasOwnProperty(id) && G.LIFE[id] && G.LIFE[id].lang === 'en') any = true;
    for (id in G.LIFE) if (G.LIFE.hasOwnProperty(id) && G.LIFE[id].lang === 'en' && (!any || G.S.doiSong[id])) {
      var L = G.LIFE[id];
      for (var i = 0; i < L.talks.length; i++) for (var j = 0; j < L.talks[i].turns.length; j++) out.push({ L: L, u: L.talks[i].turns[j] });
    }
    return out;
  }
  G.weeklyInfo = function () {
    var h = G.S.tuan || [], last = h[h.length - 1];
    var days = last ? Math.floor((Date.parse(day(0)) - Date.parse(last.ngay)) / 86400000) : 99;
    return { history: h, last: last, due: !last || days >= 7, days: days };
  };
  G.openWeekly = function () {
    var nm = G.playerName();
    var pool = G.shuffle(lifeTurns()), allOk = [], allVi = [];
    for (var i = 0; i < pool.length; i++) { allOk.push(pool[i].u.ok.replace(/\{name\}/g, nm)); allVi.push(pool[i].u.vi.replace(/\{name\}/g, nm)); }
    var listen = pool.slice(0, 6), reads = G.shuffle(G.READ_TASKS).slice(0, 4);
    var work = G.shuffle(G.FREE_TALK.filter(function (f) { return f.place === 'work'; })), life = G.shuffle(G.FREE_TALK.filter(function (f) { return f.place !== 'work'; }));
    var speak = [life[0], work[0], life[1]];
    var sc = { nghe: 0, doc: 0, noi: 0 };
    function others(arr, right, n) { var o = G.shuffle(arr.filter(function (x) { return x !== right; })); var u = []; for (var i = 0; i < o.length && u.length < n; i++) if (u.indexOf(o[i]) < 0) u.push(o[i]); return u; }

    // phần 1: nghe không nhìn chữ
    var k = 0, right = 0;
    function partListen() {
      if (k >= listen.length) { sc.nghe = Math.round(right / listen.length * 100); k = 0; right = 0; partRead(); return; }
      var it = listen[k], text = it.u.npc.replace(/\{name\}/g, nm), meaning = k % 2 === 1;
      var body = panelOpen('📝 Kiểm tra tuần · 1/3 Nghe · câu ' + (k + 1) + '/' + listen.length);
      body.appendChild(G.el('div.wk-hint', '👂 Chỉ nghe, không có chữ — như ngoài đời. Nghe lại thoải mái.'));
      var hidden = G.el('div.wk-hidden', G.el('div.en', text), G.el('div.small.faint', it.u.vi.replace(/\{name\}/g, nm)));
      body.appendChild(G.el('div.wk-audio', G.el('b', (G.NPCS[it.L.npc] || {}).name || ''), G.sayBtns(text, 'en'), hidden));
      G.say(text, 'en');
      var ans = meaning ? it.u.vi.replace(/\{name\}/g, nm) : it.u.ok.replace(/\{name\}/g, nm);
      var opts = G.shuffle([ans].concat(others(meaning ? allVi : allOk, ans, 2)));
      body.appendChild(G.el('b.wk-q', meaning ? 'Người đó vừa nói gì?' : 'Bạn đáp lại thế nào cho hợp?'));
      var answered = false;
      body.appendChild(G.el('div.opts', opts.map(function (o) {
        return G.el('button.opt', { onclick: function (e) {
          if (answered) return; answered = true;
          var ok = o === ans; if (ok) right++;
          e.currentTarget.className = 'opt ' + (ok ? 'ok' : 'no'); G.sfx(ok ? 'right' : 'wrong');
          hidden.className = 'wk-hidden show';
          setTimeout(function () { k++; partListen(); }, ok ? 1100 : 2400);
        } }, o);
      })));
    }
    // phần 2: đọc đồ thật
    function partRead() {
      if (k >= reads.length) { sc.doc = Math.round(right / reads.length * 100); k = 0; partSpeak(); return; }
      var it = reads[k], body = panelOpen('📝 Kiểm tra tuần · 2/3 Đọc · ' + (k + 1) + '/' + reads.length);
      body.appendChild(G.el('div.wk-hint', '📄 Đọc những thứ bạn gặp thật ngoài đời và ở chỗ làm.'));
      body.appendChild(G.el('div.wk-doc', G.el('div.small.faint', it.kind), G.el('pre', it.text)));
      body.appendChild(G.el('b.wk-q', it.q));
      var ans = it.opts[it.ok], answered = false;
      body.appendChild(G.el('div.opts', G.shuffle(it.opts.slice()).map(function (o) {
        return G.el('button.opt', { onclick: function (e) {
          if (answered) return; answered = true;
          var ok = o === ans; if (ok) right++;
          e.currentTarget.className = 'opt ' + (ok ? 'ok' : 'no'); G.sfx(ok ? 'right' : 'wrong');
          if (!ok) G.toast('Đáp án: ' + ans);
          setTimeout(function () { k++; partRead(); }, ok ? 900 : 2200);
        } }, o);
      })));
    }
    // phần 3: nói tự do
    var sum = 0;
    function partSpeak() {
      if (k >= speak.length) { sc.noi = Math.round(sum / speak.length); finish(); return; }
      var body = panelOpen('📝 Kiểm tra tuần · 3/3 Nói · ' + (k + 1) + '/' + speak.length);
      body.appendChild(G.el('div.wk-hint', '🗣 Tự trả lời bằng câu của bạn (micro hoặc gõ). Chấm theo ý chính, không chấm ngữ pháp.'));
      freeCard(body, speak[k], function (s) { sum += s; k++; partSpeak(); });
    }
    function finish() {
      var tong = Math.round((sc.nghe + sc.doc + sc.noi) / 3), info = G.weeklyInfo(), prev = info.last;
      G.S.tuan = G.S.tuan || []; G.S.tuan.push({ ngay: day(0), luc: G.vnNow(), nghe: sc.nghe, doc: sc.doc, noi: sc.noi, tong: tong });
      G.markStudy(); G.addXp(30); G.save(); G.sfx('done'); if (tong >= 75 && G.confetti) G.confetti();
      var body = panelOpen('📝 Kết quả kiểm tra tuần');
      body.appendChild(G.el('div.wk-total', G.el('b', tong), G.el('span', '/100'), G.el('div', levelOf(tong))));
      if (prev) body.appendChild(G.el('div.small.faint.wk-cmp', (tong >= prev.tong ? '▲ +' : '▼ ') + (tong - prev.tong) + ' điểm so với lần trước (' + prev.ngay.split('-').reverse().join('/') + ')'));
      body.appendChild(bars([['👂 Nghe', sc.nghe], ['📄 Đọc', sc.doc], ['🗣 Nói tự do', sc.noi]]));
      body.appendChild(G.el('p.small', advice(sc)));
      body.appendChild(G.weeklyChart());
      body.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.openCanDo }, '📒 Mình nói được'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
    }
    partListen();
  };
  function levelOf(t) {
    return t >= 90 ? '🌟 Sẵn sàng giao tiếp thật' : t >= 75 ? '💪 Tự tin trong đời sống hằng ngày' : t >= 50 ? '🙂 Xử lý được tình huống quen thuộc' : '🌱 Cần luyện thêm các tình huống cơ bản';
  }
  function advice(s) {
    var low = [['nghe', s.nghe, 'Nghe: bật chế độ "👂 Chỉ nghe" khi nói chuyện ngoài phố.'], ['doc', s.doc, 'Đọc: đọc thêm 1 chương truyện mỗi ngày.'], ['noi', s.noi, 'Nói: mỗi ngày làm 2–3 câu "💡 Nói tự do" ở các nơi đời sống.']];
    low.sort(function (a, b) { return a[1] - b[1]; });
    if (low[0][1] >= 90) return 'Rất tốt! Tuần này giữ nhịp: nói chuyện ngoài phố mỗi ngày và thử các tình huống công việc trong "📒 Mình nói được".';
    return 'Tuần này nên tập trung: ' + low[0][2];
  }
  function bars(rows) {
    return G.el('div.wk-bars', rows.map(function (r) {
      var i = G.el('i'); i.style.width = Math.max(4, r[1]) + '%';
      return G.el('div.wk-bar', G.el('span', r[0]), G.el('div.wk-track', i), G.el('b', r[1]));
    }));
  }
  /* biểu đồ điểm các lần kiểm tra tuần */
  G.weeklyChart = function () {
    var h = (G.S.tuan || []).slice(-8);
    if (!h.length) return G.el('div.small.faint', 'Chưa có lần kiểm tra nào.');
    return G.el('div.wk-chart', G.el('b', 'Tiến bộ qua các tuần'), G.el('div.wk-cols', h.map(function (x) {
      var c = G.el('i'); c.style.height = Math.max(4, x.tong) + '%';
      return G.el('div.wk-col', G.el('span.small', x.tong), G.el('div.wk-colbar', c), G.el('span.small.faint', x.ngay.slice(8, 10) + '/' + x.ngay.slice(5, 7)));
    })));
  };

  /* ---------- 4. sổ "Mình nói được" ---------- */
  G.canDoStats = function () {
    var n = 0, total = 0, id;
    for (id in G.LIFE) if (G.LIFE.hasOwnProperty(id) && G.LIFE[id].lang === 'en') {
      var st = G.S.doiSong[id] || {}, xs = st.xong || {};
      for (var i = 0; i < G.LIFE[id].talks.length; i++) { total++; if (xs[i]) n++; }
    }
    var fr = G.S.tuNoi || {}; for (var f = 0; f < G.FREE_TALK.length; f++) { total++; if ((fr[G.FREE_TALK[f].id] || 0) >= 60) n++; }
    return { n: n, total: total };
  };
  G.openCanDo = function () {
    var body = panelOpen('📒 Mình nói được');
    var st = G.canDoStats();
    body.appendChild(G.el('div.cd-head', G.el('b', st.n + '/' + st.total), G.el('span', ' việc bạn đã xử lý được bằng tiếng Anh')));
    body.appendChild(G.el('p.small.faint', '✅ đã làm được · 🌟 làm tốt (nói qua micro từ 75 điểm hoặc tự nói từ 60) · ⚪ chưa làm. Đây là đầu ra thật của bạn: những việc làm được ngoài đời.'));
    for (var id in G.LIFE) if (G.LIFE.hasOwnProperty(id) && G.LIFE[id].lang === 'en') {
      var L = G.LIFE[id], s = G.S.doiSong[id] || {}, xs = s.xong || {}, dm = s.diem || {};
      var rows = L.talks.map(function (t, i) {
        var mark = !xs[i] ? '⚪' : (dm[i] === undefined || dm[i] === null || dm[i] >= 75) ? (dm[i] >= 75 ? '🌟' : '✅') : '✅';
        return G.el('div.cd-row' + (xs[i] ? '.ok' : ''), G.el('span', mark), G.el('span', t.title));
      });
      G.freeFor(id).forEach(function (f) {
        var v = (G.S.tuNoi || {})[f.id];
        rows.push(G.el('div.cd-row' + (v >= 60 ? '.ok' : ''), G.el('span', v >= 60 ? '🌟' : '⚪'), G.el('span', '💡 Tự nói: ' + f.sit)));
      });
      body.appendChild(G.el('div.cd-place', G.el('b', L.title), rows));
    }
    var work = G.freeFor('work');
    body.appendChild(G.el('div.cd-place', G.el('b', '💼 Công việc'), work.map(function (f) {
      var v = (G.S.tuNoi || {})[f.id];
      return G.el('div.cd-row' + (v >= 60 ? '.ok' : ''), G.el('span', v >= 60 ? '🌟' : '⚪'), G.el('span', f.sit));
    }), G.el('button.btn.sm', { onclick: function () { G.openFree(G.shuffle(work).slice(0, 3), '💼 Nói tự do · công việc', G.openCanDo); } }, 'Luyện 3 tình huống công việc ›')));
  };
})();
