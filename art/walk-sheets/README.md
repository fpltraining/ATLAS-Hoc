# Khung bước đi chưa dùng trong game

Tấm khung bước (đứng / bước 1 / bước 2, trước – sau – ngang) anh Han đặt ChatGPT cho các nhân vật đứng yên một chỗ
(người bán trong tiệm, giáo viên, nhân viên quầy…). Game chưa cho họ đi lại nên chưa cắt vào `game/assets/`.
Khi cần: cắt theo cách của các nhân vật đã dùng (hình đứng cao 466 px trong khung 512, chân y = 490, canh theo tâm đầu),
đặt tên `walk_<npc>_left.png`, `_left_w1.png`, `_left_w2.png` rồi chạy `node tools/asset-rev.mjs`.

Đuôi `_b`, `_c`: bản vẽ khác của cùng nhân vật.

## rejected/
Khung bước vung tay, chân quá rộng so với Han (bề ngang khi bước lớn hơn 0,68 lần chiều cao, Han là 0,55):
Kenji, Sofia, Minh, Ben, Dan, Kim, Zoe. Anh Han thấy nhìn giả nên gỡ khỏi game, chờ đặt lại bản bước nhỏ, tự nhiên.
