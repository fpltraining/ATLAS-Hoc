/* Phiên ôn tập: tiếng Anh và tiếng Trung chung một hàng, hoặc lọc theo từng ngôn ngữ.

   Cả hai ngôn ngữ đều có thẻ viết bằng Apple Pencil: tiếng Trung chấm từng nét,
   tiếng Anh viết lên bảng rồi hiện mẫu để so (hoặc viết vào ô để máy chấm từng chữ).
*/

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import { buildSession, review, nextLabel, TYPE_LABEL } from '../srs.js';
import { SECS_PER_CARD, BUDGETS } from '../plan.js';
import { WritingPad } from '../pen/canvas.js';
import { InkPad } from '../pen/inkpad.js';
import { gradeWhole, verdict } from '../pen/grade.js';
import { sayEn, scribble, diff, wordy, mcq } from '../kit.js';
import { h, readingLine, pill, empty } from '../ui.js';
import { refreshDueBadge } from '../app.js';

const GRADES = [
  { g: 0, label: 'Quên', cls: 'g0' },
  { g: 1, label: 'Khó', cls: 'g1' },
  { g: 2, label: 'Được', cls: 'g2' },
  { g: 3, label: 'Dễ', cls: 'g3' },
];

const isZh = (c) => !c.lang || c.lang === 'zh';

