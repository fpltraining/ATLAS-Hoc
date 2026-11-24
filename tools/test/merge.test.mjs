// Gộp tiến độ hai máy (G.mergeSave, game/js/save.js): không mất tiến độ của máy nào.
import { loadGame, eq, ok, done } from './harness.mjs';
const G = loadGame(['js/util.js', 'js/save.js']);
const blank = () => ({ v: 1, nhanVat: 'han', xp: 0, phong: {}, totNghiep: {}, doiSong: {}, tuKho: [], ngay: {}, truyen: {}, dangHoc: {}, huyHieu: {}, chuoi: { hienTai: 0, ngayCuoi: '' }, caiDat: {}, cau: {}, tuChuDe: {}, luuLuc: 0 });

// iPad học buổi 1 lúc mất mạng, iPhone học buổi 2 sau đó
const ipad = blank(), iphone = blank();
ipad.xp = 120; ipad.phong['en-n-01'] = { sao: 3, diem: 10 }; ipad.luuLuc = 100; ipad.truyen.a = 2;
ipad.ngay['2026-11-24'] = { giay: 900, viec: { bai: '08:00' } };
ipad.cau.people = { en: 'people', box: 4, lan: 5, due: '2026-12-01' };
ipad.chuoi = { hienTai: 5, ngayCuoi: '2026-11-24', daiNhat: 7 };
iphone.xp = 80; iphone.phong['en-n-02'] = { sao: 2, diem: 8 }; iphone.phong['en-n-01'] = { sao: 1, diem: 6 }; iphone.luuLuc = 200; iphone.truyen.a = 1; iphone.truyen.b = 3;
iphone.ngay['2026-11-24'] = { giay: 600, viec: { doc: '20:00' } };
iphone.cau.people = { en: 'people', box: 0, lan: 1, due: '2026-11-25' }; iphone.cau.world = { en: 'world', box: 1, lan: 1 };
iphone.tuChuDe = { core: { people: 1 } }; ipad.tuChuDe = { core: { world: 1 }, numbers: { one: 1 } };
iphone.chuoi = { hienTai: 2, ngayCuoi: '2026-11-23', daiNhat: 3 };
const m = G.mergeSave(ipad, iphone);
eq('XP lấy lớn nhất', m.xp, 120);
eq('phòng: có cả hai buổi, buổi 1 giữ 3 sao', [Object.keys(m.phong).sort(), m.phong['en-n-01'].sao], [['en-n-01', 'en-n-02'], 3]);
eq('truyện: chương lớn nhất từng cuốn', m.truyen, { a: 2, b: 3 });
eq('ngày học: giây lớn nhất, việc gộp', [m.ngay['2026-11-24'].giay, Object.keys(m.ngay['2026-11-24'].viec).sort()], [900, ['bai', 'doc']]);
eq('kho ôn: câu ôn nhiều hơn thắng', m.cau.people.box, 4);
ok('kho ôn: câu chỉ có ở một máy vẫn còn', !!m.cau.world);
eq('từ chủ đề gộp', [Object.keys(m.tuChuDe.core).sort(), !!m.tuChuDe.numbers], [['people', 'world'], true]);
eq('chuỗi: lấy ngày học gần nhất, kỷ lục lớn nhất', [m.chuoi.hienTai, m.chuoi.ngayCuoi, m.chuoi.daiNhat], [5, '2026-11-24', 7]);
ok('mốc lưu mới hơn cả hai', m.luuLuc > 200);
// gộp lại lần nữa không đổi (trừ mốc lưu)
const m2 = G.mergeSave(m, m); delete m2.luuLuc; const m1 = JSON.parse(JSON.stringify(m)); delete m1.luuLuc;
eq('gộp hai bản giống nhau không đổi', m2, m1);
// lần đầu đăng nhập ở máy mới: danh tính theo tài khoản, tiến độ học thử trong máy vẫn giữ
const trial = blank(); trial.nhanVat = 'minh'; trial.ten = 'Thử'; trial.xp = 15; trial.phong['en-n-01'] = { sao: 1, diem: 6 }; trial.luuLuc = 999;
const acct = blank(); acct.ten = 'Han'; acct.xp = 500; acct.phong['en-a2-01'] = { sao: 3, diem: 10 }; acct.luuLuc = 50;
const f = G.mergeSave(trial, acct, true);
eq('lần đầu: tên và nhân vật theo tài khoản', [f.ten, f.nhanVat], ['Han', 'han']);
eq('lần đầu: giữ cả buổi học thử', Object.keys(f.phong).sort(), ['en-a2-01', 'en-n-01']);
eq('bản hỏng thì giữ bản còn lại', G.mergeSave(null, ipad).xp, 120);
process.exitCode = done('Gộp tiến độ hai máy');
