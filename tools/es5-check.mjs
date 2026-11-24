// Soát code game chỉ dùng cú pháp ES5 (chạy được trên Safari iOS đời cũ): không arrow function, let/const, template literal…
// Cần acorn: npm i --no-save acorn. Chạy: node tools/es5-check.mjs (từ thư mục gốc). Thoát mã 1 nếu có tệp hỏng.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let acorn;
try { acorn = require('acorn'); } catch (e) { console.log('Chưa có acorn: chạy "npm i --no-save acorn" trước.'); process.exit(2); }
const files = [];
for (const d of ['game/js', 'game/data']) for (const f of fs.readdirSync(d)) if (f.endsWith('.js')) files.push(path.join(d, f));
files.push('game/sw.js');
let bad = 0;
for (const f of files) {
  try { acorn.parse(fs.readFileSync(f, 'utf8'), { ecmaVersion: 5 }); }
  catch (e) { bad++; console.log('✗ ' + f + ': ' + e.message); }
}
console.log(bad ? '✗ ' + bad + ' tệp không phải ES5' : '✓ ES5: ' + files.length + ' tệp đều đạt');
process.exit(bad ? 1 : 0);
