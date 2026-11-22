# Thư viện và hình làm sẵn dùng trong game

Anh Han duyệt dùng ngày 21/11/2026 (sau khi xem "Phòng thử ConnectLife"). Giấy phép đầy đủ nằm cạnh từng tệp.

| Tệp | Nguồn | Phiên bản | Giấy phép | Dùng ở đâu |
|---|---|---|---|---|
| `three.min.js` | github.com/mrdoob/three.js | | MIT (`three.LICENSE`) | Bản đồ 3D |
| `lottie_light.min.js` | github.com/airbnb/lottie-web | 5.13.0 | MIT (`lottie.LICENSE`) | Phát hoạt ảnh làm sẵn (pháo giấy `G.confetti`), nạp khi cần |
| `anime.min.js` | github.com/juliangarnier/anime | 3.2.2 (bản ES5) | MIT (`anime.LICENSE`) | `G.enter`, `G.pop`, `G.countUp` (util.js) |
| `auto-animate.js` | github.com/formkit/auto-animate | 0.10.2 | MIT (`auto-animate.LICENSE`) | Trò xếp câu (lesson.js). Bọc lại thành `window.autoAnimate` |
| Biến CSS `--ease-*`, `--shadow-*` | github.com/argyleink/open-props | 1.7.23 | MIT | `:root` trong css/game.css |
| `../assets/ic3_*.webp` | github.com/microsoft/fluentui-emoji (bộ 3D, thu về 128 px) | | MIT (`fluentui-emoji.LICENSE`) | Icon thay emoji: thẻ mục tiêu, bảng Hôm nay, Sảnh (`G.ic3`) |

Hoạt ảnh pháo giấy: xem `../anim/CREDITS.md`.
