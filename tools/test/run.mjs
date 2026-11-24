// Chạy mọi tệp *.test.mjs trong tools/test (node tools/test/run.mjs). Thoát mã 1 nếu có bài hỏng.
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
const DIR = path.dirname(fileURLToPath(import.meta.url));
let bad = 0;
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.test.mjs')).sort()) {
  const r = spawnSync(process.execPath, [path.join(DIR, f)], { stdio: 'inherit' });
  if (r.status !== 0) bad++;
}
console.log(bad ? '✗ ' + bad + ' tệp kiểm thử hỏng' : '✓ Mọi kiểm thử đều đạt');
process.exit(bad ? 1 : 0);
