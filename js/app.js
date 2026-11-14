/* ATLAS — khung ứng dụng và bộ định tuyến.

   Gộp Bút Hán, Inklish, ATLAS cũ, Song Ngữ và Han's English Hub làm một.
   Toàn bộ app chạy bằng ES modules thuần, không cần bước build: muốn sửa gì chỉ
   việc mở file lên sửa rồi tải lại trang.
*/

import * as auth from './auth.js';
import * as sync from './sync.js';
import * as data from './data.js';
import * as store from './store.js';
import * as audio from './audio.js';
import { h, toast, sheet } from './ui.js';

const routes = {
  home:     () => import('./views/home.js'),
  en:       () => import('./views/en.js'),
  zh:       () => import('./views/zh.js'),
  read:     () => import('./views/read.js'),
  reader:   () => import('./views/reader.js'),
  penen:    () => import('./views/penen.js'),
  lesson:   () => import('./views/lesson.js'),
  write:    () => import('./views/write.js'),
  review:   () => import('./views/review.js'),
  radicals: () => import('./views/radicals.js'),
  pinyin:   () => import('./views/pinyin.js'),
  char:     () => import('./views/char.js'),
  work:     () => import('./views/work.js'),
  know:     () => import('./views/know.js'),
  lib:      () => import('./views/lib.js'),
  drill:    () => import('./views/drill.js'),
  numbers:  () => import('./views/numbers.js'),
  notes:    () => import('./views/notes.js'),
  book:     () => import('./views/book.js'),
  stats:    () => import('./views/stats.js'),
  exam:     () => import('./views/exam.js'),
  charmap:  () => import('./views/charmap.js'),
  challenge: () => import('./views/challenge.js'),
  games:    () => import('./views/games.js'),
  search:   () => import('./views/search.js'),
  word:     () => import('./views/word.js'),
  speak:    () => import('./views/speak.js'),
  hsk:      () => import('./views/word.js'),
  pron:     () => import('./views/pron.js'),
  start:    () => import('./views/start.js'),
};

/* Màn hình nào thuộc khối học nào, để đếm thời gian và sáng đúng mục trên thanh điều hướng */
const TRACK = {
  review: 'review', en: 'en', read: 'read', reader: 'read', lesson: 'zh', write: 'zh',
  char: 'zh', radicals: 'zh', pinyin: 'zh', zh: 'zh', exam: 'zh', charmap: 'zh', challenge: 'review', games: 'zh', word: 'zh', hsk: 'zh', penen: 'en', work: 'work', know: 'know', book: 'en',
};
const TAB = {
  home: 'home', review: 'home', en: 'en', penen: 'en', work: 'en', book: 'en',
  start: 'home', zh: 'zh', lesson: 'zh', write: 'zh', char: 'zh', radicals: 'zh', pinyin: 'zh', exam: 'zh', charmap: 'zh', challenge: 'home', games: 'zh', search: 'lib', word: 'zh', hsk: 'zh', speak: 'home',
  lib: 'lib', drill: 'lib', numbers: 'lib', notes: 'lib', know: 'lib', stats: 'stats',
};

/* Giây học ghi vào khối của đúng ngôn ngữ: đọc truyện tiếng Trung không tính vào tiếng Anh,
   ôn thẻ tách theo ngôn ngữ đang ôn (ôn chung cả hai thì ghi vào khối chung). */
function trackOf(route) {
  const n = route.name;
  if (n === 'speak') return route.args[0] === 'zh' ? 'zh' : 'en';
  if (n === 'pron') return route.args[0] === 'en' ? 'en' : 'zh';
  if (n === 'reader') return String(route.args[0]).startsWith('zh-') ? 'readZh' : 'read';
  if (n === 'read') return route.args[0] === 'zh' ? 'readZh' : 'read';
  if (n === 'review') return route.query.lang === 'en' ? 'reviewEn' : route.query.lang === 'zh' ? 'reviewZh' : 'review';
  return TRACK[n] || null;
}

/* Đọc truyện và ôn thẻ thuộc mục của đúng ngôn ngữ đang xem */
function tabOf(route) {
  if (route.name === 'read') return route.args[0] === 'zh' ? 'zh' : 'en';
  if (route.name === 'reader') return String(route.args[0]).startsWith('zh-') ? 'zh' : 'en';
  if (route.name === 'review') return route.query.lang || 'home';
  if (route.name === 'pron') return route.args[0] === 'en' ? 'en' : 'zh';
  return TAB[route.name] || 'home';
}

