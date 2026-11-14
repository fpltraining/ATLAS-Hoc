/* Mục Tiếng Anh: bài đang học, truyện, viết bằng bút, ôn thẻ, rồi lộ trình 5 chặng.

   Nội dung và các chặng lấy từ Inklish. Từ mới học qua bảng viết bằng Apple Pencil,
   mỗi ngày có hạn mức để phần ôn không bị ngập.
*/

import * as store from '../store.js';
import * as content from '../content.js';
import { curSession, enBlocks, enTitle, weekOf, quotaToday, dayType } from '../plan.js';
import { InkPad } from '../pen/inkpad.js';
import { sayEn, sayBtn, pair, wordy, scribble, diff, micCheck, hasMic } from '../kit.js';
import { wordPic, sentencePics } from '../pics.js';
import { h, toast, section, progressBar, pill } from '../ui.js';
import { gradeButton, aiConfig } from '../ai.js';
import { cardSummary } from '../progress.js';
import { award } from '../xp.js';

export async function render(route) {
  const sub = route.args[0];
  if (sub === 'session') return session();
  if (sub === 'do') return activity(route.args[1]);
  if (sub === 'placement') return placement();
  return hub();
}

/* ---------- trang mục ------------------------------------------------------ */

async function hub() {
  const [en, course, read, cards, stories] = await Promise.all([
    store.enState(), content.course(), store.readState(), store.allCards(), content.storyIndex(),
  ]);
  const st = en.stage || 0;
  const n = curSession(en, course);
  const stage = course.stages[st];
  const doneHere = Object.values(en.sess?.[st] || {}).filter((x) => x.done).length;
  const now = Date.now();
  const enCards = cards.filter((c) => c.lang === 'en');
  const due = enCards.filter((c) => c.due <= now).length;
  const enStories = stories.filter((s) => s.lang === 'en');
  const nx = content.nextReading(enStories, read);

  const el = h('div.stack');
  el.append(h('div.card.today-hero',
    h('div.small.hero-sub', `${stage.name} · ${stage.cefr} · buổi ${n}/${stage.total}`),
    h('h1.today-title', enTitle(st, n, course)),
    h('div', { style: { marginTop: '12px' } }, progressBar(doneHere / stage.total)),
    stage.ready === false ? h('div.note.seal', { style: { marginTop: '10px' } }, stage.note) : null,
    h('a.btn.seal.block', { href: '#/en/session', style: { marginTop: '14px' } }, doneHere || enCards.length ? 'Học tiếp ›' : 'Bắt đầu ›'),
    !en.placed && !doneHere ? h('a.small', { href: '#/en/placement', style: { display: 'block', textAlign: 'center', marginTop: '10px', color: '#fff', opacity: 0.85, textDecoration: 'underline' } }, 'Chưa biết bắt đầu từ đâu? Làm bài xếp lớp (10 phút)') : null,
  ));

  el.append(h('div.hub-grid',
    tile('#/read/en', '❡', 'Đọc truyện', nx ? nx.story.title : `${enStories.length} bài`),
    tile('#/penen', '✎', 'Viết bằng bút', 'Đồ, chép, viết trí nhớ'),
    tile('#/review?lang=en', '↻', 'Ôn thẻ', due ? `${due} thẻ tới hạn` : 'Chưa có thẻ tới hạn'),
    tile('#/pron/en', 'ə', 'Phát âm cho người Việt', '8 bài · bảng 44 âm IPA'),
    tile('#/speak', '🗣', 'Luyện phát âm', 'Nói vào micro, máy chấm điểm'),
    tile('#/work', '★', 'Tiếng Anh nghề', 'Bán hàng, huấn luyện, TikTok'),
    tile('#/book', '¶', 'Sổ tay ngữ pháp', 'B1 đến B2, có bài tập'),
    tile('#/lib/irreg', 'V', 'Động từ bất quy tắc', 'Theo nhóm dễ nhớ'),
    tile('#/lib/sentences', '“', 'Câu mẫu', 'Luyện nghe và viết'),
    tile('#/en/placement', '?', 'Kiểm tra xếp lớp', en.placed ? `Lần trước: ${en.placed.level}` : '36 câu, gợi ý chặng phù hợp'),
  ));

  if (enCards.length) el.append(cardSummary(enCards, '#/review?lang=en', 'Thẻ ôn tiếng Anh'));

  /* ---- lộ trình các chặng ---- */
  const path = h('div.stack');
  course.stages.forEach((s, i) => {
    const done = Object.values(en.sess?.[i] || {}).filter((x) => x.done).length;
    path.append(h(`div.stage${i === st ? '.now' : ''}`,
      h('div.row.spread', h('b', `${s.name}: ${s.sub}`), h('span.level', s.cefr)),
      s.ready === false ? pill('Đang soạn', 'seal') : null,
      s.note ? h('div.small.muted', { style: { margin: '4px 0' } }, s.note) : null,
      h('div.small.faint', `${done}/${s.total} buổi`),
      h('div', { style: { margin: '6px 0' } }, progressBar(done / s.total)),
      h('div.small.muted', 'Điều kiện qua chặng: ', s.gate),
      i !== st ? h('button.btn.sm.ghost', {
        style: { marginTop: '8px' },
        onclick: async () => {
          await store.updateEn((e) => { e.stage = i; return e; });
          toast(`Đã chuyển sang ${s.name}.`);
          location.hash = '#/en/session';
        },
      }, i > st ? 'Tôi đã đạt điều kiện, sang chặng này' : 'Quay lại chặng này') : null,
    ));
  });
  el.append(section('Lộ trình tiếng Anh', path));

  return { title: 'Tiếng Anh', el };
}

