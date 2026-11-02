/* Chi tiết một chữ Hán: âm Hán Việt, cấu tạo, thứ tự nét, chữ cùng bộ.

   Đây là màn hình thể hiện rõ nhất lợi thế của người Việt khi học tiếng Trung:
   mỗi chữ đều có một âm Hán Việt quen thuộc làm điểm neo trí nhớ.
*/

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { drawChar, drawGrid, drawStrokeNumbers } from '../pen/grid.js';
import { h, section, readingLine, pill, toast } from '../ui.js';

export async function render(route) {
  const ch = route.args[0];
  if (!ch || !data.isHan(ch)) {
    return { title: 'Chữ', el: h('div.empty', 'Không có chữ nào để hiện.') };
  }
  await Promise.all([data.ensureHanViet(), data.ensureDecomp()]);

  const settings = await store.settings();
  await data.preloadChars([ch, ...data.partsOf(ch)]);
  const d = data.strokeDataSync(ch);
  const dc = data.decompOf(ch);
  const scores = await store.kvGet('writeScores', {});
  const mine = scores[ch];

  const el = h('div.stack');

  /* ---- đầu trang ---- */
  el.append(h('div.card',
    h('div.row', { style: { gap: '16px', alignItems: 'flex-start' } },
      h('div.cn', { style: { fontSize: '76px', lineHeight: 1 } }, ch),
      h('div.grow',
        readingLine(data.pyOf(ch), data.hvOf(ch)),
        dc?.vi && h('div.muted', dc.vi),
        h('div.row.wrap', { style: { marginTop: '8px' } },
          d ? pill(`${d.strokes.length} nét`, 'plain') : null,
          dc?.r ? pill(`bộ ${dc.r}`, 'jade') : null,
          data.tradOf(ch) ? pill(`phồn thể ${data.tradOf(ch)}`, 'gold') : null,
        ),
      ),
      h('button.speak-btn', {
        onclick: () => {
          if (!audio.speak(ch, { rate: settings.speechRate })) toast('Không đọc được.');
          else if (!audio.hasVoice()) toast(audio.NO_VOICE_HELP, 7000);
        },
      }, '🔊'),
    ),
    data.hvOf(ch) ? h('div.note', { style: { marginTop: '12px' } },
      'Âm Hán Việt: ', h('b.hv', data.hvOf(ch)),
      '. Hãy thử nhớ chữ này qua một từ Hán Việt bạn đã biết.') : null,
  ));

  el.append(h('div.btn-row',
    h('a.btn.primary', { href: `#/write/${encodeURIComponent(ch)}` }, '✍️ Luyện viết chữ này'),
  ));

  /* ---- bảng thứ tự nét ---- */
  if (d) {
    el.append(section(`Thứ tự ${d.strokes.length} nét`, h('div.card',
      strokeSheet(d),
      h('p.small.faint', { style: { marginTop: '10px', marginBottom: 0 } },
        'Ba quy tắc vàng: ngang trước sổ sau · trên trước dưới sau · trái trước phải sau.'),
    )));
  }

  /* ---- cấu tạo chữ ---- */
  const parts = data.partsOf(ch);
  if (dc?.d && parts.length) {
    const layout = data.IDS_LABEL[dc.d[0]] || '';
    const row = h('div.decomp');
    row.append(h('div.part', { style: { borderStyle: 'dashed' } },
      h('span.cn', ch), h('small.faint', 'chữ này')));
    row.append(h('span.op', '='));
    parts.forEach((p, i) => {
      if (i) row.append(h('span.op', '+'));
      row.append(h('div.part', {
        onclick: () => { location.hash = `#/char/${encodeURIComponent(p)}`; },
      },
        h('span.cn', p),
        h('small.hv', data.hvOf(p) || ''),
        h('small.faint', { style: { fontSize: '10px' } }, data.decompOf(p)?.vi?.slice(0, 16) || ''),
      ));
    });

    el.append(section('Chữ này được ghép từ đâu', h('div.card',
      row,
      layout && h('p.small.muted', { style: { marginTop: '10px', marginBottom: 0 } },
        'Kết cấu: ', h('b', layout), '. Nhớ được các thành phần thì nhớ cả chữ dễ hơn nhiều — ',
        'đó là lý do app xếp bộ thủ và chữ đơn học trước.'),
    )));
  }

  /* ---- kết quả luyện viết của bạn ---- */
  if (mine) {
    el.append(section('Kết quả luyện viết của bạn', h('div.card',
      h('div.row', { style: { gap: '26px' } },
        h('div', h('div.stat-num', String(mine.best)), h('div.small.faint', 'điểm cao nhất')),
        h('div', h('div.stat-num', String(mine.last)), h('div.small.faint', 'lần gần nhất')),
        h('div', h('div.stat-num', String(mine.n)), h('div.small.faint', 'lượt viết')),
      ),
    )));
  }

  return { title: `Chữ ${ch}`, el };
}

/** Bảng nhỏ: mỗi ô là chữ được tô dần tới nét thứ i, kèm số thứ tự. */
function strokeSheet(d) {
  const wrap = h('div.row.wrap', { style: { gap: '8px' } });
  const cell = 64;
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const cs = getComputedStyle(document.documentElement);
  const ink = cs.getPropertyValue('--ink').trim();
  const line = cs.getPropertyValue('--line').trim();
  const seal = cs.getPropertyValue('--seal').trim();

  for (let i = 0; i < d.strokes.length; i++) {
    const c = document.createElement('canvas');
    c.width = cell * dpr; c.height = cell * dpr;
    c.style.cssText = `width:${cell}px;height:${cell}px;border:1px solid var(--line);border-radius:10px;background:var(--card)`;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGrid(ctx, cell, 'tian', line);
    drawChar(ctx, d.strokes, cell, { color: line, upTo: i });
    drawChar(ctx, d.strokes, cell, { color: ink, only: i });
    drawStrokeNumbers(ctx, [d.medians[i]], cell, seal);
    wrap.append(c);
  }
  return wrap;
}
