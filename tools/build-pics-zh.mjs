// Dựng bộ tranh minh hoạ từ vựng tiếng Trung: data/pics/zh.json
// Ghép theo thứ tự: bảng soạn tay (data-src/pics-zh.txt) → nhãn emoji tiếng Trung trùng từ
// → nhãn dài hơn kết thúc bằng từ (danh từ) → mượn tranh của từ tiếng Anh cùng nghĩa tiếng Việt
// (cùng từ loại, tranh tiếng Anh đã soát tay ở data/pics/en.json).
// Cách chạy: node tools/build-pics.mjs <dir> trước, rồi node tools/build-pics-zh.mjs <dir>
//   <dir>/iconify-json-fluent-emoji-flat-*/package/{icons,chars}.json
//   <dir>/emojibase-data-*/package/zh/data.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) { console.error('Thiếu đường dẫn tới thư mục gói icon'); process.exit(1); }
const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const find = (prefix) => {
  const d = fs.readdirSync(dir).find((x) => x.startsWith(prefix));
  if (!d) throw new Error('Không thấy gói ' + prefix);
  return path.join(dir, d, 'package');
};
const fl = find('iconify-json-fluent-emoji-flat');
const icons = J(path.join(fl, 'icons.json'));
const chars = J(path.join(fl, 'chars.json'));
const emo = J(path.join(find('emojibase-data'), 'zh', 'data.json'));
const enPics = J(path.join(ROOT, 'data/pics/en.json'));
const bank = J(path.join(ROOT, 'data/en/bank.json'));

const hexOf = (s) => [...s].map((c) => c.codePointAt(0).toString(16)).join('-');
function iconOf(e) {
  const hex = hexOf(e);
  for (const t of [hex, hex.replace(/-fe0f/g, ''), hex + '-fe0f', hex.replace(/-200d/g, '')]) if (chars[t] && icons.icons[chars[t]]) return chars[t];
  return null;
}

/* ---- từ cần tranh: từ trong giáo trình (có từ loại) + từ điển của app ---- */
const words = new Map(); // từ → { vi, pos, cur }
const idx = J(path.join(ROOT, 'data/curriculum/index.json'));
for (const l of idx.lessons) {
  for (const w of J(path.join(ROOT, 'data/curriculum', l.file)).words) if (!words.has(w.w)) words.set(w.w, { vi: w.vi || '', pos: w.pos || '', cur: true });
}
const dictRaw = J(path.join(ROOT, 'data/zh-dict.json'));
for (const [w, v] of Array.isArray(dictRaw) ? dictRaw : Object.entries(dictRaw)) if (!words.has(w)) words.set(w, { vi: v[2] || '', pos: '', cur: false });

/* ---- bảng soạn tay ---- */
const enWord = (w) => enPics.words[w.toLowerCase()] || null;
const manual = new Map();
const blocked = new Set();
const solo = new Set();
const keep = new Set(); // "từ=." : không vẽ, chỉ giữ để tách câu
const bad = [];
for (const line of fs.readFileSync(path.join(ROOT, 'data-src/pics-zh.txt'), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  for (const tok of line.trim().split(/\s+/)) {
    const k = tok.indexOf('=');
    if (k < 1) continue;
    let w = tok.slice(0, k);
    const v = tok.slice(k + 1);
    if (w.startsWith('!')) { w = w.slice(1); solo.add(w); } // !字=… : chữ đơn được vẽ cả khi đứng trong câu
    if (v === '-') { blocked.add(w); manual.delete(w); continue; }
    if (v === '.') { keep.add(w); continue; }
    const n = v.startsWith('@') ? (icons.icons[v.slice(1)] ? v.slice(1) : null)
      : v.startsWith('en:') ? enWord(v.slice(3).replace(/_/g, ' '))
        : iconOf(v);
    if (!n) { bad.push(`${w}=${v}`); continue; }
    manual.set(w, n);
  }
}

/* ---- nhãn emoji tiếng Trung ---- */
const byLabel = new Map();
for (const e of emo) {
  if (e.group === 2 || e.group === 9) continue; // tông da, cờ
  const n = iconOf(e.emoji);
  if (n && !byLabel.has(e.label)) byLabel.set(e.label, n);
}
const labels = [...byLabel.keys()];

/* ---- mượn tranh tiếng Anh qua nghĩa tiếng Việt đầu tiên, phải cùng từ loại ---- */
const first = (vi) => String(vi).replace(/\([^)]*\)/g, ' ').split(/[,;]/)[0].trim().toLowerCase();
const enByVi = new Map();
for (const r of bank) {
  const n = enWord(r[0]);
  if (!n) continue;
  const k = first(r[3]);
  if (k && !enByVi.has(k + '|' + r[2])) enByVi.set(k + '|' + r[2], n);
}
const POS = [['danh từ', 'n'], ['động từ', 'v'], ['tính từ', 'adj']];
function bridge(w, x) {
  const k = first(x.vi);
  if (!k) return null;
  const kinds = x.cur ? POS.filter(([vn]) => x.pos.includes(vn)).map(([, en]) => en) : (w.length >= 2 ? ['n'] : []);
  if (x.cur && /cụm|thán/.test(x.pos)) kinds.push('phr');
  if (kinds.includes('v')) kinds.push('phr');
  for (const p of kinds) if (enByVi.has(k + '|' + p)) return enByVi.get(k + '|' + p);
  return null;
}

