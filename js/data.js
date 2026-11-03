/* Nạp và ghi nhớ dữ liệu tĩnh (giáo trình, nét chữ, âm Hán Việt, cấu tạo chữ). */

/**
 * Dữ liệu nét viết dùng hệ toạ độ 1024×1024 với trục Y hướng LÊN và gốc lệch
 * xuống dưới 124 đơn vị. Muốn vẽ lên canvas (trục Y hướng XUỐNG) phải đổi:
 *     x_màn_hình = x_dữ_liệu
 *     y_màn_hình = 900 - y_dữ_liệu
 * Mọi phép so sánh nét viết trong app đều quy về hệ 1024×1024 này.
 */
export const GRID = 1024;
export const Y_OFFSET = 900;

/** Đổi một điểm từ hệ dữ liệu sang hệ "ô vuông 0…1024, Y hướng xuống". */
export function fromData(pt) {
  return [pt[0], Y_OFFSET - pt[1]];
}

const memo = new Map();

/**
 * Nạp JSON, nhớ lại theo địa chỉ để gọi bao nhiêu lần cũng chỉ tải một lần.
 *
 * Quan trọng: nếu hỏng thì XOÁ khỏi bộ nhớ và thử lại một lần. Không có hai
 * việc đó, một lần rớt mạng thoáng qua sẽ bị nhớ vĩnh viễn — mọi lần gọi sau
 * đều nhận lại đúng lời hứa đã hỏng ấy, và màn hình liên quan chết cho tới khi
 * tải lại cả app. Wi-Fi chập chờn là chuyện thường khi học trên iPad.
 */
async function getJSON(url, retry = true) {
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
    if (retry) return getJSON(url, false);
    throw e;
  }
}

export const curriculum = () => getJSON('data/curriculum/index.json');
export const radicals   = () => getJSON('data/radicals.json');
export const hanviet    = () => getJSON('data/hanviet.json');
export const decomp     = () => getJSON('data/decomp.json');
export const lesson     = (file) => getJSON(`data/curriculum/${file}`);
/* Cấp của từng từ theo chuẩn HSK 2025: { từ: "1"…"6" | "7-9" } */
export const hsk2025    = () => getJSON('data/hsk2025.json').catch(() => ({}));

/* ---------- Nét viết, nạp theo mảnh ------------------------------------- */

let strokeIndex = null;
const shardCache = new Map();
const charCache = new Map();

async function getIndex() {
  if (!strokeIndex) strokeIndex = await getJSON('data/strokes/index.json');
  return strokeIndex;
}

/**
 * Nạp trước dữ liệu nét cho một danh sách chữ.
 *
 * Các mảnh được tải TỪNG CẶP chứ không đồng loạt, và có thử lại một lần nếu
 * hỏng. Lý do: máy chủ thử nghiệm `python -m http.server` chỉ phục vụ được một
 * yêu cầu tại một thời điểm, tải bốn mảnh cùng lúc là đứt kết nối. Tải theo cặp
 * vẫn nhanh trên máy chủ thật mà không làm gãy lúc chạy thử ở nhà.
 */
export async function preloadChars(chars) {
  const idx = await getIndex();
  const needed = [];
  for (const ch of chars) {
    const shard = idx[ch];
    if (shard && !shardCache.has(shard) && !needed.includes(shard)) needed.push(shard);
  }

  for (let i = 0; i < needed.length; i += 2) {
    await Promise.all(needed.slice(i, i + 2).map((name) => loadShard(name)));
  }
}

async function loadShard(name) {
  // getJSON đã tự xoá bộ nhớ và thử lại khi hỏng, nên ở đây không cần lặp nữa.
  const obj = await getJSON(`data/strokes/${name}.json`);
  shardCache.set(name, obj);
  for (const [ch, d] of Object.entries(obj)) charCache.set(ch, d);
}

const normCache = new Map();

/**
 * Lấy dữ liệu nét của một chữ.
 *
 * Trả về:
 *   strokes      các đường SVG, dùng để VẼ (giữ nguyên hệ dữ liệu trục Y hướng lên)
 *   medians      đường xương sống ở hệ dữ liệu, dùng để VẼ gợi ý và hoạt hình
 *   mediansView  cũng đường đó nhưng đã lật về hệ HIỂN THỊ (Y hướng xuống)
 *
 * Hai bản medians là cần thiết: phần vẽ tự áp dụng phép lật trục trong ma trận
 * canvas, còn phần CHẤM ĐIỂM nhận toạ độ bút ở hệ màn hình nên phải so với
 * bản đã lật. Trộn lẫn hai hệ này là nét viết đúng sẽ bị chấm thành sai.
 */
