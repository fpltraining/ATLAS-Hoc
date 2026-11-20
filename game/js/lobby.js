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
      if (!st.final) { if (certs[st.key] || st.floor < cur) h = 0; else if (st.floor === cur) h = h * (1 - floorProgress(st.floor) * 0.85); }
      else if (G.S.totNghiepCL) h = 0;
      sum += h; out.push({ st: st, left: h, cum: sum });
    });
    return out;
  }
  function monthOf(days) { var p = G.vnParts(Date.now() + days * 86400000); return 'tháng ' + p.m + '/' + p.y; }
  function span(days) { var m = days / 30.4; return m < 1.5 ? Math.max(1, Math.round(days / 7)) + ' tuần' : m < 24 ? Math.round(m) + ' tháng' : (Math.round(m / 12 * 10) / 10 + ' năm').replace('.', ','); }
  function planCard() {
    var cd = G.S.caiDat = G.S.caiDat || {}, mins = cd.phutNgay || 40, dpw = cd.ngayTuan || 6;
    var out = G.el('div.plan-out'), minsL = G.el('b'), dpwL = G.el('b');
    function draw() {
      minsL.textContent = mins + ' phút / ngày'; dpwL.textContent = dpw + ' ngày / tuần';
      var perWeek = mins * dpw / 60, rows = remainHours(), last = rows[rows.length - 1];
      rows.forEach(function (r) {
        var el = document.getElementById('eta-' + (r.st.final ? 'final' : r.st.floor)); if (!el) return;
        el.textContent = r.left <= 0 ? '' : '⏱ Dự kiến ' + monthOf(r.cum / perWeek * 7) + ' (còn khoảng ' + Math.round(r.left) + ' giờ)';
      });
      var days = last.cum / perWeek * 7;
      out.innerHTML = '';
      out.appendChild(G.el('div.plan-big', G.el('span', '🎓 Tốt nghiệp ConnectLife khoảng'), G.el('b', monthOf(days)), G.el('span.small', 'sau khoảng ' + span(days) + ' · còn ' + Math.round(last.cum) + ' giờ học · ' + (Math.round(perWeek * 10) / 10 + '').replace('.', ',') + ' giờ mỗi tuần')));
      var faster = Math.min(180, mins + 20);
      if (mins < 180) out.appendChild(G.el('div.small.faint', 'Nếu học ' + faster + ' phút mỗi ngày: khoảng ' + span(last.cum / (faster * dpw / 60) * 7) + '.'));
    }
    function slider(min, max, step, val, on) {
      return G.el('input.plan-range', { type: 'range', min: min, max: max, step: step, value: val, oninput: function (e) { on(+e.target.value); draw(); },
        onchange: function () { cd.phutNgay = mins; cd.ngayTuan = dpw; G.save(); if (G.updateHud) G.updateHud(); } });
    }
    var card = G.el('div.plan',
      G.el('b.plan-h', '⏱ Bạn học bao lâu mỗi ngày?'),
      G.el('div.plan-row', G.el('span', 'Thời gian'), slider(10, 180, 5, mins, function (v) { mins = v; }), minsL),
      G.el('div.plan-row', G.el('span', 'Số ngày'), slider(3, 7, 1, dpw, function (v) { dpw = v; }), dpwL),
      out,
      G.el('div.small.faint', 'Ước chừng theo số giờ cần để đạt từng cấp (gồm học bài, ôn tập và luyện nói ngoài phố), tính từ chỗ bạn đang học. Số phút bạn chọn cũng là mục tiêu mỗi ngày trên vòng tiến độ. Học đều mỗi ngày hiệu quả hơn học dồn.'));
    draw(); setTimeout(draw, 0);   // vẽ ngay phần tổng; dòng ước tính từng tầng điền sau khi danh sách tầng đã có
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
        G.el('a.btn.sm.p3d-link', { href: 'pho3d.html' }, '🌆 Dạo phố 3D (bản thử)')
      )
    ));

    root.appendChild(G.el('h2.sec', 'Thành phố của bạn'));
    root.appendChild(G.el('div.cities', CITIES.map(function (c) {
      var open = c.state === 'open';
      var z = rooms(G.ZH_HALL_DOORS);
      var prog = c.id === 'en' ? (G.S.totNghiep.en && G.S.totNghiep.en.A1 ? '🏅 Chứng chỉ A1 · ' + r.stars + '★' : G.enFloorNow() === 1 ? '🏫 Tầng 1 Nền tảng · ' + foundDone() + '/30 buổi' : r.done + '/5 phòng A1 · ' + r.stars + '★')
        : c.id === 'zh' ? (G.S.totNghiep.zh && G.S.totNghiep.zh.HSK1 ? '🎓 Đã tốt nghiệp HSK1 · ' : z.done + '/6 phòng HSK1 · ') + z.stars + '★' : '';
      return G.el('button.city' + (open ? '' : '.soon'), { onclick: function () { if (open) G.goCity(c.id); else G.toast(c.name + ': ' + (c.note || 'sắp ra mắt')); } },
        G.imgEl(c.card, 'city-img'),
        G.el('b.city-name', c.name),
        G.el('span.city-lang', c.lang),
        G.el('span.tag' + (open ? '.open' : ''), open ? 'Đang mở' : (c.note || 'Sắp ra mắt')),
        prog ? G.el('span.city-prog', prog) : null
      );
    })));

    // lộ trình tới đầu ra giao tiếp: mỗi tầng một Chứng chỉ ConnectLife, cuối cùng là Tốt nghiệp ConnectLife
    if (G.ROADMAP_EN) {
      var cur = G.enFloorNow(), certs = (G.S.totNghiep && G.S.totNghiep.en) || {};
      root.appendChild(G.el('h2.sec', 'Lộ trình tới giao tiếp'));
      root.appendChild(G.el('p.small.faint.road-note', 'Mỗi tầng học xong thi 2 phần (hiểu và nói) để nhận Chứng chỉ ConnectLife. Chỉ khi qua bài thi đầu ra giao tiếp mới là Tốt nghiệp ConnectLife.'));
      root.appendChild(planCard());
      root.appendChild(G.el('div.road', G.ROADMAP_EN.map(function (st) {
        var got = !st.final && certs[st.key], here = !st.final && st.floor === cur && !got;
        var tag = st.final ? (G.finalDone && G.finalDone() ? '🎓 Đã tốt nghiệp ConnectLife' : G.finalUnlocked && G.finalUnlocked() ? '🔓 Đã mở · vào thi ngay' : '🔒 Mở khi có Chứng chỉ Tầng 4') : got ? '🏅 Đã có chứng chỉ' + (got.noi ? ' · nói ' + got.noi + '/100' : '') : here ? '📍 Đang học' : st.soon ? '🚧 Đang xây' : st.floor < cur ? '✓ Vượt theo trình độ đầu vào' : '🔒 Chưa mở';
        return G.el('div.road-step' + (st.final ? '.final' : '') + (got ? '.got' : '') + (here ? '.here' : ''),
          G.el('div.road-dot', st.final ? '🎓' : String(st.floor)),
          G.el('div.road-body', G.el('b', st.name + ' '), G.el('span.road-cefr', st.cefr), G.el('div.small', st.out), G.el('span.road-tag', tag), st.final && G.finalUnlocked && G.finalUnlocked() ? G.el('button.btn.seal.sm.road-go', { onclick: G.openFinalExam }, G.finalDone() ? 'Xem bài thi tốt nghiệp ›' : 'Vào thi Tốt nghiệp ConnectLife ›') : null, G.el('span.road-eta', { id: 'eta-' + (st.final ? 'final' : st.floor) })));
      })));
    }

    var who = G.S.nhanVat || 'han';
    root.appendChild(G.el('h2.sec', 'Hồ sơ của bạn'));
    root.appendChild(G.el('div.profile',
      G.el('div.pchar', G.playerPic(96, 'pchar-img'), G.el('b', G.playerName()),
        G.el('button.btn.sm', { onclick: function () { G.openCreator(function () { G.goLobby(); }); } }, 'Đổi nhân vật')),
      G.el('div.pstats',
        stat(G.S.xp, 'XP'),
        stat(G.S.chuoi.hienTai + ' ngày', 'Chuỗi học'),
        stat(r.done + '/5', 'Phòng A1 đã qua'),
        stat(G.diplomas().filter(function (d) { return d.lang === 'en'; }).length + '/4', 'Chứng chỉ'),
        stat(G.S.tuKho.length, 'Từ cần ôn')
      ),
      G.S.totNghiepCL ? G.el('div.dips', G.el('span.dip-chip.cl', '🎓 Tốt nghiệp ConnectLife · ' + G.S.totNghiepCL.luc.slice(0, 10).split('-').reverse().join('/'))) : null,
      G.diplomas().length ? G.el('div.dips', G.diplomas().map(function (d) {
        return G.el('span.dip-chip', '🏅 Chứng chỉ ' + (d.lang === 'en' ? 'tiếng Anh ' : 'tiếng Trung ') + d.level + ' · hiểu ' + d.info.diem + '/' + d.info.tong + (d.info.noi ? ' · nói ' + d.info.noi : ''));
      })) : null
    ));

    // huy hiệu trên đầu theo tầng (khi đã có hình)
    var fbg = G.floorBadgeGrid && G.floorBadgeGrid();
    if (fbg) { root.appendChild(G.el('h2.sec', 'Huy hiệu trên đầu')); root.appendChild(fbg); }
    if (G.checkFloorBadge) setTimeout(G.checkFloorBadge, 700);

    if (G.weeklyChart) {
      root.appendChild(G.el('h2.sec', 'Đầu ra của bạn'));
      root.appendChild(G.el('div.out-row',
        G.el('button.big', { onclick: G.openWeekly }, G.el('b', '📝 Kiểm tra tuần'), G.el('span', G.weekLine())),
        G.el('button.big', { onclick: G.openCanDo }, G.el('b', '📒 Mình nói được'), G.el('span', G.canDoStats().n + '/' + G.canDoStats().total + ' việc đã làm được'))));
      // trình độ đầu vào (kiểm tra 4 kỹ năng), làm lại để đo đầu ra
      if (G.openPlacement) {
        var dv = G.S.dauVao;
        root.appendChild(G.el('button.big.pl-lobby', { onclick: function () { G.openPlacement(function () { G.goLobby(); }, { canSkip: true }); } },
          G.el('b', '📏 Trình độ đầu vào' + (dv ? ': ' + G.levelName(dv.lv) : '')),
          G.el('span', dv ? 'Làm ngày ' + dv.luc.slice(8, 10) + '/' + dv.luc.slice(5, 7) + ' · Nghe ' + G.PLACE_EN.levels[dv.nghe] + ' · Đọc ' + G.PLACE_EN.levels[dv.doc] + ' · Giao tiếp ' + G.PLACE_EN.levels[dv.gt] + ' · Nói ' + (dv.noi === null ? 'chưa đo' : G.PLACE_EN.levels[dv.noi]) + ' · bấm để làm lại'
            : 'Chưa làm · 4 kỹ năng theo CEFR, 3–12 phút')));
      }
      root.appendChild(G.weeklyChart());
    }
    root.appendChild(G.el('h2.sec', 'Rank và huy hiệu'));
    root.appendChild(G.rankCard());
    root.appendChild(G.badgeGrid());

    root.appendChild(G.el('h2.sec', 'Đồ kỷ niệm'));
    root.appendChild(G.el('div.souvs', G.souvenirs().map(function (v) {
      return G.el('div.souv' + (v.got ? '' : '.lock'), G.imgEl(v.item.img, 'souv-img'), G.el('b', v.got ? v.item.name : '???'), G.el('span.faint', v.place));
    })));

    root.appendChild(G.el('h2.sec', 'Sao lưu và cài đặt'));
    // lưu trên mây (Supabase): đăng nhập một lần, tự đồng bộ
    if (G.cloudReady && G.cloudReady()) {
      var cu = G.cloudUser(), cs = G.cloudStatus();
      root.appendChild(cu
        ? G.el('div.cl-card', G.el('b', '☁️ Đang lưu trên mây · ' + cu.email),
            G.el('span.small.faint', cs.err ? '⚠️ ' + cs.err : cs.luc ? 'Đồng bộ lần cuối lúc ' + cs.luc + ' (giờ Việt Nam). App tự lưu sau mỗi bài.' : 'App tự lưu sau mỗi bài.'),
            G.el('div.row',
              G.el('button.btn.sm', { onclick: function () { G.cloudSync(function (e) { G.toast(e ? e : '☁️ Đã đồng bộ.'); G.renderLobby(); }); } }, '🔄 Đồng bộ ngay'),
              G.el('button.btn.sm.ghost', { onclick: function () { G.confirm('Đăng xuất lưu trên mây? Tiến độ vẫn giữ trong máy này.', function () { G.cloudSignOut(); G.renderLobby(); }); } }, 'Đăng xuất')))
        : G.el('div.cl-card', G.el('b', '☁️ Lưu tiến độ trên mây'),
            G.el('span.small.faint', 'Đăng nhập một lần để app tự lưu, đổi máy hay xoá app cũng không mất bài. Không cần xuất file sao lưu nữa.'),
            G.el('button.btn.seal.sm', { onclick: function () { G.openCloudLogin(function () { G.renderLobby(); }); } }, 'Đăng nhập / Tạo tài khoản')));
    }
    var file = G.el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onchange: function (e) { if (e.target.files[0]) G.importSave(e.target.files[0], G.renderLobby); e.target.value = ''; } });
    root.appendChild(G.el('div.tools',
      G.el('button.btn', { onclick: G.exportSave }, '⤓ Xuất file sao lưu'),
      G.el('button.btn', { onclick: function () { file.click(); } }, '⤒ Nhập file sao lưu'),
      G.el('button.btn', { onclick: function () { G.S.caiDat.amThanh = !G.S.caiDat.amThanh; G.save(); G.renderLobby(); } }, G.S.caiDat.amThanh ? '🔔 Âm thanh: bật' : '🔕 Âm thanh: tắt'),
      G.el('button.btn', { onclick: function () { G.setMusic(!G.musicOn()); G.renderLobby(); } }, G.musicOn() ? '🎹 Nhạc nền: bật' : '🎹 Nhạc nền: tắt'),
      file
    ));
    root.appendChild(G.el('p.foot', 'Tiến độ lưu trong máy này (bắt đầu ' + G.S.taoLuc + ', giờ Việt Nam).' + (G.cloudReady && G.cloudReady() && G.cloudUser() ? ' Đã bật lưu trên mây.' : ' Nhớ xuất file sao lưu thỉnh thoảng nhé.')));
  };

  function stat(v, l) { return G.el('div.stat', G.el('b', String(v)), G.el('span', l)); }

})();
