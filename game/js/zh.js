/* Thành phố Trung Hoa: Trường Lạc trấn 长乐镇 (anh Han chốt 24/11/2026: phố cổ sông nước + khu mới, bạn đồng hành
   rồng con Tiểu Long, tiến độ riêng hoàn toàn với tiếng Anh, học trước rồi bản đồ 3D sau khi có hình).
   Đợt A: lộ trình tiếng Trung, Học viện Hán ngữ mở thẳng từ Sảnh (chưa có hình bản đồ), bài tiếp theo, luyện nói
   theo câu đã học (nhiệm vụ Nói), tra pinyin từng chữ để chấm nói tiếng Trung (speak.js). Hồ sơ riêng: save.js (G.setLang). */
var G = window.G || (window.G = {});

(function () {
  /* ---------- lộ trình: mỗi tầng một mốc HSK (chuẩn HSK 3.0); tầng chưa có bài ghi Đang xây ---------- */
  G.ROADMAP_ZH = [
    { floor: 1, key: 'Nền tảng', name: 'Tầng 1 · Nền tảng', hsk: 'Pinyin · thanh điệu · nét chữ', out: 'Đọc đúng pinyin và 4 thanh, nghe phân biệt thanh, viết đúng nét và thứ tự nét, biết các bộ thủ hay gặp.' },
    { floor: 2, key: 'HSK 1–2', name: 'Tầng 2 · HSK 1–2', hsk: 'HSK 1–2', out: 'Chào hỏi, giới thiệu, số đếm, giờ giấc, mua đồ, gọi món, hỏi đường; đọc câu ngắn có pinyin; viết được các chữ đã học.' },
    { floor: 3, key: 'HSK 3–4', name: 'Tầng 3 · HSK 3–4', hsk: 'HSK 3–4', out: 'Kể chuyện đã qua, hẹn gặp, đi lại du lịch, khám bệnh, nói về công việc; đọc truyện ngắn không cần pinyin.', soon: true },
    { floor: 4, key: 'HSK 5–6', name: 'Tầng 4 · HSK 5–6', hsk: 'HSK 5–6', out: 'Nói tự nhiên vài phút, thảo luận có lý lẽ, đọc báo, nghe tin tức.', soon: true },
    { final: true, name: 'Tốt nghiệp ConnectLife tiếng Trung', hsk: 'Đầu ra giao tiếp', out: 'Nói chuyện 5 phút với người lạ về đời sống, tự xử lý tình huống không gợi ý, nghe hiểu hội thoại tốc độ thật.', soon: true }
  ];
  /* phòng của từng tầng theo thứ tự học (dữ liệu đợt sau đẩy thêm vào đây) */
  G.ZH_FLOORS = G.ZH_FLOORS || { 1: ['zh-py'], 2: ['zh-1-1', 'zh-1-2', 'zh-1-3', 'zh-1-4', 'zh-1-test'], 3: [], 4: [] };
  function allRooms() { var out = []; for (var f = 1; f <= 4; f++) out = out.concat((G.ZH_FLOORS[f] || []).filter(function (id) { return !!G.ROOMS[id]; })); return out; }
  G.zhFloorCount = function (f) { var ids = (G.ZH_FLOORS[f] || []).filter(function (id) { return !!G.ROOMS[id]; }), k = 0; ids.forEach(function (id) { if (G.roomPassed(id)) k++; }); return { k: k, all: ids.length }; };
  /* tầng đang học: tầng đầu tiên còn phòng chưa qua */
  G.zhFloorNow = function () {
    var last = 1;
    for (var f = 1; f <= 4; f++) { var c = G.zhFloorCount(f); if (!c.all) continue; last = f; if (c.k < c.all) return f; }
    return last;
  };
  /* phòng mở lần lượt: phòng đầu luôn mở, phòng sau cần qua phòng trước */
  G.zhRoomOpen = function (id) { var a = allRooms(), i = a.indexOf(id); return i <= 0 || G.roomPassed(a[i - 1]); };
  G.zhNextLesson = function () {
    var a = allRooms();
    for (var i = 0; i < a.length; i++) if (!G.roomPassed(a[i])) {
      var R = G.ROOMS[a[i]], t = G.NPCS && G.NPCS[R.teacher];
      return { id: R.id, floor: floorOf(R.id), label: R.title.split(' ·')[0], teacher: t ? t.name : '' };
    }
    return null;
  };
  function floorOf(id) { for (var f = 1; f <= 4; f++) if ((G.ZH_FLOORS[f] || []).indexOf(id) >= 0) return f; return 2; }

  /* ---------- pinyin từng chữ (data/hanviet.json: pinyin + âm Hán Việt, Unihan) ---------- */
  var HV = null, hvLoading = false;
  G.zhLoadDict = function (cb) {
    if (HV) { if (cb) cb(); return; }
    if (hvLoading) { if (cb) setTimeout(function () { G.zhLoadDict(cb); }, 300); return; }
    hvLoading = true;
    var x = new XMLHttpRequest();
    x.open('GET', '../data/hanviet.json');
    x.onload = function () { try { HV = JSON.parse(x.responseText); } catch (e) { HV = {}; } hvLoading = false; if (cb) cb(); };
    x.onerror = function () { hvLoading = false; if (cb) cb(); };
    x.send();
  };
  G.zhPyOf = function (ch) { var o = HV && HV[ch]; return o && o.py ? String(o.py).toLowerCase() : ch; };
  G.zhHvOf = function (ch) { var o = HV && HV[ch]; return o && o.hv ? o.hv : ''; };

  function panelOpen(title) {
    var panel = document.getElementById('panel');
    panel.className = 'panel open';
    G.setTitle(title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body');
    body.innerHTML = ''; body.className = 'panel-body';
    G.viewIn(body);
    return body;
  }

  /* ---------- Học viện Hán ngữ: danh sách phòng theo tầng (mở thẳng từ Sảnh khi Trường Lạc trấn chưa có bản đồ) ---------- */
  G.openZhHall = function () {
    G.zhLoadDict();
    var body = panelOpen('Học viện Hán ngữ 汉语学院'), cur = G.zhFloorNow(), nl = G.zhNextLesson();
    var t = G.NPCS && G.NPCS.wang;
    body.appendChild(G.el('div.zh-hall-top', t ? G.imgEl(t.img, 'zh-hall-t') : null,
      G.el('div', G.el('b', '你好！欢迎来到汉语学院。'), G.el('div.py', 'Nǐ hǎo! Huānyíng lái dào Hànyǔ xuéyuàn.'),
        G.el('div.small.faint', 'Chào mừng tới Học viện Hán ngữ. Phòng mở lần lượt: qua phòng trước (đúng từ 8/10) là mở phòng sau.'))));
    if (nl) body.appendChild(G.el('button.big.bic.seal.zh-next', { onclick: function () { G.openLesson(nl.id); } }, G.bigIc('school', 'Học tiếp: ' + nl.label), G.el('span', (nl.teacher ? 'Với ' + nl.teacher + ' · ' : '') + 'Học, Luyện rồi Kiểm tra')));
    G.ROADMAP_ZH.forEach(function (st) {
      if (st.final) return;
      var ids = (G.ZH_FLOORS[st.floor] || []).filter(function (id) { return !!G.ROOMS[id]; }), c = G.zhFloorCount(st.floor);
      body.appendChild(G.el('h2.sec', st.name + (ids.length ? ' · ' + c.k + '/' + c.all : '')));
      if (!ids.length) { body.appendChild(G.el('p.small.faint', 'Đang xây · ' + st.out)); return; }
      body.appendChild(G.el('div.zh-rooms', ids.map(function (id) {
        var R = G.ROOMS[id], p = G.S.phong[id], ok = G.roomPassed(id), open = G.zhRoomOpen(id);
        var sub = ok ? 'Đã qua · ' + (p ? p.diem + '/' + (R.passN ? 20 : 10) : '') : open ? (p ? 'Chưa đạt, học lại nhé · ' + p.diem + '/10' : 'Đã mở · bấm để vào học') : 'Qua phòng trước để mở';
        return G.el('button.big.bic.zh-room' + (ok ? '.ok' : '') + (open ? '' : '.lock'), { onclick: function () { if (!open) { G.toast('Qua phòng trước để mở phòng này nhé.'); return; } G.openLesson(id); } },
          G.bigIc(ok ? 'star' : open ? 'school' : 'lock', R.title), G.el('span', sub));
      })));
    });
    G.enter(body.querySelectorAll('.zh-room'), { gap: 40, y: 8, dur: 300 });
  };

  /* ---------- nhiệm vụ Nói (tiếng Trung, chưa có bản đồ để nói chuyện ngoài phố): nói theo 5 câu đã học ---------- */
  function learnedLines() {
    var out = [], seen = {};
    allRooms().forEach(function (id) {
      if (!(G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id]))) return;
      (G.ROOMS[id].items || []).forEach(function (it) { if (it.ex && !seen[it.ex]) { seen[it.ex] = 1; out.push({ text: it.ex, py: it.exPy, vi: it.exVi }); } });
    });
    return out;
  }
  G.openSpeakZh = function () {
    G.zhLoadDict();
    var list = learnedLines();
    if (!list.length) {
      var nl = G.zhNextLesson();
      G.toast('Học xong một phòng ở Học viện trước, câu đã học sẽ vào đây để luyện nói.');
      if (nl) G.openLesson(nl.id);
      return;
    }
    list = G.shuffle(list).slice(0, 5);
    var k = 0, sum = 0, n = 0;
    (function one() {
      var body = panelOpen('Luyện nói · ' + Math.min(k + 1, list.length) + '/' + list.length);
      if (k >= list.length) {
        var avg = n ? Math.round(sum / n) : 0;
        G.markStudy(); G.markTask('noi'); G.addXp(10); if (G.logSpeak && n) G.logSpeak(avg);
        body.appendChild(G.el('div.result' + (avg >= G.PASS_SCORE || !n ? '.pass' : ''), G.el('b', n ? 'Điểm nói: ' + avg + '/100' : 'Đã nghe và nhại ' + list.length + ' câu'),
          G.el('div', '+10 XP · nhiệm vụ Nói hôm nay đã xong.'),
          G.el('div.small.faint', 'Câu nói sai thanh: máy nghe ra chữ khác nên bị trừ điểm. Bấm nút con rùa để nghe chậm rồi nói lại.')));
        body.appendChild(G.el('div.row', G.el('span'), G.el('button.btn.seal', { onclick: G.closeLesson }, 'Xong ›')));
        return;
      }
      var it = list[k];
      body.appendChild(G.el('p.small.faint', 'Nghe câu mẫu, nói to theo. Có micro thì máy chấm theo từng chữ và thanh điệu.'));
      body.appendChild(G.speakCard({ text: it.text, py: it.py, vi: it.vi, lang: 'zh', onDone: function (sc) {
        if (typeof sc === 'number') { sum += sc; n++; }
        k++; one();
      } }));
      if (G.shadowBtn) body.appendChild(G.shadowBtn(it.text));
      G.say(it.text, 'zh');
    })();
  };

  /* ---------- Sảnh tiếng Trung: việc nên làm ngay (một nút cam) ---------- */
  G.zhStartHere = function () {
    var d = G.today(), p = G.dayProgress(), Q = G.QUESTS || [], order = ['bai', 'viet', 'noi', 'on', 'doc'];
    if (!G.roomPassed('zh-py') && !(G.S.phong['zh-py'])) return { ic: 'speak', t: 'Làm quen tiếng Trung: pinyin và 4 thanh', s: 'Với cô Vương · khoảng 15 phút · nghe, nói theo, phân biệt thanh điệu', go: function () { G.openLesson('zh-py'); }, b: 'Bắt đầu' };
    for (var i = 0; i < order.length; i++) {
      if (d.viec[order[i]]) continue;
      for (var j = 0; j < Q.length; j++) if (Q[j].id === order[i]) {
        var q = Q[j];
        return { ic: q.ic3, k: 'Nhiệm vụ ' + (p.done + 1) + '/' + p.all, t: q.name, s: G.questHint(q.id) + ' · khoảng ' + q.min + ' phút', go: function () { G.questAct(q.id); }, b: 'Làm ngay' };
      }
    }
    if (!d.ruong && G.claimChest) return { ic: 'gift', t: 'Mở rương hôm nay', s: '+30 XP vì xong cả ' + p.all + ' nhiệm vụ', go: function () { G.claimChest(); G.goLobby(); }, b: 'Mở rương' };
    var nl = G.zhNextLesson();
    return nl ? { ic: 'school', t: 'Xong nhiệm vụ hôm nay. Học thêm: ' + nl.label, s: 'Học thêm là vượt tiến độ', go: function () { G.openLesson(nl.id); }, b: 'Học thêm' }
      : { ic: 'repeat', t: 'Xong nhiệm vụ hôm nay', s: 'Ôn thêm 5 câu để nhớ lâu', go: function () { G.openReview(); }, b: 'Ôn thêm' };
  };
  /* lộ trình tiếng Trung (tab Lộ trình của Sảnh) */
  G.zhRoad = function (pane) {
    var cur = G.zhFloorNow(), st = G.ROADMAP_ZH[cur - 1], fc = G.zhFloorCount(cur), nl = G.zhNextLesson(), hb = G.el('i');
    hb.style.transform = 'scaleX(' + (fc.all ? fc.k / fc.all : 0) + ')';
    pane.appendChild(G.el('div.here-card',
      G.el('span.sh-k', G.ic3('pin', 'ic3-s'), 'Bạn đang ở đây'),
      G.el('div.here-h', G.el('b', st.name), G.el('span.road-cefr', st.hsk)),
      G.el('div.here-n', G.el('b', fc.k + '/' + fc.all), G.el('span', ' phòng đã qua')),
      G.el('span.qs-bar', hb),
      G.el('div.small', st.out),
      nl ? G.el('button.btn.seal.sh-go', { onclick: function () { G.openLesson(nl.id); } }, 'Học tiếp: ' + nl.label + ' ›') : null));
    pane.appendChild(G.el('p.small.faint.road-note', 'Tiếng Trung học riêng với tiếng Anh: XP, chuỗi ngày học, rank, kho ôn đều tính riêng. Viết chữ từng nét, Tầng 1 Nền tảng đầy đủ và HSK 1–2 đang được thêm dần; bản đồ Trường Lạc trấn mở khi có hình.'));
    pane.appendChild(G.el('div.road', G.ROADMAP_ZH.map(function (s) {
      var c = s.final ? null : G.zhFloorCount(s.floor), here = !s.final && s.floor === cur, done = c && c.all && c.k >= c.all;
      var tag = done ? ['star', 'Đã qua hết phòng'] : here ? ['pin', 'Đang học'] : s.soon || (c && !c.all) ? [null, 'Đang xây'] : ['lock', 'Chưa mở'];
      return G.el('div.road-step' + (s.final ? '.final' : '') + (done ? '.got' : '') + (here ? '.here' : ''),
        G.el('div.road-dot', s.final ? G.ic3('grad', 'ic3-s') : String(s.floor)),
        G.el('div.road-body', G.el('b', s.name + ' '), G.el('span.road-cefr', s.hsk), G.el('div.small', s.out),
          c && c.all ? G.el('div.small.road-hrs', G.el('b', 'Có sẵn: ' + c.all + ' phòng'), ' · đã qua ' + c.k) : null,
          G.el('span.road-tag', [tag[0] ? G.ic3(tag[0], 'ic3-s') : null, tag[1]])));
    })));
  };
})();
