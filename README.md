# ATLAS

App học tiếng Anh và tiếng Trung cho người Việt: lộ trình, truyện song ngữ, viết bằng Apple Pencil và ôn tập ngắt quãng. Chạy hoàn toàn trên máy, không tài khoản, không quảng cáo, dùng được khi không có mạng.

Gộp từ 5 app: Bút Hán, Inklish, ATLAS bản cũ, Song Ngữ và Han's English Hub.

## Có gì trong app

| Mục | Nội dung |
|---|---|
| Hôm nay | Việc cần làm theo thứ tự, chia theo quỹ 30 phút đến 2 tiếng, có nhật ký |
| Tiếng Anh | Bài xếp lớp, 5 chặng: A0 → B2 đủ nội dung (chặng 2 có 1.134 từ B1–B2 mới và bài đọc B2), chặng 3–4 (B2 vững, C1) đang soạn; truyện và tin song ngữ, viết bằng bút, ôn thẻ, tiếng Anh nghề, sổ tay ngữ pháp |
| Tiếng Trung | 205 bài HSK 1–4 theo chuẩn 2025 (đủ 100% từ cấp 1–4), truyện song ngữ có pinyin, viết chấm từng nét, ôn thẻ, pinyin, bộ thủ |
| Chủ đề | 99 chủ đề song song hai ngôn ngữ, từ theo lĩnh vực, kiến thức, đọc số và tiền, sổ ghi |
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
@source Tên nguồn | https://dia-chi-nguon

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
| `en-new-*.txt` | Từ mới B1–B2 cho chặng 2, mỗi dòng `từ \| phiên âm \| từ loại \| nghĩa \| câu ví dụ \| nghĩa câu ví dụ`, dòng `@lv N` đặt cấp. Thứ tự trong tệp là thứ tự học, 10 từ mỗi buổi |
| `course.json` | Ghi chú, trạng thái và danh sách mục của từng chặng tiếng Anh |
| `pos.txt` | Từ loại cho các từ còn thiếu, mỗi dòng `từ loại: từ ; từ ; ...` |
| `en-bank.json` | Viết thường, phiên âm giọng Mỹ, sửa nghĩa của kho từ |
| `topics-ipa.json` | Phiên âm giọng Mỹ cho mục Chủ đề |

Nguồn của bài đọc ghi bằng dòng `@source` trong `data-src/stories/`. Sau khi sửa:

```bash
node tools/apply-patches.mjs
```

`merge-data.mjs` cũng tự gọi bước này ở cuối, nên dựng lại dữ liệu không làm mất bản sửa. Phiên âm tiếng Anh theo giọng Mỹ. Đổi dữ liệu xong thì tăng `VERSION` trong `sw.js` để máy người dùng tải bản mới.

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

## Nguồn dữ liệu

| Nguồn | Dùng để | Giấy phép |
|---|---|---|
| hanzi-writer-data 2.0.1 | dữ liệu nét viết | Arphic Public License |
| Make Me a Hanzi | cấu tạo chữ | Arphic Public License |
| Unihan Database | âm Hán Việt, pinyin | Unicode License |
