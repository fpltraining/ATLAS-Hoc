/* Luyện viết tiếng Anh bằng Apple Pencil — cùng cách làm với luyện viết chữ Hán.

   Ba chế độ, khó dần:
     1. Đồ theo mẫu  — từ hiện mờ trên bảng, chấm độ phủ nét
     2. Chép lại     — từ ở trên, viết xuống bảng trống
     3. Viết trí nhớ — chỉ nghe và thấy nghĩa, viết xong mới hiện mẫu để so
*/

import * as store from '../store.js';
import * as content from '../content.js';
import { InkPad } from '../pen/inkpad.js';
import { sayEn, sayBtn } from '../kit.js';
import { h, toast, pill } from '../ui.js';

const MODES = [
  { id: 'trace', label: 'Đồ theo mẫu' },
  { id: 'copy',  label: 'Chép lại' },
  { id: 'mem',   label: 'Viết trí nhớ' },
];

export async function render(route) {
  const settings = await store.settings();
  const d = await content.dict();
  const words = (route.args[0] || '').split(',').map((w) => w.trim()).filter(Boolean);
  if (!words.length) return pickScreen();

  let i = 0, mode = 'trace';
  let pad = null;
  const scores = new Map();
  const boxEl = h('div');
  const el = h('div.stack', boxEl);

  function draw() {
    pad?.destroy();
    const w = words[i];
    const info = d[w.toLowerCase()] || ['', ''];
    const hint = h('div.small.faint', { style: { minHeight: '22px' } });
    const padHost = h('div');

    const seg = h('div.mode-seg');
    for (const m of MODES) {
      seg.append(h('button', {
        class: m.id === mode ? 'on' : '',
        onclick: () => { mode = m.id; draw(); },
      }, m.label));
    }

    boxEl.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${i + 1} / ${words.length}`, 'plain'), seg),
      h('div.row.spread', { style: { margin: '12px 0' } },
        h('div',
          mode === 'mem' ? null : h('div.word-big', w),
          info[1] && h('div.faint', info[1]),
          h('div.word-mean', info[0]),
        ),
        sayBtn(w),
      ),
      padHost,
      hint,
      h('div.btn-row', { style: { marginTop: '10px' } },
        h('button.btn.sm', { onclick: () => pad.undo() }, '↶ Xoá nét'),
        h('button.btn.sm', { onclick: () => { pad.clear(); pad.setGhost(mode === 'trace'); hint.textContent = ''; } }, '✕ Viết lại'),
        h('button.btn.sm.jade', {
          onclick: () => {
            if (!pad.hasInk()) { hint.textContent = 'Viết bằng bút lên bảng trước đã.'; return; }
            if (mode === 'trace') {
              const s = pad.traceScore();
              scores.set(w, Math.max(scores.get(w) || 0, s));
              hint.textContent = `Độ phủ nét: ${s}/100 ${s >= 75 ? '· rất tốt' : s >= 50 ? '· khá, đồ sát mẫu hơn nhé' : '· thử chậm lại'}`;
            } else {
              pad.setGhost(true);
              hint.textContent = 'Mẫu đang hiện mờ trên bảng để bạn tự so.';
            }
          },
        }, mode === 'trace' ? 'Chấm nét' : 'Hiện mẫu'),
      ),
      h('div.btn-row', { style: { marginTop: '10px' } },
        i > 0 ? h('button.btn.ghost', { onclick: () => { i--; draw(); } }, '‹ Từ trước') : null,
        i < words.length - 1
          ? h('button.btn.primary', { onclick: () => { i++; draw(); } }, 'Từ tiếp ›')
          : h('a.btn.primary', { href: route.query.back ? `#${route.query.back}` : '#/en' }, 'Xong'),
      ),
    ));

    pad = new InkPad(padHost, { penOnly: settings.penOnly });
    requestAnimationFrame(() => pad.setWord(w, { ghost: mode === 'trace' }));
    if (mode === 'mem') sayEn(w);
  }

  draw();
  return { title: 'Viết tiếng Anh bằng bút', el, cleanup: () => pad?.destroy() };
}

/* Chưa chọn từ: gợi ý các từ đang học dở, hoặc cho nhập tay */
async function pickScreen() {
  const cards = (await store.allCards()).filter((c) => c.type === 'en-spell');
  const weak = cards.slice().sort((a, b) => a.ivl - b.ivl).slice(0, 12).map((c) => c.word);
  const input = h('input.scribble', { placeholder: 'Nhập các từ, cách nhau bằng dấu phẩy', autocapitalize: 'off', autocorrect: 'off' });
  return {
    title: 'Viết tiếng Anh bằng bút',
    el: h('div.stack',
      h('div.card',
        h('h3', 'Từ bạn đang học'),
        weak.length
          ? h('div',
            h('div.row.wrap', { style: { gap: '6px', margin: '8px 0' } }, ...weak.map((w) => h('a.btn.sm.ghost', { href: `#/penen/${encodeURIComponent(w)}` }, w))),
            h('a.btn.primary.block', { href: `#/penen/${encodeURIComponent(weak.join(','))}` }, `Viết cả ${weak.length} từ`))
          : h('p.small.faint', 'Chưa có từ nào. Học một buổi tiếng Anh, hoặc nhập từ bạn muốn tập viết ở dưới.'),
      ),
      h('div.card',
        h('h3', 'Tự chọn từ'),
        input,
        h('button.btn.block', {
          style: { marginTop: '10px' },
          onclick: () => {
            if (!input.value.trim()) return toast('Nhập ít nhất một từ.');
            location.hash = `#/penen/${encodeURIComponent(input.value)}`;
          },
        }, 'Bắt đầu viết'),
      ),
    ),
  };
}
