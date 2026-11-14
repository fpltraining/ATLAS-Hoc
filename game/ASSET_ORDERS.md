# Danh sách đặt hình: Thế giới Ngôn Ngữ

## ĐƠN ĐANG CHỜ (copy nguyên khối dưới đây gửi AI vẽ hình, đính kèm hình Han)

Làm xong anh cứ dán hình vào đoạn chat với em, không cần đổi tên hay lưu thư mục: em tự cắt, đặt tên và lưu vào game.
Những hình đã gửi em rồi thì không có trong đơn này.

```
Please create the following images for my 2D mobile game, ONE image per message, in this order (I will say "next" after each).
Attached: my main character. Match its art style exactly.

GLOBAL RULES FOR EVERY IMAGE
- Cozy chibi 2D game art like the attached character: thick dark-brown outlines, flat soft colors, gentle shading.
- Palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0.
- NO text, letters or numbers anywhere (only exception: the number 7 on the bus).
- [MAGENTA] = isolated subject on a solid flat magenta #FF00FF background, nothing else.
- [MAP] = top-down view tilted slightly (3/4 view, camera ~30° above ground), fills the whole image, wide 3:2.
- English town setting: Brightford, a cozy small town in the near-future USA (year 2080): rounded white-and-glass buildings with warm wood, solar roofs, rooftop gardens, small hover-cars, delivery drones, oak and palm trees.

1. Wide 3:2 world-map scene: two small islands, left = Brightford (near-future American town), right = the Chinese water town, connected by a dotted flight path with a tiny airplane, ocean and clouds around.
```

Đã nhận và lưu: xe buýt, tàu điện (đóng/mở cửa), 2 dải phố, bản đồ trung tâm, 5 toà nhà, hành lang, lớp học, 3 thẻ thành phố; 6 bộ trang phục, 8 kiểu tóc, 6 khuôn mặt, bản đồ khu phố Maple, nhà, bến xe buýt, cửa ga tàu, tài xế Mr. Joe; Han, Minh (3 hướng + 3 biểu cảm), Ms. Emma, cô Vương, hiệu trưởng Lý (+ tư thế nói), cửa mở. Kai dùng hình của app ATLAS.

---

**Cách làm:**
1. Mở ChatGPT, dán câu lệnh của từng mục (bằng tiếng Anh).
2. Tải ảnh gốc PNG về, đổi tên đúng như cột "Tên file".
3. Gửi em hoặc bỏ thẳng vào `game/assets/`. App tự dùng, không phải sửa code.

**Quy tắc để cả bộ cùng một phong cách:**
- Mỗi nhóm (nhân vật, nhà, nội thất…) làm trong **một đoạn chat riêng**. Ảnh đầu tiên của nhóm là mẫu, các ảnh sau thêm câu
  *"Same style as the previous image."*
- **Nhân vật phải nền trong suốt.** Nếu ChatGPT trả về nền trắng hoặc ô caro giả, anh dán thêm:
  *"Make the background truly transparent (PNG alpha)."* Vẫn hỏng thì gửi em, em tự tách nền.
- **Không có chữ trong ảnh.** Chữ do game in lên.

**Câu phong cách chung** (đã chèn sẵn trong mọi câu lệnh bên dưới):
> Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground),
> soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee,
> coral #c8553d, jade #2f7a63, sky blue #8bbac0. Same style for every asset in this set. No text, letters or numbers anywhere.

**Bối cảnh:**
- **Brightford (tiếng Anh):** thị trấn nhỏ ở nước Mỹ tương lai (khoảng năm 2080): nhà tròn trắng và kính, mái pin mặt trời, vườn trên mái, xe bay nhỏ, drone giao hàng, biển hiệu phát sáng không chữ.
- **Trường Lạc trấn (tiếng Trung):** thị trấn Trung Quốc sông nước: tường trắng mái ngói cong, đèn lồng đỏ, cầu đá, kênh nhỏ.
- Làm bằng AI nào cũng được (ChatGPT, Meta AI…), miễn **cùng một đoạn chat** cho cả một nhóm để giữ đúng phong cách.

Ký hiệu cột **GĐ**: làm trước những mục của giai đoạn sắp code.

