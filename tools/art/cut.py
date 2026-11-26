"""Cắt nền hình đặt (anh Han đặt qua ChatGPT / Meta AI) để gắn vào game, theo khuôn của hình đã có trong game/assets.

    python tools/art/cut.py <bảng việc .json>

Bảng việc: danh sách {"src": tệp gốc, "kind": loại, "out": tệp ra hoặc tiền tố}. Loại:
  portrait  nhân vật đứng một mình trên nền hồng #FF00FF → khung 512×512, cao 466 px, chân y = 490 (như npc_*.png)
  building  nhà / vật to trên nền hồng → vừa khung 490×485 trong 512×512, đáy y = 499 (như pc_*.png)
  prop      vật nhỏ trên nền hồng → như building
  views3    3 góc xe (ngang trái, trước, sau) trên nền hồng → <out>_side.png, _front.png, _back.png (cùng tỉ lệ, ngang rộng 415 px)
  views3card  như views3 nhưng mỗi góc vẽ trên một tấm giấy kem (tách bằng rembg)
  walk9     tấm bước 3×3 (hàng: trước, sau, ngang trái; cột: đứng, bước 1, bước 2), mỗi khung trên tấm giấy kem hoặc nền hồng
            → <out>_down.png, _down_w1.png, _down_w2.png, _up…, _left… (512×512, đứng cao 466, chân y = 490, canh theo tâm đầu)
  map       tờ bản đồ → 1536×1024 webp (cắt giữa cho đúng 3:2)
  keep      giữ nguyên khung, chỉ đổi cỡ (giấy chứng chỉ, thẻ thành phố): "size": [w, h]
  grid      tấm nhiều tư thế dán trên nền hồng, chia đều "cols" × "rows" ô → <out>/<names[i]>.png (khung 512 như portrait,
            hoặc cắt gọn theo "tight": {"tên": chiều cao})
  avatar    ảnh đại diện tròn trên nền hồng → giữa khung 512×512
  far       cảnh xa (Đơn R) trên nền hồng → webp trong suốt, giữ nguyên chiều ngang, đáy thẳng, ngang "width" px (mặc định 1024)
Tấm bước có 3 kiểu: tấm giấy kem rời, hình dán thẳng trên nền hồng, khung giấy liền nhau có nền hồng bên trong (cells()).
Nền hồng: tách theo độ "hồng" (R, B cao hơn G), khử viền hồng ở mép, bỏ các mảng nhỏ rời (chữ "Meta AI", vệt màu).
Nền giấy kem của tấm bước: tách bằng rembg (mô hình isnet-anime, MIT) — cần `pip install "rembg[cpu]"`.
Ảnh ra là PNG bảng màu 256 màu như hình cũ của game (nhẹ). Chạy xong nhớ `node tools/asset-rev.mjs` nếu ghi vào game/assets.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage

def magenta_alpha(rgb, lo=50.0, hi=110.0):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = np.maximum(r, b), np.minimum(r, b)
    s = mn - g                                   # R và B cao hơn G bao nhiêu: nền hồng và bóng tím trên nền hồng
    hue = np.abs(r - b) < 0.45 * mx + 25         # đỏ (lồng đèn), xanh dương: R và B lệch nhau nhiều → không phải nền
    a = 1.0 - np.clip((s - lo) / (hi - lo), 0, 1)
    return np.where(hue, a, 1.0)

def despill(rgb, a):
    """Khử ánh hồng ở mép: phần hồng còn sót (min(R,B) − G) kéo về G theo độ trong."""
    out = rgb.copy()
    spill = np.clip(np.minimum(rgb[..., 0], rgb[..., 2]) - rgb[..., 1], 0, None)
    k = np.clip((1.0 - a) * 1.6, 0, 1) * spill
    edge = ndimage.binary_dilation(a < 0.98, iterations=2)
    k = np.where(edge, np.maximum(k, spill * 0.5), k)
    out[..., 0] -= k
    out[..., 2] -= k
    return np.clip(out, 0, 255)

def keep_main(a, min_frac=0.02, n_keep=None, no_border=False):
    """Bỏ mảng rời nhỏ (chữ ký, vệt màu); n_keep: giữ đúng n mảng to nhất (xe 3 góc); no_border: bỏ mảng chạm mép ảnh (khung giấy viền)."""
    lab, n = ndimage.label(a > 0.5)
    if not n: return a, []
    areas = ndimage.sum(np.ones_like(a), lab, index=np.arange(1, n + 1))
    if no_border:
        edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
        for i in edge: areas[i - 1] = 0
    order = [i for i in np.argsort(-areas) if areas[i] > 0]
    keep = order[:n_keep] if n_keep else [i for i in order if areas[i] >= areas[order[0]] * min_frac]
    m = np.isin(lab, [i + 1 for i in keep])
    m = ndimage.binary_dilation(m, iterations=3)   # giữ cả viền mờ quanh mảng
    return np.where(m, a, 0.0), [(lab == i + 1) for i in keep]

def rgba(rgb, a):
    return Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA')

def trim(im, thr=8):
    bb = im.getchannel('A').point(lambda v: 255 if v > thr else 0).getbbox()
    return im.crop(bb) if bb else im

def fit(im, box_w, box_h, canvas=512, bottom=None, cx=None):
    s = min(box_w / im.width, box_h / im.height)
    im2 = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
    c = Image.new('RGBA', (canvas, canvas), (0, 0, 0, 0))
    x = (canvas - im2.width) // 2 if cx is None else round(cx - im2.width / 2)
    y = (canvas - im2.height) // 2 if bottom is None else bottom - im2.height
    c.alpha_composite(im2, (max(0, x), max(0, y)))
    return c

def save_png(im, out):
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(out, optimize=True)
    print('  ✓', out, im.size)

def magenta_box(rgb):
    """Khung hình chữ nhật của vùng nền hồng (ảnh có viền giấy kem bao quanh thì bỏ viền đó)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    strong = (np.minimum(r, b) - g) > 150
    if not strong.any(): return (0, 0, rgb.shape[1], rgb.shape[0])
    cols = np.nonzero(strong.mean(axis=0) > 0.45)[0]   # cột / hàng phần lớn là nền hồng: mép trong của khung giấy
    rows = np.nonzero(strong.mean(axis=1) > 0.45)[0]
    if not len(cols) or not len(rows): return (0, 0, rgb.shape[1], rgb.shape[0])
    x0, x1, y0, y1 = int(cols.min()), int(cols.max()) + 1, int(rows.min()), int(rows.max()) + 1
    if x0 > 0 or y0 > 0 or x1 < rgb.shape[1] or y1 < rgb.shape[0]:   # có khung: lùi vào thêm 6 px cho hết mép giấy xé
        x0, y0, x1, y1 = x0 + 6, y0 + 6, x1 - 6, y1 - 6
    return (x0, y0, x1, y1)

