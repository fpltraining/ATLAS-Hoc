/* Lưu tiến độ lên mây (Supabase): đăng nhập email + mật khẩu một lần, sau đó app tự đồng bộ.
   - Mỗi lần lưu: chờ 5 giây yên rồi đẩy lên mây; thoát app / mất mạng có lại thì đẩy ngay.
   - Máy khác lưu bản mới thì gộp từng phần (G.mergeSave), bản trong máy cất lại làm dự phòng; máy khác chưa lưu gì thì chỉ đẩy lên.
     Đang ngoài phố hay trong bài thì chờ về Sảnh mới gộp và nạp lại app, không cắt ngang.
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

  /* mốc lưu của bản trên mây mà máy này đã có (đã đẩy lên hoặc đã gộp vào). Trên mây vẫn đúng mốc đó nghĩa là máy khác
     chưa lưu gì: chỉ việc đẩy bản trong máy lên, không gộp (gộp với bản cũ của chính máy này làm sống lại thứ đã xoá). */
  var LK = 'cl-cloud-luc';
  function lastLuc(s) { try { var o = JSON.parse(localStorage.getItem(LK) || 'null'); return o && s && s.user && o.u === s.user.id ? o.l : -1; } catch (e) { return -1; } }
  function setLast(s, l) { try { if (s && s.user && typeof l === 'number') localStorage.setItem(LK, JSON.stringify({ u: s.user.id, l: l })); } catch (e) { /* bỏ qua */ } }
  /* người học không dở việc gì (đang ở Sảnh, không mở bảng hay hộp thoại): lúc này mới được gộp bản của máy khác và nạp lại app.
     Ngoài phố, trong bài học, bài đầu vào, màn chọn nhân vật thì chờ (về Sảnh mới gộp: G.goLobby). */
  G.cloudCalm = function () {
    if (!document.querySelector) return true;
    function shown(id) {
      var e = document.getElementById(id); if (!e) return false;
      try { return window.getComputedStyle(e).display !== 'none'; } catch (x) { return e.style.display !== 'none'; }
    }
    var pn = document.getElementById('panel');
    return !((pn && pn.classList.contains('open')) || document.querySelector('.modal, .cgate') || shown('play') || shown('placement') || shown('create'));
  };

  /* đồng bộ: gộp từng phần bản trong máy và bản trên mây (G.mergeSave, save.js), không mất tiến độ của máy nào.
     Chỉ gộp khi máy khác đã lưu bản mới; chỉ báo "đã lấy tiến độ" (và nạp lại app) khi bản đó thật sự mang thêm tiến độ về.
     first = lần đầu đăng nhập ở máy này: danh tính, cài đặt theo tài khoản (bản đã có nhân vật) */
  G.cloudSync = function (cb, first) {
    if (!G.cloudReady() || !getS()) { if (cb) cb('off'); return; }
    if (st.busy) { st.again = true; if (cb) cb('busy'); return; }
    st.busy = true;
    var gotNew = false;
    token(function (err, s) {
      if (err) { done(err); return; }
      pull(s, function (err2, row) {
        if (err2) { done(err2); return; }
        var rd = row && row.data, rl = row ? (row.luu_luc || 0) : 0;
        if (rd && rd.v === 1 && !first && rl === (G.S.luuLuc || 0)) { setLast(s, rl); done(null, 'same'); return; }
        if (rd && rd.v === 1 && (first || rl !== lastLuc(s))) {
          // máy khác đã lưu bản mới (hoặc lần đầu đăng nhập ở máy này): gộp từng phần, không bản nào ghi đè bản nào
          if (!first && !G.cloudCalm()) { G._cloudWait = true; done(null, 'wait'); return; }
          if (merge(rd, first)) gotNew = true;
          setLast(s, rl);
        }
        send(s);
      });
    });
    // gộp bản trên mây vào máy này; trả về true nếu bản đó mang thêm tiến độ (so với gộp bản trong máy với chính nó)
    function merge(data, fst) {
      var mg = G.mergeSave(G.S, data, fst), more = !G.sameProgress(mg, G.mergeSave(G.S, G.S, fst));
      take({ data: mg });
      return more;
    }
    function send(s) {
      push(s, function (err3, kept) {
        if (!err3 && kept === (G.S.luuLuc || 0)) setLast(s, kept);
        if (err3 || !kept || kept <= (G.S.luuLuc || 0)) { done(err3, gotNew ? 'pulled' : 'pushed'); return; }
        // máy khác vừa lưu sau lúc máy này lấy về: lấy bản đó gộp thêm rồi đẩy lại
        pull(s, function (err4, row2) {
          if (err4 || !row2 || !row2.data || row2.data.v !== 1) { done(err4, gotNew ? 'pulled' : 'pushed'); return; }
          if (!G.cloudCalm()) { G._cloudWait = true; done(null, gotNew ? 'pulled' : 'wait'); return; }
          if (merge(row2.data)) gotNew = true;
          setLast(s, row2.luu_luc || 0);
          push(s, function (err5, k5) { if (!err5 && k5 === (G.S.luuLuc || 0)) setLast(s, k5); done(err5, gotNew ? 'pulled' : 'pushed'); });
        });
      });
    }
    function done(e, what) {
      st.busy = false; st.err = e || '';
      if (!e) st.luc = G.vnNow().slice(11, 16);
      if (cb) cb(e || null, what);
      if (what === 'pulled' && G.onCloudPulled) G.onCloudPulled(!!first);
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

  /* Đăng nhập bằng Google (bật ở cloud_config.js khi đã cấu hình Google trong Supabase):
     chuyển sang trang Google, xong quay về app kèm mã đăng nhập trong #… của địa chỉ */
  function appUrl() { return location.origin + location.pathname; }
  G.cloudGoogle = function () {
    try { sessionStorage.setItem('cl-google', '1'); } catch (e) { /* bỏ qua */ }
    location.href = base() + '/auth/v1/authorize?provider=google&redirect_to=' + encodeURIComponent(appUrl());
  };
  /* Supabase đã bật đăng nhập Google chưa (GET /auth/v1/settings), nhớ kết quả trong máy để lần sau hiện ngay */
  function googleOn() { if (G.CLOUD_GOOGLE === false) return false; try { return localStorage.getItem('cl-google-on') === '1'; } catch (e) { return false; } }
  function googleBox() {
    var box = G.el('div.cl-gbox');
    function draw() {
      box.innerHTML = '';
      if (!googleOn()) return;
      box.appendChild(G.el('button.btn.cl-google', { onclick: G.cloudGoogle }, G.el('b', 'G'), ' Tiếp tục với Google'));
      box.appendChild(G.el('div.cl-or', 'hoặc dùng email'));
    }
    draw();
    if (G.CLOUD_GOOGLE !== false) http('GET', '/auth/v1/settings', null, null, null, function (err, j) {
      if (err || !j || !j.external) return;
      try { localStorage.setItem('cl-google-on', j.external.google ? '1' : '0'); } catch (e) { /* bỏ qua */ }
      draw();
    });
    return box;
  }
  /* mở app sau khi Google trả về: cất phiên đăng nhập, đồng bộ lần đầu. Trả về true nếu đang xử lý (cb gọi sau) */
  G.cloudCatchRedirect = function (cb) {
    var h = location.hash || '', qs = location.search || '';
    // Supabase báo lỗi ở phần ?… của địa chỉ (vd. bad_oauth_state: phiên đăng nhập Google hết hạn hoặc bị mở hai lần): báo rõ, dọn địa chỉ
    if (/[?&]error(_description|_code)?=/.test(qs)) {
      var em = (qs.match(/error_code=([^&]+)/) || [])[1] || '', ed = decodeURIComponent(((qs.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' '));
      try { history.replaceState(null, '', appUrl() + h); } catch (e) { /* bỏ qua */ }
      setTimeout(function () { cb(em === 'bad_oauth_state' ? 'Đăng nhập Google chưa xong (phiên đăng nhập đã hết hạn). Bấm Đăng nhập bằng Google lần nữa, làm liền một mạch trong cùng trình duyệt.' : 'Đăng nhập Google chưa được: ' + (ed || 'thử lại')); }, 0);
      return true;
    }
    if (!/access_token=|error_description=/.test(h)) return false;
    var q = {};
    h.replace(/^#/, '').split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) q[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, ' ')); });
    try { history.replaceState(null, '', appUrl() + location.search); } catch (e) { location.hash = ''; }
    if (!q.access_token) { setTimeout(function () { cb('Đăng nhập Google chưa được: ' + (q.error_description || 'thử lại')); }, 0); return true; }
    http('GET', '/auth/v1/user', null, q.access_token, null, function (err, u) {
      if (err || !u || !u.id) { cb(err || 'Đăng nhập Google chưa được, thử lại.'); return; }
      keep({ access_token: q.access_token, refresh_token: q.refresh_token, expires_in: +q.expires_in || 3600, user: u });
      G.cloudSync(function (e, what) { cb(e && e !== 'busy' ? e : null, what); }, true);
    });
    return true;
  };

  /* Màn tạo tài khoản bắt buộc khi mở app lần đầu (trước bài kiểm tra trình độ).
     Mất mạng thì cho học trước, lần mở app sau hỏi lại. */
  G.openCloudGate = function (after, o) {
    o = o || {};
    var root = G.el('div.cgate'), box = G.el('div.cgate-box');
    var em = G.el('input.cl-in', { type: 'email', placeholder: 'Email của bạn', autocomplete: 'email' });
    var pw = G.el('input.cl-in', { type: 'password', placeholder: 'Mật khẩu (ít nhất 6 ký tự)', autocomplete: 'new-password' });
    var msg = G.el('div.small.cl-msg'), later = G.el('div');
    function done(what) {
      if (what === 'pulled') { G.toast('☁️ Đã lấy tiến độ của bạn về máy này.'); setTimeout(function () { location.reload(); }, 900); return; }
      if (root.parentNode) root.parentNode.removeChild(root);
      G.toast('☁️ Đã đăng nhập. Lần sau mở app là vào thẳng.');
      after();
    }
    function go(signup) {
      var e = (em.value || '').replace(/^\s+|\s+$/g, ''), p = pw.value || '';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { msg.textContent = 'Nhập email hợp lệ.'; return; }
      if (p.length < 6) { msg.textContent = 'Mật khẩu cần ít nhất 6 ký tự.'; return; }
      msg.textContent = 'Đang kết nối…';
      (signup ? G.cloudSignUp : G.cloudSignIn)(e, p, function (err, what) {
        if (!err) { done(what); return; }
        msg.textContent = err;
        if (/kết nối/.test(err) && !later.firstChild) later.appendChild(G.el('button.btn.ghost', { onclick: function () {
          if (root.parentNode) root.parentNode.removeChild(root); G.toast('Đang không có mạng: học trước, lần mở app sau đăng nhập.'); after();
        } }, 'Không có mạng? Học trước, đăng nhập sau'));
      });
    }
    // học thử trước, tài khoản sau: hỏi sau buổi học đầu, có nút Để sau (o.soft)
    box.appendChild(G.el('div.kicker', o.soft ? 'Bạn vừa học xong buổi đầu' : 'Lưu tiến độ'));
    box.appendChild(G.el('h1', o.soft ? 'Lưu tiến độ của bạn' : 'Tạo tài khoản học'));
    box.appendChild(G.el('p', 'Tài khoản giữ toàn bộ tiến độ của bạn: đổi iPad, iPhone hay xoá app cũng không mất bài. Đăng nhập một lần, lần sau mở app là vào thẳng, tới khi bạn bấm Đăng xuất.'));
    box.appendChild(googleBox());
    box.appendChild(G.field('Email', em)); box.appendChild(G.field('Mật khẩu', pw)); box.appendChild(msg);
    box.appendChild(G.el('button.btn.seal.big1', { onclick: function () { go(true); } }, 'Tạo tài khoản ›'));
    box.appendChild(G.el('button.btn', { onclick: function () { go(false); } }, 'Đã có tài khoản? Đăng nhập'));
    if (o.soft) box.appendChild(G.el('button.btn.ghost', { onclick: function () {
      var cd = G.S.caiDat || (G.S.caiDat = {}); cd.hoiTK = (cd.hoiTK || 0) + 1; cd.hoiTKluc = G.vnDay(); G.save();
      if (root.parentNode) root.parentNode.removeChild(root); after();
    } }, 'Để sau, học tiếp'));
    box.appendChild(later);
    root.appendChild(box);
    document.body.appendChild(root);
  };

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
      msg.textContent = 'Đang kết nối…';
      (signup ? G.cloudSignUp : G.cloudSignIn)(e, p, function (err, what) {
        if (err) { msg.textContent = err; return; }
        if (wrap.parentNode) document.body.removeChild(wrap);
        G.toast(what === 'pulled' ? 'Đã lấy tiến độ trên mây về máy này.' : 'Đã bật lưu trên mây.');
        if (G.track) G.track('tai_khoan', { moi: signup ? 1 : 0, lay: what === 'pulled' ? 1 : 0 });
        if (after) after(what);
      });
    }
    wrap = G.el('div.modal.cl-wrap', G.el('div.choose.story.cl-box',
      G.el('h2', G.ic3('cloud', 'ic3-s'), ' Lưu tiến độ trên mây'),
      G.el('p.small', 'Đăng nhập một lần, app tự lưu sau mỗi bài. Đổi sang iPad, iPhone khác chỉ cần đăng nhập là học tiếp, không cần sao lưu.'),
      googleBox(),
      G.field('Email', em), G.field('Mật khẩu', pw), msg,
      G.el('div.row',
        G.el('button.btn', { onclick: function () { go(true); } }, 'Tạo tài khoản mới'),
        G.el('button.btn.seal', { onclick: function () { go(false); } }, 'Đăng nhập ›')),
      G.el('button.btn.ghost', { onclick: function () { document.body.removeChild(wrap); } }, 'Để sau')));
    document.body.appendChild(wrap);
  };
})();
