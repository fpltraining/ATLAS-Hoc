/* Thi thử HSK 1–4 theo chuẩn 2025.

   #/exam        danh sách đề, điểm cao nhất từng đề
   #/exam/<id>   làm một đề: có giờ, nghe tối đa 2 lần, nộp bài, chấm theo phần, xem lại câu sai

   Đề sinh từ câu trong giáo trình bằng tools/build-exams.mjs. Đây là đề luyện mô phỏng
   dạng đề HSK, không phải đề chính thức. */

import * as store from '../store.js';
import * as audio from '../audio.js';
import { h, toast, pill, progressBar, section } from '../ui.js';

const getJSON = (url) => fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.json(); });
const PASS = 60;
const MAX_PLAYS = 2;

export async function render(route) {
  const id = route.args[0];
  return id ? runExam(id) : listExams();
}

/* ---------- danh sách đề ---------- */
async function listExams() {
  const [idx, results] = await Promise.all([getJSON('data/exams/index.json'), store.kvGet('examResults', {})]);
  const el = h('div.stack');
  el.append(h('div.card',
    h('h2', 'Thi thử HSK'),
    h('p.muted', 'Đề luyện theo dạng đề HSK chuẩn 2025, chỉ dùng từ trong giáo trình của từng cấp. Đạt từ 60 điểm là đủ sức đi thi cấp đó.'),
    h('p.small.faint', 'Đề do ConnectLife soạn để luyện tập, không phải đề thi chính thức.'),
  ));
  for (const level of [...new Set(idx.map((e) => e.level))]) {
    const list = h('div');
    for (const e of idx.filter((x) => x.level === level)) {
      const hist = results[e.id] || [];
      const best = hist.length ? Math.max(...hist.map((r) => r.score)) : null;
      list.append(h('a.lesson-item', { href: `#/exam/${e.id}`, style: { padding: '12px 0', borderBottom: '1px solid var(--line)' } },
        h('div.lesson-no', best === null ? '考' : String(best)),
        h('div.grow',
          h('b', e.title),
          h('div.small.faint', `${e.questions} câu · ${e.minutes} phút · ${e.sections.map(([n, k]) => `${n} ${k}`).join(' · ')}`),
        ),
        best === null ? null : pill(best >= PASS ? 'Đạt' : 'Chưa đạt', best >= PASS ? 'jade' : 'seal'),
      ));
    }
    el.append(section(`HSK ${level}`, h('div.card', list)));
  }
  return { title: 'Thi thử HSK', el };
}

