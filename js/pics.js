/* Tranh minh hoạ cho từ và câu tiếng Anh, tiếng Trung, theo kiểu thẻ học (flashcard).
   Icon: Fluent Emoji Flat (MIT, Microsoft), dựng sẵn ở data/pics/en.json (tools/build-pics.mjs)
   và data/pics/zh.json (tools/build-pics-zh.mjs). Tải lười: chỉ nạp file tranh lần đầu cần dùng. */
import { h } from './ui.js';

const packs = { en: null, zh: null };
const loading = { en: null, zh: null };
let data = null; // gói tiếng Anh (giữ tên cũ cho các hàm bên dưới)

export function loadPics(lang = 'en') {
  if (packs[lang]) return Promise.resolve(packs[lang]);
  if (!loading[lang]) {
    loading[lang] = fetch(`data/pics/${lang}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && lang === 'zh') { j.soloSet = new Set(j.solo || []); j.segSet = new Set(j.seg || []); }
        packs[lang] = j;
        if (lang === 'en') data = j;
        return j;
      })
      .catch(() => { loading[lang] = null; return null; });
  }
  return loading[lang];
}

/* Bật/tắt trong Cài đặt, mặc định bật. Đọc đồng bộ từ localStorage cho nhanh. */
export function picsOn() {
  try { return localStorage.getItem('atlas-pics') !== 'off'; } catch { return true; }
}
export function setPicsOn(on) {
  try { localStorage.setItem('atlas-pics', on ? 'on' : 'off'); } catch { /* bỏ qua */ }
}

const IRR = {
  went: 'go', gone: 'go', came: 'come', saw: 'see', seen: 'see', took: 'take', taken: 'take', gave: 'give', given: 'give',
  made: 'make', got: 'get', ate: 'eat', eaten: 'eat', drank: 'drink', wrote: 'write', written: 'write', ran: 'run',
  sat: 'sit', stood: 'stand', bought: 'buy', sold: 'sell', told: 'tell', said: 'say', thought: 'think', knew: 'know',
  known: 'know', found: 'find', felt: 'feel', met: 'meet', slept: 'sleep', spoke: 'speak', spoken: 'speak',
  children: 'child', people: 'people', men: 'man', women: 'woman', feet: 'foot', teeth: 'tooth', mice: 'mouse',
  drove: 'drive', driven: 'drive', flew: 'fly', swam: 'swim', sang: 'sing', drew: 'draw', grew: 'grow', threw: 'throw',
  caught: 'catch', taught: 'teach', brought: 'bring', built: 'build', sent: 'send', spent: 'spend', paid: 'pay',
  won: 'win', lost: 'lose', hid: 'hide', broke: 'break', fell: 'fall', rose: 'rise', began: 'begin', heard: 'hear',
  held: 'hold', kept: 'keep', woke: 'wake', wore: 'wear', cried: 'cry', tried: 'try', studied: 'study',
};

/* Từ chức năng: không vẽ, vẽ vào chỉ gây hiểu sai. */
const STOP = new Set(('a an the i you he she it we they me him her us them my your his its our their this that these those '
  + 'is am are was were be been being do does did have has had will would can could should must might may shall '
  + 'to of in on at by for with from up down out over under into onto about as than then so but and or if because '
  + 'not no yes very too also just only still already even more most much many some any all each every '
  + 'what who why how when where which there here one ones s t don didn doesn isn aren wasn weren won can t ll ve re d m').split(' '));

/* Động từ quá chung: trong câu thường không mang nghĩa hình ảnh (took a taxi ≠ cầm tay). */
const LIGHT = new Set('take took taken give gave given get got make made put keep kept let use used go went gone come came want need try tried find found seem become became'.split(' '));

function candidates(w) {
  const out = [w];
  if (IRR[w]) out.push(IRR[w]);
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) out.push(w.slice(0, -2));
  if (w.endsWith('s')) out.push(w.slice(0, -1));
  if (w.endsWith('ied')) out.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ed')) { out.push(w.slice(0, -2), w.slice(0, -1)); if (/(.)\1ed$/.test(w)) out.push(w.slice(0, -3)); }
  if (w.endsWith('ing')) { out.push(w.slice(0, -3), w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) out.push(w.slice(0, -4)); }
  if (w.endsWith('er')) out.push(w.slice(0, -2), w.slice(0, -1));
  if (w.endsWith('est')) out.push(w.slice(0, -3), w.slice(0, -2));
  if (w.endsWith('ly')) out.push(w.slice(0, -2));
  return out;
}

/** Tên icon cho một từ (đã nạp dữ liệu). */
export function picName(word, lang = 'en') {
  if (lang === 'zh') {
    const z = packs.zh;
    if (!z) return null;
    const w = String(word).trim();
    return z.words[w] || z.words[w.replace(/儿$/, '')] || null;
  }
  if (!data) return null;
  const w = String(word).toLowerCase().trim();
  if (data.words[w]) return data.words[w];
  if (w.includes(' ')) return null;
  for (const c of candidates(w)) if (data.words[c]) return data.words[c];
  return null;
}

function svg(name, size, pack = data) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', `0 0 ${pack.size} ${pack.size}`);
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = pack.icons[name];
  return el;
}

/* Màu nền ô tranh: cố định theo từ, kiểu thẻ màu trong sách học. */
const TINTS = ['#fde2d8', '#dff0e9', '#fbf0d8', '#e3e8fb', '#f6e1ef', '#e2f3f7', '#efe8da', '#e9f5d9'];
const tint = (w) => { let x = 0; for (const c of w) x = (x * 31 + c.charCodeAt(0)) >>> 0; return TINTS[x % TINTS.length]; };

/** Ô tranh lớn cho một từ. Không có tranh thì ô tự bỏ đi. */
export function wordPic(word, { size = 88, lang = 'en' } = {}) {
  if (!picsOn()) return null;
  const box = h('div.pic-tile', { style: { background: tint(String(word).toLowerCase()) } });
  loadPics(lang).then((pack) => {
    const n = pack ? picName(word, lang) : null;
    if (!n) { box.remove(); return; }
    box.append(svg(n, size, pack));
  });
  return box;
}

/* Lượng từ hay trùng chữ với danh từ: 一门课, 这笔钱 → không vẽ cửa, bút. */
const MW = new Set(['门', '笔']);
const NUMISH = '一二两三四五六七八九十百几每这那哪多好整';

/** Tách câu tiếng Trung theo từ dài nhất có trong bộ tranh, trả về các từ có tranh theo thứ tự. */
export function zhPicWords(text, z = packs.zh) {
  const out = [];
  if (!z) return out;
  const s = String(text);
  for (let i = 0; i < s.length;) {
    let hit = null;
    for (let L = Math.min(6, s.length - i); L >= 1; L--) {
      const t = s.substr(i, L);
      if (L === 1 ? z.soloSet.has(t) : (z.words[t] || z.segSet.has(t))) { hit = t; break; }
    }
    if (!hit) { i++; continue; }
    if (z.words[hit] && !(MW.has(hit) && i > 0 && NUMISH.includes(s[i - 1]))) out.push(hit);
    i += hit.length;
  }
  return out;
}

function zhSentencePics(text, { max, minChars, skip }) {
  const han = (String(text).match(/[\u4e00-\u9fff]/g) || []).length;
  if (han < minChars) return null;
  const strip = h('div.pic-strip');
  loadPics('zh').then((z) => {
    if (!z) { strip.remove(); return; }
    const seen = new Set();
    const skipName = skip ? picName(skip, 'zh') : null;
    let n = 0;
    for (const w of zhPicWords(text, z)) {
      if (n >= max) break;
      const name = z.words[w];
      if (seen.has(name) || name === skipName) continue;
      seen.add(name);
      strip.append(h('div.pic-mini', { style: { background: tint(w) } }, svg(name, 34, z), h('span.cn', w)));
      n++;
    }
    if (!n) strip.remove();
  });
  return strip;
}

/** Dải tranh nhỏ cho câu: mỗi tranh kèm từ tiếng Anh ở dưới, tối đa `max` tranh. */
export function sentencePics(text, { max = 3, minWords = 4, minChars = 5, skip = '', lang = 'en' } = {}) {
  if (!picsOn()) return null;
  if (lang === 'zh') return zhSentencePics(text, { max, minChars, skip });
  const words = String(text).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || [];
  if (words.length < minWords) return null;
  const strip = h('div.pic-strip');
  loadPics().then(() => {
    if (!data) { strip.remove(); return; }
    const seen = new Set();
    const skipName = skip ? picName(skip) : null;
    let n = 0;
    for (const w of words) {
      if (n >= max) break;
      if (STOP.has(w) || LIGHT.has(w) || w.length < 3) continue;
      const name = picName(w);
      if (!name || seen.has(name) || name === skipName) continue;
      seen.add(name);
      strip.append(h('div.pic-mini', { style: { background: tint(w) } }, svg(name, 34), h('span', w)));
      n++;
    }
    if (!n) strip.remove();
  });
  return strip;
}