function tile(href, mark, title, sub) {
  return h('a.hub-tile', { href },
    h('span.hub-mark', mark),
    h('span.grow', h('b', title), h('span.small.faint.block', sub)),
    h('span.faint', '›'),
  );
}

/* ---------- một buổi học ------------------------------------------------------ */

async function session() {
  const [en, course, day, settings] = await Promise.all([store.enState(), content.course(), store.today(), store.settings()]);
  const st = en.stage || 0;
  const n = curSession(en, course);
  const m = en.sess?.[st]?.[n] || { blocks: {} };
  const blocks = enBlocks(st, n, course);
  const secs = day.secs?.en || 0;

  const el = h('div.stack');
  el.append(h('div.card',
    h('div.small.faint', `${course.stages[st].name} · buổi ${n}/${course.stages[st].total}`),
    h('h2', { style: { margin: '2px 0 4px' } }, enTitle(st, n, course)),
    h('p.small.muted', { style: { margin: 0 } },
      `Hôm nay đã học ${Math.round(secs / 60)} phút tiếng Anh. Làm lần lượt từ trên xuống; hết giờ thì mai làm tiếp, buổi học tự nhớ chỗ dừng.`),
  ));

  const list = h('div.plan-list');
  const nextKey = blocks.find((b) => !m.blocks?.[b.key])?.key;
  for (const b of blocks) {
    const done = !!m.blocks?.[b.key];
    list.append(h(`a.today-step${done ? '.done' : ''}${b.key === nextKey ? '.next' : ''}`, { href: `#/en/do/${b.key}` },
      h('span.tick', done ? '✓' : ''),
      h('span.grow', h('div.row.spread', h('b', b.label), h('span.plan-time', `${b.min}′`))),
      h('span.faint', '›'),
    ));
  }
  el.append(h('div.card', { style: { padding: '6px 14px' } }, list));

  el.append(h('button.btn.jade.block', {
    onclick: async () => {
      await store.markStep('en');
      toast('Đã xong phần tiếng Anh hôm nay.');
      location.hash = '#/home';
    },
  }, '✓ Xong phần tiếng Anh hôm nay'));

  return { title: `Buổi ${n}`, el };
}

async function finishBlock(key) {
  award(10, 'Xong một mục tiếng Anh');
  const course = await content.course();
  const out = await store.updateEn((e) => {
    const st = e.stage || 0;
    const n = curSession(e, course);
    e.sess = e.sess || {};
    e.sess[st] = e.sess[st] || {};
    const s = e.sess[st][n] || (e.sess[st][n] = { blocks: {} });
    s.blocks = s.blocks || {};
    s.blocks[key] = true;
    if (enBlocks(st, n, course).every((b) => s.blocks[b.key])) { s.done = true; s.doneAt = store.dayKey(); }
    return e;
  });
  const st = out.stage || 0;
  const finished = Object.values(out.sess[st]).filter((x) => x.done).length;
  toast(finished ? `Xong mục này. Đã hoàn thành ${finished} buổi của chặng.` : 'Xong mục này.');
  location.hash = '#/en/session';
}

const doneBtn = (key, label = '✓ Xong mục này') => h('button.btn.jade.block', { style: { marginTop: '14px' }, onclick: () => finishBlock(key) }, label);

/* ---------- từng mục trong buổi --------------------------------------------- */

