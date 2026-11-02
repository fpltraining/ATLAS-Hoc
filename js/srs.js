/* Lặp lại ngắt quãng (SM-2 có điều chỉnh).

   Mỗi TỪ sinh ra nhiều loại thẻ độc lập, mỗi loại có lịch ôn riêng:
     hanzi-vi  nhìn chữ  → nhớ nghĩa
     vi-write  nghĩa Việt → VIẾT TAY bằng bút   ← thẻ mạnh nhất trên iPad
     audio-vi  nghe      → nhớ nghĩa
     hanzi-py  nhìn chữ  → đọc đúng pinyin

   Tách riêng như vậy vì nhận ra mặt chữ dễ hơn viết lại nó rất nhiều — gộp
   chung một thẻ sẽ khiến kỹ năng viết bị đánh giá quá cao.
*/

export const TYPES = ['hanzi-vi', 'vi-write', 'audio-vi', 'hanzi-py'];

/* Thẻ tiếng Trung tạo mới chỉ dùng hai loại. Bốn loại cho mỗi từ làm số thẻ ôn tăng
   gấp đôi mà nghe và pinyin vốn đã có trên mặt sau của thẻ nhìn chữ. Thẻ cũ nhập từ
   Bút Hán thuộc hai loại kia vẫn ôn bình thường. */
export const ZH_TYPES = ['hanzi-vi', 'vi-write'];

export const TYPE_LABEL = {
  'hanzi-vi': 'Tiếng Trung: nhìn chữ → nghĩa',
  'vi-write': 'Tiếng Trung: nghĩa → viết tay',
  'audio-vi': 'Tiếng Trung: nghe → nghĩa',
  'hanzi-py': 'Tiếng Trung: nhìn chữ → pinyin',
  'en-recall': 'Tiếng Anh: nhìn từ → nghĩa',
  'en-spell': 'Tiếng Anh: nghĩa → viết tay',
  'know-q': 'Kiến thức: câu hỏi',
};

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

/** Các bước học ban đầu, tính bằng phút. */
const LEARN_STEPS = [1, 10];
const RELEARN_STEPS = [10];

export function newCard(word, type, lessonId) {
  return {
    id: `${type}:${word}`,
    word, type, lesson: lessonId,
    state: 'new',        // new | learning | review | relearning
    step: 0,
    due: Date.now(),
    ivl: 0,              // khoảng cách hiện tại, tính bằng ngày
    ease: 2.5,
    reps: 0,
    lapses: 0,
    seen: 0,
  };
}

/**
 * Cập nhật thẻ sau khi người học tự chấm.
 * grade: 0 = Quên · 1 = Khó · 2 = Được · 3 = Dễ
 */
export function review(card, grade, now = Date.now()) {
  const c = { ...card };
  c.reps += 1;
  c.seen = now;

  if (c.state === 'new' || c.state === 'learning') {
    if (grade === 0) {
      c.state = 'learning'; c.step = 0;
      c.due = now + LEARN_STEPS[0] * MIN;
    } else if (grade === 3) {
      c.state = 'review'; c.ivl = 2; c.due = now + 2 * DAY;
    } else {
      const next = c.state === 'new' ? 0 : c.step + (grade === 1 ? 0 : 1);
      if (next >= LEARN_STEPS.length) {
        c.state = 'review'; c.ivl = 1; c.due = now + DAY;
      } else {
        c.state = 'learning'; c.step = next;
        c.due = now + LEARN_STEPS[next] * MIN;
      }
    }
    return c;
  }

  if (c.state === 'relearning') {
    if (grade === 0) {
      c.due = now + RELEARN_STEPS[0] * MIN;
    } else {
      c.state = 'review';
      c.ivl = Math.max(1, Math.round(c.ivl * 0.6));
      c.due = now + c.ivl * DAY;
    }
    return c;
  }

  // Đang ở giai đoạn ôn dài hạn
  if (grade === 0) {
    c.lapses += 1;
    c.ease = Math.max(1.3, c.ease - 0.2);
    c.state = 'relearning'; c.step = 0;
    c.ivl = Math.max(1, Math.round(c.ivl * 0.4));
    c.due = now + RELEARN_STEPS[0] * MIN;
    return c;
  }

  const mult = { 1: 1.2, 2: c.ease, 3: c.ease * 1.35 }[grade];
  c.ease = Math.min(3.2, Math.max(1.3, c.ease + { 1: -0.15, 2: 0, 3: 0.1 }[grade]));
  c.ivl = Math.max(1, Math.round(Math.max(c.ivl, 1) * mult));
  c.ivl = Math.min(c.ivl, 365);
  c.due = now + c.ivl * DAY + jitter(c.ivl);
  c.state = 'review';
  return c;
}

