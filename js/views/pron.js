/* Khoá phát âm cho người Việt (tiếng Trung và tiếng Anh) — học theo nhịp cố định:
   Ôn bài cũ → Khởi động (nghe rồi tự đoán) → Học từng mục → Luyện ngay (sai câu nào luyện lại câu đó)
   → Nói (máy chấm) → Củng cố (xếp rổ / đua 60 giây) → Kiểm tra (đạt 8/10 mới mở bài sau).

   Đường dẫn:
     #/pron/zh            trang khoá        #/pron/zh/3      bài 3
     #/pron/zh/loi        ôn theo lỗi       #/pron/zh/thanh  20 tổ hợp thanh
     #/pron/zh/bang       bảng pinyin       #/pron/en/bang   bảng IPA
     #/pron/zh/dua        đua 60 giây */

import * as store from '../store.js';
import * as audio from '../audio.js';
import { h, toast, pill, progressBar } from '../ui.js';
import { sayEn, scribble, shuffle } from '../kit.js';
import { listen, score as speechScore, verdictSpeak, canListen } from '../speech.js';
import { art, mascot, comboChart, TONE_COLORS, MASCOT_NAME } from '../pron-art.js';
import { award } from '../xp.js';

const memo = {};
const kids = (...a) => a.filter((x) => x !== null && x !== undefined && x !== false);
const load = (p) => (memo[p] ||= fetch(p).then((r) => r.json()));

/* ---------- tiện ích pinyin ---------- */
const MARK = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', ü: 'ǖǘǚǜ' };
const UNMARK = {};
for (const [v, s] of Object.entries(MARK)) [...s].forEach((c, i) => { UNMARK[c] = [v, i + 1]; });
export function toneOf(syl) { for (const c of syl) if (UNMARK[c]) return UNMARK[c][1]; return 0; }
export function addMark(syl, t) {
  if (!t) return syl;
  const v = syl.includes('a') ? 'a' : syl.includes('e') ? 'e' : syl.includes('ou') ? 'o'
    : [...syl].reverse().find((c) => 'iouü'.includes(c));
  if (!v) return syl;
  const k = syl.lastIndexOf(v);
  return syl.slice(0, k) + MARK[v][t - 1] + syl.slice(k + 1);
}
const plain = (py) => [...String(py).normalize('NFC')].map((c) => (UNMARK[c] ? UNMARK[c][0] : c)).join('').replace(/v/g, 'ü');
/** Pinyin gõ tay ("ma3", "mǎ", "lv4") → dạng chuẩn để so */
function normPy(s) {
  return String(s).toLowerCase().trim().replace(/\s+/g, ' ').split(' ').map((w) => {
    const m = w.match(/^([a-züv]+)([0-5])$/);
    if (m) return addMark(m[1].replace(/v/g, 'ü'), Number(m[2]) % 5);
    return w.normalize('NFC').replace(/v/g, 'ü');
  }).join(' ');
}
function tonedSpan(py) {
  const f = document.createDocumentFragment();
  String(py).split(/(\s+)/).forEach((w) => {
    if (!w.trim()) { f.append(w); return; }
    f.append(h('span', { style: { color: TONE_COLORS[toneOf(w)] } }, w));
  });
  return f;
}

