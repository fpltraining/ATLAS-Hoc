/* Tiện ích dùng chung. ES5 thuần (không =>, let, const, chuỗi `, ?.) để chạy trên Safari iOS đời cũ. */
var G = window.G || (window.G = {});

(function () {
  /* Giờ Việt Nam (UTC+7) dạng "YYYY-MM-DD HH:mm" và ngày "YYYY-MM-DD" */
  function pad(n) { return n < 10 ? '0' + n : String(n); }
  G.vnParts = function (t) {
    var d = new Date((t || Date.now()) + 7 * 3600 * 1000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes() };
  };
  G.vnNow = function (t) {
    var p = G.vnParts(t);
    return p.y + '-' + pad(p.m) + '-' + pad(p.d) + ' ' + pad(p.h) + ':' + pad(p.mi);
  };
  G.vnDay = function (t) { return G.vnNow(t).slice(0, 10); };
  G.vnStamp = function () { var s = G.vnNow(); return s.replace(/-/g, '').replace(' ', '-').replace(':', ''); };

  /* Tạo phần tử: G.el('div.card', {onclick: fn}, con1, con2...) */
  G.el = function (spec) {
    var parts = String(spec).split('.');
    var node = document.createElement(parts[0] || 'div');
    if (parts.length > 1) node.className = parts.slice(1).join(' ');
    var start = 1;
    var props = arguments[1];
    if (props && typeof props === 'object' && !(props instanceof Node) && !(props instanceof Array)) {
      start = 2;
      for (var k in props) {
        if (!props.hasOwnProperty(k)) continue;
        var v = props[k];
        if (v === null || v === undefined || v === false) continue;
        if (k.indexOf('on') === 0 && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'style' && typeof v === 'object') { for (var s in v) node.style[s] = v[s]; }
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    for (var i = start; i < arguments.length; i++) addKid(node, arguments[i]);
    return node;
  };
  function addKid(node, c) {
    if (c === null || c === undefined || c === false) return;
    if (c instanceof Array) { for (var j = 0; j < c.length; j++) addKid(node, c[j]); return; }
    node.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }

  G.shuffle = function (a) {
    var b = a.slice();
    for (var i = b.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = b[i]; b[i] = b[j]; b[j] = t; }
    return b;
  };
  G.pick = function (a, n, not) {
    var pool = [];
    for (var i = 0; i < a.length; i++) if (a[i] !== not) pool.push(a[i]);
    return G.shuffle(pool).slice(0, n);
  };

  /* Khoá tệp giọng AI của ATLAS (FNV-1a 32 bit), giống js/audiokey.js */
  G.audioKey = function (lang, text) {
    var t = String(text).replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
    if (lang === 'en') t = t.toLowerCase();
    var s = lang + '|' + t;
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    var hex = h.toString(16);
    while (hex.length < 8) hex = '0' + hex;
    return hex;
  };

  /* Thông báo nhỏ */
  var toastTimer = 0;
  /* ---------- chuyển động (anime.js 3.2.2, vendor/anime.min.js, MIT) ----------
     Máy bật Giảm chuyển động hoặc chưa có thư viện thì bỏ qua, mọi thứ hiện ngay ở trạng thái cuối. */
  G.calm = function () { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  function moving() { return !!window.anime && !G.calm(); }
  // xuất hiện lần lượt: trượt lên và hiện dần
  G.enter = function (els, o) {
    if (!moving() || !els || !els.length) return;
    o = o || {};
    window.anime({ targets: els, translateY: [o.y || 14, 0], opacity: [0, 1], delay: window.anime.stagger(o.gap || 55, { start: o.start || 0 }), duration: o.dur || 520, easing: 'easeOutCubic' });
  };
  // bật lên kiểu lò xo (icon ngọn lửa, cúp…)
  G.pop = function (el, delay) {
    if (!moving() || !el) return;
    window.anime({ targets: el, scale: [0.3, 1], rotate: [-18, 0], delay: delay || 0, duration: 900, easing: 'spring(1, 80, 10, 0)' });
  };
  // số chạy từ giá trị cũ tới giá trị mới; xong thì gọi done (nếu có)
  G.countUp = function (el, from, to, o) {
    o = o || {};
    var suf = o.suf || '';
    if (!moving() || from === to) { el.textContent = to + suf; if (o.done) o.done(); return; }
    var v = { n: from };
    if (el._anim) el._anim.pause();
    el._anim = window.anime({ targets: v, n: to, round: 1, delay: o.delay || 0, duration: o.dur || 600, easing: 'easeOutCubic',
      update: function () { el.textContent = v.n + suf; }, complete: function () { el._anim = null; if (o.done) o.done(); } });
  };

  G.toast = function (msg, ms) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, ms || 2600);
  };
})();
