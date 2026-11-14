/* Danh sách câu cần tạo âm thanh giọng AI (Kokoro), kèm giọng đọc cho từng câu.

     node tools/build-audio-list.mjs      → data-src/audio-list.json

   Giọng: nam là chính (Michael cho tiếng Anh, giọng nam số 10 cho tiếng Trung).
   Câu hội thoại và câu mẫu đọc xen kẽ nam – nữ (Heart, giọng nữ số 1) cho đỡ đơn điệu;
   hội thoại có tên người nói thì Han là giọng nam, người còn lại giọng nữ.
   Sau đó chạy tools/tts/make_audio.py để tạo tệp trong audio/. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { audioKey, norm } from '../js/audiokey.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const VOICE = { en: { m: 'am_michael', f: 'af_heart' }, zh: { m: 'zm_010', f: 'zf_001' } };

const items = new Map();
function add(lang, text, sex = 'm') {
  if (!text || !String(text).trim()) return;
  const t = norm(lang, text);
  if (lang === 'zh' && !/[一-鿿]/.test(t)) return;
  if (lang === 'en' && !/[a-z]/i.test(t)) return;
  const key = audioKey(lang, text);
  const prev = items.get(key);
  if (prev && norm(lang, prev.text) !== t) throw new Error(`Trùng khoá ${key}: "${prev.text}" và "${t}"`);
  if (!prev) items.set(key, { key, lang, text: String(text).replace(/\s+/g, ' ').trim(), voice: VOICE[lang][sex] });
}
const alt = (i) => (i % 2 ? 'f' : 'm');

// Tiếng Trung: từ và câu của 205 bài, cặp câu thanh điệu, truyện
const idx = J('data/curriculum/index.json');
for (const meta of idx.lessons) {
  const L = J(`data/curriculum/${meta.file}`);
  for (const w of L.words) add('zh', w.w);
  (L.sentences || []).forEach((s, i) => add('zh', s.cn, alt(i)));
}
const speakSrc = fs.readFileSync(path.join(ROOT, 'js/views/speak.js'), 'utf8');
[...speakSrc.matchAll(/\['([^']*[一-鿿][^']*)', '/g)].forEach((m, i) => add('zh', m[1], alt(i)));

// Truyện: giọng nam đọc toàn bộ như sách nói
for (const s of J('data/stories/index.json')) {
  const st = J(`data/stories/${s.id}.json`);
  const lang = s.lang === 'zh' ? 'zh' : 'en';
  for (const ch of st.chapters) for (const p of ch.paras) for (const ln of p) add(lang, ln[0]);
}

// Tiếng Anh: kho từ (từ giọng nam, câu ví dụ xen kẽ), khoá học, tiếng Anh nghề
J('data/en/bank.json').forEach((r, i) => { add('en', r[0]); add('en', r[4], alt(i)); });
const c = J('data/en/course.json');
for (const d of c.core) for (const [w] of d) add('en', w);
for (const s of c.sounds) for (const p of s.pairs) for (const w of p) add('en', w);
for (const d of c.phr) d.forEach(([t], i) => add('en', t, alt(i)));
c.a1sent.forEach((t, i) => add('en', t, alt(i)));
for (const v of Object.values(c.sent)) v.forEach((s, i) => add('en', s.en, alt(i)));
for (const s of c.shadow) s.v.forEach((t, i) => add('en', t, alt(i)));
for (const [w] of c.vocabB2 || []) add('en', w);
for (const [w] of c.vocabC1 || []) add('en', w);
for (const th of c.colloc3 || []) th.v.forEach(([t], i) => add('en', t, alt(i)));
for (const d of c.debate3 || []) {
  add('en', d.t);
  d.for.forEach(([t]) => add('en', t, 'm'));
  d.against.forEach(([t]) => add('en', t, 'f'));
}
const work = J('data/work.json');
for (const d of work.days) d.phrases.forEach((p, i) => add('en', p.en, alt(i)));
for (const cv of work.convos) for (const l of cv.lines) add('en', l.en, /^han$/i.test(l.sp) ? 'm' : 'f');
for (const k of ['car', 'tiktok', 'patterns']) work[k].forEach((p, i) => add('en', p.en, alt(i)));
for (const g of work.aov) for (const it of g.items) add('en', it.en);

// Khoá phát âm, bảng pinyin, 20 tổ hợp thanh, bảng IPA (tools/build-pron.mjs ghi ra)
if (fs.existsSync(path.join(ROOT, 'data-src/pron-audio.json'))) {
  const pa = J('data-src/pron-audio.json');
  pa.zh.forEach((t) => add('zh', t));
  pa.en.forEach((t) => add('en', t));
}

// Game "Thế giới Ngôn Ngữ" (game/): câu trong phòng học tiếng Anh, khu đời sống, xe buýt, tàu điện, sân bay.
// Giọng theo người nói: cô giáo, bà Rosa, bác sĩ Anna, nhân viên sân bay là giọng nữ; còn lại giọng nam.
{
  const vm = await import('node:vm');
  const ctx = { console }; ctx.window = ctx; ctx.G = {}; vm.createContext(ctx);
  for (const f of ['game/data/en_a1.js', 'game/data/life.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  const FEM = { emma: 1, lily: 1, rosa: 1, anna: 1 };
  for (const R of Object.values(ctx.G.ROOMS)) {
    if (R.lang !== 'en') continue;
    const sx = FEM[R.teacher] ? 'f' : 'm';
    add('en', R.intro[0], sx); add('en', R.outro, sx);
    R.items.forEach((it, i) => { add('en', it.en, alt(i)); add('en', it.ex, alt(i + 1)); });
  }
  for (const L of Object.values(ctx.G.LIFE)) {
    if (L.lang !== 'en') continue;
    for (const t of L.talks) for (const u of t.turns) {
      add('en', u.npc.replace(/\{name\}/g, 'Han'), FEM[L.npc] ? 'f' : 'm');
      add('en', u.ok.replace(/\{name\}/g, 'Han'), 'm');
    }
  }
  // câu cố định trong js/ride.js, js/flight.js, js/grad.js (câu tiếng Anh viết hoa đầu, kết thúc bằng . ? !)
  for (const f of ['game/js/ride.js', 'game/js/flight.js']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    for (const m of src.matchAll(/'((?:[^'\\]|\\.)*)'/g)) {
      const t = m[1].replace(/\\'/g, "'");
      if (/^[A-Z][a-z]/.test(t) && /[.?!]$/.test(t) && !/[À-ỹđĐ]/.test(t) && !/[一-鿿]/.test(t)) add('en', t, /flight/.test(f) ? 'f' : 'm');
    }
  }
  // câu ghép theo tên trạm (ride.js) và lời chào theo giờ của tài xế
  const rideSrc = fs.readFileSync(path.join(ROOT, 'game/js/ride.js'), 'utf8');
  const stops = new Set();
  for (const m of rideSrc.matchAll(/(?:school|home|line): \[([^\]]*)\]/g)) for (const q of m[1].matchAll(/'([^']+)'/g)) stops.add(q[1]);
  for (const n of stops) {
    add('en', `Next stop: ${n}.`); add('en', `The next station is ${n}.`, 'f');
    add('en', `This is ${n}. Please mind the gap.`, 'f'); add('en', `This is ${n}. This is the last stop.`, 'f');
    add('en', `To ${n}, please.`); add('en', n);
  }
  for (const g of ['Morning!', 'Hey there!', 'Evening!']) add('en', `${g} Where you headed?`);
  // câu người đi đường nói (engine.js, LINES)
  const eng = fs.readFileSync(path.join(ROOT, 'game/js/engine.js'), 'utf8');
  const lb = eng.slice(eng.indexOf('var LINES = ['), eng.indexOf('];', eng.indexOf('var LINES = [')));
  [...lb.matchAll(/\['((?:[^'\\]|\\.)*)', '/g)].forEach((m, i) => add('en', m[1].replace(/\\'/g, "'"), alt(i)));
}

const list = [...items.values()];
fs.writeFileSync(path.join(ROOT, 'data-src', 'audio-list.json'), JSON.stringify(list));
const by = (l) => list.filter((x) => x.lang === l);
console.log(`Danh sách âm thanh: ${list.length} câu`);
for (const l of ['en', 'zh']) {
  const xs = by(l);
  console.log(`  ${l}: ${xs.length} câu, ${xs.reduce((a, x) => a + x.text.length, 0)} ký tự, nữ ${xs.filter((x) => x.voice.includes('f_')).length}`);
}
