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

  G.defaultAvatar = function () { return { ao: 'hoodie', mat: 'smile', toc: 'messy', mauToc: '#5b3a29' }; };
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

  /* Tóc và mặt vẽ trong khung 640 với đầu chuẩn: tâm x 320, đỉnh đầu 150, bề ngang sọ 200.
     Thân vẽ trong khung 512; vị trí đầu thật của từng hình thân nằm ở G.AV_HEAD (công cụ cắt hình tạo ra). */
  function headLayer(ctx, img, hd, X, Y, k) {
    var r = hd.cw / 200, sz = 640 * r * k;
    ctx.drawImage(img, X + (hd.cx - 320 * r) * k, Y + (hd.top - 150 * r) * k, sz, sz);
  }

  /* Bước đi: tách hình thành thân trên và phần chân (dưới hông), chân trái – chân phải bước so le.
     - Nhìn ngang: vẽ 2 chân (chân sau tối hơn), mỗi chân xoay quanh hông ngược pha nhau như cây kéo;
       chân đang đưa ra trước thì nhấc nhẹ khỏi mặt đất, chân kia trụ.
     - Nhìn trước / sau: nửa trái và nửa phải của phần chân thay nhau nhấc lên (co gối), chân kia trụ;
       thân lắc nhẹ sang phía chân trụ.
     - Thân nhún lên khi một chân đang nhấc, hạ xuống khi hai chân chạm đất. Đứng yên: thở nhẹ.
     paint(c, X, Y, S) vẽ trọn hình trong khung vuông S; hip: tỉ lệ chiều cao tới hông. */
  var legCv = null, legDk = null;
  function legLayers(paint, X, Y, S, hipFrac) {
    // vẽ riêng phần chân ra canvas phụ (bản thường + bản tối cho chân phía sau)
    var W = Math.ceil(S), H = Math.ceil(S);
    if (!legCv) { legCv = document.createElement('canvas'); legDk = document.createElement('canvas'); }
    if (legCv.width !== W || legCv.height !== H) { legCv.width = legDk.width = W; legCv.height = legDk.height = H; }
    var a = legCv.getContext('2d'), d = legDk.getContext('2d');
    a.setTransform(1, 0, 0, 1, 0, 0); a.clearRect(0, 0, W, H);
    a.translate(-X, -Y); paint(a, X, Y, S); a.setTransform(1, 0, 0, 1, 0, 0);   // vẽ đúng toạ độ thật (để lật hình đúng)
    a.clearRect(0, 0, W, Math.floor(S * (hipFrac - 0.07)));        // chỉ giữ phần dưới hông
    d.setTransform(1, 0, 0, 1, 0, 0); d.clearRect(0, 0, W, H);
    d.globalCompositeOperation = 'source-over'; d.drawImage(legCv, 0, 0);
    d.globalCompositeOperation = 'source-atop'; d.fillStyle = 'rgba(20,24,50,.32)'; d.fillRect(0, 0, W, H);
    d.globalCompositeOperation = 'source-over';
    return { n: legCv, dk: legDk };
  }
  G.walkDraw = function (c, paint, x, footY, S, dir, phase, moving, hip) {
    var X = x - S / 2, Y = footY - S;
    if (!moving) {
      var br = 1 + Math.sin(Date.now() / 600) * 0.012;
      c.save(); c.translate(x, footY); c.scale(1, br); c.translate(-x, -footY); paint(c, X, Y, S); c.restore();
      return;
    }
    var s = Math.sin(phase), co = Math.cos(phase), hipY = Y + S * hip;
    var bob = Math.abs(s) * S * 0.028;                 // nhún lên khi một chân đang nhấc
    var side = dir === 'left' || dir === 'right';
    var L = legLayers(paint, X, Y, S, hip);
    if (side) {
      var fwd = dir === 'right' ? -1 : 1;               // xoay dương = bàn chân đưa sang trái
      var sw = s * 0.42;                                // biên độ vung chân (radian)
      // chân sau (tối hơn) ngược pha, rồi chân trước
      for (var k = 0; k < 2; k++) {
        var ang = (k === 0 ? -sw : sw) * fwd;
        var lift = Math.max(0, (k === 0 ? -co : co)) * S * 0.035;   // chân đang đưa ra trước thì nhấc lên
        c.save();
        c.translate(x + (k === 0 ? -fwd * S * 0.02 : 0), hipY - bob * 0.5 - lift);
        c.rotate(ang);
        c.translate(-x, -hipY);
        c.drawImage(k === 0 ? L.dk : L.n, X, Y, S, S);
        c.restore();
      }
    } else {
      for (var sd = -1; sd <= 1; sd += 2) {
        var up = Math.max(0, sd * s);                   // nửa này đang nhấc (0..1)
        up = up * up * (3 - 2 * up);                    // mềm ở hai đầu, chân trụ đứng yên lâu hơn
        c.save(); c.beginPath(); c.rect(sd < 0 ? X - S : x, hipY - S * 0.07 - bob, sd < 0 ? x - (X - S) : S * 2, S * 1.2); c.clip();
        // co gối: phần chân ngắn lại quanh hông và nâng bàn chân lên
        c.translate(x, hipY - bob * 0.6); c.scale(1 + up * 0.03, 1 - up * 0.22); c.translate(-x, -hipY - up * S * 0.035);
        c.drawImage(L.n, X, Y, S, S);
        c.restore();
      }
    }
    // thân trên: nghiêng theo hướng đi, lắc nhẹ sang chân trụ khi nhìn trước/sau
    var lean = dir === 'left' ? -0.05 : dir === 'right' ? 0.05 : 0;
    var sway = side ? 0 : -s * S * 0.012;
    c.save(); c.beginPath(); c.rect(X - S, Y - S, S * 3, hipY - (Y - S) + S * 0.02); c.clip();
    c.translate(x + sway, hipY); c.rotate(lean + (side ? 0 : s * 0.02)); c.translate(-x, -hipY - bob);
    paint(c, X, Y, S); c.restore();
  };

  /* Vẽ nhân vật. x, footY: chân; h: chiều cao khung; dir: down / up / left / right; phase, moving: nhịp bước */
  G.drawAvatar = function (ctx, av, x, footY, h, dir, phase, moving) {
    var flip = dir === 'right', d = flip ? 'left' : dir;
    var body = G.asset('body_' + av.ao + '_' + d + '.png');
    if (!body.ok) { G.drawPlaceholder(ctx, 'body_' + av.ao + '_' + d + '.png', x - h / 2, footY - h, h, h); return; }
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
    G.walkDraw(ctx, paint, x, footY, h, dir, phase, moving, 0.745);
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
