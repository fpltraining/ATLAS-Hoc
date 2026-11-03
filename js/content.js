/* Nạp nội dung đã gộp từ các app cũ. Bộ nhớ đệm và cách thử lại giống data.js. */

const memo = new Map();

async function get(url, retry = true) {
  if (memo.has(url)) return memo.get(url);
  const p = fetch(url).then((r) => {
    if (!r.ok) throw new Error(`Không tải được ${url} (HTTP ${r.status})`);
    return r.json();
  });
  memo.set(url, p);
  try {
    return await p;
  } catch (e) {
    memo.delete(url);
    if (retry) return get(url, false);
    throw e;
  }
}

export const course     = () => get('data/en/course.json');
export const bankRows   = () => get('data/en/bank.json');
export const dict       = () => get('data/en/dict.json');
export const sentences  = () => get('data/en/sentences.json');
export const book       = () => get('data/en/book.json');
export const topics     = () => get('data/topics.json');
export const work       = () => get('data/work.json');
export const know       = () => get('data/know.json');
export const storyIndex = () => get('data/stories/index.json');
export const story      = (id) => get(`data/stories/${id}.json`);
export const zhDict     = () => get('data/zh-dict.json');

/* Thứ tự đọc gợi ý: dễ trước, xen kẽ truyện AI, chuyện có thật, bí ẩn và tin tức.
   Bài mới thêm vào data-src mà chưa có ở đây sẽ tự xếp sau cùng, mới nhất trước. */
export const READ_ORDER = [
  'robot-why', 'man-numbers', 'true-turing', 'myst-dark', 'coach-phone', 'myst-wow',
  'true-eliza', 'myst-life', 'true-kasparov', 'myst-ocean', 'true-move37', 'myst-voynich',
  'true-alphafold', 'myst-sleep', 'model-no-lie', 'news-vn-law', 'myst-conscious',
  'news-ms-agents', 'myst-blackbox', 'news-eu-delay', 'myst-fermi', 'news-robots-power',
  'myst-anesthesia', 'news-datacenter', 'news-ai-drug', 'slow-message',
  'zh-robot', 'zh-rabbit', 'zh-teacher', 'zh-snake', 'zh-sheep', 'zh-universe',
  'zh-sleep', 'zh-ocean', 'zh-news-law', 'zh-news-robot',
];

export const SHELVES = [
  { id: 'graded',  name: 'Đọc theo cấp HSK',       hint: 'Chuyện đời thường, chỉ dùng từ của đúng cấp', lang: 'zh' },
  { id: 'ai',      name: 'Truyện về AI',           hint: 'Truyện viết mới, chia theo trình độ' },
  { id: 'fable',   name: 'Chuyện thành ngữ',       hint: 'Thành ngữ cổ, kèm âm Hán Việt', lang: 'zh' },
  { id: 'true',    name: 'Chuyện có thật về AI',   hint: 'Những khoảnh khắc đã thay đổi lịch sử AI', lang: 'en' },
  { id: 'news',    name: 'Tin AI',                 hint: 'Tin thật, có ngày, viết lại bằng ngôn ngữ dễ' },
  { id: 'mystery', name: 'Điều chưa ai biết',      hint: 'Những câu hỏi khoa học chưa có lời giải' },
  { id: 'essay',   name: 'Bài đọc B2',             hint: 'Bài viết về thói quen, học tập, tiền bạc, tin tức, dùng từ B1–B2', lang: 'en' },
  { id: 'long',    name: 'Truyện dài',             hint: 'Hai cuốn liền mạch từ A1 đến B1', lang: 'en' },
];

export function sortedStories(index) {
  const rank = new Map(READ_ORDER.map((id, i) => [id, i]));
  return index.slice().sort((a, b) => {
    const ra = rank.has(a.id) ? rank.get(a.id) : 999;
    const rb = rank.has(b.id) ? rank.get(b.id) : 999;
    if (ra !== rb) return ra - rb;
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
}

/** Bài đọc tiếp theo: đang đọc dở thì đọc tiếp, không thì lấy bài kế trong lộ trình. */
export function nextReading(index, read) {
  const list = sortedStories(index);
  const doneCh = (s) => Object.keys(read.stories?.[s.id]?.ch || {}).length;
  const curId = list[0]?.lang === 'zh' ? read.currentZh : read.current;
  const cur = curId && list.find((s) => s.id === curId);
  const pick = cur && doneCh(cur) < cur.chapters.length
    ? cur
    : list.find((s) => doneCh(s) > 0 && doneCh(s) < s.chapters.length) || list.find((s) => doneCh(s) === 0) || list[0];
  if (!pick) return null;
  const done = read.stories?.[pick.id]?.ch || {};
  const ch = pick.chapters.find((c) => !done[c.n]) || pick.chapters[0];
  return { story: pick, chapter: ch };
}

/** Tra một từ, thử cả dạng gốc (working → work, cities → city). */
export function lookup(word, d, gloss = {}) {
  const s = String(word).toLowerCase().replace(/[’]/g, "'").replace(/^'+|'+$/g, '');
  const cands = [s, s.replace(/'s$/, ''), s.replace(/(ies)$/, 'y'), s.replace(/(ied)$/, 'y'), s.replace(/(ing|ed|es|s)$/, ''),
    s.replace(/(ing|ed)$/, 'e'), s.replace(/(.)\1(ing|ed)$/, '$1'), s.replace(/(er|est)$/, ''), s.replace(/ly$/, '')];
  for (const c of cands) {
    if (gloss[c]) return { w: c, vi: gloss[c], ipa: d?.[c]?.[1] || '' };
    if (d?.[c]?.[0]) return { w: c, vi: d[c][0], ipa: d[c][1] || '' };
  }
  return { w: s, vi: '', ipa: '' };
}
