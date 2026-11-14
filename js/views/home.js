/* Hôm nay: mở app là biết ngay phải làm gì, làm tới đâu là đủ. */

import * as store from '../store.js';
import { buildToday, DAY_NAME, langDay, LANG_NAME } from '../plan.js';
import { langMeter, stepList, LANG_MARK } from '../daycard.js';
import { h } from '../ui.js';
import { streak } from '../progress.js';
import { rankCard } from '../xp.js';
import { zhPath, enPath, pathCard } from '../path.js';
import { artSvg } from '../fx-art.js';

const WEEKDAY = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export async function render() {
  const [plan, st, challenges, days] = await Promise.all([buildToday(), streak(), store.kvGet('challenge', {}), store.allDays()]);
  const ch = challenges[store.dayKey()];
  const el = h('div.stack');

  // Tiến độ tách theo ngôn ngữ: mỗi nhóm có số việc, số phút và thanh riêng
  const groups = ['en', 'zh', 'all'].map((lg) => langDay(plan, lg)).filter((g) => g.steps.length);
  const meters = groups.filter((g) => g.lang !== 'all');
  const next = plan.steps.find((s) => !s.done);
  const now = new Date();
  const refresh = () => { location.hash = '#/home'; window.dispatchEvent(new HashChangeEvent('hashchange')); };

  /* ---- lần đầu: mời trả lời 4 câu để có lộ trình riêng ---- */
  if (!plan.settings.onboarded) {
    el.append(h('div.card.start-invite',
      h('img.start-ava', { src: 'img/mascot/han-chao.webp', alt: 'Han' }),
      h('div.grow',
        h('b', 'Chưa biết học từ đâu?'),
        h('div.small.muted', 'Trả lời 4 câu (1 phút): học gì, mỗi ngày bao lâu, đang ở trình độ nào. App xếp lộ trình riêng và chỉ đúng bài cần học trước.'),
      ),
      h('a.btn.seal', { href: '#/start' }, 'Xếp lộ trình ›'),
    ));
  }

  /* ---- đầu trang: đúng một việc cần làm ngay, tiến độ từng ngôn ngữ ---- */
  const nextGroup = next ? groups.find((g) => g.lang === next.lang) : null;
  el.append(h('div.card.today-hero',
    h('div.small.hero-sub', `${WEEKDAY[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1} · ${DAY_NAME[plan.type]}`),
    h('div.streak-row',
      h('div.streak', { title: `Chuỗi dài nhất: ${st.best} ngày` },
        h('span.streak-flame', { html: artSvg('fire', 26) }),
        st.cur ? h('b.streak-n', String(st.cur)) : null,
        h('span', st.cur ? ' ngày liên tiếp' : 'Học hôm nay để bắt đầu chuỗi ngày'),
        st.cur && !st.todayOn ? h('span.small.streak-warn', 'Học hôm nay để giữ chuỗi') : null),
      weekDots(days, now),
    ),
    h('div.hero-meters', ...meters.map((g) => langMeter(g))),
    next
      ? h('div.hero-next',
        h('div.small.hero-sub', `${LANG_MARK[next.lang]} ${LANG_NAME[next.lang]} · việc ${nextGroup.steps.indexOf(next) + 1}/${nextGroup.steps.length} · khoảng ${next.mins} phút`),
        h('h1.today-title', next.title),
        h('div.hero-desc', next.desc),
      )
      : h('h1.today-title', { style: { marginTop: '12px' } }, 'Xong hết việc hôm nay 🎉'),
    next
      ? h('a.btn.seal.block', { href: next.href, style: { marginTop: '14px' } }, 'Học ngay ›')
      : h('a.btn.ghost.block.on-hero', { href: '#/read', style: { marginTop: '14px' } }, 'Còn sức thì đọc thêm một bài'),
  ));

  if (plan.quota.reason) el.append(h('div.note', plan.quota.reason));

  /* ---- việc hôm nay, chia nhóm theo ngôn ngữ; mỗi nhóm có thanh tiến độ riêng ---- */
  for (const g of groups) {
    el.append(h('div.card.lang-day', { style: { padding: '10px 14px 6px' } },
      g.lang === 'all'
        ? h('div.row.spread', { style: { padding: '2px 0' } }, h('h3', LANG_NAME.all), h('span.small.faint', `${g.done}/${g.steps.length} việc`))
        : langMeter(g),
      stepList(g.steps, { next, onToggle: refresh }),
    ));
  }

  /* ---- lộ trình: đang ở chặng nào, sắp tới là gì ---- */
  const langs = plan.settings.langs || 'both';
  const paths = await Promise.all([langs !== 'zh' ? enPath() : null, langs !== 'en' ? zhPath() : null]);
  el.append(h('div.card',
    h('div.row.spread', h('h3', 'Lộ trình của bạn'), h('a.small.faint', { href: '#/start' }, 'Đổi lộ trình ›')),
    h('div.stack', { style: { marginTop: '8px' } }, ...paths.filter(Boolean).map((p) => pathCard(p))),
  ));

  el.append(await rankCard({ compact: true }));

  /* ---- thử thách 10 câu ---- */
  el.append(h('a.card.challenge-card', { href: '#/challenge' },
    h('span.hub-mark', '🎯'),
    h('div.grow', h('b', 'Thử thách hôm nay'),
      h('div.small.faint', ch ? `Đã làm: đúng ${ch.right}/${ch.n} câu. Làm lại để ôn thêm.` : '10 câu trắc nghiệm nhanh từ những từ đã học, 2–3 phút')),
    h('span.pill.jade', ch ? `${ch.right}/${ch.n}` : '10 câu ›'),
  ));

  /* ---- nhật ký ---- */
  el.append(journalCard(plan.day));

  return { title: 'Hôm nay', el };
}

/* 7 ô Thứ Hai → Chủ nhật của tuần này: ngày có học hiện ngọn lửa, hôm nay có viền */
const isActive = (d) => !!d && (Object.values(d.secs || {}).reduce((a, b) => a + b, 0) >= 60 || Object.values(d.steps || {}).some(Boolean));
function weekDots(days, now) {
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const todayK = store.dayKey(now);
  return h('div.week-dots', ...['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((l, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const k = store.dayKey(d);
    const on = isActive(days[k]);
    const cls = `${on ? '.on' : ''}${k === todayK ? '.today' : ''}${d > now && k !== todayK ? '.future' : ''}`;
    return h(`span.wd${cls}`, h('i', on ? { html: artSvg('fire', 18) } : null), h('small', l));
  }));
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
