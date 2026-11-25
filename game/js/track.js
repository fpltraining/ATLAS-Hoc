/* Số liệu dùng app và ghi lỗi, ẩn danh (bảng app_events, supabase/migrations/20261124_app_events.sql).
   G.track(tên, {số liệu}): xếp hàng rồi gửi theo lô (30 giây một lần, hoặc khi ẩn app). Không gửi tên, email, câu người học nói.
   Bảng chưa tạo hoặc mạng lỗi thì im lặng bỏ qua, không ảnh hưởng việc học. Tắt được trong Cài đặt (G.S.caiDat.soLieu = false).
   Lỗi JS: tối đa 8 lỗi khác nhau mỗi lần mở app. APP_VER giữ giống VERSION trong game/sw.js. */
var G = window.G || (window.G = {});

(function () {
  G.APP_VER = 'thegioi-v132';
  var Q = [], off = false, timer = 0, errs = {}, nErr = 0;
  function on() {
    if (off || !G.CLOUD_URL || !G.CLOUD_KEY) return false;
    if (G.S && G.S.caiDat && G.S.caiDat.soLieu === false) return false;
    try { if (localStorage.getItem('cl-ev-off') === G.vnDay()) return false; } catch (e) { /* bỏ qua */ }
    return true;
  }
  function device() {
    try {
      var d = localStorage.getItem('cl-dev');
      if (!d) { d = ''; for (var i = 0; i < 16; i++) d += Math.floor(Math.random() * 16).toString(16); localStorage.setItem('cl-dev', d); }
      return d;
    } catch (e) { return 'khong-luu'; }
  }
  function flush(keep) {
    clearTimeout(timer); timer = 0;
    if (!Q.length || !on()) { Q = []; return; }
    var rows = Q.splice(0, 40);
    try {
      fetch(G.CLOUD_URL.replace(/\/+$/, '') + '/rest/v1/app_events', {
        method: 'POST', keepalive: !!keep,
        headers: { apikey: G.CLOUD_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(rows)
      }).then(function (r) {
        // bảng chưa tạo (404) hoặc chưa cho ghi (401/403): thôi gửi tới hết ngày
        if (r.status === 404 || r.status === 401 || r.status === 403) { off = true; try { localStorage.setItem('cl-ev-off', G.vnDay()); } catch (e) { /* bỏ qua */ } }
      }).catch(function () { /* mất mạng: bỏ lô này */ });
    } catch (e) { /* máy cũ không có fetch */ }
  }
  G.track = function (name, props) {
    if (!on()) return;
    var p = props || {};
    p.lang = G.lang ? G.lang() : 'en';   // thứ tiếng đang học (hồ sơ riêng)
    p.tang = p.lang === 'zh' ? (G.zhFloorNow ? G.zhFloorNow() : undefined) : (G.enFloorNow ? G.enFloorNow() : undefined);
    Q.push({ device: device(), ver: G.APP_VER, name: String(name).slice(0, 40), props: p });
    if (Q.length >= 20) flush(); else if (!timer) timer = setTimeout(flush, 30000);
  };
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });
  // lỗi JS: gửi tên lỗi, tệp, dòng (không gửi nội dung người học)
  function logErr(msg, src, line) {
    msg = String(msg || '').slice(0, 200); if (!msg || errs[msg] || nErr >= 8) return;
    errs[msg] = 1; nErr++;
    G.track('loi', { msg: msg, src: String(src || '').replace(/^.*\/game\//, '').slice(0, 80), line: line || 0, ua: (navigator.userAgent || '').slice(0, 120) });
  }
  window.addEventListener('error', function (e) { logErr(e.message, e.filename, e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { var r = e && e.reason; logErr(r && (r.message || r) || 'promise', '', 0); });
  // mở app: mỗi lần mở một sự kiện (máy cài như app hay mở bằng trình duyệt, cỡ màn hình)
  setTimeout(function () {
    var sa = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
    G.track('mo_app', { app: sa ? 1 : 0, w: window.innerWidth, h: window.innerHeight, lv: G.S && G.S.dauVao ? G.S.dauVao.lv : null });
  }, 4000);
})();
