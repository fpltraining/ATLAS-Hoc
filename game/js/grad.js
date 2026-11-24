/* Chứng chỉ ConnectLife từng tầng (giờ Việt Nam), +100 XP, màn trao chứng chỉ có hiệu trưởng Kai.
   Không gọi là tốt nghiệp: "Tốt nghiệp ConnectLife" chỉ dành cho người qua bài thi đầu ra giao tiếp ở cuối lộ trình.
   (Dữ liệu vẫn lưu ở G.S.totNghiep để không mất tiến độ cũ.) */
var G = window.G || (window.G = {});

(function () {
  var SCHOOL = { en: 'Trường Anh ngữ Brightford', zh: 'Học viện Hán ngữ Trường Lạc' };

  /* levelEn: tên cấp đọc bằng tiếng Anh trong lời chúc (vd. 'the Foundation level' cho Nền tảng) */
  G.graduate = function (lang, level, right, total, levelEn, noi) {
    G.S.totNghiep[lang] = G.S.totNghiep[lang] || {};
    G.S.totNghiep[lang][level] = { diem: right, tong: total, noi: noi === undefined ? null : noi, luc: G.vnNow() };
    G.addXp(100);
    G.updateHud();
    G.sfx('done');
    G.confetti();
    setTimeout(G.confetti, 900);
    var name = G.playerName();
    var speech = 'Congrats, ' + name + '! You\'ve earned your ConnectLife certificate for ' + (levelEn || level) + '. So proud of you!';
    // tốt nghiệp Nền tảng: lên Tầng 2 · A1
    var after = 'Chứng chỉ ' + level + ' đã lưu trong hồ sơ ở Ngôi nhà chung. Cấp tiếp theo sẽ mở ở bản cập nhật sau!';
    if (lang === 'en' && level === 'Nền tảng') { G.S.tangEn = 2; G.save(); after = 'Tầng 2 · A1 đã mở! Ra hành lang, đi thang máy bên phải lên Tầng 2 nhé.'; }
    if (lang === 'en' && level === 'A1') { G.S.tangEn = 3; G.save(); after = 'Tầng 3 · A2 – B1 đã mở! Ra hành lang, đi thang máy bên phải lên Tầng 3 nhé.'; }
    if (lang === 'en' && level === 'A2 – B1') { G.S.tangEn = 4; G.save(); after = 'Tầng 4 · B1 – B2 đã mở! Huy hiệu Ngôi sao thành phố đã lên đầu. Ra hành lang, đi thang máy lên Tầng 4 nhé.'; }
    if (lang === 'en' && level === 'B1 – B2') after = 'Bạn đã có chứng chỉ Tầng 4! Huy hiệu Bậc thầy ngôn ngữ đã lên đầu. Phòng thi Tốt nghiệp ConnectLife đã mở: đi thang máy lên Tầng thượng nhé.';
    G.say(speech, 'en');
    var wrap = G.el('div.modal.grad',
      G.el('div.grad-card',
        G.el('div.kicker', 'Chứng chỉ ConnectLife'),
        G.el('h2', 'Chứng chỉ cấp ' + level),
        G.el('div.diploma',
          G.imgEl('diploma_' + lang + '.png', 'dip-img'),
          G.el('div.dip-text',
            G.el('div.dip-school', SCHOOL[lang] || ''),
            G.el('div.dip-title', 'CHỨNG CHỈ CONNECTLIFE · CẤP ' + level),
            G.el('div.dip-name', name),
            G.el('div.dip-meta', 'Hiểu ' + right + '/' + total + (noi !== undefined && noi !== null ? ' · Nói ' + noi + '/100' : '') + ' · ' + G.S.totNghiep[lang][level].luc.slice(0, 10).split('-').reverse().join('/'))
          )
        ),
        G.el('div.grad-talk', G.imgEl('kai_follow.png', 'grad-kai'),
          G.el('div', G.el('b', 'Hiệu trưởng Kai'), G.el('div.en', speech), G.el('div.small.faint', 'Chúc mừng ' + name + '! Bạn đã đạt chứng chỉ cấp ' + level + '. Đi tiếp lộ trình tới bài thi đầu ra giao tiếp để Tốt nghiệp ConnectLife nhé.'))),
        G.el('div.grad-xp', '+100 XP'),
        G.shareBtn ? G.shareBtn('Chứng chỉ ConnectLife', 'Mình vừa đạt Chứng chỉ ConnectLife cấp ' + level + ' (hiểu ' + right + '/' + total + (noi !== undefined && noi !== null ? ', nói ' + noi + '/100' : '') + '). Học tiếng Anh bằng cách sống ở Brightford!', '.grad-share') : null,
        G.el('button.btn.seal.big1', { onclick: function () {
          document.body.removeChild(wrap);
          G.kaiSay(after);
          if (G.checkFloorBadge) setTimeout(G.checkFloorBadge, 600);   // có chứng chỉ tầng: nhận huy hiệu trên đầu
        } }, 'Nhận chứng chỉ ›')
      )
    );
    document.body.appendChild(wrap);
  };

  /* danh sách chứng chỉ đã có, để hiện ở Ngôi nhà chung */
  G.diplomas = function () {
    var out = [], t = G.S.totNghiep || {};
    for (var lang in t) if (t.hasOwnProperty(lang)) for (var lv in t[lang]) if (t[lang].hasOwnProperty(lv)) out.push({ lang: lang, level: lv, info: t[lang][lv] });
    return out;
  };
})();