---

## A. Nhân vật người chơi (GĐ1) · nền trong suốt · 1024×1024

Cùng một đoạn chat. Mỗi nhân vật có 3 hướng: mặt trước, sau lưng, bên trái. Hướng bên phải game tự lật ảnh bên trái.

| Tên file | Mô tả | Câu lệnh |
|---|---|---|
| `player_han_down.png` | Han, mặt trước | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text anywhere. Transparent background PNG. One chibi game character only, full body from head to shoes, centered, small soft shadow under the feet: Han, a cheerful young Vietnamese woman in hip-hop streetwear: green bucket hat over a small bun of black hair, navy oversized hoodie, red bandana around the neck, cream cargo pants, white-and-red sneakers. Facing the camera (walking down). |
| `player_han_up.png` | Han, sau lưng | Same style and same character as the previous image. Transparent background PNG. Han seen from behind, facing away from the camera (walking up), full body. |
| `player_han_left.png` | Han, bên trái | Same style and same character. Transparent background PNG. Han in side view facing left, mid-step walking, full body. |
| `player_minh_down.png` | Minh, mặt trước | Same style as the previous images. Transparent background PNG. One chibi game character, full body, centered, small soft shadow under the feet: Minh, a friendly young Vietnamese man in hip-hop streetwear: navy cap worn backwards, short black hair, jade-green hoodie, cream joggers, white sneakers, small backpack. Facing the camera (walking down). |
| `player_minh_up.png` | Minh, sau lưng | Same style and same character. Transparent background PNG. Minh seen from behind (walking up), full body. |
| `player_minh_left.png` | Minh, bên trái | Same style and same character. Transparent background PNG. Minh in side view facing left, mid-step walking, full body. |
| `kai_follow.png` | Kai đi theo người chơi | Same style. Transparent background PNG. Kai, a small friendly robot: round teal head and body, navy cap worn sideways, red headphones around the neck, gold chain, green gloves, white sneakers, small antenna with a red light. Facing the camera, slightly floating happily, full body. |

---

## B. Ngôi nhà chung: thẻ thành phố (GĐ1) · 1024×1024, không cần trong suốt

Một đoạn chat. Thẻ vuông bo góc, mỗi thẻ là một "cửa sổ" nhìn vào thành phố. Game in tên thành phố bên dưới.

| Tên file | Mô tả | Câu lệnh |
|---|---|---|
| `card_city_en.png` | Thẻ Brightford (tiếng Anh) | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text, letters or numbers anywhere. Brightford, a cozy near-future American small town (around 2080) seen from slightly above: rounded white-and-glass buildings with warm wood, solar-panel roofs, rooftop gardens, a small hover-car and a delivery drone, a main street with blank glowing signs, palm and oak trees, soft morning light. Centered composition. |
| `card_city_zh.png` | Thẻ Trường Lạc trấn (tiếng Trung) | Same style as the previous image. No text or characters. A square app card illustration: a charming small Chinese water town seen from slightly above, white walls with dark curved roof tiles, red lanterns (blank), stone arch bridges over a canal, a small boat, willow trees, soft morning light. |
| `card_city_soon.png` | Thẻ "Sắp ra mắt" dùng chung | Same style. No text. A square app card illustration: a city skyline hidden behind soft clouds, a small airplane flying toward it, muted pastel colors, dreamy and mysterious. |
| `lobby_hero.png` | Ảnh đầu trang Ngôi nhà chung · 1536×1024 | Same style. No text. A cozy world map island scene seen from above: two small towns on two islands (left: a near-future American town with rounded glass buildings, solar roofs and hover-cars; right: a Chinese water town with curved roofs and canals), connected by a dotted flight path with a tiny airplane, ocean around, clouds. Wide 3:2. |

---

## C. Bản đồ và nhà cửa (Brightford ở GĐ1, Trường Lạc trấn ở GĐ3)

Mỗi thành phố một đoạn chat. Ảnh nền làm trước, nhà làm sau, thêm câu *"Same style as the previous image."*
Ảnh nền 1536×1024, không cần trong suốt. Nhà 1024×1024 **nền trong suốt**, cửa chính luôn nằm **giữa cạnh dưới**.

