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
  G.toast = function (msg, ms) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, ms || 2600);
  };
})();
