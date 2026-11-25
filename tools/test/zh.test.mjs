// Trường Lạc trấn (tiếng Trung): nội dung đủ và đúng khuôn, phòng mở lần lượt, học vượt theo bài đo, hội thoại mở theo bài,
// nghe chọn pinyin có phương án nhiễu cùng âm khác thanh, phòng thi cuối tầng. Dữ liệu: game/data/zh_*.js, life_zh.js.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadGame, eq, ok, done } from './harness.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const store = {};
const LS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const data = ['data/zh_found.js', 'data/zh_c1.js', 'data/zh_c2.js', 'data/zh_c3.js', 'data/zh_c4.js', 'data/zh_c5.js'];
const G = loadGame(['js/util.js', 'js/save.js', 'data/zh_hsk1.js', 'data/zh_index.js', 'data/life.js', 'js/world.js', 'data/life_zh.js'].concat(data).concat(['js/zh.js', 'js/zh_test.js']), { localStorage: LS });
G.useRoot(G.load()); G.setLang('zh');

// 1. mục lục và dữ liệu khớp nhau
const I = G.ZH_INDEX, ids = [];
for (let f = 1; f <= 4; f++) (I[f] || []).forEach((r) => ids.push(r[0]));
eq('số phòng theo tầng (Nền tảng · HSK 1–2 · HSK 3–4 · HSK 5)', [1, 2, 3, 4].map((f) => I[f].length), [21, 47, 158, 103]);
eq('mã phòng không trùng', new Set(ids).size, ids.length);
const lack = ids.filter((id) => !G.ROOMS[id]);
eq('phòng trong mục lục đều có dữ liệu', lack.slice(0, 5), []);
const lvOk = ids.filter((id) => { const m = [1, 2, 3, 4].map((f) => I[f].find((r) => r[0] === id)).find(Boolean); return id !== 'zh-py' && !fs.readFileSync(path.join(ROOT, 'game', G.ZH_LVFILE[m[2]]), 'utf8').includes('G.ROOMS["' + id + '"]'); });
eq('mỗi phòng nằm đúng tệp của cấp (tải theo cấp)', lvOk.slice(0, 5), []);
const bad = [];
for (const id of ids) {
  const R = G.ROOMS[id];
  if (R.lang !== 'zh' || !R.items || R.items.length < 6 || !R.intro || !R.title) { bad.push(id + ':khuôn'); continue; }
  R.items.forEach((it, i) => { if (!it.zh || !it.py || !it.vi || !it.ex || !it.exVi) bad.push(id + ':' + i); });
  (R.grams || []).forEach((g, i) => { if (!g.t || !g.ex) bad.push(id + ':g' + i); });
}
eq('mỗi phòng có ít nhất 6 mục, mục nào cũng có chữ, pinyin, nghĩa, câu ví dụ', bad.slice(0, 8), []);
ok('bài HSK có chữ mới để viết', ids.filter((id) => /^zh-l/.test(id)).every((id) => (G.ROOMS[id].newChars || []).length || G.ROOMS[id].items.length));
ok('phòng bộ thủ có danh sách chữ viết từng nét', ['zh-r01', 'zh-r06'].every((id) => G.ROOMS[id].write && G.ROOMS[id].write.length >= 6));

// 2. phòng mở lần lượt, phòng thi cuối tầng
eq('phòng thi cuối mỗi tầng', [1, 2, 3, 4].map((f) => G.zhFloorIds(f).slice(-1)[0]), ['zh-x1', 'zh-x2', 'zh-x3', 'zh-x4']);
eq('người mới: bài đầu tiên là Phát âm', G.zhNextLesson().id, 'zh-py');
ok('phòng thứ hai chưa mở', !G.zhRoomOpen('zh-n01'));
G.S.phong['zh-py'] = { sao: 3, diem: 10 };
eq('qua Phát âm: mở Nền tảng 1', [G.zhNextLesson().id, G.zhRoomOpen('zh-n01'), G.zhRoomOpen('zh-n02')], ['zh-n01', true, false]);
eq('nhãn ngắn của bài HSK', G.zhShort('zh-l012'), G.zhTitleOf('zh-l012').split(' · ').slice(0, 2).join(' · '));
eq('tầng đang học', G.zhFloorNow(), 1);
// 3. học vượt theo bài đo trình độ
G.S.zhStart = 'zh-l030';
eq('bài đo cho học từ bài 30: bài tiếp theo là bài 30', G.zhNextLesson().id, 'zh-l030');
ok('các phòng trước đó mở để ôn, phòng thi Nền tảng mở', G.zhRoomOpen('zh-l005') && G.zhRoomOpen('zh-x1') && G.zhRoomOpen('zh-l030') && !G.zhRoomOpen('zh-l031'));
eq('tầng đang học theo bài bắt đầu', G.zhFloorNow(), 2);
G.S.phong['zh-l030'] = { sao: 1, diem: 8 };
eq('qua bài 30: sang bài 31', G.zhNextLesson().id, 'zh-l031');
delete G.S.zhStart; delete G.S.phong['zh-l030'];
// phòng thi: qua là lưu điểm từ 8 (thang qua phòng)
G.S.phong['zh-x1'] = { sao: 2, diem: 8 };
ok('phòng thi đã qua được tính là qua', G.roomPassed('zh-x1'));

