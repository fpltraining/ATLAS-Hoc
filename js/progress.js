/* Số liệu tiến độ dùng chung: chuỗi ngày học, tóm tắt thẻ ôn, phần trăm thuộc bài. */

import * as store from './store.js';
import { h, progressBar } from './ui.js';

const DAY = 24 * 60 * 60 * 1000;

/* Một ngày tính là có học khi học ít nhất 1 phút hoặc đánh dấu xong một việc */
const active = (d) => !!d && (
  Object.values(d.secs || {}).reduce((a, b) => a + b, 0) >= 60 ||
  Object.values(d.steps || {}).some(Boolean)
);

/** Chuỗi ngày học liên tiếp. Hôm nay chưa học thì chuỗi vẫn giữ tới hết ngày. */
export async function streak() {
  const days = await store.allDays();
  const todayOn = active(days[store.dayKey()]);
  let cur = 0;
  let t = new Date();
  if (!todayOn) t = new Date(t.getTime() - DAY);
  while (active(days[store.dayKey(t)])) {
    cur++;
    t = new Date(t.getTime() - DAY);
  }
  // Chuỗi dài nhất từng có
  const keys = Object.keys(days).filter((k) => active(days[k])).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) {
    const d = new Date(`${k}T12:00:00`);
    run = prev && Math.round((d - prev) / DAY) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { cur, best: Math.max(best, cur), todayOn };
}

/** Đếm thẻ: Đến hạn · Mới · Đang học · Đã nhớ (khoảng ôn từ 21 ngày trở lên) */
export function cardStats(cards, now = Date.now()) {
  const s = { due: 0, fresh: 0, learning: 0, known: 0, total: cards.length };
  for (const c of cards) {
    if (c.state === 'new') s.fresh++;
    else if (c.state === 'review' && c.ivl >= 21) s.known++;
    else s.learning++;
    if (c.state !== 'new' && c.due <= now) s.due++;
  }
  return s;
}

/** Mức thuộc của một nhóm thẻ, 0–1: thẻ mới 0, đang học 0,1, đang ôn tăng dần tới 1 khi khoảng ôn đạt 21 ngày */
export function mastery(cards) {
  if (!cards.length) return 0;
  const sum = cards.reduce((a, c) => a + (c.state === 'new' ? 0
    : c.state === 'review' ? Math.min(1, 0.3 + (0.7 * c.ivl) / 21) : 0.1), 0);
  return sum / cards.length;
}

/** Khung tóm tắt thẻ ôn có 4 con số và nút ôn */
export function cardSummary(cards, href, title = 'Thẻ ôn') {
  const s = cardStats(cards);
  const box = (n, label, tone) => h(`div.stat-box${tone ? `.${tone}` : ''}`, h('b', String(n)), h('span', label));
  return h('div.card',
    h('div.row.spread', h('h3', title), h('span.small.faint', `${s.total} thẻ · thuộc ${Math.round(mastery(cards) * 100)}%`)),
    h('div.stat-grid', { style: { marginTop: '10px' } },
      box(s.due, 'Đến hạn', s.due ? 'seal' : ''),
      box(s.fresh, 'Mới'),
      box(s.learning, 'Đang học'),
      box(s.known, 'Đã nhớ', 'jade'),
    ),
    h('div', { style: { marginTop: '10px' } }, progressBar(mastery(cards))),
    s.total
      ? h('a.btn.jade.block', { href: s.due ? href : `${href}&ahead=1`, style: { marginTop: '12px' } }, s.due ? `Ôn ${s.due} thẻ đến hạn ›` : 'Ôn trước hạn ›')
      : null,
  );
}