/** Xê dịch nhẹ ngày ôn để các thẻ không dồn cục vào cùng một ngày. */
function jitter(ivl) {
  const span = Math.min(0.15 * ivl, 3) * DAY;
  return Math.round((Math.random() - 0.5) * span);
}

/** Mô tả khoảng thời gian tới lần ôn kế tiếp, để hiện trên nút chấm điểm. */
export function nextLabel(card, grade) {
  const c = review(card, grade);
  const ms = c.due - Date.now();
  if (ms < 60 * MIN) return `${Math.max(1, Math.round(ms / MIN))} phút`;
  if (ms < DAY) return `${Math.round(ms / (60 * MIN))} giờ`;
  const d = Math.round(ms / DAY);
  if (d < 31) return `${d} ngày`;
  if (d < 365) return `${Math.round(d / 30)} tháng`;
  return `${(d / 365).toFixed(1)} năm`;
}

/**
 * Xếp thứ tự phiên ôn.
 *
 * Ba mục tiêu cùng lúc: thẻ quá hạn lâu nhất được ưu tiên, không gặp lại cùng
 * một TỪ quá sát nhau, và không làm liền tù tì nhiều thẻ cùng một LOẠI. Thiếu
 * điều kiện cuối thì cả phiên dễ biến thành mười thẻ pinyin liên tiếp — vừa
 * chán vừa không rèn được các kỹ năng khác.
 */
export function buildSession(cards, limit = 40) {
  const due = cards.filter((c) => c.due <= Date.now());
  due.sort((a, b) => a.due - b.due);

  const out = [];
  const lastWord = new Map();
  const lastType = new Map();
  const pool = [...due];

  while (out.length < limit && pool.length) {
    // Chỉ cân nhắc trong một cửa sổ đầu hàng đợi, để thẻ quá hạn lâu vẫn được ưu tiên
    const window = Math.min(pool.length, 12);
    let bestIdx = 0, bestScore = -Infinity;
    for (let i = 0; i < window; i++) {
      const c = pool[i];
      const wGap = out.length - (lastWord.get(c.word) ?? -99);
      const tGap = out.length - (lastType.get(c.type) ?? -99);
      let s = -i * 0.5;
      if (wGap < 4) s -= (4 - wGap) * 10;
      if (tGap < 2) s -= (2 - tGap) * 4;
      if (s > bestScore) { bestScore = s; bestIdx = i; }
    }
    const c = pool.splice(bestIdx, 1)[0];
    lastWord.set(c.word, out.length);
    lastType.set(c.type, out.length);
    out.push(c);
  }
  return out;
}

/** Thống kê nhanh cho màn hình tiến độ. */
export function summarize(cards) {
  const now = Date.now();
  const s = { total: cards.length, due: 0, new: 0, learning: 0, review: 0, mature: 0 };
  for (const c of cards) {
    if (c.due <= now) s.due++;
    if (c.state === 'new') s.new++;
    else if (c.state === 'learning' || c.state === 'relearning') s.learning++;
    else { s.review++; if (c.ivl >= 21) s.mature++; }
  }
  return s;
}