export async function render(route) {
  const [settings, everything] = await Promise.all([
    store.settings(), store.allCards(), data.ensureHanViet(),
  ]);
  const ahead = route?.query?.ahead === '1';
  const lang = route?.query?.lang;
  const all = lang === 'en' ? everything.filter((c) => c.lang === 'en')
    : lang === 'zh' ? everything.filter(isZh) : everything;
  const homeHref = lang === 'en' ? '#/en' : lang === 'zh' ? '#/zh' : '#/home';

  if (!all.length) {
    return {
      title: 'Ôn tập',
      el: empty('空', 'Chưa có thẻ nào. Học từ mới trong một buổi học là thẻ tự vào đây.',
        h('a.btn.primary', { href: homeHref }, 'Về học bài')),
    };
  }

  const budget = settings.dailyMinutes || 120;
  const cap = Math.round(((BUDGETS[budget] || BUDGETS[120]).review * 60) / SECS_PER_CARD);
  let queue = ahead
    ? all.slice().sort((a, b) => a.due - b.due).slice(0, 20)
    : buildSession(all, Math.min(cap, 300));

  if (!queue.length) {
    const soon = all.slice().sort((a, b) => a.due - b.due)[0];
    const mins = Math.max(1, Math.round((soon.due - Date.now()) / 60000));
    return {
      title: 'Ôn tập',
      el: empty('好', `Hết thẻ tới hạn rồi. Thẻ tiếp theo sau khoảng ${fmtWait(mins)}.`,
        h('div.btn-row', { style: { maxWidth: '320px', margin: '0 auto' } },
          h('a.btn', { href: homeHref }, 'Quay lại'),
          h('a.btn.ghost', { href: `#/review?ahead=1${lang ? `&lang=${lang}` : ''}` }, 'Ôn trước hạn'),
        )),
    };
  }

  await data.preloadChars(queue.filter(isZh).flatMap((c) => [...c.word].filter(data.isHan)));
  const knowData = queue.some((c) => c.type === 'know-q') ? await content.know() : null;

  const S = { pos: 0, pad: null, ink: null, correct: 0 };
  const bodyEl = h('div');
  const el = h('div', bodyEl);

  const card = () => queue[S.pos];

  function cleanupPad() {
    S.pad?.destroy(); S.pad = null;
    S.ink?.destroy(); S.ink = null;
  }

  function progressHeader() {
    return h('div.row.spread', { style: { marginBottom: '12px' } },
      pill(`${S.pos + 1} / ${queue.length}`, 'plain'),
      h('span.small.faint', TYPE_LABEL[card().type] || ''),
    );
  }

  const speakCard = (c) => (c.lang === 'en' ? sayEn(c.word) : audio.speak(c.word, { rate: settings.speechRate }));

  /* ---- mặt trước ---- */

  function renderFront() {
    cleanupPad();
    const c = card();
    const head = progressHeader();

    if (c.type === 'vi-write') return renderWrite(head, c);
    if (c.type === 'en-spell') return renderEnSpell(head, c);
    if (c.type === 'know-q') return renderKnow(head, c);

    let prompt;
    if (c.type === 'en-recall') {
      prompt = h('div.rev-prompt',
        h('div.rev-en', c.word),
        c.ipa ? h('div.faint', c.ipa) : null,
        h('div.small.faint', { style: { marginTop: '10px' } }, 'Nghĩa là gì?'),
      );
      setTimeout(() => sayEn(c.word), 200);
    } else if (c.type === 'hanzi-vi' || c.type === 'hanzi-py') {
      prompt = h('div.rev-prompt',
        h('div.rev-cn.cn', c.word),
        h('div.small.faint', { style: { marginTop: '10px' } },
          c.type === 'hanzi-py' ? 'Đọc thế nào? (pinyin + thanh điệu)' : 'Nghĩa là gì? Đọc thế nào?'),
      );
    } else {
      prompt = h('div.rev-prompt',
        h('button.btn.jade', {
          style: { fontSize: '22px', minHeight: '84px', width: '84px', borderRadius: '99px' },
          onclick: () => audio.speak(c.word, { rate: settings.speechRate }),
        }, '🔊'),
        h('div.small.faint', { style: { marginTop: '14px' } }, 'Nghe rồi đoán nghĩa'),
      );
      setTimeout(() => audio.speak(c.word, { rate: settings.speechRate }), 250);
    }

    bodyEl.replaceChildren(h('div.card', head, prompt,
      h('button.btn.primary.block', { onclick: () => renderBack() }, 'Hiện đáp án')));
  }

  /* ---- thẻ viết chữ Hán: chấm từng nét ---- */

  function renderWrite(head, c) {
    const chars = [...c.word].filter(data.isHan);
    const w = { i: 0, scores: [] };

    const padEl = h('div.pad');
    const hint = h('div.pad-hint', chars.length > 1 ? `Chữ 1 / ${chars.length}` : 'Viết cả chữ rồi bấm Chấm');
    padEl.append(hint);

    const pad = new WritingPad(padEl, {
      grid: settings.grid, brush: settings.brush, penOnly: settings.penOnly, penSound: settings.penSound,
    });
    S.pad = pad;
    pad.setChar(data.strokeDataSync(chars[0]));
    pad.setHint({ ghost: false });

    const scoreLine = h('div.small.faint', { style: { minHeight: '20px' } });

    function gradeCurrent() {
      const d = data.strokeDataSync(chars[w.i]);
      const strokes = pad.allUnits();
      const r = strokes.length && d ? gradeWhole(strokes, d.mediansView, settings.strictness) : { score: 0 };
      w.scores[w.i] = r.score;
      scoreLine.textContent = `Chữ ${chars[w.i]}: ${r.score}/100`;
    }

    const btnNextChar = h('button.btn.sm', {
      hidden: chars.length < 2,
      onclick: () => {
        gradeCurrent();
        if (w.i < chars.length - 1) {
          w.i++;
          pad.setChar(data.strokeDataSync(chars[w.i]));
          pad.clearInk();
          pad.setHint({ ghost: false });
          hint.textContent = `Chữ ${w.i + 1} / ${chars.length}`;
        }
      },
    }, 'Chữ tiếp ›');

    bodyEl.replaceChildren(h('div.card', head,
      h('div.center', { style: { marginBottom: '12px' } },
        h('div', { style: { fontSize: '20px', fontWeight: 600 } }, c.vi || ''),
        h('div.row', { style: { gap: '8px', justifyContent: 'center' } }, c.py && h('span.py', c.py), c.hv && h('span.hv', c.hv)),
        h('div.small.faint', { style: { marginTop: '4px' } }, `Viết ${chars.length > 1 ? `${chars.length} chữ` : 'chữ'} tương ứng`),
      ),
      h('div', { style: { display: 'flex', justifyContent: 'center' } }, padEl),
      scoreLine,
      h('div.btn-row', { style: { marginTop: '10px' } },
        h('button.btn.sm', { onclick: () => pad.undo() }, '↶ Xoá nét'),
        h('button.btn.sm', { onclick: () => pad.clearInk() }, '✕ Làm lại'),
        btnNextChar,
      ),
      h('button.btn.primary.block', {
        style: { marginTop: '10px' },
        onclick: () => {
          gradeCurrent();
          const got = w.scores.filter((x) => x !== undefined);
          renderBack(Math.round(got.reduce((a, b) => a + b, 0) / Math.max(1, got.length)));
        },
      }, 'Chấm và xem đáp án'),
    ));
  }

  /* ---- thẻ viết tiếng Anh: viết lên bảng, hoặc vào ô để máy chấm ---- */

  function renderEnSpell(head, c) {
    let typed = false;
    const padHost = h('div');
    const input = scribble('Viết vào ô này để máy chấm từng chữ', { onEnter: () => reveal() });
    const inputWrap = h('div', { hidden: true }, input);
    const toggle = h('button.btn.sm.ghost', {
      onclick: () => {
        typed = !typed;
        padHost.hidden = typed;
        inputWrap.hidden = !typed;
        toggle.textContent = typed ? 'Viết trên bảng' : 'Viết vào ô để máy chấm';
        if (typed) input.focus();
      },
    }, 'Viết vào ô để máy chấm');

    function reveal() {
      if (typed) {
        const d = diff(c.word, input.value);
        renderBack(null, h('div.note', { style: { marginTop: '10px' } }, h('b', d.ok ? 'Đúng từng chữ. ' : `Khớp ${d.score}%. `), d.el), d.ok ? 2 : d.score >= 70 ? 1 : 0);
      } else {
        S.ink?.setGhost(true);
        S.ink?.lock(true);
        renderBack(null, h('div.note', { style: { marginTop: '10px' } }, 'Mẫu đang hiện mờ trên bảng. So với chữ bạn viết rồi tự chấm.'));
      }
    }

    bodyEl.replaceChildren(h('div.card', head,
      h('div.center', { style: { marginBottom: '10px' } },
        h('div', { style: { fontSize: '20px', fontWeight: 600 } }, c.vi || ''),
        h('button.btn.sm.jade', { style: { marginTop: '6px' }, onclick: () => sayEn(c.word) }, '🔊 Nghe từ'),
      ),
      padHost, inputWrap,
      h('div.btn-row', { style: { marginTop: '10px' } },
        h('button.btn.sm', { onclick: () => S.ink?.undo() }, '↶ Xoá nét'),
        h('button.btn.sm', { onclick: () => S.ink?.clear() }, '✕ Viết lại'),
        toggle,
      ),
      h('button.btn.primary.block', { style: { marginTop: '10px' }, onclick: reveal }, 'Xem đáp án'),
    ));
    S.ink = new InkPad(padHost, { penOnly: settings.penOnly });
    requestAnimationFrame(() => S.ink?.setWord(c.word, { ghost: false }));
    setTimeout(() => sayEn(c.word), 200);
  }

  /* ---- câu hỏi kiến thức ---- */

  function renderKnow(head, c) {
    const L = knowData.lessons.find((l) => l.id === c.word);
    if (!L) { S.pos++; return S.pos < queue.length ? renderFront() : finish(); }
    let ok = false;
    const next = h('div');
    bodyEl.replaceChildren(h('div.card', head,
      h('div.small.faint', L.title),
      mcq({
        q: L.q.vi, opts: L.q.opts, a: L.q.a, why: L.q.why,
        onAnswer: (right) => {
          ok = right;
          next.replaceChildren(h('button.btn.primary.block', { style: { marginTop: '12px' }, onclick: () => answerCard(ok ? 2 : 0) }, 'Tiếp ›'));
        },
      }),
      next,
    ));
  }

  /* ---- mặt sau + chấm điểm ---- */

  function renderBack(writeScore, extra, suggested) {
    const c = card();

    if (c.type === 'vi-write' && S.pad) {
      S.pad.setHint({ ghost: true });
      S.pad.lock(true);
    }

    const suggestion = typeof suggested === 'number' ? suggested
      : typeof writeScore === 'number'
        ? (writeScore >= 85 ? 3 : writeScore >= 62 ? 2 : writeScore >= 35 ? 1 : 0)
        : null;

    const answer = c.lang === 'en'
      ? h('div.card', { style: { marginTop: '12px' } },
        h('div.row.spread',
          h('div', h('div.rev-en.left', c.word), c.ipa ? h('div.faint', c.ipa) : null, h('div', c.vi || '')),
          h('button.speak-btn', { onclick: () => sayEn(c.word) }, '🔊'),
        ),
        c.ex ? h('div.pair', { style: { marginTop: '8px' } },
          h('div.grow', h('div.pair-en', wordy(c.ex)), c.exVi ? h('div.pair-vi', c.exVi) : null),
          h('div.pair-act', h('button.speak-btn', { onclick: () => sayEn(c.ex) }, '🔊'))) : null,
        extra || null,
      )
      : h('div.card', { style: { marginTop: '12px' } },
        h('div.row.spread',
          h('div',
            h('div.cn', { style: { fontSize: '40px', lineHeight: 1.15 } }, c.word),
            readingLine(c.py, c.hv),
            h('div', c.vi || ''),
          ),
          h('button.speak-btn', { onclick: () => speakCard(c) }, '🔊'),
        ),
        typeof writeScore === 'number' ? h('div.note', { style: { marginTop: '10px' } },
          h('b', `Điểm viết: ${writeScore}/100 — ${verdict(writeScore).text}. `),
          'Chữ mẫu đang hiện mờ trên bảng, so lại xem nét nào lệch.') : null,
        h('div.row.wrap', { style: { marginTop: '10px', gap: '6px' } },
          ...[...c.word].filter(data.isHan).map((ch) =>
            h('a.btn.sm.ghost', { href: `#/char/${encodeURIComponent(ch)}` }, ch, ' ', data.hvOf(ch) || '')),
        ),
      );

    const grades = h('div.rev-grade', { style: { marginTop: '12px' } });
    for (const g of GRADES) {
      grades.append(h(`button.btn.${g.cls}`, {
        style: suggestion === g.g ? { outline: '2px solid var(--ink)' } : null,
        onclick: () => answerCard(g.g),
      }, h('b', g.label), h('em', nextLabel(c, g.g))));
    }

    bodyEl.append(answer, grades);
    if (suggestion !== null) answer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /* ---- ghi kết quả và sang thẻ kế ---- */

  async function answerCard(grade) {
    const c = card();
    const updated = review(c, grade);
    await store.putCard(updated);
    await store.logReview({ kind: 'srs', word: c.word, type: c.type, grade });
    if (grade >= 2) S.correct++;

    // Thẻ quên được đưa lại cuối hàng đợi trong cùng phiên
    if (grade === 0) queue.push(updated);

    S.pos++;
    await refreshDueBadge();
    if (S.pos >= queue.length) return finish();
    renderFront();
  }

  async function finish() {
    cleanupPad();
    await store.markStep('review');
    const pct = queue.length ? Math.round((S.correct / queue.length) * 100) : 0;
    bodyEl.replaceChildren(h('div.card', { style: { maxWidth: '430px', margin: '24px auto' } },
      h('div.center',
        h('h2', { style: { marginTop: '8px' } }, 'Xong phiên ôn'),
        h('div.score-big', { style: { margin: '12px 0' } }, `${pct}%`),
        h('p.muted', `${S.correct}/${queue.length} thẻ nhớ được ngay.`),
      ),
      h('div.btn-row',
        h('button.btn', { onclick: () => location.reload() }, '↻ Ôn tiếp'),
        h('a.btn.primary', { href: homeHref }, 'Tiếp tục'),
      ),
    ));
  }

  renderFront();
  return { title: 'Ôn tập', el, cleanup: cleanupPad };
}

function fmtWait(mins) {
  if (mins < 60) return `${mins} phút`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} giờ`;
  return `${Math.round(mins / (60 * 24))} ngày`;
}
