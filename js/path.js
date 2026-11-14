/* Lộ trình học: mỗi ngôn ngữ là một chuỗi chặng nối tiếp, biết đang ở chặng nào và bước kế tiếp là gì.
   Trang Hôm nay, hai mục Tiếng Anh / Tiếng Trung và kế hoạch ngày đều lấy "bước kế tiếp" từ đây,
   nên ở đâu cũng chỉ về cùng một chỗ.

   Tiếng Trung: Phát âm (10 bài) → HSK 1 → HSK 2 → ... Ai đã biết pinyin thì bỏ chặng Phát âm
   (settings.zhSkipPron); ai đã học bài HSK rồi thì Phát âm thành việc học xen kẽ, không chặn.
   Tiếng Anh: 5 chặng của khoá (A0 → C1), đang ở chặng en.stage. */

import * as store from './store.js';
import * as data from './data.js';
import * as content from './content.js';
import { curSession, enTitle } from './plan.js';
import { h } from './ui.js';

/* Ảnh chặng (ChatGPT đợt 4–5): img/stages/<lang>-<số chặng>.webp. Ngôn ngữ chưa có ảnh thì để false. */
export const STAGE_ART = { zh: true, en: false };
const art = (lang, i) => (STAGE_ART[lang] ? `img/stages/${lang}-${i}.webp` : null);

let pronCache = null;
const pronCourse = () => pronCache || (pronCache = fetch('data/pron/zh.json').then((r) => r.json()).catch(() => ({ lessons: [] })));

export async function zhPath() {
  const [settings, idx, lessons, pron, pg] = await Promise.all([
    store.settings(), data.curriculum(), store.lessonProgress(), pronCourse(),
    store.kvGet('pron-zh', { at: {}, passed: {} }),
  ]);
  const passed = Object.keys(pg.passed || {}).length;
  const total = pron.lessons.length || 10;
  const hskDone = idx.lessons.filter((l) => lessons[l.id]?.done).length;
  const pronNeeded = !settings.zhSkipPron && passed < total && hskDone === 0;
  const nextPron = pron.lessons.find((l) => !pg.passed?.[l.id]) || pron.lessons[0];

  const stages = [{
    key: 'pron', name: 'Phát âm', sub: `${total} bài: thanh điệu, pinyin, khẩu hình`,
    done: Math.min(passed, total), total, href: '#/pron/zh', img: art('zh', 0),
    state: passed >= total ? 'done' : pronNeeded ? 'now' : settings.zhSkipPron ? 'skip' : 'side',
  }];
  const levels = [...new Set(idx.lessons.map((l) => l.level || 1))].sort((a, b) => a - b);
  let found = pronNeeded;
  for (const lv of levels) {
    const inLv = idx.lessons.filter((l) => (l.level || 1) === lv);
    const d = inLv.filter((l) => lessons[l.id]?.done).length;
    const complete = d >= inLv.length;
    const state = complete ? 'done' : !found ? 'now' : 'todo';
    if (state === 'now') found = true;
    stages.push({ key: `hsk${lv}`, name: `HSK ${lv}`, sub: `${inLv.length} bài`, done: d, total: inLv.length, href: '#/zh', state, img: art('zh', stages.length) });
  }

  let next;
  if (pronNeeded && nextPron) {
    next = {
      kind: 'pron', href: `#/pron/zh/${nextPron.id}`, mins: 30,
      title: `Phát âm bài ${nextPron.id}: ${nextPron.title}`,
      sub: nextPron.sub || nextPron.goal || '',
      where: `Chặng Phát âm · bài ${nextPron.id}/${total}`,
    };
  } else {
    const meta = idx.lessons.find((l) => !lessons[l.id]?.done) || idx.lessons[0];
    next = {
      kind: 'hsk', href: `#/lesson/${meta.id}`, mins: 30,
      title: `HSK ${meta.level}, bài ${meta.no ?? meta.id}: ${meta.title}`,
      sub: meta.cn || '', meta,
      where: `Chặng HSK ${meta.level} · bài ${meta.no ?? meta.id}`,
    };
  }
  return { lang: 'zh', stages, next, pronNeeded, passed, hskDone };
}

export async function enPath() {
  const [en, course] = await Promise.all([store.enState(), content.course()]);
  const st = en.stage || 0;
  const n = curSession(en, course);
  const stages = course.stages.map((s, i) => {
    const d = Object.values(en.sess?.[i] || {}).filter((x) => x.done).length;
    return { key: `en${i}`, name: s.cefr, sub: s.sub, done: Math.min(d, s.total), total: s.total, href: '#/en', state: i < st ? 'done' : i === st ? 'now' : 'todo', img: art('en', i) };
  });
  const s = course.stages[st];
  const sessDone = Object.values(en.sess?.[st] || {}).filter((x) => x.done).length;
  return {
    lang: 'en', stages, placed: en.placed, fresh: st === 0 && sessDone === 0,
    next: {
      kind: 'en', href: '#/en/session', mins: 30,
      title: `${s.name}, buổi ${n}: ${enTitle(st, n, course)}`,
      sub: s.sub, where: `${s.name} · ${s.cefr} · buổi ${n}/${s.total}`,
    },
  };
}

const MARK = { done: '✓', now: '●', todo: '', skip: '–', side: '' };

/** Dải chặng nằm ngang: ✓ đã xong · ● đang ở đây · ○ sắp tới. */
/** Ảnh của chặng đang học (để làm ảnh đầu trang mục) */
export const currentArt = (path) => (path.stages.find((s) => s.state === 'now') || path.stages.find((s) => s.state !== 'done') || path.stages[0])?.img || null;

export function pathStrip(path) {
  return h('div.path-strip', ...path.stages.map((s) => h(`a.path-node.${s.state}`, { href: s.href, title: `${s.name}: ${s.done}/${s.total}` },
    s.img ? h('span.path-dot.pic', { style: { backgroundImage: `url(${s.img})` } }, MARK[s.state] ? h('b.path-mark', MARK[s.state]) : null) : h('span.path-dot', MARK[s.state] || ''),
    h('span.path-name', s.name),
    h('span.path-sub', s.state === 'skip' ? 'đã bỏ qua' : s.state === 'side' ? `học xen · ${s.done}/${s.total}` : `${s.done}/${s.total}`),
  )));
}

/** Thẻ lộ trình một ngôn ngữ: tên, đang ở đâu, dải chặng. */
export function pathCard(path, { title } = {}) {
  return h('div.path-card',
    h('div.row.spread', h('b', title || (path.lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh')), h('a.small.faint', { href: path.lang === 'zh' ? '#/zh' : '#/en' }, 'Xem mục ›')),
    h('div.small.path-where', 'Đang ở: ', h('b', path.next.where)),
    pathStrip(path),
  );
}
