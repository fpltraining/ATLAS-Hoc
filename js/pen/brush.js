/* Vẽ nét bút.

   Hai kiểu ngòi:
     but-chi  — nét đều, viền rõ, dễ nhìn ra chỗ sai (mặc định cho người mới)
     but-long — bề rộng thay đổi theo LỰC NHẤN, ĐỘ NGHIÊNG và TỐC ĐỘ của
                Apple Pencil, cho ra nét có đầu đậm đuôi thanh như bút thật

   Mỗi điểm là { x, y, p (lực nhấn 0…1), tilt (0…1), t (mốc thời gian) }.
*/

/** Làm mượt danh sách điểm bằng trung bình trượt, khử răng cưa do tay run. */
export function smooth(pts, passes = 1) {
  let cur = pts;
  for (let k = 0; k < passes; k++) {
    if (cur.length < 3) return cur;
    const out = [cur[0]];
    for (let i = 1; i < cur.length - 1; i++) {
      out.push({
        ...cur[i],
        x: (cur[i - 1].x + cur[i].x * 2 + cur[i + 1].x) / 4,
        y: (cur[i - 1].y + cur[i].y * 2 + cur[i + 1].y) / 4,
      });
    }
    out.push(cur[cur.length - 1]);
    cur = out;
  }
  return cur;
}

/**
 * Bề rộng nửa nét tại một điểm.
 * Apple Pencil cho lực nhấn thật; chuột và ngón tay thì không, khi đó ta suy
 * ra độ đậm từ TỐC ĐỘ bút (đi nhanh → nét mảnh) để nét vẫn có hồn.
 */
function halfWidth(pt, prev, base, style) {
  if (style === 'but-chi') return base * 0.5;

  let f;
  if (pt.p > 0.02) {
    f = 0.32 + 0.88 * Math.pow(pt.p, 0.75);
  } else {
    const dt = Math.max(1, pt.t - (prev?.t ?? pt.t - 8));
    const d = prev ? Math.hypot(pt.x - prev.x, pt.y - prev.y) : 0;
    const speed = d / dt;                        // pixel mỗi mili-giây
    f = 1.05 - Math.min(0.55, speed * 0.16);
  }

  // Bút nghiêng thì phần thân ngòi chạm giấy, vệt tiếp xúc bè ra THEO MỘT HƯỚNG
  // — hướng bút đang ngả về. Vì vậy nét không dày đều: đi ngang hướng nghiêng
  // thì quét trọn bề rộng vệt tiếp xúc nên nét đậm, đi dọc theo hướng ấy thì
  // chỉ còn bề hẹp nên nét mảnh. Chính chỗ đậm nhạt đổi theo chiều đi này làm
  // nét trông có hồn như bút lông, thay vì một sợi dày đều như tô bằng bút bi.
  const tilt = pt.tilt || 0;
  if (tilt > 0.05) {
    f *= 1 + tilt * 0.18;                       // phần bè đều, nhẹ thôi
    if (prev) {
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      if (dx || dy) {
        const huongDi = Math.atan2(dy, dx);
        const vuongGoc = Math.abs(Math.sin(huongDi - (pt.az || 0)));
        f *= 1 + tilt * 0.55 * vuongGoc;        // phần bè theo chiều đi
      }
    }
  }
  return base * 0.5 * Math.max(0.22, Math.min(1.9, f));
}

/**
 * Vẽ một nét hoàn chỉnh: dựng đường bao hai bên đường tâm rồi tô đặc.
 * Cách này cho nét liền mạch, không bị "chuỗi hạt" như khi vẽ nhiều hình tròn.
 */
export function drawStroke(ctx, pts, { color, base = 22, style = 'but-long' } = {}) {
  if (!pts || pts.length === 0) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (pts.length === 1) {
    const r = halfWidth(pts[0], null, base, style);
    ctx.beginPath();
    ctx.arc(pts[0].x, pts[0].y, Math.max(r, base * 0.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (style === 'but-chi') {
    ctx.lineWidth = base;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const left = [], right = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[i - 1] || pts[i];
    const next = pts[i + 1] || pts[i];
    let nx = next.y - prev.y;
    let ny = -(next.x - prev.x);
    const len = Math.hypot(nx, ny) || 1;
    nx /= len; ny /= len;
    const w = halfWidth(pts[i], pts[i - 1], base, style);
    left.push([pts[i].x + nx * w, pts[i].y + ny * w]);
    right.push([pts[i].x - nx * w, pts[i].y - ny * w]);
  }

  ctx.beginPath();
  ctx.moveTo(left[0][0], left[0][1]);
  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
  ctx.closePath();
  ctx.fill();

  // Bo tròn hai đầu nét cho tự nhiên
  const rStart = halfWidth(pts[0], null, base, style);
  const rEnd = halfWidth(pts[pts.length - 1], pts[pts.length - 2], base, style);
  ctx.beginPath();
  ctx.arc(pts[0].x, pts[0].y, rStart, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, rEnd, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/** Vẽ nhanh phần mới của nét đang viết, để bút không bị trễ so với tay. */
export function drawSegment(ctx, a, b, { color, base = 22, style = 'but-long' } = {}) {
  if (!a || !b) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, halfWidth(b, a, base, style) * 2);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}
