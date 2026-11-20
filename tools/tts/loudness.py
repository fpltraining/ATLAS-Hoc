"""Cân bằng âm lượng các tệp giọng AI để nghe không lúc to lúc nhỏ.

    python tools/tts/loudness.py [số luồng] [tệp danh sách khoá]   # có danh sách (mỗi dòng en/abcd1234) thì chỉ đo các tệp đó

Đo độ to cảm nhận (LUFS, chuẩn EBU R128) của mọi tệp trong audio/en và audio/zh. Tệp nào lệch quá 1,5 LU so với mức chung
(-18,7 LUFS, mức của đa số tệp) thì tăng / giảm đều cả tệp về mức chung, có giới hạn đỉnh để không vỡ tiếng.
Tên các tệp đã chỉnh ghi vào data/audio.json (mục "fix") để app tải bản mới thay cho bản cũ đã lưu trong máy.
Cần ffmpeg.
"""
import os, re, subprocess, sys, json, statistics
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
AUD = os.path.join(ROOT, 'audio')
TARGET, TOL = -18.7, 1.5

def lufs(p):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', out)
    return float(m[-1]) if m else None

def fix(p, cur):
    tmp = p + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', p, '-af', 'volume=%.2fdB,alimiter=limit=0.84:attack=2:release=40' % (TARGET - cur),
                    '-ar', '24000', '-ac', '1', '-b:a', '32k', tmp], check=True)
    os.replace(tmp, p)

if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    files = [os.path.join(AUD, l, f) for l in ('en', 'zh') if os.path.isdir(os.path.join(AUD, l)) for f in sorted(os.listdir(os.path.join(AUD, l))) if f.endswith('.mp3')]
    if len(sys.argv) > 2: files = [os.path.join(AUD, k.strip() + '.mp3') for k in open(sys.argv[2]) if k.strip() and os.path.exists(os.path.join(AUD, k.strip() + '.mp3'))]
    print('Đo', len(files), 'tệp', flush=True)
    with ThreadPoolExecutor(n) as ex: vals = list(ex.map(lufs, files))
    ok = [v for v in vals if v is not None and v > -70]
    print('Trước: trung bình %.2f LUFS, độ lệch %.2f, thấp nhất %.1f, cao nhất %.1f' % (statistics.mean(ok), statistics.pstdev(ok), min(ok), max(ok)), flush=True)
    bad = [(p, v) for p, v in zip(files, vals) if v is not None and v > -70 and abs(v - TARGET) > TOL]
    print('Cần chỉnh', len(bad), 'tệp', flush=True)
    with ThreadPoolExecutor(n) as ex: list(ex.map(lambda b: fix(*b), bad))
    after = [lufs(p) for p, _ in bad[:60]]
    if after: print('Sau khi chỉnh (mẫu %d tệp): trung bình %.2f, thấp nhất %.1f, cao nhất %.1f' % (len(after), statistics.mean(after), min(after), max(after)), flush=True)
    mf = os.path.join(ROOT, 'data', 'audio.json'); m = json.load(open(mf))
    fixed = set(m.get('fix', [])) | {os.path.relpath(p, AUD)[:-4] for p, _ in bad}
    m['fix'] = sorted(fixed); json.dump(m, open(mf, 'w'), separators=(',', ':'))
    print('Ghi', len(fixed), 'tệp vào data/audio.json (fix)', flush=True)
