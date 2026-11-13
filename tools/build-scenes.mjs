// Vẽ tranh minh hoạ cho từng chương truyện, theo lối truyện tranh bảng màu hạn chế:
// xanh navy – xanh ngọc đơn sắc, một màu nhấn đỏ, nét mực, hạt nhiễu như bản in.
// Mỗi cảnh mô tả bằng vài dòng trong data-src/scenes-en.txt, xuất ra img/scenes/<truyện>-<chương>.svg.
// Cách chạy: node tools/build-scenes.mjs [id-truyện ...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const W = 800, H = 450;
const C = {
  ink: '#0b1630', night: '#132a4c', deep: '#1d4762', mid: '#3c7387', soft: '#8bbac0',
  pale: '#d6eae7', snow: '#eef6f3', red: '#e0442a', redDark: '#a42f1d', glow: '#f4f1d0',
};
const col = (v, d) => (v ? (C[v] || v) : d);

/* ---------- tiện ích ---------- */
let rnd = Math.random;
function seed(str) {
  let a = 0; for (const c of str) a = (a * 31 + c.charCodeAt(0)) >>> 0;
  rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const X = (v) => (Number(v) / 100) * W;
const Y = (v) => (Number(v) / 100) * H;
const f = (n) => Math.round(n * 10) / 10;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const STROKE = `stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`;
const g = (o, inner) => {
  const s = Number(o.s || 1);
  const fl = o.flip ? -1 : 1;
  return `<g transform="translate(${f(X(o.x ?? 50))} ${f(Y(o.y ?? 80))}) scale(${f(s * fl * 100) / 100} ${s})">${inner}</g>`;
};

/* ---------- nền ---------- */
const R = {};
R.sky = (o) => {
  const t = o.t || 'night';
  const stops = {
    night: [C.ink, C.night, C.deep],
    dusk: [C.night, C.mid, C.soft],
    day: [C.soft, C.pale, C.snow],
    dawn: [C.deep, C.soft, C.pale],
    dark: [C.ink, C.ink, C.night],
  }[t] || [C.ink, C.night, C.deep];
  const id = 'sk' + Math.floor(rnd() * 1e6);
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${stops[0]}"/><stop offset=".6" stop-color="${stops[1]}"/><stop offset="1" stop-color="${stops[2]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
};
R.stars = (o) => {
  let s = '';
  const n = Number(o.n || 70), top = Y(o.top ?? 0), bot = Y(o.bottom ?? 60);
  for (let i = 0; i < n; i++) {
    const r = rnd() < 0.12 ? 1.8 : 0.9 + rnd() * 0.6;
    s += `<circle cx="${f(rnd() * W)}" cy="${f(top + rnd() * (bot - top))}" r="${f(r)}" fill="${C.pale}" opacity="${f(0.45 + rnd() * 0.5)}"/>`;
  }
  return s;
};
R.moon = (o) => `<circle cx="${X(o.x ?? 75)}" cy="${Y(o.y ?? 20)}" r="${o.r || 34}" fill="${o.red ? C.red : o.dark ? C.ink : C.pale}"/>` +
  (o.dark ? '' : `<circle cx="${X(o.x ?? 75) - 10}" cy="${Y(o.y ?? 20) - 6}" r="${(o.r || 34) * 0.18}" fill="${o.red ? C.redDark : C.soft}" opacity=".5"/>`);
R.sun = (o) => `<circle cx="${X(o.x ?? 80)}" cy="${Y(o.y ?? 22)}" r="${o.r || 30}" fill="${o.red ? C.red : C.glow}" opacity=".95"/>`;
R.clouds = (o) => {
  let s = '';
  for (let i = 0; i < Number(o.n || 3); i++) {
    const cx = rnd() * W, cy = Y(o.y ?? 18) + rnd() * 40, w = 60 + rnd() * 80;
    s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(w)}" ry="${f(w * 0.12)}" fill="${C.snow}" opacity=".55"/>`;
  }
  return s;
};
R.hills = (o) => {
  const y = Y(o.y ?? 70), c = col(o.c, C.deep);
  let d = `M0 ${H} L0 ${y}`;
  for (let x = 0; x <= W; x += 80) d += ` Q${x + 40} ${f(y - 20 - rnd() * 40)} ${x + 80} ${f(y - rnd() * 15)}`;
  return `<path d="${d} L${W} ${H} Z" fill="${c}"/>`;
};
function pine(x, base, h, c) {
  const w = h * 0.36;
  let d = '';
  for (let i = 0; i < 4; i++) {
    const top = base - h + i * h * 0.2, bw = w * (0.45 + i * 0.2);
    d += `M${f(x)} ${f(top)} L${f(x - bw)} ${f(top + h * 0.32)} L${f(x + bw)} ${f(top + h * 0.32)} Z `;
  }
  return `<path d="${d}" fill="${c}"/><rect x="${f(x - 3)}" y="${f(base - h * 0.06)}" width="6" height="${f(h * 0.08)}" fill="${c}"/>`;
}
R.pines = (o) => {
  const base = Y(o.y ?? 75), c = col(o.c, C.deep), hmax = Number(o.h || 150), n = Number(o.n || 14);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (i + rnd() * 0.8) * (W / n);
    s += pine(x, base + rnd() * 10, hmax * (0.6 + rnd() * 0.5), c);
  }
  return s + `<rect x="0" y="${f(base + 4)}" width="${W}" height="${f(H - base)}" fill="${c}"/>`;
};
R.ground = (o) => `<rect x="0" y="${f(Y(o.y ?? 80))}" width="${W}" height="${f(H - Y(o.y ?? 80))}" fill="${col(o.c, C.snow)}"/>` +
  (o.line === 'no' ? '' : `<line x1="0" y1="${f(Y(o.y ?? 80))}" x2="${W}" y2="${f(Y(o.y ?? 80))}" stroke="${C.ink}" stroke-width="2"/>`);
R.wall = (o) => {
  const fy = Y(o.floor ?? 78);
  return `<rect width="${W}" height="${H}" fill="${col(o.c, C.mid)}"/><rect y="${f(fy)}" width="${W}" height="${f(H - fy)}" fill="${col(o.fc, C.deep)}"/><line x1="0" y1="${f(fy)}" x2="${W}" y2="${f(fy)}" stroke="${C.ink}" stroke-width="3"/>` +
    (o.planks ? Array.from({ length: 14 }, (_, i) => `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="${f(fy)}" stroke="${C.ink}" stroke-opacity=".18" stroke-width="2"/>`).join('') : '');
};
R.sea = (o) => {
  const y = Y(o.y ?? 70);
  let s = `<rect y="${f(y)}" width="${W}" height="${f(H - y)}" fill="${col(o.c, C.deep)}"/>`;
  for (let i = 0; i < 9; i++) {
    const yy = y + 8 + i * ((H - y) / 9), x0 = rnd() * 200;
    s += `<path d="M${f(x0)} ${f(yy)} q20 -6 40 0 t40 0 t40 0" fill="none" stroke="${C.soft}" stroke-width="2" opacity=".5"/>`;
    s += `<path d="M${f(x0 + 380)} ${f(yy + 6)} q20 -6 40 0 t40 0" fill="none" stroke="${C.soft}" stroke-width="2" opacity=".4"/>`;
  }
  return s;
};
R.city = (o) => {
  const base = Y(o.y ?? 80), c = col(o.c, C.night);
  let s = '', x = -10;
  while (x < W) {
    const w = 40 + rnd() * 60, h = 60 + rnd() * Number(o.h || 160);
    s += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(w)}" height="${f(h)}" fill="${c}"/>`;
    for (let wy = base - h + 10; wy < base - 12; wy += 16) {
      for (let wx = x + 7; wx < x + w - 8; wx += 12) {
        if (rnd() < 0.3) s += `<rect x="${f(wx)}" y="${f(wy)}" width="5" height="7" fill="${rnd() < 0.08 ? C.red : C.glow}" opacity=".8"/>`;
      }
    }
    x += w + 4;
  }
  return s + `<rect y="${f(base)}" width="${W}" height="${f(H - base)}" fill="${c}"/>`;
};
R.deep = (o = {}) => {
  const x0 = X(o.from ?? 0);
  let s = `<defs><linearGradient id="dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.mid}"/><stop offset=".45" stop-color="${C.deep}"/><stop offset="1" stop-color="${C.ink}"/></linearGradient></defs><rect x="${x0}" width="${W - x0}" height="${H}" fill="url(#dp)"/>` + (x0 ? `<line x1="${x0}" y1="0" x2="${x0}" y2="${H}" stroke="${C.ink}" stroke-width="8"/>` : '');
  for (let i = 0; i < 5; i++) {
    const x = x0 + 40 + i * ((W - x0) / 5) + rnd() * 30;
    s += `<path d="M${f(x)} 0 L${f(x + 50)} 0 L${f(x + 140)} ${H} L${f(x + 60)} ${H} Z" fill="${C.pale}" opacity=".06"/>`;
  }
  for (let i = 0; i < 60; i++) s += `<circle cx="${f(x0 + rnd() * (W - x0))}" cy="${f(rnd() * H)}" r="${f(0.8 + rnd() * 1.4)}" fill="${C.pale}" opacity="${f(0.2 + rnd() * 0.4)}"/>`;
  return s;
};
R.seafloor = (o) => {
  const y = Y(o.y ?? 82), x0 = X(o.from ?? 0);
  let d = `M${x0} ${H} L${x0} ${y}`;
  for (let x = x0; x <= W; x += 50) d += ` L${x + 25} ${f(y - rnd() * 18)} L${x + 50} ${f(y + rnd() * 6)}`;
  return `<path d="${d} L${W} ${H} Z" fill="${C.ink}"/>`;
};
R.rays = () => {
  let s = '';
  for (let i = 0; i < 6; i++) s += `<path d="M${W / 2} -20 L${f(i * 160 - 40)} ${H} L${f(i * 160 + 30)} ${H} Z" fill="${C.glow}" opacity=".07"/>`;
  return s;
};
R.vignette = () => `<defs><radialGradient id="vg" cx=".5" cy=".5" r=".75"><stop offset=".6" stop-color="${C.ink}" stop-opacity="0"/><stop offset="1" stop-color="${C.ink}" stop-opacity=".55"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#vg)"/>`;
R.spot = (o) => `<ellipse cx="${X(o.x ?? 50)}" cy="${Y(o.y ?? 50)}" rx="${o.r || 160}" ry="${(o.r || 160) * 0.8}" fill="${C.glow}" opacity="${o.a || 0.12}"/>`;

