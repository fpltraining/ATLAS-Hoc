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
/* Tầng 3 · A2 – B1: 4 phòng nhóm buổi (data/en_a2.js), cửa cuối là phòng thi tầng. Phòng chưa có nội dung thì báo sắp có. */
G.EN_F3_DOORS = [
  { room: 'en-a2-1', label: 'A2-1', x: 262, px: 250, sx: 330, sy: 570 },
  { room: 'en-a2-2', label: 'A2-2', x: 506, px: 496, sy: 395 },
  { room: 'en-a2-3', label: 'A2-3', x: 757, px: 762, sy: 395 },
  { room: 'en-a2-4', label: 'A2-4', x: 1008, px: 1020, sy: 395 },
  { room: 'en-a2-test', label: 'Thi tầng 3', x: 1248, px: 1268, sy: 395 }
];
/* Tầng 4 · B1 – B2: 4 phòng nhóm buổi (data/en_b1.js), cửa cuối là phòng thi chứng chỉ tầng 4. */
G.EN_F4_DOORS = [
  { room: 'en-b1-1', label: 'B1-1', x: 262, px: 250, sx: 330, sy: 570 },
  { room: 'en-b1-2', label: 'B1-2', x: 506, px: 496, sy: 395 },
  { room: 'en-b1-3', label: 'B1-3', x: 757, px: 762, sy: 395 },
  { room: 'en-b1-4', label: 'B1-4', x: 1008, px: 1020, sy: 395 },
  { room: 'en-b1-test', label: 'Thi tầng 4', x: 1248, px: 1268, sy: 395 }
];
/* Các tầng của Trường Anh ngữ. Tầng có scene là đã mở cửa; tầng soon đang xây (nội dung lấy từ Chặng 1–3 của lộ trình). */
G.EN_FLOORS = [
  { n: 1, name: 'Nền tảng', cefr: 'A0 → A1', sub: 'Phát âm, 600 từ lõi, ngữ pháp cơ bản · 30 buổi', scene: 'en_hall_1', doors: 'EN_F1_DOORS', grad: 'Nền tảng' },
  { n: 2, name: 'A1', cefr: 'A1', sub: 'Giao tiếp hằng ngày như người bản xứ · 4 phòng và thi A1', scene: 'en_hall', doors: 'EN_HALL_DOORS', grad: 'A1' },
  { n: 3, name: 'A2 – B1', cefr: 'A2 → B1', sub: 'Kể chuyện, hẹn gặp, đi lại, nêu ý kiến · 4 phòng và thi tầng', scene: 'en_hall_3', doors: 'EN_F3_DOORS', grad: 'A2 – B1' },
  { n: 4, name: 'B1 – B2', cefr: 'B1 → B2', sub: 'Nói dài, khiếu nại, thương lượng, thảo luận có lý lẽ · 4 phòng và thi tầng', scene: 'en_hall_4', doors: 'EN_F4_DOORS', grad: 'B1 – B2' }
];
G.ROOM_TEACHER = { 'en-n1': 'nora', 'en-n2': 'nora', 'en-n3': 'nora', 'en-n4': 'nora', 'en-n-test': 'kai',
  'en-a1-1': 'emma', 'en-a1-2': 'tom', 'en-a1-3': 'lily', 'en-a1-4': 'sam', 'en-a1-test': 'kai',
  'en-a2-1': 'owen', 'en-a2-2': 'ivy', 'en-a2-3': 'carlos', 'en-a2-4': 'grant', 'en-a2-test': 'kai',
  'en-b1-1': 'zoe', 'en-b1-2': 'ray', 'en-b1-3': 'max', 'en-b1-4': 'anna', 'en-b1-test': 'kai',
  'zh-py': 'wang', 'zh-1-1': 'wang', 'zh-1-2': 'li', 'zh-1-3': 'zhang', 'zh-1-4': 'chen', 'zh-1-test': 'principal_li' };