/** Thanh của từng âm tiết: công cụ dựng đã ghi sẵn ở trường thứ 4 ("4-0"); thiếu thì tách theo khoảng trắng */
function sylTones(py, tn) {
  if (tn) return tn.split('-').map(Number);
  return String(py).split(/[\s']+/).filter(Boolean).map(toneOf);
}

/* ---------- mục ---------- */
const parse = (s) => { const [w, py, vi, tn] = String(s).split('|'); return { w, py: py || '', vi: vi || '', tn: tn || '' }; };

let LANG = 'zh';
let settings = {};
function say(it, { slow = false } = {}) {
  const w = typeof it === 'string' ? it : it.w;
  if (LANG === 'en') return sayEn(w, slow ? { rate: 0.6 } : {});
  return audio.speak(w, { lang: 'zh', rate: (settings.speechRate || 0.85) * (slow ? 0.75 : 1) });
}
function sayWait(it) {
  return new Promise((res) => {
    const w = typeof it === 'string' ? it : it.w;
    const done = () => setTimeout(res, 250);
    if (LANG === 'en') sayEn(w, { onEnd: done }); else audio.speak(w, { lang: 'zh', rate: settings.speechRate || 0.85, onEnd: done });
    setTimeout(res, 2600);
  });
}
const playBtn = (it, label = '🔊') => h('button.speak-btn', { onclick: (e) => { e.stopPropagation(); say(it); } }, label);

function artEl(code, cls = 'pron-fig') {
  const d = h(`div.${cls}`);
  d.innerHTML = art(code);
  return d;
}
/* Nhân vật dẫn bài: ảnh theo tư thế (chao, giai-thich, nghe, khen, dong-vien, nghi, avatar);
   ảnh lỗi thì quay về hình vẽ SVG. */
const who = () => (LANG === 'en' ? 'kai' : 'han');
function mascotImg(pose = 'chao', cls = 'mascot-img') {
  const img = h(`img.${cls}`, { src: `img/mascot/${who()}-${pose}.webp`, alt: MASCOT_NAME[LANG], loading: 'lazy', decoding: 'async' });
  img.onerror = () => { const d = h('span.mascot-svg'); d.innerHTML = mascot(who()); img.replaceWith(d); };
  return img;
}
function guide(text, extra, pose = 'giai-thich') {
  return h('div.guide', h('div.guide-ava', mascotImg(pose)), h('div.guide-bubble', h('div.guide-name', MASCOT_NAME[LANG]), h('div', text), extra || null));
}

/* ---------- lỗi theo nhãn ---------- */
const errKey = () => `pronErr-${LANG}`;
async function noteResult(tag, ok) {
  if (!tag) return;
  await store.kvUpdate(errKey(), {}, (e) => {
    const r = e[tag] || { w: 0, r: 0 };
    if (ok) r.r++; else { r.w++; r.last = Date.now(); }
    e[tag] = r;
    return e;
  });
}

/* ---------- sinh câu hỏi từ dữ liệu luyện ---------- */
const TONE_LABEL = { 1: '1 ˉ', 2: '2 ˊ', 3: '3 ˇ', 4: '4 ˋ', 0: 'nhẹ ·' };
function questionsOf(drill) {
  const out = [];
  const kind = (d) => drill.kind || d;
  if (drill.t === 'tone') {
    const neutral = drill.items.some((s) => !toneOf(parse(s).py));
    const tones = neutral ? [1, 2, 3, 4, 0] : [1, 2, 3, 4];
    for (const s of drill.items) {
      const it = parse(s); const t = toneOf(it.py);
      out.push({ it, kind: kind('Nghe và chọn thanh'), opts: tones.map((x) => TONE_LABEL[x]), a: tones.indexOf(t), tag: drill.tag || `tone-${t}` });
    }
  } else if (drill.t === 'pick') {
    const byWord = LANG === 'en' && drill.by !== 'py';
    for (const row of drill.items) {
      const it = parse(row[0]);
      const ans = byWord ? it.w : it.py;
      const opts = shuffle([ans, ...row.slice(1)]);
      out.push({ it, kind: kind(byWord ? 'Nghe và chọn từ đúng' : LANG === 'en' ? 'Nghe và chọn đáp án' : 'Nghe và chọn pinyin đúng'), opts, a: opts.indexOf(ans), tag: row.tag || drill.tag, hideWord: byWord });
    }
  } else if (drill.t === 'pair') {
    for (const [a, b] of drill.pairs) {
      const A = parse(a), B = parse(b);
      const target = Math.random() < 0.5 ? A : B;
      const optsIt = shuffle([A, B]);
      const label = (x) => (LANG === 'en' ? x.w : x.py);
      out.push({ it: target, kind: kind('Nghe và chọn âm bạn nghe được'), opts: optsIt.map(label), a: optsIt.indexOf(target), tag: drill.tag, hideWord: LANG === 'en' });
    }
  } else if (drill.t === 'type') {
    for (const s of drill.items) out.push({ it: parse(s), kind: kind(LANG === 'en' ? 'Nghe và viết từ' : 'Nghe và gõ pinyin (ví dụ ma3 hoặc mǎ)'), type: true, tag: drill.tag || 'type' });
  } else if (drill.t === 'combo') {
    for (const s of drill.items) {
      const it = parse(s);
      const tones = sylTones(it.py, it.tn);
      const pat = tones.map((t) => t || 'nhẹ').join(' + ');
      const pool = new Set([pat]);
      let guard = 0;
      while (pool.size < 4 && guard++ < 50) {
        const alt = tones.map((t, k) => (Math.random() < 0.6 || k === tones.length - 1 ? 1 + Math.floor(Math.random() * 4) : t));
        if (tones.at(-1) === 0 && Math.random() < 0.5) alt[alt.length - 1] = 0;
        pool.add(alt.map((t) => t || 'nhẹ').join(' + '));
      }
      const opts = shuffle([...pool]);
      out.push({ it, kind: kind('Nghe từ và chọn tổ hợp thanh'), opts, a: opts.indexOf(pat), tag: drill.tag || (tones.length === 2 ? `combo-${pat}` : 'combo3') });
    }
  } else if (drill.t === 'stress') {
    for (const [s, k] of drill.items) {
      const it = parse(s);
      const parts = it.py.split('-');
      out.push({ it, kind: kind('Âm tiết nào được nhấn mạnh?'), opts: parts.map((p) => p.toLowerCase()), a: Number(k), tag: drill.tag || 'stress', showWord: true });
    }
  }
  return out;
}
const lessonPool = (L) => (L.secs || []).filter((s) => s && s.drill).flatMap((s) => s.drill.flatMap(questionsOf));

/* ---------- chạy một loạt câu hỏi ---------- */
/**
 * mode: practice (sai thì đẩy xuống cuối làm lại), test / review (không làm lại), race (60 giây)
 * onDone({ right, total, wrongTags })
 */
function runQuestions(host, qs, { mode = 'practice', onDone, seconds = 60 }) {
  let queue = qs.slice();
  let right = 0, answered = 0;
  const firstTry = new Set();
  const wrongTags = {};
  let timer = 0, left = seconds;
  const total = qs.length;
  const head = h('div.row.spread', { style: { marginBottom: '8px' } });
  const body = h('div');
  host.replaceChildren(h('div.card', head, body));

  if (mode === 'race') {
    timer = setInterval(() => {
      left--;
      if (left <= 0) { clearInterval(timer); onDone({ right, total: answered, wrongTags }); return; }
      drawHead();
    }, 1000);
  }
  function drawHead() {
    head.replaceChildren(
      mode === 'race' ? pill(`⏱ ${left}s`, left <= 10 ? 'seal' : 'jade') : pill(`${Math.min(answered + 1, total)} / ${total}`, 'plain'),
      h('span.small.faint', mode === 'race' ? `Đúng ${right}` : mode === 'practice' ? 'Sai câu nào luyện lại câu đó' : mode === 'test' ? 'Kiểm tra · cần 8/10' : 'Ôn bài trước'),
    );
  }
  function next() {
    if (mode === 'race' && left <= 0) return;
    if (!queue.length) {
      if (mode === 'race') { queue = shuffle(qs); } else { clearInterval(timer); onDone({ right, total, wrongTags }); return; }
    }
    const q = queue.shift();
    drawHead();
    let done = false;
    const fb = h('div', { style: { minHeight: '26px', marginTop: '10px' } });
    const reveal = h('div.q-reveal', { hidden: true },
      h(`div.q-word${LANG === 'zh' ? '.cn' : ''}`, q.it.w),
      q.it.py ? h('div.q-py', LANG === 'zh' ? tonedSpan(q.it.py) : q.it.py) : null,
      q.it.vi ? h('div.small.faint', q.it.vi) : null);
    const finish = (ok, pickedLabel) => {
      if (done) return; done = true;
      noteResult(q.tag, ok);
      if (mode !== 'practice' || !firstTry.has(q)) { if (ok) right++; answered++; }
      if (!ok) wrongTags[q.tag] = (wrongTags[q.tag] || 0) + 1;
      if (mode === 'practice') {
        if (!ok) { firstTry.add(q); queue.push(q); }
      }
      reveal.hidden = false;
      fb.replaceChildren(h(`div.note.react.${ok ? 'jade' : 'seal'}`, mascotImg(ok ? 'khen' : 'dong-vien', 'react-img'),
        h('span', ok ? 'Đúng rồi!' : `Chưa đúng${q.type ? `: đáp án ${q.it.py || q.it.w}` : ''}. ${mode === 'practice' ? 'Câu này sẽ quay lại ở cuối, cố lên!' : 'Không sao, xem đáp án bên dưới.'}`)));
      if (mode === 'race') { setTimeout(next, ok ? 350 : 900); return; }
      body.append(h('button.btn.primary.block', { style: { marginTop: '12px' }, onclick: next }, queue.length || mode !== 'practice' ? 'Tiếp ›' : 'Xong'));
    };
    let ctrl;
    if (q.type) {
      const inp = scribble(LANG === 'en' ? 'Viết từ bạn nghe' : 'Gõ pinyin, ví dụ ni3 hao3', { onEnter: () => check() });
      const check = () => {
        const v = inp.value.trim();
        if (!v) return;
        const ok = LANG === 'en' ? v.toLowerCase() === q.it.w.toLowerCase() : normPy(v) === normPy(q.it.py);
        finish(ok);
      };
      ctrl = h('div', inp, h('button.btn.jade', { style: { marginTop: '8px' }, onclick: check }, 'Kiểm tra'));
    } else {
      const list = h('div.q-opts');
      q.opts.forEach((o, i) => list.append(h('button.q-opt', {
        onclick: (e) => {
          if (done) return;
          [...list.children][q.a].classList.add('ok');
          if (i !== q.a) e.currentTarget.classList.add('no');
          finish(i === q.a, o);
        },
      }, LANG === 'zh' && /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(o) ? tonedSpan(o) : o)));
      ctrl = list;
    }
    body.replaceChildren(
      h('div.small.faint', q.kind),
      h('div.q-listen',
        h('button.btn.jade.q-play', { onclick: () => say(q.it) }, '🔊 Nghe'),
        h('button.btn.ghost.sm', { onclick: () => say(q.it, { slow: true }) }, '🐢 Chậm'),
        q.showWord ? h(`div.q-word${LANG === 'zh' ? '.cn' : ''}`, q.it.w) : null),
      ctrl, fb, reveal,
    );
    setTimeout(() => say(q.it), 250);
  }
  next();
  return () => clearInterval(timer);
}

/* ---------- các chặng của một bài ---------- */
function stepsOf(L, hasPrev) {
  const st = [];
  if (hasPrev) st.push({ k: 'review', t: 'Ôn bài cũ' });
  st.push({ k: 'warm', t: 'Khởi động' });
  let n = 0;
  for (const s of L.secs) {
    if (s === 'break') { st.push({ k: 'break', t: 'Nghỉ giữa bài' }); continue; }
    n++;
    st.push({ k: 'learn', t: `Mục ${n} · ${s.title}`, sec: s, n });
  }
  st.push({ k: 'speak', t: 'Nói' }, { k: 'game', t: 'Củng cố' }, { k: 'test', t: 'Kiểm tra' });
  return st;
}

async function progress() { return store.kvGet(`pron-${LANG}`, { at: {}, passed: {}, race: 0, open: false }); }
const saveProgress = (fn) => store.kvUpdate(`pron-${LANG}`, { at: {}, passed: {}, race: 0, open: false }, fn);

async function renderLesson(course, id, el) {
  const L = course.lessons.find((x) => x.id === id);
  if (!L) { el.append(h('p', 'Không có bài này.')); return; }
  const prevL = course.lessons.find((x) => x.id === id - 1);
  const steps = stepsOf(L, !!prevL);
  const pg = await progress();
  let reached = pg.at[id] || 0;
  let cur = Math.min(reached, steps.length - 1);
  let stop = null;

  const bar = h('div.pron-steps');
  const host = h('div');
  const top = h('div.pron-head',
    h('div.small.faint', `${course.short} · BÀI ${L.id}/${course.lessons.length}`),
    h('h1.pron-title', L.title),
    h('div.muted', L.sub),
    h('div.note', { style: { marginTop: '8px' } }, h('b', 'Mục tiêu '), L.goal),
  );
  el.append(top, bar, host);

  const markReached = async (k) => {
    if (k > reached) { reached = k; await saveProgress((p) => { p.at[id] = Math.max(p.at[id] || 0, k); return p; }); }
  };
  const go = async (k) => {
    stop?.(); stop = null;
    cur = k;
    await markReached(k);
    draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const nextBtn = (label = 'Tiếp ›') => h('button.btn.primary.block', { style: { marginTop: '14px' }, onclick: () => go(cur + 1) }, label);

  function drawBar() {
    bar.replaceChildren(
      h('div.row.spread', h('b', `Chặng ${cur + 1}/${steps.length}`), steps[cur + 1] ? h('span.small.faint', `Kế tiếp: ${steps[cur + 1].t}`) : null),
      progressBar((cur + 1) / steps.length),
      h('div.pron-chips', ...steps.map((s, k) => h('button.pron-chip' + (k === cur ? '.on' : '') + (k <= reached ? '' : '.lock'), {
        disabled: k > reached,
        title: k > reached ? `${s.t} (chưa mở)` : s.t,
        onclick: () => go(k),
      }, k > reached ? '🔒' : String(k + 1)))),
    );
  }

  function draw() {
    drawBar();
    const s = steps[cur];
    if (s.k === 'review') {
      const pool = shuffle(lessonPool(prevL)).slice(0, 5);
      host.replaceChildren(guide(`Ôn lại 5 câu nghe của bài ${prevL.id} trước khi học tiếp.`, null, 'nghe'), h('div'));
      stop = runQuestions(host.lastChild, pool, { mode: 'review', onDone: ({ right, total }) => {
        host.lastChild.replaceChildren(h('div.card', h('h2', `Ôn bài cũ: ${right}/${total}`), h('p.muted', right >= 4 ? 'Nhớ tốt. Vào bài mới thôi.' : 'Chưa chắc lắm, nhưng cứ học tiếp, phần ôn lỗi sẽ nhắc lại.'), nextBtn()));
      } });
      return;
    }
    if (s.k === 'warm') {
      const W = L.warm;
      const items = W.items.map(parse);
      const tiles = h('div.warm-tiles', ...items.map((it) => h('button.warm-tile', { onclick: () => say(it) },
        h('div.warm-q', '?'), h(`div.warm-w${LANG === 'zh' ? '.cn' : ''}`, it.w), h('div.small.faint', it.vi))));
      let answered = false;
      const opts = h('div.q-opts');
      const why = h('div');
      W.opts.forEach((o, i) => opts.append(h('button.q-opt', {
        onclick: (e) => {
          if (answered) return; answered = true;
          [...opts.children][W.a].classList.add('ok');
          if (i !== W.a) e.currentTarget.classList.add('no');
          tiles.querySelectorAll('.warm-q').forEach((q, k) => { q.replaceChildren(LANG === 'zh' ? tonedSpan(items[k].py) : items[k].py); });
          why.replaceChildren(h('div.note.jade', { style: { marginTop: '10px' } }, W.why), nextBtn());
        },
      }, o)));
      host.replaceChildren(
        guide(W.lead, null, 'nghe'),
        h('div.card', tiles,
          h('button.btn.jade', { style: { marginTop: '10px' }, onclick: async () => { for (const it of items) await sayWait(it); } }, '▶ Nghe lần lượt'),
          h('h3', { style: { marginTop: '16px' } }, W.q || 'Bạn đoán thế nào?'),
          h('div.small.faint', 'Nghe rồi đoán một đáp án'),
          opts, why),
      );
      return;
    }
    if (s.k === 'learn') {
      const S = s.sec;
      const ex = (S.ex || []).map(parse);
      const practice = () => {
        const qs = shuffle(S.drill.flatMap(questionsOf)).slice(0, S.n || 8);
        const box = h('div');
        host.replaceChildren(guide('Luyện ngay mục vừa học. Sai câu nào, câu đó quay lại ở cuối.'), box);
        stop = runQuestions(box, qs, { mode: 'practice', onDone: ({ right, total }) => {
          box.replaceChildren(h('div.card', h('h2', 'Xong phần luyện'), h('p.muted', `Đúng ngay lần đầu ${right}/${total} câu.`), nextBtn()));
        } });
      };
      host.replaceChildren(
        guide(S.lead || S.title, null, 'giai-thich'),
        h('div.card.pron-learn',
          h('h2', S.title),
          S.art ? (Array.isArray(S.art) ? h('div.pron-figs', ...S.art.map((a) => h('figure', artEl(a), a.cap ? h('figcaption', a.cap) : null))) : artEl(S.art)) : null,
          S.arts ? h('div.pron-figs', ...S.arts.map(([code, cap]) => h('figure', artEl(code), h('figcaption', cap)))) : null,
          ...(S.body || []).map((p) => h('p', p)),
          S.tip ? h('div.note.amber', h('b', 'Mẹo nhớ '), S.tip) : null,
          ex.length ? h('div.pron-ex', ...ex.map((it) => h('button.pron-ex-row', { onclick: () => say(it) },
            h(`span.pron-ex-w${LANG === 'zh' ? '.cn' : ''}`, it.w),
            h('span.pron-ex-py', LANG === 'zh' ? tonedSpan(it.py) : it.py),
            h('span.small.faint.grow', it.vi), h('span', '🔊')))) : null,
          S.link ? h('a.btn.jade.block', { href: S.link[0], style: { marginTop: '12px' } }, S.link[1]) : null,
          S.drill ? h('button.btn.primary.block', { style: { marginTop: '14px' }, onclick: practice }, 'Luyện ngay ›') : nextBtn(),
        ),
      );
      return;
    }
    if (s.k === 'break') {
      host.replaceChildren(guide('Nghỉ một chút nhé. Não cần vài phút để cất những âm vừa học.', null, 'nghi'),
        h('div.card', h('h2', 'Nghỉ giữa bài'), h('ul.muted',
          h('li', 'Đứng dậy, vươn vai, uống ngụm nước.'),
          h('li', 'Nói thầm lại 3 âm vừa học, không cần nhìn màn hình.'),
          h('li', 'Hít sâu bằng mũi 4 giây, thở ra bằng miệng 6 giây, làm 3 lần.')), nextBtn('Học tiếp ›')));
      return;
    }
    if (s.k === 'speak') {
      const items = (L.speak || []).map(parse);
      const list = h('div.stack');
      for (const it of items) {
        const res = h('div.small', { style: { minHeight: '18px' } });
        const mic = canListen ? h('button.btn.sm.jade', {
          onclick: async (e) => {
            const b = e.currentTarget; b.disabled = true; res.textContent = 'Đang nghe… nói đi';
            try {
              const alts = await listen(LANG);
              const r = speechScore(LANG, it.w, alts);
              const v = verdictSpeak(r.score);
              res.replaceChildren(h(`b${v.tone ? `.t-${v.tone}` : ''}`, `${r.score} · ${v.text}`), ` — máy nghe: "${r.heard}"`);
              noteResult(LANG === 'zh' ? 'speak' : 'speak', r.score >= 60);
            } catch (err) { res.textContent = err.message; }
            b.disabled = false;
          },
        }, '🎤 Nói') : null;
        list.append(h('div.pair',
          h('div.grow', h(`div.pair-en${LANG === 'zh' ? '.cn' : ''}`, it.w), h('div.pair-vi', LANG === 'zh' ? tonedSpan(it.py) : it.py), it.vi ? h('div.small.faint', it.vi) : null, res),
          h('div.pair-act', playBtn(it), mic)));
      }
      host.replaceChildren(guide(canListen ? 'Nghe mẫu rồi bấm 🎤 nói theo. Máy chấm mức "người nghe hiểu được", không khắt khe.' : 'Máy này chưa nghe được giọng nói. Hãy nghe mẫu rồi nói to theo từng dòng.', null, 'chao'),
        h('div.card', h('h2', 'Nói'), list, nextBtn()));
      return;
    }
    if (s.k === 'game') {
      const G = L.game || { t: 'race' };
      const box = h('div');
      host.replaceChildren(guide(G.t === 'sort' ? `Xếp rổ: nghe từng âm rồi bỏ vào đúng rổ.` : 'Đua 60 giây: trả lời càng nhiều câu đúng càng tốt.', null, 'khen'), box);
      if (G.t === 'sort') sortGame(box, G, () => box.append(nextBtn()));
      else { raceGame(box, lessonPool(L), () => box.append(nextBtn())); stop = () => { raceStop?.(); raceStop = null; }; }
      return;
    }
    if (s.k === 'test') {
      const box = h('div');
      host.replaceChildren(guide('Kiểm tra 10 câu. Đạt 8/10 là qua bài và mở bài sau.'), box);
      const qs = shuffle(lessonPool(L)).slice(0, 10);
      stop = runQuestions(box, qs, { mode: 'test', onDone: async ({ right, total }) => {
        const pass = right >= Math.ceil(total * 0.8);
        if (pass) {
          const first = !(await progress()).passed[id];
          await saveProgress((p) => { p.passed[id] = Math.max(p.passed[id] || 0, right); return p; });
          if (first) await award(30, `Qua bài phát âm ${id}`);
        }
        const nextL = course.lessons.find((x) => x.id === id + 1);
        box.replaceChildren(h('div.card',
          h('div.row', { style: { gap: '12px', alignItems: 'center' } }, mascotImg(pass ? 'khen' : 'dong-vien', 'result-img'), h('h2', `${right}/${total} câu đúng`)),
          h(`div.note.${pass ? 'jade' : 'seal'}`, pass ? 'Qua bài! Bài sau đã mở.' : 'Chưa đạt 8/10. Xem lại các mục rồi kiểm tra lại nhé.'),
          h('div.btn-row', { style: { marginTop: '12px' } },
            pass && nextL ? h('a.btn.primary', { href: `#/pron/${LANG}/${nextL.id}` }, `Sang Bài ${nextL.id} ›`) : null,
            h('button.btn.ghost', { onclick: () => draw() }, 'Kiểm tra lại'),
            h('a.btn.ghost', { href: `#/pron/${LANG}` }, 'Về trang khoá'))));
      } });
    }
  }
  draw();
  return () => stop?.();
}

/* ---------- trò chơi ---------- */
function sortGame(box, G, onEnd) {
  const items = shuffle(G.items.map(([s, b]) => ({ it: parse(s), b }))).slice(0, 10);
  let k = 0, right = 0;
  const step = () => {
    if (k >= items.length) {
      box.replaceChildren(h('div.card', h('h2', `Xếp đúng ${right}/${items.length}`), h('p.muted', right >= 8 ? 'Tai bạn đã phân biệt được rồi.' : 'Nghe thêm vài lần ở phần học rồi chơi lại nhé.')));
      onEnd?.();
      return;
    }
    const { it, b } = items[k];
    let done = false;
    const fb = h('div', { style: { minHeight: '24px', marginTop: '8px' } });
    const baskets = h('div.baskets', ...G.baskets.map((name, i) => h('button.basket', {
      onclick: (e) => {
        if (done) return; done = true;
        const ok = i === b;
        if (ok) right++;
        noteResult(G.tag, ok);
        e.currentTarget.classList.add(ok ? 'ok' : 'no');
        if (!ok) baskets.children[b].classList.add('ok');
        fb.replaceChildren(h(`div.note.${ok ? 'jade' : 'seal'}`, `${it.w} ${it.py} → ${G.baskets[b]}`));
        setTimeout(() => { k++; step(); }, ok ? 700 : 1500);
      },
    }, h('div.basket-ico', '🧺'), name)));
    box.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${k + 1} / ${items.length}`, 'plain'), h('span.small.faint', `Đúng ${right}`)),
      h('div.q-listen', h('button.btn.jade.q-play', { onclick: () => say(it) }, '🔊 Nghe'), h(`div.q-word${LANG === 'zh' ? '.cn' : ''}`, it.w)),
      baskets, fb));
    setTimeout(() => say(it), 250);
  };
  step();
}
let raceStop = null;
function raceGame(box, pool, onEnd) {
  pool = pool.filter((q) => !q.type);
  box.replaceChildren(h('div.card', h('h2', 'Đua 60 giây'), h('p.muted', 'Nghe và trả lời nhanh nhất có thể. Hết giờ là dừng.'),
    h('button.btn.primary.block', {
      onclick: () => {
        raceStop = runQuestions(box, shuffle(pool), { mode: 'race', seconds: 60, onDone: async ({ right, total }) => {
          const pg = await progress();
          const best = Math.max(pg.race || 0, right);
          await saveProgress((p) => { p.race = best; return p; });
          if (right >= 10) await award(10, 'Đua 60 giây');
          box.replaceChildren(h('div.card', h('h2', `${right} câu đúng / ${total}`), h('p.muted', `Kỷ lục của bạn: ${best} câu.`),
            h('button.btn.ghost', { onclick: () => raceGame(box, pool, onEnd) }, 'Chơi lại')));
          onEnd?.();
        } });
      },
    }, 'Bắt đầu ⏱')));
}

/* ---------- trang khoá ---------- */
async function renderHub(course, el) {
  const pg = await progress();
  const errs = await store.kvGet(errKey(), {});
  const passed = Object.keys(pg.passed).length;
  const nextL = course.lessons.find((l) => !pg.passed[l.id]) || course.lessons[0];
  const open = (l) => pg.open || l.id === 1 || pg.passed[l.id - 1] || pg.passed[l.id] || pg.at[l.id];
  const top = Object.entries(errs).filter(([, v]) => v.w).sort((a, b) => b[1].w - a[1].w).slice(0, 3);

  el.append(...kids(
    h('div.pron-hero',
      mascotImg('chao', 'hero-mascot'),
      h('div.small', course.kicker),
      h('h1', course.title),
      h('p', course.desc),
      h('div.row', { style: { gap: '10px', alignItems: 'center', marginTop: '8px' } }, h('b', `${passed}/${course.lessons.length} bài`), h('div.grow', progressBar(passed / course.lessons.length))),
      h('a.btn.primary', { href: `#/pron/${LANG}/${nextL.id}`, style: { marginTop: '12px' } }, passed ? `Học tiếp Bài ${nextL.id} ›` : 'Bắt đầu Bài 1 ›'),
    ),
    h('div.pron-rhythm', ...[
      ['Ôn bài cũ', '5 câu nghe của bài trước'], ['Khởi động', 'Nghe ví dụ, tự đoán điểm khác'], ['Học từng mục', 'Sơ đồ lưỡi, khẩu hình, mẹo nhớ'],
      ['Luyện ngay', 'Nghe chọn, gõ pinyin – sai câu nào luyện lại câu đó'], ['Nói', 'Ghi âm, máy chấm'], ['Củng cố', 'Xếp rổ, đua 60 giây'], ['Kiểm tra', 'Đạt 8/10 là qua bài'],
    ].map(([t, d], i) => h('div.rh', h('div.rh-n', String(i + 1)), h('div', h('b', t), h('div.small.faint', d))))),
    h('div.hub-grid', { style: { marginTop: '14px' } },
      course.tools.map(([href, mark, t, sub]) => h('a.hub-tile', { href },
        h('div.hub-mark', mark), h('div.grow', h('b', t), h('div.small.faint', sub))))),
    top.length ? h('div.note.amber', { style: { marginTop: '12px' } }, h('b', 'Lỗi hay gặp của bạn: '),
      top.map(([t, v]) => `${course.tags[t] || t} (sai ${v.w})`).join(' · '), ' ', h('a', { href: `#/pron/${LANG}/loi` }, 'Ôn ngay ›')) : null,
  ));
  for (const part of course.parts) {
    el.append(h('h3', { style: { marginTop: '20px' } }, h('span.small.faint', `PHẦN ${part.n} · `), part.name), h('div.small.faint', part.sub));
    for (const l of course.lessons.filter((x) => x.part === part.n)) {
      const ok = pg.passed[l.id];
      const can = open(l);
      el.append(h(can ? 'a.lesson-row' : 'div.lesson-row.lock', can ? { href: `#/pron/${LANG}/${l.id}` } : {},
        h('div.lesson-n', ok ? '✓' : String(l.id)),
        h('div.grow', h('b', `Bài ${l.id} · ${l.title}`), h('div.small.faint', l.sub)),
        h('span.small', ok ? `${ok}/10` : can ? (pg.at[l.id] ? 'Học tiếp' : 'Học ngay') : '🔒')));
    }
  }
  el.append(h('div.small.faint', { style: { marginTop: '16px' } }, course.note,
    ' ', pg.open ? null : h('a', { href: '#', onclick: async (e) => { e.preventDefault(); await saveProgress((p) => { p.open = true; return p; }); location.reload(); } }, 'Đã biết phát âm? Mở hết các bài.')));
}

/* ---------- ôn theo lỗi ---------- */
async function renderErrors(course, el) {
  const errs = await store.kvGet(errKey(), {});
  const list = Object.entries(errs).filter(([t, v]) => v.w && course.tags[t]).sort((a, b) => b[1].w - a[1].w);
  el.append(h('h1', 'Ôn theo lỗi của bạn'), h('p.muted', 'App ghi lại mỗi lần bạn nghe nhầm, theo từng cặp âm. Bài ôn dưới đây lấy đúng những cặp bạn sai nhiều nhất.'));
  if (!list.length) { el.append(h('div.note.jade', 'Chưa có lỗi nào được ghi. Học vài bài rồi quay lại đây nhé.')); return; }
  el.append(h('div.card', ...list.slice(0, 8).map(([t, v]) => h('div.row.spread', { style: { padding: '6px 0' } },
    h('div', h('b', course.tags[t]), h('div.small.faint', `Sai ${v.w} lần · đúng ${v.r} lần`)),
    h('div', { style: { width: '120px' } }, progressBar(v.r / Math.max(1, v.r + v.w)))))));
  const tags = new Set(list.slice(0, 3).map(([t]) => t));
  const pool = course.lessons.flatMap(lessonPool).filter((q) => tags.has(q.tag));
  const box = h('div', { style: { marginTop: '12px' } });
  el.append(h('button.btn.primary.block', {
    style: { marginTop: '12px' },
    onclick: () => runQuestions(box, shuffle(pool).slice(0, 12), { mode: 'practice', onDone: ({ right, total }) => {
      box.replaceChildren(h('div.card', h('h2', `Xong: đúng ngay ${right}/${total}`), h('a.btn.ghost', { href: `#/pron/${LANG}/loi` }, 'Xem lại bảng lỗi')));
      award(5, 'Ôn lỗi phát âm');
    } }),
  }, `Ôn 12 câu về: ${[...tags].map((t) => course.tags[t]).join(', ')}`), box);
}

/* ---------- 20 tổ hợp thanh ---------- */
async function renderCombos(el) {
  const combos = await load('data/pron/combos.json');
  el.append(h('h1', '20 tổ hợp thanh'), h('p.muted', 'Từ hai âm tiết có 20 kiểu ghép thanh. Thanh 3 đứng trước thanh khác chỉ đọc nửa đầu (đi xuống thấp); hai thanh 3 liền nhau thì thanh đầu đọc thành thanh 2.'));
  const box = h('div');
  el.append(h('button.btn.primary.block', {
    onclick: () => {
      const items = shuffle(combos.flatMap((c) => c.words.slice(0, 3))).slice(0, 12);
      runQuestions(box, questionsOf({ t: 'combo', items }), { mode: 'practice', onDone: ({ right, total }) => { box.replaceChildren(h('div.card', h('h2', `Đúng ngay ${right}/${total}`))); award(5, 'Luyện tổ hợp thanh'); } });
      box.scrollIntoView({ behavior: 'smooth' });
    },
  }, 'Luyện nghe 12 từ ngẫu nhiên ›'), box);
  const grid = h('div.combo-grid');
  for (const c of combos) {
    const [a, b] = c.p;
    const chart = h('div'); chart.innerHTML = comboChart(a, b);
    grid.append(h('div.card.combo-card',
      h('b', { style: { color: TONE_COLORS[a] } }, `${a || 'nhẹ'}`, h('span.faint', ' + '), h('span', { style: { color: TONE_COLORS[b] } }, `${b || 'nhẹ'}`)),
      chart,
      ...c.words.slice(0, 4).map((s) => { const it = parse(s); return h('button.pron-ex-row', { onclick: () => say(it) }, h('span.pron-ex-w.cn', it.w), h('span.pron-ex-py', tonedSpan(it.py)), h('span.small.faint.grow', it.vi)); })));
  }
  el.append(grid);
}

/* ---------- bảng pinyin ---------- */
async function renderGrid(el) {
  const G = await load('data/pinyin-grid.json');
  let tone = 1;
  const info = h('div.card.grid-info', h('div.small.faint', 'Bấm vào một ô để nghe. Bấm phụ âm ở cột trái hoặc vần ở hàng trên để nghe riêng.'));
  const toneBar = h('div.seg');
  const tables = h('div');
  const showCell = (ini, fin, cell) => {
    const row = G.rows.find((r) => r.i === ini);
    const f = G.groups.flatMap((g) => g.finals).find((x) => x.f === fin);
    info.replaceChildren(...kids(
      h('div.row', { style: { gap: '12px', alignItems: 'baseline', flexWrap: 'wrap' } }, h('b', { style: { fontSize: '26px' } }, cell.s),
        ...[1, 2, 3, 4].filter((t) => cell.t[t]).map((t) => h('button.tone-chip', { style: { borderColor: TONE_COLORS[t] }, onclick: () => say(cell.t[t][0]) },
          h('span', { style: { color: TONE_COLORS[t], fontWeight: 700 } }, addMark(cell.s, t)), ' ', h('span.cn', cell.t[t][0]), h('span.small.faint', ` ${cell.t[t][1]}`)))),
      row?.tip ? h('div.small', { style: { marginTop: '6px' } }, h('b', `${ini} · ${row.g}: `), row.tip) : null,
      f?.tip ? h('div.small', h('b', `${fin}: `), f.tip) : null,
    ));
  };
  const drawTables = () => {
    tables.replaceChildren();
    for (const g of G.groups) {
      const head = h('tr', h('th', ''), ...g.finals.map((f) => h('th.gh', { onclick: () => { if (f.say) say(f.say); info.replaceChildren(h('b', f.f), h('div.small', f.tip)); } }, f.f)));
      const body = [];
      for (const r of G.rows) {
        const cells = g.finals.map((f) => G.cells[`${r.i}|${f.f}`]);
        if (!cells.some(Boolean)) continue;
        body.push(h('tr', h('th.gr', { onclick: () => { if (r.say) say(r.say); info.replaceChildren(h('b', r.i ? `${r.i} · ${r.g}` : 'Không phụ âm'), h('div.small', r.tip || 'Âm tiết bắt đầu bằng nguyên âm.')); } }, r.i || '∅'),
          ...cells.map((c, k) => {
            if (!c) return h('td');
            const has = tone === 'all' ? true : !!c.t[tone];
            return h('td.gc' + (has ? '' : '.off'), {
              onclick: async () => {
                showCell(r.i, g.finals[k].f, c);
                if (tone === 'all') { for (const t of [1, 2, 3, 4]) if (c.t[t]) await sayWait(c.t[t][0]); } else if (c.t[tone]) say(c.t[tone][0]);
              },
              style: tone !== 'all' && has ? { color: TONE_COLORS[tone] } : {},
            }, tone === 'all' ? c.s : addMark(c.s, has ? tone : 0));
          })));
      }
      tables.append(h('h3', { style: { marginTop: '16px' } }, g.name), h('div.grid-scroll', h('table.py-grid', h('thead', head), h('tbody', ...body))));
    }
  };
  const drawBar = () => toneBar.replaceChildren(...[[1, 'ā Thanh 1'], [2, 'á Thanh 2'], [3, 'ǎ Thanh 3'], [4, 'à Thanh 4'], ['all', '1234 Cả 4 thanh']].map(([t, label]) =>
    h('button' + (tone === t ? '.on' : ''), { onclick: () => { tone = t; drawBar(); drawTables(); } }, label)));
  drawBar(); drawTables();
  el.append(h('h1', 'Bảng pinyin có âm thanh'),
    h('p.muted', `${Object.keys(G.cells).length} âm tiết tiếng phổ thông, xếp theo phụ âm đầu × vần. Chọn thanh rồi bấm ô để nghe, hoặc chọn "Cả 4 thanh" để nghe lần lượt. Mỗi thanh có chữ Hán ví dụ.`),
    toneBar, info, tables);
}

/* ---------- bảng IPA tiếng Anh ---------- */
async function renderIpa(course, el) {
  el.append(h('h1', 'Bảng âm tiếng Anh (IPA)'), h('p.muted', '44 âm của tiếng Anh, mỗi âm có từ ví dụ và mẹo cho người Việt. Bấm từ để nghe.'));
  for (const g of course.ipa) {
    el.append(h('h3', { style: { marginTop: '16px' } }, g.name));
    el.append(h('div.ipa-grid', ...g.items.map((x) => h('div.card.ipa-card',
      h('div.ipa-sym', `/${x.s}/`),
      h('div.row', { style: { gap: '6px', flexWrap: 'wrap' } }, ...x.w.split(' ').map((w) => h('button.tone-chip', { onclick: () => sayEn(w) }, w))),
      h('div.small.faint', x.tip)))));
  }
}

/* ---------- vào ---------- */
export async function render(route) {
  LANG = route.args[0] === 'en' ? 'en' : 'zh';
  settings = await store.settings();
  const course = await load(`data/pron/${LANG}.json`);
  const sub = route.args[1];
  const el = h('div.pron');
  let cleanup = null;
  if (!sub) await renderHub(course, el);
  else if (sub === 'loi') await renderErrors(course, el);
  else if (sub === 'thanh') await renderCombos(el);
  else if (sub === 'bang') { if (LANG === 'zh') await renderGrid(el); else await renderIpa(course, el); }
  else if (sub === 'dua') {
    const pool = course.lessons.flatMap(lessonPool);
    const pg = await progress();
    el.append(h('h1', 'Đua 60 giây'), h('p.muted', `Câu hỏi lấy từ cả khoá. Kỷ lục: ${pg.race || 0} câu.`));
    const box = h('div'); el.append(box);
    raceGame(box, pool);
  } else cleanup = await renderLesson(course, Number(sub), el);
  return { title: course.short, el, cleanup: () => { cleanup?.(); raceStop?.(); raceStop = null; } };
}
