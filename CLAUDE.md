# ATLAS-Hoc · ConnectLife

Game học ngoại ngữ ConnectLife (thư mục `game/`) và app ATLAS gốc (thư mục gốc). Người phụ trách: anh Han. Trả lời bằng tiếng Việt, ngắn gọn, thực tế.

## Đầu ra của khoá học (luôn bám theo)

Học viên học xong phải **nói được, đọc hiểu và nghe trôi chảy tiếng Anh**. Mọi tính năng, bài học, trò chơi phải phục vụ ba kỹ năng này; cái gì không giúp nói, đọc hiểu hoặc nghe thì không ưu tiên.

## Việc chờ anh Han (nhắc khi anh quay lại)

Từ 24/11/2026 anh Han dùng app để tự học trước, phần UI/UX tính tiếp sau. Mở phiên làm việc mới thì nhắc anh danh sách này một lần, ngắn gọn; việc nào anh báo xong thì xoá khỏi đây.

1. Supabase: chạy một lần `supabase/migrations/20261124_app_events.sql` trong SQL Editor để app gửi số liệu dùng và lỗi ẩn danh.
2. Thử tay khoảng 10 phút trên iPhone và iPad thật: micro ở phần Nói, nhại có ghi âm, thêm lịch nhắc học (.ics), bản đồ 3D trên máy yếu (bộ soát `tools/qa-run.mjs` chỉ giả lập micro).
3. Đặt 12 tranh bìa truyện còn thiếu (Đơn P trong `game/ASSET_ORDERS.md`).
4. Thêm bài Tầng 3–4 trước khi học viên đầu tiên lên tới đó: bài có sẵn khoảng 123 giờ (Tầng 1: 38/60 giờ chuẩn, Tầng 2: 21/50, Tầng 3: 31/140, Tầng 4: 33/180), học 40 phút × 5 ngày/tuần thì đủ khoảng 8 tháng.
5. Người bản ngữ đọc soát nội dung; hiệu chỉnh bài đầu vào khi có vài chục học viên thật (số liệu `app_events`).
6. Pháp lý (anh hẹn làm sau).
7. UI/UX: hỏi anh những chỗ thấy vướng khi tự học bằng app, rồi làm tiếp phần giao diện.

## Tiến độ học

