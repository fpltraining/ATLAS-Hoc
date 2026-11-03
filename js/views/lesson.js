/* Màn hình một bài học: từ vựng, ngữ pháp, câu mẫu và nút vào luyện viết. */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import { newCard, ZH_TYPES } from '../srs.js';
import { quotaToday, dayType } from '../plan.js';
import { h, section, readingLine, toast, clickableHanzi, pill } from '../ui.js';
import { refreshDueBadge } from '../app.js';

export async function render(route) {
  const id = Number(route.args[0]) || 1;
  const [idx] = await Promise.all([data.curriculum(), data.ensureHanViet()]);
  const meta = idx.lessons.find((l) => l.id === id);
  if (!meta) return { title: 'Không thấy bài', el: h('div.empty', 'Không tìm thấy bài học này.') };

  const [L, progress, settings, lv25] = await Promise.all([
    data.lesson(meta.file), store.lessonProgress(), store.settings(), data.hsk2025(),
  ]);
  const levelOf = (w) => lv25[w] || lv25[w.replace(/儿$/, '')];
  await data.preloadChars(meta.newChars);

  const p = progress[id] || {};
  const el = h('div.stack');
  const say = (t) => {
    if (!audio.speak(t, { rate: settings.speechRate })) toast('Trình duyệt không hỗ trợ đọc.');
    else if (!audio.hasVoice()) toast(audio.NO_VOICE_HELP, 7000);
  };
  const openChar = (ch) => { location.hash = `#/char/${encodeURIComponent(ch)}`; };

  /* ---- đầu bài ---- */
  el.append(h('div.card',
    h('div.row.spread',
      h('div',
        h('div.small.faint', `Bài ${meta.no ?? L.id} · HSK ${meta.level} chuẩn 2025`),
        h('h1.cn', L.cn),
        h('div.muted', L.title),
      ),
      h('button.speak-btn', { onclick: () => say(L.cn), 'aria-label': 'Đọc' }, '🔊'),
    ),
    h('p.small.muted', { style: { marginTop: '10px', marginBottom: 0 } }, L.goal),
    h('div.row.wrap', { style: { marginTop: '10px' } },
      pill(`${L.words.length} từ`, 'plain'),
      pill(`${meta.newChars.length} chữ mới`, 'seal'),
      pill(`${L.grammar.length} điểm ngữ pháp`, 'jade'),
    ),
  ));

  /* ---- các nút hành động ---- */
  el.append(h('div.btn-row',
    h('a.btn.primary', { href: `#/charmap/${id}` }, '✍️ Luyện viết chữ mới'),
    h('button.btn.jade', {
      onclick: async () => {
        const added = await addLessonCards(L, id);
        await store.markLesson(id, { started: true });
        await refreshDueBadge();
        toast(added.words
          ? `Đã thêm ${added.words} từ vào bộ ôn.${added.left ? ` Còn ${added.left} từ, mai học tiếp.` : ''}`
          : added.left ? 'Đã đủ từ mới hôm nay. Mai học tiếp nhé.' : 'Cả bài đã có trong bộ ôn.', 3500);
        if (added.words) location.hash = '#/review?lang=zh';
      },
    }, p.started ? '+ Thêm từ tiếp theo' : '+ Thêm từ vào ôn tập'),
    h('button.btn.ghost', {
      onclick: async () => {
        await store.markStep('zh');
        toast('Đã xong phần tiếng Trung hôm nay.');
        location.hash = '#/home';
      },
    }, '✓ Xong hôm nay'),
  ));

  /* ---- chữ mới ---- */
  if (meta.newChars.length) {
    const strip = h('div.row.wrap', { style: { gap: '8px' } });
    for (const ch of meta.newChars) {
      strip.append(h('button.syl', {
        style: { minWidth: '62px', minHeight: '62px', flexDirection: 'column' },
        onclick: () => openChar(ch),
      },
        h('span.cn', { style: { fontSize: '27px', lineHeight: 1.1 } }, ch),
        h('small.hv', data.hvOf(ch) || ''),
      ));
    }
    el.append(section('Chữ mới trong bài', h('div.card', strip,
      h('p.small.faint', { style: { margin: '10px 0 0' } },
        'Chạm vào một chữ để xem cấu tạo, âm Hán Việt và luyện viết từng nét.'))));
  }

  /* ---- từ vựng ---- */
  const words = h('div.card');
  for (const w of L.words) {
    words.append(h('div.word',
      h('div.word-cn', clickableHanzi(w.w, openChar)),
      h('div.word-body',
        readingLine(w.py, w.hv),
        h('div', w.vi),
        h('div.small.faint', [w.pos, levelOf(w.w) ? `HSK ${levelOf(w.w)} chuẩn 2025` : 'ngoài HSK 1–9'].filter(Boolean).join(' · ')),
        w.note && h('div.note', { style: { marginTop: '8px' } }, w.note),
        ...(w.ex || []).map((e) => h('div.small.muted', { style: { marginTop: '6px' } },
          h('span.cn', e.cn), ' · ', h('i', e.vi))),
      ),
      h('button.speak-btn', { onclick: () => say(w.w), 'aria-label': 'Đọc' }, '🔊'),
    ));
  }
  el.append(section(`Từ vựng · ${L.words.length} từ`, words));

  /* ---- ngữ pháp ---- */
  const gram = h('div.stack');
  for (const g of L.grammar) {
    gram.append(h('div.card',
      h('h3', g.t),
      h('div.formula.cn', g.b),
      h('p.small.muted', g.d),
      ...(g.ex || []).map((e) => h('div.sent',
        h('div.row.spread',
          h('div',
            h('div.sent-cn', clickableHanzi(e.cn, openChar)),
            h('div.py.small', e.py),
            h('div.small.muted', e.vi),
          ),
          h('button.speak-btn', { onclick: () => say(e.cn), 'aria-label': 'Đọc' }, '🔊'),
        ),
      )),
    ));
  }
  el.append(section('Ngữ pháp', gram));

  /* ---- câu mẫu ---- */
  const sents = h('div.card');
  for (const s of L.sentences) {
    sents.append(h('div.sent',
      h('div.row.spread',
        h('div.grow',
          h('div.sent-cn', clickableHanzi(s.cn, openChar)),
          h('div.py.small', s.py),
          h('div.small.muted', s.vi),
        ),
        h('button.speak-btn', { onclick: () => say(s.cn), 'aria-label': 'Đọc' }, '🔊'),
      ),
    ));
  }
  el.append(section('Câu mẫu', sents));

  /* ---- điều hướng cuối bài ---- */
  const prev = idx.lessons.find((l) => l.id === id - 1);
  const next = idx.lessons.find((l) => l.id === id + 1);
  el.append(h('div.btn-row', { style: { marginTop: '20px' } },
    prev ? h('a.btn.ghost', { href: `#/lesson/${prev.id}` }, '‹ Bài ', String(prev.id)) : null,
    h('button.btn.jade', {
      onclick: async () => {
        await store.markLesson(id, { started: true, done: true });
        await store.markStep('zh');
        toast('Đã đánh dấu hoàn thành bài ' + id);
        location.hash = '#/zh';
      },
    }, '✓ Học xong bài này'),
    next ? h('a.btn.ghost', { href: `#/lesson/${next.id}` }, 'Bài ', String(next.id), ' ›') : null,
  ));

  return { title: `Bài ${meta.no ?? L.id} · ${L.title}`, el };
}

/** Thêm từ của bài vào bộ ôn, không vượt hạn mức từ mới hôm nay. */
async function addLessonCards(L, lessonId) {
  const [cards, settings, day] = await Promise.all([store.allCards(), store.settings(), store.today()]);
  const existing = new Set(cards.map((c) => c.id));
  const due = cards.filter((c) => c.due <= Date.now()).length;
  const quota = quotaToday(settings.dailyMinutes || 120, dayType(settings), due);
  let room = Math.max(0, quota.zh - (day.newZh || 0));

  const todo = L.words.filter((w) => ZH_TYPES.some((type) => !existing.has(`${type}:${w.w}`)));
  const take = todo.slice(0, room);
  const fresh = [];
  for (const w of take) {
    for (const type of ZH_TYPES) {
      const c = newCard(w.w, type, lessonId);
      if (!existing.has(c.id)) fresh.push({ ...c, lang: 'zh', py: w.py, hv: w.hv, vi: w.vi });
    }
  }
  if (fresh.length) await store.putCards(fresh);
  if (take.length) await store.patchToday((d) => { d.newZh = (d.newZh || 0) + take.length; });
  return { words: take.length, left: todo.length - take.length };
}
