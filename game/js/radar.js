/* Radar / la bàn góc phải trên + nhiệt độ ngoài trời.
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
    if (w === 'rain') return { ic: '🌧', en: 'rainy', vi: 'có mưa' };
    if (w === 'cloudy') return { ic: '☁️', en: 'cloudy', vi: 'nhiều mây' };
    return night ? { ic: '🌙', en: 'clear', vi: 'trời quang' } : { ic: '☀️', en: 'sunny', vi: 'nắng' };
  }
  var lastT = 0;
  function updateTemp() {
    var el = document.getElementById('temp'); if (!el) return;
    if (Date.now() - lastT < 20000 && el.innerHTML) return; lastT = Date.now();
    var t = G.tempNow(), w = G.tempWord(t), s = skyWord();
    el.innerHTML = '';
    el.appendChild(G.el('b', s.ic + ' ' + t + '°C'));
    el.appendChild(G.el('span.tp-en', w.en + ' · ' + s.en));
    el.appendChild(G.el('small', w.vi + ' · ' + s.vi));
  }

  /* ---------- radar ---------- */
  var RD = { cv: null, g: null, far: false, lx: null, ly: null, ang: -Math.PI / 2, off: {} };
  var ICON = { home: '🏠', busstop: '🚌', shuttle: '🚐', school: '🏫', cafe: '☕', market: '🍎', hospital: '🏥', airport: '✈️', teahouse: '🍵' };
  function sceneImage(sc, id) {
    if (sc.bg) { var a = G.asset(sc.bg); return a.ok ? a.img : null; }
    return null;
  }
  function emoji(g, e, x, y, s) { g.font = s + 'px "Apple Color Emoji","Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, x, y); }

  /* gọi mỗi khung hình từ engine: st = { scene, id, P, goal, people, talked, dpr } */
  G.drawRadar = function (st) {
    if (!RD.cv) {
      RD.cv = document.getElementById('radar-cv'); if (!RD.cv) return;
      RD.g = RD.cv.getContext('2d');
      RD.cv.onclick = function () {
        RD.far = !RD.far;
        var cd = G.S.caiDat || (G.S.caiDat = {});
        if (!cd.radarHint) { cd.radarHint = 1; G.save(); G.kaiSay('Radar: mũi tên trắng là bạn, chấm đỏ là nơi cần tới. N = North (Bắc), S = South (Nam), E = East (Đông), W = West (Tây). Bấm radar để xem cả khu.'); }
      };
      var te = document.getElementById('temp');
      if (te) te.onclick = function () { var t = G.tempNow(), w = G.tempWord(t), s = skyWord(); G.say(G.tempSentence(t), 'en'); G.kaiSay(G.tempSentence(t) + ' → Trời ' + t + ' độ, ' + w.vi + ', ' + s.vi + '.'); };
    }
    updateTemp();
    var css = RD.cv.clientWidth; if (!css) return;
    var S = Math.round(css * st.dpr); if (RD.cv.width !== S) { RD.cv.width = S; RD.cv.height = S; }
    var g = RD.g, r = S / 2, sc = st.scene, P = st.P;
    var range = RD.far ? Math.max(sc.w, sc.h) * 0.6 : 560;
    var k = (r - 4) / range, cx = RD.far ? sc.w / 2 : P.x, cy = RD.far ? sc.h / 2 : P.y;
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
    g.save(); g.beginPath(); g.arc(r, r, r - 1, 0, 6.283); g.clip();
    g.fillStyle = '#1b2140'; g.fillRect(0, 0, S, S);
    var img = sceneImage(sc, st.id);
    if (img) g.drawImage(img, 0, 0, img.width, img.height, X(0), Y(0), sc.w * k, sc.h * k);
    g.fillStyle = 'rgba(16,24,52,.30)'; g.fillRect(0, 0, S, S);
    // vạch lưới và tia quét radar
    g.strokeStyle = 'rgba(160,255,200,.18)'; g.lineWidth = Math.max(1, S / 120);
    g.beginPath(); g.arc(r, r, r * 0.33, 0, 6.283); g.moveTo(r + r * 0.66, r); g.arc(r, r, r * 0.66, 0, 6.283); g.moveTo(0, r); g.lineTo(S, r); g.moveTo(r, 0); g.lineTo(r, S); g.stroke();
    var sw = (Date.now() / 2200 % 1) * 6.283;
    g.fillStyle = 'rgba(110,255,170,.16)'; g.beginPath(); g.moveTo(r, r); g.arc(r, r, r, sw - 0.7, sw); g.closePath(); g.fill();
    // toà nhà, tiệm, cổng, lối ra
    var is = Math.max(11, S * 0.13);
    (sc.buildings || []).forEach(function (b) { emoji(g, ICON[b.id] || '🏢', X(b.x), Y(b.y - 70), is); });
    st.people.forEach(function (o) {
      if (o.bimg) { emoji(g, o.icon || '🏪', X(o.x), Y(o.y - 60), is); return; }
      g.fillStyle = st.talked(o.life) ? 'rgba(255,255,255,.55)' : '#ffd56b';
      g.beginPath(); g.arc(X(o.x), Y(o.y), Math.max(2.5, S * 0.03), 0, 6.283); g.fill();
    });
    (sc.gates || []).forEach(function (gt) { emoji(g, gt.to && gt.to.floors ? '🛗' : '🛍️', X(gt.x), Y(gt.y), is * 0.9); });
    if (sc.exit) emoji(g, '🚪', X(sc.exit.x), Y(sc.exit.y), is * 0.9);
    // nơi cần tới
    if (st.goal) {
      var gx = X(st.goal.x), gy = Y(st.goal.y), ddx = gx - r, ddy = gy - r, dist = Math.sqrt(ddx * ddx + ddy * ddy), pulse = 0.6 + Math.sin(Date.now() / 250) * 0.4;
      if (dist < r - 8) { g.fillStyle = 'rgba(232,72,58,' + pulse.toFixed(2) + ')'; g.beginPath(); g.arc(gx, gy, Math.max(4, S * 0.05), 0, 6.283); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(1.5, S / 70); g.stroke(); }
      else {
        var ga = Math.atan2(ddy, ddx), ex = r + Math.cos(ga) * (r - S * 0.09), ey = r + Math.sin(ga) * (r - S * 0.09), L = S * 0.07;
        g.fillStyle = '#e8483a'; g.beginPath();
        g.moveTo(ex + Math.cos(ga) * L, ey + Math.sin(ga) * L);
        g.lineTo(ex + Math.cos(ga + 2.5) * L, ey + Math.sin(ga + 2.5) * L);
        g.lineTo(ex + Math.cos(ga - 2.5) * L, ey + Math.sin(ga - 2.5) * L);
        g.closePath(); g.fill();
      }
    }
    // mình: mũi tên trắng theo hướng đi
    var px = X(P.x), py = Y(P.y), a0 = RD.ang, Lp = Math.max(7, S * 0.085);
    g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.arc(px, py, Lp * 1.5, 0, 6.283); g.fill();
    g.fillStyle = '#fff'; g.strokeStyle = '#1b2140'; g.lineWidth = Math.max(1.5, S / 80);
    g.beginPath();
    g.moveTo(px + Math.cos(a0) * Lp, py + Math.sin(a0) * Lp);
    g.lineTo(px + Math.cos(a0 + 2.45) * Lp, py + Math.sin(a0 + 2.45) * Lp);
    g.lineTo(px + Math.cos(a0 + Math.PI) * Lp * 0.35, py + Math.sin(a0 + Math.PI) * Lp * 0.35);
    g.lineTo(px + Math.cos(a0 - 2.45) * Lp, py + Math.sin(a0 - 2.45) * Lp);
    g.closePath(); g.fill(); g.stroke();
    g.restore();
    // vành la bàn + N E S W
    var lw = Math.max(2, S * 0.03);
    g.strokeStyle = '#fff'; g.lineWidth = lw; g.beginPath(); g.arc(r, r, r - lw / 2, 0, 6.283); g.stroke();
    g.font = '800 ' + Math.round(S * 0.12) + 'px -apple-system, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    var m = S * 0.11;
    [['N', r, m, '#ff6b5c'], ['S', r, S - m, '#fff'], ['E', S - m, r, '#fff'], ['W', m, r, '#fff']].forEach(function (q) {
      g.lineWidth = Math.max(2, S / 40); g.strokeStyle = 'rgba(16,24,52,.9)'; g.strokeText(q[0], q[1], q[2]); g.fillStyle = q[3]; g.fillText(q[0], q[1], q[2]);
    });
    if (RD.far) { g.font = '700 ' + Math.round(S * 0.09) + 'px sans-serif'; g.fillStyle = '#ffd56b'; g.fillText('cả khu', r, r + r * 0.55); }
  };
})();
