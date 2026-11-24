// Nạp code game (ES5, gắn vào window.G) trong Node để kiểm thử logic không cần trình duyệt.
import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export function loadGame(files) {
  const store = {};
  const ctx = {
    console, Date, Math, JSON, setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0,
    localStorage: { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } },
    navigator: {}, document: { addEventListener() {}, getElementById: () => null, createElement: () => ({ style: {}, appendChild() {} }) },
    addEventListener() {}, location: { href: '', hash: '', search: '', origin: '', pathname: '' }, performance: { now: () => 0 }
  };
  ctx.window = ctx; ctx.self = ctx; ctx.G = ctx.window.G = {};
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, 'game', f), 'utf8'), ctx, { filename: f });
  return ctx.window.G;
}
let fails = 0, passes = 0;
export function eq(name, a, b) {
  const ok = JSON.stringify(a) === JSON.stringify(b);
  if (ok) passes++; else { fails++; console.log('  ✗ ' + name + '\n      có:  ' + JSON.stringify(a) + '\n      cần: ' + JSON.stringify(b)); }
}
export function ok(name, cond) { if (cond) passes++; else { fails++; console.log('  ✗ ' + name); } }
export function done(title) { console.log((fails ? '✗ ' : '✓ ') + title + ': ' + passes + ' đạt' + (fails ? ', ' + fails + ' hỏng' : '')); return fails; }
