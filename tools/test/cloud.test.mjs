// Đồng bộ lên mây (G.cloudSync, game/js/cloud.js) với máy chủ Supabase giả:
// học một máy thì chỉ đẩy lên, không báo "đã lấy tiến độ", không nạp lại app (lỗi 24/11/2026: vào map bị văng ra);
// máy khác lưu thì gộp, nhưng đang ngoài phố / trong bài thì chờ về Sảnh.
import { loadGame, eq, ok, done } from './harness.mjs';

const store = {};
const LS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
const server = { row: null, afterGet: null };
const copy = (x) => JSON.parse(JSON.stringify(x));
function FakeXHR() {}
FakeXHR.prototype.open = function (m, u) { this.m = m; this.u = u; };
FakeXHR.prototype.setRequestHeader = function () {};
FakeXHR.prototype.send = function (body) {
  let res;
  if (this.u.indexOf('/auth/v1/') >= 0) res = { access_token: 'a', refresh_token: 'r', expires_in: 3600, user: { id: 'u1', email: 'hoc@vien' } };
  else if (this.m === 'GET') { res = server.row ? [copy(server.row)] : []; if (server.afterGet) { const f = server.afterGet; server.afterGet = null; f(); } }
  else {   // upsert; bản cũ hơn không ghi đè bản mới hơn, trả lại mốc đang giữ
    const b = JSON.parse(body);
    if (!server.row || b.luu_luc >= server.row.luu_luc) server.row = { data: b.data, luu_luc: b.luu_luc };
    res = [{ luu_luc: server.row.luu_luc }];
  }
  this.status = 200; this.responseText = JSON.stringify(res); this.onload();
};

const G = loadGame(['js/util.js', 'js/save.js', 'js/cloud.js'], { XMLHttpRequest: FakeXHR, localStorage: LS });
G.CLOUD_URL = 'https://x.supabase.co'; G.CLOUD_KEY = 'k';
const pulled = []; G.onCloudPulled = (first) => pulled.push(first);
let calm = true; G.cloudCalm = () => calm;
function sync(first) { let r; G.cloudSync((e, what) => { r = e || what; }, first); return r; }
function bump() { G.S.luuLuc = Math.max(G.S.luuLuc || 0, server.row ? server.row.luu_luc : 0) + 1000; }

G.S = { v: 1, nhanVat: 'han', ten: 'Han', xp: 50, phong: { 'en-a1-01': { sao: 1, diem: 6 } }, totNghiep: {}, doiSong: {}, tuKho: [], ngay: {}, truyen: { a: 1 },
  tuChuDe: {}, dangHoc: { 'en-a1-01': { the: 3, tro: 0 } }, huyHieu: {}, chuoi: { hienTai: 1, ngayCuoi: '2026-11-24' }, caiDat: {}, cau: {}, luuLuc: 1000 };

// 1. đăng nhập lần đầu, trên mây chưa có gì: đẩy lên
let r; G.cloudSignIn('hoc@vien', 'matkhau', (e, what) => { r = e || what; });
eq('đăng nhập, mây trống: đẩy lên', r, 'pushed');
eq('mây giữ đúng bản trong máy', server.row.luu_luc, G.S.luuLuc);

// 2. học tiếp trên máy này (xong buổi: bỏ bài đang dở), vào map lưu: chỉ đẩy lên, không gộp, không nạp lại
delete G.S.dangHoc['en-a1-01']; G.S.phong['en-a1-01'] = { sao: 3, diem: 10 }; G.S.xp = 80; bump();
eq('một máy: chỉ đẩy lên', sync(), 'pushed');
eq('không báo đã lấy tiến độ / không nạp lại app', pulled.length, 0);
ok('bài đã học xong không sống lại trên mây', !server.row.data.dangHoc['en-a1-01']);
eq('mây có bản mới nhất', [server.row.luu_luc, server.row.data.xp], [G.S.luuLuc, 80]);
eq('đồng bộ lại ngay: như nhau', sync(), 'same');

// 3. bản cài trước bản sửa (chưa nhớ mốc trên mây), mây là bản cũ của chính máy này: gộp nhưng không báo gì
delete store['cl-cloud-luc']; G.S.truyen.a = 2; bump();
eq('chưa có mốc, mây là bản cũ của máy này: không báo đã lấy', [sync(), pulled.length], ['pushed', 0]);
ok('đã nhớ mốc trên mây', JSON.parse(store['cl-cloud-luc']).l === server.row.luu_luc);

// 4. máy khác (iPad) học thêm buổi 2 và lưu, máy này đang ở Sảnh: gộp, báo, nạp lại
let ipad = copy(server.row.data); ipad.phong['en-a1-02'] = { sao: 2, diem: 9 }; ipad.luuLuc = server.row.luu_luc + 5000;
server.row = { data: ipad, luu_luc: ipad.luuLuc };
G.S.xp = 95; bump();
eq('máy khác lưu, đang ở Sảnh: gộp', sync(), 'pulled');
eq('báo một lần, không phải lần đăng nhập đầu', pulled, [false]);
ok('có buổi 2 của iPad và XP của máy này', !!G.S.phong['en-a1-02'] && G.S.xp === 95 && G.S.phong['en-a1-01'].sao === 3);
eq('mây nhận bản gộp', server.row.luu_luc, G.S.luuLuc);

// 5. máy khác lưu lúc máy này đang ngoài phố: chưa gộp, không nạp lại, không ghi đè mây; về Sảnh mới gộp
ipad = copy(server.row.data); ipad.truyen.z = 4; ipad.luuLuc = server.row.luu_luc + 5000; server.row = { data: ipad, luu_luc: ipad.luuLuc };
G.S.xp = 120; bump(); calm = false; G._cloudWait = false;
eq('ngoài phố: chờ', sync(), 'wait');
ok('chưa đụng tới tiến độ trong máy', !G.S.truyen.z && G.S.xp === 120);
ok('đánh dấu gộp khi về Sảnh', G._cloudWait === true);
ok('không ghi đè bản của máy khác trên mây', server.row.data.truyen.z === 4);
eq('không nạp lại app', pulled.length, 1);
calm = true;
eq('về Sảnh: gộp', sync(), 'pulled');
ok('có truyện của máy khác, giữ XP của máy này', G.S.truyen.z === 4 && G.S.xp === 120);

// 6. máy khác đẩy lên đúng lúc máy này đang đẩy: lấy bản đó gộp thêm rồi đẩy lại
G.S.xp = 130; bump();
server.afterGet = () => { const d = copy(server.row.data); d.truyen.y = 1; d.luuLuc = G.S.luuLuc + 9000; server.row = { data: d, luu_luc: d.luuLuc }; };
eq('đẩy bị từ chối vì máy khác vừa lưu: gộp thêm', sync(), 'pulled');
ok('có tiến độ của cả hai máy', G.S.truyen.y === 1 && G.S.xp === 130);
eq('mây nhận bản gộp sau cùng', server.row.luu_luc, G.S.luuLuc);

// 7. so sánh tiến độ không tính mốc lưu và thứ tự khoá
ok('cùng tiến độ, khác mốc lưu và thứ tự khoá: như nhau', G.sameProgress({ a: 1, b: { x: 1, y: 2 }, luuLuc: 1 }, { b: { y: 2, x: 1 }, a: 1, luuLuc: 9 }));
ok('khác tiến độ: khác', !G.sameProgress({ a: 1 }, { a: 2 }));

process.exit(done('Đồng bộ lên mây') ? 1 : 0);
