/* Lưu tiến độ bằng localStorage, xuất và nhập file sao lưu (.json). Giờ theo giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  var KEY = 'thegioi-save-v1';

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
      chuoi: { hienTai: 0, ngayCuoi: '' },
      caiDat: { amThanh: true, hienPinyin: true, chiNghe: false },
      taoLuc: G.vnNow()
    };
  }

  G.load = function () {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { s = null; }
    var b = blank();
    if (!s || s.v !== 1) return b;
    for (var k in b) if (!(k in s)) s[k] = b[k];
    return s;
  };

  G.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(G.S)); return true; } catch (e) { G.toast('Không lưu được tiến độ (bộ nhớ máy đầy?)'); return false; }
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

  G.addXp = function (n) { G.S.xp += n; G.save(); if (G.updateHud) G.updateHud(); };

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
