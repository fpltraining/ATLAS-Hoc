/* Chạy offline: giữ toàn bộ code game, dữ liệu và hình trong assets/.
   Lần mở đầu chỉ tải trước code và hình giao diện nhẹ (LIGHT, khoảng 2 MB) để app mở nhanh; hình lớn (bản đồ, cảnh, nhân vật)
   tải khi cần, và trang gửi 'warm' sau khi đã chạy ổn để tải dần phần còn lại ở nền (bỏ qua khi máy bật Tiết kiệm dữ liệu).
   Hình tải qua assets/<tên>?v=<mã nội dung> (data/asset_rev.js): mỗi lần cập nhật app chỉ tải hình mới hoặc hình đã thay,
   hình không đổi chép lại từ bản trong máy. Tệp giọng đọc được giữ lại khi đã nghe một lần. */
var VERSION = 'thegioi-v131';
// giọng đọc: tên tệp đặt theo nội dung câu nên không bao giờ đổi, giữ riêng một kho để cập nhật app không phải tải lại
var AUDIO = 'connectlife-audio-v2';
var CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/game.css',
  'js/util.js', 'js/save.js', 'data/asset_rev.js', 'js/assets.js', 'js/audio.js', 'js/speak.js', 'js/world.js', 'js/engine.js', 'js/rooms.js', 'js/lesson.js', 'js/lobby.js', 'js/main.js', 'js/avatar.js', 'js/create.js', 'js/ride.js', 'js/grad.js', 'js/flight.js', 'data/zh_hsk1.js', 'data/zh_index.js', 'data/life_zh.js', 'data/free_zh.js', 'js/zh_test.js', 'js/life.js', 'js/daily.js', 'js/zh.js', 'js/pen.js', 'js/write.js', 'js/rank.js', 'js/floorbadge.js', 'js/practice.js', 'js/memmap.js', 'data/topic_en_index.js', 'data/vocab_test_en.js', 'js/topics.js', 'data/fix_en.js', 'js/fixit.js', 'js/retain.js', 'js/track.js', 'data/topic_en.json', 'js/final.js', 'data/practice_en.js', 'data/life.js', 'data/life_morning.js', 'data/life_school.js', 'data/life_after.js', 'data/life_vi.js', 'data/placement_en.js', 'js/placement.js', 'data/pron_en.js', 'js/pron.js', 'js/music.js', 'js/radar.js', 'js/world3d.js', 'data/walkmask.js', 'data/hands.js', 'data/river_en.js', 'js/cloud_config.js', 'js/cloud.js',
  'data/en_a1.js', 'data/en_a1_more.js', 'data/en_found.js', 'data/en_a2.js', 'data/en_b1.js', 'data/cert_en.js', 'data/content_en.js', 'data/final_en.js', 'pho3d.html', 'vendor/three.min.js', 'vendor/anime.min.js', 'vendor/auto-animate.js', 'vendor/lottie_light.min.js', 'vendor/fonts/be-vietnam-pro-vietnamese-400-normal.woff2', 'vendor/fonts/be-vietnam-pro-latin-400-normal.woff2', 'vendor/fonts/be-vietnam-pro-vietnamese-600-normal.woff2', 'vendor/fonts/be-vietnam-pro-latin-600-normal.woff2', 'vendor/fonts/be-vietnam-pro-vietnamese-700-normal.woff2', 'vendor/fonts/be-vietnam-pro-latin-700-normal.woff2', 'vendor/fonts/be-vietnam-pro-vietnamese-800-normal.woff2', 'vendor/fonts/be-vietnam-pro-latin-800-normal.woff2', 'anim/confetti.json', 'anim/noto_gift.json', 'anim/noto_trophy.json', 'anim/noto_fire.json', 'anim/noto_party.json', 'data/avatar_heads.js', '../data/audio.json', 'icons/icon-180.png', 'icons/icon-192.png', 'assets/paper_tile.webp', 'assets/paper_tile_1600.webp'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) {
    return Promise.all(CORE.map(function (f) { return c.add(new Request(f, { cache: 'reload' })).catch(function () {}); }));
  }).then(function () {
    // hình trong assets/ theo mã phiên bản: hình đã có đúng bản trong máy (bản app cũ) thì chép sang hết;
    // hình chưa có thì lúc cài chỉ tải hình giao diện nhẹ, phần còn lại để warm() tải dần
    return revs().then(function (rev) {
      return caches.open(VERSION).then(function (c) {
        return Promise.all(Object.keys(rev).map(function (n) {
          var u = 'assets/' + n + '?v=' + rev[n];
          return caches.match(u).then(function (hit) {
            return hit ? c.put(u, hit) : LIGHT.test(n) ? c.add(new Request(u, { cache: 'reload' })) : null;
          }).catch(function () {});
        }));
      });
    }).catch(function () {});
  }).then(function () { return self.skipWaiting(); }));
});
var LIGHT = /^(ic3_|ic_|badge_|lobby_|kai_|paper_|souvenir_|splash|sun_paper|moon_paper|talk_bubble)/;
function revs() {
  return fetch('data/asset_rev.js', { cache: 'reload' }).then(function (r) { return r.text(); }).then(function (t) {
    return JSON.parse(t.slice(t.indexOf('{', t.indexOf('ASSET_REV')), t.lastIndexOf('}') + 1));
  });
}
/* tải dần các hình còn thiếu, mỗi lượt 6 hình, để học offline được cả bản đồ và cảnh (trang gửi 'warm' khi đã rảnh) */
var warming = null;
function warm() {
  if (warming) return warming;
  warming = Promise.all([revs(), caches.open(VERSION)]).then(function (r) {
    var rev = r[0], c = r[1], todo = Object.keys(rev).map(function (n) { return 'assets/' + n + '?v=' + rev[n]; });
    function step(i) {
      if (i >= todo.length) return null;
      return Promise.all(todo.slice(i, i + 6).map(function (u) {
        return c.match(u).then(function (hit) { return hit ? null : c.add(new Request(u)).catch(function () {}); });
      })).then(function () { return step(i + 6); });
    }
    return step(0);
  }).catch(function () {}).then(function () { warming = null; });
  return warming;
}
self.addEventListener('message', function (e) { if (e.data === 'warm') e.waitUntil(warm()); });

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
  var cdnAudio = url.origin !== location.origin && /\/audio\/(en|zh)\/[0-9a-f]+\.mp3$/.test(url.pathname);   // giọng đọc đặt trên CDN (G.AUDIO_BASE)
  if (url.origin !== location.origin && !cdnAudio) return;
  // assets/ và tệp giọng: có trong máy thì dùng, chưa có thì tải rồi giữ (không lưu lỗi 404 để file mới vẫn hiện)
  var isAudio = cdnAudio || url.pathname.indexOf('/audio/') >= 0 || url.pathname.indexOf('/music/') >= 0 || url.pathname.indexOf('/sfx/') >= 0;   // giọng đọc, nhạc nền, tiếng động (sfx có ?v=): tên tệp không đổi
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
