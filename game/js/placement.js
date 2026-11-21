/* Bài kiểm tra đầu vào tiếng Anh · "Ngày đầu tới Brightford" (dữ liệu: data/placement_en.js).
   Kai dẫn người học đi một vòng thành phố: mỗi câu diễn ra ở một nơi (ảnh nơi đó, người ở đó nói với bạn).
   4 phần Nghe · Đọc · Phản xạ giao tiếp · Nói, mỗi phần đi từ Pre-A1 lên B2 và tự dừng khi tới mức khó.
   Mỗi cấp rút ngẫu nhiên từ kho câu, câu đã gặp ở lần làm trước để sau cùng (G.S.dauVaoDaHoi), nên làm lại sau 30 ngày gặp câu mới.
   Kết quả có thêm bản đồ Brightford: nơi bạn đã tự lo được sáng lên, nơi cần học khoá lại.
   Kết quả lưu G.S.dauVao = { lv, nghe, doc, gt, noi, luc, dung, tong } (giờ Việt Nam), lịch sử ở G.S.dauVaoLs.
   Game dùng kết quả để chỉnh độ khó: người mới hiện nghĩa đáp án, từ A2 mở khoá thi vượt các phòng A1. */
var G = window.G || (window.G = {});

(function () {
  var P, root, box, done, opts, res, pi, nAsk, nRight, seen = {}, asked = [], lastPl = '', pronRes = null;

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
      'Ngày đầu tới Brightford', 'Kiểm tra trình độ tiếng Anh theo khung CEFR quốc tế, từ A0 (mới bắt đầu) tới B2. Kai dẫn bạn đi một vòng thành phố: sân bay, xe buýt, quán cà phê, chợ, bệnh viện, ngân hàng… Ở mỗi nơi, người ta nói với bạn, bạn nghe, đọc, đáp lời như thật.');
    var intro = P.places.airport;
    var sc = G.el('div.pl-scene.pl-scene-intro'); sc.style.backgroundImage = 'url("' + G.assetUrl(intro.bg) + '")';
    sc.appendChild(G.imgEl('kai_follow.png', 'pl-npc pl-kai-big'));
    sc.appendChild(G.el('div.pl-scene-say', G.el('b', 'Kai'), G.el('span', 'Chào mừng tới Brightford! Đi một vòng với mình nhé. Xong vòng này, mình biết bạn đã tự lo được ở đâu trong thành phố.')));
    box.appendChild(sc);
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
    res = { nghe: null, doc: null, gt: null, noi: null }; pi = 0; nAsk = 0; nRight = 0; asked = []; lastPl = ''; pronRes = null;
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
    if (pi >= P.parts.length) { pronStep(); return; }
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

  /* đi từ cấp 1 lên 5: đúng 2 câu đầu thì lên cấp, sai cả 2 thì dừng, đúng 1 thì làm câu thứ 3.
     Đúng 1 sai 2 (có thể do bấm nhầm): thêm 2 câu xác nhận, đúng cả 2 thì vẫn lên cấp. Phần Nói: mỗi cấp một bài, chưa đạt thì thử bài thứ hai. */
  function runPart(p) {
    var bank = P[p.id], lv = 1, passed = 0, tried = false;
    function itemsOf(l) { return bank.filter(function (it) { return it.lv === l; }); }
    function up() { passed = lv; lv++; level(); }
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
            end();
          });
        })();
        return;
      }
      var right = 0, wrong = 0, confirm = false;
      (function one() {
        if (k >= q.length) { if (right >= 2) up(); else end(); return; }
        ask(p, q[k++], lv, function (ok) {
          if (ok) right++; else wrong++;
          if (confirm) { if (!ok) end(); else if (right >= 2) up(); else one(); return; }
          if (right >= 2) { up(); return; }
          if (wrong >= 2) {
            if (right === 1 && q.length - k >= 2) { confirm = true; right = 0; wrong = 0; one(); return; }
            end(); return;
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

  /* nơi diễn ra câu hỏi và người nói */
  function placeOf(it) { return P.places[it.pl] || P.places.airport; }
  function whoOf(it) { var w = P.who[it.who || placeOf(it).who]; return w || null; }
  /* cảnh: ảnh nơi đó, tên nơi, người nói đứng trong cảnh (phần Đọc không có người nói) */
  function scene(p, it) {
    var pl = placeOf(it), w = whoOf(it), sc = G.el('div.pl-scene');
    sc.style.backgroundImage = 'url("' + G.assetUrl(pl.bg) + '")';
    sc.appendChild(G.el('span.pl-place', '📍 ' + pl.name));
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
    var dots = G.el('div.pl-prog', P.parts.map(function (q, i) { return G.el('i' + (i < pi ? '.done' : i === pi ? '.on' : '')); }));
    box.appendChild(G.el('div.pl-top', G.el('span.small.faint', p.icon + ' ' + p.name + ' · câu ' + (nAsk + 1)), dots));
    var kl = kaiLine(it); if (kl) box.appendChild(kl);
    box.appendChild(scene(p, it));
    if (p.id === 'noi') { askSpeak(it, cb); return; }
    var card = G.el('div.pl-card'), w = whoOf(it);
    if (p.id === 'nghe') {
      card.appendChild(G.el('div.pl-bub.pl-bub-npc', G.el('b.pl-bub-name', (w ? w[0] : '') + ' nói:'),
        G.el('div.pl-listen',
          G.el('button.pl-play', { onclick: function () { G.say(it.a, 'en'); } }, '🔊 Nghe lại'),
          G.el('button.pl-play.slow', { onclick: function () { G.saySlow(it.a, 'en'); } }, '🐢 Nghe chậm'))));
      setTimeout(function () { G.say(it.a, 'en'); }, 450);
    } else if (p.id === 'doc') {
      var sign = it.t.length <= 26 && it.t.indexOf(':') < 0;
      card.appendChild(G.el('div' + (sign ? '.pl-sign' : '.pl-msg'), it.t));
    } else if (p.id === 'gt') {
      card.appendChild(G.el('div.pl-bub.pl-bub-npc', G.el('b.pl-bub-name', w ? w[0] : ''),
        G.el('div.pl-bub-row', G.el('div', it.p), G.el('button.pl-mini', { 'aria-label': 'Nghe', onclick: function () { G.say(it.p, 'en'); } }, '🔊'))));
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
      G.el('div.pl-bub-row', G.el('div', it.ask), G.el('button.pl-mini', { 'aria-label': 'Nghe', onclick: function () { G.say(it.ask, 'en'); } }, '🔊'))));
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

  /* phần thêm (1 phút): bắt lỗi phát âm hay gặp của người Việt, chỉ khi đã làm phần Nói bằng micro */
  function pronStep() {
    if (!G.pronCheck || res.noi === null || res.noi === undefined || !(G.micOn && G.micOn())) { finish(); return; }
    screen();
    head('Phần thêm · 1 phút', '🗣 Bắt lỗi phát âm', 'Đọc to 12 từ ngắn. Người Việt hay đọc card thành car, three thành tree, cats thành cat… Máy nghe xem bạn có mắc lỗi nào, rồi gợi ý cách sửa và bài luyện riêng.');
    box.appendChild(G.el('button.btn.seal.big1', { onclick: function () {
      G.pronCheck(root, function (kq) { pronRes = kq; root.innerHTML = ''; box = G.el('div.pl-wrap'); root.appendChild(box); finish(); });
    } }, 'Bắt đầu ›'));
    box.appendChild(G.el('button.btn', { onclick: finish }, 'Bỏ qua, xem kết quả'));
  }

  /* ---------- mục tiêu học và thời gian mỗi ngày → dự kiến khi nào đạt (cùng cách tính với thanh kéo ở Sảnh) ---------- */
  var GOALS = [
    { id: 'giaotiep', icon: '💬', name: 'Giao tiếp hằng ngày', step: 2 },
    { id: 'dulich', icon: '✈️', name: 'Đi du lịch', step: 2 },
    { id: 'dilam', icon: '💼', name: 'Đi làm, công việc', step: 3 },
    { id: 'con', icon: '🧒', name: 'Học cùng con', step: 1 },
    { id: 'thi', icon: '🎓', name: 'Thi chứng chỉ, du học', step: 4 }
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
    var pt = G.planToday(), st = G.ROADMAP_EN[m.buoc] || {}, who = g ? g.icon + ' ' + g.name + ': ' : '🎯 ';
    if (pt.xong) return '🎉 Bạn đã đạt ' + st.name + '! Chọn mục tiêu cao hơn để học tiếp.';
    if (pt.het) return 'Mốc ' + fmtDay(m.den) + ' đã qua mà chưa đạt ' + st.name + '. Chọn mốc mới, app tính lại phần học mỗi ngày.';
    return who + 'đạt ' + st.name + ' (' + st.cefr + ') trước ' + fmtDay(m.den) + ' (mốc ' + m.thang + ' tháng). Học ' + dpw + ' ngày/tuần, mỗi ngày học khoảng ' + pt.phut + ' phút' + (dpw < 7 ? ', còn lại nghỉ' : '') + '.' +
      (pt.cham ? ' Đang chậm so với mốc nên phần học mỗi ngày đã tăng để kịp.' : pt.nhanh ? ' Bạn đang nhanh hơn tiến độ 👍' : '');
  };
  G.goalLine = function () { return G.planLine(); };
  /* thẻ chọn mục tiêu + mốc thời gian (kết quả đầu vào, Sảnh); onChange khi đổi */
  G.goalCard = function (onChange) {
    var cd = G.S.caiDat = G.S.caiDat || {};
    var line = G.el('div.gl-line'), gRow = G.el('div.gl-chips'), dRow = G.el('div.gl-chips'), mRow = G.el('div.gl-chips');
    function draw() {
      var g = G.goalOf(), m = G.S.mocHoc, step = stepOf(), dpw = cd.ngayTuan || 5;
      gRow.innerHTML = ''; dRow.innerHTML = ''; mRow.innerHTML = '';
      [2, 3, 4, 5, 6, 7].forEach(function (nd) {   // không ai học đủ 7 ngày: để người học tự chọn, mặc định 5 ngày
        dRow.appendChild(G.el('button.gl-chip' + (dpw === nd ? '.on' : ''), { onclick: function () {
          cd.ngayTuan = nd; if (G.S.mocHoc) G.setPlan(G.S.mocHoc.thang); else G.save(); draw(); if (onChange) onChange();
        } }, nd === 7 ? '7 ngày (cả tuần)' : nd + ' ngày'));
      });
      GOALS.forEach(function (x) {
        gRow.appendChild(G.el('button.gl-chip' + (g && g.id === x.id ? '.on' : ''), { onclick: function () {
          G.S.mucTieu = { id: x.id, luc: G.vnNow() }; if (G.S.mocHoc) G.setPlan(G.S.mocHoc.thang); G.save(); draw(); if (onChange) onChange();
        } }, x.icon + ' ' + x.name));
      });
      MOCS.forEach(function (mo) {
        var need = G.planNeed(mo, step, dpw), hard = need > 240;
        mRow.appendChild(G.el('button.gl-chip.gl-moc' + (m && m.thang === mo ? '.on' : '') + (hard ? '.hard' : ''), { onclick: function () {
          if (hard) { G.toast('Mốc ' + mo + ' tháng cần hơn 4 giờ mỗi ngày, quá gấp. Chọn mốc dài hơn nhé.'); return; }
          G.setPlan(mo); draw(); if (onChange) onChange();
        } }, G.el('b', mo + ' tháng'), G.el('span', need <= 0 ? 'đã đạt' : hard ? 'quá gấp' : '~' + Math.max(10, need) + ' phút/ngày')));
      });
      line.textContent = G.planLine();
    }
    draw();
    var el = G.el('div.gl-card', G.el('b.gl-h', '🎯 Bạn học tiếng Anh để làm gì?'), gRow,
      G.el('b.gl-h', '📆 Mỗi tuần học mấy ngày?'), dRow,
      G.el('b.gl-h', '📅 Muốn đạt mục tiêu trong bao lâu?'), mRow, line);
    el.redraw = draw;
    return el;
  };

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
    G.S.dauVaoDaHoi = asked.slice(0, 120);   // lần sau rút câu khác
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
    box.appendChild(cityMap(lv));
    if (pronRes && G.pronCard) {   // vừa bắt lỗi phát âm: 3 lỗi hay mắc nhất, cách sửa, nút luyện ngay
      var det = {}; pronRes.loi.forEach(function (x) { det[x.tag] = x.heard; });
      box.appendChild(G.pronCard(function () { G.openPronPractice(function () {}); }, det));
    }
    box.appendChild(G.goalCard());
    box.appendChild(G.el('div.pl-plan', G.el('b', 'App sẽ chỉnh cho bạn:'), G.el('ul', plan(lv).map(function (t) { return G.el('li', t); }))));
    box.appendChild(G.el('p.small.faint', 'Học khoảng 30 ngày thì làm lại ở Sảnh → “Trình độ đầu vào” để xem mình lên cấp chưa.'));
    box.appendChild(G.el('button.btn.seal.big1.pl-go', { onclick: close }, opts.first ? 'Tiếp: chọn nhân vật ›' : opts.canSkip ? 'Xong ›' : 'Vào học ›'));
  }
  /* bản đồ Brightford của bạn: nơi đã tự lo được (đủ cấp) sáng lên, nơi cần học khoá lại kèm cấp cần đạt */
  function cityMap(lv) {
    var ids = [], n = 0, k;
    for (k in P.places) if (P.places.hasOwnProperty(k)) { ids.push(k); if (lv >= P.places[k].lv) n++; }
    var wrap = G.el('div.pl-map', G.el('div.pl-map-head', G.el('b', '🗺 Bản đồ Brightford của bạn'),
      G.el('span.small', 'Tự lo được ' + n + '/' + ids.length + ' nơi. Nơi có 🔒 sẽ mở dần khi bạn học lên.')));
    P.areas.forEach(function (ar) {
      var row = G.el('div.pl-map-row');
      ids.forEach(function (id) {
        var pl = P.places[id]; if (pl.area !== ar.id) return;
        var ok = lv >= pl.lv, th = G.el('div.pl-map-pic'); th.style.backgroundImage = 'url("' + G.assetUrl(pl.bg) + '")';
        if (pl.prop) th.appendChild(G.imgEl(pl.prop, 'pl-map-prop'));
        row.appendChild(G.el('div.pl-map-card' + (ok ? '.ok' : '.off'), th,
          G.el('div.pl-map-name', G.el('b', (ok ? '✅ ' : '🔒 ') + pl.name), G.el('span.small', ok ? 'Tự lo được' : 'Cần ' + P.levels[pl.lv]))));
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
