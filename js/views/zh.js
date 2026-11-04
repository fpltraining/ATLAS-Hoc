/* Mục Tiếng Trung: cùng khuôn với mục Tiếng Anh — bài đang học, truyện, viết bằng
   bút, ôn thẻ, rồi toàn bộ lộ trình HSK. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { h, section, progressBar, plural } from '../ui.js';
import { cardSummary, mastery } from '../progress.js';

export async function render() {
  const [idx, cards, progress, read, stories] = await Promise.all([
    data.curriculum(), store.allCards(), store.lessonProgress(), store.readState(), content.storyIndex(),
  ]);
  const zhCards = cards.filter((c) => !c.lang || c.lang === 'zh');
  const now = Date.now();
  const due = zhCards.filter((c) => c.due <= now).length;
  const next = idx.lessons.find((l) => !progress[l.id]?.done) || idx.lessons[0];
  const doneCount = idx.lessons.filter((l) => progress[l.id]?.done).length;
  const zhStories = stories.filter((s) => s.lang === 'zh');
  const nx = content.nextReading(zhStories, read);
  const scores = await store.kvGet('writeScores', {});

  const el = h('div.stack');

  /* ---- bài đang học ---- */
  el.append(h('div.card.today-hero',
    h('div.small.hero-sub', `HSK ${next.level} · bài ${next.no ?? next.id}/${idx.lessons.length}`),
    h('h1.today-title', next.title),
    h('div.cn.hero-cn', next.cn),
    h('div', { style: { marginTop: '12px' } }, progressBar(doneCount / idx.lessons.length)),
    h('a.btn.seal.block', { href: `#/lesson/${next.id}`, style: { marginTop: '14px' } }, doneCount ? 'Học tiếp ›' : 'Bắt đầu ›'),
  ));

  /* ---- bốn việc chính, xếp giống hệt mục Tiếng Anh ---- */
  el.append(h('div.hub-grid',
    tile('#/read/zh', '读', 'Đọc truyện', nx ? nx.story.title : `${zhStories.length} truyện`),
    tile(`#/charmap/${next.id}`, '写', 'Viết bằng bút', `Chấm từng nét · ${plural(Object.keys(scores).length, 'chữ')} đã viết`),
    tile('#/review?lang=zh', '↻', 'Ôn thẻ', due ? `${due} thẻ tới hạn` : 'Chưa có thẻ tới hạn'),
    tile('#/lib/topics?lang=zh', '题', 'Theo chủ đề', '99 chủ đề đời sống'),
  ));

  el.append(h('div.hub-grid',
    tile('#/exam', '考', 'Thi thử HSK', 'Đề luyện cấp 1–4, chấm điểm'),
    tile('#/pinyin', 'ā', 'Pinyin', 'Thanh điệu, vần, biến điệu'),
    tile('#/radicals', '部', 'Bộ thủ', 'Mảnh ghép của chữ Hán'),
    tile('#/hsk/1', '词', 'Từ vựng HSK 3.0', 'Đủ cấp 1 đến 7–9, nghĩa chi tiết'),
    tile('#/games', '戏', 'Trò ôn nhanh', 'Nghe chọn chữ, phản xạ, nối cặp, ghép chữ'),
  ));

  /* ---- tóm tắt thẻ ôn ---- */
  el.append(cardSummary(zhCards, '#/review?lang=zh', 'Thẻ ôn tiếng Trung'));

  /* ---- lộ trình HSK ---- */
  const byLesson = {};
  for (const c of zhCards) (byLesson[c.lesson] = byLesson[c.lesson] || []).push(c);
  const levels = idx.levels || [...new Set(idx.lessons.map((l) => l.level || 1))].sort();
  for (const lv of levels) {
    const inLevel = idx.lessons.filter((l) => (l.level || 1) === lv);
    const doneHere = inLevel.filter((l) => progress[l.id]?.done).length;
    const list = h('div', { style: { padding: '0 2px' } });
    for (const l of inLevel) {
      const p = progress[l.id] || {};
      const isNext = l.id === next.id && !p.done;
      list.append(h(`a.lesson-item.${p.done ? 'done' : isNext ? 'now' : 'x'}`, {
        href: `#/lesson/${l.id}`,
        style: { padding: '12px 0', borderBottom: '1px solid var(--line)' },
      },
        h('div.lesson-no', p.done ? '✓' : String(l.no ?? l.id)),
        h('div.grow',
          h('div.row', { style: { gap: '7px' } }, h('b', l.title), h('span.cn.faint', { style: { fontSize: '14px' } }, l.cn)),
          h('div.small.faint', `${l.wordCount} từ · ${plural(l.newChars.length, 'chữ mới')}`),
        ),
        byLesson[l.id] ? h('span.small.jade-text', `${Math.round(mastery(byLesson[l.id]) * 100)}%`) : null,
        h('span.faint', '›'),
      ));
    }
    const open = inLevel.some((l) => l.id === next.id);
    el.append(h('details.card.fold', { open },
      h('summary', h('b', `HSK ${lv}`), h('span.small.faint', ' (chuẩn 2025)'), h('span.small.faint', ` · ${doneHere}/${inLevel.length} bài · ${inLevel.reduce((s, l) => s + l.wordCount, 0)} từ`)),
      list,
    ));
  }

  return { title: 'Tiếng Trung', el };
}

function tile(href, mark, title, sub) {
  return h('a.hub-tile', { href },
    h('span.hub-mark.cn', mark),
    h('span.grow', h('b', title), h('span.small.faint.block', sub)),
    h('span.faint', '›'),
  );
}
