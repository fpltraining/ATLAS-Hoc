/* Giữ chân người học (24/11/2026):
   1. G.share(tiêu đề, chữ): chia sẻ kết quả qua bảng chia sẻ của máy (Zalo, Messenger…); máy không có thì chép vào bộ nhớ tạm.
   2. G.reminderCard(): thẻ "Nhắc học qua Lịch" trong Cài đặt. Tạo tệp .ics lặp lại theo ngày học đã chọn (G.studyDays),
      giờ Việt Nam (Asia/Ho_Chi_Minh), có báo đúng giờ. App web chưa gửi được thông báo khi đóng, nên nhờ Lịch của máy nhắc. */
var G = window.G || (window.G = {});

(function () {
  function appUrl() { try { return location.origin + location.pathname.replace(/[^\/]*$/, ''); } catch (e) { return ''; } }
  G.share = function (title, text) {
    var url = appUrl(), all = text + (url ? '\n' + url : '');
    if (navigator.share) { navigator.share({ title: title, text: text, url: url || undefined }).catch(function () { /* người dùng đóng bảng chia sẻ */ }); return; }
    function done() { G.toast('Đã chép kết quả. Dán vào Zalo hoặc Messenger để khoe nhé.'); }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(all).then(done, function () { G.toast(all); }); return; }
    G.toast(all);
  };
  G.shareBtn = function (title, text, cls) {
    return G.el('button.btn' + (cls || ''), { onclick: function () { G.share(title, typeof text === 'function' ? text() : text); } }, G.ic3('share', 'ic3-s'), ' Chia sẻ');
  };

  /* ---------- nhắc học qua Lịch (.ics) ---------- */
  var BYDAY = { 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU' };
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
  function vnDow(t) { var d = new Date(t + 7 * 3600000).getUTCDay(); return d === 0 ? 7 : d; }   // 1 = thứ Hai … 7 = Chủ nhật, giờ Việt Nam
  G.icsText = function (hhmm, mins, days) {
    days = days && days.length ? days : (G.studyDays ? G.studyDays() : [1, 2, 3, 4, 5]);
    var hm = (hhmm || '20:00').split(':'), h = +hm[0] || 20, mi = +hm[1] || 0, now = Date.now(), start = null;
    // ngày bắt đầu: ngày học gần nhất từ hôm nay (giờ Việt Nam) mà giờ nhắc chưa qua
    for (var k = 0; k < 8 && !start; k++) {
      var t = now + k * 86400000, p = G.vnParts ? G.vnParts(t) : null, ymd = G.vnDay(t);
      var passed = k === 0 && p && (p.h > h || (p.h === h && p.mi >= mi));
      if (days.indexOf(vnDow(t)) >= 0 && !passed) start = ymd;
    }
    start = start || G.vnDay();
    var u = new Date(), stamp = u.getUTCFullYear() + pad(u.getUTCMonth() + 1) + pad(u.getUTCDate()) + 'T' + pad(u.getUTCHours()) + pad(u.getUTCMinutes()) + pad(u.getUTCSeconds()) + 'Z';
    var by = days.slice().sort().map(function (d) { return BYDAY[d]; }).join(','), url = appUrl();
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ConnectLife//Nhac hoc//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
      'BEGIN:VTIMEZONE', 'TZID:Asia/Ho_Chi_Minh', 'BEGIN:STANDARD', 'DTSTART:19700101T000000', 'TZOFFSETFROM:+0700', 'TZOFFSETTO:+0700', 'TZNAME:ICT', 'END:STANDARD', 'END:VTIMEZONE',
      'BEGIN:VEVENT', 'UID:connectlife-nhac-hoc-' + Date.now() + '@connectlife', 'DTSTAMP:' + stamp,
      'DTSTART;TZID=Asia/Ho_Chi_Minh:' + start.replace(/-/g, '') + 'T' + pad(h) + pad(mi) + '00', 'DURATION:PT' + mins + 'M',
      'RRULE:FREQ=WEEKLY;BYDAY=' + by,
      'SUMMARY:' + esc('Học tiếng Anh với ConnectLife (' + mins + ' phút)'),
      'DESCRIPTION:' + esc('Mở ConnectLife, làm Nhiệm vụ hôm nay: học bài, đọc truyện, nói chuyện, ôn câu, học từ.' + (url ? '\n' + url : '')),
      url ? 'URL:' + url : null,
      'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc('Đến giờ học tiếng Anh rồi'), 'TRIGGER:-PT0M', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'];
    return L.filter(function (x) { return x !== null; }).join('\r\n') + '\r\n';
  };
  G.addReminder = function (hhmm) {
    var mins = Math.max(15, Math.round((G.dayProgress ? G.dayProgress().goal : 30) || 30));
    var ics = G.icsText(hhmm, mins);
    try {
      var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' }), url = URL.createObjectURL(blob);
      var a = G.el('a', { href: url, download: 'connectlife-nhac-hoc.ics', style: { display: 'none' } });
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); if (a.parentNode) a.parentNode.removeChild(a); }, 4000);
      G.S.caiDat.gioNhac = hhmm; G.S.caiDat.nhacLuc = G.vnNow(); G.save();
      G.toast('Mở tệp vừa tải và bấm "Thêm vào Lịch". Lịch sẽ nhắc bạn lúc ' + hhmm + ' vào các ngày học.');
    } catch (e) { G.toast('Máy này chưa tạo được tệp lịch. Thử mở app bằng Safari nhé.'); }
  };
  G.reminderCard = function () {
    var cd = G.S.caiDat || (G.S.caiDat = {});
    var inp = G.el('input.rm-time', { type: 'time', value: cd.gioNhac || '20:00', 'aria-label': 'Giờ nhắc học' });
    var days = (G.studyDays ? G.studyDays() : [1, 2, 3, 4, 5]).map(function (d) { return ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][d]; }).join(', ');
    return G.el('div.cl-card.rm-card', G.el('b', G.ic3('alarm', 'ic3-s'), 'Nhắc học qua Lịch'),
      G.el('span.small.faint', 'Lịch của máy sẽ nhắc bạn vào ngày học (' + days + ') đúng giờ đã chọn. Đổi ngày học ở Sảnh thì tạo lại lời nhắc.' + (cd.nhacLuc ? ' Đã tạo lúc ' + cd.nhacLuc.slice(11, 16) + ' ngày ' + cd.nhacLuc.slice(8, 10) + '/' + cd.nhacLuc.slice(5, 7) + '.' : '')),
      G.el('div.rm-row', G.field ? G.field('Giờ học', inp) : inp,
        G.el('button.btn.sm', { onclick: function () { G.addReminder(inp.value || '20:00'); } }, 'Thêm lời nhắc vào Lịch')));
  };
})();
