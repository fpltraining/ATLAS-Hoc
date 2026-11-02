/* Luyện nhanh một nhóm từ, gộp từ Song Ngữ: thẻ lật, trắc nghiệm, nghe chọn, nói theo.
   Dùng chung cho cả hai ngôn ngữ. */

import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import { newCard, ZH_TYPES } from '../srs.js';
import { micCheck, shuffle } from '../kit.js';
import { h, toast, pill } from '../ui.js';

const MODES = [
  ['flash', 'Thẻ lật', 'Nhìn từ, nhớ nghĩa, tự đánh giá'],
  ['quiz', 'Trắc nghiệm', 'Chọn nghĩa đúng'],
  ['listen', 'Nghe và chọn', 'Chỉ nghe, không nhìn chữ'],
  ['speak', 'Nói theo', 'Nghe rồi đọc lại'],
];

async function loadItems(kind, id, lang) {
  if (kind === 'topic') {
    const { topics } = await content.topics();
    const t = topics[Number(id)];
    return { name: t.name, items: t[lang].map(([w, read, vi, ex, exVi]) => ({ w, read, vi, ex, exVi })) };
  }
  const [k, rows] = await Promise.all([content.know(), content.bankRows()]);
  const t = k.topics.find((x) => x.id === id);
  return {
    name: t?.name || 'Lĩnh vực',
    items: shuffle(rows.filter((r) => r[6] === id)).slice(0, 20).map(([w, read, , vi, ex, exVi]) => ({ w, read, vi, ex, exVi })),
  };
}

export async function render(route) {
  const [kind, id, lang = 'en'] = route.args;
  const mode = route.query.mode;
  const settings = await store.settings();
  const { name, items } = await loadItems(kind, id, lang);
  const base = `#/drill/${kind}/${id}/${lang}`;
  const zh = lang === 'zh';
  const say = (t) => audio.speak(t, { lang, rate: zh ? settings.speechRate : settings.enRate });

  if (!mode) {
    return {
      title: name,
      el: h('div.stack',
        h('div.hub-grid', ...MODES.map(([m, label, sub]) => h('a.hub-tile', { href: `${base}?mode=${m}` },
          h('span.grow', h('b', label), h('span.small.faint.block', sub)), h('span.faint', '›')))),
        h('button.btn.jade.block', {
          onclick: async () => {
            for (const x of items) {
              if (zh) {
                const cards = ZH_TYPES.map((type) => ({ ...newCard(x.w, type, 'topic'), lang: 'zh', py: x.read, vi: x.vi }));
                for (const c of cards) if (!(await store.getCard(c.id))) await store.putCard(c);
              } else {
                await store.addEnWord(x.w, { vi: x.vi, ipa: x.read, ex: x.ex, exVi: x.exVi, source: 'topic' });
              }
            }
            toast(`Đã thêm ${items.length} từ vào bộ ôn.`);
          },
        }, `+ Thêm cả ${items.length} từ vào ôn tập`),
      ),
    };
  }

  const queue = shuffle(items);
  let i = 0, right = 0;
  const el = h('div');
  const wordCls = zh ? 'div.word-big.cn' : 'div.word-big';

  const finish = () => {
    el.replaceChildren(h('div.card.center',
      h('h2', 'Xong'),
      mode === 'speak' ? null : h('div.score-big', `${right}/${queue.length}`),
      h('div.btn-row', { style: { marginTop: '12px' } },
        h('a.btn', { href: base }, 'Chọn cách khác'),
        h('a.btn.primary', { href: '#/lib/topics' }, 'Chủ đề khác'),
      ),
    ));
  };
  const next = () => { i++; if (i >= queue.length) finish(); else draw(); };
  const head = () => pill(`${i + 1} / ${queue.length}`, 'plain');

  function draw() {
    const x = queue[i];
    if (mode === 'flash') {
      const back = h('div', { hidden: true },
        x.read ? h('div.faint', x.read) : null,
        h('div.word-mean', x.vi),
        x.ex ? h('div.pair', h('div.grow', h(`div.pair-en${zh ? '.cn' : ''}`, x.ex), h('div.pair-vi', x.exVi || ''))) : null,
      );
      const actions = h('div.btn-row', { hidden: true, style: { marginTop: '12px' } },
        h('button.btn.g0', { onclick: next }, 'Chưa nhớ'),
        h('button.btn.g2', { onclick: () => { right++; next(); } }, 'Nhớ rồi'),
      );
      const show = h('button.btn.primary.block', {
        onclick: () => { back.hidden = false; actions.hidden = false; show.hidden = true; say(x.w); },
      }, 'Lật thẻ');
      el.replaceChildren(h('div.card', head(), h(wordCls, { style: { margin: '18px 0' } }, x.w), back, show, actions));
      return;
    }
    if (mode === 'speak') {
      el.replaceChildren(h('div.card', head(),
        h(wordCls, { style: { margin: '18px 0' } }, x.w),
        x.read ? h('div.faint', x.read) : null,
        h('div.word-mean', x.vi),
        h('button.btn.jade', { style: { margin: '10px 0' }, onclick: () => say(x.w) }, '🔊 Nghe'),
        zh ? null : micCheck(x.w),
        h('button.btn.primary.block', { style: { marginTop: '12px' }, onclick: next }, 'Từ tiếp ›'),
      ));
      say(x.w);
      return;
    }
    // Trắc nghiệm và nghe chọn
    const wrong = shuffle(items.filter((y) => y.vi !== x.vi)).slice(0, 3);
    const opts = shuffle([x, ...wrong]);
    const list = h('div.mcq');
    let done = false;
    opts.forEach((o) => {
      list.append(h('button.mcq-opt', {
        onclick: (e) => {
          if (done) return;
          done = true;
          if (o === x) { right++; e.currentTarget.classList.add('ok'); } else {
            e.currentTarget.classList.add('no');
            [...list.children][opts.indexOf(x)].classList.add('ok');
          }
          say(x.w);
          setTimeout(next, 1100);
        },
      }, o.vi));
    });
    el.replaceChildren(h('div.card', head(),
      mode === 'listen'
        ? h('button.btn.jade', { style: { margin: '18px 0' }, onclick: () => say(x.w) }, '🔊 Nghe lại')
        : h(wordCls, { style: { margin: '18px 0' } }, x.w),
      list,
    ));
    if (mode === 'listen') say(x.w);
  }

  draw();
  return { title: name, el };
}
