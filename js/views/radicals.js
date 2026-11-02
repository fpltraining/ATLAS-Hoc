/* Bộ thủ — "bảng chữ cái" của chữ Hán, chia thành 6 nhóm theo chủ đề. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { h, section, sheet, pill, readingLine } from '../ui.js';

export async function render() {
  const [rads, settings] = await Promise.all([
    data.radicals(), store.settings(), data.ensureHanViet(),
  ]);
  const all = rads.groups.flatMap((g) => g.items);
  await data.preloadChars(all.map((i) => i.std));

  const el = h('div.stack');

  el.append(h('div.card',
    h('h1', rads.title),
    h('p.muted.small', { style: { marginTop: '6px' } }, rads.intro),
    h('div.note.jade', { style: { marginTop: '10px' } },
      'Người Việt có lợi thế lớn ở đây: mỗi bộ thủ đều có một âm Hán Việt bạn đã ',
      'nghe quen — 水 thuỷ, 火 hoả, 木 mộc, 心 tâm. Nhớ bộ thủ là nhớ được nghĩa gốc ',
      'của hàng nghìn chữ.'),
    h('div.btn-row', { style: { marginTop: '12px' } },
      h('a.btn.primary', { href: '#/write/rad-all' }, '✍️ Luyện viết cả 60 bộ'),
    ),
  ));

  for (const g of rads.groups) {
    const grid = h('div.rad-grid');
    for (const it of g.items) {
      grid.append(h('div.rad', { onclick: () => showRadical(it, settings) },
        h('div.rad-cn', it.r.split(' / ')[0]),
        h('div', { style: { minWidth: 0 } },
          h('div', { style: { fontWeight: 600 } }, it.vi),
          h('div.small', h('span.hv', it.hv), ' · ', h('span.py', it.py)),
        ),
      ));
    }
    el.append(section(g.name,
      g.note ? h('p.small.faint', { style: { marginTop: '-4px' } }, g.note) : null,
      grid));
  }

  return { title: 'Bộ thủ', el };
}

function showRadical(it, settings) {
  const variants = it.r.split(' / ').map((s) => s.trim());
  sheet(
    h('div.row', { style: { gap: '16px', alignItems: 'flex-start' } },
      h('div.cn', { style: { fontSize: '68px', lineHeight: 1 } }, variants[0]),
      h('div.grow',
        h('h2', { style: { marginBottom: '2px' } }, it.vi),
        readingLine(it.py, it.hv),
        h('div.row.wrap', { style: { marginTop: '8px' } },
          pill(`${it.n} nét`, 'plain'),
          variants[1] ? pill(`biến thể ${variants[1]}`, 'gold') : null,
          it.std !== variants[0] ? pill(`viết đầy đủ: ${it.std}`, 'jade') : null,
        ),
      ),
      h('button.speak-btn', {
        onclick: () => audio.speak(it.std, { rate: settings.speechRate }),
      }, '🔊'),
    ),
    it.note ? h('div.note', { style: { marginTop: '14px' } }, it.note) : null,

    h('h3', { style: { marginTop: '18px' } }, 'Chữ có chứa bộ này'),
    h('div.row.wrap', { style: { gap: '8px', marginTop: '8px' } },
      ...it.ex.map((ch) => h('a.syl', {
        href: `#/char/${encodeURIComponent(ch)}`,
        style: { minWidth: '58px', minHeight: '58px', flexDirection: 'column' },
        onclick: () => setTimeout(() => document.getElementById('sheet').hidden = true, 30),
      },
        h('span.cn', { style: { fontSize: '25px' } }, ch),
        h('small.hv', data.hvOf(ch) || ''),
      )),
    ),

    h('div.btn-row', { style: { marginTop: '18px' } },
      h('a.btn.primary', {
        href: `#/write/${encodeURIComponent(it.std)}`,
        onclick: () => setTimeout(() => document.getElementById('sheet').hidden = true, 30),
      }, '✍️ Luyện viết bộ này'),
      h('button.btn.ghost', { 'data-close': '' }, 'Đóng'),
    ),
  );
}
