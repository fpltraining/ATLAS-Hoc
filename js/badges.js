/* Huy hiệu thành tích. Thứ tự trùng với đợt 3 trong "Đơn đặt hình" (ảnh ChatGPT b1…b12):
   khi có img/badges/b<n>.webp thì dùng ảnh đó, chưa có thì vẽ huy chương bằng hình Fluent.
   Đã mở khoá lưu ở kv 'badges' { id: thời điểm }. checkBadges() trả về các huy hiệu vừa mở. */

import * as store from './store.js';
import * as data from './data.js';
import { streak } from './progress.js';
import { h } from './ui.js';
import { artSvg } from './fx-art.js';
import { spotlight } from './fx.js';

export const BADGES = [
  { id: 'first', n: 1, tier: 'bronze', art: 'footprints', name: 'Bước đầu tiên', how: 'Xong việc học đầu tiên' },
  { id: 'streak3', n: 2, tier: 'bronze', art: 'fire', name: 'Chuỗi 3 ngày', how: 'Học 3 ngày liên tiếp' },
  { id: 'streak7', n: 3, tier: 'silver', art: 'fire', name: 'Chuỗi 7 ngày', how: 'Học 7 ngày liên tiếp' },
  { id: 'streak30', n: 4, tier: 'gold', art: 'crown', name: 'Chuỗi 30 ngày', how: 'Học 30 ngày liên tiếp' },
  { id: 'words100', n: 5, tier: 'silver', art: 'open-book', name: '100 từ', how: 'Có 100 từ trong bộ ôn' },
  { id: 'words500', n: 6, tier: 'gold', art: 'books', name: '500 từ', how: 'Có 500 từ trong bộ ôn' },
  { id: 'story1', n: 7, tier: 'bronze', art: 'scroll', name: 'Truyện đầu tiên', how: 'Đọc xong một chương truyện' },
  { id: 'pron', n: 8, tier: 'gold', art: 'microphone', name: 'Phát âm chuẩn', how: 'Qua cả 10 bài phát âm tiếng Trung' },
  { id: 'hsk1', n: 9, tier: 'gold', art: 'red-paper-lantern', name: 'Xong HSK 1', how: 'Học xong mọi bài HSK 1' },
  { id: 'enA1', n: 10, tier: 'gold', art: 'rocket', name: 'Xong chặng 0', how: 'Qua chặng 0 tiếng Anh (A0 → A1)' },
  { id: 'perfect', n: 11, tier: 'silver', art: 'bullseye', name: 'Điểm tuyệt đối', how: '10/10 ở thử thách hôm nay hoặc bài kiểm tra phát âm' },
  { id: 'review50', n: 12, tier: 'silver', art: 'check-mark-button', name: 'Chiến binh ôn tập', how: 'Ôn 50 thẻ trong một ngày' },
];

/* Số thứ tự các huy hiệu đã có ảnh vẽ (img/badges/b<n>.webp). Thêm vào khi nhận ảnh từ ChatGPT. */
const HAS_IMG = new Set([]);

/** Huy chương: ảnh vẽ sẵn nếu có, không thì vòng kim loại theo hạng + hình Fluent. */
export function medal(b, { size = 72, locked = false } = {}) {
  const el = h(`span.medal.${b.tier}${locked ? '.locked' : ''}`, { style: { width: `${size}px`, height: `${size}px` } });
  const fallback = () => {
    const disc = h('span.medal-disc');
    disc.innerHTML = artSvg(b.art, Math.round(size * 0.5));
    el.append(disc);
  };
  if (HAS_IMG.has(b.n)) {
    const img = h('img.medal-img', { src: `img/badges/b${b.n}.webp`, alt: '' });
    img.onerror = () => { img.remove(); fallback(); };
    el.classList.add('has-img');
    el.append(img);
  } else fallback();
  return el;
}

async function facts() {
  const [days, cards, read, pg, lessons, idx, en, chall, logs, st] = await Promise.all([
    store.allDays(), store.allCards(), store.readState(), store.kvGet('pron-zh', { passed: {} }),
    store.lessonProgress(), data.curriculum(), store.enState(), store.kvGet('challenge', {}), store.allLogs(), streak(),
  ]);
  const words = new Set(cards.map((c) => `${c.lang || 'zh'}:${c.word}`)).size;
  const perDay = {};
  for (const l of logs) { const k = store.dayKey(new Date(l.at)); perDay[k] = (perDay[k] || 0) + 1; }
  const hsk1 = idx.lessons.filter((l) => (l.level || 1) === 1);
  return {
    first: Object.values(days).some((d) => Object.values(d.steps || {}).some(Boolean)),
    streak3: st.best >= 3, streak7: st.best >= 7, streak30: st.best >= 30,
    words100: words >= 100, words500: words >= 500,
    story1: Object.values(read.stories || {}).some((s) => Object.keys(s.ch || {}).length > 0),
    pron: Object.keys(pg.passed || {}).length >= 10,
    hsk1: hsk1.length > 0 && hsk1.every((l) => lessons[l.id]?.done),
    enA1: (en.stage || 0) >= 1,
    perfect: Object.values(chall).some((c) => c && c.n >= 10 && c.right === c.n) || Object.values(pg.passed || {}).some((v) => v >= 10),
    review50: Object.values(perDay).some((n) => n >= 50),
  };
}

/** Kiểm tra và mở khoá; hiện popup cho từng huy hiệu mới (trừ khi quiet). */
export async function checkBadges({ quiet = false } = {}) {
  const [have, f] = await Promise.all([store.kvGet('badges', {}), facts()]);
  const fresh = BADGES.filter((b) => f[b.id] && !have[b.id]);
  if (!fresh.length) return [];
  await store.kvUpdate('badges', {}, (m) => { for (const b of fresh) m[b.id] = Date.now(); return m; });
  if (!quiet) for (const b of fresh) spotlight(medal(b, { size: 132 }), { title: `Huy hiệu mới: ${b.name}`, sub: b.how });
  return fresh;
}

/** Bộ sưu tập huy hiệu cho trang Tiến độ */
export async function badgeShelf() {
  const have = await store.kvGet('badges', {});
  const got = BADGES.filter((b) => have[b.id]).length;
  return h('div.card',
    h('div.row.spread', h('h3', 'Huy hiệu'), h('span.small.faint', `${got}/${BADGES.length} đã mở`)),
    h('div.badge-grid', ...BADGES.map((b) => h(`div.badge-cell${have[b.id] ? '' : '.locked'}`,
      medal(b, { size: 64, locked: !have[b.id] }),
      h('b', b.name),
      h('span.small.faint', have[b.id] ? new Date(have[b.id]).toLocaleDateString('vi-VN') : b.how),
    ))),
  );
}
