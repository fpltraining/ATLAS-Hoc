// Chuỗi ngày học và băng giữ chuỗi (G.markStudy, game/js/save.js). Lịch học T2–T6, giờ Việt Nam.
import { loadGame, eq, ok, done } from './harness.mjs';
const G = loadGame(['js/util.js', 'js/save.js']);
let today = '2026-11-02';   // thứ Hai
G.vnDay = () => today;
G.isStudyDay = (t) => { const d = new Date(t + 7 * 3600e3).getUTCDay(); return d >= 1 && d <= 5; };
G.toast = () => {};
G.S = G.load();
const day = (d) => { today = d; G.markStudy(); return G.S.chuoi; };
// học đủ T2–T6 hai tuần liền: tới ngày thứ 7 của chuỗi được 1 băng
['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-09', '2026-11-10'].forEach(day);
eq('7 ngày học liên tiếp (cuối tuần nghỉ không đứt)', G.S.chuoi.hienTai, 7);
eq('được 1 băng ở ngày thứ 7', G.S.chuoi.bang, 1);
// lỡ thứ Tư 11/11, học lại thứ Năm: băng giữ chuỗi
let c = day('2026-11-12');
eq('lỡ 1 ngày học: băng giữ chuỗi', [c.hienTai, c.bang, c.dungBang], [8, 0, '2026-11-12']);
// lỡ tiếp thứ Hai 16/11 mà hết băng: chuỗi về 1
day('2026-11-13');
c = day('2026-11-17');
eq('hết băng thì chuỗi tính lại', c.hienTai, 1);
// học lại 14 ngày học liên tiếp: được tối đa 2 băng
const ds = ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-03', '2026-12-04', '2026-12-07', '2026-12-08', '2026-12-09', '2026-12-10', '2026-12-11', '2026-12-14', '2026-12-15', '2026-12-16'];
ds.forEach(day);
eq('22 ngày liên tiếp', G.S.chuoi.hienTai, 22);
eq('băng giữ tối đa 2', G.S.chuoi.bang, 2);
// cùng một ngày học hai lần không cộng chuỗi
c = day('2026-12-16');
eq('một ngày chỉ tính một lần', c.hienTai, 22);
// nghỉ quá 2 tuần: không dùng băng, chuỗi về 1
c = day('2027-01-11');
eq('nghỉ quá 14 ngày thì không giữ chuỗi', [c.hienTai, c.bang], [1, 2]);
process.exitCode = done('Chuỗi ngày học và băng giữ chuỗi');
