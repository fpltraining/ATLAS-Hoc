/* Thêm dữ liệu nét cho chữ Hán có trong bài đọc mà chưa có trong data/strokes/.

     npm pack hanzi-writer-data@2.0.1 && tar -xzf hanzi-writer-data-2.0.1.tgz
     node tools/add-strokes.mjs đường/dẫn/tới/package

   Ghi vào data-src/strokes-extra.json, rồi chạy tools/build-stories.mjs để chép sang data/.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = process.argv[2];
if (!pkg) { console.error('Thiếu đường dẫn tới thư mục package của hanzi-writer-data'); process.exit(1); }

const extraF = path.join(ROOT, 'data-src', 'strokes-extra.json');
const extra = JSON.parse(fs.readFileSync(extraF, 'utf8'));
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'strokes', 'index.json'), 'utf8'));
const dir = path.join(ROOT, 'data-src', 'stories');
const chars = new Set();
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt'))) {
  for (const line of fs.readFileSync(path.join(dir, f), 'utf8').split(/\r?\n/)) {
    if (/^[^@#?~>]/.test(line.trim()) || line.trim().startsWith('!')) {
      const first = line.replace(/^!/, '').split(' | ')[0];
      for (const c of first) if (/[一-鿿]/u.test(c)) chars.add(c);
    }
  }
}
const added = [], missing = [];
for (const c of chars) {
  if (index[c] || extra[c]) continue;
  const f = path.join(pkg, `${c}.json`);
  if (!fs.existsSync(f)) { missing.push(c); continue; }
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  extra[c] = { s: d.strokes, m: d.medians };
  added.push(c);
}
fs.writeFileSync(extraF, JSON.stringify(extra));
console.log('Đã thêm nét:', added.join('') || '(không có)');
if (missing.length) console.log('Không có trong hanzi-writer-data:', missing.join(''));
