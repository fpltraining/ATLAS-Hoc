# Nguồn âm thanh (game/sfx)

Mọi tệp đều là ghi âm thật, lấy từ nguồn miễn phí, được phép dùng trong game (kể cả thương mại).
Đã cắt, lọc, chỉnh âm lượng và nối vòng lặp cho liền mạch. Tiếng nền (`amb_*`) có đệm 0,5 giây hai đầu để lặp không hở.

## CC0 / phạm vi công cộng (không bắt buộc ghi tên, vẫn ghi để cảm ơn)

| Tệp | Nguồn |
|---|---|
| sfx_step_grass_1–5, sfx_step_stone_1–5, sfx_step_wood_1–5 | Kenney · Impact Sounds (kenney.nl), CC0 |
| sfx_door_wood, sfx_page_turn | Kenney · RPG Audio (kenney.nl), CC0 |
| sfx_paper_pop_1–3 | Kenney · Casino Audio (kenney.nl), CC0 |
| sfx_ui_right, sfx_ui_wrong, sfx_ui_done, sfx_ui_quest, sfx_ui_tap, sfx_ui_tab | Kenney · Interface Sounds 1.0 (kenney.nl, bản GitHub Calinou/kenney-interface-sounds), CC0 (`kenney-interface-sounds.LICENSE.txt`): confirmation_002, error_006, confirmation_004, confirmation_003, select_001, toggle_002 |
| sfx_ui_chest | Kenney · Interface Sounds: maximize_006 trộn glass_002 (trễ 0,23 s), CC0 |
| amb_birds_morning | kresiek-the-furry · AMB Morning Sounds (Perfect Loop), OpenGameArt, CC0 |
| amb_rain_light | kresiek-the-furry · AMB Rain Loop 1, OpenGameArt, CC0 |
| amb_rain_heavy | ogrebane · Rain in the Gutter Loop, OpenGameArt, CC0 |
| amb_river, amb_wind_storm | thimras · Park ambiences, OpenGameArt, CC0 |
| amb_crickets_night | wolfgang · Crickets Ambient Noise (loopable), OpenGameArt, CC0 |
| sfx_fish_splash | rubberduck · 40 CC0 water / splash / slime SFX, OpenGameArt, CC0 |
| sfx_chair_sit | rubberduck · 100 CC0 metal and wood SFX, OpenGameArt, CC0 |
| sfx_thunder_far_2 | rubberduck · 100 CC0 SFX #2, OpenGameArt, CC0 |
| sfx_thunder_far_1 | wuxiascrub · Rain + Long Thunder, OpenGameArt, CC0 |
| sfx_horn_soft | yaroslavnovikov · Car signal, OpenGameArt, CC0 |
| sfx_school_bell | qubodup · Doorbell ring (Doorbell-old-tring, Wikimedia Commons), OpenGameArt, CC0 |
| sfx_shuttle_door | bart · Steam release sounds, OpenGameArt, CC0 |
| amb_city_day | ezwa · Bird sings in the morning with cars in the background.ogg, Wikimedia Commons, phạm vi công cộng |
| amb_classroom | rcrossley · Ambient classroom mono.ogg, Wikimedia Commons, phạm vi công cộng |
| sfx_pen_write | Pencil Sounds (OpenGameArt, CC0): pencil_write của NachtmahrTV (freesound 571800), cắt vòng lặp 1,08 giây (tools/sfx/build-amb.py) |
| tiếng tách, chén, ly trong amb_cafe | rubberduck · 100 CC0 SFX (dishes_01–04, glass_01–03), OpenGameArt, CC0 |

## Cần ghi tên tác giả

| Tệp | Nguồn | Giấy phép |
|---|---|---|
| sfx_chair_pull, sfx_chair_push | dklon · Super Foley Pack (chair_push.wav), OpenGameArt | CC BY 3.0 |
| amb_shuttle_drive | kurt · Engine Sound (enginehum.ogg), OpenGameArt | CC BY 3.0 |
| sfx_duck | Jonathon Jongsma · Anas platyrhynchos - Mallard - XC62258 (xeno-canto, Wikimedia Commons) | CC BY-SA 3.0 |
| amb_market, amb_cafe (nền đám đông) | Gregor Quendel · Free General Ambience Sounds: crowd - mall ambience (OpenGameArt) | CC BY-SA 4.0 |
| amb_playground | Gregor Quendel · Free General Ambience Sounds: crowd - school excursion (OpenGameArt) | CC BY-SA 4.0 |

Tệp `sfx_duck.mp3` giữ giấy phép CC BY-SA 3.0 (đã cắt đoạn 2 tiếng kêu, chỉnh âm lượng).
Tệp `amb_market.mp3`, `amb_cafe.mp3`, `amb_playground.mp3` giữ giấy phép CC BY-SA 4.0 (đã cắt 40 giây, nối vòng, lọc, chỉnh âm lượng; quán cà phê trộn thêm tiếng chén ly CC0). Dựng lại: `python tools/sfx/build-amb.py <thư mục nguồn>`.
- CC BY-SA 4.0: https://creativecommons.org/licenses/by-sa/4.0/

- CC BY 3.0: https://creativecommons.org/licenses/by/3.0/
- CC BY-SA 3.0: https://creativecommons.org/licenses/by-sa/3.0/
- CC0: https://creativecommons.org/publicdomain/zero/1.0/
