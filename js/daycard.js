/* Tiến độ hôm nay tách theo ngôn ngữ: tiếng Anh và tiếng Trung tính riêng số việc và số phút.
   Trang Hôm nay hiện cả hai (theo lộ trình đã chọn); mục Tiếng Anh / Tiếng Trung chỉ hiện phần của mình. */

import { h, progressBar } from './ui.js';
import { langDay, LANG_NAME } from './plan.js';
import * as store from './store.js';

export const LANG_MARK = { en: 'Aa', zh: '汉', all: '•' };
const HUB = { en: '#/en', zh: '#/zh', all: '#/home' };

/** Một dòng tiến độ: ký hiệu, tên, số việc, phút đã học / phút dự kiến, thanh tiến độ. */
export function langMeter(ld, { link = true } = {}) {
  const ratio = ld.steps.length ? ld.done / ld.steps.length : 0;
  return h(link ? 'a.lang-meter' : 'div.lang-meter', link ? { href: HUB[ld.lang] } : {},
    h(`span.lang-mark.${ld.lang}`, LANG_MARK[ld.lang]),
    h('div.grow',
      h('div.row.spread', h('b', LANG_NAME[ld.lang]), h('span.small', `${ld.done}/${ld.steps.length} việc · ${ld.mins}/${ld.planned} phút`)),
      progressBar(ratio),
    ),
  );
}

/** Danh sách việc của một nhóm, có ô đánh dấu xong. */
export function stepList(steps, { start = 1, next = null, onToggle } = {}) {
  const list = h('div.plan-list');
  steps.forEach((s, i) => {
    const isNext = next && s.key === next.key;
    list.append(h(`div.today-step${s.done ? '.done' : ''}${isNext ? '.next' : ''}`,
      h('span.step-no', String(start + i)),
      h('button.tick', {
        'aria-label': s.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong',
        onclick: async () => { await store.markStep(s.key, !s.done); onToggle?.(); },
      }, s.done ? '✓' : ''),
      h('a.grow', { href: s.href },
        h('div.row.spread', h('b', s.title, isNext ? h('span.pill.seal.step-now', 'Làm tiếp') : null), h('span.plan-time', `${s.mins}′`)),
        h('div.small.faint', s.desc),
      ),
    ));
  });
  return list;
}

/** Thẻ "Hôm nay" của riêng một ngôn ngữ, đặt ở đầu mục Tiếng Anh / Tiếng Trung. */
export function langDayCard(plan, lang, { onToggle } = {}) {
  const ld = langDay(plan, lang);
  if (!ld.steps.length) return null;
  return h('div.card.lang-day',
    h('div.row.spread', h('h3', `Hôm nay · ${LANG_NAME[lang]}`), h('a.small.faint', { href: '#/home' }, 'Cả ngày ›')),
    h('div', { style: { margin: '8px 0 2px' } }, langMeter(ld, { link: false })),
    ld.done === ld.steps.length ? h('div.note.jade', { style: { marginTop: '8px' } }, `Xong hết việc ${LANG_NAME[lang].toLowerCase()} hôm nay.`) : null,
    stepList(ld.steps, { next: ld.next, onToggle }),
  );
}
