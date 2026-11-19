/* Lưu tiến độ lên mây (Supabase): đăng nhập email + mật khẩu một lần, sau đó app tự đồng bộ.
   - Mỗi lần lưu: chờ 5 giây yên rồi đẩy lên mây; thoát app / mất mạng có lại thì đẩy ngay.
   - Mở app: lấy bản trên mây nếu bản đó được lưu sau (học ở máy khác), bản trong máy cất lại làm dự phòng.
   - Lần đầu đăng nhập trên máy mới: giữ bản nhiều tiến độ hơn (XP cao hơn) để không đè mất bài đã học.
   - Trên mây giữ bản lưu theo giờ (60 bản gần nhất) và từ chối bản cũ hơn ghi đè bản mới.
   Cấu hình ở js/cloud_config.js; bảng ở supabase/migrations/20261119_connectlife_save.sql. Không gọi thư viện ngoài. */
var G = window.G || (window.G = {});

(function () {
  var SK = 'cl-cloud';                        // phiên đăng nhập giữ trong máy
  var st = { busy: false, luc: '', err: '', again: false };

  function base() { return String(G.CLOUD_URL || '').replace(/\/+$/, ''); }
  G.cloudReady = function () { return !!(G.CLOUD_URL && G.CLOUD_KEY); };
  function getS() { try { return JSON.parse(localStorage.getItem(SK) || 'null'); } catch (e) { return null; } }
  function putS(s) { try { if (s) localStorage.setItem(SK, JSON.stringify(s)); else localStorage.removeItem(SK); } catch (e) { /* bỏ qua */ } }
  G.cloudUser = function () { var s = getS(); return s && s.user ? s.user : null; };
  G.cloudStatus = function () { return st; };

  function http(method, path, body, token, prefer, cb) {
    var x = new XMLHttpRequest();
    x.open(method, base() + path);
    x.setRequestHeader('apikey', G.CLOUD_KEY);
    // chỉ gửi Authorization khi đã đăng nhập: khoá mới (sb_publishable_…) không được đặt trong Authorization, khoá anon cũ thì không cần
    if (token) x.setRequestHeader('Authorization', 'Bearer ' + token);
    x.setRequestHeader('Content-Type', 'application/json');
    if (prefer) x.setRequestHeader('Prefer', prefer);
    x.timeout = 20000;
    x.onload = function () {
      var j = null; try { j = x.responseText ? JSON.parse(x.responseText) : null; } catch (e) { j = null; }
      var ok = x.status >= 200 && x.status < 300;
      cb(ok ? null : viErr(j, x.status), j, x.status);
    };
    x.onerror = function () { cb('Không kết nối được tới máy chủ (mất mạng?).', null, 0); };
    x.ontimeout = x.onerror;
    x.send(body ? JSON.stringify(body) : null);
  }
  function viErr(j, code) {
    var m = j && (j.error_description || j.msg || j.message || j.error) || '';
    if (/invalid login|invalid_grant|invalid credentials/i.test(m)) return 'Sai email hoặc mật khẩu.';
    if (/already registered|already exists/i.test(m)) return 'Email này đã có tài khoản, bấm Đăng nhập.';
    if (/password/i.test(m) && /6|short|weak/i.test(m)) return 'Mật khẩu cần ít nhất 6 ký tự.';
    if (/email.*not.*confirm/i.test(m)) return 'Email chưa xác nhận: mở thư Supabase gửi rồi đăng nhập lại.';
    if (/invalid.*email|email.*invalid/i.test(m)) return 'Email không hợp lệ.';
    return m ? 'Lỗi: ' + m : 'Lỗi máy chủ (' + code + ').';
  }
  function keep(j) {
    if (!j || !j.access_token || !j.user) return null;
    var s = { at: j.access_token, rt: j.refresh_token, exp: Date.now() + (j.expires_in || 3600) * 1000, user: { id: j.user.id, email: j.user.email } };
    putS(s);
    return s;
  }
  /* lấy mã truy cập còn hạn (tự gia hạn) */
  function token(cb) {
    var s = getS();
    if (!s) { cb('Chưa đăng nhập.'); return; }
    if (s.exp - 60000 > Date.now()) { cb(null, s); return; }
    http('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: s.rt }, null, null, function (err, j, code) {
      if (err) { if (code === 400 || code === 401 || code === 403) putS(null); cb(err); return; }
      cb(null, keep(j));
    });
  }
  function pull(s, cb) {
    http('GET', '/rest/v1/connectlife_save?select=data,luu_luc&user_id=eq.' + encodeURIComponent(s.user.id), null, s.at, null,
      function (err, j) { cb(err, j && j.length ? j[0] : null); });
  }
  /* đẩy lên; mây trả lại mốc lưu đang giữ (bị từ chối vì máy khác vừa lưu bản mới hơn thì mốc đó lớn hơn của máy này) */
  function push(s, cb) {
    http('POST', '/rest/v1/connectlife_save?on_conflict=user_id&select=luu_luc', { user_id: s.user.id, data: G.S, luu_luc: G.S.luuLuc || 0 }, s.at,
      'resolution=merge-duplicates,return=representation', function (err, j) { cb(err, j && j.length ? j[0].luu_luc : null); });
  }
  function take(row) {
    try { localStorage.setItem('thegioi-save-truocmay', JSON.stringify(G.S)); } catch (e) { /* bỏ qua */ }   // bản trong máy cất dự phòng
    G.applySave(row.data);
  }

  /* đồng bộ: bản nào lưu sau thì thắng. first = lần đầu sau khi đăng nhập: bản nào nhiều XP hơn thì thắng */
  G.cloudSync = function (cb, first) {
    if (!G.cloudReady() || !getS()) { if (cb) cb('off'); return; }
    if (st.busy) { st.again = true; if (cb) cb('busy'); return; }
    st.busy = true;
    token(function (err, s) {
      if (err) { done(err); return; }
      pull(s, function (err2, row) {
        if (err2) { done(err2); return; }
        var rd = row && row.data;
        if (rd && rd.v === 1) {
          var remoteWins = first ? ((rd.xp || 0) > (G.S.xp || 0) || !G.S.nhanVat) : (row.luu_luc || 0) > (G.S.luuLuc || 0);
          if (remoteWins) { take(row); done(null, 'pulled'); return; }
          if (!first && (row.luu_luc || 0) === (G.S.luuLuc || 0)) { done(null, 'same'); return; }
        }
        push(s, function (err3, kept) {
          if (err3 || !kept || kept <= (G.S.luuLuc || 0)) { done(err3, 'pushed'); return; }
          pull(s, function (err4, row2) {   // máy khác vừa lưu sau: lấy bản đó về
            if (!err4 && row2 && row2.data && row2.data.v === 1) { take(row2); done(null, 'pulled'); } else done(err4, 'pushed');
          });
        });
      });
    });
    function done(e, what) {
      st.busy = false; st.err = e || '';
      if (!e) st.luc = G.vnNow().slice(11, 16);
      if (cb) cb(e || null, what);
      if (what === 'pulled' && G.onCloudPulled) G.onCloudPulled();
      if (st.again) { st.again = false; setTimeout(function () { G.cloudSync(); }, 800); }
    }
  };

  G.cloudSignIn = function (email, pw, cb) {
    http('POST', '/auth/v1/token?grant_type=password', { email: email, password: pw }, null, null, function (err, j) {
      if (err) { cb(err); return; }
      if (!keep(j)) { cb('Đăng nhập chưa được, thử lại.'); return; }
      G.cloudSync(function (e, what) { cb(e && e !== 'busy' ? e : null, what); }, true);
    });
  };
  G.cloudSignUp = function (email, pw, cb) {
    http('POST', '/auth/v1/signup', { email: email, password: pw }, null, null, function (err, j) {
      if (err) { cb(err); return; }
      if (keep(j)) { G.cloudSync(function (e, what) { cb(e && e !== 'busy' ? e : null, what); }, true); return; }
      cb('Đã tạo tài khoản. Mở email xác nhận của Supabase rồi quay lại bấm Đăng nhập.');
    });
  };
  G.cloudSignOut = function () { putS(null); st.luc = ''; st.err = ''; };

  // sau mỗi lần lưu: chờ 5 giây yên rồi đẩy lên; ẩn app hoặc có mạng lại thì đẩy ngay
  var t = 0;
  G.cloudQueue = function () {
    if (!G.cloudReady() || !getS()) return;
    clearTimeout(t); t = setTimeout(function () { G.cloudSync(); }, 5000);
  };
  document.addEventListener('visibilitychange', function () { if (document.hidden && G.cloudReady() && getS()) { clearTimeout(t); G.cloudSync(); } });
  window.addEventListener('online', function () { G.cloudQueue(); });

  /* hộp đăng nhập / tạo tài khoản */
  G.openCloudLogin = function (after) {
    var em = G.el('input.cl-in', { type: 'email', placeholder: 'Email', autocomplete: 'email', value: '' });
    var pw = G.el('input.cl-in', { type: 'password', placeholder: 'Mật khẩu (ít nhất 6 ký tự)', autocomplete: 'current-password' });
    var msg = G.el('div.small.cl-msg');
    var wrap;
    function go(signup) {
      var e = (em.value || '').replace(/^\s+|\s+$/g, ''), p = pw.value || '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.textContent = 'Nhập email hợp lệ.'; return; }
      if (p.length < 6) { msg.textContent = 'Mật khẩu cần ít nhất 6 ký tự.'; return; }
      msg.textContent = '⏳ Đang kết nối…';
      (signup ? G.cloudSignUp : G.cloudSignIn)(e, p, function (err, what) {
        if (err) { msg.textContent = err; return; }
        if (wrap.parentNode) document.body.removeChild(wrap);
        G.toast(what === 'pulled' ? '☁️ Đã lấy tiến độ trên mây về máy này.' : '☁️ Đã bật lưu trên mây.');
        if (after) after(what);
      });
    }
    wrap = G.el('div.modal.cl-wrap', G.el('div.choose.story.cl-box',
      G.el('h2', '☁️ Lưu tiến độ trên mây'),
      G.el('p.small', 'Đăng nhập một lần, app tự lưu sau mỗi bài. Đổi sang iPad, iPhone khác chỉ cần đăng nhập là học tiếp, không cần sao lưu.'),
      em, pw, msg,
      G.el('div.row',
        G.el('button.btn', { onclick: function () { go(true); } }, 'Tạo tài khoản mới'),
        G.el('button.btn.seal', { onclick: function () { go(false); } }, 'Đăng nhập ›')),
      G.el('button.btn.ghost', { onclick: function () { document.body.removeChild(wrap); } }, 'Để sau')));
    document.body.appendChild(wrap);
  };
})();
