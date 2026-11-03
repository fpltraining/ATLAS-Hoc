/* Giáo trình tiếng Trung theo chuẩn HSK 2025.

     node tools/build-curriculum.mjs

   - Đọc cấp của từng từ trong data-src/hsk2025/levels.json, chép ra data/hsk2025.json cho app.
   - Dựng các bài bổ sung trong data-src/curriculum-2025/*.txt thành data/curriculum/lesson-<id>.json.
   - Chèn bài bổ sung vào lộ trình ngay sau bài ghi ở @after.
   - Xếp lại nhóm cấp của mọi bài theo chuẩn 2025: cấp mà nhiều từ trong bài thuộc về nhất.
   - Đánh số thứ tự hiển thị (no) theo vị trí trong lộ trình; id giữ nguyên để không mất tiến độ.
   - Thêm từ của bài bổ sung vào từ điển chạm tra (zh-dict.json).

   Chạy lại bao nhiêu lần cũng được. merge-data.mjs gọi tệp này sau khi chép dữ liệu Bút Hán.

   Định dạng một bài bổ sung (mỗi tệp .txt có thể chứa nhiều bài):
     @id 119                 số bài, không trùng bài cũ
     @after 15               đứng ngay sau bài này trong lộ trình
     @cn 我们和他们
     @title Chúng tôi và họ
     @goal Mục tiêu của bài.
     W từ | pinyin | Hán Việt | nghĩa | từ loại | mẹo nhớ
     E câu | pinyin | nghĩa              (ví dụ của W hoặc G ngay phía trên)
     G tiêu đề | công thức | giải thích
     S câu | pinyin | nghĩa              (câu luyện của cả bài)
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data');
const CUR = path.join(OUT, 'curriculum');
const SRC = path.join(ROOT, 'data-src', 'curriculum-2025');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const hanzi = (s) => [...String(s)].filter((c) => /[一-鿿]/u.test(c));
const LV_ORDER = { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, '7-9': 7 };

export function parseLessons(text, file) {
  const out = [];
  let L = null, last = null;
  text.split(/\r?\n/).forEach((raw, ln) => {
    const line = raw.trim();
    const where = `${file}:${ln + 1}`;
    if (!line || line.startsWith('#')) return;
    const cols = (s, n) => {
      const p = s.split(' | ').map((x) => x.trim());
      if (p.length !== n) throw new Error(`${where}: cần ${n} cột, có ${p.length}: ${line}`);
      return p;
    };
    if (line.startsWith('@')) {
      const sp = line.indexOf(' ');
      const k = line.slice(1, sp), v = line.slice(sp + 1).trim();
      if (k === 'id') { L = { id: Number(v), words: [], grammar: [], sentences: [] }; out.push(L); last = null; return; }
      if (!L) throw new Error(`${where}: thiếu @id trước ${line}`);
      L[k] = k === 'after' ? Number(v) : v;
      return;
    }
    if (!L) throw new Error(`${where}: dòng nằm ngoài bài: ${line}`);
    const tag = line[0], body = line.slice(1).trim();
    if (tag === 'W') {
      const [w, py, hv, vi, pos, note] = cols(body, 6);
      last = { w, py, hv, vi, pos, note, ex: [] };
      L.words.push(last);
    } else if (tag === 'G') {
      const [t, b, d] = cols(body, 3);
      last = { t, b, d, ex: [] };
      L.grammar.push(last);
    } else if (tag === 'E') {
      if (!last) throw new Error(`${where}: ví dụ E phải đứng sau W hoặc G`);
      const [cn, py, vi] = cols(body, 3);
      last.ex.push({ cn, py, vi });
    } else if (tag === 'S') {
      const [cn, py, vi] = cols(body, 3);
      L.sentences.push({ cn, py, vi });
    } else {
      throw new Error(`${where}: không hiểu dòng: ${line}`);
    }
  });
  for (const l of out) {
    for (const k of ['after', 'cn', 'title', 'goal']) if (l[k] === undefined) throw new Error(`${file}: bài ${l.id} thiếu @${k}`);
    for (const w of l.words) if (!w.ex.length) throw new Error(`${file}: bài ${l.id}, từ ${w.w} chưa có câu ví dụ`);
  }
  return out;
}

export function buildCurriculum({ quiet = false } = {}) {
  const levels = readJson(path.join(ROOT, 'data-src', 'hsk2025', 'levels.json'));
  fs.writeFileSync(path.join(OUT, 'hsk2025.json'), JSON.stringify(levels));
  const lvOf = (w) => levels[w] || levels[w.replace(/儿$/, '')] || null;

  const idxF = path.join(CUR, 'index.json');
  const idx = readJson(idxF);

  // Bài gốc của Bút Hán: mọi bài không đến từ data-src, giữ thứ tự theo id
  const base = idx.lessons.filter((l) => !l.src).sort((a, b) => a.id - b.id);
  const baseIds = new Set(base.map((l) => l.id));

  const added = [];
  if (fs.existsSync(SRC)) {
    for (const f of fs.readdirSync(SRC).filter((x) => x.endsWith('.txt')).sort()) {
      added.push(...parseLessons(fs.readFileSync(path.join(SRC, f), 'utf8'), f));
    }
  }
  const seen = new Set();
  for (const l of added) {
    if (baseIds.has(l.id) || seen.has(l.id)) throw new Error(`Bài bổ sung trùng id ${l.id}`);
    seen.add(l.id);
  }

  // Xếp lộ trình: bài gốc theo id, bài bổ sung chèn ngay sau bài @after (cùng @after thì theo id)
  const order = [];
  const after = new Map();
  for (const l of added) after.set(l.after, [...(after.get(l.after) || []), l].sort((a, b) => a.id - b.id));
  const placed = new Set();
  const place = (id) => {
    for (const l of after.get(id) || []) { order.push({ added: l }); placed.add(l.id); place(l.id); }
  };
  for (const b of base) { order.push({ base: b }); place(b.id); }
  for (const l of added) if (!placed.has(l.id)) throw new Error(`Bài ${l.id}: không tìm thấy bài @after ${l.after}`);

  // Ghi bài bổ sung, tính chữ mới theo thứ tự lộ trình
  const knownChars = new Set();
  const lessonsOut = [];
  const dictF = path.join(OUT, 'zh-dict.json');
  const dict = readJson(dictF);
  const stats = [];
  order.forEach((o, i) => {
    let entry, words;
    if (o.base) {
      entry = { ...o.base };
      words = readJson(path.join(CUR, entry.file)).words.map((w) => w.w);
      for (const ch of entry.newChars || []) knownChars.add(ch);
      for (const w of words) for (const ch of hanzi(w)) knownChars.add(ch);
      if (entry.lv20 === undefined) entry.lv20 = entry.level;
    } else {
      const l = o.added;
      const file = `lesson-${l.id}.json`;
      const lesson = { id: l.id, cn: l.cn, title: l.title, goal: l.goal, words: l.words, grammar: l.grammar, sentences: l.sentences };
      fs.writeFileSync(path.join(CUR, file), `${JSON.stringify(lesson, null, 1)}\n`);
      words = l.words.map((w) => w.w);
      const newChars = [];
      for (const w of words) for (const ch of hanzi(w)) if (!knownChars.has(ch)) { knownChars.add(ch); newChars.push(ch); }
      entry = { id: l.id, file, level: 1, cn: l.cn, title: l.title, goal: l.goal, wordCount: words.length, newChars, src: '2025' };
      for (const w of l.words) dict[w.w] = [w.py, w.hv, w.vi];
    }
    // Nhóm cấp theo chuẩn 2025
    const count = {};
    for (const w of words) { const lv = lvOf(w); if (lv) count[lv] = (count[lv] || 0) + 1; }
    const best = Object.entries(count).sort((a, b) => b[1] - a[1] || LV_ORDER[b[0]] - LV_ORDER[a[0]])[0];
    entry.level = best ? (best[0] === '7-9' ? 7 : Number(best[0])) : (entry.lv20 || entry.level);
    entry.no = i + 1;
    stats.push({ id: entry.id, level: entry.level, count });
    lessonsOut.push(entry);
  });

  idx.name = 'HSK 1–4 · chuẩn 2025';
  idx.standard = 'HSK 2025 (bản sửa đổi chuẩn HSK 3.0)';
  idx.levels = [...new Set(lessonsOut.map((l) => l.level))].sort((a, b) => a - b);
  idx.lessons = lessonsOut;
  fs.writeFileSync(idxF, JSON.stringify(idx));
  fs.writeFileSync(dictF, JSON.stringify(dict));

  // Độ phủ: bao nhiêu từ của từng cấp đã có trong giáo trình
  const have = new Set();
  for (const l of lessonsOut) for (const w of readJson(path.join(CUR, l.file)).words) have.add(w.w.replace(/儿$/, ''));
  const cover = {};
  for (const [w, lv] of Object.entries(levels)) {
    if (!['1', '2', '3', '4'].includes(lv)) continue;
    cover[lv] = cover[lv] || [0, 0];
    cover[lv][1]++;
    if (have.has(w.replace(/儿$/, ''))) cover[lv][0]++;
  }
  if (!quiet) {
    console.log('Bài:', lessonsOut.length, '· bài bổ sung:', added.length);
    console.log('Số bài theo cấp 2025:', JSON.stringify(Object.fromEntries(idx.levels.map((lv) => [lv, lessonsOut.filter((l) => l.level === lv).length]))));
    console.log('Độ phủ từ cấp 1–4 (có/tổng):', JSON.stringify(cover));
  }
  return { lessons: lessonsOut, cover };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildCurriculum();
