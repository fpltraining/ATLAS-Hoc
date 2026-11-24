// Đếm giờ học thật mà app đang có cho từng tầng tiếng Anh (game/data/content_en.js), để Lộ trình nói thật:
// "bài trong app khoảng X giờ" bên cạnh số giờ cần để vững cấp theo chuẩn quốc tế (G.ROADMAP_EN[].hours).
// Cách tính (phút), cố ý tính rộng tay để không nói quá ít:
//   buổi học: 1,2 phút / câu (nghe, nhại, thẻ) + 10 phút luyện + 5 phút kiểm tra
//   ôn lặp lại: 1,5 phút / câu (khoảng 6 lần ôn × 15 giây)
//   thi cuối tầng: 30 phút (20 câu hiểu + 5 tình huống nói + chuẩn bị)
//   hội thoại ngoài phố: 6 phút / cuộc (nói + nghe lại); nói tự do: 3 phút / đề
//   truyện: số chữ / 50 + 3 phút mỗi chương (đọc, nghe cả chương, câu hỏi, nói thử); A1 → Tầng 2, A2 → Tầng 3, B1–B2 → Tầng 4
//   khoá phát âm: 1 phút / cặp từ, tính vào Tầng 1
// Từ theo chủ đề tính riêng (G.topicHours). Chạy: node tools/build-content-hours.mjs (từ thư mục gốc)
import fs from 'fs';
import vm from 'vm';

const ctx = { window: {} }; ctx.window.G = {}; ctx.G = ctx.window.G; vm.createContext(ctx);
for (const f of ['en_found', 'en_a1', 'en_a1_more', 'en_a2', 'en_b1', 'cert_en', 'final_en', 'life', 'life_morning', 'life_school', 'life_after', 'pron_en', 'practice_en'])
  vm.runInContext(fs.readFileSync(`game/data/${f}.js`, 'utf8'), ctx);
const G = ctx.G;
const floorOf = (id) => /^en-n/.test(id) ? 1 : /^en-a1/.test(id) ? 2 : /^en-a2/.test(id) ? 3 : /^en-b1/.test(id) ? 4 : 0;
const C = {}; [1, 2, 3, 4].forEach((f) => { C[f] = { bai: 0, on: 0, thi: 0, noi: 0, doc: 0, buoi: 0, cau: 0, hoiThoai: 0, chuong: 0 }; });

for (const id in G.ROOMS) {
  const r = G.ROOMS[id], f = floorOf(id);
  if (!f || r.lang !== 'en' || r.group) continue;
  if (/test/.test(id)) { C[f].thi += 30; continue; }
  const n = (r.items || []).length;
  C[f].bai += n * 1.2 + 15; C[f].on += n * 1.5; C[f].buoi++; C[f].cau += n;
}
// hội thoại: nơi có điều kiện mở theo phòng thì tính vào tầng của phòng đó, còn lại chia đều Tầng 1–3 (đời sống A1–B1)
let free = 0;
for (const k in G.LIFE) {
  const L = G.LIFE[k]; if (L.lang !== 'en') continue;
  const n = (L.talks || []).length, f = L.unlock ? floorOf(L.unlock) : 0;
  if (f) { C[f].noi += n * 6; C[f].hoiThoai += n; } else free += n;
}
[1, 2, 3].forEach((f) => { C[f].noi += free * 6 / 3; C[f].hoiThoai += free / 3; });
(G.FREE_TALK || []).forEach((_, i) => { C[(i % 3) + 2].noi += 3; });
if (G.PRON_EN && G.PRON_EN.pairs) for (const k in G.PRON_EN.pairs) C[1].bai += G.PRON_EN.pairs[k].length;
const LVF = { A1: 2, A2: 3, B1: 4, B2: 4 };
for (const s of JSON.parse(fs.readFileSync('data/stories/index.json', 'utf8'))) {
  if (s.lang !== 'en' || !LVF[s.level]) continue;
  for (const ch of s.chapters) { C[LVF[s.level]].doc += (ch.words || 150) / 50 + 3; C[LVF[s.level]].chuong++; }
}
const out = {};
for (const f in C) {
  const c = C[f], min = c.bai + c.on + c.thi + c.noi + c.doc;
  out[f] = { h: Math.round(min / 60), bai: Math.round(c.bai / 60), on: Math.round(c.on / 60), noi: Math.round(c.noi / 60), doc: Math.round(c.doc / 60), thi: Math.round(c.thi / 60 * 10) / 10,
    buoi: c.buoi, cau: c.cau, hoiThoai: Math.round(c.hoiThoai), chuong: c.chuong };
}
fs.writeFileSync('game/data/content_en.js', '/* Giờ học thật mà app đang có cho từng tầng tiếng Anh (h = tổng giờ; bai, on, noi, doc, thi = giờ từng phần).\n' +
  '   Tự sinh bởi tools/build-content-hours.mjs, đừng sửa tay. */\nvar G = window.G || (window.G = {});\nG.CONTENT_EN = ' + JSON.stringify(out) + ';\n');
for (const f in out) console.log('Tầng', f, JSON.stringify(out[f]), '· chuẩn', (G.ROADMAP_EN[f - 1] || {}).hours, 'giờ');
