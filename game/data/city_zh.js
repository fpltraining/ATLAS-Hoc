/* Trường Lạc trấn 长乐镇 trên bản đồ 3D lật giấy, như Brightford (anh Han chốt 24/11/2026, hình Đơn Q về đủ 25/11/2026).
   Ba tờ bản đồ nối nhau theo chiều dọc, đi bộ liền một mạch:
     Khu mới (ga tàu cao tốc, tàu điện ngầm, trà sữa, cửa hàng tiện lợi, bến xe buýt, đường có xe chạy)
       ↑ đường lát gạch
     Trung tâm (Học viện Hán ngữ, công viên hoa mai có bàn cờ, chùa tháp, ngân hàng, cổng chào đỏ)
       ↑ ngõ lát đá
     Phố cổ sông nước (nhà mình, quán trà, chợ sáng, phòng khám Đông y, kênh có hai cầu đá)
   Toạ độ theo tờ 1536×1024: nhà, vật neo ở chân (giữa cạnh dưới), s = cỡ hình giấy. Người dân đứng ở nơi nói chuyện (G.PEOPLE,
   hội thoại data/life_zh.js); nơi chưa mở thì nhắc học bài nào. Nhà không có hội thoại thì Tiểu Long dạy một câu ở đó.
   Lòng kênh không đi được: data/walkmask_zh.js (tools/art/walkmask.py). Hình: Đơn Q trong game/ASSET_ORDERS.md. */
var G = window.G || (window.G = {});