const viewEl = document.getElementById('view');
const titleEl = document.getElementById('topbar-title');
const backBtn = document.getElementById('btn-back');
const bootEl = document.getElementById('boot');
const bootMsg = document.getElementById('boot-msg');

let currentCleanup = null;
let currentTrack = null;
const historyStack = [];

// Mỗi lần điều hướng được đánh số. Dựng màn hình là việc bất đồng bộ, nên nếu bấm
// nhanh sang màn khác, lượt cũ có thể xong SAU và ghi đè lên màn hình mới.
let navSeq = 0;

/* ---------- định tuyến --------------------------------------------------- */

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [pathPart, queryPart] = raw.split('?');
  const parts = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  const name = parts[0] || 'home';
  const query = Object.fromEntries(new URLSearchParams(queryPart || ''));
  return { name, args: parts.slice(1), query };
}

async function router() {
  if (swUpdated) { location.reload(); return; }
  const route = parseHash();
  const loader = routes[route.name] || routes.home;
  const seq = ++navSeq;
  const stale = () => seq !== navSeq;

  try { currentCleanup?.(); } catch { /* bỏ qua */ }
  currentCleanup = null;
  audio.stop();
  currentTrack = trackOf(route);

  viewEl.replaceChildren(h('div.empty', h('span.spin')));
  viewEl.className = 'view';

  let mod;
  try {
    mod = await loader();
  } catch (e) {
    if (stale()) return;
    // Lỗi ghép tệp khác phiên bản (vừa cập nhật): tự tải lại một lần là hết
    if (/binding|import|module|export/i.test(String(e?.message || e))) {
      let last = 0;
      try { last = Number(sessionStorage.getItem('atlas-auto-reload') || 0); } catch { /* bỏ qua */ }
      if (Date.now() - last > 60000) {
        try { sessionStorage.setItem('atlas-auto-reload', String(Date.now())); } catch { /* bỏ qua */ }
        location.reload();
        return;
      }
    }
    showError('Không tải được màn hình này.', e);
    return;
  }
  if (stale()) return;

  try {
    const result = await mod.render(route, { go, back });
    if (stale()) {
      try { result.cleanup?.(); } catch { /* bỏ qua */ }
      return;
    }
    viewEl.replaceChildren(result.el);
    if (result.className) viewEl.className = 'view ' + result.className;
    titleEl.textContent = result.title || 'ATLAS';
    document.title = result.title ? `${result.title} · ATLAS` : 'ATLAS';
    currentCleanup = result.cleanup || null;
    window.scrollTo(0, 0);
  } catch (e) {
    if (stale()) return;
    showError('Màn hình gặp lỗi khi hiển thị.', e);
    return;
  }

  backBtn.hidden = route.name === 'home' && historyStack.length === 0;
  const tab = tabOf(route);
  if (route.name === 'pinyin') store.markLesson('pinyinSeen', { seen: true }).catch(() => {});
  for (const t of document.querySelectorAll('.tab')) t.classList.toggle('on', t.dataset.tab === tab);
  refreshDueBadge();
  refreshDayRing();
}

/* Vòng tiến độ hôm nay ở góc phải thanh trên: phút đã học / quỹ thời gian, số việc đã xong */
let ringLast = -1;
async function refreshDayRing() {
  try {
    const { buildToday, minsByLang } = await import('./plan.js');
    const plan = await buildToday();
    const m = minsByLang(plan.day.secs);
    const mins = m.en + m.zh + m.all, budget = plan.budget || 120;
    const done = plan.steps.filter((s) => s.done).length, all = plan.steps.length;
    // tiến độ = trung bình của phút đã học và việc đã xong (học đủ giờ mà bỏ việc thì chưa tròn vòng)
    const pct = Math.min(100, Math.round(((Math.min(1, mins / budget) + (all ? done / all : 0)) / 2) * 100));
    const el = document.getElementById('day-ring');
    el.hidden = false;
    el.style.setProperty('--p', pct);
    el.classList.toggle('full', pct >= 100);
    document.getElementById('dr-pct').textContent = pct >= 100 ? '✓' : pct + '%';
    document.getElementById('dr-min').textContent = `${mins}/${budget}′`;
    document.getElementById('dr-sub').textContent = `${done}/${all} việc`;
    el.title = `Hôm nay: ${mins}/${budget} phút, ${done}/${all} việc`;
    if (ringLast >= 0 && pct > ringLast) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    ringLast = pct;
  } catch { /* chưa có dữ liệu: ẩn */ }
}
setInterval(refreshDayRing, 60000);