/* ---------- đồ vật ---------- */
R.window = (o) => {
  const x = X(o.x ?? 20), y = Y(o.y ?? 20), w = Number(o.w || 150), h = Number(o.h || 110);
  const inside = o.t === 'day' ? C.pale : C.ink;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${inside}" ${STROKE}/>`;
  if (o.t !== 'day') { for (let i = 0; i < 10; i++) s += `<circle cx="${f(x + 8 + rnd() * (w - 16))}" cy="${f(y + 8 + rnd() * (h - 16))}" r="1.2" fill="${C.pale}"/>`; }
  if (o.moon) s += `<circle cx="${x + w * 0.7}" cy="${y + h * 0.35}" r="${h * 0.16}" fill="${o.moon === 'red' ? C.red : C.pale}"/>`;
  if (o.city) for (let i = 0; i < 6; i++) { const bw = w / 6; const bh = 15 + rnd() * h * 0.4; s += `<rect x="${f(x + i * bw)}" y="${f(y + h - bh)}" width="${f(bw - 2)}" height="${f(bh)}" fill="${C.night}"/>`; }
  return s + `<line x1="${x + w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y + h}" ${STROKE}/><line x1="${x}" y1="${y + h / 2}" x2="${x + w}" y2="${y + h / 2}" ${STROKE}/>`;
};
R.desk = (o) => g(o, `<rect x="-${(o.w || 220) / 2}" y="-70" width="${o.w || 220}" height="12" fill="${col(o.c, C.night)}" ${STROKE}/><rect x="-${(o.w || 220) / 2 - 10}" y="-58" width="8" height="58" fill="${C.night}" ${STROKE}/><rect x="${(o.w || 220) / 2 - 18}" y="-58" width="8" height="58" fill="${C.night}" ${STROKE}/>`);
R.chair = (o) => g(o, `<rect x="-22" y="-48" width="44" height="8" fill="${C.night}" ${STROKE}/><rect x="16" y="-100" width="7" height="60" fill="${C.night}" ${STROKE}/><rect x="-20" y="-40" width="6" height="40" fill="${C.night}" ${STROKE}/><rect x="14" y="-40" width="6" height="40" fill="${C.night}" ${STROKE}/>`);
function screenContent(kind, w, h, o) {
  const mid = h / 2;
  if (kind === 'flat') return `<line x1="8" y1="${mid}" x2="${w - 8}" y2="${mid}" stroke="${C.soft}" stroke-width="2.5"/>`;
  if (kind === 'pulse') {
    const u = (w - 16) / 18;
    let d = `M8 ${mid} l${f(u)} 0`;
    for (const k of [1, 1, 1, 3]) d += ` l${f(u * 0.4)} -${f(h * 0.3)} l${f(u * 0.4 * k)} 0 l0 ${f(h * 0.3)} l${f(u * 0.6)} 0`;
    d += ` L${w - 8} ${mid}`;
    return `<path d="${d}" fill="none" stroke="${C.red}" stroke-width="3"/>`;
  }
  if (kind === 'chart') {
    let s = '';
    for (let i = 0; i < 6; i++) { const bh = (h - 20) * (0.2 + i * 0.13); s += `<rect x="${f(10 + i * (w - 20) / 6)}" y="${f(h - 8 - bh)}" width="${f((w - 20) / 6 - 6)}" height="${f(bh)}" fill="${i === 5 ? C.red : C.soft}"/>`; }
    return s;
  }
  if (kind === 'curve') return `<path d="M10 ${h - 10} Q${w * 0.6} ${h - 14} ${w - 10} 10" fill="none" stroke="${C.red}" stroke-width="3"/>`;
  if (kind === 'code' || kind === 'text') {
    let s = '';
    for (let i = 0; i < Math.floor((h - 12) / 11); i++) s += `<rect x="${10 + (kind === 'code' ? (i % 3) * 10 : 0)}" y="${10 + i * 11}" width="${f(20 + rnd() * (w - 50))}" height="4" fill="${C.soft}" opacity=".8"/>`;
    return s;
  }
  if (kind === 'map') return `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" fill="${C.deep}"/><path d="M8 ${h - 8} L${w - 8} 8" stroke="${C.soft}" stroke-width="4"/><circle cx="${w * 0.7}" cy="${h * 0.32}" r="6" fill="${C.red}"/>`;
  if (kind === 'face') return `<circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.28}" fill="${C.soft}"/><circle cx="${w / 2 - h * 0.1}" cy="${h / 2 - 3}" r="3" fill="${C.ink}"/><circle cx="${w / 2 + h * 0.1}" cy="${h / 2 - 3}" r="3" fill="${C.ink}"/>`;
  if (kind === 'eye') return `<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w * 0.3}" ry="${h * 0.22}" fill="${C.pale}"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.15}" fill="${C.red}"/><circle cx="${w / 2}" cy="${h / 2}" r="${h * 0.06}" fill="${C.ink}"/>`;
  return '';
}
R.screen = (o) => {
  const w = Number(o.w || 120), h = Number(o.h || 80);
  let s = `<rect x="${-w / 2}" y="${-h - 22}" width="${w}" height="${h}" rx="4" fill="${C.ink}" ${STROKE}/>`;
  s += `<g transform="translate(${-w / 2} ${-h - 22})">${screenContent(o.show || 'flat', w, h, o)}`;
  if (o.text) s += `<text x="${w / 2}" y="${h - 10}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="${o.fs || 13}" fill="${o.tc ? col(o.tc) : C.pale}">${esc(o.text)}</text>`;
  s += `</g><rect x="-6" y="-22" width="12" height="16" fill="${C.night}" ${STROKE}/><rect x="-22" y="-8" width="44" height="8" rx="2" fill="${C.night}" ${STROKE}/>`;
  return g(o, s) + (o.glow ? `<ellipse cx="${X(o.x ?? 50)}" cy="${Y(o.y ?? 80) - h / 2 - 22}" rx="${w}" ry="${h}" fill="${C.glow}" opacity=".08"/>` : '');
};
R.laptop = (o) => g(o, `<path d="M-40 -6 L40 -6 L50 0 L-50 0 Z" fill="${C.night}" ${STROKE}/><rect x="-36" y="-58" width="72" height="50" rx="3" fill="${C.ink}" ${STROKE}/><g transform="translate(-36 -58)">${screenContent(o.show || 'text', 72, 50)}</g>`);
R.phone = (o) => g(o, `<rect x="-11" y="-38" width="22" height="38" rx="4" fill="${C.ink}" ${STROKE}/><rect x="-7" y="-33" width="14" height="26" fill="${o.red ? C.red : C.soft}"/>`) +
  (o.glow ? `<circle cx="${X(o.x ?? 50)}" cy="${Y(o.y ?? 80) - 20}" r="40" fill="${C.glow}" opacity=".12"/>` : '');
R.book = (o) => g(o, o.open
  ? `<path d="M0 -6 Q-28 -16 -56 -8 L-56 -46 Q-28 -54 0 -44 Z" fill="${C.snow}" ${STROKE}/><path d="M0 -6 Q28 -16 56 -8 L56 -46 Q28 -54 0 -44 Z" fill="${C.pale}" ${STROKE}/>` +
    Array.from({ length: 4 }, (_, i) => `<line x1="-48" y1="${-38 + i * 7}" x2="-10" y2="${-40 + i * 7}" stroke="${o.red ? C.red : C.mid}" stroke-width="2"/><line x1="10" y1="${-40 + i * 7}" x2="48" y2="${-38 + i * 7}" stroke="${C.mid}" stroke-width="2"/>`).join('')
  : `<rect x="-26" y="-14" width="52" height="14" fill="${o.red ? C.red : C.mid}" ${STROKE}/><line x1="-20" y1="-7" x2="20" y2="-7" stroke="${C.pale}" stroke-width="2"/>`);
