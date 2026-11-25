// Dữ liệu thi và đo trình độ tiếng Trung cho game (Trường Lạc trấn).
// Chạy: node tools/build-zh-exam.mjs  →  game/data/zh_exam.js (tải khi cần: bài đầu vào, thi chứng chỉ tầng)
//   G.ZH_EXAMS  8 đề thi thử HSK 1–4 của app ATLAS (data/exams): Nghe (nghe chọn từ / nghĩa / câu), Đọc (điền từ, chọn nghĩa), Viết (xếp câu)
//   G.ZH_VOCAB  từ theo cấp HSK 1–5 (data/hsk2025.json + nghĩa data/zh-dict.json) cho phần Từ vựng của bài đầu vào: nhìn chữ, chọn nghĩa
//   G.ZH_EXAM.texts  câu cần giọng đọc (tools/build-audio-list.mjs đọc để tạo giọng còn thiếu)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const exams = {};
const texts = new Set();
for (const meta of J('data/exams/index.json')) {
  const e = J('data/exams/' + meta.id + '.json');
  exams[meta.id] = e;
  for (const s of e.sections) for (const it of s.items) { if (it.audio) texts.add(it.audio); if (it.cn) texts.add(it.cn); }
}
// từ vựng theo cấp: bỏ từ một chữ trùng nghĩa mơ hồ, lấy nghĩa ngắn (trước dấu phẩy đầu)
const hsk = J('data/hsk2025.json'), dict = J('data/zh-dict.json'), vocab = { 1: [], 2: [], 3: [], 4: [], 5: [] };
for (const w of Object.keys(hsk)) {
  const lv = +hsk[w], d = dict[w];
  if (!vocab[lv] || !d || !d[2]) continue;
  const vi = String(d[2]).split(/[;；]/)[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
  if (vi.length < 2 || vi.length > 28) continue;
  vocab[lv].push([w, d[0], vi]);
}
for (const lv in vocab) { const a = vocab[lv]; for (let i = a.length - 1; i > 0; i--) { const j = (i * 7919 + 13) % (i + 1); [a[i], a[j]] = [a[j], a[i]]; } vocab[lv] = a.slice(0, 60); }
const out = '/* TỰ SINH bởi tools/build-zh-exam.mjs từ data/exams (đề thi thử HSK 1–4 của app ATLAS), data/hsk2025.json, data/zh-dict.json. Đừng sửa tay. */\n' +
  'var G = window.G || (window.G = {});\n' +
  'G.ZH_EXAMS = ' + JSON.stringify(exams) + ';\n' +
  'G.ZH_VOCAB = ' + JSON.stringify(vocab) + ';\n' +
  'G.ZH_EXAM = { texts: ' + JSON.stringify([...texts].map((t) => [t, 'f'])) + ' };\n';
fs.writeFileSync(path.join(ROOT, 'game/data/zh_exam.js'), out);
console.log('✓ game/data/zh_exam.js:', Object.keys(exams).length, 'đề ·', Object.values(vocab).map((a) => a.length).join('/'), 'từ theo cấp ·', texts.size, 'câu nghe ·', Math.round(out.length / 1024), 'KB');
