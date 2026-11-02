/* Bảng viết — lớp tiếp xúc trực tiếp với Apple Pencil.

   Bốn điều quyết định cảm giác viết có "thật" hay không:

   1. Pointer Events thay vì Touch Events, để đọc được lực nhấn và độ nghiêng.
   2. getCoalescedEvents() — Apple Pencil lấy mẫu 240 lần/giây nhưng trình duyệt
      chỉ bắn sự kiện theo nhịp màn hình (~120Hz). Không gọi hàm này thì mất
      một nửa số điểm và nét sẽ gãy khúc ở đoạn viết nhanh.
   3. Chống tì tay: khi đã thấy bút, mọi chạm bằng ngón/lòng bàn tay bị bỏ qua.
   4. Vẽ ngay đoạn cuối trong pointermove (canvas desynchronized) thay vì đợi
      khung hình kế tiếp, để mực bám sát đầu bút.
*/

import { drawStroke, drawSegment, smooth } from './brush.js';
import { drawGrid, drawChar, drawMedianHint, drawStrokeNumbers } from './grid.js';
import * as sound from './sound.js';
import { GRID } from '../data.js';

const readColors = () => {
  const cs = getComputedStyle(document.documentElement);
  const v = (n) => cs.getPropertyValue(n).trim();
  return {
    ink: v('--ink'),
    line: v('--line'),
    faint: v('--ink-faint'),
    seal: v('--seal'),
    jade: v('--jade'),
    gold: v('--gold'),
    paper2: v('--paper-2'),
  };
};

/* getComputedStyle buộc trình duyệt tính lại style — quá đắt để gọi trong
   pointermove (Apple Pencil bắn tới 240 điểm/giây). Màu chỉ đổi khi người dùng
   chuyển sáng/tối, nên nhớ lại và chỉ tính lại khi chủ đề thay đổi. */
let colorCache = null;
const COLORS = () => (colorCache ||= readColors());
export const invalidateColors = () => { colorCache = null; };

if (typeof window !== 'undefined') {
  const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
  mq?.addEventListener?.('change', invalidateColors);
  new MutationObserver(invalidateColors).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'class'],
  });
}

export class WritingPad {
  /**
   * @param {HTMLElement} host phần tử .pad
   * @param {Object} opts { grid, brush, penOnly, onStroke, onStrokeStart }
   */
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = { grid: 'tian', brush: 'but-long', penOnly: false, penSound: true, ...opts };

    this.bg = document.createElement('canvas');
    this.ink = document.createElement('canvas');
    host.append(this.bg, this.ink);

    this.bgCtx = this.bg.getContext('2d');
    this.inkCtx = this.ink.getContext('2d', { desynchronized: true });

    this.char = null;          // { strokes, medians }
    this.hint = null;          // { ghost:boolean, upTo:number, median:number|null, numbers:boolean }
    this.strokes = [];         // các nét đã viết xong, toạ độ pixel
    this.current = null;
    this.pointerId = null;
    this.penSeen = false;      // đã từng thấy Apple Pencil trong phiên này
    this.size = 0;
    this.locked = false;
    this._rectX = 0;
    this._rectY = 0;

    this._onDown = this._onDown.bind(this);
    this._onMove = this._onMove.bind(this);
    this._onUp = this._onUp.bind(this);

    this.ink.addEventListener('pointerdown', this._onDown);
    this.ink.addEventListener('pointermove', this._onMove);
    this.ink.addEventListener('pointerup', this._onUp);
    this.ink.addEventListener('pointercancel', this._onUp);
    this.ink.addEventListener('pointerleave', this._onUp);
    // Chặn iPad hiểu nhầm nét viết thành thao tác cuộn / phóng to
    this.ink.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  /* ---------- kích thước & vẽ lại ------------------------------------- */

  /**
   * Đo lại và dựng lại bộ đệm vẽ.
   *
   * Kích thước phải lấy từ chính CANVAS chứ không phải khung .pad bên ngoài:
   * khung có viền 1px nên rộng hơn canvas 2px. Lệch 2px nghe thì nhỏ, nhưng
   * toạ độ bút đo theo canvas còn nét mẫu vẽ theo kích thước đã lưu — hai hệ
   * lệch nhau là chấm điểm sai.
   */
  resize() {
    const rect = this.ink.getBoundingClientRect();
    this._rectX = rect.left;
    this._rectY = rect.top;
    const size = Math.min(rect.width, rect.height);
    if (!size || Math.abs(size - this.size) < 0.5) return;
    this.size = size;

    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    for (const c of [this.bg, this.ink]) {
      c.width = Math.round(size * dpr);
      c.height = Math.round(size * dpr);
      // Không đặt style.width/height: để CSS giữ đúng 100% khung, nhờ vậy
      // kích thước hiển thị luôn khớp với hệ toạ độ dùng để vẽ.
      c.getContext('2d').setTransform(c.width / size, 0, 0, c.height / size, 0, 0);
    }
    this.redraw();
  }

