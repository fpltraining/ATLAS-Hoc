/* Khu đời sống: hội thoại thực tế với người bán, bác sĩ… (tiếng Anh).
   Mỗi nơi 3 tình huống × 5 lượt. Người chơi chọn câu đáp; sai thì người kia hỏi lại và Kai gợi ý.
   Xong một tình huống lần đầu +20 XP (làm lại +5). Xong cả 3 tình huống thì nhận đồ kỷ niệm. */
var G = window.G || (window.G = {});

(function () {
  var panel, body, L = null, id = '';

  function name() { return G.playerName(); }
  function fill(t) { return t.replace(/\{name\}/g, name()); }
  function npc() { return G.NPCS[L.npc]; }
  function state() { var d = G.S.doiSong[id] || (G.S.doiSong[id] = { xong: {}, kyNiem: '' }); return d; }

  function speak(t) { return G.el('button.speak', { 'aria-label': 'Nghe', onclick: function (e) { e.stopPropagation(); G.say(t, L.lang); } }, '🔊'); }
  function npcLine(text, vi) {
    var n = npc(), pic = G.el('div.tpic');
    pic.appendChild(G.imgEl(n.img.replace('.png', '_talk.png'), 'tpic-img', n.img));
    return G.el('div.tline', pic, G.el('div.tbubble', G.el('b', n.name), G.el('div.en', text), vi ? G.el('div.small.faint', vi) : null, speak(text)));
  }
  function meLine(text) {
    return G.el('div.tline.me', G.el('div.tbubble.mine', G.el('b', name()), G.el('div.en', text)), G.el('div.tpic', G.playerPic(56, 'tpic-img')));
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
    body.appendChild(G.el('div.souv-row', G.imgEl(L.souvenir.img, 'souv-img'),
      G.el('div', G.el('b', 'Đồ kỷ niệm: ' + L.souvenir.name), G.el('div.small.faint', st.kyNiem ? 'Đã nhận, bày ở Ngôi nhà chung.' : 'Xong cả 3 tình huống để nhận (' + n + '/3).'))));
  }

  function talk(ti) {
    var t = L.talks[ti], k = 0, log = G.el('div.chatlog'), box = G.el('div.chatopts');
    body.innerHTML = '';
    body.appendChild(G.el('div.lhead', G.el('div.lsub', t.title + ' · nghe rồi chọn câu đáp đúng')));
    body.appendChild(log); body.appendChild(box);
    function turn() {
      if (k >= t.turns.length) { finish(ti); return; }
      var tu = t.turns[k], said = fill(tu.npc), right = fill(tu.ok);
      log.appendChild(npcLine(said, tu.vi));
      G.say(said, L.lang);
      box.innerHTML = '';
      box.appendChild(G.el('div.opts', G.shuffle([right].concat(distractors(right, 2))).map(function (o) {
        return G.el('button.opt', { onclick: function (e) {
          if (o === right) {
            G.sfx('right'); box.innerHTML = '';
            log.appendChild(meLine(o)); G.say(o, L.lang);
            k++; setTimeout(function () { turn(); scrollEnd(); }, 1100);
          } else {
            e.currentTarget.className = 'opt no'; G.sfx('wrong');
            G.kaiSay('Chưa hợp. ' + npc().name + ' vừa nói: "' + tu.vi + '". Chọn câu trả lời đúng ý đó nhé.');
          }
          scrollEnd();
        } }, o);
      })));
      scrollEnd();
    }
    turn();
  }
  function scrollEnd() { body.scrollTop = body.scrollHeight; }

  function finish(ti) {
    var st = state(), first = !st.xong[ti];
    st.xong[ti] = G.vnNow();
    G.addXp(first ? 20 : 5); G.updateHud(); G.sfx('done');
    var all = true; for (var i = 0; i < L.talks.length; i++) if (!st.xong[i]) all = false;
    var gift = all && !st.kyNiem;
    if (gift) st.kyNiem = G.vnNow();
    G.save();
    body.appendChild(G.el('div.result.pass', G.el('b', 'Xong: ' + L.talks[ti].title), G.el('div', '+' + (first ? 20 : 5) + ' XP')));
    if (gift) {
      G.confetti();
      body.appendChild(G.el('div.souv-gift', G.imgEl(L.souvenir.img, 'souv-big'),
        G.el('b', '🎁 Nhận đồ kỷ niệm: ' + L.souvenir.name), G.el('div.small', 'Đã bày ở Ngôi nhà chung.')));
    }
    body.appendChild(G.el('div.row', G.el('button.btn', { onclick: home }, '‹ Các tình huống'),
      G.el('button.btn.seal', { onclick: function () { G.closeLesson(); G.kaiSay(gift ? 'Bạn nhận được ' + L.souvenir.name + '!' : 'Nói chuyện giỏi lắm!'); } }, 'Xong ›')));
    scrollEnd();
  }

  /* đồ kỷ niệm đã nhận, cho Ngôi nhà chung */
  G.souvenirs = function () {
    var out = [];
    for (var k in G.LIFE) if (G.LIFE.hasOwnProperty(k)) out.push({ id: k, place: G.LIFE[k].title, item: G.LIFE[k].souvenir, got: !!(G.S.doiSong[k] && G.S.doiSong[k].kyNiem) });
    return out;
  };
})();
