/* Tầng 1 · Nền tảng của Trường Anh ngữ trong game: 30 buổi lấy từ Chặng 0 (data/en/course.json),
   mỗi buổi: 1 âm khó cho người Việt, 1 điểm ngữ pháp, 20 từ lõi (nghĩa, câu ví dụ lấy ở data/en/bank.json).
   30 buổi chia vào 4 phòng (N-1 … N-4) và phòng Thi Nền tảng (20 câu từ cả 600 từ, đạt 16/20 là tốt nghiệp).

     node tools/build-game-found.mjs      → game/data/en_found.js
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const c = J('data/en/course.json');
const bank = new Map(J('data/en/bank.json').map((r) => [r[0].toLowerCase(), r]));

// nghĩa tiếng Việt cho câu ví dụ ngữ pháp (course.json chưa có)
const GVI = {
  'I am a student.': 'Tôi là học sinh.', 'She is my friend.': 'Cô ấy là bạn tôi.', 'Are you ready?': 'Bạn sẵn sàng chưa?', 'They are not here.': 'Họ không có ở đây.',
  'He is my brother.': 'Anh ấy là anh trai tôi.', 'It is cold today.': 'Hôm nay trời lạnh.', 'We are late.': 'Chúng tôi bị muộn.', 'They work here.': 'Họ làm việc ở đây.',
  'I have a car.': 'Tôi có một chiếc ô tô.', 'She is an engineer.': 'Cô ấy là kỹ sư.', 'He bought a book.': 'Anh ấy đã mua một quyển sách.', 'It is an old house.': 'Đó là một ngôi nhà cũ.',
  'I bought a book. The book is good.': 'Tôi đã mua một quyển sách. Quyển sách đó hay.', 'Close the door, please.': 'Làm ơn đóng cửa lại.', 'The sun is hot.': 'Mặt trời nóng.', 'Where is the station?': 'Nhà ga ở đâu?',
  'two books': 'hai quyển sách', 'three boxes': 'ba cái hộp', 'five babies': 'năm em bé', 'many people': 'nhiều người',
  'This is my phone.': 'Đây là điện thoại của tôi.', 'That is her house.': 'Kia là nhà của cô ấy.', 'These books are new.': 'Mấy quyển sách này mới.', 'Those men are waiting.': 'Mấy người đàn ông kia đang đợi.',
  'I have two sisters.': 'Tôi có hai chị gái.', 'She has a new job.': 'Cô ấy có việc làm mới.', 'Do you have time?': 'Bạn có thời gian không?', 'He does not have money.': 'Anh ấy không có tiền.',
  'I work every day.': 'Tôi làm việc mỗi ngày.', 'He works in a bank.': 'Anh ấy làm ở ngân hàng.', 'We live in Nha Trang.': 'Chúng tôi sống ở Nha Trang.', 'She goes to school.': 'Cô ấy đi học.',
  'Do you like coffee?': 'Bạn có thích cà phê không?', 'Does he speak English?': 'Anh ấy có nói tiếng Anh không?', 'Where do they live?': 'Họ sống ở đâu?', 'What does she want?': 'Cô ấy muốn gì?',
  'I do not smoke.': 'Tôi không hút thuốc.', 'She does not eat meat.': 'Cô ấy không ăn thịt.', 'They are not ready.': 'Họ chưa sẵn sàng.', 'He is not at home.': 'Anh ấy không có ở nhà.',
  'I can swim.': 'Tôi biết bơi.', 'She can speak three languages.': 'Cô ấy nói được ba thứ tiếng.', 'Can you help me?': 'Bạn giúp tôi được không?', 'He cannot come today.': 'Hôm nay anh ấy không tới được.',
  'There is a book on the table.': 'Có một quyển sách trên bàn.', 'There are two cars outside.': 'Có hai chiếc ô tô ở ngoài.', 'Is there a problem?': 'Có vấn đề gì không?', 'There are no seats left.': 'Không còn ghế trống.',
  "This is Mai's bag.": 'Đây là túi của Mai.', 'My name is Linh.': 'Tên tôi là Linh.', 'Their house is big.': 'Nhà của họ to.', 'Is this your phone?': 'Đây có phải điện thoại của bạn không?',
  'a big house': 'một ngôi nhà to', 'two small cars': 'hai chiếc xe nhỏ', 'an interesting book': 'một quyển sách hay', 'cold water': 'nước lạnh',
  'in the room': 'trong phòng', 'on the table': 'trên bàn', 'at the station': 'ở nhà ga', 'in Vietnam': 'ở Việt Nam',
  'in July': 'vào tháng Bảy', 'in the morning': 'vào buổi sáng', 'on Monday': 'vào thứ Hai', "at seven o'clock": 'lúc bảy giờ',
  'I am reading a book.': 'Tôi đang đọc sách.', 'She is working now.': 'Bây giờ cô ấy đang làm việc.', 'They are not listening.': 'Họ không đang nghe.', 'What are you doing?': 'Bạn đang làm gì vậy?',
  'I usually walk to work.': 'Tôi thường đi bộ đi làm.', 'Today I am taking the bus.': 'Hôm nay tôi đi xe buýt.', 'He plays football on Sunday.': 'Anh ấy đá bóng vào Chủ nhật.', 'He is playing right now.': 'Anh ấy đang chơi ngay lúc này.',
  'I was tired.': 'Tôi đã mệt.', 'She was at home.': 'Cô ấy đã ở nhà.', 'They were late.': 'Họ đã đến muộn.', 'Were you there?': 'Lúc đó bạn có ở đó không?',
  'I worked yesterday.': 'Hôm qua tôi đã làm việc.', 'She called me.': 'Cô ấy đã gọi cho tôi.', 'We watched a film.': 'Chúng tôi đã xem một bộ phim.', 'They asked a question.': 'Họ đã hỏi một câu.',
  'I went home.': 'Tôi đã về nhà.', 'She had lunch.': 'Cô ấy đã ăn trưa.', 'He saw the film.': 'Anh ấy đã xem bộ phim đó.', 'We took a taxi.': 'Chúng tôi đã đi taxi.',
  'Did you go?': 'Bạn đã đi chưa?', 'She did not come.': 'Cô ấy đã không tới.', 'What did he say?': 'Anh ấy đã nói gì?', 'I did not know.': 'Tôi đã không biết.',
  'I am going to study tonight.': 'Tối nay tôi sẽ học bài.', 'She is going to buy a car.': 'Cô ấy định mua ô tô.', 'Are you going to come?': 'Bạn có định tới không?', 'It is going to rain.': 'Trời sắp mưa.',
  'I will help you.': 'Tôi sẽ giúp bạn.', 'It will be fine.': 'Rồi sẽ ổn thôi.', 'She will not agree.': 'Cô ấy sẽ không đồng ý.', 'Will you come?': 'Bạn sẽ tới chứ?',
  'What do you want?': 'Bạn muốn gì?', 'Where does she live?': 'Cô ấy sống ở đâu?', 'Why are you late?': 'Sao bạn tới muộn?', 'How much is it?': 'Cái này bao nhiêu tiền?',
  'some water': 'một ít nước', 'a lot of money': 'rất nhiều tiền', 'two bottles of water': 'hai chai nước', 'much time': 'nhiều thời gian',
  'I have some money.': 'Tôi có một ít tiền.', 'Do you have any questions?': 'Bạn có câu hỏi nào không?', 'How many people?': 'Bao nhiêu người?', 'How much water?': 'Bao nhiêu nước?',
  'She is taller than me.': 'Cô ấy cao hơn tôi.', 'This is more expensive.': 'Cái này đắt hơn.', 'My car is better.': 'Xe của tôi tốt hơn.', 'Today is worse than yesterday.': 'Hôm nay tệ hơn hôm qua.',
  'the biggest city': 'thành phố lớn nhất', 'the most beautiful place': 'nơi đẹp nhất', 'the best film': 'bộ phim hay nhất', 'the worst day': 'ngày tệ nhất',
  'I always drink coffee.': 'Tôi luôn uống cà phê.', 'She is always late.': 'Cô ấy lúc nào cũng muộn.', 'We never go there.': 'Chúng tôi không bao giờ tới đó.', 'He sometimes works at night.': 'Thỉnh thoảng anh ấy làm việc ban đêm.'
};

const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
  'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five', 'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty'];
const pad = (n) => (n < 10 ? '0' : '') + n;
const sid = (n) => 'en-n-' + pad(n);

// 4 phòng: buổi 1–8, 9–15, 16–22, 23–30
const GROUPS = [
  { id: 'en-n1', label: 'N-1', from: 1, to: 8, name: 'Câu đầu tiên' },
  { id: 'en-n2', label: 'N-2', from: 9, to: 15, name: 'Hỏi, phủ định, nơi chốn' },
  { id: 'en-n3', label: 'N-3', from: 16, to: 22, name: 'Thời gian và quá khứ' },
  { id: 'en-n4', label: 'N-4', from: 23, to: 30, name: 'Tương lai và so sánh' }
];
const groupOf = (n) => GROUPS.find((g) => n >= g.from && n <= g.to);

const rooms = {};
const missing = [];
for (let n = 1; n <= 30; n++) {
  const g = c.gram[n - 1], snd = (n - 1) % c.sounds.length, gr = groupOf(n);
  const items = c.core[n - 1].map(([w, vi]) => {
    const r = bank.get(w.toLowerCase());
    return { en: w, vi, ipa: r[1] || '', ex: r[4], exVi: r[5] };
  });
  const gex = g.ex.map((e) => { if (!GVI[e]) missing.push(e); return [e, GVI[e] || '']; });
  rooms[sid(n)] = {
    id: sid(n), lang: 'en', parent: gr.id, n,
    title: 'Buổi ' + n + ' · ' + g.t,
    teacher: 'nora',
    intro: ['Hi! Ready for lesson ' + NUM[n] + '?',
      'Buổi ' + n + ': luyện âm "' + c.sounds[snd].title + '", học ngữ pháp "' + g.t + '" và 20 từ mới. Bấm 1 · Học để bắt đầu.'],
    sound: snd,
    gram: { t: g.t, b: g.b, ex: gex },
    items,
    outro: 'Great job! See you next lesson.'
  };
}
if (missing.length) { console.error('Thiếu nghĩa câu ngữ pháp:', missing); process.exit(1); }

for (const gr of GROUPS) {
  const list = [];
  for (let n = gr.from; n <= gr.to; n++) list.push(sid(n));
  rooms[gr.id] = {
    id: gr.id, lang: 'en', group: list, label: gr.label,
    title: gr.label + ' · ' + gr.name + ' (buổi ' + gr.from + '–' + gr.to + ')',
    teacher: 'nora',
    intro: ['Hi! I\'m Ms. Nora. Let\'s build your English, step by step.',
      'Phòng ' + gr.label + ' có ' + list.length + ' buổi. Mỗi buổi: 1 âm khó, 1 điểm ngữ pháp, 20 từ mới, rồi luyện và kiểm tra (đạt 8/10 là qua buổi).'],
    items: [],
    outro: 'Great job! See you next lesson.'
  };
}
// phòng thi: 20 câu ngẫu nhiên trong 600 từ, đạt 16/20
rooms['en-n-test'] = {
  id: 'en-n-test', lang: 'en', title: 'Thi Nền tảng · 600 từ lõi', teacher: 'kai',
  intro: ['Welcome to the final test of the Foundation floor!',
    'Bài thi 20 câu lấy ngẫu nhiên trong 600 từ lõi của 30 buổi. Đạt từ 16/20 là tốt nghiệp Nền tảng và mở Tầng 2 · A1.'],
  items: [], testN: 20, passN: 16,   // gộp 600 từ của 30 buổi lúc chạy (cuối tệp), không chép hai lần
  final: { lang: 'en', level: 'Nền tảng', levelEn: 'the Foundation level' },
  outro: 'Amazing! You finished the Foundation level!'
};

const sounds = c.sounds.map((s) => ({ title: s.title, why: s.why, how: s.how, pairs: s.pairs }));
const js = '/* Tầng 1 · Nền tảng (A0 → A1) của Trường Anh ngữ: 30 buổi trong 4 phòng N-1 … N-4 và phòng Thi Nền tảng.\n' +
  '   Mỗi buổi: 1 âm khó cho người Việt (G.FOUND_SOUNDS), 1 điểm ngữ pháp, 20 từ lõi có câu ví dụ.\n' +
  '   Tạo tự động từ data/en/course.json và data/en/bank.json bằng tools/build-game-found.mjs — đừng sửa tay. */\n' +
  'var G = window.G || (window.G = {});\nG.ROOMS = G.ROOMS || {};\n' +
  'G.FOUND_SOUNDS = ' + JSON.stringify(sounds) + ';\n' +
  Object.values(rooms).map((r) => "G.ROOMS['" + r.id + "'] = " + JSON.stringify(r) + ';').join('\n') + '\n' +
  "(function () { var a = [], i; for (i = 1; i <= 30; i++) a = a.concat(G.ROOMS['en-n-' + (i < 10 ? '0' : '') + i].items); G.ROOMS['en-n-test'].items = a; })();\n";
fs.writeFileSync(path.join(ROOT, 'game/data/en_found.js'), js);
console.log('game/data/en_found.js', Math.round(js.length / 1024), 'KB ·', Object.keys(rooms).length, 'phòng/buổi');
