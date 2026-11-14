// Dựng bảng pinyin có âm thanh: thanh mẫu × vận mẫu, mỗi ô một âm tiết,
// mỗi thanh có một chữ Hán ví dụ (chữ thông dụng, chỉ có một cách đọc) để giọng AI đọc đúng.
// Cách chạy: node tools/build-pinyin-grid.mjs  → data/pinyin-grid.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const fullRaw = J('data/zh-full.json');
const full = Array.isArray(fullRaw) ? fullRaw : Object.entries(fullRaw);
const hskRaw = J('data/hsk2025.json');
const levels = Array.isArray(hskRaw) ? Object.fromEntries(hskRaw) : hskRaw;
const dictRaw = J('data/zh-dict.json');
const dict = new Map(Array.isArray(dictRaw) ? dictRaw : Object.entries(dictRaw));

const MARKS = { ā: 'a1', á: 'a2', ǎ: 'a3', à: 'a4', ē: 'e1', é: 'e2', ě: 'e3', è: 'e4', ī: 'i1', í: 'i2', ǐ: 'i3', ì: 'i4', ō: 'o1', ó: 'o2', ǒ: 'o3', ò: 'o4', ū: 'u1', ú: 'u2', ǔ: 'u3', ù: 'u4', ǖ: 'ü1', ǘ: 'ü2', ǚ: 'ü3', ǜ: 'ü4' };
export function splitTone(py) {
  let tone = 0, base = '';
  for (const ch of py.toLowerCase().normalize('NFC')) {
    if (MARKS[ch]) { base += MARKS[ch][0]; tone = Number(MARKS[ch][1]); } else base += ch;
  }
  return { base: base.replace(/v/g, 'ü'), tone };
}

