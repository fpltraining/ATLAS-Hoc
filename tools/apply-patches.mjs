/* Áp các bản sửa nội dung trong data-src/patches/ lên data/.

     node tools/apply-patches.mjs

   merge-data.mjs gọi tệp này ở cuối, nên dựng lại dữ liệu từ 5 app cũ vẫn giữ được các bản sửa.
   Chạy lại bao nhiêu lần cũng được: mục nào đã áp rồi thì bỏ qua.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data');
const PATCH = path.join(ROOT, 'data-src', 'patches');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const log = [];

/* 1. Thay chuỗi chính xác (lỗi tiếng Trung) */
export function applyReplace() {
  const p = readJson(path.join(PATCH, 'fixes.json'));
  let done = 0, skip = 0;
  for (const r of p.replace) {
    const f = path.join(OUT, r.file);
    const s = fs.readFileSync(f, 'utf8');
    if (s.includes(r.find)) { fs.writeFileSync(f, s.replace(r.find, r.to)); done++; }
    else if (s.includes(r.to)) skip++;
    else throw new Error(`Không tìm thấy chuỗi cần sửa trong ${r.file}: ${r.find}`);
  }
  log.push(`Sửa chuỗi: sửa ${done}, đã có sẵn ${skip}`);
}

/* 2. Kho từ tiếng Anh: chép đè từng trường theo từ khoá viết thường */
const key = (s) => String(s).toLowerCase().replace(/[’]/g, "'").trim();
const COLS = ['w', 'ipa', 'pos', 'vi', 'ex', 'exVi', 'topic', 'lv'];

/* Gộp ba nguồn sửa kho từ thành một bảng: từ khoá -> các trường cần đổi.
   en-add-*.txt : từ | phiên âm | từ loại | câu ví dụ | nghĩa câu ví dụ  (bổ sung cho từ còn thiếu)
   pos.txt      : từ loại: từ ; từ ; ...                                   (từ loại còn thiếu)
   en-bank.json : viết thường, phiên âm giọng Mỹ, sửa nghĩa                 */
function enBankPatch() {
  const patch = {};
  const put = (k, fix) => { patch[k] = { ...(patch[k] || {}), ...fix }; };
  for (const name of fs.readdirSync(PATCH).filter((x) => /^en-add-.*\.txt$/.test(x)).sort()) {
    fs.readFileSync(path.join(PATCH, name), 'utf8').split(/\r?\n/).forEach((line, i) => {
      if (!line.trim() || line.startsWith('#')) return;
      const p = line.split(' | ').map((x) => x.trim());
      if (p.length !== 5) throw new Error(`${name}:${i + 1} cần đủ 5 cột: ${line}`);
      put(key(p[0]), { ipa: p[1], pos: p[2], ex: p[3], exVi: p[4] });
    });
  }
  const posF = path.join(PATCH, 'pos.txt');
  if (fs.existsSync(posF)) {
    for (const line of fs.readFileSync(posF, 'utf8').split(/\r?\n/)) {
      if (!line.trim() || line.startsWith('#') || !line.includes(':')) continue;
      const [pos, list] = line.split(/:(.*)/s);
      for (const w of list.split(';')) if (w.trim()) put(key(w), { pos: pos.trim() });
    }
  }
  const jf = path.join(PATCH, 'en-bank.json');
  if (fs.existsSync(jf)) for (const [k, fix] of Object.entries(readJson(jf).words)) put(k, fix);
  return patch;
}

export function applyEnBank() {
  const patch = enBankPatch();
  const bankF = path.join(OUT, 'en', 'bank.json');
  const dictF = path.join(OUT, 'en', 'dict.json');
  const bank = readJson(bankF);
  const dict = readJson(dictF);
  const seen = new Set();
  let n = 0;
  for (const row of bank) {
    const k = key(row[0]);
    const fix = patch[k];
    if (!fix) continue;
    seen.add(k);
    COLS.forEach((c, i) => { if (fix[c] !== undefined && row[i] !== fix[c]) { row[i] = fix[c]; n++; } });
    if (dict[k]) dict[k] = [row[3] || dict[k][0], row[1] || dict[k][1]];
  }
  const miss = Object.keys(patch).filter((k) => !seen.has(k));
  if (miss.length) throw new Error(`Bản sửa có từ không nằm trong kho: ${miss.slice(0, 20).join(', ')}`);
  fs.writeFileSync(bankF, JSON.stringify(bank));
  fs.writeFileSync(dictF, JSON.stringify(dict));
  log.push(`Kho từ tiếng Anh: đổi ${n} ô`);
}

