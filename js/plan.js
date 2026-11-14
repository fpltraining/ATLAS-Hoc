/* Kế hoạch mỗi ngày.

   Nguyên tắc:
     1. ÔN trước. Thẻ tới hạn mà bỏ qua là quên sạch phần đã học.
     2. Mỗi ngôn ngữ có đủ hai việc: học bài và đọc truyện.
     3. Từ mới có hạn mức, và tự giảm khi phần ôn vượt quỹ thời gian. Học song song
        hai ngôn ngữ mà không có phanh này thì chỉ sau vài tuần cả buổi chỉ còn ôn.
*/

import * as store from './store.js';
import * as data from './data.js';
import * as content from './content.js';
import { zhPath } from './path.js';

/* Số phút cho từng khối, theo quỹ thời gian mỗi ngày. */
export const BUDGETS = {
  120: { review: 30, en: 25, read: 15, zh: 25, readZh: 10, work: 10, know: 5 },
  90:  { review: 25, en: 20, read: 10, zh: 20, readZh: 5,  work: 5,  know: 5 },
  60:  { review: 15, en: 15, read: 10, zh: 15, readZh: 0,  work: 5,  know: 0 },
  30:  { review: 10, en: 10, read: 0,  zh: 10, readZh: 0,  work: 0,  know: 0 },
};

const NEW_WORDS = {
  120: { en: 10, zh: 5 },
  90:  { en: 8,  zh: 5 },
  60:  { en: 6,  zh: 4 },
  30:  { en: 4,  zh: 2 },
};

export const SECS_PER_CARD = 8;

/* Nhịp tuần: 5 ngày đủ, thứ Bảy không thêm từ mới mà đọc và viết nhiều hơn,
   Chủ nhật chỉ ôn và đọc nhẹ. */
export function dayType(settings, d = new Date()) {
  if (!settings.weekRhythm) return 'full';
  const wd = d.getDay();
  if (wd === 6) return 'deep';
  if (wd === 0) return 'light';
  return 'full';
}

export const DAY_NAME = { full: 'Ngày học đầy đủ', deep: 'Thứ Bảy: củng cố', light: 'Chủ nhật: học nhẹ' };

function blocksFor(budget, type, settings) {
  const b = { ...(BUDGETS[budget] || BUDGETS[120]) };

  // Ai chỉ học một ngôn ngữ thì khối của ngôn ngữ kia chuyển hết sang ngôn ngữ đang học
  const langs = settings.langs || 'both';
  if (langs === 'en') { b.en += b.zh; b.read += b.readZh; b.zh = 0; b.readZh = 0; }
  if (langs === 'zh') { b.zh += b.en + b.work; b.readZh += b.read; b.en = 0; b.read = 0; b.work = 0; }
  if (settings.workOn === false && b.work) { b.en += b.work; b.work = 0; }

  if (type === 'deep') {
    // Thứ Bảy: giờ học bài mới dồn sang đọc; ai chỉ học một ngôn ngữ thì đọc nhiều hơn
    const enToRead = b.zh ? Math.round(b.en * 0.6) : b.en;
    return { ...b, read: b.read + enToRead, en: 0, readZh: b.readZh + Math.round(b.zh * 0.4), zh: b.zh ? Math.round(b.zh * 0.6) + (b.en - enToRead) : 0 };
  }
  if (type === 'light') {
    return { review: Math.min(b.review, 30), read: b.read ? 15 : 0, readZh: b.readZh ? 10 : 0, en: 0, zh: 0, work: 0, know: 0 };
  }
  return b;
}

