/* Bài kiểm tra xếp lớp tiếng Anh.

     node tools/build-placement.mjs

   Đọc câu ngữ pháp và từ vựng soạn tay theo CEFR (data-src/placement.json),
   xếp theo cấp và ghi ra data/en/placement.json.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

export function buildPlacement({ quiet = false } = {}) {
  const src = readJson(path.join(ROOT, 'data-src', 'placement.json'));
  const vocab = src.vocab.map((v) => ({ ...v, kind: 'vocab' }));
  const grammar = src.grammar.map((g) => ({ ...g, kind: 'grammar' }));
  const items = [...grammar, ...vocab].sort((x, y) => x.lv - y.lv);
  fs.writeFileSync(path.join(ROOT, 'data', 'en', 'placement.json'), JSON.stringify({ items }));
  if (!quiet) {
    const by = {};
    for (const it of items) by[it.lv] = (by[it.lv] || 0) + 1;
    console.log('Bài xếp lớp:', items.length, 'câu theo cấp', JSON.stringify(by));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildPlacement();
