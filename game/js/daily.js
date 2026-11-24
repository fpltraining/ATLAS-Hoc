/* Hôm nay: kế hoạch học mỗi ngày (mặc định 2 giờ) gom hết vào game.
   5 việc: Học bài ở trường · Đọc truyện ở nhà · Nói chuyện ngoài phố · Ôn từ khó ở nhà · Học 10 từ theo chủ đề.
   Đếm phút học thật (trang đang mở và có thao tác trong 60 giây gần nhất), theo giờ Việt Nam.
   Nhà của bạn = góc học: đọc truyện song ngữ (kho truyện của app) và ôn từ khó. */
var G = window.G || (window.G = {});

(function () {
  var GOAL_MIN = 120;   // mặc định khi chưa chọn mốc thời gian (Sảnh → Mục tiêu và mốc thời gian)
  /* phút cần học hôm nay: theo mốc thời gian người học chọn (G.planToday), chưa chọn mốc thì theo số phút đã đặt */
  function goalMin() {
    var pt = G.planToday && G.planToday();
    if (pt && !pt.xong && !pt.het) return pt.phut;
    return (G.S && G.S.caiDat && G.S.caiDat.phutNgay) || GOAL_MIN;
  }
  var TASKS = [
    { id: 'bai', icon: '🏫', ic3: 'school', name: 'Học bài ở trường', hint: 'Học, luyện hoặc kiểm tra một phòng', min: 45 },
    { id: 'doc', icon: '📖', ic3: 'book', name: 'Đọc 1 chương truyện', hint: 'Về nhà, mở góc đọc truyện', min: 25 },
    { id: 'noi', icon: '💬', ic3: 'talk', name: 'Nói chuyện ngoài phố', hint: 'Quán cà phê, chợ, bệnh viện hoặc đi xe buýt', min: 30 },
    { id: 'on', icon: '🔁', ic3: 'repeat', name: 'Ôn câu đã học', hint: 'Về nhà, ôn các câu sắp quên', min: 20 },
    { id: 'tu', icon: '📚', ic3: 'books', name: 'Học 10 từ theo chủ đề', hint: 'Từ đọc tin, công sở, kinh tế…', min: 10 }
  ];

  function today() {
    var k = G.vnDay(), n = G.S.ngay || (G.S.ngay = {});
    if (!n[k]) n[k] = { giay: 0, viec: {} };
    // chỉ giữ 60 ngày gần nhất
    var ks = []; for (var x in n) if (n.hasOwnProperty(x)) ks.push(x);
    if (ks.length > 60) { ks.sort(); delete n[ks[0]]; }
    return n[k];
  }
  G.today = today;

  /* đánh dấu xong một việc hôm nay */
  G.markTask = function (id) {
    var d = today();
    if (d.viec[id]) return;
    d.viec[id] = G.vnNow().slice(11, 16);
    G.save();
    var t = null; for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) t = TASKS[i];
    if (t) { G.toast('✅ Xong việc hôm nay: ' + t.name); if (G.sfx) G.sfx('quest'); }
    if (G.askAccount) G.askAccount();
    if (G.achSoon) G.achSoon();
    if (G.updateHud) G.updateHud();
  };

  /* tuần này (thứ Hai → Chủ nhật, giờ Việt Nam) đã học mấy ngày: ngày có học từ 10 phút hoặc xong một việc */
  G.weekStudy = function () {
    var dow = new Date(Date.now() + 7 * 3600000).getUTCDay(), mon = G.vnDay(Date.now() - ((dow + 6) % 7) * 86400000), today0 = G.vnDay(), n = 0, N = G.S.ngay || {};
    for (var k in N) if (N.hasOwnProperty(k) && k >= mon && k <= today0) { var r = N[k], v = 0; for (var t in r.viec) if (r.viec.hasOwnProperty(t)) v++; if (r.giay >= 600 || v) n++; }
    var want = (G.S.caiDat && G.S.caiDat.ngayTuan) || 5;
    return { n: n, want: want };
  };
  /* 7 ngày tuần này cho dải ngày ở bảng Hôm nay: ngày học theo lịch, ngày đã học, hôm nay */
  G.weekDots = function () {
    var dow = new Date(Date.now() + 7 * 3600000).getUTCDay(), off = (dow + 6) % 7, N = G.S.ngay || {}, out = [];
    var plan = G.studyDays ? G.studyDays() : [1, 2, 3, 4, 5];
    for (var i = 0; i < 7; i++) {
      var key = G.vnDay(Date.now() + (i - off) * 86400000), r = N[key], v = 0;
      if (r) for (var t in r.viec) if (r.viec.hasOwnProperty(t)) v++;
      out.push({ lb: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i], plan: plan.indexOf(i + 1) >= 0, done: !!(r && (r.giay >= 600 || v)), today: i === off, past: i < off });
    }
    return out;
  };
  /* lịch tháng (mẫu "calendar" của taste-skill): ngày đã học tô xanh, ngày học theo lịch có viền, hôm nay viền cam; chạm ngày xem đã học gì */
  G.monthCal = function () {
    var N = G.S.ngay || {}, now = G.vnParts(Date.now()), y = now.y, m = now.m, today = G.vnDay();
    var first = Date.parse(y + '-' + (m < 10 ? '0' : '') + m + '-01T12:00:00+07:00'), dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    var lead = (new Date(first + 7 * 3600000).getUTCDay() + 6) % 7, plan = G.studyDays ? G.studyDays() : [1, 2, 3, 4, 5];
    var info = G.el('div.mc-info', 'Chạm một ngày để xem đã học gì.'), cells = [], studied = 0, i;
    ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach(function (d) { cells.push(G.el('span.mc-dow', d)); });
    for (i = 0; i < lead; i++) cells.push(G.el('span.mc-pad'));
    for (i = 1; i <= dim; i++) (function (dd) {
      var key = y + '-' + (m < 10 ? '0' : '') + m + '-' + (dd < 10 ? '0' : '') + dd, r = N[key], v = 0, t;
      if (r) for (t in r.viec) if (r.viec.hasOwnProperty(t)) v++;
      var done = !!(r && (r.giay >= 600 || v)), dow = (lead + dd - 1) % 7 + 1, sched = plan.indexOf(dow) >= 0;
      if (done) studied++;
      cells.push(G.el('button.mc-d' + (done ? '.done' : '') + (sched && !done && key < today ? '.miss' : '') + (sched && key >= today && !done ? '.plan' : '') + (key === today ? '.today' : ''),
        { 'aria-label': dd + '/' + m + (done ? ', đã học' : sched ? ', ngày học' : ', ngày nghỉ'), onclick: function () {
          info.textContent = dd + '/' + m + ': ' + (r ? Math.round((r.giay || 0) / 60) + ' phút, ' + v + ' việc' : key > today ? (sched ? 'ngày học theo lịch' : 'ngày nghỉ') : 'chưa học');
        } }, String(dd)));
    })(i);
    return G.el('div.mc', G.el('div.mc-h', G.el('b', 'Tháng ' + m + '/' + y), G.el('span', studied + ' ngày đã học')), G.el('div.mc-grid', cells), info);
  };
  /* phút học 14 ngày gần nhất (mẫu "stat" của taste-skill): một con số lớn, so với tuần trước, 14 cột, cột hôm nay màu cam */
  G.studyChart = function () {
    var N = G.S.ngay || {}, mins = [], i;
    for (i = 13; i >= 0; i--) { var r = N[G.vnDay(Date.now() - i * 86400000)]; mins.push(r ? Math.round((r.giay || 0) / 60) : 0); }
    var wk = 0, prev = 0; for (i = 0; i < 7; i++) { prev += mins[i]; wk += mins[i + 7]; }
    var mx = Math.max.apply(null, mins.concat([20])), big = G.el('b', '0');
    var chg = prev ? Math.round((wk - prev) / prev * 100) : null;
    var bars = G.el('div.sc-bars', mins.map(function (m, k) { var c = G.el('i' + (k === 13 ? '.today' : '')); c.style.transform = 'scaleY(' + Math.max(0.04, m / mx) + ')'; return G.el('span', { title: m + ' phút' }, c); }));
    G.countUp(big, 0, wk, { dur: 900, delay: 150 });
    if (window.anime && !G.calm()) window.anime({ targets: bars.querySelectorAll('i'), scaleY: function (el) { var v = parseFloat(el.style.transform.replace(/[^\d.]/g, '')) || 0.04; return [0.04, v]; }, delay: window.anime.stagger(35, { start: 200 }), duration: 700, easing: 'easeOutCubic' });
    return G.el('div.sc-card',
      G.el('div.sc-h', G.el('span', 'Phút học 7 ngày qua'), G.el('span.small.faint', '14 ngày gần nhất')),
      G.el('div.sc-n', big, G.el('span', 'phút'), chg === null ? null : G.el('span.sc-chg' + (chg >= 0 ? '.up' : '.down'), (chg >= 0 ? '+' : '') + chg + '% so với tuần trước')),
      bars,
      G.el('div.sc-ax', G.el('span', G.vnDay(Date.now() - 13 * 86400000).split('-').reverse().slice(0, 2).join('/')), G.el('span', 'Hôm nay')));
  };
  /* % hôm nay: một nửa theo số việc xong, một nửa theo phút học / 120 */
  G.dayProgress = function () {
    var d = today(), done = 0;
    for (var i = 0; i < TASKS.length; i++) if (d.viec[TASKS[i].id]) done++;
    var mins = Math.floor(d.giay / 60);
    var gm = goalMin(), pct = Math.min(100, Math.round(((done / TASKS.length) + Math.min(1, mins / gm)) / 2 * 100));
    return { done: done, all: TASKS.length, mins: mins, goal: gm, pct: pct };
  };

  /* ---------- Nhiệm vụ hôm nay (kiểu "daily quests" của Duolingo): 5 việc, việc nào cũng có nút Làm ngay mở thẳng tới đúng chỗ,
     xong cả 5 thì mở rương +30 XP. Dùng ở Sảnh, bảng Hôm nay và ô nhiệm vụ ngoài phố (G.updateHud). ---------- */
  var CHEST_XP = 30;
  function hintOf(t) {
    if (t.id === 'bai') { var nl = G.nextLesson && G.nextLesson(); return nl ? nl.label + (nl.teacher ? ' với ' + nl.teacher : '') : t.hint; }
    if (t.id === 'noi') { var lf = G.nextLifeId && G.nextLifeId(), L = lf && G.LIFE[lf]; return L ? L.title + ' · nói với ' + ((G.NPCS[L.npc] || {}).name || '') : t.hint; }
    if (t.id === 'on') { var n = G.srsDue ? G.srsDue().length : 0; return n ? n + ' câu đến hạn ôn' : 'Ôn thêm 5 câu bất kỳ'; }
    if (t.id === 'tu') { var tp = G.topicNext && G.topicNext(); return tp ? tp.name + ' · 10 từ mới' : t.hint; }
    return 'Truyện song ngữ, bấm câu để xem nghĩa';
  }
  G.questHint = function (id) { for (var i = 0; i < TASKS.length; i++) if (TASKS[i].id === id) return hintOf(TASKS[i]); return ''; };
  G.QUESTS = TASKS;
  G.questAct = function (id) {
    if (id === 'bai') { var nl = G.nextLesson && G.nextLesson(); if (nl && G.openLesson) G.openLesson(nl.id); else G.toast('Đã học hết các phòng đang mở. Ôn lại một phòng bất kỳ ở trường nhé.'); }
    else if (id === 'doc') G.openReader();
    else if (id === 'noi') { var lf = G.nextLifeId && G.nextLifeId(); if (lf && G.openLife) G.openLife(lf); else G.toast('Ra phố gặp người có bong bóng chat trên đầu nhé.'); }
    else if (id === 'on') G.openReview();
    else if (id === 'tu' && G.openTopics) G.openTopics();
  };
  /* biểu tượng 5 nhiệm vụ: xong thì sáng màu */
  G.questIcons = function (cls) {
    var d = today();
    return TASKS.map(function (t) { return G.el('span.qi' + (d.viec[t.id] ? '.on' : '') + (cls ? '.' + cls : ''), { title: t.name }, G.ic3(t.ic3)); });
  };
  G.claimChest = function () {
    var d = today(); if (d.ruong) return false;
    var p = G.dayProgress(); if (p.done < p.all) return false;
    d.ruong = G.vnNow().slice(11, 16); G.save(); G.addXp(CHEST_XP);
    if (G.sfx) G.sfx('chest');
    if (G.chestPop) G.chestPop(CHEST_XP); else { if (G.confetti) G.confetti(); G.toast('🎉 Mở rương hôm nay: +' + CHEST_XP + ' XP'); }
    if (G.updateHud) G.updateHud();
    return true;
  };
  /* danh sách nhiệm vụ: o.noSeal = không tô cam (Sảnh đã có thẻ Bắt đầu từ đây tô cam) */
  G.questList = function (o) {
    o = o || {};
    var wrap = G.el('div.qs');
    function draw() {
      var d = today(), p = G.dayProgress(), first = null;
      for (var i = 0; i < TASKS.length; i++) if (!d.viec[TASKS[i].id]) { first = TASKS[i].id; break; }
      wrap.innerHTML = '';
      var bar = G.el('i'); bar.style.transform = 'scaleX(' + (p.done / p.all) + ')';
      wrap.appendChild(G.el('div.qs-h',
        G.el('div.qs-ht', G.el('b', 'Nhiệm vụ hôm nay'), G.el('span', p.done + '/' + p.all + ' xong · ' + p.mins + '/' + p.goal + ' phút học')),
        o.more ? G.el('button.btn.sm.ghost', { onclick: G.openToday }, 'Chi tiết ›') : null));
      wrap.appendChild(G.el('span.qs-bar', bar));
      wrap.appendChild(G.el('div.qs-list', TASKS.map(function (t) {
        var ok = !!d.viec[t.id];
        return G.el('div.qs-row' + (ok ? '.ok' : ''),
          G.el('span.qs-ic', G.ic3(t.ic3), ok ? G.el('i.qs-tick', G.ic3('check')) : null),
          G.el('div.qs-txt', G.el('b', t.name), G.el('span', ok ? 'Xong lúc ' + d.viec[t.id] : hintOf(t) + ' · khoảng ' + t.min + ' phút')),
          ok ? G.el('span.qs-done', 'Xong') : G.el('button.btn.sm' + (!o.noSeal && t.id === first ? '.seal' : ''), { onclick: function () { G.questAct(t.id); } }, 'Làm ngay'));
      })));
      // rương: xong cả 5 nhiệm vụ thì mở được
      if (d.ruong) wrap.appendChild(G.el('div.qs-chest.got', G.lottieIc ? G.lottieIc('trophy', 'ic3') : G.ic3('trophy'), G.el('div', G.el('b', 'Đã mở rương hôm nay · +' + CHEST_XP + ' XP'), G.el('span', 'Mai có 5 nhiệm vụ mới.'))));
      else if (p.done >= p.all) wrap.appendChild(G.el('button.big.bic.qs-chest.ready' + (o.noSeal ? '' : '.seal'), { onclick: function () { if (G.claimChest()) { draw(); if (o.onChange) o.onChange(); } } },
        G.lottieIc ? G.lottieIc('gift', 'ic3', { loop: true }) : G.ic3('gift'), G.el('b', 'Mở rương hôm nay'), G.el('span', '+' + CHEST_XP + ' XP thưởng vì xong cả ' + p.all + ' nhiệm vụ')));
      else wrap.appendChild(G.el('div.qs-chest', G.ic3('gift'), G.el('div', G.el('b', 'Rương hôm nay +' + CHEST_XP + ' XP'), G.el('span', 'Còn ' + (p.all - p.done) + ' nhiệm vụ nữa là mở được.'))));
      G.enter(wrap.querySelectorAll('.qs-row'), { gap: 55, y: 8, dur: 320 });
    }
    draw();
    return wrap;
  };

  /* đếm thời gian học thật */
  var lastInput = Date.now();
  function touch() { lastInput = Date.now(); }
  window.addEventListener('pointerdown', touch, true);
  window.addEventListener('keydown', touch, true);
  window.addEventListener('touchstart', touch, true);
  setInterval(function () {
    if (!G.S || !G.S.nhanVat) return;
    if (document.visibilityState && document.visibilityState !== 'visible') return;
    if (Date.now() - lastInput > 60000) return;
    var d = today(), before = Math.floor(d.giay / 60);
    d.giay += 10;
    G.save();
    if (Math.floor(d.giay / 60) !== before && G.updateHud) G.updateHud();
  }, 10000);

  /* ---------- bảng "Hôm nay" ---------- */
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
  G.openToday = function () {
    var body = panelOpen('Hôm nay · ' + G.vnDay().split('-').reverse().join('/'));
    var p = G.dayProgress(), d = today();
    var ringN = G.el('b', p.pct + '%'), ring = G.el('div.td-ring', ringN);
    ring.style.setProperty('--p', p.pct);
    // vòng % hôm nay quét từ 0 tới giá trị
    if (window.anime && !G.calm() && p.pct > 0) {
      var rv = { v: 0 }; ring.style.setProperty('--p', 0); ringN.textContent = '0%';
      window.anime({ targets: rv, v: p.pct, delay: 150, duration: 1100, easing: 'easeOutExpo', update: function () { ring.style.setProperty('--p', rv.v); ringN.textContent = Math.round(rv.v) + '%'; } });
    }
    var fire = G.S.chuoi.hienTai > 0 && G.lottieIc ? G.lottieIc('fire', 'td-fire', { loop: true }) : G.ic3('fire', 'td-fire'), sn = G.el('b.td-sn', String(G.S.chuoi.hienTai));
    body.appendChild(G.el('div.td-head', ring,
      G.el('div.td-txt', G.el('b', p.mins + ' / ' + p.goal + ' phút'), G.el('div.small.faint', p.done + '/' + p.all + ' việc hôm nay')),
      G.el('div.td-streak', fire, G.el('div', sn, G.el('span', 'ngày học liên tiếp')))));
    // nhiệm vụ hôm nay ngay dưới vòng %: việc cần làm là trung tâm của bảng
    body.appendChild(G.questList({ onChange: function () { G.openToday(); } }));
    var wk = G.weekStudy();
    var rest = G.isStudyDay && !G.isStudyDay();
    if (G.planLine) body.appendChild(G.el('div.td-plan', G.el('b.td-plan-h', G.ic3((G.goalOf() && G.goalOf().ic3) || 'calendar'), 'Tiến độ theo mốc'), G.el('div.small', G.planLine()),
      G.el('div.td-days', G.weekDots().map(function (d) { return G.el('span' + (d.plan ? '.plan' : '') + (d.done ? '.done' : '') + (d.today ? '.today' : '') + (d.past && d.plan && !d.done ? '.miss' : ''), d.lb); })),
      G.el('div.small', 'Tuần này đã học ' + wk.n + '/' + wk.want + ' ngày' + (wk.n >= wk.want ? ': đủ rồi, học thêm là vượt tiến độ.' : rest ? '. Hôm nay là ngày nghỉ theo lịch, học thêm vẫn được tính.' : '. Ngày nghỉ trong lịch không đứt chuỗi.')),
      G.S.mocHoc ? null : G.el('button.btn.sm', { onclick: function () { G.goLobby && G.goLobby(); } }, 'Chọn mốc ở Sảnh')));
    if (G.rankCard) body.appendChild(G.rankCard());
    // danh sách việc hôm nay (mẫu "checklist" của taste-skill): thanh tiến độ, việc xong có dấu tick và gạch ngang
    if (G.openMemMap) body.appendChild(G.el('button.big.bic.td-mm', { onclick: function () { G.openMemMap(); } }, G.bigIc('brain', 'Bản đồ nhớ từ'),
      G.el('span', G.srsDue ? (G.srsDue().length ? G.srsDue().length + ' câu đến hạn ôn · xem buổi nào sắp quên' : 'Xem buổi nào nhớ chắc, buổi nào sắp quên') : '')));
    // kiểm tra tuần + sổ mình nói được
    if (G.openWeekly) body.appendChild(G.el('div.td-week',
      G.el('button.big.bic' + (G.weeklyInfo().due ? '.seal' : ''), { onclick: G.openWeekly }, G.bigIc('memo', 'Kiểm tra tuần'), G.el('span', weekLine())),
      G.el('button.big.bic', { onclick: G.openCanDo }, G.bigIc('speak', 'Mình nói được'), G.el('span', G.canDoStats().n + '/' + G.canDoStats().total + ' việc'))));
    if (G.monthCal) body.appendChild(G.monthCal());
    // các cuộc nói chuyện hôm nay
    var ht = d.hoiThoai || [];
    body.appendChild(G.el('div.td-talks',
      G.el('b', G.ic3('talk', 'ic3-s'), 'Nói chuyện hôm nay · ' + ht.length + ' tình huống'),
      ht.length ? G.el('div.td-talk-list', ht.slice().reverse().map(function (h) {
        return G.el('div.td-talk', G.el('span.small.faint', h.luc), G.el('span', h.ten + ' · ' + h.tinhHuong), h.diem !== null && h.diem !== undefined ? G.el('span.mk-chip.' + G.scoreLabel(h.diem)[1], '🎤 ' + h.diem) : G.el('span.small.faint', 'không micro'));
      })) : G.el('div.small.faint', 'Chưa nói chuyện với ai hôm nay. Ra phố gặp mẹ, ông Ben, xe bánh Sunny… (người có 💬 trên đầu).')));
    // luyện nói: điểm hôm nay + bật/tắt micro
    var sp = d.noi && d.noi.n ? Math.round(d.noi.tong / d.noi.n) : null;
    var micBox = G.el('div.td-mic');
    function drawMic() {
      micBox.innerHTML = '';
      var on = G.micOn();
      micBox.appendChild(G.el('div.td-txt', G.el('b.td-mic-h', G.el('img.mk-ic', { src: G.assetUrl('ic_mic_ok.png'), alt: '' }), 'Luyện nói'),
        G.el('div.small.faint', sp !== null ? 'Hôm nay nói ' + d.noi.n + ' câu · điểm trung bình ' + sp + '/100 · ' + G.scoreLabel(sp)[0]
          : on ? 'Micro đang bật: nói câu trong bài học và ngoài phố, máy chấm 0–100 (chấm vừa phải).'
          : 'Đang học không micro: nghe mẫu rồi nhắc lại to, tự bấm "đã nói xong".')));
      micBox.appendChild(G.el('div.td-seg',
        G.el('button' + (on ? '.on' : ''), { onclick: function () { if (!G.canListen) { G.toast('Máy này chưa nghe được giọng nói. Trên iPhone/iPad hãy mở bằng Safari và bật Siri.'); return; } G.setMic(true); drawMic(); } }, G.el('img.mk-ic', { src: G.assetUrl('ic_mic.png'), alt: '' }), 'Dùng micro'),
        G.el('button' + (!on ? '.on' : ''), { onclick: function () { G.setMic(false); drawMic(); } }, G.el('img.mk-ic', { src: G.assetUrl('ic_lips.png'), alt: '' }), 'Không dùng micro')));
    }
    drawMic();
    body.appendChild(micBox);
    body.appendChild(G.el('p.small.faint', 'Làm đủ ' + p.all + ' nhiệm vụ và học đủ ' + p.goal + ' phút là tròn vòng hôm nay, đúng tiến độ theo mốc. Ngoài phố, thanh Việc tiếp theo luôn chỉ chỗ cần đến.'));
    // chuyển động khi mở bảng: ngọn lửa bật lên, số chuỗi chạy, 7 ngày và 4 việc hiện lần lượt
    G.pop(fire, 120);
    G.countUp(sn, 0, G.S.chuoi.hienTai, { delay: 250, dur: 700 });
    G.enter(body.querySelectorAll('.td-days span'), { gap: 45, start: 200, y: 10 });
  };

  function weekLine() {
    if (!G.weeklyInfo) return '';
    var w = G.weeklyInfo();
    return w.last ? (w.due ? 'Đến hạn! ' : '') + 'Lần trước ' + w.last.tong + '/100 · ' + (w.days === 0 ? 'hôm nay' : w.days + ' ngày trước') : 'Nghe · Đọc · Nói tự do, khoảng 15 phút';
  }
  G.weekLine = weekLine;
  /* ---------- Nhà của bạn: góc học ---------- */
  G.openHome = function () {
    var body = panelOpen('Nhà của bạn');
    var d = today(), n = G.S.tuKho.length;
    var momDone = !!(d.sang && d.sang['en-home']);
    // chỉ tô cam một việc nên làm tiếp (taste-skill: một nút chính mỗi màn)
    var wkDue = !!(G.weeklyInfo && G.weeklyInfo().due);
    var next = G.LIFE['en-home'] && !momDone ? 'me' : !d.viec.doc ? 'doc' : !d.viec.on ? 'on' : wkDue ? 'wk' : '';
    function hl(k) { return next === k ? '.seal' : ''; }
    body.appendChild(G.el('div.menu3',
      G.LIFE['en-home'] ? G.el('button.big.bic' + (momDone ? '.done' : hl('me')), { onclick: function () { G.openLife('en-home'); } },
        G.bigIc(momDone ? 'check' : 'talk', 'Nói chuyện với mẹ'), G.el('span', 'Buổi sáng ở nhà: thức dậy, ăn sáng, chuẩn bị đi học')) : null,
      G.el('button.big.bic' + (d.viec.doc ? '.done' : hl('doc')), { onclick: G.openReader }, G.bigIc(d.viec.doc ? 'check' : 'book', 'Đọc truyện'), G.el('span', 'Truyện song ngữ theo cấp, bấm câu để xem nghĩa, nghe giọng đọc')),
      G.el('button.big.bic' + (d.viec.on ? '.done' : hl('on')), { onclick: G.openReview }, G.bigIc(d.viec.on ? 'check' : 'repeat', 'Ôn câu đã học'), G.el('span', G.srsDue ? (G.srsDue().length ? G.srsDue().length + ' câu đến hạn ôn hôm nay' : 'Không có câu đến hạn · ôn thêm tuỳ ý') : '')),
      G.el('button.big.bic' + hl('wk'), { onclick: G.openWeekly }, G.bigIc('memo', 'Kiểm tra tuần'), G.el('span', weekLine())),
      G.el('button.big.bic', { onclick: G.openCanDo }, G.bigIc('speak', 'Mình nói được'), G.el('span', G.canDoStats ? G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được bằng tiếng Anh' : '')),
      G.el('button.big.bic', { onclick: G.openToday }, G.bigIc('calendar', 'Kế hoạch hôm nay'), G.el('span', G.dayProgress().done + '/' + G.dayProgress().all + ' việc · ' + G.dayProgress().mins + ' phút')),
      G.openTopics ? G.el('button.big.bic', { onclick: G.openTopics }, G.bigIc('books', 'Từ theo chủ đề'), G.el('span', G.topicTotals().got + '/' + G.topicTotals().all + ' từ đọc tin, công sở, kinh tế…')) : null));
  };

  /* ---------- Đọc truyện ---------- */
  var IDX = null;
  function loadIndex(cb) {
    if (IDX) { cb(IDX); return; }
    fetch('../data/stories/index.json').then(function (r) { return r.json(); }).then(function (j) {
      var order = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
      // hiện tất cả truyện tiếng Anh, xếp theo kệ (Brightford 2080 đầu tiên), trong kệ theo cấp
      IDX = j.filter(function (s) { return s.lang === 'en'; });
      IDX.sort(function (a, b) { return (shelfRank(a) * 10 + (order[a.level] || 9)) - (shelfRank(b) * 10 + (order[b.level] || 9)); });
      cb(IDX);
    }).catch(function () { G.toast('Chưa tải được kho truyện. Mở khi có mạng một lần nhé.'); });
  }
  var SHELF = ['future', 'ai', 'true', 'mystery', 'news', 'essay', 'long'];
  var SHELF_NAME = { future: 'Brightford 2080 · vấn đề xã hội tương lai', ai: 'Chuyện về AI', true: 'Chuyện có thật', mystery: 'Bí ẩn chưa có lời giải', news: 'Tin tức 2025–2026', essay: 'Bài luận B2 · kỹ năng sống', long: 'Truyện dài' };
  function shelfRank(s) { var i = SHELF.indexOf(s.shelf); return i < 0 ? SHELF.length : i; }
  function readN(id) { return (G.S.truyen && G.S.truyen[id]) || 0; }
  G.openReader = function () {
    var body = panelOpen('📖 Đọc truyện');
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    loadIndex(function (list) {
      body.innerHTML = '';
      // gợi ý: truyện đang đọc dở, không có thì truyện dễ nhất chưa đọc
      var next = null;
      for (var i = 0; i < list.length && !next; i++) { var r = readN(list[i].id); if (r > 0 && r < list[i].chapters.length) next = list[i]; }
      for (var j = 0; j < list.length && !next; j++) if (readN(list[j].id) < list[j].chapters.length) next = list[j];
      if (next) body.appendChild(G.el('button.big.bic.seal.rd-next', { onclick: function () { chapter(next, readN(next.id)); } },
        G.bigIc('book', 'Đọc tiếp: ' + next.title), G.el('span', next.vi + ' · chương ' + (readN(next.id) + 1) + '/' + next.chapters.length + ' · ' + next.level)));
      var lv = '';
      list.forEach(function (s) {
        var grp = s.shelf || 'long';
        if (grp !== lv) { lv = grp; body.appendChild(G.el('h3.rd-lv', SHELF_NAME[grp] || 'Truyện khác')); }
        var r = readN(s.id);
        // thẻ truyện nền trắng có tranh bìa (taste-skill: tranh thật dẫn dắt, chỉ "Đọc tiếp" nổi bật)
        var cover = G.el('img.rd-cover', { src: '../img/covers/' + s.id + '.webp', alt: '', loading: 'lazy', onerror: function () { this.style.display = 'none'; if (this.parentNode) this.parentNode.className += ' no-cover'; } });
        body.appendChild(G.el('button.rd-story', { onclick: function () { chapter(s, Math.min(r, s.chapters.length - 1)); } },
          cover,
          G.el('span.rd-txt', G.el('b', s.title), G.el('span.small.faint', s.vi + ' · ' + s.level + ' · ' + s.chapters.length + ' chương'),
            s.blurb ? G.el('span.small.rd-blurb', s.blurb) : null,
            r ? G.el('span.rd-prog', r >= s.chapters.length ? 'Đã đọc xong' : 'Đã đọc ' + r + '/' + s.chapters.length + ' chương') : null)));
      });
    });
  };
  function chapter(s, k) {
    var body = panelOpen('📖 ' + s.title);
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    fetch('../data/stories/' + s.id + '.json').then(function (r) { return r.json(); }).then(function (full) {
      var ch = full.chapters[k];
      body.innerHTML = '';
      body.appendChild(G.el('div.lhead', G.el('div.lsub', 'Chương ' + ch.n + '/' + full.chapters.length + ' · ' + ch.title + ' · ' + (ch.vi || '') + ' · bấm câu để nghe')));
      // tốc độ đọc: thường / chậm (nhớ cho lần sau)
      var cd = G.S.caiDat || (G.S.caiDat = {});
      var spd = G.el('div.td-seg.rd-speed');
      function drawSpd() {
        spd.innerHTML = '';
        spd.appendChild(G.el('button' + (!cd.docCham ? '.on' : ''), { onclick: function () { cd.docCham = false; G.save(); drawSpd(); } }, '🔊 Tốc độ thường'));
        spd.appendChild(G.el('button' + (cd.docCham ? '.on' : ''), { onclick: function () { cd.docCham = true; G.save(); drawSpd(); } }, '🐢 Đọc chậm'));
      }
      drawSpd(); body.appendChild(spd);
      // hiện / ẩn nghĩa tiếng Việt (mặc định hiện, nhớ cho lần sau)
      var viBtn = G.el('button.btn.sm.rd-vibtn', { onclick: function () { cd.anNghia = !cd.anNghia; G.save(); applyVi(); } });
      function applyVi() { body.className = 'panel-body' + (cd.anNghia ? ' rd-hidevi' : ''); viBtn.textContent = cd.anNghia ? '👀 Hiện nghĩa tiếng Việt' : '🙈 Ẩn nghĩa (tự đọc)'; }
      body.appendChild(viBtn); applyVi();
      (ch.paras || []).forEach(function (para) {
        body.appendChild(G.el('div.rd-para', para.map(function (ln) {
          // nghĩa tiếng Việt luôn hiện ngay dưới câu (ẩn được bằng nút "Ẩn nghĩa" để tự luyện đọc); bấm câu để nghe
          var vi = G.el('div.rd-vi.show', ln[1]);
          return G.el('div.rd-line', { onclick: function () { G.say(ln[0], 'en', !!(G.S.caiDat && G.S.caiDat.docCham)); } }, G.el('span', ln[0]), vi);
        })));
      });
      if (ch.vocab && ch.vocab.length) body.appendChild(G.el('div.rd-box',
        G.el('b', '📝 Từ đáng nhớ'),
        G.el('div.rd-vocab', ch.vocab.map(function (v) { return G.el('button.rd-w', { onclick: function () { G.say(v[0], 'en', !!(G.S.caiDat && G.S.caiDat.docCham)); } }, G.el('b', v[0]), ' · ' + v[1]); }))));
      if (ch.think && ch.think.length) body.appendChild(G.el('div.rd-box.think',
        G.el('b', '💭 Suy ngẫm'),
        G.el('ol', ch.think.map(function (q) { return G.el('li', q); })),
        G.el('div.small.faint', 'Nghĩ hoặc nói to câu trả lời bằng tiếng Việt, rồi thử nói một câu bằng tiếng Anh.')));
      body.appendChild(G.el('div.row',
        G.el('button.btn', { onclick: G.openReader }, '‹ Kho truyện'),
        G.el('button.btn.seal', { onclick: function () {
          G.S.truyen = G.S.truyen || {};
          if ((G.S.truyen[s.id] || 0) <= k) { G.S.truyen[s.id] = k + 1; G.addXp(10); }
          G.markStudy(); G.markTask('doc'); G.sfx('done');
          if (k + 1 < full.chapters.length) chapter(s, k + 1); else { G.confetti(); G.openReader(); }
        } }, k + 1 < full.chapters.length ? 'Đọc xong · chương sau ›' : 'Đọc xong truyện 🎉')));
      body.scrollTop = 0;
    }).catch(function () { body.innerHTML = ''; body.appendChild(G.el('p', 'Chưa tải được chương này. Thử lại khi có mạng.')); });
  }

  /* Ôn câu đã học: xem js/practice.js (G.openReview) */
})();
