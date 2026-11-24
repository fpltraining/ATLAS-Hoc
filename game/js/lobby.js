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
  function floorProgress(n) {   // phần đã học của một tầng (0 … 1)
    var i, k = 0, all = 0;
    if (n === 1) { for (i = 1; i <= 30; i++) { all++; if (G.roomPassed('en-n-' + (i < 10 ? '0' : '') + i)) k++; } }
    else if (n === 2) { for (i = 0; i < G.EN_HALL_DOORS.length; i++) { all++; if (G.roomPassed(G.EN_HALL_DOORS[i].room)) k++; } }
    else if (n === 3 || n === 4) { var pre = n === 3 ? 'en-a2-' : 'en-b1-'; for (i = 1; i <= 24; i++) { all++; if (G.roomPassed(pre + (i < 10 ? '0' : '') + i)) k++; } }
    return all ? k / all : 0;
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
    var r = enRooms();

    // đầu trang kiểu giấy thủ công: tranh hai hòn đảo (Brightford, Trường Lạc trấn) + chữ ConnectLife đất sét + nút vào thành phố
    root.appendChild(G.el('header.lhero',
      G.el('div.hero-pic', G.imgEl('lobby_hero.webp', 'hero-img')),
      G.el('div.hero-text',
        G.el('img.lobby-title', { src: G.assetUrl('lobby_title.png'), alt: 'ConnectLife · Kết nối cuộc sống' }),
        G.el('p.hero-sub', 'Sống ở Brightford, học tiếng Anh như người bản xứ: học ở trường, nói chuyện ở quán, đi khắp thành phố.'),
        G.el('button.clay-btn', { onclick: function () { G.goCity(lastCity()); } }, 'Vào Brightford ›'),
        G.el('p.hero-prog', G.S.totNghiep.en && G.S.totNghiep.en.A1 ? 'Đã có Chứng chỉ A1 · ' + r.stars + ' sao' : G.enFloorNow() === 1 ? 'Tầng 1 Nền tảng · ' + foundDone() + '/30 buổi' : 'Tầng ' + G.enFloorNow() + ' · ' + r.done + '/5 phòng A1 · ' + r.stars + ' sao')
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
      P.road.appendChild(G.el('p.small.faint.road-note', 'Mỗi tầng học xong thi 2 phần (hiểu và nói) để nhận Chứng chỉ ConnectLife. Chỉ khi qua bài thi đầu ra giao tiếp mới là Tốt nghiệp ConnectLife.'));
      P.road.appendChild(planCard());
      P.road.appendChild(G.el('div.road', G.ROADMAP_EN.map(function (st) {
        var got = !st.final && certs[st.key], here = !st.final && st.floor === cur && !got;
        // nhãn trạng thái: icon 3D + chữ (taste-skill: không dùng emoji làm đầu dòng)
        var tag = st.final ? (G.finalDone && G.finalDone() ? ['grad', 'Đã tốt nghiệp ConnectLife'] : G.finalUnlocked && G.finalUnlocked() ? ['target', 'Đã mở · vào thi ngay'] : ['lock', 'Mở khi có Chứng chỉ Tầng 4'])
          : got ? ['star', 'Đã có chứng chỉ' + (got.noi ? ' · nói ' + got.noi + '/100' : '')] : here ? ['pin', 'Đang học'] : st.soon ? [null, 'Đang xây'] : st.floor < cur ? ['check', 'Vượt theo trình độ đầu vào'] : ['lock', 'Chưa mở'];
        tag = [tag[0] ? G.ic3(tag[0], 'ic3-s') : null, tag[1]];
        return G.el('div.road-step' + (st.final ? '.final' : '') + (got ? '.got' : '') + (here ? '.here' : ''),
          G.el('div.road-dot', st.final ? '🎓' : String(st.floor)),
          G.el('div.road-body', G.el('b', st.name + ' '), G.el('span.road-cefr', st.cefr), G.el('div.small', st.out), st.final || !G.topicsOfFloor ? null : topicLine(st.floor), G.el('span.road-tag', tag), st.final && G.finalUnlocked && G.finalUnlocked() ? G.el('button.btn.seal.sm.road-go', { onclick: G.openFinalExam }, G.finalDone() ? 'Xem bài thi tốt nghiệp ›' : 'Vào thi Tốt nghiệp ConnectLife ›') : null, G.el('span.road-eta', { id: 'eta-' + (st.final ? 'final' : st.floor) })));
      })));
    }

    var who = G.S.nhanVat || 'han';
    P.me.appendChild(G.el('div.profile',
      G.el('div.pchar', G.playerPic(96, 'pchar-img'), G.el('b', G.playerName()),
        G.el('button.btn.sm', { onclick: function () { G.openCreator(function () { G.goLobby(); }); } }, 'Đổi nhân vật')),
      G.el('div.pstats',
        stat(G.S.xp, 'XP', 'star'),
        stat(G.S.chuoi.hienTai, 'Chuỗi học', 'fire', ' ngày'),
        stat(r.done + '/5', 'Phòng A1 đã qua'),
        stat(G.diplomas().filter(function (d) { return d.lang === 'en'; }).length + '/4', 'Chứng chỉ'),
        stat(G.S.tuKho.length, 'Từ cần ôn')
      ),
      G.S.totNghiepCL ? G.el('div.dips', G.el('span.dip-chip.cl', '🎓 Tốt nghiệp ConnectLife · ' + G.S.totNghiepCL.luc.slice(0, 10).split('-').reverse().join('/'))) : null,
      G.diplomas().length ? G.el('div.dips', G.diplomas().map(function (d) {
        return G.el('span.dip-chip', '🏅 Chứng chỉ ' + (d.lang === 'en' ? 'tiếng Anh ' : 'tiếng Trung ') + d.level + ' · hiểu ' + d.info.diem + '/' + d.info.tong + (d.info.noi ? ' · nói ' + d.info.noi : ''));
      })) : null
    ));

    G.enter(root.querySelectorAll('.pstats .stat'), { gap: 50 });
    // huy hiệu trên đầu theo tầng (khi đã có hình)
    var fbg = G.floorBadgeGrid && G.floorBadgeGrid();
    if (fbg) { P.me.appendChild(G.el('h2.sec', 'Huy hiệu trên đầu')); P.me.appendChild(fbg); }
    if (G.checkFloorBadge) setTimeout(G.checkFloorBadge, 700);

    if (G.weeklyChart) {
      P.home.appendChild(G.el('button.big.bic.pl-lobby.lb-today', { onclick: G.openToday }, G.bigIc('calendar', 'Kế hoạch hôm nay'), G.el('span', G.dayProgress().done + '/' + G.dayProgress().all + ' việc · ' + G.dayProgress().mins + ' phút · bấm để xem việc cần làm')));
      if (G.studyChart) P.home.appendChild(G.studyChart());
      P.home.appendChild(G.el('div.out-row',
        G.el('button.big.bic', { onclick: G.openWeekly }, G.bigIc('memo', 'Kiểm tra tuần'), G.el('span', G.weekLine())),
        G.el('button.big.bic', { onclick: G.openCanDo }, G.bigIc('speak', 'Mình nói được'), G.el('span', G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được'))));
      if (G.openMemMap) P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openMemMap(); } }, G.bigIc('brain', 'Bản đồ nhớ từ'),
        G.el('span', G.srsDue && G.srsDue().length ? G.srsDue().length + ' câu đến hạn ôn hôm nay · xem buổi nào sắp quên' : 'Mỗi ô là một buổi học, màu càng xanh là càng nhớ chắc')));
      if (G.openTopics) { var tt = G.topicTotals(); P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: G.openTopics }, G.bigIc('books', 'Từ theo chủ đề'),
        G.el('span', tt.got + '/' + tt.all + ' từ đã học · ' + tt.open + '/' + tt.topics + ' chủ đề đang mở · đọc tin, công sở, kinh tế…'))); }
      // trình độ đầu vào (kiểm tra 4 kỹ năng), làm lại để đo đầu ra
      if (G.openPlacement) {
        var dv = G.S.dauVao;
        P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openPlacement(function () { G.goLobby(); }, { canSkip: true }); } },
          G.bigIc('target', 'Trình độ đầu vào' + (dv ? ': ' + G.levelName(dv.lv) : '')),
          G.el('span', dv && !dv.ban ? 'Bài đầu vào đã sửa (thêm phần Từ vựng, chấm chặt hơn) · nên làm lại để xếp đúng tầng' : dv ? 'Làm ngày ' + dv.luc.slice(8, 10) + '/' + dv.luc.slice(5, 7) + (dv.tv !== undefined && dv.tv !== null ? ' · Từ vựng ' + G.PLACE_EN.levels[dv.tv] : '') + ' · Nghe ' + G.PLACE_EN.levels[dv.nghe] + ' · Đọc ' + G.PLACE_EN.levels[dv.doc] + ' · Giao tiếp ' + G.PLACE_EN.levels[dv.gt] + ' · Nói ' + (dv.noi === null ? 'chưa đo' : G.PLACE_EN.levels[dv.noi]) + ' · bấm để làm lại'
            : 'Chưa làm · 4 kỹ năng theo CEFR, 3–12 phút')));
      }
      // luyện phát âm theo lỗi của mình (bắt lỗi trước nếu chưa làm)
      if (G.openPronFromLobby) {
        var pe = G.pronErrors(), pk = G.S.phatAmKiem;
        P.home.appendChild(G.el('button.big.bic.pl-lobby', { onclick: function () { G.openPronFromLobby(function () { G.goLobby(); }); } },
          G.bigIc('mic', 'Luyện phát âm theo lỗi'),
          G.el('span', pe.length ? 'Lỗi cần sửa: ' + pe.slice(0, 3).map(function (e) { return G.PRON_EN.tags[e.tag]; }).join(' · ') : pk ? 'Chưa thấy lỗi nào · luyện thêm âm cuối, đuôi -s, th' : 'Đọc 12 từ, máy tìm lỗi người Việt hay mắc rồi luyện riêng')));
      }
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
            G.el('span.small.faint', cs.err ? '⚠️ ' + cs.err : cs.luc ? 'Đồng bộ lần cuối lúc ' + cs.luc + ' (giờ Việt Nam). App tự lưu sau mỗi bài.' : 'App tự lưu sau mỗi bài.'),
            G.el('div.row',
              G.el('button.btn.sm', { onclick: function () { G.cloudSync(function (e) { G.toast(e ? e : '☁️ Đã đồng bộ.'); G.renderLobby(); }); } }, G.ic3('repeat', 'ic3-s'), 'Đồng bộ ngay'),
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
      G.switchRow('turtle', 'Đọc truyện chậm', 'Giọng đọc truyện chậm hơn để nghe rõ từng chữ', !!G.S.caiDat.docCham, function (on) { G.S.caiDat.docCham = on; G.save(); }),
      G.canListen ? G.switchRow('mic', 'Dùng micro khi luyện nói', 'Máy nghe bạn nói và chấm điểm phát âm', G.micOn(), function (on) { G.setMic(on); }) : null));
    P.set.appendChild(G.el('p.foot', 'Tiến độ lưu trong máy này (bắt đầu ' + G.S.taoLuc + ', giờ Việt Nam).' + (G.cloudReady && G.cloudReady() && G.cloudUser() ? ' Đã bật lưu trên mây.' : ' Nhớ xuất file sao lưu thỉnh thoảng nhé.')));
  };

  // số chạy từ 0 khi mở Sảnh (con số kiểu bảng điều khiển)
  function stat(v, l, ic, suf) {
    var b = G.el('b', String(v) + (suf || ''));
    if (typeof v === 'number' && v > 0) G.countUp(b, 0, v, { suf: suf || '', dur: 900, delay: 150 });
    return G.el('div.stat' + (ic ? '.has-ic' : ''), ic ? G.ic3(ic) : null, b, G.el('span', l));
  }

})();
