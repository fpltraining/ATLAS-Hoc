// Soát bài kiểm tra đầu vào (game/data/placement_en.js): đáp án đúng không được hay là câu dài nhất
// (người làm bài chọn câu dài nhất mà vẫn lên cấp là bài hỏng). Cấp A2 trở lên: tối đa 3/10 câu có đáp án đúng dài nhất.
// Chạy: node tools/placement-check.mjs (từ thư mục gốc)
import fs from 'fs';
import vm from 'vm';
const ctx = { window: {} }; ctx.window.G = {}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync('game/data/placement_en.js', 'utf8'), ctx);
const P = ctx.window.G.PLACE_EN;
let bad = 0;
for (const k of ['nghe', 'doc', 'gt']) {
  const by = {};
  P[k].forEach((it) => {
    const L = it.o.map((s) => s.length), mx = Math.max(...L);
    const b = by[it.lv] || (by[it.lv] = { n: 0, long: 0, avgRatio: 0 });
    b.n++; if (L[0] === mx && L.filter((x) => x === mx).length === 1) b.long++;
    b.avgRatio += L[0] / (L.slice(1).reduce((a, x) => a + x, 0) / 3);
  });
  for (const lv of Object.keys(by)) {
    const b = by[lv], ok = lv < 3 || b.long <= 3;
    if (!ok) bad++;
    console.log(k.padEnd(5), 'cấp', lv, '· đáp án đúng dài nhất', b.long + '/' + b.n, '· dài gấp', (b.avgRatio / b.n).toFixed(2), 'lần phương án sai', ok ? '' : '  ← lệch');
  }
}
console.log(bad ? '\n' + bad + ' cấp bị lệch độ dài' : '\nĐạt: không cấp nào lệch độ dài');
process.exit(bad ? 1 : 0);
