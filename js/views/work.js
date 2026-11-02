/* Tiếng Anh nghề (từ Han's English Hub): 30 ngày câu dùng được ngay, hội thoại mẫu
   và các gói theo nghề. Mọi câu đều theo quy tắc Anh trên, Việt dưới. */

import * as store from '../store.js';
import * as content from '../content.js';
import { pair, micCheck } from '../kit.js';
import { sayEn } from '../kit.js';
import { h, toast, section, progressBar } from '../ui.js';

export async function render(route) {
  const w = await content.work();
  const sub = route.args[0];
  if (sub === 'day') return dayView(w, Number(route.args[1]) || 1);
  if (sub === 'convos') return convos(w);
  if (sub === 'pack') return pack(w, route.args[1]);
  return hub(w);
}

const addBtn = (en, vi) => h('button.btn.sm.ghost', {
  'aria-label': 'Thêm vào ôn tập',
  onclick: async (e) => {
    await store.addEnWord(en, { vi, source: 'work' });
    e.currentTarget.textContent = '✓';
    toast('Đã thêm vào bộ ôn.');
  },
}, '+');

const line = (en, vi) => pair(en, vi, { actions: [addBtn(en, vi)] });

async function hub(w) {
  const st = await store.workState();
  const doneN = Object.keys(st.done).length;
  const next = w.days.findIndex((_, i) => !st.done[i + 1]) + 1 || 1;
  const grid = h('div.day-grid');
  w.days.forEach((d, i) => {
    const n = i + 1;
    grid.append(h(`a.day-cell${st.done[n] ? '.done' : n === next ? '.now' : ''}`, { href: `#/work/day/${n}`, title: d.title }, String(n)));
  });

  const packs = [
    ['car', 'Bán xe', `${w.car.length} câu`],
    ['tiktok', 'TikTok', `${w.tiktok.length} câu`],
    ['aov', 'Huấn luyện Liên Quân', `${w.aov.reduce((a, s) => a + s.items.length, 0)} câu`],
    ['patterns', 'Mẫu câu đa năng', `${w.patterns.length} câu`],
  ];

  return {
    title: 'Tiếng Anh nghề',
    el: h('div.stack',
      h('div.card.today-hero',
        h('div.small.hero-sub', `Ngày ${next}/30`),
        h('h1.today-title', w.days[next - 1].title),
        h('div', { style: { marginTop: '12px' } }, progressBar(doneN / 30)),
        h('a.btn.seal.block', { href: `#/work/day/${next}`, style: { marginTop: '14px' } }, 'Học ngày này ›'),
      ),
      h('div.card', h('h3', { style: { marginBottom: '8px' } }, '30 ngày'), grid),
      h('div.hub-grid',
        h('a.hub-tile', { href: '#/work/convos' }, h('span.hub-mark', '“'), h('span.grow', h('b', 'Hội thoại mẫu'), h('span.small.faint.block', `${w.convos.length} tình huống`)), h('span.faint', '›')),
        ...packs.map(([id, name, sub]) => h('a.hub-tile', { href: `#/work/pack/${id}` }, h('span.hub-mark', '★'), h('span.grow', h('b', name), h('span.small.faint.block', sub)), h('span.faint', '›'))),
      ),
    ),
  };
}

async function dayView(w, n) {
  const d = w.days[n - 1] || w.days[0];
  const st = await store.workState();
  const note = h('textarea.scribble.long', { placeholder: 'Ghi chú của bạn cho ngày này' });
  note.value = st.notes?.[n] || '';

  const phrases = h('div.card');
  for (const p of d.phrases) {
    phrases.append(line(p.en, p.vi));
    if (p.note) phrases.append(h('div.small.faint', { style: { margin: '-2px 0 6px' } }, p.note));
    const mic = micCheck(p.en);
    if (mic) phrases.append(mic);
  }

  return {
    title: `Ngày ${n}`,
    el: h('div.stack',
      h('h2', d.title),
      section('Câu chính', phrases),
      section('Ví dụ', h('div.card', ...d.examples.map((x) => line(x.en, x.vi)))),
      section('10 câu đời thực', h('div.card', ...d.life.map((x) => line(x.en, x.vi)))),
      section('Ghi chú', note),
      h('button.btn.jade.block', {
        onclick: async () => {
          await store.updateWork((s) => { s.done[n] = Date.now(); s.notes = { ...(s.notes || {}), [n]: note.value }; return s; });
          await store.markStep('work');
          toast(`Xong ngày ${n}.`);
          location.hash = '#/home';
        },
      }, '✓ Học xong ngày này'),
    ),
  };
}

function convos(w) {
  return {
    title: 'Hội thoại mẫu',
    el: h('div.stack', ...w.convos.map((c) => h('div.card',
      h('h3', { style: { marginBottom: '6px' } }, c.title),
      ...c.lines.map((l) => h('div',
        h('div.small.faint', { style: { marginTop: '8px' } }, l.sp),
        line(l.en, l.vi))),
      h('button.btn.sm', {
        style: { marginTop: '8px' },
        onclick: () => {
          const queue = c.lines.map((l) => l.en);
          const next = () => { const t = queue.shift(); if (t) sayEn(t, { onEnd: next }); };
          next();
        },
      }, '▶ Nghe cả đoạn'),
    ))),
  };
}

function pack(w, id) {
  if (id === 'aov') {
    return {
      title: 'Huấn luyện Liên Quân',
      el: h('div.stack', ...w.aov.map((s) => section(s.title.replace(/^[^\p{L}]+/u, ''), h('div.card', ...s.items.map((x) => line(x.en, x.vi)))))),
    };
  }
  const data = { car: w.car, tiktok: w.tiktok, patterns: w.patterns }[id] || [];
  const groups = new Map();
  for (const x of data) {
    const g = x.cat || x.type || 'Khác';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(x);
  }
  const title = { car: 'Bán xe', tiktok: 'TikTok', patterns: 'Mẫu câu đa năng' }[id] || 'Câu nghề';
  return {
    title,
    el: h('div.stack', ...[...groups].map(([g, rows]) => section(g, h('div.card', ...rows.map((x) => line(x.en, x.vi)))))),
  };
}