async function activity(key) {
  const [en, course] = await Promise.all([store.enState(), content.course()]);
  const st = en.stage || 0;
  const n = curSession(en, course);
  const i = n - 1;
  const w = st === 1 ? weekOf(n, course) : null;
  const level = (course.stages[st] || {}).cefr || '';

  switch (key) {
    case 'sound': return soundBlock(course.sounds[i % 12]);
    case 'core': return wordsBlock(key, course.core[i] || course.core.at(-1), st, n);
    case 'vocab': return wordsBlock(key, w.words.slice(((n - 1) % 7) * 9, ((n - 1) % 7) * 9 + 9), st, n);
    case 'vocab2': {
      // Chặng 2: mỗi buổi 10 từ B1–B2 theo thứ tự trong danh sách
      const list = course.vocabB2 || [];
      const from = Math.min(i * 10, Math.max(0, list.length - 10));
      return wordsBlock(key, list.slice(from, from + 10), st, n);
    }
    case 'gram': return gramBlock(key, course.gram[i] || course.gram.at(-1));
    case 'gram2': return gramBlock(key, course.gramB2[i % course.gramB2.length]);
    case 'gram3': return gramBlock(key, course.gramC1[i % course.gramC1.length]);
    case 'speak': return speakBlock(key, st === 0
      ? (course.phr[i] || course.phr[0]).map(([a, b]) => [a, b])
      : (course.sent[w.n] || course.sent[1]).map((s) => [s.en, s.vi]));
    case 'dict': return dictBlock(key, course.a1sent.slice((i * 5) % Math.max(1, course.a1sent.length - 5), (i * 5) % Math.max(1, course.a1sent.length - 5) + 5));
    case 'book': return bookBlock(key, w);
    case 'write': return writeBlock(key, {
      title: `Tóm tắt chương ${w.n} của truyện The Slow Message bằng 5 câu tiếng Anh.`,
      hint: course.gist[w.n] ? `Gợi nhớ: ${course.gist[w.n]}` : '', min: 50, level,
    });
    case 'write3': {
      const t = course.writeTasks[i % course.writeTasks.length];
      return writeBlock(key, { title: t.t, hint: (t.struct || []).join(' · '), min: t.w, tag: t.g, level });
    }
    case 'vocab3': {
      // Chặng 3: mỗi buổi 6 từ B2–C1
      const list = course.vocabC1 || [];
      const from = Math.min(i * 6, Math.max(0, list.length - 6));
      return wordsBlock(key, list.slice(from, from + 6), st, n);
    }
    case 'orig': return origBlock(key);
    case 'idiom': {
      // Chặng 4: mỗi buổi 3 thành ngữ, cụm nói tự nhiên C1
      const list = course.idiomC1 || [];
      const from = Math.min(i * 3, Math.max(0, list.length - 3));
      return wordsBlock(key, list.slice(from, from + 3), st, n);
    }
    case 'talk': {
      const t = course.talk4[i % course.talk4.length];
      return retellBlock(key, { t: t.t, hint: [t.vi, '', ...t.struct].join('\n'), sec: 300 }, level);
    }
    case 'write4': {
      const t = course.writeTasks4[i % course.writeTasks4.length];
      return writeBlock(key, { title: t.t, hint: [...t.struct, '', 'Tự soát: ' + (t.check || []).join(' · ')].join('\n'), min: t.w, tag: t.g, level });
    }
    case 'coll3': {
      const th = course.colloc3[i % course.colloc3.length];
      const k = Math.floor(i / course.colloc3.length) % 3;
      return collBlock(key, th.t, th.v.slice(k * 5, k * 5 + 5));
    }
    case 'debate': return debateBlock(key, course.debate3[i % course.debate3.length], level);
    case 'write3b': {
      const t = course.writeTasks3[i % course.writeTasks3.length];
      return writeBlock(key, { title: t.t, hint: [...(t.struct || []), '', 'Tự soát: ' + (t.check || []).join(' · ')].join('\n'), min: t.w, tag: t.g, level });
    }
    case 'coll': {
      const th = course.colloc[i % course.colloc.length];
      const k = Math.floor(i / course.colloc.length) % 3;
      return collBlock(key, th.t, th.v.slice(k * 5, k * 5 + 5));
    }
    case 'shadow': {
      const s = course.shadow[i % course.shadow.length];
      return speakBlock(key, s.v.map((x) => [x, '']), s.t);
    }
    case 'retell': return retellBlock(key, course.speakTasks[i % course.speakTasks.length], level);
    default:
      return { title: 'Tiếng Anh', el: h('div.empty', h('p', 'Mục này chưa mở được.'), h('a.btn', { href: '#/en/session' }, 'Về buổi học')) };
  }
}

