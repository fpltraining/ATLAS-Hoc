/* Trò ôn nhanh tiếng Trung, dùng từ đã học (pool.js).

   #/games          danh sách trò
   #/games/listen   Nghe → chọn chữ Hán
   #/games/reflex   Phản xạ: chọn nghĩa trước khi hết giờ
   #/games/match    Nối cặp chữ Hán với nghĩa, tính giờ
   #/games/compose  Ghép bộ phận thành chữ
   #/games/vanish   Chữ nào biến mất

   Điểm cao nhất mỗi trò lưu ở kv 'games'. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { shuffle } from '../kit.js';
import { learnedWords, shortVi } from '../pool.js';
import { h, pill } from '../ui.js';

const GAMES = [
  { id: 'listen',  mark: '🎧', title: 'Nghe → chọn chữ', sub: 'Nghe phát âm, chọn đúng chữ Hán', unit: 'đúng' },
  { id: 'reflex',  mark: '⚡', title: 'Phản xạ', sub: 'Chọn nghĩa đúng trước khi hết 6 giây', unit: 'điểm' },
  { id: 'match',   mark: '🀄', title: 'Nối cặp', sub: 'Nối 6 cặp chữ – nghĩa nhanh nhất có thể', unit: 'giây', low: true },
  { id: 'compose', mark: '🧩', title: 'Ghép bộ phận thành chữ', sub: 'Chọn các bộ phận theo đúng thứ tự', unit: 'đúng' },
  { id: 'vanish',  mark: '🎯', title: 'Chữ nào biến mất?', sub: 'Nhớ nhanh 5 chữ, tìm chữ vừa bị giấu', unit: 'đúng' },
];

async function bests() { return store.kvGet('games', {}); }

async function saveBest(id, score) {
  const g = GAMES.find((x) => x.id === id);
  let better = false;
  await store.kvUpdate('games', {}, (all) => {
    const prev = all[id];
    better = prev == null || (g.low ? score < prev : score > prev);
    if (better) all[id] = score;
    return all;
  });
  return better;
}

export async function render(route) {
  const id = route.args[0];
  if (!id) return hub();
  const words = (await learnedWords('zh', 16)).filter((w) => w.lang === 'zh');
  if (words.length < 6) {
    return { title: 'Trò ôn nhanh', el: h('div.empty', 'Cần thêm vài từ tiếng Trung đã học để chơi. Vào một bài học trước nhé.') };
  }
  const settings = await store.settings();
  const ctx = {
    words,
    say: (w) => audio.speak(w, { rate: settings.speechRate }),
  };
  const game = { listen, reflex, match, compose, vanish }[id];
  if (!game) return hub();
  const g = GAMES.find((x) => x.id === id);
  const view = await game(ctx, g);
  return { title: g.title, ...view };
}

async function hub() {
  const b = await bests();
  return {
    title: 'Trò ôn nhanh',
    el: h('div.stack',
      h('p.small.muted', 'Dùng những từ tiếng Trung bạn đã học. Mỗi trò 2–3 phút.'),
      ...GAMES.map((g) => h('a.hub-tile', { href: `#/games/${g.id}` },
        h('span.hub-mark', g.mark),
        h('span.grow', h('b', g.title), h('span.small.faint.block', g.sub)),
        b[g.id] != null ? h('span.pill.jade', `Kỷ lục ${b[g.id]} ${g.unit}`) : null,
        h('span.faint', '›'),
      )),
    ),
  };
}

/* Khung kết quả chung */
async function resultCard(g, score, text, extra = null) {
  const better = await saveBest(g.id, score);
  return h('div.card.center',
    h('div.score-big', `${score} ${g.unit}`),
    h('h3', text),
    better ? h('div.pill.jade', 'Kỷ lục mới!') : null,
    extra,
    h('div.btn-row', { style: { marginTop: '16px' } },
      h('button.btn', { onclick: () => window.dispatchEvent(new HashChangeEvent('hashchange')) }, '↻ Chơi lại'),
      h('a.btn.primary', { href: '#/games' }, 'Trò khác'),
    ),
  );
}

const wrongList = (items) => (items.length
  ? h('div', { style: { textAlign: 'left', marginTop: '12px' } }, h('h4', 'Cần ôn lại'),
    ...items.map((it) => h('div', { style: { margin: '4px 0' } }, h('b.cn', it.w), ' ', h('span.py', it.py), ' · ', it.vi)))
  : null);

/* Chọn 3 từ nhiễu khác chữ và khác nghĩa */
function distractors(words, it, n = 3) {
  return shuffle(words.filter((x) => x.w !== it.w && shortVi(x.vi) !== shortVi(it.vi))).slice(0, n);
}

