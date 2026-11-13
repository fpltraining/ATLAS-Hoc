/* Màn hình đọc song ngữ, dùng chung cho truyện tiếng Anh và tiếng Trung.

   Quy tắc số một: mỗi dòng ngoại ngữ có nghĩa tiếng Việt NGAY BÊN DƯỚI. Câu dài đã
   được cắt thành cụm ngắn từ lúc soạn, nên mắt không phải đọc hết một đoạn rồi mới
   thấy nghĩa. Tiếng Trung có thêm dòng pinyin giữa chữ Hán và nghĩa.
*/

import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import * as data from '../data.js';
import { newCard, ZH_TYPES } from '../srs.js';
import { wordSheet, mcq, sayBtn } from '../kit.js';
import { h, toast, sheet, closeSheet, section } from '../ui.js';

export async function render(route) {
  const id = route.args[0];
  const [story, settings, read] = await Promise.all([content.story(id), store.settings(), store.readState()]);
  const zh = story.lang === 'zh';
  const n = Number(route.args[1]) || 1;
  const ch = story.chapters.find((c) => c.n === n) || story.chapters[0];
  const zhDict = zh ? await content.zhDict() : null;
  if (zh) await data.ensureHanViet();

  let mode = settings.readMode || 'both';
  let showPy = settings.readPy !== false;
  let size = settings.readSize || 22;
  let playing = false;
  let timer = 0;

  /* ---- các dòng ---- */
  const lines = [];
  const body = h('div.reader-body');
  body.style.setProperty('--read-size', `${size}px`);

  const addLine = (p, [text, vi, py]) => {
    const ln = h('div.ln', { dataset: { i: String(lines.length) } },
      h(`div.ln-text${zh ? '.cn' : ''}`, zh ? zhLine(text, zhDict) : enLine(text, ch.gloss, story)),
      zh && py ? h('div.ln-py', py) : null,
      h('div.ln-vi', vi),
    );
    lines.push({ el: ln, text });
    p.append(ln);
  };

  // tranh minh hoạ chương (nếu có), vẽ theo lối truyện tranh
  const scenes = await fetch('data/scenes.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  if (scenes[story.id]?.includes(ch.n)) {
    body.append(h('figure.scene', h('img', { src: `img/scenes/${story.id}-${ch.n}.svg`, alt: ch.vi || ch.title, loading: 'lazy' })));
  }

  for (const para of ch.paras) {
    const p = h('div.reader-para');
    for (const line of para) addLine(p, line);
    body.append(p);
  }

  // "Điều rút ra": vẫn là các dòng song ngữ, nghe và chạm tra từ như phần truyện
  if (ch.lesson?.length) {
    const p = h('div.reader-para.reader-lesson', h('div.reader-lesson-h', 'Điều rút ra'));
    for (const line of ch.lesson) addLine(p, line);
    body.append(p);
  }

  const say = (text, onEnd) => audio.speak(text, {
    lang: zh ? 'zh' : 'en', rate: zh ? settings.speechRate : settings.enRate, onEnd,
  });

  // Chạm vào dòng thì nghe cả dòng; đang che tiếng Việt thì hiện nghĩa dòng đó
  body.addEventListener('click', (e) => {
    const ln = e.target.closest('.ln');
    if (!ln) return;
    ln.classList.toggle('show');
    stopPlay();
    mark(ln);
    say(lines[Number(ln.dataset.i)].text);
  });

  const mark = (el) => {
    for (const l of lines) l.el.classList.toggle('on', l.el === el);
  };

  function playFrom(i) {
    if (!playing || i >= lines.length) { stopPlay(); mark(null); return; }
    const l = lines[i];
    mark(l.el);
    l.el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    say(l.text, () => { timer = setTimeout(() => playFrom(i + 1), 180); });
  }
  function stopPlay() {
    playing = false;
    clearTimeout(timer);
    audio.stop();
    playBtn.textContent = '▶ Nghe cả chương';
  }

  /* ---- thanh công cụ ---- */
  const playBtn = h('button.btn.sm', {
    onclick: () => {
      if (playing) return stopPlay();
      playing = true;
      playBtn.textContent = '■ Dừng';
      playFrom(0);
    },
  }, '▶ Nghe cả chương');

  const modeSeg = h('div.mode-seg');
  const applyMode = () => {
    body.classList.toggle('hide-vi', mode === 'hide');
    body.classList.toggle('hide-py', !showPy);
    for (const b of modeSeg.children) b.classList.toggle('on', b.dataset.m === mode);
  };
  for (const [m, label] of [['both', 'Song ngữ'], ['hide', 'Che tiếng Việt']]) {
    modeSeg.append(h('button', {
      dataset: { m },
      onclick: () => { mode = m; store.setSetting('readMode', m); for (const l of lines) l.el.classList.remove('show'); applyMode(); },
    }, label));
  }
  applyMode();

  const setSize = (v) => {
    size = Math.max(16, Math.min(32, v));
    body.style.setProperty('--read-size', `${size}px`);
    store.setSetting('readSize', size);
  };

  const tools = h('div.reader-tools',
    playBtn, modeSeg,
    zh ? h('button.btn.sm.ghost', {
      onclick: () => { showPy = !showPy; store.setSetting('readPy', showPy); applyMode(); },
    }, 'Pinyin') : null,
    h('button.btn.sm.ghost', { 'aria-label': 'Chữ nhỏ hơn', onclick: () => setSize(size - 2) }, 'A−'),
    h('button.btn.sm.ghost', { 'aria-label': 'Chữ to hơn', onclick: () => setSize(size + 2) }, 'A+'),
  );

  /* ---- sau khi đọc ---- */
  const after = h('div.stack', { style: { marginTop: '22px' } });

  if (Object.keys(ch.gloss || {}).length) {
    after.append(h('div.card',
      h('h3', 'Từ khó trong bài'),
      ...Object.entries(ch.gloss).map(([w, vi]) => h('div.gloss-row',
        h('span.w', { onclick: () => wordSheet(w, ch.gloss, story.id) }, h('b', w)),
        h('span.muted', vi),
      )),
    ));
  }

  if (ch.quiz?.length) {
    after.append(h('div.card', h('h3', { style: { marginBottom: '8px' } }, 'Kiểm tra nhanh'),
      ...ch.quiz.map((q) => mcq(q))));
  }

  if (ch.say) {
    after.append(h('div.note', h('b', 'Thử sức: '), ch.say));
  }

  if (zh) {
    const chars = [...new Set(ch.paras.flat().flatMap(([t]) => [...t].filter(data.isHan)))].slice(0, 10);
    after.append(h('a.btn.block', { href: `#/write/${encodeURIComponent(chars.join(''))}` }, `✍️ Viết ${chars.length} chữ trong bài bằng bút`));
  } else {
    const glossWords = Object.keys(ch.gloss || {}).filter((w) => /^[a-z' -]+$/i.test(w)).slice(0, 8);
    if (glossWords.length) {
      after.append(h('a.btn.block', { href: `#/penen/${encodeURIComponent(glossWords.join(','))}` }, `✍️ Viết ${glossWords.length} từ khó bằng bút`));
    }
  }

  if (story.date) {
    after.append(h('div.source',
      story.date ? h('div', `Cập nhật: ${fmtDate(story.date)}`) : null,
      h('div.faint', 'Bài do ATLAS viết lại bằng ngôn ngữ dễ.'),
    ));
  }

  const idx = story.chapters.indexOf(ch);
  const nextCh = story.chapters[idx + 1];
  const prevCh = story.chapters[idx - 1];
  const done = !!read.stories?.[story.id]?.ch?.[ch.n];

  after.append(h('div.btn-row', { style: { marginTop: '6px' } },
    prevCh ? h('a.btn.ghost', { href: `#/reader/${story.id}/${prevCh.n}` }, '‹ Chương trước') : null,
    h('button.btn.jade', {
      onclick: async () => {
        await finish(story, ch);
        toast(`Đã đọc xong. +${ch.words || countWords(ch)} ${zh ? 'chữ' : 'từ'}`);
        location.hash = nextCh ? `#/reader/${story.id}/${nextCh.n}` : `#/read/${zh ? 'zh' : 'en'}`;
      },
    }, done ? 'Đọc xong rồi, sang tiếp ›' : '✓ Đọc xong'),
  ));

  const el = h('div.reader',
    h('div.reader-head',
      h('div.row.spread',
        h('div',
          h('div.small.faint', `${story.level}${story.chapters.length > 1 ? ` · chương ${ch.n}/${story.chapters.length}` : ''}`),
          h(`h1.reader-title${zh ? '.cn' : ''}`, ch.title),
          h('div.muted', ch.vi),
        ),
        sayBtn(ch.title, zh ? 'zh' : 'en'),
      ),
    ),
    tools,
    body,
    after,
  );

  return { title: story.title, el, className: 'reading', cleanup: stopPlay };
}

function fmtDate(s) {
  const [y, m, d] = s.split('-');
  return `${Number(d)}/${Number(m)}/${y}`;
}

const countWords = (ch) => ch.paras.flat().reduce((a, [t]) => a + (t.match(/\S+/g) || []).length, 0);

async function finish(story, ch) {
  const zh = story.lang === 'zh';
  const words = zh
    ? ch.paras.flat().reduce((a, [t]) => a + [...t].filter(data.isHan).length, 0)
    : countWords(ch);
  await store.updateRead((r) => {
    r.stories = r.stories || {};
    const s = r.stories[story.id] || (r.stories[story.id] = { ch: {} });
    if (!s.ch[ch.n]) r.words = (r.words || 0) + words;
    s.ch[ch.n] = { at: Date.now() };
    if (zh) r.currentZh = story.id; else r.current = story.id;
    return r;
  });
  await store.markStep(zh ? 'readZh' : 'read');
}

/* ---------- một dòng tiếng Anh: mỗi từ chạm được ---------------------------- */

function enLine(text, gloss, story) {
  const frag = document.createDocumentFragment();
  String(text).split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/).forEach((p, i) => {
    if (i % 2) {
      frag.append(h('span.w', {
        onclick: (e) => { e.stopPropagation(); audio.stop(); wordSheet(p, gloss, story.id); },
      }, p));
    } else if (p) frag.append(document.createTextNode(p));
  });
  return frag;
}

/* ---------- một dòng tiếng Trung: tách từ theo từ điển, chạm để tra ---------- */

function zhLine(text, dict) {
  const frag = document.createDocumentFragment();
  const chars = [...text];
  let i = 0;
  while (i < chars.length) {
    if (!data.isHan(chars[i])) { frag.append(document.createTextNode(chars[i])); i++; continue; }
    let len = 1;
    for (let k = Math.min(4, chars.length - i); k > 1; k--) {
      if (dict[chars.slice(i, i + k).join('')]) { len = k; break; }
    }
    const word = chars.slice(i, i + len).join('');
    frag.append(h('span.w', { onclick: (e) => { e.stopPropagation(); audio.stop(); zhSheet(word, dict); } }, word));
    i += len;
  }
  return frag;
}

async function zhSheet(word, dict) {
  const info = dict[word] || ['', '', ''];
  const [dictPy, hv, vi] = info;
  const py = dictPy || ([...word].length === 1 ? data.pyOf(word) : '');
  const hvJoined = hv || data.hvOfWord(word);
  const settings = await store.settings();
  audio.speak(word, { rate: settings.speechRate, lang: 'zh' });
  const has = await store.getCard(`hanzi-vi:${word}`);
  sheet(
    h('div.row.spread',
      h('div',
        h('div.word-big.cn', word),
        h('div.row', { style: { gap: '8px' } }, py && h('span.py', py), hvJoined && h('span.hv', hvJoined)),
      ),
      sayBtn(word, 'zh'),
    ),
    vi ? h('p.word-mean', vi) : h('p.muted', 'Chưa có nghĩa của cả từ này. Xem từng chữ ở dưới.'),
    h('div.row.wrap', { style: { gap: '6px' } },
      ...[...word].filter(data.isHan).map((c) => h('a.btn.sm.ghost', {
        href: `#/char/${encodeURIComponent(c)}`,
        onclick: () => setTimeout(closeSheet, 30),
      }, c, ' ', data.hvOf(c) || ''))),
    h('div.btn-row', { style: { marginTop: '12px' } },
      h('a.btn.sm', { href: `#/write/${encodeURIComponent(word)}`, onclick: () => setTimeout(closeSheet, 30) }, '✍️ Viết bằng bút'),
      has
        ? h('button.btn.sm.ghost', { disabled: true }, '✓ Đã có trong bộ ôn')
        : h('button.btn.sm.jade', {
          disabled: !vi,
          onclick: async () => {
            const cards = ZH_TYPES.map((type) => ({ ...newCard(word, type, 'doc'), lang: 'zh', py, hv: hvJoined, vi }));
            await store.putCards(cards);
            toast(`Đã thêm ${word} vào bộ ôn.`);
            closeSheet();
          },
        }, '+ Thêm vào ôn tập'),
    ),
  );
}
