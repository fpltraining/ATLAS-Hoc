/* Chạy offline: giữ toàn bộ code game, dữ liệu và mọi hình trong assets/.
   Hình tải qua assets/<tên>?v=<mã nội dung> (data/asset_rev.js): mỗi lần cập nhật app chỉ tải hình mới hoặc hình đã thay,
   hình không đổi chép lại từ bản trong máy. Tệp giọng đọc được giữ lại khi đã nghe một lần. */
var VERSION = 'thegioi-v84';
// giọng đọc: tên tệp đặt theo nội dung câu nên không bao giờ đổi, giữ riêng một kho để cập nhật app không phải tải lại
var AUDIO = 'connectlife-audio-v2';
var CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/game.css',
  'js/util.js', 'js/save.js', 'data/asset_rev.js', 'js/assets.js', 'js/audio.js', 'js/speak.js', 'js/world.js', 'js/engine.js', 'js/rooms.js', 'js/lesson.js', 'js/lobby.js', 'js/main.js', 'js/avatar.js', 'js/create.js', 'js/ride.js', 'js/grad.js', 'js/flight.js', 'data/zh_hsk1.js', 'js/life.js', 'js/daily.js', 'js/rank.js', 'js/floorbadge.js', 'js/practice.js', 'data/practice_en.js', 'data/life.js', 'data/life_morning.js', 'data/life_school.js', 'data/life_after.js', 'data/life_vi.js', 'data/placement_en.js', 'js/placement.js', 'js/music.js', 'js/radar.js', 'data/walkmask.js', 'data/hands.js', 'js/cloud_config.js', 'js/cloud.js',
  'data/en_a1.js', 'data/en_found.js', 'data/avatar_heads.js', '../data/audio.json', '../icons/icon-180.png', 'assets/paper_tile.webp'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(CORE.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () {
    // mọi hình trong assets/ theo mã phiên bản: đã có đúng bản trong máy thì chép sang, chưa có thì tải
    return fetch('data/asset_rev.js', { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
      var rev = JSON.parse(t.slice(t.indexOf('{', t.indexOf('ASSET_REV')), t.lastIndexOf('}') + 1));
      return caches.open(VERSION).then(function (c) {
        return Promise.all(Object.keys(rev).map(function (n) {
          var u = 'assets/' + n + '?v=' + rev[n];
          return caches.match(u).then(function (hit) {
            return hit ? c.put(u, hit) : c.add(new Request(u, { cache: 'reload' }));
          }).catch(function () {});
        }));
      });
    }).catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) {
      return (k.indexOf('thegioi-') === 0 && k !== VERSION) || (k.indexOf('connectlife-audio-') === 0 && k !== AUDIO);
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // assets/ và tệp giọng: có trong máy thì dùng, chưa có thì tải rồi giữ (không lưu lỗi 404 để file mới vẫn hiện)
  var isAudio = url.pathname.indexOf('/audio/') >= 0 || url.pathname.indexOf('/music/') >= 0;   // giọng đọc và nhạc nền: tên tệp không đổi
  e.respondWith(caches.match(req).then(function (hit) {
    if (hit && isAudio) return hit;   // giọng đọc đã có thì dùng luôn, không tải lại
    if (hit && url.pathname.indexOf('/assets/') >= 0 && /[?&]v=/.test(url.search)) return hit;   // hình có mã phiên bản: không bao giờ cũ
    var net = fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(isAudio ? AUDIO : VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return null; });
    return hit || net.then(function (r) { return r || new Response('', { status: 504 }); });
  }));
});