- Người học tự chọn **mốc thời gian** (3 / 6 / 9 / 12 / 18 / 24 tháng) để đạt mục tiêu (Sảnh → Mục tiêu và mốc thời gian, hoặc màn kết quả đầu vào).
- Người học tự chọn **ngày học trong tuần** (chạm dải T2…CN, ít nhất 2 ngày; mặc định T2–T6): lưu `G.S.caiDat.ngayHoc` (1 = thứ Hai … 7 = CN), `ngayTuan` = số ngày đó (`G.studyDays`, `G.isStudyDay`). Số phút mỗi ngày tính theo số ngày đó; chuỗi học chỉ đứt khi bỏ lỡ một ngày học trong lịch (`G.markStudy`); bảng Hôm nay hiện dải 7 ngày tuần này (`G.weekDots`, `G.weekStudy`).
- App tính mỗi ngày cần học bao nhiêu (giờ còn lại tới mục tiêu ÷ số ngày học còn lại) và **giao đủ phần đó mỗi ngày** (vòng Hôm nay). Học chậm thì phần mỗi ngày tự tăng, nhanh thì giảm. Code: `G.setPlan`, `G.planToday` (game/js/placement.js), `goalMin` (game/js/daily.js). Chưa chọn mốc thì 40 phút mỗi ngày (`GOAL_MIN`), khớp với dòng ước tính của thẻ Kế hoạch.
- Thẻ "Kế hoạch của bạn" (`G.goalCard`, class `.pv-*`): con số là trung tâm, không emoji, chuyển động nhẹ (số chạy, nhún khi chạm, tắt khi máy bật Giảm chuyển động). Dùng ở kết quả đầu vào và Sảnh.
- **Bản đồ nhớ từ** (`G.openMemMap`, game/js/memmap.js): mỗi ô là một buổi, tô màu theo mức nhớ các câu trong kho ôn (`G.S.cau`); ô đỏ nhạt là buổi có nhiều câu đến hạn, chạm để ôn đúng các câu đó (`G.openReviewOf`). Mở từ Sảnh và bảng Hôm nay. Tab cuối "Chủ đề": 15 ô, mỗi ô một nhóm từ.
- **Tầng 2 A1 có 16 buổi** (game/data/en_a1_more.js, nạp sau en_a1.js): 4 phòng A1 thành nhóm 4 buổi (`en-a1-01` … `en-a1-16`), buổi 1 mỗi phòng là nội dung phòng cũ, mỗi buổi 1 điểm ngữ pháp + 12–15 câu. Bản lưu cũ: `migrate()` trong save.js chép điểm phòng cũ sang buổi 1; phòng nhóm có điểm cũ từ 8 vẫn tính là qua (`G.roomPassed`).
- **Lộ trình nói thật**: `G.CONTENT_EN` (game/data/content_en.js, dựng bằng `node tools/build-content-hours.mjs` mỗi khi thêm bài, truyện, hội thoại) đếm giờ bài có sẵn từng tầng; tab Lộ trình ghi "Bài có sẵn: khoảng X giờ" và số giờ luyện thêm để đủ giờ chuẩn (`G.ROADMAP_EN[].hours`).
- **Từ theo chủ đề** (`G.openTopics`, `G.openTopic`, game/js/topics.js): 15 nhóm từ của ATLAS (1334 từ trong `data/en/bank.json`), dựng bằng `node tools/build-topic-game.mjs` ra `game/data/topic_en_index.js` (nạp cùng game) và `game/data/topic_en.json` (tải khi mở bảng). Chia tầng (anh Han duyệt 24/11/2026): nền tảng, số đếm → Tầng 1; ngày giờ → Tầng 2; tiền, bán hàng, công sở, doanh nghiệp → Tầng 3; kinh tế vĩ mô, thương mại, nhà nước, quốc tế, xã hội, khí hậu, công nghệ, đọc tin → Tầng 4. Chủ đề mở khi tới tầng đó. Một lượt 10 thẻ từ, nghe chọn nghĩa, rồi nói 3 câu ví dụ (`G.speakCard`); từ đã học vào kho ôn (`G.srsAdd`, có `cd` = mã chủ đề để thẻ ôn hiện câu ví dụ) và `G.S.tuChuDe`. Mỗi từ chưa học tính 2 phút vào giờ còn lại của lộ trình (`G.topicHours`, `remainHours` trong lobby.js), nên phần học mỗi ngày đã gồm cả từ. Việc hôm nay thứ 5: "Học 10 từ theo chủ đề" (`tu`).

## Bài kiểm tra đầu vào (chuẩn như Duolingo English Test, EF SET, Cambridge · sửa 24/11/2026)

- Phần 1 Từ vựng kiểu Có/Không (game/data/vocab_test_en.js, dựng bằng `node tools/build-vocab-test.mjs`): mỗi cấp 12 từ, 8 thật 4 giả (từ giả đã soát với từ điển); chạm từ giả bị trừ, 2 từ đã chạm hỏi lại nghĩa. Điểm cấp = thật/8 − giả/4, đạt từ 0,75.
- Nghe, Đọc, Giao tiếp, Nói thích ứng: bắt đầu ở cấp từ vựng, đạt thì lên, chưa đạt thì xuống. Từ A2 cần đúng 3 câu trước khi sai 2.
- Trình độ chung = trung vị các kỹ năng nhưng không vượt cấp từ vựng. Kết quả gợi ý tầng (`G.floorForLevel`), đổi tầng không mất tiến độ. Bản ghi mới có `ban: 2`; bản cũ được nhắc làm lại.
- Phương án sai phải đúng ngữ pháp, dài tương đương đáp án đúng, có dính từ khoá. Sửa câu xong chạy `node tools/placement-check.mjs` (đáp án đúng dài nhất tối đa 3/10 câu mỗi cấp từ A2).

## Nhiệm vụ hôm nay và Sảnh (24/11/2026)

