---
name: connectlife-taste
description: >-
  Luật thẩm mỹ giao diện của app học ConnectLife (thư mục game/), chuyển thể từ taste-skill
  (github.com/Leonxlnx/taste-skill, MIT) cho một app học dạng game chạy trên iPad / iPhone, không phải trang web công ty.
  Dùng mỗi khi thêm hoặc sửa màn, bảng, thẻ, nút, chuyển động, màu, chữ trong giao diện của game,
  hoặc khi anh Han chê giao diện "nhìn AI", rẻ, rối. Kết thúc bằng `node tools/ui-check.mjs`.
---

# ConnectLife taste

Giao diện phải trông như một app học có tay nghề: con số và việc cần làm là trung tâm, mỗi màn một ý chính,
chuyển động ngắn và có lý do, chữ dễ đọc, chạm đâu cũng phản hồi. Màu giấy kem, navy, cam san hô, xanh ngọc
của app (`:root` trong game/css/game.css). Luật trong CLAUDE.md luôn thắng luật ở đây.

Nguồn: taste-skill 2.5.1 (MIT, Leonxlnx). Bản gốc dành cho trang web giới thiệu công ty (một mục một màn
hình, ảnh chụp thật, shader, cổng kiểm tra tự chạy); app này chỉ lấy phần hợp với app học, liệt kê dưới đây.
Không dùng từ bản gốc: shader, cảnh WebGL, ảnh stock, sơ đồ vẽ bằng code (trái luật "không vẽ hình bằng code").

## 1. Chạm và nhấn (motion.md của taste-skill)

- Mọi nút, thẻ bấm được (`.btn`, `.big`, `.chip`, `.opt`, `.pv-goal`, `.pv-day`, `.etabs button`, `.mm-c`, `.speak`)
  phản hồi khi nhấn: lún 1px và co `.985` trong 90ms, nhả 120ms. Lớp này nằm cuối game.css; nút mới chỉ cần dùng
  đúng class, đừng tự đặt `transform` hay `transition` khác cho nút.
- Rê chuột chỉ trên máy có chuột (`(hover: hover) and (pointer: fine)`): nút nhích lên 1px, thẻ lớn 2px và
  viền đậm một bậc. Không nghiêng, không phát sáng, không nút "hút" theo con trỏ.
- Vòng focus khi dùng bàn phím: 2px màu `--coral`, cách 2px, hiện ngay, không có hiệu ứng.
- Ô chạm tối thiểu 44 × 44 px (cả iPhone nằm ngang). Hai ô chạm cạnh nhau cách nhau từ 4px trở lên.

## 2. Chuyển động

- Chỉ chạy trên `transform` và `opacity` (thêm màu khi rê/nhấn). Không bao giờ tạo hiệu ứng trên
  `left`, `top`, `width`, `height`, `margin`, `padding`: thanh tiến độ dùng `scaleX`, núm trượt dùng `translateX`,
  ô chọn dùng `translate` (`G.pillTo`, `.epill`).
- Đường cong: thao tác thường dùng `--ease-ui` (không vượt đích); vật đi quãng xa (ô chọn trượt) dùng `--ease-io`;
  nảy (`--ease-spring`, `G.pop`) chỉ cho khoảnh khắc ăn mừng (ngọn lửa chuỗi, cúp, pháo giấy).
- Thời lượng: nhấn 90ms, rê 150ms, ô chọn trượt 300ms, bảng mới rõ dần 380ms (`G.viewIn`), số chạy 0,5–1,1 giây (`G.countUp`).
- Mỗi màn chuyển động có lý do: bảng mới hiện (`G.viewIn`), danh sách xuất hiện lần lượt khi mở (`G.enter`),
  số liệu chạy tới giá trị, ăn mừng khi xong bài (`G.confetti`). Không làm hiện dần theo cuộn trang, không parallax,
  không chớp nháy, không băng chuyền tự chạy.
- Máy bật Giảm chuyển động: mọi thứ đứng yên ở trạng thái cuối, không gì bị ẩn (`G.calm()`).

## 3. Chữ và màu

- Tương phản: chữ thường từ 4,5:1, chữ lớn (từ 24px, hoặc 18,6px đậm) từ 3:1. Chữ phụ dùng `--faint` (đã đạt 4,5:1
  trên nền kem); ở Sảnh `#lobby` có bộ màu nâu riêng, dùng biến của nó. Chữ trắng trên nền cam dùng `--coral` (#b84b35).
- Không dùng màu tím, tím nhạt, oải hương trong màu của app.
- Không emoji làm đầu dòng ở tiêu đề, nhãn, nút: dùng icon 3D (`G.ic3(tên, 'ic3-s')`, `G.bigIc`) hoặc chỉ chữ.
  Thiếu icon thì tải từ Microsoft Fluent Emoji (bộ 3D, MIT), thu về 128 px webp, lưu `game/assets/ic3_<tên>.webp`,
  chạy `node tools/asset-rev.mjs`.
- Chữ trong giao diện viết như người thật nói: động từ + việc trên nút ("Ôn 9 câu sắp quên", "Vào buổi học"),
  không từ sáo rỗng, không câu hỏi tự trả lời, không dấu chấm than trong chữ hướng dẫn. Câu chào của nhân vật
  (giáo viên, Kai) được vui vẻ.

## 4. Bố cục

- Mỗi bảng một ý chính đặt trên cùng (con số, việc cần làm, kết quả); chi tiết bên dưới.
- Thẻ cùng loại cùng viền, cùng bo góc, cùng khoảng đệm. Một kiểu nút chính (`.btn.seal`), một kiểu nút phụ.
- Màn ngang (iPad, iPhone nằm ngang): chia hai cột khi đủ rộng, không để cuộn ngang. Kiểm tra cả iPad Pro 11 và iPhone 15 nằm ngang.

## 5. Kiểm tra trước khi xong

```bash
node tools/ui-check.mjs            # ô chạm < 44px, tương phản, emoji đầu dòng, màu tím, vòng focus, chuyển động trên thuộc tính bố cục
node tools/ui-check.mjs --shots    # thêm ảnh chụp từng màn vào scratch/ui-check/ (không commit)
```

Sửa đến khi dòng cuối là `Tổng: 0 · đạt`. Màn mới thì thêm vào danh sách `SCREENS` trong tools/ui-check.mjs.
Công cụ không đo được chữ nằm trên ảnh hoặc dải màu; những chỗ đó tự xem bằng ảnh chụp.
