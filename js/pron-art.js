/* Hình minh hoạ cho bài phát âm, vẽ bằng SVG ngay trong máy, không cần tải ảnh:
   - mặt cắt khoang miệng (vị trí lưỡi cho từng nhóm âm, điểm chạm tô đỏ, luồng hơi)
   - khẩu hình môi nhìn thẳng
   - biểu đồ độ cao 4 thanh, tổ hợp thanh của từ hai âm tiết
   - sơ đồ cấu tạo âm tiết
   - hai nhân vật dẫn bài: Han (tiếng Trung) và Kai (tiếng Anh) */

const INK = '#1a1f3a', SKIN = '#f3e3d8', TONGUE = '#e9a090', HOT = '#e0442a', AIR = '#2f7a63', SOFT = '#8b91a8';
export const TONE_COLORS = { 1: '#2f6fd0', 2: '#2f9a6a', 3: '#c8892b', 4: '#d2452e', 0: '#8b91a8' };

const svg = (vb, inner, cls = 'pron-art') => `<svg class="${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img">${inner}</svg>`;

/* ---------- mặt cắt khoang miệng ---------- */
const TONGUES = {
  rest: 'M60 86 Q66 80 80 79 Q104 76 122 82 Q134 90 138 130',
  alveolar: 'M61 68 Q66 64 74 70 Q96 78 120 82 Q134 90 138 130',
  dental: 'M55 73 Q62 70 74 74 Q100 78 122 82 Q134 90 138 130',
  interdental: 'M44 77 Q52 74 62 76 Q90 80 120 83 Q134 90 138 130',
  palatal: 'M60 86 Q66 76 78 66 Q94 60 108 66 Q126 80 138 130',
  retroflex: 'M74 63 Q70 70 76 74 Q98 78 120 82 Q134 90 138 130',
  velar: 'M60 86 Q70 82 86 80 Q104 74 116 62 Q128 64 138 130',
  lateral: 'M61 68 Q66 64 74 70 Q96 80 120 84 Q134 90 138 130',
};
const CONTACT = { alveolar: [62, 66], dental: [55, 72], interdental: [46, 76], palatal: [88, 61], retroflex: [76, 61], velar: [117, 61], lateral: [62, 66] };

/**
 * place: lips | labdent | alveolar | dental | interdental | palatal | retroflex | velar | rest
 * opts: { asp: bật hơi, nasal: hơi qua mũi, round: tròn môi, label }
 */
export function mouth(place, opts = {}) {
  const tKey = TONGUES[place] ? place : 'rest';
  const lipsClosed = place === 'lips';
  const labdent = place === 'labdent';
  let s = '';
  // đầu nhìn nghiêng (quay trái)
  s += `<path d="M150 8 Q100 2 74 16 Q60 28 58 40 Q46 46 36 52 Q44 58 50 60 Q44 64 ${lipsClosed ? 40 : 38} ${lipsClosed ? 74 : 70} Q46 74 52 72 L52 ${lipsClosed ? 76 : 82} Q44 ${lipsClosed ? 78 : 82} ${labdent ? 50 : 40} ${labdent ? 74 : 88} Q46 96 50 104 Q56 118 82 120 Q110 122 118 142 L190 150 L190 8 Z" fill="${SKIN}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`;
  // khoang mũi + vòm miệng + vòm mềm + thành họng
  s += `<path d="M58 50 Q100 44 140 50 L140 66" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".55"/>`;
  s += `<path d="M58 66 Q60 63 64 64 Q86 56 108 58" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
  s += `<path d="M108 58 Q124 60 ${opts.nasal ? 128 : 134} ${opts.nasal ? 74 : 68}" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
  s += `<path d="M144 64 Q146 100 146 150" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
  // răng
  s += `<rect x="50" y="64" width="8" height="10" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/><rect x="50" y="${lipsClosed ? 75 : 80}" width="8" height="9" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
  // lưỡi
  const [, tx, ty] = TONGUES[tKey].match(/M([\d.]+) ([\d.]+)/);
  s += `<path d="${TONGUES[tKey]} L138 140 Q100 120 66 96 Q58 90 ${tx} ${ty} Z" fill="${TONGUE}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  if (place === 'retroflex') s += `<path d="M74 63 Q80 60 82 66" fill="none" stroke="${INK}" stroke-width="2"/>`;
  // điểm chạm
  const c = lipsClosed ? [41, 74] : labdent ? [50, 76] : CONTACT[place];
  if (c) s += `<circle cx="${c[0]}" cy="${c[1]}" r="6" fill="${HOT}" opacity=".85"/>`;
  // luồng hơi
  if (opts.nasal) s += `<path d="M140 120 Q142 80 132 62 Q100 50 60 52 L40 46" fill="none" stroke="${AIR}" stroke-width="2.4" stroke-dasharray="5 4"/><path d="M44 42 L36 46 L44 51" fill="none" stroke="${AIR}" stroke-width="2.4"/>`;
  else s += `<path d="M140 120 Q142 90 128 80 Q100 70 70 76 L${place === 'lips' ? 46 : 30} 78" fill="none" stroke="${AIR}" stroke-width="2.4" stroke-dasharray="5 4"/><path d="M${place === 'lips' ? 52 : 36} 73 L${place === 'lips' ? 44 : 28} 78 L${place === 'lips' ? 52 : 36} 83" fill="none" stroke="${AIR}" stroke-width="2.4"/>`;
  if (opts.asp) s += `<path d="M24 66 q-8 12 0 24 M14 62 q-10 16 0 32 M4 58 q-12 20 0 40" fill="none" stroke="${HOT}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (opts.round) s += `<ellipse cx="38" cy="78" rx="6" ry="9" fill="none" stroke="${HOT}" stroke-width="2.4"/>`;
  return svg('0 0 200 160', s);
}

