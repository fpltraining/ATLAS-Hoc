/* Nhân vật tự tạo: ghép từ các lớp hình do ChatGPT vẽ (không vẽ bằng code).
   Lớp 1: thân + trang phục  body_<trang phục>_<hướng>.png  (đầu trọc, mặt trống)
   Lớp 2: khuôn mặt          face_<kiểu>_<hướng>.png        (chỉ hướng down và left)
   Lớp 3: tóc                hair_<kiểu>_<hướng>.png        (vẽ màu xám nhạt, game tô màu tóc đã chọn)
   Mọi lớp cùng khổ vuông, cùng vị trí, chồng thẳng lên nhau. Hướng right = lật ảnh left.
   Chưa có file thì hiện ô màu ghi tên file. */
var G = window.G || (window.G = {});

(function () {
  G.AV = {
    ao: [
      { id: 'hoodie', name: 'Hoodie' }, { id: 'jacket', name: 'Áo khoác jean' }, { id: 'uniform', name: 'Đồng phục' },
      { id: 'sport', name: 'Đồ thể thao' }, { id: 'sweater', name: 'Áo len + váy' }, { id: 'tech', name: 'Áo khoác 2080' }
    ],
    mat: [
      { id: 'gentle', name: 'Hiền' }, { id: 'sparkle', name: 'Long lanh' }, { id: 'smile', name: 'Tươi cười' },
      { id: 'cool', name: 'Ngầu' }, { id: 'calm', name: 'Điềm tĩnh' }, { id: 'wink', name: 'Nháy mắt' }
    ],
    toc: [
      { id: 'messy', name: 'Ngắn rối' }, { id: 'spiky', name: 'Dựng' }, { id: 'bowl', name: 'Mái bằng' }, { id: 'curly', name: 'Xoăn' },
      { id: 'sidepart', name: 'Rẽ ngôi' }, { id: 'bun', name: 'Búi' }, { id: 'ponytail', name: 'Đuôi ngựa' }, { id: 'long', name: 'Dài' }
    ],
    mauToc: ['#2a2220', '#5b3a29', '#8a5a3b', '#c9893e', '#e8c66a', '#c8553d', '#4a68d8', '#b46fc0', '#e9e6df']
  };
  var DIRS = ['down', 'up', 'left'];

  /* danh sách tên file các lớp, để thêm vào danh sách hình của game */
  G.avatarFiles = function () {
    var out = [], A = G.AV, i, d;
    for (i = 0; i < A.ao.length; i++) for (d = 0; d < 3; d++) out.push('body_' + A.ao[i].id + '_' + DIRS[d] + '.png');
    for (i = 0; i < A.toc.length; i++) for (d = 0; d < 3; d++) out.push('hair_' + A.toc[i].id + '_' + DIRS[d] + '.png');
    for (i = 0; i < A.mat.length; i++) { out.push('face_' + A.mat[i].id + '_down.png'); out.push('face_' + A.mat[i].id + '_left.png'); }
    return out;
  };

  G.ASSET_LIST = G.ASSET_LIST.concat(G.avatarFiles());

  G.defaultAvatar = function () { return { ao: 'hoodie', mat: 'gentle', toc: 'messy', mauToc: '#5b3a29' }; };
  G.randomAvatar = function () {
    var A = G.AV;
    function r(a) { return a[Math.floor(Math.random() * a.length)]; }
    return { ao: r(A.ao).id, mat: r(A.mat).id, toc: r(A.toc).id, mauToc: r(A.mauToc) };
  };

  /* tóc: tô màu đã chọn lên hình tóc xám (giữ nét viền tối), nhớ kết quả */
  var tinted = {};
  function hairTinted(name, col) {
    var key = name + col;
    if (tinted[key]) return tinted[key];
    var a = G.asset(name);
    if (!a.ok) return null;
    var w = a.img.naturalWidth, h = a.img.naturalHeight;
    var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d');
    g.drawImage(a.img, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = col; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(a.img, 0, 0);
    tinted[key] = cv;
    return cv;
  }

  function layer(ctx, img, x, y, s, flip) {
    if (flip) { ctx.save(); ctx.translate(x + s, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, s, s); ctx.restore(); }
    else ctx.drawImage(img, x, y, s, s);
  }

  /* Vẽ nhân vật. x, footY: chân; h: chiều cao khung; dir: down / up / left / right; phase, moving: nhịp bước */
  G.drawAvatar = function (ctx, av, x, footY, h, dir, phase, moving) {
    var flip = dir === 'right', d = flip ? 'left' : dir;
    var bob = moving ? Math.abs(Math.sin(phase)) * h * 0.04 : 0;
    var X = x - h / 2, Y = footY - h - bob;
    var body = G.asset('body_' + av.ao + '_' + d + '.png');
    if (!body.ok) { G.drawPlaceholder(ctx, 'body_' + av.ao + '_' + d + '.png', X, Y, h, h); return; }
    if (moving) { ctx.save(); ctx.translate(x, footY); ctx.rotate(Math.sin(phase) * 0.04); ctx.translate(-x, -footY); }
    layer(ctx, body.img, X, Y, h, flip);
    if (d !== 'up') {
      var face = G.asset('face_' + av.mat + '_' + d + '.png');
      if (face.ok) layer(ctx, face.img, X, Y, h, flip);
    }
    var hair = hairTinted('hair_' + av.toc + '_' + d + '.png', av.mauToc);
    if (hair) layer(ctx, hair, X, Y, h, flip);
    if (moving) ctx.restore();
  };

  /* Ảnh nhỏ của nhân vật (canvas) để đặt trong trang; tự vẽ lại khi các lớp hình tải xong */
  G.avatarCanvas = function (av, px, dir, cls) {
    var cv = document.createElement('canvas'), dp = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(px * dp); cv.height = Math.round(px * dp);
    cv.style.width = px + 'px'; cv.style.height = px + 'px';
    if (cls) cv.className = cls;
    var tries = 0;
    function paint() {
      var g = cv.getContext('2d');
      g.setTransform(dp, 0, 0, dp, 0, 0); g.clearRect(0, 0, px, px);
      G.drawAvatar(g, av, px / 2, px, px, dir || 'down', 0, false);
      if (++tries < 6) setTimeout(paint, 250 * tries);
    }
    paint();
    return cv;
  };

  /* Ảnh của người chơi hiện tại (nhân vật có sẵn hoặc tự tạo) */
  G.playerPic = function (px, cls, pose) {
    if (G.S.nhanVat === 'custom' && G.S.avatar) return G.avatarCanvas(G.S.avatar, px, 'down', cls);
    var who = G.S.nhanVat || 'han';
    return G.imgEl('player_' + who + '_' + (pose || 'down') + '.png', cls, pose ? 'player_' + who + '_down.png' : null);
  };
  G.playerName = function () {
    if (G.S.ten) return G.S.ten;
    return G.S.nhanVat === 'minh' ? 'Minh' : G.S.nhanVat === 'han' ? 'Han' : 'Bạn';
  };
})();
