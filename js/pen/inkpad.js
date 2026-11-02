/* Bảng viết tiếng Anh bằng Apple Pencil.

   Khác bảng viết chữ Hán ở chỗ không có dữ liệu nét để so, nên chấm bằng cách
   chồng hình: vẽ từ mẫu lên một lớp ẩn rồi xem nét bút phủ được bao nhiêu phần
   mẫu và lệch ra ngoài bao nhiêu. Chỉ có ý nghĩa ở chế độ đồ theo mẫu; viết tự do
   thì hiện mẫu chồng lên để tự so.
*/

const FONT = '"Avenir Next", "Segoe UI", system-ui, sans-serif';

export class InkPad {
  constructor(host, { penOnly = false, height = 170 } = {}) {
    this.penOnly = penOnly;
    this.strokes = [];
    this.current = null;
    this.ghost = '';
    this.showGhost = false;
    this.locked = false;
    this.palmGuard = false;

    this.wrap = document.createElement('div');
    this.wrap.className = 'inkpad';
    this.wrap.style.height = `${height}px`;
    this.bg = document.createElement('canvas');
    this.fg = document.createElement('canvas');
    this.wrap.append(this.bg, this.fg);
    host.append(this.wrap);

    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.fit = this.fit.bind(this);
    this.fg.addEventListener('pointerdown', this.onDown);
    this.fg.addEventListener('pointermove', this.onMove);
    this.fg.addEventListener('pointerup', this.onUp);
    this.fg.addEventListener('pointercancel', this.onUp);
    window.addEventListener('resize', this.fit);
    requestAnimationFrame(this.fit);
  }

