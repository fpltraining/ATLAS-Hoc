// Dựng dữ liệu "Từ theo chủ đề" cho game từ kho từ ATLAS (15 nhóm, data/en/bank.json + data/know.json).
//   game/data/topic_en_index.js : G.TOPICS_EN = [{ id, name, ic, floor, w: [từ…] }]  (nạp cùng game, nhỏ)
//   game/data/topic_en.json     : { t: { id: [[en, ipa, pos, vi, ex, exVi, level], …] } } (tải khi mở bảng)
// Chia tầng (anh Han duyệt 24/11/2026): nền tảng, số đếm → Tầng 1; ngày giờ → Tầng 2;
// tiền, bán hàng, công sở, doanh nghiệp → Tầng 3; kinh tế … đọc tin → Tầng 4 (gắn với kệ Tin tức).
// Chạy: node tools/build-topic-game.mjs (từ thư mục gốc)
import fs from 'fs';

const J = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const bank = J('data/en/bank.json');
const know = J('data/know.json');

const FLOOR = { core: 1, numbers: 1, time: 2, money: 3, sales: 3, workplace: 3, business: 3,
  macro: 4, trade: 4, gov: 4, intl: 4, society: 4, climate: 4, tech: 4, news: 4 };
const IC = { core: 'brick', numbers: 'numbers', time: 'calendar', money: 'money', business: 'store', sales: 'cart',
  workplace: 'briefcase', macro: 'chart', trade: 'ship', gov: 'bank', intl: 'globe', society: 'people',
  climate: 'seedling', tech: 'bulb', news: 'news' };
const ORDER = ['core', 'numbers', 'time', 'money', 'sales', 'workplace', 'business', 'macro', 'trade', 'gov', 'intl', 'society', 'climate', 'tech', 'news'];

const name = {};
know.topics.forEach((t) => { name[t.id] = t.name; });

const rows = {};
ORDER.forEach((id) => { rows[id] = []; });
const seen = new Set();
bank.forEach((r, i) => {
  const id = r[6];
  if (!rows[id] || !r[0] || !r[3]) return;
  const k = r[0].toLowerCase();
  if (seen.has(k)) return;   // một từ chỉ ở một chủ đề
  seen.add(k);
  rows[id].push({ i, r: [r[0], r[1] || '', r[2] || '', r[3], r[4] || '', r[5] || '', r[7] || 1] });
});
// trong mỗi chủ đề: cấp 1 trước, giữ thứ tự gốc của ATLAS
ORDER.forEach((id) => { rows[id].sort((a, b) => (a.r[6] - b.r[6]) || (a.i - b.i)); });

const index = ORDER.map((id) => ({ id, name: name[id] || id, ic: IC[id], floor: FLOOR[id], w: rows[id].map((x) => x.r[0]) }));
const full = { v: 1, t: {} };
ORDER.forEach((id) => { full.t[id] = rows[id].map((x) => x.r); });

fs.writeFileSync('game/data/topic_en.json', JSON.stringify(full));
fs.writeFileSync('game/data/topic_en_index.js',
  '/* Từ theo chủ đề (15 nhóm từ ATLAS). Tự sinh bởi tools/build-topic-game.mjs, đừng sửa tay. */\n' +
  'var G = window.G || (window.G = {});\n' +
  'G.TOPICS_EN = ' + JSON.stringify(index) + ';\n');

let total = 0;
index.forEach((t) => { total += t.w.length; console.log('Tầng ' + t.floor, t.id.padEnd(10), String(t.w.length).padStart(4), t.name); });
console.log('Tổng', total, 'từ ·', (fs.statSync('game/data/topic_en.json').size / 1024).toFixed(0) + ' KB json ·',
  (fs.statSync('game/data/topic_en_index.js').size / 1024).toFixed(0) + ' KB index');
