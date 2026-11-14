# Danh sách đặt hình: Thị trấn Ngôn Ngữ

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

## B. Thị trấn (GĐ1)

Một đoạn chat cho cả nhóm. Ảnh nền đi trước, các toà nhà làm sau.

| Tên file | Loại · cỡ | Mô tả | Câu lệnh |
|---|---|---|---|
| `map_town.png` | Ảnh nền · 1536×1024, không cần trong suốt | Mặt đất thị trấn: đường lát đá, quảng trường ở giữa, cỏ, cây, đèn đường. **Không có nhà** (nhà là ảnh riêng). | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective), soft flat colors with clean dark outlines, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text anywhere. A small cozy town ground map seen from above with NO buildings: a round stone plaza in the center with a fountain, cobblestone paths going north, east, west and south from the plaza, six empty flat grass lots beside the paths where buildings will be placed later, trees, flower beds, benches and street lamps along the paths. Wide landscape 3:2. |
| `building_home.png` | Nhà · 1024×1024, trong suốt | Nhà của bạn | Same style as the previous image. Transparent background PNG. One building only, centered, seen from the same tilted top-down angle, front door clearly visible at the bottom center: a small cozy two-storey house with a navy roof, cream walls, a round window and flower pots. |
| `building_en_school.png` | Nhà · 1024×1024, trong suốt | Trường Anh ngữ | Same style. Transparent background PNG. One building only, centered, front door clearly visible at the bottom center: a friendly modern school building with sky-blue walls, a clock tower, big windows, a small flag pole with a blank flag, and a robot-head shaped weather vane. |
| `building_zh_school.png` | Nhà · 1024×1024, trong suốt | Học viện Hán ngữ | Same style. Transparent background PNG. One building only, centered, front door clearly visible at the bottom center: a traditional Chinese academy with curved coral-red roof tiles, wooden pillars, red paper lanterns (blank, no characters), and stone lion statues by the door. |
| `building_cafe.png` | Nhà · 1024×1024, trong suốt | Quán cà phê | Same style. Transparent background PNG. One building only, centered, door at the bottom center: a small corner café with a striped jade-and-cream awning, outdoor tables, a big coffee cup sign shape (no letters), plants. |
| `building_market.png` | Nhà · 1024×1024, trong suốt | Chợ | Same style. Transparent background PNG. One structure only, centered, entrance at the bottom center: a covered open-air market hall with coral roof, fruit and vegetable stalls visible inside, baskets and crates. |
| `building_airport.png` | Nhà · 1024×1024, trong suốt | Sân bay | Same style. Transparent background PNG. One building only, centered, glass doors at the bottom center: a small modern airport terminal with a curved glass roof, a control tower, and a small airplane parked beside it. |
| `building_hospital.png` | Nhà · 1024×1024, trong suốt | Bệnh viện | Same style. Transparent background PNG. One building only, centered, door at the bottom center: a clean small hospital with white and sky-blue walls, a green cross sign, and an ambulance parked in front. |

---

## C. Bên trong nhà (GĐ1 làm 2 ảnh đầu, còn lại theo giai đoạn) · 1536×1024, không cần trong suốt

Một đoạn chat. Góc nhìn giống bản đồ. Không có người trong ảnh (NPC do game đặt vào).

| Tên file | GĐ | Mô tả | Câu lệnh |
|---|---|---|---|
| `interior_en_hall.png` | 1 | Hành lang Trường Anh ngữ: 5 cánh cửa phòng dọc tường trên | Cozy 2D life-sim game art, top-down view tilted slightly (3/4 perspective), soft flat colors with clean dark outlines, warm palette: navy #1b2140, cream #f8f4ee, coral #c8553d, jade #2f7a63, sky blue #8bbac0. No text and no people anywhere. Interior of a bright school hallway seen from above: a long corridor with exactly five identical classroom doors evenly spaced along the top wall, a reception desk on the left, lockers, a notice board with blank papers, potted plants, and the entrance at the bottom center. Wide landscape 3:2. |
| `classroom_en.png` | 1 | Lớp học tiếng Anh | Same style as the previous image. No text, no people. A cozy English classroom seen from above: a blank chalkboard on the top wall, teacher's desk in front of it, a few student desks, a world map (no labels), bookshelves, a window with sunlight, and the door at the bottom center. Wide 3:2. |
| `interior_zh_hall.png` | 3 | Hành lang Học viện Hán ngữ | Same style. No text, no characters, no people. Hallway of a traditional Chinese academy seen from above: five wooden sliding doors evenly spaced along the top wall, red paper lanterns (blank), bamboo plants, a calligraphy brush stand, and the entrance at the bottom center. Wide 3:2. |
| `classroom_zh.png` | 3 | Lớp học tiếng Trung | Same style. No text, no characters, no people. A cozy Chinese classroom seen from above: a blank blackboard, a low wooden teacher's table with ink stone and brush, student desks, paper lanterns, a round window with a plum blossom branch, door at the bottom center. Wide 3:2. |
| `interior_home.png` | 2 | Nhà của bạn | Same style. No text, no people. A cozy small bedroom-living room seen from above: bed, desk with a lamp, an empty wall for diplomas, a shelf for souvenirs, a rug, a window, door at the bottom center. Wide 3:2. |
| `interior_cafe.png` | 4 | Trong quán cà phê | Same style. No text, no people. Inside a cozy café seen from above: a counter with an espresso machine and cakes in a glass case on the top side, small round tables, plants, warm lights, door at the bottom center. Wide 3:2. |
| `interior_market.png` | 4 | Trong chợ | Same style. No text, no people. Inside a covered market seen from above: two stalls on the top side (one with fruit, one with vegetables), baskets, hanging scales, crates, door at the bottom center. Wide 3:2. |
| `interior_airport.png` | 4 | Trong sân bay | Same style. No text, no people. Inside an airport terminal seen from above: check-in counters on the top-left, a security gate on the top-right, rows of seats, a big window showing an airplane, entrance at the bottom center. Wide 3:2. |
| `interior_hospital.png` | 4 | Trong bệnh viện | Same style. No text, no people. Inside a small clinic seen from above: a reception desk on the top-left, a doctor's desk with a computer on the top-right, an examination bed, waiting chairs, plants, entrance at the bottom center. Wide 3:2. |

