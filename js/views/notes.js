/* Sổ ghi (từ ATLAS): dự án, tài sản và sổ tư duy. Không nằm trong lịch học hằng ngày,
   nhưng là nơi biến điều đã học thành việc làm thật. */

import * as store from '../store.js';
import { h, toast, section } from '../ui.js';

const STAGES = ['Quan sát', 'Kiểm chứng', 'Thử nghiệm', 'Có khách hàng', 'Đánh giá mở rộng'];
const blank = { projects: [], assets: [], debts: [], thoughts: [], forecasts: [] };

export async function render(route) {
  const tab = route.args[0] || 'projects';
  const notes = { ...blank, ...(await store.kvGet('notes', blank)) };
  const save = (fn) => store.kvUpdate('notes', blank, (n) => { const m = { ...blank, ...n }; fn(m); return m; });
  const reload = () => { location.hash = `#/notes/${tab}`; window.dispatchEvent(new HashChangeEvent('hashchange')); };

  const tabs = h('div.mode-seg.lang-seg',
    ...[['projects', 'Dự án'], ['assets', 'Tài sản'], ['thoughts', 'Sổ tư duy']].map(([id, label]) =>
      h('a', { class: id === tab ? 'on' : '', href: `#/notes/${id}` }, label)));

  const el = h('div.stack', tabs);
  if (tab === 'assets') el.append(...assets(notes, save, reload));
  else if (tab === 'thoughts') el.append(...thoughts(notes, save, reload));
  else el.append(...projects(notes, save, reload));
  return { title: 'Sổ ghi', el };
}

const field = (ph, type = 'text') => h('input.scribble.sm', { placeholder: ph, type });

function projects(notes, save, reload) {
  const name = field('Tên dự án hoặc ý tưởng');
  const next = field('Việc nhỏ nhất làm trong tuần này');
  return [
    h('div.card',
      h('h3', 'Dự án mới'), name, next,
      h('button.btn.block', {
        style: { marginTop: '8px' },
        onclick: async () => {
          if (!name.value.trim()) return toast('Đặt tên cho dự án đã.');
          await save((n) => n.projects.push({ id: Date.now(), name: name.value, next: next.value, stage: 0 }));
          reload();
        },
      }, '+ Thêm dự án'),
    ),
    ...notes.projects.map((p) => h('div.card',
      h('div.row.spread', h('b', p.name), h('span.level', STAGES[p.stage])),
      p.next ? h('p.small.muted', { style: { margin: '6px 0' } }, 'Việc tiếp theo: ', p.next) : null,
      h('div.row.wrap', { style: { gap: '6px' } },
        p.stage < STAGES.length - 1 ? h('button.btn.sm', {
          onclick: async () => { await save((n) => { n.projects.find((x) => x.id === p.id).stage++; }); reload(); },
        }, `Sang: ${STAGES[p.stage + 1]}`) : null,
        h('button.btn.sm.ghost', {
          onclick: async () => {
            if (!confirm(`Xoá dự án "${p.name}"?`)) return;
            await save((n) => { n.projects = n.projects.filter((x) => x.id !== p.id); });
            reload();
          },
        }, 'Xoá'),
      ),
    )),
  ];
}

const vnd = (v) => `${Math.round(v).toLocaleString('vi-VN')}đ`;

