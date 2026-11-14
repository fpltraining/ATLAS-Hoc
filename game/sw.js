/* Chạy offline: giữ toàn bộ code game, dữ liệu và mọi file trong assets/ đã có.
   Hình mới bỏ vào assets/ được tải ở lần mở kế tiếp có mạng. Tệp giọng đọc được giữ lại khi đã nghe một lần. */
var VERSION = 'thegioi-v7';
var CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/game.css',
  'js/util.js', 'js/save.js', 'js/assets.js', 'js/audio.js', 'js/world.js', 'js/engine.js', 'js/lesson.js', 'js/lobby.js', 'js/main.js', 'js/avatar.js', 'js/create.js', 'js/ride.js',
  'data/en_a1.js', 'data/avatar_heads.js', '../data/audio.json', '../icons/icon-180.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(CORE.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () {
    // hình đã có trong assets/ (thiếu file nào thì bỏ qua)
    return fetch('js/assets.js').then(function (r) { return r.text(); }).then(function (t) {
      var m = t.match(/'[a-z0-9_]+\.(png|mp4)'/g) || [];
      return caches.open(VERSION).then(function (c) {
        return Promise.all(m.map(function (q) { return c.add(new Request('assets/' + q.slice(1, -1), { cache: 'reload' })).catch(function () {}); }));
      });
    }).catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('thegioi-') === 0 && k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // assets/ và tệp giọng: có trong máy thì dùng, chưa có thì tải rồi giữ (không lưu lỗi 404 để file mới vẫn hiện)
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return null; });
    if (hit && url.pathname.indexOf('/audio/') < 0) return hit;
    return hit || net.then(function (r) { return r || new Response('', { status: 504 }); });
  }));
});