  /**
   * Bảo đảm đã đo kích thước trước khi dùng.
   * ResizeObserver chạy bất đồng bộ, nên ngay sau khi mở màn hình có một
   * khoảnh khắc size vẫn bằng 0 — nếu người dùng đặt bút đúng lúc đó thì toạ
   * độ sẽ không được quy đổi và nét viết đúng vẫn bị chấm trượt.
   */
  ensureSize() {
    if (!this.size) this.resize();
    return this.size;
  }

  /** Hệ số đổi pixel ↔ đơn vị 1024 dùng khi chấm nét. */
  get scale() { return this.ensureSize() / GRID; }

  setChar(char) {
    this.char = char;
    this.clearInk();
    this.redrawBg();
  }

  /** hint: { ghost, upTo, median, numbers } */
  setHint(hint) {
    this.hint = hint;
    this.redrawBg();
  }

  setOption(key, value) {
    this.opts[key] = value;
    this.redraw();
  }

  redraw() { this.redrawBg(); this.redrawInk(); }

  redrawBg() {
    if (!this.size) return;
    const c = COLORS();
    const ctx = this.bgCtx;
    ctx.clearRect(0, 0, this.size, this.size);
    drawGrid(ctx, this.size, this.opts.grid, c.line);

    if (!this.char) return;
    const h = this.hint || {};

    if (h.ghost) {
      drawChar(ctx, this.char.strokes, this.size, { color: c.paper2 });
    }
    if (typeof h.upTo === 'number' && h.upTo > 0) {
      drawChar(ctx, this.char.strokes, this.size, { color: c.line, upTo: h.upTo });
    }
    if (typeof h.median === 'number' && this.char.medians[h.median]) {
      drawMedianHint(ctx, this.char.medians[h.median], this.size, c.seal);
    }
    if (h.numbers) {
      drawStrokeNumbers(ctx, this.char.medians, this.size, c.seal);
    }
  }

  redrawInk() {
    if (!this.size) return;
    const ctx = this.inkCtx;
    const ink = COLORS().ink;
    ctx.clearRect(0, 0, this.size, this.size);

    // Các nét đã chấm đạt và được thay bằng hình mẫu
    if (this.modelStrokes?.length && this.char) {
      for (const i of this.modelStrokes) {
        drawChar(ctx, this.char.strokes, this.size, { color: ink, only: i });
      }
    }
    const style = { color: ink, base: this.size / 16, style: this.opts.brush };
    for (const s of this.strokes) drawStroke(ctx, s, style);
    if (this.current) drawStroke(ctx, this.current, style);
  }

  clearInk() {
    this.strokes = [];
    this.modelStrokes = [];
    this.current = null;
    this.redrawInk();
  }

  undo() {
    this.strokes.pop();
    this.redrawInk();
  }

  lock(v = true) { this.locked = v; }

  /* ---------- sự kiện bút ---------------------------------------------- */

  _accept(e) {
    if (this.locked) return false;
    if (e.pointerType === 'pen') { this.penSeen = true; return true; }
    if (this.opts.penOnly) return false;
    // Chống tì tay: đã dùng bút thì không nhận chạm tay nữa
    if (this.penSeen && e.pointerType === 'touch') return false;
    return true;
  }

  /* Vị trí canvas trên màn hình, đo một lần mỗi nét.
     getBoundingClientRect() có thể buộc trình duyệt tính lại layout; gọi nó cho
     từng điểm gộp nghĩa là tới 240 lần/giây. Trong lúc viết, canvas không thể
     xê dịch (đã bắt pointer và chặn cuộn), nên đo lúc đặt bút là đủ. */
  _syncRect() {
    const r = this.ink.getBoundingClientRect();
    this._rectX = r.left;
    this._rectY = r.top;
  }

