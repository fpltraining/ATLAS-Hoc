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
    return index[lang][k] ? '../audio/' + lang + '/' + k + '.mp3?v=2' : null;   // v=2: giọng đã chuẩn hoá âm lượng
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
      G.el('button.speak', { 'aria-label': 'Nghe', onclick: function (e) { e.stopPropagation(); G.say(text, lang); } }, '🔊'),
      G.el('button.speak.slow', { 'aria-label': 'Nghe chậm', onclick: function (e) { e.stopPropagation(); G.say(text, lang, true); } }, '🐢'));
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
    var a = ac();
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

  /* ---------- âm thanh hiệu ứng ---------- */
  var ctx = null;
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  G.audioCtx = ac;
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
