/* Mã phiên bản cho từng hình trong game/assets/ (8 ký tự đầu của mã băm nội dung).

     node tools/asset-rev.mjs      → game/data/asset_rev.js

   App tải hình qua địa chỉ assets/<tên>?v=<mã>: thay hình mà giữ nguyên tên thì mã đổi, máy bắt buộc tải bản mới
   (không còn cảnh mặt trước hình mới, mặt sau hình cũ). Hình không đổi giữ nguyên mã, service worker chép lại từ bản
   đã lưu trong máy, không tải lại. Chạy lại mỗi khi thêm, thay hoặc xoá hình. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'game/assets');
const rev = {};
for (const f of fs.readdirSync(DIR).sort()) {
  if (!/\.(png|webp|jpg|mp4)$/.test(f)) continue;
  rev[f] = crypto.createHash('md5').update(fs.readFileSync(path.join(DIR, f))).digest('hex').slice(0, 8);
}
const js = '/* Mã phiên bản từng hình (tạo bởi tools/asset-rev.mjs, đừng sửa tay): hình đổi nội dung thì mã đổi. */\n' +
  'var G = window.G || (window.G = {});\nG.ASSET_REV = ' + JSON.stringify(rev).replace(/","/g, '",\n"') + ';\n';
fs.writeFileSync(path.join(ROOT, 'game/data/asset_rev.js'), js);
console.log('game/data/asset_rev.js:', Object.keys(rev).length, 'hình');
