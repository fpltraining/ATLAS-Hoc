/* Hiệu ứng làm app "đã tay": âm thanh ngắn (tạo bằng WebAudio, không cần tệp), pháo giấy,
   thẻ ăn mừng khi xong việc kèm nút sang việc kế tiếp, popup huy hiệu và lên rank.
   Tôn trọng "giảm chuyển động" của máy; âm thanh tắt được trong Cài đặt (settings.sfx). */

import { h } from './ui.js';
import * as store from './store.js';
import { artSvg } from './fx-art.js';

const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

/* ---------- âm thanh ---------- */
let ctx = null;
function audio() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { ctx = new C(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
// iPad chỉ cho phát tiếng sau một lần chạm: mở khoá âm thanh ở lần chạm đầu tiên
window.addEventListener('pointerdown', () => audio(), { once: true, passive: true });

function tone(freq, at, dur, type = 'sine', vol = 0.16) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const SOUNDS = {
  right: () => { tone(880, 0, 0.12); tone(1318.5, 0.08, 0.22); },
  wrong: () => { tone(233, 0, 0.16, 'triangle', 0.12); tone(185, 0.1, 0.24, 'triangle', 0.1); },
  done: () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.085, 0.3, 'triangle', 0.14)),
  badge: () => [783.99, 1046.5, 1318.5, 1567.98, 2093].forEach((f, i) => tone(f, i * 0.07, 0.4, 'sine', 0.12)),
  tap: () => tone(700, 0, 0.05, 'sine', 0.05),
};

export async function sound(kind) {
  if (!SOUNDS[kind] || (await store.settings()).sfx === false) return;
  try { SOUNDS[kind](); } catch { /* máy không phát được thì thôi */ }
}

/** Phản hồi khi trả lời: tiếng đúng/sai, ô vừa bấm nảy nhẹ hoặc lắc. */
export function answer(ok, el) {
  sound(ok ? 'right' : 'wrong');
  if (el && !reduced()) {
    el.classList.remove('fx-pop', 'fx-shake');
    void el.offsetWidth;
    el.classList.add(ok ? 'fx-pop' : 'fx-shake');
  }
}

/* ---------- pháo giấy ---------- */
export function confetti({ count = 110, duration = 1700, y = 0.32 } = {}) {
  if (reduced()) return;
  const c = document.createElement('canvas');
  c.className = 'fx-confetti';
  document.body.append(c);
  const W = innerWidth, H = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  c.width = W * dpr; c.height = H * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  const colors = ['#c8553d', '#2f7a63', '#f2bf3c', '#4a68d8', '#e88aa3', '#8bbac0'];
  const ps = Array.from({ length: count }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 160, y: H * y,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 10 - 5,
    r: Math.random() * 7 + 5, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.35,
    c: colors[Math.floor(Math.random() * colors.length)], round: Math.random() < 0.3,
  }));
  const t0 = performance.now();
  const frame = (t) => {
    const k = (t - t0) / duration;
    g.clearRect(0, 0, W, H);
    for (const p of ps) {
      p.vy += 0.3; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.a += p.va;
      g.save();
      g.globalAlpha = Math.max(0, 1 - k * k);
      g.translate(p.x, p.y);
      g.rotate(p.a);
      g.fillStyle = p.c;
      if (p.round) { g.beginPath(); g.arc(0, 0, p.r / 3, 0, 6.28); g.fill(); } else g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      g.restore();
    }
    if (k < 1) requestAnimationFrame(frame); else c.remove();
  };
  requestAnimationFrame(frame);
}

/* ---------- dáng nhân vật ----------
   Han và Kai đủ 12 dáng (ảnh ChatGPT đợt 1–2); nhân vật nào thiếu dáng thì dùng dáng cũ gần nghĩa nhất. */
const ALL_POSES = ['mung', 'khen', 'nghi', 'boi-roi', 'dong-vien', 'giai-thich', 'doc', 'viet', 'nghe', 'ngu', 'chao', 'thang'];
const NEW_POSES = { han: new Set(ALL_POSES), kai: new Set(ALL_POSES) };
const OLD = { mung: 'khen', thang: 'khen', 'boi-roi': 'nghi', doc: 'giai-thich', viet: 'giai-thich', ngu: 'nghi' };
export function poseSrc(who, pose) {
  const p = NEW_POSES[who]?.has(pose) || !OLD[pose] ? pose : OLD[pose];
  return `img/mascot/${who}-${p}.webp`;
}

/* ---------- thẻ ăn mừng (không chặn màn hình) ---------- */
let current = null;
let shownAt = 0;
// sang màn khác thì thẻ tự đóng (trừ khi vừa hiện, lúc bài học đang tự chuyển màn kết quả)
window.addEventListener('hashchange', () => { if (current && Date.now() - shownAt > 1200) closeCard(); });
function closeCard() { if (!current) return; const el = current; current = null; el.classList.add('out'); setTimeout(() => el.remove(), 220); }

/**
 * opts: { title, sub, who: 'han'|'kai', pose, art (tên hình Fluent), big, next: { title, href }, sound }
 */
export function celebrate(opts = {}) {
  closeCard();
  const pose = opts.pose || 'khen';
  let pic;
  if (opts.who) pic = h('img.fx-ava', { src: poseSrc(opts.who, pose), alt: '' });
  else { pic = h('span.fx-art'); pic.innerHTML = artSvg(opts.art || 'party-popper', 64); }
  const card = h(`div.fx-card${opts.big ? '.big' : ''}`, { role: 'status' },
    pic,
    h('div.grow',
      h('b.fx-title', opts.title || 'Xong!'),
      opts.sub ? h('div.fx-sub', opts.sub) : null,
      h('div.fx-btns',
        opts.next ? h('a.btn.seal.sm', { href: opts.next.href, onclick: closeCard }, `${opts.next.label || 'Tiếp'}: ${opts.next.title} ›`) : null,
        h('button.btn.ghost.sm', { onclick: closeCard }, opts.next ? 'Để sau' : 'Đóng'),
      ),
    ),
  );
  document.body.append(card);
  current = card;
  shownAt = Date.now();
  sound(opts.sound || 'done');
  confetti(opts.big ? { count: 170, duration: 2200 } : { count: 90 });
  setTimeout(() => { if (current === card) closeCard(); }, opts.next ? 15000 : opts.big ? 9000 : 6000);
  return card;
}

/* ---------- popup lớn giữa màn: huy hiệu, lên rank ---------- */
const queue = [];
let showing = false;
export function spotlight(node, { title, sub, sound: snd = 'badge' } = {}) {
  queue.push({ node, title, sub, snd });
  if (!showing) nextSpot();
}
function nextSpot() {
  const it = queue.shift();
  if (!it) { showing = false; return; }
  showing = true;
  const close = () => { wrap.classList.add('out'); setTimeout(() => { wrap.remove(); nextSpot(); }, 220); };
  const wrap = h('div.fx-spot', { onclick: (e) => { if (e.target === wrap) close(); } },
    h('div.fx-spot-card',
      h('div.fx-spot-art', it.node),
      h('div.fx-spot-title', it.title),
      it.sub ? h('div.fx-spot-sub', it.sub) : null,
      h('button.btn.seal.block', { onclick: close }, 'Tuyệt!'),
    ),
  );
  document.body.append(wrap);
  sound(it.snd);
  confetti({ count: 140, y: 0.4 });
}