function showError(msg, err) {
  console.error(err);
  viewEl.replaceChildren(h('div.empty',
    h('img.empty-art', { src: navigator.onLine ? 'img/moments/error.webp' : 'img/moments/offline.webp', alt: '' }),
    h('p', navigator.onLine ? msg : 'Đang mất mạng. Những bài đã mở trước đó vẫn học được.'),
    h('p.small.faint', String(err?.message || err || '')),
    h('p.small.faint', 'Thường do app vừa cập nhật bản mới. Bấm Tải lại app là xong.'),
    h('button.btn.sm', { onclick: () => location.reload() }, 'Tải lại app'),
  ));
}

export function go(path, { replace = false } = {}) {
  if (!replace) historyStack.push(location.hash);
  if (replace) location.replace('#' + path);
  else location.hash = path;
}

export function back() {
  if (historyStack.length) location.hash = historyStack.pop() || '#/home';
  else location.hash = '#/home';
}

/* ---------- huy hiệu số thẻ đến hạn ------------------------------------- */

export async function refreshDueBadge() {
  try {
    const due = await store.dueCards();
    const el = document.getElementById('due-badge');
    el.textContent = due.length > 99 ? '99+' : String(due.length);
    el.hidden = due.length === 0;
  } catch { /* bỏ qua */ }
}

/* ---------- đếm thời gian học ---------------------------------------------

   Chỉ tính khi app đang mở và có thao tác trong 2 phút gần nhất. Con số trên
   trang chủ vì thế phản ánh thời gian thật, không phải thời gian để máy nằm đó. */

let lastActivity = Date.now();
const IDLE_MS = 2 * 60 * 1000;
const TICK_S = 15;

function startClock() {
  for (const ev of ['pointerdown', 'keydown', 'scroll', 'touchstart']) {
    window.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true });
  }
  setInterval(() => {
    if (document.hidden || !currentTrack) return;
    if (Date.now() - lastActivity > IDLE_MS) return;
    store.addSeconds(currentTrack, TICK_S).catch(() => {});
  }, TICK_S * 1000);
}

/* ---------- khởi động ---------------------------------------------------- */

export function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

async function boot() {
  try {
    // Đăng nhập (chỉ khi đã cấu hình Supabase), chọn dữ liệu của đúng tài khoản rồi đồng bộ
    if (auth.configured()) {
      bootMsg.textContent = '';
      const user = await auth.ensureLogin(bootEl);
      store.useDatabase(auth.dbNameFor(user.id));
      bootMsg.textContent = 'Đang đồng bộ tiến độ…';
      await sync.start(user.id);
    }
    bootMsg.textContent = 'Đang tải giáo trình…';
    const [settings] = await Promise.all([store.settings(), data.curriculum()]);
    applyTheme(settings.theme);

    audio.setVoices({ en: settings.enVoice, zh: settings.zhVoice });
    audio.setAiVoice(settings.aiVoice !== false);
    audio.initVoices();

    // Mở khoá âm thanh ở lần chạm đầu tiên (yêu cầu bắt buộc của iOS)
    const unlockOnce = () => {
      audio.unlock();
      document.removeEventListener('pointerdown', unlockOnce);
    };
    document.addEventListener('pointerdown', unlockOnce);

    bootEl.remove();
    document.getElementById('topbar').hidden = false;
    document.getElementById('tabbar').hidden = false;
    viewEl.hidden = false;

    window.addEventListener('hashchange', router);
    backBtn.addEventListener('click', back);
    document.getElementById('btn-report').addEventListener('click', async () => {
      const { openReport } = await import('./report.js');
      openReport();
    });
    document.getElementById('btn-settings').addEventListener('click', async () => {
      const { renderSettings } = await import('./views/settings.js');
      sheet(await renderSettings());
    });

    startClock();
    await router();
    registerServiceWorker();
    data.warmLookups();
    listenCelebrations();
    // huy hiệu đã đạt từ trước (lần đầu có tính năng này) thì mở khoá và chúc mừng luôn
    setTimeout(() => import('./badges.js').then((m) => m.checkBadges()).catch(() => {}), 2500);
  } catch (e) {
    console.error(e);
    bootEl.classList.add('error');
    bootMsg.textContent =
      'Không tải được dữ liệu. Nếu bạn đang mở file trực tiếp từ ổ đĩa, ' +
      'hãy chạy app qua một máy chủ web (xem README).';
  }
}

