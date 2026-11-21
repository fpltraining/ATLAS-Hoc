/* Bàn tay cầm ô khi trời mưa: [x, y] của bàn tay bên phải màn hình (nhìn trước / sau) hoặc bàn tay phía trước
   (nhìn ngang), tính theo % khung hình; màu bàn tay; đỉnh đầu (% khung). Dò tự động theo màu da, vài hình chỉnh tay. */
var G = window.G || (window.G = {});
G.HANDS = {
    'body_hoodie_down.png': [73.2, 73.3, '#fbcdb2', 6.8],
    'body_hoodie_left.png': [52.1, 75.6, '#facdb3', 6.6],
    'body_hoodie_up.png': [73.2, 73.3, '#fbcdb3', 6.8],
    'body_jacket_down.png': [68.7, 75.6, '#fde1ca', 6.6],
    'body_jacket_left.png': [53.0, 76.3, '#fde0c9', 6.6],
    'body_jacket_up.png': [68.8, 76.0, '#fde1cb', 6.6],
    'body_sport_down.png': [72.4, 73.0, '#fedac4', 6.8],
    'body_sport_left.png': [53.6, 74.5, '#fddac4', 6.8],
    'body_sport_up.png': [71.9, 73.1, '#fddac4', 6.6],
    'body_sweater_down.png': [76, 70, '#fbcdb2', 6.6],
    'body_sweater_left.png': [48, 70, '#fbcdb2', 6.8],
    'body_sweater_up.png': [76, 70, '#fbcdb2', 6.6],
    'body_tech_down.png': [75, 68, '#fbcdb2', 6.6],
    'body_tech_left.png': [58, 68, '#fbcdb2', 6.8],
    'body_tech_up.png': [78, 70, '#fbcdb2', 6.6],
    'body_uniform_down.png': [70.0, 73.1, '#fbe2c7', 6.8],
    'body_uniform_left.png': [51.8, 74.3, '#fbe2c6', 6.8],
    'body_uniform_up.png': [70.0, 73.0, '#fbe2c7', 6.8],
    'kai_down.png': [57, 72, '#5cc8c0', 4.9],
    'kai_follow.png': [57, 72, '#5cc8c0', 4.9],
    'kai_left.png': [55, 66, '#5cc8c0', 4.9],
    'kai_up.png': [65, 68, '#5cc8c0', 4.9],
    'npc_ben.png': [66, 69, '#f6dcc8', 4.9],
    'npc_carlos.png': [63, 67, '#f6dcc8', 4.7],
    'npc_dan.png': [66, 69, '#f6dcc8', 4.9],
    'npc_mia.png': [59, 62, '#f6dcc8', 4.7],
    'npc_nora.png': [29, 67, '#f6dcc8', 4.7],
    'person_amy_down.png': [62.0, 55.9, '#f9d7b0', 4.9],
    'person_amy_left.png': [48.4, 55.3, '#fad6af', 4.9],
    'person_amy_up.png': [63.7, 57.0, '#f6c599', 4.9],
    'person_david_down.png': [62.6, 63.7, '#f8ecd1', 4.9],
    'person_david_left.png': [57.5, 63.8, '#faf1d4', 4.9],
    'person_david_up.png': [63.1, 63.9, '#f8ecd3', 4.9],
    'person_helen_down.png': [64.8, 62.4, '#f9d5ad', 4.9],
    'person_helen_left.png': [47.4, 62.2, '#f8d6ad', 4.9],
    'person_helen_up.png': [64, 64, '#f6dcc8', 4.9],
    'person_kenji_down.png': [60, 61.5, '#f8d7b1', 4.9],
    'person_kenji_left.png': [50, 60, '#f8d7b1', 4.9],
    'person_kenji_up.png': [60, 62, '#f8d7b1', 4.9],
    'person_linda_down.png': [64, 63, '#f6dcc8', 4.9],
    'person_linda_left.png': [50.4, 75.1, '#f7d7aa', 4.9],
    'person_linda_up.png': [64, 63, '#f6dcc8', 4.9],
    'person_marco_down.png': [63.8, 58.5, '#fce1b5', 4.9],
    'person_marco_left.png': [53.7, 58.4, '#f9d7a9', 4.9],
    'person_marco_up.png': [64.4, 54.4, '#f6d4ad', 4.9],
    'person_sofia_down.png': [66, 62, '#f6dcc8', 4.9],
    'person_sofia_left.png': [52, 61, '#f6dcc8', 4.9],
    'person_sofia_up.png': [66, 62, '#f6dcc8', 4.9],
    'person_walter_down.png': [61.7, 61.5, '#f0caa6', 4.9],
    'person_walter_left.png': [51.5, 63.0, '#eec49a', 4.9],
    'person_walter_up.png': [63.1, 62.3, '#e7ba93', 4.9],
    'player_han_down.png': [63.7, 73.4, '#f6dcc8', 8.4],
    'player_han_left.png': [50.6, 74.7, '#f6dcc8', 8.4],
    'player_han_up.png': [64.1, 74.0, '#f6dcc8', 8.4],
    'player_minh_down.png': [56.7, 67.8, '#f1d2ae', 4.9],
    'player_minh_left.png': [50.4, 68.8, '#c7ab86', 4.9],
    'player_minh_up.png': [57.1, 68.1, '#dac39a', 4.9],
    'walk_carlos_down.png': [60, 62, '#f6dcc8', 4.9],
    'walk_nora_down.png': [62, 64, '#f6dcc8', 4.9]
};
/* lòng bàn tay ở khung bước (_w1, _w2): dò theo màu da, tính bằng độ lệch so với khung đứng (tay đung đưa khi đi) */
(function () {
  var W = {"kai_down_w1.png": [52.4, 67.4, "#5cc8c0", 4.9], "kai_left_w1.png": [59.0, 63.6, "#5cc8c0", 4.9], "kai_left_w2.png": [59.3, 64.3, "#5cc8c0", 4.9], "kai_up_w2.png": [70.6, 62.8, "#5cc8c0", 4.9], "person_amy_down_w1.png": [65.9, 56.3, "#f9d7b0", 4.9], "person_amy_down_w2.png": [65.5, 53.8, "#f9d7b0", 4.9], "person_amy_up_w1.png": [67.7, 63.7, "#f6c599", 4.9], "person_david_left_w2.png": [57.6, 63.1, "#faf1d4", 4.9], "person_helen_down_w2.png": [64.7, 66.2, "#f9d5ad", 4.9], "person_kenji_down_w1.png": [60.0, 60.8, "#f8d7b1", 4.9], "person_kenji_down_w2.png": [56.3, 61.3, "#f8d7b1", 4.9], "person_kenji_left_w1.png": [51.9, 55.0, "#f8d7b1", 4.9], "person_kenji_left_w2.png": [50.6, 59.1, "#f8d7b1", 4.9], "person_kenji_up_w2.png": [60.0, 61.4, "#f8d7b1", 4.9], "person_linda_left_w1.png": [47.1, 71.6, "#f7d7aa", 4.9], "person_linda_left_w2.png": [48.9, 71.6, "#f7d7aa", 4.9], "person_marco_down_w1.png": [64.4, 58.7, "#fce1b5", 4.9], "person_marco_down_w2.png": [63.3, 57.1, "#fce1b5", 4.9], "person_marco_up_w1.png": [70.4, 53.2, "#f6d4ad", 4.9], "person_marco_up_w2.png": [70.6, 53.1, "#f6d4ad", 4.9], "person_sofia_down_w1.png": [72.0, 57.5, "#f6dcc8", 4.9], "person_sofia_down_w2.png": [72.6, 56.8, "#f6dcc8", 4.9], "person_sofia_up_w1.png": [69.7, 59.1, "#f6dcc8", 4.9], "person_sofia_up_w2.png": [71.2, 61.0, "#f6dcc8", 4.9], "person_walter_down_w1.png": [66.1, 55.4, "#f0caa6", 4.9], "person_walter_down_w2.png": [68.6, 59.7, "#f0caa6", 4.9], "player_han_down_w1.png": [67.0, 70.4, "#f6dcc8", 8.4], "player_han_down_w2.png": [61.0, 72.6, "#f6dcc8", 8.4], "player_han_up_w1.png": [59.3, 79.2, "#f6dcc8", 8.4], "player_minh_down_w1.png": [57.4, 65.7, "#f1d2ae", 4.9], "player_minh_down_w2.png": [57.7, 67.8, "#f1d2ae", 4.9], "player_minh_left_w2.png": [47.9, 64.1, "#c7ab86", 4.9], "player_minh_up_w1.png": [56.6, 66.7, "#dac39a", 4.9], "player_minh_up_w2.png": [56.7, 67.3, "#dac39a", 4.9], "walk_carlos_down_w1.png": [53.4, 61.1, "#f6dcc8", 4.9]};
  for (var k in W) if (W.hasOwnProperty(k) && !G.HANDS[k]) G.HANDS[k] = W[k];
})();
/* hình ô: [x, y] điểm cầm trên cán (ngay trên móc) và mép dưới của tán (tỉ lệ trong hình). Điểm cầm đặt đúng lòng bàn tay;
   phần cán từ mép tán trở xuống vẽ đè lên bàn tay, tán vẽ sau đầu (nhìn trước / ngang) */
G.UMB_GRIP = {"umbrella_1.png": [0.618, 0.854, 0.698], "umbrella_2.png": [0.5, 0.85, 0.774], "umbrella_3.png": [0.567, 0.856, 0.832], "umbrella_4.png": [0.43, 0.833, 0.724], "umbrella_5.png": [0.373, 0.848, 0.77], "umbrella_6.png": [0.44, 0.839, 0.755]};
