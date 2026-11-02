/* Chủ đề: nơi xem được nhiều chủ đề của cả hai ngôn ngữ, cùng các công cụ dùng chung. */

import * as store from '../store.js';
import * as content from '../content.js';
import { pair, sayBtn } from '../kit.js';
import { newCard, ZH_TYPES } from '../srs.js';
import { h, toast, section } from '../ui.js';

export async function render(route) {
  const sub = route.args[0];
  if (sub === 'topics') return topicList(route.query.lang);
  if (sub === 'topic') return topicView(Number(route.args[1]) || 0, route.query.lang);
  if (sub === 'fields') return fieldList();
  if (sub === 'field') return fieldView(route.args[1]);
  if (sub === 'mine') return mine();
  if (sub === 'sentences') return sentences();
  if (sub === 'irreg') return irregular();
  return home();
}

function tile(href, mark, title, sub, cn = false) {
  return h('a.hub-tile', { href },
    h(`span.hub-mark${cn ? '.cn' : ''}`, mark),
    h('span.grow', h('b', title), h('span.small.faint.block', sub)),
    h('span.faint', '›'),
  );
}

async function home() {
  const t = await content.topics();
  const k = await content.know();
  return {
    title: 'Chủ đề',
    el: h('div.stack',
      section('Theo chủ đề, cả hai ngôn ngữ', h('div.hub-grid',
        tile('#/lib/topics', '#', 'Chủ đề đời sống', `${t.topics.length} chủ đề, song song Anh và Trung`),
        tile('#/lib/fields', '¶', 'Từ theo lĩnh vực', 'Kinh tế, công nghệ, xã hội, tin tức'),
      )),
      section('Hiểu biết', h('div.hub-grid',
        tile('#/know', '◎', 'Kiến thức', `${k.lessons.length} bài song ngữ Anh–Việt`),
        tile('#/notes', '✎', 'Sổ ghi', 'Dự án, tài sản, sổ tư duy'),
      )),
      section('Công cụ', h('div.hub-grid',
        tile('#/numbers', '123', 'Đọc số và tiền', 'Tiếng Anh, tiếng Trung, tiếng Việt'),
        tile('#/lib/mine', '★', 'Sổ tay của tôi', 'Những từ bạn đã lưu'),
      )),
    ),
  };
}

async function topicList(lang) {
  const { topics } = await content.topics();
  const filter = lang === 'en' || lang === 'zh' ? lang : null;
  const groups = { 1: 'Cơ bản', 2: 'Trung cấp', 3: 'Nâng cao' };
  const el = h('div.stack');
  for (const lv of [1, 2, 3]) {
    const items = topics.map((t, i) => [t, i]).filter(([t]) => t.lv === lv);
    if (!items.length) continue;
    el.append(section(groups[lv], h('div.chip-grid',
      ...items.map(([t, i]) => h('a.topic-chip', { href: `#/lib/topic/${i}${filter ? `?lang=${filter}` : ''}` },
        h('b', t.name), h('span.small.faint', `${filter === 'zh' ? t.zh.length : filter === 'en' ? t.en.length : t.en.length + t.zh.length} từ`))))));
  }
  return { title: 'Chủ đề đời sống', el };
}

async function topicView(i, lang) {
  const { topics } = await content.topics();
  const t = topics[i];
  if (!t) return { title: 'Chủ đề', el: h('div.empty', 'Không thấy chủ đề này.') };
  const show = lang === 'en' || lang === 'zh' ? [lang] : ['en', 'zh'];
  const el = h('div.stack', h('h2', t.name));

  el.append(h('div.btn-row',
    ...show.map((l) => h('a.btn.sm', { href: `#/drill/topic/${i}/${l}` }, `Luyện tiếng ${l === 'en' ? 'Anh' : 'Trung'} ›`))));

  if (show.includes('en')) el.append(section('Tiếng Anh', h('div.card', ...t.en.map(([w, ipa, vi, ex, exVi]) => h('div',
    pair(w, `${ipa ? `${ipa} · ` : ''}${vi}`, { actions: [addEn(w, vi, ipa, ex, exVi)] }),
    ex ? h('div.topic-ex', pair(ex, exVi)) : null,
  )))));
  if (show.includes('zh')) el.append(section('Tiếng Trung', h('div.card', ...t.zh.map(([w, py, vi, ex, exVi]) => h('div',
    pair(w, `${py ? `${py} · ` : ''}${vi}`, { lang: 'zh', actions: [addZh(w, py, vi), h('a.btn.sm.ghost', { href: `#/write/${encodeURIComponent(w)}`, 'aria-label': 'Viết bằng bút' }, '✍️')] }),
    ex ? h('div.topic-ex', pair(ex, exVi, { lang: 'zh' })) : null,
  )))));
  return { title: t.name, el };
}

