/* Hôm nay: kế hoạch học mỗi ngày (theo mốc thời gian người học chọn; chưa chọn mốc thì 40 phút) gom hết vào game.
   5 việc: Học bài ở trường · Đọc truyện ở nhà · Nói chuyện ngoài phố · Ôn từ khó ở nhà · Học 10 từ theo chủ đề.
   Đếm phút học thật (trang đang mở và có thao tác trong 60 giây gần nhất), theo giờ Việt Nam.
   Nhà của bạn = góc học: đọc truyện song ngữ (kho truyện của app) và ôn từ khó. */
var G = window.G || (window.G = {});

(function () {
  var GOAL_MIN = 40;    // chưa chọn mốc thời gian: 40 phút, khớp với thẻ Kế hoạch ("Chặng đường đang ước tính theo 40 phút mỗi ngày", G.goalCard)
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
  /* tiếng Trung (hồ sơ riêng, save.js): chưa có bản đồ Trường Lạc trấn nên Nói là nói chuyện với người dân ở nơi đã mở
     (data/life_zh.js, mở từ Sảnh), chưa mở nơi nào thì nói theo 5 câu đã học (G.zhSpeakQuest trong zh.js) */
  var TASKS_ZH = [
    { id: 'bai', ic3: 'school', name: 'Học bài ở Học viện Hán ngữ', hint: 'Học, luyện hoặc kiểm tra một phòng', min: 30 },
    { id: 'noi', ic3: 'talk', name: 'Nói chuyện bằng tiếng Trung', hint: 'Nghe câu mẫu rồi nói theo, máy chấm từng chữ và thanh', min: 15 },
    { id: 'on', ic3: 'repeat', name: 'Ôn câu đã học', hint: 'Ôn các câu sắp quên', min: 15 },
    { id: 'doc', ic3: 'book', name: 'Đọc 1 chương truyện', hint: 'Truyện tiếng Trung có pinyin và nghĩa', min: 20 },
    { id: 'viet', ic3: 'pencil', name: 'Viết 5 chữ Hán', hint: 'Xem nét, tô theo rồi tự viết từng nét', min: 10 }
  ];
  function tasks() { return G.lang && G.lang() === 'zh' ? TASKS_ZH : TASKS; }

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
    if (G.track) G.track('nhiem_vu', { id: id });
    var t = null; for (var i = 0; i < tasks().length; i++) if (tasks()[i].id === id) t = tasks()[i];
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
  /* % hôm nay: một nửa theo số việc xong, một nửa theo phút học / phút cần học hôm nay (goalMin) */
  G.dayProgress = function () {
    var d = today(), done = 0;
    for (var i = 0; i < tasks().length; i++) if (d.viec[tasks()[i].id]) done++;
    var mins = Math.floor(d.giay / 60);
    var gm = goalMin(), pct = Math.min(100, Math.round(((done / tasks().length) + Math.min(1, mins / gm)) / 2 * 100));
    return { done: done, all: tasks().length, mins: mins, goal: gm, pct: pct };
  };

  /* ---------- Nhiệm vụ hôm nay (kiểu "daily quests" của Duolingo): 5 việc, việc nào cũng có nút Làm ngay mở thẳng tới đúng chỗ,
     xong cả 5 thì mở rương +30 XP. Dùng ở Sảnh, bảng Hôm nay và ô nhiệm vụ ngoài phố (G.updateHud). ---------- */
  var CHEST_XP = 30;
  function hintOf(t) {
    if (t.id === 'bai') { var nl = G.nextLesson && G.nextLesson(); return nl ? nl.label + (nl.teacher ? ' với ' + nl.teacher : '') : t.hint; }
    if (t.id === 'noi' && G.lang() === 'zh') { var zl = G.zhNextLife && G.zhNextLife(), ZL = zl && G.LIFE[zl]; return ZL ? ZL.title + ' · nói với ' + ((G.NPCS[ZL.npc] || {}).name || '') : t.hint; }
    if (t.id === 'noi') { var lf = G.nextLifeId && G.nextLifeId(), L = lf && G.LIFE[lf]; return L ? L.title + ' · nói với ' + ((G.NPCS[L.npc] || {}).name || '') : t.hint; }
    if (t.id === 'on') { var n = G.srsDue ? G.srsDue().length : 0; return n ? n + ' câu đến hạn ôn' : 'Ôn thêm 5 câu bất kỳ'; }
    if (t.id === 'tu') { var tp = G.topicNext && G.topicNext(); return tp ? tp.name + ' · 10 từ mới' : t.hint; }
    return G.lang() === 'zh' ? t.hint : 'Truyện song ngữ, bấm câu để xem nghĩa';
  }
  G.questHint = function (id) { for (var i = 0; i < tasks().length; i++) if (tasks()[i].id === id) return hintOf(tasks()[i]); return ''; };
  Object.defineProperty(G, 'QUESTS', { configurable: true, get: tasks });   // nhiệm vụ theo thứ tiếng đang học
  G.questAct = function (id) {
    if (id === 'bai') { var nl = G.nextLesson && G.nextLesson(); if (nl && G.openLesson) G.openLesson(nl.id); else G.toast('Đã học hết các phòng đang mở. Ôn lại một phòng bất kỳ ở trường nhé.'); }
    else if (id === 'doc') G.openReader();
    else if (id === 'noi' && G.lang() === 'zh') { if (G.zhSpeakQuest) G.zhSpeakQuest(); }
    else if (id === 'viet') { if (G.openWriteToday) G.openWriteToday(); }
    else if (id === 'noi') { var lf = G.nextLifeId && G.nextLifeId(); if (lf && G.openLife) G.openLife(lf); else G.toast('Ra phố gặp người có bong bóng chat trên đầu nhé.'); }
    else if (id === 'on') G.openReview();
    else if (id === 'tu') { var tn = G.topicNext && G.topicNext(); if (tn && G.topicLearn) G.topicLearn(tn.id); else if (G.openTopics) G.openTopics(); }
  };
  /* biểu tượng 5 nhiệm vụ: xong thì sáng màu */
  G.questIcons = function (cls) {
    var d = today();
    return tasks().map(function (t) { return G.el('span.qi' + (d.viec[t.id] ? '.on' : '') + (cls ? '.' + cls : ''), { title: t.name }, G.ic3(t.ic3)); });
  };
  G.claimChest = function () {
    var d = today(); if (d.ruong) return false;
    var p = G.dayProgress(); if (p.done < p.all) return false;
    d.ruong = G.vnNow().slice(11, 16); G.save(); G.addXp(CHEST_XP);
    if (G.sfx) G.sfx('chest');
    if (G.chestPop) G.chestPop(CHEST_XP); else G.toast('Mở rương hôm nay: +' + CHEST_XP + ' XP');
    if (G.updateHud) G.updateHud();
    return true;
  };
  /* danh sách nhiệm vụ: o.noSeal = không tô cam (Sảnh đã có thẻ Bắt đầu từ đây tô cam) */
  G.questList = function (o) {
    o = o || {};
    var wrap = G.el('div.qs');
    function draw() {
      var d = today(), p = G.dayProgress(), first = null;
      for (var i = 0; i < tasks().length; i++) if (!d.viec[tasks()[i].id]) { first = tasks()[i].id; break; }
      wrap.innerHTML = '';
      var bar = G.el('i'); bar.style.transform = 'scaleX(' + (p.done / p.all) + ')';
      wrap.appendChild(G.el('div.qs-h',
        G.el('div.qs-ht', G.el('b', 'Nhiệm vụ hôm nay'), G.el('span', p.done + '/' + p.all + ' xong · ' + p.mins + '/' + p.goal + ' phút học')),
        o.more ? G.el('button.btn.sm.ghost', { onclick: G.openToday }, 'Chi tiết ›') : null));
      wrap.appendChild(G.el('span.qs-bar', bar));
      wrap.appendChild(G.el('div.qs-list', tasks().map(function (t) {
        var ok = !!d.viec[t.id];
        return G.el('div.qs-row' + (ok ? '.ok' : ''),
          G.el('span.qs-ic', G.ic3(t.ic3), ok ? G.el('i.qs-tick', G.ic3('check')) : null),
          G.el('div.qs-txt', G.el('b', t.name), G.el('span', ok ? 'Xong lúc ' + d.viec[t.id] : hintOf(t) + ' · khoảng ' + t.min + ' phút')),
          ok ? G.el('span.qs-done', 'Xong') : G.el('button.btn.sm' + (!o.noSeal && t.id === first ? '.seal' : ''), { onclick: function () { G.questAct(t.id); } }, 'Làm ngay'));
      })));
      // rương: xong cả 5 nhiệm vụ thì mở được
      if (d.ruong) wrap.appendChild(G.el('div.qs-chest.got', G.lottieIc ? G.lottieIc('trophy', 'ic3') : G.ic3('trophy'), G.el('div', G.el('b', 'Đã mở rương hôm nay · +' + CHEST_XP + ' XP'), G.el('span', 'Mai có ' + p.all + ' nhiệm vụ mới.'))));
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
      G.el('div.td-streak', fire, G.el('div', sn, G.el('span', 'ngày học liên tiếp'),
        G.el('span.td-freeze', { title: 'Mỗi 7 ngày học liên tiếp được 1 băng (giữ tối đa 2). Lỡ một ngày học, băng tự giữ chuỗi.' }, G.ic3('ice', 'ic3-s'), (G.S.chuoi.bang || 0) + ' băng giữ chuỗi')))));
    body.appendChild(G.el('div.small.faint.td-freeze-n', 'Băng giữ chuỗi: học đủ 7 ngày liên tiếp được 1 băng (giữ tối đa 2). Lỡ một ngày học trong lịch, băng tự giữ chuỗi cho bạn.'));
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
        return G.el('div.td-talk', G.el('span.small.faint', h.luc), G.el('span', h.ten + ' · ' + h.tinhHuong), h.diem !== null && h.diem !== undefined ? G.el('span.mk-chip.' + G.scoreLabel(h.diem)[1], G.ic3('mic', 'ic3-s'), ' ' + h.diem) : G.el('span.small.faint', 'không micro'));
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
  /* Nhà của bạn: cùng một danh sách Nhiệm vụ hôm nay như ở Sảnh và thẻ góc phải (một lối vào cho việc hằng ngày),
     dưới đó là việc chỉ có ở nhà (nói chuyện với mẹ) và phần học thêm. Chỉ nút "Làm ngay" của nhiệm vụ kế tiếp tô cam. */
  G.openHome = function () {
    var body = panelOpen('Nhà của bạn');
    var d = today(), momDone = !!(d.sang && d.sang['en-home']);
    body.appendChild(G.questList({ more: true, onChange: G.openHome }));
    var extra = [
      G.LIFE['en-home'] ? G.el('button.big.bic' + (momDone ? '.done' : ''), { onclick: function () { G.openLife('en-home'); } },
        G.bigIc(momDone ? 'check' : 'talk', 'Nói chuyện với mẹ'), G.el('span', 'Buổi sáng ở nhà: thức dậy, ăn sáng, chuẩn bị đi học')) : null,
      G.el('button.big.bic', { onclick: G.openReader }, G.bigIc('book', 'Kho truyện'), G.el('span', 'Truyện song ngữ theo cấp, nghe cả chương, câu hỏi đọc hiểu')),
      G.el('button.big.bic', { onclick: G.openWeekly }, G.bigIc('memo', 'Kiểm tra tuần'), G.el('span', weekLine())),
      G.el('button.big.bic', { onclick: G.openCanDo }, G.bigIc('speak', 'Mình nói được'), G.el('span', G.canDoStats ? G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được bằng tiếng Anh' : '')),
      G.openTopics ? G.el('button.big.bic', { onclick: G.openTopics }, G.bigIc('books', 'Từ theo chủ đề'), G.el('span', G.topicTotals().got + '/' + G.topicTotals().all + ' từ đọc tin, công sở, kinh tế…')) : null,
      G.openFix && G.enFloorNow && G.enFloorNow() >= 3 ? G.el('button.big.bic', { onclick: G.openFix }, G.bigIc('magnifier', 'Bắt lỗi câu'), G.el('span', G.fixStats().ok + '/' + G.fixStats().all + ' lỗi hay gặp đã nắm')) : null,
      G.srsHard && G.srsHard().length ? G.el('button.big.bic', { onclick: G.openReviewHard }, G.bigIc('brain', 'Câu khó'), G.el('span', G.srsHard().length + ' câu bạn hay quên · ôn riêng')) : null
    ];
    body.appendChild(G.el('h3.home-sec', 'Ở nhà và học thêm'));
    body.appendChild(G.el('div.menu3', extra));
  };

  /* ---------- Đọc truyện ---------- */
  var IDXS = {}, COVERS = null;   // danh sách truyện theo thứ tiếng đang học
  function loadIndex(cb) {
    var RL = G.lang ? G.lang() : 'en';
    if (IDXS[RL]) { cb(IDXS[RL]); return; }
    // danh sách tranh bìa đã có (data/covers.json): truyện chưa có bìa thì hiện kiểu thẻ chữ, không tải hình hỏng
    fetch('../data/covers.json').then(function (r) { return r.json(); }).then(function (c) { COVERS = {}; c.forEach(function (id) { COVERS[id] = 1; }); }).catch(function () { /* không có danh sách: thử tải mọi bìa */ })
    .then(function () { return fetch('../data/stories/index.json'); }).then(function (r) { return r.json(); }).then(function (j) {
      var order = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, HSK1: 1, HSK2: 2, HSK3: 3, HSK4: 4, HSK5: 5, HSK6: 6 };
      // hiện tất cả truyện tiếng Anh, xếp theo kệ (Brightford 2080 đầu tiên), trong kệ theo cấp
      var IDX = j.filter(function (s) { return s.lang === RL; });
      IDX.sort(function (a, b) { return (shelfRank(a) * 10 + (order[a.level] || 9)) - (shelfRank(b) * 10 + (order[b.level] || 9)); });
      IDXS[RL] = IDX;
      cb(IDX);
    }).catch(function () { G.toast('Chưa tải được kho truyện. Mở khi có mạng một lần nhé.'); });
  }
  var SHELF = ['graded', 'future', 'ai', 'fable', 'true', 'mystery', 'news', 'essay', 'long'];
  var SHELF_NAME = { graded: 'Truyện theo cấp HSK · có pinyin', fable: 'Thành ngữ, ngụ ngôn Trung Hoa', easy: 'Truyện dễ A1 · đời thường ở Brightford', future: 'Brightford 2080 · vấn đề xã hội tương lai', ai: 'Chuyện về AI', true: 'Chuyện có thật', mystery: 'Bí ẩn chưa có lời giải', news: 'Tin tức 2025–2026', essay: 'Bài luận B2 · kỹ năng sống', long: 'Truyện dài' };
  function shelfRank(s) {
    if (s.shelf === 'easy') return lowLv() ? -1 : SHELF.length;   // người mới (tầng 1–2): kệ truyện dễ lên đầu
    var i = SHELF.indexOf(s.shelf); return i < 0 ? SHELF.length : i;
  }
  function lowLv() { return G.lang() === 'zh' ? true : (G.enFloorNow ? G.enFloorNow() : 1) <= 2; }
  function readN(id) { return (G.S.truyen && G.S.truyen[id]) || 0; }
  G.openReader = function () {
    stopListen();
    var body = panelOpen('Đọc truyện'), gen = G.panelGen;
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    loadIndex(function (list) {
      if (!G.panelLive(gen)) return;   // đã đóng hoặc mở bảng khác trong lúc tải
      body.innerHTML = '';
      // gợi ý: truyện đang đọc dở, không có thì truyện dễ nhất chưa đọc
      var next = null;
      for (var i = 0; i < list.length && !next; i++) { var r = readN(list[i].id); if (r > 0 && r < list[i].chapters.length) next = list[i]; }
      // chưa đọc dở truyện nào: truyện chưa đọc gần trình độ nhất (tầng 1–2 → A1, tầng 3 → A2, tầng 4 → B1)
      var zhL = G.lang() === 'zh', want = zhL ? [1, 1, 3, 5][(G.zhFloorNow ? G.zhFloorNow() : 1) - 1] || 1 : [1, 1, 2, 3][(G.enFloorNow ? G.enFloorNow() : 1) - 1] || 1;
      var ORD = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, HSK1: 1, HSK2: 2, HSK3: 3, HSK4: 4, HSK5: 5, HSK6: 6 }, best = 99;
      if (!next) for (var j = 0; j < list.length; j++) {
        if (readN(list[j].id) >= list[j].chapters.length) continue;
        var d0 = Math.abs((ORD[list[j].level] || 3) - want); if (d0 < best) { best = d0; next = list[j]; }
      }
      if (next) body.appendChild(G.el('button.big.bic.seal.rd-next', { onclick: function () { chapter(next, readN(next.id)); } },
        G.bigIc('book', 'Đọc tiếp: ' + next.title), G.el('span', next.vi + ' · chương ' + (readN(next.id) + 1) + '/' + next.chapters.length + ' · ' + next.level)));
      var lv = '';
      list.forEach(function (s) {
        var grp = s.shelf || 'long';
        if (grp !== lv) { lv = grp; body.appendChild(G.el('h3.rd-lv', SHELF_NAME[grp] || 'Truyện khác')); }
        var r = readN(s.id);
        // thẻ truyện nền trắng có tranh bìa (taste-skill: tranh thật dẫn dắt, chỉ "Đọc tiếp" nổi bật)
        var hasCover = !COVERS || COVERS[s.id];
        var cover = hasCover ? G.el('img.rd-cover', { src: '../img/covers/' + s.id + '.webp', alt: '', loading: 'lazy', onerror: function () { this.style.display = 'none'; if (this.parentNode) this.parentNode.className += ' no-cover'; } }) : null;
        body.appendChild(G.el('button.rd-story' + (hasCover ? '' : '.no-cover'), { onclick: function () { chapter(s, Math.min(r, s.chapters.length - 1)); } },
          cover,
          G.el('span.rd-txt', G.el('b', s.title), G.el('span.small.faint', s.vi + ' · ' + s.level + ' · ' + s.chapters.length + ' chương'),
            s.blurb ? G.el('span.small.rd-blurb', s.blurb) : null,
            r ? G.el('span.rd-prog', r >= s.chapters.length ? 'Đã đọc xong' : 'Đã đọc ' + r + '/' + s.chapters.length + ' chương') : null)));
      });
    });
  };
  /* tốc độ nghe trong kho truyện: chậm / thường / nhanh (nhớ cho lần sau; bản cũ chỉ có "đọc chậm") */
  var SPEEDS = [[0.7, 'Chậm'], [1, 'Thường'], [1.2, 'Nhanh']];
  function rdRate() { var cd = G.S.caiDat || {}; return cd.tocDo || (cd.docCham ? 0.7 : 1); }
  var stopList = null;
  function stopListen() { if (stopList) { stopList(); stopList = null; } }
  G._stopStory = stopListen;
  function shuffled(n) { var a = [], i, j, t; for (i = 0; i < n; i++) a.push(i); for (i = n - 1; i > 0; i--) { j = Math.floor(Math.random() * (i + 1)); t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function chapter(s, k) {
    stopListen();
    var body = panelOpen(s.title), gen = G.panelGen;
    body.appendChild(G.el('div.small.faint', 'Đang tải…'));
    fetch('../data/stories/' + s.id + '.json').then(function (r) { return r.json(); }).then(function (full) {
      if (!G.panelLive(gen)) return;   // người học đã đóng hoặc mở bảng khác: không ghi đè bảng đó
      var ch = full.chapters[k], lines = [], texts = [], SL = full.lang === 'zh' ? 'zh' : 'en';   // truyện tiếng Trung: dòng là [chữ Hán, nghĩa, pinyin]
      body.innerHTML = '';
      body.appendChild(G.el('div.lhead', G.el('div.lsub', 'Chương ' + ch.n + '/' + full.chapters.length + ' · ' + ch.title + ' · ' + (ch.vi || '') + ' · bấm câu để nghe')));
      var cd = G.S.caiDat || (G.S.caiDat = {});
      // tốc độ nghe: chậm / thường / nhanh
      var spd = G.el('div.td-seg.rd-speed');
      function drawSpd() {
        spd.innerHTML = '';
        SPEEDS.forEach(function (x) {
          spd.appendChild(G.el('button' + (rdRate() === x[0] ? '.on' : ''), { onclick: function () { cd.tocDo = x[0]; cd.docCham = x[0] < 1; G.save(); drawSpd(); } }, x[1]));
        });
      }
      drawSpd();
      // nghe cả chương: đọc lần lượt từng câu, câu đang đọc được tô sáng và cuộn tới
      var lb = G.el('button.btn.sm.rd-listen');
      function drawLb() { lb.innerHTML = ''; lb.appendChild(G.ic3(stopList ? 'pause' : 'headphone', 'ic3-s')); lb.appendChild(document.createTextNode(stopList ? ' Dừng nghe' : ' Nghe cả chương')); }
      function mark(i) { for (var q = 0; q < lines.length; q++) lines[q].classList.toggle('rd-now', q === i); if (i >= 0 && lines[i] && lines[i].scrollIntoView) lines[i].scrollIntoView({ block: 'center', behavior: G.calm && G.calm() ? 'auto' : 'smooth' }); }
      lb.onclick = function () {
        if (stopList) { stopListen(); mark(-1); drawLb(); return; }
        stopList = G.sayList(texts, SL, rdRate(), mark, function () { stopList = null; mark(-1); drawLb(); G.markStudy(); });
        drawLb();
      };
      drawLb();
      // hiện / ẩn nghĩa tiếng Việt (mặc định hiện, nhớ cho lần sau)
      var viBtn = G.el('button.btn.sm.rd-vibtn', { onclick: function () { cd.anNghia = !cd.anNghia; G.save(); applyVi(); } });
      // chỉ nghe: câu tiếng Anh / chữ Hán mờ đi (luyện nghe như podcast), chạm câu nào hiện câu đó
      var enBtn = G.el('button.btn.sm.rd-vibtn', { onclick: function () { cd.anChu = !cd.anChu; G.save(); applyVi(); } });
      // tiếng Trung: hiện / ẩn pinyin (đọc chữ Hán không nhìn pinyin khi đã quen)
      var pyBtn = SL === 'zh' ? G.el('button.btn.sm.rd-vibtn', { onclick: function () { cd.hienPinyin = cd.hienPinyin === false; G.save(); applyVi(); } }) : null;
      function applyVi() {
        body.className = 'panel-body' + (cd.anNghia ? ' rd-hidevi' : '') + (cd.anChu ? ' rd-hideen' : '') + (SL === 'zh' && cd.hienPinyin === false ? ' rd-hidepy' : '');
        viBtn.textContent = cd.anNghia ? 'Hiện nghĩa tiếng Việt' : 'Ẩn nghĩa (tự đọc)';
        enBtn.textContent = cd.anChu ? (SL === 'zh' ? 'Hiện chữ Hán' : 'Hiện chữ tiếng Anh') : 'Ẩn chữ (chỉ nghe)';
        if (pyBtn) pyBtn.textContent = cd.hienPinyin === false ? 'Hiện pinyin' : 'Ẩn pinyin';
      }
      body.appendChild(G.el('div.rd-tools', spd, lb, viBtn, pyBtn, enBtn)); applyVi();
      (ch.paras || []).forEach(function (para) {
        body.appendChild(G.el('div.rd-para', para.map(function (ln) {
          // nghĩa tiếng Việt luôn hiện ngay dưới câu (ẩn được bằng nút "Ẩn nghĩa" để tự luyện đọc); bấm câu để nghe
          var vi = G.el('div.rd-vi.show', ln[1]);
          var row = G.el('div.rd-line' + (SL === 'zh' ? '.rd-zh' : ''), { onclick: function () { if (stopList) { stopListen(); mark(-1); drawLb(); } row.classList.add('seen'); G.say(ln[0], SL, rdRate()); } },
            SL === 'zh' && ln[2] ? G.el('div.rd-py', ln[2]) : null, G.el('span', ln[0]), vi);
          lines.push(row); texts.push(ln[0]);
          return row;
        })));
      });
      // từ đáng nhớ: vocab [[từ, nghĩa]] hoặc gloss {từ: nghĩa}
      var voc = ch.vocab || (ch.gloss ? Object.keys(ch.gloss).map(function (w) { return [w, ch.gloss[w]]; }) : []);
      if (voc.length) body.appendChild(G.el('div.rd-box',
        G.el('b.rd-bh', G.ic3('memo', 'ic3-s'), ' Từ đáng nhớ'),
        G.el('div.rd-vocab', voc.map(function (v) { return G.el('button.rd-w', { onclick: function () { G.say(v[0], SL, rdRate()); } }, G.el('b', v[0]), ' · ' + v[1]); }))));
      // đọc hiểu: câu hỏi trắc nghiệm của chương (đáp án xáo mỗi lần mở)
      var quiz = ch.quiz || [], got = 0, answered = 0;
      if (quiz.length) {
        var qBox = G.el('div.rd-box.rd-quiz', G.el('b.rd-bh', G.ic3('target', 'ic3-s'), ' Bạn hiểu tới đâu?'));
        var qRes = G.el('div.small.faint', 'Chọn đáp án đúng theo nội dung chương.');
        quiz.forEach(function (q, qi) {
          var done = false, opts = G.el('div.rd-opts');
          shuffled(q.opts.length).forEach(function (oi) {
            var b = G.el('button.rd-opt', { onclick: function () {
              if (done) return; done = true; answered++;
              var ok = oi === q.a;
              b.classList.add(ok ? 'ok' : 'no');
              if (!ok) { var all = opts.children; for (var z = 0; z < all.length; z++) if (all[z]._oi === q.a) all[z].classList.add('ok'); }
              if (ok) got++;
              G.sfx(ok ? 'right' : 'wrong');
              if (answered === quiz.length) { qRes.className = 'small rd-qres'; qRes.textContent = 'Đúng ' + got + '/' + quiz.length + (got === quiz.length ? ' · hiểu trọn chương này' : ' · đọc lại đoạn có câu trả lời nhé'); }
            } }, q.opts[oi]);
            b._oi = oi; opts.appendChild(b);
          });
          qBox.appendChild(G.el('div.rd-q', G.el('div', G.el('b', (qi + 1) + '. ' + q.q)), q.qVi ? G.el('div.small.faint', q.qVi) : null, opts));
        });
        qBox.appendChild(qRes);
        body.appendChild(qBox);
      }
      var think = ch.think || [];
      if (think.length) body.appendChild(G.el('div.rd-box.think',
        G.el('b.rd-bh', G.ic3('thought', 'ic3-s'), ' Suy ngẫm'),
        G.el('ol', think.map(function (q) { return G.el('li', q); })),
        G.el('div.small.faint', 'Nghĩ hoặc nói to câu trả lời bằng tiếng Việt, rồi thử nói một câu bằng tiếng Anh.')));
      if (ch.say) body.appendChild(G.el('div.rd-box.think',
        G.el('b.rd-bh', G.ic3('speak', 'ic3-s'), ' Nói thử'),
        G.el('div', ch.say),
        G.el('div.small.faint', 'Nói to bằng tiếng Anh, dùng lại câu trong chương.')));
      body.appendChild(G.el('div.row',
        G.el('button.btn', { onclick: function () { stopListen(); G.openReader(); } }, '‹ Kho truyện'),
        G.el('button.btn.seal', { onclick: function () {
          stopListen();
          G.S.truyen = G.S.truyen || {};
          if ((G.S.truyen[s.id] || 0) <= k) { G.S.truyen[s.id] = k + 1; G.addXp(10 + (quiz.length && got === quiz.length ? 5 : 0)); }
          if (G.track) G.track('truyen', { id: s.id, ch: k + 1, dung: got, hoi: quiz.length });
          G.markStudy(); G.markTask('doc'); G.sfx('done');
          if (k + 1 < full.chapters.length) chapter(s, k + 1); else { G.openReader(); G.toast('Đọc xong truyện ' + s.title + '. Giỏi lắm!'); }
        } }, k + 1 < full.chapters.length ? 'Đọc xong · chương sau ›' : 'Đọc xong truyện')));
      body.scrollTop = 0;
    }).catch(function () { if (!G.panelLive(gen)) return; body.innerHTML = ''; body.appendChild(G.el('p', 'Chưa tải được chương này. Thử lại khi có mạng.')); });
  }

  /* Ôn câu đã học: xem js/practice.js (G.openReview) */
})();
