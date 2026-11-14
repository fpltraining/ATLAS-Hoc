# Thị trấn Ngôn Ngữ: bản thiết kế

Game học tiếng Anh và tiếng Trung cho Han. Người chơi là một nhân vật sống trong thị trấn 2D,
nhìn từ trên xuống nghiêng nhẹ. Muốn đi xa hơn thì phải học: qua bài kiểm tra thì cửa phòng kế mở ra,
xong cả trường thì tốt nghiệp. Ngoài giờ học có quán cà phê, chợ, sân bay, bệnh viện để nói thật.

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

```
              [Sân bay ✈]
                   |
 [Chợ 🛒] ---- Quảng trường ---- [Quán cà phê ☕]
                   |
   [Trường Anh ngữ]   [Học viện Hán ngữ]
                   |
            [Nhà của bạn 🏠]  ← điểm xuất phát
                   |
            [Bệnh viện ✚]
```

- **Bản đồ thị trấn:** một ảnh nền lớn. Nhà cửa là các ảnh riêng do code đặt lên nền, nên cửa luôn nằm đúng chỗ.
  Camera đi theo nhân vật.
- **Nhà của bạn:** nơi lưu game, xem bằng tốt nghiệp, sao lưu và đổi nhân vật.
- **Kai** (robot hip-hop) đi theo người chơi khắp nơi. Kai nói hướng dẫn ngắn: "Phòng A1-2 vừa mở!".
- **Ban ngày và ban đêm** theo giờ Việt Nam thật. Trời phủ màu tối dần sau 18:00. Riêng quán cà phê mở tới 22:00 (chỉ là chi tiết vui, không khoá học).

### Nhân vật người chơi
Chọn một trong hai khi bắt đầu (đổi được ở Nhà):
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

Mỗi nơi có hai người phục vụ: một nói tiếng Anh, một nói tiếng Trung. Người chơi chọn nói chuyện với ai.

| Nơi | Tiếng Anh | Tiếng Trung | Tình huống | Mở khi |
|---|---|---|---|---|
| Quán cà phê | **Leo** (pha chế, tạp dề nâu, tóc xoăn) | **小林 Tiểu Lâm** (cô gái tóc đuôi ngựa) | Gọi món, hỏi giá, trả tiền | Xong A1-4 / HSK1-4 |
| Chợ | **Mrs. Rosa** (bà bán hoa quả, khăn trùm) | **王大妈 Bác Vương** (bà bán rau) | Mua hàng, mặc cả, đếm tiền | Xong A2-2 / HSK2 mua sắm |
| Sân bay | **Officer Grace** (nhân viên quầy, đồng phục xanh) | **周小姐 Cô Chu** (tiếp viên) | Làm thủ tục, hỏi cửa ra máy bay, hải quan | Xong A2-3 / HSK2 hỏi đường |
| Bệnh viện | **Dr. Anna** | **孙医生 Bác sĩ Tôn** | Kể triệu chứng, hiểu lời dặn | Xong A2-4 / HSK2 xem bệnh |

**Hội thoại:**
- NPC nói một câu: có tiếng đọc và chữ; tiếng Trung có thêm pinyin.
- Người chơi chọn 1 trong 3 câu trả lời. Câu đúng thì hội thoại đi tiếp, câu sai thì NPC phản ứng vui rồi cho chọn lại.
- Đi hết thì nhận "món đồ" kỷ niệm (ly cà phê, túi táo, vé máy bay…) bày trong Nhà.
- Mỗi nơi có 3 tình huống mỗi ngôn ngữ, mỗi tình huống 5–8 lượt.

---

## 5. Luồng chơi

```
Mở game → (video mở đầu, bỏ qua được) → chọn nhân vật → ra thị trấn, Kai chào
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

`localStorage["thitran-save-v1"]` chứa:

```json
{
  "v": 1,
  "nhanVat": "han",
  "viTri": { "canh": "thitran", "x": 512, "y": 640 },
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
- **Xuất sao lưu:** tải về file `thitran-YYYYMMDD-HHmm.json`.
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
  data/world.js        bản đồ, vị trí nhà, cửa, NPC
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
| **1** | Bản đồ thị trấn, nhân vật đi (chạm hoặc cần điều khiển), Kai đi theo, vào Trường Anh ngữ, phòng A1-1 với Ms. Emma: học, luyện, kiểm tra | Mở trên iPhone, đi vào trường, học xong A1-1, làm kiểm tra |
| **2** | Cửa khoá và mở, đủ 4 phòng A1, kiểm tra cuối cấp, tốt nghiệp, sao, XP, lưu, xuất và nhập | Thử thua dưới 80% thấy cửa vẫn khoá; xuất file rồi nhập lại thấy đúng tiến độ |
| **3** | Học viện Hán ngữ: phòng Phát âm + HSK1, pinyin, giọng zh-CN | Học HSK1-1, nghe giọng Trung, bật tắt pinyin |
| **4** | Khu đời sống: quán cà phê, chợ, sân bay, bệnh viện với hội thoại chọn câu | Gọi một ly cà phê bằng tiếng Anh và bằng tiếng Trung |
| **5** | Video mở đầu và tốt nghiệp, hiệu ứng, âm thanh, ngày và đêm | Tốt nghiệp A1 xem video; tắt mạng mở lại vẫn chơi được |
