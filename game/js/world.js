/* Thế giới: các cảnh (bản đồ thành phố, hành lang trường, lớp học), vị trí nhà, cửa, NPC.
   Toạ độ theo ảnh 1536×1024 (cỡ ChatGPT trả về). Nhà vẽ 300×300, điểm neo là cửa (giữa cạnh dưới). */
var G = window.G || (window.G = {});

G.NPCS = {
  emma: { name: 'Ms. Emma', img: 'npc_emma.png', role: 'Giáo viên phòng A1-1' },
  tom: { name: 'Mr. Tom', img: 'npc_tom.png', role: 'Giáo viên phòng A1-2' },
  lily: { name: 'Mrs. Lily', img: 'npc_lily.png', role: 'Giáo viên phòng A1-3' },
  sam: { name: 'Chef Sam', img: 'npc_sam.png', role: 'Giáo viên phòng A1-4' },
  kai: { name: 'Hiệu trưởng Kai', img: 'kai_follow.png', role: 'Hiệu trưởng, phòng thi cuối cấp A1' },
  leo: { name: 'Leo', img: 'npc_leo.png', role: 'Pha chế ở quán cà phê' },
  rosa: { name: 'Mrs. Rosa', img: 'npc_rosa.png', role: 'Bán hoa quả ở chợ' },
  anna: { name: 'Dr. Anna', img: 'npc_anna.png', role: 'Bác sĩ ở bệnh viện' },
  wang: { name: '王老师 Cô Vương', img: 'npc_wang.png', role: 'Phòng Phát âm và HSK1-1' },
  li: { name: '李老师 Thầy Lý', img: 'npc_li.png', role: 'Phòng HSK1-2' },
  zhang: { name: '张阿姨 Dì Trương', img: 'npc_zhang.png', role: 'Phòng HSK1-3' },
  chen: { name: '陈师傅 Bác Trần', img: 'npc_chen.png', role: 'Phòng HSK1-4' },
  principal_li: { name: '李校长 Hiệu trưởng Lý', img: 'npc_principal_li.png', role: 'Phòng thi cuối cấp HSK1' }
};

/* nhân vật thêm từ các file dữ liệu khác (vd. data/life_morning.js) */
if (G.NPC_MORE) for (var nk in G.NPC_MORE) if (G.NPC_MORE.hasOwnProperty(nk)) G.NPCS[nk] = G.NPC_MORE[nk];

/* Các phòng trong hành lang Trường Anh ngữ (5 cửa dọc tường trên) */
G.EN_HALL_DOORS = [
  { room: 'en-a1-1', label: 'A1-1', x: 262, px: 250, sx: 330, sy: 570 },   // quầy lễ tân che trước cửa: đứng trong vòng quầy để vào
  { room: 'en-a1-2', label: 'A1-2', x: 506, px: 496, sy: 395 },
  { room: 'en-a1-3', label: 'A1-3', x: 757, px: 762, sy: 395 },
  { room: 'en-a1-4', label: 'A1-4', x: 1008, px: 1020, sy: 395 },
  { room: 'en-a1-test', label: 'Thi A1', x: 1248, px: 1268, sy: 395 }
];
G.HALL_DOOR_Y = 345;   // chỗ đứng trước cửa (chân tường dưới các cửa trong ảnh hành lang)
/* chỗ đứng để vào một cửa (cửa có vật che phía trước thì đứng ở sx, sy) */
G.doorStand = function (d) { return { x: d.sx || d.x, y: d.sy || G.HALL_DOOR_Y }; };
/* Hành lang Học viện Hán ngữ: 6 cửa cách đều */
G.ZH_HALL_DOORS = [
  { room: 'zh-py', label: 'Phát âm', x: 128 },
  { room: 'zh-1-1', label: 'HSK1-1', x: 384 },
  { room: 'zh-1-2', label: 'HSK1-2', x: 640 },
  { room: 'zh-1-3', label: 'HSK1-3', x: 896 },
  { room: 'zh-1-4', label: 'HSK1-4', x: 1152 },
  { room: 'zh-1-test', label: 'Thi HSK1', x: 1408 }
];
/* Tầng 1 · Nền tảng (A0 → A1): 4 phòng, mỗi phòng 7–8 buổi (data/en_found.js), cửa cuối là phòng thi tầng */
G.EN_F1_DOORS = [
  { room: 'en-n1', label: 'N-1', x: 262, px: 250, sx: 330, sy: 570 },
  { room: 'en-n2', label: 'N-2', x: 506, px: 496, sy: 395 },
  { room: 'en-n3', label: 'N-3', x: 757, px: 762, sy: 395 },
  { room: 'en-n4', label: 'N-4', x: 1008, px: 1020, sy: 395 },
  { room: 'en-n-test', label: 'Thi tầng 1', x: 1248, px: 1268, sy: 395 }
];
/* Các tầng của Trường Anh ngữ. Tầng có scene là đã mở cửa; tầng soon đang xây (nội dung lấy từ Chặng 1–3 của lộ trình). */
G.EN_FLOORS = [
  { n: 1, name: 'Nền tảng', cefr: 'A0 → A1', sub: 'Phát âm, 600 từ lõi, ngữ pháp cơ bản · 30 buổi', scene: 'en_hall_1', doors: 'EN_F1_DOORS', grad: 'Nền tảng' },
  { n: 2, name: 'A1', cefr: 'A1', sub: 'Giao tiếp hằng ngày như người bản xứ · 4 phòng và thi A1', scene: 'en_hall', doors: 'EN_HALL_DOORS', grad: 'A1' },
  { n: 3, name: 'A2 – B1', cefr: 'A2 → B1', sub: 'Câu dài, đọc truyện dễ, nói 90 giây không ngắt', soon: true },
  { n: 4, name: 'B1 – B2', cefr: 'B1 → B2', sub: 'Đọc rộng, nói trôi chảy, viết mạch lạc', soon: true }
];
G.ROOM_TEACHER = { 'en-n1': 'nora', 'en-n2': 'nora', 'en-n3': 'nora', 'en-n4': 'nora', 'en-n-test': 'kai',
  'en-a1-1': 'emma', 'en-a1-2': 'tom', 'en-a1-3': 'lily', 'en-a1-4': 'sam', 'en-a1-test': 'kai',
  'zh-py': 'wang', 'zh-1-1': 'wang', 'zh-1-2': 'li', 'zh-1-3': 'zhang', 'zh-1-4': 'chen', 'zh-1-test': 'principal_li' };
