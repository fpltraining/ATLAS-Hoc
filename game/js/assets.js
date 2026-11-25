/* Tải hình trong assets/. Thiếu file thì vẽ ô màu có ghi tên file, nên anh chỉ cần bỏ đúng tên file vào assets/
   là game tự dùng, không phải sửa code. Danh sách tên file trùng với ASSET_ORDERS.md (sw.js cũng đọc danh sách này). */
var G = window.G || (window.G = {});

G.TOWNIE_SETS = ['linda', 'walter', 'sofia', 'marco', 'amy', 'david', 'helen', 'kenji'];
G.ASSET_LIST = [
  'player_han_down.png', 'player_han_up.png', 'player_han_left.png',
  'player_han_down_w1.png', 'player_han_down_w2.png', 'player_han_up_w1.png', 'player_han_up_w2.png', 'player_han_left_w1.png', 'player_han_left_w2.png',
  'player_minh_down.png', 'player_minh_up.png', 'player_minh_left.png', 'kai_follow.png', 'kai_up.png', 'kai_left.png',
  'card_city_en.webp', 'card_city_zh.webp', 'card_city_ja.webp', 'card_city_ko.webp', 'card_city_fr.webp', 'lobby_hero.webp', 'lobby_title.png', 'paper_tile.webp',
  'map_home_en_p.png', 'map_street_en.png',
  /* kiểu mô hình giấy: Khu phố Maple, Trung tâm, Phố mua sắm */
  'pc_airport.png', 'pc_school.png', 'pc_hospital.png', 'pc_market.png', 'pc_cafe.png', 'pc_fountain.png', 'pc_kiosk.png',
  'pc_canteen.png', 'pc_post.png', 'pc_bank.png', 'pc_pharmacy.png', 'pc_barber.png', 'pc_super.png',
  'pc_home.png', 'pc_busstop.png', 'pc_bus_sign.png', 'pc_gym.png', 'pc_cart.png', 'pc_tree_orange.png', 'pc_tree_green.png', 'pc_tree_pine.png', 'pc_tree_birch.png', 'pc_tree_maple.png', 'pc_tree_small.png',
  'pc_bush_orange.png', 'pc_bush_white.png', 'pc_rock.png', 'pc_rock_moss.png', 'pc_fence.png', 'pc_signpost.png', 'pc_bench.png', 'pc_mailbox.png', 'pc_lamp.png', 'pc_mushroom.png', 'pc_flowerbox.png', 'pc_bin.png',
  'npc_driver.png', 'vehicle_bus.png', 'ride_bg_bus.png',
  'map_en.png',
  'map_zh.png', 'building_zh_school.png', 'building_zh_teahouse.png', 'building_zh_market.png', 'building_zh_hospital.png', 'building_zh_airport.png',
  'interior_en_hall.png', 'classroom_en_v2.webp', 'chair_wood_back.png', 'chair_green_back.png', 'interior_en_cafe.png', 'interior_en_market.png', 'interior_en_hospital.png', 'interior_en_airport.png',
  'interior_zh_hall.png', 'classroom_zh.png', 'interior_zh_teahouse.png', 'interior_zh_market.png', 'interior_zh_hospital.png', 'interior_zh_airport.png',
  'npc_emma.png', 'npc_tom.png', 'npc_lily.png', 'npc_sam.png', 'npc_principal_li.png', 'npc_wang.png', 'npc_li.png', 'npc_zhang.png', 'npc_chen.png',
  'npc_emma_talk.png', 'npc_wang_talk.png', 'npc_principal_li_talk.png',
  'player_han_happy.png', 'player_han_wow.png', 'player_han_think.png', 'player_minh_happy.png', 'player_minh_wow.png', 'player_minh_think.png',
  'npc_leo.png', 'npc_xiaolin.png', 'npc_rosa.png', 'npc_wangdama.png', 'npc_grace.png', 'npc_zhou.png', 'npc_anna.png', 'npc_sun.png',
  'door_locked.png', 'door_open.png', 'door_lock.png', 'npc_tom_talk.png', 'npc_lily_talk.png', 'npc_sam_talk.png', 'plane.png', 'prop_oak.png', 'prop_palm.png', 'prop_lamp.png', 'prop_bench.png', 'prop_car.png', 'prop_mailbox.png', 'prop_flowers.png', 'prop_drone.png', 'logo_icon.png', 'flight_bg.png', 'npc_zhou_talk.png', 'npc_grace_talk.png', 'npc_li_talk.png', 'npc_zhang_talk.png', 'npc_chen_talk.png', 'diploma_en.png', 'diploma_zh.png',
  /* ảnh ChatGPT: người trong đời sống, toà nhà và nội thất các tiệm */
  'npc_mom.png', 'npc_mom_talk.png', 'npc_mia.png', 'npc_mia_talk.png', 'npc_ben.png', 'npc_ben_talk.png', 'npc_carlos.png', 'npc_carlos_talk.png', 'npc_dan.png', 'npc_dan_talk.png',
  'npc_owen.png', 'npc_owen_talk.png', 'npc_jake.png', 'npc_jake_talk.png', 'npc_ivy.png', 'npc_ivy_talk.png', 'npc_grant.png', 'npc_grant_talk.png',
  'npc_kim.png', 'npc_kim_talk.png', 'npc_max.png', 'npc_max_talk.png', 'npc_pat.png', 'npc_pat_talk.png', 'npc_nora.png', 'npc_nora_talk.png',
  'npc_zoe.png', 'npc_zoe_talk.png', 'npc_lee.png', 'npc_lee_talk.png', 'npc_ray.png', 'npc_ray_talk.png', 'npc_tony.png', 'npc_tony_talk.png', 'interior_en_bank.png',
 
  'interior_en_barber.png', 'interior_en_post.png', 'interior_en_pharmacy.png', 'interior_en_gym.png', 'interior_en_super.png',
  'souvenir_tea.png', 'souvenir_coffee.png', 'souvenir_apples.png', 'souvenir_ticket.png', 'souvenir_medkit.png',
  /* người đi đường: mỗi người 3 hướng (nhìn ngang phải = lật hình nhìn ngang trái) */
  'person_linda_down.png', 'person_linda_up.png', 'person_linda_left.png', 'person_walter_down.png', 'person_walter_up.png', 'person_walter_left.png',
  'person_sofia_down.png', 'person_sofia_up.png', 'person_sofia_left.png', 'person_marco_down.png', 'person_marco_up.png', 'person_marco_left.png',
  'person_amy_down.png', 'person_amy_up.png', 'person_amy_left.png', 'person_david_down.png', 'person_david_up.png', 'person_david_left.png',
  'person_helen_down.png', 'person_helen_up.png', 'person_helen_left.png', 'person_kenji_down.png', 'person_kenji_up.png', 'person_kenji_left.png',
  /* lớp hình nhân vật ghép (người đi đường, mẹ, hàng xóm…): lưu sẵn để không mất hình khi mạng chập chờn */
  'body_hoodie_down.png', 'body_hoodie_left.png', 'body_hoodie_up.png', 'body_jacket_down.png', 'body_jacket_left.png', 'body_jacket_up.png',
  'body_sport_down.png', 'body_sport_left.png', 'body_sport_up.png', 'body_sweater_down.png', 'body_sweater_left.png', 'body_sweater_up.png',
  'body_tech_down.png', 'body_tech_left.png', 'body_tech_up.png', 'body_uniform_down.png', 'body_uniform_left.png', 'body_uniform_up.png',
  'face_calm_down.png', 'face_calm_left.png', 'face_cool_down.png', 'face_cool_left.png', 'face_gentle_down.png', 'face_gentle_left.png',
  'face_smile_down.png', 'face_smile_left.png', 'face_sparkle_down.png', 'face_sparkle_left.png', 'face_wink_down.png', 'face_wink_left.png',
  'hair_bowl_down.png', 'hair_bowl_left.png', 'hair_bowl_up.png', 'hair_bun_down.png', 'hair_bun_left.png', 'hair_bun_up.png',
  'hair_curly_down.png', 'hair_curly_left.png', 'hair_curly_up.png', 'hair_long_down.png', 'hair_long_left.png', 'hair_long_up.png',
  'hair_messy_down.png', 'hair_messy_left.png', 'hair_messy_up.png', 'hair_ponytail_down.png', 'hair_ponytail_left.png', 'hair_ponytail_up.png',
  'hair_sidepart_down.png', 'hair_sidepart_left.png', 'hair_sidepart_up.png', 'hair_spiky_down.png', 'hair_spiky_left.png', 'hair_spiky_up.png',
  'rank_1.webp', 'rank_2.webp', 'rank_3.webp', 'rank_4.webp', 'rank_5.webp', 'rank_6.webp', 'rank_7.webp', 'rank_8.webp', 'rank_9.webp',
  'badge_1.webp', 'badge_2.webp', 'badge_3.webp', 'badge_4.webp', 'badge_5.webp', 'badge_6.webp', 'badge_7.webp', 'badge_8.webp', 'badge_9.webp', 'badge_10.webp', 'badge_11.webp', 'badge_12.webp',
  'ic_mic.png', 'ic_mic_ok.png', 'ic_speak.png', 'ic_lips.png',
  'video_intro.mp4', 'video_flight.mp4', 'video_grad_en.mp4', 'video_grad_zh.mp4'
];