### Brightford (tiếng Anh)

| Tên file | Mô tả | Câu lệnh |
|---|---|---|
| `map_en.png` | Mặt đất thành phố, **không có nhà** | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text, letters or numbers anywhere. The ground map of Brightford, a cozy near-future American small town (around 2080), seen from above with NO buildings: a round plaza with a glowing water fountain in the center, wide smooth walkways going north, east, west and south, five empty flat grass lots beside the walkways where buildings will be placed later, solar street lamps, charging stations, benches, a parked hover-car, oak and palm trees, flower beds. Wide 3:2. |
| `building_en_school.png` | Trường Anh ngữ | Same style as the previous image. Transparent background PNG. One building only, centered, front door at the bottom center: a friendly near-future American high school: rounded white walls with big glass windows and warm wood panels, a solar-panel roof with a small rooftop garden, a digital clock tower (blank face), a flag pole with a blank flag, a small robot-head shaped antenna on top. |
| `building_en_cafe.png` | Quán cà phê | Same style. Transparent background PNG. One building only, centered, door at the bottom center: a small near-future American corner café: glass front, jade-and-cream awning, a glowing coffee cup shaped sign (no letters), outdoor tables, a small serving robot, plants. |
| `building_en_market.png` | Chợ | Same style. Transparent background PNG. One structure only, centered, entrance at the bottom center: a near-future American farmers market hall with a curved glass roof and solar panels, hydroponic vegetable towers, fruit and flower stalls visible inside. |
| `building_en_hospital.png` | Bệnh viện | Same style. Transparent background PNG. One building only, centered, door at the bottom center: a clean small near-future hospital with white and sky-blue rounded walls, a glowing green cross sign, a hover-ambulance parked in front, a drone landing pad on the roof. |
| `building_en_airport.png` | Sân bay | Same style. Transparent background PNG. One building only, centered, glass doors at the bottom center: a small near-future airport terminal with a sweeping curved glass roof, a slim control tower, a sleek small electric airplane parked beside it. |

### Trường Lạc trấn (tiếng Trung)

| Tên file | Mô tả | Câu lệnh |
|---|---|---|
| `map_zh.png` | Mặt đất thị trấn sông nước, **không có nhà** | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text, letters or numbers anywhere. No Chinese characters. A small Chinese water town ground map seen from above with NO buildings: a stone plaza with an old well in the center, stone-slab paths going north, east, west and south, a narrow canal with two small arch bridges, five empty flat lots beside the paths, willow and plum trees, red lanterns on poles (blank). Wide 3:2. |
| `building_zh_school.png` | Học viện Hán ngữ | Same style as the previous image. Transparent background PNG. No characters. One building only, centered, front door at the bottom center: a traditional Chinese academy with curved dark roof tiles, coral-red pillars, red lanterns (blank), stone lion statues by the door. |
| `building_zh_teahouse.png` | Quán trà | Same style. Transparent background PNG. No characters. One building only, centered, door at the bottom center: a two-storey wooden teahouse with lattice windows, hanging lanterns, a teapot-shaped sign (blank), bamboo plants. |
| `building_zh_market.png` | Chợ | Same style. Transparent background PNG. No characters. One structure only, centered, entrance at the bottom center: an open-air morning market under a tiled roof, vegetable and fruit stalls, bamboo baskets. |
| `building_zh_hospital.png` | Bệnh viện | Same style. Transparent background PNG. No characters. One building only, centered, door at the bottom center: a small modern clinic with white walls, a green cross sign and a small traditional herb-medicine corner. |
| `building_zh_airport.png` | Sân bay | Same style. Transparent background PNG. No characters. One building only, centered, glass doors at the bottom center: a small airport terminal with a roof shaped like a curved traditional Chinese roof, and a small airplane parked beside it. |

### Bên trong nhà · 1536×1024, không cần trong suốt, không có người

Mỗi thành phố một đoạn chat. Góc nhìn giống bản đồ.

