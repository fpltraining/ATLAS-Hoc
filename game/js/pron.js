/* Bắt lỗi phát âm hay gặp của người Việt và luyện theo lỗi (dữ liệu: data/pron_en.js).
   Bắt lỗi: đọc to 12 từ "bẫy" (âm cuối, s cuối, đuôi -s, đuôi -ed, th, nguyên âm ngắn – dài). Người Việt đọc sai thường thành
   một từ khác có thật (card → car, three → tree), nên máy nhận giọng nói của iPad nghe ra từ sai đó. Không chấm từng âm như ELSA,
   nhưng đủ bắt các lỗi rơi âm cuối, thiếu đuôi, th thành t / s.
   Kết quả cộng dồn vào G.S.loiPhatAm = { lỗi: { w: số lần sai, r: số lần đúng } }; lần bắt lỗi gần nhất ở G.S.phatAmKiem.
   Luyện theo lỗi: 12 câu cho 3 lỗi sai nhiều nhất: nghe phân biệt cặp từ (card / car) và tự nói (cần micro). */
var G = window.G || (window.G = {});

(function () {
  var D = G.PRON_EN;
  function part(s) { var a = String(s).split('|'); return { w: a[0], ipa: a[1] || '', vi: a[2] || '' }; }
  function stats() { return G.S.loiPhatAm || (G.S.loiPhatAm = {}); }
  function mark(tag, ok) { var s = stats(), t = s[tag] || (s[tag] = { w: 0, r: 0 }); if (ok) t.r++; else t.w++; }
  function micReady() { return !!(G.canListen && G.micOn && G.micOn()); }

  /* lỗi sắp theo độ nặng: sai nhiều, tỉ lệ đúng thấp lên trước (chỉ lỗi còn sai) */
  G.pronErrors = function () {
    var s = G.S.loiPhatAm || {}, out = [];
    for (var t in s) if (s.hasOwnProperty(t) && D.tags[t] && s[t].w > 0) out.push({ tag: t, w: s[t].w, r: s[t].r, rate: s[t].r / (s[t].r + s[t].w) });
    out.sort(function (a, b) { return (a.rate - b.rate) || (b.w - a.w); });
    return out;
  };

  /* máy nghe có đúng từ không: từ đầu tiên máy nghe ra có từ cần đọc → đúng; ra từ sai quen thuộc → sai;
     máy phân vân (từ cần đọc nằm trong các cách nghe khác) → tính đúng */
  function judge(word, errs, alts) {
    var top = G.words(alts[0] || ''), i;
    if (top.indexOf(word) >= 0) return true;
    for (i = 0; i < (errs || []).length; i++) if (top.indexOf(errs[i]) >= 0) return false;
    for (i = 1; i < alts.length; i++) if (G.words(alts[i]).indexOf(word) >= 0) return true;
    return false;
  }

  /* lớp phủ riêng (mở từ Sảnh); trong bài đầu vào thì vẽ thẳng vào khung của bài */
  var ov = null;
  function overlay() {
    if (!ov) { ov = G.el('div', { id: 'pronov' }); document.body.appendChild(ov); }
    ov.style.display = 'block'; G._placementOpen = true;   // tắt nhạc nền, tiếng nền trong lúc luyện
    return ov;
  }
  function closeOverlay() { if (ov) { ov.style.display = 'none'; ov.innerHTML = ''; } G._placementOpen = !!(document.getElementById('placement') && document.getElementById('placement').style.display === 'block'); if (G.hush) G.hush(); }
  function frame(host) { host.innerHTML = ''; var b = G.el('div.pl-wrap'); host.appendChild(b); host.scrollTop = 0; return b; }

  /* nút micro: bấm → nghe một lần → cb(alts) ; lỗi thì báo và cho bấm lại */
  function micBtn(out, cb) {
    var mic = G.el('button.mk-mic', { onclick: function () {
      if (mic.className.indexOf('on') >= 0) return;
      mic.className = 'mk-mic on'; out.innerHTML = ''; out.appendChild(G.el('div.small', G.ic3('mic', 'ic3-s'), ' Đang nghe… đọc xong máy tự dừng'));
      G.listen('en', function (err, alts) {
        mic.className = 'mk-mic'; out.innerHTML = '';
        if (err) { out.appendChild(G.el('div.mk-err', err.msg || 'Chưa nghe rõ, thử lại nhé.')); return; }
        cb(alts || []);
      });
    } }, G.el('img.mk-mic-img', { src: G.assetUrl('ic_mic.png'), alt: '', draggable: 'false' }), G.el('b', 'Bấm rồi đọc'));
    return mic;
  }

  /* ---------- bắt lỗi: 12 từ bẫy ---------- */
  /* host: phần tử để vẽ; done(kq) khi xong hoặc bỏ qua (kq null) */
  G.pronCheck = function (host, done) {
    var T = G.shuffle(D.test), i = 0, res = {}, heard = {};
    function next() {
      if (i >= T.length) { finish(); return; }
      var it = T[i], box = frame(host), out = G.el('div.pl-heard');
      box.appendChild(G.el('div.pl-top', G.el('span.small.faint', 'Bắt lỗi phát âm · từ ' + (i + 1) + '/' + T.length),
        G.el('div.pl-prog', T.map(function (q, k) { return G.el('i' + (k < i ? '.done' : k === i ? '.on' : '')); }).slice(0, 12))));
      if (i === 0) box.appendChild(G.el('div.pl-kai', G.imgEl('kai_follow.png', 'pl-kai-img'), G.el('span', 'Đọc to từng từ như bình thường bạn vẫn nói, đừng cố quá. Máy nghe xem bạn có mắc lỗi người Việt hay gặp không.')));
      var card = G.el('div.pl-card.pr-card',
        G.el('div.small.faint', 'Đọc to từ này:'),
        G.el('div.pr-word', it.w), G.el('div.pr-vi', it.vi),
        G.el('div.pl-microw', micBtn(out, function (alts) {
          var ok = judge(it.w, it.err, alts);
          res[it.tag] = res[it.tag] || { w: 0, r: 0 }; res[it.tag][ok ? 'r' : 'w']++; mark(it.tag, ok);
          if (!ok) heard[it.tag] = (heard[it.tag] || []).concat([{ w: it.w, h: alts[0] || '' }]);
          out.appendChild(G.el('div.small', 'Máy nghe: “' + (alts[0] || '') + '”'));
          i++; setTimeout(next, 900);
        }), out),
        G.el('div.row',
          G.el('button.btn.ghost', { onclick: function () { res[it.tag] = res[it.tag] || { w: 0, r: 0 }; res[it.tag].w++; mark(it.tag, false); i++; next(); } }, 'Không đọc được'),
          G.el('button.btn.ghost', { onclick: function () { G.save(); done(null); } }, 'Bỏ qua phần này')));
      box.appendChild(card);
    }
    function finish() {
      var loi = [];
      for (var t in res) if (res.hasOwnProperty(t) && res[t].w > 0) loi.push({ tag: t, w: res[t].w, heard: heard[t] || [] });
      loi.sort(function (a, b) { return b.w - a.w; });
      G.S.phatAmKiem = { luc: G.vnNow(), loi: loi.map(function (x) { return x.tag; }), dung: T.length - loi.reduce(function (a, x) { return a + x.w; }, 0), tong: T.length };
      G.save();
      done({ loi: loi });
    }
    next();
  };

  /* thẻ "lỗi phát âm hay gặp" (kết quả đầu vào, Sảnh): 3 lỗi nặng nhất, cách sửa, nút luyện */
  G.pronCard = function (onPractice, detail) {
    var E = G.pronErrors().slice(0, 3), k = G.S.phatAmKiem;
    var wrap = G.el('div.pr-sum', G.el('b.pr-sum-h', G.ic3('speak', 'ic3-s'), ' Lỗi phát âm hay gặp của bạn'));
    if (!E.length) {
      wrap.appendChild(G.el('div', k ? 'Máy nghe rõ cả ' + k.tong + ' từ bẫy. Phát âm của bạn tránh được các lỗi người Việt hay mắc. Giỏi lắm!' : 'Chưa bắt lỗi phát âm.'));
      return wrap;
    }
    E.forEach(function (e, n) {
      var ex = (detail || {})[e.tag] || [];
      wrap.appendChild(G.el('div.pr-err',
        G.el('b', (n + 1) + '. ' + D.tags[e.tag]),
        ex.length ? G.el('div.small', ex.map(function (x) { return x.w + ' → máy nghe thành “' + x.h + '”'; }).join(' · ')) : G.el('div.small.faint', 'Sai ' + e.w + ' lần · đúng ' + e.r + ' lần'),
        G.el('div.small', D.tips[e.tag])));
    });
    if (onPractice) wrap.appendChild(G.el('button.btn.seal', { onclick: onPractice }, G.ic3('target', 'ic3-s'), ' Luyện ngay theo lỗi của bạn (5 phút)'));
    return wrap;
  };

  /* ---------- luyện theo lỗi: 12 câu, nghe phân biệt + nói ---------- */
  G.openPronPractice = function (cb, host) {
    var own = !host; host = host || overlay();
    var E = G.pronErrors().slice(0, 3).map(function (e) { return e.tag; });
    if (!E.length) E = ['final', 's-end', 'th'];   // chưa có lỗi: luyện 3 lỗi người Việt hay mắc nhất
    var Q = [], n, mic = micReady();
    for (n = 0; n < 12; n++) {
      var tag = E[n % E.length], ps = D.pairs[tag], pr = ps[Math.floor(Math.random() * ps.length)];
      Q.push({ tag: tag, a: part(pr[0]), b: part(pr[1]), say: mic && n % 3 === 2 });
    }
    var i = 0, right = 0, shownTip = {};
    function end() { if (own) closeOverlay(); if (cb) cb(); }
    function next() {
      if (i >= Q.length) { summary(); return; }
      var q = Q[i], box = frame(host);
      box.appendChild(G.el('div.pl-top', G.el('span.small.faint', 'Luyện theo lỗi · câu ' + (i + 1) + '/' + Q.length + ' · ' + D.tags[q.tag]),
        G.el('button.btn.ghost.pr-x', { onclick: end }, 'Dừng')));
      if (!shownTip[q.tag]) { shownTip[q.tag] = 1; box.appendChild(G.el('div.pl-kai', G.imgEl('kai_follow.png', 'pl-kai-img'), G.el('span', G.el('b', D.tags[q.tag] + ': '), D.tips[q.tag]))); }
      var card = G.el('div.pl-card.pr-card'); box.appendChild(card);
      if (q.say) sayQ(q, card); else hearQ(q, card);
    }
    function after(ok, card, extra) {
      if (ok) right++;
      card.appendChild(G.el('div.pr-fb.' + (ok ? 'ok' : 'no'), ok ? 'Đúng rồi!' : 'Chưa đúng', extra || null));
      card.appendChild(G.el('button.btn.seal', { onclick: function () { i++; next(); } }, i + 1 < Q.length ? 'Câu tiếp ›' : 'Xem kết quả ›'));
    }
    /* nghe một trong hai từ, chọn từ vừa nghe; xong thì nghe lại cả hai để so */
    function hearQ(q, card) {
      var t = Math.random() < 0.5 ? q.a : q.b, done = false;
      card.appendChild(G.el('div.small.faint', 'Nghe rồi chọn từ bạn nghe thấy:'));
      card.appendChild(G.el('div.pl-listen',
        G.el('button.pl-play', { onclick: function () { G.say(t.w, 'en'); } }, G.ic3('speaker', 'ic3-s'), ' Nghe lại'),
        G.el('button.pl-play.slow', { onclick: function () { G.saySlow(t.w, 'en'); } }, G.ic3('turtle', 'ic3-s'), ' Nghe chậm')));
      var opts = G.el('div.pl-opts.pr-two');
      G.shuffle([q.a, q.b]).forEach(function (o) {
        opts.appendChild(G.el('button.opt', { onclick: function (e) {
          if (done) return; done = true;
          var ok = o.w === t.w; mark(q.tag, ok); G.sfx(ok ? 'right' : 'wrong');
          e.currentTarget.className = 'opt ' + (ok ? 'ok' : 'no');
          after(ok, card, G.el('div.small', 'So lại hai từ: ', G.el('button.pl-mini', { onclick: function () { G.say(q.a.w, 'en'); } }, G.ic3('speaker', 'ic3-s'), ' ' + q.a.w), ' ',
            G.el('button.pl-mini', { onclick: function () { G.say(q.b.w, 'en'); } }, G.ic3('speaker', 'ic3-s'), ' ' + q.b.w)));
          setTimeout(function () { G.say(q.a.w, 'en'); setTimeout(function () { G.say(q.b.w, 'en'); }, 1100); }, 500);
        } }, G.el('b', o.w), G.el('span.small.faint', ' ' + o.ipa + ' · ' + o.vi)));
      });
      card.appendChild(opts);
      setTimeout(function () { G.say(t.w, 'en'); }, 350);
    }
    /* tự đọc từ khó của cặp (từ có âm dễ mất), máy nghe; được thử 2 lần */
    function sayQ(q, card) {
      var t = q.a, tries = 0, out = G.el('div.pl-heard'), fin = false;
      card.appendChild(G.el('div.small.faint', 'Đọc to từ này (bấm 🔊 để nghe mẫu):'));
      card.appendChild(G.el('div.pr-word', t.w, ' ', G.el('button.pl-mini', { onclick: function () { G.say(t.w, 'en'); } }, G.ic3('speaker', 'ic3-s'))));
      card.appendChild(G.el('div.pr-vi', t.ipa + ' · ' + t.vi + ' (không phải ' + q.b.w + ')'));
      card.appendChild(G.el('div.pl-microw', micBtn(out, function (alts) {
        if (fin) return;
        tries++;
        var ok = judge(t.w, [q.b.w], alts);
        out.appendChild(G.el('div.small', 'Máy nghe: “' + (alts[0] || '') + '”'));
        if (ok || tries >= 2) { fin = true; mark(q.tag, ok); G.sfx(ok ? 'right' : 'wrong'); after(ok, card, ok ? null : G.el('div.small', D.tips[q.tag])); }
        else out.appendChild(G.el('div.small.faint', 'Gần được rồi! Nghe mẫu rồi đọc lại, nhấn rõ âm khó.'));
      }), out));
    }
    function summary() {
      var box = frame(host);
      G.save(); if (G.addXp) G.addXp(10); if (G.markStudy) G.markStudy(); if (G.updateHud) G.updateHud(); G.sfx('done');
      box.appendChild(G.el('div.pl-head', G.el('div.kicker', 'Luyện theo lỗi'), G.el('h1', 'Đúng ' + right + '/' + Q.length), G.el('p.small.faint', '+10 XP · luyện vài lần mỗi tuần, lỗi sẽ giảm dần')));
      var s = stats();
      box.appendChild(G.el('div.pl-skills', E.map(function (tag) {
        var t = s[tag] || { w: 0, r: 0 }, k = t.r + t.w ? t.r / (t.r + t.w) : 0;
        return G.el('div.pl-skill', G.el('span.pl-sk-name', D.tags[tag]),
          G.el('span.pl-bar', [1, 2, 3, 4, 5].map(function (j) { return G.el('i' + (k * 5 >= j - 0.5 ? '.on' : '')); })),
          G.el('b.pl-sk-lv', Math.round(k * 100) + '%'));
      })));
      box.appendChild(G.el('div.row', G.el('button.btn.seal', { onclick: function () { G.openPronPractice(cb, own ? null : host); } }, 'Luyện thêm 12 câu'),
        G.el('button.btn', { onclick: end }, 'Xong')));
    }
    next();
  };

  /* mở từ Sảnh: chưa bắt lỗi lần nào thì bắt lỗi trước (cần micro), rồi luyện */
  G.openPronFromLobby = function (cb) {
    var host = overlay();
    function practice() { G.openPronPractice(function () { closeOverlay(); if (cb) cb(); }, host); }
    if (G.S.phatAmKiem || !micReady()) { practice(); return; }
    G.pronCheck(host, function (kq) {
      if (!kq) { practice(); return; }
      var box = frame(host), det = {};
      kq.loi.forEach(function (x) { det[x.tag] = x.heard; });
      box.appendChild(G.pronCard(practice, det));
      box.appendChild(G.el('button.btn', { onclick: function () { closeOverlay(); if (cb) cb(); } }, 'Để sau'));
    });
  };
})();