/* cửa nào thuộc hành lang nào */
G.doorsOf = function (roomId) { return roomId.indexOf('zh') === 0 ? G.ZH_HALL_DOORS : roomId.indexOf('en-n') === 0 ? G.EN_F1_DOORS : roomId.indexOf('en-a2') === 0 ? G.EN_F3_DOORS : roomId.indexOf('en-b1') === 0 ? G.EN_F4_DOORS : G.EN_HALL_DOORS; };
/* tầng của một phòng (buổi của phòng nhóm cũng thuộc tầng của phòng nhóm) */
G.floorOfRoom = function (roomId) { return roomId && roomId.indexOf('en-n') === 0 ? 1 : roomId && roomId.indexOf('en-a2') === 0 ? 3 : roomId && roomId.indexOf('en-b1') === 0 ? 4 : 2; };
G.floorInfo = function (n) { return G.EN_FLOORS[n - 1]; };
/* tầng đã mở cho người học chưa: tầng 1 luôn mở; tầng 2 mở khi tốt nghiệp Nền tảng, đầu vào từ A1, hoặc đã học phòng A1 */
G.floorUnlocked = function (n) {
  var f = G.EN_FLOORS[n - 1]; if (!f || f.soon) return false;
  if (n === 1) return true;
  var t = G.S.totNghiep && G.S.totNghiep.en, lv = G.S.dauVao ? G.S.dauVao.lv : 2, i;
  function studied(doors) {   // đã học dở / đã qua buổi nào của tầng này
    for (var j = 0; j < doors.length; j++) { var r3 = G.ROOMS[doors[j].room]; if (r3 && (r3.group || [r3.id]).some(function (sid) { return G.S.phong[sid] || (G.S.dangHoc && G.S.dangHoc[sid]); })) return true; }
    return false;
  }
  if (n === 3) return !!((t && t.A1) || lv >= 3 || studied(G.EN_F3_DOORS));          // chứng chỉ A1, đầu vào từ A2, hoặc đã học phòng A2
  if (n === 4) return !!((t && t['A2 – B1']) || lv >= 4 || studied(G.EN_F4_DOORS));  // chứng chỉ A2 – B1, đầu vào từ B1, hoặc đã học phòng B1
  if (t && t['Nền tảng']) return true;
  if (lv >= 2) return true;
  for (i = 0; i < G.EN_HALL_DOORS.length; i++) { var id = G.EN_HALL_DOORS[i].room; if (G.S.phong[id] || (G.S.dangHoc && G.S.dangHoc[id])) return true; }
  return false;
};
/* tầng đang học: chọn ở thang máy (G.S.tangEn); chưa chọn thì theo đầu vào (A0, Pre-A1 học Nền tảng) */
G.enFloorNow = function () {
  var n = G.S.tangEn;
  if (n && G.floorUnlocked(n)) return n;
  if (G.S.dauVao && G.S.dauVao.lv >= 4 && G.floorUnlocked(4)) return 4;   // đầu vào từ B1: bắt đầu ở tầng 4
  if (G.S.dauVao && G.S.dauVao.lv >= 3 && G.floorUnlocked(3)) return 3;   // đầu vào từ A2: bắt đầu ở tầng 3
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
  var skip = groupId.indexOf('en-b1') === 0 ? 5 : groupId.indexOf('en-a2') === 0 ? 4 : groupId.indexOf('en-a1') === 0 ? 3 : 1;
  if (k === 0 || (G.S.dauVao && G.S.dauVao.lv >= skip)) return true;
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
      { id: 'shuttle', img: 'pc_shuttle_stop.png', s: 130, x: 1040, y: 935, name: 'Xe đưa đón học sinh', shuttle: 'school', nb: true }
    ],
    // đường mòn bên phải ra Bờ sông, qua cầu sang Trung tâm: đi bộ tới trường (bản 3D đi liền một mạch, bản 2D qua cổng)
    gates: [{ x: 1490, y: 548, side: 'right', label: 'Đi bộ ra Bờ sông', sign: 'Bờ sông ›', to: { scene: 'river_en', x: 80, y: 505, dir: 'right' } }]
  },
  city_en: {
    city: 'en',
    title: 'Trung tâm Brightford',
    // kiểu mô hình giấy: quảng trường tròn ở giữa, các đường toả ra 6 bãi đất; toà nhà là hình giấy dựng rời
    bg: 'map_en.png', w: 1536, h: 1024, kind: 'city',
    spawn: { x: 768, y: 690 },
    walk: { x0: 30, y0: 60, x1: 1506, y1: 1000 },
    buildings: [
      { id: 'airport', img: 'pc_airport.png', s: 250, x: 760, y: 236, name: 'Sân bay', soon: 'Sân bay đang xây: chuyến bay đầu tiên mở cùng bài học Du lịch ở Tầng 3 (A2 – B1).' },
      { id: 'market', img: 'pc_market.png', s: 260, x: 244, y: 440, name: 'Chợ', life: 'en-market' },
      { id: 'cafe', img: 'pc_cafe.png', s: 260, x: 1292, y: 440, name: 'Quán cà phê', life: 'en-cafe' },
      { id: 'hospital', img: 'pc_hospital.png', s: 290, x: 1060, y: 975, name: 'Bệnh viện', life: 'en-hospital' },
      { id: 'busstop', img: 'pc_busstop.png', s: 180, x: 92, y: 975, name: 'Bến xe buýt', ride: 'bus', toward: 'home' }
    ],
    // cuối đường bên phải: sang Phố mua sắm (bưu điện, ngân hàng, hiệu thuốc, tiệm tóc, siêu thị); bên trái: về Khu phố Maple
    gates: [{ x: 1490, y: 508, side: 'right', label: 'Sang Phố mua sắm', sign: 'Phố mua sắm ›', to: { scene: 'street_en', x: 150, y: 380, dir: 'right' } },
      { x: 46, y: 520, side: 'left', label: 'Đi bộ ra Bờ sông', sign: '‹ 🌊 Bờ sông', to: { scene: 'river_en', x: 1440, y: 412, dir: 'left' } },
      { x: 798, y: 996, side: 'down', label: 'Đi bộ tới Trường Anh ngữ', sign: 'Trường Anh ngữ', to: { scene: 'campus_en', x: 798, y: 90, dir: 'down' } }]
  },
  en_hall: {
    city: 'en', doors: 'EN_HALL_DOORS', classroom: 'classroom_en', floor: 2,
    title: 'Trường Anh ngữ · Tầng 2 A1',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'campus_en', building: 'school' } },
    // thang máy (lên / xuống tầng) ở phía phải hành lang
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: 'Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]   // cửa thang máy có sẵn trong ảnh (tường phải)
  },
  en_hall_1: {
    city: 'en', doors: 'EN_F1_DOORS', classroom: 'classroom_en', floor: 1,
    title: 'Trường Anh ngữ · Tầng 1 Nền tảng',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'campus_en', building: 'school' } },
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: 'Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]   // cửa thang máy có sẵn trong ảnh (tường phải)
  },
  en_hall_3: {
    city: 'en', doors: 'EN_F3_DOORS', classroom: 'classroom_en', floor: 3,
    title: 'Trường Anh ngữ · Tầng 3 A2 – B1',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'campus_en', building: 'school' } },
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: 'Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]
  },
  en_hall_4: {
    city: 'en', doors: 'EN_F4_DOORS', classroom: 'classroom_en', floor: 4,
    title: 'Trường Anh ngữ · Tầng 4 B1 – B2',
    bg: 'interior_en_hall.png', w: 1536, h: 1024, kind: 'hall', plateY: 78,
    walk: { x0: 60, y0: 385, x1: 1500, y1: 995 },
    exit: { x: 768, y: 968, label: 'Ra phố', to: { scene: 'campus_en', building: 'school' } },
    gates: [{ x: 1330, y: 525, side: 'right', label: 'Đi thang máy', sign: 'Thang máy', tag: { x: 1425, y: 212 }, to: { floors: true } }]
  },
  classroom_en: {
    city: 'en',
    title: 'Lớp học',
    // lớp học vẽ mới (classroom_en_v2): 6 bàn, cửa sổ phía trên, tường trước có cửa ra vào; ghế là hình rời (G.SEATS)
    bg: 'classroom_en_v2.webp', w: 1536, h: 1024, kind: 'classroom',
    walk: { x0: 100, y0: 192, x1: 1440, y1: 772 },
    teacher: { x: 775, y: 240 },
    exit: { x: 775, y: 765, label: 'Ra hành lang', to: { scene: 'en_hall', door: true } },
    blocks: [[266, 246, 554, 452], [641, 246, 909, 452], [996, 246, 1284, 452], [241, 508, 544, 722], [634, 508, 916, 722], [1011, 508, 1304, 722],
      [20, 570, 190, 780], [0, 0, 212, 320], [0, 320, 175, 560], [0, 560, 132, 780], [1340, 0, 1536, 320], [1380, 320, 1536, 560], [1420, 560, 1536, 780]]
  }
};
/* Chỗ ngồi trong lớp (theo ảnh classroom_en_v2.webp): mỗi bàn 2 ghế ở phía trước bàn, lưng ghế quay về phía người xem.
   x giữa ghế, y chân ghế, c màu ghế (w gỗ, g xanh), k cỡ (hàng trên xa hơn nên nhỏ hơn chút).
   me: ghế người chơi (bàn dưới bên trái, gần lối đi), kai: Kai ngồi cùng bàn, stand: chỗ đứng ở lối đi trước khi kéo ghế,
   mates: bạn cùng lớp (student_<n>_sit.png, giơ tay: student_<n>_hand.png). */
