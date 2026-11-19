/* Bài kiểm tra đầu vào tiếng Anh (dữ liệu: data/placement_en.js).
   4 phần Nghe · Đọc · Phản xạ giao tiếp · Nói, mỗi phần đi từ Pre-A1 lên B2 và tự dừng khi tới mức khó.
   Kết quả lưu G.S.dauVao = { lv, nghe, doc, gt, noi, luc, dung, tong } (giờ Việt Nam), lịch sử ở G.S.dauVaoLs.
   Game dùng kết quả để chỉnh độ khó: người mới hiện nghĩa đáp án, từ A2 mở khoá thi vượt các phòng A1. */
var G = window.G || (window.G = {});

(function () {
  var P, root, box, done, opts, res, pi, nAsk, nRight;

  G.levelName = function (lv) { var p = G.PLACE_EN; return p.levels[lv] + ' · ' + p.names[lv]; };

  G.openPlacement = function (cb, o) {
    P = G.PLACE_EN; done = cb; opts = o || {};
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
    head(opts.first ? (G.cloudReady && G.cloudReady() ? 'Bước 2/3' : 'Bước 1/2') + ' · Bắt buộc trước khi vào học' : opts.mandatory ? 'Bắt buộc trước khi học tiếp' : 'Làm lại để đo tiến bộ',
      'Kiểm tra trình độ tiếng Anh', 'Ai vào app cũng làm bài này trước, để app chọn đúng độ khó cho bạn. Theo khung CEFR quốc tế, từ A0 (mới bắt đầu) tới B2.');
    box.appendChild(G.el('div.pl-parts', P.parts.map(function (p) {
      return G.el('div.pl-part', G.el('b', p.icon + ' ' + p.name), G.el('span.small.faint', p.what));
    })));
    box.appendChild(G.el('div.pl-note',
      G.el('div', '⏱ Bài tự dừng khi tới mức khó với bạn: người mới khoảng 3 phút, người đã học khoảng 10–12 phút.'),
      G.el('div', '🙅 Không tra từ. Không biết thì bấm “Không biết”, như vậy kết quả mới đúng.'),
      G.el('div', '🌱 Chưa biết tiếng Anh cũng làm bình thường: bấm “Không biết”, bài sẽ tự dừng sau vài câu.'),
      G.el('div', '🔊 Bật loa hoặc đeo tai nghe để làm phần Nghe.')));
    box.appendChild(G.el('button.btn.seal.big1.pl-go', { onclick: start }, 'Bắt đầu kiểm tra ›'));
    // đã học ở máy khác: đăng nhập lấy tiến độ; tiến độ trên mây có sẵn kết quả kiểm tra thì tải lại app là khỏi làm lại
    if ((opts.first || opts.mandatory) && G.cloudReady && G.cloudReady() && !G.cloudUser())
      box.appendChild(G.el('button.btn.ghost.pl-cloud', { onclick: function () { G.openCloudLogin(function (what) { if (what === 'pulled') setTimeout(function () { location.reload(); }, 900); }); } }, '☁️ Đã có tài khoản / học trên máy khác? Đăng nhập'));
    if (opts.canSkip) box.appendChild(G.el('button.btn.ghost.pl-later', { onclick: close }, 'Để sau'));
  }
  function start() {
    res = { nghe: null, doc: null, gt: null, noi: null }; pi = 0; nAsk = 0; nRight = 0;
    part();
  }

  /* ---------- từng phần ---------- */
  function part() {
    if (pi >= P.parts.length) { finish(); return; }
    var p = P.parts[pi];
    screen();
    head('Phần ' + (pi + 1) + '/' + P.parts.length, p.icon + ' ' + p.name, p.what);
    if (p.id === 'noi' && !G.canListen) {
      box.appendChild(G.el('p', 'Máy này chưa hỗ trợ micro chấm điểm, nên bỏ qua phần Nói. Kết quả tính theo 3 phần còn lại.'));
      box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { pi++; part(); } }, 'Xem kết quả ›'));
      return;
    }
    if (p.id === 'noi' && !G.micOn()) {
      box.appendChild(G.el('p', 'Micro đang tắt. Bật micro để đo kỹ năng nói, hoặc bỏ qua phần này.'));
      box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { G.setMic(true); runPart(p); } }, '🎤 Bật micro và làm phần Nói'));
      box.appendChild(G.el('button.btn', { onclick: function () { pi++; part(); } }, 'Bỏ qua phần Nói'));
      return;
    }
    box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { runPart(p); } }, 'Bắt đầu ›'));
  }

  /* đi từ cấp 1 lên 5: đúng 2 câu đầu thì lên cấp, sai cả 2 thì dừng, đúng 1 thì làm câu thứ 3 */
  function runPart(p) {
    var bank = P[p.id], lv = 1, passed = 0, tried = false;
    function itemsOf(l) { return bank.filter(function (it) { return it.lv === l; }); }
    function level() {
      var L = itemsOf(lv);
      if (lv > 5 || !L.length) { end(); return; }
      if (p.id === 'noi') {   // phần nói: mỗi cấp một bài
        ask(p, L[0], lv, function (ok) {
          if (ok === null) { end(); return; }   // chuyển sang không dùng micro: dừng phần nói
          tried = true;
          if (ok) { passed = lv; lv++; level(); } else end();
        });
        return;
      }
      ask(p, L[0], lv, function (a) {
        ask(p, L[1], lv, function (b) {
          var c = (a ? 1 : 0) + (b ? 1 : 0);
          if (c === 2) { passed = lv; lv++; level(); return; }
          if (c === 0) { end(); return; }
          ask(p, L[2], lv, function (d) { if (d) { passed = lv; lv++; level(); } else end(); });
        });
      });
    }
    function end() {
      res[p.id] = p.id === 'noi' && !tried ? null : passed;
      pi++; part();
    }
    level();
  }

  /* ---------- một câu hỏi ---------- */
  function ask(p, it, lv, cb) {
    screen();
    var dots = G.el('div.pl-prog', P.parts.map(function (q, i) { return G.el('i' + (i < pi ? '.done' : i === pi ? '.on' : '')); }));
    box.appendChild(G.el('div.pl-top', G.el('span.small.faint', p.icon + ' ' + p.name + ' · câu ' + (nAsk + 1)), dots));
    if (p.id === 'noi') { askSpeak(it, cb); return; }
    var card = G.el('div.pl-card');
    if (p.id === 'nghe') {
      card.appendChild(G.el('div.pl-listen',
        G.el('button.pl-play', { onclick: function () { G.say(it.a, 'en'); } }, '🔊 Nghe lại'),
        G.el('button.pl-play.slow', { onclick: function () { G.saySlow(it.a, 'en'); } }, '🐢 Nghe chậm')));
      setTimeout(function () { G.say(it.a, 'en'); }, 350);
    } else if (p.id === 'doc') {
      var sign = it.t.length <= 26 && it.t.indexOf(':') < 0;
      card.appendChild(G.el('div' + (sign ? '.pl-sign' : '.pl-msg'), it.t));
    } else if (p.id === 'gt') {
      card.appendChild(G.el('div.pl-say', G.el('span.pl-who', '🧑'), G.el('div.pl-bub', G.el('div', it.p), G.el('button.pl-mini', { onclick: function () { G.say(it.p, 'en'); } }, '🔊'))));
      card.appendChild(G.el('div.small.faint', 'Bạn đáp lại thế nào cho tự nhiên?'));
      setTimeout(function () { G.say(it.p, 'en'); }, 350);
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
    var tries = 0, out = G.el('div.pl-heard');
    card.appendChild(G.el('div.pl-say', G.el('span.pl-who', '🧑'), G.el('div.pl-bub', G.el('div', it.ask), G.el('button.pl-mini', { onclick: function () { G.say(it.ask, 'en'); } }, '🔊'))));
    card.appendChild(G.el('div.small.faint', it.vi));
    var mic = G.el('button.mk-mic', { onclick: go }, G.el('span', '🎤'), G.el('b', 'Bấm rồi nói'));
    card.appendChild(G.el('div.pl-microw', mic, out));
    card.appendChild(G.el('div.row',
      G.el('button.btn.ghost', { onclick: function () { nAsk++; cb(false); } }, 'Không trả lời được'),
      G.el('button.btn.ghost', { onclick: function () { cb(null); } }, 'Bỏ qua phần Nói')));
    setTimeout(function () { G.say(it.ask, 'en'); }, 350);
    function go() {
      if (mic.className.indexOf('on') >= 0) return;
      mic.className = 'mk-mic on'; out.innerHTML = ''; out.appendChild(G.el('div.small', '🎙 Đang nghe… nói xong máy tự dừng'));
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

  /* ---------- kết quả ---------- */
  function overall(r) {
    var v = [r.nghe, r.doc, r.gt]; if (r.noi !== null && r.noi !== undefined) v.push(r.noi);
    v.sort(function (a, b) { return a - b; });
    return v[Math.floor((v.length - 1) / 2)];   // trung vị (lấy giá trị thấp hơn khi số phần chẵn)
  }
  function finish() {
    var lv = overall(res);
    var rec = { lv: lv, nghe: res.nghe, doc: res.doc, gt: res.gt, noi: res.noi, luc: G.vnNow(), dung: nRight, tong: nAsk };
    var prev = G.S.dauVao;
    G.S.dauVao = rec;
    G.S.dauVaoLs = (G.S.dauVaoLs || []).concat([rec]).slice(-12);
    if (G.S.caiDat) delete G.S.caiDat.nghiaDapAn;   // để nghĩa đáp án tự bật/tắt theo trình độ mới
    G.save();
    G.sfx && G.sfx('done');
    screen();
    head('Kết quả đầu vào', G.levelName(lv), 'Đúng ' + nRight + '/' + nAsk + ' câu · ' + rec.luc.slice(0, 16) + ' (giờ Việt Nam)');
    box.appendChild(G.el('div.pl-lv', G.el('b', P.levels[lv]), G.el('span', P.names[lv])));
    box.appendChild(G.el('div.pl-skills', P.parts.map(function (p) {
      var v = res[p.id];
      return G.el('div.pl-skill', G.el('span.pl-sk-name', p.icon + ' ' + p.name),
        G.el('span.pl-bar', [1, 2, 3, 4, 5].map(function (k) { return G.el('i' + (v !== null && v >= k ? '.on' : '')); })),
        G.el('b.pl-sk-lv', v === null ? 'chưa đo' : P.levels[v]));
    })));
    if (prev && prev.luc) box.appendChild(G.el('p.small', (lv > prev.lv ? '📈 Tiến bộ: ' : lv < prev.lv ? '📉 ' : '➖ ') + 'lần trước ' + P.levels[prev.lv] + ' (' + prev.luc.slice(0, 10) + ') → lần này ' + P.levels[lv]));
    box.appendChild(G.el('div.pl-can', G.el('b', 'Bạn đang ở mức: '), P.cando[lv]));
    box.appendChild(G.el('div.pl-plan', G.el('b', 'App sẽ chỉnh cho bạn:'), G.el('ul', plan(lv).map(function (t) { return G.el('li', t); }))));
    box.appendChild(G.el('p.small.faint', 'Học khoảng 30 ngày thì làm lại ở Sảnh → “Trình độ đầu vào” để xem mình lên cấp chưa.'));
    box.appendChild(G.el('button.btn.seal.big1.pl-go', { onclick: close }, opts.first ? 'Tiếp: chọn nhân vật ›' : opts.canSkip ? 'Xong ›' : 'Vào học ›'));
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
