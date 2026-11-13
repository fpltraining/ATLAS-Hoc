# ATLAS

App học tiếng Anh và tiếng Trung cho người Việt: lộ trình, truyện song ngữ, viết bằng Apple Pencil và ôn tập ngắt quãng. Chạy hoàn toàn trên máy, không tài khoản, không quảng cáo, dùng được khi không có mạng.

Gộp từ 5 app: Bút Hán, Inklish, ATLAS bản cũ, Song Ngữ và Han's English Hub.

## Có gì trong app

| Mục | Nội dung |
|---|---|
| Hôm nay | Việc cần làm theo thứ tự, chia theo quỹ 30 phút đến 2 tiếng, chuỗi ngày học, thử thách 10 câu, nhật ký |
| Tiếng Anh | Bài xếp lớp, luyện phát âm có chấm điểm, 5 chặng: A0 → B2 đủ nội dung (chặng 2 có 1.134 từ B1–B2 mới và bài đọc B2), chặng 3 (B2 vững: 483 từ B2–C1, tranh luận, viết luận) đủ nội dung, chặng 4 (C1: đọc bản gốc tự chọn, 171 thành ngữ, thuyết trình, viết C1) đủ nội dung; truyện và tin song ngữ, viết bằng bút, ôn thẻ, tiếng Anh nghề, sổ tay ngữ pháp |
| Tiếng Trung | 205 bài HSK 1–4 theo chuẩn 2025 (đủ 100% từ cấp 1–4), truyện song ngữ có pinyin, viết nhiều lượt chấm từng nét, bản đồ chữ, ôn thẻ, thi thử HSK, từ vựng HSK 3.0 cấp 1–9 có nghĩa chi tiết, 5 trò ôn nhanh, luyện phát âm và thanh điệu có chấm điểm, pinyin, bộ thủ |
| Chủ đề | Tra từ Anh–Trung–Việt, 99 chủ đề song song hai ngôn ngữ, từ theo lĩnh vực, kiến thức, đọc số và tiền, sổ ghi |
| Tiến độ | Thời gian thật theo từng khối, nhật ký, sao lưu và nhập từ app cũ |

## Quy tắc đọc song ngữ

Mỗi dòng ngoại ngữ có nghĩa tiếng Việt ngay bên dưới. Câu dài được cắt thành cụm ngắn và dịch theo từng cụm, không để cả đoạn tiếng Anh rồi mới tới nghĩa.

`tools/merge-data.mjs` báo lỗi nếu dòng nào thiếu nghĩa, và liệt kê dòng tiếng Anh dài quá 11 từ hoặc dòng tiếng Trung dài quá 15 chữ.

## Chạy thử

Trong thư mục này:

```bash
python tools/serve.py
```

Máy chủ in ra địa chỉ cho máy tính và cho iPad cùng mạng Wi-Fi. Không dùng `python -m http.server`, bản đó chỉ phục vụ một yêu cầu một lúc nên hay đứt khi tải dữ liệu nét.

## Thêm bài đọc mới

Thêm vào một tệp trong `data-src/stories/`, rồi dựng lại riêng phần bài đọc (không cần `../_src`):

```bash
node tools/build-stories.mjs
```

Chữ Hán mới chưa có dữ liệu nét thì lấy từ gói hanzi-writer-data:

```bash
npm pack hanzi-writer-data@2.0.1 && tar -xzf hanzi-writer-data-2.0.1.tgz
node tools/add-strokes.mjs package
```

Hoặc dựng lại toàn bộ dữ liệu từ 5 app cũ:

```bash
node tools/merge-data.mjs ../_src
```

`../_src` là bản gốc của 5 app cũ, không nằm trong repo này. Cần có các thư mục `ATLAS`, `ButHan`, `sites/inklish`, `sites/songngu`, `sites/hub` trong đó thì công cụ mới chạy được.

Tiếng Anh, mỗi dòng là `tiếng Anh | tiếng Việt`:

```
@id news-vi-du
@shelf news
@level B1
@date 2026-11-02
@title Tiêu đề tiếng Anh
@vi Tiêu đề tiếng Việt
@blurb Một câu giới thiệu.

## 1 | Tên phần | Tên phần tiếng Việt
A short line of English, | Một dòng tiếng Anh ngắn,
then the next short line. | rồi tới dòng ngắn tiếp theo.

? Câu hỏi tiếng Anh? | Câu hỏi tiếng Việt? | Đáp án đúng* | Đáp án sai | Đáp án sai
~ từ khó = nghĩa của từ
! Một dòng của phần Điều rút ra. | Một dòng của phần Điều rút ra.
> Gợi ý nói hoặc viết sau khi đọc.
```

