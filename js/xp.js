/* Điểm thưởng, rank kiểu Liên Quân và điểm danh mỗi ngày.

   Mỗi việc học xong cộng điểm (award). Tổng điểm quy ra rank:
   Đồng → Bạc → Vàng → Bạch Kim → Kim Cương → Tinh Anh → Cao Thủ → Chiến Tướng → Chiến Thần.
   Từ Đồng tới Tinh Anh mỗi rank có 4 bậc (IV → I). Điểm danh mỗi ngày +5, chuỗi ngày liên tiếp được thưởng thêm.
   Giờ luôn tính theo giờ Việt Nam (UTC+7). */

import * as store from './store.js';
import { toast, h } from './ui.js';

export const RANKS = [
  { name: 'Đồng', min: 0, color: '#b07a4a' },
  { name: 'Bạc', min: 300, color: '#8f9bab' },
  { name: 'Vàng', min: 800, color: '#d6a531' },
  { name: 'Bạch Kim', min: 1600, color: '#3fb5b8' },
  { name: 'Kim Cương', min: 3000, color: '#5b7cf0' },
  { name: 'Tinh Anh', min: 5000, color: '#8d5cf0' },
  { name: 'Cao Thủ', min: 8000, color: '#e0442a' },
  { name: 'Chiến Tướng', min: 12000, color: '#b8282c' },
  { name: 'Chiến Thần', min: 18000, color: '#c8962b' },
];
const TIERS = ['IV', 'III', 'II', 'I'];

