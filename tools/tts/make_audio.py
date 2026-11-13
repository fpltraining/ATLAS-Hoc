"""Tạo âm thanh giọng AI (Kokoro, mã nguồn mở, giấy phép Apache 2.0) cho danh sách câu.

    python tools/tts/make_audio.py            # đọc data-src/audio-list.json, ghi audio/<lang>/<khoá>.mp3

Cài: pip install torch "kokoro>=0.9.4" "misaki[zh,en]" soundfile, cùng ffmpeg và espeak-ng.
Chạy lại được nhiều lần: câu nào đã có tệp thì bỏ qua. Cuối cùng ghi data/audio.json
(danh sách khoá đã có tệp) để app biết câu nào có giọng AI.
"""
import json, os, subprocess, sys, time
import numpy as np
import torch
from kokoro import KPipeline, KModel

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'audio')
# AUDIO_TMP: ghi tệp mới ra thư mục tạm (ngoài repo) trong lúc tạo; tệp đã có trong audio/ vẫn được bỏ qua
TMP = os.environ.get('AUDIO_TMP') or OUT
SR = 24000
SPEED = 0.95
torch.set_num_threads(os.cpu_count() or 4)

items = json.load(open(os.path.join(ROOT, 'data-src', 'audio-list.json')))
only = sys.argv[1] if len(sys.argv) > 1 else None   # 'en' hoặc 'zh' để chạy một ngôn ngữ

pipes = {}
def pipe(lang):
    if lang in pipes:
        return pipes[lang]
    if lang == 'en':
        pipes[lang] = KPipeline(lang_code='a')
    else:
        repo = 'hexgrad/Kokoro-82M-v1.1-zh'
        model = KModel(repo_id=repo).eval()
        en = KPipeline(lang_code='a', repo_id=repo, model=False)
        pipes[lang] = KPipeline(lang_code='z', repo_id=repo, model=model,
                                en_callable=lambda t: next(en(t)).phonemes)
    return pipes[lang]

def mp3(path, audio):
    pcm = (np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-',
                    '-b:a', '32k', '-ar', '24000', path], input=pcm, check=True)

def write_manifest():
    have = {'en': [], 'zh': []}
    for lang in have:
        d = os.path.join(OUT, lang)
        if os.path.isdir(d):
            have[lang] = sorted(f[:-4] for f in os.listdir(d) if f.endswith('.mp3'))
    json.dump(have, open(os.path.join(ROOT, 'data', 'audio.json'), 'w'), separators=(',', ':'))
    return have

def exists(it):
    return any(os.path.exists(os.path.join(d, it['lang'], it['key'] + '.mp3')) for d in (OUT, TMP))
todo = [it for it in items if (not only or it['lang'] == only) and not exists(it)]
print(f'Cần tạo {len(todo)} / {len(items)} câu', flush=True)
t0 = time.time()
for n, it in enumerate(todo, 1):
    os.makedirs(os.path.join(TMP, it['lang']), exist_ok=True)
    try:
        chunks = [r.audio.numpy() for r in pipe(it['lang'])(it['text'], voice=it['voice'], speed=SPEED) if r.audio is not None]
        if not chunks:
            continue
        # thêm 0,15 giây lặng ở cuối cho đỡ cụt
        audio = np.concatenate(chunks + [np.zeros(int(SR * 0.15), dtype=np.float32)])
        mp3(os.path.join(TMP, it['lang'], it['key'] + '.mp3'), audio)
    except Exception as e:  # một câu lỗi không làm dừng cả đợt
        print(f'Lỗi {it["key"]} {it["text"][:40]!r}: {e}', flush=True)
    if n % 200 == 0:
        el = time.time() - t0
        print(f'{n}/{len(todo)} · {el/60:.1f} phút · còn khoảng {el/n*(len(todo)-n)/60:.0f} phút', flush=True)
        if TMP == OUT:
            write_manifest()
h = write_manifest() if TMP == OUT else {'en': [], 'zh': []}
print(f'Xong. Có tệp: en {len(h["en"])}, zh {len(h["zh"])}', flush=True)
