# ATLAS

App học tiếng Anh và tiếng Trung cho người Việt: lộ trình, truyện song ngữ, viết bằng Apple Pencil và ôn tập ngắt quãng. Chạy hoàn toàn trên máy, không tài khoản, không quảng cáo, dùng được khi không có mạng.

Gộp từ 5 app: Bút Hán, Inklish, ATLAS bản cũ, Song Ngữ và Han's English Hub.

## Có gì trong app

| Mục | Nội dung |
|---|---|
| Hôm nay | Việc cần làm theo thứ tự, chia theo quỹ 30 phút đến 2 tiếng, có nhật ký |
| Tiếng Anh | 5 chặng từ A0 đến C1, truyện và tin song ngữ, viết bằng bút, ôn thẻ, tiếng Anh nghề, sổ tay ngữ pháp |
| Tiếng Trung | 118 bài HSK 1–4, truyện song ngữ có pinyin, viết chấm từng nét, ôn thẻ, pinyin, bộ thủ |
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

Thêm vào một tệp trong `data-src/stories/`, rồi dựng lại dữ liệu:

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
> Gợi ý nói hoặc viết sau khi đọc.
```

Tiếng Trung thêm `@lang zh`, mỗi dòng là `chữ Hán | pinyin | tiếng Việt`. Chữ Hán mới cần thêm vào `data-src/strokes-extra.json` để viết được bằng bút, và từ mới thêm vào `data-src/zh-extra.txt` để chạm vào là tra được.

`@shelf` nhận `ai`, `true`, `news`, `mystery`, `long`, và `fable` cho tiếng Trung.

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
