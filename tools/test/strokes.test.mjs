// Soát hàng loạt phần Viết chữ Hán (anh Han yêu cầu "chuẩn từng nét", 25/11/2026), cho MỌI chữ trong data/strokes:
//   1. chỉ mục trỏ tới tệp nào thì tệp đó phải có nét của chữ (lỗi cũ: 644 chữ trỏ vào l10 / l11 mà không có nét)
//   2. viết đúng theo đường xương sống của từng nét (có rung tay nhẹ) thì nét nào cũng được chấm đạt
//   3. viết ngược chiều nét dài thì bị báo sai chiều; viết nét khác (sai thứ tự) không được tính là nét đang cần
//   4. chữ trong bài học, bộ thủ, nhiệm vụ Viết chữ của game đều có nét
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { loadGame, ok, eq, done } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SD = path.join(ROOT, 'data/strokes');
const J = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const G = loadGame(['js/pen.js'], { MutationObserver: function () { return { observe() {} }; }, getComputedStyle: () => ({ getPropertyValue: () => '' }) });
const P = G.Pen;
const idx = J(path.join(SD, 'index.json'));
const shards = {};
const data = (c) => { const f = idx[c]; shards[f] = shards[f] || J(path.join(SD, f + '.json')); return shards[f][c]; };

// 1. chỉ mục khớp tệp
const noData = Object.keys(idx).filter((c) => !data(c));
eq('chữ trong chỉ mục mà tệp không có nét', noData.slice(0, 20).join(''), '');

// 2–3. chấm từng nét của từng chữ
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
function hand(m, jit) {   // nét người viết: chia nhỏ đường mẫu như ngón tay kéo, rung nhẹ jit đơn vị (hệ 1024)
  const pts = [];
  for (let i = 0; i < m.length; i++) {
    if (!i) { pts.push([m[0][0] + rnd() * jit, m[0][1] + rnd() * jit]); continue; }
    for (let t = 1; t <= 4; t++) pts.push([m[i - 1][0] + (m[i][0] - m[i - 1][0]) * t / 4 + rnd() * jit, m[i - 1][1] + (m[i][1] - m[i - 1][1]) * t / 4 + rnd() * jit]);
  }
  return pts;
}
const len = (m) => { let s = 0; for (let i = 1; i < m.length; i++) s += Math.hypot(m[i][0] - m[i - 1][0], m[i][1] - m[i - 1][1]); return s; };
let strokes = 0, failOk = [], revLong = 0, revMissed = [], orderWrong = [];
for (const c of Object.keys(idx)) {
  const d = data(c); if (!d) continue;
  const mv = d.m.map((m) => m.map((p) => [p[0], 900 - p[1]]));
  for (let i = 0; i < mv.length; i++) {
    strokes++;
    const r = P.gradeInOrder(hand(mv[i], 14), mv, i, 'vua');
    if (!r.pass) failOk.push(c + (i + 1));
    // ngược chiều: chỉ soát nét đủ dài (chấm, nét móc ngắn thì đầu và cuối gần nhau, khó nói chiều)
    if (len(mv[i]) >= 220) {
      revLong++;
      const rv = P.gradeInOrder(hand(mv[i].slice().reverse(), 6), mv, i, 'vua');
      if (rv.pass) revMissed.push(c + (i + 1));
    }
    // sai thứ tự: viết đúng nét sau (khác hẳn chỗ) khi đang cần nét i thì không được đạt
    if (i + 1 < mv.length) {
      const other = mv[i + 1];
      const far = Math.hypot(other[0][0] - mv[i][0][0], other[0][1] - mv[i][0][1]) + Math.hypot(other[other.length - 1][0] - mv[i][mv[i].length - 1][0], other[other.length - 1][1] - mv[i][mv[i].length - 1][1]);
      if (far > 300) { const ro = P.gradeInOrder(hand(other, 6), mv, i, 'vua'); if (ro.pass) orderWrong.push(c + (i + 1)); }
    }
  }
}
console.log('  ' + Object.keys(idx).length + ' chữ · ' + strokes + ' nét · soát ngược chiều ' + revLong + ' nét dài');
eq('nét viết đúng mà bị chấm trượt', failOk.slice(0, 30).join(' '), '');
eq('nét dài viết ngược chiều mà vẫn đạt', revMissed.slice(0, 30).join(' '), '');
eq('viết nét khác (sai thứ tự) mà vẫn được tính', orderWrong.slice(0, 30).join(' '), '');

// 4. chữ trong nội dung game đều có nét
const ctx = { console }; ctx.window = ctx; ctx.G = {}; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ROOT, 'game/data')).filter((x) => /^(zh_.*|life_zh)\.js$/.test(x))) vm.runInContext(fs.readFileSync(path.join(ROOT, 'game/data', f), 'utf8'), ctx);
const need = new Set();
for (const R of Object.values(ctx.G.ROOMS || {})) if (R.lang === 'zh') {
  (R.items || []).forEach((it) => { for (const ch of String(it.zh)) if (/[㐀-鿿]/.test(ch)) need.add(ch); });
  (R.newChars || []).concat(R.write || []).forEach((ch) => need.add(ch));
}
'一二三十人大口中日月山水火木女子小上下不'.split('').forEach((ch) => need.add(ch));   // BASIC của js/write.js
const lack = [...need].filter((ch) => !idx[ch] || !data(ch));
ok('chữ trong game (' + need.size + ' chữ) đều có nét' + (lack.length ? ': thiếu ' + lack.join('') : ''), !lack.length);

process.exit(done('Viết chữ Hán từng nét') ? 1 : 0);