  _pt(e) {
    let tilt = 0;
    let az = 0;   // HƯỚNG nghiêng: bút đang ngả về phía nào
    if (typeof e.altitudeAngle === 'number') {
      // altitudeAngle: π/2 là dựng đứng, 0 là nằm sát mặt kính
      tilt = 1 - Math.min(1, Math.max(0, e.altitudeAngle / (Math.PI / 2)));
      if (typeof e.azimuthAngle === 'number') az = e.azimuthAngle;
      else if (e.tiltX !== undefined) az = Math.atan2(e.tiltY || 0, e.tiltX || 0);
    } else if (e.tiltX !== undefined) {
      tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 90);
      az = Math.atan2(e.tiltY || 0, e.tiltX || 0);
    }
    return {
      x: e.clientX - this._rectX,
      y: e.clientY - this._rectY,
      p: e.pointerType === 'pen' ? (e.pressure || 0) : 0,
      tilt,
      az,
      t: e.timeStamp || performance.now(),
    };
  }

  _onDown(e) {
    if (this.pointerId !== null || !this._accept(e)) return;
    e.preventDefault();
    this.ensureSize();
    this._syncRect();
    // Khoi tao am thanh NGAY trong thao tac cham: iOS chi cho phep o day.
    if (this.opts.penSound) { sound.initSound(); sound.batDau(); }
    this.pointerId = e.pointerId;
    try { this.ink.setPointerCapture(e.pointerId); } catch { /* bỏ qua */ }
    this.current = [this._pt(e)];
    this.opts.onStrokeStart?.();
  }

  _onMove(e) {
    if (e.pointerId !== this.pointerId || !this.current) return;
    e.preventDefault();

    // Lấy TOÀN BỘ các mẫu mà trình duyệt gộp lại trong khung hình này
    const raw = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    const events = raw.length ? raw : [e];
    const style = { color: COLORS().ink, base: this.size / 16, style: this.opts.brush };
    let last = null, lastPrev = null;

    for (const ev of events) {
      const pt = this._pt(ev);
      const prev = this.current[this.current.length - 1];
      if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.7) continue;
      this.current.push(pt);
      drawSegment(this.inkCtx, prev, pt, style);   // vẽ ngay, không đợi khung hình
      last = pt; lastPrev = prev;
    }

    if (this.opts.penSound && last && lastPrev) {
      const dt = Math.max(1, last.t - lastPrev.t);
      const tocDo = Math.hypot(last.x - lastPrev.x, last.y - lastPrev.y) / dt;
      sound.capNhat(tocDo, last.p || 0.4);
    }
  }

  _onUp(e) {
    if (e.pointerId !== this.pointerId) return;
    if (this.opts.penSound) sound.ketThuc();
    this.pointerId = null;
    try { this.ink.releasePointerCapture(e.pointerId); } catch { /* bỏ qua */ }

    const pts = this.current;
    this.current = null;
    if (!pts || pts.length === 0) return;

    const finished = smooth(pts, pts.length > 6 ? 2 : 0);
    this.strokes.push(finished);
    this.redrawInk();                              // vẽ lại cho đẹp, có biến thiên độ dày

    this.opts.onStroke?.(this.toUnits(finished), finished);
  }

  /** Đổi một nét từ pixel sang hệ 0…1024 để đem đi chấm điểm. */
  toUnits(pts) {
    const k = this.scale;
    if (!k) return pts.map((p) => [p.x, p.y]);   // chưa đo được thì thà giữ nguyên
    return pts.map((p) => [p.x / k, p.y / k]);
  }

  /** Tất cả các nét đã viết, ở hệ 0…1024. */
  allUnits() {
    return this.strokes.map((s) => this.toUnits(s));
  }

  /* ---------- hiệu ứng phản hồi ---------------------------------------- */

  flash(ok) {
    const cls = ok ? 'flash-ok' : 'flash-bad';
    this.host.classList.remove('flash-ok', 'flash-bad');
    void this.host.offsetWidth;
    this.host.classList.add(cls);
    setTimeout(() => this.host.classList.remove(cls), 500);
  }

  /** Thay nét vừa viết bằng chính nét mẫu — dùng khi chấm đạt, cho chữ đẹp lên. */
  snapLastToModel(strokeIndex) {
    if (!this.char?.strokes?.[strokeIndex]) return;
    this.strokes.pop();
    this.modelStrokes = this.modelStrokes || [];
    this.modelStrokes.push(strokeIndex);
    this.redrawInk();
  }

  destroy() {
    sound.dungHan();
    this.ro.disconnect();
    this.ink.remove();
    this.bg.remove();
  }
}
