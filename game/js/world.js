/* Thế giới: các cảnh (bản đồ thành phố, hành lang trường, lớp học), vị trí nhà, cửa, NPC.
   Toạ độ theo ảnh 1536×1024 (cỡ ChatGPT trả về). Nhà vẽ 300×300, điểm neo là cửa (giữa cạnh dưới). */
var G = window.G || (window.G = {});

G.NPCS = {
  emma: { name: 'Ms. Emma', img: 'npc_emma.png', role: 'Giáo viên phòng A1-1' }
};

/* Các phòng trong hành lang Trường Anh ngữ (5 cửa dọc tường trên) */
G.EN_HALL_DOORS = [
  { room: 'en-a1-1', label: 'A1-1', x: 256 },
  { room: 'en-a1-2', label: 'A1-2', x: 512 },
  { room: 'en-a1-3', label: 'A1-3', x: 768 },
  { room: 'en-a1-4', label: 'A1-4', x: 1024 },
  { room: 'en-a1-test', label: 'Thi A1', x: 1280 }
];
G.ROOM_TEACHER = { 'en-a1-1': 'emma' };

G.SCENES = {
  home_en: {
    title: 'Khu phố Maple',
    bg: 'map_home_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 420, y: 640 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'home', img: 'building_en_home.png', x: 420, y: 560, name: 'Nhà của bạn', home: true },
      { id: 'busstop', img: 'building_en_busstop.png', x: 1120, y: 470, name: 'Bến xe buýt', ride: 'bus', toward: 'school' },
      { id: 'metro', img: 'building_en_metro.png', x: 1150, y: 900, name: 'Ga tàu điện', ride: 'metro', toward: 'school' }
    ]
  },
  city_en: {
    title: 'Trung tâm Brightford',
    bg: 'map_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 768, y: 290 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'airport', img: 'building_en_airport.png', x: 768, y: 230, name: 'Sân bay', soon: 'Sân bay mở ở giai đoạn 3: bay sang Trường Lạc trấn.' },
      { id: 'market', img: 'building_en_market.png', x: 330, y: 500, name: 'Chợ', soon: 'Chợ mở ở giai đoạn 4.' },
      { id: 'cafe', img: 'building_en_cafe.png', x: 1206, y: 500, name: 'Quán cà phê', soon: 'Quán cà phê mở ở giai đoạn 4.' },
      { id: 'school', img: 'building_en_school.png', x: 500, y: 860, name: 'Trường Anh ngữ', go: { scene: 'en_hall', x: 768, y: 930 } },
      { id: 'hospital', img: 'building_en_hospital.png', x: 1060, y: 880, name: 'Bệnh viện', soon: 'Bệnh viện mở ở giai đoạn 4.' },
      { id: 'busstop', img: 'building_en_busstop.png', x: 190, y: 870, name: 'Bến xe buýt', ride: 'bus', toward: 'home' },
      { id: 'metro', img: 'building_en_metro.png', x: 1370, y: 880, name: 'Ga tàu điện', ride: 'metro', toward: 'home' }
    ]
  },
  en_hall: {
    title: 'Trường Anh ngữ',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall',
    walk: { x0: 70, y0: 430, x1: 1466, y1: 990 },
    exit: { x: 768, y: 985, label: 'Ra phố', to: { scene: 'city_en', building: 'school' } }
  },
  classroom_en: {
    title: 'Lớp học',
    bg: 'classroom_en.png', w: 1536, h: 1024, kind: 'classroom',
    walk: { x0: 90, y0: 470, x1: 1446, y1: 990 },
    exit: { x: 768, y: 985, label: 'Ra hành lang', to: { scene: 'en_hall', door: true } }
  }
};

/* Phòng đã mở chưa: phòng đầu luôn mở, phòng sau cần phòng trước đạt từ 80% */
G.roomOpen = function (idx) {
  if (idx === 0) return true;
  var prev = G.EN_HALL_DOORS[idx - 1].room;
  var p = G.S.phong[prev];
  return !!(p && p.diem >= 8);
};
