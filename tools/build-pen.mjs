// Dựng game/js/pen.js (ES5) từ bộ bút viết chữ Hán của app ATLAS gốc (js/pen: brush, grid, grade, canvas).
// Bản gốc vẫn là bản chính: sửa ở js/pen rồi chạy lại `npm i --no-save typescript && node tools/build-pen.mjs`.
// Bỏ tiếng bút tạo bằng code (sound.js): âm thanh của game phải là ghi âm thật (CLAUDE.md), sẽ gắn tiếng CC0 sau.
// Kết quả: G.Pen = { WritingPad, gradeWhole, gradeStroke, gradeInOrder, verdict, STRICTNESS, drawChar, drawGrid, drawPartialStroke, drawStrokeNumbers, drawMedianHint }
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('typescript');

const parts = ['brush', 'grid', 'grade', 'canvas'].map((n) => {
  let s = fs.readFileSync(path.join(ROOT, 'js/pen', n + '.js'), 'utf8');
  s = s.replace(/^import[^;]*;\s*$/gm, '');             // các tệp được ghép chung một phạm vi
  s = s.replace(/^export\s+(?=(const|let|function|class)\b)/gm, '');
  return '/* ---------- js/pen/' + n + '.js ---------- */\n' + s;
}).join('\n');

const src = `var G = window.G || (window.G = {});
(function () {
var GRID = 1024, Y_OFFSET = 900;   // hệ toạ độ dữ liệu nét (hanzi-writer-data), như js/data.js của ATLAS
var sound = { initSound: function () {}, batDau: function () {}, capNhat: function () {}, ketThuc: function () {}, dungHan: function () {} };
${parts}
G.Pen = { WritingPad: WritingPad, gradeWhole: gradeWhole, gradeStroke: gradeStroke, gradeInOrder: gradeInOrder, bestMatch: bestMatch, verdict: verdict, STRICTNESS: STRICTNESS,
  drawChar: drawChar, drawGrid: drawGrid, drawPartialStroke: drawPartialStroke, drawStrokeNumbers: drawStrokeNumbers, drawMedianHint: drawMedianHint, invalidateColors: invalidateColors };
})();
`;
const out = ts.transpileModule(src, { compilerOptions: { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.None, removeComments: false, importHelpers: false, downlevelIteration: false } }).outputText;
const head = '/* TỰ SINH bởi tools/build-pen.mjs từ js/pen (ATLAS), đừng sửa tay: sửa js/pen rồi dựng lại.\n   Bảng viết chữ Hán bằng Apple Pencil / ngón tay: lực nhấn, chống tì tay, chấm từng nét theo dữ liệu hanzi-writer-data (Arphic Public License). */\n';
fs.writeFileSync(path.join(ROOT, 'game/js/pen.js'), head + out);
console.log('✓ game/js/pen.js', (head + out).length, 'ký tự');
