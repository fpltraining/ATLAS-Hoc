/* Soát giao diện ConnectLife theo luật chuyển thể từ taste-skill (github.com/Leonxlnx/taste-skill, MIT):
   nút và ô chạm cao/rộng từ 44 px, chữ đủ tương phản (4,5:1, chữ lớn 3:1), không emoji làm đầu dòng ở tiêu đề và nút,
   không màu tím trong màu của app, có vòng focus khi dùng bàn phím, không chuyển động trên left/top/width/height.

     node tools/ui-check.mjs              # iPad ngang + iPhone ngang
     node tools/ui-check.mjs --shots      # thêm ảnh chụp từng màn vào scratch/ui-check/

   Cần Playwright (đã cài sẵn trong máy chạy Claude Code trên web). Tự mở máy chủ tĩnh trên cổng ngẫu nhiên, không cần chạy riêng. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHOTS = process.argv.includes('--shots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    const idx = path.join(p, 'index.html');
    if (fs.existsSync(idx)) { res.writeHead(200, { 'content-type': 'text/html' }); fs.createReadStream(idx).pipe(res); return; }
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/game/';

// đo trong trang: chạy trong trình duyệt
function audit(screen) {
  const out = { tap: [], contrast: [], emoji: [], violet: [] };
  // bảng đang mở thì chỉ soát trong bảng (phía sau bị che)
  const panel = document.getElementById('panel'), scope = panel && /\bopen\b/.test(panel.className) ? panel : document.body;
  const EMO = /^[\s‹›✓]*(\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const name = (e) => (e.getAttribute('aria-label') || e.textContent || e.className || e.tagName).replace(/\s+/g, ' ').trim().slice(0, 40);
  function rgb(c) { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; }
  function lum(c) { const a = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; }
  function bgOf(e) {
    // chữ trên ô chọn trượt (.epill nằm cạnh, không phải cha): lấy màu ô chọn
    const on = e.closest('.on'), pill = on && on.parentElement && on.parentElement.querySelector(':scope > .epill');
    if (pill) return rgb(getComputedStyle(pill).backgroundColor);
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage !== 'none') return null;   // chữ trên ảnh hoặc dải màu: không đo được, bỏ qua
      const c = rgb(s.backgroundColor);
      if (c.length < 4 || c[3] > 0.6) return c;
    }
    return [255, 253, 249, 1];
  }
  function hue(c) { const [r, g, b] = c.slice(0, 3).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return [0, 0]; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return [h, d / (1 - Math.abs(mx + mn - 1) || 1)]; }

  // ô chạm: nút, liên kết đứng riêng, ô nhập
  scope.querySelectorAll('button, a[href], input, select, [role=button]').forEach((e) => {
    if (!vis(e) || e.closest('p, li') && e.tagName === 'A') return;
    const r = e.getBoundingClientRect();
    if (r.height < 43.5 || r.width < 43.5) out.tap.push(screen + ': ' + name(e) + ' (' + Math.round(r.width) + '×' + Math.round(r.height) + ')');
  });
  // tương phản chữ
  const seen = new Set();
  scope.querySelectorAll('*').forEach((e) => {
    if (!vis(e) || seen.size > 4000) return;
    const t = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim();
    if (!t) return;
    const s = getComputedStyle(e), fg = rgb(s.color), bg = bgOf(e);
    if (!bg) return;
    const a = fg[3] === undefined ? 1 : fg[3], mix = fg.slice(0, 3).map((v, i) => v * a + bg[i] * (1 - a));
    const L1 = lum(mix), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const big = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.6 && +s.fontWeight >= 700);
    const key = t.slice(0, 30);
    if (ratio < (big ? 3 : 4.5) && !seen.has(key)) { seen.add(key); out.contrast.push(screen + ': "' + key + '" ' + ratio.toFixed(2) + ':1'); }
  });
  // emoji làm đầu dòng ở tiêu đề, nút, tiêu đề bảng
  scope.querySelectorAll('h1, h2, h3, b, button, #panel-title, .big b, .tag, .road-tag').forEach((e) => {
    if (!vis(e)) return;
    const t = e.textContent.trim();
    if (EMO.test(t) && t.length > 3) out.emoji.push(screen + ': ' + t.slice(0, 40));
  });
  // màu tím trong màu của app (không tính ảnh)
  scope.querySelectorAll('*').forEach((e) => {
    if (!vis(e) || e.tagName === 'IMG' || e.tagName === 'CANVAS') return;
    const s = getComputedStyle(e);
    [s.backgroundColor, s.color, s.borderTopColor].forEach((c) => {
      const v = rgb(c); if (v[3] === 0) return;
      const [h, sat] = hue(v);
      if (h >= 255 && h <= 300 && sat > 0.3) out.violet.push(screen + ': ' + (e.className || e.tagName) + ' ' + c);
    });
  });
  out.violet = [...new Set(out.violet)].slice(0, 20);
  out.emoji = [...new Set(out.emoji)];
  out.tap = [...new Set(out.tap)];
  return out;
}

// các màn cần soát
const SCREENS = [
  ['Sảnh', () => { G.goLobby(); }],
  ['Hôm nay', () => { G.openToday(); }],
  ['Bản đồ nhớ từ', () => { G.openMemMap(0); }],
  ['Bài học', () => { G.closeLesson(); G.openLesson('en-a1-1'); }],
  ['Luyện', () => { const b = [...document.querySelectorAll('button.big')].find((x) => /2 · Luyện/.test(x.textContent)); if (b) b.click(); }]
];

const b = await chromium.launch();
const all = { tap: [], contrast: [], emoji: [], violet: [], focus: [], motion: [] };
for (const dn of ['iPad Pro 11 landscape', 'iPhone 15 landscape']) {
  const ctx = await b.newContext({ ...devices[dn], serviceWorkers: 'block', reducedMotion: 'reduce' });
  await ctx.route('**/*supabase.co/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE); await p.waitForTimeout(1500);
  await p.evaluate(() => { if (!G.S.dauVao) { G.S.dauVao = { lv: 1, nghe: 1, doc: 1, gt: 1, noi: 1, luc: G.vnNow(), dung: 6, tong: 12 }; G.save(); } });
  for (const [nm, go] of SCREENS) {
    await p.evaluate(() => { document.querySelectorAll('.modal').forEach((m) => m.remove()); if (G.stopEngine) G.stopEngine(); });
    await p.evaluate(go); await p.waitForTimeout(900);
    await p.evaluate(() => { document.querySelectorAll('.modal').forEach((m) => m.remove()); });
    const r = await p.evaluate(audit, dn.split(' ')[0] + ' · ' + nm);
    for (const k of ['tap', 'contrast', 'emoji', 'violet']) all[k].push(...r[k]);
    if (SHOTS) { fs.mkdirSync(path.join(ROOT, 'scratch/ui-check'), { recursive: true }); await p.screenshot({ path: path.join(ROOT, 'scratch/ui-check', dn.split(' ')[0] + '-' + nm + '.png') }); }
  }
  // vòng focus: Tab tới một nút, nút đó phải có viền hoặc bóng
  await p.evaluate(() => { G.goLobby(); }); await p.waitForTimeout(500);
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
  const ring = await p.evaluate(() => { const e = document.activeElement, s = e && getComputedStyle(e); return e && e !== document.body ? (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || /0px 0px 0px [2-9]/.test(s.boxShadow) : true; });
  if (!ring) all.focus.push(dn + ': nút đang được chọn bằng bàn phím không có vòng focus');
  if (errs.length) all.focus.push(dn + ': lỗi JS ' + errs.join(' | '));
  await ctx.close();
}
await b.close(); server.close();

// chuyển động trên thuộc tính bố cục trong CSS
const css = fs.readFileSync(path.join(ROOT, 'game/css/game.css'), 'utf8');
css.split('\n').forEach((l, i) => { if (/transition:[^;]*\b(left|right|top|width|height|margin|padding)\b/.test(l) && !/transition:\s*none/.test(l)) all.motion.push('game.css:' + (i + 1) + ' ' + l.trim().slice(0, 90)); });

const LABEL = { tap: 'Ô chạm nhỏ hơn 44 px', contrast: 'Chữ thiếu tương phản', emoji: 'Emoji làm đầu dòng', violet: 'Màu tím', focus: 'Vòng focus / lỗi', motion: 'Chuyển động trên thuộc tính bố cục' };
let n = 0;
for (const k of Object.keys(LABEL)) {
  const xs = [...new Set(all[k])];
  n += xs.length;
  console.log('\n' + LABEL[k] + ': ' + xs.length);
  xs.slice(0, 40).forEach((x) => console.log('  - ' + x));
  if (xs.length > 40) console.log('  … và ' + (xs.length - 40) + ' mục nữa');
}
console.log('\nTổng: ' + n + (n ? ' mục cần xem' : ' · đạt'));
