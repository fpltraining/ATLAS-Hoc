/* Bắt lỗi câu (B1–B2): mỗi lượt 10 câu, mỗi câu có đúng một chỗ sai. Chạm vào phần sai → xem câu đúng, nghe, đọc lời giải thích.
   Câu đúng vào kho ôn (G.srsAdd) để nói lại sau. Ưu tiên câu chưa làm đúng; Tầng 4 nghiêng về B2. Lưu G.S.batLoi[i] = số lần chọn đúng. */
var G = window.G || (window.G = {});

(function () {
  var ROUND = 10;
  function panelOpen(title) {
    var panel = document.getElementById('panel'); panel.className = 'panel open';
    G.setTitle(title);
    var pb = document.getElementById('panel-py'); if (pb) pb.style.display = 'none';
    var body = document.getElementById('panel-body'); body.innerHTML = ''; body.className = 'panel-body'; body.scrollTop = 0;
    G.viewIn(body);
    return body;
  }
  function store() { G.S.batLoi = G.S.batLoi || {}; return G.S.batLoi; }
  G.fixStats = function () {
    var L = G.FIX_EN || [], s = store(), ok = 0;
    for (var i = 0; i < L.length; i++) if (s[i]) ok++;
    return { ok: ok, all: L.length };
  };
  function pick() {
    var L = G.FIX_EN || [], s = store(), b2 = (G.enFloorNow ? G.enFloorNow() : 3) >= 4, a = [], i;
    for (i = 0; i < L.length; i++) a.push(i);
    a = G.shuffle(a);
    // chưa làm đúng lên trước; tầng 4 thì B2 trước, còn lại B1 trước
    a.sort(function (x, y) {
      var dx = (s[x] ? 2 : 0) + ((L[x][5] === 'B2') === b2 ? 0 : 1), dy = (s[y] ? 2 : 0) + ((L[y][5] === 'B2') === b2 ? 0 : 1);
      return dx - dy;
    });
    return a.slice(0, ROUND);
  }
  G.openFix = function () {
    var L = G.FIX_EN; if (!L || !L.length) return;
    var q = pick(), k = 0, got = 0;
    (function one() {
      var body = panelOpen('Bắt lỗi câu · ' + Math.min(k + 1, q.length) + '/' + q.length);
      if (k >= q.length) { done(body); return; }
      var x = L[q[k]], parts = x[0].split('|'), answered = false, fixed = G.fixSentence(x);
      body.appendChild(G.el('div.tp-prog', G.el('i', { style: { transform: 'scaleX(' + (k / q.length) + ')' } })));
      body.appendChild(G.el('div.small.faint', 'Câu này có đúng một chỗ sai (' + x[5] + '). Chạm vào phần sai.'));
      var row = G.el('div.fx-row'), btns = [];
      parts.forEach(function (p, i) {
        var b = G.el('button.fx-ch', { onclick: function () {
          if (answered) return; answered = true;
          var ok = i === x[1];
          b.classList.add(ok ? 'ok' : 'no');
          if (!ok) btns[x[1]].classList.add('was');
          if (ok) { got++; store()[q[k]] = (store()[q[k]] || 0) + 1; G.save(); }
          G.sfx(ok ? 'right' : 'wrong');
          if (G.srsAdd) G.srsAdd({ t: 'item', en: fixed, vi: x[3] });
          show(ok);
        } }, p);
        btns.push(b); row.appendChild(b);
      });
      body.appendChild(G.el('div.wcard.fx-card', row));
      var after = G.el('div.fx-after');
      body.appendChild(after);
      G.enter(row.children, { gap: 50, y: 6, dur: 300 });
      function show(ok) {
        after.appendChild(G.el('div.fx-res.' + (ok ? 'ok' : 'no'), ok ? 'Đúng, chỗ sai ở đây.' : 'Chưa đúng. Chỗ sai là: "' + parts[x[1]] + '".'));
        after.appendChild(G.el('div.wcard.fx-good',
          G.el('div.small.faint', 'Câu đúng:'),
          G.el('div.wbig.sm', fixed, G.sayBtns(fixed, 'en')),
          G.el('div.faint', x[3]),
          G.el('div.fx-why', G.el('b', 'Vì sao: '), x[4]),
          G.shadowBtn ? G.shadowBtn(fixed) : null));
        after.appendChild(G.el('div.row', G.el('button.btn.seal', { onclick: function () { k++; one(); } }, k + 1 < q.length ? 'Câu tiếp ›' : 'Xem kết quả ›')));
        G.say(fixed, 'en');
      }
    })();
    function done(body) {
      G.markStudy(); G.addXp(5 + got); G.sfx('done');
      if (G.track) G.track('bat_loi', { n: q.length, dung: got });
      var st = G.fixStats(), n = G.el('b', '0');
      body.appendChild(G.el('div.result.pass.tp-res',
        G.el('div.tp-num', n, G.el('span', '/' + q.length + ' chỗ sai tìm đúng')),
        G.el('div', '+' + (5 + got) + ' XP · đã nắm ' + st.ok + '/' + st.all + ' lỗi hay gặp'),
        G.el('div.small.faint', 'Các câu đúng vừa xem đã vào kho ôn. Mai ôn lại bằng cách nói to cả câu.')));
      G.countUp(n, 0, got, { dur: 600 });
      body.appendChild(G.el('div.row',
        G.el('button.btn', { onclick: G.closeLesson }, 'Xong'),
        G.el('button.btn.seal', { onclick: G.openFix }, 'Thêm 10 câu ›')));
    }
  };
})();