/* 2b. Từ mới B1–B2: thêm vào kho từ và lập danh sách học theo buổi cho chặng 2.
   en-new-*.txt: từ | phiên âm | từ loại | nghĩa | câu ví dụ | nghĩa câu ví dụ
   Dòng "@lv 3" hoặc "@lv 4" đặt cấp cho các dòng phía dưới (3 = B1, 4 = B2). */
export function applyEnNew() {
  const files = fs.readdirSync(PATCH).filter((x) => /^en-new-.*\.txt$/.test(x)).sort();
  if (!files.length) return;
  const bankF = path.join(OUT, 'en', 'bank.json');
  const dictF = path.join(OUT, 'en', 'dict.json');
  const courseF = path.join(OUT, 'en', 'course.json');
  const bank = readJson(bankF);
  const dict = readJson(dictF);
  const course = readJson(courseF);
  const have = new Map(bank.map((r) => [key(r[0]), r]));
  const list = [];
  let added = 0;
  for (const name of files) {
    let lv = 4;
    fs.readFileSync(path.join(PATCH, name), 'utf8').split(/\r?\n/).forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      if (t.startsWith('@lv')) { lv = Number(t.slice(3)); return; }
      const p = t.split(' | ').map((x) => x.trim());
      if (p.length !== 6) throw new Error(`${name}:${i + 1} cần đủ 6 cột: ${t}`);
      const [w, ipa, pos, vi, ex, exVi] = p;
      const k = key(w);
      const row = [w, ipa, pos, vi, ex, exVi, 'b1b2', lv];
      if (have.has(k)) { const r = have.get(k); if (r[6] === 'b1b2') row.forEach((v, j) => { r[j] = v; }); }
      else { bank.push(row); have.set(k, row); added++; }
      dict[k] = [vi, ipa];
      list.push([w, vi]);
    });
  }
  course.vocabB2 = list;
  fs.writeFileSync(bankF, JSON.stringify(bank));
  fs.writeFileSync(dictF, JSON.stringify(dict));
  fs.writeFileSync(courseF, JSON.stringify(course));
  log.push(`Từ mới B1–B2: ${list.length} từ (thêm mới ${added})`);
}

/* 3. Phiên âm trong chủ đề: thay theo bảng từ -> IPA */
export function applyTopicIpa() {
  const f = path.join(PATCH, 'topics-ipa.json');
  if (!fs.existsSync(f)) return;
  const fix = readJson(f).ipa;
  const tf = path.join(OUT, 'topics.json');
  const t = readJson(tf);
  let n = 0;
  for (const tp of t.topics) for (const r of tp.en || []) {
    const v = fix[key(r[0])];
    if (v && r[1] !== v) { r[1] = v; n++; }
  }
  fs.writeFileSync(tf, JSON.stringify(t));
  log.push(`Phiên âm chủ đề: đổi ${n}`);
}

/* 4. Trạng thái các chặng tiếng Anh: ghi chú và đánh dấu chặng chưa đủ nội dung */
export function applyCourse() {
  const f = path.join(PATCH, 'course.json');
  if (!fs.existsSync(f)) return;
  const fix = readJson(f).stages;
  const cf = path.join(OUT, 'en', 'course.json');
  const course = readJson(cf);
  course.stages.forEach((st, i) => { if (fix[i]) Object.assign(st, fix[i]); });
  const blocks = readJson(f).blocks || {};
  for (const [k, v] of Object.entries(blocks)) course.blocks[k] = v;
  fs.writeFileSync(cf, JSON.stringify(course));
  log.push(`Chặng tiếng Anh: ${Object.keys(fix).length} ghi chú`);
}

export function applyAll() {
  applyReplace();
  applyEnNew();
  applyEnBank();
  applyTopicIpa();
  applyCourse();
  console.log(log.join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) applyAll();
