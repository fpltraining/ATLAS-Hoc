// Đồng cỏ quanh thành phố 3D (G.country trong js/world.js, va chạm G.blockedWorld trong js/engine.js; anh Han 25/11/2026:
// "di chuyển tới đó được luôn nhưng chỉ là cảnh đẹp thôi"): ra khỏi tờ bản đồ là đi được trên đồng cỏ, cây đá chặn ở gốc,
// tới mép đi được thì dừng ngay trước vòng cảnh xa (núi Đơn R); trong phố vẫn chặn như cũ (lòng kênh, chỗ nối hai khu).
import { loadGame, eq, ok, done } from './harness.mjs';

const G = loadGame(['js/util.js', 'data/asset_rev.js', 'data/life.js', 'data/life_morning.js', 'data/life_school.js', 'data/life_after.js', 'data/walkmask.js',
  'data/river_en.js', 'data/walkmask_zh.js', 'data/city_zh.js', 'js/world.js', 'data/life_zh.js', 'js/engine.js']);
const K = G.COUNTRY, has = (n) => !!(G.ASSET_REV && G.ASSET_REV[n]);
ok('mép đi được nằm trước vòng cảnh xa, cây rải xa hơn vòng cảnh xa', K.walk < K.far && K.far < K.band);

function check(city) {
  G.WORLD3D = G.WORLDS[city];
  const C = G.country(true), name = city === 'zh' ? 'Trường Lạc trấn' : 'Brightford';
  eq(name + ': bố cục đúng thành phố', C.city, city);
  ok(name + ': có cây, bụi, đá ngoài phố (' + C.items.length + ')', C.items.length > 150);
  eq(name + ': hình cây, đá đều có trong game/assets', [...new Set(C.items.map((o) => o.img))].filter((n) => !has(n)), []);
  const inRect = (x, y, m) => C.rects.some((r) => x > r[0] - m && x < r[2] + m && y > r[1] - m && y < r[3] + m);
  eq(name + ': không cây nào mọc trên tờ bản đồ', C.items.filter((o) => inRect(o.x, o.y, 20)).length, 0);
  const edge = (x, y) => Math.max(C.x0 - x, x - C.x1, C.y0 - y, y - C.y1, 0);
  eq(name + ': chừa chỗ cho vòng cảnh xa', C.items.filter((o) => Math.abs(edge(o.x, o.y) - K.far) < 90).length, 0);
  const C2 = G.country(true);
  eq(name + ': bố cục cố định mỗi lần dựng', [C2.items.length, Math.round(C2.items[0].x), Math.round(C2.items[0].y)], [C.items.length, Math.round(C.items[0].x), Math.round(C.items[0].y)]);
  // vòng cảnh xa: chỉ hình đã có; nằm đúng trên đường bao cách mép thành phố K.far px
  const farImgs = (G.FAR_IMG[city] || []).filter(has);
  ok(name + ': vòng cảnh xa có tấm nếu đã có hình (' + C.far.length + ' tấm, ' + farImgs.length + ' hình)', farImgs.length ? C.far.length >= 8 : C.far.length === 0);
  eq(name + ': tấm cảnh xa đều nằm trên đường bao', C.far.filter((f) => Math.abs(edge(f.x, f.y) - K.far) > 1).length, 0);
  eq(name + ': tấm cảnh xa cao 5–9 đơn vị', C.far.filter((f) => f.h < 500 || f.h > 900).length, 0);
  // va chạm: ngoài tờ bản đồ đi được, quá mép thì chặn, gốc cây chặn
  const cx = (C.x0 + C.x1) / 2, cy = (C.y0 + C.y1) / 2;
  const sides = [[C.x0 - 600, cy], [C.x1 + 600, cy], [cx, C.y0 - 600], [cx, C.y1 + 600]];
  const freeNear = (p) => { for (let d = 0; d < 400; d += 20) for (const s of [[d, 0], [-d, 0], [0, d], [0, -d]]) if (!G.blockedWorld(p[0] + s[0], p[1] + s[1])) return true; return false; };
  eq(name + ': bốn phía ngoài phố đều có chỗ đi được', sides.map(freeNear), [true, true, true, true]);
  eq(name + ': quá mép đi được thì chặn (bốn phía)', [[C.x0 - K.walk - 20, cy], [C.x1 + K.walk + 20, cy], [cx, C.y0 - K.walk - 20], [cx, C.y1 + K.walk + 20]].map((p) => G.blockedWorld(p[0], p[1])), [true, true, true, true]);
  const tree = C.items.find((o) => o.fold === 'tree' && edge(o.x, o.y) > 300 && edge(o.x, o.y) < K.walk - 300);
  ok(name + ': gốc cây ngoài đồng chặn đường', G.blockedWorld(tree.x, tree.y));
  ok(name + ': đứng cách gốc cây một quãng thì đi được', freeNear([tree.x + tree.r + 40, tree.y]));
  eq(name + ': khoảng cách ra đồng cỏ (trong phố = 0)', [G.countryOut(C.rects[0][0] + 700, C.rects[0][1] + 500), Math.round(G.countryOut(C.rects[0][0] - 500, C.rects[0][1] + 500))], [0, 500]);
  ok(name + ': còn cách mép đi được (dương: trong mép, âm: quá mép)', G.countryEdge(cx, cy) > K.walk && G.countryEdge(C.x0 - K.walk - 50, cy) < 0);
  return C;
}
check('zh');
check('en');

// Trường Lạc trấn: trong phố vẫn chặn như cũ; mép ngoài tờ bản đồ bước ra đồng cỏ được, trừ chỗ có nước
G.WORLD3D = G.WORLDS.zh; G.country(true);
const O = G.WORLDS.zh.oldtown_zh, Cn = G.WORLDS.zh.center_zh;
eq('lòng kênh vẫn không đi được', [G.blockedWorld(O.ox + 700, O.oy + 520), G.blockedWorld(O.ox + 200, O.oy + 520)], [true, true]);
ok('kênh chảy ra mép trái: vẫn không lội ra đồng cỏ được', G.blockedWorld(O.ox + 2, O.oy + 520));
eq('mép trái phố cổ (chỗ khô) bước ra đồng cỏ được', [G.blockedWorld(O.ox + 2, O.oy + 760), G.blockedWorld(O.ox - 60, O.oy + 760)], [false, false]);
ok('chỗ nối phố cổ – trung tâm vẫn đi qua được', !G.blockedWorld(O.ox + 735, O.oy + 20) && !G.blockedWorld(Cn.ox + 765, Cn.oy + 1010));
const f = G.FAR_IMG.zh;
eq('đủ 5 hình cảnh xa Trường Lạc trấn (Đơn R1)', f.filter(has).length, 5);

process.exit(done('Đồng cỏ quanh thành phố') ? 1 : 0);