def cut_magenta(path, n_keep=None, no_border=False):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = magenta_box(rgb)
    rgb = rgb[y0:y1, x0:x1]
    a = magenta_alpha(rgb)
    a = np.where(shadow_mask(rgb), 0.0, a)
    a, parts = keep_main(a, n_keep=n_keep, no_border=no_border)
    return despill(rgb, a), a, parts

def shadow_mask(rgb):
    """Bóng đổ trên nền hồng: màu tím xám đậm (R ≈ B, cả hai cao hơn G rõ, tối hơn nền)."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mn = np.minimum(r, b)
    return (mn - g > 28) & (np.abs(r - b) < 0.35 * np.maximum(r, b) + 12) & (np.maximum(r, b) < 215)

def figure_mask(img):
    """Nhân vật trên nền hồng: mặt nạ của rembg (bỏ bóng dưới chân, chữ ký) giao với mặt nạ nền hồng (bỏ viền hồng)."""
    rgb = np.asarray(img.convert('RGB')).astype(np.float32)
    seg = np.asarray(figure_from_card(img.convert('RGB'))).astype(np.float32)[..., 3] / 255.0
    a = np.minimum(seg, magenta_alpha(rgb))
    a, _ = keep_main(a)
    return despill(rgb, a), a

def do_portrait(t):
    rgb, a = figure_mask(Image.open(t['src']))
    save_png(fit(trim(rgba(rgb, a)), 490, 466, bottom=490), t['out'])

def do_building(t):
    rgb, a, _ = cut_magenta(t['src'])
    save_png(fit(trim(rgba(rgb, a)), 490, 485, bottom=499), t['out'])

def do_views3(t):
    rgb, a, parts = cut_magenta(t['src'], n_keep=3)   # cắt theo vùng nền hồng nên khung giấy viền đã bỏ; giữ 3 mảng to nhất
    boxes = []
    for m in parts:
        ys, xs = np.nonzero(m)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    boxes.sort(key=lambda b: b[0])
    ims = [trim(rgba(rgb, a).crop(b)) for b in boxes]
    s = 415 / ims[0].width
    for im, nm in zip(ims, ['side', 'front', 'back']):
        im2 = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        save_png(im2, t['out'] + '_' + nm + '.png')

def do_views3card(t):
    """3 góc xe vẽ trên 3 tấm giấy kem (nền hồng giữa các tấm): tách xe khỏi tấm giấy bằng rembg."""
    src = Image.open(t['src']).convert('RGB')
    rgb = np.asarray(src).astype(np.float32)
    lab, n = ndimage.label(magenta_alpha(rgb) > 0.5)
    areas = ndimage.sum(np.ones(lab.shape), lab, index=np.arange(1, n + 1))
    boxes = []
    for i in np.argsort(-areas)[:3]:
        ys, xs = np.nonzero(lab == i + 1)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    boxes.sort(key=lambda b: b[0])
    figs = []
    for b in boxes:
        fig = figure_from_card(src.crop((b[0] + 6, b[1] + 6, b[2] - 6, b[3] - 6)))
        fa = np.asarray(fig).astype(np.float32)
        a, _ = keep_main(fa[..., 3] / 255.0)
        figs.append(trim(rgba(fa[..., :3], a)))
    s = 415 / figs[0].width
    for im, nm in zip(figs, ['side', 'front', 'back']):
        save_png(im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS), t['out'] + '_' + nm + '.png')

def boxes_of(lab, idx):
    out = []
    for i in idx:
        ys, xs = np.nonzero(lab == i + 1)
        out.append((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    return out

def grid_rows(boxes, ncol):
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    return [sorted(boxes[k:k + ncol], key=lambda b: b[0]) for k in range(0, len(boxes), ncol)]

def cells(path, n=9, ncol=3):
    """n ô của tấm bước, xếp theo hàng rồi cột. Ba kiểu tấm anh Han gửi:
       tấm giấy kem rời nhau, hoặc hình dán thẳng trên nền hồng → mỗi ô là một mảng không hồng ('parts');
       khung giấy liền nhau, trong khung là nền hồng → mỗi ô là một vùng hồng không chạm mép ảnh ('holes')."""
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    a = magenta_alpha(rgb)
    lab, k = ndimage.label(a > 0.5)
    areas = ndimage.sum(np.ones_like(a), lab, index=np.arange(1, k + 1))
    order = np.argsort(-areas)[:n]
    if k >= n and areas[order[0]] < 4 * areas[order[n - 1]]:
        return rgb, grid_rows(boxes_of(lab, order), ncol), 'parts'
    lab, k = ndimage.label(a < 0.5)
    areas = ndimage.sum(np.ones_like(a), lab, index=np.arange(1, k + 1))
    for i in set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}: areas[i - 1] = 0
    order = np.argsort(-areas)[:n]
    return rgb, grid_rows(boxes_of(lab, order), ncol), 'holes'

def cell_figure(src, rgb, b, mode):
    """Nhân vật trong một ô: hình dán trên nền hồng (viền ô phần lớn là hồng) hoặc trong khung hồng → tách theo nền hồng;
       vẽ trên tấm giấy kem → tách bằng rembg."""
    x0, y0, x1, y1 = b
    # hình dán: nền hồng chiếm phần đáng kể trong khung bao (quanh dáng người); tấm giấy kem (kể cả đặt hơi nghiêng) gần như kín khung
    if mode == 'holes' or (magenta_alpha(rgb[y0:y1, x0:x1]) < 0.5).mean() > 0.25:
        e = 0 if mode == 'holes' else 12                 # hình dán: lấy rộng ra để không cụt viền giấy
        H, W = rgb.shape[:2]
        arr = rgb[max(0, y0 - e):min(H, y1 + e), max(0, x0 - e):min(W, x1 + e)]
        a = np.where(shadow_mask(arr), 0.0, magenta_alpha(arr))
        a2, _ = keep_main(a, no_border=True)               # bỏ mép khung giấy còn sót quanh ô
        if a2.max() == 0: a2, _ = keep_main(a)
        return trim(rgba(despill(arr, a2), a2))
    fig = figure_from_card(src.crop((x0 + 6, y0 + 6, x1 - 6, y1 - 6)))
    fa = np.asarray(fig).astype(np.float32)
    a, _ = keep_main(fa[..., 3] / 255.0)
    return trim(rgba(fa[..., :3], a))

_SESSION = None
def figure_from_card(img):
    """Nhân vật vẽ trên tấm giấy kem: tách bằng rembg (isnet-anime)."""
    global _SESSION
    from rembg import remove, new_session
    if _SESSION is None: _SESSION = new_session('isnet-anime')
    return remove(img, session=_SESSION, post_process_mask=True)

def do_walk9(t):
    rgb, rows, mode = cells(t['src'])
    src = Image.open(t['src']).convert('RGB')
    names = ['down', 'up', 'left']
    for ri, row in enumerate(rows):
        figs = [cell_figure(src, rgb, b, mode) for b in row]
        s = 466 / figs[0].height                      # cùng tỉ lệ với khung đứng của hàng
        for ci, fig in enumerate(figs):
            im2 = fig.resize((max(1, round(fig.width * s)), max(1, round(fig.height * s))), Image.LANCZOS)
            al = np.asarray(im2.getchannel('A'))
            head = al[: max(1, im2.height // 5)]
            xs = np.nonzero(head.max(axis=0) > 40)[0]
            hx = (xs.min() + xs.max()) / 2 if len(xs) else im2.width / 2
            c = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
            c.alpha_composite(im2, (max(0, round(256 - hx)), max(0, 490 - im2.height)))
            save_png(c, t['out'] + '_' + names[ri] + ('', '_w1', '_w2')[ci] + '.png')

def do_map(t):
    im = Image.open(t['src']).convert('RGB')
    w, h = im.size
    if w / h > 1.5: nw = round(h * 1.5); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else: nh = round(w / 1.5); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))
    im = im.resize((1536, 1024), Image.LANCZOS)
    os.makedirs(os.path.dirname(t['out']) or '.', exist_ok=True)
    im.save(t['out'], 'WEBP', quality=86, method=6)
    print('  ✓', t['out'], im.size)

def do_keep(t):
    im = Image.open(t['src']).convert('RGB')
    w, h = t.get('size', im.size)
    s = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    im = im.crop((x, y, x + w, y + h))
    os.makedirs(os.path.dirname(t['out']) or '.', exist_ok=True)
    if t['out'].endswith('.webp'): im.save(t['out'], 'WEBP', quality=86, method=6)
    else: im.quantize(256, method=Image.Quantize.MEDIANCUT).save(t['out'], optimize=True)
    print('  ✓', t['out'], im.size)

def do_grid(t):
    """Tấm nhiều tư thế dán trên nền hồng, chia đều "cols" × "rows" ô: mỗi ô ra một tệp <out>/<tên>.png theo "names"
    (giữ cả mảng nhỏ đi kèm trong ô như mũi tên, đám mây). Mặc định khung 512 như portrait; "tight": {"tên": cao}
    thì cắt gọn theo hình và đổi về chiều cao đó (như kai_sit.png, kai_rotate.png)."""
    rgb = np.asarray(Image.open(t['src']).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = magenta_box(rgb)
    cols, rows = t.get('cols', 3), t.get('rows', 2)
    cw, ch = (x1 - x0) / cols, (y1 - y0) / rows
    for i, nm in enumerate(t['names']):
        if not nm: continue
        cx, cy = i % cols, i // cols
        arr = rgb[int(y0 + cy * ch):int(y0 + (cy + 1) * ch), int(x0 + cx * cw):int(x0 + (cx + 1) * cw)]
        a = np.where(shadow_mask(arr), 0.0, magenta_alpha(arr))
        a, _ = keep_main(a, min_frac=0.01)
        im = trim(rgba(despill(arr, a), a))
        h = (t.get('tight') or {}).get(nm)
        im = im.resize((round(im.width * h / im.height), h), Image.LANCZOS) if h else fit(im, 490, 466, bottom=490)
        save_png(im, os.path.join(t['out'], nm + '.png'))

def do_avatar(t):
    """Ảnh đại diện tròn trên nền hồng → giữa khung 512×512."""
    rgb, a, _ = cut_magenta(t['src'])
    save_png(fit(trim(rgba(rgb, a)), 500, 500), t['out'])

def do_far(t):
    """Cảnh xa (Đơn R): dải núi, đồi đứng trên đồng cỏ ở xa. Nền hồng tách theo cách gỡ màu: điểm ảnh = a·màu thật + (1 − a)·hồng,
    nên sương trắng loang trên nền hồng thành trong dần mà không còn ánh hồng. Giữ nguyên chiều ngang, cắt sát mép, đáy thẳng như ảnh gốc;
    ra webp có kênh trong suốt, ngang "width" px (mặc định 1024) cho nhẹ máy; "keep_h": chỉ lấy phần trên của ảnh gốc (bỏ bệ giấy)."""
    rgb = np.asarray(Image.open(t['src']).convert('RGB')).astype(np.float32)
    if t.get('keep_h'): rgb = rgb[:t['keep_h']]                  # bỏ bệ giấy dưới chân (vd. far_zh_mountains_2)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    s = np.minimum(r, b) - g
    hue = np.abs(r - b) < 0.45 * np.maximum(r, b) + 25          # đỏ (mái đình), xanh dương: không phải nền
    a = np.where(hue, 1.0 - np.clip((s - 12.0) / 178.0, 0, 1), 1.0)
    a = np.where(shadow_mask(rgb), 0.0, a)
    a, _ = keep_main(a, min_frac=0.01)
    a = np.where(a < 0.06, 0.0, a)
    al = np.maximum(a, 1e-3)[..., None]
    F = np.clip((rgb - (1.0 - a)[..., None] * np.array([255.0, 0.0, 255.0])) / al, 0, 255)
    F = np.where((a > 0.995)[..., None], rgb, F)
    spill = np.clip(np.minimum(F[..., 0], F[..., 2]) - F[..., 1], 0, None)   # cảnh xa không có màu tím, hồng: ánh tím còn sót trong sương kéo về xám
    spill = np.where(np.abs(F[..., 0] - F[..., 2]) < 0.45 * np.maximum(F[..., 0], F[..., 2]) + 25, spill, 0)
    F[..., 0] -= spill; F[..., 2] -= spill
    im = trim(rgba(F, a), thr=10)
    w = t.get('width', 1024)
    im = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
    os.makedirs(os.path.dirname(t['out']) or '.', exist_ok=True)
    im.save(t['out'], 'WEBP', quality=86, method=6)
    print('  ✓', t['out'], im.size)

KINDS = {'portrait': do_portrait, 'building': do_building, 'prop': do_building, 'views3': do_views3, 'views3card': do_views3card, 'walk9': do_walk9, 'map': do_map, 'keep': do_keep, 'grid': do_grid, 'avatar': do_avatar, 'far': do_far}

if __name__ == '__main__':
    jobs = json.load(open(sys.argv[1], encoding='utf-8'))
    for t in jobs:
        print(t['kind'], os.path.basename(t['src']))
        KINDS[t['kind']](t)