/* ---- luyện âm ---- */
function soundBlock(s) {
  const pairs = h('div.card');
  for (const [a, b] of s.pairs) {
    pairs.append(h('div.sound-pair',
      h('button.btn', { onclick: () => sayEn(a) }, '🔊 ', a),
      h('button.btn', { onclick: () => sayEn(b) }, '🔊 ', b),
    ));
  }
  return {
    title: 'Luyện âm',
    el: h('div.stack',
      h('a.note.amber', { href: '#/pron/en', style: { display: 'block', textDecoration: 'none', color: 'inherit' } },
        h('b', 'Học sâu hơn: '), 'khoá "Phát âm tiếng Anh cho người Việt" có sơ đồ miệng, luyện nghe cặp từ và kiểm tra 8/10 ›'),
      h('div.card', h('h2', s.title),
        h('p', h('b', 'Vì sao quan trọng: '), s.why),
        h('p', { style: { marginBottom: 0 } }, h('b', 'Cách làm: '), s.how)),
      h('p.small.faint', 'Nghe từng cặp ba lần, rồi tự đọc to.'),
      pairs,
      hasMic ? h('div.card', h('p.small.muted', 'Đọc từ bất kỳ để máy nghe thử. Đây là máy nhận dạng từ, không phải chấm phát âm.'), micCheck(s.pairs[0][1])) : null,
      doneBtn('sound'),
    ),
  };
}

