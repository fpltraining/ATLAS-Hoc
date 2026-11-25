// Dựng buổi học tiếng Trung cho game (Trường Lạc trấn) từ giáo trình HSK của app ATLAS gốc (data/curriculum, 308 bài HSK 1–5).
// Chạy: node tools/build-zh-game.mjs  →
//   game/data/zh_index.js  mục lục nhỏ nạp cùng game: id, tên, cấp của từng buổi theo tầng (để Sảnh, lộ trình đếm tiến độ khi chưa tải bài),
//                          kể cả Tầng 1 · Nền tảng (đọc từ game/data/zh_found.js: chạy tools/build-zh-found.mjs trước)
//   game/data/zh_c1.js … zh_c5.js  buổi học của từng cấp HSK 1…5 (Tầng 2 = HSK 1–2, Tầng 3 = HSK 3–4, Tầng 4 = HSK 5)
//   (tải khi cần, mỗi lần một cấp: G.zhLoadRoom / G.zhLoad trong js/zh.js)
// Buổi giữ đúng thứ tự giáo trình (số bài 1–308). Mục = từ của bài (chữ, pinyin, nghĩa, Hán Việt, ghi chú, câu ví dụ ưu tiên
// câu của bài đã có giọng AI); câu ví dụ tách theo từ cho trò xếp câu; grams = các điểm ngữ pháp; newChars = chữ mới để luyện viết.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const idx = J('data/curriculum/index.json');
const hsk = J('data/hsk2025.json');
const have = new Set((J('data/audio.json').zh) || []);
const FLOOR = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4 };                   // cấp HSK → tầng của game
const pad = (n) => String(n).padStart(3, '0');

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
const all = idx.lessons.map((l) => ({ meta: l, data: J('data/curriculum/' + l.file) }));
all.forEach(({ data }) => data.words.forEach((w) => dict.add(w.w)));
const isHan = (c) => /[㐀-鿿]/.test(c);
const PUNCT = /[，。！？、；：,.!?…“”"'‘’（）()《》—\s·]/;
function seg(s) {
  const out = []; let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (!isHan(c)) {
      if (PUNCT.test(c)) { if (out.length && !/\s/.test(c)) out[out.length - 1] += c; i++; continue; }
      let j = i; while (j < s.length && !isHan(s[j]) && !PUNCT.test(s[j])) j++;
      out.push(s.slice(i, j)); i = j; continue;
    }
    let L = Math.min(4, s.length - i);
    for (; L > 1; L--) if (dict.has(s.slice(i, i + L))) break;
    out.push(s.slice(i, i + L)); i += L;
  }
  return out;
}

const stat = { total: 0, missing: 0 }, missingTexts = [];
const need = (t) => { stat.total++; if (!have.has(audioKey('zh', t))) { stat.missing++; missingTexts.push(t); } };
const byFloor = { 2: [], 3: [], 4: [] }, index = { 2: [], 3: [], 4: [] };
for (const { meta, data } of all) {
  const lv = meta.level, no = meta.no || meta.id, f = FLOOR[lv], id = 'zh-l' + pad(no);
  if (!f) continue;
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
  const short = 'HSK' + lv + ' · Bài ' + no + ' · ' + data.cn + ' ' + data.title;
  byFloor[f].push({
    id, lang: 'zh', level: lv, no, teacher: 'wang', title: short,
    intro: [first.cn, 'Bài ' + no + ': ' + data.goal + ' Bấm 1 · Học để bắt đầu.'], introPy: first.py,
    gram: grams[0] || null, grams, items, newChars: (meta.newChars || []).filter(isHan),
    outro: '很好！Xong bài ' + no + '.'
  });
  index[f].push([id, short, lv]);
}

const NOTE = '/* TỰ SINH bởi tools/build-zh-game.mjs từ data/curriculum (giáo trình HSK của app ATLAS), đừng sửa tay. */\n';
const byLevel = {};
for (const f of [2, 3, 4]) for (const r of byFloor[f]) (byLevel[r.level] = byLevel[r.level] || []).push(r);
const LVFILE = {};
for (const lv of Object.keys(byLevel)) {
  const file = 'zh_c' + lv + '.js';
  LVFILE[lv] = 'data/' + file;
  const body = byLevel[lv].map((r) => 'G.ROOMS[' + JSON.stringify(r.id) + '] = ' + JSON.stringify(r) + ';').join('\n');
  fs.writeFileSync(path.join(ROOT, 'game/data', file), NOTE + 'var G = window.G || (window.G = {});\nG.ROOMS = G.ROOMS || {};\n' + body + '\nG.ZH_LOADED = G.ZH_LOADED || {}; G.ZH_LOADED[' + JSON.stringify('data/' + file) + '] = 1;\n');
}
// Tầng 1 · Nền tảng: mục lục lấy từ game/data/zh_found.js (tools/build-zh-found.mjs)
const vm = await import('node:vm');
const fctx = { console }; fctx.window = fctx; fctx.G = {}; vm.createContext(fctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'game/data/zh_found.js'), 'utf8'), fctx);
index[1] = fctx.G.ZH_FOUND_INDEX;
if (!index[1] || !index[1].length) throw new Error('Thiếu mục lục Tầng 1: chạy tools/build-zh-found.mjs trước');
fs.writeFileSync(path.join(ROOT, 'game/data/zh_index.js'), NOTE +
  '/* Mục lục buổi học tiếng Trung theo tầng: [id, tên, cấp HSK (0 = Nền tảng)]. Dữ liệu buổi tải khi cần theo cấp (G.ZH_LVFILE, js/zh.js). */\n' +
  'var G = window.G || (window.G = {});\nG.ZH_INDEX = {\n' +
  [1, 2, 3, 4].map((f) => '  ' + f + ': ' + JSON.stringify(index[f])).join(',\n') +
  '\n};\nG.ZH_LVFILE = ' + JSON.stringify(Object.assign({ 0: 'data/zh_found.js' }, LVFILE)) + ';\n');
fs.writeFileSync(path.join(ROOT, 'data-src/zh-audio-missing.json'), JSON.stringify([...new Set(missingTexts)], null, 0));
console.log('✓ buổi:', 'Tầng 1', index[1].length, '· Tầng 2', index[2].length, '· Tầng 3', index[3].length, '· Tầng 4', index[4].length,
  '· giọng đọc có sẵn', (stat.total - stat.missing) + '/' + stat.total, '(câu còn thiếu: data-src/zh-audio-missing.json)');
for (const lv of Object.keys(LVFILE)) console.log('  ' + LVFILE[lv] + ': ' + byLevel[lv].length + ' buổi, ' + Math.round(fs.statSync(path.join(ROOT, 'game', LVFILE[lv])).size / 1024) + ' KB');
