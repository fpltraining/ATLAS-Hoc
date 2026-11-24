// Hai thứ tiếng, hai hồ sơ riêng hoàn toàn (save.js: G.useRoot, G.setLang, G.root): XP, chuỗi, phòng, kho ôn tách riêng;
// bản lưu cũ đọc được ngay; danh tính dùng chung; lưu và gộp mây đi theo cả bản gốc.
import { loadGame, eq, ok, done } from './harness.mjs';

const store = {};
const LS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const G = loadGame(['js/util.js', 'js/save.js'], { localStorage: LS });

// bản lưu cũ (chỉ tiếng Anh, chưa có lang / zh)
store['thegioi-save-v1'] = JSON.stringify({ v: 1, nhanVat: 'han', ten: 'Han', xp: 420, phong: { 'en-a1-01': { sao: 3, diem: 10 } }, chuoi: { hienTai: 6, ngayCuoi: '2026-11-24' },
  cau: { hello: { en: 'hello', lan: 3 } }, caiDat: { amThanh: true, tocDo: 0.7, phutNgay: 55, ngayTuan: 4, ngayHoc: [1, 2, 4, 5] }, luuLuc: 100 });
G.useRoot(G.load());
eq('bản cũ: đang học tiếng Anh', G.lang(), 'en');
ok('hồ sơ tiếng Anh là bản gốc', G.S === G.R && G.S.xp === 420);

G.setLang('zh');
eq('đổi sang tiếng Trung', G.lang(), 'zh');
ok('hồ sơ tiếng Trung riêng, bắt đầu từ đầu', G.S === G.R.zh && G.S.xp === 0 && !Object.keys(G.S.phong).length && G.S.chuoi.hienTai === 0 && !Object.keys(G.S.cau || {}).length);
eq('dùng chung nhân vật, tên', [G.S.nhanVat, G.S.ten], ['han', 'Han']);
eq('cài đặt nghe nhìn theo bản tiếng Anh, mốc thời gian riêng', [G.S.caiDat.tocDo, G.S.caiDat.ngayTuan, G.S.caiDat.phutNgay], [0.7, 4, undefined]);
eq('vị trí ở Trường Lạc trấn', G.S.viTri.canh, 'city_zh');

G.S.xp += 50; G.S.phong['zh-hsk1-1'] = { sao: 2, diem: 9 }; G.S.chuoi = { hienTai: 1, ngayCuoi: '2026-11-25' }; G.S.ten = 'Hân';
G.save();
const saved = JSON.parse(store['thegioi-save-v1']);
eq('lưu cả bản gốc: tiếng Anh giữ nguyên, tiếng Trung có tiến độ mới', [saved.xp, saved.chuoi.hienTai, saved.zh.xp, saved.zh.phong['zh-hsk1-1'].sao, saved.lang], [420, 6, 50, 2, 'zh']);
eq('đổi tên ở tiếng Trung thì tiếng Anh cũng đổi', saved.ten, 'Hân');
ok('mốc lưu gốc và hồ sơ cùng cập nhật', saved.luuLuc === saved.zh.luuLuc && saved.luuLuc > 100);

// mở lại app: vẫn ở tiếng Trung, đúng tiến độ
G.R = null; G.useRoot(G.load());
ok('mở lại app: vẫn học tiếng Trung, đủ tiến độ', G.lang() === 'zh' && G.S.xp === 50 && G.R.xp === 420);
G.setLang('en');
ok('về tiếng Anh: XP, chuỗi, phòng của tiếng Anh', G.S === G.R && G.S.xp === 420 && G.S.chuoi.hienTai === 6 && !!G.S.phong['en-a1-01'] && !G.S.phong['zh-hsk1-1']);
eq('XP tiếng Trung vẫn còn', G.R.zh.xp, 50);

// gộp hai máy: tiếng Trung gộp riêng theo đúng luật, thứ tiếng đang học theo máy này
const ipad = JSON.parse(JSON.stringify(G.R)), phone = JSON.parse(JSON.stringify(G.R));
ipad.zh.phong['zh-hsk1-2'] = { sao: 3, diem: 10 }; ipad.zh.xp = 90; ipad.zh.luuLuc = 500; ipad.luuLuc = 500; ipad.lang = 'zh';
phone.zh.phong['zh-hsk1-1'] = { sao: 3, diem: 10 }; phone.zh.xp = 70; phone.xp = 430; phone.lang = 'en'; phone.luuLuc = 400;
const m = G.mergeSave(phone, ipad);
eq('tiếng Trung: có cả hai buổi, buổi 1 lấy 3 sao, XP lớn nhất', [Object.keys(m.zh.phong).sort(), m.zh.phong['zh-hsk1-1'].sao, m.zh.xp], [['zh-hsk1-1', 'zh-hsk1-2'], 3, 90]);
eq('tiếng Anh gộp như cũ', [m.xp, !!m.phong['en-a1-01']], [430, true]);
eq('thứ tiếng đang học theo máy này', m.lang, 'en');
ok('khác ở hồ sơ tiếng Trung cũng tính là khác', !G.sameProgress(m, G.mergeSave(phone, phone)));
eq('chỉ một máy có tiếng Trung: giữ nguyên', G.mergeSave({ v: 1, xp: 1, luuLuc: 1 }, { v: 1, xp: 1, luuLuc: 2, zh: { v: 1, xp: 33, luuLuc: 2 } }).zh.xp, 33);
ok('chưa máy nào học tiếng Trung: không thêm hồ sơ rỗng', !('zh' in G.mergeSave({ v: 1, xp: 1, luuLuc: 1 }, { v: 1, xp: 2, luuLuc: 2 })));

process.exit(done('Hai thứ tiếng, hai hồ sơ') ? 1 : 0);
