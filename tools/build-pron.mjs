// Dựng dữ liệu khoá phát âm: data/pron/zh.json, data/pron/en.json, data/pron/combos.json
// và danh sách câu cần giọng AI (data-src/pron-audio.json, build-audio-list.mjs đọc vào).
// Cách chạy: node tools/build-pron.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const load = async (f) => (await import(pathToFileURL(path.join(ROOT, f)).href + `?t=${Date.now()}`)).default;

const MARKS = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ';
const toneOf = (s) => { for (const c of s) { const k = MARKS.indexOf(c); if (k >= 0) return (k % 4) + 1; } return 0; };
const isHan = (c) => /[\u4e00-\u9fff]/.test(c);
const parse = (s) => { const [w, py, vi] = String(s).split('|'); return { w, py: py || '', vi: vi || '' }; };

/* tách pinyin liền (xièxie, nǚ'ér) thành âm tiết theo bảng âm tiết hợp lệ */
const grid = J('data/pinyin-grid.json');
const SYL = new Set(Object.values(grid.cells).map((c) => c.s));
for (const extra of ['r', 'er', 'ng', 'm', 'n', 'hm', 'yo', 'lo', 'me', 'ne', 'le', 'de', 'ma', 'ba', 'zi', 'men', 'ge', 'la', 'ya', 'wa', 'nga']) SYL.add(extra);
const plainOf = (s) => [...s.normalize('NFC')].map((c) => { const k = MARKS.indexOf(c); return k >= 0 ? 'aeiouü'[Math.floor(k / 4)] : c; }).join('');
function splitPy(word) {
  const out = [];
  for (const part of word.toLowerCase().split(/[\s']+/).filter(Boolean)) {
    const p = plainOf(part);
    // quy hoạch động: tách thành dãy âm tiết hợp lệ, ưu tiên ít âm tiết
    const best = Array(p.length + 1).fill(null); best[0] = [];
    for (let i = 0; i < p.length; i++) {
      if (!best[i]) continue;
      for (let j = i + 1; j <= Math.min(p.length, i + 6); j++) {
        if (SYL.has(p.slice(i, j)) && (!best[j] || best[j].length > best[i].length + 1)) best[j] = [...best[i], [i, j]];
      }
    }
    if (!best[p.length]) return null;
    for (const [i, j] of best[p.length]) out.push(part.slice(i, j));
  }
  return out;
}

const audio = { zh: new Set(), en: new Set() };
const warn = [];

function checkZh(L) {
  const each = (s, where) => {
    const it = parse(s);
    if (!it.w) return;
    audio.zh.add(it.w);
    const chars = [...it.w].filter(isHan).length;
    if (!/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]/i.test(it.py) || /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữự]/i.test(it.py)) return; // mục kiểu "Câu kể"
    const syl = splitPy(it.py.replace(/\//g, ' ').replace(/[，,。.！!？?]/g, ' '));
    const n = syl ? syl.filter((x) => x !== 'r').length : -1;
    // 儿化 (nǎr) gộp r vào âm trước nên số âm tiết ít hơn số chữ một
    const erhua = /儿/.test(it.w) && /r\b/.test(plainOf(it.py));
    if (syl && n !== chars && !(erhua && n === chars - 1) && !(erhua && n === chars)) warn.push(`${where}: ${it.w} ↔ ${it.py} (${chars} chữ, ${n} âm tiết)`);
    if (!syl) warn.push(`${where}: không tách được pinyin "${it.py}"`);
  };
  L.warm.items.forEach((s) => each(s, `bài ${L.id} khởi động`));
  for (const S of L.secs) {
    if (S === 'break') continue;
    (S.ex || []).forEach((s) => each(s, `bài ${L.id} ${S.title}`));
    for (const d of S.drill || []) {
      for (const s of d.items || []) each(Array.isArray(s) ? s[0] : s, `bài ${L.id} luyện ${S.title}`);
      for (const pr of d.pairs || []) pr.forEach((s) => each(s, `bài ${L.id} cặp ${S.title}`));
    }
  }
  (L.speak || []).forEach((s) => each(s, `bài ${L.id} nói`));
  if (L.game?.items) L.game.items.forEach(([s]) => audio.zh.add(parse(s).w));
}
function checkEn(L) {
  const each = (s) => { const it = parse(s); if (it.w) audio.en.add(it.w); };
  L.warm.items.forEach(each);
  for (const S of L.secs) {
    if (S === 'break') continue;
    (S.ex || []).forEach(each);
    for (const d of S.drill || []) {
      for (const s of d.items || []) each(Array.isArray(s) ? s[0] : s);
      for (const pr of d.pairs || []) pr.forEach(each);
      if (d.t === 'pick' && d.by !== 'py') for (const row of d.items) row.slice(1).forEach((w) => audio.en.add(w));
    }
  }
  (L.speak || []).forEach(each);
  if (L.game?.items) L.game.items.forEach(([s]) => each(s));
}

const zh = await load('data-src/pron/zh.mjs');
/* bài luyện tổ hợp thanh: ghi sẵn mẫu thanh vào trường thứ 4 */
const tonesOf = (py) => { const syl = splitPy(py); return syl ? syl.filter((x) => x !== 'r').map(toneOf).join('-') : null; };
for (const L of zh.lessons) for (const S of L.secs) {
  if (S === 'break') continue;
  for (const d of S.drill || []) {
    if (d.t !== 'combo') continue;
    d.items = d.items.map((s) => { const it = parse(s); const tn = tonesOf(it.py); if (!tn) warn.push(`không tách được ${it.py}`); return `${it.w}|${it.py}|${it.vi}|${tn || ''}`; });
  }
}
const en = await load('data-src/pron/en.mjs');
zh.lessons.forEach(checkZh);
en.lessons.forEach(checkEn);
for (const g of en.ipa) for (const x of g.items) x.w.split(' ').forEach((w) => audio.en.add(w));

/* 20 tổ hợp thanh: lấy từ hai chữ thông dụng trong từ điển của app */
const dictRaw = J('data/zh-dict.json');
const dict = Array.isArray(dictRaw) ? dictRaw : Object.entries(dictRaw);
const hskRaw = J('data/hsk2025.json');
const lv = Array.isArray(hskRaw) ? Object.fromEntries(hskRaw) : hskRaw;
const PATS = [];
for (const a of [1, 2, 3, 4]) for (const b of [1, 2, 3, 4, 0]) PATS.push([a, b]);
const byPat = new Map(PATS.map((p) => [p.join('-'), []]));
for (const [w, v] of dict) {
  if ([...w].length !== 2 || !/^[\u4e00-\u9fff]{2}$/.test(w)) continue;
  const py = v[0];
  const syl = splitPy(py);
  if (!syl || syl.length !== 2 || syl.includes('r')) continue;
  const k = `${toneOf(syl[0])}-${toneOf(syl[1])}`;
  if (!byPat.has(k)) continue;
  const level = Number(lv[w] || 9);
  byPat.get(k).push({ s: `${w}|${py}|${String(v[2] || '').split(/[;,]/)[0].trim()}|${k}`, level });
}
const combos = PATS.map((p) => {
  const ws = byPat.get(p.join('-')).sort((x, y) => x.level - y.level).slice(0, 6).map((x) => x.s);
  ws.forEach((s) => audio.zh.add(parse(s).w));
  return { p, words: ws };
});
for (const [a, b] of PATS) zh.tags[`combo-${a} + ${b || 'nhẹ'}`] = `Tổ hợp thanh ${a} + ${b || 'nhẹ'}`;

/* chữ trong bảng pinyin */
for (const c of Object.values(grid.cells)) for (const [ch] of Object.values(c.t)) audio.zh.add(ch);
for (const r of grid.rows) if (r.say) audio.zh.add(r.say);
for (const g of grid.groups) for (const f of g.finals) if (f.say) audio.zh.add(f.say);

fs.mkdirSync(path.join(ROOT, 'data/pron'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'data/pron/zh.json'), JSON.stringify(zh));
fs.writeFileSync(path.join(ROOT, 'data/pron/en.json'), JSON.stringify(en));
fs.writeFileSync(path.join(ROOT, 'data/pron/combos.json'), JSON.stringify(combos));
fs.writeFileSync(path.join(ROOT, 'data-src/pron-audio.json'), JSON.stringify({ zh: [...audio.zh], en: [...audio.en] }));

console.log(`Tiếng Trung: ${zh.lessons.length} bài · tiếng Anh: ${en.lessons.length} bài · tổ hợp thanh: ${combos.map((c) => c.words.length).join(' ')}`);
console.log(`Câu cần giọng: zh ${audio.zh.size}, en ${audio.en.size}`);
if (warn.length) console.log('Cần xem lại:\n  ' + warn.join('\n  '));
