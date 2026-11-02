/* Đọc số và tiền: gộp công cụ của ATLAS, bảng tiền của Hub và bảng số của Song Ngữ. */

import * as content from '../content.js';
import * as audio from '../audio.js';
import { sayEn, sayBtn } from '../kit.js';
import { h, section } from '../ui.js';

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function below1000(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? `-${ONES[n % 10]}` : '');
  return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${below1000(n % 100)}` : ''}`;
}

export function enWords(n) {
  if (n === 0) return 'zero';
  const parts = [];
  [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']].forEach(([v, name]) => {
    if (n >= v) { parts.push(`${below1000(Math.floor(n / v))} ${name}`); n %= v; }
  });
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}

const ZH_D = '零一二三四五六七八九';

function zhBelow10k(n) {
  let s = '';
  let zero = false;
  [[1000, '千'], [100, '百'], [10, '十'], [1, '']].forEach(([v, u]) => {
    const d = Math.floor(n / v) % 10;
    if (d) { if (zero && s) s += '零'; s += ZH_D[d] + u; zero = false; } else if (s) zero = true;
  });
  return s;
}

export function zhWords(n) {
  if (n === 0) return '零';
  let s = '';
  const yi = Math.floor(n / 1e8), wan = Math.floor((n % 1e8) / 1e4), rest = n % 1e4;
  if (yi) s += `${zhBelow10k(yi)}亿`;
  if (wan) s += (yi && wan < 1000 ? '零' : '') + zhBelow10k(wan) + '万';
  if (rest) s += ((yi || wan) && rest < 1000 ? '零' : '') + zhBelow10k(rest);
  return s.replace(/^一十/, '十');
}

const VI_D = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

function viBelow1000(n, full) {
  const tr = Math.floor(n / 100), ch = Math.floor((n % 100) / 10), dv = n % 10;
  const out = [];
  if (tr || full) out.push(`${VI_D[tr]} trăm`);
  if (ch > 1) out.push(`${VI_D[ch]} mươi`);
  else if (ch === 1) out.push('mười');
  else if (dv && (tr || full)) out.push('lẻ');
  if (dv) out.push(ch > 1 && dv === 1 ? 'mốt' : ch >= 1 && dv === 5 ? 'lăm' : VI_D[dv]);
  return out.join(' ');
}

export function viWords(n) {
  if (n === 0) return 'không';
  const groups = [[1e9, 'tỉ'], [1e6, 'triệu'], [1e3, 'nghìn']];
  const out = [];
  let rest = n;
  for (const [v, name] of groups) {
    if (rest >= v) {
      out.push(`${viBelow1000(Math.floor(rest / v), out.length > 0)} ${name}`);
      rest %= v;
    }
  }
  if (rest) out.push(viBelow1000(rest, out.length > 0));
  return out.join(' ');
}

/* "$12.50", "150.000đ", "2,5 triệu", "50k", "1,000,000" → số và đơn vị tiền */
function parse(raw) {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  const cur = /\$|usd|đô/.test(t) ? 'usd' : /đ|vnd|đồng/.test(t) ? 'vnd' : null;
  const unit = /triệu|tr\b/.test(t) ? 1e6 : /tỉ|tỷ/.test(t) ? 1e9 : /nghìn|ngàn|k\b/.test(t) ? 1e3 : 1;
  let num = t.replace(/[^0-9.,]/g, '');
  if (!num) return null;
  const lastSep = Math.max(num.lastIndexOf('.'), num.lastIndexOf(','));
  const afterSep = lastSep >= 0 ? num.length - lastSep - 1 : 0;
  let value;
  if (lastSep >= 0 && afterSep !== 3) {
    value = Number(`${num.slice(0, lastSep).replace(/[.,]/g, '')}.${num.slice(lastSep + 1)}`);
  } else {
    value = Number(num.replace(/[.,]/g, ''));
  }
  return Number.isFinite(value) ? { value: value * unit, cur } : null;
}

function readEn(p) {
  const whole = Math.floor(p.value);
  const cents = Math.round((p.value - whole) * 100);
  if (p.cur === 'usd') return `${enWords(whole)} dollar${whole === 1 ? '' : 's'}${cents ? ` and ${enWords(cents)} cent${cents === 1 ? '' : 's'}` : ''}`;
  if (p.cur === 'vnd') return `${enWords(whole)} dong`;
  if (cents) return `${enWords(whole)} point ${String(cents).padStart(2, '0').split('').map((d) => ONES[d]).join(' ')}`;
  return enWords(whole);
}