/* cửa nào thuộc hành lang nào */
G.doorsOf = function (roomId) { return roomId.indexOf('zh') === 0 ? G.ZH_HALL_DOORS : roomId.indexOf('en-n') === 0 ? G.EN_F1_DOORS : G.EN_HALL_DOORS; };
/* tầng của một phòng (buổi của phòng nhóm cũng thuộc tầng của phòng nhóm) */
G.floorOfRoom = function (roomId) { return roomId && roomId.indexOf('en-n') === 0 ? 1 : 2; };
G.floorInfo = function (n) { return G.EN_FLOORS[n - 1]; };
/* tầng đã mở cho người học chưa: tầng 1 luôn mở; tầng 2 mở khi tốt nghiệp Nền tảng, đầu vào từ A1, hoặc đã học phòng A1 */
G.floorUnlocked = function (n) {
  var f = G.EN_FLOORS[n - 1]; if (!f || f.soon) return false;
  if (n === 1) return true;
  var t = G.S.totNghiep && G.S.totNghiep.en, lv = G.S.dauVao ? G.S.dauVao.lv : 2;
  if (t && t['Nền tảng']) return true;
  if (lv >= 2) return true;
  for (var i = 0; i < G.EN_HALL_DOORS.length; i++) { var id = G.EN_HALL_DOORS[i].room; if (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id])) return true; }
  return false;
};
/* tầng đang học: chọn ở thang máy (G.S.tangEn); chưa chọn thì theo đầu vào (A0, Pre-A1 học Nền tảng) */
G.enFloorNow = function () {
  var n = G.S.tangEn;
  if (n && G.floorUnlocked(n)) return n;
  return G.floorUnlocked(2) ? 2 : 1;
};
G.hallOfFloor = function (n) { return (G.EN_FLOORS[n - 1] || G.EN_FLOORS[1]).scene; };
/* buổi đang học của phòng nhóm: buổi đầu tiên chưa qua (qua hết thì buổi cuối) */
G.curSession = function (groupId) {
  var g = G.ROOMS[groupId]; if (!g || !g.group) return null;
  for (var i = 0; i < g.group.length; i++) if (!G.roomPassed(g.group[i])) return g.group[i];
  return g.group[g.group.length - 1];
};
/* buổi thứ k trong phòng nhóm đã mở chưa: buổi đầu luôn mở, buổi sau cần qua buổi trước (đầu vào từ Pre-A1 được học vượt) */
G.sessionOpen = function (groupId, k) {
  var g = G.ROOMS[groupId];
  if (k === 0 || (G.S.dauVao && G.S.dauVao.lv >= 1)) return true;
  return G.roomPassed(g.group[k - 1]);
};

