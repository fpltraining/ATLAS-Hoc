/* Dữ liệu bắt lỗi phát âm cho game ConnectLife (game/data/pron_en.js).

     node tools/build-pron-game.mjs

   Lấy các cặp từ tối thiểu (minimal pairs) theo từng lỗi từ khoá phát âm của app ATLAS (data/pron/en.json),
   thêm cặp cho đuôi -s / -ed, cách sửa từng lỗi, và 12 từ "bẫy" để bắt lỗi (mỗi lỗi 2 từ).
   Từ bẫy: người Việt hay đọc sai thành một từ khác có thật (card → car), nên máy nhận giọng nói sẽ nghe ra từ sai đó. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'pron', 'en.json'), 'utf8'));

// các lỗi dùng trong game (theo thứ tự hay gặp ở người Việt)
const USE = ['final', 'final-s', 's-end', 'ed-end', 'th', 'short-long', 'n-l', 'r-l', 'v-w', 'f-v', 's-z', 'ae-e'];
const TIPS = {
  final: 'Đọc xong từ, giữ miệng ở âm cuối và thả một hơi rất nhẹ: card có "đ" nhẹ ở cuối, bike có "k" nhẹ. Bỏ âm cuối là người nghe tưởng bạn nói từ khác (card thành car).',
  'final-s': 'Âm s cuối xì nhẹ như rắn: rice, nice, bus. Người Việt hay nuốt mất nên rice nghe thành "rai".',
  's-end': 'Số nhiều và động từ ngôi thứ ba luôn có đuôi s: cats, books, she likes. Thiếu đuôi s là sai cả nghĩa lẫn ngữ pháp.',
  'ed-end': 'Quá khứ có đuôi ed đọc thành /t/, /d/ hoặc /ɪd/: walked "uốc-t", played "plây-đ", wanted "uon-tịt". Bỏ đuôi ed thì người nghe tưởng bạn nói hiện tại.',
  th: 'Đặt đầu lưỡi giữa hai hàm răng rồi thổi hơi (think, three) hoặc rung (this, they). Đừng đọc thành "t" (three thành tree) hay "s" (think thành sink).',
  'short-long': 'Nguyên âm dài kéo dài gấp đôi: sheep "si-i-p", leave "li-i-v". Nguyên âm ngắn dứt khoát: ship, live. Đọc như nhau là lẫn hai từ khác nghĩa.',
  'n-l': 'n: đầu lưỡi chạm lợi, hơi ra mũi (no, night). l: đầu lưỡi chạm lợi, hơi ra hai bên lưỡi (low, light). Bịt mũi đọc "n" sẽ thấy khác.',
  'r-l': 'r: cuộn nhẹ lưỡi về sau, không chạm vòm (right, road). l: đầu lưỡi chạm lợi (light, load).',
  'v-w': 'v: răng trên chạm môi dưới, rung (vest). w: chu tròn môi, không chạm răng (west).',
  'f-v': 'f: răng trên chạm môi dưới, chỉ thổi hơi (fan). v: cùng chỗ nhưng cổ rung (van).',
  's-z': 's: xì như rắn (sip). z: rung như ong (zip). Đặt tay lên cổ, z thì cổ rung.',
  'ae-e': 'æ (bad, man): mở miệng rộng như cười to. e (bed, men): miệng mở vừa. ʌ (cut, cup): như "ơ" ngắn.'
};
// thêm cặp: âm cuối (từ bẫy hay gặp), đuôi -s, -ed (khoá gốc chỉ có bài chọn cách đọc đuôi)
const EXTRA = {
  final: [['card|/kɑːd/|tấm thẻ', 'car|/kɑː/|ô tô'], ['bike|/baɪk/|xe đạp', 'buy|/baɪ/|mua'], ['seat|/siːt/|chỗ ngồi', 'sea|/siː/|biển'],
    ['road|/rəʊd/|con đường', 'row|/rəʊ/|hàng'], ['make|/meɪk/|làm', 'may|/meɪ/|có thể'], ['wait|/weɪt/|chờ', 'way|/weɪ/|lối đi']],
  'final-s': [['place|/pleɪs/|nơi chốn', 'play|/pleɪ/|chơi'], ['house|/haʊs/|ngôi nhà', 'how|/haʊ/|thế nào'], ['nice|/naɪs/|đẹp, tốt', 'night|/naɪt/|ban đêm']],
  's-end': [['cats|/kæts/|những con mèo', 'cat|/kæt/|con mèo'], ['books|/bʊks/|những quyển sách', 'book|/bʊk/|quyển sách'], ['dogs|/dɒɡz/|những con chó', 'dog|/dɒɡ/|con chó'],
    ['cars|/kɑːz/|những chiếc ô tô', 'car|/kɑː/|ô tô'], ['bags|/bæɡz/|những cái túi', 'bag|/bæɡ/|cái túi'], ['maps|/mæps/|những tấm bản đồ', 'map|/mæp/|bản đồ']],
  'ed-end': [['walked|/wɔːkt/|đã đi bộ', 'walk|/wɔːk/|đi bộ'], ['played|/pleɪd/|đã chơi', 'play|/pleɪ/|chơi'], ['cooked|/kʊkt/|đã nấu', 'cook|/kʊk/|nấu'],
    ['stayed|/steɪd/|đã ở lại', 'stay|/steɪ/|ở lại'], ['washed|/wɒʃt/|đã rửa', 'wash|/wɒʃ/|rửa'], ['opened|/ˈəʊpənd/|đã mở', 'open|/ˈəʊpən/|mở']]
};
// 12 từ bẫy: w từ cần đọc, err những từ máy hay nghe ra khi đọc sai
const TEST = [
  { w: 'card', ipa: '/kɑːd/', vi: 'tấm thẻ', tag: 'final', err: ['car', 'cards', 'cart', 'caught'] },
  { w: 'bike', ipa: '/baɪk/', vi: 'xe đạp', tag: 'final', err: ['buy', 'by', 'bye', 'bite', 'bikes'] },
  { w: 'rice', ipa: '/raɪs/', vi: 'cơm', tag: 'final-s', err: ['rye', 'right', 'ride', 'write', 'rise', 'wry'] },
  { w: 'nice', ipa: '/naɪs/', vi: 'đẹp, tốt', tag: 'final-s', err: ['night', 'nine', 'nigh', 'knight', 'knife'] },
  { w: 'cats', ipa: '/kæts/', vi: 'những con mèo', tag: 's-end', err: ['cat', 'cap', 'cut'] },
  { w: 'books', ipa: '/bʊks/', vi: 'những quyển sách', tag: 's-end', err: ['book', 'look', 'cook'] },
  { w: 'walked', ipa: '/wɔːkt/', vi: 'đã đi bộ', tag: 'ed-end', err: ['walk', 'work', 'woke', 'walks'] },
  { w: 'played', ipa: '/pleɪd/', vi: 'đã chơi', tag: 'ed-end', err: ['play', 'plays', 'plate', 'plane'] },
  { w: 'three', ipa: '/θriː/', vi: 'số ba', tag: 'th', err: ['tree', 'free', 'sree', 'tea'] },
  { w: 'think', ipa: '/θɪŋk/', vi: 'nghĩ', tag: 'th', err: ['sink', 'tink', 'ink', 'pink', 'zinc', 'thing'] },
  { w: 'sheep', ipa: '/ʃiːp/', vi: 'con cừu', tag: 'short-long', err: ['ship', 'chip', 'sip', 'cheap'] },
  { w: 'leave', ipa: '/liːv/', vi: 'rời đi', tag: 'short-long', err: ['live', 'lift', 'leaf', 'liv'] }
];

const pairs = {};
for (const t of USE) pairs[t] = [];
for (const L of src.lessons) for (const s of L.secs || []) {
  if (!s || typeof s !== 'object') continue;
  for (const d of s.drill || []) if (d.t === 'pair' && pairs[d.tag]) for (const p of d.pairs) pairs[d.tag].push(p);
}
for (const [t, ps] of Object.entries(EXTRA)) for (const p of ps) pairs[t].push(p);
const tags = {};
for (const t of USE) tags[t] = src.tags[t];
for (const t of USE) if (pairs[t].length < 3) throw new Error(`Thiếu cặp từ cho lỗi ${t}`);
for (const it of TEST) if (!tags[it.tag]) throw new Error(`Lỗi không có: ${it.tag}`);

const out = `/* Bắt lỗi phát âm của người Việt và luyện theo lỗi (tạo bởi tools/build-pron-game.mjs, đừng sửa tay).
   tags: tên lỗi · tips: cách sửa · pairs: cặp từ tối thiểu 'từ|IPA|nghĩa' · test: 12 từ bẫy (err: từ máy hay nghe ra khi đọc sai). */
var G = window.G || (window.G = {});
G.PRON_EN = ${JSON.stringify({ tags, tips: TIPS, pairs, test: TEST }, null, 1).replace(/\n\s*/g, ' ')};
`;
fs.writeFileSync(path.join(ROOT, 'game', 'data', 'pron_en.js'), out);
console.log('Phát âm (game):', USE.map((t) => `${t} ${pairs[t].length}`).join(', '), '· từ bẫy', TEST.length);
