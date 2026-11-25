/* Bù dữ liệu nét viết chữ Hán (data/strokes) từ hanzi-writer-data, cho cả app ATLAS và game (Trường Lạc trấn).

     cd /tmp && npm pack hanzi-writer-data@2.0.1 && mkdir hwd && tar -xzf hanzi-writer-data-2.0.1.tgz -C hwd
     node tools/fill-strokes.mjs /tmp/hwd/package

   1. Chỉ mục data/strokes/index.json trỏ 644 chữ vào l10 / l11 nhưng hai tệp đó chỉ có vài chục chữ (lỗi từ lúc gộp app,
      25/11/2026 mới phát hiện: 东 西 块 电 北 京… không viết được). Bước này chép nét các chữ đó vào tệp mới g01, g02… và trỏ chỉ mục sang.
   2. Chữ Hán trong nội dung game (buổi học, bộ thủ, hội thoại, đề thi: game/data/zh_*.js, life_zh.js) và data-src/strokes-extra.json
      chưa có trong chỉ mục: cũng thêm vào các tệp g.. (120 chữ mỗi tệp, khoảng 300 KB) và ghi chỉ mục.
   Chạy lại được: chữ đã có thì bỏ qua. Định dạng mỗi chữ: { s: strokes (SVG), m: medians } như hanzi-writer-data. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = process.argv[2];
if (!pkg || !fs.existsSync(path.join(pkg, '一.json'))) { console.error('Cần đường dẫn tới thư mục package của hanzi-writer-data (có tệp 一.json)'); process.exit(1); }
const SD = path.join(ROOT, 'data', 'strokes');
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const index = J(path.join(SD, 'index.json'));
const extra = fs.existsSync(path.join(ROOT, 'data-src', 'strokes-extra.json')) ? J(path.join(ROOT, 'data-src', 'strokes-extra.json')) : {};
const shards = {};
const shard = (f) => shards[f] || (shards[f] = fs.existsSync(path.join(SD, f + '.json')) ? J(path.join(SD, f + '.json')) : {});
const dirty = new Set();
function data(c) {
  const f = path.join(pkg, c + '.json');
  if (fs.existsSync(f)) { const d = J(f); return { s: d.strokes, m: d.medians }; }
  return extra[c] || null;
}

// tệp mới g01, g02…: tối đa PER chữ mỗi tệp (khoảng 300 KB) để máy tải nhanh
const PER = 120;
let gi = 1;
const gName = () => 'g' + String(gi).padStart(2, '0');
function put(c, d) {
  while (Object.keys(shard(gName())).length >= PER) gi++;
  const f = gName();
  shard(f)[c] = d; index[c] = f; dirty.add(f);
}

// 1. chữ có trong chỉ mục mà tệp không có nét: chép nét vào tệp g.. và trỏ chỉ mục sang đó
const fixed = [], lost = [];
for (const c of Object.keys(index)) {
  if (shard(index[c])[c]) continue;
  const d = data(c);
  if (d) { put(c, d); fixed.push(c); } else lost.push(c);
}

// 2. chữ Hán trong nội dung game chưa có trong chỉ mục
const ctx = { console }; ctx.window = ctx; ctx.G = {}; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, 'game', 'data')).filter((x) => /^(zh_.*|life_zh)\.js$/.test(x))) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'game', 'data', f), 'utf8'), ctx, { filename: f });
}
const want = new Set();
const han = (s) => { for (const c of String(s || '')) if (/[㐀-鿿⺀-⿟]/.test(c)) want.add(c); };
for (const R of Object.values(ctx.G.ROOMS || {})) {
  if (R.lang !== 'zh') continue;
  (R.items || []).forEach((it) => { han(it.zh); han(it.ex); });
  (R.grams || (R.gram ? [R.gram] : [])).forEach((g) => (g.ex || []).forEach((e) => han(e[0])));
  (R.newChars || []).forEach(han); (R.write || []).forEach(han);
}
for (const L of Object.values(ctx.G.LIFE || {})) if (L.lang === 'zh') L.talks.forEach((t) => t.turns.forEach((u) => { han(u.npc); han(u.ok); }));
Object.keys(extra).forEach(han);
const add = [], none = [];
for (const c of want) {
  if (index[c]) continue;
  const d = data(c);
  if (d) add.push([c, d]); else none.push(c);
}
for (const [c, d] of add) put(c, d);
for (const f of dirty) fs.writeFileSync(path.join(SD, f + '.json'), JSON.stringify(shards[f]));
if (dirty.size || add.length) fs.writeFileSync(path.join(SD, 'index.json'), JSON.stringify(index));

// soát: mọi chữ trong chỉ mục phải có nét trong đúng tệp
let bad = 0;
const check = {};
for (const c of Object.keys(index)) { const f = index[c]; check[f] = check[f] || J(path.join(SD, f + '.json')); if (!check[f][c]) bad++; }
console.log('✓ chép nét vào đúng tệp chỉ mục:', fixed.length, 'chữ' + (lost.length ? ' · không tìm thấy nét: ' + lost.join('') : ''));
console.log('✓ thêm chữ mới của game:', add.length, 'chữ' + (none.length ? ' · hanzi-writer-data không có: ' + none.join('') : ''));
console.log((bad ? '✗ ' : '✓ ') + 'chỉ mục ' + Object.keys(index).length + ' chữ, ' + (bad ? bad + ' chữ thiếu nét' : 'chữ nào cũng có nét'));
if (bad) process.exit(1);