/* ---------- Nghe → chọn chữ ---------- */
async function listen(ctx, g) {
  const qs = shuffle(ctx.words).slice(0, 10);
  const body = h('div');
  const S = { i: 0, right: 0, wrong: [] };

  function show() {
    const it = qs[S.i];
    const opts = shuffle([it, ...distractors(ctx.words, it)]);
    let done = false;
    const grid = h('div.game-grid');
    opts.forEach((o) => grid.append(h('button.game-tile.cn', {
      onclick: (e) => {
        if (done) return;
        done = true;
        const ok = o === it;
        if (ok) S.right++; else { S.wrong.push(it); e.currentTarget.classList.add('no'); }
        [...grid.children][opts.indexOf(it)].classList.add('ok');
        note.replaceChildren(h('div', h('span.py', it.py), ' · ', it.vi),
          h('button.btn.primary.block', { style: { marginTop: '10px' }, onclick: next }, S.i < qs.length - 1 ? 'Câu tiếp ›' : 'Xem kết quả'));
      },
    }, o.w)));
    const note = h('div', { style: { marginTop: '12px' } });
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`Câu ${S.i + 1}/${qs.length}`, 'plain'), h('span.small.faint', `Đúng ${S.right}`)),
      h('div.center', { style: { margin: '16px 0' } },
        h('button.btn.jade', { style: { width: '84px', height: '84px', borderRadius: '99px', fontSize: '28px' }, onclick: () => ctx.say(it.w) }, '🔊'),
        h('div.small.faint', { style: { marginTop: '8px' } }, 'Bấm để nghe lại')),
      grid, note,
    ));
    setTimeout(() => ctx.say(it.w), 250);
  }
  async function next() {
    if (S.i < qs.length - 1) { S.i++; show(); return; }
    body.replaceChildren(await resultCard(g, S.right, `Nghe đúng ${S.right}/${qs.length} từ`, wrongList(S.wrong)));
  }
  show();
  return { el: body };
}

