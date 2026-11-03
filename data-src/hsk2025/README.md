# Danh sách từ HSK chuẩn 2025

`levels.json` ghi cấp của từng từ theo bản sửa đổi năm 2025 của chuẩn HSK 3.0
(cộng đồng hay gọi là "HSK 3.1"): `"1"` đến `"6"`, hoặc `"7-9"`.

Lấy từ gói npm `hsk3.1-syllabus` 0.1.0 (giấy phép MIT, © 2026 leonsilicon), là bản số hoá
danh sách từ trong đề cương chính thức. Đối chiếu thêm với gói `@leonsilicon/hsk3.1`
(nguồn: github.com/becky82/mteh) và kho `drkameleon/complete-hsk-vocabulary` (MIT).

Một từ có nhiều cách viết (`没｜没有`) được tách thành từng cách. Từ xuất hiện ở nhiều cấp
lấy cấp thấp nhất.

`tools/build-curriculum.mjs` dùng tệp này để gắn cấp mới cho từng từ, xếp lại nhóm cấp của
từng bài, và chép ra `data/hsk2025.json` cho app.
