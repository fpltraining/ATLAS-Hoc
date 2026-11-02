/* Sổ tay ngữ pháp B1–B2 (từ Inklish): lật trang, điền từ, viết tay trực tiếp lên trang.
   Sách có CSS riêng nên đặt trong shadow DOM để không đụng giao diện chung. */

import * as store from '../store.js';
import * as content from '../content.js';
import { wordSheet } from '../kit.js';
import { h } from '../ui.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export async function render() {
  const [BOOK, settings, savedPage, work0, score0] = await Promise.all([
    content.book(), store.settings(), store.kvGet('bookPage', 0), store.kvGet('bookWork', {}), store.kvGet('bookScore', {}),
  ]);
  const host = h('div.book-host');
  const root = host.attachShadow({ mode: 'open' });
  const st = document.createElement('style');
  st.textContent = BOOK.style;
  root.appendChild(st);

  const dark = document.documentElement.dataset.theme === 'dark'
    || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  if (dark) host.setAttribute('data-theme', 'night');

  const shell = document.createElement('div');
  shell.className = 'bshell';
  shell.style.position = 'relative';
  shell.style.overflow = 'hidden';
  shell.style.paddingTop = '44px';
  if (dark) shell.setAttribute('data-theme', 'night');
  shell.innerHTML =
    '<div class="prog" id="prog"></div>' +
    '<div class="bar">' +
    '<button class="ui" id="tocb">MỤC LỤC</button>' +
    '<div class="title" id="title"></div>' +
    '<button class="ui" id="inkb">BÚT</button>' +
    '<button class="ui" id="smaller">A−</button>' +
    '<button class="ui" id="bigger">A+</button>' +
    '</div><div class="scrim" id="scrim"></div>' + BOOK.toc + BOOK.pen + BOOK.html;
  root.appendChild(shell);

  const q = (s) => root.querySelector(s);
  const qq = (s) => Array.from(root.querySelectorAll(s));
  const book = q('#book'), pages = qq('.page'), title = q('#title'), prog = q('#prog');
  let cur = clamp(savedPage || 0, 0, pages.length - 1);
  let size = settings.bookFs || 17;
  let inkMode = false, penColor = '#1C6DD0', erasing = false;

  const setH = () => shell.style.setProperty('--bh', `${Math.max(440, Math.min(innerHeight - 210, 900))}px`);
  shell.style.setProperty('--fs', `${size}px`);
  setH();

  /* ---- lật trang ---- */
  const paint = () => {
    const i = Math.round(book.scrollLeft / Math.max(1, book.clientWidth));
    if (i !== cur) { cur = i; store.kvSet('bookPage', i); }
    const f = pages[cur]?.querySelector('.pfoot span');
    title.textContent = f ? f.textContent : '';
    prog.style.width = `${((cur + 1) / pages.length) * 100}%`;
    qq('.toc-drawer a').forEach((a, k) => a.classList.toggle('here', k === cur));
    ensureInk(cur);
  };
  let pt;
  book.addEventListener('scroll', () => { clearTimeout(pt); pt = setTimeout(paint, 90); }, { passive: true });
  const goTo = (i) => book.scrollTo({ left: i * book.clientWidth, behavior: 'smooth' });

  const drawer = q('#drawer'), scrim = q('#scrim');
  const op = (v) => { drawer.classList.toggle('show', v); scrim.classList.toggle('show', v); };
  q('#tocb').onclick = () => op(!drawer.classList.contains('show'));
  scrim.onclick = () => op(false);
  qq('.toc-drawer a').forEach((a) => { a.onclick = () => { op(false); goTo(Number(a.dataset.go)); }; });

  const setSize = (v) => {
    size = clamp(v, 14, 23);
    shell.style.setProperty('--fs', `${size}px`);
    store.setSetting('bookFs', size);
    Object.values(inked).forEach((p) => p?.fit());
  };
  q('#bigger').onclick = () => setSize(size + 1);
  q('#smaller').onclick = () => setSize(size - 1);

  /* ---- bài tập điền từ, viết bằng Apple Pencil qua Scribble ---- */
  const nrm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
  const work = work0 || {};
  let saveTimer = 0;
  const saveWork = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.kvSet('bookWork', work), 400); };
  function mark(inp, id) {
    const want = BOOK.ans[id];
    if (want == null) return false;
    const ok = want.split('|').some((x) => nrm(x) === nrm(inp.value));
    inp.classList.toggle('ok', ok);
    inp.classList.toggle('no', !ok);
    const ck = root.querySelector(`.ck[data-for="${id}"]`);
    if (ck) { ck.textContent = ok ? '✓' : '✕'; ck.style.color = ok ? '#1F9D55' : '#C0524A'; }
    return ok;
  }
  qq('input.gap').forEach((inp) => {
    const id = inp.dataset.id;
    if (work[id]) { inp.value = work[id]; mark(inp, id); }
    inp.addEventListener('input', () => { work[id] = inp.value; inp.classList.remove('ok', 'no'); saveWork(); });
    inp.addEventListener('blur', () => { if (inp.value.trim()) mark(inp, id); });
  });
  qq('[data-check]').forEach((b) => {
    b.onclick = () => {
      const g = b.dataset.check;
      let ok = 0, all = 0;
      qq('input.gap').forEach((inp) => {
        if (inp.dataset.id.split('-')[0] === g) { all++; if (mark(inp, inp.dataset.id)) ok++; }
      });
      const sc = root.querySelector(`#sc-${g}`);
      if (sc) sc.textContent = `${ok}/${all}`;
      store.kvSet('bookScore', { ...score0, [g]: `${ok}/${all}` });
    };
  });
  qq('[data-reveal]').forEach((b) => {
    b.onclick = () => {
      const g = b.dataset.reveal;
      qq('input.gap').forEach((inp) => {
        if (inp.dataset.id.split('-')[0] !== g) return;
        const want = BOOK.ans[inp.dataset.id];
        if (want == null) return;
        inp.value = want.split('|')[0];
        work[inp.dataset.id] = inp.value;
        mark(inp, inp.dataset.id);
      });
      saveWork();
    };
  });

  /* ---- chạm vào từ tiếng Anh trong sách để tra ---- */
  book.addEventListener('click', (e) => {
    if (inkMode || e.target.closest('input,button,a')) return;
    const t = e.target.closest('[data-w], .en, i, em, b, strong');
    if (!t) return;
    const word = (t.dataset?.w || t.textContent || '').trim();
    if (/^[A-Za-z' -]{2,24}$/.test(word)) wordSheet(word.split(' ')[0]);
  });

  /* ---- viết trên từng trang ---- */
  const inked = {};
  function ensureInk(i) {
    const c = pages[i]?.querySelector('canvas.ink');
    if (!c || inked[i]) return;
    inked[i] = wirePage(c, i);
  }

  function wirePage(c, page) {
    const ctx = c.getContext('2d', { desynchronized: true });
    let strokes = [], cur2 = null, W = 0, H = 0, R = null, palm = false;
    const key = `bookInk:${page}`;
    const width = (p) => 1.2 + 3.4 * p;
    const seg = (s, a, b) => {
      ctx.strokeStyle = s.c; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = width((a[2] + b[2]) / 2);
      ctx.beginPath();
      ctx.moveTo(a[0] * W, a[1] * H);
      ctx.lineTo(b[0] * W, b[1] * H);
      ctx.stroke();
    };
    const redraw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const s of strokes) for (let i = 1; i < s.p.length; i++) seg(s, s.p[i - 1], s.p[i]);
    };
    const fit = () => {
      const r = c.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return;
      const dpr = Math.min(devicePixelRatio || 1, 3);
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };
    const at = (e) => [
      clamp((e.clientX - R.left) / R.width, 0, 1),
      clamp((e.clientY - R.top) / R.height, 0, 1),
      e.pointerType === 'pen' ? Math.max(0.2, e.pressure || 0.5) : 0.5,
    ];
    const persist = () => { clearTimeout(c._t); c._t = setTimeout(() => store.kvSet(key, strokes), 400); };
    c.addEventListener('pointerdown', (e) => {
      if (!inkMode) return;
      if (e.pointerType === 'pen') palm = true;
      if (e.pointerType === 'touch' && (settings.penOnly || palm)) return;
      e.preventDefault();
      R = c.getBoundingClientRect();
      c.setPointerCapture(e.pointerId);
      const p = at(e);
      if (erasing) {
        const before = strokes.length;
        strokes = strokes.filter((s) => !s.p.some((q2) => Math.hypot((q2[0] - p[0]) * W, (q2[1] - p[1]) * H) < 14));
        if (strokes.length !== before) { redraw(); persist(); }
        return;
      }
      cur2 = { c: penColor, p: [p] };
      strokes.push(cur2);
    });
    c.addEventListener('pointermove', (e) => {
      if (!cur2) return;
      e.preventDefault();
      for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) {
        const p = at(ev), last = cur2.p[cur2.p.length - 1];
        if (Math.hypot((p[0] - last[0]) * W, (p[1] - last[1]) * H) < 1) continue;
        cur2.p.push(p);
        seg(cur2, last, p);
      }
    });
    const up = () => { if (cur2) { cur2 = null; persist(); } };
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    fit();
    store.kvGet(key).then((v) => { if (Array.isArray(v)) { strokes = v; redraw(); } });
    return {
      fit,
      undo: () => { strokes.pop(); redraw(); persist(); },
      clear: () => { strokes = []; redraw(); persist(); },
    };
  }

  /* ---- công cụ bút ---- */
  const tools = q('#pentools');
  qq('#pentools .sw').forEach((sw) => {
    sw.onclick = () => {
      penColor = sw.dataset.c;
      erasing = false;
      qq('#pentools .sw').forEach((x) => x.classList.toggle('on', x === sw));
      q('#erase').style.color = '';
    };
  });
  q('#undo').onclick = () => inked[cur]?.undo();
  q('#clearp').onclick = () => inked[cur]?.clear();
  q('#erase').onclick = () => {
    erasing = !erasing;
    q('#erase').style.color = erasing ? 'var(--teal)' : '';
  };
  q('#inkb').onclick = () => {
    inkMode = !inkMode;
    shell.classList.toggle('ink', inkMode);
    tools?.classList.toggle('show', inkMode);
    q('#inkb').classList.toggle('on', inkMode);
    ensureInk(cur);
    inked[cur]?.fit();
  };

  const onResize = () => { setH(); Object.values(inked).forEach((p) => p?.fit()); };
  window.addEventListener('resize', onResize);

  requestAnimationFrame(() => {
    book.scrollLeft = cur * book.clientWidth;
    paint();
  });

  return {
    title: 'Sổ tay ngữ pháp',
    el: host,
    cleanup: () => window.removeEventListener('resize', onResize),
  };
}