/* ---- từ mới: nghe, xem nghĩa, đồ bằng bút ---- */
async function wordsBlock(key, words, st, n) {
  const [en, day, settings, cards, rows] = await Promise.all([
    store.enState(), store.today(), store.settings(), store.allCards(), content.bankRows(),
  ]);
  const have = new Set(cards.filter((c) => c.type === 'en-recall').map((c) => String(c.word).toLowerCase()));
  const todo = words.filter(([w]) => !have.has(w.toLowerCase()));
  const due = cards.filter((c) => c.due <= Date.now()).length;
  const quota = quotaToday(settings.dailyMinutes || 120, dayType(settings), due);
  let room = Math.max(0, quota.en - (day.newEn || 0));

  if (!todo.length) {
    return { title: 'Từ mới', el: h('div.stack', h('div.note.jade', 'Bạn đã có đủ từ của buổi này trong bộ ôn.'), doneBtn(key)) };
  }

  const bank = new Map(rows.map((r) => [r[0].toLowerCase(), r]));
  const el = h('div.stack');
  let pad = null;
  let i = 0;
  let pass = [];

  const startBatch = () => { pass = todo.slice(0, room); i = 0; drawWord(); };

  function stopScreen() {
    pad?.destroy();
    el.replaceChildren(h('div.card',
      h('h2', 'Hạn mức từ mới hôm nay đã đủ'),
      h('p.muted', quota.reason || `Mỗi ngày tối đa ${quota.en} từ để phần ôn không bị ngập. Còn ${todo.length} từ của buổi này sẽ học tiếp vào ngày mai.`),
      h('div.btn-row',
        h('a.btn.primary', { href: '#/en/session' }, 'Về buổi học'),
        h('button.btn.ghost', { onclick: () => { room = 5; startBatch(); } }, 'Vẫn học thêm 5 từ'),
      ),
    ));
  }

  function drawWord() {
    pad?.destroy();
    if (i >= pass.length) return batchDone();
    const [w, vi] = pass[i];
    const r = bank.get(w.toLowerCase()) || [];
    const padHost = h('div');
    const hint = h('div.small.faint', { style: { minHeight: '22px' } });
    el.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${i + 1} / ${pass.length}`, 'plain'), sayBtn(w)),
      h('div.row', { style: { gap: '16px', alignItems: 'center', marginTop: '10px' } },
        wordPic(w, { size: 84 }),
        h('div.grow',
          h('div.word-big', w),
          r[1] ? h('div.faint', r[1]) : null,
          h('div.word-mean', vi),
        ),
      ),
      r[4] ? h('div.pair', { style: { marginTop: '6px' } },
        h('div.grow', h('div.pair-en', wordy(r[4])), r[5] && h('div.pair-vi', r[5]), sentencePics(r[4], { skip: w })),
        h('div.pair-act', sayBtn(r[4]))) : null,
      h('div.small.faint', { style: { margin: '10px 0 6px' } }, 'Đồ theo chữ mờ bằng Apple Pencil:'),
      padHost, hint,
      h('div.btn-row', { style: { marginTop: '10px' } },
        h('button.btn.sm', { onclick: () => pad.undo() }, '↶ Xoá nét'),
        h('button.btn.sm', { onclick: () => { pad.clear(); hint.textContent = ''; } }, '✕ Viết lại'),
        h('button.btn.sm', {
          onclick: () => {
            if (!pad.hasInk()) { hint.textContent = 'Viết lên bảng trước đã.'; return; }
            hint.textContent = `Độ phủ nét: ${pad.traceScore()}/100`;
          },
        }, 'Chấm nét'),
      ),
      h('button.btn.primary.block', {
        style: { marginTop: '10px' },
        onclick: async () => {
          await store.addEnWord(w, { vi, ipa: r[1], ex: r[4], exVi: r[5], source: `en-${st}-${n}` });
          await store.patchToday((d) => { d.newEn = (d.newEn || 0) + 1; });
          i++;
          drawWord();
        },
      }, i < pass.length - 1 ? 'Từ tiếp ›' : 'Xong'),
    ));
    pad = new InkPad(padHost, { penOnly: settings.penOnly });
    requestAnimationFrame(() => pad.setWord(w, { ghost: true }));
    sayEn(w);
  }

  async function batchDone() {
    pad?.destroy();
    const left = todo.length - pass.length;
    if (left <= 0) { await finishBlock(key); return; }
    room = 0;
    todo.splice(0, pass.length);
    stopScreen();
  }

  if (room <= 0) stopScreen(); else startBatch();
  return { title: 'Từ mới', el, cleanup: () => pad?.destroy() };
}

/* ---- ngữ pháp ---- */
function gramBlock(key, g) {
  const own = scribble('Tự đặt một câu theo mẫu này, viết bằng bút vào đây');
  return {
    title: 'Ngữ pháp',
    el: h('div.stack',
      h('div.card', h('h2', g.t), h('p', { style: { whiteSpace: 'pre-wrap' } }, g.b)),
      h('div.card', ...(g.ex || []).map((x) => pair(x, ''))),
      h('div.card', h('h3', { style: { marginBottom: '8px' } }, 'Đến lượt bạn'), own),
      doneBtn(key),
    ),
  };
}

/* ---- nghe và nói theo ---- */
function speakBlock(key, rows, heading) {
  const list = h('div.card');
  for (const [a, b] of rows) {
    list.append(pair(a, b));
    const mic = micCheck(a);
    if (mic) list.append(mic);
  }
  return {
    title: 'Luyện nói',
    el: h('div.stack',
      heading ? h('h2', heading) : null,
      h('p.small.faint', 'Nghe rồi nói theo ngay, đừng đợi nghe xong mới nghĩ. Chạm vào từ để tra nghĩa.'),
      list, doneBtn(key),
    ),
  };
}

/* ---- chính tả: nghe rồi viết bằng bút ---- */
function dictBlock(key, sentences) {
  const el = h('div.stack');
  let i = 0, right = 0;
  function draw() {
    if (i >= sentences.length) {
      el.replaceChildren(h('div.card.center',
        h('h2', 'Xong chính tả'), h('div.score-big', `${right}/${sentences.length}`),
        h('p.muted', 'câu viết đúng hoàn toàn')), doneBtn(key));
      return;
    }
    const s = sentences[i];
    const result = h('div');
    const input = scribble('Viết câu vừa nghe bằng Apple Pencil', { onEnter: check });
    function check() {
      const d = diff(s, input.value);
      if (d.ok) right++;
      result.replaceChildren(h('div.note', { style: { marginTop: '10px' } },
        h('b', d.ok ? 'Đúng hoàn toàn. ' : `Khớp ${d.score}%. `), d.el),
        h('button.btn.primary.block', { style: { marginTop: '10px' }, onclick: () => { i++; draw(); } }, 'Câu tiếp ›'));
    }
    el.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${i + 1} / ${sentences.length}`, 'plain'),
        h('button.btn.jade', { onclick: () => sayEn(s) }, '🔊 Nghe lại')),
      h('div', { style: { marginTop: '12px' } }, input),
      h('p.small.faint', { style: { marginTop: '6px' } }, 'iPad tự đổi chữ viết tay thành chữ gõ trong ô này. Xanh là đúng, đỏ là thiếu, cam là thừa.'),
      h('button.btn.block', { onclick: check }, 'Kiểm tra'),
      result,
    ));
    setTimeout(() => sayEn(s), 200);
  }
  draw();
  return { title: 'Chính tả', el };
}