function assets(notes, save, reload) {
  const total = notes.assets.reduce((a, x) => a + x.amount, 0);
  const debt = notes.debts.reduce((a, x) => a + x.amount, 0);
  const name = field('Tên khoản');
  const amt = field('Số tiền (đồng)', 'number');
  const add = (kind) => h('button.btn.sm', {
    onclick: async () => {
      if (!name.value.trim() || !(Number(amt.value) > 0)) return toast('Nhập tên và số tiền.');
      await save((n) => n[kind].push({ id: Date.now(), name: name.value, amount: Number(amt.value) }));
      reload();
    },
  }, kind === 'assets' ? '+ Tài sản' : '+ Khoản nợ');

  const row = (x, kind) => h('div.num-row', h('span.grow', x.name), h('b', vnd(x.amount)),
    h('button.btn.sm.ghost', {
      'aria-label': 'Xoá',
      onclick: async () => { await save((n) => { n[kind] = n[kind].filter((y) => y.id !== x.id); }); reload(); },
    }, '✕'));

  /* Mô phỏng tích luỹ theo tháng */
  const init = field('Số tiền ban đầu', 'number');
  const monthly = field('Góp mỗi tháng', 'number');
  const rate = field('Lãi mỗi năm (%)', 'number');
  const years = field('Số năm', 'number');
  init.value = String(total || 0); monthly.value = '2000000'; rate.value = '6'; years.value = '10';
  const result = h('div.small.muted', { style: { marginTop: '8px' } });
  const sim = () => {
    const m = (Number(rate.value) || 0) / 1200, n = Math.max(0, Number(years.value) || 0) * 12;
    let v = Number(init.value) || 0;
    const put = (Number(monthly.value) || 0);
    for (let i = 0; i < n; i++) v = v * (1 + m) + put;
    const paid = (Number(init.value) || 0) + put * n;
    result.textContent = `Sau ${years.value} năm: khoảng ${vnd(v)}, trong đó tiền góp ${vnd(paid)}. Giả định lãi đều, chưa tính lạm phát và thuế.`;
  };
  for (const f of [init, monthly, rate, years]) f.addEventListener('input', sim);
  sim();

  return [
    h('div.card',
      h('div.small.faint', 'Tài sản ròng'), h('div.stat-num', vnd(total - debt)),
      h('div.small.muted', `Tài sản ${vnd(total)} · Nợ ${vnd(debt)}`),
    ),
    h('div.card', name, amt, h('div.btn-row', { style: { marginTop: '8px' } }, add('assets'), add('debts'))),
    notes.assets.length ? section('Tài sản', h('div.card', ...notes.assets.map((x) => row(x, 'assets')))) : null,
    notes.debts.length ? section('Khoản nợ', h('div.card', ...notes.debts.map((x) => row(x, 'debts')))) : null,
    section('Mô phỏng tích luỹ', h('div.card', init, monthly, rate, years, result)),
  ].filter(Boolean);
}

function thoughts(notes, save, reload) {
  const text = h('textarea.scribble.long', { placeholder: 'Một quyết định, một điều vừa hiểu ra, một câu hỏi…' });
  const claim = field('Dự đoán: điều gì sẽ xảy ra?');
  const prob = field('Bạn tin bao nhiêu % ?', 'number');
  const by = field('', 'date');
  return [
    h('div.card', h('h3', 'Ghi chép'), text,
      h('button.btn.block', {
        style: { marginTop: '8px' },
        onclick: async () => {
          if (!text.value.trim()) return;
          await save((n) => n.thoughts.unshift({ id: Date.now(), text: text.value }));
          reload();
        },
      }, 'Lưu ghi chép')),
    h('div.card', h('h3', 'Dự đoán để tự kiểm chứng'), claim, prob, by,
      h('button.btn.block', {
        style: { marginTop: '8px' },
        onclick: async () => {
          if (!claim.value.trim()) return;
          await save((n) => n.forecasts.unshift({ id: Date.now(), claim: claim.value, prob: Number(prob.value) || 50, by: by.value, outcome: null }));
          reload();
        },
      }, 'Lưu dự đoán')),
    ...notes.forecasts.map((f) => h('div.card',
      h('b', f.claim),
      h('div.small.muted', `${f.prob}%${f.by ? ` · đối chiếu ngày ${f.by}` : ''}${f.outcome ? ` · ${f.outcome === 'yes' ? 'Đã xảy ra' : 'Không xảy ra'}` : ''}`),
      f.outcome ? null : h('div.row', { style: { gap: '6px', marginTop: '6px' } },
        ...[['yes', 'Đã xảy ra'], ['no', 'Không xảy ra']].map(([v, label]) => h('button.btn.sm', {
          onclick: async () => { await save((n) => { n.forecasts.find((x) => x.id === f.id).outcome = v; }); reload(); },
        }, label))),
    )),
    ...notes.thoughts.map((t) => h('div.card', h('p', { style: { margin: 0, whiteSpace: 'pre-wrap' } }, t.text),
      h('div.small.faint', { style: { marginTop: '6px' } }, new Date(t.id).toLocaleDateString('vi-VN')))),
  ];
}
