/* Từ điển Trung–Việt nhiều nghĩa cho các từ HSK 3.0 (cấp 1 đến 7–9).

     git clone --depth 1 https://github.com/ph0ngp/cvdict ../cvdict
     node tools/build-cvdict.mjs ../cvdict/CVDICT.u8

   Nguồn: CVDICT của Phong Phan, dịch từ CC-CEDICT, giấy phép CC BY-SA 4.0.
   Chỉ giữ các từ có trong danh sách HSK 3.0 (data/hsk2025.json) và các chữ đơn
   tạo nên chúng, để tệp đủ nhỏ cho app chạy offline.

   Kết quả: data/zh-full.json
     { "学习": [["xuéxí", ["học", "học tập"]]], ... }
     mỗi từ là danh sách cách đọc, mỗi cách đọc kèm các nghĩa.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* Pinyin số → pinyin dấu: "xue2 xi2" → "xuéxí" */
const MARKS = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
function syllable(s) {
  const m = s.match(/^([a-zü:]+)([1-5])$/i);
  if (!m) return s.replace(/u:/g, 'ü');
  let [, body, tone] = m;
  body = body.replace(/u:/gi, 'ü').replace(/v/g, 'ü');
  const t = Number(tone);
  if (t === 5) return body;
  const low = body.toLowerCase();
  let idx = low.search(/[ae]/);
  if (idx < 0 && low.includes('ou')) idx = low.indexOf('o');
  if (idx < 0) {
    for (let k = low.length - 1; k >= 0; k--) if ('aeiouü'.includes(low[k])) { idx = k; break; }
  }
  if (idx < 0) return body;
  const v = low[idx];
  return body.slice(0, idx) + MARKS[v][t - 1] + body.slice(idx + 1);
}
export function toMarks(py) {
  // Âm tiết bắt đầu bằng a, e, o (không đứng đầu) thì thêm dấu cách âm: nǚ'ér
  return (py.match(/[a-zü:]+[1-5]?/gi) || []).map(syllable)
    .map((x, i) => (i && /^[aeoāáǎàēéěèōóǒò]/i.test(x) ? `'${x}` : x))
    .join('').replace(/·/g, '');
}

/* Ghi chú trong nghĩa: 綠帽子|绿帽子[lu:4 mao4 zi5] → 绿帽子 (lǜmàozi); LT: → Lượng từ: */
function tidy(sense) {
  return sense
    .replace(/(?:[^\s|\[\]，,;():]+\|)?([^\s|\[\]，,;():]+)\[([a-zA-Z:1-5 ]+)\]/g, (_, w, py) => `${w} (${toMarks(py.toLowerCase())})`)
    .replace(/\[([a-zA-Z:1-5 ]+)\]/g, (_, py) => toMarks(py.toLowerCase()))
    .replace(/^(?:LT|CL):\s*/, 'Lượng từ: ')
    .replace(/\((?:LT|CL):/g, '(lượng từ: ');
}

export function buildCvdict(src, { quiet = false } = {}) {
  const lv = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'hsk2025.json'), 'utf8'));
  const want = new Set(Object.keys(lv));
  for (const w of Object.keys(lv)) for (const ch of w) if (/[一-鿿]/.test(ch)) want.add(ch);

  const out = {};
  const lines = fs.readFileSync(src, 'utf8').split('\n');
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^(\S+) (\S+) \[([^\]]*)\] \/(.*)\/\s*$/);
    if (!m) continue;
    const [, , simp, pyRaw, body] = m;
    if (!want.has(simp)) continue;
    const proper = /^[A-Z]/.test(pyRaw); // tên riêng: xếp sau nghĩa thường
    const senses = body.split('/').map((x) => x.trim()).filter(Boolean)
      .map(tidy);
    if (!senses.length) continue;
    const py = toMarks(pyRaw.toLowerCase());
    const list = out[simp] || (out[simp] = []);
    const same = list.find((r) => r[0] === py && !!r[2] === proper);
    if (same) same[1].push(...senses.filter((s) => !same[1].includes(s)));
    else list.push(proper ? [py, senses, 1] : [py, senses]);
  }
  // Cách đọc thường lên trước tên riêng; bỏ cờ tên riêng khỏi dữ liệu
  for (const k of Object.keys(out)) {
    out[k].sort((a, b) => (a[2] || 0) - (b[2] || 0));
    const merged = [];
    for (const [py, senses] of out[k]) {
      const same = merged.find((r) => r[0] === py);
      if (same) same[1].push(...senses.filter((x) => !same[1].includes(x)));
      else merged.push([py, senses.slice()]);
    }
    out[k] = merged.map(([py, senses]) => [py, senses.slice(0, 12)]);
  }
  fs.writeFileSync(path.join(ROOT, 'data', 'zh-full.json'), JSON.stringify(out));
  if (!quiet) {
    const words = Object.keys(lv);
    const have = words.filter((w) => out[w]).length;
    console.log(`Từ điển nhiều nghĩa: ${Object.keys(out).length} mục, có nghĩa cho ${have}/${words.length} từ HSK 3.0`);
    const miss = words.filter((w) => !out[w]);
    if (miss.length) console.log('  Chưa có nghĩa (ví dụ):', miss.slice(0, 20).join(' '));
  }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const src = process.argv[2];
  if (!src) { console.error('Cần đường dẫn tới CVDICT.u8'); process.exit(1); }
  buildCvdict(src);
}