/* ---- bài học của tuần ---- */
function bookBlock(key, w) {
  return {
    title: w.title,
    el: h('div.stack',
      h('div.card',
        h('div.small.faint', `Tuần ${w.n}`),
        h('h2', w.title),
        h('p.muted', w.aim),
        h('h3', w.lesson.h),
        h('p', { style: { whiteSpace: 'pre-wrap' } }, w.lesson.b),
        w.lesson.say ? pair(w.lesson.say, '') : null,
      ),
      h('a.btn.block', { href: '#/book' }, 'Mở sổ tay ngữ pháp để làm bài tập'),
      doneBtn(key),
    ),
  };
}

/* ---- viết đoạn ---- */
function writeBlock(key, t) {
  const box = scribble('Viết bằng Apple Pencil hoặc gõ vào đây', { long: true });
  const count = h('span.small.faint', '0 từ');
  box.style.minHeight = '220px';
  let lastFeedback = null;
  box.addEventListener('input', () => { count.textContent = `${(box.value.match(/\S+/g) || []).length} từ`; });
  return {
    title: 'Viết',
    el: h('div.stack',
      h('div.card',
        t.tag ? h('div.small.faint', t.tag) : null,
        h('h3', t.title),
        t.hint ? h('p.small.muted', { style: { marginTop: '6px', whiteSpace: 'pre-wrap' } }, t.hint) : null,
        h('p.small.faint', `Mục tiêu khoảng ${t.min} từ.`),
        box, count,
      ),
      gradeButton(() => ((box.value.match(/\S+/g) || []).length < 5
        ? 'Viết ít nhất vài câu rồi hãy chấm.'
        : { kind: 'write', task: t.title, text: box.value, level: t.level, minWords: t.min }),
      (r) => { lastFeedback = r; }),
      h('button.btn.jade.block', {
        onclick: async () => {
          if ((box.value.match(/\S+/g) || []).length < 3) return toast('Viết thêm vài từ đã nhé.');
          await store.kvUpdate('writes', [], (all) => {
            all.push({ at: Date.now(), task: t.title, text: box.value, ai: lastFeedback || undefined });
            return all;
          });
          await finishBlock(key);
        },
      }, '✓ Lưu bài viết'),
    ),
  };
}

/* ---- cụm từ cố định ---- */
function collBlock(key, title, rows) {
  const list = h('div.card');
  for (const [a, b] of rows) {
    list.append(pair(a, b, {
      actions: [h('button.btn.sm.ghost', {
        onclick: async (e) => {
          await store.addEnWord(a, { vi: b, source: 'colloc' });
          e.currentTarget.textContent = '✓';
        },
      }, '+')],
    }));
  }
  return { title: 'Cụm từ cố định', el: h('div.stack', h('h2', title), list, doneBtn(key)) };
}

/* ---- đọc bản gốc: dán bài thật, chạm để tra từ, rồi tóm tắt ---- */
function origBlock(key) {
  const box = scribble('Dán vào đây một bài báo, bài blog hoặc chương sách tiếng Anh gốc (300–1.500 từ)', { long: true });
  box.style.minHeight = '160px';
  const reader = h('div.orig-text');
  const count = h('span.small.faint');
  const sum = scribble('Tóm tắt bài vừa đọc trong 3–5 câu, bằng lời của bạn', { long: true });
  const stage = h('div.stack');
  const wc = (t) => (t.match(/[A-Za-z]+/g) || []).length;
  const t0 = Date.now();

  const show = () => {
    const text = box.value.trim();
    if (wc(text) < 80) return toast('Dán một bài dài hơn một chút nhé (ít nhất 80 từ).');
    reader.replaceChildren(...text.split(/\n\s*\n|\n/).filter(Boolean).map((p) => h('p', wordy(p))));
    count.textContent = `${wc(text)} từ. Chạm vào từ lạ để xem nghĩa và thêm vào thẻ ôn. Đọc hết một lượt trước, đừng tra từng từ.`;
    stage.replaceChildren(
      h('div.card', count, reader),
      h('div.card', h('h4', 'Tóm tắt'), sum),
      h('button.btn.jade.block', {
        onclick: async () => {
          if (wc(sum.value) < 15) return toast('Viết tóm tắt dài hơn một chút nhé.');
          await store.kvUpdate('origReads', [], (all) => {
            all.push({ at: Date.now(), words: wc(text), mins: Math.round((Date.now() - t0) / 60000), head: text.slice(0, 120), summary: sum.value });
            return all;
          });
          await finishBlock(key);
        },
      }, '✓ Lưu bài đọc và tóm tắt'),
    );
  };

  stage.append(box, h('button.btn.primary.block', { onclick: show }, 'Đọc bài này ›'));
  return {
    title: 'Đọc bản gốc',
    el: h('div.stack',
      h('p.small.muted', 'Chọn bài bạn thật sự muốn đọc: tin thể thao, công nghệ, kinh doanh. Đọc không rút gọn là cách nhanh nhất để lên C1.'),
      stage),
  };
}