Dòng bắt đầu bằng `!` là phần **Điều rút ra**, hiện thành khung riêng ở cuối chương. Ở các kệ `true`, `news`, `mystery`, chữ "anh" trong nghĩa tiếng Việt tự đổi thành "bạn" để nói với người đọc, nên khi nói về nhân vật thì viết "anh ấy", "ông", "cô".

Tiếng Trung thêm `@lang zh`, mỗi dòng là `chữ Hán | pinyin | tiếng Việt`. Chữ Hán mới cần thêm vào `data-src/strokes-extra.json` để viết được bằng bút, và từ mới thêm vào `data-src/zh-extra.txt` để chạm vào là tra được.

`@shelf` nhận `ai`, `true`, `news`, `mystery`, `long`, và `fable` cho tiếng Trung.

## Giáo trình tiếng Trung theo chuẩn HSK 2025

Lộ trình xếp theo bản sửa đổi năm 2025 của chuẩn HSK 3.0 (cấp 1: 300 từ, cấp 2: 200, cấp 3: 500, cấp 4: 1.000).

- `data-src/hsk2025/levels.json`: cấp của từng từ, nguồn ghi trong `data-src/hsk2025/README.md`.
- `data-src/curriculum-2025/*.txt`: bài bổ sung, mỗi bài ghi `@after` để chèn vào đúng chỗ trong lộ trình.
- `node tools/build-curriculum.mjs`: dựng bài bổ sung, xếp lại nhóm cấp, đánh số bài, in độ phủ từng cấp.

Bài cũ giữ nguyên `id` để không mất tiến độ người học; số bài hiển thị lấy theo vị trí (`no`).
Sau khi thêm bài có chữ Hán mới, chạy `tools/add-strokes.mjs` rồi `tools/build-stories.mjs` để chép dữ liệu nét.

## Sửa nội dung

Lỗi nội dung sửa trong `data-src/patches/`, không sửa tay vào `data/`:

| Tệp | Dùng để |
|---|---|
| `fixes.json` | Thay đúng một chuỗi trong một tệp của `data/` (Hán Việt, ghi chú, câu sai trong bài đọc) |
| `en-add-*.txt` | Bổ sung từ tiếng Anh, mỗi dòng `từ \| phiên âm \| từ loại \| câu ví dụ \| nghĩa câu ví dụ` |
| `en-c1-*.txt` | Từ mới B2–C1 cho chặng 3, cùng định dạng với `en-new-*.txt`, 6 từ mỗi buổi |
| `stage3-*.json` | Chặng 3: cụm từ tranh luận, đề tranh luận, đề viết luận |
| `stage4-*.json`, `en-idiom-*.txt` | Chặng 4: đề thuyết trình, đề viết C1, thành ngữ và cách nói tự nhiên (3 mỗi buổi) |
| `en-new-*.txt` | Từ mới B1–B2 cho chặng 2, mỗi dòng `từ \| phiên âm \| từ loại \| nghĩa \| câu ví dụ \| nghĩa câu ví dụ`, dòng `@lv N` đặt cấp. Thứ tự trong tệp là thứ tự học, 10 từ mỗi buổi |
| `course.json` | Ghi chú, trạng thái và danh sách mục của từng chặng tiếng Anh |
| `pos.txt` | Từ loại cho các từ còn thiếu, mỗi dòng `từ loại: từ ; từ ; ...` |
| `en-bank.json` | Viết thường, phiên âm giọng Mỹ, sửa nghĩa của kho từ |
| `topics-ipa.json` | Phiên âm giọng Mỹ cho mục Chủ đề |

Sau khi sửa:

```bash
node tools/apply-patches.mjs
```

`merge-data.mjs` cũng tự gọi bước này ở cuối, nên dựng lại dữ liệu không làm mất bản sửa. Phiên âm tiếng Anh theo giọng Mỹ. Đổi dữ liệu xong thì tăng `VERSION` trong `sw.js` để máy người dùng tải bản mới.

## Đăng nhập và đồng bộ (Supabase)

Mỗi người học một tài khoản (email + mật khẩu), tiến độ lưu lên Supabase nên đổi máy không mất. Nhiều người dùng chung một iPad cũng không lẫn dữ liệu: mỗi tài khoản có cơ sở dữ liệu riêng trên máy. Người đăng nhập đầu tiên trên một máy nhận luôn dữ liệu học đang có.

1. Trong dự án Supabase: SQL Editor → chạy `supabase/migrations/20261113_atlas_state.sql`.
2. Authentication → Sign In / Providers → Email: bật. Muốn tạo tài khoản dùng ngay không cần bấm link xác nhận thì tắt "Confirm email".
3. Authentication → URL Configuration: Site URL đặt bằng địa chỉ app trên GitHub Pages (link quên mật khẩu sẽ quay về đây).
4. Điền `SUPABASE_URL` và `SUPABASE_ANON_KEY` trong `js/config.js`. Khoá anon là khoá công khai; bảng đã bật Row Level Security nên mỗi người chỉ đọc ghi được dữ liệu của mình.

