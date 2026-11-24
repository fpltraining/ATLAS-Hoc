// Dựng buổi học tiếng Trung cho game (Trường Lạc trấn) từ giáo trình HSK của app ATLAS gốc (data/curriculum).
// Chạy: node tools/build-zh-game.mjs  →  game/data/zh_hsk12.js (Tầng 2 · HSK 1–2, mỗi bài một buổi Học · Luyện · Kiểm tra)
// Mỗi từ của bài là một mục (chữ, pinyin, nghĩa, Hán Việt, câu ví dụ); câu ví dụ được tách thành từ cho trò xếp câu
// (khớp dài nhất theo từ trong giáo trình + danh sách HSK). In ra số câu chưa có giọng đọc (data/audio.json).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const idx = J('data/curriculum/index.json');
const hsk = J('data/hsk2025.json');
const audio = J('data/audio.json');
const have = new Set(audio.zh || []);
const LEVELS = [1, 2];

function audioKey(lang, text) {   // như G.audioKey (game/js/util.js)
  let t = String(text).replace(/\s+/g, ' ').trim();
  if (lang === 'en') t = t.toLowerCase();
  const s = lang + '|' + t;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// từ điển để tách câu: mọi từ của giáo trình + danh sách HSK
const dict = new Set(Object.keys(hsk));
const lessons = idx.lessons.filter((l) => LEVELS.includes(l.level)).map((l) => ({ meta: l, data: J('data/curriculum/' + l.file) }));
idx.lessons.forEach((l) => { try { J('data/curriculum/' + l.file).words.forEach((w) => dict.add(w.w)); } catch (e) { /* bỏ qua */ } });
const isHan = (c) => /[㐀-鿿]/.test(c);
function seg(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!isHan(c)) {
      if (/[，。！？、；：,.!?…“”"'（）()《》—\s]/.test(c)) { if (out.length && !/\s/.test(c)) out[out.length - 1] += c; i++; continue; }
      let j = i; while (j < s.length && !isHan(s[j]) && !/[，。！？、；：,.!?…“”"'（）()《》—\s]/.test(s[j])) j++;
      out.push(s.slice(i, j)); i = j; continue;
    }
    let L = Math.min(4, s.length - i);
    for (; L > 1; L--) if (dict.has(s.slice(i, i + L))) break;
    out.push(s.slice(i, i + L)); i += L;
  }
  return out;
}

let missing = 0, total = 0;
const need = (t) => { total++; if (!have.has(audioKey('zh', t))) missing++; };
const rooms = [], ids = { 1: [], 2: [] };
for (const { meta, data } of lessons) {
  const lv = meta.level, no = meta.no || meta.id, id = 'zh-h' + lv + '-' + String(no).padStart(2, '0');
  // câu ví dụ: ưu tiên câu của bài có chứa từ (đã có giọng đọc AI), mỗi câu dùng một lần; không có thì câu ví dụ riêng của từ
  const used = new Set();
  const items = data.words.map((w) => {
    const sent = (data.sentences || []).filter((s) => s.cn.indexOf(w.w) >= 0 && have.has(audioKey('zh', s.cn)));
    const pick = sent.find((s) => !used.has(s.cn)) || null;
    if (pick) used.add(pick.cn);
    const ex = pick || (w.ex && w.ex[0]) || sent[0] || { cn: w.w, py: w.py, vi: w.vi };
    need(w.w); need(ex.cn);
    return { zh: w.w, py: w.py, vi: w.vi, hv: w.hv || '', note: w.note || '', ex: ex.cn, exPy: ex.py, exVi: ex.vi, w: seg(ex.cn).join(' ') };
  });
  const grams = (data.grammar || []).map((g) => ({ t: g.t, b: g.b, d: g.d || '', ex: (g.ex || []).map((e) => [e.cn, e.vi, e.py]) }));
  grams.forEach((g) => g.ex.forEach((e) => need(e[0])));
  const first = (data.sentences && data.sentences[0]) || { cn: data.cn, py: '', vi: data.title };
  rooms.push({
    id, lang: 'zh', level: lv, no, teacher: 'wang',
    title: 'HSK' + lv + ' · Bài ' + no + ' · ' + data.cn + ' ' + data.title,
    intro: [first.cn, 'Bài ' + no + ': ' + data.goal + ' Bấm 1 · Học để bắt đầu.'], introPy: first.py,
    gram: grams[0] || null, grams: grams, items, newChars: meta.newChars || [],
    outro: '很好！Học xong bài ' + no + ' rồi.'
  });
  ids[lv].push(id);
}

const head = `/* TỰ SINH bởi tools/build-zh-game.mjs từ data/curriculum (giáo trình HSK của app ATLAS), đừng sửa tay.
   Tầng 2 · HSK 1–2 của Trường Lạc trấn: ${rooms.length} buổi (HSK1 ${ids[1].length}, HSK2 ${ids[2].length}), mỗi buổi Học · Luyện · Kiểm tra;
   mục = từ của bài (chữ, pinyin, nghĩa, Hán Việt, câu ví dụ; w = câu tách theo từ cho trò xếp câu), grams = các điểm ngữ pháp. */
var G = window.G || (window.G = {});
G.ROOMS = G.ROOMS || {};
G.ZH_FLOORS = G.ZH_FLOORS || {};
`;
const body = rooms.map((r) => 'G.ROOMS[' + JSON.stringify(r.id) + '] = ' + JSON.stringify(r) + ';').join('\n');
const tail = `\nG.ZH_FLOORS[2] = ${JSON.stringify(ids[1].concat(ids[2]))};\n`;
fs.writeFileSync(path.join(ROOT, 'game/data/zh_hsk12.js'), head + body + tail);
console.log('✓ game/data/zh_hsk12.js:', rooms.length, 'buổi (HSK1 ' + ids[1].length + ', HSK2 ' + ids[2].length + ')', '· giọng đọc có sẵn', (total - missing) + '/' + total, 'câu');
