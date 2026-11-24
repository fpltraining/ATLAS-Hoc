/* Khu đời sống: hội thoại thực tế với người bán, bác sĩ… (tiếng Anh).
   Mỗi nơi 3 tình huống × 5 lượt. Người chơi chọn câu đáp; sai thì người kia hỏi lại và Kai gợi ý.
   Xong một tình huống lần đầu +20 XP (làm lại +5). Xong cả 3 tình huống thì nhận đồ kỷ niệm. */
var G = window.G || (window.G = {});

(function () {
  var panel, body, L = null, id = '', lastHidden = null;

  function name() { return G.playerName(); }
  function fill(t) { return t.replace(/\{name\}/g, name()); }
  function npc() { return G.NPCS[L.npc]; }
  function state() { var d = G.S.doiSong[id] || (G.S.doiSong[id] = { xong: {}, kyNiem: '' }); return d; }

  function speak(t) { return G.sayBtns(t, L.lang); }
  function npcLine(text, vi) {
    var n = npc(), pic = G.el('div.tpic');
    if (n.img) pic.appendChild(G.imgEl(n.img.replace('.png', '_talk.png'), 'tpic-img', n.img));   // có ảnh riêng thì dùng ảnh
    else if (n.av) pic.appendChild(G.avatarCanvas(n.av, 56, 'down', 'tpic-img'));   // chưa có: ghép từ lớp hình
    var hide = G.S.caiDat && G.S.caiDat.chiNgheNoi && vi;   // chế độ chỉ nghe: ẩn chữ, đáp xong mới hiện
    var bub = G.el('div.tbubble' + (hide ? '.hidetext' : ''), G.el('b', n.name), hide ? G.el('div.small.listen-tag', G.ic3('headphone', 'ic3-s'), ' Nghe rồi chọn câu đáp') : null, G.el('div.en', text), vi ? G.el('div.small.faint', vi) : null, speak(text));
    if (hide) lastHidden = bub;
    return G.el('div.tline', pic, bub);
  }
  /* nghĩa tiếng Việt của câu người học nói (G.OK_VI, khoá giữ {name}) */
  function okVi(text) {
    var M = G.OK_VI || {}, v = M[text] || M[text.split(name()).join('{name}')];
    return v ? fill(v) : '';
  }
  /* hiện nghĩa dưới các lựa chọn: người mới (bài đầu vào dưới A1 hoặc chưa làm) mặc định bật, chỉnh được */
  function showOptVi() {
    var cd = G.S.caiDat || {};
    if (cd.nghiaDapAn !== undefined) return !!cd.nghiaDapAn;
    return !G.S.dauVao || G.S.dauVao.lv <= 1;
  }
  function meLine(text, sc) {
    var vi = okVi(text);
    return G.el('div.tline.me', G.el('div.tbubble.mine', G.el('b', name()), G.el('div.en', text), vi ? G.el('div.small.faint', vi) : null,
      sc !== null && sc !== undefined ? G.el('span.mk-chip.' + G.scoreLabel(sc)[1], G.ic3('mic', 'ic3-s'), ' ' + sc + '/100') : null), G.el('div.tpic', G.playerPic(56, 'tpic-img')));
  }

  /* câu sai: lấy câu đáp của các nơi khác cùng ngôn ngữ */
  function distractors(right, n) {
    var pool = [];
    for (var k in G.LIFE) {
      if (!G.LIFE.hasOwnProperty(k) || k === id || G.LIFE[k].lang !== L.lang) continue;
      var ts = G.LIFE[k].talks;
      for (var i = 0; i < ts.length; i++) for (var j = 0; j < ts[i].turns.length; j++) {
        var o = fill(ts[i].turns[j].ok);
        if (o !== right && pool.indexOf(o) < 0) pool.push(o);
      }
    }
    return G.shuffle(pool).slice(0, n);
  }

  G.openLife = function (placeId) {
    id = placeId; L = G.LIFE[id];
    panel = document.getElementById('panel'); body = document.getElementById('panel-body');
    panel.className = 'panel open';
    document.getElementById('panel-title').textContent = L.title;
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    G.markStudy();
    home();
  };

  function home() {
    var st = state(), n = 0;
    body.innerHTML = '';
    body.appendChild(npcLine(fill(L.talks[0].turns[0].npc), 'Chọn một tình huống để bắt đầu nói chuyện.'));
    body.appendChild(G.el('div.menu3', L.talks.map(function (t, i) {
      var done = !!st.xong[i]; if (done) n++;
      return G.el('button.big' + (done ? '.done' : ''), { onclick: function () { talk(i); } },
        G.el('b', (done ? '✓ ' : (i + 1) + ' · ') + t.title), G.el('span', t.turns.length + ' lượt nói' + (done ? ' · đã xong, làm lại +5 XP' : ' · +20 XP')));
    })));
    // nói tự do ở nơi này + chế độ chỉ nghe
    var fr = G.freeFor ? G.freeFor(id) : [];
    if (fr.length) body.appendChild(G.el('button.big.bic.fr-btn', { onclick: function () { G.openFree(fr, 'Nói tự do · ' + L.title, function () { G.openLife(id); }); } },
      G.bigIc('speak', 'Tự nói (không có câu gợi ý)'), G.el('span', fr.length + ' tình huống · tự trả lời bằng câu của bạn')));
    var cd = G.S.caiDat || (G.S.caiDat = {});
    // hai chế độ dạng nút gạt (mẫu "toggles" của taste-skill)
    body.appendChild(G.el('div.tg-list.lf-mode',
      G.switchRow('headphone', 'Chỉ nghe, ẩn chữ', 'Nghe người kia nói rồi chọn câu đáp, nói xong mới hiện chữ', !!cd.chiNgheNoi, function (on) { cd.chiNgheNoi = on; G.save(); }),
      G.switchRow('book', 'Hiện nghĩa tiếng Việt dưới câu đáp', 'Tắt để tự hiểu câu tiếng Anh', showOptVi(), function (on) { cd.nghiaDapAn = on; G.save(); })));
    if (L.souvenir) body.appendChild(G.el('div.souv-row', G.imgEl(L.souvenir.img, 'souv-img'),
      G.el('div', G.el('b', 'Đồ kỷ niệm: ' + L.souvenir.name), G.el('div.small.faint', st.kyNiem ? 'Đã nhận, bày ở Ngôi nhà chung.' : 'Xong cả 3 tình huống để nhận (' + n + '/3).'))));
  }

  function talk(ti) {
    var t = L.talks[ti], k = 0, log = G.el('div.chatlog'), box = G.el('div.chatopts'), scores = [];
    body.innerHTML = '';
    body.appendChild(G.el('div.lhead', G.el('div.lsub', t.title + ' · nghe, chọn câu đáp đúng rồi nói thành tiếng')));
    body.appendChild(log); body.appendChild(box);
    function turn() {
      if (k >= t.turns.length) { finish(ti, scores); return; }
      var tu = t.turns[k], said = fill(tu.npc), right = fill(tu.ok);
      log.appendChild(npcLine(said, tu.vi));
      G.say(said, L.lang);
      box.innerHTML = '';
      var ov = showOptVi();
      box.appendChild(G.el('div.opts', G.shuffle([right].concat(distractors(right, 2))).map(function (o) {
        var ovi = ov ? okVi(o) : '';
        return G.el('button.opt' + (ovi ? '.opt-vi' : ''), { onclick: function (e) {
          if (o === right) {
            G.sfx('right'); box.innerHTML = '';
            if (lastHidden) { lastHidden.className = 'tbubble'; lastHidden = null; }
            // chọn đúng rồi thì nói câu đó thành tiếng (có micro thì chấm điểm 0–100)
            box.appendChild(G.el('div.small.faint', 'Giờ hãy nói câu này với ' + npc().name + ':'));
            box.appendChild(G.speakCard({ text: o, vi: okVi(o), lang: L.lang, onDone: function (sc) {
              if (sc !== null) { scores.push(sc); G.logSpeak(sc); }
              box.innerHTML = '';
              log.appendChild(meLine(o, sc));
              k++; setTimeout(function () { turn(); scrollEnd(); }, 700);
            } }));
          } else {
            e.currentTarget.className = 'opt no' + (ovi ? ' opt-vi' : ''); G.sfx('wrong');
            G.kaiSay('Chưa hợp. ' + npc().name + ' vừa nói: "' + tu.vi + '". Chọn câu trả lời đúng ý đó nhé.');
          }
          scrollEnd();
        } }, ovi ? [G.el('span', o), G.el('small', ovi)] : o);
      })));
      scrollEnd();
    }
    turn();
  }
  function scrollEnd() { body.scrollTop = body.scrollHeight; }

  function finish(ti, scores) {
    var st = state(), first = !st.xong[ti];
    st.xong[ti] = G.vnNow();
    G.markTask('noi');
    G.addXp(first ? 20 : 5); G.updateHud(); G.sfx('done');
    var all = true; for (var i = 0; i < L.talks.length; i++) if (!st.xong[i]) all = false;
    var gift = all && !st.kyNiem && !!L.souvenir;
    var td = G.today();
    td.sang = td.sang || {}; td.sang[id] = G.vnNow().slice(11, 16);   // đã gặp hôm nay (tắt bong bóng 💬)
    // ghi vào tiến độ hôm nay: nơi, tình huống, giờ, điểm nói trung bình
    var avg0 = null; if (scores && scores.length) { var s0 = 0; for (var q = 0; q < scores.length; q++) s0 += scores[q]; avg0 = Math.round(s0 / scores.length); }
    if (G.srsAddTalk && L.lang === 'en') G.srsAddTalk(id, ti);
    st.diem = st.diem || {}; if (avg0 !== null && (st.diem[ti] === undefined || avg0 > st.diem[ti])) st.diem[ti] = avg0;
    td.hoiThoai = td.hoiThoai || [];
    td.hoiThoai.push({ noi: id, ten: L.title, tinhHuong: L.talks[ti].title, luc: G.vnNow().slice(11, 16), diem: avg0 });
    if (gift) st.kyNiem = G.vnNow();
    G.save();
    var avg = null;
    if (scores && scores.length) { var sum = 0; for (var si = 0; si < scores.length; si++) sum += scores[si]; avg = Math.round(sum / scores.length); }
    body.appendChild(G.el('div.result.pass', G.el('b', 'Xong: ' + L.talks[ti].title), G.el('div', '+' + (first ? 20 : 5) + ' XP'),
      avg !== null ? G.el('div', 'Điểm nói trung bình: ' + avg + '/100 · ' + G.scoreLabel(avg)[0]) : null));
    if (gift) {
      G.confetti();
      body.appendChild(G.el('div.souv-gift', G.imgEl(L.souvenir.img, 'souv-big'),
        G.el('b', 'Nhận đồ kỷ niệm: ' + L.souvenir.name), G.el('div.small', 'Đã bày ở Ngôi nhà chung.')));
    }
    body.appendChild(G.el('div.row', G.el('button.btn', { onclick: home }, '‹ Các tình huống'),
      G.el('button.btn.seal', { onclick: function () { G.closeLesson(); G.kaiSay(gift ? 'Bạn nhận được ' + L.souvenir.name + '!' : 'Nói chuyện giỏi lắm!'); } }, 'Xong ›')));
    scrollEnd();
  }

  /* đồ kỷ niệm đã nhận, cho Ngôi nhà chung */
  G.souvenirs = function () {
    var out = [];
    for (var k in G.LIFE) if (G.LIFE.hasOwnProperty(k) && G.LIFE[k].souvenir) out.push({ id: k, place: G.LIFE[k].title, item: G.LIFE[k].souvenir, got: !!(G.S.doiSong[k] && G.S.doiSong[k].kyNiem) });
    return out;
  };
})();