/** Hạn mức từ mới hôm nay, đã tính cả phanh theo số thẻ đang chờ. */
export function quotaToday(budget, type, dueCount) {
  const q = NEW_WORDS[budget] || NEW_WORDS[120];
  if (type !== 'full') return { en: 0, zh: 0, scale: 0, reason: 'Hôm nay không thêm từ mới theo nhịp tuần.' };
  const cap = (BUDGETS[budget] || BUDGETS[120]).review;
  const mins = (dueCount * SECS_PER_CARD) / 60;
  if (mins > cap * 1.2) return { en: 0, zh: 0, scale: 0, reason: `Đang chờ khoảng ${Math.round(mins)} phút ôn, vượt quỹ ${cap} phút. Hôm nay tạm dừng từ mới để không bị ngập.` };
  if (mins > cap * 0.9) return { en: Math.ceil(q.en / 2), zh: Math.ceil(q.zh / 2), scale: 0.5, reason: `Phần ôn sắp chạm quỹ ${cap} phút nên hôm nay giảm một nửa từ mới.` };
  return { en: q.en, zh: q.zh, scale: 1, reason: '' };
}

const isZhCard = (c) => !c.lang || c.lang === 'zh';

/* ---------- thời gian theo ngôn ngữ ------------------------------------------
   Mỗi giây học được ghi vào một khối (track). Khối nào thuộc ngôn ngữ nào: */
export const TRACK_LANG = { en: 'en', read: 'en', work: 'en', reviewEn: 'en', zh: 'zh', readZh: 'zh', reviewZh: 'zh', review: 'all', know: 'all' };
export const LANG_NAME = { en: 'Tiếng Anh', zh: 'Tiếng Trung', all: 'Việc chung' };

/** Số phút đã học hôm nay của từng ngôn ngữ */
export function minsByLang(secs = {}) {
  const m = { en: 0, zh: 0, all: 0 };
  for (const [k, v] of Object.entries(secs)) m[TRACK_LANG[k] || 'all'] += v;
  return { en: Math.round(m.en / 60), zh: Math.round(m.zh / 60), all: Math.round(m.all / 60) };
}

/** Tóm tắt một ngôn ngữ trong kế hoạch hôm nay: việc, đã xong, phút dự kiến, phút đã học */
export function langDay(plan, lang) {
  const steps = plan.steps.filter((s) => s.lang === lang);
  return {
    lang, steps,
    done: steps.filter((s) => s.done).length,
    planned: steps.reduce((a, s) => a + s.mins, 0),
    mins: minsByLang(plan.day.secs)[lang],
    next: steps.find((s) => !s.done) || null,
  };
}

/* ---------- vị trí trong khoá tiếng Anh ------------------------------------- */

export function curSession(en, course) {
  const st = en.stage || 0;
  const total = course.stages[st].total;
  const m = en.sess?.[st] || {};
  for (let n = 1; n <= total; n++) if (!m[n]?.done) return n;
  return total;
}

export const weekOf = (n, course) => course.weeks[Math.min(13, Math.max(1, Math.ceil(n / 7))) - 1];
export const phaseOf = (w, course) => course.ph.find((p) => w >= p.w[0] && w <= p.w[1]) || course.ph[2];

/* Khối "Ôn từ cũ" và "Đọc" đã có khối riêng trong ngày, nên không lặp lại ở đây. */
const SKIP = new Set(['review', 'story', 'mytext']);

export function enBlocks(stage, n, course) {
  let raw;
  if (stage >= 2) raw = course.blocks[stage];
  else if (!stage) raw = course.ph0.blocks;
  else raw = phaseOf(weekOf(n, course).n, course).blocks;
  return raw.filter((b) => !SKIP.has(b[2])).map(([label, min, key]) => ({ label, min, key }));
}

export function enTitle(stage, n, course) {
  if (!stage) return course.sounds[(n - 1) % 12].title;
  if (stage === 1) return weekOf(n, course).title;
  return course.stages[stage].sub;
}

/* ---------- dựng danh sách việc hôm nay ----------------------------------------- */

