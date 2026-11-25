// Dựng Tầng 1 · Nền tảng tiếng Trung cho game (Trường Lạc trấn) từ khoá phát âm, tổ hợp thanh và bộ thủ của app ATLAS gốc.
// Chạy: node tools/build-zh-found.mjs  →  game/data/zh_found.js (tải khi cần), rồi node tools/build-zh-game.mjs để ghi mục lục
//   zh-n01…zh-n10  khoá phát âm 10 bài (data/pron/zh.json): lý thuyết từng phần (grams), từ ví dụ, nghe chọn pinyin (alts = pinyin gây nhiễu)
//   zh-t01…zh-t04  20 tổ hợp thanh của từ hai âm tiết (data/pron/combos.json), 5 tổ hợp mỗi phòng
//   zh-r01…zh-r06  61 bộ thủ hay gặp (data/radicals.json): nhận mặt, nghĩa, âm Hán Việt, viết từng nét
// Phòng có pyQuiz: Luyện và Kiểm tra có thêm trò "Nghe chọn pinyin" (thanh điệu) ở js/lesson.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const pron = J('data/pron/zh.json'), combos = J('data/pron/combos.json'), rad = J('data/radicals.json');
const pad = (n) => String(n).padStart(2, '0');
const split = (s) => { const [zh, py, vi] = String(s).split('|'); return { zh, py, vi }; };
const rooms = [], index = [['zh-py', 'Phát âm · Pinyin và 4 thanh', 0]];