- 5 nhiệm vụ (`G.QUESTS`, daily.js): học bài, đọc truyện, nói chuyện, ôn câu, học 10 từ chủ đề. `G.questList` (Sảnh, bảng Hôm nay) có nút Làm ngay mở thẳng đúng chỗ (`G.questAct`, dùng `G.nextLesson`, `G.nextLifeId` trong engine.js); xong cả 5 mở rương +30 XP (`G.claimChest`, `G.today().ruong`).
- Ngoài phố, thẻ góc phải (`G.updateHud`, class `.hud-q`, rộng 268 px, iPhone 228 px) là thẻ Nhiệm vụ hôm nay: rương có số việc còn lại, 5 ô nhiệm vụ sáng dần, thanh tiến độ, dòng "Tiếp: …"; bấm mở bảng Hôm nay. Bản đồ nhỏ tự xếp ngay dưới thẻ (`placeRadar`).
- Bản đồ nhỏ (thay radar, `G.drawRadar` trong radar.js): tờ bản đồ màu nước của khu và các khu liền kề trên nền cỏ, viền giấy kem, N trên nhãn đỏ, nhà / trường / bến xe là icon 3D, người chưa nói chuyện là bong bóng chat, mình là mặt nhân vật có mũi nhọn chỉ hướng, nơi cần tới là ghim đỏ; nhãn tên khu bên dưới; bấm để xem cả khu.
- Sảnh tab Hôm nay: thẻ "Bắt đầu từ đây" (`startHere` trong lobby.js, một nút cam) rồi Nhiệm vụ hôm nay; tab Lộ trình có "Bạn đang ở đây"; tab Hồ sơ có "Trình độ của bạn".
- Font giao diện: Be Vietnam Pro (OFL, `game/vendor/fonts/`).

## Ra mắt (24/11/2026, làm theo phân tích A–E, phần pháp lý để sau)

- Học thử trước, tài khoản sau: lần đầu chỉ làm bài đầu vào nhanh (Từ vựng) rồi vào học; mời lưu tiến độ sau buổi đầu (`G.askAccount`, tối đa 3 lần). Lời mời và huy hiệu tầng (`G.checkFloorBadge`) không bao giờ chen vào giữa bài: chờ tới khi đóng bảng học, không còn màn nào khác. Đồng bộ hai máy gộp theo từng phần (`G.mergeSave`), không ghi đè. Máy nhớ mốc bản trên mây mình đã có (`cl-cloud-luc`): máy khác chưa lưu gì thì chỉ đẩy lên, không gộp, không nạp lại app; máy khác lưu thì gộp, nhưng đang ngoài phố / trong bài thì chờ về Sảnh (`G.cloudCalm`, `G._cloudWait`); chỉ báo "đã lấy tiến độ" và nạp lại khi bản trên mây thật sự mang thêm tiến độ (`G.sameProgress`). Lỗi cũ 24/11/2026: vào map bị văng ra vì lần đồng bộ nào cũng tưởng có bản mới. Kiểm thử: tools/test/cloud.test.mjs.
- Điện thoại cầm dọc dùng được Sảnh và các bảng học; chỉ bản đồ 3D mới nhắc xoay ngang. iPhone nằm ngang: bảng rộng, danh sách chia 2 cột.
- Ôn câu (practice.js): mốc 0…120 ngày; có micro thì phải nói đạt mới tính nhớ; không micro thì Quên / Nhớ lờ mờ / Nhớ chắc; quên 3 lần thành câu khó (`c.kho`, `G.srsHard`, `G.openReviewHard`).
- Nhại có ghi âm `G.shadowBtn(câu)` (speak.js, MediaRecorder, bản ghi chỉ trong máy): thẻ bài học, thẻ từ, thẻ ôn, bắt lỗi câu.
- Kho truyện: kệ "Truyện dễ A1" (data-src/stories/09-en-a1-easy.txt, 6 truyện; build-stories.mjs ghi đè truyện cũ nên chỉ chép tệp mới và thêm mục vào index), nghe cả chương (`G.sayList`), 3 tốc độ, ẩn chữ chỉ nghe, câu hỏi đọc hiểu (`quiz`), từ đáng nhớ (`vocab` hoặc `gloss`).
- Bắt lỗi câu B1–B2 (`G.openFix`, game/js/fixit.js, dữ liệu game/data/fix_en.js 48 câu), mở từ Tầng 3.
- Tốc độ giọng đọc chung trong Cài đặt (`G.S.caiDat.tocDo`: 0,7 / 1 / 1,2).
- Giữ chân: băng giữ chuỗi (`G.S.chuoi.bang`, 7 ngày liên tiếp được 1, tối đa 2, tự dùng trong `G.markStudy`); nhắc học qua Lịch (`G.reminderCard`, tệp .ics giờ Việt Nam theo ngày học); chia sẻ kết quả `G.share` / `G.shareBtn` (kiểm tra tuần, chứng chỉ).
- Một màn một nút cam: "Vào Brightford" là nút đất sét màu kem. Thanh việc tiếp theo ngoài phố có "Học ngay ›" khi việc tiếp theo là buổi học. Pháo giấy chỉ cho mốc lớn (lên rank, qua bài thi tầng lần đầu, chứng chỉ, tốt nghiệp, đồ kỷ niệm, kiểm tra tuần từ 90).
- Nhãn tên trên bản đồ 3D là nhãn giấy kem viền nâu (`plate` trong world3d.js). Lời Kai hiện tới 3 dòng.
- Tải lần đầu nhẹ: service worker chỉ tải trước hình giao diện (`LIGHT`, khoảng 2 MB); trang gửi 'warm' sau 25 giây để tải dần hình còn lại (bỏ qua khi Tiết kiệm dữ liệu).
- Số liệu và lỗi ẩn danh: `G.track(tên, {…})` (game/js/track.js) ghi vào bảng `app_events` (supabase/migrations/20261124_app_events.sql, chạy một lần trong SQL Editor; bảng chưa có thì app tự thôi gửi). Không gửi tên, email, câu nói. Tắt được trong Cài đặt.
- Giọng đọc chuyển CDN được: đặt `G.AUDIO_BASE` trong game/js/cloud_config.js.
- Kho truyện chỉ tải tranh bìa có trong `data/covers.json`; truyện mới chưa có bìa hiện kiểu thẻ chữ (đơn đặt bìa: Đơn P trong game/ASSET_ORDERS.md). Hình đang tải chỉ có nền giấy nhạt, không hiện tên tệp (`G.imgEl`).
- **Soát trước khi phát hành**: `node tools/qa-run.mjs` (cần Playwright, 10–15 phút) chạy như người học thật: 3 người mới (mới tinh iPhone dọc, A1 iPhone ngang, A2 iPad) học trọn ngày đầu và 5 nhiệm vụ; Kiểm tra tuần, buổi A1/A2/B1, thi chứng chỉ A1 có phần nói, Bắt lỗi câu, đọc truyện chỉ nghe; quét mọi phòng, nơi, chủ đề, truyện, bảng; đã đăng nhập mây thì vào map, lưu không bị văng ra (`may`). Phải ra `✓ Đạt`. Trình lái trong trang: tools/qa/driver.js.