---

## D. Giáo viên và người trong thị trấn · nền trong suốt · 1024×1024

Cùng đoạn chat với nhóm A (nhân vật). Mỗi người một ảnh: toàn thân, đứng hơi xoay về phía camera.
Game dùng một ảnh cho cả bản đồ (thu nhỏ) và hộp thoại (phóng to).

Câu mở đầu chung cho mọi người trong nhóm này (đã ghép sẵn):
*"Same style as the previous character images. Transparent background PNG. One chibi character only, full body, centered, standing slightly turned toward the camera, small soft shadow under the feet. No text."*

| Tên file | GĐ | Ai | Câu lệnh |
|---|---|---|---|
| `npc_emma.png` | 1 | Ms. Emma, phòng A1-1 | Same style as the previous character images. Transparent background PNG. One chibi character only, full body, centered, standing slightly turned toward the camera, small soft shadow under the feet. No text. A kind young British English teacher: blonde hair in a bun, round glasses, coral-orange sweater, navy skirt, holding a small book, waving hello. |
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
| `diploma_en.png` | 2 | Bằng tốt nghiệp tiếng Anh treo tường | Same style. Transparent background PNG. No text or letters. A framed diploma on a wall: cream paper with a blank area, a sky-blue ribbon seal, gold frame. |
| `diploma_zh.png` | 3 | Bằng tốt nghiệp tiếng Trung | Same style. Transparent background PNG. No text or characters. A framed scroll diploma with a red seal stamp (blank), dark wood frame, small tassels. |
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
| `video_intro.mp4` | Mở đầu game | Use the attached characters exactly as they look. Cozy 2D life-sim animation, top-down tilted view, warm palette. The camera glides over a small cozy town at sunrise, then stops at the town plaza where Han and the small robot Kai wave at the viewer. 6 seconds, vertical 9:16, no text, no sound needed. |
| `video_grad_en.mp4` | Tốt nghiệp tiếng Anh | Use the attached characters. Same style. Inside a bright school hall, Kai the robot principal hands a diploma to Han, confetti falls, Han jumps with joy. 6 seconds, vertical 9:16, no text. |
| `video_grad_zh.mp4` | Tốt nghiệp tiếng Trung | Use the attached characters. Same style. In a traditional Chinese academy courtyard with red lanterns, an elderly principal hands a scroll diploma to Han, red paper confetti falls, Han bows and smiles. 6 seconds, vertical 9:16, no text. |

---

## Tổng kết theo giai đoạn

| Giai đoạn | Cần đặt | Số file |
|---|---|---|
| GĐ1 | Nhóm A (7), nhóm B (8), `interior_en_hall`, `classroom_en`, `npc_emma` | 18 |
| GĐ2 | `npc_tom`, `npc_lily`, `npc_sam`, `interior_home`, `door_locked`, `door_open`, `diploma_en` | 7 |
| GĐ3 | `interior_zh_hall`, `classroom_zh`, `npc_principal_li`, `npc_wang`, `npc_li`, `npc_zhang`, `npc_chen`, `diploma_zh` | 8 |
| GĐ4 | 4 nội thất đời sống, 8 người phục vụ, 4 kỷ niệm | 16 |
| GĐ5 | 3 video | 3 |

Chưa có file nào thì game vẫn chạy bằng ô màu ghi tên file. Anh đặt tới đâu, game đẹp lên tới đó.