R.books = (o) => { let s = ''; const n = Number(o.n || 4); for (let i = 0; i < n; i++) s += `<rect x="-30" y="${-14 - i * 14}" width="${56 + (i % 2) * 6}" height="13" fill="${i === Number(o.redIndex ?? -1) ? C.red : [C.mid, C.deep, C.soft][i % 3]}" ${STROKE}/>`; return g(o, s); };
R.paper = (o) => {
  const w = Number(o.w || 90), h = Number(o.h || 110);
  let s = `<rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="${C.snow}" ${STROKE} transform="rotate(${o.rot || -4})"/>`;
  if (o.text) {
    const ls = String(o.text).split('/'), fs2 = Number(o.fs || 20);
    ls.forEach((l, i) => { s += `<text x="0" y="${f(-h / 2 + (i - (ls.length - 1) / 2) * fs2 * 1.2 + fs2 * 0.35)}" text-anchor="middle" font-family="Courier New, monospace" font-weight="700" font-size="${fs2}" fill="${C.ink}" transform="rotate(${o.rot || -4})">${esc(l)}</text>`; });
    if (o.circle) s += `<ellipse cx="0" cy="${-h / 2 - 6}" rx="${w * 0.42}" ry="${(o.fs || 20) * 0.95}" fill="none" stroke="${C.red}" stroke-width="3" transform="rotate(${o.rot || -4})"/>`;
  } else {
    for (let i = 0; i < Math.floor(h / 14) - 1; i++) s += `<line x1="${-w / 2 + 10}" y1="${-h + 16 + i * 13}" x2="${f(-w / 2 + 14 + rnd() * (w - 30))}" y2="${-h + 16 + i * 13}" stroke="${C.mid}" stroke-width="2" transform="rotate(${o.rot || -4})"/>`;
  }
  if (o.stamp) s += `<rect x="${w / 2 - 34}" y="${-30}" width="26" height="18" fill="none" stroke="${C.red}" stroke-width="3" transform="rotate(${(o.rot || -4) + 10})"/>`;
  return g(o, s);
};
R.shelf = (o) => {
  const w = Number(o.w || 200);
  let s = '';
  for (let r = 0; r < Number(o.rows || 3); r++) {
    const y = -r * 46;
    s += `<rect x="${-w / 2}" y="${y - 4}" width="${w}" height="6" fill="${C.night}" ${STROKE}/>`;
    let x = -w / 2 + 6;
    while (x < w / 2 - 14) {
      const bw = 8 + rnd() * 10, bh = 26 + rnd() * 12;
      s += `<rect x="${f(x)}" y="${f(y - 4 - bh)}" width="${f(bw)}" height="${f(bh)}" fill="${rnd() < 0.06 ? C.red : [C.deep, C.mid, C.soft][Math.floor(rnd() * 3)]}" stroke="${C.ink}" stroke-width="1.5"/>`;
      x += bw + 1;
    }
  }
  return g(o, s);
};
R.lamp = (o) => g(o, `<path d="M-60 0 L-18 -88 L18 -88 L60 0 Z" fill="${C.glow}" opacity=".16"/><path d="M-16 -88 L16 -88 L10 -104 L-10 -104 Z" fill="${o.red ? C.red : C.mid}" ${STROKE}/><line x1="0" y1="-104" x2="0" y2="-200" stroke="${C.ink}" stroke-width="3"/>`);
R.cup = (o) => g(o, `<rect x="-11" y="-24" width="22" height="24" rx="3" fill="${o.red ? C.red : C.pale}" ${STROKE}/><path d="M11 -18 q9 0 9 7 t-9 7" fill="none" ${STROKE}/>` + (o.steam ? `<path d="M-4 -30 q-6 -8 0 -16 t0 -16 M5 -30 q-6 -8 0 -16" fill="none" stroke="${C.pale}" stroke-width="2" opacity=".7"/>` : ''));
R.dish = (o) => g(o, `<path d="M-90 -150 Q0 -40 90 -150 Q0 -110 -90 -150 Z" fill="${C.pale}" ${STROKE}/><line x1="0" y1="-115" x2="0" y2="-178" ${STROKE}/><circle cx="0" cy="-180" r="6" fill="${o.red ? C.red : C.soft}" ${STROKE}/><path d="M-10 -110 L-30 0 M10 -110 L30 0 M-24 -40 L24 -40" fill="none" ${STROKE}/>`);
R.waves = (o) => g(o, [1, 2, 3].map((i) => `<path d="M${-i * 22} ${-i * 22} Q0 ${-i * 34} ${i * 22} ${-i * 22}" fill="none" stroke="${o.red ? C.red : C.pale}" stroke-width="3" opacity="${1 - i * 0.22}"/>`).join(''));
R.station = (o) => g(o, `<rect x="-90" y="-80" width="180" height="80" fill="${C.night}" ${STROKE}/><path d="M-100 -80 L0 -125 L100 -80 Z" fill="${C.deep}" ${STROKE}/><rect x="-60" y="-60" width="40" height="30" fill="${o.lit === 'no' ? C.ink : C.glow}" ${STROKE}/><rect x="30" y="-48" width="26" height="48" fill="${C.ink}" ${STROKE}/>`);
R.house = (o) => g(o, `<rect x="-70" y="-70" width="140" height="70" fill="${col(o.c, C.night)}" ${STROKE}/><path d="M-82 -70 L0 -128 L82 -70 Z" fill="${C.deep}" ${STROKE}/><rect x="-14" y="-40" width="28" height="40" fill="${o.red ? C.red : C.ink}" ${STROKE}/><rect x="-55" y="-55" width="26" height="22" fill="${C.glow}" ${STROKE}/>`);
R.garage = (o) => g(o, `<rect x="-200" y="-200" width="400" height="200" fill="${C.deep}" ${STROKE}/><path d="M-215 -200 L0 -250 L215 -200 Z" fill="${C.night}" ${STROKE}/><rect x="-150" y="-150" width="300" height="150" fill="${C.ink}" ${STROKE}/>` +
  Array.from({ length: 5 }, (_, i) => `<line x1="-150" y1="${-150 + i * 9}" x2="150" y2="${-150 + i * 9}" stroke="${C.mid}" stroke-width="2"/>`).join('') +
  (o.text ? `<rect x="-90" y="-196" width="180" height="30" fill="${C.pale}" ${STROKE}/><text x="0" y="-175" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="16" fill="${C.ink}">${esc(o.text)}</text>` : ''));
