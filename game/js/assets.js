/* Tải hình trong assets/. Thiếu file thì vẽ ô màu có ghi tên file, nên anh chỉ cần bỏ đúng tên file vào assets/
   là game tự dùng, không phải sửa code. Danh sách tên file trùng với ASSET_ORDERS.md (sw.js cũng đọc danh sách này). */
var G = window.G || (window.G = {});

G.ASSET_LIST = [
  'player_han_down.png', 'player_han_up.png', 'player_han_left.png',
  'player_minh_down.png', 'player_minh_up.png', 'player_minh_left.png', 'kai_follow.png',
  'card_city_en.png', 'card_city_zh.png', 'card_city_soon.png', 'lobby_hero.png',
  'map_home_en.png', 'building_en_home.png', 'building_en_busstop.png', 'building_en_metro.png',
  'npc_driver.png', 'vehicle_bus.png', 'vehicle_metro.png', 'vehicle_metro_open.png', 'ride_bg_bus.png', 'ride_bg_metro.png',
  'map_en.png', 'building_en_school.png', 'building_en_cafe.png', 'building_en_market.png', 'building_en_hospital.png', 'building_en_airport.png',
  'map_zh.png', 'building_zh_school.png', 'building_zh_teahouse.png', 'building_zh_market.png', 'building_zh_hospital.png', 'building_zh_airport.png',
  'interior_en_hall.png', 'classroom_en.png', 'interior_en_cafe.png', 'interior_en_market.png', 'interior_en_hospital.png', 'interior_en_airport.png',
  'interior_zh_hall.png', 'classroom_zh.png', 'interior_zh_teahouse.png', 'interior_zh_market.png', 'interior_zh_hospital.png', 'interior_zh_airport.png',
  'npc_emma.png', 'npc_tom.png', 'npc_lily.png', 'npc_sam.png', 'npc_principal_li.png', 'npc_wang.png', 'npc_li.png', 'npc_zhang.png', 'npc_chen.png',
  'npc_emma_talk.png', 'npc_wang_talk.png', 'npc_principal_li_talk.png',
  'player_han_happy.png', 'player_han_wow.png', 'player_han_think.png', 'player_minh_happy.png', 'player_minh_wow.png', 'player_minh_think.png',
  'npc_leo.png', 'npc_xiaolin.png', 'npc_rosa.png', 'npc_wangdama.png', 'npc_grace.png', 'npc_zhou.png', 'npc_anna.png', 'npc_sun.png',
  'door_locked.png', 'door_open.png', 'door_lock.png', 'npc_tom_talk.png', 'npc_lily_talk.png', 'npc_sam_talk.png', 'plane.png', 'diploma_en.png', 'diploma_zh.png',
  'souvenir_tea.png', 'souvenir_coffee.png', 'souvenir_apples.png', 'souvenir_ticket.png', 'souvenir_medkit.png',
  'video_intro.mp4', 'video_flight.mp4', 'video_grad_en.mp4', 'video_grad_zh.mp4'
];

(function () {
  var cache = {};
  var COLORS = { player: '#c8553d', kai: '#4fb7a8', npc: '#2f7a63', building: '#8bbac0', map: '#cfe3c8', interior: '#efe4d2', classroom: '#efe4d2', card: '#1b2140', lobby: '#1b2140', door: '#a0784f' };

  function colorOf(name) {
    var p = name.split('_')[0];
    return COLORS[p] || '#c9c2b4';
  }

  /* Trả về đối tượng { img, ok, name }. ok = false khi file chưa có (vẽ ô màu thay thế). */
  G.asset = function (name) {
    if (cache[name]) return cache[name];
    var a = { name: name, ok: false, img: new Image(), tried: false };
    a.img.onload = function () { a.ok = true; };
    a.img.onerror = function () { a.ok = false; a.tried = true; };
    a.img.src = 'assets/' + name;
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
    G.drawPlaceholder(ctx, name, x, y, w, h);
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
  G.imgEl = function (name, cls, fallback) {
    var wrap = G.el('div.asset ' + (cls || ''));
    var img = new Image();
    img.alt = '';
    img.onload = function () { wrap.innerHTML = ''; wrap.style.background = ''; wrap.appendChild(img); wrap.className = 'asset ok ' + (cls || ''); };
    img.onerror = function () {
      if (fallback) { var f = fallback; fallback = null; name = f; img.src = 'assets/' + f; return; }
      wrap.innerHTML = ''; wrap.appendChild(G.el('span.asset-name', name)); wrap.style.background = colorOf(name); };
    img.src = 'assets/' + name;
    wrap.appendChild(G.el('span.asset-name', name));
    wrap.style.background = colorOf(name);
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