/* ---------- môi nhìn thẳng ---------- */
const LIPS = {
  open: { rx: 34, ry: 26, inner: [26, 18] },   // a
  mid: { rx: 34, ry: 16, inner: [24, 8] },     // e
  spread: { rx: 44, ry: 10, inner: [36, 4] },  // i (dẹt như cười)
  round: { rx: 20, ry: 20, inner: [10, 10] },  // o
  small: { rx: 15, ry: 15, inner: [6, 6] },    // u (chúm môi)
  roundi: { rx: 16, ry: 16, inner: [6, 5] },   // ü (chúm môi, lưỡi như i)
  bite: { rx: 34, ry: 12, inner: [26, 3] },    // f v (răng trên chạm môi dưới)
  tongue: { rx: 34, ry: 14, inner: [24, 6] },  // th
};
export function lips(shape) {
  const L = LIPS[shape] || LIPS.mid;
  let s = `<ellipse cx="60" cy="40" rx="${L.rx + 10}" ry="${L.ry + 9}" fill="#d97a6c" stroke="${INK}" stroke-width="2.4"/>`;
  s += `<ellipse cx="60" cy="40" rx="${L.inner[0]}" ry="${L.inner[1]}" fill="#3b2230"/>`;
  if (shape === 'bite') s += `<rect x="44" y="33" width="32" height="7" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;
  else if (L.inner[1] > 5) s += `<rect x="${60 - L.inner[0] * 0.6}" y="${40 - L.inner[1]}" width="${L.inner[0] * 1.2}" height="5" rx="2" fill="#fff"/>`;
  if (shape === 'tongue') s += `<ellipse cx="60" cy="42" rx="16" ry="5" fill="${TONGUE}" stroke="${INK}" stroke-width="1.4"/>`;
  if (shape === 'roundi') s += `<text x="60" y="88" text-anchor="middle" font-size="8" fill="${SOFT}">lưỡi đặt như "i"</text>`;
  return svg('0 0 120 92', s);
}

/* ---------- thanh điệu ---------- */
const CONTOUR = { 1: [[0, 5], [1, 5]], 2: [[0, 3], [1, 5]], 3: [[0, 2], [0.5, 1], [1, 4]], 4: [[0, 5], [1, 1]], 0: [[0.4, 2.6], [0.6, 2.6]], 33: [[0, 2], [1, 1]] };
function contourPath(t, x0, w) {
  const pts = CONTOUR[t];
  const y = (v) => 108 - v * 18;
  return pts.map(([px, v], i) => `${i ? 'L' : 'M'}${(x0 + px * w).toFixed(1)} ${y(v)}`).join(' ');
}
export function toneChart(only = [1, 2, 3, 4]) {
  let s = '';
  for (let v = 1; v <= 5; v++) s += `<line x1="34" y1="${108 - v * 18}" x2="316" y2="${108 - v * 18}" stroke="${SOFT}" stroke-width="1" stroke-dasharray="3 4"/><text x="22" y="${112 - v * 18}" font-size="11" fill="${SOFT}">${v}</text>`;
  const n = only.length;
  only.forEach((t, i) => {
    const x0 = 46 + i * (270 / n), w = 270 / n - 22;
    s += `<path d="${contourPath(t, x0, w)}" fill="none" stroke="${TONE_COLORS[t]}" stroke-width="${t === 0 ? 9 : 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<text x="${x0 + w / 2}" y="128" text-anchor="middle" font-size="13" font-weight="700" fill="${TONE_COLORS[t]}">${t ? `Thanh ${t}` : 'Thanh nhẹ'}</text>`;
  });
  return svg('0 0 330 136', s);
}
/** Tổ hợp thanh của từ hai âm tiết. Thanh 3 trước thanh khác đọc nửa (chỉ đi xuống); 3+3 đổi thành 2+3. */
export function comboChart(t1, t2) {
  const a = t1 === 3 && t2 === 3 ? 2 : t1 === 3 ? 33 : t1;
  let s = '';
  for (let v = 1; v <= 5; v++) s += `<line x1="20" y1="${108 - v * 18}" x2="230" y2="${108 - v * 18}" stroke="${SOFT}" stroke-width="1" stroke-dasharray="3 4"/>`;
  s += `<path d="${contourPath(a, 30, 80)}" fill="none" stroke="${TONE_COLORS[t1]}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${contourPath(t2, 140, 80)}" fill="none" stroke="${TONE_COLORS[t2]}" stroke-width="${t2 === 0 ? 9 : 6}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return svg('0 0 250 116', s);
}

/* ---------- cấu tạo âm tiết ---------- */
export function syllable(ini = 'm', fin = 'a', mark = 'ǎ') {
  const box = (x, w, t, sub, c) => `<rect x="${x}" y="44" width="${w}" height="52" rx="10" fill="${c}" stroke="${INK}" stroke-width="2"/><text x="${x + w / 2}" y="80" text-anchor="middle" font-size="28" font-weight="700" fill="${INK}">${t}</text><text x="${x + w / 2}" y="116" text-anchor="middle" font-size="12" fill="${SOFT}">${sub}</text>`;
  let s = box(40, 80, ini, 'Thanh mẫu', '#e3e8fb') + box(130, 100, fin, 'Vận mẫu', '#dff0e9');
  s += `<path d="M150 34 Q180 18 210 34" fill="none" stroke="${HOT}" stroke-width="3"/><text x="180" y="16" text-anchor="middle" font-size="12" fill="${HOT}">Thanh điệu</text>`;
  s += `<text x="270" y="80" font-size="30" font-weight="800" fill="${INK}">= ${mark}</text>`;
  return svg('0 0 340 124', s);
}

/* ---------- âm cuối tiếng Anh: giữ miệng ở vị trí âm cuối ---------- */
export function stress(parts, strong) {
  let s = '', x = 10;
  parts.forEach((p, i) => {
    const big = i === strong, r = big ? 30 : 18;
    s += `<circle cx="${x + r}" cy="44" r="${r}" fill="${big ? HOT : '#e3e8fb'}" stroke="${INK}" stroke-width="2"/><text x="${x + r}" y="${big ? 50 : 49}" text-anchor="middle" font-size="${big ? 15 : 12}" font-weight="700" fill="${big ? '#fff' : INK}">${p}</text>`;
    x += r * 2 + 10;
  });
  return svg(`0 0 ${x + 6} 88`, s);
}

/** Vẽ theo mã trong dữ liệu bài: "mouth:velar+asp", "lips:round", "tones", "tones:3", "syllable", "combo:3-4", "stress:pho-to-graph:0" */
export function art(code) {
  if (!code) return '';
  const [kind, arg = '', extra = ''] = code.split(':');
  if (kind === 'mouth') {
    const [place, ...flags] = arg.split('+');
    return mouth(place, { asp: flags.includes('asp'), nasal: flags.includes('nasal'), round: flags.includes('round') });
  }
  if (kind === 'lips') return lips(arg);
  if (kind === 'tones') return toneChart(arg ? arg.split(',').map(Number) : [1, 2, 3, 4]);
  if (kind === 'combo') { const [a, b] = arg.split('-').map(Number); return comboChart(a, b); }
  if (kind === 'syllable') { const [i, f, m] = (arg || 'm,a,mǎ').split(','); return syllable(i, f, m); }
  if (kind === 'stress') return stress(arg.split('-'), Number(extra || 0));
  return '';
}

/* ---------- nhân vật dẫn bài ---------- */
export function mascot(who) {
  if (who === 'kai') {
    return svg('0 0 64 64', `<circle cx="32" cy="32" r="31" fill="#dceaf0"/><rect x="14" y="18" width="36" height="28" rx="8" fill="#d6eae7" stroke="${INK}" stroke-width="2.4"/><circle cx="25" cy="31" r="6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="39" cy="31" r="6" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="26" cy="31" r="2.6" fill="${INK}"/><circle cx="40" cy="31" r="2.6" fill="${INK}"/><line x1="32" y1="18" x2="32" y2="9" stroke="${INK}" stroke-width="2.4"/><circle cx="32" cy="7" r="4" fill="${HOT}" stroke="${INK}" stroke-width="2"/><path d="M26 40 q6 4 12 0" fill="none" stroke="${INK}" stroke-width="2"/><rect x="20" y="46" width="24" height="14" rx="4" fill="#8bbac0" stroke="${INK}" stroke-width="2.4"/>`, 'mascot');
  }
  return svg('0 0 64 64', `<circle cx="32" cy="32" r="31" fill="#f6e1ef"/><path d="M14 40 Q10 14 32 12 Q54 12 50 40 Q48 50 44 54 L20 54 Q16 50 14 40 Z" fill="${INK}"/><circle cx="32" cy="32" r="14" fill="#f3e3d8" stroke="${INK}" stroke-width="2.2"/><path d="M18 30 Q22 16 32 17 Q44 17 46 30 Q38 22 32 25 Q26 22 18 30 Z" fill="${INK}"/><circle cx="27" cy="33" r="2" fill="${INK}"/><circle cx="37" cy="33" r="2" fill="${INK}"/><path d="M28 39 q4 3 8 0" fill="none" stroke="${INK}" stroke-width="1.8"/><path d="M20 50 Q32 58 44 50 L46 60 Q32 66 18 60 Z" fill="${HOT}" stroke="${INK}" stroke-width="2"/>`, 'mascot');
}
export const MASCOT_NAME = { zh: 'Han', en: 'Kai' };