| Tên file | GĐ | Câu lệnh |
|---|---|---|
| `interior_en_hall.png` | 1 | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text, letters or numbers anywhere. No people. Interior of a bright near-future American school hallway seen from above: a long corridor with exactly five identical sliding glass classroom doors evenly spaced along the top wall, a reception desk with a small helper robot on the left, white lockers, a notice board with blank papers, potted plants, entrance at the bottom center. Wide 3:2. |
| `classroom_en.png` | 1 | Same style as the previous image. No text, no people. A cozy near-future American classroom seen from above: a large blank glowing smartboard on the top wall, teacher's desk, a few student desks, a world map without labels, bookshelves, a sunny window, door at the bottom center. Wide 3:2. |
| `interior_en_cafe.png` | 4 | Same style. No text, no people. Inside a cozy near-future American café seen from above: counter with an espresso machine and cakes in a glass case on the top side, small round tables, plants, warm lights, door at the bottom center. Wide 3:2. |
| `interior_en_market.png` | 4 | Same style. No text, no people. Inside a near-future farmers market seen from above: a fruit stall and a hydroponic vegetable stall on the top side, baskets, hanging scales, crates, door at the bottom center. Wide 3:2. |
| `interior_en_hospital.png` | 4 | Same style. No text, no people. Inside a small near-future clinic seen from above: reception desk top-left, doctor's desk with a floating hologram screen (blank) top-right, an examination bed, waiting chairs, entrance at the bottom center. Wide 3:2. |
| `interior_en_airport.png` | 3 | Same style. No text, no people. Inside a near-future airport terminal seen from above: self check-in kiosks top-left, a boarding gate top-right, rows of seats, a big window showing an airplane, entrance at the bottom center. Wide 3:2. |
| `interior_zh_hall.png` | 3 | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective, camera about 30 degrees above the ground), soft flat colors with clean dark outlines and gentle shading, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text, letters or numbers anywhere. No characters, no people. Hallway of a traditional Chinese academy seen from above: five wooden sliding doors evenly spaced along the top wall, red lanterns (blank), bamboo plants, a calligraphy brush stand, entrance at the bottom center. Wide 3:2. |
| `classroom_zh.png` | 3 | Same style as the previous image. No characters, no people. A cozy Chinese classroom seen from above: a blank blackboard, a low wooden teacher's table with ink stone and brush, student desks, lanterns, a round window with a plum blossom branch, door at the bottom center. Wide 3:2. |
| `interior_zh_teahouse.png` | 4 | Same style. No characters, no people. Inside a wooden teahouse seen from above: a tea counter with teapots and tea jars on the top side, low tables with tea sets, lattice windows, door at the bottom center. Wide 3:2. |
| `interior_zh_market.png` | 4 | Same style. No characters, no people. Inside a morning market seen from above: a vegetable stall and a fruit stall on the top side, bamboo baskets, hanging scales, door at the bottom center. Wide 3:2. |
| `interior_zh_hospital.png` | 4 | Same style. No characters, no people. Inside a small clinic seen from above: reception desk top-left, doctor's desk top-right, herb-medicine drawers on the wall, an examination bed, entrance at the bottom center. Wide 3:2. |
| `interior_zh_airport.png` | 3 | Same style. No characters, no people. Inside an airport terminal seen from above: check-in counters top-left, a boarding gate top-right, seats, red lantern decorations (blank), a big window with an airplane, entrance at the bottom center. Wide 3:2. |

---

## D. Giáo viên và người dân · nền trong suốt · 1024×1024

Cùng đoạn chat với nhóm A (nhân vật). Người Brightford đặt ở GĐ1–2, người Trường Lạc trấn ở GĐ3. Mỗi người một ảnh: toàn thân, đứng hơi xoay về phía camera.
Game dùng một ảnh cho cả bản đồ (thu nhỏ) và hộp thoại (phóng to).

Câu mở đầu chung cho mọi người trong nhóm này (đã ghép sẵn):
*"Same style as the previous character images. Transparent background PNG. One chibi character only, full body, centered, standing slightly turned toward the camera, small soft shadow under the feet. No text."*