R.toolboard = (o) => g(o, `<rect x="-90" y="-80" width="180" height="80" fill="${C.night}" ${STROKE}/><path d="M-70 -60 l0 40 M-50 -60 l10 40 M-20 -65 l0 45 M10 -60 a8 8 0 1 0 0.1 0 M40 -62 l0 42 M60 -60 l14 30" fill="none" stroke="${C.soft}" stroke-width="4" stroke-linecap="round"/>`);
R.car = (o) => {
  const c = col(o.c, C.night);
  return g(o, `<path d="M-120 -24 L-112 -52 L-60 -58 L-34 -86 L46 -86 L78 -58 L118 -50 L124 -24 Z" fill="${c}" ${STROKE}/><path d="M-26 -78 L-2 -78 L-2 -58 L-50 -58 Z M8 -78 L40 -78 L62 -58 L8 -58 Z" fill="${C.soft}" ${STROKE}/>` +
    `<circle cx="-70" cy="-22" r="22" fill="${C.ink}" ${STROKE}/><circle cx="-70" cy="-22" r="9" fill="${o.hot === 'back' ? C.red : C.mid}"/><circle cx="76" cy="-22" r="22" fill="${C.ink}" ${STROKE}/><circle cx="76" cy="-22" r="9" fill="${o.hot ? C.red : C.mid}"/>` +
    (o.leak ? `<ellipse cx="10" cy="2" rx="38" ry="5" fill="${C.ink}" opacity=".85"/><ellipse cx="10" cy="2" rx="12" ry="2.5" fill="${C.red}"/>` : ''));
};
R.sign = (o) => g(o, `<rect x="${-(o.w || 200) / 2}" y="-44" width="${o.w || 200}" height="44" rx="4" fill="${o.red ? C.red : C.pale}" ${STROKE}/><text x="0" y="-16" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${o.fs || 15}" fill="${o.red ? C.snow : C.ink}">${esc(o.text || '')}</text>`);
R.chess = (o) => {
  let s = `<path d="M-120 0 L120 0 L90 -70 L-90 -70 Z" fill="${C.pale}" ${STROKE}/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
    if ((r + c) % 2) continue;
    const y0 = -r * 17.5, y1 = y0 - 17.5;
    const wl = (y) => 120 - (-y / 70) * 30;
    const xa = (cc, y) => -wl(y) + (cc / 8) * 2 * wl(y);
    s += `<path d="M${f(xa(c, y0))} ${f(y0)} L${f(xa(c + 1, y0))} ${f(y0)} L${f(xa(c + 1, y1))} ${f(y1)} L${f(xa(c, y1))} ${f(y1)} Z" fill="${C.mid}"/>`;
  }
  const piece = (x, y, h, c) => `<path d="M${x - 9} ${y} L${x + 9} ${y} L${x + 5} ${y - h} L${x - 5} ${y - h} Z" fill="${c}" ${STROKE}/><circle cx="${x}" cy="${y - h - 6}" r="7" fill="${c}" ${STROKE}/>`;
  s += piece(-40, -26, 26, C.ink) + piece(10, -40, 30, o.red ? C.red : C.snow) + piece(50, -20, 22, C.ink) + piece(-70, -50, 20, C.snow);
  return g(o, s);
};
R.go = (o) => {
  let s = `<path d="M-130 0 L130 0 L100 -80 L-100 -80 Z" fill="${C.soft}" ${STROKE}/>`;
  for (let i = 1; i < 9; i++) { const y = -i * 9; const wl = 130 - (i / 9) * 30; s += `<line x1="${f(-wl)}" y1="${y}" x2="${f(wl)}" y2="${y}" stroke="${C.ink}" stroke-width="1"/>`; }
  for (let i = 1; i < 12; i++) s += `<line x1="${f(-130 + i * 21.6)}" y1="0" x2="${f(-100 + i * 16.6)}" y2="-80" stroke="${C.ink}" stroke-width="1"/>`;
  for (let i = 0; i < 16; i++) s += `<ellipse cx="${f(-100 + rnd() * 200)}" cy="${f(-8 - rnd() * 64)}" rx="6" ry="4" fill="${i % 2 ? C.ink : C.snow}" stroke="${C.ink}" stroke-width="1"/>`;
  if (o.red) s += `<ellipse cx="62" cy="-52" rx="7" ry="5" fill="${C.red}" ${STROKE}/>`;
  return g(o, s);
};
R.rack = (o) => {
  let s = `<rect x="-34" y="-190" width="68" height="190" fill="${C.ink}" ${STROKE}/>`;
  for (let i = 0; i < 11; i++) {
    s += `<rect x="-26" y="${-180 + i * 16}" width="52" height="11" fill="${C.night}"/>`;
    for (let k = 0; k < 3; k++) if (rnd() < 0.6) s += `<circle cx="${-20 + k * 6}" cy="${-174.5 + i * 16}" r="1.6" fill="${rnd() < 0.15 ? C.red : C.soft}"/>`;
  }
  return g(o, s);
};
R.racks = (o) => { let s = ''; const n = Number(o.n || 6); for (let i = 0; i < n; i++) s += R.rack({ x: 8 + i * (84 / (n - 1)), y: o.y ?? 85, s: o.s || 1 }); return s; };
R.pylon = (o) => g(o, `<path d="M-40 0 L-8 -200 L8 -200 L40 0 M-30 -60 L30 -60 M-20 -120 L20 -120 M-60 -170 L60 -170 M-28 -60 L20 -120 M28 -60 L-20 -120" fill="none" stroke="${C.ink}" stroke-width="4"/><path d="M-60 -170 Q200 -120 460 -170" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`);
R.tower = (o) => g(o, `<path d="M-60 0 Q-34 -80 -46 -170 L46 -170 Q34 -80 60 0 Z" fill="${C.pale}" ${STROKE}/><path d="M-30 -175 q-10 -30 10 -50 q20 -20 50 -10 q30 -30 60 0 q30 10 10 40" fill="${C.snow}" opacity=".8"/>`);
R.bolt = (o) => g(o, `<path d="M8 -120 L-24 -50 L-2 -50 L-18 0 L28 -72 L6 -72 L22 -120 Z" fill="${o.c ? col(o.c) : C.red}" ${STROKE}/>`);
R.flask = (o) => g(o, `<path d="M-12 -110 L12 -110 L12 -70 L50 -10 Q54 0 42 0 L-42 0 Q-54 0 -50 -10 L-12 -70 Z" fill="${C.pale}" fill-opacity=".85" ${STROKE}/><path d="M-36 -18 L36 -18 L44 -6 Q46 -2 40 -2 L-40 -2 Q-46 -2 -44 -6 Z" fill="${o.c ? col(o.c) : C.mid}"/>` + (o.spark ? `<path d="M-6 -60 L4 -46 L-4 -44 L6 -30" fill="none" stroke="${C.red}" stroke-width="3"/>` : ''));
R.helix = (o) => {
  let s = '';
  for (let i = 0; i < 26; i++) {
    const t = i / 25, x = -140 + t * 280, y1 = -60 + Math.sin(t * Math.PI * 4) * 34, y2 = -60 - Math.sin(t * Math.PI * 4) * 34;
    s += `<line x1="${f(x)}" y1="${f(y1)}" x2="${f(x)}" y2="${f(y2)}" stroke="${C.soft}" stroke-width="2"/>`;
  }
  const path = (k) => { let d = ''; for (let i = 0; i <= 60; i++) { const t = i / 60; d += `${i ? 'L' : 'M'}${f(-140 + t * 280)} ${f(-60 + k * Math.sin(t * Math.PI * 4) * 34)} `; } return d; };
  return g(o, s + `<path d="${path(1)}" fill="none" stroke="${C.pale}" stroke-width="7"/><path d="${path(-1)}" fill="none" stroke="${o.red ? C.red : C.mid}" stroke-width="7"/>`);
};
R.protein = (o) => {
  let d = 'M-120 -40';
  for (let i = 0; i < 9; i++) d += ` q${f(10 + rnd() * 20)} ${f(-50 + rnd() * 100)} ${f(25 + rnd() * 10)} ${f(-30 + rnd() * 60)}`;
  return g(o, `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${o.red ? C.red : C.soft}" stroke-width="10" stroke-linecap="round"/>`);
};
R.molecule = (o) => {
  const pts = [[0, -60], [-40, -30], [40, -30], [-40, 15], [40, 15], [0, 45]];
  let s = '';
  for (const [a, b] of [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5]]) s += `<line x1="${pts[a][0]}" y1="${pts[a][1]}" x2="${pts[b][0]}" y2="${pts[b][1]}" stroke="${C.ink}" stroke-width="6"/>`;
  pts.forEach(([x, y], i) => { s += `<circle cx="${x}" cy="${y}" r="${i === 0 ? 16 : 12}" fill="${i === 0 && o.red ? C.red : C.pale}" ${STROKE}/>`; });
  return g(o, `<g transform="translate(0 -50)">${s}</g>`);
};
R.pill = (o) => g(o, `<g transform="rotate(-30)"><rect x="-34" y="-14" width="68" height="28" rx="14" fill="${C.pale}" ${STROKE}/><path d="M0 -14 L-20 -14 A14 14 0 0 0 -20 14 L0 14 Z" fill="${C.red}"/><rect x="-34" y="-14" width="68" height="28" rx="14" fill="none" ${STROKE}/></g>`);
R.brain = (o) => g(o, `<path d="M-60 -50 q-10 -40 30 -50 q20 -30 60 -10 q40 -10 40 30 q30 20 0 50 q0 30 -40 26 q-20 20 -50 0 q-40 6 -40 -46 Z" fill="${o.c ? col(o.c) : C.soft}" ${STROKE}/><path d="M-30 -80 q20 20 0 40 q-10 20 10 30 M20 -90 q-10 30 20 40 q10 20 -10 34" fill="none" stroke="${C.ink}" stroke-width="2.5"/>` + (o.glow ? `<circle cx="0" cy="-50" r="16" fill="${C.red}" opacity=".85"/>` : ''));
R.loop = (o) => {
  const r = Number(o.r || 70);
  const labels = (o.labels || '').split(',').filter(Boolean);
  let s = `<circle cx="0" cy="0" r="${r}" fill="none" stroke="${C.pale}" stroke-width="6" stroke-dasharray="${f(r * 1.3)} 14"/>`;
  labels.forEach((t, i) => {
    const a = (i / labels.length) * Math.PI * 2 - Math.PI / 2, x = Math.cos(a) * r, y = Math.sin(a) * r;
    s += `<circle cx="${f(x)}" cy="${f(y)}" r="${o.dot || 26}" fill="${i === Number(o.redIndex ?? 0) ? C.red : C.deep}" ${STROKE}/><text x="${f(x)}" y="${f(y + 4)}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="11" fill="${C.snow}">${esc(t)}</text>`;
  });
  return `<g transform="translate(${X(o.x ?? 50)} ${Y(o.y ?? 50)})">${s}</g>`;
};
R.curve = (o) => {
  const w = Number(o.w || 260), h = Number(o.h || 160);
  let s = `<line x1="0" y1="0" x2="${w}" y2="0" ${STROKE}/><line x1="0" y1="0" x2="0" y2="${-h}" ${STROKE}/>`;
  if (o.line) s += `<path d="M0 -10 L${w} ${-h * 0.45}" fill="none" stroke="${C.soft}" stroke-width="4" stroke-dasharray="10 8"/>`;
  s += `<path d="M0 -10 Q${w * 0.7} -16 ${w} ${-h}" fill="none" stroke="${C.red}" stroke-width="5"/>`;
  return g(o, s);
};
R.coins = (o) => { let s = ''; const n = Number(o.n || 5); for (let i = 0; i < n; i++) s += `<ellipse cx="0" cy="${-6 - i * 8}" rx="22" ry="7" fill="${i === n - 1 && o.red ? C.red : C.glow}" ${STROKE}/>`; return g(o, s); };
R.magnifier = (o) => g(o, `<line x1="30" y1="30" x2="70" y2="70" stroke="${C.ink}" stroke-width="12" stroke-linecap="round"/><circle cx="0" cy="0" r="42" fill="${C.pale}" fill-opacity=".35" stroke="${C.ink}" stroke-width="6"/><circle cx="0" cy="0" r="42" fill="none" stroke="${o.red ? C.red : C.soft}" stroke-width="3"/>`);
R.bubble = (o) => {
  const text = String(o.text || '');
  const lines = text.split('/');
  const w = Number(o.w || Math.max(70, Math.max(...lines.map((l) => l.length)) * 10 + 30)), h = 24 + lines.length * 20;
  const tx = o.tail === 'right' ? w * 0.3 : -w * 0.3;
  let s = `<path d="M${-w / 2} ${-h / 2} Q${-w / 2} ${-h / 2 - 2} ${-w / 2 + 14} ${-h / 2} L${w / 2 - 14} ${-h / 2} Q${w / 2} ${-h / 2} ${w / 2} ${-h / 2 + 14} L${w / 2} ${h / 2 - 14} Q${w / 2} ${h / 2} ${w / 2 - 14} ${h / 2} L${tx + 10} ${h / 2} L${tx * 1.15} ${h / 2 + 22} L${tx - 6} ${h / 2} L${-w / 2 + 14} ${h / 2} Q${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - 14} Z" fill="${C.snow}" ${STROKE}/>`;
  lines.forEach((l, i) => { s += `<text x="0" y="${-h / 2 + 27 + i * 20}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="17" fill="${o.red ? C.red : C.ink}">${esc(l)}</text>`; });
  return `<g transform="translate(${X(o.x ?? 50)} ${Y(o.y ?? 20)})">${s}</g>`;
};
R.label = (o) => `<text x="${X(o.x ?? 50)}" y="${Y(o.y ?? 50)}" text-anchor="${o.anchor || 'middle'}" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="${o.fs || 26}" letter-spacing="1" fill="${o.red ? C.red : col(o.c, C.pale)}">${esc(o.text || '')}</text>`;
R.door = (o) => g(o, `<rect x="-40" y="-150" width="80" height="150" fill="${o.open ? C.glow : C.night}" ${STROKE}/>` + (o.open ? `<path d="M40 -150 L70 -136 L70 10 L40 0 Z" fill="${C.deep}" ${STROKE}/>` : `<circle cx="26" cy="-72" r="5" fill="${o.red ? C.red : C.soft}" ${STROKE}/>`));
R.key = (o) => g(o, `<circle cx="0" cy="-40" r="18" fill="none" stroke="${o.red ? C.red : C.glow}" stroke-width="8"/><path d="M14 -28 L60 18 M44 2 L54 -8 M52 10 L62 0" stroke="${o.red ? C.red : C.glow}" stroke-width="8" stroke-linecap="round"/>`);
R.calendar = (o) => {
  let s = `<rect x="-60" y="-110" width="120" height="110" fill="${C.snow}" ${STROKE}/><rect x="-60" y="-110" width="120" height="24" fill="${C.deep}" ${STROKE}/>`;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += `<rect x="${-52 + c * 22}" y="${-80 + r * 19}" width="16" height="13" fill="${(r === Number(o.r ?? 3) && c === Number(o.c ?? 3)) ? C.red : C.pale}"/>`;
  if (o.cross) s += `<path d="M-52 -80 l60 70 M8 -80 l-60 70" stroke="${C.red}" stroke-width="3" opacity=".7"/>`;
  return g(o, s);
};
R.scales = (o) => g(o, `<line x1="0" y1="0" x2="0" y2="-150" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><line x1="-80" y1="-140" x2="80" y2="-${o.tilt ? 128 : 140}" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M-80 -140 l-24 50 l48 0 Z M80 -${o.tilt ? 128 : 140} l-24 50 l48 0 Z" fill="none" ${STROKE}/><path d="M-110 -90 a30 12 0 0 0 60 0 Z" fill="${C.pale}" ${STROKE}/><path d="M50 -${o.tilt ? 78 : 90} a30 12 0 0 0 60 0 Z" fill="${o.red ? C.red : C.pale}" ${STROKE}/><rect x="-30" y="-6" width="60" height="6" fill="${C.night}" ${STROKE}/>`);
R.bed = (o) => g(o, `<rect x="-120" y="-40" width="240" height="26" fill="${C.pale}" ${STROKE}/><rect x="-126" y="-80" width="12" height="80" fill="${C.night}" ${STROKE}/><rect x="114" y="-56" width="12" height="56" fill="${C.night}" ${STROKE}/>` +
  (o.sleeper === 'no' ? '' : `<ellipse cx="-86" cy="-50" rx="22" ry="12" fill="${C.snow}" ${STROKE}/><circle cx="-80" cy="-60" r="15" fill="${C.pale}" ${STROKE}/><path d="M-95 -66 q15 -16 30 -2 z" fill="${C.ink}"/><path d="M-68 -60 q10 -14 40 -10 L112 -48 L112 -40 L-70 -40 Z" fill="${o.red ? C.red : C.mid}" ${STROKE}/>`) +
  (o.zzz ? `<text x="-40" y="-90" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="20" fill="${C.pale}">z z z</text>` : ''));