export async function strokeData(ch) {
  if (charCache.has(ch)) return normalize(ch);
  await preloadChars([ch]);
  return charCache.has(ch) ? normalize(ch) : null;
}

function normalize(ch) {
  if (normCache.has(ch)) return normCache.get(ch);
  const d = charCache.get(ch);
  const out = {
    strokes: d.s,
    medians: d.m,
    mediansView: d.m.map((m) => m.map(fromData)),
  };
  normCache.set(ch, out);
  return out;
}

/** Đã nạp sẵn chưa (dùng để vẽ đồng bộ, không cần await). */
export function strokeDataSync(ch) {
  return charCache.has(ch) ? normalize(ch) : null;
}

/* ---------- Tra cứu ------------------------------------------------------ */

let hvMap = null, dcMap = null;

/* hanviet.json (55 KB) và decomp.json (108 KB) từng được nạp ngay lúc khởi động,
   nhưng màn hình đầu tiên không dùng tới chữ nào của chúng — 163 KB đó chỉ làm
   người dùng phải chờ lâu hơn mới thấy được giao diện. Nay mỗi màn hình tự gọi
   đúng thứ nó cần; getJSON đã nhớ sẵn nên gọi lại không tốn thêm lần tải. */

/** Bảo đảm đã có âm Hán Việt. Cần cho màn hình bài học, bộ thủ, ôn tập, chữ. */
export async function ensureHanViet() {
  if (!hvMap) hvMap = await hanviet();
  return hvMap;
}

/** Bảo đảm đã có dữ liệu cấu tạo chữ. Chỉ màn hình chữ và luyện viết cần. */
export async function ensureDecomp() {
  if (!dcMap) dcMap = await decomp();
  return dcMap;
}

/** Nạp sẵn trong lúc rảnh, sau khi màn hình đầu đã hiện ra. */
export function warmLookups() {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => { ensureHanViet().catch(() => {}); ensureDecomp().catch(() => {}); });
}

/** Âm Hán Việt của MỘT chữ, ví dụ 学 → "học". */
export function hvOf(ch) {
  return hvMap?.[ch]?.hv || '';
}

/** Dạng phồn thể của một chữ giản thể, nếu có. */
export function tradOf(ch) {
  return hvMap?.[ch]?.t || '';
}

/** Pinyin gốc của một chữ (từ Unihan) — dùng khi chữ đứng riêng lẻ. */
export function pyOf(ch) {
  return hvMap?.[ch]?.py || '';
}

/** Ghép âm Hán Việt cho cả một từ nhiều chữ, ví dụ 学生 → "học sinh". */
export function hvOfWord(word) {
  const parts = [...word].map((c) => hvOf(c)).filter(Boolean);
  return parts.length === [...word].length ? parts.join(' ') : '';
}

/** Cấu tạo chữ: { d: "⿰女子", r: "女", en: "good" } */
export function decompOf(ch) {
  return dcMap?.[ch] || null;
}

/** Các ký hiệu mô tả kết cấu chữ Hán (IDS) và cách đọc chúng bằng tiếng Việt. */
export const IDS_LABEL = {
  '⿰': 'trái – phải',
  '⿱': 'trên – dưới',
  '⿲': 'ba phần ngang',
  '⿳': 'ba phần dọc',
  '⿴': 'bao kín',
  '⿵': 'bao trên',
  '⿶': 'bao dưới',
  '⿷': 'bao trái',
  '⿸': 'bao trên-trái',
  '⿹': 'bao trên-phải',
  '⿺': 'bao dưới-trái',
  '⿻': 'lồng vào nhau',
};

/** Tách chuỗi cấu tạo thành các thành phần là chữ Hán thật. */
export function partsOf(ch) {
  const d = decompOf(ch)?.d;
  if (!d) return [];
  const out = [];
  for (const c of d) {
    if (IDS_LABEL[c] || c === ch) continue;
    if (/[一-鿿㐀-䶿]/.test(c)) out.push(c);
  }
  return out;
}

export function isHan(c) {
  return /[一-鿿㐀-䶿]/.test(c);
}

export function hanOf(text) {
  return [...text].filter(isHan);
}