| Tên file | GĐ | Ai | Câu lệnh |
|---|---|---|---|
| `npc_emma.png` | 1 | Ms. Emma, phòng A1-1 | Same style as the previous character images. Transparent background PNG. One chibi character only, full body, centered, standing slightly turned toward the camera, small soft shadow under the feet. No text. A kind young American English teacher: blonde hair in a bun, round glasses, coral-orange sweater, navy skirt, holding a small book, waving hello. |
| `npc_tom.png` | 2 | Mr. Tom, phòng A1-2 | (câu mở đầu chung) A cheerful middle-aged teacher with a brown moustache, checkered vest, rolled sleeves, holding a big pocket watch. |
| `npc_lily.png` | 2 | Mrs. Lily, phòng A1-3 | (câu mở đầu chung) A warm teacher in her forties with curly brown hair, a floral dress and a cardigan, holding a small family photo frame. |
| `npc_sam.png` | 2 | Chef Sam, phòng A1-4 | (câu mở đầu chung) A tall friendly chef with a white chef hat, white jacket, coral apron, holding a wooden spoon. |
| `npc_principal_li.png` | 3 | 李校长 Lý hiệu trưởng | (câu mở đầu chung) A wise elderly Chinese principal with white hair and a short white beard, wearing a navy traditional Tang-style jacket, hands behind his back, smiling. |
| `npc_wang.png` | 3 | 王老师 Cô Vương, phòng Phát âm và HSK1-1 | (câu mở đầu chung) A graceful Chinese teacher in her thirties with short black hair, a jade-green qipao-style dress, holding a folding fan. |
| `npc_li.png` | 3 | 李老师 Thầy Lý, HSK1-2 | (câu mở đầu chung) A young Chinese teacher with glasses, a white shirt with rolled sleeves, holding a small abacus. |
| `npc_zhang.png` | 3 | 张阿姨 Dì Trương, HSK1-3 | (câu mở đầu chung) A cheerful middle-aged Chinese auntie with permed hair, a flowered blouse and an apron, waving. |
| `npc_chen.png` | 3 | 陈师傅 Bác Trần, HSK1-4 | (câu mở đầu chung) A friendly Chinese cook with a towel over his shoulder, white tank top, holding a wok. |
| `npc_leo.png` | 4 | Leo, quán cà phê (Anh) | (câu mở đầu chung) A young barista with curly hair, a brown apron, holding a coffee cup with latte art. |
| `npc_xiaolin.png` | 4 | 小林 Tiểu Lâm, quán cà phê (Trung) | (câu mở đầu chung) A young Chinese barista girl with a ponytail, a jade apron, holding a cup of milk tea. |
| `npc_rosa.png` | 4 | Mrs. Rosa, chợ (Anh) | (câu mở đầu chung) A plump smiling grandmother fruit seller with a headscarf, holding a basket of apples. |
| `npc_wangdama.png` | 4 | 王大妈 Bác Vương, chợ (Trung) | (câu mở đầu chung) A lively elderly Chinese vegetable seller with grey hair, sleeve covers, holding a bunch of green vegetables. |
| `npc_grace.png` | 4 | Officer Grace, sân bay (Anh) | (câu mở đầu chung) An airport check-in officer in a neat navy uniform with a scarf, holding a passport. |
| `npc_zhou.png` | 4 | 周小姐 Cô Chu, sân bay (Trung) | (câu mở đầu chung) A Chinese flight attendant in a coral uniform with a small hat, smiling politely. |
| `npc_anna.png` | 4 | Dr. Anna, bệnh viện (Anh) | (câu mở đầu chung) A calm female doctor with a white coat and a stethoscope, holding a clipboard. |
| `npc_sun.png` | 4 | 孙医生 Bác sĩ Tôn, bệnh viện (Trung) | (câu mở đầu chung) A kind middle-aged Chinese male doctor with glasses, white coat, stethoscope. |

Giáo viên cấp A2, B1, HSK2, HSK3 sẽ được thêm vào danh sách khi tới giai đoạn đó.

---

## E. Đồ vật và giao diện · nền trong suốt · 1024×1024

Một đoạn chat. Đồ vật nhỏ, rõ nét, nhìn hơi nghiêng như trong game.