G.SCENES = {
  home_en: {
    city: 'en',
    title: 'Khu phố Maple',
    // kiểu mô hình giấy: tờ giấy nền chỉ có đường, cỏ; nhà, cây, đồ vật là hình giấy dựng rời (s: cỡ vẽ)
    bg: 'map_home_en_p.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 250, y: 650 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'home', img: 'pc_home.png', s: 330, x: 245, y: 590, name: 'Nhà của bạn', home: true },
      { id: 'busstop', img: 'pc_busstop.png', s: 250, x: 1110, y: 500, name: 'Bến xe buýt', ride: 'bus', toward: 'school' },
      { id: 'metro', img: 'pc_metro.png', s: 270, x: 1180, y: 880, name: 'Ga tàu điện', ride: 'metro', toward: 'school' }
    ]
  },
  city_en: {
    city: 'en',
    title: 'Trung tâm Brightford',
    // kiểu mô hình giấy: quảng trường tròn ở giữa, các đường toả ra 6 bãi đất; toà nhà là hình giấy dựng rời
    bg: 'map_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 768, y: 690 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'airport', img: 'pc_airport.png', s: 250, x: 760, y: 236, name: 'Sân bay', fly: 'zh' },
      { id: 'market', img: 'pc_market.png', s: 260, x: 244, y: 440, name: 'Chợ', life: 'en-market' },
      { id: 'cafe', img: 'pc_cafe.png', s: 260, x: 1292, y: 440, name: 'Quán cà phê', life: 'en-cafe' },
      { id: 'school', img: 'pc_school.png', s: 300, x: 466, y: 975, name: 'Trường Anh ngữ', go: { scene: 'en_hall', x: 768, y: 930 } },
      { id: 'hospital', img: 'pc_hospital.png', s: 290, x: 1060, y: 975, name: 'Bệnh viện', life: 'en-hospital' },
      { id: 'busstop', img: 'pc_busstop.png', s: 180, x: 92, y: 975, name: 'Bến xe buýt', ride: 'bus', toward: 'home' },
      { id: 'metro', img: 'pc_metro.png', s: 190, x: 1450, y: 975, name: 'Ga tàu điện', ride: 'metro', toward: 'home' }
    ],
    // cuối đường bên phải: sang Phố mua sắm (bưu điện, ngân hàng, hiệu thuốc, tiệm tóc, siêu thị)
    gates: [{ x: 1490, y: 508, side: 'right', label: 'Sang Phố mua sắm', sign: '🛍️ Phố mua sắm ›', to: { scene: 'street_en', x: 150, y: 380, dir: 'right' } }]
  },
  en_hall: {
    city: 'en', doors: 'EN_HALL_DOORS', classroom: 'classroom_en', floor: 2,
    title: 'Trường Anh ngữ · Tầng 2 A1',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'city_en', building: 'school' } },
    // thang máy (lên / xuống tầng) ở phía phải hành lang
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: '🛗 Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]   // cửa thang máy có sẵn trong ảnh (tường phải)
  },
  en_hall_1: {
    city: 'en', doors: 'EN_F1_DOORS', classroom: 'classroom_en', floor: 1,
    title: 'Trường Anh ngữ · Tầng 1 Nền tảng',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'city_en', building: 'school' } },
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: '🛗 Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]   // cửa thang máy có sẵn trong ảnh (tường phải)
  },
  classroom_en: {
    city: 'en',
    title: 'Lớp học',
    bg: 'classroom_en.png', w: 1536, h: 1024, kind: 'classroom',
    walk: { x0: 40, y0: 395, x1: 1496, y1: 990 },
    teacher: { x: 770, y: 425 },
    exit: { x: 768, y: 985, label: 'Ra hành lang', to: { scene: 'en_hall', door: true } }
  }
};

/* cảnh thêm từ file dữ liệu khác (vd. nội thất tiệm ở data/life_after.js) */
if (G.SCENE_MORE) for (var sk in G.SCENE_MORE) if (G.SCENE_MORE.hasOwnProperty(sk)) G.SCENES[sk] = G.SCENE_MORE[sk];