G.SEATS = {
  classroom_en: {
    me: 7, kai: 6, stand: { x: 592, y: 752 },
    list: [
      { x: 348, y: 505, c: 'w', k: 0.95 }, { x: 472, y: 505, c: 'w', k: 0.95 }, { x: 713, y: 505, c: 'g', k: 0.95 }, { x: 837, y: 505, c: 'g', k: 0.95 },
      { x: 1078, y: 505, c: 'w', k: 0.95 }, { x: 1202, y: 505, c: 'w', k: 0.95 },
      { x: 330, y: 770, c: 'g', k: 1 }, { x: 454, y: 770, c: 'g', k: 1 }, { x: 700, y: 770, c: 'w', k: 1 }, { x: 850, y: 770, c: 'w', k: 1 },
      { x: 1096, y: 770, c: 'g', k: 1 }, { x: 1220, y: 770, c: 'g', k: 1 }
    ],
    mates: [{ i: 3, n: 'lily' }, { i: 10, n: 'tom' }, { i: 1, n: 'ana' }, { i: 4, n: 'ken' }, { i: 11, n: 'mai' }, { i: 2, n: 'leo' }]
  }
};

/* Xe đưa đón học sinh: đường chạy theo đường mòn trên bản đồ (px toàn thành phố, Khu phố Maple lệch -1536).
   stop: điểm đón (xe chạy từ điểm 0 tới đây rồi đợi lên xe); end: chỗ xuống xe; enter: tự vào toà nhà khi tới. */
