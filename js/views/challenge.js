/* Thử thách hôm nay: 10 câu trắc nghiệm nhanh, trộn từ đã học của cả hai ngôn ngữ.

   Lấy từ trong thẻ ôn (đã có nghĩa). Chưa đủ thẻ thì lấy thêm từ bài tiếng Trung
   đang học. Kết quả lưu theo ngày để trang Hôm nay biết đã làm chưa. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { sayEn, shuffle } from '../kit.js';
import { h, pill, progressBar } from '../ui.js';

const N = 10;

async function pool() {
  const cards = await store.allCards();
  const seen = new Set();
  const words = [];
  for (const c of cards) {
    if ((c.lang !== 'en' && c.lang !== 'zh' && c.lang) || !c.vi) continue;
    const lang = c.lang === 'en' ? 'en' : 'zh';
    const key = `${lang}:${c.word}`;
    if (seen.has(key)) continue;
    seen.add(key);
    words.push({ lang, w: c.word, vi: c.vi, py: c.py || '', ipa: c.ipa || '' });
  }
  // Chưa đủ từ: lấy thêm từ bài tiếng Trung đang học và các bài trước đó
  if (words.length < 16) {
    const [idx, progress] = await Promise.all([data.curriculum(), store.lessonProgress()]);
    const upto = Math.max(0, idx.lessons.findIndex((l) => !progress[l.id]?.done));
    for (const meta of idx.lessons.slice(Math.max(0, upto - 2), upto + 1)) {
      const L = await data.lesson(meta.file);
      for (const w of L.words) {
        const key = `zh:${w.w}`;
        if (seen.has(key) || !w.vi) continue;
        seen.add(key);
        words.push({ lang: 'zh', w: w.w, vi: w.vi, py: w.py || '' });
      }
    }
  }
  return words;
}

function makeQuestions(words) {
  const qs = [];
  for (const it of shuffle(words).slice(0, N)) {
    const same = words.filter((x) => x.lang === it.lang && x.w !== it.w && x.vi !== it.vi);
    const wrong = shuffle(same).slice(0, 3);
    if (wrong.length < 3) continue;
    const reverse = Math.random() < 0.4; // 40% câu hỏi ngược: nghĩa → từ
    const opts = shuffle([it, ...wrong]);
    qs.push({ it, reverse, opts, a: opts.indexOf(it) });
  }
  return qs;
}

export async function render() {
  const words = await pool();
  const qs = makeQuestions(words);
  if (qs.length < 4) {
    return {
      title: 'Thử thách hôm nay',
      el: h('div.empty', 'Cần học thêm vài từ để có đủ câu hỏi. Vào một bài học và bấm thêm từ vào bộ ôn trước nhé.'),
    };
  }

  const settings = await store.settings();
  const say = (it) => (it.lang === 'en' ? sayEn(it.w) : audio.speak(it.w, { rate: settings.speechRate }));
  const S = { i: 0, right: 0, wrong: [] };
  const body = h('div');
  const el = h('div.stack', body);

  function show() {
    const q = qs[S.i];
    const { it } = q;
    let answered = false;
    const list = h('div.mcq');
    const note = h('div');
    const label = (o) => (q.reverse
      ? h('span', h(o.lang === 'zh' ? 'span.cn' : 'span', o.w), o.py ? h('span.py', { style: { marginLeft: '8px' } }, o.py) : null)
      : o.vi);
    q.opts.forEach((o, k) => {
      list.append(h('button.mcq-opt', {
        onclick: (e) => {
          if (answered) return;
          answered = true;
          list.children[q.a].classList.add('ok');
          if (k === q.a) S.right++;
          else { e.currentTarget.classList.add('no'); S.wrong.push(it); }
          if (!q.reverse) say(it);
          note.replaceChildren(h('button.btn.primary.block', { style: { marginTop: '12px' }, onclick: nextQ },
            S.i < qs.length - 1 ? 'Câu tiếp ›' : 'Xem kết quả'));
        },
      }, label(o)));
    });
    const prompt = q.reverse
      ? h('div.mcq-q', `“${it.vi}” là từ nào?`)
      : h('div.mcq-q', h(it.lang === 'zh' ? 'span.cn' : 'span', { style: { fontSize: '30px' } }, it.w),
        h('button.btn.sm.ghost', { style: { marginLeft: '10px' }, onclick: () => say(it) }, '🔊'),
        h('div.small.faint', 'Nghĩa là gì?'));
    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`Câu ${S.i + 1}/${qs.length}`, 'plain'), h('span.small.faint', it.lang === 'zh' ? 'Tiếng Trung' : 'Tiếng Anh')),
      h('div', { style: { margin: '10px 0' } }, progressBar(S.i / qs.length)),
      prompt, list, note,
    ));
    if (!q.reverse) setTimeout(() => say(it), 200);
  }

  function nextQ() {
    if (S.i < qs.length - 1) { S.i++; show(); return; }
    finish();
  }

  async function finish() {
    await store.kvUpdate('challenge', {}, (all) => {
      const k = store.dayKey();
      const prev = all[k];
      all[k] = { right: Math.max(prev?.right || 0, S.right), n: qs.length, tries: (prev?.tries || 0) + 1 };
      return all;
    });
    body.replaceChildren(h('div.card.center',
      h('div.score-big', `${S.right}/${qs.length}`),
      h('h3', S.right === qs.length ? 'Tuyệt đối!' : S.right >= qs.length * 0.7 ? 'Tốt lắm' : 'Ôn thêm chút nữa nhé'),
      S.wrong.length
        ? h('div', { style: { textAlign: 'left', marginTop: '12px' } },
          h('h4', 'Từ cần ôn lại'),
          ...S.wrong.map((it) => h('div', { style: { margin: '6px 0' } },
            h(it.lang === 'zh' ? 'b.cn' : 'b', it.w), it.py ? h('span.py', { style: { margin: '0 6px' } }, it.py) : ' ', '· ', it.vi)))
        : null,
      h('div.btn-row', { style: { marginTop: '16px' } },
        h('button.btn', { onclick: () => window.dispatchEvent(new HashChangeEvent('hashchange')) }, '↻ Làm lượt khác'),
        h('a.btn.primary', { href: '#/home' }, 'Về Hôm nay'),
      ),
    ));
  }

  show();
  return { title: 'Thử thách hôm nay', el };
}
