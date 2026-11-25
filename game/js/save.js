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
      tuChuDe: {},
      dangHoc: {},
      huyHieu: {},
      chuoi: { hienTai: 0, ngayCuoi: '' },
      caiDat: { amThanh: true, hienPinyin: true, chiNghe: false },
      taoLuc: G.vnNow()
    };
  }

  function readLS(key) { try { var o = JSON.parse(localStorage.getItem(key) || 'null'); return o && o.v === 1 ? o : null; } catch (e) { return null; } }
  function fill(s) { var b = blank(); for (var k in b) if (!(k in s)) s[k] = b[k]; migrate(s); return s; }
  /* Nâng cấp bản lưu cũ, không mất tiến độ. 24/11/2026: 4 phòng A1 thành nhóm 4 buổi (data/en_a1_more.js);
     điểm phòng cũ chép sang buổi 1 (cùng nội dung), bài đang học dở chuyển sang buổi 1. Điểm phòng cũ vẫn giữ nên phòng vẫn tính là đã qua. */
  function migrate(s) {
    var A1 = { 'en-a1-1': 'en-a1-01', 'en-a1-2': 'en-a1-05', 'en-a1-3': 'en-a1-09', 'en-a1-4': 'en-a1-13' };
    for (var o in A1) {
      if (s.phong && s.phong[o] && !s.phong[A1[o]]) s.phong[A1[o]] = JSON.parse(JSON.stringify(s.phong[o]));
      if (s.dangHoc && s.dangHoc[o] && !s.dangHoc[A1[o]]) { s.dangHoc[A1[o]] = s.dangHoc[o]; delete s.dangHoc[o]; }
    }
  }
  function newer(a, b) {   // bản nào "nhiều tiến độ" hơn / lưu sau hơn
    if (!a) return b; if (!b) return a;
    if ((a.luuLuc || 0) !== (b.luuLuc || 0)) return (a.luuLuc || 0) > (b.luuLuc || 0) ? a : b;
    return (a.xp || 0) >= (b.xp || 0) ? a : b;
  }
  G.load = function () {
    var s = newer(readLS(KEY), readLS(BAK));
    return s ? fill(s) : blank();
  };

  /* ---------- hai thứ tiếng, hai hồ sơ riêng hoàn toàn (anh Han chốt 24/11/2026) ----------
     Bản lưu gốc G.R chính là hồ sơ tiếng Anh như trước (không đổi định dạng, bản cũ đọc được ngay); hồ sơ tiếng Trung
     nằm trong G.R.zh. G.S là hồ sơ đang học: mọi phần của game vẫn đọc ghi G.S nên XP, chuỗi ngày học, rank, phòng,
     kho ôn, ngày học, bài đầu vào, mốc thời gian… của mỗi thứ tiếng tách riêng. Lưu, sao lưu, đồng bộ mây đi theo cả bản gốc.
     Danh tính (nhân vật, tên, micro) dùng chung: đổi ở thứ tiếng nào cũng đổi cả hai. */
  var SHARE = ['nhanVat', 'ten', 'avatar', 'micro'];
  function zhOf(R) {
    if (!R.zh || R.zh.v !== 1) {
      var z = blank(), cd = JSON.parse(JSON.stringify(R.caiDat || {}));
      delete cd.phutNgay; delete cd.nghiaDapAn;   // mốc thời gian, nghĩa đáp án theo trình độ: riêng từng thứ tiếng
      z.caiDat = cd;
      z.viTri = { canh: 'city_zh', x: 768, y: 330 };
      R.zh = z;
    }
    fill(R.zh);
    for (var i = 0; i < SHARE.length; i++) if (R[SHARE[i]] !== undefined) R.zh[SHARE[i]] = R[SHARE[i]];
    return R.zh;
  }
  G.LANG_NAME = { en: 'tiếng Anh', zh: 'tiếng Trung' };
  G.useRoot = function (R) { G.R = R; G.S = R.lang === 'zh' ? zhOf(R) : R; return G.S; };
  G.root = function () { return G.R || G.S; };
  G.lang = function () { return G.R && G.R.lang === 'zh' ? 'zh' : 'en'; };
  /* đổi thứ tiếng đang học (Sảnh, thẻ thành phố): đổi hồ sơ, rank tính lại theo hồ sơ đó */
  G.setLang = function (lang) {
    if (!G.R) G.R = G.S;
    G.R.lang = lang === 'zh' ? 'zh' : 'en';
    G.useRoot(G.R);
    G.save();
    if (G.initRank) G.initRank();
  };
  function syncShare() {
    var R = G.root(), o = G.S === R ? R.zh : R;
    if (!o || o === G.S) return;
    for (var i = 0; i < SHARE.length; i++) if (G.S[SHARE[i]] !== undefined) o[SHARE[i]] = G.S[SHARE[i]];
  }

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
      var data = JSON.stringify(G.root());
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
          var R = G.root();
          if (o && o.v === 1 && newer(o, R) === o && ((o.luuLuc || 0) > (R.luuLuc || 0)) && ((o.xp || 0) > (R.xp || 0) || !R.nhanVat)) {
            G.useRoot(fill(o)); G.save(); G.toast('Đã khôi phục tiến độ học từ bản sao trong máy.'); if (done) done(true);
          } else { mirror(); if (done) done(false); }
        };
        q.onerror = function () { if (done) done(false); };
      } catch (e) { if (done) done(false); }
    });
  };
  // xin trình duyệt giữ dữ liệu lâu dài (không tự xoá khi máy đầy bộ nhớ)
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* bỏ qua */ }

  G.save = function () {
    var R = G.root(), now = Date.now();
    G.S.luuLuc = now; R.luuLuc = now;
    syncShare();
    var data = JSON.stringify(R), ok = true;
    try { localStorage.setItem(KEY, data); } catch (e) { ok = false; }
    try { localStorage.setItem(BAK, data); } catch (e2) { /* bỏ qua */ }
    mirror();
    if (G.cloudQueue) G.cloudQueue();   // có đăng nhập lưu trên mây thì tự đẩy lên
    if (!ok) G.toast('Không lưu được tiến độ (bộ nhớ máy đầy?). Hãy xuất file sao lưu.');
    return ok;
  };
  /* ---------- gộp hai bản tiến độ (máy này + trên mây) mà không mất gì ----------
     Học trên iPad lúc mất mạng rồi học tiếp trên iPhone: trước đây bản lưu sau ghi đè cả khối, mất buổi học của máy kia.
     Giờ: lấy bản lưu sau làm gốc, rồi đưa vào mọi tiến độ chỉ có ở bản kia (gộp từng phần); số tiến độ lấy giá trị lớn hơn. */
  function isObj(x) { return x && typeof x === 'object' && !(x instanceof Array); }
  function union(base, other) {   // giữ base, thêm khoá chỉ có ở other (đệ quy)
    if (!isObj(base) || !isObj(other)) return base === undefined ? other : base;
    var out = {}, k;
    for (k in base) if (base.hasOwnProperty(k)) out[k] = base[k];
    for (k in other) if (other.hasOwnProperty(k)) out[k] = k in base ? union(base[k], other[k]) : other[k];
    return out;
  }
  function eachBoth(a, b, fn) { var out = union(a || {}, b || {}); for (var k in out) if (out.hasOwnProperty(k) && a && b && k in a && k in b) out[k] = fn(a[k], b[k], k); return out; }
  function num(x) { return typeof x === 'number' ? x : 0; }
  G.mergeSave = function (x, y, first) {
    if (!x || x.v !== 1) return y; if (!y || y.v !== 1) return x;
    x = JSON.parse(JSON.stringify(x)); y = JSON.parse(JSON.stringify(y));
    // gốc: bản lưu sau; lần đầu đăng nhập ở máy mới thì gốc là bản đã có nhân vật (danh tính, cài đặt giữ theo tài khoản)
    var base = first ? (y.nhanVat ? y : x) : ((y.luuLuc || 0) > (x.luuLuc || 0) ? y : x), other = base === x ? y : x;
    var m = union(base, other);
    m.xp = Math.max(num(x.xp), num(y.xp));
    m.phong = eachBoth(base.phong, other.phong, function (p, q) { return (num(q.sao) > num(p.sao) || (num(q.sao) === num(p.sao) && num(q.diem) > num(p.diem))) ? q : p; });
    m.truyen = eachBoth(base.truyen, other.truyen, function (p, q) { return Math.max(num(p), num(q)); });
    m.thiNoi = eachBoth(base.thiNoi, other.thiNoi, function (p, q) { return Math.max(num(p), num(q)); });
    m.dangHoc = eachBoth(base.dangHoc, other.dangHoc, function (p, q) {
      var o = union(p, q); o.the = Math.max(num(p.the), num(q.the)); o.tro = Math.max(num(p.tro), num(q.tro));
      o.hocXong = p.hocXong || q.hocXong || ''; o.luyenXong = p.luyenXong || q.luyenXong || ''; return o;
    });
    m.ngay = eachBoth(base.ngay, other.ngay, function (p, q) {
      var o = union(p, q); o.giay = Math.max(num(p.giay), num(q.giay));
      var h = (p.hoiThoai || []).slice(), seen = {}; h.forEach(function (e) { seen[e.luc + '|' + e.ten] = 1; });
      (q.hoiThoai || []).forEach(function (e) { if (!seen[e.luc + '|' + e.ten]) h.push(e); }); if (h.length) o.hoiThoai = h;
      if (p.noi && q.noi) o.noi = num(q.noi.n) > num(p.noi.n) ? q.noi : p.noi;
      return o;
    });
    // kho ôn: mỗi câu lấy bản đã ôn nhiều lần hơn
    m.cau = eachBoth(base.cau, other.cau, function (p, q) { return num(q.lan) > num(p.lan) ? q : p; });
    // chuỗi ngày học: cùng ngày cuối thì lấy chuỗi dài hơn, khác thì lấy bản học gần hơn; kỷ lục lấy lớn nhất
    var cx = x.chuoi || {}, cy = y.chuoi || {};
    m.chuoi = (cx.ngayCuoi || '') === (cy.ngayCuoi || '') ? (num(cx.hienTai) >= num(cy.hienTai) ? cx : cy) : ((cx.ngayCuoi || '') > (cy.ngayCuoi || '') ? cx : cy);
    m.chuoi = union(m.chuoi, {}); m.chuoi.daiNhat = Math.max(num(cx.daiNhat), num(cy.daiNhat), num(cx.hienTai), num(cy.hienTai));
    // bài đầu vào: lấy lần làm gần nhất, lịch sử gộp theo thời điểm
    var dx = x.dauVao, dy = y.dauVao; m.dauVao = dx && dy ? ((dx.luc || '') >= (dy.luc || '') ? dx : dy) : (dx || dy || null);
    var ls = (x.dauVaoLs || []).concat(y.dauVaoLs || []), seenL = {}; m.dauVaoLs = [];
    ls.sort(function (a, b) { return (a.luc || '') < (b.luc || '') ? -1 : 1; }).forEach(function (e) { if (!seenL[e.luc]) { seenL[e.luc] = 1; m.dauVaoLs.push(e); } });
    m.dauVaoLs = m.dauVaoLs.slice(-12);
    m.tuKho = base.tuKho || [];   // hàng chờ tạm: lấy theo bản gốc (gộp sẽ làm câu đã ôn bị đặt lại)
    m.luuLuc = Math.max(num(x.luuLuc), num(y.luuLuc)) + 1;
    // hồ sơ tiếng Trung: gộp riêng theo đúng các luật trên; thứ tiếng đang học giữ theo máy này (x)
    if (x.zh || y.zh) m.zh = G.mergeSave(x.zh || null, y.zh || null, first);
    if (m.zh === undefined || m.zh === null) delete m.zh;
    m.lang = x.lang === 'zh' ? 'zh' : 'en';
    return m;
  };
  /* hai bản tiến độ có như nhau không: bỏ qua mốc lưu (luuLuc) và thứ tự khoá.
     Dùng sau khi gộp với bản trên mây để biết bản đó có thật sự mang thêm gì về không (G.cloudSync). */
  function canon(o) {
    if (o === null || o === undefined || typeof o !== 'object') return JSON.stringify(o === undefined ? null : o);
    if (o instanceof Array) return '[' + o.map(canon).join(',') + ']';
    var ks = [], k;
    for (k in o) if (o.hasOwnProperty(k) && o[k] !== undefined) ks.push(k);
    ks.sort();
    return '{' + ks.map(function (x) { return JSON.stringify(x) + ':' + canon(o[x]); }).join(',') + '}';
  }
  G.sameProgress = function (a, b) {
    function top(o) { var c = {}, k; for (k in o) if (o.hasOwnProperty(k) && k !== 'luuLuc') c[k] = o[k]; return canon(c); }
    return !!a && !!b && top(a) === top(b);
  };
  /* nhận bản tiến độ từ mây: ghi vào máy (không đẩy ngược lên mây) */
  G.applySave = function (obj) {
    G.useRoot(fill(obj));
    var data = JSON.stringify(G.R);
    try { localStorage.setItem(KEY, data); } catch (e) { /* bỏ qua */ }
    try { localStorage.setItem(BAK, data); } catch (e2) { /* bỏ qua */ }
    mirror();
  };

  /* Ghi một lần học trong ngày: cập nhật chuỗi ngày học theo giờ Việt Nam (theo số ngày học mỗi tuần đã chọn) */
  G.markStudy = function () {
    var today = G.vnDay();
    var c = G.S.chuoi;
    if (c.ngayCuoi === today) return;
    // người học chọn ngày học trong tuần: ngày nghỉ theo lịch không đứt chuỗi, chỉ bỏ lỡ một ngày học mới đứt
    var last = c.ngayCuoi ? Date.parse(c.ngayCuoi + 'T00:00:00+07:00') : 0, t1 = Date.parse(today + 'T00:00:00+07:00');
    var days = last ? Math.round((t1 - last) / 86400000) : 99, ok = days <= 14, missed = 0;
    if (ok && G.isStudyDay) { for (var k = 1; k < days; k++) if (G.isStudyDay(last + k * 86400000 + 43200000)) missed++; ok = !missed; }
    else if (ok) ok = days <= Math.ceil(7 / ((G.S.caiDat && G.S.caiDat.ngayTuan) || 5));
    // băng giữ chuỗi: lỡ ngày học mà còn đủ băng thì băng tự giữ chuỗi (mỗi ngày lỡ tốn 1 băng)
    var used = 0;
    if (!ok && missed && days <= 14 && c.hienTai > 0 && (c.bang || 0) >= missed) { used = missed; c.bang -= missed; ok = true; c.dungBang = today; }
    c.hienTai = ok ? c.hienTai + 1 : 1;
    c.ngayCuoi = today;
    // mỗi 7 ngày học liên tiếp được 1 băng, giữ tối đa 2
    var got = c.hienTai > 0 && c.hienTai % 7 === 0 && (c.bang || 0) < 2;
    if (got) c.bang = (c.bang || 0) + 1;
    G.save();
    if (used && G.toast) G.toast('Hôm trước lỡ ' + used + ' ngày học: dùng ' + used + ' băng giữ chuỗi, chuỗi vẫn còn ' + c.hienTai + ' ngày.');
    else if (got && G.toast) G.toast(c.hienTai + ' ngày liên tiếp: nhận 1 băng giữ chuỗi (đang có ' + c.bang + ').');
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
    var data = JSON.stringify({ app: 'the-gioi-ngon-ngu', xuatLuc: G.vnNow(), save: G.root() }, null, 2);
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
        G.useRoot(fill(s));
        G.save();
        G.toast('Đã khôi phục tiến độ.');
        if (done) done();
      });
    };
    r.readAsText(file);
  };
})();
