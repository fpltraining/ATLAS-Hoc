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
  for (const ch of st.chapters) for (const v of ch.vocab || []) add(lang, v[0]);
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
  for (const f of ['game/data/en_a1.js', 'game/data/en_found.js', 'game/data/en_a2.js', 'game/data/en_b1.js', 'game/data/cert_en.js', 'game/data/final_en.js', 'game/data/life.js', 'game/data/life_morning.js', 'game/data/life_school.js', 'game/data/life_after.js', 'game/data/practice_en.js', 'game/data/placement_en.js', 'game/data/pron_en.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
  const FEM = { emma: 1, lily: 1, rosa: 1, anna: 1, mom: 1, mia: 1, nora: 1, pat: 1, kim: 1, zoe: 1, lee: 1, ivy: 1, grace: 1 };
  for (const R of Object.values(ctx.G.ROOMS)) {
    if (R.lang !== 'en') continue;
    const sx = FEM[R.teacher] ? 'f' : 'm';
    if (!R.intro) continue;
    add('en', R.intro[0], sx); add('en', R.outro, sx);
    R.items.forEach((it, i) => { add('en', it.en, alt(i)); add('en', it.ex, alt(i + 1)); });
    if (R.gram) R.gram.ex.forEach(([t], i) => add('en', t, alt(i)));   // câu mẫu ngữ pháp của từng buổi (Nền tảng, Tầng 3, Tầng 4)
  }
  for (const L of Object.values(ctx.G.LIFE)) {
    if (L.lang !== 'en') continue;
    // câu có tên người chơi: tạo cho cả 3 nhân vật có sẵn (Han, Minh, Kai)
    for (const t of L.talks) for (const u of t.turns) for (const nm of ['Han', 'Minh', 'Kai']) {
      add('en', u.npc.replace(/\{name\}/g, nm), FEM[L.npc] ? 'f' : 'm');
      add('en', u.ok.replace(/\{name\}/g, nm), 'm');
    }
  }
  // bảng thông tin trong tiệm (data/life_after.js)
  for (const sh of Object.values(ctx.G.SHOPS || {})) for (const b of sh.boards || []) b.lines.forEach(([t]) => add('en', t, 'f'));
  // nói tự do: câu hỏi của nhân vật và câu mẫu (data/practice_en.js)
  for (const f of ctx.G.FREE_TALK || []) { add('en', f.q, FEM[f.npc] ? 'f' : 'm'); f.sample.forEach((t) => add('en', t, 'm')); }
  // bài kiểm tra đầu vào (data/placement_en.js): câu nghe, câu người ta nói ở phần giao tiếp, câu đọc to và câu hỏi phần nói
  const PL = ctx.G.PLACE_EN;
  // giọng theo người nói (who[...][2]); câu cũ đã có tệp giữ nguyên giọng cũ (khoá theo nội dung câu)
  if (PL) {
    const sexOf = (it, d) => { const w = it.who || (PL.places && PL.places[it.pl] && PL.places[it.pl].who); return (PL.who && PL.who[w] && PL.who[w][2]) || d; };
    PL.nghe.forEach((it, i) => add('en', it.a, sexOf(it, alt(i))));
    PL.gt.forEach((it, i) => add('en', it.p, sexOf(it, alt(i + 1))));
    PL.noi.forEach((it) => add('en', it.read || it.ask, it.ask ? sexOf(it, 'f') : 'f'));
  }
  // bắt lỗi phát âm, luyện theo lỗi (game/data/pron_en.js): từng từ của các cặp từ và 12 từ bẫy
  const PR = ctx.G.PRON_EN;
  if (PR) { for (const ps of Object.values(PR.pairs)) for (const p of ps) for (const w of p) add('en', w.split('|')[0], 'f'); for (const it of PR.test) add('en', it.w, 'f'); }
  // nhiệt độ ngoài trời (js/radar.js): "It's 13 degrees and cool." từ -5 tới 38 độ
  {
    const W = [[4, 'freezing'], [11, 'cold'], [17, 'cool'], [23, 'mild'], [29, 'warm'], [34, 'hot'], [99, 'boiling hot']];
    for (let t = -5; t <= 38; t++) add('en', `It's ${t < 0 ? 'minus ' + -t : t} degrees and ${W.find((w) => t <= w[0])[1]}.`, 'f');
  }
  // lời chúc khi nhận Chứng chỉ ConnectLife (grad.js)
  for (const R of Object.values(ctx.G.ROOMS)) if (R.final && R.final.lang === 'en') for (const nm of ['Han', 'Minh', 'Kai']) add('en', `Congrats, ${nm}! You've earned your ConnectLife certificate for ${R.final.levelEn || R.final.level}. So proud of you!`, 'f');
  // thi Tốt nghiệp ConnectLife (data/final_en.js): hội thoại nghe (giọng theo người nói), câu hỏi, câu mẫu, lời chúc tốt nghiệp
  const FN = ctx.G.FINAL_EN;
  if (FN) {
    add('en', FN.intro, 'm');
    for (const d of FN.listen) for (const [sx, , t] of d.lines) add('en', t, sx);
    for (const f of FN.handle) { add('en', f.q, FEM[f.npc] ? 'f' : 'm'); f.sample.forEach((t) => add('en', t, 'm')); }
    for (const t of FN.talk.turns) add('en', t.q, FEM[FN.talk.npc] ? 'f' : 'm');
    for (const nm of ['Han', 'Minh', 'Kai']) add('en', `Congratulations, ${nm}! You are now a ConnectLife graduate. You can really communicate in English!`, 'f');
  }
  // thi chứng chỉ phần nói (data/cert_en.js): câu người kia hỏi và câu mẫu
  for (const list of Object.values(ctx.G.CERT_SPEAK || {})) for (const f of list) { add('en', f.q, FEM[f.npc] ? 'f' : 'm'); f.sample.forEach((t) => add('en', t, 'm')); }
  {
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
