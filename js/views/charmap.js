/* Bản đồ chữ của một bài: các chữ mới xếp thành đường đi, viết xong chữ này mới mở chữ sau.
   Chữ "xong" là chữ đã viết đạt từ 60 điểm trở lên ít nhất một lần. */

import * as data from '../data.js';
import * as store from '../store.js';
import { h, toast, progressBar, readingLine } from '../ui.js';

const PASS = 60;

export async function render(route) {
  const idx = await data.curriculum();
  const id = Number(route.args[0]) || idx.lessons[0].id;
  const pos = idx.lessons.findIndex((l) => l.id === id);
  const meta = idx.lessons[pos];
  if (!meta) return { title: 'Bản đồ chữ', el: h('div.empty', 'Không tìm thấy bài này.') };

  await Promise.all([data.ensureHanViet(), data.ensureDecomp()]);
  const scores = await store.kvGet('writeScores', {});
  const chars = meta.newChars;
  const done = (ch) => (scores[ch]?.best || 0) >= PASS;
  const nDone = chars.filter(done).length;
  const curIdx = chars.findIndex((ch) => !done(ch));
  const prev = idx.lessons[pos - 1];
  const next = idx.lessons[pos + 1];

  const go = (i) => { location.hash = `#/write/lesson-${id}?start=${i}&map=${id}`; };

  const el = h('div.stack');
  el.append(h('div.card',
    h('div.small.faint', `HSK ${meta.level} · bài ${meta.no ?? meta.id}`),
    h('h2', { style: { margin: '2px 0' } }, meta.title, ' ', h('span.cn.faint', meta.cn)),
    h('div.small.muted', `Viết ${chars.length} chữ mới của bài này`),
    h('div.row', { style: { gap: '10px', marginTop: '10px' } },
      h('div.grow', progressBar(chars.length ? nDone / chars.length : 0)),
      h('b.small', `${nDone}/${chars.length} chữ`)),
  ));

  if (!chars.length) {
    el.append(h('div.empty', 'Bài này không có chữ mới.'));
  } else {
    const path = h('div.char-path');
    chars.forEach((ch, i) => {
      const state = done(ch) ? 'done' : i === curIdx ? 'now' : 'lock';
      const best = scores[ch]?.best;
      path.append(h(`div.char-step.${i % 2 ? 'right' : 'left'}`,
        state === 'now' ? h('span.pill.jade.char-now', 'Đang học') : null,
        h(`button.char-node.${state}`, {
          'aria-label': `${ch}${state === 'lock' ? ', chưa mở' : ''}`,
          onclick: () => {
            if (state === 'lock') { toast('Viết xong chữ đang học để mở chữ này.'); return; }
            go(i);
          },
        },
        h('span.py', data.pyOf(ch) || ''),
        h('span.cn', ch),
        state === 'lock' ? h('span.char-lock', '🔒') : null,
        state === 'done' ? h('span.char-score', String(best)) : null,
        ),
      ));
    });
    el.append(h('div.card', path));
  }

  if (curIdx >= 0) {
    const ch = chars[curIdx];
    el.append(h('button.btn.seal.block.char-continue', { onclick: () => go(curIdx) },
      h('span.cn', { style: { fontSize: '22px', marginRight: '8px' } }, ch), 'Tiếp tục học ›'));
    el.append(h('div.center.small.faint', h('div.row', { style: { justifyContent: 'center' } }, readingLine(data.pyOf(ch), data.hvOf(ch))), data.decompOf(ch)?.vi || ''));
  } else if (chars.length) {
    el.append(h('div.note.jade', `Đã viết đạt cả ${chars.length} chữ của bài này.`),
      h('button.btn.block', { onclick: () => go(0) }, 'Luyện lại từ đầu'));
  }

  el.append(h('div.btn-row',
    prev ? h('a.btn.ghost', { href: `#/charmap/${prev.id}` }, '‹ Bài trước') : h('span'),
    h('a.btn.ghost', { href: `#/lesson/${id}` }, 'Về bài học'),
    next ? h('a.btn.ghost', { href: `#/charmap/${next.id}` }, 'Bài sau ›') : h('span'),
  ));

  return { title: 'Bản đồ chữ', el };
}
