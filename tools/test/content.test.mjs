// Dữ liệu học: Tầng 2 A1 đủ 16 buổi, tiến độ phòng A1 cũ chuyển sang buổi 1, Bắt lỗi câu hợp lệ.
import { loadGame, eq, ok, done } from './harness.mjs';
const G = loadGame(['js/util.js', 'js/save.js', 'data/en_a1.js', 'data/en_a1_more.js', 'data/fix_en.js']);
const R = G.ROOMS, ses = [];
for (let i = 1; i <= 16; i++) ses.push('en-a1-' + (i < 10 ? '0' : '') + i);
ok('16 buổi A1 đều có', ses.every((id) => R[id]));
ok('mỗi buổi có ngữ pháp và từ 12 câu', ses.every((id) => R[id].gram && R[id].gram.t && R[id].items.length >= 12));
ok('mỗi câu có nghĩa và câu ví dụ', ses.every((id) => R[id].items.every((it) => it.en && it.vi && it.ex && it.exVi)));
eq('4 phòng A1 là nhóm 4 buổi', ['en-a1-1', 'en-a1-2', 'en-a1-3', 'en-a1-4'].map((p) => R[p].group.length), [4, 4, 4, 4]);
const seen = {}; let dup = 0;
ses.forEach((id) => R[id].items.forEach((it) => { const k = it.en.toLowerCase(); if (seen[k]) dup++; seen[k] = 1; }));
eq('không có câu trùng giữa các buổi A1', dup, 0);
// tiến độ cũ: đã qua phòng A1-1, đang học dở A1-2
const store = { v: 1, nhanVat: 'han', phong: { 'en-a1-1': { diem: 9, sao: 2 } }, dangHoc: { 'en-a1-2': { the: 5 } } };
G.applySave(JSON.parse(JSON.stringify(store)));
eq('điểm phòng cũ chép sang buổi 1', G.S.phong['en-a1-01'], { diem: 9, sao: 2 });
ok('điểm phòng cũ vẫn giữ', !!G.S.phong['en-a1-1']);
eq('bài học dở chuyển sang buổi 5', G.S.dangHoc['en-a1-05'], { the: 5 });
// bắt lỗi câu
const L = G.FIX_EN;
ok('có từ 40 câu bắt lỗi', L.length >= 40);
ok('chỉ số phần sai hợp lệ', L.every((x) => x[1] >= 0 && x[1] < x[0].split('|').length));
ok('câu đúng khác câu sai', L.every((x) => G.fixSentence(x) !== x[0].split('|').join(' ')));
ok('câu đúng không có hai dấu cách liền nhau', L.every((x) => !/\s{2}/.test(G.fixSentence(x))));
ok('đủ nghĩa, giải thích, cấp', L.every((x) => x[3] && x[4] && /^B[12]$/.test(x[5])));
process.exitCode = done('Dữ liệu A1 và Bắt lỗi câu');
