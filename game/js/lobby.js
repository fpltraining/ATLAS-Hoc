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
      var prog = c.id === 'en' ? (G.S.totNghiep.en && G.S.totNghiep.en.A1 ? '🎓 Đã tốt nghiệp A1 · ' + r.stars + '★' : G.enFloorNow() === 1 ? '🏫 Tầng 1 Nền tảng · ' + foundDone() + '/30 buổi' : r.done + '/5 phòng A1 · ' + r.stars + '★')
        : c.id === 'zh' ? (G.S.totNghiep.zh && G.S.totNghiep.zh.HSK1 ? '🎓 Đã tốt nghiệp HSK1 · ' : z.done + '/6 phòng HSK1 · ') + z.stars + '★' : '';
      return G.el('button.city' + (open ? '' : '.soon'), { onclick: function () { if (open) G.goCity(c.id); else G.toast(c.name + ': ' + (c.note || 'sắp ra mắt')); } },
        G.imgEl(c.card, 'city-img'),
        G.el('b.city-name', c.name),
        G.el('span.city-lang', c.lang),
        G.el('span.tag' + (open ? '.open' : ''), open ? 'Đang mở' : (c.note || 'Sắp ra mắt')),
        prog ? G.el('span.city-prog', prog) : null
      );
    })));

    var who = G.S.nhanVat || 'han';
    root.appendChild(G.el('h2.sec', 'Hồ sơ của bạn'));
    root.appendChild(G.el('div.profile',
      G.el('div.pchar', G.playerPic(96, 'pchar-img'), G.el('b', G.playerName()),
        G.el('button.btn.sm', { onclick: function () { G.openCreator(function () { G.goLobby(); }); } }, 'Đổi nhân vật')),
      G.el('div.pstats',
        stat(G.S.xp, 'XP'),
        stat(G.S.chuoi.hienTai + ' ngày', 'Chuỗi học'),
        stat(r.done + '/5', 'Phòng A1 đã qua'),
        stat(G.S.tuKho.length, 'Từ cần ôn')
      ),
      G.diplomas().length ? G.el('div.dips', G.diplomas().map(function (d) {
        return G.el('span.dip-chip', '🎓 ' + (d.lang === 'en' ? 'Tiếng Anh ' : 'Tiếng Trung ') + d.level + ' · ' + d.info.diem + '/' + d.info.tong);
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
