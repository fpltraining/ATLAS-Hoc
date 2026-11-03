/* Service Worker: biến trang web này thành app dùng được offline.

   Sau lần mở đầu tiên có mạng, mọi file cần thiết được giữ lại trong máy.
   Từ đó học được ở bất cứ đâu, kể cả khi bật Chế độ máy bay.
*/

const VERSION = 'atlas-v8';
const CORE = `${VERSION}-core`;
const RUNTIME = `${VERSION}-runtime`;

const CORE_FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'css/app.css', 'css/atlas.css',
  'js/app.js', 'js/ui.js', 'js/data.js', 'js/store.js', 'js/srs.js', 'js/plan.js',
  'js/audio.js', 'js/content.js', 'js/kit.js', 'js/ai.js',
  'js/pen/canvas.js', 'js/pen/brush.js', 'js/pen/grid.js', 'js/pen/grade.js', 'js/pen/sound.js', 'js/pen/inkpad.js',
  ...['home', 'en', 'zh', 'read', 'reader', 'lesson', 'write', 'review', 'radicals', 'pinyin', 'char', 'penen',
    'work', 'know', 'lib', 'drill', 'numbers', 'notes', 'book', 'stats', 'settings', 'exam'].map((v) => `js/views/${v}.js`),
  'data/curriculum/index.json', 'data/hsk2025.json', 'data/strokes/index.json', 'data/radicals.json',
  'data/hanviet.json', 'data/decomp.json',
  'data/stories/index.json', 'data/en/course.json', 'data/en/dict.json', 'data/zh-dict.json',
  'data/work.json', 'data/know.json',
  'icons/icon-180.png', 'icons/icon-192.png',
];

/* Tải sau, chạy ngầm: nhiều và nặng hơn nhưng không cần ngay lúc mở app */
const EXTRA_FILES = ['data/en/placement.json', 'data/exams/index.json', 'data/en/bank.json', 'data/en/book.json', 'data/en/sentences.json', 'data/topics.json'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CORE);
    // addAll thất bại toàn bộ nếu một file lỗi, nên thêm từng file để bền hơn
    await Promise.all(CORE_FILES.map((f) => cache.add(f).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Chỉ dọn bản cũ của chính app này. Các app khác cùng tên miền fpltraining.github.io
    // (Bút Hán, ATLAS cũ...) dùng chung kho cache, xoá nhầm là chúng mất chế độ offline.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('atlas-') && !k.startsWith(VERSION)).map((k) => caches.delete(k)));
    await self.clients.claim();
    fillContentCache();
  })());
});

let filling = false;

async function fillContentCache() {
  if (filling) return;
  filling = true;
  try {
    // Bút Hán khi cập nhật sẽ xoá mọi cache không phải của nó, kể cả của app này,
    // nên mỗi lần mở app đều kiểm tra và tải lại phần khung nếu bị thiếu.
    const core = await caches.open(CORE);
    await Promise.all(CORE_FILES.map(async (f) => {
      if (!(await core.match(f))) await core.add(f).catch(() => {});
    }));

    const cache = await caches.open(RUNTIME);
    const urls = new Set(EXTRA_FILES);

    const idx = await fetch('data/curriculum/index.json').then((r) => r.json());
    for (const l of idx.lessons) urls.add(`data/curriculum/${l.file}`);

    const sidx = await fetch('data/strokes/index.json').then((r) => r.json());
    for (const shard of new Set(Object.values(sidx))) urls.add(`data/strokes/${shard}.json`);

    const exams = await fetch('data/exams/index.json').then((r) => r.json()).catch(() => []);
    for (const e of exams) urls.add(`data/exams/${e.id}.json`);

    const stories = await fetch('data/stories/index.json').then((r) => r.json());
    for (const s of stories) urls.add(`data/stories/${s.id}.json`);

    const todo = [];
    for (const u of urls) if (!(await cache.match(u))) todo.push(u);

    let i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const u = todo[i++];
        try {
          const res = await fetch(u);
          if (res && res.ok) await cache.put(u, res.clone());
        } catch { /* mạng chập chờn, lần chạy sau tải tiếp */ }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
  } catch { /* không sao, app vẫn chạy khi có mạng */ } finally {
    filling = false;
  }
}

self.addEventListener('message', (e) => {
  if (e.data === 'fill-offline') e.waitUntil(fillContentCache());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Mở app: lấy NGAY bản đã lưu rồi mới âm thầm hỏi mạng bản mới, để không treo màn hình trắng khi mạng chậm.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CORE);
      const cached = (await cache.match('index.html')) || (await cache.match('./'));
      const fresh = fetch(req).then((res) => {
        if (res && res.ok) cache.put('index.html', res.clone());
        return res;
      }).catch(() => null);
      return cached || (await fresh) || Response.error();
    })());
    return;
  }

  // Mọi thứ còn lại: lấy từ bộ nhớ đệm trước cho nhanh, đồng thời làm mới ngầm
  e.respondWith((async () => {
    const cached = await caches.match(req);
    const network = fetch(req).then(async (res) => {
      if (res && res.ok) {
        const cache = await caches.open(url.pathname.includes('/data/') ? RUNTIME : CORE);
        cache.put(req, res.clone());
      }
      return res;
    }).catch(() => null);

    return cached || (await network) || new Response('Offline', { status: 503 });
  })());
});