| Tên file | GĐ | Mô tả | Câu lệnh |
|---|---|---|---|
| `door_locked.png` | 2 | Cửa phòng đang khoá | Cozy 2D life-sim game art, top-down view tilted slightly, soft flat colors, clean dark outlines, warm palette navy, cream, coral, jade, sky blue. Transparent background PNG. No text. A single wooden classroom door, closed, with a big golden padlock and chain across it. |
| `door_open.png` | 2 | Cửa đã mở | Same style. Transparent background PNG. No text. The same wooden classroom door, open, with warm light glowing from inside and small sparkles. |
| `plane.png` | 3 | Máy bay bay giữa hai thành phố | Same style. Transparent background PNG. No text. A small cute passenger airplane seen from above at a slight angle, white and coral with a jade stripe, flying to the right. |
| `diploma_en.png` | 2 | Bằng tốt nghiệp tiếng Anh treo tường | Same style. Transparent background PNG. No text or letters. A framed diploma on a wall: cream paper with a blank area, a sky-blue ribbon seal, gold frame. |
| `diploma_zh.png` | 3 | Bằng tốt nghiệp tiếng Trung | Same style. Transparent background PNG. No text or characters. A framed scroll diploma with a red seal stamp (blank), dark wood frame, small tassels. |
| `souvenir_tea.png` | 4 | Kỷ niệm quán trà | Same style. Transparent background PNG. No characters. A small clay teapot with a tiny tea cup. |
| `souvenir_coffee.png` | 4 | Kỷ niệm quán cà phê | Same style. Transparent background PNG. A single takeaway coffee cup with a jade sleeve. |
| `souvenir_apples.png` | 4 | Kỷ niệm chợ | Same style. Transparent background PNG. A small paper bag of red apples. |
| `souvenir_ticket.png` | 4 | Kỷ niệm sân bay | Same style. Transparent background PNG. An airplane boarding pass without any text, with a small airplane icon. |
| `souvenir_medkit.png` | 4 | Kỷ niệm bệnh viện | Same style. Transparent background PNG. A small first-aid box with a green cross. |

---

## F. Video (GĐ5) · mp4, dọc 720×1280, 5–8 giây

Làm bằng mục tạo video của ChatGPT (Sora). Đính kèm ảnh nhân vật đã làm ở nhóm A để giữ đúng hình.
Tải về mp4 rồi gửi em: em nén lại, bỏ tiếng, kiểm tra chạy được trên iPhone.

| Tên file | Mô tả | Câu lệnh |
|---|---|---|
| `video_intro.mp4` | Mở đầu game | Use the attached characters exactly as they look. Cozy 2D life-sim animation, top-down tilted view, warm palette. The camera flies over a small world of islands at sunrise, passing a near-future American town and a Chinese water town, then stops on Han and the small robot Kai waving at the viewer. 6 seconds, vertical 9:16, no text, no sound needed. |
| `video_flight.mp4` | Bay giữa hai thành phố | Use the attached characters. Same style. Han and the small robot Kai look out of an airplane window, clouds and a small island city pass by below, both smile and wave. 5 seconds, vertical 9:16, no text. |
| `video_grad_en.mp4` | Tốt nghiệp tiếng Anh | Use the attached characters. Same style. Inside a bright school hall, Kai the robot principal hands a diploma to Han, confetti falls, Han jumps with joy. 6 seconds, vertical 9:16, no text. |
| `video_grad_zh.mp4` | Tốt nghiệp tiếng Trung | Use the attached characters. Same style. In a traditional Chinese academy courtyard with red lanterns, an elderly principal hands a scroll diploma to Han, red paper confetti falls, Han bows and smiles. 6 seconds, vertical 9:16, no text. |

---

## Đã nhận (14/11/2026)

Đã tách nền và bỏ vào `assets/`:
- Han (tóc nâu, áo hoodie đỏ) và Minh (tóc đen, áo khoác xanh navy): mặt trước, sau lưng, bên trái + 3 biểu cảm `player_*_happy/wow/think.png` (màn kết quả dùng).
- `npc_emma`, `npc_wang`, `npc_principal_li` + tư thế đang nói `npc_*_talk.png` (dùng trong khung thoại).
- `door_open.png`. `kai_follow.png` tạm lấy hình Kai của app ATLAS.

