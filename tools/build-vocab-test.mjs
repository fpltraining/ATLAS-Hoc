// Kho từ cho phần "Từ vựng" của bài kiểm tra đầu vào (game/data/vocab_test_en.js), kiểu Có/Không như
// Duolingo English Test ("Read and Select") và LexTALE: mỗi cấp một màn 12 từ (8 từ thật + 4 từ giả),
// người học chạm từ mình biết nghĩa; chạm từ giả bị trừ điểm; vài từ đã chạm được hỏi lại nghĩa để kiểm chứng.
// Mỗi cấp một kho từ thật [từ, nghĩa] và một kho từ giả (đã soát không có trong từ điển 275.000 từ tiếng Anh):
//   1 Pre-A1: Tầng 1 Nền tảng buổi 1–15   2 A1: Tầng 1 buổi 16–30   3 A2: từ đơn ở các phòng A2 + từ chủ đề đời sống mức 1
//   4 B1: kho từ ATLAS nhóm b1b2 mức 3   5 B2: kho từ ATLAS nhóm b1b2 mức 4
// Bỏ từ có nghĩa trùng nhau trong cùng kho (vd. can / may / possible đều là "có thể") để không có hai đáp án đúng.
// Mọi từ đã có giọng đọc (data/audio.json). Chạy: node tools/build-vocab-test.mjs (từ thư mục gốc)
import fs from 'fs';
import vm from 'vm';

const ctx = { window: {} }; ctx.window.G = {}; ctx.G = ctx.window.G; vm.createContext(ctx);
for (const f of ['game/data/en_found.js', 'game/data/en_a2.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const R = ctx.G.ROOMS;
const bank = JSON.parse(fs.readFileSync('data/en/bank.json', 'utf8'));

function roomItems(ids, maxWords) {
  const out = [];
  ids.forEach((id) => (R[id] ? R[id].items : []).forEach((it) => { if (it.en && it.vi && it.en.split(/\s+/).length <= maxWords) out.push([it.en === 'I' ? it.en : it.en.replace(/[.!]$/, '').toLowerCase(), it.vi]); }));
  return out;
}
const range = (pre, a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(pre + (i < 10 ? '0' : '') + i); return r; };
const a2 = Object.keys(R).filter((id) => /^en-a2-\d+$/.test(id));

// trộn cố định (để chạy lại ra cùng tệp)
function shuffle(a, seed) { let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280; const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
function clean(list, n, seed) {
  const seenEn = new Set(), byVi = {};
  list = list.filter(([en, vi]) => !/[…]|\.\.\./.test(en + vi) && !/[?!]$/.test(en) && !/[A-Z'-]/.test(en) && en.length >= 2);   // từ giả viết thường, nên từ thật cũng viết thường
  list.forEach(([, vi]) => { const k = vi.toLowerCase().split(/[,;/(]/)[0].trim(); byVi[k] = (byVi[k] || 0) + 1; });
  const out = [];
  list.forEach(([en, vi]) => {
    const k = vi.toLowerCase().split(/[,;/(]/)[0].trim();
    if (byVi[k] > 1 || seenEn.has(en.toLowerCase())) return;
    seenEn.add(en.toLowerCase()); out.push([en, vi.replace(/\s*\([^)]*\)/g, '').trim()]);   // bỏ ghi chú trong ngoặc: phương án không bị dài lệch
  });
  return shuffle(out, seed).slice(0, n);
}

const POOLS = {
  1: clean(roomItems(range('en-n-', 1, 15), 1), 60, 11),
  2: clean(roomItems(range('en-n-', 16, 30), 1), 60, 22),
  3: clean(roomItems(a2, 1).concat(bank.filter((r) => ['money', 'sales', 'workplace', 'business', 'time'].indexOf(r[6]) >= 0 && r[7] === 1 && !/\s/.test(r[0])).map((r) => [r[0], r[3]])), 60, 33),
  4: clean(bank.filter((r) => r[6] === 'b1b2' && r[7] === 3 && !/\s/.test(r[0])).map((r) => [r[0], r[3]]), 60, 44),
  5: clean(bank.filter((r) => r[6] === 'b1b2' && r[7] === 4 && !/\s/.test(r[0])).map((r) => [r[0], r[3]]), 60, 55)
};
// từ giả: ngắn cho cấp thấp, dài dần cho cấp cao (giống độ dài từ thật cùng cấp)
const FAKE = {
  1: 'blim tosk drob glup mave frod clom wunt brask jorn vasp nerb quob grisk plad smub fask'.split(' '),
  2: 'wilp crent zorp molp snade prelt stog brone cleap slont treb gront mirp nolt plome'.split(' '),
  3: 'plound fravine gristment mirthage quandrel saliment candrous coltric ramplish wondrance belousy jestive frontive kindrous scarvish obstrual opilent abdrent motivous cratiful'.split(' '),
  4: 'mensible abrasent dismalate contravish plastoric rendolent morbulate intrepate prevolate consortive harbition malvorous perlucid hostulate'.split(' '),
  5: 'proctalize ferrication delumpable unflestive normastic outvestment prenivate querulate restimony scrambulous umbrative virtuant disperish exmolate'.split(' ')
};
fs.writeFileSync('game/data/vocab_test_en.js',
  '/* Kho từ phần Từ vựng của bài kiểm tra đầu vào (cấp 1 Pre-A1 … 5 B2). Tự sinh bởi tools/build-vocab-test.mjs, đừng sửa tay. */\n' +
  'var G = window.G || (window.G = {});\nG.VOCAB_TEST_EN = ' + JSON.stringify(POOLS) + ';\nG.VOCAB_FAKE_EN = ' + JSON.stringify(FAKE) + ';\n');
Object.keys(POOLS).forEach((k) => console.log('cấp', k, POOLS[k].length, 'từ ·', POOLS[k].slice(0, 6).map((x) => x[0] + '=' + x[1]).join(' | ')));