// 1. khoá phát âm 10 bài
for (const L of pron.lessons) {
  const id = 'zh-n' + pad(L.id), seen = new Map(), alts = new Map();
  for (const s of L.secs) for (const d of s.drill || []) if (d.t === 'pick') for (const it of d.items || []) {
    const w = split(it[0]); alts.set(w.zh + '|' + w.py, it.slice(1).filter((x) => x && x !== w.py));
  }
  const add = (s) => { const w = split(s); if (!w.zh || !w.py || seen.has(w.zh)) return; seen.set(w.zh, w); };
  L.warm.items.forEach(add);
  (L.speak || []).forEach(add);
  for (const s of L.secs) (s.ex || []).slice(0, 3).forEach(add);
  const items = [...seen.values()].slice(0, 18).map((w) => ({ zh: w.zh, py: w.py, vi: w.vi, ex: w.zh, exPy: w.py, exVi: w.vi, w: w.zh, alts: alts.get(w.zh + '|' + w.py) || undefined }));
  const grams = L.secs.filter((s) => s.title && (s.lead || (s.body && s.body.length))).map((s) => ({
    t: s.title, b: s.lead || '', d: (s.body || []).join(' ') + (s.tip ? ' Mẹo: ' + s.tip : ''),
    ex: (s.ex || []).slice(0, 6).map((e) => { const w = split(e); return [w.zh, w.vi, w.py]; })
  }));
  const topic = L.sub.split(',')[0].replace(/\s*\(.*$/, '');
  const title = 'Nền tảng ' + L.id + ' · ' + topic;
  rooms.push({ id, lang: 'zh', teacher: 'wang', title, pyQuiz: true,
    intro: [L.warm.items.map((s) => split(s).zh).join(' '), L.warm.lead + ' ' + L.goal], introPy: L.warm.items.map((s) => split(s).py).join(' '),
    gram: grams[0] || null, grams, items, outro: '很好！Phát âm chuẩn dần rồi đấy.' });
  index.push([id, title, 0]);
}

// 2. tổ hợp thanh: 20 tổ hợp, 5 tổ hợp mỗi phòng, 3 từ mỗi tổ hợp
const TN = ['', 'ngang (1)', 'lên (2)', 'xuống-lên (3)', 'xuống (4)', 'nhẹ'];
for (let r = 0; r < 4; r++) {
  const part = combos.slice(r * 5, r * 5 + 5), id = 'zh-t' + pad(r + 1);
  const items = [];
  part.forEach((c) => c.words.slice(0, 3).forEach((s) => { const w = split(s); items.push({ zh: w.zh, py: w.py, vi: w.vi, ex: w.zh, exPy: w.py, exVi: w.vi, w: w.zh }); }));
  const names = part.map((c) => c.p.join('-')).join(' · ');
  const grams = [{ t: 'Tổ hợp thanh ' + names, b: 'Từ hai âm tiết đọc liền một hơi, giữ đúng thanh của từng âm. Nghe kỹ âm đầu rồi âm sau.',
    d: part.map((c) => 'Thanh ' + TN[c.p[0]] + ' + thanh ' + TN[c.p[1]] + (c.p[0] === 3 && c.p[1] === 3 ? ' (đọc thành 2 + 3)' : c.p[0] === 3 ? ' (thanh 3 đứng trước đọc nửa thanh, chỉ xuống thấp)' : '')).join('; ') + '.',
    ex: part.map((c) => { const w = split(c.words[0]); return [w.zh, w.vi, w.py]; }) }];
  const title = 'Tổ hợp thanh ' + (r + 1) + ' · ' + names;
  rooms.push({ id, lang: 'zh', teacher: 'wang', title, pyQuiz: true, intro: [items[0].zh, 'Luyện 5 tổ hợp thanh: ' + names + '. Nghe, nói theo, rồi nghe chọn đúng pinyin.'], introPy: items[0].py,
    gram: grams[0], grams, items, outro: '很好！' });
  index.push([id, title, 0]);
}

// 3. bộ thủ: mỗi nhóm một phòng; mục = bộ thủ (nghĩa, âm Hán Việt, mẹo viết, chữ ví dụ), viết từng nét
rad.groups.forEach((g, i) => {
  const id = 'zh-r' + pad(i + 1);
  const items = g.items.map((it) => ({ zh: it.std, py: it.py, vi: 'bộ ' + it.hv + ' · ' + it.vi, hv: it.hv, note: (it.note || '') + (it.ex && it.ex.length ? ' Có trong: ' + it.ex.join(' ') + '.' : ''), ex: it.std, exPy: it.py, exVi: it.vi, w: it.std }));
  const title = 'Bộ thủ ' + (i + 1) + ' · ' + g.name.replace(/^Nhóm \d+ · /, '');
  rooms.push({ id, lang: 'zh', teacher: 'wang', title, write: g.items.map((it) => it.std),
    intro: [g.items.map((it) => it.std).join(' '), (i === 0 ? rad.intro + ' ' : '') + 'Nhóm này có ' + g.items.length + ' bộ. Học nghĩa, âm Hán Việt rồi viết từng nét.'], introPy: '',
    gram: { t: 'Bộ thủ: ' + g.name.replace(/^Nhóm \d+ · /, ''), b: 'Bộ thủ là phần chỉ nghĩa của chữ Hán. Thấy bộ là đoán được chữ nói về cái gì.', d: '',
      ex: g.items.slice(0, 6).map((it) => [it.std, 'bộ ' + it.hv + ' · ' + it.vi, it.py]) },
    items, outro: '很好！Nhớ bộ thủ là đọc chữ nhanh hơn.' });
  index.push([id, title, 0]);
});

const NOTE = '/* TỰ SINH bởi tools/build-zh-found.mjs từ data/pron/zh.json, data/pron/combos.json, data/radicals.json (app ATLAS), đừng sửa tay.\n' +
  '   Tầng 1 · Nền tảng của Trường Lạc trấn: phát âm (10), tổ hợp thanh (4), bộ thủ (6). */\n';
const body = rooms.map((r) => 'G.ROOMS[' + JSON.stringify(r.id) + '] = ' + JSON.stringify(r) + ';').join('\n');
// mục lục Tầng 1 (G.ZH_FOUND_INDEX): tools/build-zh-game.mjs chép vào game/data/zh_index.js
fs.writeFileSync(path.join(ROOT, 'game/data/zh_found.js'), NOTE + 'var G = window.G || (window.G = {});\nG.ROOMS = G.ROOMS || {};\n' + body +
  '\nG.ZH_FOUND_INDEX = ' + JSON.stringify(index) + ';\nG.ZH_LOADED = G.ZH_LOADED || {}; G.ZH_LOADED["data/zh_found.js"] = 1;\n');
console.log('✓ game/data/zh_found.js:', rooms.length + 1, 'phòng Tầng 1 (kể cả Phát âm · Pinyin và 4 thanh) ·', Math.round(fs.statSync(path.join(ROOT, 'game/data/zh_found.js')).size / 1024), 'KB');