const addEn = (w, vi, ipa, ex, exVi) => h('button.btn.sm.ghost', {
  'aria-label': 'Thêm vào ôn tập',
  onclick: async (e) => {
    await store.addEnWord(w, { vi, ipa, ex, exVi, source: 'topic' });
    e.currentTarget.textContent = '✓';
    toast(`Đã thêm "${w}" vào bộ ôn.`);
  },
}, '+');

const addZh = (w, py, vi) => h('button.btn.sm.ghost', {
  'aria-label': 'Thêm vào ôn tập',
  onclick: async (e) => {
    const cards = ZH_TYPES.map((type) => ({ ...newCard(w, type, 'topic'), lang: 'zh', py, vi }));
    const fresh = [];
    for (const c of cards) if (!(await store.getCard(c.id))) fresh.push(c);
    if (fresh.length) await store.putCards(fresh);
    e.currentTarget.textContent = '✓';
    toast(`Đã thêm ${w} vào bộ ôn.`);
  },
}, '+');

async function fieldList() {
  const [k, rows] = await Promise.all([content.know(), content.bankRows()]);
  const counts = {};
  for (const r of rows) if (r[6]) counts[r[6]] = (counts[r[6]] || 0) + 1;
  return {
    title: 'Từ theo lĩnh vực',
    el: h('div.chip-grid', ...k.topics.filter((t) => counts[t.id]).map((t) => h('a.topic-chip', { href: `#/lib/field/${t.id}` },
      h('b', t.name || t.title || t.vi), h('span.small.faint', `${counts[t.id]} từ`)))),
  };
}

async function fieldView(id) {
  const [k, rows] = await Promise.all([content.know(), content.bankRows()]);
  const t = k.topics.find((x) => x.id === id);
  const items = rows.filter((r) => r[6] === id).sort((a, b) => a[7] - b[7]);
  const list = h('div.card');
  let shown = 0;
  const more = h('button.btn.block', { onclick: page }, 'Xem thêm');
  function page() {
    for (const [w, ipa, , vi, ex, exVi] of items.slice(shown, shown + 40)) {
      list.append(h('div',
        pair(w, `${ipa ? `${ipa} · ` : ''}${vi}`, { actions: [addEn(w, vi, ipa, ex, exVi), h('a.btn.sm.ghost', { href: `#/penen/${encodeURIComponent(w)}`, 'aria-label': 'Viết bằng bút' }, '✍️')] }),
        ex ? h('div.topic-ex', pair(ex, exVi)) : null));
    }
    shown += 40;
    more.hidden = shown >= items.length;
  }
  page();
  return {
    title: t?.name || t?.title || 'Lĩnh vực',
    el: h('div.stack', h('a.btn.sm', { href: `#/drill/field/${id}/en` }, 'Luyện nhóm từ này ›'), list, more),
  };
}

async function mine() {
  const cards = await store.allCards();
  const en = cards.filter((c) => c.type === 'en-recall').sort((a, b) => a.word.localeCompare(b.word));
  const zh = cards.filter((c) => c.type === 'hanzi-vi').sort((a, b) => a.word.localeCompare(b.word));
  return {
    title: 'Sổ tay của tôi',
    el: h('div.stack',
      section(`Tiếng Anh · ${en.length} từ`, en.length
        ? h('div.card', ...en.map((c) => pair(c.word, c.vi)))
        : h('p.small.faint', 'Chưa có từ nào. Chạm vào một từ khi đọc truyện để lưu lại.')),
      section(`Tiếng Trung · ${zh.length} từ`, zh.length
        ? h('div.card', ...zh.map((c) => pair(c.word, `${c.py ? `${c.py} · ` : ''}${c.vi}`, { lang: 'zh' })))
        : h('p.small.faint', 'Chưa có từ nào.')),
    ),
  };
}

async function sentences() {
  const rows = await content.sentences();
  const byTopic = new Map();
  for (const r of rows) {
    if (!byTopic.has(r[3])) byTopic.set(r[3], []);
    byTopic.get(r[3]).push(r);
  }
  const k = await content.know();
  const name = (id) => k.topics.find((t) => t.id === id)?.name || id;
  return {
    title: 'Câu mẫu',
    el: h('div.stack', ...[...byTopic].map(([t, list]) => section(name(t), h('div.card',
      ...list.map((r) => h('div', pair(r[1], r[2]), r[5] ? h('div.small.faint', { style: { margin: '-2px 0 8px' } }, r[5]) : null)))))),
  };
}

async function irregular() {
  const c = await content.course();
  return {
    title: 'Động từ bất quy tắc',
    el: h('div.stack', ...c.irreg.map((g) => section(g.g, h('div.card', ...g.v.map((v) => h('div.irreg',
      h('div.grow', h('b', v[0]), h('span.muted', ` · ${v[1]} · ${v[2]}`), h('div.small.faint', v[3])),
      sayBtn(`${v[0]}, ${v[1]}, ${v[2]}`),
    )))))),
  };
}
