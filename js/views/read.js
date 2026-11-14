/* Thư viện đọc: truyện, chuyện có thật, tin tức và bí ẩn, chia theo từng ngôn ngữ. */

import * as store from '../store.js';
import * as content from '../content.js';
import { h, section, progressBar } from '../ui.js';

/* Bìa truyện (ChatGPT đợt 9–15): data/covers.json liệt kê truyện đã có img/covers/<id>.webp */
let coverSet = null;
const loadCovers = () => coverSet || (coverSet = fetch('data/covers.json').then((r) => (r.ok ? r.json() : [])).catch(() => []).then((a) => new Set(a)));
const cover = (id, covers, cls = 'story-cover') => (covers.has(id) ? h(`img.${cls}`, { src: `img/covers/${id}.webp`, alt: '', loading: 'lazy' }) : null);

export async function render(route) {
  const covers = await loadCovers();
  const lang = route.args[0] === 'zh' ? 'zh' : 'en';
  const [index, read, cards] = await Promise.all([content.storyIndex(), store.readState(), store.allCards()]);
  const list = index.filter((s) => s.lang === lang);
  const known = knownSet(cards, lang);
  const nx = content.nextReading(list, read);

  const el = h('div.stack');

  el.append(h('div.mode-seg.lang-seg',
    h('a', { class: lang === 'en' ? 'on' : '', href: '#/read/en' }, 'Truyện tiếng Anh'),
    h('a', { class: lang === 'zh' ? 'on' : '', href: '#/read/zh' }, 'Truyện tiếng Trung'),
  ));

  if (nx) {
    const art = cover(nx.story.id, covers, 'hero-art');
    el.append(h(`a.card.today-hero${art ? '.has-art' : ''}`, { href: `#/reader/${nx.story.id}/${nx.chapter.n}` },
      art,
      h('div.small.hero-sub', `Đọc tiếp · ${nx.story.level}`),
      h(`h1.today-title${lang === 'zh' ? '.cn' : ''}`, nx.story.title),
      h('div.hero-sub', nx.story.vi),
      nx.story.chapters.length > 1 ? h('div.small.hero-sub', `Chương ${nx.chapter.n}: ${nx.chapter.title}`) : null,
    ));
  }

  const levels = [...new Set(list.map((s) => s.level))].sort();
  const shelves = h('div.stack');
  const chips = h('div.row.wrap', { style: { gap: '6px' } });
  let active = 'all';

  function draw() {
    shelves.replaceChildren();
    for (const shelf of content.SHELVES.filter((x) => !x.lang || x.lang === lang)) {
      const items = content.sortedStories(list.filter((s) => s.shelf === shelf.id && (active === 'all' || s.level === active)));
      if (shelf.id === 'news') items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
      if (!items.length) continue;
      shelves.append(section(shelf.name,
        h('p.small.faint', { style: { marginTop: '-6px' } }, shelf.hint),
        h('div.story-grid', ...items.map((s) => storyCard(s, read, known, covers))),
      ));
    }
  }

  function drawChips() {
    chips.replaceChildren(...['all', ...levels].map((lv) => h(`button.chip${lv === active ? '.on' : ''}`, {
      onclick: () => { active = lv; drawChips(); draw(); },
    }, lv === 'all' ? 'Tất cả' : lv)));
  }
  drawChips();
  draw();

  el.append(chips, shelves);
  return { title: lang === 'zh' ? 'Truyện tiếng Trung' : 'Truyện tiếng Anh', el };
}

function knownSet(cards, lang) {
  const out = new Set();
  for (const c of cards) {
    if (lang === 'en' && c.lang === 'en') out.add(String(c.word).toLowerCase());
    if (lang === 'zh' && (!c.lang || c.lang === 'zh')) for (const ch of String(c.word)) out.add(ch);
  }
  return out;
}

function storyCard(s, read, known, covers = new Set()) {
  const done = Object.keys(read.stories?.[s.id]?.ch || {}).length;
  const total = s.chapters.length;
  const unit = s.lang === 'zh' ? 'chữ' : 'từ';
  const mins = Math.max(2, Math.round(s.words / (s.lang === 'zh' ? 40 : 50)));
  const pct = known.size >= 50 && s.uw?.length
    ? Math.round((s.uw.filter((w) => known.has(w)).length / s.uw.length) * 100)
    : null;
  const nextCh = s.chapters.find((c) => !read.stories?.[s.id]?.ch?.[c.n]) || s.chapters[0];
  return h('a.story-card', { href: `#/reader/${s.id}/${nextCh.n}` },
    cover(s.id, covers),
    h('div.row.spread', h('span.level', s.level), s.date ? h('span.small.faint', fmtDate(s.date)) : null),
    h(`b.story-title${s.lang === 'zh' ? '.cn' : ''}`, s.title),
    h('div.small.muted', s.vi),
    h('div.small.faint', { style: { margin: '6px 0' } }, s.blurb),
    h('div.small.faint',
      `${s.words} ${unit} · ~${mins} phút${total > 1 ? ` · ${total} chương` : ''}${pct !== null ? ` · bạn biết ${pct}% ${unit}` : ''}`),
    done ? h('div', { style: { marginTop: '8px' } }, progressBar(done / total)) : null,
  );
}

function fmtDate(s) {
  const [y, m, d] = s.split('-');
  return d ? `${Number(d)}/${Number(m)}/${y}` : s;
}