/* chữ tốt nhất cho mỗi âm tiết + thanh */
const best = new Map();
for (const [ch, readings] of full) {
  if ([...ch].length !== 1) continue;
  const { base, tone } = splitTone(readings[0][0]);
  if (!tone || !/^[a-zü]+$/.test(base)) continue;
  const single = readings.length === 1;
  const lv = Number(levels[ch] || 0);
  // điểm: chữ có trong HSK cấp thấp tốt nhất, sau đó chữ có trong từ điển app, chỉ một cách đọc được cộng thêm
  const glosses = (readings[0][1] || []).filter((g) => !/^(biến thể|\(|dạng|xem )/.test(g));
  const interj = /thán từ|trợ từ|tiếng kêu|từ tượng thanh/.test((readings[0][1] || []).join(' '));
  const score = (lv ? 100 - lv * 8 : 0) + (dict.has(ch) ? 20 : 0) + (single ? 60 : 0) - (interj ? 50 : 0);
  const k = `${base}${tone}`;
  const cur = best.get(k);
  const d = dict.get(ch);
  const vi = (Array.isArray(d) ? d[2] : '') || glosses[0] || '';
  if (!cur || score > cur.score) best.set(k, { ch, score, vi: vi.split(/[;,]/)[0].trim() });
}

/* chỉnh tay vài ô: tránh thán từ đa âm, chọn chữ người học hay gặp */
const OVERRIDE = { e2: ['鹅', 'con ngỗng'], en1: ['恩', 'ơn'], a1: ['阿', 'tiếng gọi thân mật (阿姨)'], e3: null, o2: null, o4: null };
for (const [k, v] of Object.entries(OVERRIDE)) {
  if (v === null) best.delete(k); else best.set(k, { ch: v[0], score: 999, vi: v[1] });
}

const INITIALS = [
  ['', 'Không phụ âm', ''],
  ['b', 'Môi', 'Như "p" tiếng Việt (không bật hơi), không phải "b" kêu trong cổ.'],
  ['p', 'Môi', 'Như "p" nhưng BẬT HƠI mạnh: để tờ giấy trước miệng phải rung.'],
  ['m', 'Môi', 'Như "m" tiếng Việt.'],
  ['f', 'Môi', 'Như "ph" tiếng Việt.'],
  ['d', 'Đầu lưỡi', 'Như "t" tiếng Việt (không bật hơi), không phải "đ".'],
  ['t', 'Đầu lưỡi', 'Như "th" tiếng Việt: BẬT HƠI.'],
  ['n', 'Đầu lưỡi', 'Như "n" tiếng Việt. Đừng lẫn với l.'],
  ['l', 'Đầu lưỡi', 'Như "l" tiếng Việt.'],
  ['g', 'Cuống lưỡi', 'Như "c/k" tiếng Việt (không bật hơi), không phải "g".'],
  ['k', 'Cuống lưỡi', 'Như "kh" nhưng là BẬT HƠI: "k" kèm luồng hơi mạnh.'],
  ['h', 'Cuống lưỡi', 'Như "h" nhưng ráp ở cuống lưỡi, nghe hơi giống "kh".'],
  ['j', 'Mặt lưỡi', 'Gần "ch" tiếng Việt, mặt lưỡi áp ngạc cứng, không bật hơi.'],
  ['q', 'Mặt lưỡi', 'Như j nhưng BẬT HƠI: "ch" kèm luồng hơi.'],
  ['x', 'Mặt lưỡi', 'Gần "x" tiếng Việt nhưng mặt lưỡi nâng lên, môi dẹt như cười.'],
  ['zh', 'Uốn lưỡi', 'Gần "tr" tiếng Việt chuẩn, đầu lưỡi uốn lên, không bật hơi.'],
  ['ch', 'Uốn lưỡi', 'Như zh nhưng BẬT HƠI.'],
  ['sh', 'Uốn lưỡi', 'Gần "s" tiếng Việt chuẩn (uốn lưỡi), không phải "x".'],
  ['r', 'Uốn lưỡi', 'Uốn lưỡi như sh nhưng rung dây thanh, gần "r" miền Bắc đọc nhẹ, KHÔNG phải "l".'],
  ['z', 'Đầu lưỡi phẳng', 'Như "ch" đọc dẹt: đầu lưỡi chạm sau răng trên, không bật hơi.'],
  ['c', 'Đầu lưỡi phẳng', 'Như z nhưng BẬT HƠI: "ts" kèm luồng hơi.'],
  ['s', 'Đầu lưỡi phẳng', 'Như "x" tiếng Việt, lưỡi phẳng sau răng.'],
];
const GROUPS = [
  ['Vần đơn · vần kép', [
    ['a', 'Như "a" tiếng Việt, mở miệng rộng.'], ['o', 'Như "ô" hơi tròn môi, sau b p m f đọc gần "uô".'],
    ['e', 'Giữa "ơ" và "ưa": đọc "ơ" rồi lùi lưỡi về sau.'], ['-i', 'Sau z c s: lưỡi giữ yên như "ư"; sau zh ch sh r: lưỡi uốn, giống "ư" kéo dài.'],
    ['er', 'Đọc "ơ" rồi cuộn đầu lưỡi lên.'], ['ai', 'Như "ai".'], ['ei', 'Như "ây".'], ['ao', 'Như "ao".'], ['ou', 'Như "âu".'],
  ]],
  ['Vần mũi', [
    ['an', 'Như "an".'], ['en', 'Như "ân".'], ['ang', 'Như "ang", miệng mở rộng.'], ['eng', 'Như "âng".'], ['ong', 'Như "ung" tròn môi.'],
  ]],
  ['Vần bắt đầu bằng i', [
    ['i', 'Như "i", môi dẹt.'], ['ia', 'Như "ia" đọc nhanh: "i-a".'], ['ie', 'Như "iê".'], ['iao', 'Như "eo" nhưng đọc "i-ao".'],
    ['iu', 'Viết iu, đọc "i-âu" (iou).'], ['ian', 'Đọc "iên", KHÔNG phải "i-an".'], ['in', 'Như "in".'], ['iang', 'Như "i-ang".'],
    ['ing', 'Như "inh" nhưng mũi hơn.'], ['iong', 'Như "i-ung".'],
  ]],
  ['Vần bắt đầu bằng ü', [
    ['ü', 'Môi tròn như "u" nhưng lưỡi đặt như "i". Sau j q x viết thành u.'], ['üe', 'Đọc "uy-ê".'], ['üan', 'Đọc "uy-en".'], ['ün', 'Đọc "uyn".'],
  ]],
  ['Vần bắt đầu bằng u', [
    ['u', 'Như "u", tròn môi.'], ['ua', 'Như "oa".'], ['uo', 'Như "uô".'], ['uai', 'Như "oai".'], ['ui', 'Viết ui, đọc "uây" (uei).'],
    ['uan', 'Như "oan".'], ['un', 'Viết un, đọc "uân" (uen).'], ['uang', 'Như "oang".'], ['ueng', 'Đọc "uâng", chỉ có weng.'],
  ]],
];

/* ghép chữ theo quy tắc chính tả pinyin */
const ZERO = { i: 'yi', ia: 'ya', ie: 'ye', iao: 'yao', iu: 'you', ian: 'yan', in: 'yin', iang: 'yang', ing: 'ying', iong: 'yong',
  u: 'wu', ua: 'wa', uo: 'wo', uai: 'wai', ui: 'wei', uan: 'wan', un: 'wen', uang: 'wang', ueng: 'weng',
  ü: 'yu', üe: 'yue', üan: 'yuan', ün: 'yun' };
function spell(ini, fin) {
  if (!ini) return fin === '-i' ? null : (ZERO[fin] || fin);
  if (fin === '-i') return ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'].includes(ini) ? ini + 'i' : null;
  if (fin === 'ueng') return null;
  if (fin.startsWith('ü')) {
    if (['j', 'q', 'x'].includes(ini)) return ini + 'u' + fin.slice(1);
    if (['n', 'l'].includes(ini)) return ini + fin;
    return null;
  }
  if (fin === 'i' && ['zh', 'ch', 'sh', 'r', 'z', 'c', 's'].includes(ini)) return null;
  return ini + fin;
}

const cells = {};
let total = 0;
for (const [ini] of INITIALS) {
  for (const [, finals] of GROUPS) {
    for (const [fin] of finals) {
      const syl = spell(ini, fin);
      if (!syl) continue;
      const tones = {};
      for (const t of [1, 2, 3, 4]) {
        const b = best.get(`${syl}${t}`);
        if (b) tones[t] = [b.ch, b.vi.slice(0, 40)];
      }
      if (!Object.keys(tones).length) continue;
      cells[`${ini}|${fin}`] = { s: syl, t: tones };
      total++;
    }
  }
}

/* âm mẫu khi bấm vào thanh mẫu, vận mẫu */
/* âm thường dùng để dạy thanh mẫu (bo po mo fo, de te ne le…), có phương án dự phòng */
const SAY_INI = { b: ['bo'], p: ['po'], m: ['mo'], f: ['fo', 'fa'], d: ['de'], t: ['te'], n: ['ne', 'na', 'nu'], l: ['le'], g: ['ge'], k: ['ke'], h: ['he'],
  j: ['ji'], q: ['qi'], x: ['xi'], zh: ['zhi'], ch: ['chi'], sh: ['shi'], r: ['ri'], z: ['zi'], c: ['ci'], s: ['si'] };
const SAY_FIN = { o: ['o', 'bo', 'mo'], ei: ['ei', 'bei', 'mei'], eng: ['eng', 'deng', 'beng'], ong: ['ong', 'dong', 'tong'], '-i': ['zi', 'si'] };
const pickAny = (sylls) => { for (const s of sylls) for (const t of [1, 2, 3, 4]) { const b = best.get(`${s}${t}`); if (b) return b.ch; } return null; };
const rows = INITIALS.map(([i, g, tip]) => ({ i, g, tip, say: i ? pickAny(SAY_INI[i]) : null }));
const groups = GROUPS.map(([name, fins]) => ({
  name,
  finals: fins.map(([f, tip]) => ({ f, tip, say: pickAny(SAY_FIN[f] || [spell('', f)]) })),
}));

fs.writeFileSync(path.join(ROOT, 'data/pinyin-grid.json'), JSON.stringify({ rows, groups, cells }));
const chars = new Set();
for (const c of Object.values(cells)) for (const [ch] of Object.values(c.t)) chars.add(ch);
for (const r of rows) if (r.say) chars.add(r.say);
for (const g of groups) for (const f of g.finals) if (f.say) chars.add(f.say);
console.log(`Âm tiết: ${total} · chữ cần giọng đọc: ${chars.size}`);
