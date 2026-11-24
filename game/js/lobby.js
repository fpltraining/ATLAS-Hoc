/* Ngôi nhà chung: màn hình chính dạng trang. Đầu trang, lưới thẻ thành phố (Đang mở / Sắp ra mắt),
   hồ sơ, sao lưu. Bấm thẻ thành phố đang mở để vào bản đồ. */
var G = window.G || (window.G = {});

(function () {
  /* chỉ làm tiếng Anh (anh Han chốt 20/11/2026): các thành phố khác ẩn hẳn, dữ liệu tiến độ cũ vẫn giữ */
  var CITIES = [
    { id: 'en', name: 'Brightford', lang: 'Tiếng Anh · Thành phố Mỹ', card: 'card_city_en.webp', state: 'open', scene: 'city_en' }
  ];

  function rooms(doors) {
    var done = 0, stars = 0;
    for (var i = 0; i < doors.length; i++) { var id = doors[i].room, p = G.S.phong[id]; if (G.roomPassed(id)) { done++; stars += p ? p.sao : 0; } }
    return { done: done, stars: stars, all: doors.length };
  }
  function lastCity() { return 'en'; }
  function enRooms() { return rooms(G.EN_HALL_DOORS); }
  function foundDone() { var n = 0; for (var i = 1; i <= 30; i++) if (G.roomPassed('en-n-' + (i < 10 ? '0' : '') + i)) n++; return n; }

  /* ---------- Ước tính thời gian: kéo phút mỗi ngày, ngày mỗi tuần → còn bao nhiêu giờ, khi nào có từng chứng chỉ ---------- */
  function floorProgress(n) { var c = floorCount(n); return c.all ? c.k / c.all : 0; }   // phần đã học của một tầng (0 … 1)
  function floorCount(n) {
    var i, k = 0, all = 0;
    if (n === 1) { for (i = 1; i <= 30; i++) { all++; if (G.roomPassed('en-n-' + (i < 10 ? '0' : '') + i)) k++; } }
    else if (n === 2) { for (i = 0; i < G.EN_HALL_DOORS.length; i++) { var r2 = G.ROOMS[G.EN_HALL_DOORS[i].room], ids = r2 && r2.group ? r2.group : [G.EN_HALL_DOORS[i].room]; for (var j = 0; j < ids.length; j++) { all++; if (G.roomPassed(ids[j]) || (r2 && r2.group && G.roomPassed(r2.id) && j === 0)) k++; } } }   // phòng A1 = 4 buổi, cộng thi A1
    else if (n === 3 || n === 4) { var pre = n === 3 ? 'en-a2-' : 'en-b1-'; for (i = 1; i <= 24; i++) { all++; if (G.roomPassed(pre + (i < 10 ? '0' : '') + i)) k++; } }
    return { k: k, all: all };
  }
  /* "Bắt đầu từ đây": một việc nên làm ngay bây giờ (đầu vào → nhiệm vụ hôm nay theo thứ tự → rương → đi dạo) */
  function startHere() {
    var dv = G.S.dauVao, place = function () { G.openPlacement(function () { G.goLobby(); }, { canSkip: true }); };
    if (G.openPlacement && !dv) return { ic: 'target', t: 'Làm bài kiểm tra đầu vào', s: 'Khoảng 12–15 phút · app xếp bạn vào đúng tầng', go: place, b: 'Bắt đầu' };
    if (G.openPlacement && !dv.ban) return { ic: 'target', t: 'Làm lại bài kiểm tra đầu vào', s: 'Bài mới có phần Từ vựng và chấm chặt hơn để xếp đúng tầng · khoảng 12–15 phút', go: place, b: 'Làm lại' };
    var d = G.today(), p = G.dayProgress(), Q = G.QUESTS || [], order = ['bai', 'tu', 'on', 'doc', 'noi'];
    // đã học xong buổi đầu bằng kết quả nhanh: mời làm bài đầy đủ một lần
    if (G.openPlacement && dv.nhanh && d.viec.bai) return { ic: 'target', t: 'Làm bài đầu vào đầy đủ', s: 'Nghe, Đọc, Giao tiếp, Nói · 12–15 phút · xếp tầng chính xác hơn, giỏi thì lên thẳng Tầng 4', go: place, b: 'Làm bài' };
    for (var i = 0; i < order.length; i++) {
      if (d.viec[order[i]]) continue;
      for (var j = 0; j < Q.length; j++) if (Q[j].id === order[i]) {
        var q = Q[j];
        return { ic: q.ic3, k: 'Nhiệm vụ ' + (p.done + 1) + '/' + p.all, t: q.name, s: G.questHint(q.id) + ' · khoảng ' + q.min + ' phút', go: function () { G.questAct(q.id); }, b: 'Làm ngay' };
      }
    }
    if (!d.ruong && G.claimChest) return { ic: 'gift', t: 'Mở rương hôm nay', s: '+30 XP vì xong cả ' + p.all + ' nhiệm vụ', go: function () { G.claimChest(); G.goLobby(); }, b: 'Mở rương' };
    return { ic: 'rocket', t: 'Xong hết nhiệm vụ hôm nay', s: 'Vào Brightford đi dạo, nói chuyện thêm. Học thêm là vượt tiến độ.', go: function () { G.goCity('en'); }, b: 'Vào Brightford' };
  }
  function remainHours() {   // giờ còn lại tới từng bước (cộng dồn)
    var cur = G.enFloorNow(), certs = (G.S.totNghiep && G.S.totNghiep.en) || {}, sum = 0, out = [];
    G.ROADMAP_EN.forEach(function (st) {
      var h = st.hours || 0;
      if (!st.final) {
        if (certs[st.key] || st.floor < cur) h = 0; else if (st.floor === cur) h = h * (1 - floorProgress(st.floor) * 0.85);
        // từ theo chủ đề của tầng (2 phút / từ chưa học), tầng đã qua coi như đã biết
        if (G.topicHours && st.floor >= cur && !certs[st.key]) h += G.topicHours(st.floor).left;
      }
      else if (G.S.totNghiepCL) h = 0;
      sum += h; out.push({ st: st, left: h, cum: sum });
    });
    return out;
  }
  function monthOf(days) { var p = G.vnParts(Date.now() + days * 86400000); return 'tháng ' + p.m + '/' + p.y; }
  function span(days) { var m = days / 30.4; return m < 1.5 ? Math.max(1, Math.round(days / 7)) + ' tuần' : m < 24 ? Math.round(m) + ' tháng' : (Math.round(m / 12 * 10) / 10 + ' năm').replace('.', ','); }
  /* dự kiến từng bước lộ trình với số phút / ngày, ngày / tuần (dùng cả ở kết quả đầu vào, thẻ mục tiêu) */
  G.etaPlan = function (mins, dpw) {
    var perWeek = mins * dpw / 60;
    return remainHours().map(function (r) { var d = r.cum / perWeek * 7; return { name: r.st.name, left: r.left, cum: r.cum, month: monthOf(d), span: span(d) }; });
  };
  /* lộ trình nói thật: bài có sẵn trong app bao nhiêu giờ (G.CONTENT_EN, đếm từ nội dung) so với số giờ cần để vững cấp */
  function contentLine(st) {
    var c = G.CONTENT_EN && G.CONTENT_EN[st.floor]; if (!c || !st.hours) return null;
    var tp = G.topicHours ? Math.round(G.topicHours(st.floor).all) : 0, inApp = c.h + tp, more = Math.max(0, st.hours + tp - inApp);
    var parts = [c.buoi + ' buổi'];
    if (c.chuong) parts.push(c.chuong + ' chương truyện');
    if (c.hoiThoai) parts.push(c.hoiThoai + ' hội thoại');
    return G.el('div.small.road-hrs', G.el('b', 'Bài có sẵn: khoảng ' + inApp + ' giờ'), ' (' + parts.join(', ') + (tp ? ', từ chủ đề' : '') + ')',
      more ? ' · để vững cấp cần thêm khoảng ' + more + ' giờ luyện: nói ngoài phố, đọc và nghe lại truyện, ôn câu.' : '');
  }
  /* lộ trình: tầng này gồm những chủ đề từ nào, đã học bao nhiêu từ */
  function topicLine(f) {
    var ts = G.topicsOfFloor(f); if (!ts.length) return null;
    var h = G.topicHours(f);
    return G.el('button.road-tp', { onclick: G.openTopics }, G.ic3('books', 'ic3-s'), G.el('span', 'Từ theo chủ đề: ' + ts.map(function (t) { return t.name; }).join(', ') + ' · ' + (h.words - h.wordsLeft) + '/' + h.words + ' từ'));
  }
  function planCard() {
    // thẻ "Kế hoạch của bạn" (placement.js) + dòng dự kiến từng tầng trên lộ trình
    function mins() { var pt = G.planToday && G.planToday(); return pt && !pt.xong ? pt.phut : ((G.S.caiDat && G.S.caiDat.phutNgay) || 40); }
    function draw() {
      var mn = mins(), dpw = (G.S.caiDat && G.S.caiDat.ngayTuan) || 5, perWeek = mn * dpw / 60;
      remainHours().forEach(function (r) {
        var el = document.getElementById('eta-' + (r.st.final ? 'final' : r.st.floor)); if (!el) return;
        el.textContent = r.left <= 0 ? '' : 'Dự kiến ' + monthOf(r.cum / perWeek * 7) + ' · còn khoảng ' + Math.round(r.left) + ' giờ';
      });
    }
    var card = G.goalCard(draw);
    draw(); setTimeout(draw, 0);   // dòng ước tính từng tầng điền sau khi danh sách tầng đã có
    return card;
  }

  G.renderLobby = function () {
    var root = document.getElementById('lobby');
    root.innerHTML = '';
    var r = enRooms(), sh0 = G.weeklyChart ? startHere() : null;

    // đầu trang kiểu giấy thủ công: tranh hai hòn đảo (Brightford, Trường Lạc trấn) + chữ ConnectLife đất sét + nút vào thành phố
    root.appendChild(G.el('header.lhero',
      G.el('div.hero-pic', G.imgEl('lobby_hero.webp', 'hero-img')),
      G.el('div.hero-text',
        G.el('img.lobby-title', { src: G.assetUrl('lobby_title.png'), alt: 'ConnectLife · Kết nối cuộc sống' }),
        G.el('p.hero-sub', 'Sống ở Brightford, học tiếng Anh như người bản xứ: học ở trường, nói chuyện ở quán, đi khắp thành phố.'),
        G.el('button.clay-btn', { onclick: function () { G.goCity(lastCity()); } }, 'Vào Brightford ›'),
        sh0 ? G.el('button.hero-next', { onclick: sh0.go }, G.ic3(sh0.ic, 'ic3-s'), G.el('span', 'Việc nên làm: ' + sh0.t + ' ›')) : null,
        G.el('p.hero-prog', (function () { var f = G.enFloorNow(), c = floorCount(f), st = G.ROADMAP_EN && G.ROADMAP_EN[f - 1]; return (st ? st.name : 'Tầng ' + f) + ' · ' + c.k + '/' + c.all + ' buổi · ' + G.S.xp + ' XP'; })())
      )
    ));

    // Sảnh chia 4 tab (taste-skill: mỗi màn một ý chính); thanh tab dính trên cùng khi cuộn
    var TABS = [['home', 'Hôm nay', 'calendar'], ['road', 'Lộ trình', 'pin'], ['me', 'Hồ sơ', 'star'], ['set', 'Cài đặt', 'bell']];
    function tabIdx(k) { for (var i = 0; i < TABS.length; i++) if (TABS[i][0] === k) return i; return 0; }
    var curTab = G._lobbyTab || 'home', P = {}, tabPill = G.el('i.epill'), tabBtns = [];
    var tabBar = G.el('nav.etabs.lb-tabs', { 'aria-label': 'Các mục của Sảnh' }, tabPill, TABS.map(function (t, i) {
      var b = G.el('button' + (t[0] === curTab ? '.on' : ''), { 'aria-pressed': t[0] === curTab ? 'true' : 'false', onclick: function () { showTab(i); } }, G.ic3(t[2]), G.el('b', t[1]));
      tabBtns.push(b); return b;
    }));
    tabBar.style.setProperty('--n', TABS.length);
    root.appendChild(tabBar);
    TABS.forEach(function (t) { P[t[0]] = G.el('section.lb-pane', { hidden: t[0] !== curTab }); root.appendChild(P[t[0]]); });
    G.pillTo(tabPill, tabIdx(curTab), TABS.length);
    function showTab(i) {
      var from = tabIdx(G._lobbyTab || 'home'), k = TABS[i][0];
      if (TABS[from][0] === k) return;
      G._lobbyTab = k;
      tabBtns.forEach(function (b, j) { b.className = j === i ? 'on' : ''; b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      TABS.forEach(function (t) { P[t[0]].hidden = t[0] !== k; });
      G.pillTo(tabPill, i, TABS.length, from);
      G.viewIn(P[k]);
      var top = tabBar.getBoundingClientRect().top;
      if (top < 0 || top > innerHeight * 0.6) window.scrollTo(0, window.pageYOffset + top - 4);
    }

    // lộ trình tới đầu ra giao tiếp: mỗi tầng một Chứng chỉ ConnectLife, cuối cùng là Tốt nghiệp ConnectLife
    if (G.ROADMAP_EN) {
      var cur = G.enFloorNow(), certs = (G.S.totNghiep && G.S.totNghiep.en) || {};
      // Bạn đang ở đây: tầng đang học, đã qua bao nhiêu buổi, buổi tiếp theo (một nút cam)
      var stNow = G.ROADMAP_EN[cur - 1], fc = floorCount(cur), nl = G.nextLesson && G.nextLesson(), hb = G.el('i');
      hb.style.transform = 'scaleX(' + (fc.all ? fc.k / fc.all : 0) + ')';
      if (stNow) P.road.appendChild(G.el('div.here-card',
        G.el('span.sh-k', G.ic3('pin', 'ic3-s'), 'Bạn đang ở đây'),
        G.el('div.here-h', G.el('b', stNow.name), G.el('span.road-cefr', stNow.cefr)),
        G.el('div.here-n', G.el('b', fc.k + '/' + fc.all), G.el('span', ' buổi đã qua')),
        G.el('span.qs-bar', hb),
        G.el('div.small', stNow.out),
        topicLine(cur),
        nl ? G.el('button.btn.seal.sh-go', { onclick: function () { G.openLesson(nl.id); } }, 'Học tiếp: ' + nl.label + ' ›') : null));
      P.road.appendChild(G.el('p.small.faint.road-note', 'Mỗi tầng học xong thi 2 phần (hiểu và nói) để nhận Chứng chỉ ConnectLife. Chỉ khi qua bài thi đầu ra giao tiếp mới là Tốt nghiệp ConnectLife. Số giờ mỗi tầng theo chuẩn quốc tế (Cambridge: khoảng 500–600 giờ có hướng dẫn để lên B2); app ghi rõ phần nào là bài có sẵn, phần nào là giờ luyện thêm.'));
      P.road.appendChild(planCard());
      P.road.appendChild(G.el('div.road', G.ROADMAP_EN.map(function (st) {
        var got = !st.final && certs[st.key], here = !st.final && st.floor === cur && !got;
        // nhãn trạng thái: icon 3D + chữ (taste-skill: không dùng emoji làm đầu dòng)
        var tag = st.final ? (G.finalDone && G.finalDone() ? ['grad', 'Đã tốt nghiệp ConnectLife'] : G.finalUnlocked && G.finalUnlocked() ? ['target', 'Đã mở · vào thi ngay'] : ['lock', 'Mở khi có Chứng chỉ Tầng 4'])
          : got ? ['star', 'Đã có chứng chỉ' + (got.noi ? ' · nói ' + got.noi + '/100' : '')] : here ? ['pin', 'Đang học'] : st.soon ? [null, 'Đang xây'] : st.floor < cur ? ['check', 'Vượt theo trình độ đầu vào'] : ['lock', 'Chưa mở'];
        tag = [tag[0] ? G.ic3(tag[0], 'ic3-s') : null, tag[1]];
        return G.el('div.road-step' + (st.final ? '.final' : '') + (got ? '.got' : '') + (here ? '.here' : ''),
          G.el('div.road-dot', st.final ? G.ic3('grad', 'ic3-s') : String(st.floor)),
          G.el('div.road-body', G.el('b', st.name + ' '), G.el('span.road-cefr', st.cefr), G.el('div.small', st.out), st.final || !G.topicsOfFloor ? null : topicLine(st.floor), st.final ? null : contentLine(st), G.el('span.road-tag', tag), st.final && G.finalUnlocked && G.finalUnlocked() ? G.el('button.btn.seal.sm.road-go', { onclick: G.openFinalExam }, G.finalDone() ? 'Xem bài thi tốt nghiệp ›' : 'Vào thi Tốt nghiệp ConnectLife ›') : null, G.el('span.road-eta', { id: 'eta-' + (st.final ? 'final' : st.floor) })));
      })));
    }

    var who = G.S.nhanVat || 'han';
    // Trình độ của bạn: cấp chung (số là trung tâm), 5 kỹ năng, tầng đang học, làm lại bài đầu vào
    if (G.PLACE_EN) {
      var dv0 = G.S.dauVao, PL = G.PLACE_EN, fNow = G.enFloorNow(), fcNow = floorCount(fNow), stF = G.ROADMAP_EN && G.ROADMAP_EN[fNow - 1];
      var sk = [['tv', 'Từ vựng'], ['nghe', 'Nghe'], ['doc', 'Đọc'], ['gt', 'Giao tiếp'], ['noi', 'Nói']];
      P.me.appendChild(G.el('div.lv-card',
        G.el('div.lv-top',
          G.el('div.lv-big', G.el('b', dv0 ? PL.levels[dv0.lv] : '–'), G.el('span', dv0 ? PL.names[dv0.lv] : 'Chưa đo')),
          G.el('div.lv-txt', G.el('span.sh-k', 'Trình độ của bạn'),
            G.el('b', (stF ? stF.name : 'Tầng ' + fNow) + ' · ' + fcNow.k + '/' + fcNow.all + ' buổi'),
            G.el('span', dv0 ? 'Đo ngày ' + dv0.luc.slice(8, 10) + '/' + dv0.luc.slice(5, 7) + (dv0.ban ? '' : ' (bản cũ, nên làm lại)') : 'Làm bài đầu vào để app xếp đúng tầng'))),
        dv0 ? G.el('div.pl-skills.lv-sk', sk.map(function (k) {
          var v = dv0[k[0]];
          return G.el('div.pl-skill', G.el('span.pl-sk-name', k[1]), G.el('span.pl-bar', [1, 2, 3, 4, 5].map(function (j) { return G.el('i' + (v !== null && v !== undefined && v >= j ? '.on' : '')); })),
            G.el('b.pl-sk-lv', v === null || v === undefined ? 'chưa đo' : PL.levels[v]));
        })) : null,
        G.el('button.btn.lv-re', { onclick: function () { G.openPlacement(function () { G.goLobby(); }, { canSkip: true }); } }, dv0 ? 'Làm lại bài đầu vào' : 'Làm bài đầu vào')));
    }
    P.me.appendChild(G.el('div.profile',
      G.el('div.pchar', G.playerPic(96, 'pchar-img'), G.el('b', G.playerName()),
        G.el('button.btn.sm', { onclick: function () { G.openCreator(function () { G.goLobby(); }); } }, 'Đổi nhân vật')),
      G.el('div.pstats',
        stat(G.S.xp, 'XP', 'star'),
        stat(G.S.chuoi.hienTai, 'Chuỗi học', 'fire', ' ngày'),
        stat(floorCount(G.enFloorNow()).k + '/' + floorCount(G.enFloorNow()).all, 'Buổi ở Tầng ' + G.enFloorNow()),
        stat(G.diplomas().filter(function (d) { return d.lang === 'en'; }).length + '/4', 'Chứng chỉ'),
        stat(G.S.tuKho.length, 'Từ cần ôn')
      ),
      G.S.totNghiepCL ? G.el('div.dips', G.el('span.dip-chip.cl', 'Tốt nghiệp ConnectLife · ' + G.S.totNghiepCL.luc.slice(0, 10).split('-').reverse().join('/'))) : null,
      G.diplomas().length ? G.el('div.dips', G.diplomas().map(function (d) {
        return G.el('span.dip-chip', 'Chứng chỉ ' + (d.lang === 'en' ? 'tiếng Anh ' : 'tiếng Trung ') + d.level + ' · hiểu ' + d.info.diem + '/' + d.info.tong + (d.info.noi ? ' · nói ' + d.info.noi : ''));
      })) : null
    ));

    G.enter(root.querySelectorAll('.pstats .stat'), { gap: 50 });
    // huy hiệu trên đầu theo tầng (khi đã có hình)
    var fbg = G.floorBadgeGrid && G.floorBadgeGrid();
    if (fbg) { P.me.appendChild(G.el('h2.sec', 'Huy hiệu trên đầu')); P.me.appendChild(fbg); }
    if (G.checkFloorBadge) setTimeout(G.checkFloorBadge, 700);

    if (G.weeklyChart) {
      // 1. Bắt đầu từ đây: một việc, một nút cam (người học mở app là biết bấm vào đâu)
      var sh = sh0 || startHere();
      P.home.appendChild(G.el('div.sh-card',
        G.el('div.sh-ic', G.ic3(sh.ic)),
        G.el('div.sh-txt', G.el('span.sh-k', 'Bắt đầu từ đây' + (sh.k ? ' · ' + sh.k : '')), G.el('b', sh.t), G.el('span', sh.s)),
        G.el('button.btn.seal.sh-go', { onclick: sh.go }, sh.b + ' ›')));
      // 2. Nhiệm vụ hôm nay: 5 việc, mỗi việc một nút Làm ngay, rương +30 XP
      if (G.questList) P.home.appendChild(G.questList({ noSeal: true, more: true, onChange: function () { G.goLobby(); } }));
      // 3. Học thêm, ôn, đo trình độ
      P.home.appendChild(G.el('h2.sec', 'Học thêm và ôn tập'));
      P.home.appendChild(G.el('div.out-row',
        G.el('button.big.bic', { onclick: G.openWeekly }, G.bigIc('memo', 'Kiểm tra tuần'), G.el('span', G.weekLine())),
        G.el('button.big.bic', { onclick: G.openCanDo }, G.bigIc('speak', 'Mình nói được'), G.el('span', G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được'))));
      if (G.openMemMap) P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openMemMap(); } }, G.bigIc('brain', 'Bản đồ nhớ từ'),
        G.el('span', G.srsDue && G.srsDue().length ? G.srsDue().length + ' câu đến hạn ôn hôm nay · xem buổi nào sắp quên' : 'Mỗi ô là một buổi học, màu càng xanh là càng nhớ chắc')));
      if (G.openTopics) { var tt = G.topicTotals(); P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: G.openTopics }, G.bigIc('books', 'Từ theo chủ đề'),
        G.el('span', tt.got + '/' + tt.all + ' từ đã học · ' + tt.open + '/' + tt.topics + ' chủ đề đang mở · đọc tin, công sở, kinh tế…'))); }
      // bắt lỗi câu (B1–B2): mở từ Tầng 3
      if (G.openFix && G.enFloorNow() >= 3) { var fs = G.fixStats(); P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: G.openFix }, G.bigIc('magnifier', 'Bắt lỗi câu'),
        G.el('span', fs.ok + '/' + fs.all + ' lỗi hay gặp đã nắm · thì, giới từ, mạo từ, -ed / -ing… mỗi lượt 10 câu'))); }
      // trình độ đầu vào (kiểm tra 4 kỹ năng), làm lại để đo đầu ra
      if (G.openPlacement) {
        var dv = G.S.dauVao;
        P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openPlacement(function () { G.goLobby(); }, { canSkip: true }); } },
          G.bigIc('target', 'Trình độ đầu vào' + (dv ? ': ' + G.levelName(dv.lv) : '')),
          G.el('span', dv && !dv.ban ? 'Bài đầu vào đã sửa (thêm phần Từ vựng, chấm chặt hơn) · nên làm lại để xếp đúng tầng' : dv && dv.nhanh ? 'Kết quả nhanh theo vốn từ · làm bài đầy đủ 4 kỹ năng để xếp chính xác hơn' : dv ? 'Làm ngày ' + dv.luc.slice(8, 10) + '/' + dv.luc.slice(5, 7) + (dv.tv !== undefined && dv.tv !== null ? ' · Từ vựng ' + G.PLACE_EN.levels[dv.tv] : '') + ' · Nghe ' + G.PLACE_EN.levels[dv.nghe] + ' · Đọc ' + G.PLACE_EN.levels[dv.doc] + ' · Giao tiếp ' + G.PLACE_EN.levels[dv.gt] + ' · Nói ' + (dv.noi === null ? 'chưa đo' : G.PLACE_EN.levels[dv.noi]) + ' · bấm để làm lại'
            : 'Chưa làm · 4 kỹ năng theo CEFR, 3–12 phút')));
      }
      // luyện phát âm theo lỗi của mình (bắt lỗi trước nếu chưa làm)
      if (G.openPronFromLobby) {
        var pe = G.pronErrors(), pk = G.S.phatAmKiem;
        P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openPronFromLobby(function () { G.goLobby(); }); } },
          G.bigIc('mic', 'Luyện phát âm theo lỗi'),
          G.el('span', pe.length ? 'Lỗi cần sửa: ' + pe.slice(0, 3).map(function (e) { return G.PRON_EN.tags[e.tag]; }).join(' · ') : pk ? 'Chưa thấy lỗi nào · luyện thêm âm cuối, đuôi -s, th' : 'Đọc 12 từ, máy tìm lỗi người Việt hay mắc rồi luyện riêng')));
      }
      P.home.appendChild(G.el('h2.sec', 'Thống kê'));
      if (G.studyChart) P.home.appendChild(G.studyChart());
      P.home.appendChild(G.weeklyChart());
    }
    P.me.appendChild(G.el('h2.sec', 'Rank và huy hiệu'));
    P.me.appendChild(G.rankCard());
    P.me.appendChild(G.badgeGrid());

    P.me.appendChild(G.el('h2.sec', 'Đồ kỷ niệm'));
    P.me.appendChild(G.el('div.souvs', G.souvenirs().map(function (v) {
      // món chưa nhận: bóng mờ của món đồ và việc cần làm để nhận (taste-skill: không để chữ giữ chỗ)
      return G.el('div.souv' + (v.got ? '' : '.lock'), G.imgEl(v.item.img, 'souv-img'), G.el('b', v.got ? v.item.name : 'Quà ở ' + v.place), G.el('span.faint', v.got ? v.place : 'Xong 3 tình huống ở đây để nhận'));
    })));

    // lưu trên mây (Supabase): đăng nhập một lần, tự đồng bộ
    if (G.cloudReady && G.cloudReady()) {
      var cu = G.cloudUser(), cs = G.cloudStatus();
      P.set.appendChild(cu
        ? G.el('div.cl-card', G.el('b', G.ic3('cloud', 'ic3-s'), 'Đang lưu trên mây · ' + cu.email),
            G.el('span.small.faint', cs.err ? 'Lỗi: ' + cs.err : cs.luc ? 'Đồng bộ lần cuối lúc ' + cs.luc + ' (giờ Việt Nam). App tự lưu sau mỗi bài.' : 'App tự lưu sau mỗi bài.'),
            G.el('div.row',
              G.el('button.btn.sm', { onclick: function () { G.cloudSync(function (e) { G.toast(e ? e : 'Đã đồng bộ.'); G.renderLobby(); }); } }, G.ic3('repeat', 'ic3-s'), 'Đồng bộ ngay'),
              G.el('button.btn.sm.ghost', { onclick: function () { G.confirm('Đăng xuất lưu trên mây? Tiến độ vẫn giữ trong máy này.', function () { G.cloudSignOut(); G.renderLobby(); }); } }, 'Đăng xuất')))
        : G.el('div.cl-card', G.el('b', G.ic3('cloud', 'ic3-s'), 'Lưu tiến độ trên mây'),
            G.el('span.small.faint', 'Đăng nhập một lần để app tự lưu, đổi máy hay xoá app cũng không mất bài. Không cần xuất file sao lưu nữa.'),
            G.el('button.btn.seal.sm', { onclick: function () { G.openCloudLogin(function () { G.renderLobby(); }); } }, 'Đăng nhập / Tạo tài khoản')));
    }
    var file = G.el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onchange: function (e) { if (e.target.files[0]) G.importSave(e.target.files[0], G.renderLobby); e.target.value = ''; } });
    P.set.appendChild(G.el('div.tools',
      G.el('button.btn', { onclick: G.exportSave }, '⤓ Xuất file sao lưu'),
      G.el('button.btn', { onclick: function () { file.click(); } }, '⤒ Nhập file sao lưu'),
      file
    ));
    // cài đặt dạng nút gạt (mẫu "toggles" của taste-skill)
    P.set.appendChild(G.el('div.tg-list',
      G.switchRow('bell', 'Âm thanh', 'Tiếng bấm, tiếng đúng sai, tiếng ăn mừng', G.S.caiDat.amThanh !== false, function (on) { G.S.caiDat.amThanh = on; G.save(); }),
      G.switchRow('piano', 'Nhạc nền', 'Nhạc nhẹ khi đi trong thành phố', G.musicOn(), function (on) { G.setMusic(on); }),
      G.canListen ? G.switchRow('mic', 'Dùng micro khi luyện nói', 'Máy nghe bạn nói và chấm điểm phát âm', G.micOn(), function (on) { G.setMic(on); }) : null,
      G.track ? G.switchRow('chart', 'Gửi số liệu ẩn danh', 'Giúp sửa lỗi và làm bài tốt hơn. Không gửi tên, email hay câu bạn nói.', G.S.caiDat.soLieu !== false, function (on) { G.S.caiDat.soLieu = on; G.save(); }) : null));
    // tốc độ giọng đọc cho cả app: chậm / thường / nhanh (nghe nhanh dần để quen tốc độ người thật)
    var spd = G.el('div.td-seg.set-speed');
    (function drawSpd() {
      spd.innerHTML = '';
      var now = G.S.caiDat.tocDo || (G.S.caiDat.docCham ? 0.7 : 1);
      [[0.7, 'Chậm'], [1, 'Thường'], [1.2, 'Nhanh']].forEach(function (x) {
        spd.appendChild(G.el('button' + (now === x[0] ? '.on' : ''), { onclick: function () { G.S.caiDat.tocDo = x[0]; G.S.caiDat.docCham = x[0] < 1; G.save(); drawSpd(); G.say('Nice to meet you.', 'en'); } }, x[1]));
      });
    })();
    P.set.appendChild(G.el('div.cl-card', G.el('b', G.ic3('headphone', 'ic3-s'), 'Tốc độ giọng đọc'),
      G.el('span.small.faint', 'Áp dụng cho bài học, truyện, ôn tập. Nghe quen rồi thì chuyển sang Nhanh để gần tốc độ người thật. Nút con rùa vẫn luôn đọc chậm.'), spd));
    if (G.reminderCard) P.set.appendChild(G.reminderCard());
    P.set.appendChild(G.el('p.foot', 'Tiến độ lưu trong máy này (bắt đầu ' + G.S.taoLuc + ', giờ Việt Nam).' + (G.cloudReady && G.cloudReady() && G.cloudUser() ? ' Đã bật lưu trên mây.' : ' Nhớ xuất file sao lưu thỉnh thoảng nhé.')));
  };

  // số chạy từ 0 khi mở Sảnh (con số kiểu bảng điều khiển)
  function stat(v, l, ic, suf) {
    var b = G.el('b', String(v) + (suf || ''));
    if (typeof v === 'number' && v > 0) G.countUp(b, 0, v, { suf: suf || '', dur: 900, delay: 150 });
    return G.el('div.stat' + (ic ? '.has-ic' : ''), ic ? G.ic3(ic) : null, b, G.el('span', l));
  }

})();