/* lượng từ, phó từ, liên từ, giới từ, trợ từ: không vẽ (vẽ vào chỉ gây hiểu sai) */
const FUNC = /^(lượng từ|phó từ|liên từ|giới từ|trợ từ|số từ|đại từ|hậu tố|tiền tố|số lượng từ|số thứ tự)/;

const out = {};
const tally = { manual: 0, label: 0, suffix: 0, bridge: 0 };
for (const [w, x] of words) {
  if (blocked.has(w)) continue;
  if (manual.has(w)) { out[w] = manual.get(w); tally.manual++; continue; }
  if (x.cur && FUNC.test(x.pos)) continue;
  if (byLabel.has(w)) { out[w] = byLabel.get(w); tally.label++; continue; }
  const noun = x.cur ? /danh từ/.test(x.pos) : false;
  if (noun && w.length >= 2) {
    const k = labels.find((l) => l.length > w.length && l.endsWith(w) && l.length <= w.length + 3);
    if (k) { out[w] = byLabel.get(k); tally.suffix++; continue; }
  }
  const b = bridge(w, x);
  if (b) { out[w] = b; tally.bridge++; }
}
for (const [w, n] of manual) if (!out[w]) { out[w] = n; tally.manual++; }

/* Chữ đơn trong câu: chỉ vẽ danh từ cụ thể đã đánh dấu !, còn lại chỉ vẽ khi đứng riêng (thẻ từ). */
const soloList = [...solo].filter((c) => out[c]);

/* Từ không có tranh nhưng chứa từ có tranh (大学生 chứa 大学, 学生): giữ để tách câu không cắt sai. */
const keys = Object.keys(out);
const seg = [...keep];
for (const [w] of words) {
  if (keep.has(w)) continue;
  if (out[w] || w.length < 2 || !/^[一-鿿]+$/.test(w)) continue;
  if (keys.some((k) => k !== w && w.includes(k) && (k.length >= 2 || solo.has(k)))) seg.push(w);
}

const used = [...new Set(Object.values(out))].sort();
const body = {};
for (const n of used) body[n] = icons.icons[n].body;
const file = path.join(ROOT, 'data/pics/zh.json');
fs.writeFileSync(file, JSON.stringify({ src: 'Fluent Emoji Flat (MIT, Microsoft)', size: icons.width || 32, words: out, solo: soloList, seg, icons: body }));
const kb = Math.round(fs.statSync(file).size / 1024);
console.log(`Từ có tranh: ${keys.length} (soạn tay ${tally.manual}, nhãn ${tally.label}, nhãn dài ${tally.suffix}, mượn tiếng Anh ${tally.bridge}) / ${words.size} · chữ đơn trong câu: ${soloList.length} · tách câu: ${seg.length} · icon: ${used.length} · ${kb} KB`);
if (bad.length) console.log('Không tìm thấy icon:', bad.join(' '));
if (process.argv.includes('--dump')) {
  const curNo = [...words].filter(([w, x]) => x.cur && !out[w] && !FUNC.test(x.pos) && !blocked.has(w));
  fs.writeFileSync(process.argv[process.argv.indexOf('--dump') + 1], curNo.map(([w, x]) => `${w}\t${x.vi}\t${x.pos}`).join('\n'));
}