/* Đồ vật rời trên bản đồ (vẽ theo chiều sâu, nhân vật đi ra sau được): img, chân x/y, cỡ s, bán kính chặn r */
G.SCENES.city_en.props = [
  { img: 'pc_fountain.png', x: 760, y: 520, s: 270, r: 110 },
  { img: 'pc_kiosk.png', x: 600, y: 190, s: 170, r: 40 },
  { img: 'pc_tree_green.png', x: 900, y: 175, s: 230, r: 22 }, { img: 'pc_tree_small.png', x: 1000, y: 110, s: 170, r: 18 },
  { img: 'pc_tree_orange.png', x: 150, y: 230, s: 260, r: 24 }, { img: 'pc_tree_pine.png', x: 50, y: 130, s: 290, r: 20 },
  { img: 'pc_tree_pine.png', x: 1300, y: 200, s: 290, r: 20 }, { img: 'pc_tree_green.png', x: 1460, y: 150, s: 240, r: 22 },
  { img: 'pc_tree_birch.png', x: 70, y: 690, s: 240, r: 22 }, { img: 'pc_tree_orange.png', x: 1460, y: 700, s: 250, r: 24 },
  { img: 'pc_tree_maple.png', x: 860, y: 1000, s: 190, r: 20 },
  { img: 'pc_bush_orange.png', x: 230, y: 640, s: 110, r: 32 }, { img: 'pc_bush_white.png', x: 1300, y: 690, s: 110, r: 32 },
  { img: 'pc_lamp.png', x: 540, y: 455, s: 160, r: 10 }, { img: 'pc_lamp.png', x: 985, y: 455, s: 160, r: 10 },
  { img: 'pc_lamp.png', x: 560, y: 770, s: 160, r: 10 }, { img: 'pc_lamp.png', x: 965, y: 770, s: 160, r: 10 },
  { img: 'pc_bench.png', x: 610, y: 640, s: 110, r: 28 }, { img: 'pc_bench.png', x: 915, y: 640, s: 110, r: 28 },
  { img: 'pc_signpost.png', x: 1150, y: 455, s: 120, r: 12 }, { img: 'pc_mailbox.png', x: 860, y: 270, s: 80, r: 12 }
];
G.SCENES.home_en.props = [
  { img: 'pc_tree_orange.png', x: 80, y: 270, s: 290, r: 24 }, { img: 'pc_tree_small.png', x: 45, y: 430, s: 200, r: 18 },
  { img: 'pc_tree_pine.png', x: 1460, y: 230, s: 320, r: 20 }, { img: 'pc_tree_green.png', x: 1230, y: 180, s: 250, r: 22 },
  { img: 'pc_tree_green.png', x: 1470, y: 1000, s: 290, r: 24 }, { img: 'pc_tree_birch.png', x: 940, y: 1000, s: 270, r: 22 },
  { img: 'pc_tree_maple.png', x: 120, y: 930, s: 240, r: 20 },
  { img: 'pc_bush_orange.png', x: 60, y: 560, s: 120, r: 34 }, { img: 'pc_bush_white.png', x: 430, y: 760, s: 120, r: 34 },
  { img: 'pc_bush_orange.png', x: 900, y: 280, s: 110, r: 32 }, { img: 'pc_bush_white.png', x: 1330, y: 780, s: 110, r: 32 },
  { img: 'pc_flowerbox.png', x: 120, y: 640, s: 110, r: 34 }, { img: 'pc_mailbox.png', x: 415, y: 625, s: 100, r: 14 },
  { img: 'pc_fence.png', x: 330, y: 790, s: 130, r: 46 }, { img: 'pc_fence.png', x: 200, y: 790, s: 130, r: 46 },
  { img: 'pc_signpost.png', x: 590, y: 330, s: 130, r: 12 },
  { img: 'pc_lamp.png', x: 545, y: 450, s: 160, r: 10 }, { img: 'pc_lamp.png', x: 990, y: 250, s: 160, r: 10 }, { img: 'pc_lamp.png', x: 805, y: 790, s: 160, r: 10 },
  { img: 'pc_cart.png', x: 1460, y: 505, s: 200, r: 52 }, { img: 'pc_bench.png', x: 1430, y: 800, s: 120, r: 30 },
  { img: 'pc_bin.png', x: 990, y: 515, s: 80, r: 14 },
  { img: 'pc_rock.png', x: 1050, y: 980, s: 90, r: 26 }, { img: 'pc_rock_moss.png', x: 300, y: 960, s: 110, r: 30 },
  { img: 'pc_mushroom.png', x: 30, y: 760, s: 90, r: 18 }, { img: 'pc_mushroom.png', x: 1340, y: 960, s: 80, r: 16 }
];

