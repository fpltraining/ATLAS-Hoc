/* Chấm điểm nét viết tay.

   Dữ liệu hanzi-writer-data cho mỗi nét một "medians" — đường xương sống đi
   giữa nét, gồm một dãy điểm theo ĐÚNG chiều bút chạy. Đó chính là thứ ta cần:
   so đường người viết với đường mẫu là biết được cả HÌNH DÁNG lẫn CHIỀU VIẾT.

   Mọi toạ độ trong file này đều ở hệ hiển thị 0…1024 (Y hướng xuống).
*/

const SAMPLES = 32;

export const STRICTNESS = {
  //  mul     nới rộng / thu hẹp sai lệch cho phép
  //  passMin điểm tối thiểu để nét được tính là đạt
  de:     { mul: 1.35, passMin: 52, label: 'Dễ' },
  vua:    { mul: 1.00, passMin: 62, label: 'Vừa' },
  nghiem: { mul: 0.74, passMin: 72, label: 'Nghiêm' },
};

/* ---------- hình học cơ bản --------------------------------------------- */

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(pts) {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** Lấy lại n điểm cách đều nhau dọc theo đường, để hai đường so được với nhau. */
export function resample(pts, n = SAMPLES) {
  if (pts.length === 0) return [];
  if (pts.length === 1) return Array.from({ length: n }, () => [...pts[0]]);

  const total = pathLength(pts);
  if (total < 1e-6) return Array.from({ length: n }, () => [...pts[0]]);

  const step = total / (n - 1);
  const out = [[...pts[0]]];
  let i = 1, acc = 0;
  let cur = [...pts[0]];

  while (out.length < n && i < pts.length) {
    const d = dist(cur, pts[i]);
    if (acc + d >= step) {
      const t = (step - acc) / d;
      cur = [cur[0] + (pts[i][0] - cur[0]) * t, cur[1] + (pts[i][1] - cur[1]) * t];
      out.push([...cur]);
      acc = 0;
    } else {
      acc += d;
      cur = [...pts[i]];
      i++;
    }
  }
  while (out.length < n) out.push([...pts[pts.length - 1]]);
  return out;
}

function meanDistance(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += dist(a[i], b[i]);
  return s / a.length;
}

/* ---------- chấm một nét ------------------------------------------------ */

/**
 * So một nét người viết với một nét mẫu.
 * @param {number[][]} user   các điểm người viết, hệ 0…1024
 * @param {number[][]} median đường xương sống của nét mẫu
 * @returns {{score:number, pass:boolean, issues:Array, metrics:Object}}
 */
export function gradeStroke(user, median, strictness = 'vua') {
  const level = STRICTNESS[strictness] || STRICTNESS.vua;
  const mul = level.mul;

  if (!user || user.length < 2) {
    return { score: 0, pass: false, issues: [{ code: 'empty', msg: 'Nét quá ngắn.' }], metrics: {} };
  }

  const medLen = pathLength(median);
  const usrLen = pathLength(user);

  // Ngưỡng sai lệch cho phép: nét càng dài càng được rộng tay hơn.
  const tol = Math.min(220, Math.max(60, 0.22 * medLen + 45)) * mul;

  const u = resample(user);
  const m = resample(median);
  const uRev = [...u].reverse();

  const dFwd = meanDistance(u, m);
  const dRev = meanDistance(uRev, m);
  const reversed = dRev < dFwd - tol * 0.22;
  const shapeDist = Math.min(dFwd, dRev);

  const startDist = dist(u[0], m[0]);
  const endDist = dist(u[u.length - 1], m[m.length - 1]);
  const lenRatio = medLen > 1 ? usrLen / medLen : 1;

  const issues = [];
  if (reversed) {
    issues.push({ code: 'reversed', weight: 34, msg: directionHint(median) });
  }
  if (shapeDist > tol) {
    issues.push({
      code: 'shape', weight: 30,
      msg: shapeDist > tol * 1.9
        ? 'Nét lệch khá xa so với mẫu — thử nhìn nét mờ rồi viết lại.'
        : 'Hình nét chưa khớp lắm, cố bám sát đường mẫu hơn.',
    });
  }
  if (!reversed && startDist > tol * 1.7) {
    issues.push({ code: 'start', weight: 18, msg: 'Đặt bút chưa đúng chỗ bắt đầu của nét.' });
  }
  if (!reversed && endDist > tol * 1.9) {
    issues.push({ code: 'end', weight: 14, msg: 'Nét kết thúc chưa tới nơi.' });
  }
  // Nét dài hơn mẫu nhưng vẫn bám sát đường mẫu = tay run / vẽ nhấp nhả,
  // khác hẳn với nét kéo quá tay. Hai lỗi này cần hai lời khuyên khác nhau.
  const wobbly = lenRatio > 1.45 && shapeDist < tol * 0.9;
  if (lenRatio < 0.68) {
    issues.push({
      code: 'short',
      weight: Math.min(45, 22 + (0.68 - lenRatio) * 90),
      msg: 'Nét viết ngắn hơn mẫu khá nhiều.',
    });
  } else if (wobbly) {
    issues.push({
      code: 'wobble',
      weight: Math.min(42, 15 + (lenRatio - 1.45) * 40),
      msg: 'Nét bị run và gấp khúc — hãy kéo một mạch dứt khoát thay vì vẽ từng đoạn ngắn.',
    });
  } else if (lenRatio > 1.75) {
    issues.push({
      code: 'long',
      weight: Math.min(50, 18 + (lenRatio - 1.75) * 45),
      msg: 'Nét viết dài quá so với mẫu.',
    });
  }

  const shapeScore = Math.max(0, 100 - (shapeDist / tol) * 55);
  const penalty = issues.reduce((s, i) => s + (i.weight || 0), 0);
  const score = Math.round(Math.max(0, Math.min(100, shapeScore - penalty * 0.55)));

  // Ngưỡng đạt bám thẳng vào điểm số, để người học không bao giờ gặp cảnh
  // "được 81 điểm nhưng vẫn bị bắt viết lại". Viết ngược chiều thì luôn trượt,
  // dù hình có giống đến đâu — sai chiều là sai tận gốc.
  const pass = !reversed && score >= level.passMin && lenRatio > 0.35 && lenRatio < 4.5;

  return {
    score, pass, issues,
    metrics: { shapeDist: Math.round(shapeDist), tol: Math.round(tol), startDist: Math.round(startDist), lenRatio: +lenRatio.toFixed(2), reversed },
  };
}

/** Gợi ý chiều viết đúng dựa vào hướng của nét mẫu. */
function directionHint(median) {
  const a = median[0], b = median[median.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (Math.abs(dx) > Math.abs(dy) * 2) {
    return 'Viết ngược chiều — nét ngang luôn đi từ TRÁI sang PHẢI.';
  }
  if (Math.abs(dy) > Math.abs(dx) * 2) {
    return 'Viết ngược chiều — nét dọc luôn đi từ TRÊN xuống DƯỚI.';
  }
  return 'Viết ngược chiều — nét xiên cũng đi từ trên xuống dưới.';
}

/* ---------- chấm cả chữ -------------------------------------------------- */

/**
 * Tìm nét mẫu khớp nhất với một nét người viết. Dùng để phát hiện lỗi SAI
 * THỨ TỰ: người viết đúng hình nhưng lại là nét số 3 trong khi đang cần nét 1.
 */
export function bestMatch(user, medians, strictness = 'vua') {
  let best = { index: -1, score: -1, result: null };
  for (let i = 0; i < medians.length; i++) {
    const r = gradeStroke(user, medians[i], strictness);
    if (r.score > best.score) best = { index: i, score: r.score, result: r };
  }
  return best;
}

/**
 * Chấm một nét trong chế độ luyện có thứ tự.
 * Nếu nét khớp rõ ràng hơn với một nét khác thì báo lỗi thứ tự thay vì lỗi hình.
 */
export function gradeInOrder(user, medians, expected, strictness = 'vua') {
  const own = gradeStroke(user, medians[expected], strictness);
  if (own.pass) return { ...own, kind: 'ok', expected };

  const best = bestMatch(user, medians, strictness);
  if (best.index !== expected && best.result.pass && best.score > own.score + 18) {
    return {
      ...own, kind: 'order', expected, matched: best.index,
      issues: [{
        code: 'order',
        msg: `Nét này viết đẹp, nhưng nó là nét thứ ${best.index + 1}. Bây giờ đang cần nét thứ ${expected + 1}.`,
      }],
    };
  }
  return { ...own, kind: 'shape', expected };
}

/**
 * Chấm cả chữ viết liền một mạch (chế độ viết từ trí nhớ).
 * Ghép nét theo đúng thứ tự người viết, và báo nếu thừa/thiếu nét.
 */
export function gradeWhole(userStrokes, medians, strictness = 'vua') {
  const per = [];
  const n = Math.min(userStrokes.length, medians.length);
  for (let i = 0; i < n; i++) per.push(gradeStroke(userStrokes[i], medians[i], strictness));

  const notes = [];
  if (userStrokes.length < medians.length) {
    notes.push(`Thiếu ${medians.length - userStrokes.length} nét (chữ này có ${medians.length} nét).`);
  } else if (userStrokes.length > medians.length) {
    notes.push(`Thừa ${userStrokes.length - medians.length} nét (chữ này chỉ có ${medians.length} nét).`);
  }

  const okCount = per.filter((p) => p.pass).length;
  const base = per.length ? per.reduce((s, p) => s + p.score, 0) / per.length : 0;
  const missPenalty = Math.abs(userStrokes.length - medians.length) * (60 / Math.max(1, medians.length));
  const score = Math.round(Math.max(0, Math.min(100, base - missPenalty)));

  return { score, per, notes, okCount, total: medians.length };
}

/** Nhận xét chung bằng tiếng Việt theo thang điểm. */
export function verdict(score) {
  if (score >= 90) return { text: 'Xuất sắc', tone: 'jade' };
  if (score >= 75) return { text: 'Tốt', tone: 'jade' };
  if (score >= 55) return { text: 'Tạm được', tone: 'gold' };
  if (score >= 35) return { text: 'Cần luyện thêm', tone: 'gold' };
  return { text: 'Viết lại nhé', tone: 'seal' };
}
