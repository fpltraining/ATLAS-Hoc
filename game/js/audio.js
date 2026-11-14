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
    return index[lang][k] ? '../audio/' + lang + '/' + k + '.mp3' : null;
  };

  function speakTts(text, lang) {
    if (!window.speechSynthesis) return;
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
      u.rate = 0.85;
      var vs = speechSynthesis.getVoices();
      for (var i = 0; i < vs.length; i++) if (vs[i].lang && vs[i].lang.replace('_', '-').indexOf(u.lang) === 0) { u.voice = vs[i]; break; }
      speechSynthesis.speak(u);
    } catch (e) { /* máy không có giọng */ }
  }

  G.say = function (text, lang) {
    var url = G.audioUrl(text, lang || 'en');
    if (url) {
      player.src = url;
      var p = player.play();
      if (p && p.catch) p.catch(function () { speakTts(text, lang); });
    } else speakTts(text, lang || 'en');
  };

  /* Tải sẵn tệp giọng của một phòng để học được khi mất mạng (service worker giữ lại) */
  G.warmAudio = function (texts, lang) {
    if (!index) { setTimeout(function () { G.warmAudio(texts, lang); }, 800); return; }
    for (var i = 0; i < texts.length; i++) {
      var u = G.audioUrl(texts[i], lang);
      if (u) { var x = new XMLHttpRequest(); x.open('GET', u); x.send(); }
    }
  };

  /* ---------- âm thanh hiệu ứng ---------- */
  var ctx = null;
  function ac() {
    if (!ctx) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { ctx = new C(); } catch (e) { return null; } }
    if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
    return ctx;
  }
  window.addEventListener('touchstart', function () { ac(); }, { once: true, passive: true });
  window.addEventListener('mousedown', function () { ac(); }, { once: true });

  function tone(f, at, dur, type, vol) {
    var a = ac(); if (!a) return;
    var t = a.currentTime + at;
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.015);
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
