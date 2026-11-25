/* Thành phố Trung Hoa: Trường Lạc trấn 长乐镇 (anh Han chốt 24/11/2026: phố cổ sông nước + khu mới, bạn đồng hành
   rồng con Tiểu Long, tiến độ riêng hoàn toàn với tiếng Anh, học trước rồi bản đồ 3D sau khi có hình).
   Học viện Hán ngữ mở thẳng từ Sảnh (chưa có hình bản đồ): 4 tầng, 329 phòng theo mục lục data/zh_index.js
     Tầng 1 Nền tảng (phát âm, tổ hợp thanh, bộ thủ: data/zh_found.js) · Tầng 2 HSK 1–2 · Tầng 3 HSK 3–4 · Tầng 4 HSK 5
     (308 bài giáo trình HSK của app ATLAS: data/zh_c1.js … zh_c5.js), cuối mỗi tầng một bài thi chứng chỉ (zh_test.js).
   Dữ liệu bài tải khi cần theo cấp (G.zhLoadRoom), mở bài nào cũng qua G.openLesson như tiếng Anh.
   Nói chuyện với người dân ở 8 nơi (data/life_zh.js, mở dần theo bài đã qua), luyện nói theo câu đã học, pinyin từng chữ
   để chấm nói (speak.js). Hồ sơ riêng: save.js (G.setLang). */
var G = window.G || (window.G = {});