R.clock = (o) => g(o, `<circle cx="0" cy="-40" r="38" fill="${C.snow}" ${STROKE}/><line x1="0" y1="-40" x2="0" y2="-64" stroke="${C.ink}" stroke-width="4"/><line x1="0" y1="-40" x2="${o.h3 ? 18 : -14}" y2="${o.h3 ? -40 : -50}" stroke="${o.red ? C.red : C.ink}" stroke-width="4"/>`);
R.stage = (o) => {
  let s = `<rect x="0" y="${Y(o.y ?? 62)}" width="${W}" height="${H}" fill="${C.night}"/><rect x="${W * 0.18}" y="${Y(10)}" width="${W * 0.64}" height="${Y(36)}" fill="${C.ink}" ${STROKE}/>`;
  s += `<g transform="translate(${W * 0.18} ${Y(10)})">${screenContent(o.show || 'map', W * 0.64, Y(36))}</g>`;
  for (let i = 0; i < 5; i++) s += `<path d="M${W * (0.1 + i * 0.2)} 0 L${W * (0.05 + i * 0.2)} ${H} L${W * (0.15 + i * 0.2)} ${H} Z" fill="${C.glow}" opacity=".06"/>`;
  return s;
};
R.crowd = (o) => {
  const y = Y(o.y ?? 92);
  let s = '';
  for (let x = -10; x < W + 20; x += 22 + rnd() * 8) {
    const h = 26 + rnd() * 18;
    s += `<circle cx="${f(x)}" cy="${f(y - h)}" r="11" fill="${C.ink}"/><rect x="${f(x - 14)}" y="${f(y - h + 6)}" width="28" height="${f(h + 30)}" rx="10" fill="${C.ink}"/>`;
    if (rnd() < 0.05) s += `<rect x="${f(x - 3)}" y="${f(y - h - 26)}" width="6" height="16" fill="${C.red}"/>`;
  }
  return s;
};
R.arm = (o) => g(o, `<rect x="-36" y="-20" width="72" height="20" fill="${C.night}" ${STROKE}/><path d="M0 -20 L-30 -110 L50 -160" fill="none" stroke="${C.ink}" stroke-width="22" stroke-linecap="round"/><path d="M0 -20 L-30 -110 L50 -160" fill="none" stroke="${o.red ? C.red : C.soft}" stroke-width="14" stroke-linecap="round"/><circle cx="-30" cy="-110" r="12" fill="${C.deep}" ${STROKE}/><path d="M50 -160 l20 -6 M50 -160 l18 10" stroke="${C.ink}" stroke-width="6"/>`);
R.plane = (o) => g(o, `<path d="M-90 0 Q-100 -14 -80 -16 L80 -16 Q104 -12 100 0 Q80 8 -80 8 Z" fill="${C.pale}" ${STROKE}/><path d="M-10 -10 L-40 -56 L-20 -56 L30 -10 Z M-70 -14 L-92 -44 L-78 -44 L-56 -14 Z" fill="${C.soft}" ${STROKE}/>`);
R.blackbox = (o) => g(o, `<rect x="-50" y="-70" width="100" height="70" fill="${C.red}" ${STROKE}/><rect x="-50" y="-70" width="100" height="14" fill="${C.redDark}" ${STROKE}/><text x="0" y="-26" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="12" fill="${C.snow}">${esc(o.text || '? ? ?')}</text>`);
R.sub = (o) => g(o, `<path d="M-90 -30 Q-90 -60 -40 -60 L60 -60 Q100 -60 100 -30 Q100 0 60 0 L-40 0 Q-90 0 -90 -30 Z" fill="${C.soft}" ${STROKE}/><rect x="-10" y="-82" width="40" height="24" rx="6" fill="${C.soft}" ${STROKE}/><circle cx="-40" cy="-30" r="9" fill="${C.glow}" ${STROKE}/><circle cx="0" cy="-30" r="9" fill="${C.glow}" ${STROKE}/><path d="M100 -30 L260 -80 L260 20 Z" fill="${C.glow}" opacity=".18"/>`);
R.fish = (o) => g(o, `<path d="M-20 0 Q0 -14 20 0 Q0 14 -20 0 Z M20 0 L32 -10 L32 10 Z" fill="${o.red ? C.red : C.soft}" ${STROKE}/>` + (o.light ? `<circle cx="-30" cy="-16" r="4" fill="${C.glow}"/><path d="M-20 -4 Q-28 -18 -30 -16" fill="none" stroke="${C.ink}" stroke-width="1.5"/>` : ''));
R.vent = (o) => g(o, `<path d="M-40 0 L-16 -90 L16 -90 L40 0 Z" fill="${C.night}" ${STROKE}/><path d="M-12 -92 q-30 -40 0 -80 q30 -40 -6 -90" fill="none" stroke="${C.soft}" stroke-width="18" opacity=".35" stroke-linecap="round"/><ellipse cx="0" cy="-90" rx="14" ry="5" fill="${C.red}"/>`);
R.volcano = (o) => g(o, `<path d="M-160 0 L-40 -150 L40 -150 L160 0 Z" fill="${C.night}" ${STROKE}/><path d="M-40 -150 Q0 -136 40 -150 L20 -120 Q0 -110 -20 -120 Z" fill="${C.red}"/><path d="M-20 -160 q-30 -40 10 -70 q40 -30 0 -60" fill="none" stroke="${C.soft}" stroke-width="22" opacity=".3" stroke-linecap="round"/>`);
R.galaxy = (o) => {
  let s = '';
  for (let i = 0; i < 220; i++) {
    const a = i * 0.18, r = 4 + i * 0.55;
    for (const k of [0, Math.PI]) s += `<circle cx="${f(Math.cos(a + k) * r + (rnd() - 0.5) * 8)}" cy="${f(Math.sin(a + k) * r * 0.45 + (rnd() - 0.5) * 6)}" r="${f(0.8 + rnd())}" fill="${C.pale}" opacity="${f(0.3 + rnd() * 0.6)}"/>`;
  }
  return `<g transform="translate(${X(o.x ?? 50)} ${Y(o.y ?? 40)}) rotate(${o.rot || -18}) scale(${o.s || 1})"><ellipse rx="22" ry="12" fill="${C.glow}" opacity=".7"/>${s}</g>`;
};
R.planet = (o) => g(o, `<circle cx="0" cy="0" r="${o.r || 40}" fill="${o.red ? C.red : col(o.c, C.mid)}" ${STROKE}/>` + (o.ring ? `<ellipse cx="0" cy="0" rx="${(o.r || 40) * 1.7}" ry="${(o.r || 40) * 0.35}" fill="none" stroke="${C.pale}" stroke-width="3"/>` : ''));
R.globe = (o) => g(o, `<circle cx="0" cy="0" r="${o.r || 110}" fill="${C.deep}" ${STROKE}/><ellipse cx="0" cy="0" rx="${(o.r || 110) * 0.45}" ry="${o.r || 110}" fill="none" stroke="${C.soft}" stroke-width="2"/><line x1="${-(o.r || 110)}" y1="0" x2="${o.r || 110}" y2="0" stroke="${C.soft}" stroke-width="2"/><path d="M-60 -50 q30 -20 50 10 q10 30 -20 40 q-30 0 -30 -50 M20 20 q30 -10 40 20 q-10 30 -40 10 Z" fill="${C.mid}"/>`);
R.question = (o) => `<text x="${X(o.x ?? 50)}" y="${Y(o.y ?? 50)}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="${o.fs || 120}" fill="${o.red ? C.red : C.pale}" opacity="${o.a || 0.9}">?</text>`;
R.eye = (o) => g(o, `<path d="M-90 0 Q0 -70 90 0 Q0 70 -90 0 Z" fill="${C.pale}" ${STROKE}/><circle cx="0" cy="0" r="30" fill="${C.red}" ${STROKE}/><circle cx="0" cy="0" r="12" fill="${C.ink}"/><circle cx="8" cy="-8" r="5" fill="${C.snow}"/>`);
R.bulb = (o) => g(o, `<circle cx="0" cy="-70" r="34" fill="${o.off ? C.night : C.glow}" ${STROKE}/><rect x="-14" y="-40" width="28" height="26" fill="${C.soft}" ${STROKE}/>` + (o.off ? '' : `<circle cx="0" cy="-70" r="60" fill="${C.glow}" opacity=".15"/>`));
R.newspaper = (o) => g(o, `<rect x="-80" y="-110" width="160" height="110" fill="${C.snow}" ${STROKE} transform="rotate(${o.rot || 3})"/><text x="-68" y="-86" font-family="Georgia, serif" font-weight="700" font-size="${o.fs || 15}" fill="${o.red ? C.red : C.ink}" transform="rotate(${o.rot || 3})">${esc(o.text || 'NEWS')}</text>` +
  Array.from({ length: 5 }, (_, i) => `<line x1="-66" y1="${-66 + i * 12}" x2="${66 - (i % 2) * 30}" y2="${-66 + i * 12}" stroke="${C.mid}" stroke-width="3" transform="rotate(${o.rot || 3})"/>`).join(''));
