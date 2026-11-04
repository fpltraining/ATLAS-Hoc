/* Tìm từ: gõ chữ Hán, pinyin (có hoặc không dấu), tiếng Việt hoặc tiếng Anh.

   Tra trong dữ liệu có sẵn trong app nên dùng được cả khi không có mạng:
   từ điển tiếng Trung (zh-dict) và kho từ tiếng Anh (en/dict). */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import { sayEn } from '../kit.js';
import { h, toast } from '../ui.js';

const MAX = 60;

/* Bỏ dấu: dùng cho pinyin và tiếng Việt */
const fold = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const pyKey = (s) => fold(s).replace(/[^a-z]/g, '');

let index = null;
async function buildIndex() {
  if (index) return index;
  const [zh, en, lv] = await Promise.all([content.zhDict(), content.dict(), data.hsk2025()]);
  const zhRows = Object.entries(zh).map(([w, [py, hv, vi]]) => ({
    lang: 'zh', w, py: py || '', hv: hv || '', vi: vi || '',
    pyk: pyKey(py || ''), vik: fold(vi || ''), lv: lv[w] || '',
  }));
  const enRows = Object.entries(en).map(([w, [vi, ipa]]) => ({
    lang: 'en', w, vi: vi || '', ipa: ipa || '', wk: w.toLowerCase(), vik: fold(vi || ''),
  }));
  index = { zhRows, enRows };
  return index;
}

/* Điểm khớp: càng nhỏ càng lên trước; Infinity là không khớp */
function rank(row, q) {
  const qf = fold(q.trim());
  const qpy = pyKey(q);
  if (!qf) return Infinity;
  const hasHan = /[一-鿿]/.test(q);
  if (row.lang === 'zh') {
    if (hasHan) {
      if (row.w === q.trim()) return 0;
      if (row.w.startsWith(q.trim())) return 1 + row.w.length / 10;
      if (row.w.includes(q.trim())) return 2 + row.w.length / 10;
      return Infinity;
    }
    if (qpy && row.pyk === qpy) return 0.5;
    if (qpy.length >= 2 && row.pyk.startsWith(qpy)) return 1.5 + row.pyk.length / 20;
    const words = row.vik.split(/[;,()\s]+/);
    if (words.includes(qf) || row.vik.split(/[;,]/).map((x) => x.trim()).includes(qf)) return 1;
    if (qf.length >= 2 && row.vik.includes(qf)) return 3 + row.vik.length / 100;
    return Infinity;
  }
  if (hasHan) return Infinity;
  if (row.wk === qf) return 0;
  if (qf.length >= 2 && row.wk.startsWith(qf)) return 1.5 + row.wk.length / 20;
  if (row.vik.split(/[;,]/).map((x) => x.trim()).includes(qf)) return 1.2;
  if (qf.length >= 3 && row.vik.includes(qf)) return 3.5 + row.vik.length / 100;
  return Infinity;
}

async function search(q) {
  const { zhRows, enRows } = await buildIndex();
  const hits = [];
  for (const r of zhRows) { const k = rank(r, q); if (k < Infinity) hits.push([k, r]); }
  for (const r of enRows) { const k = rank(r, q); if (k < Infinity) hits.push([k + 0.05, r]); }
  hits.sort((a, b) => a[0] - b[0]);
  return hits.slice(0, MAX).map((x) => x[1]);
}

export async function render(route) {
  const [settings] = await Promise.all([store.settings(), data.ensureHanViet()]);
  const input = h('input.scribble.search-input', {
    type: 'search', placeholder: 'Gõ chữ Hán, pinyin, tiếng Việt hoặc tiếng Anh',
    autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', autocomplete: 'off',
    value: route.query.q || '',
  });
  const info = h('div.small.faint', { style: { margin: '6px 2px' } });
  const list = h('div.stack');
  let timer = 0;

  const say = (r) => (r.lang === 'en' ? sayEn(r.w) : audio.speak(r.w, { rate: settings.speechRate }));

  function row(r) {
    const head = r.lang === 'zh'
      ? h('div.row.wrap', { style: { gap: '8px', alignItems: 'baseline' } },
        h('span.cn', { style: { fontSize: '26px' } }, r.w),
        h('span.py', r.py), r.hv ? h('span.hv', r.hv) : null,
        r.lv ? h('span.pill.plain', `HSK ${r.lv}`) : null)
      : h('div.row.wrap', { style: { gap: '8px', alignItems: 'baseline' } },
        h('b', { style: { fontSize: '20px' } }, r.w), r.ipa ? h('span.faint', r.ipa) : null,
        h('span.pill.plain', 'Tiếng Anh'));
    const actions = h('div.row.wrap', { style: { gap: '8px', marginTop: '8px' } },
      h('button.btn.sm', { onclick: () => say(r) }, '🔊 Nghe'));
    if (r.lang === 'zh') {
      for (const ch of [...r.w].filter(data.isHan)) {
        actions.append(h('a.btn.sm.ghost', { href: `#/char/${encodeURIComponent(ch)}` }, `${ch} · cấu tạo, viết`));
      }
    } else {
      actions.append(h('button.btn.sm.ghost', {
        onclick: async (e) => {
          const n = await store.addEnWord(r.w, { vi: r.vi, ipa: r.ipa, source: 'tra từ' });
          toast(n ? `Đã thêm “${r.w}” vào thẻ ôn.` : 'Từ này đã có trong thẻ ôn.');
          e.currentTarget.textContent = '✓ Đã có trong thẻ ôn';
        },
      }, '+ Thẻ ôn'));
    }
    return h('div.card', { style: { padding: '12px 14px' } }, head, h('div', { style: { marginTop: '4px' } }, r.vi), actions);
  }

  async function run() {
    const q = input.value.trim();
    history.replaceState(null, '', `#/search${q ? `?q=${encodeURIComponent(q)}` : ''}`);
    if (!q) {
      info.textContent = 'Ví dụ: 学习, xuexi, học, study.';
      list.replaceChildren();
      return;
    }
    const hits = await search(q);
    info.textContent = hits.length
      ? `${hits.length >= MAX ? `${MAX}+` : hits.length} kết quả`
      : 'Không thấy từ nào. Thử gõ ngắn hơn hoặc bỏ dấu.';
    list.replaceChildren(...hits.map(row));
  }

  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 200); });
  setTimeout(() => { input.focus(); run(); }, 50);

  return {
    title: 'Tra từ',
    el: h('div.stack', input, info, list),
    cleanup: () => clearTimeout(timer),
  };
}

export { fold, pyKey };
