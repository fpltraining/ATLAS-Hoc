// Dựng bộ tranh minh hoạ từ vựng tiếng Anh.
// Nguồn icon: @iconify-json/fluent-emoji-flat (MIT) + emojibase-data (MIT) để tự ghép danh từ.
// Cách chạy: node tools/build-pics.mjs <thư mục chứa 2 gói đã giải nén>
//   <dir>/iconify-json-fluent-emoji-flat-*/package/{icons,chars}.json
//   <dir>/emojibase-data-*/package/en/data.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = process.argv[2];
if (!dir) { console.error('Thiếu đường dẫn tới thư mục gói icon'); process.exit(1); }
const find = (prefix) => {
  const d = fs.readdirSync(dir).find((x) => x.startsWith(prefix));
  if (!d) throw new Error('Không thấy gói ' + prefix);
  return path.join(dir, d, 'package');
};
const fl = find('iconify-json-fluent-emoji-flat');
const icons = JSON.parse(fs.readFileSync(path.join(fl, 'icons.json'), 'utf8'));
const chars = JSON.parse(fs.readFileSync(path.join(fl, 'chars.json'), 'utf8'));
const emo = JSON.parse(fs.readFileSync(path.join(find('emojibase-data'), 'en', 'data.json'), 'utf8'));
const bank = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/en/bank.json'), 'utf8'));

/* emoji → tên icon Fluent */
const hexOf = (s) => [...s].map((c) => c.codePointAt(0).toString(16)).join('-');
function iconOf(e) {
  const hex = hexOf(e);
  const tries = [hex, hex.replace(/-fe0f/g, ''), hex + '-fe0f', hex.replace(/-200d/g, '')];
  for (const t of tries) if (chars[t] && icons.icons[chars[t]]) return chars[t];
  return null;
}

/* bảng soạn tay */
const manual = new Map();
const blocked = new Set();
const bad = [];
for (const line of fs.readFileSync(path.join(ROOT, 'data-src/pics-en.txt'), 'utf8').split('\n')) {
  if (!line.trim() || line.startsWith('#')) continue;
  for (const tok of line.trim().split(/\s+/)) {
    const k = tok.indexOf('=');
    if (k < 1) continue;
    const w = tok.slice(0, k).replace(/_/g, ' ').toLowerCase();
    const v = tok.slice(k + 1);
    if (v === '-' || v.endsWith('=-')) { blocked.add(w); manual.delete(w); continue; }
    const n = v.startsWith('@') ? (icons.icons[v.slice(1)] ? v.slice(1) : null) : iconOf(v);
    if (!n) { bad.push(`${w}=${v}`); continue; }
    manual.set(w, n);
  }
}

/* tự ghép danh từ theo nhãn emoji (chỉ khớp chặt: nhãn trùng từ, hoặc từ cuối của nhãn) */
const auto = new Map();
for (const e of emo) {
  if (e.group === 9 || e.group === 2) continue; // cờ, tông da
  const n = iconOf(e.emoji);
  if (!n) continue;
  const lab = e.label.toLowerCase().replace(/[:“”"’]/g, '');
  const toks = lab.split(/\s+/);
  const put = (k, s) => { const o = auto.get(k); if (!o || o.s < s || (o.s === s && o.len > lab.length)) auto.set(k, { n, s, len: lab.length }); };
  put(lab, 5);
  if (toks.length <= 2) put(toks.at(-1), 3);
}

const words = {};
let fromManual = 0, fromAuto = 0;
for (const r of bank) {
  const w = r[0].toLowerCase();
  if (blocked.has(w)) continue;
  if (manual.has(w)) { words[w] = manual.get(w); fromManual++; continue; }
  const pos = r[2] || '';
  if (!/\bn\b/.test(pos)) continue;
  const a = auto.get(w) || (w.endsWith('s') ? auto.get(w.slice(0, -1)) : null);
  if (a && a.s >= 3) { words[w] = a.n; fromAuto++; }
}
// từ soạn tay ngoài kho (dùng cho câu ví dụ, truyện)
for (const [w, n] of manual) if (!words[w] && !blocked.has(w)) words[w] = n;

const used = [...new Set(Object.values(words))].sort();
const body = {};
for (const n of used) body[n] = icons.icons[n].body;

const out = { src: 'Fluent Emoji Flat (MIT, Microsoft)', size: icons.width || 32, words, icons: body };
fs.mkdirSync(path.join(ROOT, 'data/pics'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/pics/en.json'), JSON.stringify(out));
const kb = Math.round(fs.statSync(path.join(ROOT, 'data/pics/en.json')).size / 1024);
console.log(`Từ có tranh: ${Object.keys(words).length} (kho: soạn tay ${fromManual}, tự ghép ${fromAuto} / ${bank.length}) · icon: ${used.length} · ${kb} KB`);
if (bad.length) console.log('Emoji không có trong bộ icon:', bad.join(' '));
