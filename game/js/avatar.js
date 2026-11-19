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

  /* Tóc và mặt vẽ trong khung 640 với đầu chuẩn: tâm x 320, đỉnh đầu 150, bề ngang sọ 200.
     Thân vẽ trong khung 512; vị trí đầu thật của từng hình thân nằm ở G.AV_HEAD (công cụ cắt hình tạo ra). */
  function headLayer(ctx, img, hd, X, Y, k) {
    var r = hd.cw / 200, sz = 640 * r * k;
    ctx.drawImage(img, X + (hd.cx - 320 * r) * k, Y + (hd.top - 150 * r) * k, sz, sz);
  }

  /* Tượng giấy (phong cách mô hình giấy): không tách tay chân, mỗi bước là một cú nhún nhảy nhẹ —
     nhấc lên theo đường cong mềm, chạm đất hơi bẹp rồi bật lại, lắc trái / phải quanh chân theo nhịp bước.
     G.hopLift: độ nhấc hiện tại (để vẽ bóng, cầm ô theo). */
  G.hopLift = function (S, phase, moving) { return moving ? Math.abs(Math.sin(phase)) * S * 0.07 : 0; };
  G.hopDraw = function (c, paint, x, footY, S, phase, moving) {
    var X = x - S / 2, Y = footY - S;
    c.save();
    if (!moving) {   // đứng yên: thở nhẹ
      var br = 1 + Math.sin(Date.now() / 600) * 0.012;
      c.translate(x, footY); c.scale(1, br); c.translate(-x, -footY);
    } else {
      var s = Math.sin(phase), up = Math.abs(s), land = Math.pow(1 - up, 4);   // land ≈ 1 lúc chạm đất
      var lift = up * S * 0.07;
      c.translate(x, footY - lift);
      c.rotate(s * 0.07);                                        // lắc theo bước
      c.scale(1 + land * 0.05, 1 - land * 0.07 + up * 0.025);   // chạm đất bẹp nhẹ, lên cao duỗi ra
      c.translate(-x, -footY);
    }
    paint(c, X, Y, S);
    c.restore();
  };

  /* Bước đi bằng khung hình vẽ sẵn (đặt ChatGPT, không cắt ghép bằng code): mỗi hướng có hình đứng <tên>_<hướng>.png
     và 2 khung bước <tên>_<hướng>_w1.png (chân trái trước, tay phải trước), _w2.png (chân phải trước, tay trái trước).
     Một chu kỳ 2 bước: đứng → bước 1 → đứng → bước 2; thân nhấp nhô nhẹ. Hướng phải = lật hình hướng trái.
     Chưa có khung bước thì đi kiểu tượng giấy nhún nhảy (G.hopDraw). base: vd. 'player_han', 'person_linda'. */
  function has(n) { return !!(G.ASSET_REV && G.ASSET_REV[n]); }   // chỉ hỏi tệp có thật (không gọi tệp chưa có → không lỗi 404)
  G.hasWalk = function (base, dir) { var d = dir === 'right' ? 'left' : dir; return has(base + '_' + d + '_w1.png') && has(base + '_' + d + '_w2.png'); };
  G.walkSprite = function (c, base, x, footY, S, dir, phase, moving, plain) {
    var d = dir === 'right' ? 'left' : dir, flip = dir === 'right', stand = base + '_' + d + '.png';
    if (!has(stand)) { stand = base + '_down.png'; d = 'down'; flip = false; }
    if (!moving || plain || !G.hasWalk(base, d)) { G.hopDraw(c, function (cc, X, Y, SS) { G.drawAsset(cc, stand, X, Y, SS, SS, flip); }, x, footY, S, phase, moving); return; }
    var ph = phase * 0.5;   // khung hình: khoảng 2 bước mỗi giây (nhún nhảy thì nhanh hơn)
    var q = Math.floor(((ph % 6.2832) + 6.2832) % 6.2832 / 1.5708);   // 0..3
    var nm = q === 1 ? base + '_' + d + '_w1.png' : q === 3 ? base + '_' + d + '_w2.png' : stand;
    if (!G.asset(nm).ok) nm = stand;
    var bob = (q === 0 || q === 2) ? S * 0.018 : 0;   // lúc hai chân khép thân cao hơn một chút
    G.drawAsset(c, nm, x - S / 2, footY - S - bob, S, S, flip);
  };

  /* Vẽ nhân vật. x, footY: chân; h: chiều cao khung; dir: down / up / left / right; phase, moving: nhịp bước */
  G.drawAvatar = function (ctx, av, x, footY, h, dir, phase, moving) {
    var flip = dir === 'right', d = flip ? 'left' : dir;
    var body = G.asset('body_' + av.ao + '_' + d + '.png');
    if (!body.ok) return;   // hình đang tải: chưa vẽ (không hiện ô xám), khung sau sẽ có
    var k = h / 512, hd = (G.AV_HEAD || {})[av.ao + '_' + d];
    var face = d !== 'up' ? G.asset('face_' + av.mat + '_' + d + '.png') : null;
    var hair = hd ? hairTinted('hair_' + av.toc + '_' + d + '.png', av.mauToc) : null;
    function paint(c, X, Y) {
      c.save();
      if (flip) { c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); }
      c.drawImage(body.img, X, Y, h, h);
      if (hd) {
        if (face && face.ok) headLayer(c, face.img, hd, X, Y, k);
        if (hair) headLayer(c, hair, hd, X, Y, k);
      }
      c.restore();
    }
    G.hopDraw(ctx, paint, x, footY, h, phase, moving);
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
    if (who === 'kai') return G.imgEl('kai_follow.png', cls);
    return G.imgEl('player_' + who + '_' + (pose || 'down') + '.png', cls, pose ? 'player_' + who + '_down.png' : null);
  };
  G.playerName = function () {
    if (G.S.ten) return G.S.ten;
    return G.S.nhanVat === 'minh' ? 'Minh' : G.S.nhanVat === 'han' ? 'Han' : G.S.nhanVat === 'kai' ? 'Kai' : 'Bạn';
  };
})();
