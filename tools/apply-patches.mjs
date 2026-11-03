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

/* 1. Thay chuỗi chính xác (lỗi tiếng Trung, câu sai trong bài đọc) */
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

/* 4. Nguồn của bài đọc: lấy dòng @source trong data-src/stories/ ghi vào data/stories/ */
export function applyStorySources() {
  const dir = path.join(ROOT, 'data-src', 'stories');
  const src = {};
  let id = null;
  for (const name of fs.readdirSync(dir).filter((x) => x.endsWith('.txt'))) {
    for (const line of fs.readFileSync(path.join(dir, name), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^@(\w+)\s+(.*)$/);
      if (!m) continue;
      if (m[1] === 'id') { id = m[2].trim(); src[id] = []; }
      if (m[1] === 'source' && id) {
        const [nm, url] = m[2].split('|').map((x) => x.trim());
        src[id].push({ name: nm, url });
      }
    }
  }
  const idxF = path.join(OUT, 'stories', 'index.json');
  const idx = readJson(idxF);
  let n = 0;
  for (const s of idx) {
    if (!src[s.id]) continue;
    const f = path.join(OUT, 'stories', `${s.id}.json`);
    const st = readJson(f);
    if (JSON.stringify(st.sources) !== JSON.stringify(src[s.id])) {
      st.sources = src[s.id]; fs.writeFileSync(f, JSON.stringify(st)); n++;
    }
    if ('sources' in s) s.sources = src[s.id];
  }
  fs.writeFileSync(idxF, JSON.stringify(idx));
  log.push(`Nguồn bài đọc: cập nhật ${n} bài`);
}

export function applyAll() {
  applyReplace();
  applyEnBank();
  applyTopicIpa();
  applyStorySources();
  console.log(log.join('\n'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) applyAll();
