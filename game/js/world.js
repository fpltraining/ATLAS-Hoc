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

/* Các phòng trong hành lang Trường Anh ngữ (5 cửa dọc tường trên) */
G.EN_HALL_DOORS = [
  { room: 'en-a1-1', label: 'A1-1', x: 172 },
  { room: 'en-a1-2', label: 'A1-2', x: 472 },
  { room: 'en-a1-3', label: 'A1-3', x: 768 },
  { room: 'en-a1-4', label: 'A1-4', x: 1068 },
  { room: 'en-a1-test', label: 'Thi A1', x: 1364 }
];
G.HALL_DOOR_Y = 345;   // chỗ đứng trước cửa (chân tường dưới các cửa trong ảnh hành lang)
/* Hành lang Học viện Hán ngữ: 6 cửa cách đều */
G.ZH_HALL_DOORS = [
  { room: 'zh-py', label: 'Phát âm', x: 128 },
  { room: 'zh-1-1', label: 'HSK1-1', x: 384 },
  { room: 'zh-1-2', label: 'HSK1-2', x: 640 },
  { room: 'zh-1-3', label: 'HSK1-3', x: 896 },
  { room: 'zh-1-4', label: 'HSK1-4', x: 1152 },
  { room: 'zh-1-test', label: 'Thi HSK1', x: 1408 }
];
G.ROOM_TEACHER = { 'en-a1-1': 'emma', 'en-a1-2': 'tom', 'en-a1-3': 'lily', 'en-a1-4': 'sam', 'en-a1-test': 'kai',
  'zh-py': 'wang', 'zh-1-1': 'wang', 'zh-1-2': 'li', 'zh-1-3': 'zhang', 'zh-1-4': 'chen', 'zh-1-test': 'principal_li' };
/* cửa nào thuộc hành lang nào */
G.doorsOf = function (roomId) { return roomId.indexOf('zh') === 0 ? G.ZH_HALL_DOORS : G.EN_HALL_DOORS; };

G.SCENES = {
  home_en: {
    city: 'en',
    title: 'Khu phố Maple',
    bg: 'map_home_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 330, y: 790 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'home', img: 'building_en_home.png', x: 330, y: 700, name: 'Nhà của bạn', home: true },
      { id: 'busstop', img: 'building_en_busstop.png', x: 1240, y: 400, name: 'Bến xe buýt', ride: 'bus', toward: 'school' },
      { id: 'metro', img: 'building_en_metro.png', x: 1190, y: 960, name: 'Ga tàu điện', ride: 'metro', toward: 'school' }
    ]
  },
  city_en: {
    city: 'en',
    title: 'Trung tâm Brightford',
    bg: 'map_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 768, y: 640 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'airport', img: 'building_en_airport.png', x: 768, y: 205, name: 'Sân bay', fly: 'zh' },
      { id: 'market', img: 'building_en_market.png', x: 330, y: 440, name: 'Chợ', life: 'en-market' },
      { id: 'cafe', img: 'building_en_cafe.png', x: 1206, y: 440, name: 'Quán cà phê', life: 'en-cafe' },
      { id: 'school', img: 'building_en_school.png', x: 420, y: 880, name: 'Trường Anh ngữ', go: { scene: 'en_hall', x: 768, y: 930 } },
      { id: 'hospital', img: 'building_en_hospital.png', x: 1110, y: 880, name: 'Bệnh viện', life: 'en-hospital' },
      { id: 'busstop', img: 'building_en_busstop.png', x: 125, y: 945, name: 'Bến xe buýt', ride: 'bus', toward: 'home' },
      { id: 'metro', img: 'building_en_metro.png', x: 1395, y: 945, name: 'Ga tàu điện', ride: 'metro', toward: 'home' }
    ]
  },
  en_hall: {
    city: 'en', doors: 'EN_HALL_DOORS', classroom: 'classroom_en',
    title: 'Trường Anh ngữ',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall',
    walk: { x0: 70, y0: 330, x1: 1466, y1: 990 },
    exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'school' } }
  },
  classroom_en: {
    city: 'en',
    title: 'Lớp học',
    bg: 'classroom_en.png', w: 1536, h: 1024, kind: 'classroom',
    walk: { x0: 90, y0: 330, x1: 1446, y1: 990 },
    teacher: { x: 900, y: 380 },
    exit: { x: 768, y: 985, label: 'Ra hành lang', to: { scene: 'en_hall', door: true } }
  }
};

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
  return !!(p && p.diem >= ((r && r.passN) || 8));
};
/* Phòng đã mở chưa: phòng đầu luôn mở, phòng sau cần qua phòng trước */
G.roomOpen = function (idx, doors) {
  doors = doors || G.EN_HALL_DOORS;
  if (idx === 0) return true;
  return G.roomPassed(doors[idx - 1].room);
};
