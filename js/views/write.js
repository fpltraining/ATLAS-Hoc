/* Màn hình luyện viết — trái tim của app.

   Năm chế độ:
     0. Nhiều lượt   — viết một chữ 5 lượt, gợi ý mờ dần từ đồ chữ tới ô trống
     1. Xem mẫu      — chữ tự viết ra theo đúng thứ tự nét
     2. Đồ chữ       — có chữ mờ bên dưới, chấm từng nét
     3. Có gợi ý     — ô trống; sai hai lần mới hiện nét mờ
     4. Viết trí nhớ — chỉ có nghĩa và pinyin, viết cả chữ rồi mới chấm
*/

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { WritingPad } from '../pen/canvas.js';
import { drawChar, drawPartialStroke } from '../pen/grid.js';
import { gradeInOrder, gradeWhole, verdict, STRICTNESS } from '../pen/grade.js';
import { h, frag, toast, readingLine, pill } from '../ui.js';

const MODES = [
  { id: 'luot',    label: 'Nhiều lượt' },
  { id: 'xem',     label: 'Xem mẫu' },
  { id: 'do',      label: 'Đồ chữ' },
  { id: 'goi-y',   label: 'Gợi ý' },
  { id: 'tri-nho', label: 'Trí nhớ' },
];

/* Các lượt của chế độ Nhiều lượt: gợi ý bớt dần.
   miss = sai bao nhiêu lần thì hiện mũi tên của nét đang viết. */
const ROUNDS = [
  { ghost: true,  arrow: true,  miss: 0, text: 'Có chữ mờ và mũi tên chiều nét' },
  { ghost: true,  arrow: true,  miss: 0, text: 'Có chữ mờ và mũi tên chiều nét' },
  { ghost: true,  arrow: false, miss: 1, text: 'Chỉ còn chữ mờ, sai một lần mới hiện mũi tên' },
  { ghost: false, arrow: false, miss: 1, text: 'Ô trống, sai một lần hiện mũi tên' },
  { ghost: false, arrow: false, miss: 2, text: 'Ô trống, tự viết theo trí nhớ; sai hai lần mới hiện mũi tên' },
];