/* ---- tranh luận: đọc hai phía, chọn phe, nói 4 phút ---- */
function debateBlock(key, d, level) {
  const side = (title, pts) => h('div.card', { style: { padding: '12px' } },
    h('b', title),
    h('ul', { style: { margin: '6px 0 0', paddingLeft: '20px' } },
      ...pts.map(([en, vi]) => h('li', { style: { margin: '6px 0' } }, wordy(en), h('div.small.faint', vi)))));
  const view = retellBlock(key, {
    t: d.t,
    hint: `${d.vi}\nChọn một phía. Nói khoảng 4 phút: quan điểm, hai lý do có ví dụ, phản biện phía kia, kết luận.`,
    sec: 240,
  }, level);
  view.title = 'Tranh luận';
  view.el.prepend(
    h('div.debate-sides', side('Ủng hộ', d.for), side('Phản đối', d.against)),
    h('div.card', { style: { padding: '12px' } },
      h('b', 'Cụm nên dùng hôm nay: '),
      ...d.use.map((u) => h('span.pill.jade', { style: { margin: '2px 4px' } }, u))),
  );
  return view;
}

/* ---- nói lại bằng lời của mình ---- */
function retellBlock(key, t, level) {
  const clock = h('div.score-big', `${t.sec}s`);
  let left = t.sec, timer = 0;
  const startBtn = h('button.btn.primary.block', {
    onclick: () => {
      clearInterval(timer);
      left = t.sec;
      timer = setInterval(() => {
        left--;
        clock.textContent = `${left}s`;
        if (left <= 0) { clearInterval(timer); clock.textContent = 'Hết giờ'; }
      }, 1000);
    },
  }, 'Bắt đầu nói');
  const said = scribble('Lời bạn nói sẽ hiện ở đây, sửa được.', { long: true });
  let aiCard = null;
  aiConfig().then((cfg) => { if (!cfg) aiCard?.remove(); }).catch(() => {});
  const rec = dictation(said);
  return {
    title: 'Nói lại',
    el: h('div.stack',
      h('div.card', h('h3', t.t), t.hint ? h('p.small.muted', { style: { marginTop: '6px', whiteSpace: 'pre-wrap' } }, t.hint) : null,
        h('div.center', { style: { margin: '14px 0' } }, clock), startBtn),
      aiCard = h('div.card.stack',
        h('h4', 'Chấm bài nói bằng AI'),
        h('p.small.faint', hasMic
          ? 'Bấm Ghi âm rồi nói, máy chuyển lời bạn thành chữ. Sửa chỗ máy nghe nhầm rồi bấm chấm. AI chấm từ vựng, ngữ pháp và ý, không chấm phát âm.'
          : 'Trình duyệt này không chuyển giọng nói thành chữ được. Gõ lại điều bạn vừa nói rồi bấm chấm. AI không chấm phát âm.'),
        rec.btn, said,
        gradeButton(() => ((said.value.match(/\S+/g) || []).length < 5
          ? 'Cần ít nhất vài câu để chấm.'
          : { kind: 'speak', task: t.t, text: said.value, level })),
      ),
      doneBtn(key),
    ),
    cleanup: () => { clearInterval(timer); rec.stop(); },
  };
}

/* Ghi lời nói thành chữ bằng nhận dạng giọng nói của trình duyệt, nối vào ô chữ */
function dictation(target) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let r = null;
  const btn = h('button.btn.sm.ghost', {
    hidden: !SR,
    onclick: () => {
      if (r) { r.stop(); return; }
      r = new SR();
      r.lang = 'en-US';
      r.continuous = true;
      r.interimResults = false;
      r.onresult = (e) => {
        for (let k = e.resultIndex; k < e.results.length; k++) {
          if (e.results[k].isFinal) target.value = `${target.value} ${e.results[k][0].transcript}`.trim();
        }
      };
      r.onerror = () => toast('Máy chưa nghe được. Thử lại, nói gần micro hơn.');
      r.onend = () => { r = null; btn.textContent = '🎙 Ghi âm'; };
      r.start();
      btn.textContent = '■ Dừng ghi';
    },
  }, '🎙 Ghi âm');
  return { btn, stop: () => { if (r) r.stop(); } };
}

