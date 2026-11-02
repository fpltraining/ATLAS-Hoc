/* Những mảnh dùng chung cho phần tiếng Anh và bài đọc: nghe, nói, viết bằng bút,
   tra từ. Mọi chỗ song ngữ đều đi qua pair(): tiếng Anh trên, tiếng Việt ngay dưới. */

import * as store from './store.js';
import * as audio from './audio.js';
import * as content from './content.js';
import { h, toast, sheet, closeSheet } from './ui.js';

/* ---------- nghe ---------------------------------------------------------- */

export async function sayEn(text, opts = {}) {
  const s = await store.settings();
  return audio.speak(text, { rate: s.enRate, lang: 'en', ...opts });
}

export function sayBtn(text, lang = 'en') {
  return h('button.speak-btn', {
    'aria-label': 'Đọc',
    onclick: async (e) => {
      e.stopPropagation();
      if (lang === 'en') sayEn(text);
      else audio.speak(text, { rate: (await store.settings()).speechRate });
    },
  }, '🔊');
}

/* ---------- một dòng song ngữ ---------------------------------------------- */

/** Dòng Anh–Việt chuẩn của cả app. Chạm vào từ để tra, nút loa để nghe cả dòng. */
export function pair(en, vi, { actions = [], lang = 'en' } = {}) {
  return h('div.pair',
    h('div.grow',
      h(lang === 'en' ? 'div.pair-en' : 'div.pair-en.cn', lang === 'en' ? wordy(en) : en),
      vi && h('div.pair-vi', vi),
    ),
    h('div.pair-act', sayBtn(en, lang), ...actions),
  );
}

/** Bọc từng từ tiếng Anh để chạm vào là tra được. */
export function wordy(text, gloss) {
  const frag = document.createDocumentFragment();
  const parts = String(text).split(/([A-Za-z]+(?:['’-][A-Za-z]+)*)/);
  parts.forEach((p, i) => {
    if (i % 2) {
      frag.append(h('span.w', { onclick: (e) => { e.stopPropagation(); wordSheet(p, gloss); } }, p));
    } else if (p) frag.append(document.createTextNode(p));
  });
  return frag;
}

export async function wordSheet(word, gloss = {}, source = 'đọc') {
  const d = await content.dict();
  const found = content.lookup(word, d, gloss);
  const exists = await store.getCard(`en-recall:${found.w}`);
  sayEn(found.w || word);

  const viInput = found.vi ? null : h('input.scribble.sm', { placeholder: 'Nghĩa tiếng Việt (nếu bạn biết)' });
  sheet(
    h('div.row.spread',
      h('div',
        h('div.word-big', found.w || word),
        found.ipa && h('div.faint', found.ipa),
      ),
      sayBtn(found.w || word),
    ),
    found.vi
      ? h('p.word-mean', found.vi)
      : h('p.muted', 'Từ này chưa có trong kho từ. Bạn vẫn lưu được vào sổ tay.'),
    viInput,
    h('div.btn-row', { style: { marginTop: '12px' } },
      exists
        ? h('button.btn.sm.ghost', { disabled: true }, '✓ Đã có trong bộ ôn')
        : h('button.btn.jade', {
          onclick: async () => {
            const n = await store.addEnWord(found.w || word, { vi: found.vi || viInput?.value || '', ipa: found.ipa, source });
            toast(n ? `Đã thêm "${found.w || word}" vào bộ ôn.` : 'Từ này đã có rồi.');
            closeSheet();
          },
        }, '+ Thêm vào ôn tập'),
      h('button.btn.ghost', { 'data-close': '' }, 'Đóng'),
    ),
  );
}

/* ---------- viết bằng Apple Pencil -------------------------------------------- */

/* iPad tự đổi chữ viết tay thành chữ gõ trong ô nhập (Scribble), nên ô này vừa
   viết được bằng bút vừa chấm được đúng từng chữ cái. */
export function scribble(placeholder = 'Viết bằng Apple Pencil vào đây', { long = false, onEnter } = {}) {
  return h(long ? 'textarea.scribble.long' : 'input.scribble', {
    placeholder, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', autocomplete: 'off',
    onkeydown: (e) => { if (!long && e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } },
  });
}

const norm = (s) => String(s).toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

/** So hai chuỗi theo từng ký tự, đánh dấu chỗ sai để hiện cho người học. */
export function diff(target, typed) {
  const a = [...norm(target)], b = [...norm(typed)];
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const out = h('div.diff');
  let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      out.append(h('span.d-ok', a[i] === ' ' ? ' ' : a[i])); i++; j++;
    } else if (i < a.length && (j >= b.length || dp[i + 1][j] >= dp[i][j + 1])) {
      out.append(h('span.d-miss', a[i] === ' ' ? '␣' : a[i])); i++;
    } else {
      out.append(h('span.d-extra', b[j] === ' ' ? '␣' : b[j])); j++;
    }
  }
  const score = a.length ? Math.round((dp[0][0] / Math.max(a.length, b.length)) * 100) : 0;
  return { el: out, ok: norm(target) === norm(typed), score };
}

/* ---------- máy nghe mình nói --------------------------------------------------- */

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const hasMic = !!SR;

/* Đây là máy so chữ nó nghe được với câu mẫu, KHÔNG phải chấm phát âm thật. Ghi rõ
   trên giao diện để khỏi hiểu nhầm là điểm phát âm. */
export function micCheck(target) {
  if (!hasMic) return null;
  const result = h('div.small.faint');
  let rec = null;
  const btn = h('button.btn.sm.ghost', {
    onclick: () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = 'en-US';
      rec.interimResults = false;
      btn.textContent = '● Đang nghe…';
      rec.onresult = (e) => {
        const heard = e.results[0][0].transcript;
        const want = norm(target).split(' '), got = new Set(norm(heard).split(' '));
        const hit = want.filter((w) => got.has(w)).length;
        const pct = Math.round((hit / want.length) * 100);
        result.textContent = `Máy nghe được: "${heard}" · khớp ${pct}% số từ`;
      };
      rec.onerror = () => { result.textContent = 'Máy chưa nghe được. Thử lại, nói gần micro hơn.'; };
      rec.onend = () => { rec = null; btn.textContent = '🎙 Nói thử'; };
      rec.start();
    },
  }, '🎙 Nói thử');
  return h('div.row.wrap', { style: { gap: '8px' } }, btn, result);
}

/* ---------- trắc nghiệm --------------------------------------------------------- */

/** Một câu hỏi nhiều lựa chọn. onAnswer(đúng/sai) gọi đúng một lần. */
export function mcq({ q, qVi, opts, a, why, onAnswer }) {
  let answered = false;
  const list = h('div.mcq');
  const note = h('div');
  opts.forEach((o, i) => {
    list.append(h('button.mcq-opt', {
      onclick: (e) => {
        if (answered) return;
        answered = true;
        for (const [k, b] of [...list.children].entries()) {
          if (k === a) b.classList.add('ok');
        }
        if (i !== a) e.currentTarget.classList.add('no');
        if (why) note.append(h('div.note', { style: { marginTop: '10px' } }, why));
        onAnswer?.(i === a);
      },
    }, o));
  });
  return h('div',
    h('div.mcq-q', q),
    qVi && h('div.small.faint', { style: { marginBottom: '8px' } }, qVi),
    list, note,
  );
}

/* ---------- hoàn thành một phần --------------------------------------------------- */

export function nextUp(text, href) {
  return h('a.btn.primary.block', { href, style: { marginTop: '14px' } }, text);
}

export const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
