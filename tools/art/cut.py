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

def cells(path):
    """9 ô của tấm bước: các tấm giấy (hoặc vùng) tách nhau bởi nền hồng, xếp theo hàng rồi cột."""
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    a = magenta_alpha(rgb)
    lab, n = ndimage.label(a > 0.5)
    areas = ndimage.sum(np.ones_like(a), lab, index=np.arange(1, n + 1))
    order = np.argsort(-areas)[:9]
    boxes = []
    for i in order:
        ys, xs = np.nonzero(lab == i + 1)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    boxes.sort(key=lambda b: b[1])
    rows = [sorted(boxes[k:k + 3], key=lambda b: b[0]) for k in (0, 3, 6)]
    return rgb, rows

_SESSION = None
def figure_from_card(img):
    """Nhân vật vẽ trên tấm giấy kem: tách bằng rembg (isnet-anime)."""
    global _SESSION
    from rembg import remove, new_session
    if _SESSION is None: _SESSION = new_session('isnet-anime')
    return remove(img, session=_SESSION, post_process_mask=True)

def do_walk9(t):
    rgb, rows = cells(t['src'])
    src = Image.open(t['src']).convert('RGB')
    names = ['down', 'up', 'left']
    for ri, row in enumerate(rows):
        figs = []
        for b in row:
            pad = 6
            crop = src.crop((b[0] + pad, b[1] + pad, b[2] - pad, b[3] - pad))
            arr = np.asarray(crop.convert('RGB')).astype(np.float32)
            if (magenta_alpha(arr) < 0.5).mean() > 0.3:   # ô nền hồng (nhân vật dán viền giấy): tách theo nền hồng
                a = magenta_alpha(arr); a, _ = keep_main(a); fig = rgba(despill(arr, a), a)
            else:
                fig = figure_from_card(crop)
                fa = np.asarray(fig).astype(np.float32)
                a, _ = keep_main(fa[..., 3] / 255.0); fig = rgba(fa[..., :3], a)
            figs.append(trim(fig))
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

KINDS = {'portrait': do_portrait, 'building': do_building, 'prop': do_building, 'views3': do_views3, 'views3card': do_views3card, 'walk9': do_walk9, 'map': do_map, 'keep': do_keep}

if __name__ == '__main__':
    jobs = json.load(open(sys.argv[1], encoding='utf-8'))
    for t in jobs:
        print(t['kind'], os.path.basename(t['src']))
        KINDS[t['kind']](t)