/* Khu đời sống Brightford: vào trong là gặp người bán / bác sĩ */
G.SCENES.cafe_en = {
  city: 'en', title: 'Quán cà phê của Leo', bg: 'interior_en_cafe.png', w: 1536, h: 1024, kind: 'shop', life: 'en-cafe', npc: 'leo',
  walk: { x0: 90, y0: 450, x1: 1446, y1: 990 }, teacher: { x: 620, y: 470 },
  exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'cafe' } }
};
G.SCENES.market_en = {
  city: 'en', title: 'Chợ nông sản', bg: 'interior_en_market.png', w: 1536, h: 1024, kind: 'shop', life: 'en-market', npc: 'rosa',
  walk: { x0: 90, y0: 560, x1: 1446, y1: 990 }, teacher: { x: 380, y: 580 },
  exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'market' } }
};
G.SCENES.hospital_en = {
  city: 'en', title: 'Bệnh viện Brightford', bg: 'interior_en_hospital.png', w: 1536, h: 1024, kind: 'shop', life: 'en-hospital', npc: 'anna',
  walk: { x0: 300, y0: 470, x1: 1440, y1: 990 }, teacher: { x: 1080, y: 560 },
  exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'hospital' } }
};

/* Trường Lạc trấn: bản đồ cùng bố cục 5 bãi đất như trung tâm Brightford */
G.SCENES.city_zh = {
  city: 'zh',
  title: 'Trường Lạc trấn 长乐镇',
  bg: 'map_zh.png', w: 1536, h: 1024, kind: 'city',
  spawn: { x: 768, y: 330 },
  walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
  buildings: [
    { id: 'airport', img: 'building_zh_airport.png', x: 768, y: 205, name: 'Sân bay', fly: 'en' },
    { id: 'market', img: 'building_zh_market.png', x: 330, y: 440, name: 'Chợ', soon: 'Chợ mở ở giai đoạn 4.' },
    { id: 'teahouse', img: 'building_zh_teahouse.png', x: 1206, y: 440, name: 'Quán trà', soon: 'Quán trà mở ở giai đoạn 4.' },
    { id: 'school', img: 'building_zh_school.png', x: 420, y: 880, name: 'Học viện Hán ngữ', go: { scene: 'zh_hall', x: 768, y: 930 } },
    { id: 'hospital', img: 'building_zh_hospital.png', x: 1110, y: 880, name: 'Bệnh viện', soon: 'Bệnh viện mở ở giai đoạn 4.' }
  ]
};
G.SCENES.zh_hall = {
  city: 'zh', doors: 'ZH_HALL_DOORS', classroom: 'classroom_zh',
  title: 'Học viện Hán ngữ',
  bg: 'interior_zh_hall.png', w: 1536, h: 1024, kind: 'hall',
  walk: { x0: 70, y0: 330, x1: 1466, y1: 990 },
  exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_zh', building: 'school' } }
};
G.SCENES.classroom_zh = {
  city: 'zh',
  title: 'Lớp học 教室',
  bg: 'classroom_zh.png', w: 1536, h: 1024, kind: 'classroom',
  walk: { x0: 90, y0: 330, x1: 1446, y1: 990 },
  teacher: { x: 900, y: 380 },
  exit: { x: 768, y: 985, label: 'Ra hành lang', to: { scene: 'zh_hall', door: true } }
};

/* Đã qua phòng chưa: đạt từ 80% số câu (phòng thường 8/10, phòng thi 16/20) */
G.roomPassed = function (id) {
  var p = G.S.phong[id], r = G.ROOMS[id];
  if (r && r.group) { for (var i = 0; i < r.group.length; i++) if (!G.roomPassed(r.group[i])) return false; return true; }   // phòng nhóm: qua hết các buổi
  return !!(p && p.diem >= ((r && r.passN) || 8));
};
/* Phòng đã mở chưa: phòng đầu luôn mở, phòng sau cần qua phòng trước */
G.roomOpen = function (idx, doors) {
  doors = doors || G.EN_HALL_DOORS;
  if (idx === 0) return true;
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 3 && doors === G.EN_HALL_DOORS) return true;   // đầu vào từ A2: thi vượt các phòng A1
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 1 && doors === G.EN_F1_DOORS) return true;     // đầu vào từ Pre-A1: học vượt, thi tầng 1 luôn
  return G.roomPassed(doors[idx - 1].room);
};
