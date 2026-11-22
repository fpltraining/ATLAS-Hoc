/* Khởi động: nạp tiến độ, Ngôi nhà chung, vào thành phố, lời Kai, nút hành động, pháo giấy, hỏi xác nhận. */
var G = window.G || (window.G = {});

(function () {
  G.S = G.load();

  /* vòng tiến độ góc phải: số phòng A1 đã qua (kể cả phòng thi), XP */
  var hudLast = -1;
  G.updateHud = function () {
    var p = G.dayProgress(), n = p.pct, el = document.getElementById('hud-xp');
    el.innerHTML = '';
    el.style.setProperty('--p', p.pct);
    el.className = 'hud-xp ring' + (p.pct >= 100 ? ' full' : '');
    el.appendChild(G.el('span.hr-ring', G.el('b', p.pct >= 100 ? '✓' : p.pct + '%')));
    el.appendChild(G.el('span.hr-txt', G.el('b', 'Hôm nay ' + p.done + '/' + p.all), G.el('small', p.mins + '/' + p.goal + '′ · ' + G.S.xp + ' XP')));
    if (hudLast >= 0 && n > hudLast) { el.classList.add('bump'); setTimeout(function () { el.classList.remove('bump'); }, 800); }
    hudLast = n;
  };

  G.goCity = function (id) {
    document.getElementById('lobby').style.display = 'none';
    document.getElementById('play').style.display = 'block';
    G.updateHud();
    // vị trí đã lưu thuộc thành phố này thì đi tiếp từ đó, không thì vào cổng chính của thành phố
    var v = G.S.viTri, sv = v && G.SCENES[v.canh];
    id = 'en';   // chỉ còn tiếng Anh: vị trí cũ ở Trường Lạc trấn thì về nhà ở Brightford
    if (sv && sv.city === id && sv.kind !== 'classroom') G.enterScene(v.canh, { x: v.x, y: v.y, dir: 'down' });
    else G.enterScene('home_en');
    var sc = G.S.viTri.canh;
    G.kaiSay(sc === 'home_en' ? 'Chào ' + G.playerName() + '! Đi học thôi: đi bộ theo đường mòn bên phải, qua cầu ở Bờ sông sang Trung tâm rồi xuống trường. Muốn nhanh thì gọi xe đưa đón ở góc dưới.'
      : sc === 'city_en' ? 'Trường Anh ngữ ở Khuôn viên phía dưới: đi theo đường giữa xuống là tới. Về nhà: đi bộ sang trái qua cầu, hoặc đi xe buýt, xe đưa đón.'
      : sc === 'city_zh' ? '欢迎！Chào mừng tới Trường Lạc trấn. Học viện Hán ngữ ở góc dưới bên trái, sân bay ở phía trên.' : 'Tiếp tục học nào!');
  };

  /* Bài kiểm tra trình độ là bước bắt buộc đầu tiên: chưa có kết quả thì chưa vào học được (kể cả người đang học dở) */
  function mustTest(after) {
    if (G.S.dauVao || G._placementOpen) { if (after) after(); return; }
    G.openPlacement(after, { mandatory: true });
  }

  G.goLobby = function () {
    G.stopEngine();
    document.getElementById('create').style.display = 'none';
    G.closeLesson();
    document.getElementById('play').style.display = 'none';
    var lob = document.getElementById('lobby');
    lob.style.display = 'block';
    G.renderLobby();
    window.scrollTo(0, 0);
    // về Sảnh: trang rõ dần từ nhoè, các phần đầu trang hiện lần lượt
    G.viewIn(lob);
    var hero = lob.querySelector('.lhero');
    if (hero && !G._heroIn && window.anime && !G.calm()) {
      G._heroIn = true;   // chỉ một lần mỗi lần mở app
      window.anime({ targets: hero.querySelector('.hero-img'), scale: [1.05, 1], duration: 1100, easing: 'easeOutCubic' });
      G.enter(hero.querySelectorAll('.hero-text > *'), { gap: 70, start: 120, y: 12, dur: 520 });
      G.enter([].slice.call(lob.children, 1, 8), { gap: 60, start: 450 });
    } else G.enter([].slice.call(lob.children, 0, 8), { gap: 60, start: 80 });
  };

  /* Kai nói một câu ngắn ở góc màn hình */
  var kaiTimer = 0;
  G.kaiSay = function (text) {
    var k = document.getElementById('kai');
    document.getElementById('kai-text').textContent = text;
    k.className = 'kai show';
    clearTimeout(kaiTimer);
    kaiTimer = setTimeout(function () { k.className = 'kai'; }, 5200);
  };

  /* Nút hành động khi đứng gần cửa / NPC */
  G.showAction = function (t) {
    var b = document.getElementById('act');
    if (!t) { b.className = 'act'; return; }
    b.textContent = t.label + ' ›';
    b.className = 'act show';
  };

  G.confirm = function (msg, yes) {
    var wrap = G.el('div.modal', G.el('div.choose',
      G.el('p', msg),
      G.el('div.row', G.el('button.btn', { onclick: function () { document.body.removeChild(wrap); } }, 'Huỷ'),
        G.el('button.btn.seal', { onclick: function () { document.body.removeChild(wrap); yes(); } }, 'Đồng ý'))
    ));
    document.body.appendChild(wrap);
  };

  /* nạp thêm một tệp script khi cần (chạy cả offline: service worker giữ sẵn tệp trong CORE) */
  var loading = {};
  G.loadScript = function (src, cb) {
    if (loading[src] === true) { cb(); return; }
    if (loading[src]) { loading[src].push(cb); return; }
    loading[src] = [cb];
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { var q = loading[src]; loading[src] = true; for (var i = 0; i < q.length; i++) q[i](); };
    s.onerror = function () { delete loading[src]; };
    document.head.appendChild(s);
  };
  /* pháo giấy: hoạt ảnh Lottie làm sẵn (anim/confetti.json, xem anim/CREDITS.md), phát bằng lottie-web (vendor/lottie_light.min.js).
     Không vẽ bằng code. Nạp thư viện và tệp lần đầu khi cần, rồi giữ lại. */
  var confTxt = null, confWait = null;
  function confData(cb) {
    if (confTxt) { cb(confTxt); return; }
    if (confWait) { confWait.push(cb); return; }
    confWait = [cb];
    fetch('anim/confetti.json').then(function (r) { return r.text(); }).then(function (t) {
      confTxt = t; var q = confWait; confWait = null; for (var i = 0; i < q.length; i++) q[i](t);
    }).catch(function () { confWait = null; });
  }
  G.confetti = function () {
    if (G.calm()) return;
    G.loadScript('vendor/lottie_light.min.js', function () {
      confData(function (t) {
        if (!window.lottie) return;
        var box = G.el('div.confetti'); document.body.appendChild(box);
        var a = window.lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: true, animationData: JSON.parse(t),
          rendererSettings: { preserveAspectRatio: 'xMidYMid slice' } });
        var gone = false;
        function end() { if (gone) return; gone = true; a.destroy(); if (box.parentNode) box.parentNode.removeChild(box); }
        a.addEventListener('complete', end); setTimeout(end, 6500);
      });
    });
  };
  // nạp sẵn sau khi mở app vài giây để lần ăn mừng đầu tiên hiện ngay
  setTimeout(function () { if (!G.calm()) G.loadScript('vendor/lottie_light.min.js', function () { confData(function () {}); }); }, 6000);

  /* màn chờ: hiện ít nhất 1,1 giây kể từ lúc mở app rồi mờ dần */
  function hideSplash() {
    var sp = document.getElementById('splash'); if (!sp) return;
    var t0 = (window.performance && performance.now) ? performance.now() : 0, wait = Math.max(0, 1100 - t0);
    setTimeout(function () { sp.className = 'splash out'; setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 600); }, wait);
  }

  function start() {
    hideSplash();
    G.engineInit();
    G.lessonInit();
    document.getElementById('hud-home').onclick = G.goLobby;
    document.getElementById('act').onclick = G.doNear;
    document.getElementById('hud-xp').onclick = G.openToday;
    document.getElementById('quest').onclick = function () { G.goQuest(); };
    G.initRank(); G.importOldProgress(); setTimeout(G.checkAchievements, 1500);
    // bản sao IndexedDB mới hơn (localStorage bị mất) thì khôi phục rồi vẽ lại sảnh
    G.restoreCheck(function (restored) { if (restored && G.S.nhanVat) { G.initRank(); var cr = document.getElementById('create'); if (cr) cr.style.display = 'none'; G.renderLobby(); mustTest(); } });
    // lưu trên mây: mở app thì đồng bộ; nhận bản mới hơn từ máy khác thì tải lại app với tiến độ đó
    G.onCloudPulled = function () { G.toast('☁️ Đã lấy tiến độ mới nhất trên mây.'); setTimeout(function () { location.reload(); }, 1300); };
    if (G.cloudReady && G.cloudReady() && G.cloudUser() && !/access_token=/.test(location.hash)) setTimeout(function () { G.cloudSync(); }, 600);
    // vừa đăng nhập Google quay về: cất phiên, lấy tiến độ trên mây (có thì tải lại app), rồi vào như bình thường
    if (!(G.cloudCatchRedirect && G.cloudCatchRedirect(function (err, what) { if (what === 'pulled') { location.reload(); return; } if (err) G.toast(err); begin(); }))) begin();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  /* chưa đăng nhập thì tạo tài khoản trước (bắt buộc), rồi mới kiểm tra trình độ / vào học */
  function begin() {
    if (G.cloudReady && G.cloudReady() && !G.cloudUser()) { G.openCloudGate(flow); return; }
    flow();
  }
  function flow() {
    if (!G.S.nhanVat && !G.S.dauVao) {
      // lần đầu: kiểm tra trình độ (bắt buộc) → chọn nhân vật → lời mở đầu → ra khỏi nhà
      G.openPlacement(function () { G.openCreator(function () { G.introStory(function () { G.goCity('en'); }); }); }, { first: true });
    } else if (!G.S.nhanVat) {
      // đã làm bài kiểm tra nhưng thoát trước khi chọn nhân vật
      G.openCreator(function () { G.introStory(function () { G.goCity('en'); }); });
    } else {
      // người đang học: chưa có kết quả đầu vào thì phải làm trước khi vào sảnh
      G.renderLobby();
      mustTest(function () { G.renderLobby(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