**Mẹo:** nền hồng tím đặc (#ff00ff) như đợt này là dễ tách nhất, anh cứ giữ cách đó. Người mới nên có thêm tư thế "đang nói" đặt tên `npc_<tên>_talk.png`.

---

## G. Nhân vật tự tạo · ghép lớp (đặt ngay)

Màn tạo nhân vật ghép 3 lớp hình: **thân + trang phục**, **khuôn mặt**, **tóc**. Game chỉ tô lại màu tóc, không vẽ thêm gì.
- Làm cả nhóm trong **một đoạn chat**, đính kèm hình Han (tóc nâu, hoodie đỏ) anh đã làm để giữ đúng nét vẽ.
- Nền **hồng tím đặc #FF00FF** như đợt trước.
- Mỗi hình là một **tờ** gồm nhiều ô. Anh **gửi tờ cho em**, không bỏ thẳng vào assets/: em cắt, căn cho các lớp khớp nhau rồi đặt tên file.

Câu mở đầu chung (dán ở đầu mỗi câu lệnh):
*"Same chibi art style as the attached character: thick dark-brown outlines, flat soft colors, big head, small body. Solid flat magenta #FF00FF background. No text."*

### G1. Thân + trang phục (6 tờ, mỗi tờ 1 bộ đồ, 3 hướng)

| Tờ | Tên file em sẽ cắt ra | Câu lệnh (sau câu mở đầu chung) |
|---|---|---|
| 1 | `body_hoodie_down/up/left.png` | A character turnaround of ONE chibi kid mannequin with a smooth BALD head and a BLANK face (no eyes, no mouth, no eyebrows, no hair), light skin, wearing a red hoodie, navy shorts and white sneakers. Three full-body views in one row, same size, evenly spaced, standing straight with arms down: front view, back view, side view facing left. |
| 2 | `body_jacket_*.png` | (giống tờ 1) wearing a light-blue denim jacket over a white t-shirt, dark jeans, red sneakers. |
| 3 | `body_uniform_*.png` | (giống tờ 1) wearing a navy school blazer with a small blank badge, white shirt, jade-green tie, grey trousers, black shoes. |
| 4 | `body_sport_*.png` | (giống tờ 1) wearing a jade-green tracksuit with white stripes and white running shoes. |
| 5 | `body_sweater_*.png` | (giống tờ 1) wearing a cream knitted sweater, a coral pleated skirt, white socks and brown shoes. |
| 6 | `body_tech_*.png` | (giống tờ 1) wearing a futuristic year-2080 light jacket with glowing sky-blue trim lines, black cargo pants and white high-tech sneakers. |

**Quan trọng:** cả 6 tờ phải cùng một dáng người, cùng cỡ đầu. Tờ sau bị khác dáng thì anh dán thêm: *"Keep exactly the same body shape, head size and pose as the previous sheet, only change the clothes."*

### G2. Tóc (3 tờ) · tóc **màu xám nhạt** để game tô màu

| Tờ | Tên file | Câu lệnh |
|---|---|---|
| 7 | `hair_messy/spiky/bowl_*.png` | Hairstyle pieces only, like wigs floating in the air: NO head, NO face, NO body. Every hairstyle is colored LIGHT GREY (#D8D8D8) with soft grey shading and dark-brown outlines. Draw 3 hairstyles, one per row: row 1 short messy hair, row 2 spiky hair, row 3 bowl cut with straight bangs. Each row shows the same hairstyle in 3 views: front, back, side facing left. Sized to fit the bald head of the previous character. |
| 8 | `hair_curly/sidepart/bun_*.png` | (giống tờ 7) row 1 curly hair, row 2 neat side-part hair, row 3 hair tied in a top bun. |
| 9 | `hair_ponytail/long_*.png` | (giống tờ 7, chỉ 2 hàng) row 1 high ponytail, row 2 long straight hair down to the shoulders. |

### G3. Khuôn mặt (2 tờ) · chỉ mắt, lông mày, miệng

| Tờ | Tên file | Câu lệnh |
|---|---|---|
| 10 | `face_*_down.png` | Chibi FACE FEATURES ONLY floating on the background: eyes, eyebrows, small mouth and light pink blush. NO head outline, NO skin, NO hair. 6 faces in a 3x2 grid, front view, same size: gentle smile, big sparkly eyes, cheerful closed-eye smile, cool confident look, calm sleepy eyes, cheeky wink. |
| 11 | `face_*_left.png` | (giống tờ 10) the same 6 faces in SIDE VIEW facing left: one eye, eyebrow, small mouth and blush, as they would look on a head seen from the side. Same order. |

---

## H. Đường tới trường: nhà, bến xe, ga tàu (đặt ngay)

| Tên file | Cỡ / nền | Câu lệnh |
|---|---|---|
| `map_home_en.png` | 1536×1024 | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective). No text. The ground map of Maple Street, a quiet residential neighborhood of a near-future American town (year 2080), seen from above with NO buildings: a curved street, sidewalks, three empty grass lots (left middle, right top, right bottom) where buildings will be placed, solar street lamps, small gardens, oak trees, a parked hover-car. Wide 3:2. |
| `building_en_home.png` | 1024 vuông · nền hồng | Same style. One building only, centered, front door at the bottom center: a cozy small family house of the year 2080 with rounded white walls, wood panels, a solar roof, a little garden and a mailbox. |
| `building_en_busstop.png` | 1024 vuông · nền hồng | Same style. One structure only, centered, at the bottom center: a futuristic bus stop shelter with a curved glass roof, a bench, a blank digital timetable screen and a pole with a round blank sign. |
| `building_en_metro.png` | 1024 vuông · nền hồng | Same style. One structure only, centered, entrance at the bottom center: a metro station entrance with stairs going down, a curved glass canopy and a big round blank sign. |
| `npc_driver.png` | 1024 vuông · nền hồng | Same style as the character images. One chibi character, full body: Mr. Joe, a friendly bus driver with a grey moustache, navy cap and uniform, waving. |
| `vehicle_bus.png` | 1536×768 · nền hồng | Same style. SIDE VIEW of a cute futuristic electric city bus facing RIGHT, coral red with cream stripes, big windows, the route number 7 on the front sign. Only the bus. |
| `vehicle_metro.png` | 1536×768 · nền hồng | Same style. SIDE VIEW of a short futuristic metro train (2 cars) facing RIGHT, white with a jade-green stripe, doors closed. Only the train. |
| `vehicle_metro_open.png` | 1536×768 · nền hồng | The same train as the previous image, exactly the same position and size, but with the doors open and warm light inside. |
| `ride_bg_bus.png` | 3072×1024 · không nền hồng | Same style. A long SIDE-VIEW street panorama of a near-future American town for a scrolling game background: towers with rounded glass, rooftop gardens, trees, street lamps; an empty road along the bottom 12% of the image. No vehicles on the road. The left and right edges must match so the image can repeat seamlessly. |
| `ride_bg_metro.png` | 3072×1024 · không nền hồng | Same style. A long SIDE-VIEW panorama seen from an elevated metro line: the town skyline, river, parks; an empty elevated rail track along the bottom 12%. Left and right edges must match so it repeats seamlessly. |

---

## Tổng kết theo giai đoạn

| Giai đoạn | Cần đặt | Số file |
|---|---|---|
| GĐ1 | Nhóm A (7 nhân vật), 4 ảnh Ngôi nhà chung, `map_en` + 5 nhà Brightford, `interior_en_hall`, `classroom_en`, `npc_emma` | 20 |
| GĐ2 | `npc_tom`, `npc_lily`, `npc_sam`, `door_locked`, `door_open`, `diploma_en` | 6 |
| GĐ3 | `map_zh` + 5 nhà Trường Lạc trấn, `interior_zh_hall`, `classroom_zh`, 2 nội thất sân bay, `plane`, 5 người HSK1, `diploma_zh` | 17 |
| GĐ4 | 6 nội thất đời sống, 8 người phục vụ, 5 kỷ niệm | 19 |
| GĐ5 | 4 video | 4 |

Chưa có file nào thì game vẫn chạy bằng ô màu ghi tên file. Anh đặt tới đâu, game đẹp lên tới đó.
