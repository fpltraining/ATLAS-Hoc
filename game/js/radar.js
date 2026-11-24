/* Bản đồ nhỏ (trước là radar) góc phải trên + nhiệt độ ngoài trời.
   Radar: bản đồ thu nhỏ quanh nhân vật (bắc ở trên), mũi tên trắng = mình và hướng đang đi, chấm đỏ = nơi cần tới
   (ở xa thì mũi tên đỏ trên vành chỉ hướng), biểu tượng nhà, tiệm, cổng; chấm vàng = người chưa nói chuyện hôm nay.
   Vành có N E S W (North, East, South, West). Bấm radar: đổi giữa xem gần và xem cả khu.
   Nhiệt độ: con số °C + từ tiếng Anh (cold, cool, mild, warm, hot…) và nghĩa; bấm để nghe câu tiếng Anh.
   Thời tiết và nhiệt độ của Brightford tính theo giờ Việt Nam, khớp với mưa nắng trong game. */
var G = window.G || (window.G = {});

(function () {
  /* ---------- nhiệt độ ---------- */
  var MONTH = [6, 8, 11, 15, 19, 23, 26, 26, 23, 18, 12, 8];   // trung bình theo tháng (°C), thị trấn ven biển ôn hoà
  G.tempNow = function () {
    var p = G.vnParts(), h = p.h + p.mi / 60;
    var day = Math.sin((p.y * 372 + p.m * 31 + p.d) * 12.9898) * 43758.5453; day = (day - Math.floor(day)) * 6 - 3;   // mỗi ngày lệch ±3°
    var w = G.weather ? G.weather() : 'clear';
    var t = MONTH[p.m - 1] + Math.cos((h - 14) / 24 * 2 * Math.PI) * 5 + day + (w === 'rain' ? -3 : w === 'cloudy' ? -1 : 0);
    return Math.round(t);
  };
  var WORDS = [[4, 'freezing', 'lạnh cóng'], [11, 'cold', 'lạnh'], [17, 'cool', 'mát'], [23, 'mild', 'dễ chịu'], [29, 'warm', 'ấm'], [34, 'hot', 'nóng'], [99, 'boiling hot', 'nóng như đổ lửa']];
  G.tempWord = function (t) { for (var i = 0; i < WORDS.length; i++) if (t <= WORDS[i][0]) return { en: WORDS[i][1], vi: WORDS[i][2] }; return { en: 'hot', vi: 'nóng' }; };
  G.tempSentence = function (t) { return 'It\'s ' + (t < 0 ? 'minus ' + (-t) : t) + ' degrees and ' + G.tempWord(t).en + '.'; };
  function skyWord() {
    var w = G.weather ? G.weather() : 'clear', night = G.dayPart && G.dayPart() === 'toi';
    if (w === 'rain') return { ic: 'rain', en: 'rainy', vi: 'có mưa' };
    if (w === 'cloudy') return { ic: 'cloud', en: 'cloudy', vi: 'nhiều mây' };
    return night ? { ic: 'moon', en: 'clear', vi: 'trời quang' } : { ic: 'sun', en: 'sunny', vi: 'nắng' };
  }
  var lastT = 0;
  function updateTemp() {
    var el = document.getElementById('temp'); if (!el) return;
    if (Date.now() - lastT < 20000 && el.innerHTML) return; lastT = Date.now();
    var t = G.tempNow(), w = G.tempWord(t), s = skyWord();
    el.innerHTML = '';
    el.appendChild(G.el('b', G.ic3(s.ic, 'ic3-s'), ' ' + t + '°C'));
    el.appendChild(G.el('span.tp-en', w.en + ' · ' + s.en));
    el.appendChild(G.el('small', w.vi + ' · ' + s.vi));
  }

  /* ---------- bản đồ nhỏ (thay radar, anh Han duyệt 24/11/2026): tờ bản đồ màu nước của khu, viền giấy kem,
     nhà / trường / bến xe… là icon 3D Fluent, người chưa nói chuyện là bong bóng chat, mình là mặt nhân vật trong khung tròn
     có mũi nhọn chỉ hướng đi, nơi cần tới là ghim đỏ (ở xa thì ghim nằm trên vành chỉ hướng). Tên khu ở nhãn bên dưới.
     Bấm bản đồ: đổi giữa xem gần và xem cả khu. N E S W trên vành để học hướng bằng tiếng Anh. ---------- */
  var RD = { cv: null, g: null, far: false, lx: null, ly: null, ang: -Math.PI / 2, name: '' }, GRASS = '#b7c08d';
  var ICON = { home: 'house', busstop: 'bus', shuttle: 'minibus', school: 'school', cafe: 'coffee', market: 'apple', hospital: 'hospital', airport: 'plane', teahouse: 'tea' };
  function sceneImage(sc) { if (sc.bg) { var a = G.asset(sc.bg); return a.ok ? a.img : null; } return null; }
  function ic(g, name, x, y, s) { var a = G.asset('ic3_' + name + '.webp'); if (a.ok) g.drawImage(a.img, x - s / 2, y - s / 2, s, s); }
  function face() {   // ảnh đầu nhân vật cho dấu "mình"
    var who = G.S.nhanVat || 'han';
    if (who === 'custom') return null;
    var a = G.asset(who === 'kai' ? 'kai_down.png' : 'player_' + who + '_down.png'); return a.ok ? a.img : null;
  }

  /* gọi mỗi khung hình từ engine: st = { scene, id, P, goal, people, talked, dpr } */
  G.drawRadar = function (st) {
    if (!RD.cv) {
      RD.cv = document.getElementById('radar-cv'); if (!RD.cv) return;
      RD.g = RD.cv.getContext('2d');
      RD.cv.onclick = function () {
        RD.far = !RD.far; RD.name = '';
        var cd = G.S.caiDat || (G.S.caiDat = {});
        if (!cd.radarHint) { cd.radarHint = 1; G.save(); G.kaiSay('Bản đồ nhỏ: mặt bạn ở giữa, mũi nhọn là hướng đang đi, ghim đỏ là nơi cần tới. N = North (Bắc), S = South (Nam), E = East (Đông), W = West (Tây). Bấm bản đồ để xem cả khu.'); }
      };
      var te = document.getElementById('temp');
      if (te) te.onclick = function () { var t = G.tempNow(), w = G.tempWord(t), s = skyWord(); G.say(G.tempSentence(t), 'en'); G.kaiSay(G.tempSentence(t) + ' → Trời ' + t + ' độ, ' + w.vi + ', ' + s.vi + '.'); };
    }
    // camera 3D xoay (vuốt tay phải): bản đồ xoay theo, phía trước màn hình luôn ở trên như GTA
    var ya = G.W3D && G.W3D.active && G.W3D.yaw ? G.W3D.yaw() : 0;
    if (RD.ya !== ya) { RD.ya = ya; RD.cv.style.transform = ya ? 'rotate(' + ya.toFixed(3) + 'rad)' : ''; }
    updateTemp();
    var nm = (st.scene.title || '') + (RD.far ? ' · cả khu' : '');
    if (RD.name !== nm) { RD.name = nm; var ne = document.getElementById('radar-name'); if (ne) ne.textContent = nm; }
    var css = RD.cv.clientWidth; if (!css) return;
    var S = Math.round(css * st.dpr); if (RD.cv.width !== S) { RD.cv.width = S; RD.cv.height = S; }
    var g = RD.g, r = S / 2, sc = st.scene, P = st.P, ring = S * 0.075;
    var range = RD.far ? Math.max(sc.w, sc.h) * 0.6 : 520;
    var k = (r - ring) / range, cx = RD.far ? sc.w / 2 : P.x, cy = RD.far ? sc.h / 2 : P.y;
    function X(x) { return r + (x - cx) * k; }
    function Y(y) { return r + (y - cy) * k; }
    // hướng đi: theo quãng vừa di chuyển (mượt), đứng yên thì theo hướng mặt
    if (RD.lx !== null) {
      var dx = P.x - RD.lx, dy = P.y - RD.ly;
      if (dx * dx + dy * dy > 1) { var a = Math.atan2(dy, dx), d = a - RD.ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; RD.ang += d * 0.25; }
      else if (!P.moving) { var want = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[P.dir]; if (want !== undefined) { var d2 = want - RD.ang; while (d2 > Math.PI) d2 -= 2 * Math.PI; while (d2 < -Math.PI) d2 += 2 * Math.PI; RD.ang += d2 * 0.15; } }
    }
    RD.lx = P.x; RD.ly = P.y;

    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S);
    // tờ bản đồ màu nước, sáng rõ (không phủ tối)
    g.save(); g.beginPath(); g.arc(r, r, r - ring + 1, 0, 6.283); g.clip();
    g.fillStyle = GRASS; g.fillRect(0, 0, S, S);   // đồng cỏ quanh thành phố, cùng màu nền 3D
    // ngoài phố: vẽ cả các khu liền kề (Bờ sông, Trung tâm…) theo vị trí ghép trong thành phố 3D, không hụt mép tờ bản đồ
    var W3 = G.WORLD3D, me = W3 && W3[st.id];
    if (me) {
      for (var id in W3) if (W3.hasOwnProperty(id) && id !== st.id && G.SCENES[id] && G.SCENES[id].bg) {
        var s2 = G.SCENES[id], a2 = G.asset(s2.bg); if (!a2.ok) continue;
        g.drawImage(a2.img, X(W3[id].ox - me.ox), Y(W3[id].oy - me.oy), s2.w * k, s2.h * k);
      }
    }
    var img = sceneImage(sc);
    if (img) g.drawImage(img, 0, 0, img.width, img.height, X(0), Y(0), sc.w * k, sc.h * k);
    // nhà, tiệm, cổng: icon 3D
    var is = Math.max(14, S * 0.15);
    (sc.buildings || []).forEach(function (b) { ic(g, ICON[b.id] || 'office', X(b.x), Y(b.y - 70), is); });
    st.people.forEach(function (o) {
      if (o.bimg) { ic(g, 'store', X(o.x), Y(o.y - 60), is * 0.9); return; }
      if (!st.talked(o.life)) { ic(g, 'talk', X(o.x), Y(o.y - 30), is * 0.72); return; }
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(X(o.x), Y(o.y), Math.max(2, S * 0.022), 0, 6.283); g.fill();
    });
    (sc.gates || []).forEach(function (gt) { ic(g, gt.to && gt.to.floors ? 'elevator' : 'map', X(gt.x), Y(gt.y), is * 0.8); });
    if (sc.exit) ic(g, 'door', X(sc.exit.x), Y(sc.exit.y), is * 0.8);
    // nơi cần tới: ghim đỏ nhún nhẹ; ở xa thì nằm trên vành theo hướng
    var goalOut = null;
    if (st.goal) {
      var gx = X(st.goal.x), gy = Y(st.goal.y), ddx = gx - r, ddy = gy - r, dist = Math.sqrt(ddx * ddx + ddy * ddy), bob = Math.sin(Date.now() / 260) * S * 0.015;
      if (dist < r - ring - S * 0.06) ic(g, 'pin', gx, gy - is * 0.35 + bob, is * 1.05);
      else goalOut = Math.atan2(ddy, ddx);
    }
    // mình: mặt nhân vật trong khung tròn trắng, mũi nhọn cam chỉ hướng đi
    var px = X(P.x), py = Y(P.y), a0 = RD.ang, R0 = Math.max(9, S * 0.1);
    g.fillStyle = '#b84b35'; g.beginPath();
    g.moveTo(px + Math.cos(a0) * R0 * 1.75, py + Math.sin(a0) * R0 * 1.75);
    g.lineTo(px + Math.cos(a0 + 0.6) * R0 * 0.95, py + Math.sin(a0 + 0.6) * R0 * 0.95);
    g.lineTo(px + Math.cos(a0 - 0.6) * R0 * 0.95, py + Math.sin(a0 - 0.6) * R0 * 0.95);
    g.closePath(); g.fill();
    g.fillStyle = '#fffaf0'; g.beginPath(); g.arc(px, py, R0 + S * 0.018, 0, 6.283); g.fill();
    var fc = face();
    g.save(); g.beginPath(); g.arc(px, py, R0, 0, 6.283); g.clip();
    g.fillStyle = '#f6ddd5'; g.fillRect(px - R0, py - R0, R0 * 2, R0 * 2);
    if (fc) { var fw = fc.width * 0.62, fh = fw; g.drawImage(fc, fc.width * 0.19, fc.height * 0.02, fw, fh, px - R0, py - R0, R0 * 2, R0 * 2); }
    g.restore();
    g.restore();
    // vành giấy kem, N trên nhãn đỏ, E S W chữ nâu (vành xoay theo camera như bản đồ)
    g.lineWidth = ring; g.strokeStyle = '#fffaf0'; g.beginPath(); g.arc(r, r, r - ring / 2, 0, 6.283); g.stroke();
    g.lineWidth = Math.max(1, S / 140); g.strokeStyle = '#e3c79b'; g.beginPath(); g.arc(r, r, r - ring + 0.5, 0, 6.283); g.stroke();
    if (goalOut !== null) ic(g, 'pin', r + Math.cos(goalOut) * (r - ring * 1.6), r + Math.sin(goalOut) * (r - ring * 1.6), is * 0.95);
    var fs = Math.round(S * 0.095); g.font = '800 ' + fs + 'px "Be Vietnam Pro", -apple-system, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#b84b35'; g.beginPath(); g.arc(r, ring * 0.55 + fs * 0.35, fs * 0.72, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.fillText('N', r, ring * 0.55 + fs * 0.4);
    g.fillStyle = '#7a5536';
    g.fillText('S', r, S - ring / 2); g.fillText('E', S - ring / 2, r); g.fillText('W', ring / 2, r);
  };
})();