/* ---------- Phản xạ ---------- */
async function reflex(ctx, g) {
  const LIMIT = 6000;
  const qs = shuffle(ctx.words).slice(0, 15);
  const body = h('div');
  const S = { i: 0, score: 0, right: 0, wrong: [], timer: 0, raf: 0 };

  function show() {
    const it = qs[S.i];
    const opts = shuffle([it, ...distractors(ctx.words, it)]);
    const bar = h('div.time-bar', h('i'));
    const t0 = performance.now();
    let done = false;
    const finish = (picked, el) => {
      if (done) return;
      done = true;
      cancelAnimationFrame(S.raf);
      const left = Math.max(0, LIMIT - (performance.now() - t0));
      const ok = picked === it;
      if (ok) { S.right++; S.score += 10 + Math.round(left / 600); } // trả lời nhanh được thêm điểm
      else { S.wrong.push(it); el?.classList.add('no'); }
      [...list.children][opts.indexOf(it)].classList.add('ok');
      S.timer = setTimeout(next, ok ? 500 : 1300);
    };
    const list = h('div.mcq');
    opts.forEach((o) => list.append(h('button.mcq-opt', { onclick: (e) => finish(o, e.currentTarget) }, shortVi(o.vi))));
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${S.i + 1}/${qs.length}`, 'plain'), h('b', `${S.score} điểm`)),
      bar,
      h('div.center', { style: { margin: '14px 0' } }, h('div.cn', { style: { fontSize: '54px' } }, it.w)),
      list,
    ));
    const fill = bar.firstChild;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / LIMIT);
      fill.style.width = `${(1 - p) * 100}%`;
      if (p >= 1) finish(null, null);
      else S.raf = requestAnimationFrame(tick);
    };
    S.raf = requestAnimationFrame(tick);
  }
  async function next() {
    if (S.i < qs.length - 1) { S.i++; show(); return; }
    body.replaceChildren(await resultCard(g, S.score, `Đúng ${S.right}/${qs.length} câu`, wrongList(S.wrong)));
  }
  show();
  return { el: body, cleanup: () => { clearTimeout(S.timer); cancelAnimationFrame(S.raf); } };
}

/* ---------- Nối cặp ---------- */
async function match(ctx, g) {
  const picked = [];
  for (const w of shuffle(ctx.words)) {
    if (picked.length >= 6) break;
    if (picked.some((p) => shortVi(p.vi) === shortVi(w.vi))) continue;
    picked.push(w);
  }
  const tiles = shuffle([
    ...picked.map((w, i) => ({ pair: i, text: w.w, cn: true })),
    ...picked.map((w, i) => ({ pair: i, text: shortVi(w.vi), cn: false })),
  ]);
  const body = h('div');
  const clock = h('b', '0 giây');
  const t0 = Date.now();
  const timer = setInterval(() => { clock.textContent = `${Math.round((Date.now() - t0) / 1000)} giây`; }, 500);
  let first = null, left = picked.length, misses = 0;
  const grid = h('div.match-grid');
  tiles.forEach((t) => {
    const b = h(`button.game-tile.match-tile${t.cn ? '.cn' : ''}`, {
      onclick: async () => {
        if (b.classList.contains('gone') || b === first) return;
        if (t.cn) ctx.say(t.text);
        if (!first) { first = b; first._t = t; b.classList.add('sel'); return; }
        const a = first; first = null;
        a.classList.remove('sel');
        if (a._t.pair === t.pair && a._t.cn !== t.cn) {
          a.classList.add('gone'); b.classList.add('gone');
          left--;
          if (!left) {
            clearInterval(timer);
            const secs = Math.round((Date.now() - t0) / 1000) + misses * 3;
            body.replaceChildren(await resultCard(g, secs, misses ? `Nối xong, sai ${misses} lần (+${misses * 3} giây phạt)` : 'Nối xong, không sai lần nào',
              h('div', { style: { textAlign: 'left', marginTop: '12px' } },
                ...picked.map((it) => h('div', { style: { margin: '4px 0' } }, h('b.cn', it.w), ' ', h('span.py', it.py), ' · ', it.vi)))));
          }
        } else {
          misses++;
          a.classList.add('no'); b.classList.add('no');
          setTimeout(() => { a.classList.remove('no'); b.classList.remove('no'); }, 450);
        }
      },
    }, t.text);
    grid.append(b);
  });
  body.replaceChildren(h('div.card',
    h('div.row.spread', h('span.small.faint', 'Chạm một chữ rồi chạm nghĩa của nó. Sai một lần cộng 3 giây.'), clock),
    grid,
  ));
  return { el: body, cleanup: () => clearInterval(timer) };
}

/* ---------- Ghép bộ phận thành chữ ---------- */
async function compose(ctx, g) {
  await Promise.all([data.ensureDecomp(), data.ensureHanViet()]);
  // Lấy các chữ trong từ đã học có từ 2 bộ phận trở lên
  const seen = new Set();
  const chars = [];
  for (const w of ctx.words) {
    for (const ch of [...w.w].filter(data.isHan)) {
      if (seen.has(ch)) continue;
      seen.add(ch);
      const parts = data.partsOf(ch);
      if (parts.length >= 2) chars.push({ ch, parts, d: data.decompOf(ch), py: data.pyOf(ch) });
    }
  }
  if (chars.length < 4) {
    return { el: h('div.empty', 'Chưa đủ chữ có cấu tạo để chơi. Học thêm vài bài rồi quay lại nhé.') };
  }
  const allParts = [...new Set(chars.flatMap((c) => c.parts))];
  const qs = shuffle(chars).slice(0, 8);
  const body = h('div');
  const S = { i: 0, right: 0, wrong: [] };

  function show() {
    const q = qs[S.i];
    const extra = shuffle(allParts.filter((p) => !q.parts.includes(p))).slice(0, Math.max(2, 6 - q.parts.length));
    const pieces = shuffle([...q.parts, ...extra]);
    const chosen = [];
    const slots = h('div.row', { style: { gap: '8px', justifyContent: 'center', minHeight: '64px' } });
    const drawSlots = () => slots.replaceChildren(...q.parts.map((_, k) => h('div.slot.cn', chosen[k] || '')));
    drawSlots();
    const label = data.IDS_LABEL[q.d.d[0]] || '';
    const note = h('div', { style: { marginTop: '12px' } });
    let done = false;
    const grid = h('div.game-grid.six');
    pieces.forEach((p) => grid.append(h('button.game-tile.cn', {
      onclick: (e) => {
        if (done || e.currentTarget.disabled) return;
        chosen.push(p);
        e.currentTarget.disabled = true;
        drawSlots();
        if (chosen.length === q.parts.length) {
          done = true;
          const ok = chosen.every((c, k) => c === q.parts[k]);
          if (ok) S.right++; else S.wrong.push({ w: q.ch, py: q.py, vi: q.d.vi || '' });
          note.replaceChildren(
            h(`div.note.${ok ? 'jade' : 'seal'}`, ok ? 'Đúng rồi! ' : 'Chưa đúng. ',
              h('span.cn', { style: { fontSize: '22px' } }, q.ch), ' = ', q.parts.join(' + '),
              label ? ` (${label})` : ''),
            h('button.btn.primary.block', { style: { marginTop: '10px' }, onclick: next }, S.i < qs.length - 1 ? 'Chữ tiếp ›' : 'Xem kết quả'));
          ctx.say(q.ch);
        }
      },
    }, p)));
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`Chữ ${S.i + 1}/${qs.length}`, 'plain'), h('span.small.faint', `Đúng ${S.right}`)),
      h('div.center', { style: { margin: '12px 0' } },
        h('div', { style: { fontSize: '20px', fontWeight: 600 } }, q.d.vi || ''),
        h('div', h('span.py', q.py), label ? h('span.small.faint', ` · kết cấu ${label}`) : null),
        h('div.small.faint', `Chọn ${q.parts.length} bộ phận theo thứ tự`)),
      slots,
      h('div', { style: { marginTop: '12px' } }, grid),
      h('button.btn.sm.ghost', { style: { marginTop: '8px' }, onclick: () => { if (!done) show(); } }, '↶ Chọn lại'),
      note,
    ));
  }
  async function next() {
    if (S.i < qs.length - 1) { S.i++; show(); return; }
    body.replaceChildren(await resultCard(g, S.right, `Ghép đúng ${S.right}/${qs.length} chữ`, wrongList(S.wrong)));
  }
  show();
  return { el: body };
}

/* ---------- Chữ nào biến mất ---------- */
async function vanish(ctx, g) {
  const ROUNDS = 8;
  const SHOW = 4000;
  const body = h('div');
  const S = { i: 0, right: 0, wrong: [], timer: 0 };

  function show() {
    const set = [];
    for (const w of shuffle(ctx.words)) {
      if (set.length >= 5) break;
      if (w.w.length <= 2 && !set.some((x) => x.w === w.w)) set.push(w);
    }
    const gone = set[Math.floor(Math.random() * set.length)];
    const grid = h('div.game-grid.five', ...set.map((w) => h('div.game-tile.cn.static', w.w)));
    const bar = h('div.time-bar', h('i'));
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`Lượt ${S.i + 1}/${ROUNDS}`, 'plain'), h('span.small.faint', `Đúng ${S.right}`)),
      h('p.small.muted', 'Nhớ thật nhanh 5 chữ này.'), bar, grid,
    ));
    bar.firstChild.style.transition = `width ${SHOW}ms linear`;
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.firstChild.style.width = '0%'; }));
    S.timer = setTimeout(() => ask(set, gone), SHOW);
  }

  function ask(set, gone) {
    const remain = shuffle(set.filter((w) => w !== gone));
    const opts = shuffle([gone, ...distractors(ctx.words.filter((w) => !set.includes(w)), gone)]);
    let done = false;
    const list = h('div.game-grid');
    const note = h('div', { style: { marginTop: '12px' } });
    opts.forEach((o) => list.append(h('button.game-tile.cn', {
      onclick: (e) => {
        if (done) return;
        done = true;
        if (o === gone) S.right++; else { S.wrong.push(gone); e.currentTarget.classList.add('no'); }
        [...list.children][opts.indexOf(gone)].classList.add('ok');
        note.replaceChildren(h('div', h('b.cn', gone.w), ' ', h('span.py', gone.py), ' · ', gone.vi),
          h('button.btn.primary.block', { style: { marginTop: '10px' }, onclick: next }, S.i < ROUNDS - 1 ? 'Lượt tiếp ›' : 'Xem kết quả'));
        ctx.say(gone.w);
      },
    }, o.w)));
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`Lượt ${S.i + 1}/${ROUNDS}`, 'plain'), h('span.small.faint', `Đúng ${S.right}`)),
      h('p.small.muted', 'Còn lại 4 chữ. Chữ nào vừa biến mất?'),
      h('div.game-grid.five', ...remain.map((w) => h('div.game-tile.cn.static', w.w)), h('div.game-tile.static.hole', '?')),
      h('div', { style: { marginTop: '14px' } }, list), note,
    ));
  }
  async function next() {
    if (S.i < ROUNDS - 1) { S.i++; show(); return; }
    body.replaceChildren(await resultCard(g, S.right, `Nhớ đúng ${S.right}/${ROUNDS} lượt`, wrongList(S.wrong)));
  }
  show();
  return { el: body, cleanup: () => clearTimeout(S.timer) };
}

export { GAMES };
