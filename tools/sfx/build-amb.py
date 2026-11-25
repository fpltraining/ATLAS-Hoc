"""Dựng tiếng nền còn thiếu và tiếng bút viết chữ cho game (game/sfx), từ ghi âm thật nguồn miễn phí (xem game/sfx/CREDITS.md).

    python tools/sfx/build-amb.py <thư mục nguồn>

Thư mục nguồn (tải từ OpenGameArt, giữ nguyên tên):
  crowd_-_mall_ambience.mp3, crowd_-_school_excursion.mp3   Gregor Quendel · Free General Ambience Sounds (CC BY-SA 4.0)
  100-CC0-SFX/ (giải nén 100-CC0-SFX_0.zip: dishes_0*.ogg, glass_0*.ogg)  rubberduck · 100 CC0 SFX (CC0)
  pencil/ogg/pencil_write.ogg                                 Pencil Sounds (CC0, gốc NachtmahrTV trên freesound)
Ra: game/sfx/amb_market.mp3, amb_cafe.mp3, amb_playground.mp3 (vòng lặp 40 giây nối mềm 2 giây, đệm 0,5 giây hai đầu như
các tiếng nền cũ: lặp từ 0,5 s tới dài − 0,5 s), sfx_pen_write.mp3 (vòng lặp 1,08 giây, đệm 0,3 giây hai đầu; js/audio.js
G.penSound lặp và chỉnh to nhỏ theo tốc độ nét). Âm lượng chuẩn theo các tiếng nền cũ (khoảng −28…−31 LUFS).
Cần ffmpeg, numpy.
"""
import os, subprocess, sys
import numpy as np

SR = 44100
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'game', 'sfx')

def load(path, af=None):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR)]
    if af: cmd += ['-af', af]
    cmd += ['-f', 'f32le', '-']
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype='<f4').copy()

def loop(x, start, length, xfade):
    """Đoạn [start, start + length) nối vòng: phần đầu trộn dần với phần sau đoạn (nối công suất đều)."""
    a, L, C = int(start * SR), int(length * SR), int(xfade * SR)
    seg = x[a:a + L + C]
    out = seg[:L].copy()
    t = np.linspace(0, np.pi / 2, C)
    out[:C] = seg[:C] * np.sin(t) + seg[L:L + C] * np.cos(t)
    return out

def pad(x, p):
    P = int(p * SR)
    return np.concatenate([x[-P:], x, x[:P]])

def lufs(x):
    p = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-af', 'ebur128', '-f', 'null', '-'],
                       input=x.astype('<f4').tobytes(), capture_output=True)
    for line in reversed(p.stderr.decode('utf-8', 'ignore').splitlines()):
        if line.strip().startswith('I:'): return float(line.split()[1])
    return None

def norm(x, target):
    cur = lufs(x)
    y = x * (10 ** ((target - cur) / 20))
    peak = np.abs(y).max()
    return y * (0.89 / peak) if peak > 0.89 else y

def save(x, name, kbps='56k'):
    path = os.path.join(OUT, name)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', kbps, path],
                   input=np.clip(x, -1, 1).astype('<f4').tobytes(), check=True)
    print('  ✓', name, round(len(x) / SR, 2), 's', round(lufs(x), 1), 'LUFS')

def main(src):
    J = lambda *p: os.path.join(src, *p)
    # chợ: đám đông khu mua sắm, lọc bớt tiếng vọng cao cho giống chợ nhỏ ngoài trời
    mall = load(J('crowd_-_mall_ambience.mp3'), 'highpass=f=90,lowpass=f=6500')
    save(pad(norm(loop(mall, 4, 40, 2), -28), 0.5), 'amb_market.mp3')
    # quán cà phê: đoạn khác của tiếng đám đông, nghe trong nhà (lọc trầm, nhỏ hơn) + tiếng tách, chén, ly lách cách thưa thưa
    base = loop(load(J('crowd_-_mall_ambience.mp3'), 'highpass=f=120,lowpass=f=2600'), 14, 40, 2) * 0.55
    rng = np.random.default_rng(7)
    clinks = [load(J('100-CC0-SFX', n)) for n in ['dishes_01.ogg', 'dishes_02.ogg', 'dishes_03.ogg', 'dishes_04.ogg', 'glass_01.ogg', 'glass_02.ogg', 'glass_03.ogg']]
    t = 1.5
    while t < 38:
        c = clinks[rng.integers(len(clinks))]
        c = c / (np.abs(c).max() + 1e-9) * (10 ** (rng.uniform(-26, -19) / 20)) * np.abs(base).max() * 6
        i = int(t * SR)
        base[i:i + len(c)] += c[:len(base) - i]
        t += rng.uniform(2.2, 4.6)
    save(pad(norm(base, -30), 0.5), 'amb_cafe.mp3')
    # sân trường: học sinh nói cười ngoài trời (nghe xa, lọc bớt cao)
    kids = load(J('crowd_-_school_excursion.mp3'), 'highpass=f=100,lowpass=f=5000')
    save(pad(norm(loop(kids, 6, 40, 2), -29), 0.5), 'amb_playground.mp3')
    # bút chì trên giấy: vòng lặp ngắn cho bảng viết chữ Hán
    pen = load(J('pencil', 'ogg', 'pencil_write.ogg'), 'highpass=f=700')
    save(pad(norm(loop(pen, 0.0, 1.08, 0.12), -20), 0.3), 'sfx_pen_write.mp3', '64k')

if __name__ == '__main__':
    main(sys.argv[1])
