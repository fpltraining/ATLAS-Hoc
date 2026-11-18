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

  /* Bước đi như người thật: chân trái – chân phải bước so le, tay đánh ngược nhịp với chân
     (bước chân trái thì tay phải đưa ra trước).
     Hình được tách thành 3 lớp: tay (theo vùng tay khai báo ở G.ARMS), thân trên, phần chân dưới hông.
     - Nhìn ngang: 2 chân xoay quanh hông ngược pha như cây kéo (chân sau tối hơn); tay trước và tay sau
       (bản tối, sau lưng) xoay quanh vai ngược với chân cùng phía.
     - Nhìn trước / sau: nửa chân trái – phải thay nhau nhấc (co gối); hai tay đánh lệch nhau quanh vai.
     - Thân nhún lên khi một chân đang nhấc. Đứng yên: thở nhẹ.
     paint(c, X, Y, S) vẽ trọn hình trong khung vuông S; hip: tỉ lệ chiều cao tới hông;
     arms: danh sách tay { r: [x0, y0, x1, y1] (% khung), p: [x, y] vai } — không có thì tay đi theo thân. */
  G.ARMS = {
    'player_han_down.png': [{ r: [28, 51, 37.5, 78], p: [36, 53] }, { r: [62.5, 51, 72, 78], p: [64, 53] }],
    'player_han_up.png': [{ r: [28, 52, 37.5, 78], p: [36, 54] }, { r: [62.5, 52, 72, 78], p: [64, 54] }],
    'player_han_left.png': [{ r: [36, 51, 46.5, 73], p: [43, 53], patch: [40, 46.5] }],
    'player_minh_down.png': [{ r: [22, 52, 36.5, 80], p: [35, 54] }, { r: [63.5, 52, 78, 80], p: [65, 54] }],
    'player_minh_up.png': [{ r: [22, 52, 36.5, 80], p: [35, 54] }, { r: [63.5, 52, 78, 80], p: [65, 54] }],
    'player_minh_left.png': [{ r: [44, 51, 55.5, 77], p: [50, 53], patch: [44, 55.5] }]
  };
  var CV = {};
  function cvs(name, W, H) {
    var c = CV[name];
    if (!c) { c = CV[name] = document.createElement('canvas'); }
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    var g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    return c;
  }
  function darken(src, name) {
    var d = cvs(name, src.width, src.height), g = d.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,24,50,.32)'; g.fillRect(0, 0, d.width, d.height);
    g.globalCompositeOperation = 'source-over';
    return d;
  }
  /* tách lớp: full → (tay i), thân không tay → chân, thân trên */
  function layers(paint, X, Y, S, hipFrac, arms, flipX) {
    var W = Math.ceil(S), H = Math.ceil(S), k = S / 100;
    var full = cvs('full', W, H), fg = full.getContext('2d');
    fg.translate(-X, -Y); paint(fg, X, Y, S); fg.setTransform(1, 0, 0, 1, 0, 0);   // vẽ đúng toạ độ thật để lật hình đúng
    var out = { arms: [] };
    if (arms) for (var i = 0; i < arms.length; i++) {
      var r0 = arms[i].r, r = flipX ? [100 - r0[2], r0[1], 100 - r0[0], r0[3]] : r0;   // hình lật thì lật cả vùng tay
      // toạ độ nguyên để không có đường kẻ mờ ở mép cắt
      var rx = Math.round(r[0] * k), ry = Math.round(r[1] * k), rw = Math.round(r[2] * k) - rx, rh = Math.round(r[3] * k) - ry;
      var ac = cvs('arm' + i, W, H), ag = ac.getContext('2d');
      ag.drawImage(full, rx, ry, rw, rh, rx, ry, rw, rh);
      out.arms.push(ac);
      if (arms[i].patch) {
        // nhìn ngang: tay đè lên thân → chỗ tay để lại được vá bằng phần thân ngay phía sau tay (chỉ trong vùng thân)
        var q = arms[i].patch, q0 = flipX ? 100 - q[1] : q[0], q1 = flipX ? 100 - q[0] : q[1];
        var px0 = Math.round(q0 * k), pw = Math.round(q1 * k) - px0, dx = Math.round((flipX ? -1 : 1) * pw * 0.9);
        var pc = cvs('patch', W, H), pg = pc.getContext('2d');
        pg.drawImage(full, px0 + dx, ry, pw, rh, px0, ry, pw, rh);
        fg.clearRect(rx, ry, rw, rh);
        fg.drawImage(pc, 0, 0);
      } else fg.clearRect(rx, ry, rw, rh);   // bỏ tay khỏi thân
    }
    var leg = cvs('leg', W, H), lg = leg.getContext('2d');
    lg.drawImage(full, 0, 0); lg.clearRect(0, 0, W, Math.floor(S * (hipFrac - 0.07)));
    out.body = full; out.leg = leg; out.legDk = darken(leg, 'legDk');
    if (arms && arms.length === 1) out.armDk = darken(out.arms[0], 'armDk');
    return out;
  }
  G.walkDraw = function (c, paint, x, footY, S, dir, phase, moving, hip, arms) {
    var X = x - S / 2, Y = footY - S;
    if (!moving) {
      var br = 1 + Math.sin(Date.now() / 600) * 0.012;
      c.save(); c.translate(x, footY); c.scale(1, br); c.translate(-x, -footY); paint(c, X, Y, S); c.restore();
      return;
    }
    var s = Math.sin(phase), co = Math.cos(phase), hipY = Y + S * hip, k = S / 100;
    var bob = Math.abs(s) * S * 0.028;                 // nhún lên khi một chân đang nhấc
    var side = dir === 'left' || dir === 'right';
    var fwd = dir === 'right' ? -1 : 1;                 // hình nhìn ngang gốc quay sang trái; lật thì đảo chiều
    var flipX = dir === 'right';
    var L = layers(paint, X, Y, S, hip, arms, flipX);
    function armAt(img, a, ang, sy) {
      var px = X + (flipX ? 100 - a.p[0] : a.p[0]) * k, py = Y + a.p[1] * k - bob;
      c.save(); c.translate(px, py); c.rotate(ang); c.scale(1, sy || 1); c.translate(-px, -py);
      c.drawImage(img, X, Y - bob, S, S); c.restore();
    }
    var aSw = s * 0.38;                                 // biên độ đánh tay (radian), ngược pha với chân
    // tay phía sau (nhìn ngang): bản tối, sau lưng, cùng pha với chân trước
    if (side && L.armDk) armAt(L.armDk, arms[0], aSw * fwd, 1);
    // chân
    if (side) {
      var sw = s * 0.42;
      for (var j = 0; j < 2; j++) {
        var ang = (j === 0 ? -sw : sw) * fwd;
        var lift = Math.max(0, (j === 0 ? -co : co)) * S * 0.035;
        c.save();
        c.translate(x + (j === 0 ? -fwd * S * 0.02 : 0), hipY - bob * 0.5 - lift);
        c.rotate(ang); c.translate(-x, -hipY);
        c.drawImage(j === 0 ? L.legDk : L.leg, X, Y, S, S);
        c.restore();
      }
    } else {
      for (var sd = -1; sd <= 1; sd += 2) {
        var up = Math.max(0, sd * s); up = up * up * (3 - 2 * up);
        c.save(); c.beginPath(); c.rect(sd < 0 ? X - S : x, hipY - S * 0.07 - bob, sd < 0 ? x - (X - S) : S * 2, S * 1.2); c.clip();
        c.translate(x, hipY - bob * 0.6); c.scale(1 + up * 0.03, 1 - up * 0.22); c.translate(-x, -hipY - up * S * 0.035);
        c.drawImage(L.leg, X, Y, S, S);
        c.restore();
      }
    }
    // thân trên (không có tay)
    var lean = dir === 'left' ? -0.05 : dir === 'right' ? 0.05 : 0;
    var sway = side ? 0 : -s * S * 0.012;
    c.save(); c.beginPath(); c.rect(X - S, Y - S, S * 3, hipY - (Y - S) + S * 0.02); c.clip();
    c.translate(x + sway, hipY); c.rotate(lean + (side ? 0 : s * 0.02)); c.translate(-x, -hipY - bob);
    c.drawImage(L.body, X, Y, S, S); c.restore();
    // tay phía trước
    if (arms) {
      if (side) armAt(L.arms[0], arms[0], -aSw * fwd, 1);
      else for (var ai = 0; ai < arms.length; ai++) {
        // tay bên trái màn hình (ai = 0) đưa ra trước khi chân bên phải đang bước (s > 0) và ngược lại
        var fw = (ai === 0 ? 1 : -1) * s;               // > 0: tay đang đưa ra trước
        var out = (ai === 0 ? 1 : -1);                  // xoay ra ngoài
        armAt(L.arms[ai], arms[ai], out * fw * 0.10, 1 - Math.max(0, fw) * 0.10);
      }
    }
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
