/* Lễ tốt nghiệp: lưu bằng (giờ Việt Nam), +100 XP, màn trao bằng có hiệu trưởng Kai. */
var G = window.G || (window.G = {});

(function () {
  var SCHOOL = { en: 'Trường Anh ngữ Brightford', zh: 'Học viện Hán ngữ Trường Lạc' };

  G.graduate = function (lang, level, right, total) {
    G.S.totNghiep[lang] = G.S.totNghiep[lang] || {};
    G.S.totNghiep[lang][level] = { diem: right, tong: total, luc: G.vnNow() };
    G.addXp(100);
    G.updateHud();
    G.sfx('done');
    G.confetti();
    setTimeout(G.confetti, 900);
    var name = G.playerName();
    var speech = 'Congratulations, ' + name + '! You have finished level ' + level + '.';
    G.say(speech, 'en');
    var wrap = G.el('div.modal.grad',
      G.el('div.grad-card',
        G.el('div.kicker', 'Lễ tốt nghiệp'),
        G.el('h2', '🎓 Tốt nghiệp cấp ' + level),
        G.el('div.diploma',
          G.imgEl('diploma_' + lang + '.png', 'dip-img'),
          G.el('div.dip-text',
            G.el('div.dip-school', SCHOOL[lang] || ''),
            G.el('div.dip-title', 'BẰNG TỐT NGHIỆP CẤP ' + level),
            G.el('div.dip-name', name),
            G.el('div.dip-meta', 'Điểm thi ' + right + '/' + total + ' · ' + G.S.totNghiep[lang][level].luc.slice(0, 10).split('-').reverse().join('/'))
          )
        ),
        G.el('div.grad-talk', G.imgEl('kai_follow.png', 'grad-kai'),
          G.el('div', G.el('b', 'Hiệu trưởng Kai'), G.el('div.en', speech), G.el('div.small.faint', 'Chúc mừng ' + name + '! Bạn đã hoàn thành cấp ' + level + '.'))),
        G.el('div.grad-xp', '+100 XP'),
        G.el('button.btn.seal.big1', { onclick: function () {
          document.body.removeChild(wrap);
          G.kaiSay('Bằng ' + level + ' đã lưu trong hồ sơ ở Ngôi nhà chung. Cấp tiếp theo sẽ mở ở bản cập nhật sau!');
        } }, 'Nhận bằng ›')
      )
    );
    document.body.appendChild(wrap);
  };

  /* danh sách bằng đã có, để hiện ở Ngôi nhà chung */
  G.diplomas = function () {
    var out = [], t = G.S.totNghiep || {};
    for (var lang in t) if (t.hasOwnProperty(lang)) for (var lv in t[lang]) if (t[lang].hasOwnProperty(lv)) out.push({ lang: lang, level: lv, info: t[lang][lv] });
    return out;
  };
})();