Để trống `js/config.js` thì app chạy như cũ, không đăng nhập. Thư viện `js/vendor/supabase-2.119.0.js` là bản UMD của supabase-js (MIT), để sẵn trong repo cho app mở được khi offline.

## Giọng đọc AI

Từ và câu trong app có sẵn tệp âm thanh giọng AI tự nhiên, tạo bằng Kokoro (mô hình mã nguồn mở, giấy phép Apache 2.0) ngay trên máy, không tốn phí. Giọng nam là chính (Michael cho tiếng Anh, giọng nam số 10 cho tiếng Trung), câu mẫu và hội thoại đọc xen kẽ với giọng nữ (Heart, giọng nữ số 1). Câu không có tệp (câu tự gõ, từ HSK 5–9) vẫn đọc bằng giọng của máy. Tắt được trong Cài đặt → Giọng AI tự nhiên.

```bash
node tools/build-audio-list.mjs                 # danh sách câu → data-src/audio-list.json
python tools/tts/make_audio.py                  # tạo audio/<en|zh>/<khoá>.mp3 và data/audio.json
```

Tên tệp là khoá của câu (`js/audiokey.js`), nên thêm bài mới chỉ cần chạy lại hai lệnh trên: câu đã có tệp được bỏ qua. Tệp âm thanh được lưu trong máy ở lần nghe đầu và giữ qua các lần cập nhật app.

## Chấm bài bằng AI

Mục Viết và Nói lại của tiếng Anh có nút **Chấm bằng AI**: Claude chấm bài, cho điểm, trình độ CEFR thể hiện, lỗi cần sửa kèm lý do bằng tiếng Việt, và một bản sửa gợi ý. Bài nói được trình duyệt chuyển thành chữ trước khi chấm, nên AI chấm từ vựng, ngữ pháp và ý, không chấm phát âm.

Tính năng tắt sẵn. App là trang tĩnh nên khoá Claude không được để trong app; nó nằm trong hàm `supabase/functions/grade` chạy trên Supabase.

1. Tạo dự án Supabase, cài Supabase CLI, chạy `supabase link` trong thư mục repo.
2. `supabase secrets set ANTHROPIC_API_KEY=sk-ant-...`
3. `supabase functions deploy grade`
4. Trong app: Cài đặt → **Chấm bài bằng AI**, điền `https://<dự-án>.supabase.co/functions/v1/grade` và khoá anon của dự án.

Bài chỉ được gửi đi khi người học tự bấm nút. Hàm từ chối bài dài hơn 4.000 ký tự. Khoá anon là khoá công khai, ai có nó đều gọi được hàm, nên trước khi mở cho nhiều người dùng cần thêm đăng nhập hoặc giới hạn số lần chấm mỗi người để kiểm soát chi phí.

## Cấu trúc

```
index.html, sw.js, manifest.webmanifest
css/app.css, css/atlas.css
js/app.js        định tuyến, đếm thời gian học
js/plan.js       kế hoạch mỗi ngày, hạn mức từ mới
js/store.js      IndexedDB, sao lưu, nhập từ app cũ
js/srs.js        lặp lại ngắt quãng
js/content.js    nạp nội dung
js/kit.js        mảnh dùng chung: dòng song ngữ, tra từ, nghe, nói
js/pen/          bảng viết chữ Hán (chấm nét) và tiếng Anh (inkpad.js)
js/views/        các màn hình
data/            dữ liệu đã gộp, do tools/merge-data.mjs sinh ra
data-src/        bài đọc gốc, từ và nét bổ sung
```

## Từ điển HSK 3.0 nhiều nghĩa

`data/zh-full.json` lọc từ CVDICT các từ trong danh sách HSK 3.0 (cấp 1 đến 7–9) và các chữ tạo nên chúng:

```bash
git clone --depth 1 https://github.com/ph0ngp/cvdict ../cvdict
node tools/build-cvdict.mjs ../cvdict/CVDICT.u8
```

CVDICT được dịch bằng AI rồi rà soát tay, nên có thể còn sót lỗi.

## Nguồn dữ liệu

| Nguồn | Dùng để | Giấy phép |
|---|---|---|
| hanzi-writer-data 2.0.1 | dữ liệu nét viết | Arphic Public License |
| Make Me a Hanzi | cấu tạo chữ | Arphic Public License |
| Unihan Database | âm Hán Việt, pinyin | Unicode License |
| CVDICT (Phong Phan, dịch từ CC-CEDICT) | nghĩa chi tiết các từ HSK 3.0, tệp `data/zh-full.json` | CC BY-SA 4.0; tệp `data/zh-full.json` cũng theo giấy phép này |
