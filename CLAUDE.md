# ATLAS-Hoc · ConnectLife

Game học ngoại ngữ ConnectLife (thư mục `game/`) và app ATLAS gốc (thư mục gốc). Người phụ trách: anh Han. Trả lời bằng tiếng Việt, ngắn gọn, thực tế.

## Đầu ra của khoá học (luôn bám theo)

Học viên học xong phải **nói được, đọc hiểu và nghe trôi chảy tiếng Anh**. Mọi tính năng, bài học, trò chơi phải phục vụ ba kỹ năng này; cái gì không giúp nói, đọc hiểu hoặc nghe thì không ưu tiên.

## Tiến độ học

- Người học tự chọn **mốc thời gian** (3 / 6 / 9 / 12 / 18 / 24 tháng) để đạt mục tiêu (Sảnh → Mục tiêu và mốc thời gian, hoặc màn kết quả đầu vào).
- App tính mỗi ngày cần học bao nhiêu (giờ còn lại tới mục tiêu ÷ số ngày học còn lại) và **giao đủ phần đó mỗi ngày** (vòng Hôm nay). Học chậm thì phần mỗi ngày tự tăng, nhanh thì giảm. Code: `G.setPlan`, `G.planToday` (game/js/placement.js), `goalMin` (game/js/daily.js).

## Bản đồ ngoài phố: chỉ bản 3D

- Đã chốt bỏ bản 2D (không còn nút chọn). Máy không có WebGL mới tự vẽ 2D.
- Camera kiểu GTA: tay trái là cần điều khiển (đi theo hướng camera), tay phải vuốt để xoay góc nhìn quanh nhân vật; nút 🧭 đưa về hướng cũ. Mọi tấm giấy (người, nhà, cây, xe, ô) luôn quay mặt về camera (`bill`, `YAW` trong game/js/world3d.js).
- Ô che mưa: điểm cầm trên cán (`G.UMB_GRIP`) đặt đúng lòng bàn tay (`G.HANDS`, có cả khung bước); phần cán vẽ đè lên tay.

## Quy tắc làm việc

- **Không vẽ hình bằng code.** Mọi hình là hình đặt (anh Han đặt qua ChatGPT): viết đơn đặt hàng trong `game/ASSET_ORDERS.md`, nhận hình thì cắt nền rồi gắn vào game.
- Âm thanh: ghi âm thật từ nguồn miễn phí (CC0, phạm vi công cộng, CC BY) hoặc anh Han làm bằng Meta AI; ghi nguồn ở `game/sfx/CREDITS.md`. Giọng đọc: Kokoro (af_heart, am_michael).
- Code game là **ES5 thuần** (không arrow function, let/const, template literal, optional chaining) để chạy trên Safari iOS. Kiểm tra bằng acorn `ecmaVersion: 5`.
- Dữ liệu lưu Supabase; chỉ dùng khoá anon / publishable, không bao giờ dùng khoá service_role. Giờ luôn theo giờ Việt Nam (UTC+7). Không làm mất tiến độ học.
- App dùng trên iPad / iPhone (mở từ màn hình chính, điện thoại nằm ngang): kiểm tra cả hai cỡ màn hình.
- Đổi hình trong `game/assets/`: chạy `node tools/asset-rev.mjs` (từ thư mục gốc). Đổi code / dữ liệu game: tăng `VERSION` trong `game/sw.js`.
- Thêm câu tiếng Anh có giọng đọc: `node tools/build-audio-list.mjs` rồi tạo giọng còn thiếu, cập nhật `data/audio.json`.
