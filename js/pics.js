/* Tranh minh hoạ cho từ và câu tiếng Anh, theo kiểu thẻ học (flashcard).
   Icon: Fluent Emoji Flat (MIT, Microsoft), dựng sẵn ở data/pics/en.json bằng tools/build-pics.mjs.
   Tải lười: chỉ nạp file tranh lần đầu cần dùng. */
import { h } from './ui.js';

let data = null;
let loading = null;

export function loadPics() {
  if (data) return Promise.resolve(data);
  if (!loading) {
    loading = fetch('data/pics/en.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { data = j; return j; })
      .catch(() => { loading = null; return null; });
  }
  return loading;
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
export function picName(word) {
  if (!data) return null;
  const w = String(word).toLowerCase().trim();
  if (data.words[w]) return data.words[w];
  if (w.includes(' ')) return null;
  for (const c of candidates(w)) if (data.words[c]) return data.words[c];
  return null;
}

function svg(name, size) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  el.setAttribute('viewBox', `0 0 ${data.size} ${data.size}`);
  el.setAttribute('width', size);
  el.setAttribute('height', size);
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = data.icons[name];
  return el;
}

/* Màu nền ô tranh: cố định theo từ, kiểu thẻ màu trong sách học. */
const TINTS = ['#fde2d8', '#dff0e9', '#fbf0d8', '#e3e8fb', '#f6e1ef', '#e2f3f7', '#efe8da', '#e9f5d9'];
const tint = (w) => { let x = 0; for (const c of w) x = (x * 31 + c.charCodeAt(0)) >>> 0; return TINTS[x % TINTS.length]; };

/** Ô tranh lớn cho một từ. Không có tranh thì ô tự bỏ đi. */
export function wordPic(word, { size = 88 } = {}) {
  const box = h('div.pic-tile', { style: { background: tint(String(word).toLowerCase()) } });
  if (!picsOn()) return null;
  loadPics().then(() => {
    const n = picName(word);
    if (!n) { box.remove(); return; }
    box.append(svg(n, size));
  });
  return box;
}

/** Dải tranh nhỏ cho câu: mỗi tranh kèm từ tiếng Anh ở dưới, tối đa `max` tranh. */
export function sentencePics(text, { max = 3, minWords = 4, skip = '' } = {}) {
  if (!picsOn()) return null;
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