/* ---------- kiểm tra xếp lớp ---------------------------------------------------- */

const LEVEL_NAME = { 0: 'A0', 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' };

/* Cấp đạt được: cấp cao nhất mà mọi cấp từ 1 tới đó đều đúng từ 60% trở lên */
function placedLevel(items, answers) {
  let level = 0;
  for (const lv of [1, 2, 3, 4]) {
    const idx = items.map((it, i) => i).filter((i) => items[i].lv === lv);
    const right = idx.filter((i) => answers[i] === items[i].a).length;
    if (right / idx.length >= 0.6) level = lv; else break;
  }
  return level;
}

/* Cấp → chặng nên bắt đầu */
const STAGE_FOR = { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2 };

async function placement() {
  const data = await fetch('data/en/placement.json').then((r) => r.json());
  const course = await content.course();
  const items = data.items;
  const answers = new Array(items.length).fill(null);
  let cur = 0;
  const el = h('div.stack');

  const draw = () => {
    const it = items[cur];
    const list = h('div.mcq');
    it.opts.forEach((o, k) => list.append(h(`button.mcq-opt${answers[cur] === k ? '.ok' : ''}`, {
      onclick: () => { answers[cur] = k; if (cur < items.length - 1) { cur++; } draw(); },
    }, o)));
    el.replaceChildren(
      h('div.card',
        h('div.small.faint', `Câu ${cur + 1}/${items.length} · ${it.kind === 'vocab' ? 'Từ vựng' : 'Ngữ pháp'}`),
        h('div', { style: { margin: '6px 0 10px' } }, progressBar(cur / items.length)),
        h('div.mcq-q', it.q),
        it.ex ? h('div.small.muted', { style: { marginBottom: '8px' } }, it.ex) : null,
        list,
        h('p.small.faint', { style: { marginTop: '10px' } }, 'Không biết thì chọn đại hoặc bỏ qua, đừng tra. Bài này chỉ để xếp chặng.'),
        h('div.btn-row', { style: { marginTop: '10px' } },
          h('button.btn.ghost', { disabled: cur === 0, onclick: () => { cur--; draw(); } }, '‹ Câu trước'),
          cur < items.length - 1
            ? h('button.btn.ghost', { onclick: () => { cur++; draw(); } }, 'Bỏ qua ›')
            : h('button.btn.seal', { onclick: finish }, 'Xem kết quả'),
        ),
      ),
    );
  };

  async function finish() {
    const level = placedLevel(items, answers);
    const st = STAGE_FOR[level];
    const right = items.filter((it, i) => answers[i] === it.a).length;
    await store.updateEn((e) => { e.placed = { level: LEVEL_NAME[level], at: Date.now(), right, total: items.length }; return e; });
    const stage = course.stages[st];
    el.replaceChildren(h('div.card',
      h('div.small.faint', `Đúng ${right}/${items.length} câu`),
      h('h1', `Trình độ ước lượng: ${LEVEL_NAME[level]}`),
      h('p', `Nên bắt đầu từ ${stage.name}: ${stage.sub} (${stage.cefr}).`),
      h('p.small.muted', 'Đây là ước lượng nhanh qua ngữ pháp và từ vựng. Kỹ năng nghe, nói, viết cần luyện thêm để khớp với trình độ này.'),
      h('div.btn-row', { style: { marginTop: '12px' } },
        h('button.btn.seal', {
          onclick: async () => {
            await store.updateEn((e) => { e.stage = st; return e; });
            toast(`Đã chọn ${stage.name}.`);
            location.hash = '#/en/session';
          },
        }, `Bắt đầu ${stage.name}`),
        h('a.btn.ghost', { href: '#/en' }, 'Để sau'),
      ),
      section('Xem lại', h('div.stack', ...items.map((it, i) => (answers[i] === it.a ? null : h('div.card',
        h('div.small.faint', `Câu ${i + 1} · ${LEVEL_NAME[it.lv]}`),
        h('div', it.q),
        h('div.small', 'Đáp án: ', h('b', it.opts[it.a])),
        it.why ? h('div.small.muted', it.why) : null,
      ))))),
    ));
  }

  draw();
  return { title: 'Kiểm tra xếp lớp', el };
}