R.terminal = (o) => g(o, `<rect x="-70" y="-120" width="140" height="110" rx="12" fill="${C.pale}" ${STROKE}/><rect x="-56" y="-108" width="112" height="78" rx="6" fill="${C.ink}"/><text x="-48" y="-86" font-family="Courier New, monospace" font-size="11" font-weight="700" fill="${C.soft}">${esc(o.l1 || '> HELLO')}</text><text x="-48" y="-70" font-family="Courier New, monospace" font-size="11" font-weight="700" fill="${o.red ? C.red : C.soft}">${esc(o.l2 || '')}</text><text x="-48" y="-54" font-family="Courier New, monospace" font-size="11" font-weight="700" fill="${C.soft}">${esc(o.l3 || '')}</text><rect x="-80" y="-10" width="160" height="10" fill="${C.night}" ${STROKE}/>`);
R.manuscript = (o) => {
  let s = `<path d="M0 -6 Q-40 -18 -80 -8 L-80 -96 Q-40 -108 0 -94 Z" fill="${C.glow}" ${STROKE}/><path d="M0 -6 Q40 -18 80 -8 L80 -96 Q40 -108 0 -94 Z" fill="${C.pale}" ${STROKE}/>`;
  for (let i = 0; i < 6; i++) s += `<path d="M-72 ${-86 + i * 11} q6 -5 10 0 t10 0 t12 0 t10 -2 t12 2" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += `<path d="M40 -20 q-6 -30 0 -60 q10 -10 14 0 q8 -20 14 0" fill="none" stroke="${C.deep}" stroke-width="3"/><circle cx="54" cy="-82" r="8" fill="${C.red}"/>`;
  return g(o, s);
};
R.crate = (o) => g(o, `<rect x="-70" y="-60" width="140" height="60" fill="${C.deep}" ${STROKE}/><line x1="-70" y1="-30" x2="70" y2="-30" ${STROKE}/>` + R.books({ x: 0, y: 0, n: 0 }).replace(/<g[^>]*><\/g>/, '') + `<rect x="-58" y="-80" width="30" height="22" fill="${C.mid}" ${STROKE}/><rect x="-20" y="-86" width="34" height="28" fill="${o.red ? C.red : C.soft}" ${STROKE}/><rect x="22" y="-78" width="30" height="20" fill="${C.pale}" ${STROKE}/>`);
R.oplamp = (o) => g(o, `<path d="M-120 140 L-40 0 L40 0 L120 140 Z" fill="${C.glow}" opacity=".14"/><ellipse cx="0" cy="0" rx="60" ry="16" fill="${C.pale}" ${STROKE}/><line x1="0" y1="-16" x2="0" y2="-120" ${STROKE}/>`);
R.bottle = (o) => g(o, `<path d="M-8 -80 L8 -80 L8 -60 Q30 -50 30 -24 L30 0 L-30 0 L-30 -24 Q-30 -50 -8 -60 Z" fill="${C.pale}" fill-opacity=".8" ${STROKE}/><rect x="-10" y="-90" width="20" height="10" fill="${C.red}" ${STROKE}/>`);
R.heart = (o) => g(o, `<path d="M0 -10 C-40 -40 -30 -80 0 -60 C30 -80 40 -40 0 -10 Z" fill="${C.red}" ${STROKE}/>`);
R.arrow = (o) => { const L = Number(o.len || 120); return g(o, `<path d="M0 0 L${L} 0" stroke="${o.red ? C.red : C.pale}" stroke-width="8" stroke-linecap="round"/><path d="M${L - 18} -16 L${L + 4} 0 L${L - 18} 16" fill="none" stroke="${o.red ? C.red : C.pale}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`); };
R.flag = (o) => g(o, `<line x1="0" y1="0" x2="0" y2="-120" stroke="${C.ink}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 -120 L70 -104 L0 -88 Z" fill="${o.red ? C.red : C.pale}" ${STROKE}/>`);
R.stars12 = (o) => { let s = ''; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; s += `<circle cx="${f(Math.cos(a) * 50)}" cy="${f(Math.sin(a) * 50 - 60)}" r="5" fill="${C.glow}"/>`; } return g(o, `<rect x="-80" y="-120" width="160" height="120" fill="${C.deep}" ${STROKE}/>` + s); };
R.shield = (o) => g(o, `<path d="M0 -120 L60 -100 Q60 -30 0 0 Q-60 -30 -60 -100 Z" fill="${o.red ? C.red : C.mid}" ${STROKE}/><path d="M0 -100 L40 -88 Q40 -40 0 -20 Z" fill="${C.pale}" opacity=".35"/>`);
R.levels = (o) => g(o, ['LOW', 'HIGH', 'BANNED'].map((t, i) => `<rect x="${-120 + i * 84}" y="${-40 - i * 40}" width="72" height="${40 + i * 40}" fill="${i === 2 ? C.red : [C.soft, C.mid][i]}" ${STROKE}/><text x="${-84 + i * 84}" y="-12" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="11" fill="${i ? C.snow : C.ink}">${t}</text>`).join(''));
R.signal = (o) => g(o, `<path d="M-160 0 L-120 0 L-110 -10 L-100 0 L-60 0 L-50 -90 L-40 0 L0 0 L10 -14 L20 0 L160 0" fill="none" stroke="${C.red}" stroke-width="4"/>`);
R.table = (o) => g(o, `<ellipse cx="0" cy="-60" rx="${o.w || 200}" ry="34" fill="${C.night}" ${STROKE}/><rect x="-10" y="-60" width="20" height="60" fill="${C.ink}"/>`);
R.notebook = (o) => g(o, `<rect x="-34" y="-46" width="68" height="46" fill="${o.red ? C.red : C.soft}" ${STROKE}/><rect x="-28" y="-40" width="56" height="34" fill="${C.snow}"/><line x1="-22" y1="-32" x2="18" y2="-32" stroke="${C.mid}" stroke-width="2"/><line x1="-22" y1="-24" x2="10" y2="-24" stroke="${C.mid}" stroke-width="2"/><line x1="-22" y1="-16" x2="20" y2="-16" stroke="${C.mid}" stroke-width="2"/>`);
R.dragon = (o) => g(o, `<path d="M-80 -20 Q-40 -90 0 -50 Q40 -10 80 -70 L96 -60 Q60 10 0 -20 Q-40 -50 -60 0 Z" fill="${C.red}" ${STROKE}/><circle cx="84" cy="-74" r="4" fill="${C.snow}"/>`);
R.gear = (o) => { let s = ''; for (let i = 0; i < 8; i++) s += `<rect x="-8" y="-58" width="16" height="20" fill="${o.red ? C.red : C.soft}" ${STROKE} transform="rotate(${i * 45})"/>`; return g(o, `<g transform="translate(0 -50)">${s}<circle r="42" fill="${o.red ? C.red : C.soft}" ${STROKE}/><circle r="14" fill="${C.ink}"/></g>`); };
R.box = (o) => g(o, `<rect x="-70" y="-100" width="140" height="100" fill="${C.ink}" ${STROKE}/><path d="M-70 -100 L-40 -130 L100 -130 L70 -100 Z M70 -100 L100 -130 L100 -30 L70 0 Z" fill="${C.night}" ${STROKE}/>` + (o.glow ? `<circle cx="0" cy="-50" r="20" fill="${C.red}" opacity=".9"/><circle cx="0" cy="-50" r="44" fill="${C.red}" opacity=".18"/>` : `<text x="0" y="-40" text-anchor="middle" font-family="Georgia, serif" font-size="50" font-weight="700" fill="${C.soft}">?</text>`));

