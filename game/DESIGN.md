# Thế giới Ngôn Ngữ: bản thiết kế

Game học tiếng Anh và tiếng Trung cho Han. **Một thế giới, nhiều thành phố:** mỗi ngôn ngữ là một thành phố.
Học ngôn ngữ nào thì vào thành phố ấy. Muốn đổi ngôn ngữ thì ra sân bay, bay sang thành phố kia.
Người chơi là một nhân vật sống trong thành phố 2D, nhìn từ trên xuống nghiêng nhẹ.
Muốn đi xa hơn thì phải học: qua bài kiểm tra thì cửa phòng kế mở ra, xong cả trường thì tốt nghiệp.
Ngoài giờ học có quán, chợ, bệnh viện để nói chuyện thật.

Khung lấy cảm hứng từ trang "The Language Lab" của The Mandarin Lab (một ngôi nhà chung, mỗi ngôn ngữ một thành phố,
thẻ "Đang mở" và "Sắp ra mắt"). Tên, logo, chữ và hình đều là của mình, không chép của họ.

---

## 1. Nguyên tắc

| Điều | Cách làm |
|---|---|
| Chạy offline hoàn toàn | Mọi file, hình, tiếng đều được cache bằng service worker. Không Supabase, không gọi AI hay API. |
| Code | JavaScript ES5 thuần: không `=>`, `let`, `const`, chuỗi `` ` ``, `?.`. Không module, không công cụ build khi chạy. |
| Ngôn ngữ giao diện | Tiếng Việt. |
| Điện thoại cảm ứng | Chạm vào đâu thì nhân vật đi tới đó. Có thêm cần điều khiển ảo. Nút to tối thiểu 44px. |
| Giờ | Mọi mốc giờ lưu và hiện theo giờ Việt Nam (UTC+7). |
| Lưu tiến độ | `localStorage`. Có nút "Xuất file sao lưu" và "Nhập file sao lưu" (.json). |
| Video | mp4 H.264, `muted`, `playsinline`, `autoplay`. Bấm được để bỏ qua. |
| Hình chưa có | Hiện ô màu có ghi tên file. Bỏ đúng tên file vào `assets/` là app tự dùng, không phải sửa code. |

**Vị trí:** thư mục `game/` trong repo ATLAS-Hoc, chạy ở `fpltraining.github.io/ATLAS-Hoc/game/`.
Game tách hẳn khỏi app ATLAS: dữ liệu và tiến độ riêng, code ES5 riêng.

**Dùng lại kho có sẵn của ATLAS**, để không phải soạn lại nội dung:
- Từ vựng: tiếng Anh lấy từ `data/en/bank.json` (4.593 từ có câu ví dụ). Tiếng Trung lấy từ giáo trình HSK (`data/curriculum`).
  Một công cụ dựng sẽ chép phần cần dùng thành file `game/data/*.js` dạng ES5.
- Tiếng đọc: dùng tệp giọng AI đã tạo sẵn trong `audio/en` và `audio/zh` (chuẩn, chạy offline).
  Từ nào chưa có tệp thì dùng giọng của máy (`en-US`, `zh-CN`).

---

## 2. Thế giới

### 2.1 Ngôi nhà chung (màn hình chính)
Mở game là vào **Ngôi nhà chung**, một màn hình giống trang web chứ không phải bản đồ:
- **Đầu trang:** câu khẩu hiệu "Học thêm một ngôn ngữ, sống thêm một cuộc đời". Han và Kai vẫy chào. Có nút **Vào thành phố đang học**.
- **Lưới thẻ thành phố.** Mỗi thẻ có ảnh, tên, ngôn ngữ và nhãn trạng thái:
  - **Thị trấn Brightford** (nước Mỹ tương lai, khoảng năm 2080) · Tiếng Anh · *Đang mở*
  - **Trường Lạc trấn 长乐镇** (thị trấn sông nước Trung Quốc) · Tiếng Trung · *Đang mở*
  - 3 thẻ mờ *Sắp ra mắt*: Tiếng Nhật, Tiếng Hàn, Tiếng Pháp (chỉ để trang trí, sau này thêm thành phố được).
- **Hồ sơ của bạn:** nhân vật, cấp mỗi thành phố, XP, chuỗi ngày, bằng tốt nghiệp, đồ kỷ niệm, sổ từ khó.
- **Cuối trang:** Cài đặt, Xuất và nhập file sao lưu, Hướng dẫn chơi.

### 2.2 Thành phố
Mỗi thành phố là một bản đồ riêng, nhà cửa và người dân nói đúng ngôn ngữ của thành phố đó.

```
Brightford (tiếng Anh)                 Trường Lạc trấn (tiếng Trung)

      [Sân bay ✈]                             [Sân bay ✈]
           |                                       |
[Chợ] — Quảng trường — [Cà phê]       [Chợ] — Quảng trường — [Quán trà]
           |                                       |
   [Trường Anh ngữ]                        [Học viện Hán ngữ]
           |                                       |
     [Bệnh viện]                             [Bệnh viện]
```

- **Nhà cửa là ảnh riêng do code đặt lên ảnh nền**, nên cửa luôn nằm đúng chỗ. Camera đi theo nhân vật.
- **Sân bay** là cổng nối hai thành phố. Vào sân bay chọn "Bay sang …" thì có cảnh máy bay bay (video hoặc hoạt hình), rồi tới sân bay thành phố kia.
  Mỗi lần bay là một hội thoại ngắn ở quầy làm thủ tục bằng ngôn ngữ của nơi đi.
- **Kai** (robot hip-hop) đi theo người chơi ở cả hai thành phố, nói hướng dẫn ngắn bằng tiếng Việt: "Phòng A1-2 vừa mở!".
- **Ngày và đêm** theo giờ Việt Nam thật: trời phủ màu tối dần sau 18:00.

### Nhân vật người chơi
Chọn một trong hai khi bắt đầu (đổi được ở Ngôi nhà chung):
- **Han**: cô gái mặc đồ hip-hop, mũ bucket xanh (đã có sẵn từ app ATLAS).
- **Minh**: chàng trai cùng phong cách.

---

## 3. Hai trường học

Mỗi trường có một sảnh và các phòng xếp dọc hành lang theo cấp độ. Mỗi phòng có một giáo viên (NPC) dạy một chủ đề.

### Trường Anh ngữ (hiệu trưởng: Kai)

| Phòng | Chủ đề | Giáo viên | Ngoại hình | Giai đoạn |
|---|---|---|---|---|
| A1-1 | Chào hỏi, giới thiệu bản thân | **Ms. Emma** | Tóc vàng búi, áo len đỏ cam, kính tròn | GĐ1 |
| A1-2 | Số, giờ, ngày tháng | **Mr. Tom** | Ria mép, áo gile ca rô, cầm đồng hồ | GĐ2 |
| A1-3 | Gia đình và mọi người | **Mrs. Lily** | Tóc xoăn nâu, váy hoa, hiền | GĐ2 |
| A1-4 | Đồ ăn, đồ uống | **Chef Sam** | Đầu bếp to cao, mũ trắng, tạp dề | GĐ2 |
| A1 · Kiểm tra cuối cấp | Ôn cả A1 | **Kai** (hiệu trưởng) | Robot hip-hop | GĐ2 |
| A2-1 | Sinh hoạt hằng ngày | **Mr. Ben** | Đồ thể thao, khăn quấn cổ | sau |
| A2-2 | Mua sắm, tiền | **Ms. Mia** | Áo khoác vàng, túi mua sắm | sau |
| A2-3 | Chỉ đường, đi lại | **Officer Jack** | Cảnh sát giao thông, còi | sau |
| A2-4 | Sức khoẻ | **Dr. Anna** | Áo blouse, ống nghe | sau |
| B1 | Công việc · Kể chuyện du lịch · Cảm xúc và ý kiến · Tin tức và công nghệ | 4 giáo viên đặt sau | | sau |

### Học viện Hán ngữ (hiệu trưởng: **Lý hiệu trưởng 李校长**)

| Phòng | Chủ đề | Giáo viên | Ngoại hình | Giai đoạn |
|---|---|---|---|---|
| Phát âm | Pinyin, 4 thanh điệu | **王老师 Cô Vương** | Tóc ngắn, áo sườn xám xanh ngọc, cầm quạt | GĐ3 |
| HSK1-1 | 你好 Chào hỏi | **王老师 Cô Vương** | (như trên) | GĐ3 |
| HSK1-2 | 数字 Số, ngày, giờ | **李老师 Thầy Lý** | Thanh niên, áo sơ mi trắng, kính | GĐ3 |
| HSK1-3 | 家人 Gia đình | **张阿姨 Dì Trương** | Trung niên, tạp dề, tươi cười | GĐ3 |
| HSK1-4 | 吃饭 Ăn uống | **陈师傅 Bác Trần** | Đầu bếp, khăn vắt vai, chảo | GĐ3 |
| HSK1 · Kiểm tra cuối cấp | Ôn cả HSK1 | **李校长 Lý hiệu trưởng** | Ông cụ tóc bạc, áo Đường trang | GĐ3 |
| HSK2 | 时间 · 买东西 · 问路 · 看病 | **刘老师 · 小美 · 赵叔叔 · 孙医生** | | sau |
| HSK3 | 4 phòng đặt sau | | | sau |

**Tiếng Trung luôn hiện chữ Hán + pinyin có dấu thanh + nghĩa tiếng Việt**, đọc bằng giọng `zh-CN`.
Có nút ẩn pinyin để tự luyện đọc.

---

## 4. Khu đời sống

Mỗi thành phố có khu đời sống riêng, người ở đó chỉ nói ngôn ngữ của thành phố.

| Nơi | Brightford (tiếng Anh) | Trường Lạc trấn (tiếng Trung) | Tình huống | Mở khi |
|---|---|---|---|---|
| Quán | Quán cà phê · **Leo** (pha chế, tạp dề nâu, tóc xoăn) | Quán trà · **小林 Tiểu Lâm** (cô gái tóc đuôi ngựa) | Gọi món, hỏi giá, trả tiền | Xong A1-4 / HSK1-4 |
| Chợ | **Mrs. Rosa** (bà bán hoa quả, khăn trùm) | **王大妈 Bác Vương** (bà bán rau) | Mua hàng, mặc cả, đếm tiền | Xong A2-2 / HSK2 mua sắm |
| Bệnh viện | **Dr. Anna** | **孙医生 Bác sĩ Tôn** | Kể triệu chứng, hiểu lời dặn | Xong A2-4 / HSK2 xem bệnh |
| Sân bay | **Officer Grace** (nhân viên quầy, đồng phục xanh) | **周小姐 Cô Chu** (tiếp viên) | Làm thủ tục, hỏi cửa ra máy bay | Luôn mở để bay qua lại. Hội thoại khó hơn mở sau A2-3 / HSK2 hỏi đường |

**Hội thoại:**
- NPC nói một câu: có tiếng đọc và chữ; tiếng Trung có thêm pinyin.
- Người chơi chọn 1 trong 3 câu đáp. Câu đúng thì đi tiếp, câu sai thì NPC phản ứng vui rồi cho chọn lại.
- Đi hết thì nhận đồ kỷ niệm (ly cà phê, ấm trà, túi táo, vé máy bay…), bày ở Ngôi nhà chung.
- Mỗi nơi có 3 tình huống, mỗi tình huống 5–8 lượt.

---

## 5. Luồng chơi

```
Mở game → (video mở đầu, bỏ qua được) → chọn nhân vật → Ngôi nhà chung
→ bấm thẻ "Brightford · Tiếng Anh" → hạ cánh ở sân bay Brightford, Kai chào
→ đi vào Trường Anh ngữ → sảnh → cửa phòng A1-1 (mở sẵn) → gặp Ms. Emma
→ Học: thẻ từ (nghe, xem nghĩa, ví dụ)
→ Luyện: 3 trò ngắn (nghe chọn nghĩa · nhìn nghĩa chọn từ · ghép câu)
→ Kiểm tra 10 câu → đạt từ 80% → cửa A1-2 mở, Kai báo
→ … xong 4 phòng A1 → Kiểm tra cuối cấp với Kai (20 câu, đạt từ 80%)
→ Tốt nghiệp A1: video, bằng treo ở Nhà, tầng A2 mở
```

**Trong một phòng:**
1. **Học** (5–10 phút): 10–12 từ hoặc cụm từ, mỗi từ có tiếng đọc, nghĩa, câu ví dụ và hình nếu có. Giáo viên nói lời mở đầu.
2. **Luyện** (không chấm, sai thì làm lại): nghe chọn nghĩa, nhìn nghĩa chọn từ, sắp xếp câu.
3. **Kiểm tra:** 10 câu trộn ngẫu nhiên, không gợi ý. Từ 8/10 trở lên là qua.

---

## 6. Điểm, sao, mở khoá

| Thứ | Cách tính |
|---|---|
| **Điểm kinh nghiệm (XP)** | Câu đúng khi luyện +2, câu đúng khi kiểm tra +5, xong một hội thoại đời sống +20, tốt nghiệp một cấp +100 |
| **Sao của phòng** | Kiểm tra 8/10 = ★, 9/10 = ★★, 10/10 = ★★★. Giữ kết quả cao nhất. Làm lại bao nhiêu lần cũng được. |
| **Mở cửa phòng kế** | Phòng trước đạt từ 80% (8/10). |
| **Kiểm tra cuối cấp** | Mở khi xong mọi phòng trong cấp. 20 câu lấy từ cả cấp, đạt từ 80% (16/20). |
| **Tốt nghiệp** | Qua kiểm tra cuối cấp → nhận bằng, mở cấp kế (A1 → A2 → B1; HSK1 → HSK2 → HSK3). |
| **Khu đời sống** | Mở theo phòng tương ứng (bảng ở mục 4). |
| **Chuỗi ngày** | Ngày nào cũng có học ít nhất một hoạt động (theo giờ Việt Nam) thì chuỗi tăng 1. |
| **Ôn tập** | Từ trả lời sai được đưa vào "Sổ từ khó" ở Nhà để ôn lại sau. |

---

## 7. Lưu tiến độ

`localStorage["thegioi-save-v1"]` chứa:

```json
{
  "v": 1,
  "nhanVat": "han",
  "viTri": { "canh": "brightford", "x": 512, "y": 640 },
  "xp": 340,
  "phong": { "en-a1-1": { "sao": 3, "diem": 10, "lan": 2, "luc": "2026-11-14 20:15" } },
  "totNghiep": { "en-a1": "2026-11-20 21:03" },
  "doiSong": { "cafe-en-1": true },
  "tuKho": ["en:breakfast", "zh:谢谢"],
  "chuoi": { "hienTai": 4, "ngayCuoi": "2026-11-14" },
  "caiDat": { "amThanh": true, "hienPinyin": true }
}
```

- Mọi chuỗi giờ ở dạng `YYYY-MM-DD HH:mm`, theo giờ Việt Nam.
- **Xuất sao lưu:** tải về file `thegioi-YYYYMMDD-HHmm.json`.
- **Nhập sao lưu:** chọn file → kiểm tra hợp lệ → hỏi lại trước khi ghi đè.

---

## 8. Kỹ thuật

```
game/
  index.html           một trang
  sw.js                cache offline (tự quét danh sách assets)
  manifest.webmanifest
  js/engine.js         vẽ canvas, camera, di chuyển, va chạm, cảnh
  js/ui.js             hộp thoại, thẻ từ, câu hỏi, bảng tiến độ
  js/save.js           lưu, xuất, nhập, giờ Việt Nam
  js/audio.js          phát tệp giọng có sẵn, không có thì dùng giọng máy
  js/assets.js         tải ảnh; thiếu thì vẽ ô màu ghi tên file
  js/lobby.js          Ngôi nhà chung: thẻ thành phố, hồ sơ, sao lưu
  data/world.js        hai thành phố: bản đồ, vị trí nhà, cửa, NPC
  data/en.js, zh.js    nội dung phòng (dựng từ kho ATLAS)
  data/life.js         hội thoại khu đời sống
  assets/              hình và video anh đặt từ ChatGPT
```

- Vẽ bằng `<canvas>` 2D. Nhân vật có dáng đi lắc nhẹ bằng code, nên chỉ cần một hình mỗi hướng.
- **Ảnh thiếu:** `assets.js` bắt lỗi tải và vẽ ô màu có tên file. Không cần sửa code khi có file thật.
- **Service worker:** cache cả `game/` và `assets/`, cùng các tệp tiếng của những từ game dùng.
  Ảnh mới bỏ vào cũng được cache ở lần mở tiếp theo có mạng.

---

## 9. Giai đoạn

| GĐ | Làm gì | Test thế nào |
|---|---|---|
| **1** | Ngôi nhà chung (lưới thẻ thành phố). Bản đồ Brightford, nhân vật đi (chạm hoặc cần điều khiển), Kai đi theo. Vào Trường Anh ngữ, phòng A1-1 với Ms. Emma: học, luyện, kiểm tra | Mở trên iPhone, bấm thẻ Brightford, đi vào trường, học xong A1-1, làm kiểm tra |
| **2** | Cửa khoá và mở, đủ 4 phòng A1, kiểm tra cuối cấp, tốt nghiệp, sao, XP, hồ sơ, lưu, xuất và nhập | Thử thua dưới 80% thấy cửa vẫn khoá; xuất file rồi nhập lại thấy đúng tiến độ |
| **3** | Trường Lạc trấn: bản đồ, Học viện Hán ngữ (Phát âm + HSK1), pinyin, giọng zh-CN; sân bay bay qua lại giữa hai thành phố | Bay từ Brightford sang Trường Lạc trấn, học HSK1-1, bật tắt pinyin |
| **4** | Khu đời sống ở cả hai thành phố: quán, chợ, bệnh viện, quầy sân bay | Gọi cà phê ở Brightford, gọi trà ở Trường Lạc trấn |
| **5** | Video mở đầu, bay và tốt nghiệp; hiệu ứng, âm thanh, ngày và đêm | Tốt nghiệp A1 xem video; tắt mạng mở lại vẫn chơi được |
