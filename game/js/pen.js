/* TỰ SINH bởi tools/build-pen.mjs từ js/pen (ATLAS), đừng sửa tay: sửa js/pen rồi dựng lại.
   Bảng viết chữ Hán bằng Apple Pencil / ngón tay: lực nhấn, chống tì tay, chấm từng nét theo dữ liệu hanzi-writer-data (Arphic Public License). */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var G = window.G || (window.G = {});
(function () {
    var _a, _b;
    var GRID = 1024, Y_OFFSET = 900; // hệ toạ độ dữ liệu nét (hanzi-writer-data), như js/data.js của ATLAS
    // tiếng bút: ghi âm bút chì thật (game/sfx/sfx_pen_write.mp3, CC0) qua G.penSound trong js/audio.js, thay tiếng tạo bằng code của bản gốc
    var sound = { initSound: function () { return G.penSound ? G.penSound.init() : false; }, batDau: function () { if (G.penSound)
            G.penSound.start(); },
        capNhat: function (v, p) { if (G.penSound)
            G.penSound.move(v, p); }, ketThuc: function () { if (G.penSound)
            G.penSound.end(); }, dungHan: function () { if (G.penSound)
            G.penSound.end(true); } };
    /* ---------- js/pen/brush.js ---------- */
    /* Vẽ nét bút.
    
       Hai kiểu ngòi:
         but-chi  — nét đều, viền rõ, dễ nhìn ra chỗ sai (mặc định cho người mới)
         but-long — bề rộng thay đổi theo LỰC NHẤN, ĐỘ NGHIÊNG và TỐC ĐỘ của
                    Apple Pencil, cho ra nét có đầu đậm đuôi thanh như bút thật
    
       Mỗi điểm là { x, y, p (lực nhấn 0…1), tilt (0…1), t (mốc thời gian) }.
    */
    /** Làm mượt danh sách điểm bằng trung bình trượt, khử răng cưa do tay run. */
    function smooth(pts, passes) {
        if (passes === void 0) { passes = 1; }
        var cur = pts;
        for (var k = 0; k < passes; k++) {
            if (cur.length < 3)
                return cur;
            var out = [cur[0]];
            for (var i = 1; i < cur.length - 1; i++) {
                out.push(__assign(__assign({}, cur[i]), { x: (cur[i - 1].x + cur[i].x * 2 + cur[i + 1].x) / 4, y: (cur[i - 1].y + cur[i].y * 2 + cur[i + 1].y) / 4 }));
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
        var _a;
        if (style === 'but-chi')
            return base * 0.5;
        var f;
        if (pt.p > 0.02) {
            f = 0.32 + 0.88 * Math.pow(pt.p, 0.75);
        }
        else {
            var dt = Math.max(1, pt.t - ((_a = prev === null || prev === void 0 ? void 0 : prev.t) !== null && _a !== void 0 ? _a : pt.t - 8));
            var d = prev ? Math.hypot(pt.x - prev.x, pt.y - prev.y) : 0;
            var speed = d / dt; // pixel mỗi mili-giây
            f = 1.05 - Math.min(0.55, speed * 0.16);
        }
        // Bút nghiêng thì phần thân ngòi chạm giấy, vệt tiếp xúc bè ra THEO MỘT HƯỚNG
        // — hướng bút đang ngả về. Vì vậy nét không dày đều: đi ngang hướng nghiêng
        // thì quét trọn bề rộng vệt tiếp xúc nên nét đậm, đi dọc theo hướng ấy thì
        // chỉ còn bề hẹp nên nét mảnh. Chính chỗ đậm nhạt đổi theo chiều đi này làm
        // nét trông có hồn như bút lông, thay vì một sợi dày đều như tô bằng bút bi.
        var tilt = pt.tilt || 0;
        if (tilt > 0.05) {
            f *= 1 + tilt * 0.18; // phần bè đều, nhẹ thôi
            if (prev) {
                var dx = pt.x - prev.x;
                var dy = pt.y - prev.y;
                if (dx || dy) {
                    var huongDi = Math.atan2(dy, dx);
                    var vuongGoc = Math.abs(Math.sin(huongDi - (pt.az || 0)));
                    f *= 1 + tilt * 0.55 * vuongGoc; // phần bè theo chiều đi
                }
            }
        }
        return base * 0.5 * Math.max(0.22, Math.min(1.9, f));
    }
    /**
     * Vẽ một nét hoàn chỉnh: dựng đường bao hai bên đường tâm rồi tô đặc.
     * Cách này cho nét liền mạch, không bị "chuỗi hạt" như khi vẽ nhiều hình tròn.
     */
    function drawStroke(ctx, pts, _a) {
        var _b = _a === void 0 ? {} : _a, color = _b.color, _c = _b.base, base = _c === void 0 ? 22 : _c, _d = _b.style, style = _d === void 0 ? 'but-long' : _d;
        if (!pts || pts.length === 0)
            return;
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (pts.length === 1) {
            var r = halfWidth(pts[0], null, base, style);
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
            for (var i = 1; i < pts.length - 1; i++) {
                var mx = (pts[i].x + pts[i + 1].x) / 2;
                var my = (pts[i].y + pts[i + 1].y) / 2;
                ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
            }
            var last = pts[pts.length - 1];
            ctx.lineTo(last.x, last.y);
            ctx.stroke();
            ctx.restore();
            return;
        }
        var left = [], right = [];
        for (var i = 0; i < pts.length; i++) {
            var prev = pts[i - 1] || pts[i];
            var next = pts[i + 1] || pts[i];
            var nx = next.y - prev.y;
            var ny = -(next.x - prev.x);
            var len = Math.hypot(nx, ny) || 1;
            nx /= len;
            ny /= len;
            var w = halfWidth(pts[i], pts[i - 1], base, style);
            left.push([pts[i].x + nx * w, pts[i].y + ny * w]);
            right.push([pts[i].x - nx * w, pts[i].y - ny * w]);
        }
        ctx.beginPath();
        ctx.moveTo(left[0][0], left[0][1]);
        for (var i = 1; i < left.length; i++)
            ctx.lineTo(left[i][0], left[i][1]);
        for (var i = right.length - 1; i >= 0; i--)
            ctx.lineTo(right[i][0], right[i][1]);
        ctx.closePath();
        ctx.fill();
        // Bo tròn hai đầu nét cho tự nhiên
        var rStart = halfWidth(pts[0], null, base, style);
        var rEnd = halfWidth(pts[pts.length - 1], pts[pts.length - 2], base, style);
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, rStart, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, rEnd, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
    /** Vẽ nhanh phần mới của nét đang viết, để bút không bị trễ so với tay. */
    function drawSegment(ctx, a, b, _a) {
        var _b = _a === void 0 ? {} : _a, color = _b.color, _c = _b.base, base = _c === void 0 ? 22 : _c, _d = _b.style, style = _d === void 0 ? 'but-long' : _d;
        if (!a || !b)
            return;
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
    /* ---------- js/pen/grid.js ---------- */
    /* Vẽ ô kẻ tập viết và chữ mẫu mờ lên lớp nền.
    
       田字格 (điền tự cách) — ô vuông chia tư, ô tập viết chuẩn của học sinh Trung Quốc
       米字格 (mễ tự cách)  — thêm hai đường chéo, giúp canh nét xiên
    */
    /** Ma trận đổi từ hệ dữ liệu 1024 sang pixel của canvas. */
    function makeTransform(sizePx) {
        var k = sizePx / GRID;
        return {
            k: k,
            toPx: function (pt) { return [pt[0] * k, (Y_OFFSET - pt[1]) * k]; },
            /** Đổi ngược pixel → hệ hiển thị 0…1024 (Y hướng xuống) để đem đi chấm. */
            toUnit: function (x, y) { return [x / k, y / k]; },
        };
    }
    function drawGrid(ctx, size, kind, color) {
        if (kind === 'none')
            return;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, size / 360);
        ctx.setLineDash([size / 46, size / 34]);
        ctx.beginPath();
        ctx.moveTo(size / 2, 0);
        ctx.lineTo(size / 2, size);
        ctx.moveTo(0, size / 2);
        ctx.lineTo(size, size / 2);
        if (kind === 'mi') {
            ctx.moveTo(0, 0);
            ctx.lineTo(size, size);
            ctx.moveTo(size, 0);
            ctx.lineTo(0, size);
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
    function drawChar(ctx, strokes, size, _a) {
        var _b = _a === void 0 ? {} : _a, color = _b.color, _c = _b.upTo, upTo = _c === void 0 ? Infinity : _c, _d = _b.only, only = _d === void 0 ? null : _d;
        var k = size / GRID;
        ctx.save();
        ctx.fillStyle = color;
        // Đổi trục Y: dữ liệu dựng theo trục hướng lên, canvas hướng xuống
        ctx.transform(k, 0, 0, -k, 0, Y_OFFSET * k);
        for (var i = 0; i < strokes.length; i++) {
            if (only !== null ? i !== only : i >= upTo)
                continue;
            ctx.fill(new Path2D(strokes[i]));
        }
        ctx.restore();
    }
    /** Vẽ đường xương sống của một nét kèm mũi tên chỉ chiều viết. */
    function drawMedianHint(ctx, median, size, color) {
        if (!median || median.length < 2)
            return;
        var k = size / GRID;
        var pt = function (p) { return [p[0] * k, (Y_OFFSET - p[1]) * k]; };
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = Math.max(2, size / 130);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([size / 60, size / 42]);
        ctx.beginPath();
        var p0 = pt(median[0]);
        ctx.moveTo(p0[0], p0[1]);
        for (var i = 1; i < median.length; i++) {
            var p = pt(median[i]);
            ctx.lineTo(p[0], p[1]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        // Chấm tròn đánh dấu chỗ ĐẶT BÚT
        ctx.beginPath();
        ctx.arc(p0[0], p0[1], size / 52, 0, Math.PI * 2);
        ctx.fill();
        // Mũi tên chỉ chiều kết thúc
        var a = pt(median[median.length - 2]);
        var b = pt(median[median.length - 1]);
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        var h = size / 26;
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
    function drawPartialStroke(ctx, strokePath, median, size, progress, color) {
        if (!median || median.length < 2)
            return;
        var k = size / GRID;
        ctx.save();
        ctx.transform(k, 0, 0, -k, 0, Y_OFFSET * k);
        ctx.clip(new Path2D(strokePath));
        var total = median.reduce(function (s, p, i) {
            return i ? s + Math.hypot(p[0] - median[i - 1][0], p[1] - median[i - 1][1]) : 0;
        }, 0);
        var target = total * Math.max(0, Math.min(1, progress));
        ctx.strokeStyle = color;
        ctx.lineWidth = 260; // dày hơn mọi nét, nhờ clip nên không tràn ra ngoài
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(median[0][0], median[0][1]);
        var acc = 0;
        for (var i = 1; i < median.length; i++) {
            var seg = Math.hypot(median[i][0] - median[i - 1][0], median[i][1] - median[i - 1][1]);
            if (acc + seg >= target) {
                var t = seg > 0 ? (target - acc) / seg : 0;
                ctx.lineTo(median[i - 1][0] + (median[i][0] - median[i - 1][0]) * t, median[i - 1][1] + (median[i][1] - median[i - 1][1]) * t);
                break;
            }
            acc += seg;
            ctx.lineTo(median[i][0], median[i][1]);
        }
        ctx.stroke();
        ctx.restore();
    }
    /** Số thứ tự nhỏ đặt ở đầu mỗi nét — bảng "thứ tự nét" của sách tập viết. */
    function drawStrokeNumbers(ctx, medians, size, color) {
        ctx.save();
        ctx.fillStyle = color;
        ctx.font = "600 ".concat(Math.round(size / 22), "px -apple-system, system-ui, sans-serif");
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var k = size / GRID;
        medians.forEach(function (m, i) {
            if (!(m === null || m === void 0 ? void 0 : m.length))
                return;
            var x = m[0][0] * k;
            var y = (Y_OFFSET - m[0][1]) * k;
            ctx.fillText(String(i + 1), x, y);
        });
        ctx.restore();
    }
    /* ---------- js/pen/grade.js ---------- */
    /* Chấm điểm nét viết tay.
    
       Dữ liệu hanzi-writer-data cho mỗi nét một "medians" — đường xương sống đi
       giữa nét, gồm một dãy điểm theo ĐÚNG chiều bút chạy. Đó chính là thứ ta cần:
       so đường người viết với đường mẫu là biết được cả HÌNH DÁNG lẫn CHIỀU VIẾT.
    
       Mọi toạ độ trong file này đều ở hệ hiển thị 0…1024 (Y hướng xuống).
    */
    var SAMPLES = 32;
    var STRICTNESS = {
        //  mul     nới rộng / thu hẹp sai lệch cho phép
        //  passMin điểm tối thiểu để nét được tính là đạt
        de: { mul: 1.35, passMin: 52, label: 'Dễ' },
        vua: { mul: 1.00, passMin: 62, label: 'Vừa' },
        nghiem: { mul: 0.74, passMin: 72, label: 'Nghiêm' },
    };
    /* ---------- hình học cơ bản --------------------------------------------- */
    var dist = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };
    function pathLength(pts) {
        var s = 0;
        for (var i = 1; i < pts.length; i++)
            s += dist(pts[i - 1], pts[i]);
        return s;
    }
    /** Lấy lại n điểm cách đều nhau dọc theo đường, để hai đường so được với nhau. */
    function resample(pts, n) {
        if (n === void 0) { n = SAMPLES; }
        if (pts.length === 0)
            return [];
        if (pts.length === 1)
            return Array.from({ length: n }, function () { return __spreadArray([], pts[0], true); });
        var total = pathLength(pts);
        if (total < 1e-6)
            return Array.from({ length: n }, function () { return __spreadArray([], pts[0], true); });
        var step = total / (n - 1);
        var out = [__spreadArray([], pts[0], true)];
        var i = 1, acc = 0;
        var cur = __spreadArray([], pts[0], true);
        while (out.length < n && i < pts.length) {
            var d = dist(cur, pts[i]);
            if (acc + d >= step) {
                var t = (step - acc) / d;
                cur = [cur[0] + (pts[i][0] - cur[0]) * t, cur[1] + (pts[i][1] - cur[1]) * t];
                out.push(__spreadArray([], cur, true));
                acc = 0;
            }
            else {
                acc += d;
                cur = __spreadArray([], pts[i], true);
                i++;
            }
        }
        while (out.length < n)
            out.push(__spreadArray([], pts[pts.length - 1], true));
        return out;
    }
    function meanDistance(a, b) {
        var s = 0;
        for (var i = 0; i < a.length; i++)
            s += dist(a[i], b[i]);
        return s / a.length;
    }
    /* ---------- chấm một nét ------------------------------------------------ */
    /**
     * So một nét người viết với một nét mẫu.
     * @param {number[][]} user   các điểm người viết, hệ 0…1024
     * @param {number[][]} median đường xương sống của nét mẫu
     * @returns {{score:number, pass:boolean, issues:Array, metrics:Object}}
     */
    function gradeStroke(user, median, strictness) {
        if (strictness === void 0) { strictness = 'vua'; }
        var level = STRICTNESS[strictness] || STRICTNESS.vua;
        var mul = level.mul;
        if (!user || user.length < 2) {
            return { score: 0, pass: false, issues: [{ code: 'empty', msg: 'Nét quá ngắn.' }], metrics: {} };
        }
        var medLen = pathLength(median);
        var usrLen = pathLength(user);
        // Ngưỡng sai lệch cho phép: nét càng dài càng được rộng tay hơn.
        var tol = Math.min(220, Math.max(60, 0.22 * medLen + 45)) * mul;
        var u = resample(user);
        var m = resample(median);
        var uRev = __spreadArray([], u, true).reverse();
        var dFwd = meanDistance(u, m);
        var dRev = meanDistance(uRev, m);
        var reversed = dRev < dFwd - tol * 0.22;
        var shapeDist = Math.min(dFwd, dRev);
        var startDist = dist(u[0], m[0]);
        var endDist = dist(u[u.length - 1], m[m.length - 1]);
        var lenRatio = medLen > 1 ? usrLen / medLen : 1;
        var issues = [];
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
        var wobbly = lenRatio > 1.45 && shapeDist < tol * 0.9;
        if (lenRatio < 0.68) {
            issues.push({
                code: 'short',
                weight: Math.min(45, 22 + (0.68 - lenRatio) * 90),
                msg: 'Nét viết ngắn hơn mẫu khá nhiều.',
            });
        }
        else if (wobbly) {
            issues.push({
                code: 'wobble',
                weight: Math.min(42, 15 + (lenRatio - 1.45) * 40),
                msg: 'Nét bị run và gấp khúc — hãy kéo một mạch dứt khoát thay vì vẽ từng đoạn ngắn.',
            });
        }
        else if (lenRatio > 1.75) {
            issues.push({
                code: 'long',
                weight: Math.min(50, 18 + (lenRatio - 1.75) * 45),
                msg: 'Nét viết dài quá so với mẫu.',
            });
        }
        var shapeScore = Math.max(0, 100 - (shapeDist / tol) * 55);
        var penalty = issues.reduce(function (s, i) { return s + (i.weight || 0); }, 0);
        var score = Math.round(Math.max(0, Math.min(100, shapeScore - penalty * 0.55)));
        // Ngưỡng đạt bám thẳng vào điểm số, để người học không bao giờ gặp cảnh
        // "được 81 điểm nhưng vẫn bị bắt viết lại". Viết ngược chiều thì luôn trượt,
        // dù hình có giống đến đâu — sai chiều là sai tận gốc.
        var pass = !reversed && score >= level.passMin && lenRatio > 0.35 && lenRatio < 4.5;
        return {
            score: score,
            pass: pass,
            issues: issues,
            metrics: { shapeDist: Math.round(shapeDist), tol: Math.round(tol), startDist: Math.round(startDist), lenRatio: +lenRatio.toFixed(2), reversed: reversed },
        };
    }
    /** Gợi ý chiều viết đúng dựa vào hướng của nét mẫu. */
    function directionHint(median) {
        var a = median[0], b = median[median.length - 1];
        var dx = b[0] - a[0], dy = b[1] - a[1];
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
    function bestMatch(user, medians, strictness) {
        if (strictness === void 0) { strictness = 'vua'; }
        var best = { index: -1, score: -1, result: null };
        for (var i = 0; i < medians.length; i++) {
            var r = gradeStroke(user, medians[i], strictness);
            if (r.score > best.score)
                best = { index: i, score: r.score, result: r };
        }
        return best;
    }
    /**
     * Chấm một nét trong chế độ luyện có thứ tự.
     * Nếu nét khớp rõ ràng hơn với một nét khác thì báo lỗi thứ tự thay vì lỗi hình.
     */
    function gradeInOrder(user, medians, expected, strictness) {
        if (strictness === void 0) { strictness = 'vua'; }
        var own = gradeStroke(user, medians[expected], strictness);
        // Nét dài được nới tay, nên một nét khác chạy dọc theo nó (vd. nét 3 của 册, 网) vẫn có thể "tạm đạt" nét đang cần.
        // Vì vậy dù nét đang cần đạt, nếu nét khác khớp hơn hẳn (hơn 18 điểm) thì vẫn báo sai thứ tự. Soát 1.920 chữ:
        // viết đúng nét thì nét khác không bao giờ hơn quá 1 điểm, viết nhầm nét khác thì hơn 31–37 điểm (tools/test/strokes.test.mjs).
        var best = bestMatch(user, medians, strictness);
        var other = best.index !== expected && best.result.pass && best.score > own.score + 18;
        if (own.pass && !other)
            return __assign(__assign({}, own), { kind: 'ok', expected: expected });
        if (other) {
            return __assign(__assign({}, own), { pass: false, kind: 'order', expected: expected, matched: best.index, issues: [{
                        code: 'order',
                        msg: "N\u00E9t n\u00E0y vi\u1EBFt \u0111\u1EB9p, nh\u01B0ng n\u00F3 l\u00E0 n\u00E9t th\u1EE9 ".concat(best.index + 1, ". B\u00E2y gi\u1EDD \u0111ang c\u1EA7n n\u00E9t th\u1EE9 ").concat(expected + 1, "."),
                    }] });
        }
        return __assign(__assign({}, own), { kind: 'shape', expected: expected });
    }
    /**
     * Chấm cả chữ viết liền một mạch (chế độ viết từ trí nhớ).
     * Ghép nét theo đúng thứ tự người viết, và báo nếu thừa/thiếu nét.
     */
    function gradeWhole(userStrokes, medians, strictness) {
        if (strictness === void 0) { strictness = 'vua'; }
        var per = [];
        var n = Math.min(userStrokes.length, medians.length);
        for (var i = 0; i < n; i++)
            per.push(gradeStroke(userStrokes[i], medians[i], strictness));
        var notes = [];
        if (userStrokes.length < medians.length) {
            notes.push("Thi\u1EBFu ".concat(medians.length - userStrokes.length, " n\u00E9t (ch\u1EEF n\u00E0y c\u00F3 ").concat(medians.length, " n\u00E9t)."));
        }
        else if (userStrokes.length > medians.length) {
            notes.push("Th\u1EEBa ".concat(userStrokes.length - medians.length, " n\u00E9t (ch\u1EEF n\u00E0y ch\u1EC9 c\u00F3 ").concat(medians.length, " n\u00E9t)."));
        }
        var okCount = per.filter(function (p) { return p.pass; }).length;
        var base = per.length ? per.reduce(function (s, p) { return s + p.score; }, 0) / per.length : 0;
        var missPenalty = Math.abs(userStrokes.length - medians.length) * (60 / Math.max(1, medians.length));
        var score = Math.round(Math.max(0, Math.min(100, base - missPenalty)));
        return { score: score, per: per, notes: notes, okCount: okCount, total: medians.length };
    }
    /** Nhận xét chung bằng tiếng Việt theo thang điểm. */
    function verdict(score) {
        if (score >= 90)
            return { text: 'Xuất sắc', tone: 'jade' };
        if (score >= 75)
            return { text: 'Tốt', tone: 'jade' };
        if (score >= 55)
            return { text: 'Tạm được', tone: 'gold' };
        if (score >= 35)
            return { text: 'Cần luyện thêm', tone: 'gold' };
        return { text: 'Viết lại nhé', tone: 'seal' };
    }
    /* ---------- js/pen/canvas.js ---------- */
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
    var readColors = function () {
        var cs = getComputedStyle(document.documentElement);
        var v = function (n) { return cs.getPropertyValue(n).trim(); };
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
    var colorCache = null;
    var COLORS = function () { return (colorCache || (colorCache = readColors())); };
    var invalidateColors = function () { colorCache = null; };
    if (typeof window !== 'undefined') {
        var mq = (_a = window.matchMedia) === null || _a === void 0 ? void 0 : _a.call(window, '(prefers-color-scheme: dark)');
        (_b = mq === null || mq === void 0 ? void 0 : mq.addEventListener) === null || _b === void 0 ? void 0 : _b.call(mq, 'change', invalidateColors);
        new MutationObserver(invalidateColors).observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme', 'class'],
        });
    }
    var WritingPad = /** @class */ (function () {
        /**
         * @param {HTMLElement} host phần tử .pad
         * @param {Object} opts { grid, brush, penOnly, onStroke, onStrokeStart }
         */
        function WritingPad(host, opts) {
            if (opts === void 0) { opts = {}; }
            var _this = this;
            this.host = host;
            this.opts = __assign({ grid: 'tian', brush: 'but-long', penOnly: false, penSound: true }, opts);
            this.bg = document.createElement('canvas');
            this.ink = document.createElement('canvas');
            host.append(this.bg, this.ink);
            this.bgCtx = this.bg.getContext('2d');
            this.inkCtx = this.ink.getContext('2d', { desynchronized: true });
            this.char = null; // { strokes, medians }
            this.hint = null; // { ghost:boolean, upTo:number, median:number|null, numbers:boolean }
            this.strokes = []; // các nét đã viết xong, toạ độ pixel
            this.current = null;
            this.pointerId = null;
            this.penSeen = false; // đã từng thấy Apple Pencil trong phiên này
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
            this.ink.addEventListener('touchstart', function (e) { return e.preventDefault(); }, { passive: false });
            this.ro = new ResizeObserver(function () { return _this.resize(); });
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
        WritingPad.prototype.resize = function () {
            var rect = this.ink.getBoundingClientRect();
            this._rectX = rect.left;
            this._rectY = rect.top;
            var size = Math.min(rect.width, rect.height);
            if (!size || Math.abs(size - this.size) < 0.5)
                return;
            this.size = size;
            var dpr = Math.min(window.devicePixelRatio || 1, 3);
            for (var _i = 0, _a = [this.bg, this.ink]; _i < _a.length; _i++) {
                var c = _a[_i];
                c.width = Math.round(size * dpr);
                c.height = Math.round(size * dpr);
                // Không đặt style.width/height: để CSS giữ đúng 100% khung, nhờ vậy
                // kích thước hiển thị luôn khớp với hệ toạ độ dùng để vẽ.
                c.getContext('2d').setTransform(c.width / size, 0, 0, c.height / size, 0, 0);
            }
            this.redraw();
        };
        /**
         * Bảo đảm đã đo kích thước trước khi dùng.
         * ResizeObserver chạy bất đồng bộ, nên ngay sau khi mở màn hình có một
         * khoảnh khắc size vẫn bằng 0 — nếu người dùng đặt bút đúng lúc đó thì toạ
         * độ sẽ không được quy đổi và nét viết đúng vẫn bị chấm trượt.
         */
        WritingPad.prototype.ensureSize = function () {
            if (!this.size)
                this.resize();
            return this.size;
        };
        Object.defineProperty(WritingPad.prototype, "scale", {
            /** Hệ số đổi pixel ↔ đơn vị 1024 dùng khi chấm nét. */
            get: function () { return this.ensureSize() / GRID; },
            enumerable: false,
            configurable: true
        });
        WritingPad.prototype.setChar = function (char) {
            this.char = char;
            this.clearInk();
            this.redrawBg();
        };
        /** hint: { ghost, upTo, median, numbers } */
        WritingPad.prototype.setHint = function (hint) {
            this.hint = hint;
            this.redrawBg();
        };
        WritingPad.prototype.setOption = function (key, value) {
            this.opts[key] = value;
            this.redraw();
        };
        WritingPad.prototype.redraw = function () { this.redrawBg(); this.redrawInk(); };
        WritingPad.prototype.redrawBg = function () {
            if (!this.size)
                return;
            var c = COLORS();
            var ctx = this.bgCtx;
            ctx.clearRect(0, 0, this.size, this.size);
            drawGrid(ctx, this.size, this.opts.grid, c.line);
            if (!this.char)
                return;
            var h = this.hint || {};
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
        };
        WritingPad.prototype.redrawInk = function () {
            var _a;
            if (!this.size)
                return;
            var ctx = this.inkCtx;
            var ink = COLORS().ink;
            ctx.clearRect(0, 0, this.size, this.size);
            // Các nét đã chấm đạt và được thay bằng hình mẫu
            if (((_a = this.modelStrokes) === null || _a === void 0 ? void 0 : _a.length) && this.char) {
                for (var _i = 0, _b = this.modelStrokes; _i < _b.length; _i++) {
                    var i = _b[_i];
                    drawChar(ctx, this.char.strokes, this.size, { color: ink, only: i });
                }
            }
            var style = { color: ink, base: this.size / 16, style: this.opts.brush };
            for (var _c = 0, _d = this.strokes; _c < _d.length; _c++) {
                var s = _d[_c];
                drawStroke(ctx, s, style);
            }
            if (this.current)
                drawStroke(ctx, this.current, style);
        };
        WritingPad.prototype.clearInk = function () {
            this.strokes = [];
            this.modelStrokes = [];
            this.current = null;
            this.redrawInk();
        };
        WritingPad.prototype.undo = function () {
            this.strokes.pop();
            this.redrawInk();
        };
        WritingPad.prototype.lock = function (v) {
            if (v === void 0) { v = true; }
            this.locked = v;
        };
        /* ---------- sự kiện bút ---------------------------------------------- */
        WritingPad.prototype._accept = function (e) {
            if (this.locked)
                return false;
            if (e.pointerType === 'pen') {
                this.penSeen = true;
                return true;
            }
            if (this.opts.penOnly)
                return false;
            // Chống tì tay: đã dùng bút thì không nhận chạm tay nữa
            if (this.penSeen && e.pointerType === 'touch')
                return false;
            return true;
        };
        /* Vị trí canvas trên màn hình, đo một lần mỗi nét.
           getBoundingClientRect() có thể buộc trình duyệt tính lại layout; gọi nó cho
           từng điểm gộp nghĩa là tới 240 lần/giây. Trong lúc viết, canvas không thể
           xê dịch (đã bắt pointer và chặn cuộn), nên đo lúc đặt bút là đủ. */
        WritingPad.prototype._syncRect = function () {
            var r = this.ink.getBoundingClientRect();
            this._rectX = r.left;
            this._rectY = r.top;
        };
        WritingPad.prototype._pt = function (e) {
            var tilt = 0;
            var az = 0; // HƯỚNG nghiêng: bút đang ngả về phía nào
            if (typeof e.altitudeAngle === 'number') {
                // altitudeAngle: π/2 là dựng đứng, 0 là nằm sát mặt kính
                tilt = 1 - Math.min(1, Math.max(0, e.altitudeAngle / (Math.PI / 2)));
                if (typeof e.azimuthAngle === 'number')
                    az = e.azimuthAngle;
                else if (e.tiltX !== undefined)
                    az = Math.atan2(e.tiltY || 0, e.tiltX || 0);
            }
            else if (e.tiltX !== undefined) {
                tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 90);
                az = Math.atan2(e.tiltY || 0, e.tiltX || 0);
            }
            return {
                x: e.clientX - this._rectX,
                y: e.clientY - this._rectY,
                p: e.pointerType === 'pen' ? (e.pressure || 0) : 0,
                tilt: tilt,
                az: az,
                t: e.timeStamp || performance.now(),
            };
        };
        WritingPad.prototype._onDown = function (e) {
            var _a, _b;
            if (this.pointerId !== null || !this._accept(e))
                return;
            e.preventDefault();
            this.ensureSize();
            this._syncRect();
            // Khoi tao am thanh NGAY trong thao tac cham: iOS chi cho phep o day.
            if (this.opts.penSound) {
                sound.initSound();
                sound.batDau();
            }
            this.pointerId = e.pointerId;
            try {
                this.ink.setPointerCapture(e.pointerId);
            }
            catch ( /* bỏ qua */_c) { /* bỏ qua */ }
            this.current = [this._pt(e)];
            (_b = (_a = this.opts).onStrokeStart) === null || _b === void 0 ? void 0 : _b.call(_a);
        };
        WritingPad.prototype._onMove = function (e) {
            if (e.pointerId !== this.pointerId || !this.current)
                return;
            e.preventDefault();
            // Lấy TOÀN BỘ các mẫu mà trình duyệt gộp lại trong khung hình này
            var raw = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
            var events = raw.length ? raw : [e];
            var style = { color: COLORS().ink, base: this.size / 16, style: this.opts.brush };
            var last = null, lastPrev = null;
            for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
                var ev = events_1[_i];
                var pt = this._pt(ev);
                var prev = this.current[this.current.length - 1];
                if (prev && Math.hypot(pt.x - prev.x, pt.y - prev.y) < 0.7)
                    continue;
                this.current.push(pt);
                drawSegment(this.inkCtx, prev, pt, style); // vẽ ngay, không đợi khung hình
                last = pt;
                lastPrev = prev;
            }
            if (this.opts.penSound && last && lastPrev) {
                var dt = Math.max(1, last.t - lastPrev.t);
                var tocDo = Math.hypot(last.x - lastPrev.x, last.y - lastPrev.y) / dt;
                sound.capNhat(tocDo, last.p || 0.4);
            }
        };
        WritingPad.prototype._onUp = function (e) {
            var _a, _b;
            if (e.pointerId !== this.pointerId)
                return;
            if (this.opts.penSound)
                sound.ketThuc();
            this.pointerId = null;
            try {
                this.ink.releasePointerCapture(e.pointerId);
            }
            catch ( /* bỏ qua */_c) { /* bỏ qua */ }
            var pts = this.current;
            this.current = null;
            if (!pts || pts.length === 0)
                return;
            var finished = smooth(pts, pts.length > 6 ? 2 : 0);
            this.strokes.push(finished);
            this.redrawInk(); // vẽ lại cho đẹp, có biến thiên độ dày
            (_b = (_a = this.opts).onStroke) === null || _b === void 0 ? void 0 : _b.call(_a, this.toUnits(finished), finished);
        };
        /** Đổi một nét từ pixel sang hệ 0…1024 để đem đi chấm điểm. */
        WritingPad.prototype.toUnits = function (pts) {
            var k = this.scale;
            if (!k)
                return pts.map(function (p) { return [p.x, p.y]; }); // chưa đo được thì thà giữ nguyên
            return pts.map(function (p) { return [p.x / k, p.y / k]; });
        };
        /** Tất cả các nét đã viết, ở hệ 0…1024. */
        WritingPad.prototype.allUnits = function () {
            var _this = this;
            return this.strokes.map(function (s) { return _this.toUnits(s); });
        };
        /* ---------- hiệu ứng phản hồi ---------------------------------------- */
        WritingPad.prototype.flash = function (ok) {
            var _this = this;
            var cls = ok ? 'flash-ok' : 'flash-bad';
            this.host.classList.remove('flash-ok', 'flash-bad');
            void this.host.offsetWidth;
            this.host.classList.add(cls);
            setTimeout(function () { return _this.host.classList.remove(cls); }, 500);
        };
        /** Thay nét vừa viết bằng chính nét mẫu — dùng khi chấm đạt, cho chữ đẹp lên. */
        WritingPad.prototype.snapLastToModel = function (strokeIndex) {
            var _a, _b;
            if (!((_b = (_a = this.char) === null || _a === void 0 ? void 0 : _a.strokes) === null || _b === void 0 ? void 0 : _b[strokeIndex]))
                return;
            this.strokes.pop();
            this.modelStrokes = this.modelStrokes || [];
            this.modelStrokes.push(strokeIndex);
            this.redrawInk();
        };
        WritingPad.prototype.destroy = function () {
            sound.dungHan();
            this.ro.disconnect();
            this.ink.remove();
            this.bg.remove();
        };
        return WritingPad;
    }());
    G.Pen = { WritingPad: WritingPad, gradeWhole: gradeWhole, gradeStroke: gradeStroke, gradeInOrder: gradeInOrder, bestMatch: bestMatch, verdict: verdict, STRICTNESS: STRICTNESS,
        drawChar: drawChar, drawGrid: drawGrid, drawPartialStroke: drawPartialStroke, drawStrokeNumbers: drawStrokeNumbers, drawMedianHint: drawMedianHint, invalidateColors: invalidateColors };
})();