/* ---------- người ---------- */
const POSES = {
  stand: { arms: [[-6, 8], [8, 10]], legs: [[-5, 0], [5, 0]] },
  walk: { arms: [[-28, 12], [28, 24]], legs: [[-22, 12], [22, 2]] },
  run: { arms: [[-55, 85], [60, 80]], legs: [[-40, 60], [45, 10]], lean: 12 },
  point: { arms: [[-6, 8], [84, 0]], legs: [[-5, 0], [5, 0]] },
  think: { arms: [[-12, 80], [30, 140]], legs: [[-4, 0], [4, 0]] },
  cheer: { arms: [[-160, -10], [160, 10]], legs: [[-10, 0], [10, 0]] },
  worried: { arms: [[-140, -100], [140, 100]], legs: [[-4, 0], [4, 0]] },
  hold: { arms: [[30, 60], [40, 60]], legs: [[-4, 0], [4, 0]] },
  phone: { arms: [[-6, 8], [25, 135]], legs: [[-4, 0], [4, 0]] },
  sit: { arms: [[20, 70], [30, 60]], legs: [[85, -85], [92, -92]], seat: 46 },
  type: { arms: [[55, 40], [60, 30]], legs: [[85, -85], [92, -92]], seat: 46 },
  sitthink: { arms: [[20, 70], [30, 140]], legs: [[85, -85], [92, -92]], seat: 46 },
  sitphone: { arms: [[20, 70], [25, 135]], legs: [[85, -85], [92, -92]], seat: 46 },
  shrug: { arms: [[-60, 120], [60, -120]], legs: [[-4, 0], [4, 0]] },
  kneel: { arms: [[20, 30], [60, 20]], legs: [[90, -90], [0, 90]], seat: 30 },
  bow: { arms: [[-6, 8], [8, 10]], legs: [[-3, 0], [3, 0]], lean: 35 },
};
const rad = (a) => (a * Math.PI) / 180;
const vec = (a, l) => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
function limb(x, y, a1, a2, l1, l2, w, c) {
  const [dx1, dy1] = vec(a1, l1), [dx2, dy2] = vec(a1 + a2, l2);
  const ex = x + dx1, ey = y + dy1, hx = ex + dx2, hy = ey + dy2;
  const d = `M${f(x)} ${f(y)} L${f(ex)} ${f(ey)} L${f(hx)} ${f(hy)}`;
  return { svg: `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${w + 5}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`, hand: [hx, hy] };
}
R.person = (o) => {
  const p = POSES[o.pose || 'stand'] || POSES.stand;
  const coat = col(o.coat, C.mid), skin = C.pale, hair = C.ink;
  const hipY = p.seat ? -p.seat : -76, shY = hipY - 52;
  const lean = p.lean || 0;
  const legs = p.legs.map(([a1, a2]) => limb(0, hipY, a1, a2, 40, 38, 13, C.night));
  const arms = p.arms.map(([a1, a2], i) => limb((i ? 6 : -6) + lean * 0.4, shY + 4, a1, a2, 33, 31, 11, coat));
  const long = o.long !== 'no';
  const coatBottom = p.seat ? hipY + 6 : long ? hipY + 34 : hipY + 8;
  const flare = p.seat ? 22 : long ? 27 : 20;
  let s = legs.map((l) => l.svg).join('');
  s += arms[0].svg;
  s += `<path d="M${-16 + lean * 0.4} ${shY} Q${lean * 0.4} ${shY - 8} ${16 + lean * 0.4} ${shY} L${flare} ${coatBottom} Q0 ${coatBottom + 6} ${-flare} ${coatBottom} Z" fill="${coat}" ${STROKE}/>`;
  if (o.scarf) s += `<path d="M${-15 + lean * 0.4} ${shY - 2} Q${lean * 0.4} ${shY + 10} ${15 + lean * 0.4} ${shY - 2} L${12 + lean * 0.4} ${shY + 8} Q${lean * 0.4} ${shY + 18} ${-12 + lean * 0.4} ${shY + 8} Z M${-4 + lean * 0.4} ${shY + 8} l-6 30 l10 -2 Z" fill="${C.red}" ${STROKE}/>`;
  if (o.cloak) s += `<path d="M${-16 + lean * 0.4} ${shY - 4} L${-34} ${coatBottom + 10} L${-flare} ${coatBottom} Z" fill="${C.red}" ${STROKE}/>`;
  const hx = lean * 0.9, hy = shY - 22;
  s += `<circle cx="${f(hx)}" cy="${f(hy)}" r="17" fill="${skin}" ${STROKE}/>`;
  const hs = o.hair || 'short';
  if (hs === 'long') s += `<path d="M${hx - 18} ${hy + 22} Q${hx - 22} ${hy - 20} ${hx} ${hy - 19} Q${hx + 20} ${hy - 18} ${hx + 16} ${hy - 4} Q${hx + 2} ${hy - 12} ${hx - 6} ${hy + 22} Z" fill="${hair}"/>`;
  else if (hs === 'bun') s += `<path d="M${hx - 17} ${hy + 2} Q${hx - 16} ${hy - 20} ${hx + 2} ${hy - 19} Q${hx + 18} ${hy - 16} ${hx + 16} ${hy - 5} Q${hx} ${hy - 10} ${hx - 17} ${hy + 2} Z" fill="${hair}"/><circle cx="${hx - 14}" cy="${hy - 16}" r="8" fill="${hair}"/>`;
  else if (hs === 'grey') s += `<path d="M${hx - 17} ${hy + 2} Q${hx - 14} ${hy - 20} ${hx + 2} ${hy - 19} Q${hx + 18} ${hy - 16} ${hx + 15} ${hy - 6} Q${hx} ${hy - 12} ${hx - 17} ${hy + 2} Z" fill="${C.soft}" ${STROKE}/>`;
  else if (hs === 'bald') s += '';
  else s += `<path d="M${hx - 17} ${hy + 2} Q${hx - 16} ${hy - 22} ${hx + 2} ${hy - 20} Q${hx + 19} ${hy - 17} ${hx + 16} ${hy - 4} L${hx + 6} ${hy - 9} L${hx + 2} ${hy - 4} L${hx - 4} ${hy - 9} Q${hx - 12} ${hy - 6} ${hx - 17} ${hy + 2} Z" fill="${hair}"/>`;
  if (o.hood) s += `<path d="M${hx - 22} ${hy + 22} Q${hx - 26} ${hy - 30} ${hx + 4} ${hy - 26} Q${hx + 26} ${hy - 20} ${hx + 20} ${hy + 4} Q${hx + 8} ${hy - 14} ${hx - 6} ${hy - 10} Q${hx - 14} ${hy} ${hx - 10} ${hy + 22} Z" fill="${coat}" ${STROKE}/>`;
  const mood = o.face || 'calm';
  s += `<circle cx="${hx + 6}" cy="${hy + 1}" r="2" fill="${C.ink}"/><circle cx="${hx + 13}" cy="${hy + 1}" r="2" fill="${C.ink}"/>`;
  if (mood === 'happy') s += `<path d="M${hx + 5} ${hy + 8} q5 5 10 0" fill="none" stroke="${C.ink}" stroke-width="2"/>`;
  else if (mood === 'sad' || mood === 'worried') s += `<path d="M${hx + 5} ${hy + 11} q5 -4 10 0" fill="none" stroke="${C.ink}" stroke-width="2"/>` + (mood === 'worried' ? `<path d="M${hx + 3} ${hy - 5} l5 2 M${hx + 16} ${hy - 5} l-4 2" stroke="${C.ink}" stroke-width="2"/>` : '');
  else if (mood === 'shock') s += `<ellipse cx="${hx + 10}" cy="${hy + 10}" rx="3" ry="4" fill="${C.ink}"/>`;
  else s += `<line x1="${hx + 6}" y1="${hy + 9}" x2="${hx + 13}" y2="${hy + 9}" stroke="${C.ink}" stroke-width="2"/>`;
  if (o.glasses) s += `<circle cx="${hx + 6}" cy="${hy + 1}" r="5" fill="none" stroke="${C.ink}" stroke-width="1.6"/><circle cx="${hx + 14}" cy="${hy + 1}" r="5" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`;
  s += arms[1].svg;
  const [px, py] = arms[1].hand;
  const item = o.item;
  if (item === 'phone') s += `<rect x="${f(px - 6)}" y="${f(py - 16)}" width="12" height="20" rx="2" fill="${C.ink}" ${STROKE}/><rect x="${f(px - 3)}" y="${f(py - 13)}" width="6" height="12" fill="${o.redItem ? C.red : C.soft}"/>`;
  if (item === 'book') s += `<rect x="${f(px - 4)}" y="${f(py - 22)}" width="30" height="24" fill="${o.redItem ? C.red : C.snow}" ${STROKE}/>`;
  if (item === 'paper') s += `<rect x="${f(px - 2)}" y="${f(py - 30)}" width="26" height="34" fill="${C.snow}" ${STROKE}/>`;
  if (item === 'cup') s += `<rect x="${f(px - 6)}" y="${f(py - 14)}" width="14" height="16" fill="${C.pale}" ${STROKE}/>`;
  if (item === 'pen') s += `<line x1="${f(px)}" y1="${f(py)}" x2="${f(px + 8)}" y2="${f(py + 14)}" stroke="${C.ink}" stroke-width="4"/>`;
  if (item === 'torch') s += `<path d="M${f(px)} ${f(py)} l90 -30 l0 70 Z" fill="${C.glow}" opacity=".22"/>`;
  if (item === 'flag') s += `<line x1="${f(px)}" y1="${f(py + 10)}" x2="${f(px)}" y2="${f(py - 60)}" stroke="${C.ink}" stroke-width="4"/><path d="M${f(px)} ${f(py - 60)} l40 10 l-40 10 Z" fill="${C.red}" ${STROKE}/>`;
  if (item === 'sign') s += `<rect x="${f(px - 30)}" y="${f(py - 60)}" width="60" height="40" fill="${C.snow}" ${STROKE}/><line x1="${f(px)}" y1="${f(py - 20)}" x2="${f(px)}" y2="${f(py + 10)}" stroke="${C.ink}" stroke-width="4"/>`;
  return g(o, s);
};
R.robot = (o) => {
  const pose = o.pose || 'stand';
  let s = `<rect x="-14" y="-16" width="10" height="16" fill="${C.night}" ${STROKE}/><rect x="4" y="-16" width="10" height="16" fill="${C.night}" ${STROKE}/>`;
  s += `<rect x="-24" y="-58" width="48" height="44" rx="8" fill="${C.soft}" ${STROKE}/><circle cx="0" cy="-36" r="7" fill="${o.redHeart ? C.red : C.deep}" ${STROKE}/>`;
  const armL = pose === 'wave' ? 'M-24 -50 L-44 -80' : pose === 'reach' ? 'M24 -48 L54 -50' : 'M-24 -48 L-34 -22';
  const armR = pose === 'reach' ? 'M-24 -48 L-34 -22' : pose === 'stop' ? 'M24 -48 L52 -64' : 'M24 -48 L34 -22';
  s += `<path d="${armL} M${armR.slice(1)}" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/><path d="${armL} M${armR.slice(1)}" fill="none" stroke="${C.soft}" stroke-width="5" stroke-linecap="round"/>`;
  s += `<rect x="-30" y="-104" width="60" height="46" rx="12" fill="${C.pale}" ${STROKE}/><circle cx="-12" cy="-82" r="9" fill="${C.snow}" ${STROKE}/><circle cx="12" cy="-82" r="9" fill="${C.snow}" ${STROKE}/><circle cx="${o.look === 'down' ? -11 : -9}" cy="${o.look === 'down' ? -78 : -82}" r="4" fill="${C.ink}"/><circle cx="${o.look === 'down' ? 13 : 15}" cy="${o.look === 'down' ? -78 : -82}" r="4" fill="${C.ink}"/>`;
  s += `<line x1="0" y1="-104" x2="0" y2="-122" ${STROKE}/><circle cx="0" cy="-126" r="6" fill="${C.red}" ${STROKE}/>`;
  if (o.light) s += `<path d="M-30 -82 L-140 -120 L-140 -30 Z" fill="${C.glow}" opacity=".25"/>`;
  if (o.q) s += `<text x="34" y="-112" font-family="Georgia, serif" font-weight="700" font-size="30" fill="${C.red}">?</text>`;
  return g(o, s);
};

