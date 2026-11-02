/* Vẽ ô kẻ tập viết và chữ mẫu mờ lên lớp nền.

   田字格 (điền tự cách) — ô vuông chia tư, ô tập viết chuẩn của học sinh Trung Quốc
   米字格 (mễ tự cách)  — thêm hai đường chéo, giúp canh nét xiên
*/

import { GRID, Y_OFFSET } from '../data.js';

/** Ma trận đổi từ hệ dữ liệu 1024 sang pixel của canvas. */
export function makeTransform(sizePx) {
  const k = sizePx / GRID;
  return {
    k,
    toPx: (pt) => [pt[0] * k, (Y_OFFSET - pt[1]) * k],
    /** Đổi ngược pixel → hệ hiển thị 0…1024 (Y hướng xuống) để đem đi chấm. */
    toUnit: (x, y) => [x / k, y / k],
  };
}

export function drawGrid(ctx, size, kind, color) {
  if (kind === 'none') return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size / 360);
  ctx.setLineDash([size / 46, size / 34]);

  ctx.beginPath();
  ctx.moveTo(size / 2, 0); ctx.lineTo(size / 2, size);
  ctx.moveTo(0, size / 2); ctx.lineTo(size, size / 2);
  if (kind === 'mi') {
    ctx.moveTo(0, 0); ctx.lineTo(size, size);
    ctx.moveTo(size, 0); ctx.lineTo(0, size);
  }
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.lineWidth = Math.max(1, size / 300);
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  ctx.restore();
}

/**
 * Vẽ chữ mẫu từ dữ liệu đường SVG.
 * @param upTo  chỉ vẽ tới nét thứ mấy (mặc định là cả chữ)
 */
export function drawChar(ctx, strokes, size, { color, upTo = Infinity, only = null } = {}) {
  const k = size / GRID;
  ctx.save();
  ctx.fillStyle = color;
  // Đổi trục Y: dữ liệu dựng theo trục hướng lên, canvas hướng xuống
  ctx.transform(k, 0, 0, -k, 0, Y_OFFSET * k);
  for (let i = 0; i < strokes.length; i++) {
    if (only !== null ? i !== only : i >= upTo) continue;
    ctx.fill(new Path2D(strokes[i]));
  }
  ctx.restore();
}

/** Vẽ đường xương sống của một nét kèm mũi tên chỉ chiều viết. */
export function drawMedianHint(ctx, median, size, color) {
  if (!median || median.length < 2) return;
  const k = size / GRID;
  const pt = (p) => [p[0] * k, (Y_OFFSET - p[1]) * k];

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(2, size / 130);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([size / 60, size / 42]);

  ctx.beginPath();
  const p0 = pt(median[0]);
  ctx.moveTo(p0[0], p0[1]);
  for (let i = 1; i < median.length; i++) {
    const p = pt(median[i]);
    ctx.lineTo(p[0], p[1]);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Chấm tròn đánh dấu chỗ ĐẶT BÚT
  ctx.beginPath();
  ctx.arc(p0[0], p0[1], size / 52, 0, Math.PI * 2);
  ctx.fill();

  // Mũi tên chỉ chiều kết thúc
  const a = pt(median[median.length - 2]);
  const b = pt(median[median.length - 1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const h = size / 26;
  ctx.beginPath();
  ctx.moveTo(b[0], b[1]);
  ctx.lineTo(b[0] - h * Math.cos(ang - 0.42), b[1] - h * Math.sin(ang - 0.42));
  ctx.lineTo(b[0] - h * Math.cos(ang + 0.42), b[1] - h * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Vẽ một nét đang được "viết dần" — chính là hiệu ứng hoạt hình thứ tự nét.
 * Cách làm: giới hạn vùng vẽ đúng bằng hình dáng của nét (clip), rồi kéo một
 * đường bút thật dày dọc theo đường xương sống tới mức tiến độ mong muốn.
 * Kết quả là nét hiện ra đúng theo chiều bút chạy.
 *
 * @param progress 0…1
 */
export function drawPartialStroke(ctx, strokePath, median, size, progress, color) {
  if (!median || median.length < 2) return;
  const k = size / GRID;
  ctx.save();
  ctx.transform(k, 0, 0, -k, 0, Y_OFFSET * k);
  ctx.clip(new Path2D(strokePath));

  const total = median.reduce((s, p, i) =>
    i ? s + Math.hypot(p[0] - median[i - 1][0], p[1] - median[i - 1][1]) : 0, 0);
  const target = total * Math.max(0, Math.min(1, progress));

  ctx.strokeStyle = color;
  ctx.lineWidth = 260;          // dày hơn mọi nét, nhờ clip nên không tràn ra ngoài
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(median[0][0], median[0][1]);

  let acc = 0;
  for (let i = 1; i < median.length; i++) {
    const seg = Math.hypot(median[i][0] - median[i - 1][0], median[i][1] - median[i - 1][1]);
    if (acc + seg >= target) {
      const t = seg > 0 ? (target - acc) / seg : 0;
      ctx.lineTo(
        median[i - 1][0] + (median[i][0] - median[i - 1][0]) * t,
        median[i - 1][1] + (median[i][1] - median[i - 1][1]) * t,
      );
      break;
    }
    acc += seg;
    ctx.lineTo(median[i][0], median[i][1]);
  }
  ctx.stroke();
  ctx.restore();
}

/** Số thứ tự nhỏ đặt ở đầu mỗi nét — bảng "thứ tự nét" của sách tập viết. */
export function drawStrokeNumbers(ctx, medians, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `600 ${Math.round(size / 22)}px -apple-system, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const k = size / GRID;
  medians.forEach((m, i) => {
    if (!m?.length) return;
    const x = m[0][0] * k;
    const y = (Y_OFFSET - m[0][1]) * k;
    ctx.fillText(String(i + 1), x, y);
  });
  ctx.restore();
}
