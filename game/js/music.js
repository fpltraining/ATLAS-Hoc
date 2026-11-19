/* Nhạc nền piano chill (tự soạn bằng máy, không bản quyền, tệp ở game/music/).
   Phát ở sảnh, màn chọn nhân vật, bản đồ và trong tiệm. Tự tắt khi học, đọc truyện, nói chuyện, ôn bài,
   làm bài kiểm tra, đi xe; nhỏ hẳn lại khi có giọng đọc. Chọn bản theo buổi và thời tiết (giờ Việt Nam).
   Bật/tắt ở Sảnh → Cài đặt (G.S.caiDat.nhac). */
var G = window.G || (window.G = {});

(function () {
  var FILES = { sang: 'music/piano_sang_v1.mp3', pho: 'music/piano_pho_v1.mp3', mua: 'music/piano_mua_v1.mp3', dem: 'music/piano_dem_v1.mp3' };
  var VOL = 0.2, DUCK = 0.04;
  var el = new Audio(), gain = null, routed = false, cur = '', level = 0, loading = '', blobs = {}, turn = 0;
  el.preload = 'none';

  function enabled() {
    var cd = (G.S && G.S.caiDat) || {};
    return cd.nhac !== false && cd.amThanh !== false;
  }
  function visible(id) { var e = document.getElementById(id); return !!(e && e.getClientRects().length); }
  /* đang học / đọc / nói chuyện / kiểm tra / đi xe thì im lặng */
  function quietNow() {
    if (document.hidden) return true;
    var pn = document.getElementById('panel');
    if (pn && /\bopen\b/.test(pn.className)) return true;
    var rd = document.getElementById('ride');
    if (rd && rd.innerHTML && rd.style.display !== 'none' && rd.getClientRects().length) return true;
    if (G._placementOpen) return true;
    if (G.listening && G.listening()) return true;
    return !(visible('play') || visible('lobby') || visible('create'));
  }
  /* danh sách theo buổi: sáng → Sáng ở Maple, trưa chiều → Phố chiều, tối → Đêm yên, mưa → Mưa nhẹ (xen kẽ cho đỡ nhàm) */
  function playlist() {
    var part = G.dayPart ? G.dayPart() : 'trua', rain = G.weather && G.weather() === 'rain';
    if (rain) return ['mua', 'dem'];
    if (part === 'toi' || part === 'hoanghon') return ['dem', 'pho'];
    if (part === 'sang') return ['sang', 'pho'];
    return ['pho', 'sang'];
  }

  /* đi qua WebAudio để chỉnh được âm lượng trên iPhone/iPad (Safari bỏ qua audio.volume) */
  function route() {
    if (routed) return;
    var a = G.audioCtx && G.audioCtx();
    if (!a || !a.createMediaElementSource) return;
    try { var src = a.createMediaElementSource(el); gain = a.createGain(); gain.gain.value = 0; src.connect(gain); gain.connect(a.destination); routed = true; } catch (e) { gain = null; }
  }
  function apply() {
    if (gain) { var a = G.audioCtx(); gain.gain.setTargetAtTime(level, a.currentTime, 0.25); }
    else { try { el.volume = Math.max(0, Math.min(1, level)); } catch (e) { /* bỏ qua */ } }
  }

  /* tải cả tệp một lần (service worker giữ lại, mất mạng vẫn nghe được), phát từ bộ nhớ */
  function load(key) {
    if (blobs[key]) { el.src = blobs[key]; cur = key; return; }
    if (loading === key) return;
    loading = key;
    var x = new XMLHttpRequest();
    x.open('GET', FILES[key]); x.responseType = 'blob';
    x.onload = function () {
      loading = '';
      if (x.status !== 200 || !x.response) return;
      try { blobs[key] = URL.createObjectURL(x.response); } catch (e) { blobs[key] = FILES[key]; }
      if (!cur || el.paused) { el.src = blobs[key]; cur = key; tick(); }
    };
    x.onerror = function () { loading = ''; };
    x.send();
  }
  el.addEventListener('ended', function () {
    var pl = playlist(); turn++;
    load(pl[turn % pl.length]);
    tick();
  });

  function tick() {
    var want = enabled() && !quietNow();
    var target = want ? (G.voiceBusy && G.voiceBusy() ? DUCK : VOL) : 0;
    if (want) {
      var pl = playlist();
      if (!cur || (el.paused && pl.indexOf(cur) < 0)) load(pl[0]);   // đổi bản khi buổi / thời tiết đổi, lúc đang dừng
      if (cur && el.paused && el.src) { var p = el.play(); if (p && p.catch) p.catch(function () { /* chờ chạm màn hình */ }); }
    }
    level += (target - level) * (target > level ? 0.25 : 0.6);   // vào từ từ, vào học thì tắt nhanh
    if (Math.abs(target - level) < 0.004) level = target;
    apply();
    if (!want && level === 0 && !el.paused) el.pause();
  }

  // iPhone/iPad chỉ cho phát sau khi chạm: lần chạm đầu nối WebAudio rồi phát luôn
  function unlock() { route(); tick(); }
  document.addEventListener('touchend', unlock, { passive: true });
  document.addEventListener('click', unlock);
  document.addEventListener('visibilitychange', tick);
  setInterval(tick, 700);

  G.musicOn = function () { return enabled(); };
  G.setMusic = function (on) { G.S.caiDat = G.S.caiDat || {}; G.S.caiDat.nhac = !!on; G.save(); tick(); };
  G.musicNow = function () { return { track: cur, playing: !el.paused, level: Math.round(level * 100) / 100, routed: routed }; };
})();