  fit() {
    const r = this.wrap.getBoundingClientRect();
    if (!r.width) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.W = r.width; this.H = r.height; this.dpr = dpr;
    for (const c of [this.bg, this.fg]) {
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      c.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    this.redrawBg();
    this.redrawInk();
  }

  /* Cỡ chữ mẫu tự co để từ dài vẫn nằm vừa bảng */
  fontSize(ctx, text) {
    let size = this.H * 0.5;
    ctx.font = `${size}px ${FONT}`;
    const w = ctx.measureText(text).width;
    if (w > this.W * 0.92) size *= (this.W * 0.92) / w;
    return size;
  }

  drawGhostOn(ctx, color) {
    const size = this.fontSize(ctx, this.ghost);
    ctx.font = `${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(this.ghost, this.W / 2, this.baseline());
  }

  baseline() { return this.H * 0.68; }

  redrawBg() {
    if (!this.W) return;
    const ctx = this.bg.getContext('2d');
    ctx.clearRect(0, 0, this.W, this.H);
    const cs = getComputedStyle(document.documentElement);
    const line = cs.getPropertyValue('--line').trim() || '#ccc';
    const faint = cs.getPropertyValue('--ink-faint').trim() || '#999';
    const base = this.baseline();
    const x = this.H * 0.26;
    // Bốn đường kẻ tập viết: đỉnh, chữ thường, chân chữ, đuôi chữ
    [[base - x * 1.75, 1, line], [base - x, 1, line], [base, 2, faint], [base + x * 0.8, 1, line]].forEach(([y, w, col]) => {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(this.W - 10, y); ctx.stroke();
    });
    if (this.ghost && this.showGhost) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      this.drawGhostOn(ctx, faint);
      ctx.restore();
    }
  }

  setWord(word, { ghost = false } = {}) {
    this.ghost = word;
    this.showGhost = ghost;
    this.clear();
    this.redrawBg();
  }

  setGhost(on) { this.showGhost = on; this.redrawBg(); }

  /* ---------- bút ------------------------------------------------------ */

  at(e) {
    const r = this.fg.getBoundingClientRect();
    const p = e.pointerType === 'pen' ? Math.max(0.2, e.pressure || 0.5) : 0.55;
    return [e.clientX - r.left, e.clientY - r.top, p];
  }

  onDown(e) {
    if (this.locked) return;
    // Đã thấy bút thì mọi chạm bằng ngón tay và lòng bàn tay đều bị bỏ qua
    if (e.pointerType === 'pen') this.palmGuard = true;
    if (e.pointerType === 'touch' && (this.penOnly || this.palmGuard)) return;
    e.preventDefault();
    this.fg.setPointerCapture(e.pointerId);
    this.current = [this.at(e)];
    this.strokes.push(this.current);
  }

  onMove(e) {
    if (!this.current) return;
    e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of evs) {
      const p = this.at(ev);
      const last = this.current[this.current.length - 1];
      if (Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.7) continue;
      this.current.push(p);
      this.segment(this.fg.getContext('2d'), last, p);
    }
  }

  onUp() { this.current = null; }

  /* Màu mực lấy theo giao diện để nét luôn nổi, cả sáng lẫn tối */
  inkColor() {
    return getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1f3a';
  }

  segment(ctx, a, b) {
    ctx.strokeStyle = this.inkColor();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 1.4 + 3.2 * ((a[2] + b[2]) / 2);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  }

  redrawInk() {
    if (!this.W) return;
    const ctx = this.fg.getContext('2d');
    ctx.clearRect(0, 0, this.W, this.H);
    for (const s of this.strokes) {
      if (s.length === 1) {
        ctx.fillStyle = this.inkColor();
        ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 2.2, 0, 7); ctx.fill();
      }
      for (let i = 1; i < s.length; i++) this.segment(ctx, s[i - 1], s[i]);
    }
  }

  hasInk() { return this.strokes.length > 0; }
  undo() { this.strokes.pop(); this.redrawInk(); }
  clear() { this.strokes = []; this.current = null; this.redrawInk(); }
  lock(on) { this.locked = on; }

  /* ---------- chấm khi đồ theo mẫu --------------------------------------- */

  /** 0–100: nét phủ được bao nhiêu mẫu, kết hợp với việc không tô lem ra ngoài. */
  traceScore() {
    if (!this.W || !this.ghost || !this.strokes.length) return 0;
    const S = 0.5;
    const w = Math.round(this.W * S), hh = Math.round(this.H * S);
    const make = () => {
      const c = document.createElement('canvas');
      c.width = w; c.height = hh;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.scale(S, S);
      return x;
    };
    const ghostCtx = make();
    this.drawGhostOn(ghostCtx, '#000');
    // Vùng cho phép: mẫu nới rộng vài điểm ảnh, vì không ai đồ trùng khít được
    const wide = make();
    wide.strokeStyle = '#000'; wide.lineWidth = 9; wide.lineJoin = 'round';
    const size = this.fontSize(wide, this.ghost);
    wide.font = `${size}px ${FONT}`;
    wide.textAlign = 'center';
    wide.strokeText(this.ghost, this.W / 2, this.baseline());
    wide.fillText(this.ghost, this.W / 2, this.baseline());

    const inkCtx = make();
    inkCtx.strokeStyle = '#000'; inkCtx.lineCap = 'round'; inkCtx.lineWidth = 8;
    for (const s of this.strokes) {
      inkCtx.beginPath();
      s.forEach((p, i) => (i ? inkCtx.lineTo(p[0], p[1]) : inkCtx.moveTo(p[0], p[1])));
      inkCtx.stroke();
    }

    const G = ghostCtx.getImageData(0, 0, w, hh).data;
    const W2 = wide.getImageData(0, 0, w, hh).data;
    const I = inkCtx.getImageData(0, 0, w, hh).data;
    let ghostPx = 0, covered = 0, inkPx = 0, inside = 0;
    for (let i = 3; i < G.length; i += 4) {
      const g = G[i] > 90, k = I[i] > 90, z = W2[i] > 90;
      if (g) { ghostPx++; if (k) covered++; }
      if (k) { inkPx++; if (z) inside++; }
    }
    if (!ghostPx || !inkPx) return 0;
    const cover = covered / ghostPx, precision = inside / inkPx;
    return Math.round(Math.min(1, (2 * cover * precision) / (cover + precision || 1) * 1.15) * 100);
  }

  destroy() {
    window.removeEventListener('resize', this.fit);
    this.wrap.remove();
  }
}
