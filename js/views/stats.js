/* Tiến độ: thời gian thật theo từng khối, từng ngôn ngữ, nhật ký và sao lưu. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as content from '../content.js';
import { summarize, TYPE_LABEL } from '../srs.js';
import { h, section, progressBar, todayKey, plural, toast } from '../ui.js';
import { rankCard, xpState, RANKS, emblem } from '../xp.js';
import { badgeShelf } from '../badges.js';
import { TRACK_LANG, LANG_NAME, minsByLang } from '../plan.js';

const TRACK_NAME = { reviewEn: 'Ôn thẻ', en: 'Học bài', read: 'Đọc truyện', work: 'Anh nghề', reviewZh: 'Ôn thẻ', zh: 'Học bài', readZh: 'Đọc truyện', review: 'Ôn thẻ chung', know: 'Kiến thức' };

export async function render() {
  const [cards, logs, idx, progress, scores, days, read, en, course] = await Promise.all([
    store.allCards(), store.allLogs(), data.curriculum(), store.lessonProgress(),
    store.kvGet('writeScores', {}), store.allDays(), store.readState(), store.enState(), content.course(),
  ]);

  const stat = summarize(cards);
  const enCards = cards.filter((c) => c.lang === 'en');
  const zhCards = cards.filter((c) => !c.lang || c.lang === 'zh');
  const el = h('div.stack');

  /* ---- rank và điểm thưởng ---- */
  const xp = await xpState();
  el.append(h('div.card',
    h('h3', 'Rank của bạn'),
    await rankCard(),
    h('div.rank-ladder', ...RANKS.map((r, i) => h('span.rank-step' + (xp.total >= r.min ? '.on' : ''), { style: { borderColor: r.color, color: xp.total >= r.min ? '#fff' : r.color, background: xp.total >= r.min ? r.color : 'transparent' } }, emblem({ ...r, i, tier: '' }, 22), r.name))),
    h('div.small.faint', { style: { marginTop: '8px' } }, 'Điểm đến từ: điểm danh, xong mục học, đọc chương truyện, ôn thẻ, qua bài phát âm. Gần đây:'),
    h('div.small', ...(xp.log || []).slice(0, 6).map((l) => h('div', `+${l.p} · ${l.r}`))),
  ));
  el.append(await badgeShelf());

  /* ---- các con số chính, chia theo ngôn ngữ ---- */
  const st = en.stage || 0;
  el.append(h('div.lang-stats',
    h('div.card',
      h('h3', 'Tiếng Anh'),
      h('div.grid.g2', { style: { marginTop: '8px' } },
        stat4('Từ đang học', enCards.filter((c) => c.type === 'en-recall').length),
        stat4('Thẻ đã thuộc', enCards.filter((c) => c.state === 'review' && c.ivl >= 21).length),
        stat4('Buổi xong', Object.values(en.sess?.[st] || {}).filter((x) => x.done).length),
        stat4(course.stages[st].name, course.stages[st].cefr),
      ),
    ),
    h('div.card',
      h('h3', 'Tiếng Trung'),
      h('div.grid.g2', { style: { marginTop: '8px' } },
        stat4('Từ đang học', zhCards.filter((c) => c.type === 'hanzi-vi').length),
        stat4('Thẻ đã thuộc', zhCards.filter((c) => c.state === 'review' && c.ivl >= 21).length),
        stat4('Bài xong', `${Object.values(progress).filter((p) => p?.done).length}/${idx.lessons.length}`),
        stat4('Chữ đã viết', Object.keys(scores).length),
      ),
    ),
  ));

  /* ---- thời gian 7 ngày ---- */
  const week = [];
  const d = new Date();
  for (let i = 6; i >= 0; i--) {
    const x = new Date(d); x.setDate(d.getDate() - i);
    const k = todayKey(x);
    const secs = days[k]?.secs || {};
    week.push({ k, label: `${x.getDate()}/${x.getMonth() + 1}`, secs, total: Object.values(secs).reduce((a, b) => a + b, 0) });
  }
  // Hai cột mỗi ngày: tiếng Anh và tiếng Trung tính riêng (việc chung như ôn thẻ trộn, kiến thức không vẽ cột)
  for (const w of week) w.by = minsByLang(w.secs);
  const maxMin = Math.max(30, ...week.flatMap((w) => [w.by.en, w.by.zh]));
  const bar = (m, cls) => h(`i.${cls}`, { style: { height: m ? `${Math.max(6, Math.round((m / maxMin) * 100))}%` : '0' } });
  const chart = h('div',
    h('div.week-legend.small', h('span', h('i.en'), 'Tiếng Anh'), h('span', h('i.zh'), 'Tiếng Trung')),
    h('div.week-chart', ...week.map((w) => h('div.week-col', { title: `${w.label}: tiếng Anh ${w.by.en} phút, tiếng Trung ${w.by.zh} phút` },
      h('div.week-num.small.faint', w.by.en || w.by.zh ? `${w.by.en} · ${w.by.zh}` : ''),
      h('div.week-bar.two', bar(w.by.en, 'en'), bar(w.by.zh, 'zh')),
      h('div.small.faint', w.label),
    ))));
  const weekSecs = {};
  for (const w of week) for (const [k, v] of Object.entries(w.secs)) weekSecs[k] = (weekSecs[k] || 0) + v;
  const totalWeek = Object.values(weekSecs).reduce((a, b) => a + b, 0);
  el.append(section('7 ngày gần nhất', h('div.card',
    chart,
    totalWeek ? h('div.week-split', ...['en', 'zh', 'all'].map((lg) => {
      const rows = Object.entries(weekSecs).filter(([k]) => (TRACK_LANG[k] || 'all') === lg).sort((a, b) => b[1] - a[1]);
      if (!rows.length) return null;
      const sum = rows.reduce((a, [, v]) => a + v, 0);
      return h('div',
        h('div.row.spread', { style: { marginTop: '12px' } }, h('b', LANG_NAME[lg]), h('span.small', `${Math.round(sum / 60)} phút trong 7 ngày`)),
        ...rows.map(([k, v]) => h('div', { style: { padding: '4px 0' } },
          h('div.row.spread', h('span.small', TRACK_NAME[k] || k), h('span.small.faint', `${Math.round(v / 60)} phút`)),
          h('div', { style: { marginTop: '3px' } }, progressBar(v / sum)),
        )));
    })) : h('p.small.faint', { style: { margin: '10px 0 0' } }, 'Thời gian chỉ tính khi app đang mở và bạn có thao tác trong 2 phút gần nhất.'),
  )));

  /* ---- đọc ---- */
  const chDone = Object.values(read.stories || {}).reduce((a, s) => a + Object.keys(s.ch || {}).length, 0);
  el.append(section('Đọc song ngữ', h('div.card', h('div.grid.g2',
    stat4('Chương đã đọc', chDone),
    stat4('Từ và chữ đã đọc', read.words || 0),
  ))));

  /* ---- bản đồ nhiệt 12 tuần ---- */
  const byDay = new Map();
  for (const l of logs) {
    const k = todayKey(new Date(l.at));
    byDay.set(k, (byDay.get(k) || 0) + 1);
  }
  const heat = h('div.heat');
  const span = 84;
  const hd = new Date();
  hd.setDate(hd.getDate() - span + 1);
  for (let i = 0; i < span; i++) {
    const k = todayKey(hd);
    const n = byDay.get(k) || 0;
    const lvl = n === 0 ? '' : n < 5 ? 'l1' : n < 15 ? 'l2' : n < 35 ? 'l3' : 'l4';
    heat.append(h(`i.${lvl || 'x'}`, { title: `${k}: ${plural(n, 'lượt')}` }));
    hd.setDate(hd.getDate() + 1);
  }
  el.append(section('12 tuần gần nhất', h('div.card',
    heat,
    h('p.small.faint', { style: { marginTop: '10px', marginBottom: 0 } },
      `${plural(byDay.size, 'ngày')} có ôn · ${plural(logs.length, 'lượt')} tổng cộng`),
  )));

  /* ---- theo kỹ năng ---- */
  if (cards.length) {
    const byType = h('div.card');
    for (const [type, label] of Object.entries(TYPE_LABEL)) {
      const sub = cards.filter((c) => c.type === type);
      if (!sub.length) continue;
      const mature = sub.filter((c) => c.state === 'review' && c.ivl >= 21).length;
      byType.append(h('div', { style: { padding: '9px 0' } },
        h('div.row.spread', h('span.small', label), h('span.small.faint', `${mature}/${sub.length}`)),
        h('div', { style: { marginTop: '5px' } }, progressBar(mature / sub.length)),
      ));
    }
    el.append(section(`Theo kỹ năng · ${stat.total} thẻ`, byType));
  }

  /* ---- chữ Hán cần luyện ---- */
  const scoreList = Object.entries(scores).sort((a, b) => a[1].best - b[1].best);
  const weak = scoreList.filter(([, s]) => s.best < 70).slice(0, 12);
  if (weak.length) {
    el.append(section('Chữ Hán cần luyện thêm', h('div.card',
      h('div.row.wrap', { style: { gap: '8px' } },
        ...weak.map(([ch, s]) => h('a.syl', {
          href: `#/write/${encodeURIComponent(ch)}`,
          style: { minWidth: '58px', minHeight: '58px', flexDirection: 'column' },
        }, h('span.cn', { style: { fontSize: '24px' } }, ch), h('small.faint', String(s.best)))),
      ),
      h('a.btn.sm.block', { style: { marginTop: '12px' }, href: `#/write/${encodeURIComponent(weak.map(([c]) => c).join(''))}` }, '✍️ Luyện lại các chữ này'),
    )));
  }

  /* ---- nhật ký ---- */
  const journal = Object.entries(days).filter(([, v]) => v.note || v.self).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 30);
  if (journal.length) {
    el.append(section('Nhật ký', h('div.card', ...journal.map(([k, v]) => h('div.journal-row',
      h('div.row.spread', h('b.small', k), v.self ? h('span.small.faint', `Hiểu ${v.self}/5`) : null),
      v.note ? h('div.small.muted', v.note) : null,
    )))));
  }

  /* ---- sao lưu ---- */
  const last = await store.kvGet('lastBackup');
  el.append(section('Sao lưu dữ liệu học',
    h('div.card',
      h('p.small.muted',
        'Toàn bộ tiến độ nằm trên chính máy này, không có máy chủ nào giữ hộ. Nên xuất file sao lưu mỗi tháng một lần. ',
        last ? `Lần gần nhất: ${last}.` : 'Bạn chưa sao lưu lần nào.'),
      h('div.btn-row',
        h('button.btn.sm', { onclick: doExport }, '⤓ Xuất file sao lưu'),
        h('label.btn.sm', { style: { cursor: 'pointer' } }, '⤒ Khôi phục hoặc nhập từ app cũ',
          h('input', { type: 'file', accept: 'application/json,.json', style: { display: 'none' }, onchange: doImport })),
      ),
      h('p.small.faint', { style: { margin: '10px 0 0' } }, 'Nhận được file sao lưu của Bút Hán, Inklish và ATLAS cũ. Song Ngữ và English Hub không có nút xuất file nên chưa chuyển được.'),
    )));

  return { title: 'Tiến độ', el };
}

function stat4(label, value) {
  return h('div', h('div.stat-num', String(value)), h('div.small.faint', label));
}

async function doExport() {
  const dump = await store.exportAll();
  const blob = new Blob([JSON.stringify(dump)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `atlas-saoluu-${todayKey()}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  toast('Đã tạo file sao lưu. Chọn "Lưu vào Tệp" để giữ trên iCloud.', 5000);
}

async function doImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const msg = await store.importAll(JSON.parse(await file.text()));
    toast(`${msg} Đang tải lại…`, 3000);
    setTimeout(() => location.reload(), 1600);
  } catch (err) {
    toast(`Không đọc được file: ${err.message}`, 5000);
  }
}
