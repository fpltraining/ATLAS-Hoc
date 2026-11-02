/* Những tiện ích dựng giao diện dùng chung cho mọi màn hình. */

/**
 * Tạo phần tử DOM gọn gàng.
 *   h('div.card', { onclick }, 'nội dung', h('b', 'đậm'))
 * Chuỗi con được chèn dưới dạng VĂN BẢN, không phải HTML — tránh mọi rủi ro
 * khi nội dung giáo trình có ký tự đặc biệt.
 */
export function h(spec, props, ...children) {
  const [tag, ...classes] = String(spec).split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');

  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) {
    children.unshift(props);
  } else if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className += (el.className ? ' ' : '') + v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
  }

  add(el, children);
  return el;
}

function add(el, children) {
  for (const c of children.flat(4)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const frag = (...children) => {
  const f = document.createDocumentFragment();
  add(f, children);
  return f;
};

/* ---------- thông báo nhanh --------------------------------------------- */

let toastTimer = null;

export function toast(msg, ms = 2400) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

/* ---------- bảng trượt từ dưới lên -------------------------------------- */

export function sheet(...content) {
  const wrap = document.getElementById('sheet');
  const panel = document.getElementById('sheet-panel');
  panel.replaceChildren(h('div.sheet-grip'), ...content);
  wrap.hidden = false;

  const close = () => {
    wrap.hidden = true;
    wrap.removeEventListener('click', onClick);
  };
  const onClick = (e) => { if (e.target.closest('[data-close]')) close(); };
  wrap.addEventListener('click', onClick);
  return close;
}

export const closeSheet = () => { document.getElementById('sheet').hidden = true; };

/* ---------- các mảnh giao diện lặp lại ---------------------------------- */

/** Dòng "pinyin · âm Hán Việt" đặt dưới một từ. */
export function readingLine(py, hv) {
  return h('div.row', { style: { gap: '8px', flexWrap: 'wrap' } },
    py && h('span.py', py),
    hv && h('span.hv', hv),
  );
}

export function pill(text, tone = 'plain') {
  return h(`span.pill.${tone}`, text);
}

export function backLink(href, label) {
  return h('a.btn.ghost.sm', { href }, '‹ ', label);
}

/** Thanh tiến độ 0…1. */
export function progressBar(ratio) {
  return h('div.progress', h('i', { style: { width: `${Math.round(Math.max(0, Math.min(1, ratio)) * 100)}%` } }));
}

export function section(title, ...content) {
  return h('section', { style: { marginTop: '18px' } }, title && h('h2', title), ...content);
}

export function empty(mark, text, action) {
  return h('div.empty', h('div.big.cn', mark), h('p', text), action);
}

export function spinner(text = 'Đang tải…') {
  return h('div.empty', h('span.spin'), h('p.small', { style: { marginTop: '10px' } }, text));
}

/* ---------- định dạng --------------------------------------------------- */

export function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many || one}`;
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Tách một câu tiếng Trung thành các ký tự có thể bấm được. */
export function clickableHanzi(text, onTap, cls = '') {
  const wrap = h(`span.cn${cls ? '.' + cls : ''}`);
  for (const ch of text) {
    if (/[一-鿿㐀-䶿]/.test(ch)) {
      wrap.append(h('span', {
        style: { cursor: 'pointer' },
        onclick: (e) => { e.stopPropagation(); onTap(ch); },
      }, ch));
    } else {
      wrap.append(document.createTextNode(ch));
    }
  }
  return wrap;
}