(function () {
  G.SCENE_MORE = G.SCENE_MORE || {};
  G.PEOPLE = G.PEOPLE || {};
  // bố cục 3D của từng thành phố; khi vào thành phố nào thì G.WORLD3D là bố cục thành phố đó (G.useWorld trong main.js)
  G.WORLDS = G.WORLDS || {};
  if (!G.WORLDS.en && G.WORLD3D) G.WORLDS.en = G.WORLD3D;
  // ngõ lên ở giữa cạnh trên phố cổ (x ≈ 735) khớp cổng chào ở cạnh dưới trung tâm (x ≈ 765); đường lên của trung tâm (x ≈ 920) khớp lối xuống khu mới (x ≈ 778)
  G.WORLDS.zh = { oldtown_zh: { ox: 0, oy: 0 }, center_zh: { ox: -30, oy: -1024 }, newtown_zh: { ox: 112, oy: -2048 } };
  G.ZH_CITY = ['oldtown_zh', 'center_zh', 'newtown_zh'];   // từ dưới lên, để chỉ đường

  function W(x, y, s) { return { img: 'pc_zh_willow.png', x: x, y: y, s: s || 215, r: 20 }; }
  function lamp(x, y) { return { img: 'pc_zh_lantern_post.png', x: x, y: y, s: 170, r: 10 }; }

  G.SCENE_MORE.oldtown_zh = {
    city: 'zh', title: 'Phố cổ 古镇 · Trường Lạc trấn', bg: 'map_zh_oldtown.webp', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 345, y: 360, dir: 'down' }, walk: { x0: 20, y0: 40, x1: 1516, y1: 1000 }, busy: 0.2, amb: { river: 0.3 },
    buildings: [
      { id: 'home', img: 'building_zh_home.png', s: 320, x: 345, y: 290, name: '家 Nhà của bạn', home: true },
      { id: 'teahouse', img: 'building_zh_teahouse.png', s: 320, x: 1110, y: 285, name: '茶馆 Quán trà', life: 'zh-teahouse' },
      { id: 'market', img: 'building_zh_market.png', s: 300, x: 770, y: 930, name: '菜市场 Chợ sáng', life: 'zh-market' },
      { id: 'clinic', img: 'building_zh_clinic.png', s: 280, x: 1290, y: 925, name: '诊所 Phòng khám', life: 'zh-clinic' }
    ],
    props: [
      W(115, 400), W(660, 415), W(835, 410), W(1440, 296), W(115, 700), W(905, 666), W(1460, 590), W(130, 935),   // liễu dựng trên chỗ liễu vẽ sẵn, chừa trước cửa nhà, quán trà
      { img: 'pc_zh_well.png', x: 300, y: 835, s: 170, r: 50 },
      { img: 'pc_zh_boat.png', x: 700, y: 560, s: 210, r: 0 },
      lamp(600, 322), lamp(905, 330), lamp(700, 762), lamp(1010, 762),
      { img: 'pc_zh_foodcart.png', x: 500, y: 760, s: 180, r: 40 },
      { img: 'pc_zh_bamboo.png', x: 1475, y: 700, s: 210, r: 18 },
      { img: 'pc_zh_plum.png', x: 1420, y: 130, s: 220, r: 20 }
    ],
    // bản 2D (máy không có WebGL): cổng sang trung tâm; bản 3D đi bộ liền sang
    gates: [{ x: 735, y: 60, side: 'up', label: 'Lên Trung tâm', sign: 'Trung tâm ›', to: { scene: 'center_zh', x: 765, y: 960, dir: 'up' } }]
  };

  G.SCENE_MORE.center_zh = {
    city: 'zh', title: 'Trung tâm 镇中心 · Trường Lạc trấn', bg: 'map_zh_center.webp', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 765, y: 930, dir: 'up' }, walk: { x0: 20, y0: 40, x1: 1516, y1: 1000 }, busy: 0.45, amb: { playground: 0.1 },
    buildings: [
      { id: 'school', img: 'building_zh_school.png', s: 340, x: 1190, y: 490, name: '汉语学院 Học viện Hán ngữ', panel: 'openZhHall' },
      { id: 'bank', img: 'building_zh_bank.png', s: 270, x: 240, y: 322, name: '银行 Ngân hàng',
        soon: '银行 yínháng · ngân hàng. Câu hay dùng: 我想换钱。Wǒ xiǎng huàn qián. (Tôi muốn đổi tiền.)' },
      { id: 'pagoda', img: 'building_zh_pagoda.png', s: 340, x: 310, y: 870, name: '宝塔 Chùa tháp',
        soon: '宝塔 bǎotǎ · chùa tháp. 这座塔真高！Zhè zuò tǎ zhēn gāo! (Ngọn tháp này cao thật!)' }
    ],
    props: [
      { img: 'pc_zh_gate.png', x: 765, y: 990, s: 380, r: 0 },
      { img: 'pc_zh_plum.png', x: 530, y: 160, s: 230, r: 20 }, { img: 'pc_zh_plum.png', x: 770, y: 232, s: 230, r: 20 }, { img: 'pc_zh_plum.png', x: 450, y: 356, s: 220, r: 20 },
      { img: 'pc_zh_chess.png', x: 605, y: 530, s: 190, r: 45 },
      lamp(620, 592), lamp(925, 592),
      { img: 'pc_zh_foodcart.png', x: 1010, y: 760, s: 180, r: 40 },
      { img: 'pc_zh_bamboo.png', x: 170, y: 560, s: 210, r: 18 }, { img: 'pc_zh_bamboo.png', x: 330, y: 575, s: 190, r: 18 },
      { img: 'pc_zh_lion.png', x: 1000, y: 505, s: 120, r: 22 }
    ],
    gates: [
      { x: 765, y: 1000, side: 'down', label: 'Xuống Phố cổ', sign: '‹ Phố cổ', to: { scene: 'oldtown_zh', x: 735, y: 80, dir: 'down' } },
      { x: 920, y: 60, side: 'up', label: 'Lên Khu mới', sign: 'Khu mới ›', to: { scene: 'newtown_zh', x: 778, y: 960, dir: 'up' } }
    ]
  };

  G.SCENE_MORE.newtown_zh = {
    city: 'zh', title: 'Khu mới 新区 · Trường Lạc trấn', bg: 'map_zh_newtown.webp', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 778, y: 930, dir: 'up' }, walk: { x0: 20, y0: 40, x1: 1516, y1: 1000 }, busy: 1,
    buildings: [
      { id: 'store', img: 'building_zh_store.png', s: 250, x: 215, y: 365, name: '便利店 Cửa hàng tiện lợi',
        soon: '便利店 biànlìdiàn · cửa hàng tiện lợi, mở 24 giờ. 有矿泉水吗？Yǒu kuàngquánshuǐ ma? (Có nước khoáng không?)' },
      { id: 'metro', img: 'building_zh_metro.png', s: 260, x: 765, y: 340, name: '地铁站 Ga tàu điện ngầm',
        soon: '地铁 dìtiě · tàu điện ngầm. 地铁站在哪儿？Dìtiě zhàn zài nǎr? (Ga tàu điện ngầm ở đâu?)' },
      { id: 'busstop', img: 'building_zh_busstop.png', s: 250, x: 1043, y: 330, name: '公交车站 Bến xe buýt',
        soon: '公交车 gōngjiāochē · xe buýt. 这路车到火车站吗？Zhè lù chē dào huǒchēzhàn ma? (Tuyến này có tới ga tàu không?)' },
      { id: 'station', img: 'building_zh_station.png', s: 270, x: 1310, y: 320, name: '高铁站 Ga tàu cao tốc', life: 'zh-station' }
    ],
    props: [
      { img: 'pc_tree_small.png', x: 350, y: 430, s: 170, r: 16 }, { img: 'pc_tree_small.png', x: 630, y: 425, s: 170, r: 16 },
      { img: 'pc_tree_small.png', x: 905, y: 420, s: 170, r: 16 }, { img: 'pc_tree_small.png', x: 1180, y: 415, s: 170, r: 16 },
      { img: 'pc_lamp.png', x: 90, y: 440, s: 160, r: 10 }, { img: 'pc_lamp.png', x: 1480, y: 425, s: 160, r: 10 },
      { img: 'pc_zh_bikes.png', x: 345, y: 905, s: 210, r: 40 }, { img: 'pc_zh_bikes.png', x: 1185, y: 865, s: 210, r: 40 }
    ],
    // đường hai làn có taxi, xe buýt, xe máy giao hàng, xe đạp chạy (world3d.js buildCars); vạch qua đường ở x 715–830
    road: { lanes: [[525, -1], [612, 1]], x0: 30, x1: 1506, cross: [715, 830],
      cars: [{ n: 'car_zh_taxi', h: 86, k: 415 / 217, v: 210 }, { n: 'car_zh_bus', h: 118, k: 415 / 168, v: 140 }, { n: 'car_zh_scooter', h: 96, k: 415 / 483, v: 165 }, { n: 'car_zh_bike', h: 96, k: 415 / 470, v: 95 }] },
    gates: [{ x: 778, y: 1000, side: 'down', label: 'Xuống Trung tâm', sign: '‹ Trung tâm', to: { scene: 'center_zh', x: 920, y: 80, dir: 'down' } }]
  };

  // người dân đứng ở nơi nói chuyện (x, y: chân; dir: hướng nhìn). Trà sữa: Tiểu Mỹ đứng trong quầy (bimg) vì đã đứng ở cổng Học viện
  G.PEOPLE.oldtown_zh = [
    { npc: 'lin', life: 'zh-teahouse', x: 1215, y: 322, dir: 'left' },
    { npc: 'nainai', life: 'zh-market', x: 905, y: 946, dir: 'left' },
    { npc: 'zhao', life: 'zh-clinic', x: 1425, y: 946, dir: 'left' }
  ];
  G.PEOPLE.center_zh = [
    { npc: 'xiaomei', life: 'zh-school', x: 1050, y: 535, dir: 'right' },
    { npc: 'yeye', life: 'zh-park', x: 700, y: 548, dir: 'left' }
  ];
  G.PEOPLE.newtown_zh = [
    { npc: 'xiaomei', life: 'zh-store', x: 487, y: 350, dir: 'down', stall: '奶茶 Trà sữa', bimg: 'building_zh_milktea.png', bs: 250 },
    { npc: 'shifu', life: 'zh-street', x: 640, y: 690, dir: 'right' },
    { npc: 'zhou', life: 'zh-station', x: 1425, y: 346, dir: 'left' }
  ];
})();