/* ---------- khung tranh ---------- */
function frame(inner, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">` +
    `<defs><filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 0.04  0 0 0 0 0.08  0 0 0 0 0.19  0 0 0 .55 0"/></filter>` +
    `<clipPath id="pn"><rect x="0" y="0" width="${W}" height="${H}" rx="14"/></clipPath></defs>` +
    `<g clip-path="url(#pn)">${inner}<rect width="${W}" height="${H}" filter="url(#grain)" opacity=".35"/></g>` +
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" rx="13" fill="none" stroke="${C.ink}" stroke-width="5"/></svg>`;
}

/* ---------- đọc mô tả cảnh ---------- */
function parse(text) {
  const scenes = [];
  let cur = null;
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) { if (!line && cur) cur = null; continue; }
    if (line.startsWith('@')) {
      const [id, n] = line.slice(1).split(/\s+/);
      cur = { id, n: Number(n), items: [] };
      scenes.push(cur);
      continue;
    }
    if (!cur) continue;
    const name = line.split(/\s+/)[0];
    const o = {};
    for (const m of line.matchAll(/(\w+)=("([^"]*)"|\S+)/g)) o[m[1]] = m[3] !== undefined ? m[3] : m[2];
    for (const flag of line.slice(name.length).replace(/(\w+)=("[^"]*"|\S+)/g, '').trim().split(/\s+/).filter(Boolean)) o[flag] = true;
    cur.items.push([name, o]);
  }
  return scenes;
}

const only = new Set(process.argv.slice(2));
const scenes = parse(fs.readFileSync(path.join(ROOT, 'data-src/scenes-en.txt'), 'utf8'));
const outDir = path.join(ROOT, 'img/scenes');
fs.mkdirSync(outDir, { recursive: true });
const manifest = {};
let n = 0;
const unknown = new Set();
for (const sc of scenes) {
  (manifest[sc.id] = manifest[sc.id] || []).push(sc.n);
  if (only.size && !only.has(sc.id)) continue;
  seed(`${sc.id}-${sc.n}`);
  let inner = '';
  for (const [name, o] of sc.items) {
    if (!R[name]) { unknown.add(name); continue; }
    inner += R[name](o);
  }
  fs.writeFileSync(path.join(outDir, `${sc.id}-${sc.n}.svg`), frame(inner));
  n++;
}
for (const k of Object.keys(manifest)) manifest[k].sort((a, b) => a - b);
fs.writeFileSync(path.join(ROOT, 'data/scenes.json'), JSON.stringify(manifest));
console.log(`Đã vẽ ${n} cảnh · ${Object.keys(manifest).length} truyện`);
if (unknown.size) console.log('Không biết vẽ:', [...unknown].join(', '));