(function () {
  var cache = {};
  var COLORS = { player: '#c8553d', kai: '#4fb7a8', npc: '#2f7a63', building: '#8bbac0', map: '#cfe3c8', interior: '#efe4d2', classroom: '#efe4d2', card: '#1b2140', lobby: '#1b2140', door: '#a0784f' };

  function colorOf(name) {
    var p = name.split('_')[0];
    return COLORS[p] || '#c9c2b4';
  }

  /* địa chỉ hình kèm mã phiên bản (data/asset_rev.js): hình thay nội dung thì địa chỉ đổi, máy không dùng bản cũ */
  G.assetUrl = function (name) {
    var v = G.ASSET_REV && G.ASSET_REV[name];
    return 'assets/' + name + (v ? '?v=' + v : '');
  };

  /* Trả về đối tượng { img, ok, name }. ok = false khi file chưa có (vẽ ô màu thay thế). */
  /* icon 3D (Microsoft Fluent Emoji, MIT, vendor/fluentui-emoji.LICENSE; anh Han duyệt 21/11/2026 để thay emoji của máy).
     Tệp assets/ic3_<tên>.webp. G.bigIc: icon + tiêu đề cho nút .big.bic */
  G.ic3 = function (name, cls) { return G.el('img.ic3' + (cls ? '.' + cls : ''), { src: G.assetUrl('ic3_' + name + '.webp'), alt: '', draggable: 'false' }); };
  G.bigIc = function (name, title) { return [G.ic3(name), G.el('b', title)]; };
  G.asset = function (name) {
    if (cache[name]) return cache[name];
    var a = { name: name, ok: false, img: new Image(), tried: false };
    a.img.onload = function () { a.ok = true; };
    // lỗi tải (mạng chập chờn): thử lại tối đa 4 lần, mỗi lần chờ lâu hơn
    a.img.onerror = function () {
      a.ok = false; a.tried = true; a.fail = (a.fail || 0) + 1;
      if (a.fail <= 4) setTimeout(function () { var u = G.assetUrl(name); a.img.src = u + (u.indexOf('?') < 0 ? '?' : '&') + 'r=' + a.fail; }, 1500 * a.fail);
    };
    a.img.src = G.assetUrl(name);
    cache[name] = a;
    return a;
  };

  /* Vẽ hình (hoặc ô màu + tên file) vào canvas. x, y là góc trên trái. */
  G.drawAsset = function (ctx, name, x, y, w, h, flip) {
    var a = G.asset(name);
    if (a.ok) {
      if (flip) {
        ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(a.img, 0, 0, w, h); ctx.restore();
      } else ctx.drawImage(a.img, x, y, w, h);
      return true;
    }
    // ảnh nhân vật / đồ vật chưa tải xong: không vẽ ô xám có tên file
    if (!/^(body|hair|face|npc|player|person|kai|prop|pc|souvenir|rank|badge|ic)_/.test(name)) G.drawPlaceholder(ctx, name, x, y, w, h);
    return false;
  };

  G.drawPlaceholder = function (ctx, name, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = colorOf(name);
    ctx.globalAlpha = 0.92;
    roundRect(ctx, x, y, w, h, Math.min(16, w / 6));
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(27,33,64,.55)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, Math.min(14, w / 6));
    ctx.stroke();
    ctx.setLineDash([]);
    var fs = Math.max(10, Math.min(18, w / 9));
    ctx.font = '600 ' + fs + 'px -apple-system, system-ui, sans-serif';
    ctx.fillStyle = '#1b2140';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = name.replace('.png', '').replace('.mp4', '');
    wrapText(ctx, label, x + w / 2, y + h / 2, w - 10, fs * 1.2);
    ctx.restore();
  };

  /* Ảnh trong giao diện HTML (thẻ thành phố, ảnh đầu trang): thiếu thì hiện ô màu có tên file */
  /* fallback: tên file dùng thay khi file chính chưa có */
  var LOADING_BG = 'rgba(120,90,50,.07)';
  G.imgEl = function (name, cls, fallback) {
    // hình không có trong danh sách hình (data/asset_rev.js) mà có hình dự phòng: dùng luôn hình dự phòng, khỏi gọi tệp không tồn tại
    if (fallback && G.ASSET_REV && !G.ASSET_REV[name] && G.ASSET_REV[fallback]) { name = fallback; fallback = null; }
    var wrap = G.el('div.asset ' + (cls || ''));
    // hình đã đặt mà chưa về (không có trong danh sách hình, cả hình dự phòng): nền giấy nhạt, không gọi tệp chưa có
    if (G.ASSET_REV && !G.ASSET_REV[name] && !(fallback && G.ASSET_REV[fallback])) { wrap.style.background = LOADING_BG; return wrap; }
    var img = new Image();
    img.alt = '';
    img.onload = function () { wrap.innerHTML = ''; wrap.style.background = ''; wrap.appendChild(img); wrap.className = 'asset ok ' + (cls || ''); };
    var tries = 0;
    img.onerror = function () {
      // hình lỗi (thường do bản lưu trong máy bị hỏng khi mạng chập chờn): xoá bản lưu đó rồi tải lại từ mạng, tối đa 2 lần
      if (tries < 2) {
        tries++; var u = G.assetUrl(name), again = function () { img.src = u + (u.indexOf('?') < 0 ? '?' : '&') + 'r=' + tries + Date.now() % 1e6; };
        if (window.caches && caches.keys) caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.open(k).then(function (c) { return c['delete'](u, { ignoreSearch: false }); }); })); }).then(again, again);
        else setTimeout(again, 600 * tries);
        return;
      }
      if (fallback) { var f = fallback; fallback = null; name = f; tries = 2; img.src = G.assetUrl(f); return; }
      wrap.innerHTML = ''; wrap.style.background = LOADING_BG; };
    img.src = G.assetUrl(name);
    // đang tải: nền giấy nhạt, không hiện tên tệp
    wrap.style.background = LOADING_BG;
    return wrap;
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  G.roundRect = roundRect;

  function wrapText(ctx, text, cx, cy, maxW, lh) {
    var words = text.split('_');
    var lines = [];
    var line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + '_' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line + '_'); line = words[i]; } else line = t;
    }
    lines.push(line);
    var y0 = cy - ((lines.length - 1) * lh) / 2;
    for (var j = 0; j < lines.length; j++) ctx.fillText(lines[j], cx, y0 + j * lh);
  }
})();
