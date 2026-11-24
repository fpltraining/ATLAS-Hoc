/* Bài thi Tốt nghiệp ConnectLife (data/final_en.js): đầu ra giao tiếp, mở khi có Chứng chỉ Tầng 4 · B1 – B2.
   3 phần thi riêng, phần nào đạt thì giữ, chỉ thi lại phần chưa đạt; đạt đủ 3 phần là Tốt nghiệp ConnectLife.
   Kết quả lưu ở G.S.thiCL (điểm tốt nhất từng phần) và G.S.totNghiepCL (bằng tốt nghiệp), giờ Việt Nam. */
var G = window.G || (window.G = {});

(function () {
  var F = function () { return G.FINAL_EN; };
  function st() { G.S.thiCL = G.S.thiCL || {}; return G.S.thiCL; }
  function panel(title) {
    var p = document.getElementById('panel'); p.className = 'panel open';
    G.setTitle(title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var b = document.getElementById('panel-body'); b.innerHTML = ''; b.scrollTop = 0; return b;
  }
  function npcLine(id, en, vi) {
    var n = G.NPCS[id] || {}, pic = G.el('div.tpic');
    if (n.img) pic.appendChild(G.imgEl(n.img.replace('.png', '_talk.png'), 'tpic-img', n.img));
    return G.el('div.tline', pic, G.el('div.tbubble', G.el('b', n.name || ''), G.el('div.en', en), vi ? G.el('div.small.faint', vi) : null, G.sayBtns(en, 'en')));
  }
  function kaiLine(vi, en) {
    return G.el('div.tline', G.el('div.tpic', G.imgEl('kai_follow.png', 'tpic-img')), G.el('div.tbubble', G.el('b', 'Hiệu trưởng Kai'), G.el('div', vi), en ? G.sayBtns(en, 'en') : null));
  }
  function words(t) { return G.words(t).length; }

  G.finalUnlocked = function () { var t = G.S.totNghiep && G.S.totNghiep.en; return !!(t && t['B1 – B2']); };
  G.finalDone = function () { return !!G.S.totNghiepCL; };
  function passed() {
    var s = st(), P = F().pass;
    return { nghe: (s.nghe || 0) >= P.nghe, xuly: (s.xuly || 0) >= P.xuly, tro: (s.tro || 0) >= P.tro && (s.troTu || 0) >= P.tu };
  }

  /* ---------- màn chính: 3 phần thi ---------- */
  G.openFinalExam = function () {
    if (!G.finalUnlocked()) { G.sfx('wrong'); G.toast('Bài thi Tốt nghiệp ConnectLife mở khi bạn có Chứng chỉ Tầng 4 · B1 – B2.'); return; }
    var b = panel('Thi Tốt nghiệp ConnectLife'), s = st(), ok = passed(), P = F().pass;
    b.appendChild(kaiLine('Đây là bài thi đầu ra của ConnectLife: chứng minh bạn giao tiếp được thật. 3 phần, phần nào đạt thì giữ lại, chỉ cần thi lại phần chưa đạt. Đạt đủ 3 phần là Tốt nghiệp ConnectLife.', F().intro));
    function part(key, icon, name, desc, best, fn) {
      return G.el('button.big' + (ok[key] ? '.done' : ''), { onclick: fn },
        G.el('b', G.ic3(ok[key] ? 'check' : icon, 'ic3-s'), ' ' + name), G.el('span', desc + (best !== undefined ? ' · tốt nhất ' + best : '')));
    }
    b.appendChild(G.el('div.menu3',
      part('nghe', 'headphone', 'Phần 1 · Nghe hội thoại thật', '3 hội thoại tốc độ thật, không hiện chữ, nghe tối đa 2 lần · đạt từ ' + P.nghe + '/10', s.nghe !== undefined ? s.nghe + '/10' : undefined, listenPart),
      part('xuly', 'sos', 'Phần 2 · Tự xử lý tình huống', '5 tình huống, không có câu gợi ý · trung bình từ ' + P.xuly + '/100', s.xuly !== undefined ? s.xuly + '/100' : undefined, handlePart),
      part('tro', 'coffee', 'Phần 3 · Trò chuyện với người lạ', '8 lượt, khoảng 5 phút · trung bình từ ' + P.tro + '/100 và nói tổng cộng từ ' + P.tu + ' từ', s.tro !== undefined ? s.tro + '/100, ' + (s.troTu || 0) + ' từ' : undefined, talkPart)));
    if (G.finalDone()) b.appendChild(G.el('div.result.pass', G.el('b', G.ic3('grad', 'ic3-s'), ' Bạn đã Tốt nghiệp ConnectLife'), G.el('div.small', 'Ngày ' + G.S.totNghiepCL.luc.slice(0, 10).split('-').reverse().join('/') + '. Thi lại để luyện thì kết quả tốt nhất vẫn được giữ.')));
    else if (ok.nghe && ok.xuly && ok.tro) b.appendChild(G.el('button.btn.seal.big1', { onclick: graduate }, 'Nhận bằng Tốt nghiệp ConnectLife ›'));
  };
  function back(b, msg, pass, extra) {
    b.appendChild(G.el('div.result' + (pass ? '.pass' : ''), G.el('div.rscore', msg), G.playerPic(112, 'rface', pass ? 'happy' : 'think'), extra ? G.el('div', extra) : null));
    var p = passed(), all = p.nghe && p.xuly && p.tro && !G.finalDone();
    b.appendChild(G.el('div.row', G.el('button.btn', { onclick: G.openFinalExam }, '‹ Các phần thi'),
      all ? G.el('button.btn.seal', { onclick: graduate }, 'Nhận bằng tốt nghiệp ›') : G.el('button.btn.seal', { onclick: G.openFinalExam }, 'Tiếp ›')));
    G.sfx(pass ? 'done' : 'wrong'); if (pass) G.confetti();
  }

  /* ---------- Phần 1 · Nghe: phát lần lượt từng câu bằng một trình phát (iPhone chỉ cho phát sau khi chạm) ---------- */
  var seq = null;
  function playLines(lines, onLine, onDone) {
    if (!seq) seq = new Audio();
    var i = 0, gone = false;
    function next() {
      if (gone) return;
      if (i >= lines.length) { onDone(); return; }
      var t = lines[i][2], u = G.audioUrl(t, 'en'); onLine(i); i++;
      if (u) { seq.onended = function () { setTimeout(next, 380); }; seq.onerror = function () { setTimeout(next, 200); }; seq.src = u; var pr = seq.play(); if (pr && pr.catch) pr.catch(function () { setTimeout(next, 200); }); }
      else if (window.speechSynthesis) { var ut = new SpeechSynthesisUtterance(t); ut.lang = 'en-US'; ut.rate = 1; ut.onend = function () { setTimeout(next, 380); }; speechSynthesis.speak(ut); }
      else setTimeout(next, 1500);
    }
    next();
    return function stop() { gone = true; try { seq.pause(); } catch (e) { /* bỏ qua */ } };
  }
  function listenPart() {
    var D = F().listen, d = 0, right = 0, qn = 0, total = 0;
    D.forEach(function (x) { total += x.qs.length; });
    (function dialog() {
      if (d >= D.length) {
        var s = st(); s.nghe = Math.max(s.nghe || 0, right); s.ngheLuc = G.vnNow(); G.save();
        var b0 = panel('Phần 1 · Nghe'); back(b0, right + '/' + total, right >= F().pass.nghe, right >= F().pass.nghe ? 'Đạt! Bạn nghe hiểu hội thoại tốc độ thật.' : 'Chưa đạt ' + F().pass.nghe + '/' + total + '. Luyện nghe ở các tiệm và Kiểm tra tuần rồi thi lại nhé.');
        return;
      }
      var X = D[d], heard = 0, stop = null;
      var b = panel('Phần 1 · Nghe · hội thoại ' + (d + 1) + '/' + D.length);
      b.appendChild(G.el('div.fr-sit', G.el('b', G.ic3('target', 'ic3-s'), ' ' + X.title), G.el('div', X.sit), G.el('div.small.faint', 'Không hiện chữ. Nghe tối đa 2 lần, rồi trả lời ' + X.qs.length + ' câu hỏi.')));
      var status = G.el('div.fl-listen', G.ic3('headphone', 'ic3-s'), ' Bấm để nghe');
      var playBtn = G.el('button.btn.seal.big1', { onclick: function () {
        if (heard >= 2) return; heard++; playBtn.disabled = true; playBtn.textContent = 'Đang phát… (lần ' + heard + '/2)';
        stop = playLines(X.lines, function (i) { status.textContent = 'Câu ' + (i + 1) + '/' + X.lines.length; }, function () {
          status.textContent = heard < 2 ? 'Nghe xong lần ' + heard + '. Nghe lại hoặc trả lời câu hỏi.' : 'Đã nghe 2 lần. Trả lời câu hỏi nhé.';
          playBtn.disabled = heard >= 2; playBtn.textContent = heard < 2 ? 'Nghe lần 2' : 'Đã nghe 2 lần'; ask.style.display = '';
        });
      } }, '▶ Nghe hội thoại (lần 1/2)');
      var ask = G.el('button.btn', { style: { display: 'none' }, onclick: function () { if (stop) stop(); questions(); } }, 'Trả lời câu hỏi ›');
      b.appendChild(G.el('div.fl-play', status, playBtn, ask));
      function questions() {
        var k = 0;
        (function q() {
          if (k >= X.qs.length) { d++; dialog(); return; }
          var Q = X.qs[k], bb = panel('Phần 1 · câu ' + (qn + 1) + '/' + total);
          bb.appendChild(G.el('div.qbox', G.el('div.qtext', Q.q), G.el('div.small.faint', Q.vi)));
          var opts = G.el('div.opts'), done = false;
          Q.opts.forEach(function (o, oi) {
            opts.appendChild(G.el('button.opt', { onclick: function (e) {
              if (done) return; done = true; var good = oi === Q.a;
              e.currentTarget.className = 'opt ' + (good ? 'ok' : 'no');
              if (!good) opts.children[Q.a].className = 'opt ok';
              if (good) right++; qn++; G.sfx(good ? 'right' : 'wrong');
              setTimeout(function () { k++; q(); }, good ? 650 : 1300);
            } }, o));
          });
          bb.appendChild(opts);
        })();
      }
    })();
  }

  /* ---------- Phần 2 · Tự xử lý tình huống (không gợi ý trước khi trả lời) ---------- */
  function handlePart() {
    G.openFree(G.shuffle(F().handle), 'Phần 2 · Tự xử lý', null, function (avg) {
      var s = st(); s.xuly = Math.max(s.xuly || 0, avg); s.xulyLuc = G.vnNow(); G.save();
      var b = panel('Phần 2 · Tự xử lý');
      back(b, avg + '/100', avg >= F().pass.xuly, avg >= F().pass.xuly ? 'Đạt! Bạn tự xử lý được tình huống thật mà không cần gợi ý.' : 'Chưa đạt ' + F().pass.xuly + '/100. Mỗi tình huống nhớ nói đủ ý: chuyện gì, vì sao, bạn muốn gì.');
    });
  }

  /* ---------- Phần 3 · Trò chuyện với người lạ: trả lời dài, nói thêm được nhiều lần rồi mới gửi ---------- */
  function scoreLong(text, need, min) {
    var r = G.scoreFree(text, need), n = words(text);
    var sc = Math.round(r.score * 0.6 + Math.min(1, n / min) * 40);
    if (n < 6) sc = Math.min(sc, 30);
    return { score: sc, hit: r.hit, n: n };
  }
  function talkPart() {
    var T = F().talk, k = 0, sum = 0, tw = 0, t0 = Date.now(), MIN = 25;
    function clock() { var s = Math.floor((Date.now() - t0) / 1000); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
    (function turn() {
      if (k >= T.turns.length) {
        var avg = Math.round(sum / T.turns.length), s = st();
        if (avg > (s.tro || 0) || (avg === s.tro && tw > (s.troTu || 0))) { s.tro = avg; s.troTu = tw; }
        s.troLuc = G.vnNow(); G.save(); G.logSpeak(avg); G.markTask && G.markTask('noi');
        var ok = avg >= F().pass.tro && tw >= F().pass.tu;
        var b0 = panel('Phần 3 · Trò chuyện');
        back(b0, avg + '/100', ok, 'Bạn nói ' + tw + ' từ trong ' + clock() + '. ' + (ok ? 'Đạt! Bạn duy trì được một cuộc trò chuyện dài với người lạ.' : tw < F().pass.tu ? 'Cần nói dài hơn: tổng cộng từ ' + F().pass.tu + ' từ (mỗi lượt khoảng 3–4 câu).' : 'Chưa đạt ' + F().pass.tro + '/100. Trả lời đủ các ý người kia hỏi, thêm lý do và ví dụ.'));
        return;
      }
      var it = T.turns[k], b = panel('Phần 3 · lượt ' + (k + 1) + '/' + T.turns.length);
      b.appendChild(G.el('div.fl-meter', G.el('span', G.ic3('stopwatch', 'ic3-s'), ' ' + clock()), G.el('span', G.ic3('speak', 'ic3-s'), ' ' + tw + ' / ' + F().pass.tu + ' từ'), G.el('span', 'Mục tiêu: khoảng 5 phút')));
      if (k === 0) b.appendChild(G.el('div.fr-sit', G.el('b', G.ic3('target', 'ic3-s'), ' Tình huống'), G.el('div', T.sit)));
      b.appendChild(npcLine(T.npc, it.q, it.vi)); G.say(it.q, 'en');
      var input = G.el('textarea.fr-in', { rows: 4, placeholder: 'Nói (bấm micro, nói thêm được nhiều lần) hoặc gõ câu trả lời của bạn…' });
      var cnt = G.el('div.small.faint', '0 từ · nên nói từ ' + MIN + ' từ trở lên');
      input.oninput = function () { cnt.textContent = words(input.value) + ' từ · nên nói từ ' + MIN + ' từ trở lên'; };
      var box = G.el('div.fr-box');
      if (G.micOn()) {
        var mic = G.el('button.mk-mic', { onclick: function () {
          mic.className = 'mk-mic on';
          G.listen('en', function (err, alts) {
            mic.className = 'mk-mic';
            if (err || !alts || !alts[0]) { if (err) G.toast(err.msg || err); return; }
            input.value = (input.value ? input.value.replace(/\s+$/, '') + ' ' : '') + alts[0]; input.oninput();
          });
        } }, G.el('img.mk-mic-img', { src: G.assetUrl('ic_mic.png'), alt: '' }), G.el('span', 'Bấm rồi nói'));
        box.appendChild(G.el('div.mk-row', mic, G.el('div.small.faint', 'Nói xong một đoạn thì bấm lại để nói tiếp. Chữ nghe được hiện bên dưới, sửa được.')));
      }
      box.appendChild(input); box.appendChild(cnt);
      var res = G.el('div.fr-res');
      var send = G.el('button.btn.seal', { onclick: function () {
        var v = input.value.replace(/^\s+|\s+$/g, ''); if (!v) { G.toast('Nói hoặc gõ câu trả lời trước nhé'); return; }
        var r = scoreLong(v, it.need, MIN); sum += r.score; tw += r.n;
        G.S.tuNoi = G.S.tuNoi || {}; G.S.tuNoi[it.id] = Math.max(G.S.tuNoi[it.id] || 0, r.score); G.save();
        G.sfx(r.score >= 60 ? 'right' : 'wrong');
        send.style.display = 'none'; input.disabled = true;
        res.appendChild(G.el('div.mk-score.' + G.scoreLabel(r.score)[1], G.el('b', r.score), G.el('span', '/100')));
        res.appendChild(G.el('div.fr-ideas', it.need.map(function (g, i) { return G.el('span.' + (r.hit[i] ? 'w-ok' : 'w-miss'), (r.hit[i] ? '✓ ' : '✗ ') + g[0]); }), G.el('span', ' · ' + r.n + ' từ')));
        res.appendChild(G.el('div.row', G.el('span'), G.el('button.btn.seal', { onclick: function () { k++; turn(); } }, k < T.turns.length - 1 ? 'Lượt tiếp ›' : 'Xem kết quả ›')));
      } }, 'Gửi câu trả lời ›');
      box.appendChild(G.el('div.row', G.el('span'), send));
      b.appendChild(box); b.appendChild(res);
    })();
  }

  /* ---------- Lễ tốt nghiệp ConnectLife ---------- */
  function graduate() {
    if (G.finalDone()) { G.openFinalExam(); return; }
    var s = st(), name = G.playerName();
    G.S.totNghiepCL = { luc: G.vnNow(), nghe: s.nghe, xuly: s.xuly, tro: s.tro, tu: s.troTu };
    G.addXp(300); G.save(); G.updateHud && G.updateHud();
    if (G.closeLesson) G.closeLesson();
    G.sfx('done'); G.confetti(); setTimeout(G.confetti, 900); setTimeout(G.confetti, 1800);
    var speech = 'Congratulations, ' + name + '! You are now a ConnectLife graduate. You can really communicate in English!';
    G.say(speech, 'en');
    var wrap = G.el('div.modal.grad', G.el('div.grad-card',
      G.el('div.kicker', 'Lễ tốt nghiệp'),
      G.el('h2', G.ic3('grad', 'ic3-s'), ' Tốt nghiệp ConnectLife'),
      G.el('div.diploma', G.imgEl('diploma_en.png', 'dip-img'),
        G.el('div.dip-text',
          G.el('div.dip-school', 'Trường Anh ngữ Brightford'),
          G.el('div.dip-title', 'BẰNG TỐT NGHIỆP CONNECTLIFE · GIAO TIẾP TIẾNG ANH'),
          G.el('div.dip-name', name),
          G.el('div.dip-meta', 'Nghe ' + s.nghe + '/10 · Xử lý ' + s.xuly + '/100 · Trò chuyện ' + s.tro + '/100 · ' + G.S.totNghiepCL.luc.slice(0, 10).split('-').reverse().join('/')))),
      G.el('div.grad-talk', G.imgEl('kai_follow.png', 'grad-kai'),
        G.el('div', G.el('b', 'Hiệu trưởng Kai'), G.el('div.en', speech), G.el('div.small.faint', 'Chúc mừng ' + name + '! Bạn đã chứng minh mình giao tiếp được bằng tiếng Anh: nghe hiểu hội thoại thật, tự xử lý tình huống và trò chuyện với người lạ.'))),
      G.el('div.grad-xp', '+300 XP'),
      G.el('button.btn.seal.big1', { onclick: function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); G.kaiSay('Bạn đã Tốt nghiệp ConnectLife! Bằng đã lưu trong hồ sơ. Cứ dạo phố, nói chuyện và ôn mỗi ngày để giữ phong độ nhé.'); if (document.getElementById('lobby').style.display !== 'none') G.renderLobby(); } }, 'Nhận bằng ›')));
    document.body.appendChild(wrap);
  }
  G.finalGraduate = graduate;
})();