export async function buildToday() {
  const [settings, day, cards, en, read, wk, kn, lessons, course, idx, storyIdx, workData, knowData] = await Promise.all([
    store.settings(), store.today(), store.allCards(), store.enState(), store.readState(),
    store.workState(), store.knowState(), store.lessonProgress(),
    content.course(), data.curriculum(), content.storyIndex(), content.work(), content.know(),
  ]);

  const budget = settings.dailyMinutes || 120;
  // Người mới (chưa tới 30 thẻ) chưa có gì để củng cố: ngày nào cũng học bài đầy đủ, chưa theo nhịp tuần
  const isNew = cards.length < 30;
  const type = isNew ? 'full' : dayType(settings);
  const blocks = blocksFor(budget, type, settings);
  const now = Date.now();
  const dueCards = cards.filter((c) => c.due <= now);
  const due = dueCards.length;
  const quota = quotaToday(budget, type, due);
  const steps = [];

  const zhDone = idx.lessons.filter((l) => lessons[l.id]?.done).length;
  const enSessDone = Object.values(en.sess?.[en.stage || 0] || {}).filter((x) => x.done).length;

  // Mới học tiếng Anh (5 buổi đầu chặng 0) thì chưa đọc truyện: thời gian đó dồn cho bài học
  if (blocks.read && !(en.stage || 0) && enSessDone < 5 && blocks.en) {
    blocks.en += blocks.read;
    blocks.read = 0;
  }

  // Mới học tiếng Trung thì chưa đọc được truyện: 10 phút đó dành hết cho bài học
  if (blocks.readZh && zhDone < 3 && blocks.zh) {
    blocks.zh += blocks.readZh;
    blocks.readZh = 0;
  }

  /* ---- ôn: tách riêng thẻ tiếng Anh và thẻ tiếng Trung ----
     Quỹ ôn chia theo số thẻ tới hạn của mỗi bên. Ngôn ngữ chưa có thẻ nào thì không có việc ôn,
     phần thời gian đó trả về bài học của chính ngôn ngữ ấy. */
  if (blocks.review) {
    const langsOn = settings.langs || 'both';
    const parts = [];
    if (langsOn !== 'zh') parts.push({ lg: 'en', all: cards.filter((c) => c.lang === 'en').length, due: dueCards.filter((c) => c.lang === 'en').length });
    if (langsOn !== 'en') parts.push({ lg: 'zh', all: cards.filter(isZhCard).length, due: dueCards.filter(isZhCard).length });
    const live = parts.filter((p) => p.all > 0);
    const dueSum = live.reduce((a, p) => a + p.due, 0);
    for (const p of parts) {
      let mins = 0;
      if (p.all > 0) mins = live.length === 1 ? blocks.review : Math.round(blocks.review * (dueSum ? p.due / dueSum : 0.5));
      else blocks[p.lg] += Math.round(blocks.review / parts.length); // chưa có thẻ: dồn cho bài học
      if (!p.all) continue;
      if (p.due && mins < 5) mins = 5;
      const cap = Math.round((mins * 60) / SECS_PER_CARD);
      steps.push({
        key: p.lg === 'en' ? 'reviewEn' : 'reviewZh', lang: p.lg, mins, href: `#/review?lang=${p.lg}`,
        title: p.lg === 'en' ? 'Ôn thẻ tiếng Anh' : 'Ôn thẻ tiếng Trung',
        desc: p.due ? `${Math.min(p.due, cap)} thẻ tới hạn${p.due > cap ? ` · còn ${p.due - cap} thẻ để mai` : ''}` : 'Chưa có thẻ nào tới hạn. Xong phần này rồi.',
        auto: p.due === 0,
      });
    }
  }

  /* ---- tiếng Anh ---- */
  const stage = en.stage || 0;
  const n = curSession(en, course);
  if (blocks.en) {
    const left = enBlocks(stage, n, course).filter((b) => !en.sess?.[stage]?.[n]?.blocks?.[b.key]);
    steps.push({
      key: 'en', mins: blocks.en, lang: 'en', href: '#/en/session', title: 'Tiếng Anh: học bài',
      desc: `${course.stages[stage].name}, buổi ${n}: ${enTitle(stage, n, course)}. ${left.map((b) => b.label).join(', ')}${quota.en ? ` · tối đa ${quota.en} từ mới` : ''}`,
    });
  }

  /* ---- đọc tiếng Anh ---- */
  if (blocks.read) {
    const nx = content.nextReading(storyIdx.filter((s) => s.lang === 'en'), read);
    steps.push({
      key: 'read', mins: blocks.read, lang: 'en', title: 'Tiếng Anh: đọc truyện',
      href: nx ? `#/reader/${nx.story.id}/${nx.chapter.n}` : '#/read/en',
      desc: nx ? `${nx.story.title}${nx.story.chapters.length > 1 ? `, chương ${nx.chapter.n}` : ''} · ${nx.story.level}` : 'Chọn một bài trong thư viện đọc',
    });
  }

  /* ---- tiếng Trung: theo lộ trình (phát âm trước, rồi HSK) ---- */
  if (blocks.zh) {
    const zp = await zhPath();
    const nx = zp.next;
    steps.push({
      key: 'zh', mins: blocks.zh, lang: 'zh', href: nx.href,
      title: nx.kind === 'pron' ? `Tiếng Trung: phát âm bài ${nx.title.match(/bài (\d+)/)[1]}` : 'Tiếng Trung: học bài',
      desc: nx.kind === 'pron'
        ? `${nx.title.replace(/^Phát âm bài \d+: /, '')} · chặng đầu tiên, học xong 10 bài mới vào HSK 1`
        : `${nx.title}${quota.zh ? ` · tối đa ${quota.zh} từ mới, viết từng nét bằng bút` : ' · luyện viết chữ cũ'}`,
    });
  }

  /* ---- đọc tiếng Trung ---- */
  if (blocks.readZh) {
    const nx = content.nextReading(storyIdx.filter((s) => s.lang === 'zh'), read);
    steps.push({
      key: 'readZh', mins: blocks.readZh, lang: 'zh', title: 'Tiếng Trung: đọc truyện',
      href: nx ? `#/reader/${nx.story.id}/${nx.chapter.n}` : '#/read/zh',
      desc: nx ? `${nx.story.title}${nx.story.chapters.length > 1 ? `, chương ${nx.chapter.n}` : ''} · ${nx.story.level}` : 'Chọn một truyện',
    });
  }

  /* ---- tiếng Anh nghề ---- */
  if (blocks.work) {
    const d = workData.days.findIndex((_, i) => !wk.done[i + 1]) + 1 || 1;
    steps.push({
      key: 'work', mins: blocks.work, lang: 'en', title: 'Tiếng Anh nghề', href: `#/work/day/${d}`,
      desc: `Ngày ${d}/30: ${workData.days[d - 1].title}`,
    });
  }

  /* ---- kiến thức và nhật ký ---- */
  if (blocks.know) {
    const id = knowData.order.find((x) => !kn.done[x]);
    const L = knowData.lessons.find((l) => l.id === id);
    steps.push({
      key: 'know', mins: blocks.know, lang: 'all', title: 'Kiến thức và nhật ký',
      href: L ? `#/know/${L.id}` : '#/know',
      desc: L ? `${L.title}, rồi ghi một dòng nhật ký` : 'Ghi một dòng nhật ký',
    });
  }

  // Xếp theo nhóm: tiếng Anh, rồi tiếng Trung, rồi việc chung; trong nhóm giữ thứ tự ôn → học → đọc
  const ORDER = { en: 0, zh: 1, all: 2 };
  steps.sort((a, b) => ORDER[a.lang] - ORDER[b.lang]);
  for (const s of steps) s.done = !!day.steps[s.key] || !!s.auto || (s.key.startsWith('review') && !!day.steps.review);
  return { steps, budget, type, due, quota: isNew ? { ...quota, reason: '' } : quota, day, settings, isNew };
}