(function () {
  function at(id) { return function (x, y) { var o = G.WORLD3D && G.WORLD3D[id] || { ox: 0, oy: 0 }; return { x: x + o.ox, y: y + o.oy }; }; }
  var H = at('home_en'), R = at('river_en'), C = at('city_en'), K = at('campus_en');
  var mid = [H(1080, 552), H(1300, 548), H(1530, 548), R(8, 505), R(264, 505), R(520, 502), R(600, 470), R(700, 456), R(880, 456), R(960, 440),
    R(1100, 515), R(1290, 470), R(1420, 415), R(1530, 410), C(30, 528), C(440, 510), C(530, 585), C(551, 663), C(640, 760), C(780, 880), C(798, 1010),
    K(798, 40), K(798, 170), K(600, 250), K(520, 400), K(470, 500), K(340, 520)];
  var toSchool = [H(860, 1070), H(930, 965), H(972, 800), H(1004, 640)].concat(mid);
  var toHome = [K(300, 680), K(470, 520)].concat(mid.slice(0, -2).reverse(), [H(1004, 640), H(972, 800), H(930, 965)]);
  G.SHUTTLE = {
    school: { pts: toSchool, stop: 1, end: { scene: 'campus_en', x: 330, y: 520 }, enter: 'school' },
    home: { pts: toHome, stop: 1, end: { scene: 'home_en', x: 1010, y: 985 } }
  };
})();

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
  if (r && r.group && p && p.diem >= 8) return true;   // đã qua phòng này khi nó còn là phòng đơn (A1 trước 24/11/2026): giữ nguyên
  if (r && r.group) { for (var i = 0; i < r.group.length; i++) if (!G.roomPassed(r.group[i])) return false; return true; }   // phòng nhóm: qua hết các buổi
  if (r && r.final && G.CERT_SPEAK && G.CERT_SPEAK[id] && G.S.totNghiep) { var tn = G.S.totNghiep[r.final.lang]; return !!(tn && tn[r.final.level]); }   // phòng thi chứng chỉ: phải đạt cả phần nói
  return !!(p && p.diem >= ((r && r.passN) || 8));
};
/* Phòng đã mở chưa: phòng đầu luôn mở, phòng sau cần qua phòng trước */
G.roomOpen = function (idx, doors) {
  doors = doors || G.EN_HALL_DOORS;
  if (idx === 0) return true;
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 3 && doors === G.EN_HALL_DOORS) return true;   // đầu vào từ A2: thi vượt các phòng A1
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 1 && doors === G.EN_F1_DOORS) return true;     // đầu vào từ Pre-A1: học vượt, thi tầng 1 luôn
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 4 && doors === G.EN_F3_DOORS) return true;     // đầu vào từ B1: học vượt tầng 3
  if (G.S && G.S.dauVao && G.S.dauVao.lv >= 5 && doors === G.EN_F4_DOORS) return true;     // đầu vào từ B2: học vượt tầng 4
  return G.roomPassed(doors[idx - 1].room);
};

