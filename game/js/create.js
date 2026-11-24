/* Màn chọn nhân vật: chọn 1 trong 3 nhân vật có sẵn (Han, Minh, Kai), đặt tên nếu muốn.
   Gọn và nhanh để vào học ngay. (Nhân vật tự tạo từ bản cũ vẫn hiển thị bình thường.) */
var G = window.G || (window.G = {});

(function () {
  var done = null, nameIn, pick = 'han';
  var CHARS = [
    { id: 'han', name: 'Han', img: 'player_han_down.png', note: 'Chăm chỉ, thích thể thao điện tử' },
    { id: 'minh', name: 'Minh', img: 'player_minh_down.png', note: 'Tò mò, thích khám phá thành phố' },
    { id: 'kai', name: 'Kai', img: 'kai_follow.png', note: 'Robot nhỏ, học tiếng Anh cùng bạn' }
  ];

  G.openCreator = function (cb) {
    done = cb;
    pick = G.S.nhanVat && G.S.nhanVat !== 'custom' ? G.S.nhanVat : 'han';
    var root = document.getElementById('create');
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('play').style.display = 'none';
    root.style.display = 'block';
    root.innerHTML = '';
    nameIn = G.el('input.cr-name', { type: 'text', maxLength: 14, placeholder: 'Để trống thì dùng tên nhân vật', value: G.S.ten || '' });
    var grid = G.el('div.cr-chars');
    function draw() {
      grid.innerHTML = '';
      CHARS.forEach(function (c) {
        grid.appendChild(G.el('button.cr-pre' + (pick === c.id ? '.on' : ''), { onclick: function () { pick = c.id; draw(); } },
          G.imgEl(c.img, 'cr-pre-img'), G.el('b', c.name), G.el('span.small.faint', c.note)));
      });
    }
    draw();
    root.appendChild(G.el('div.cr-wrap',
      G.el('div.cr-top', G.el('div.kicker', 'Bắt đầu'), G.el('h1', 'Chọn nhân vật của bạn'),
        G.el('p.small.faint', 'Nhân vật sẽ sống ở Brightford, đi bộ hoặc đi xe buýt, xe đưa đón tới trường và học tiếng Anh mỗi ngày.')),
      grid,
      G.el('label.cr-label', 'Tên của bạn (không bắt buộc)', nameIn),
      G.el('button.btn.seal.big1.cr-go', { onclick: finish }, 'Vào học ngay ›'),
      // đã học ở máy khác: đăng nhập để lấy tiến độ trên mây, khỏi tạo lại từ đầu
      G.cloudReady && G.cloudReady() ? G.el('button.btn.ghost.cr-cloud', { onclick: function () {
        G.openCloudLogin(function () { if (G.S.nhanVat) { close(); G.renderLobby(); } });
      } }, G.ic3('cloud', 'ic3-s'), ' Đã học trên máy khác? Đăng nhập để lấy tiến độ') : null
    ));
    window.scrollTo(0, 0);
  };

  function close() { document.getElementById('create').style.display = 'none'; }
  function finish() {
    var c = null; for (var i = 0; i < CHARS.length; i++) if (CHARS[i].id === pick) c = CHARS[i];
    G.S.nhanVat = pick;
    G.S.ten = (nameIn.value || '').replace(/^\s+|\s+$/g, '') || c.name;
    G.save();
    close();
    if (done) done();
  }

  /* Lời mở đầu sau khi tạo nhân vật */
  G.introStory = function (cb) {
    var lines = [
      G.S.nhanVat === 'kai' ? 'Chào ' + G.playerName() + '! Bạn là một robot nhỏ vừa được gửi tới Brightford để học tiếng Anh.'
        : 'Chào ' + G.playerName() + '! Mình là Kai, bạn robot sẽ đi cùng bạn.',
      'Bạn vừa chuyển tới Brightford, một thị trấn nhỏ ở nước Mỹ tương lai. Ở đây ai cũng nói tiếng Anh.',
      'Hôm nay là ngày đầu đi học ở Trường Anh ngữ. Nhà bạn ở khu phố Maple, trường ở trung tâm.',
      'Đi bộ sang Trung tâm tới trường, hoặc ra bến xe buýt nghe thông báo trạm bằng tiếng Anh và xuống đúng trạm nhé!'
    ];
    if (G.S.dauVao && G.S.dauVao.lv <= 1) lines.push('Bạn mới bắt đầu nên mình sẽ dẫn bạn học Tầng 1 · Nền tảng trước: phát âm và những từ dùng nhiều nhất. Câu nào cũng có nghĩa tiếng Việt, bấm nút con rùa để nghe chậm.');
    else if (G.S.dauVao && G.S.dauVao.lv === 2) lines.push('Bạn học ở Tầng 2 · A1: 4 phòng, 16 buổi. Mỗi buổi khoảng 30–40 phút: Học, Luyện, rồi Kiểm tra.');
    else if (G.S.dauVao && G.S.dauVao.lv >= 3) lines.push('Trình độ của bạn từ A2: bạn học tiếp ở Tầng 3 · A2 – B1. Các tầng dưới vẫn mở nếu muốn ôn lại.');
    var i = 0, txt = G.el('p.st-text'), pic = G.el('div.st-kai');
    pic.appendChild(G.imgEl('kai_follow.png', 'st-kai-img'));
    var btn = G.el('button.btn.seal.big1', { onclick: next }, 'Tiếp ›');
    var wrap = G.el('div.modal', G.el('div.choose.story', pic, txt, btn));
    function next() {
      if (i >= lines.length) { document.body.removeChild(wrap); if (cb) cb(); return; }
      txt.textContent = lines[i];
      i++;
      if (i === lines.length) btn.textContent = 'Ra khỏi nhà ›';
    }
    document.body.appendChild(wrap);
    next();
  };
})();
