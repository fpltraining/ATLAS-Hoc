/* Màn tạo nhân vật: chọn da, khuôn mặt, kiểu tóc, màu tóc, áo, quần, giày, đặt tên.
   Xem trước nhân vật bước đi và xoay 4 hướng. Có thể chọn nhân vật có sẵn (Han, Minh). */
var G = window.G || (window.G = {});

(function () {
  var av, tab = 'toc', dirIdx = 0, raf = 0, cv, done = null, nameIn;
  var DIRS = ['down', 'left', 'up', 'right'];
  var TABS = [
    { id: 'toc', name: 'Kiểu tóc' }, { id: 'mauToc', name: 'Màu tóc' }, { id: 'mat', name: 'Khuôn mặt' }, { id: 'ao', name: 'Trang phục' }
  ];

  G.openCreator = function (cb) {
    done = cb;
    av = G.S.avatar ? JSON.parse(JSON.stringify(G.S.avatar)) : G.defaultAvatar();
    var root = document.getElementById('create');
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('play').style.display = 'none';
    root.style.display = 'block';
    root.innerHTML = '';
    cv = document.createElement('canvas');
    cv.className = 'cr-canvas';
    nameIn = G.el('input.cr-name', { type: 'text', maxLength: 14, placeholder: 'Tên của bạn', value: G.S.ten || '' });

    root.appendChild(G.el('div.cr-wrap',
      G.el('div.cr-top', G.el('div.kicker', 'Bước 1 · Tạo nhân vật'), G.el('h1', 'Bạn trông thế nào?'),
        G.el('p.small.faint', 'Nhân vật này sẽ sống ở Brightford, đi xe buýt, tàu điện tới trường và học cùng Kai.')),
      G.el('div.cr-stage',
        cv,
        G.el('div.cr-stage-btns',
          G.el('button.btn.sm', { onclick: function () { dirIdx = (dirIdx + 3) % 4; }, 'aria-label': 'Xoay trái' }, '⟲'),
          G.el('button.btn.sm', { onclick: function () { av = G.randomAvatar(); renderOpts(); } }, '🎲 Ngẫu nhiên'),
          G.el('button.btn.sm', { onclick: function () { dirIdx = (dirIdx + 1) % 4; }, 'aria-label': 'Xoay phải' }, '⟳'))
      ),
      G.el('div.cr-tabs', TABS.map(function (t) {
        return G.el('button.cr-tab' + (t.id === tab ? '.on' : ''), { 'data-t': t.id, onclick: function () { tab = t.id; renderOpts(); } }, t.name);
      })),
      G.el('div.cr-opts', { id: 'cr-opts' }),
      G.el('label.cr-label', 'Tên nhân vật', nameIn),
      G.el('button.btn.seal.big1.cr-go', { onclick: finish }, 'Bắt đầu cuộc sống mới ›'),
      G.el('div.cr-preset',
        G.el('p.small.faint', 'Hoặc chọn nhân vật có sẵn:'),
        G.el('div.cr-presets', ['han', 'minh'].map(function (w) {
          return G.el('button.cr-pre', { onclick: function () { pickPreset(w); } }, G.imgEl('player_' + w + '_down.png', 'cr-pre-img'), G.el('b', w === 'han' ? 'Han' : 'Minh'));
        }))
      )
    ));
    renderOpts();
    window.scrollTo(0, 0);
    cancelAnimationFrame(raf);
    var t0 = Date.now();
    (function anim() {
      if (root.style.display === 'none') return;
      drawPreview((Date.now() - t0) / 1000);
      raf = requestAnimationFrame(anim);
    })();
  };

  function drawPreview(t) {
    var px = Math.min(240, Math.round(window.innerWidth * 0.55)), d = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== px * d) { cv.width = px * d; cv.height = px * d; cv.style.width = px + 'px'; cv.style.height = px + 'px'; }
    var g = cv.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0);
    g.clearRect(0, 0, px, px);
    var walking = Math.floor(t / 2.4) % 2 === 1;
    G.drawAvatar(g, av, px / 2, px, px, DIRS[dirIdx], t * 9, walking);
  }

  /* các lựa chọn của thẻ đang mở */
  function renderOpts() {
    var tabs = document.querySelectorAll('.cr-tab');
    for (var i = 0; i < tabs.length; i++) tabs[i].className = 'cr-tab' + (tabs[i].getAttribute('data-t') === tab ? ' on' : '');
    var box = document.getElementById('cr-opts');
    box.innerHTML = '';
    var A = G.AV;
    if (tab === 'mauToc') { box.appendChild(swatches(A.mauToc, 'mauToc')); return; }
    box.appendChild(styles(A[tab], tab, 'down'));
  }

  function swatches(list, key) {
    return G.el('div.cr-sw', list.map(function (col) {
      return G.el('button.sw' + (av[key] === col ? '.on' : ''), { style: { background: col }, 'aria-label': col, onclick: function () { av[key] = col; renderOpts(); } });
    }));
  }
  function styles(list, key, dir) {
    return G.el('div.cr-st', list.map(function (o) {
      var test = JSON.parse(JSON.stringify(av)); test[key] = o.id;
      // có đủ hình thì xem trước cả nhân vật, chưa đủ thì hiện riêng lớp hình đó (hoặc ô ghi tên file)
      var part = (key === 'ao' ? 'body_' : key === 'toc' ? 'hair_' : 'face_') + o.id + '_down.png';
      var full = G.asset('body_' + test.ao + '_down.png').ok && G.asset(part).ok;
      return G.el('button.st' + (av[key] === o.id ? '.on' : ''), { onclick: function () { av[key] = o.id; renderOpts(); } },
        full ? G.avatarCanvas(test, 74, dir) : G.imgEl(part, 'st-part'), G.el('span', o.name));
    }));
  }

  function close() {
    cancelAnimationFrame(raf);
    document.getElementById('create').style.display = 'none';
  }
  function finish() {
    var name = (nameIn.value || '').replace(/^\s+|\s+$/g, '');
    if (!name) { G.toast('Đặt tên cho nhân vật nhé'); nameIn.focus(); return; }
    G.S.avatar = av; G.S.nhanVat = 'custom'; G.S.ten = name;
    G.save();
    close();
    if (done) done();
  }
  function pickPreset(w) {
    G.S.nhanVat = w; G.S.ten = (nameIn.value || '').replace(/^\s+|\s+$/g, '') || (w === 'han' ? 'Han' : 'Minh');
    G.save();
    close();
    if (done) done();
  }

  /* Lời mở đầu sau khi tạo nhân vật */
  G.introStory = function (cb) {
    var lines = [
      'Chào ' + G.playerName() + '! Mình là Kai, bạn robot sẽ đi cùng bạn.',
      'Bạn vừa chuyển tới Brightford, một thị trấn nhỏ ở nước Mỹ tương lai. Ở đây ai cũng nói tiếng Anh.',
      'Hôm nay là ngày đầu đi học ở Trường Anh ngữ. Nhà bạn ở khu phố Maple, trường ở trung tâm.',
      'Ra bến xe buýt hoặc ga tàu điện, nghe thông báo trạm bằng tiếng Anh và xuống đúng trạm nhé!'
    ];
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