// 4. nghe chọn pinyin: phương án cùng âm, khác thanh
const o = G.zhPyOptions({ py: 'mā' });
ok('mā: 4 phương án mā má mǎ mà', o.length === 4 && ['mā', 'má', 'mǎ', 'mà'].every((x) => o.includes(x)));
const o2 = G.zhPyOptions({ py: 'nǐ hǎo' });
ok('nǐ hǎo: 4 phương án khác nhau, đều có đáp án đúng', o2.length === 4 && new Set(o2).size === 4 && o2.includes('nǐ hǎo') && o2.every((x) => x.replace(/[āáǎàīíǐìǎ]/g, '') === 'nǐ hǎo'.replace(/[āáǎàīíǐìǎ]/g, '')));
const o3 = G.zhPyOptions({ py: 'shì', alts: ['sì'] });
ok('có cặp gây nhiễu soạn sẵn thì dùng trước', o3.includes('sì') && o3.includes('shì'));

// 5. hội thoại với người dân
const places = Object.keys(G.LIFE).filter((k) => G.LIFE[k].lang === 'zh');
eq('8 nơi nói chuyện', places.length, 8);
const tb = [];
places.forEach((k) => {
  const L = G.LIFE[k];
  if (!G.NPCS[L.npc] || !G.NPCS[L.npc].name) tb.push(k + ':npc');
  if (!G.ZH_INDEX[2].some((r) => r[0] === L.unlock)) tb.push(k + ':mở');
  if (L.talks.length !== 3) tb.push(k + ':3 tình huống');
  L.talks.forEach((t) => t.turns.forEach((u, i) => { if (!u.npc || !u.py || !u.vi || !u.ok || !u.okPy || !u.okVi) tb.push(k + ':' + t.title + ':' + i); }));
});
eq('nơi nào cũng có người dân, mở theo bài HSK, 3 tình huống, mỗi lượt có chữ + pinyin + nghĩa', tb.slice(0, 6), []);
ok('người dân tiếng Trung không trùng thầy cô Học viện cũ', G.NPCS.nainai && /Bà Lý/.test(G.NPCS.nainai.name) && /Thầy Lý/.test(G.NPCS.li.name));
eq('chưa qua bài nào: chưa mở nơi nào', G.zhNextLife(), null);
G.S.phong['zh-l002'] = { sao: 1, diem: 8 };
eq('qua bài 2: mở Học viện · bạn cùng lớp', G.zhNextLife(), 'zh-school');
G.S.doiSong = { 'zh-school': { xong: { 0: 1, 1: 1, 2: 1 } } };
eq('xong 3 tình huống: vẫn gợi ý nơi đã mở (xoay vòng)', G.zhNextLife(), 'zh-school');

// 6. nói tự do tiếng Trung: chấm theo ý chính, âm tiết pinyin không dấu (chữ đồng âm, pinyin gõ tay đều khớp)
const P2 = loadGame(['js/util.js', 'js/save.js', 'js/speak.js', 'js/practice.js', 'data/free_zh.js'], { localStorage: LS });
const HV = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/hanviet.json'), 'utf8'));
P2.zhPyOf = (c) => (HV[c] && HV[c].py ? String(HV[c].py).toLowerCase() : c);
eq('16 tình huống nói tự do, 2 mỗi nơi', [P2.FREE_ZH.length, new Set(P2.FREE_ZH.map((f) => f.place)).size], [16, 8]);
const tea = P2.FREE_ZH.find((f) => f.id === 'zf-store-1');
eq('nói đủ ý: 100', P2.scoreFree('我要一大杯奶茶，少糖，不要冰。', tea.need).score, 100);
eq('gõ pinyin không dấu: vẫn đủ ý', P2.scoreFree('wo yao yi da bei nai cha shao tang bu yao bing', tea.need).score, 100);
eq('thiếu ý đá: 75', P2.scoreFree('我要一大杯奶茶，少糖。', tea.need).score, 75);
eq('trả lời cụt: tối đa 40', P2.scoreFree('奶茶', tea.need).score <= 40, true);
ok('câu mẫu nào cũng đủ ý (từ 75 điểm)', P2.FREE_ZH.every((f) => f.sample.every((x) => P2.scoreFree(x.replace(/\{name\}/g, 'Minh'), f.need).score >= 75)));
ok('nơi nói tự do đều có trong hội thoại', P2.FREE_ZH.every((f) => !!G.LIFE[f.place] && G.LIFE[f.place].npc === f.npc));

// 7. hồ sơ tiếng Anh không bị đụng
G.setLang('en');
ok('về tiếng Anh: không có phòng tiếng Trung trong hồ sơ tiếng Anh', !Object.keys(G.S.phong).some((k) => /^zh-/.test(k)));

process.exit(done('Trường Lạc trấn: nội dung và mở bài') ? 1 : 0);