## Chuyển động (theo video anh Han gửi 22/11/2026)

- Bảng mới hiện từ nhoè sang rõ (`G.viewIn`): khi đổi bước Học / Luyện / Kiểm tra, mở bảng (Hôm nay, ôn tập…), về Sảnh.
- Ô chọn co giãn khi trượt (`G.pillTo`, `.epill`): thanh 3 bước của bài học, thanh chọn tầng ở Bản đồ nhớ từ.
- Thẻ và đáp án hiện lần lượt (`G.enter`), số chạy (`G.countUp`), vòng % hôm nay quét từ 0, lưới hiện như gợn sóng.
- Giữ màu giấy kem của app, không dùng nền tối. Mỗi chuyển động 0,2–0,5 giây, tắt hết khi máy bật Giảm chuyển động.

## Thẩm mỹ giao diện (taste-skill, anh Han duyệt 22/11/2026)

- Luật đầy đủ ở skill dự án `.claude/skills/connectlife-taste/SKILL.md` (chuyển thể từ github.com/Leonxlnx/taste-skill, MIT): ô chạm từ 44 px, nhấn lún 1px và co .985, vòng focus 2px cam, chữ đủ tương phản 4,5:1, không emoji làm đầu dòng (dùng icon 3D), không màu tím, chuyển động chỉ trên transform/opacity, thao tác thường không nảy quá đích (nảy chỉ cho ăn mừng).
- Sửa giao diện xong chạy `node tools/ui-check.mjs` (cần Playwright) đến khi `Tổng: 0 · đạt`.
- Sảnh chia 4 tab (Hôm nay · Lộ trình · Hồ sơ · Cài đặt, `G._lobbyTab`), một bộ màu giấy nâu (`#lobby { --navy }`). Mỗi màn chỉ tô cam một việc nên làm tiếp (Nhà, đầu bài học).
- Thư viện 3D (`vendor/three.min.js`, `js/world3d.js`) nạp khi vào thành phố (`G.need3d` trong main.js), nạp sẵn ở nền 3,5 giây sau khi mở app; không thêm lại thẻ `<script>` cho hai tệp này vào index.html.

## Bản đồ ngoài phố: chỉ bản 3D