function readZh(p) {
  const whole = Math.floor(p.value);
  if (p.cur === 'usd') return `${zhWords(whole)}美元`;
  if (p.cur === 'vnd') return `${zhWords(whole)}越南盾`;
  return zhWords(whole);
}

function readVi(p) {
  const whole = Math.floor(p.value);
  return `${viWords(whole)}${p.cur === 'usd' ? ' đô la' : p.cur === 'vnd' ? ' đồng' : ''}`;
}

export async function render() {
  const [w, t] = await Promise.all([content.work(), content.topics()]);
  const input = h('input.scribble', { value: '$12.50', placeholder: 'Nhập số hoặc giá tiền', inputmode: 'text' });
  const out = h('div');
  let rate = 25000;
  const rateInput = h('input.scribble.sm', {
    type: 'number', value: String(rate), oninput: (e) => { rate = Number(e.target.value) || rate; draw(); },
  });

  function draw() {
    const p = parse(input.value);
    if (!p) { out.replaceChildren(h('p.small.faint', 'Chưa đọc được số này. Thử $12.50, 150.000đ, 2,5 triệu, 50k.')); return; }
    const en = readEn(p), zh = readZh(p), vi = readVi(p);
    let conv = null;
    if (p.cur === 'usd') conv = `≈ ${Math.round(p.value * rate).toLocaleString('vi-VN')} đồng`;
    if (p.cur === 'vnd') conv = `≈ ${(p.value / rate).toLocaleString('en-US', { maximumFractionDigits: 2 })} đô la`;
    out.replaceChildren(
      h('div.num-row', h('div.grow', h('div.small.faint', 'Tiếng Anh'), h('b', en)), sayBtn(en)),
      h('div.num-row', h('div.grow', h('div.small.faint', 'Tiếng Trung'), h('b.cn', zh)), sayBtn(zh, 'zh')),
      h('div.num-row', h('div.grow', h('div.small.faint', 'Tiếng Việt'), h('b', vi))),
      conv ? h('div.small.muted', { style: { marginTop: '6px' } }, conv) : null,
    );
  }
  input.addEventListener('input', draw);
  draw();

  const examples = ['$4.99', '$1,250', '150.000đ', '2,5 triệu', '50k', '1,000,000', '2026', '90'];

  return {
    title: 'Đọc số và tiền',
    el: h('div.stack',
      h('div.card', input,
        h('div.row.wrap', { style: { gap: '6px', margin: '8px 0' } }, ...examples.map((x) => h('button.chip', {
          onclick: () => { input.value = x; draw(); },
        }, x))),
        out),
      section('Tỉ giá để quy đổi', h('div.card',
        h('div.row', h('span.small', '1 đô la ='), rateInput, h('span.small', 'đồng')),
        h('p.small.faint', { style: { margin: '6px 0 0' } }, 'Con số tham khảo, tự sửa theo tỉ giá hiện tại.'))),
      section('Các mức giá thường gặp', h('div.card', ...w.currency.map((r) => h('div.num-row',
        h('div.grow', h('b', `${r.vnd.toLocaleString('vi-VN')}đ · $${r.usd.toLocaleString('en-US')}`), h('div.small.faint', r.lbl)),
        h('button.btn.sm', { onclick: () => sayEn(`${enWords(r.vnd)} dong, about ${enWords(r.usd)} dollars`) }, '🔊'),
      )))),
      ...t.ref.map((s) => section(s.title, h('div.card',
        s.note ? h('p.small.faint', s.note) : null,
        ...s.rows.map((r) => h('div.ref-row',
          h('span.ref-key', r[0]),
          h('span.grow', h('b', r[1]), r[2] ? h('span.small.faint', ` ${r[2]}`) : null),
          h('button.speak-btn', { onclick: () => sayEn(r[1]) }, '🔊'),
          h('span.grow', h('b.cn', r[3]), r[4] ? h('span.small.faint', ` ${r[4]}`) : null),
          h('button.speak-btn', { onclick: () => audio.speak(r[3], { lang: 'zh', rate: 0.85 }) }, '🔊'),
        ))))),
    ),
  };
}
