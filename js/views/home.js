/* Hôm nay: mở app là biết ngay phải làm gì, làm tới đâu là đủ. */

import * as store from '../store.js';
import * as data from '../data.js';
import * as content from '../content.js';
import { buildToday, DAY_NAME, curSession } from '../plan.js';
import { h, progressBar } from '../ui.js';
import { streak } from '../progress.js';
import { rankCard } from '../xp.js';

const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export async function render() {
  const [plan, st, challenges] = await Promise.all([buildToday(), streak(), store.kvGet('challenge', {})]);
  const ch = challenges[store.dayKey()];
  const el = h('div.stack');

  const totalSecs = Object.values(plan.day.secs || {}).reduce((a, b) => a + b, 0);
  const minsToday = Math.round(totalSecs / 60);
  const planned = plan.steps.reduce((a, s) => a + s.mins, 0);
  const doneCount = plan.steps.filter((s) => s.done).length;
  const next = plan.steps.find((s) => !s.done);
  const now = new Date();

  /* ---- đầu trang: một nút duy nhất để bắt đầu ---- */
  el.append(h('div.card.today-hero',
    h('div.row.spread',
      h('div',
        h('div.small.hero-sub', `${WEEKDAY[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1} · ${DAY_NAME[plan.type]}`),
        h('div.streak', { title: `Chuỗi dài nhất: ${st.best} ngày` },
          '🔥 ', st.cur ? h('b', String(st.cur)) : null, st.cur ? ' ngày học liên tiếp' : 'Học hôm nay để bắt đầu chuỗi ngày',
          st.cur && !st.todayOn ? h('span.small', ' · học hôm nay để giữ chuỗi') : null),
        h('h1.today-title', doneCount === plan.steps.length ? 'Xong hết việc hôm nay' : `Hôm nay, ${planned} phút`),
      ),
      h('div.today-time', h('b', String(minsToday)), h('span', `/${planned} phút`)),
    ),
    h('div', { style: { marginTop: '12px' } }, progressBar(plan.steps.length ? doneCount / plan.steps.length : 0)),
    next
      ? h('a.btn.seal.block', { href: next.href, style: { marginTop: '14px' } }, `Tiếp tục: ${next.title} ›`)
      : h('a.btn.ghost.block.on-hero', { href: '#/read', style: { marginTop: '14px' } }, 'Còn sức thì đọc thêm một bài'),
  ));
  el.append(await rankCard({ compact: true }));

  if (plan.quota.reason) el.append(h('div.note', plan.quota.reason));

  /* ---- các việc theo thứ tự ---- */
  const list = h('div.plan-list');
  for (const s of plan.steps) {
    const isNext = next && s.key === next.key;
    list.append(h(`div.today-step${s.done ? '.done' : ''}${isNext ? '.next' : ''}`,
      h('button.tick', {
        'aria-label': s.done ? 'Bỏ đánh dấu' : 'Đánh dấu xong',
        onclick: async () => {
          await store.markStep(s.key, !s.done);
          location.hash = '#/home';
          window.dispatchEvent(new HashChangeEvent('hashchange'));
        },
      }, s.done ? '✓' : ''),
      h('a.grow', { href: s.href },
        h('div.row.spread', h('b', s.title), h('span.plan-time', `${s.mins}′`)),
        h('div.small.faint', s.desc),
      ),
    ));
  }
  el.append(h('div.card', { style: { padding: '6px 14px' } }, list));

  /* ---- thử thách 10 câu ---- */
  el.append(h('a.card.challenge-card', { href: '#/challenge' },
    h('span.hub-mark', '🎯'),
    h('div.grow', h('b', 'Thử thách hôm nay'),
      h('div.small.faint', ch ? `Đã làm: đúng ${ch.right}/${ch.n} câu. Làm lại để ôn thêm.` : '10 câu trắc nghiệm nhanh từ những từ đã học, 2–3 phút')),
    h('span.pill.jade', ch ? `${ch.right}/${ch.n}` : '10 câu ›'),
  ));

  /* ---- đang ở đâu ---- */
  el.append(await whereAmI());

  /* ---- nhật ký ---- */
  el.append(journalCard(plan.day));

  return { title: 'Hôm nay', el };
}

async function whereAmI() {
  const [en, read, wk, kn, lessons, course, idx, stories, knowData] = await Promise.all([
    store.enState(), store.readState(), store.workState(), store.knowState(), store.lessonProgress(),
    content.course(), data.curriculum(), content.storyIndex(), content.know(),
  ]);
  const stage = en.stage || 0;
  const sessDone = Object.values(en.sess?.[stage] || {}).filter((x) => x.done).length;
  const zhDone = idx.lessons.filter((l) => lessons[l.id]?.done).length;
  const totalCh = stories.reduce((a, s) => a + s.chapters.length, 0);
  const readCh = Object.values(read.stories || {}).reduce((a, s) => a + Object.keys(s.ch || {}).length, 0);
  const n = curSession(en, course);

  const row = (label, sub, ratio, href) => h('a.where', { href },
    h('div.row.spread', h('b', label), h('span.small.faint', sub)),
    progressBar(ratio),
  );
  return h('div.card',
    h('h3', { style: { marginBottom: '8px' } }, 'Đang ở đâu'),
    h('div.where-grid',
      row('Tiếng Anh', `${course.stages[stage].name} · buổi ${n}/${course.stages[stage].total}`, sessDone / course.stages[stage].total, '#/en'),
      row('Tiếng Trung', `${zhDone}/${idx.lessons.length} bài HSK`, zhDone / idx.lessons.length, '#/zh'),
      row('Đọc song ngữ', `${readCh}/${totalCh} chương · ${read.words || 0} từ`, readCh / totalCh, '#/read'),
      row('Anh nghề', `${Object.keys(wk.done).length}/30 ngày`, Object.keys(wk.done).length / 30, '#/work'),
      row('Kiến thức', `${Object.keys(kn.done).length}/${knowData.lessons.length} bài`, Object.keys(kn.done).length / knowData.lessons.length, '#/know'),
    ),
  );
}

function journalCard(day) {
  const label = h('b', day.self ? `${day.self}/5` : 'chưa ghi');
  let timer = null;
  const note = h('textarea.scribble.long', {
    placeholder: 'Hôm nay học được gì? Một dòng là đủ.',
    oninput: () => {
      clearTimeout(timer);
      timer = setTimeout(() => store.patchToday((d) => { d.note = note.value; }), 500);
    },
  });
  note.value = day.note || '';
  return h('div.card',
    h('div.row.spread', h('h3', 'Nhật ký hôm nay'), h('a.small.faint', { href: '#/stats' }, 'Xem cả nhật ký ›')),
    h('div.row', { style: { margin: '8px 0' } },
      h('span.small', 'Hôm nay bạn hiểu được bao nhiêu?'),
      h('input.range.grow', {
        type: 'range', min: '1', max: '5', step: '1', value: String(day.self || 3),
        onchange: (e) => {
          const v = Number(e.target.value);
          label.textContent = `${v}/5`;
          store.patchToday((d) => { d.self = v; });
        },
      }),
      label,
    ),
    note,
  );
}
