/* Bản đồ nhớ từ: mỗi ô là một buổi học, tô màu theo mức nhớ các câu của buổi đó trong kho ôn (G.S.cau, hộp 0 → 6).
   Ô đỏ nhạt: nhiều câu đã đến hạn, nên ôn hôm nay. Chạm ô để xem và ôn đúng các câu sắp quên của buổi đó.
   Chuyển tầng bằng thanh chọn co giãn, lưới hiện như gợn sóng (anime.js). Tab cuối "Chủ đề": mỗi ô là một nhóm từ ATLAS
   (G.topicStat), chạm để ôn từ sắp quên hoặc học từ mới. Giờ theo giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  function range(pre, n, pad) { var a = []; for (var i = 1; i <= n; i++) a.push(pre + (pad && i < 10 ? '0' : '') + i); return a; }
  var FLOORS = [
    { name: 'Tầng 1', sub: 'Nền tảng', ids: range('en-n-', 30, true), cols: 6 },
    { name: 'Tầng 2', sub: 'A1', ids: ['en-a1-1', 'en-a1-2', 'en-a1-3', 'en-a1-4', 'en-a1-test'], cols: 5 },
    { name: 'Tầng 3', sub: 'A2 – B1', ids: range('en-a2-', 24, true), cols: 6 },
    { name: 'Tầng 4', sub: 'B1 – B2', ids: range('en-b1-', 24, true), cols: 6 },
    { name: 'Chủ đề', sub: '15 nhóm từ', topics: true, cols: 5 }   // từ theo chủ đề (topics.js)
  ];
  var LV = {
    warn: 'Sắp quên, nên ôn hôm nay',
    l2: 'Đang nhớ',
    l3: 'Nhớ khá',
    l4: 'Nhớ chắc',
    skip: 'Học vượt theo đầu vào',
    none: 'Chưa học'
  };

  /* mức nhớ của một buổi: trung bình hộp ôn các câu đã vào kho, tỉ lệ câu đến hạn hôm nay */
  function statOf(id) {
    var R = G.ROOMS[id], all = G.S.cau || {}, today = G.vnDay(), n = 0, sum = 0, due = [];
    if (!R) return null;
    for (var i = 0; i < R.items.length; i++) {
      var c = all[R.items[i].en]; if (!c) continue;
      n++; sum += c.box || 0;
      if (c.due <= today) due.push(c);
    }
    var avg = n ? sum / n : 0, passed = G.roomPassed(id), lv;
    if (!n) lv = passed ? 'skip' : 'none';
    else if (due.length >= Math.max(2, Math.ceil(R.items.length * 0.3))) lv = 'warn';
    else lv = avg >= 4 ? 'l4' : avg >= 2 ? 'l3' : 'l2';
    return { id: id, R: R, n: n, all: R.items.length, avg: avg, due: due, lv: lv, passed: passed };
  }
  function openable(id) {
    var R = G.ROOMS[id]; if (!R) return false;
    if (R.parent && G.ROOMS[R.parent] && G.ROOMS[R.parent].group) return G.sessionOpen(R.parent, G.ROOMS[R.parent].group.indexOf(id));
    return G.roomPassed(id) || (G.enFloorNow && G.enFloorNow() >= 2);
  }
  function floorNow() { var f = G.enFloorNow ? G.enFloorNow() : 1; return Math.max(0, Math.min(3, f - 1)); }
  var TABS = function () { return FLOORS.filter(function (f) { return !f.topics || (G.TOPICS_EN && G.topicStat); }); };

  var cur = -1;
  G.openMemMap = function (fi) {
    if (G.srsSeed) G.srsSeed();
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    document.getElementById('panel-title').textContent = 'Bản đồ nhớ từ';
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = ''; body.scrollTop = 0;
    if (G.viewIn) G.viewIn(body);
    var from = cur;
    cur = fi === undefined ? floorNow() : fi;

    // tổng toàn bộ: số câu đến hạn, số buổi nhớ chắc
    var dueAll = G.srsDue ? G.srsDue().length : 0, strong = 0, warn = 0;
    FLOORS.forEach(function (f) { (f.ids || []).forEach(function (id) { var s = statOf(id); if (!s) return; if (s.lv === 'l4') strong++; if (s.lv === 'warn') warn++; }); });
    var nDue = G.el('b', '0'), nStrong = G.el('b', '0'), nWarn = G.el('b', '0');
    body.appendChild(G.el('div.mm-sum',
      G.el('div.mm-k.warn', nDue, G.el('span', 'câu đến hạn ôn hôm nay')),
      G.el('div.mm-k', nWarn, G.el('span', 'buổi sắp quên')),
      G.el('div.mm-k.ok', nStrong, G.el('span', 'buổi nhớ chắc'))));
    G.countUp(nDue, 0, dueAll, { dur: 800 }); G.countUp(nWarn, 0, warn, { dur: 800, delay: 80 }); G.countUp(nStrong, 0, strong, { dur: 800, delay: 160 });

    // thanh chọn tầng: ô chọn co giãn khi trượt
    var pill = G.el('i.epill');
    var FL = TABS();
    var tabs = G.el('div.etabs', pill, FL.map(function (f, i) {
      return G.el('button' + (i === cur ? '.on' : ''), { 'aria-pressed': i === cur ? 'true' : 'false', onclick: function () { if (i !== cur) G.openMemMap(i); } },
        G.el('b', f.name), G.el('span', f.sub));
    }));
    tabs.style.setProperty('--n', FL.length);
    body.appendChild(tabs);
    G.pillTo(pill, cur, FL.length, from < 0 ? cur : from);

    var F = FL[cur] || FL[0];
    if (F.topics) { topicGrid(body); return; }
    var stats = F.ids.map(statOf).filter(function (s) { return !!s; });
    var detail = G.el('div.mm-detail');
    var grid = G.el('div.mm-grid', { style: { gridTemplateColumns: 'repeat(' + F.cols + ', minmax(0, 1fr))' } }, stats.map(function (s, k) {
      var label = s.R.label || (s.R.n ? String(s.R.n) : String(k + 1));
      if (s.id === 'en-a1-test') label = 'Thi';
      var cell = G.el('button.mm-c.' + s.lv, { 'aria-label': s.R.title + ': ' + LV[s.lv], onclick: function () { pick(s, cell); } }, label);
      return cell;
    }));
    // màn ngang: lưới bên trái, chi tiết buổi bên phải
    body.appendChild(G.el('div.mm-main',
      G.el('div.mm-left', grid, G.el('div.mm-legend', ['warn', 'l2', 'l3', 'l4', 'skip', 'none'].map(function (k) { return G.el('span', G.el('i.mm-c.' + k), LV[k].replace(', nên ôn hôm nay', '')); }))),
      detail));
    detail.appendChild(G.el('div.small.faint', 'Chạm một ô để xem buổi đó nhớ tới đâu và ôn đúng các câu sắp quên.'));
    // lưới hiện như gợn sóng, bắt đầu từ góc trên trái
    if (window.anime && !G.calm()) window.anime({ targets: grid.children, opacity: [0, 1], scale: [0.6, 1], delay: window.anime.stagger(26, { grid: [F.cols, Math.ceil(stats.length / F.cols)], from: 0, start: 160 }), duration: 480, easing: 'easeOutBack' });

    var picked = null;
    function pick(s, cell) {
      if (picked) picked.classList.remove('sel');
      picked = cell; cell.classList.add('sel');
      detail.innerHTML = '';
      var can = openable(s.id);
      detail.appendChild(G.el('div.mm-card',
        G.el('div.mm-h', G.el('i.mm-c.' + s.lv), G.el('div', G.el('b', s.R.title), G.el('div.small.faint', LV[s.lv]))),
        G.el('div.mm-bars',
          G.el('div', G.el('span', 'Câu đã vào kho ôn'), G.el('b', s.n + '/' + s.all)),
          G.el('div', G.el('span', 'Đến hạn ôn hôm nay'), G.el('b', String(s.due.length))),
          G.el('div', G.el('span', 'Mức nhớ trung bình'), G.el('b', s.n ? (Math.round(s.avg / 6 * 100) + '%') : '–'))),
        G.el('div.row',
          s.due.length ? G.el('button.btn.seal', { onclick: function () { G.openReviewOf(s.due.map(function (c) { return c.en; })); } }, 'Ôn ' + s.due.length + ' câu sắp quên') :
            s.n ? G.el('button.btn', { onclick: function () { G.openReviewOf(s.R.items.map(function (it) { return it.en; })); } }, 'Ôn lại buổi này') : null,
          can ? G.el('button.btn', { onclick: function () { G.openLesson(s.id); } }, 'Vào buổi học ›') : G.el('span.small.faint', 'Buổi này chưa mở'))));
      G.enter(detail.children, { y: 10, dur: 360 });
    }
  };

  /* tab "Chủ đề": 15 ô, mỗi ô một nhóm từ, tô màu theo mức nhớ các từ đã học của nhóm đó */
  function topicGrid(body) {
    var stats = G.TOPICS_EN.map(function (t) { return G.topicStat(t.id); });
    var detail = G.el('div.mm-detail');
    var grid = G.el('div.mm-grid.mm-tpg', { style: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' } }, stats.map(function (s) {
      var cell = G.el('button.mm-c.mm-tp.' + s.lv + (s.open ? '' : '.lock'), { 'aria-label': s.t.name + ': ' + LV[s.lv], onclick: function () { pick(s, cell); } }, G.ic3(s.t.ic, 'mm-tpic'));
      return cell;
    }));
    body.appendChild(G.el('div.mm-main',
      G.el('div.mm-left', grid, G.el('div.mm-legend', ['warn', 'l2', 'l3', 'l4', 'none'].map(function (k) { return G.el('span', G.el('i.mm-c.' + k), k === 'none' ? 'Chưa học từ nào' : LV[k].replace(', nên ôn hôm nay', '')); }))),
      detail));
    detail.appendChild(G.el('div.small.faint', 'Chạm một ô để xem nhóm từ đó nhớ tới đâu, ôn từ sắp quên hoặc học từ mới.'));
    if (window.anime && !G.calm()) window.anime({ targets: grid.children, opacity: [0, 1], scale: [0.6, 1], delay: window.anime.stagger(30, { grid: [5, 3], from: 0, start: 160 }), duration: 480, easing: 'easeOutBack' });
    var picked = null;
    function pick(s, cell) {
      if (picked) picked.classList.remove('sel');
      picked = cell; cell.classList.add('sel');
      detail.innerHTML = '';
      var fl = G.ROADMAP_EN && G.ROADMAP_EN[s.t.floor - 1] ? G.ROADMAP_EN[s.t.floor - 1].name : 'Tầng ' + s.t.floor;
      detail.appendChild(G.el('div.mm-card',
        G.el('div.mm-h', G.el('i.mm-c.' + s.lv), G.el('div', G.el('b', s.t.name), G.el('div.small.faint', fl + ' · ' + (s.n ? LV[s.lv] : s.open ? 'Chưa học từ nào' : 'Chưa mở')))),
        G.el('div.mm-bars',
          G.el('div', G.el('span', 'Từ đã học'), G.el('b', s.learned + '/' + s.all)),
          G.el('div', G.el('span', 'Đến hạn ôn hôm nay'), G.el('b', String(s.due.length))),
          G.el('div', G.el('span', 'Mức nhớ trung bình'), G.el('b', s.n ? (Math.round(s.avg / 6 * 100) + '%') : '–'))),
        G.el('div.row',
          s.due.length ? G.el('button.btn.seal', { onclick: function () { G.openReviewOf(s.due); } }, 'Ôn ' + s.due.length + ' từ sắp quên') :
            s.n ? G.el('button.btn', { onclick: function () { G.openReviewOf(s.t.w); } }, 'Ôn lại nhóm này') : null,
          s.open ? G.el('button.btn', { onclick: function () { G.openTopic(s.id); } }, s.learned < s.all ? 'Học từ mới ›' : 'Xem nhóm từ ›') : G.el('span.small.faint', 'Mở ở ' + fl.split(' · ')[0]))));
      G.enter(detail.children, { y: 10, dur: 360 });
    }
  }
})();
