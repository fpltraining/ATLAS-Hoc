/* Khởi động: nạp tiến độ, Ngôi nhà chung, vào thành phố, lời Kai, nút hành động, pháo giấy, hỏi xác nhận. */
var G = window.G || (window.G = {});

(function () {
  G.S = G.load();

  /* vòng tiến độ góc phải: số phòng A1 đã qua (kể cả phòng thi), XP */
  /* thẻ Nhiệm vụ hôm nay góc phải ngoài phố (to, dễ thấy): rương + số việc còn lại, 5 ô nhiệm vụ sáng dần, thanh tiến độ,
     dòng "Tiếp: …" mời bấm. Bấm mở bảng Hôm nay với nút Làm ngay. Bản đồ nhỏ tự xếp ngay dưới thẻ (placeRadar). */
  var hudLast = -1;
  function placeRadar() {
    var el = document.getElementById('hud-xp'), rd = document.getElementById('radar'); if (!el || !rd || !el.offsetHeight) return;
    var top = el.getBoundingClientRect().bottom - (rd.offsetParent ? rd.offsetParent.getBoundingClientRect().top : 0) + 8;
    rd.style.top = Math.round(top) + 'px';
  }
  addEventListener('resize', function () { setTimeout(placeRadar, 50); });
  G.updateHud = function () {
    var p = G.dayProgress(), n = p.done * 1000 + p.mins, el = document.getElementById('hud-xp'), d = G.today();
    var all = p.done >= p.all, claim = all && !d.ruong, nextQ = null, Q = G.QUESTS || [];
    for (var i = 0; i < Q.length; i++) if (!d.viec[Q[i].id]) { nextQ = Q[i]; break; }
    el.innerHTML = '';
    el.className = 'hud-xp hud-q' + (all ? (claim ? ' claim' : ' full') : '');
    el.setAttribute('role', 'button'); el.setAttribute('aria-label', 'Nhiệm vụ hôm nay: xong ' + p.done + ' trên ' + p.all + '. Bấm để xem và làm.');
    var bar = G.el('i'); bar.style.transform = 'scaleX(' + (p.done / p.all) + ')';
    el.appendChild(G.el('span.hq-chest', G.ic3(all && !claim ? 'trophy' : 'gift'), !all ? G.el('b.hq-n', String(p.all - p.done)) : null));
    el.appendChild(G.el('span.hq-head', G.el('b.hq-t', 'Nhiệm vụ hôm nay')));
    el.appendChild(G.el('span.hq-icons', G.questIcons ? G.questIcons() : null));
    el.appendChild(G.el('span.hq-barw', G.el('span.hq-bar', bar), G.el('small.hq-m', G.el('b.hq-c', p.done + '/' + p.all), ' · ' + p.mins + '/' + p.goal + ' phút')));
    el.appendChild(G.el('span.hq-next', claim ? 'Mở rương +30 XP ›' : all ? 'Xong hết hôm nay · ' + G.S.xp + ' XP' : 'Tiếp: ' + (nextQ ? nextQ.name : '') + ' ›'));
    if (hudLast >= 0 && n > hudLast) { el.classList.add('bump'); setTimeout(function () { el.classList.remove('bump'); }, 800); }
    hudLast = n;
    placeRadar(); setTimeout(placeRadar, 60);
  };

  G.goCity = function (id) {
    document.documentElement.classList.add('in-city');   // điện thoại cầm dọc: chỉ ngoài phố mới nhắc xoay ngang
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

  /* thư viện 3D (three.js ~600 KB) và js/world3d.js chỉ nạp khi vào thành phố (taste-skill perf: mở app nhẹ hơn);
     nạp sẵn ở nền vài giây sau khi mở app để lúc bấm "Vào Brightford" không phải chờ. SW giữ sẵn hai tệp này để chạy offline. */
  var goCity0 = G.goCity, load3dQ = null;
  function need3d(cb) {
    if (window.THREE && G.W3D) { cb(); return; }
    if (load3dQ) { load3dQ.push(cb); return; }
    load3dQ = [cb];
    var done = function () { var q = load3dQ; load3dQ = null; for (var i = 0; i < q.length; i++) q[i](); };
    G.loadScript('vendor/three.min.js', function () { G.loadScript('js/world3d.js', done); });
    setTimeout(function () { if (load3dQ) done(); }, 15000);   // mạng hỏng: vẫn vào được thành phố (vẽ 2D)
  }
  G.need3d = need3d;
  G.goCity = function (id) {
    if (window.THREE && G.W3D) { goCity0(id); return; }
    G.toast('Đang mở Brightford…', 1500);
    need3d(function () { goCity0(id); });
  };
  setTimeout(function () { need3d(function () {}); }, 3500);

  /* Bài kiểm tra trình độ là bước bắt buộc đầu tiên: chưa có kết quả thì chưa vào học được (kể cả người đang học dở) */
  function mustTest(after) {
    if (G.S.dauVao || G._placementOpen) { if (after) after(); return; }
    G.openPlacement(after, { mandatory: true, quick: true });
  }
  // người mới: mở thẳng buổi học đầu (học ngay, không phải đi bộ tới trường lần đầu)
  function firstLesson() {
    setTimeout(function () { var nl = G.nextLesson && G.nextLesson(); if (nl && G.openLesson && !G.S.phong[nl.id]) { G.openLesson(nl.id); G.toast('📖 Buổi học đầu tiên của bạn. Học xong rồi ra phố đi dạo nhé.'); } }, 1400);
  }

  G.goLobby = function () {
    document.documentElement.classList.remove('in-city');
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

  // hình tĩnh trong index.html (nút nhà, ghim nhiệm vụ, mặt Kai) lấy qua mã phiên bản như mọi hình khác
  function fillAssets() { var im = document.querySelectorAll('img[data-asset]'); for (var i = 0; i < im.length; i++) if (!im[i].src) im[i].src = G.assetUrl(im[i].getAttribute('data-asset')); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fillAssets); else fillAssets();

  /* Kai nói một câu ngắn ở góc màn hình */
  var kaiTimer = 0;
  // taste-skill: lời Kai gọn một dòng để không che cảnh; chạm để đọc hết (giữ lâu hơn), chạm lần nữa để đóng
  G.kaiSay = function (text) {
    var k = document.getElementById('kai');
    document.getElementById('kai-text').textContent = String(text).replace(/^(?:[☀-➿]|[\ud83c-\ud83e][\udc00-\udfff])[️‍]*\s*/, '');
    k.className = 'kai show';
    clearTimeout(kaiTimer);
    kaiTimer = setTimeout(function () { k.className = 'kai'; }, 6500);
    if (!k._tap) { k._tap = true; k.addEventListener('click', function () {
      if (k.className.indexOf('open') >= 0) { k.className = 'kai'; clearTimeout(kaiTimer); return; }
      k.className = 'kai show open'; clearTimeout(kaiTimer); kaiTimer = setTimeout(function () { k.className = 'kai'; }, 12000);
    }); }
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
  /* hoạt ảnh emoji Noto của Google (Lottie, CC BY 4.0, anim/noto_*.json): lửa chuỗi học, rương, cúp, pháo hoa.
     Trả về một khung hiện icon 3D tĩnh trước, tải xong thì phát hoạt ảnh. Máy bật Giảm chuyển động: giữ icon tĩnh.
     Khung bị gỡ khỏi màn (đóng bảng) thì tự huỷ hoạt ảnh. */
  var NOTO = {}, NOTO_IC = { gift: 'gift', fire: 'fire', trophy: 'trophy', party: 'star' };
  G.lottieIc = function (name, cls, o) {
    o = o || {};
    var box = G.el('span.lot' + (cls ? '.' + cls : ''), G.ic3(NOTO_IC[name] || 'star'));
    if (G.calm()) return box;
    function play(t) {
      if (!window.lottie) return;
      var a = null, tries = 0;
      (function wait() {   // chờ khung được gắn vào màn rồi mới phát
        if (!document.body.contains(box)) { if (++tries < 40) setTimeout(wait, 100); return; }
        box.innerHTML = '';
        a = window.lottie.loadAnimation({ container: box, renderer: 'svg', loop: !!o.loop, autoplay: true, animationData: JSON.parse(t) });
        if (o.loop) { var chk = setInterval(function () { if (!document.body.contains(box)) { clearInterval(chk); a.destroy(); } }, 1500); }
      })();
    }
    G.loadScript('vendor/lottie_light.min.js', function () {
      if (NOTO[name]) { play(NOTO[name]); return; }
      fetch('anim/noto_' + name + '.json').then(function (r) { return r.text(); }).then(function (t) { NOTO[name] = t; play(t); }).catch(function () {});
    });
    return box;
  };
  /* mở rương: hộp quà Noto nhún rồi bật, pháo giấy, +XP; chạm để đóng */
  G.chestPop = function (xp) {
    var ov = G.el('div.chest-pop', { onclick: function () { close(); } },
      G.el('div.chest-card', G.lottieIc('gift', 'chest-anim'), G.el('b', '+' + xp + ' XP'), G.el('span', 'Rương hôm nay: xong cả 5 nhiệm vụ')));
    function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
    document.body.appendChild(ov);
    if (G.pop) G.pop(ov.firstChild, 0);
    setTimeout(close, 3200);
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
    // tiếng chạm nhẹ khi bấm nút, tiếng gạt khi đổi tab (không áp cho đáp án, loa, micro: các nút đó có tiếng riêng)
    document.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('button, .hud-q') : null;
      if (!t || t.disabled || (t.closest && t.closest('.opt, .speak, .mk-mic, .pl-yn-w'))) return;
      if (/\b(opt|speak|mk-mic|pl-play|pl-mini)\b/.test(t.className)) return;
      G.sfx(t.parentNode && /\betabs\b/.test(t.parentNode.className) ? 'tab' : 'tap');
    }, true);
    document.getElementById('quest').onclick = function (e) {
      var nl = G.questNow && G.questNow() && e && e.target && e.target.closest && e.target.closest('.q-go') ? G.nextLesson() : null;
      if (nl) { G.openLesson(nl.id); return; }   // Học ngay: không cần đi bộ tới trường
      G.goQuest();
    };
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
  /* học thử trước, tài khoản sau (như các app học hàng đầu): mở app là vào học, không bắt tạo tài khoản.
     Tài khoản được mời sau khi xong buổi học đầu (G.askAccount, gọi từ G.markTask), có nút Để sau. */
  function begin() { flow(); }
  G.askAccount = function () {
    if (!(G.cloudReady && G.cloudReady()) || G.cloudUser() || !G.openCloudGate || document.querySelector('.cgate')) return;
    var cd = G.S.caiDat || {};
    if (cd.hoiTK >= 3 || cd.hoiTKluc === G.vnDay()) return;   // hỏi tối đa 3 lần, mỗi ngày một lần
    setTimeout(function () { G.openCloudGate(function () {}, { soft: true }); }, 1800);
  };
  function flow() {
    if (!G.S.nhanVat && !G.S.dauVao) {
      // lần đầu: kiểm tra nhanh 3 phút (Từ vựng) → chọn nhân vật → lời mở đầu → vào thành phố và mở ngay buổi học đầu
      G.openPlacement(function () { G.openCreator(function () { G.introStory(function () { G.goCity('en'); firstLesson(); }); }); }, { first: true, quick: true });
    } else if (!G.S.nhanVat) {
      // đã làm bài kiểm tra nhưng thoát trước khi chọn nhân vật
      G.openCreator(function () { G.introStory(function () { G.goCity('en'); firstLesson(); }); });
    } else {
      // người đang học: chưa có kết quả đầu vào thì phải làm trước khi vào sảnh
      G.renderLobby();
      mustTest(function () { G.renderLobby(); });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
