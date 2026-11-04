/* Kho từ đã học, dùng chung cho Thử thách hôm nay và các trò ôn nhanh.

   Lấy từ thẻ ôn (có sẵn nghĩa). Chưa đủ thì thêm từ bài tiếng Trung đang học và
   hai bài trước đó, để người mới cũng chơi được ngay. */

import * as data from './data.js';
import * as store from './store.js';

/** lang: 'zh' | 'en' | 'all'. Trả về [{ lang, w, vi, py, ipa }] */
export async function learnedWords(lang = 'all', min = 16) {
  const cards = await store.allCards();
  const seen = new Set();
  const words = [];
  for (const c of cards) {
    if ((c.lang && c.lang !== 'en' && c.lang !== 'zh') || !c.vi) continue;
    const l = c.lang === 'en' ? 'en' : 'zh';
    if (lang !== 'all' && l !== lang) continue;
    const key = `${l}:${c.word}`;
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({ lang: l, w: c.word, vi: c.vi, py: c.py || '', ipa: c.ipa || '' });
  }
  if (lang !== 'en' && words.length < min) {
    const [idx, progress] = await Promise.all([data.curriculum(), store.lessonProgress()]);
    let upto = idx.lessons.findIndex((l) => !progress[l.id]?.done);
    if (upto < 0) upto = idx.lessons.length - 1;
    let from = Math.max(0, upto - 2);
    // Thêm dần bài trước đó cho tới khi đủ từ
    while (from >= 0 && words.filter((w) => w.lang === 'zh').length < min) {
      for (const meta of idx.lessons.slice(from, upto + 1)) {
        const L = await data.lesson(meta.file);
        for (const w of L.words) {
          const key = `zh:${w.w}`;
          if (seen.has(key) || !w.vi) continue;
          seen.add(key);
          words.push({ lang: 'zh', w: w.w, vi: w.vi, py: w.py || '' });
        }
      }
      if (from === 0) break;
      upto = from - 1;
      from = Math.max(0, from - 3);
    }
    if (words.filter((w) => w.lang === 'zh').length < min) {
      // Vẫn thiếu (mới học bài 1): lấy thêm các bài kế tiếp
      for (const meta of idx.lessons.slice(0, 6)) {
        const L = await data.lesson(meta.file);
        for (const w of L.words) {
          const key = `zh:${w.w}`;
          if (seen.has(key) || !w.vi) continue;
          seen.add(key);
          words.push({ lang: 'zh', w: w.w, vi: w.vi, py: w.py || '' });
        }
      }
    }
  }
  return words;
}

/** Nghĩa ngắn để hiện trên ô nhỏ: lấy nghĩa đầu tiên trước dấu phẩy hoặc chấm phẩy */
export const shortVi = (vi) => String(vi).split(/[;,；，]/)[0].trim();