- Đã chốt bỏ bản 2D (không còn nút chọn). Máy không có WebGL mới tự vẽ 2D.
- Camera kiểu GTA: tay trái là cần điều khiển (đi theo hướng camera), tay phải vuốt để xoay góc nhìn quanh nhân vật; nút 🧭 đưa về hướng cũ. Mọi tấm giấy (người, nhà, cây, xe, ô) luôn quay mặt về camera (`bill`, `YAW` trong game/js/world3d.js).
- Ngoài các khu là đồng cỏ màu nước (`grass_tile.webp`, ghép từ cỏ trong các tờ bản đồ đã đặt) và cây, bụi, đá rải tới chân trời (`buildCountry`). Vật trong khung nhìn luôn bật lên: bán kính dựng theo tỉ lệ màn và độ lùi camera, vật to tính từ mép (`updatePops`).
- Ô che mưa: điểm cầm trên cán (`G.UMB_GRIP`) đặt đúng lòng bàn tay (`G.HANDS`, có cả khung bước); phần cán vẽ đè lên tay.

## Quy tắc làm việc

- **Không vẽ hình bằng code.** Mọi hình là hình đặt (anh Han đặt qua ChatGPT): viết đơn đặt hàng trong `game/ASSET_ORDERS.md`, nhận hình thì cắt nền rồi gắn vào game.
- Ngoại lệ anh Han đã duyệt (21/11/2026): icon 3D Microsoft Fluent Emoji (MIT) thay emoji trong giao diện (`G.ic3`, `G.bigIc`, tệp `game/assets/ic3_*.webp`, thu về 128 px); hoạt ảnh Lottie làm sẵn trong `game/anim/` (ghi nguồn ở `game/anim/CREDITS.md`, hoạt ảnh mới anh Han tải trên LottieFiles hoặc đặt riêng; được lấy thêm từ Noto Emoji Animation của Google, CC BY 4.0, anh Han duyệt 24/11/2026). Pháo giấy `G.confetti` phát bằng Lottie, không vẽ bằng code. Emoji động `G.lottieIc(tên)` (`anim/noto_*.json`: lửa chuỗi học, rương, cúp, pháo hoa; máy bật Giảm chuyển động thì hiện icon 3D tĩnh), màn mở rương `G.chestPop`.
- Thư viện ngoài để trong `game/vendor/`, ghi nguồn và giấy phép ở `game/vendor/CREDITS.md`: three.js, lottie-web (nạp khi cần), anime.js 3.2.2 (`G.enter`, `G.pop`, `G.countUp` trong util.js), AutoAnimate (trò xếp câu), biến chuyển động và bóng của Open Props trong `:root` của game.css. Thêm tệp vendor thì thêm vào `CORE` trong `game/sw.js`.
- Âm thanh: ghi âm thật từ nguồn miễn phí (CC0, phạm vi công cộng, CC BY) hoặc anh Han làm bằng Meta AI; ghi nguồn ở `game/sfx/CREDITS.md`. Tiếng giao diện (`G.sfx`: right, wrong, done, quest, chest, tap, tab) là Kenney Interface Sounds (CC0, `sfx/sfx_ui_*.mp3`); chạm nút có tiếng nhẹ, đổi tab tiếng gạt (bộ nghe trong main.js, bỏ qua đáp án, loa, micro).
- Kai và Han cử động bằng Rive: đơn ở `game/ASSET_ORDERS.md` (Đơn O), chờ tệp .riv. Giọng đọc: Kokoro (af_heart, am_michael).
- Code game là **ES5 thuần** (không arrow function, let/const, template literal, optional chaining) để chạy trên Safari iOS. Kiểm tra: `npm i --no-save acorn && node tools/es5-check.mjs`. Kiểm thử logic: `node tools/test/run.mjs` (thêm tệp `tools/test/*.test.mjs` khi thêm logic). GitHub Actions (.github/workflows/check.yml) chạy ES5, kiểm thử và `tools/placement-check.mjs` mỗi lần đẩy code.
- Dữ liệu lưu Supabase; chỉ dùng khoá anon / publishable, không bao giờ dùng khoá service_role. Giờ luôn theo giờ Việt Nam (UTC+7). Không làm mất tiến độ học.
- App dùng trên iPad / iPhone (mở từ màn hình chính, điện thoại nằm ngang): kiểm tra cả hai cỡ màn hình.
- Đổi hình trong `game/assets/`: chạy `node tools/asset-rev.mjs` (từ thư mục gốc). Đổi code / dữ liệu game: tăng `VERSION` trong `game/sw.js` và `G.APP_VER` trong `game/js/track.js` cho giống nhau.
- Thêm câu tiếng Anh có giọng đọc: `node tools/build-audio-list.mjs` rồi tạo giọng còn thiếu, cập nhật `data/audio.json`.
