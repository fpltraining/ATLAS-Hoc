/* Thế giới: các cảnh (bản đồ thành phố, hành lang trường, lớp học), vị trí nhà, cửa, NPC.
   Toạ độ theo ảnh 1536×1024 (cỡ ChatGPT trả về). Nhà vẽ 300×300, điểm neo là cửa (giữa cạnh dưới). */
var G = window.G || (window.G = {});

G.NPCS = {
  emma: { name: 'Ms. Emma', img: 'npc_emma.png', role: 'Giáo viên phòng A1-1' },
  tom: { name: 'Mr. Tom', img: 'npc_tom.png', role: 'Giáo viên phòng A1-2' },
  lily: { name: 'Mrs. Lily', img: 'npc_lily.png', role: 'Giáo viên phòng A1-3' },
  sam: { name: 'Chef Sam', img: 'npc_sam.png', role: 'Giáo viên phòng A1-4' },
  kai: { name: 'Hiệu trưởng Kai', img: 'kai_follow.png', role: 'Hiệu trưởng, phòng thi cuối cấp A1' }
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
G.ROOM_TEACHER = { 'en-a1-1': 'emma', 'en-a1-2': 'tom', 'en-a1-3': 'lily', 'en-a1-4': 'sam', 'en-a1-test': 'kai' };

G.SCENES = {
  home_en: {
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
    title: 'Trung tâm Brightford',
    bg: 'map_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 768, y: 640 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'airport', img: 'building_en_airport.png', x: 768, y: 205, name: 'Sân bay', soon: 'Sân bay mở ở giai đoạn 3: bay sang Trường Lạc trấn.' },
      { id: 'market', img: 'building_en_market.png', x: 330, y: 440, name: 'Chợ', soon: 'Chợ mở ở giai đoạn 4.' },
      { id: 'cafe', img: 'building_en_cafe.png', x: 1206, y: 440, name: 'Quán cà phê', soon: 'Quán cà phê mở ở giai đoạn 4.' },
      { id: 'school', img: 'building_en_school.png', x: 420, y: 880, name: 'Trường Anh ngữ', go: { scene: 'en_hall', x: 768, y: 930 } },
      { id: 'hospital', img: 'building_en_hospital.png', x: 1110, y: 880, name: 'Bệnh viện', soon: 'Bệnh viện mở ở giai đoạn 4.' },
      { id: 'busstop', img: 'building_en_busstop.png', x: 125, y: 945, name: 'Bến xe buýt', ride: 'bus', toward: 'home' },
      { id: 'metro', img: 'building_en_metro.png', x: 1395, y: 945, name: 'Ga tàu điện', ride: 'metro', toward: 'home' }
    ]
  },
  en_hall: {
    title: 'Trường Anh ngữ',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall',
    walk: { x0: 70, y0: 330, x1: 1466, y1: 990 },
    exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'school' } }
  },
  classroom_en: {
    title: 'Lớp học',
    bg: 'classroom_en.png', w: 1536, h: 1024, kind: 'classroom',
    walk: { x0: 90, y0: 330, x1: 1446, y1: 990 },
    teacher: { x: 900, y: 380 },
    exit: { x: 768, y: 985, label: 'Ra hành lang', to: { scene: 'en_hall', door: true } }
  }
};

/* Đã qua phòng chưa: đạt từ 80% số câu (phòng thường 8/10, phòng thi 16/20) */
G.roomPassed = function (id) {
  var p = G.S.phong[id], r = G.ROOMS[id];
  return !!(p && p.diem >= ((r && r.passN) || 8));
};
/* Phòng đã mở chưa: phòng đầu luôn mở, phòng sau cần qua phòng trước */
G.roomOpen = function (idx) {
  if (idx === 0) return true;
  return G.roomPassed(G.EN_HALL_DOORS[idx - 1].room);
};
