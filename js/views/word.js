/* Từ tiếng Trung: trang chi tiết (#/word/<từ>) và danh sách HSK 3.0 theo cấp (#/hsk/<cấp>).

   Nghĩa nhiều dòng lấy từ CVDICT (Phong Phan, dịch từ CC-CEDICT, CC BY-SA 4.0),
   nghĩa ngắn và âm Hán Việt lấy từ từ điển của app khi có. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import { newCard, ZH_TYPES } from '../srs.js';
import { h, toast, pill } from '../ui.js';
import { refreshDueBadge } from '../app.js';

export const LEVELS = ['1', '2', '3', '4', '5', '6', '7-9'];
const PAGE = 100;

/* Nghĩa ngắn: nghĩa trong từ điển của app, không có thì 2 nghĩa đầu của CVDICT */
export function shortMeaning(w, zh, full) {
  if (zh[w]?.[2]) return zh[w][2];
  const r = full[w]?.[0];
  return r ? r[1].filter((s) => !/^(Lượng từ|biến thể|dùng trong)/.test(s)).slice(0, 2).join('; ') : '';
}

export async function render(route) {
  if (route.name === 'hsk') return hskList(route);
  const w = decodeURIComponent(route.args[0] || '');
  const [full, zh, lv, settings] = await Promise.all([
    content.zhFull(), content.zhDict(), data.hsk2025(), store.settings(), data.ensureHanViet(),
  ]);
  const readings = full[w] || [];
  const mine = zh[w];
  if (!readings.length && !mine) {
    return { title: w, el: h('div.empty', `Chưa có nghĩa cho “${w}”.`) };
  }
  const say = () => audio.speak(w, { rate: settings.speechRate });
  const hv = mine?.[1] || data.hvOfWord(w);
  const py = mine?.[0] || readings[0]?.[0] || '';

  const addBtn = h('button.btn.jade', {
    onclick: async () => {
      const cards = await store.allCards();
      const have = new Set(cards.map((c) => c.id));
      const vi = shortMeaning(w, zh, full);
      const fresh = ZH_TYPES.map((t) => newCard(w, t, 'tra'))
        .filter((c) => !have.has(c.id))
        .map((c) => ({ ...c, lang: 'zh', py, hv, vi }));
      if (fresh.length) await store.putCards(fresh);
      await refreshDueBadge();
      toast(fresh.length ? `Đã thêm “${w}” vào thẻ ôn.` : 'Từ này đã có trong thẻ ôn.');
      addBtn.textContent = '✓ Đã có trong thẻ ôn';
    },
  }, '+ Thẻ ôn');

  const el = h('div.stack',
    h('div.card',
      h('div.row.spread',
        h('div',
          h('div.cn', { style: { fontSize: '48px', lineHeight: 1.1 } }, w),
          h('div.row.wrap', { style: { gap: '8px', marginTop: '6px' } },
            h('span.py', { style: { fontSize: '20px' } }, py), hv ? h('span.hv', hv) : null,
            lv[w] ? pill(`HSK ${lv[w]}`, 'jade') : null),
        ),
        h('button.speak-btn', { onclick: say, 'aria-label': 'Đọc' }, '🔊'),
      ),
      mine?.[2] ? h('div', { style: { marginTop: '10px', fontSize: '18px', fontWeight: 600 } }, mine[2]) : null,
      h('div.btn-row', { style: { marginTop: '12px' } },
        addBtn,
        ...[...new Set([...w].filter(data.isHan))].map((ch) => h('a.btn.ghost', { href: `#/char/${encodeURIComponent(ch)}` }, `${ch} · viết`)),
      ),
    ),
    ...readings.map(([rpy, senses]) => h('div.card',
      readings.length > 1 ? h('div.py', { style: { fontSize: '18px', marginBottom: '6px' } }, rpy) : null,
      h('ol.senses', ...senses.map((s) => h('li', s))),
    )),
    readings.length
      ? h('p.small.faint', 'Nghĩa chi tiết: từ điển CVDICT (Phong Phan, dịch từ CC-CEDICT, giấy phép CC BY-SA 4.0). Bản dịch có dùng AI nên có thể còn sót lỗi.')
      : null,
  );
  setTimeout(say, 200);
  return { title: w, el };
}

async function hskList(route) {
  const level = LEVELS.includes(route.args[0]) ? route.args[0] : '1';
  const [lv, zh, full] = await Promise.all([data.hsk2025(), content.zhDict(), content.zhFull()]);
  const all = Object.keys(lv).filter((w) => lv[w] === level);
  const counts = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  for (const w of Object.keys(lv)) counts[lv[w]] = (counts[lv[w]] || 0) + 1;

  const tabs = h('div.level-tabs', ...LEVELS.map((l) => h(`a.level-tab${l === level ? '.on' : ''}`,
    { href: `#/hsk/${l}` }, h('b', `HSK ${l}`), h('span', `${counts[l]} từ`))));
  const list = h('div.card', { style: { padding: '4px 14px' } });
  const more = h('button.btn.block', { onclick: () => draw() });
  let shown = 0;

  function draw() {
    for (const w of all.slice(shown, shown + PAGE)) {
      const py = zh[w]?.[0] || full[w]?.[0]?.[0] || '';
      list.append(h('a.word-row', { href: `#/word/${encodeURIComponent(w)}` },
        h('div', h('span.cn', { style: { fontSize: '24px' } }, w), h('div.py.small', py)),
        h('div.grow.small', shortMeaning(w, zh, full)),
        h('span.faint', '›'),
      ));
    }
    shown = Math.min(all.length, shown + PAGE);
    more.hidden = shown >= all.length;
    more.textContent = `Xem thêm (${shown}/${all.length})`;
  }
  draw();

  return {
    title: 'Từ vựng HSK 3.0',
    el: h('div.stack',
      tabs,
      h('p.small.faint', `HSK ${level}: ${all.length} từ theo chuẩn HSK 3.0 (2025). Chạm vào từ để xem nghĩa chi tiết.`),
      list, more,
    ),
  };
}