/** Ngày theo giờ Việt Nam, dạng 2026-11-13 */
export function vnDay(t = Date.now()) {
  return new Date(t + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

export function rankOf(total) {
  let i = 0;
  while (i + 1 < RANKS.length && total >= RANKS[i + 1].min) i++;
  const r = RANKS[i], nextR = RANKS[i + 1];
  if (!nextR) return { ...r, i, tier: '', label: r.name, into: total - r.min, span: 0, next: null };
  const span = nextR.min - r.min;
  const tiered = i <= 5;
  const k = tiered ? Math.min(3, Math.floor(((total - r.min) / span) * 4)) : 0;
  const tierMin = r.min + (tiered ? (span / 4) * k : 0);
  const tierSpan = tiered ? span / 4 : span;
  return {
    ...r, i, tier: tiered ? TIERS[k] : '', label: tiered ? `${r.name} ${TIERS[k]}` : r.name,
    into: total - tierMin, span: tierSpan, next: tiered && k < 3 ? `${r.name} ${TIERS[k + 1]}` : nextR.name,
  };
}

const DEF = { total: 0, log: [], seeded: false };

/** Lần đầu: quy đổi những gì đã học trước đây thành điểm, để rank không bắt đầu từ số 0 vô lý. */
async function seedIfNeeded(x) {
  if (x.seeded) return x;
  try {
    const [cards, read, lessons] = await Promise.all([store.allCards(), store.readState(), store.lessonProgress()]);
    const done = Object.values(lessons || {}).filter((l) => l && (l.done || l.passed)).length;
    const pts = cards.length * 2 + Math.floor((read.words || 0) / 25) + done * 10;
    x.total += pts;
    if (pts) x.log.unshift({ at: Date.now(), p: pts, r: 'Quy đổi quá trình học trước đây' });
  } catch { /* bỏ qua */ }
  x.seeded = true;
  return x;
}

export async function xpState() {
  const x = await store.kvGet('xp', DEF);
  if (!x.seeded) { const y = await seedIfNeeded({ ...DEF, ...x }); await store.kvSet('xp', y); return y; }
  return x;
}

/** Cộng điểm. Thăng rank thì báo ngay. */
export async function award(points, reason = '') {
  if (!points) return null;
  let before = 0, after = 0;
  await store.kvUpdate('xp', DEF, (x) => {
    before = x.total || 0;
    x.total = before + points;
    after = x.total;
    x.log = [{ at: Date.now(), p: points, r: reason }, ...(x.log || [])].slice(0, 60);
    return x;
  });
  const a = rankOf(before), b = rankOf(after);
  if (a.label !== b.label) window.dispatchEvent(new CustomEvent('atlas:rankup', { detail: { from: a, to: b } }));
  return b;
}

/** Điểm danh: mỗi ngày một lần, +5 và thêm 1 điểm cho mỗi ngày liên tiếp (tối đa +10). */
export async function checkIn() {
  const today = vnDay();
  const c = await store.kvGet('checkin', { days: {}, streak: 0, last: '' });
  if (c.days[today]) return { already: true, streak: c.streak };
  const yesterday = vnDay(Date.now() - 86400000);
  const streak = c.last === yesterday ? (c.streak || 0) + 1 : 1;
  c.days[today] = true; c.last = today; c.streak = streak;
  await store.kvSet('checkin', c);
  const bonus = Math.min(10, streak - 1);
  await award(5 + bonus, `Điểm danh${bonus ? ` (chuỗi ${streak} ngày)` : ''}`);
  return { already: false, streak, points: 5 + bonus };
}
export async function checkedToday() {
  const c = await store.kvGet('checkin', { days: {}, streak: 0, last: '' });
  return { done: !!c.days[vnDay()], streak: c.streak || 0, count: Object.keys(c.days).length };
}

/* Khiên rank: ảnh img/rank/r1..r9.webp (256px, nền trong suốt), số bậc IV–I in đè vào giữa vòng tròn.
   PLATE: tâm và bán kính vòng tròn trống của từng khiên, tính trên ảnh 256px. Ảnh lỗi thì vẽ khiên SVG. */
const PLATE = [[126, 121, 62], [129, 120, 57], [127, 122, 56], [127, 127, 61], [124, 123, 59], [127, 128, 47], [128, 128, 52], [128, 140, 41], [128, 138, 44]];
export function emblem(r, size = 46) {
  const el = document.createElement('span');
  el.className = 'rank-emblem';
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  const img = document.createElement('img');
  img.src = `img/rank/r${r.i + 1}.webp`;
  img.alt = r.name;
  img.decoding = 'async';
  img.onerror = () => { el.innerHTML = svgEmblem(r, size); };
  el.append(img);
  if (r.tier) {
    const [cx, cy, pr] = PLATE[r.i] || [128, 128, 56];
    const t = document.createElement('b');
    t.className = 'rank-tier';
    t.textContent = r.tier;
    t.style.left = `${(cx / 256) * 100}%`;
    t.style.top = `${(cy / 256) * 100}%`;
    t.style.fontSize = `${Math.max(8, Math.round((size * pr) / 256 * 0.78))}px`;
    el.append(t);
  }
  return el;
}

function svgEmblem(r, size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 48 48"><path d="M24 3 L42 10 Q42 32 24 45 Q6 32 6 10 Z" fill="${r.color}" stroke="#1a1f3a" stroke-width="2.5"/><path d="M24 9 L36 14 Q36 30 24 39 Z" fill="#fff" opacity=".22"/>${r.i >= 6 ? '<path d="M14 6 l4 6 l6-8 l6 8 l4-6 l-1 9 h-18 Z" fill="#f4d35e" stroke="#1a1f3a" stroke-width="1.5"/>' : ''}<text x="24" y="30" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="13" fill="#fff">${r.tier || '★'}</text></svg>`;
}

/** Thẻ rank gọn dùng ở trang chủ và trang Tiến độ */
export async function rankCard({ compact = false } = {}) {
  const [x, ci] = await Promise.all([xpState(), checkedToday()]);
  const r = rankOf(x.total);
  const btn = h('button.btn.sm' + (ci.done ? '.ghost' : '.jade'), {
    disabled: ci.done,
    onclick: async (e) => {
      const res = await checkIn();
      if (!res.already) { toast(`Điểm danh +${res.points} điểm · chuỗi ${res.streak} ngày`); e.target.textContent = '✓ Đã điểm danh'; e.target.disabled = true; }
    },
  }, ci.done ? '✓ Đã điểm danh' : 'Điểm danh +5');
  const bar = h('div.rank-bar', h('i', { style: { width: `${r.span ? Math.min(100, (r.into / r.span) * 100) : 100}%`, background: r.color } }));
  return h('div.rank-card' + (compact ? '.compact' : ''),
    emblem(r, compact ? 48 : 68),
    h('div.grow',
      h('b', r.label), h('span.small.faint', ` · ${x.total} điểm`),
      bar,
      h('div.small.faint', r.next ? `Còn ${Math.ceil(r.span - r.into)} điểm lên ${r.next}` : 'Rank cao nhất'),
    ),
    btn,
  );
}
