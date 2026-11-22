/* Đọc to: ưu tiên tệp giọng AI có sẵn của ATLAS (../audio/<lang>/<khoá>.mp3), không có thì dùng giọng của máy.
   Âm thanh hiệu ứng (đúng, sai, xong) tạo bằng WebAudio, không cần tệp. */
var G = window.G || (window.G = {});

(function () {
  var index = null;          // { en: Set-like object, zh: ... }
  var loading = false;
  var player = new Audio();
  player.preload = 'auto';

  function loadIndex() {
    if (index || loading) return;
    loading = true;
    var x = new XMLHttpRequest();
    x.open('GET', '../data/audio.json');
    x.onload = function () {
      try {
        var j = JSON.parse(x.responseText);
        index = {};
        for (var lang in j) {
          var m = {};
          for (var i = 0; i < j[lang].length; i++) m[j[lang][i]] = 1;
          index[lang] = m;
        }
      } catch (e) { index = {}; }
    };
    x.onerror = function () { index = {}; loading = false; };
    x.send();
  }
  loadIndex();

  G.audioUrl = function (text, lang) {
    if (!index || !index[lang]) return null;
    var k = G.audioKey(lang, text);
    if (!index[lang][k]) return null;
    // v=2: giọng đã chuẩn hoá âm lượng; v=3: tệp lệch âm lượng đã chỉnh lại (21/11/2026, data/audio.json mục fix)
    return '../audio/' + lang + '/' + k + '.mp3?v=' + (index.fix && index.fix[lang + '/' + k] ? 3 : 2);
  };

  function speakTts(text, lang, slow) {
    if (!window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      u.rate = slow ? 0.55 : 0.85;
      u.volume = 0.6;   // giọng máy to hơn giọng AI: hạ xuống cho đều
      var vs = speechSynthesis.getVoices();
      for (var i = 0; i < vs.length; i++) if (vs[i].lang && vs[i].lang.replace('_', '-').indexOf(u.lang) === 0) { u.voice = vs[i]; break; }
      speechSynthesis.speak(u);
    } catch (e) { /* máy không có giọng */ }
  }

  /* tắt giọng mẫu đang phát (trước khi bật micro, để micro không thu lại tiếng loa) */
  /* sau khi dùng micro, iPad chuyển âm thanh sang chế độ gọi (nhỏ hơn): tạo lại trình phát để về âm lượng thường */
  G.audioReset = function () { try { player.pause(); } catch (e) { /* bỏ qua */ } player = new Audio(); player.preload = 'auto'; if (ctx && ctx.state === 'running' && ctx.suspend) { ctx.suspend().then(function () { ctx.resume(); }); } };
  G.hush = function () {
    try { player.pause(); } catch (e) { /* bỏ qua */ }
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e2) { /* bỏ qua */ }
  };

  /* đọc câu; slow = true thì đọc chậm (70% tốc độ, giữ nguyên cao độ giọng) */
  G.say = function (text, lang, slow) {
    lang = lang || 'en';
    // danh sách giọng AI chưa tải xong: chờ một chút thay vì đọc bằng giọng máy (to nhỏ khác nhau)
    if (!index && (G._sayWait = (G._sayWait || 0) + 1) < 15) { setTimeout(function () { G.say(text, lang, slow); }, 200); return; }
    G._sayWait = 0;
    player.volume = 1;
    var url = G.audioUrl(text, lang);
    if (url) {
      var rate = slow ? 0.7 : 1;
      player.src = url;
      try {
        player.preservesPitch = true; player.webkitPreservesPitch = true; player.mozPreservesPitch = true;
        player.defaultPlaybackRate = rate; player.playbackRate = rate;
      } catch (e) { /* máy cũ không đổi được tốc độ */ }
      var p = player.play();
      if (p && p.catch) p.catch(function () { speakTts(text, lang, slow); });
    } else speakTts(text, lang, slow);
  };
  G.saySlow = function (text, lang) { G.say(text, lang, true); };
  /* cặp nút nghe thường 🔊 và nghe chậm 🐢 */
  G.sayBtns = function (text, lang) {
    return G.el('span.say2',
      G.el('button.speak', { 'aria-label': 'Nghe', onclick: function (e) { e.stopPropagation(); G.say(text, lang); } }, G.ic3('speaker')),
      G.el('button.speak.slow', { 'aria-label': 'Nghe chậm', onclick: function (e) { e.stopPropagation(); G.say(text, lang, true); } }, G.ic3('turtle')));
  };

  /* Tải sẵn tệp giọng của một phòng để học được khi mất mạng (service worker giữ lại) */
  G.warmAudio = function (texts, lang) {
    if (!index) { setTimeout(function () { G.warmAudio(texts, lang); }, 800); return; }
    for (var i = 0; i < texts.length; i++) {
      var u = G.audioUrl(texts[i], lang);
      if (u) { var x = new XMLHttpRequest(); x.open('GET', u); x.send(); }
    }
  };

  /* tiếng mưa rơi nhỏ (nhiễu trắng lọc trầm), chỉ khi bật âm thanh */
  var rainNode = null;
  G.rainSound = function (on) {
    if (G.AMB_FILES && G.AMB_FILES.rain) on = false;   // có tệp mưa thật: G.ambience lo, tắt tiếng mưa tạo bằng máy
    var a = on ? ac() : ctx;   // chỉ tắt thì không đánh thức âm thanh (trước lần chạm đầu)
    if (!on || !a || (G.S && G.S.caiDat && G.S.caiDat.amThanh === false)) { if (rainNode) { try { rainNode.g.gain.setTargetAtTime(0, a.currentTime, 0.4); var rn = rainNode; setTimeout(function () { try { rn.s.stop(); } catch (e) { /* bỏ qua */ } }, 1500); } catch (e2) { /* bỏ qua */ } rainNode = null; } return; }
    if (rainNode) return;
    try {
      var len = a.sampleRate * 2, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      var s = a.createBufferSource(); s.buffer = buf; s.loop = true;
      var f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      var g = a.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
      g.gain.setTargetAtTime(0.06, a.currentTime, 1);
      rainNode = { s: s, g: g };
    } catch (e3) { rainNode = null; }
  };

  /* sấm rền xa sau tia chớp (nhiễu trầm), chỉ khi bật âm thanh */
  G.thunder = function () {
    var a = ac(); if (!a || (G.S && G.S.caiDat && G.S.caiDat.amThanh === false)) return;
    if (G.sfxFile('sfx_thunder_far_' + (Math.random() < 0.5 ? 1 : 2), 0.5 + Math.random() * 0.25, 0.9 + Math.random() * 0.15)) return;   // sấm thật
    try {
      var len = Math.floor(a.sampleRate * 3.2), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { var k = i / len; last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 6 * Math.pow(1 - k, 1.6) * (k < 0.04 ? k / 0.04 : 1) * (0.7 + 0.3 * Math.sin(k * 40)); }
      var s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 260; g.gain.value = 0.22;
      s.connect(f); f.connect(g); g.connect(a.destination); s.start();
    } catch (e) { /* bỏ qua */ }
  };

  /* ---------- âm thanh hiệu ứng ---------- */
  var ctx = null;
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  G.audioCtx = ac;
  /* ---------- tiếng thật từ tệp (game/sfx/, nguồn miễn phí CC0 / CC-BY, xem sfx/CREDITS.md) ----------
     Tải về một lần, giải mã thành bộ đệm WebAudio: phát ngay không trễ (bước chân), lặp liền mạch (tiếng nền).
     Tệp tiếng nền có đệm 0,5 giây hai đầu: lặp từ 0,5 s tới (dài − 0,5 s) nên chỗ nối không hở, không tách. */
  var SFXV = 2;
  G.SFX_FILES = G.SFX_FILES || {};
  G.AMB_FILES = G.AMB_FILES || {};
  (function () {
    var s = ['door_wood', 'page_turn', 'paper_pop_1', 'paper_pop_2', 'paper_pop_3', 'chair_pull', 'chair_push', 'chair_sit', 'fish_splash',
      'thunder_far_1', 'thunder_far_2', 'duck', 'horn_soft', 'school_bell', 'shuttle_door'];
    for (var i = 1; i <= 5; i++) s.push('step_grass_' + i, 'step_stone_' + i, 'step_wood_' + i);
    for (var j = 0; j < s.length; j++) if (!G.SFX_FILES['sfx_' + s[j]]) G.SFX_FILES['sfx_' + s[j]] = 'sfx/sfx_' + s[j] + '.mp3?v=' + SFXV;
    var a = { birds: 'birds_morning', city: 'city_day', crickets: 'crickets_night', wind: 'wind_storm', rain: 'rain_light', rainHeavy: 'rain_heavy',
      river: 'river', classroom: 'classroom', shuttle: 'shuttle_drive' };   // còn chờ: cafe, market, playground
    for (var k in a) if (a.hasOwnProperty(k) && !G.AMB_FILES[k]) G.AMB_FILES[k] = 'sfx/amb_' + a[k] + '.mp3?v=' + SFXV;
  })();
  function muted() { return !!(G.S && G.S.caiDat && G.S.caiDat.amThanh === false); }
  var BUF = {}, BUSY = {}, BAD = {};
  function loadBuf(url, cb) {
    if (BUF[url]) { if (cb) cb(BUF[url]); return; }
    if (BUSY[url] || BAD[url]) return;
    var a = ctx; if (!a) return;
    BUSY[url] = 1;
    var x = new XMLHttpRequest(); x.open('GET', url); x.responseType = 'arraybuffer';
    x.onload = function () {
      if (x.status !== 200 && x.status !== 0) { BUSY[url] = 0; BAD[url] = 1; return; }
      try {
        a.decodeAudioData(x.response, function (b) { BUF[url] = b; BUSY[url] = 0; if (cb) cb(b); }, function () { BUSY[url] = 0; BAD[url] = 1; });
      } catch (e) { BUSY[url] = 0; BAD[url] = 1; }
    };
    x.onerror = function () { BUSY[url] = 0; };
    x.send();
  }
  /* phát một tiếng: trả về true nếu phát được (chưa tải xong thì tải trước, lần sau mới kêu) */
  G.sfxFile = function (n, vol, rate) {
    var u = G.SFX_FILES[n], a = G.audioReady(); if (!u || !a || muted()) return false;
    var b = BUF[u]; if (!b) { loadBuf(u); return false; }
    try {
      var s = a.createBufferSource(), g = a.createGain();
      s.buffer = b; if (rate) s.playbackRate.value = rate;
      g.gain.value = vol === undefined ? 0.6 : vol; s.connect(g); g.connect(a.destination); s.start(0);
      return true;
    } catch (e) { return false; }
  };
  /* tải sẵn các tiếng ngắn sau lần chạm đầu (bước chân, cửa, ghế...) */
  function warmSfx() { for (var n in G.SFX_FILES) if (G.SFX_FILES.hasOwnProperty(n)) loadBuf(G.SFX_FILES[n]); }
  /* bước chân theo mặt đất: grass / stone / wood, đổi ngẫu nhiên 5 tiếng, cao độ lệch nhẹ cho tự nhiên */
  var lastStep = 0;
  G.footstep = function (surf, vol) {
    var k = 1 + Math.floor(Math.random() * 5); if (k === lastStep) k = k % 5 + 1; lastStep = k;
    G.sfxFile('sfx_step_' + (surf || 'stone') + '_' + k, (vol || 0.32) * (0.85 + Math.random() * 0.3), 0.94 + Math.random() * 0.12);
  };

  /* ---------- tiếng nền lặp: G.ambSet(loại, âm lượng 0–1), gọi mỗi khung; về 0 thì tắt dần ---------- */
  var LOOPS = {};
  G.ambSet = function (kind, vol) {
    var u = G.AMB_FILES[kind], a = G.audioReady(); if (!u || !a) return !!u;
    var L = LOOPS[kind];
    if (vol > 0.003 && !L) {
      if (!BUF[u]) { loadBuf(u); return true; }
      L = LOOPS[kind] = { g: a.createGain(), s: null, vol: 0, idle: 0 };
      L.g.gain.value = 0; L.g.connect(a.destination);
      var b = BUF[u], s = a.createBufferSource(); s.buffer = b; s.loop = true;
      s.loopStart = Math.min(0.5, b.duration / 4); s.loopEnd = b.duration - s.loopStart;
      s.connect(L.g); s.start(0, s.loopStart + Math.random() * (s.loopEnd - s.loopStart) * 0.9); L.s = s;
    }
    if (!L) return true;
    if (Math.abs(vol - L.vol) > 0.002) { L.vol = vol; L.g.gain.setTargetAtTime(vol, a.currentTime, 0.6); }
    if (vol <= 0.003) { L.idle += 1; if (L.idle > 240) { try { L.s.stop(); L.s.disconnect(); L.g.disconnect(); } catch (e) { /* bỏ qua */ } delete LOOPS[kind]; } }
    else L.idle = 0;
    return true;
  };
  G.ambState = function () { var o = {}; for (var k in LOOPS) if (LOOPS.hasOwnProperty(k)) o[k] = Math.round(LOOPS[k].vol * 100) / 100; var n = 0; for (var u in BUF) if (BUF.hasOwnProperty(u)) n++; o._buffers = n; return o; };   // để kiểm tra
  G.ambStopAll = function () { for (var k in LOOPS) if (LOOPS.hasOwnProperty(k)) G.ambSet(k, 0); };
  /* tắt hẳn mọi tiếng nền ngay (về sảnh, ẩn app) */
  G.ambKill = function () {
    var a = ctx;
    for (var k in LOOPS) if (LOOPS.hasOwnProperty(k)) { try { if (a) LOOPS[k].g.gain.setTargetAtTime(0, a.currentTime, 0.15); var s = LOOPS[k].s; setTimeout(function () { try { s.stop(); } catch (e) { /* bỏ qua */ } }, 800); } catch (e2) { /* bỏ qua */ } delete LOOPS[k]; }
  };
  G.audioReady = function () { return ctx && ctx.state === 'running' ? ctx : null; };   // chỉ lấy khi đã mở (sau lần chạm đầu), không đánh thức mỗi khung
  window.addEventListener('touchend', function () { setTimeout(warmSfx, 300); }, { once: true, passive: true });
  window.addEventListener('mouseup', function () { setTimeout(warmSfx, 300); }, { once: true });
  document.addEventListener('visibilitychange', function () { if (document.hidden) G.ambKill(); });
  /* đang có giọng đọc (để nhạc nền nhỏ lại) */
  G.voiceBusy = function () {
    try { return (!player.paused && !player.ended) || !!(window.speechSynthesis && speechSynthesis.speaking); } catch (e) { return false; }
  };
  window.addEventListener('touchstart', function () { ac(); }, { once: true, passive: true });
  window.addEventListener('mousedown', function () { ac(); }, { once: true });

  function tone(f, at, dur, type, vol) {
    var a = ac(); if (!a) return;
    var t = a.currentTime + at;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((vol || 0.15) * 0.45, t + 0.015);   // hiệu ứng nhỏ hơn giọng đọc
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  G.sfx = function (kind) {
    if (G.S && G.S.caiDat && G.S.caiDat.amThanh === false) return;
    if (kind === 'right') { tone(880, 0, 0.12); tone(1318.5, 0.08, 0.22); }
    else if (kind === 'wrong') { tone(233, 0, 0.16, 'triangle', 0.12); tone(185, 0.1, 0.24, 'triangle', 0.1); }
    else if (kind === 'done') { var f = [523.25, 659.25, 783.99, 1046.5]; for (var i = 0; i < f.length; i++) tone(f[i], i * 0.085, 0.3, 'triangle', 0.14); }
    else if (kind === 'door') { tone(392, 0, 0.12, 'sine', 0.1); tone(587.3, 0.1, 0.25, 'sine', 0.1); }
  };
})();