/* ---------- làm bài ---------- */
async function runExam(id) {
  const exam = await getJSON(`data/exams/${id}.json`);
  const items = exam.sections.flatMap((s, si) => s.items.map((it) => ({ ...it, section: si })));
  const answers = new Array(items.length).fill(null);
  const plays = new Array(items.length).fill(0);
  let cur = 0, timer = 0, left = exam.minutes * 60, finished = false;

  const el = h('div.stack');
  const clock = h('b');
  const bar = h('div');
  const body = h('div');

  const intro = () => {
    el.replaceChildren(h('div.card',
      h('h2', exam.title),
      h('p.muted', `${items.length} câu · ${exam.minutes} phút`),
      h('ul.small', ...exam.sections.map((s) => h('li', `${s.name}: ${s.items.length} câu`))),
      h('p.small.faint', 'Phần nghe dùng giọng đọc tiếng Trung của máy, mỗi câu được nghe tối đa 2 lần. Nên đeo tai nghe.'),
      audio.hasVoice() ? null : h('div.note.seal', 'Máy chưa có giọng đọc tiếng Trung, phần nghe sẽ không phát được. Xem hướng dẫn cài giọng trong Cài đặt.'),
      h('button.btn.seal.block', { style: { marginTop: '12px' }, onclick: start }, 'Bắt đầu làm bài'),
    ));
  };

  const start = () => {
    audio.unlock();
    el.replaceChildren(h('div.card', h('div.row.spread', h('span.small.faint', exam.title), clock), bar), body);
    tick();
    timer = setInterval(tick, 1000);
    draw();
  };

  const tick = () => {
    left--;
    const m = Math.max(0, Math.floor(left / 60)), s = Math.max(0, left % 60);
    clock.textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`;
    if (left <= 0 && !finished) { toast('Hết giờ, bài đã được nộp.'); submit(); }
  };

  const play = (i) => {
    if (plays[i] >= MAX_PLAYS) return toast('Mỗi câu chỉ được nghe 2 lần.');
    plays[i]++;
    audio.speak(items[i].audio, { rate: items[i].t === 'listenWord' ? 0.8 : 0.9 });
    draw();
  };

  function draw() {
    const it = items[cur];
    const sec = exam.sections[it.section];
    const done = answers.filter((a) => a !== null).length;
    bar.replaceChildren(h('div.small.faint', { style: { margin: '6px 0' } }, `Câu ${cur + 1}/${items.length} · ${sec.name} · đã làm ${done}`), progressBar(done / items.length));

    const card = h('div.card');
    const listen = it.t.startsWith('listen');
    if (listen) {
      card.append(h('button.btn.block', { onclick: () => play(cur), disabled: plays[cur] >= MAX_PLAYS },
        plays[cur] ? `🔊 Nghe lại (${MAX_PLAYS - plays[cur]} lần)` : '🔊 Nghe'));
      card.append(h('p.small.faint', { style: { marginTop: '8px' } },
        it.t === 'listenWord' ? 'Nghe và chọn từ đúng.' : it.t === 'listenPick' ? 'Nghe và chọn câu bạn vừa nghe.' : 'Nghe và chọn nghĩa đúng của câu.'));
    } else if (it.t === 'fill') {
      card.append(h('p.small.faint', 'Chọn từ điền vào chỗ trống.'), h('div.cn', { style: { fontSize: '24px', margin: '10px 0' } }, it.q));
    } else if (it.t === 'readMean') {
      card.append(h('p.small.faint', 'Đọc câu và chọn nghĩa đúng.'), h('div.cn', { style: { fontSize: '24px', margin: '10px 0' } }, it.q));
    }

    if (it.t === 'order') {
      card.append(orderBox(cur));
    } else {
      const zhOpts = ['listenWord', 'listenPick', 'fill'].includes(it.t);
      const list = h('div.mcq');
      it.opts.forEach((o, k) => list.append(h(`button.mcq-opt${answers[cur] === k ? '.ok' : ''}${zhOpts ? '.cn' : ''}`, {
        style: zhOpts ? { fontSize: '20px' } : null,
        onclick: () => { answers[cur] = k; draw(); },
      }, o)));
      card.append(list);
    }

    card.append(h('div.btn-row', { style: { marginTop: '14px' } },
      h('button.btn.ghost', { disabled: cur === 0, onclick: () => { cur--; draw(); } }, '‹ Câu trước'),
      cur < items.length - 1
        ? h('button.btn', { onclick: () => { cur++; draw(); } }, 'Câu sau ›')
        : h('button.btn.seal', { onclick: confirmSubmit }, 'Nộp bài'),
    ));
    card.append(h('button.btn.ghost.block.small', { style: { marginTop: '8px' }, onclick: confirmSubmit }, 'Nộp bài sớm'));
    body.replaceChildren(card);
  }

  /* Sắp xếp câu: chạm mảnh để ghép, chạm mảnh đã ghép để gỡ ra */
  function orderBox(i) {
    const it = items[i];
    const chosen = answers[i] || [];
    const built = h('div.cn', { style: { minHeight: '44px', fontSize: '22px', padding: '10px', border: '1px dashed var(--line)', borderRadius: '10px' } },
      ...chosen.map((k, pos) => h('button.btn.sm', { style: { margin: '3px' }, onclick: () => { chosen.splice(pos, 1); answers[i] = chosen.length ? chosen : null; draw(); } }, it.chunks[k])),
      chosen.length === it.chunks.length ? it.end : '',
    );
    const rest = h('div', { style: { marginTop: '10px' } },
      ...it.chunks.map((c, k) => (chosen.includes(k) ? null : h('button.btn.cn', { style: { margin: '4px', fontSize: '20px' }, onclick: () => { answers[i] = [...chosen, k]; draw(); } }, c))));
    return h('div', h('p.small.faint', 'Chạm các mảnh theo đúng thứ tự để thành câu.'), built, rest);
  }

  const isRight = (i) => {
    const it = items[i], a = answers[i];
    if (a === null) return false;
    if (it.t === 'order') return a.length === it.chunks.length && a.map((k) => it.chunks[k]).join('') === it.answer.join('');
    return a === it.a;
  };

  function confirmSubmit() {
    const blank = answers.filter((a) => a === null).length;
    if (blank && !confirm(`Còn ${blank} câu chưa làm. Nộp bài luôn?`)) return;
    submit();
  }

  async function submit() {
    if (finished) return;
    finished = true;
    clearInterval(timer);
    audio.stop();
    const secScores = exam.sections.map((s, si) => {
      const idxs = items.map((it, i) => i).filter((i) => items[i].section === si);
      const right = idxs.filter(isRight).length;
      return { name: s.name, right, total: idxs.length };
    });
    const right = secScores.reduce((s, x) => s + x.right, 0);
    const score = Math.round((right / items.length) * 100);
    await store.kvUpdate('examResults', {}, (r) => {
      (r[exam.id] = r[exam.id] || []).push({ at: Date.now(), score, sections: secScores, used: exam.minutes * 60 - Math.max(0, left) });
      return r;
    });
    showResult(score, secScores);
  }

  function showResult(score, secScores) {
    const pass = score >= PASS;
    const wrong = items.map((it, i) => i).filter((i) => !isRight(i));
    el.replaceChildren(
      h('div.card',
        h('div.small.faint', exam.title),
        h('h1', `${score} điểm`),
        pill(pass ? 'Đạt (từ 60 điểm)' : 'Chưa đạt (cần 60 điểm)', pass ? 'jade' : 'seal'),
        h('div', { style: { marginTop: '12px' } }, ...secScores.map((s) => h('div.row.spread', h('span', s.name), h('b', `${s.right}/${s.total}`)))),
        h('p.small.muted', { style: { marginTop: '10px' } }, weakNote(secScores)),
        h('div.btn-row', { style: { marginTop: '12px' } },
          h('a.btn', { href: '#/exam' }, 'Danh sách đề'),
          h('button.btn.ghost', { onclick: () => location.reload() }, 'Làm lại'),
        ),
      ),
      wrong.length ? section(`Xem lại ${wrong.length} câu sai`, h('div.stack', ...wrong.map(review))) : h('div.note.jade', 'Đúng hết. Tuyệt vời!'),
    );
  }

  function review(i) {
    const it = items[i];
    const yours = answers[i] === null ? 'Chưa trả lời'
      : it.t === 'order' ? answers[i].map((k) => it.chunks[k]).join(' ') : it.opts[answers[i]];
    const right = it.t === 'order' ? it.answer.join(' ') + it.end : it.opts[it.a];
    const cn = it.cn || it.audio || it.q;
    return h('div.card',
      h('div.small.faint', `Câu ${i + 1} · ${exam.sections[it.section].name}`),
      h('div', h('span.small.faint', 'Bạn chọn: '), yours),
      h('div', h('span.small.faint', 'Đáp án: '), h('b', right)),
      h('div.cn', { style: { marginTop: '8px', fontSize: '20px' } }, cn),
      it.py ? h('div.small', { style: { color: 'var(--jade)' } }, it.py) : null,
      it.vi ? h('div.small.muted', it.vi) : null,
      h('button.btn.sm.ghost', { style: { marginTop: '6px' }, onclick: () => audio.speak(it.cn || it.audio || it.q.replace('（　　）', '')) }, '🔊 Nghe'),
    );
  }

  const weakNote = (secs) => {
    const weak = secs.filter((s) => s.right / s.total < 0.6).map((s) => s.name.toLowerCase());
    if (!weak.length) return 'Các phần đều ổn. Thử đề tiếp theo hoặc lên cấp trên.';
    return `Cần luyện thêm phần ${weak.join(', ')}. Ôn lại các bài cùng cấp rồi làm lại đề này.`;
  };

  intro();
  return { title: exam.title, el, cleanup: () => { clearInterval(timer); audio.stop(); } };
}
