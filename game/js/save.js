/* Lưu tiến độ bằng localStorage, xuất và nhập file sao lưu (.json). Giờ theo giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  var KEY = 'thegioi-save-v1', BAK = 'thegioi-save-bak';
  /* Tiến độ được giữ ở 3 nơi trong máy để cập nhật app hay lỗi bộ nhớ cũng không mất:
     1. localStorage (chính)  2. localStorage bản dự phòng  3. IndexedDB (bản sao).
     Khi mở app: lấy bản mới nhất còn đọc được. Dữ liệu cũ thiếu trường mới thì chỉ bổ sung, không bao giờ xoá. */

  function blank() {
    return {
      v: 1,
      nhanVat: null,
      ten: '',
      avatar: null,
      viTri: { canh: 'home_en', x: 330, y: 790 },
      diLai: { bus: 0, metro: 0 },
      xp: 0,
      phong: {},
      totNghiep: {},
      doiSong: {},
      tuKho: [],
      ngay: {},
      truyen: {},
      dangHoc: {},
      huyHieu: {},
      chuoi: { hienTai: 0, ngayCuoi: '' },
      caiDat: { amThanh: true, hienPinyin: true, chiNghe: false },
      taoLuc: G.vnNow()
    };
  }

  function readLS(key) { try { var o = JSON.parse(localStorage.getItem(key) || 'null'); return o && o.v === 1 ? o : null; } catch (e) { return null; } }
  function fill(s) { var b = blank(); for (var k in b) if (!(k in s)) s[k] = b[k]; return s; }
  function newer(a, b) {   // bản nào "nhiều tiến độ" hơn / lưu sau hơn
    if (!a) return b; if (!b) return a;
    if ((a.luuLuc || 0) !== (b.luuLuc || 0)) return (a.luuLuc || 0) > (b.luuLuc || 0) ? a : b;
    return (a.xp || 0) >= (b.xp || 0) ? a : b;
  }
  G.load = function () {
    var s = newer(readLS(KEY), readLS(BAK));
    return s ? fill(s) : blank();
  };

  /* IndexedDB: bản sao thứ 3 */
  var idb = null;
  function openIdb(cb) {
    if (idb) { cb(idb); return; }
    if (!window.indexedDB) { cb(null); return; }
    try {
      var r = indexedDB.open('connectlife-save', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('s'); };
      r.onsuccess = function () { idb = r.result; cb(idb); };
      r.onerror = function () { cb(null); };
    } catch (e) { cb(null); }
  }
  var idbT = 0;
  function mirror() {
    clearTimeout(idbT);
    idbT = setTimeout(function () {
      var data = JSON.stringify(G.S);
      openIdb(function (db) { if (!db) return; try { db.transaction('s', 'readwrite').objectStore('s').put(data, 'save'); } catch (e) { /* bỏ qua */ } });
    }, 1500);
  }
  /* mở app: nếu bản IndexedDB mới hơn bản đang dùng (vd. localStorage bị xoá) thì khôi phục */
  G.restoreCheck = function (done) {
    openIdb(function (db) {
      if (!db) { if (done) done(false); return; }
      try {
        var q = db.transaction('s', 'readonly').objectStore('s').get('save');
        q.onsuccess = function () {
          var o = null; try { o = q.result ? JSON.parse(q.result) : null; } catch (e) { o = null; }
          if (o && o.v === 1 && newer(o, G.S) === o && ((o.luuLuc || 0) > (G.S.luuLuc || 0)) && ((o.xp || 0) > (G.S.xp || 0) || !G.S.nhanVat)) {
            G.S = fill(o); G.save(); G.toast('Đã khôi phục tiến độ học từ bản sao trong máy.'); if (done) done(true);
          } else { mirror(); if (done) done(false); }
        };
        q.onerror = function () { if (done) done(false); };
      } catch (e) { if (done) done(false); }
    });
  };
  // xin trình duyệt giữ dữ liệu lâu dài (không tự xoá khi máy đầy bộ nhớ)
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* bỏ qua */ }

  G.save = function () {
    G.S.luuLuc = Date.now();
    var data = JSON.stringify(G.S), ok = true;
    try { localStorage.setItem(KEY, data); } catch (e) { ok = false; }
    try { localStorage.setItem(BAK, data); } catch (e2) { /* bỏ qua */ }
    mirror();
    if (G.cloudQueue) G.cloudQueue();   // có đăng nhập lưu trên mây thì tự đẩy lên
    if (!ok) G.toast('Không lưu được tiến độ (bộ nhớ máy đầy?). Hãy xuất file sao lưu.');
    return ok;
  };
  /* nhận bản tiến độ từ mây: ghi vào máy (không đẩy ngược lên mây) */
  G.applySave = function (obj) {
    G.S = fill(obj);
    var data = JSON.stringify(G.S);
    try { localStorage.setItem(KEY, data); } catch (e) { /* bỏ qua */ }
    try { localStorage.setItem(BAK, data); } catch (e2) { /* bỏ qua */ }
    mirror();
  };

  /* Ghi một lần học trong ngày: cập nhật chuỗi ngày theo giờ Việt Nam */
  G.markStudy = function () {
    var today = G.vnDay();
    var c = G.S.chuoi;
    if (c.ngayCuoi === today) return;
    var y = G.vnDay(Date.now() - 86400000);
    c.hienTai = c.ngayCuoi === y ? c.hienTai + 1 : 1;
    c.ngayCuoi = today;
    G.save();
  };

  G.addXp = function (n) { G.S.xp += n; G.save(); if (G.updateHud) G.updateHud(); achSoon(); };
  // kiểm tra rank / huy hiệu mới ngay sau thao tác hiện tại
  var achT = 0;
  function achSoon() { clearTimeout(achT); achT = setTimeout(function () { if (G.checkAchievements) G.checkAchievements(); }, 900); }
  G.achSoon = achSoon;

  G.addHard = function (lang, word) {
    var id = lang + ':' + word;
    if (G.S.tuKho.indexOf(id) < 0) { G.S.tuKho.push(id); if (G.S.tuKho.length > 300) G.S.tuKho.shift(); G.save(); }
  };

  /* Xuất: tải về file thegioi-YYYYMMDD-HHmm.json */
  G.exportSave = function () {
    var data = JSON.stringify({ app: 'the-gioi-ngon-ngu', xuatLuc: G.vnNow(), save: G.S }, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'thegioi-' + G.vnStamp() + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.parentNode.removeChild(a); }, 1000);
    G.toast('Đã tải file sao lưu về máy.');
  };

  /* Nhập: kiểm tra hợp lệ rồi hỏi lại trước khi ghi đè */
  G.importSave = function (file, done) {
    var r = new FileReader();
    r.onload = function () {
      var obj = null;
      try { obj = JSON.parse(r.result); } catch (e) { obj = null; }
      var s = obj && obj.save ? obj.save : obj;
      if (!s || s.v !== 1 || typeof s.xp !== 'number' || !s.phong) { G.toast('File này không phải bản sao lưu của game.'); return; }
      var msg = 'Ghi đè tiến độ hiện tại bằng bản sao lưu' + (obj.xuatLuc ? ' lúc ' + obj.xuatLuc : '') + '? (' + s.xp + ' XP)';
      G.confirm(msg, function () {
        G.S = s;
        G.save();
        G.toast('Đã khôi phục tiến độ.');
        if (done) done();
      });
    };
    r.readAsText(file);
  };
})();
