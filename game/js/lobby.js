/* Ngôi nhà chung: màn hình chính dạng trang. Đầu trang, lưới thẻ thành phố (Đang mở / Sắp ra mắt),
   hồ sơ, sao lưu. Bấm thẻ thành phố đang mở để vào bản đồ. */
var G = window.G || (window.G = {});

(function () {
  var CITIES = [
    { id: 'en', name: 'Brightford', lang: 'Tiếng Anh', card: 'card_city_en.png', state: 'open', scene: 'city_en' },
    { id: 'zh', name: 'Trường Lạc trấn 长乐镇', lang: 'Tiếng Trung', card: 'card_city_zh.png', state: 'soon', note: 'Mở ở giai đoạn 3' },
    { id: 'ja', name: 'Thành phố Nhật', lang: 'Tiếng Nhật', card: 'card_city_soon.png', state: 'soon' },
    { id: 'ko', name: 'Thành phố Hàn', lang: 'Tiếng Hàn', card: 'card_city_soon.png', state: 'soon' },
    { id: 'fr', name: 'Thành phố Pháp', lang: 'Tiếng Pháp', card: 'card_city_soon.png', state: 'soon' }
  ];

  function enRooms() {
    var done = 0, stars = 0;
    for (var i = 0; i < G.EN_HALL_DOORS.length; i++) { var p = G.S.phong[G.EN_HALL_DOORS[i].room]; if (p && p.diem >= 8) { done++; stars += p.sao; } }
    return { done: done, stars: stars };
  }

  G.renderLobby = function () {
    var root = document.getElementById('lobby');
    root.innerHTML = '';
    var r = enRooms();

    root.appendChild(G.el('header.lhero',
      G.imgEl('lobby_hero.png', 'hero-img'),
      G.el('div.hero-text',
        G.el('div.kicker', 'Thế giới Ngôn Ngữ'),
        G.el('h1', 'Học thêm một ngôn ngữ, sống thêm một cuộc đời.'),
        G.el('p', 'Mỗi ngôn ngữ là một thành phố. Học ở trường, nói chuyện ở quán, bay sang thành phố khác để kết bạn.'),
        G.el('button.btn.seal.big1', { onclick: function () { G.goCity('en'); } }, 'Vào Brightford ›')
      )
    ));

    root.appendChild(G.el('h2.sec', 'Các thành phố'));
    root.appendChild(G.el('div.cities', CITIES.map(function (c) {
      var open = c.state === 'open';
      var prog = c.id === 'en' ? r.done + '/5 phòng A1 · ' + r.stars + '★' : '';
      return G.el('button.city' + (open ? '' : '.soon'), { onclick: function () { if (open) G.goCity(c.id); else G.toast(c.name + ': ' + (c.note || 'sắp ra mắt')); } },
        G.imgEl(c.card, 'city-img'),
        G.el('b', c.name),
        G.el('span.small', c.lang),
        G.el('span.tag' + (open ? '.open' : ''), open ? 'Đang mở' : (c.note || 'Sắp ra mắt')),
        prog ? G.el('span.small.faint', prog) : null
      );
    })));

    var who = G.S.nhanVat || 'han';
    root.appendChild(G.el('h2.sec', 'Hồ sơ của bạn'));
    root.appendChild(G.el('div.profile',
      G.el('div.pchar', G.imgEl('player_' + who + '_down.png', 'pchar-img'), G.el('b', who === 'han' ? 'Han' : 'Minh'),
        G.el('button.btn.sm', { onclick: function () { G.chooseCharacter(G.renderLobby); } }, 'Đổi nhân vật')),
      G.el('div.pstats',
        stat(G.S.xp, 'XP'),
        stat(G.S.chuoi.hienTai + ' ngày', 'Chuỗi học'),
        stat(r.done + '/5', 'Phòng A1 đã qua'),
        stat(G.S.tuKho.length, 'Từ cần ôn')
      )
    ));

    root.appendChild(G.el('h2.sec', 'Sao lưu và cài đặt'));
    var file = G.el('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onchange: function (e) { if (e.target.files[0]) G.importSave(e.target.files[0], G.renderLobby); e.target.value = ''; } });
    root.appendChild(G.el('div.tools',
      G.el('button.btn', { onclick: G.exportSave }, '⤓ Xuất file sao lưu'),
      G.el('button.btn', { onclick: function () { file.click(); } }, '⤒ Nhập file sao lưu'),
      G.el('button.btn', { onclick: function () { G.S.caiDat.amThanh = !G.S.caiDat.amThanh; G.save(); G.renderLobby(); } }, G.S.caiDat.amThanh ? '🔔 Âm thanh: bật' : '🔕 Âm thanh: tắt'),
      file
    ));
    root.appendChild(G.el('p.foot', 'Tiến độ lưu trong máy này (bắt đầu ' + G.S.taoLuc + ', giờ Việt Nam). Nhớ xuất file sao lưu thỉnh thoảng nhé.'));
  };

  function stat(v, l) { return G.el('div.stat', G.el('b', String(v)), G.el('span', l)); }

  /* Chọn nhân vật (lần đầu và khi đổi) */
  G.chooseCharacter = function (done) {
    var box = G.el('div.choose',
      G.el('h2', 'Chọn nhân vật của bạn'),
      G.el('div.chars', ['han', 'minh'].map(function (w) {
        return G.el('button.char', { onclick: function () { G.S.nhanVat = w; G.save(); document.body.removeChild(wrap); if (done) done(); } },
          G.imgEl('player_' + w + '_down.png', 'char-img'), G.el('b', w === 'han' ? 'Han' : 'Minh'));
      })),
      G.el('p.small.faint', 'Kai, bạn robot, sẽ đi cùng bạn ở mọi thành phố.')
    );
    var wrap = G.el('div.modal', box);
    document.body.appendChild(wrap);
  };
})();