/* ---------- ăn mừng khi xong việc, lên rank ----------
   store.markStep phát 'atlas:step' khi một việc trong ngày vừa xong; gom các sự kiện liền nhau
   (ôn chung cả hai ngôn ngữ xong hai việc một lúc) rồi hiện một thẻ ăn mừng có nút sang việc kế tiếp. */
function listenCelebrations() {
  const keys = new Set();
  let timer = 0;
  window.addEventListener('atlas:step', (e) => {
    keys.add(e.detail.key);
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const done = [...keys];
      keys.clear();
      try {
        const [{ buildToday, langDay, LANG_NAME, minsByLang }, fx, badges] = await Promise.all([import('./plan.js'), import('./fx.js'), import('./badges.js')]);
        const plan = await buildToday();
        const step = plan.steps.find((s) => done.includes(s.key));
        if (/^#\/(home|en|zh)?$/.test(location.hash || '#/home')) window.dispatchEvent(new HashChangeEvent('hashchange'));
        if (step) {
          const g = langDay(plan, step.lang);
          const next = plan.steps.find((s) => !s.done);
          const who = step.lang === 'zh' ? 'han' : 'kai';
          const m = minsByLang(plan.day.secs);
          if (!next) {
            const langs = plan.settings.langs || 'both';
            const parts = [langs !== 'zh' ? `Tiếng Anh ${m.en} phút` : null, langs !== 'en' ? `Tiếng Trung ${m.zh} phút` : null].filter(Boolean);
            fx.celebrate({ big: true, who, pose: 'mung', video: 'kai-mung', title: 'Xong hết việc hôm nay!', sub: `${parts.join(' · ')}. Mai gặp lại nhé.` });
          } else if (step.lang !== 'all' && g.done === g.steps.length) {
            fx.celebrate({ who, pose: 'thang', title: `Xong ${LANG_NAME[step.lang].toLowerCase()} hôm nay!`, sub: `${g.steps.length}/${g.steps.length} việc · ${g.mins} phút`, next: { title: next.title, href: next.href } });
          } else {
            fx.celebrate({ who, title: `Xong: ${step.title}`, sub: `${LANG_NAME[step.lang]}: ${g.done}/${g.steps.length} việc hôm nay`, next: { title: next.title, href: next.href, label: 'Tiếp' } });
          }
        }
        setTimeout(() => badges.checkBadges().catch(() => {}), 1400);
      } catch (err) { console.warn(err); }
    }, 350);
  });
  window.addEventListener('atlas:rankup', async (e) => {
    try {
      const [{ emblem }, fx] = await Promise.all([import('./xp.js'), import('./fx.js')]);
      const r = e.detail.to;
      const shield = emblem(r, 96);
      shield.classList.add('fx-shine');
      const node = h('div.rankup-art', h('img', { src: 'img/moments/rankup.webp', alt: '' }), shield);
      fx.spotlight(node, { title: `Thăng hạng: ${r.label}`, sub: r.next ? `Tiếp theo: ${r.next}` : 'Rank cao nhất rồi!' });
    } catch (err) { console.warn(err); }
  });
}

/* Có bản mới (service worker mới vừa nắm quyền): lần chuyển màn hình kế tiếp thì tải lại cả app,
   để mọi tệp mã cùng một phiên bản. Không tải lại giữa chừng bài đang làm. */
let swUpdated = false;
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) swUpdated = true; });
  navigator.serviceWorker.register('sw.js')
    .then(() => navigator.serviceWorker.ready)
    .then((reg) => reg.active?.postMessage('fill-offline'))
    .catch(() => { /* chỉ mất chế độ offline */ });
}

boot();

// Cho phép gõ thử trong Safari Web Inspector khi cần gỡ lỗi
window.ATLAS = { data, store, audio, go, refreshDueBadge, toast };