/* ---------- Đồng cỏ quanh thành phố 3D (anh Han 25/11/2026: "di chuyển tới đó được luôn nhưng chỉ là cảnh đẹp thôi") ----------
   Ra khỏi các tờ bản đồ là đồng cỏ có cây, bụi, đá; đi bộ được tới vòng cảnh xa (núi Đơn R) rồi dừng. Không có người, không có việc.
   Dùng chung cho bản 3D (world3d.js vẽ cây, đá, cảnh xa) và va chạm (engine.js G.blockedWorld). Toạ độ px toàn thành phố (100 px = 1 đơn vị 3D):
   walk = đi được tới cách mép thành phố bao xa, far = vòng cảnh xa đứng ngay sau đó, band = cây, đá rải tới đâu (xa hơn đã chìm trong sương). */
G.COUNTRY = { walk: 1500, far: 1660, band: 1900, cell: 200 };
G.FAR_IMG = {   // cảnh xa đã đặt (Đơn R); chỉ dùng hình đã có trong game/assets, chưa có thì vòng cảnh xa trống
  zh: ['far_zh_mountains_1.webp', 'far_zh_mountains_2.webp', 'far_zh_terraces.webp', 'far_zh_mountains_3.webp', 'far_zh_pagoda_hill.webp'],
  en: ['far_en_hills.webp', 'far_en_forest.webp', 'far_en_wind.webp', 'far_en_mountains.webp']
};
(function () {
  var CT = null;
  // [hình, cỡ px, kiểu gấp, bán kính chặn theo cỡ]: cây chặn ở gốc, bụi và đá chặn cả khối
  var KIND = {
    zh: [['pc_zh_willow.png', 250, 'tree', 0.12], ['pc_zh_bamboo.png', 210, 'tree', 0.12], ['pc_zh_plum.png', 220, 'tree', 0.12], ['pc_tree_green.png', 230, 'tree', 0.12],
      ['pc_zh_willow.png', 270, 'tree', 0.12], ['pc_zh_bamboo.png', 190, 'tree', 0.12], ['pc_tree_small.png', 160, 'tree', 0.12],
      ['pc_bush_white.png', 120, 'tree', 0.3], ['pc_rock_moss.png', 95, null, 0.32], ['pc_rock.png', 85, null, 0.32]],
    en: [['pc_tree_green.png', 230, 'tree', 0.12], ['pc_tree_birch.png', 220, 'tree', 0.12], ['pc_tree_maple.png', 220, 'tree', 0.12], ['pc_tree_orange.png', 220, 'tree', 0.12],
      ['pc_tree_pine.png', 250, 'tree', 0.12], ['pc_tree_small.png', 160, 'tree', 0.12], ['pc_tree_green.png', 260, 'tree', 0.12], ['pc_tree_pine.png', 280, 'tree', 0.12],
      ['pc_bush_orange.png', 120, 'tree', 0.3], ['pc_bush_white.png', 120, 'tree', 0.3], ['pc_rock_moss.png', 95, null, 0.32], ['pc_rock.png', 85, null, 0.32]]
  };
  function hasImg(n) { return !!(G.ASSET_REV && G.ASSET_REV[n]); }
  /* bố cục đồng cỏ của thành phố đang dựng (G.WORLD3D), tính một lần; fresh: tính lại (kiểm thử) */
  G.country = function (fresh) {
    var WD = G.WORLD3D, id; if (!WD || !G.SCENES) return null;
    if (CT && CT.wd === WD && !fresh) return CT;
    var R = [], x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, city = 'en';
    for (id in WD) if (WD.hasOwnProperty(id) && G.SCENES[id]) {
      var d = WD[id], s = G.SCENES[id];
      R.push([d.ox, d.oy, d.ox + s.w, d.oy + s.h]);
      x0 = Math.min(x0, d.ox); y0 = Math.min(y0, d.oy); x1 = Math.max(x1, d.ox + s.w); y1 = Math.max(y1, d.oy + s.h);
      if (s.city === 'zh') city = 'zh';
    }
    if (!R.length) return null;
    var C = G.COUNTRY, K = KIND[city], items = [], grid = {}, seed = 20261124, STEP = 210;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function inside(x, y) { for (var i = 0; i < R.length; i++) { var r = R[i]; if (x > r[0] - 25 && x < r[2] + 25 && y > r[1] - 25 && y < r[3] + 25) return true; } return false; }
    for (var y = y0 - C.band; y < y1 + C.band; y += STEP) for (var x = x0 - C.band; x < x1 + C.band; x += STEP) {
      var px = x + (rnd() - 0.5) * STEP * 0.9, py = y + (rnd() - 0.5) * STEP * 0.9;
      if (inside(px, py)) continue;
      var edge = Math.max(x0 - px, px - x1, y0 - py, py - y1, 0);   // càng xa thành phố càng thưa
      if (rnd() > (edge < 300 ? 0.5 : edge < C.walk ? 0.32 : 0.24)) continue;
      var k = K[Math.floor(rnd() * K.length)], sz = k[1] * (0.8 + rnd() * 0.45);
      if (Math.abs(edge - C.far) < 90) continue;   // chừa chỗ cho vòng cảnh xa
      var it = { img: k[0], x: px, y: py, s: sz, fold: k[2], r: sz * k[3] }, gk = Math.floor(px / C.cell) + ',' + Math.floor(py / C.cell);
      items.push(it); (grid[gk] || (grid[gk] = [])).push(it);
    }
    // vòng cảnh xa: các tấm đứng nối nhau dọc đường bao cách mép thành phố C.far px, cao 5–9 đơn vị, dùng lại hình có lật, đổi cỡ
    var far = [], imgs = (G.FAR_IMG[city] || []).filter(hasImg);
    if (imgs.length) {
      var fx0 = x0 - C.far, fy0 = y0 - C.far, fw = x1 - x0 + 2 * C.far, fh = y1 - y0 + 2 * C.far, per = 2 * (fw + fh), n = Math.max(8, Math.round(per / 950)), fseed = 7;
      for (var q = 0; q < n; q++) {
        var t = (q + 0.5) / n * per, fxp, fyp;
        if (t < fw) { fxp = fx0 + t; fyp = fy0; }
        else if (t < fw + fh) { fxp = fx0 + fw; fyp = fy0 + t - fw; }
        else if (t < 2 * fw + fh) { fxp = fx0 + fw - (t - fw - fh); fyp = fy0 + fh; }
        else { fxp = fx0; fyp = fy0 + fh - (t - 2 * fw - fh); }
        fseed = (fseed * 16807) % 2147483647;
        far.push({ img: imgs[q % imgs.length], x: fxp, y: fyp, h: 520 + (fseed % 380), flip: (fseed >> 3) % 2 === 1 });
      }
    }
    return (CT = { wd: WD, city: city, rects: R, x0: x0, y0: y0, x1: x1, y1: y1, items: items, grid: grid, far: far });
  };
  /* đồng cỏ: chặn khi quá mép đi được (tới vòng cảnh xa thì dừng) hoặc vướng gốc cây, bụi, đá */
  G.countryBlocked = function (gx, gy) {
    var C = G.country(); if (!C) return true;
    var lim = G.COUNTRY.walk, cs = G.COUNTRY.cell;
    if (gx < C.x0 - lim || gx > C.x1 + lim || gy < C.y0 - lim || gy > C.y1 + lim) return true;
    var cx = Math.floor(gx / cs), cy = Math.floor(gy / cs);
    for (var j = cy - 1; j <= cy + 1; j++) for (var i = cx - 1; i <= cx + 1; i++) {
      var L = C.grid[i + ',' + j]; if (!L) continue;
      for (var k = 0; k < L.length; k++) { var o = L[k], dx = gx - o.x, dy = (gy - o.y) * 2; if (dx * dx + dy * dy < o.r * o.r) return true; }
    }
    return false;
  };
  /* còn cách mép đi được bao nhiêu px (âm: đã quá mép) */
  G.countryEdge = function (gx, gy) {
    var C = G.country(), lim = G.COUNTRY.walk; if (!C) return 0;
    return Math.min(gx - (C.x0 - lim), C.x1 + lim - gx, gy - (C.y0 - lim), C.y1 + lim - gy);
  };
  /* đang ở đồng cỏ cách tờ bản đồ gần nhất bao nhiêu px; 0 = đang trong phố */
  G.countryOut = function (gx, gy) {
    var C = G.country(); if (!C) return 0;
    var best = 1e9;
    for (var i = 0; i < C.rects.length; i++) {
      var r = C.rects[i], dx = Math.max(r[0] - gx, 0, gx - r[2]), dy = Math.max(r[1] - gy, 0, gy - r[3]);
      best = Math.min(best, Math.sqrt(dx * dx + dy * dy));
    }
    return best;
  };
})();
