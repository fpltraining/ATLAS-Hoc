/* Nói qua micro và chấm điểm 0–100 (chấm vừa phải, không gắt).

   Dùng nhận dạng giọng nói có sẵn của trình duyệt (iPhone/iPad: Safari, cần mạng, bật Siri).
   Máy so chữ nó nghe được với câu mẫu: đây là điểm "nói ra người nghe có hiểu không",
   không phải phân tích từng âm. Cách chấm cố ý nhẹ tay:
     - từ gần đúng (sai 1–2 chữ cái) vẫn được nửa hoặc trọn điểm;
     - bỏ qua dấu câu, viết tắt (I'm = I am), số (3 = three);
     - lấy cách nghe tốt nhất trong các cách máy đưa ra;
     - điểm thô được nâng nhẹ: nói đúng 80% từ ≈ 88 điểm.
   Không có micro, hoặc người học chọn "Không dùng micro": chuyển sang nghe rồi nhắc lại to, tự đánh dấu. */
var G = window.G || (window.G = {});

(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  G.canListen = !!SR;
  // mở từ biểu tượng ngoài màn hình chính (iPad/iPhone): một số bản iOS không cho nhận giọng nói ở chế độ này
  G.standalone = !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));
  var micFails = 0;

  /* chế độ micro: 'on' | 'off' (lưu trong G.S.micro); mặc định bật nếu máy nghe được */
  G.micOn = function () { return G.canListen && G.S && G.S.micro !== 'off'; };
  G.setMic = function (on) { G.S.micro = on ? 'on' : 'off'; G.save(); };

  /* nghe một lần: cb(err, [các cách nghe]) */
  var cur = null, dog = 0;
  G.listen = function (lang, cb, onInterim) {
    if (!SR) { cb('Máy này chưa nghe được giọng nói. Trên iPhone/iPad hãy mở bằng Safari và bật Siri.'); return; }
    if (cur) { var old = cur; cur = null; try { old.abort(); } catch (e0) { /* bỏ qua */ } }
    if (G.hush) G.hush();
    var r, done = false, finals = [], interim = '';
    try { r = new SR(); } catch (e1) { cb('Không mở được micro. Thử lại sau giây lát.'); return; }
    cur = r;
    function end(err, alts) {
      if (done) return; done = true; clearTimeout(dog);
      // tắt hẳn micro (iPad giữ micro → loa chuyển sang chế độ gọi, giọng đọc nhỏ đi)
      r.onresult = r.onerror = r.onend = null;
      try { r.abort(); } catch (eA) { /* bỏ qua */ }
      setTimeout(function () { if (G.audioReset) G.audioReset(); }, 400);
      if (cur === r) cur = null;
      cb(err, alts);
    }
    r.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    r.interimResults = true; r.maxAlternatives = 5; r.continuous = false;
    r.onresult = function (e) {
      var res = e.results[e.results.length - 1];
      if (res.isFinal) {
        finals = []; for (var i = 0; i < res.length; i++) if (res[i].transcript) finals.push(res[i].transcript);
        if (finals.length) { end(null, finals); return; }   // có kết quả là dừng micro ngay
      }
      else { interim = res[0].transcript; if (onInterim) onInterim(interim); }
    };
    r.onerror = function (e) {
      var M = {
        'not-allowed': 'Chưa cho phép dùng micro. Vào Cài đặt → Safari → Micro, chọn Cho phép.',
        'service-not-allowed': 'Nhận dạng giọng nói đang tắt. Bật Siri trong Cài đặt rồi thử lại.',
        network: 'Cần có mạng để máy nghe được giọng nói.',
        'no-speech': 'Máy chưa nghe thấy gì. Nói to và gần micro hơn nhé.',
        'audio-capture': 'Không tìm thấy micro trên máy này.',
        aborted: 'Đã dừng.'
      };
      // đã nghe được một phần thì vẫn chấm
      if (e.error !== 'not-allowed' && e.error !== 'service-not-allowed' && (finals.length || interim)) { end(null, finals.length ? finals : [interim]); return; }
      end({ code: e.error, msg: M[e.error] || 'Máy chưa nghe được. Thử lại nhé.' });
    };
    r.onend = function () {
      if (finals.length) end(null, finals);
      else if (interim) end(null, [interim]);   // iPhone đôi khi không gửi kết quả cuối
      else end({ code: 'no-speech', msg: 'Máy chưa nghe thấy gì. Nói to và gần micro hơn nhé.' });
    };
    // chống treo: nghe tối đa 10 giây, sau đó dừng; 3 giây nữa vẫn im thì báo lỗi
    dog = setTimeout(function () {
      try { r.stop(); } catch (e2) { /* bỏ qua */ }
      dog = setTimeout(function () { try { r.abort(); } catch (e3) { /* bỏ qua */ } if (finals.length || interim) end(null, finals.length ? finals : [interim]); else end({ code: 'timeout', msg: 'Máy nghe lâu quá mà chưa ra chữ. Thử lại nhé.' }); }, 3000);
    }, 10000);
    try { r.start(); } catch (e4) { end({ code: 'start', msg: 'Không mở được micro. Thử lại sau giây lát.' }); }
  };
  G.stopListen = function () { if (cur) { try { cur.stop(); } catch (e) { /* bỏ qua */ } } };
  G.listening = function () { return !!cur; };   // đang mở micro (nhạc nền tắt)
  G.abortListen = function () { if (cur) { var c = cur; cur = null; try { c.abort(); } catch (e) { /* bỏ qua */ } } };

  /* ---------- chấm điểm ---------- */
  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function num(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + num(n % 100) : '');
    if (n < 10000) return num(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + num(n % 1000) : '');
    return String(n);
  }
  var CON = { "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are',
    "they're": 'they are', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', cannot: 'can not',
    "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "i'll": 'i will', "i've": 'i have', "i'd": 'i would',
    "that's": 'that is', "what's": 'what is', "let's": 'let us', "there's": 'there is', "wasn't": 'was not',
    "weren't": 'were not', "you'll": 'you will', "we'll": 'we will', "it'll": 'it will', "you've": 'you have',
    "we've": 'we have', "they've": 'they have', "couldn't": 'could not', "wouldn't": 'would not', "shouldn't": 'should not',
    "here's": 'here is', "where's": 'where is', "how's": 'how is', "who's": 'who is', ok: 'okay', gonna: 'going to', wanna: 'want to' };
  G.words = function (s) {
    var t = String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/\d+/g, function (d) { return ' ' + num(+d) + ' '; })
      .replace(/[^a-z' ]+/g, ' ').split(/\s+/);
    var out = [];
    for (var i = 0; i < t.length; i++) {
      if (!t[i]) continue;
      var w = CON[t[i]] || t[i].replace(/'s$/, '').replace(/'/g, '');
      var ps = w.split(' ');
      for (var j = 0; j < ps.length; j++) if (ps[j]) out.push(ps[j]);
    }
    return out;
  };
  function edit(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    var prev = [], cur2, i, j;
    for (j = 0; j <= b.length; j++) prev.push(j);
    for (i = 1; i <= a.length; i++) {
      cur2 = [i];
      for (j = 1; j <= b.length; j++) cur2[j] = Math.min(prev[j] + 1, cur2[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur2;
    }
    return prev[b.length];
  }
  /* điểm khớp của một từ: 1 đúng, 0.5–1 gần đúng, 0 sai */
  function sim(a, b) {
    if (a === b) return 1;
    var d = edit(a, b), L = Math.max(a.length, b.length);
    if (L >= 4 && d === 1) return 0.85;
    if (L >= 7 && d === 2) return 0.6;
    if (L <= 3 && d === 1 && a[0] === b[0]) return 0.5;
    return 0;
  }
  /* ghép kiểu dãy con chung có trọng số; trả về điểm từng từ của câu mẫu */
  function align(T, H) {
    var n = T.length, m = H.length, i, j, D = [];
    for (i = 0; i <= n; i++) { D.push([]); for (j = 0; j <= m; j++) D[i].push(0); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) {
      var s = sim(T[i], H[j]);
      D[i][j] = Math.max(D[i + 1][j], D[i][j + 1], s > 0 ? D[i + 1][j + 1] + s : 0);
    }
    var marks = [];
    for (i = 0; i < n; i++) marks.push(0);
    i = 0; j = 0;
    while (i < n && j < m) {
      var s2 = sim(T[i], H[j]);
      if (s2 > 0 && D[i][j] === D[i + 1][j + 1] + s2) { marks[i] = s2; i++; j++; }
      else if (D[i + 1][j] >= D[i][j + 1]) i++; else j++;
    }
    return { total: D[0][0], marks: marks };
  }
  /* chấm: trả {score 0–100, marks[] theo từ câu mẫu, words[], heard} */
  G.scoreSpeech = function (target, alts) {
    var T = G.words(target), best = null;
    for (var k = 0; k < alts.length; k++) {
      var H = G.words(alts[k]);
      if (!T.length) break;
      var a = align(T, H);
      var raw = a.total / T.length;
      // nói thừa nhiều từ thì trừ nhẹ
      var extra = Math.max(0, H.length - T.length * 1.5) / T.length;
      raw = Math.max(0, raw - extra * 0.2);
      var sc = Math.round(100 * Math.min(1, Math.pow(raw, 0.6)));   // nâng nhẹ: 0.8 → 88, 0.6 → 74, 0.4 → 58
      if (H.length && sc < 15) sc = 15;                                // có nói thì không 0 điểm
      if (!best || sc > best.score) best = { score: sc, marks: a.marks, words: T, heard: alts[k] };
    }
    return best || { score: 0, marks: [], words: T, heard: '' };
  };
  G.scoreLabel = function (s) {
    if (s >= 90) return ['Tuyệt vời!', 'great'];
    if (s >= 75) return ['Rất tốt!', 'good'];
    if (s >= 60) return ['Tốt, người nghe hiểu được', 'good'];
    if (s >= 40) return ['Khá rồi, thử lại cho rõ hơn nhé', 'ok'];
    return ['Nói lại chậm và rõ từng từ nhé', 'low'];
  };
  G.PASS_SCORE = 60;

  /* ---------- thẻ "Nói câu này" dùng chung ----------
     opts: { text, vi, lang, onDone(score|null) }  — score null khi không dùng micro / bỏ qua */
  G.speakCard = function (opts) {
    var lang = opts.lang || 'en', best = null, tries = 0;
    var box = G.el('div.mk');
    function render() {
      box.innerHTML = '';
      box.appendChild(G.el('div.mk-q', G.el('div.mk-t', opts.text),
        opts.vi ? G.el('div.small.faint', opts.vi) : null,
        G.sayBtns(opts.text, lang)));
      if (G.micOn()) micMode(); else selfMode();
    }
    function icon(n, cls) { return G.el('img.' + (cls || 'mk-ic'), { src: G.assetUrl(n), alt: '', draggable: 'false' }); }
    var busy = false, lastTap = 0;
    function tapOk() { var n = Date.now(); if (n - lastTap < 600) return false; lastTap = n; return true; }   // chống chạm đúp
    function micMode() {
      var res = G.el('div.mk-res');
      var lbl = G.el('span', tries ? 'Nói lại' : 'Bấm rồi nói');
      var mic = G.el('button.mk-mic', { 'aria-label': 'Bấm để nói', onclick: function () { if (!tapOk()) return; if (busy) G.stopListen(); else start(); } }, icon('ic_mic.png', 'mk-mic-img'), lbl);
      box.appendChild(G.el('div.mk-row', mic, res));
      box.appendChild(G.el('div.mk-foot',
        G.el('button.mk-sw', { onclick: function () { G.abortListen(); busy = false; G.setMic(false); render(); } }, icon('ic_lips.png'), 'Không dùng micro'),
        G.el('button.link', { onclick: function () { G.abortListen(); busy = false; finish(best ? best.score : null); } }, best ? 'Tiếp tục ›' : 'Bỏ qua ›')));
      if (best) showResult(res, best);
      else res.appendChild(G.el('div.small.faint', 'Bấm micro, nói câu ở trên. Nói xong máy tự chấm (bấm lần nữa để dừng sớm).'));
      function start() {
        busy = true;
        mic.className = 'mk-mic on'; lbl.textContent = 'Đang nghe… bấm để dừng';
        res.innerHTML = ''; res.appendChild(G.el('div.mk-live', G.ic3('mic', 'ic3-s'), ' Nói to, rõ câu ở trên'));
        G.listen(lang, function (err, alts) {
          busy = false; lastTap = Date.now();
          if (fin || !box.parentNode) return;            // thẻ đã đóng
          mic.className = 'mk-mic';
          if (err) {
            if (err.code === 'aborted') { lbl.textContent = tries ? 'Nói lại' : 'Bấm rồi nói'; res.innerHTML = ''; return; }
            lbl.textContent = 'Thử lại'; res.innerHTML = '';
            var hard = err.code === 'not-allowed' || err.code === 'service-not-allowed' || err.code === 'audio-capture' || err.code === 'start' || err.code === 'timeout';
            if (hard) micFails++;
            res.appendChild(G.el('div.mk-err', G.standalone && hard
              ? 'Micro chưa chạy khi mở app từ màn hình chính. Bật Siri và cho phép micro trong Cài đặt → ConnectLife/Safari. Nếu vẫn không được, học tiếp bằng chế độ không micro nhé.'
              : err.msg));
            if (hard || micFails >= 2) {
              res.appendChild(G.el('button.btn.sm', { onclick: function () { G.setMic(false); render(); } }, 'Học không dùng micro'));
            }
            return;
          }
          tries++;
          var r = G.scoreSpeech(opts.text, alts);
          var first = !best;
          if (!best || r.score >= best.score) best = r;
          if (r.score >= 90) { G.S.noiTot = (G.S.noiTot || 0) + 1; G.save(); if (G.achSoon) G.achSoon(); }
          G.sfx(r.score >= G.PASS_SCORE ? 'right' : 'wrong');
          if (r.score >= G.PASS_SCORE && first) G.addXp(r.score >= 90 ? 3 : 2);
          render();
        }, function (t) { res.innerHTML = ''; res.appendChild(G.el('div.mk-live', '“' + t + '”')); });
      }
    }
    function showResult(res, r) {
      var lb = G.scoreLabel(r.score);
      res.appendChild(G.el('div.mk-score.' + lb[1], r.score >= G.PASS_SCORE ? icon('ic_mic_ok.png', 'mk-ok') : null, G.el('b', r.score), G.el('span', '/100')));
      res.appendChild(G.el('div.mk-lb', lb[0]));
      res.appendChild(G.el('div.mk-words', r.words.map(function (w, i) {
        var m = r.marks[i] || 0; return G.el('span.' + (m >= 0.85 ? 'w-ok' : m > 0 ? 'w-near' : 'w-miss'), w);
      })));
      res.appendChild(G.el('div.small.faint', 'Máy nghe: “' + r.heard + '”'));
    }
    function selfMode() {
      box.appendChild(G.el('div.mk-row', icon('ic_speak.png', 'mk-self-img'),
        G.el('div.small', 'Bấm 🔊 nghe mẫu (🐢 để nghe chậm), rồi nhắc lại thật to 2 lần. Nói xong thì bấm nút bên dưới.')));
      box.appendChild(G.el('div.mk-foot',
        G.canListen ? G.el('button.mk-sw', { onclick: function () { G.setMic(true); render(); } }, icon('ic_mic.png'), 'Dùng micro chấm điểm') : G.el('span.small.faint', 'Máy này chưa có micro chấm điểm'),
        G.el('button.btn.seal.sm', { onclick: function () { G.sfx('right'); G.addXp(1); finish(null); } }, 'Mình đã nói xong')));
    }
    var fin = false;
    function finish(s) { if (fin) return; fin = true; G.abortListen(); if (opts.onDone) opts.onDone(s); }
    render();
    if (opts.autoplay !== false) G.say(opts.text, lang);
    return box;
  };

  /* ghi điểm nói của ngày (trung bình) để hiện ở bảng Hôm nay */
  G.logSpeak = function (score) {
    if (score === null || score === undefined) return;
    var d = G.today ? G.today() : null; if (!d) return;
    d.noi = d.noi || { n: 0, tong: 0 };
    d.noi.n++; d.noi.tong += score;
    G.save();
  };
})();

/* ---------- Nhại có ghi âm (shadowing): nghe mẫu → ghi giọng mình → nghe lại mẫu rồi giọng mình để so ----------
   MediaRecorder (Safari iOS 14.3+, Chrome). Máy không hỗ trợ thì không hiện nút. Bản ghi chỉ nằm trong máy, không gửi đi đâu. */
(function () {
  G.canRecord = function () { return !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia); };
  var live = null;   // chỉ một bản ghi chạy cùng lúc
  G.shadowBtn = function (text, lang) {
    if (!G.canRecord() || !text) return null;
    lang = lang || 'en';
    var url = null, rec = null, stream = null, chunks = [], tm = 0;
    var recB = G.el('button.btn.sm.shd-b'), mineB = G.el('button.btn.sm.shd-b'), cmpB = G.el('button.btn.sm.shd-b');
    function label(b, ic, t) { b.innerHTML = ''; b.appendChild(G.ic3(ic, 'ic3-s')); b.appendChild(document.createTextNode(' ' + t)); }
    function draw() {
      label(recB, rec ? 'pause' : 'record', rec ? 'Dừng ghi' : url ? 'Ghi lại' : 'Ghi âm giọng mình');
      recB.className = 'btn sm shd-b' + (rec ? ' on' : '');
      mineB.style.display = cmpB.style.display = url ? '' : 'none';
    }
    label(mineB, 'speaker', 'Nghe mình'); label(cmpB, 'repeat', 'Mẫu rồi mình');
    function stopTracks() { if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; } }
    function stop() { clearTimeout(tm); try { if (rec && rec.state !== 'inactive') rec.stop(); } catch (e) { /* bỏ qua */ } }
    function playMine() { if (!url) return; var a = new Audio(url); var p = a.play(); if (p && p.catch) p.catch(function () { /* bỏ qua */ }); }
    recB.onclick = function (e) {
      e.stopPropagation();
      if (rec) { stop(); return; }
      if (live) live();
      if (G.hush) G.hush();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s; chunks = [];
        var types = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'], type = null;
        for (var i = 0; i < types.length && !type; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(types[i])) type = types[i];
        try { rec = type ? new MediaRecorder(s, { mimeType: type }) : new MediaRecorder(s); } catch (er) { rec = new MediaRecorder(s); }
        var r0 = rec;
        rec.ondataavailable = function (ev) { if (ev.data && ev.data.size) chunks.push(ev.data); };
        rec.onstop = function () {
          stopTracks();
          if (url) URL.revokeObjectURL(url);
          url = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: r0.mimeType || type || 'audio/mp4' })) : null;
          rec = null; live = null; draw();
          if (G.audioReset) G.audioReset();   // iPad: sau micro âm thanh nhỏ lại, tạo lại trình phát
          if (url) setTimeout(playMine, 150);
        };
        rec.start(); live = stop;
        tm = setTimeout(stop, Math.min(12000, 2500 + text.length * 110));   // tự dừng theo độ dài câu
        draw();
      }).catch(function () { G.toast('Chưa mở được micro. Cho phép micro cho app trong Cài đặt của máy nhé.'); });
    };
    mineB.onclick = function (e) { e.stopPropagation(); playMine(); };
    cmpB.onclick = function (e) { e.stopPropagation(); G.sayList([text], lang, false, null, function () { setTimeout(playMine, 250); }); };
    draw();
    return G.el('div.shd', G.el('div.small.faint.shd-k', 'Nhại: nghe mẫu, ghi giọng mình, nghe lại để so'), G.el('div.shd-row', recB, mineB, cmpB));
  };
})();
