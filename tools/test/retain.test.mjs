// Nhắc học qua Lịch (G.icsText, game/js/retain.js): tệp .ics lặp theo ngày học, giờ Việt Nam.
import { loadGame, eq, ok, done } from './harness.mjs';
const G = loadGame(['js/util.js', 'js/retain.js']);
const ics = G.icsText('20:30', 45, [1, 3, 5]);
const lines = ics.split('\r\n');
ok('xuống dòng kiểu CRLF', ics.indexOf('\r\n') > 0 && ics.indexOf('\n') === ics.indexOf('\r\n') + 1);
ok('có lịch, sự kiện, báo', ['BEGIN:VCALENDAR', 'BEGIN:VEVENT', 'BEGIN:VALARM', 'END:VCALENDAR'].every((x) => lines.indexOf(x) >= 0));
eq('lặp theo ngày học T2, T4, T6', lines.find((l) => l.startsWith('RRULE:')), 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR');
const ds = lines.find((l) => l.startsWith('DTSTART;TZID=Asia/Ho_Chi_Minh:'));
ok('giờ bắt đầu theo giờ Việt Nam, đúng 20:30', !!ds && /T203000$/.test(ds));
// ngày bắt đầu phải là một ngày học (T2/T4/T6)
const ymd = ds.split(':')[1].slice(0, 8), t = Date.UTC(+ymd.slice(0, 4), +ymd.slice(4, 6) - 1, +ymd.slice(6, 8));
ok('ngày bắt đầu là ngày học', [1, 3, 5].indexOf(new Date(t).getUTCDay()) >= 0);
eq('thời lượng theo phút mỗi ngày', lines.find((l) => l.startsWith('DURATION:')), 'DURATION:PT45M');
ok('tiêu đề có số phút, dấu phẩy được thoát', lines.some((l) => l === 'SUMMARY:Học tiếng Anh với ConnectLife (45 phút)') && lines.some((l) => /DESCRIPTION:.*học bài\\, đọc truyện/.test(l)));
process.exitCode = done('Nhắc học qua Lịch');