(function () {
  /* ---------- lộ trình: mỗi tầng một mốc HSK, cuối tầng thi chứng chỉ ---------- */
  G.ROADMAP_ZH = [
    { floor: 1, key: 'Nền tảng', name: 'Tầng 1 · Nền tảng', hsk: 'Pinyin · thanh điệu · bộ thủ', out: 'Đọc đúng pinyin và 4 thanh, nghe phân biệt thanh, đọc liền tổ hợp thanh, biết 61 bộ thủ hay gặp và viết đúng thứ tự nét.' },
    { floor: 2, key: 'HSK 1–2', name: 'Tầng 2 · HSK 1–2', hsk: 'HSK 1–2', out: 'Chào hỏi, giới thiệu, số đếm, giờ giấc, mua đồ, gọi món, hỏi đường; đọc câu ngắn có pinyin; viết được các chữ đã học.' },
    { floor: 3, key: 'HSK 3–4', name: 'Tầng 3 · HSK 3–4', hsk: 'HSK 3–4', out: 'Kể chuyện đã qua, hẹn gặp, đi lại du lịch, khám bệnh, nói về công việc và cảm xúc; đọc truyện ngắn không cần pinyin.' },
    { floor: 4, key: 'HSK 5', name: 'Tầng 4 · HSK 5', hsk: 'HSK 5', out: 'Nói tự nhiên vài phút, nêu ý kiến có lý lẽ, đọc bài báo và truyện dài, nghe hiểu tin tức và hội thoại tốc độ thật.' },
    { final: true, name: 'Tốt nghiệp ConnectLife tiếng Trung', hsk: 'Đầu ra giao tiếp', out: 'Nói chuyện 5 phút với người lạ về đời sống, tự xử lý tình huống không gợi ý, nghe hiểu hội thoại tốc độ thật.', soon: true }
  ];

  /* ---------- mục lục: phòng của từng tầng theo thứ tự học, phòng thi cuối tầng ---------- */
  var META = null;   // id → { f: tầng, t: tên, lv: cấp HSK (0 = Nền tảng) }
  function meta() {
    if (META) return META;
    META = {};
    var I = G.ZH_INDEX || {};
    for (var f = 1; f <= 4; f++) (I[f] || []).forEach(function (r) { META[r[0]] = { f: f, t: r[1], lv: r[2] }; });
    return META;
  }
  function floorIds(f) {
    var ids = ((G.ZH_INDEX && G.ZH_INDEX[f]) || []).map(function (r) { return r[0]; });
    if (ids.length && G.ZH_CERTS && G.ZH_CERTS['zh-x' + f]) ids.push('zh-x' + f);
    return ids;
  }
  G.zhFloorIds = floorIds;
  function allRooms() { var out = []; for (var f = 1; f <= 4; f++) out = out.concat(floorIds(f)); return out; }
  G.zhFloorOf = function (id) { var m = meta()[id]; if (m) return m.f; var x = /^zh-x(\d)$/.exec(id); return x ? +x[1] : 0; };   // 0: phòng cũ ngoài mục lục
  G.zhTitleOf = function (id) {
    var m = meta()[id]; if (m) return m.t;
    if (G.ZH_CERTS && G.ZH_CERTS[id]) return G.ZH_CERTS[id].title;
    return G.ROOMS[id] ? G.ROOMS[id].title : id;
  };
  function shortOf(id) {   // nhãn ngắn: "HSK1 · Bài 12", "Nền tảng 3", "Bộ thủ 2", "Thi chứng chỉ HSK 2"
    var t = G.zhTitleOf(id), p = t.split(' · ');
    return /^HSK\d/.test(t) ? p[0] + ' · ' + p[1] : p[0];
  }
  G.zhShort = shortOf;
  G.zhFloorCount = function (f) { var ids = floorIds(f), k = 0; ids.forEach(function (id) { if (G.roomPassed(id)) k++; }); return { k: k, all: ids.length }; };
  /* tầng đang học: tầng của bài tiếp theo (đã qua hết thì tầng cuối có bài) */
  G.zhFloorNow = function () {
    var nl = G.zhNextLesson(); if (nl) return nl.floor;
    var last = 1; for (var f = 1; f <= 4; f++) if (floorIds(f).length) last = f;
    return last;
  };
  /* phòng mở lần lượt: phòng đầu luôn mở, phòng sau cần qua phòng trước; bài đầu vào cho học vượt tới phòng bắt đầu (G.S.zhStart) */
  function startIdx(a) { var s = G.S.zhStart; return s ? a.indexOf(s) : -1; }
  G.zhRoomOpen = function (id) {
    var a = allRooms(), i = a.indexOf(id);
    return i <= 0 || i <= startIdx(a) || G.roomPassed(a[i - 1]);
  };
  G.zhNextLesson = function () {
    var a = allRooms(), from = Math.max(0, startIdx(a));
    for (var i = from; i < a.length; i++) if (!G.roomPassed(a[i])) {
      var R = G.ROOMS[a[i]], t = G.NPCS && G.NPCS[(R && R.teacher) || 'wang'];
      return { id: a[i], floor: G.zhFloorOf(a[i]), label: shortOf(a[i]), title: G.zhTitleOf(a[i]), teacher: t ? t.name : '' };
    }
    return null;
  };

  /* ---------- tải dữ liệu bài theo cấp (data/zh_c1.js … zh_c5.js, zh_found.js) ---------- */
  var waiting = {};
  G.zhScript = function (src, cb) {
    if (G.ZH_LOADED && G.ZH_LOADED[src]) { if (cb) cb(); return; }
    if (waiting[src]) { if (cb) waiting[src].push(cb); return; }
    waiting[src] = cb ? [cb] : [];
    var s = document.createElement('script');
    s.src = src + (G.APP_VER ? '?v=' + G.APP_VER : '');
    s.async = true;
    function end(err) { var l = waiting[src] || []; delete waiting[src]; if (!err) { G.ZH_LOADED = G.ZH_LOADED || {}; G.ZH_LOADED[src] = 1; } l.forEach(function (f) { f(err); }); }
    s.onload = function () { end(null); };
    s.onerror = function () { s.parentNode && s.parentNode.removeChild(s); end('err'); };
    document.head.appendChild(s);
  };
  function fileOf(id) { var m = meta()[id]; return m && G.ZH_LVFILE ? G.ZH_LVFILE[m.lv] : null; }
  G.zhLoadRoom = function (id, cb) {
    if (G.ROOMS[id] || !fileOf(id)) { cb(G.ROOMS[id] ? null : 'none'); return; }
    G.zhScript(fileOf(id), function (err) { cb(G.ROOMS[id] ? null : err || 'none'); });
  };
  /* tải mọi bài của một tầng (thi cuối tầng lấy câu của cả tầng) */
  G.zhLoad = function (f, cb) {
    var files = [];
    floorIds(f).forEach(function (id) { var x = fileOf(id); if (x && files.indexOf(x) < 0) files.push(x); });
    (function next() { if (!files.length) { cb(); return; } G.zhScript(files.shift(), next); })();
  };
  /* tải sẵn bài sắp học ở nền (mở bài không phải chờ) */
  G.zhWarm = function () { var nl = G.zhNextLesson(); if (nl && !G.ROOMS[nl.id] && fileOf(nl.id)) G.zhLoadRoom(nl.id, function () {}); };
  setTimeout(function () { if (G.lang && G.lang() === 'zh' && G.S) G.zhWarm(); }, 2500);

  /* mở phòng: phòng thi → thi chứng chỉ; bài chưa tải → tải rồi mở (mọi chỗ gọi G.openLesson đều đi qua đây) */
  var baseOpen = G.openLesson;
  G.openLesson = function (id) {
    if (G.ZH_CERTS && G.ZH_CERTS[id] && G.openZhExam) { G.openZhExam(id); return; }
    if (!G.ROOMS[id] && meta()[id]) {
      var body = panelOpen(G.zhTitleOf(id)), gen = G.panelGen;
      body.appendChild(G.el('div.small.faint', 'Đang tải bài…'));
      G.zhLoadRoom(id, function (err) {
        if (!G.panelLive(gen)) return;
        if (G.ROOMS[id]) baseOpen(id);
        else { body.innerHTML = ''; body.appendChild(G.el('div.result', G.el('b', 'Chưa tải được bài'), G.el('div', 'Mở khi có mạng một lần để tải bài về máy, lần sau học không cần mạng.'))); }
      });
      return;
    }
    return baseOpen.apply(this, arguments);
  };
  G.zhOpen = function (id) { G.openLesson(id); };
  /* Trường Lạc trấn chưa có bản đồ: đóng bảng là về Sảnh, vẽ lại Sảnh để nhiệm vụ, tiến độ cập nhật (goLobby tự vẽ thì bỏ lượt này) */
  G.onPanelClose = function () {
    if (!(G.lang && G.lang() === 'zh')) return;
    var lob = document.getElementById('lobby');
    if (!lob || lob.style.display === 'none' || G._lobbyRefresh) return;
    G._lobbyRefresh = setTimeout(function () {
      G._lobbyRefresh = 0;
      if (document.getElementById('panel').className.indexOf('open') >= 0 || document.querySelector('.modal')) return;
      var y = window.pageYOffset; G.renderLobby(); window.scrollTo(0, y);
    }, 60);
  };

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

  /* ---------- nghe chọn pinyin: phương án nhiễu cùng âm, khác thanh ---------- */
  var TONE = { a: 'āáǎà', e: 'ēéěè', i: 'īíǐì', o: 'ōóǒò', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  var MARK = {};
  for (var v in TONE) if (TONE.hasOwnProperty(v)) for (var t = 0; t < 4; t++) MARK[TONE[v].charAt(t)] = [v, t];
  /* đổi thanh của nguyên âm mang dấu thứ k trong chuỗi pinyin sang thanh t (0–3) */
  function retone(py, k, t) {
    var n = -1, out = '';
    for (var i = 0; i < py.length; i++) {
      var c = py.charAt(i), m = MARK[c];
      if (m) { n++; if (n === k) c = TONE[m[0]].charAt(t); }
      out += c;
    }
    return out;
  }
  G.zhPyOptions = function (it) {
    var right = it.py, opts = [right];
    function add(x) { if (x && opts.indexOf(x) < 0 && opts.length < 4) opts.push(x); }
    (it.alts || []).forEach(add);   // cặp gây nhiễu soạn sẵn của khoá phát âm (data/pron/zh.json)
    var marks = 0; for (var i = 0; i < right.length; i++) if (MARK[right.charAt(i)]) marks++;
    for (var k = 0; k < marks && opts.length < 4; k++) {
      var cur = 0; for (var j = 0, n = -1; j < right.length; j++) if (MARK[right.charAt(j)]) { n++; if (n === k) cur = MARK[right.charAt(j)][1]; }
      for (var tt = 0; tt < 4; tt++) if (tt !== cur) add(retone(right, k, tt));
    }
    return G.shuffle(opts);
  };

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

  /* ---------- Học viện Hán ngữ: 4 tầng gập / mở, tầng đang học mở sẵn ---------- */
  G.openZhHall = function () {
    G.zhLoadDict(); G.zhWarm();
    var body = panelOpen('Học viện Hán ngữ 汉语学院'), cur = G.zhFloorNow(), nl = G.zhNextLesson(), t = G.NPCS && G.NPCS.wang;
    body.appendChild(G.el('div.zh-hall-top', t ? G.imgEl(t.img, 'zh-hall-t') : null,
      G.el('div', G.el('b', '你好！欢迎来到汉语学院。'), G.el('div.py', 'Nǐ hǎo! Huānyíng lái dào Hànyǔ xuéyuàn.'),
        G.el('div.small.faint', 'Chào mừng tới Học viện Hán ngữ. Phòng mở lần lượt: qua phòng trước (đúng từ 8/10) là mở phòng sau. Cuối mỗi tầng có bài thi chứng chỉ.'))));
    if (nl) body.appendChild(G.el('button.big.bic.seal.zh-next', { onclick: function () { G.openLesson(nl.id); } }, G.bigIc('school', 'Học tiếp: ' + nl.label), G.el('span', nl.title.split(' · ').slice(nl.label.split(' · ').length).join(' · ') || 'Học, Luyện rồi Kiểm tra')));
    if (!G.S.dauVao && G.openZhPlacement) body.appendChild(G.el('button.link.zh-pl', { onclick: function () { G.openZhPlacement(function () { G.openZhHall(); }); } }, 'Đã biết tiếng Trung? Làm bài đo trình độ (8–12 phút) để vào đúng bài ›'));
    G.ROADMAP_ZH.forEach(function (st) {
      if (st.final) return;
      var ids = floorIds(st.floor), c = G.zhFloorCount(st.floor), list = G.el('div.zh-rooms');
      var head = G.el('button.zh-floor' + (st.floor === cur ? '.open' : ''), { 'aria-expanded': st.floor === cur ? 'true' : 'false', onclick: function () {
        var open = head.className.indexOf('open') < 0;
        head.className = 'zh-floor' + (open ? ' open' : ''); head.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open && !list.children.length) fill();
        list.hidden = !open;
      } }, G.el('b', st.name), G.el('span', ids.length ? c.k + '/' + c.all + ' phòng · ' + st.hsk : 'Đang xây'), G.el('i.zh-chev', '›'));
      body.appendChild(head); body.appendChild(list);
      function fill() {
        var lastLv = null;
        ids.forEach(function (id) {
          var m = meta()[id];
          if (m && m.lv && m.lv !== lastLv && st.floor > 1) { lastLv = m.lv; list.appendChild(G.el('h3.zh-lv', 'HSK ' + m.lv)); }
          var p = G.S.phong[id], ok = G.roomPassed(id), open = G.zhRoomOpen(id), exam = !!(G.ZH_CERTS && G.ZH_CERTS[id]);
          var sub = ok ? 'Đã qua' + (p && !exam ? ' · ' + p.diem + '/10' : '') : open ? (p ? 'Chưa đạt, học lại nhé · ' + p.diem + '/10' : exam ? 'Thi hiểu và nói · đạt là nhận chứng chỉ' : 'Đã mở · bấm để vào học') : exam ? 'Qua hết phòng của tầng để thi' : 'Qua phòng trước để mở';
          list.appendChild(G.el('button.big.bic.zh-room' + (ok ? '.ok' : '') + (open ? '' : '.lock') + (nl && nl.id === id ? '.cur' : ''), { onclick: function () {
            if (!open) { G.toast(exam ? 'Qua hết các phòng của tầng rồi thi chứng chỉ nhé.' : 'Qua phòng trước để mở phòng này nhé.'); return; }
            G.openLesson(id);
          } }, G.bigIc(ok ? 'star' : exam ? 'medal' : open ? 'school' : 'lock', G.zhTitleOf(id)), G.el('span', sub)));
        });
        G.enter([].slice.call(list.querySelectorAll('.zh-room'), 0, 24), { gap: 30, y: 8, dur: 280 });
        var c0 = list.querySelector('.zh-room.cur'); if (c0) setTimeout(function () { try { c0.scrollIntoView({ block: 'center' }); } catch (e) {} }, 60);
      }
      if (st.floor === cur) fill(); else list.hidden = true;
      if (!ids.length) list.appendChild(G.el('p.small.faint', st.out));
    });
    // nói chuyện với người dân (chưa có bản đồ: mở từ đây)
    body.appendChild(G.el('h2.sec', 'Nói chuyện ở Trường Lạc trấn'));
    body.appendChild(talkList());
  };

  /* ---------- hội thoại với người dân (data/life_zh.js): mở dần theo bài đã qua ---------- */
  function places() { var out = []; for (var k in G.LIFE) if (G.LIFE.hasOwnProperty(k) && G.LIFE[k].lang === 'zh') out.push(k); return out; }
  function talksDone(k) { var st = G.S.doiSong && G.S.doiSong[k], n = 0; if (st) for (var t in st.xong) if (st.xong.hasOwnProperty(t)) n++; return n; }
  G.zhPlaceOpen = function (k) { var L = G.LIFE[k]; return !L.unlock || G.roomPassed(L.unlock); };
  function talkList() {
    return G.el('div.zh-rooms', places().map(function (k) {
      var L = G.LIFE[k], open = G.zhPlaceOpen(k), n = talksDone(k), npc = G.NPCS[L.npc];
      return G.el('button.big.bic.zh-room' + (open ? '' : '.lock') + (n >= L.talks.length ? '.ok' : ''), { onclick: function () {
        if (!open) { G.toast(L.unlockText || 'Học thêm vài bài để mở nơi này.'); return; }
        G.openLife(k);
      } }, G.bigIc(open ? 'speak' : 'lock', L.title), G.el('span', open ? (npc ? npc.name + ' · ' : '') + n + '/' + L.talks.length + ' tình huống' : L.unlockText || ''));
    }));
  }
  G.openZhTalks = function () { var body = panelOpen('Nói chuyện ở Trường Lạc trấn'); body.appendChild(G.el('p.small.faint', 'Mỗi nơi 3 tình huống × 5 lượt: nghe người dân nói, chọn câu đáp rồi nói thành tiếng. Nơi mới mở dần khi qua bài ở Học viện.')); body.appendChild(talkList()); };
  /* nơi nên nói chuyện tiếp: nơi đã mở còn tình huống chưa xong; xong hết thì xoay vòng theo ngày */
  G.zhNextLife = function () {
    var open = places().filter(G.zhPlaceOpen);
    for (var i = 0; i < open.length; i++) if (talksDone(open[i]) < G.LIFE[open[i]].talks.length) return open[i];
    return open.length ? open[(+G.vnDay().slice(8, 10)) % open.length] : null;
  };

  /* ---------- nhiệm vụ Nói: nói chuyện ở nơi đã mở; chưa mở nơi nào thì nói theo 5 câu đã học ---------- */
  function learnedLines() {
    var out = [], seen = {};
    allRooms().forEach(function (id) {
      if (!G.ROOMS[id] || !(G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id]))) return;
      (G.ROOMS[id].items || []).forEach(function (it) { if (it.ex && !seen[it.ex]) { seen[it.ex] = 1; out.push({ text: it.ex, py: it.exPy, vi: it.exVi }); } });
    });
    return out;
  }
  G.zhSpeakQuest = function () { var lf = G.zhNextLife(); if (lf && G.openLife) G.openLife(lf); else G.openSpeakZh(); };
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
    G.zhWarm();
    var d = G.today(), p = G.dayProgress(), Q = G.QUESTS || [], order = ['bai', 'viet', 'noi', 'on', 'doc'];
    if (!G.roomPassed('zh-py') && !G.S.phong['zh-py'] && !G.S.zhStart) return { ic: 'speak', t: 'Làm quen tiếng Trung: pinyin và 4 thanh', s: 'Với cô Vương · khoảng 15 phút · nghe, nói theo, phân biệt thanh điệu. Đã biết tiếng Trung thì đo trình độ ở Học viện.', go: function () { G.openLesson('zh-py'); }, b: 'Bắt đầu' };
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
    pane.appendChild(G.el('p.small.faint.road-note', 'Tiếng Trung học riêng với tiếng Anh: XP, chuỗi ngày học, rank, kho ôn đều tính riêng. 308 bài HSK 1–5 theo giáo trình HSK 2025, cuối mỗi tầng thi chứng chỉ (hiểu và nói); bản đồ Trường Lạc trấn mở khi có hình.'));
    var certs = (G.S.totNghiep && G.S.totNghiep.zh) || {};
    pane.appendChild(G.el('div.road', G.ROADMAP_ZH.map(function (s) {
      var c = s.final ? null : G.zhFloorCount(s.floor), here = !s.final && s.floor === cur, done = c && c.all && c.k >= c.all;
      var cert = !s.final && G.ZH_CERTS && G.ZH_CERTS['zh-x' + s.floor] && certs[G.ZH_CERTS['zh-x' + s.floor].level];
      var tag = done || cert ? ['star', cert ? 'Có chứng chỉ' : 'Đã qua hết phòng'] : here ? ['pin', 'Đang học'] : s.soon || (c && !c.all) ? [null, 'Đang xây'] : ['lock', 'Chưa mở'];
      return G.el('div.road-step' + (s.final ? '.final' : '') + (done ? '.got' : '') + (here ? '.here' : ''),
        G.el('div.road-dot', s.final ? G.ic3('grad', 'ic3-s') : String(s.floor)),
        G.el('div.road-body', G.el('b', s.name + ' '), G.el('span.road-cefr', s.hsk), G.el('div.small', s.out),
          c && c.all ? G.el('div.small.road-hrs', G.el('b', 'Có sẵn: ' + c.all + ' phòng'), ' · đã qua ' + c.k) : null,
          G.el('span.road-tag', [tag[0] ? G.ic3(tag[0], 'ic3-s') : null, tag[1]])));
    })));
  };
})();