export async function render(route) {
  const target = route.args[0] || '';
  const [settings] = await Promise.all([
    store.settings(), data.ensureHanViet(), data.ensureDecomp(),
  ]);

  /* ---- xác định danh sách chữ cần luyện ---- */
  let chars = [];
  let title = 'Luyện viết';
  let lessonId = null;

  if (target.startsWith('lesson-')) {
    lessonId = Number(target.slice(7));
    const idx = await data.curriculum();
    const meta = idx.lessons.find((l) => l.id === lessonId);
    if (meta) { chars = meta.newChars.slice(); title = `Viết · Bài ${meta.no ?? lessonId}`; }
  } else if (target.startsWith('rad-')) {
    const rads = await data.radicals();
    chars = rads.groups.flatMap((g) => g.items.map((i) => i.std));
    chars = [...new Set(chars)];
    title = 'Viết · Bộ thủ';
  } else if (target) {
    chars = [...target].filter(data.isHan);
    title = `Viết · ${target}`;
  }
  if (!chars.length) {
    return { title, el: h('div.empty', 'Chưa chọn chữ nào để luyện.') };
  }

  await data.preloadChars(chars);
  chars = chars.filter((c) => data.strokeDataSync(c));
  if (!chars.length) {
    return { title, el: h('div.empty', 'Không có dữ liệu nét cho chữ này.') };
  }

  const backMap = route.query.map || '';

  /* ---- trạng thái ---- */
  const S = {
    i: Math.max(0, Math.min(chars.length - 1, Number(route.query.start) || 0)),
    mode: route.query.mode || 'luot',
    round: 0,
    roundScores: [],
    expect: 0,
    attempts: 0,
    results: [],
    anim: null,
    done: 0,
    scores: [],
  };

  /* ---- dựng giao diện ---- */
  const padEl = h('div.pad');
  const hintEl = h('div.pad-hint', '');
  padEl.append(hintEl);

  const charTitle = h('div.cn', { style: { fontSize: '26px', lineHeight: 1.1 } });
  const readEl = h('div');
  const meaningEl = h('div.small.muted');
  const dotsEl = h('div.stroke-dots');
  const feedbackEl = h('div.note', { style: { minHeight: '44px' } });
  const counterEl = h('span.pill.plain');

  const modeSeg = h('div.mode-seg');
  for (const m of MODES) {
    modeSeg.append(h('button', {
      dataset: { mode: m.id },
      onclick: () => setMode(m.id),
    }, m.label));
  }

  const btnAnimate = h('button.btn.sm', { onclick: () => playAnimation() }, '▶ Xem nét');
  const btnUndo = h('button.btn.sm', { onclick: () => { pad.undo(); } }, '↶ Xoá nét');
  const btnClear = h('button.btn.sm', { onclick: () => resetChar() }, '✕ Làm lại');
  const btnSpeak = h('button.btn.sm', {
    onclick: () => audio.speak(chars[S.i], { rate: settings.speechRate }),
  }, '🔊 Đọc');
  const btnGrade = h('button.btn.seal', { onclick: () => gradeFree() }, '✓ Chấm bài');
  const btnNext = h('button.btn.primary', { onclick: () => nextChar() }, 'Chữ tiếp ›');

  const side = h('div.write-side.stack',
    h('div.card',
      h('div.row.spread', charTitle, counterEl),
      readEl, meaningEl,
    ),
    modeSeg,
    h('div.card', { style: { padding: '12px' } },
      h('div.row', { style: { justifyContent: 'center', marginBottom: '10px' } }, dotsEl),
      feedbackEl,
    ),
    h('div.btn-row', btnAnimate, btnSpeak, btnUndo, btnClear),
    h('div.btn-row', btnGrade, btnNext),
    h('a.btn.ghost.sm', { href: '#' , onclick: (e) => { e.preventDefault(); showCharInfo(); } },
      'Xem cấu tạo chữ'),
  );

  const el = h('div.write-wrap', padEl, side);

  /* ---- bảng viết ---- */
  const pad = new WritingPad(padEl, {
    grid: settings.grid,
    brush: settings.brush,
    penOnly: settings.penOnly,
    penSound: settings.penSound,
    onStroke: (units) => onStroke(units),
  });

  /* ---- điều khiển ---- */

  function current() { return data.strokeDataSync(chars[S.i]); }

  function setMode(mode) {
    S.mode = mode;
    for (const b of modeSeg.children) b.classList.toggle('on', b.dataset.mode === mode);
    resetChar();
  }

  function resetChar() {
    S.round = 0;
    S.roundScores = [];
    resetRound();
  }

  function resetRound() {
    stopAnimation();
    S.expect = 0;
    S.attempts = 0;
    S.results = [];
    pad.clearInk();
    pad.lock(false);
    applyHint();
    renderInfo();
    if (S.mode === 'xem') playAnimation();
  }

  function applyHint() {
    const ch = current();
    if (!ch) return;
    if (S.mode === 'luot') {
      const r = ROUNDS[S.round];
      pad.setHint({
        ghost: r.ghost,
        upTo: S.expect,
        median: r.arrow || S.attempts >= r.miss ? S.expect : null,
      });
    } else if (S.mode === 'xem') {
      pad.setHint({ ghost: true, numbers: false });
    } else if (S.mode === 'do') {
      pad.setHint({ ghost: true, upTo: S.expect, median: S.expect });
    } else if (S.mode === 'goi-y') {
      pad.setHint({
        ghost: false,
        upTo: S.expect,
        median: S.attempts >= 2 ? S.expect : null,
      });
    } else {
      pad.setHint({ ghost: false });
    }
  }

  function renderInfo() {
    const ch = chars[S.i];
    const d = current();
    charTitle.textContent = ch;
    readEl.replaceChildren(readingLine(data.pyOf(ch), data.hvOf(ch)));
    const dc = data.decompOf(ch);
    meaningEl.textContent = dc?.vi || '';
    counterEl.textContent = S.mode === 'luot'
      ? `Lượt ${Math.min(S.round + 1, ROUNDS.length)}/${ROUNDS.length} · chữ ${S.i + 1}/${chars.length}`
      : `${S.i + 1}/${chars.length}`;

    dotsEl.replaceChildren();
    for (let i = 0; i < d.medians.length; i++) {
      const r = S.results[i];
      const cls = r ? (r.pass ? 'ok' : r.score >= 45 ? 'warn' : 'bad')
        : (i === S.expect && S.mode !== 'tri-nho' && S.mode !== 'xem' ? 'now' : '');
      dotsEl.append(h(`i.${cls || 'x'}`));
    }

    const isFree = S.mode === 'tri-nho';
    btnGrade.hidden = !isFree;
    btnAnimate.hidden = false;

    if (S.mode === 'xem') {
      hintEl.textContent = `${d.medians.length} nét — bấm "Xem nét" để chạy lại`;
      feedbackEl.className = 'note';
      feedbackEl.textContent = 'Quan sát kỹ thứ tự và chiều của từng nét, rồi chuyển sang chế độ Đồ chữ.';
    } else if (isFree) {
      hintEl.textContent = 'Viết cả chữ từ trí nhớ, rồi bấm Chấm bài';
      feedbackEl.className = 'note';
      feedbackEl.textContent = dc?.vi
        ? `Viết chữ nghĩa là “${dc.vi}” — âm Hán Việt: ${data.hvOf(ch) || '?'}`
        : `Âm Hán Việt: ${data.hvOf(ch) || '?'}`;
    } else {
      hintEl.textContent = S.expect >= d.medians.length
        ? `Hoàn thành · ${d.medians.length} nét`
        : `Nét ${S.expect + 1} / ${d.medians.length}`;
      if (!S.results.length) {
        feedbackEl.className = 'note';
        feedbackEl.textContent = S.mode === 'luot'
          ? `Lượt ${S.round + 1}/${ROUNDS.length}: ${ROUNDS[S.round].text}.`
          : S.mode === 'do'
          ? 'Đồ theo nét mờ. Chấm tròn đỏ là chỗ đặt bút, mũi tên là chiều viết.'
          : 'Viết vào ô trống. Sai hai lần sẽ hiện gợi ý.';
      }
    }
  }

  /* ---- chấm nét ---- */

  function onStroke(units) {
    const d = current();
    if (S.mode === 'xem') { pad.undo(); return; }
    if (S.mode === 'tri-nho') {
      hintEl.textContent = `Đã viết ${pad.strokes.length} nét — bấm Chấm bài khi xong`;
      return;
    }

    const res = gradeInOrder(units, d.mediansView, S.expect, settings.strictness);

    if (res.pass) {
      S.results[S.expect] = res;
      pad.snapLastToModel(S.expect);
      pad.flash(true);
      S.expect++;
      S.attempts = 0;
      const v = verdict(res.score);
      feedbackEl.className = 'note jade';
      feedbackEl.replaceChildren(
        h('b', `Nét ${S.expect}: ${v.text} `),
        h('span.small', `(${res.score}/100)`),
      );
      if (S.expect >= d.medians.length) {
        if (S.mode === 'luot') finishRound();
        else finishChar();
      } else { applyHint(); renderInfo(); }
      return;
    }

    S.attempts++;
    pad.undo();
    pad.flash(false);
    const msg = res.issues?.[0]?.msg || 'Nét chưa khớp, thử lại nhé.';
    feedbackEl.className = res.kind === 'order' ? 'note' : 'note seal';
    feedbackEl.replaceChildren(frag(
      h('b', `Nét ${S.expect + 1}: `), msg,
      (S.attempts >= 2 && S.mode === 'goi-y') || (S.mode === 'luot' && !ROUNDS[S.round].arrow && S.attempts === ROUNDS[S.round].miss)
        ? h('div.small', { style: { marginTop: '4px' } }, 'Đã hiện gợi ý bên dưới.') : null,
    ));
    applyHint();
  }

  /* Xong một lượt: ghi điểm lượt rồi tự sang lượt sau với ít gợi ý hơn */
  function finishRound() {
    const avg = Math.round(S.results.reduce((s, r) => s + r.score, 0) / S.results.length);
    S.roundScores.push(avg);
    if (S.round >= ROUNDS.length - 1) { finishChar(); return; }
    feedbackEl.className = 'note jade';
    feedbackEl.replaceChildren(h('b', `Xong lượt ${S.round + 1}/${ROUNDS.length} · ${avg} điểm. `),
      `Lượt sau: ${ROUNDS[S.round + 1].text.toLowerCase()}.`);
    pad.lock(true);
    setTimeout(() => {
      S.round++;
      pad.lock(false);
      resetRound();
    }, 900);
  }

  async function finishChar() {
    pad.setHint({ ghost: false });
    const avg = S.mode === 'luot'
      ? Math.round(S.roundScores.reduce((s, x) => s + x, 0) / S.roundScores.length)
      : Math.round(S.results.reduce((s, r) => s + r.score, 0) / S.results.length);
    S.scores.push(avg);
    S.done++;
    const v = verdict(avg);
    feedbackEl.className = `note ${v.tone}`;
    feedbackEl.replaceChildren(
      h('div.row', { style: { gap: '10px', alignItems: 'baseline' } },
        h('span.score-big', String(avg)),
        h('div', h('b', v.text), h('div.small', S.mode === 'luot'
          ? `Xong chữ ${chars[S.i]} · ${ROUNDS.length} lượt (${S.roundScores.join(' · ')})`
          : `Xong chữ ${chars[S.i]} · ${S.results.length} nét`)),
      ),
    );
    renderInfo();
    await saveScore(chars[S.i], avg);
    audio.speak(chars[S.i], { rate: settings.speechRate });
  }

  function gradeFree() {
    const d = current();
    const userStrokes = pad.allUnits();
    if (!userStrokes.length) { toast('Bạn chưa viết nét nào.'); return; }

    const r = gradeWhole(userStrokes, d.mediansView, settings.strictness);
    S.results = r.per;
    S.scores.push(r.score);
    S.done++;
    const v = verdict(r.score);

    pad.setHint({ ghost: true });
    pad.flash(r.score >= 55);
    feedbackEl.className = `note ${v.tone}`;
    feedbackEl.replaceChildren(frag(
      h('div.row', { style: { gap: '10px', alignItems: 'baseline' } },
        h('span.score-big', String(r.score)),
        h('div',
          h('b', v.text),
          h('div.small', `${r.okCount}/${r.total} nét đạt`),
        ),
      ),
      ...r.notes.map((n) => h('div.small', { style: { marginTop: '5px' } }, n)),
      ...r.per.map((p, i) => !p.pass && p.issues?.[0]
        ? h('div.small', { style: { marginTop: '4px' } }, `Nét ${i + 1}: ${p.issues[0].msg}`)
        : null),
    ));
    renderInfo();
    saveScore(chars[S.i], r.score);
  }

  async function saveScore(ch, score) {
    const key = 'writeScores';
    const all = await store.kvGet(key, {});
    const prev = all[ch] || { n: 0, best: 0, last: 0 };
    all[ch] = { n: prev.n + 1, best: Math.max(prev.best, score), last: score, at: Date.now() };
    await store.kvSet(key, all);
    await store.logReview({ kind: 'write', word: ch, score });
  }

  function nextChar() {
    if (S.i >= chars.length - 1) return showSummary();
    S.i++;
    pad.setChar(current());
    resetChar();
  }

  function showSummary() {
    const avg = S.scores.length
      ? Math.round(S.scores.reduce((a, b) => a + b, 0) / S.scores.length) : 0;
    const v = verdict(avg);
    store.markStep('zh');
    el.replaceChildren(h('div.card', { style: { maxWidth: '460px', margin: '30px auto' } },
      h('div.center',
        h('div.cn', { style: { fontSize: '54px' } }, '完'),
        h('h2', { style: { marginTop: '10px' } }, 'Xong buổi luyện viết'),
        h('div.score-big', { style: { margin: '12px 0' } }, String(avg)),
        h('div', h('b', v.text), ` · ${S.done}/${chars.length} chữ`),
      ),
      h('div.btn-row', { style: { marginTop: '18px' } },
        h('button.btn', { onclick: () => location.reload() }, '↻ Luyện lại'),
        backMap
          ? h('a.btn.primary', { href: `#/charmap/${backMap}` }, 'Về bản đồ chữ')
          : lessonId
          ? h('a.btn.primary', { href: `#/lesson/${lessonId}` }, 'Về bài học')
          : h('a.btn.primary', { href: '#/home' }, 'Về trang chủ'),
      ),
    ));
  }

  /* ---- hoạt hình thứ tự nét ---- */

  function stopAnimation() {
    if (S.anim) { cancelAnimationFrame(S.anim); S.anim = null; }
  }

  function playAnimation() {
    stopAnimation();
    const d = current();
    if (!d) return;
    pad.clearInk();
    pad.lock(true);

    const ctx = pad.inkCtx;
    const size = pad.size;
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim();
    let idx = 0;
    let t0 = performance.now();

    const frame = (now) => {
      const median = d.medians[idx];
      const len = median.reduce((s, p, i) =>
        i ? s + Math.hypot(p[0] - median[i - 1][0], p[1] - median[i - 1][1]) : 0, 0);
      const dur = Math.max(320, Math.min(1100, len * 1.5));
      const p = Math.min(1, (now - t0) / dur);

      ctx.clearRect(0, 0, size, size);
      if (idx > 0) drawChar(ctx, d.strokes, size, { color: ink, upTo: idx });
      drawPartialStroke(ctx, d.strokes[idx], median, size, p, ink);

      hintEl.textContent = `Nét ${idx + 1} / ${d.medians.length}`;

      if (p >= 1) {
        idx++;
        t0 = now + 180;
        if (idx >= d.strokes.length) {
          S.anim = null;
          pad.lock(false);
          if (S.mode === 'xem') {
            // Ghi nhận cả chữ là "nét mẫu" để nó được vẽ lại mỗi lần canvas
            // dựng lại (xoay máy, đổi cỡ) — nếu không, chữ vừa chạy xong sẽ
            // biến mất ngay khi có một lần vẽ lại.
            pad.modelStrokes = d.strokes.map((_, i) => i);
            pad.redrawInk();
          } else {
            pad.clearInk();
            applyHint();
          }
          hintEl.textContent = S.mode === 'xem'
            ? `${d.medians.length} nét — bấm "Xem nét" để chạy lại`
            : `Nét ${S.expect + 1} / ${d.medians.length}`;
          return;
        }
      }
      S.anim = requestAnimationFrame(frame);
    };
    S.anim = requestAnimationFrame(frame);
  }

  function showCharInfo() {
    location.hash = `#/char/${encodeURIComponent(chars[S.i])}`;
  }

  /* ---- khởi động ---- */
  pad.setChar(current());
  setMode(S.mode);

  return {
    title,
    el,
    className: 'full wide',
    cleanup: () => { stopAnimation(); pad.destroy(); },
  };
}

export { MODES, STRICTNESS };
