/* Kiến thức (từ ATLAS): tiền, tư duy, thế giới, công nghệ, kinh doanh… học bằng tiếng
   Anh song ngữ, câu hỏi của mỗi bài vào chung hàng ôn. */

import * as store from '../store.js';
import * as content from '../content.js';
import { pair, mcq, scribble } from '../kit.js';
import { h, toast, section, progressBar } from '../ui.js';

export async function render(route) {
  const k = await content.know();
  if (route.args[0]) return lesson(k, route.args[0]);
  return list(k);
}

async function list(k) {
  const st = await store.knowState();
  const el = h('div.stack');
  const doneN = Object.keys(st.done).length;
  el.append(h('div.card',
    h('div.row.spread', h('h3', 'Tiến độ'), h('span.small.faint', `${doneN}/${k.lessons.length} bài`)),
    h('div', { style: { marginTop: '8px' } }, progressBar(doneN / k.lessons.length)),
  ));
  for (const d of k.domains) {
    const items = k.lessons.filter((l) => l.domain === d.id);
    if (!items.length) continue;
    el.append(section(d.name,
      h('p.small.faint', { style: { marginTop: '-6px' } }, d.description),
      h('div.card', { style: { padding: '4px 14px' } }, ...items.map((l) => h(`a.lesson-item.${st.done[l.id] ? 'done' : 'x'}`, {
        href: `#/know/${l.id}`, style: { padding: '11px 0', borderBottom: '1px solid var(--line)' },
      },
        h('div.lesson-no', st.done[l.id] ? '✓' : '·'),
        h('div.grow', h('b', l.title), h('div.small.faint', l.summary)),
        h('span.faint', '›'),
      ))),
    ));
  }
  return { title: 'Kiến thức', el };
}

async function lesson(k, id) {
  const L = k.lessons.find((l) => l.id === id);
  if (!L) return { title: 'Kiến thức', el: h('div.empty', 'Không thấy bài này.') };
  const st = await store.knowState();
  const answer = scribble('Viết câu trả lời của bạn', { long: true });

  return {
    title: L.title,
    el: h('div.stack',
      h('div.card',
        h('div.small.faint', L.titleEn),
        h('h2', { style: { margin: '2px 0 4px' } }, L.title),
        h('p.muted', { style: { margin: 0 } }, L.summary),
      ),
      h('div.card', ...L.paras.map((p) => h('div.reader-para', ...p.map(([en, vi]) => pair(en, vi))))),
      h('div.note', h('b', 'Nói đơn giản: '), L.simple),
      h('div.note.jade', h('b', 'Ví dụ: '), L.example),
      L.vocab?.length ? section('Từ vựng trong bài', h('div.card', ...L.vocab.map((v) => (Array.isArray(v)
        ? pair(v[0], v[1])
        : pair(v.en || v.word || '', v.vi || v.meaning || ''))))) : null,
      section('Thử làm', h('div.card', h('p', L.task), answer)),
      section('Kiểm tra', h('div.card', mcq({ q: L.q.vi, opts: L.q.opts, a: L.q.a, why: L.q.why }))),
      L.source ? h('div.source', L.source) : null,
      h('button.btn.jade.block', {
        onclick: async () => {
          await store.updateKnow((s) => { s.done[id] = { at: Date.now(), answer: answer.value }; return s; });
          await store.addKnowCard(id);
          await store.markStep('know');
          toast(st.done[id] ? 'Đã lưu.' : 'Xong bài. Câu hỏi của bài sẽ quay lại trong phần ôn.');
          location.hash = '#/home';
        },
      }, '✓ Học xong bài này'),
    ),
  };
}
