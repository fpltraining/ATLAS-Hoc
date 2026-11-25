"""Lớp chặn đi bộ (G.WALKMASK) cho tờ bản đồ, từ đường viền vẽ tay theo bản đồ (nước màu nước khó tách theo màu):
mỗi tờ có "block" (vùng không đi được, vd. lòng kênh) và "open" (vùng đi được vẽ đè lên, vd. mặt cầu).

    python tools/art/walkmask.py tools/art/walkmask_zh.json game/data/walkmask_zh.js [thư mục ảnh soát]

Bảng việc: { "<tên tờ bản đồ trong game/assets>": { "block": [[[x, y], …], …], "open": [[[x, y], …], …] } }, toạ độ theo tờ 1536×1024.
Ra tệp JS gán G.WALKMASK['<tên tờ>'] đúng khuôn data/walkmask.js (ô 8 px, mỗi hàng một chuỗi hex, bit cao trước; ô nào quá nửa
bị chặn thì chặn). Có thư mục ảnh soát thì vẽ vùng chặn màu đỏ lên từng tờ để xem.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

C, W, H = 8, 1536, 1024
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def mask_of(spec):
    im = Image.new('L', (W, H), 0)
    d = ImageDraw.Draw(im)
    for poly in spec.get('block', []): d.polygon([tuple(p) for p in poly], fill=255)
    for poly in spec.get('open', []): d.polygon([tuple(p) for p in poly], fill=0)
    m = np.asarray(im) > 127
    return m.reshape(H // C, C, W // C, C).mean(axis=(1, 3)) > 0.5

def rows_of(cells):
    out = []
    for row in cells:
        bits = ''.join('1' if v else '0' for v in row)
        out.append(''.join('%x' % int(bits[i:i + 4], 2) for i in range(0, len(bits), 4)))
    return out

def main(spec_path, out_path, check_dir=None):
    specs = json.load(open(spec_path, encoding='utf-8'))
    lines = ['/* Tự sinh bằng: python tools/art/walkmask.py ' + os.path.relpath(spec_path, ROOT) + ' ' + os.path.relpath(out_path, ROOT) + ' (đừng sửa tay).',
             '   Vùng không đi được trên tờ bản đồ (lòng kênh…), trừ mặt cầu. Khuôn như data/walkmask.js: ô 8 px, hàng hex. */',
             'var G = window.G || (window.G = {});', 'G.WALKMASK = G.WALKMASK || {};']
    for name, spec in specs.items():
        cells = mask_of(spec)
        lines.append('G.WALKMASK[' + json.dumps(name) + '] = ' + json.dumps({'c': C, 'r': rows_of(cells)}, separators=(',', ':')) + ';')
        if check_dir:
            rgb = np.asarray(Image.open(os.path.join(ROOT, 'game', 'assets', name)).convert('RGB')).astype(np.float32)
            big = np.kron(cells, np.ones((C, C), dtype=bool))
            rgb[big] = rgb[big] * 0.45 + np.array([255, 0, 0]) * 0.55
            Image.fromarray(rgb.astype(np.uint8)).save(os.path.join(check_dir, os.path.splitext(name)[0] + '_mask.png'))
        print('  ✓', name, int(cells.sum()), 'ô chặn')
    open(out_path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
