// Bản đồ 3D Trường Lạc trấn (game/data/city_zh.js): ba khu nối liền, đủ hình, 8 nơi nói chuyện đều có người đứng trên bản đồ,
// lòng kênh không đi được nhưng mặt cầu đi được, cửa nhà / chỗ đứng của người dân không rơi xuống nước, Tiểu Long đủ khung bước.
import { loadGame, eq, ok, done } from './harness.mjs';

const G = loadGame(['js/util.js', 'data/asset_rev.js', 'data/life.js', 'data/life_morning.js', 'data/river_en.js', 'data/walkmask_zh.js', 'data/city_zh.js', 'js/world.js', 'data/life_zh.js']);
const has = (n) => !!(G.ASSET_REV && G.ASSET_REV[n]);
const Z = G.WORLDS.zh, ids = Object.keys(Z);

// 1. bố cục: Brightford giữ nguyên, Trường Lạc trấn 3 khu
ok('bố cục Brightford còn nguyên (G.WORLDS.en)', !!(G.WORLDS.en && G.WORLDS.en.home_en && G.WORLDS.en.city_en));
eq('ba khu Trường Lạc trấn, xếp từ dưới lên', G.ZH_CITY, ['oldtown_zh', 'center_zh', 'newtown_zh']);
eq('khu nào cũng là cảnh thành phố tiếng Trung có tờ bản đồ', ids.filter((id) => { const s = G.SCENES[id]; return !(s && s.city === 'zh' && s.kind === 'city' && has(s.bg)); }), []);

// 2. hình đủ: nhà, vật, quầy, xe, khung bước người dân, Tiểu Long
const need = [];
ids.forEach((id) => {
  const s = G.SCENES[id];
  (s.buildings || []).forEach((b) => need.push(b.img));
  (s.props || []).forEach((p) => need.push(p.img));
  (s.road ? s.road.cars : []).forEach((c) => need.push(c.n + '_side.png'));
  (G.PEOPLE[id] || []).forEach((p) => { if (p.bimg) need.push(p.bimg); else ['down', 'up', 'left'].forEach((d) => ['', '_w1', '_w2'].forEach((w) => need.push('walk_' + p.npc + '_' + d + w + '.png'))); });
});
['down', 'up', 'left'].forEach((d) => ['', '_w1', '_w2'].forEach((w) => need.push('long_' + d + w + '.png')));
need.push('long_face.png', 'long_follow.png', 'long_rotate.png');
eq('hình dùng trên bản đồ đều có trong game/assets', [...new Set(need)].filter((n) => !has(n)), []);

// 3. 8 nơi nói chuyện đều có người đứng trên bản đồ; mỗi người dân trỏ đúng nơi tiếng Trung
const places = Object.keys(G.LIFE).filter((k) => G.LIFE[k].lang === 'zh'), onMap = new Set();
ids.forEach((id) => (G.PEOPLE[id] || []).forEach((p) => onMap.add(p.life)));
eq('nơi nói chuyện chưa có người trên bản đồ', places.filter((k) => !onMap.has(k)), []);
const badP = [];
ids.forEach((id) => (G.PEOPLE[id] || []).forEach((p) => { const L = G.LIFE[p.life]; if (!L || L.lang !== 'zh' || L.npc !== p.npc || !G.NPCS[p.npc]) badP.push(id + ':' + p.npc + ':' + p.life); }));
eq('người dân đúng người, đúng nơi', badP, []);
ok('Học viện mở bảng phòng học', ids.some((id) => G.SCENES[id].buildings.some((b) => b.id === 'school' && b.panel === 'openZhHall')));
ok('nhà mình ở phố cổ, chỗ xuất hiện là trước cửa nhà', G.SCENES.oldtown_zh.buildings.some((b) => b.home) && G.SCENES.oldtown_zh.spawn.y > G.SCENES.oldtown_zh.buildings[0].y);

// 4. cổng (bản 2D) trỏ tới khu có thật, điểm tới nằm trong vùng đi được
const badG = [];
ids.forEach((id) => (G.SCENES[id].gates || []).forEach((g) => { const t = G.SCENES[g.to.scene], w = t && t.walk; if (!t || !Z[g.to.scene] || g.to.x < w.x0 || g.to.x > w.x1 || g.to.y < w.y0 || g.to.y > w.y1) badG.push(id + '→' + g.to.scene); }));
eq('cổng sang khu bên cạnh', badG, []);

// 5. lòng kênh: nước chặn, cầu đi được; cửa nhà, người dân, chỗ xuất hiện không ở dưới nước
const M = G.WALKMASK['map_zh_oldtown.webp'];
eq('lớp chặn kênh đúng khuôn 192 × 128 ô', [M.c, M.r.length, M.r[0].length * 4], [8, 128, 192]);
const wet = (x, y) => (parseInt(M.r[(y / 8) | 0].charAt((x / 8) >> 2), 16) >> (3 - (((x / 8) | 0) & 3))) & 1;
eq('giữa kênh không đi được', [wet(700, 520), wet(200, 520), wet(1400, 450)], [1, 1, 1]);
eq('hai cây cầu đi được', [wet(400, 560), wet(470, 400), wet(1080, 500), wet(1140, 590)], [0, 0, 0, 0]);
const dry = [['spawn', G.SCENES.oldtown_zh.spawn.x, G.SCENES.oldtown_zh.spawn.y]];
G.SCENES.oldtown_zh.buildings.forEach((b) => dry.push([b.id, b.x, b.y + 30]));
(G.PEOPLE.oldtown_zh || []).forEach((p) => dry.push([p.npc, p.x, p.y + 30]));
eq('cửa nhà, chỗ người dân đứng không ở dưới nước', dry.filter((d) => wet(d[1], d[2])).map((d) => d[0]), []);

process.exit(done('Bản đồ 3D Trường Lạc trấn') ? 1 : 0);
