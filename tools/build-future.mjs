/* Loạt truyện "Brightford 2080" (data-src/future/*.txt) → data/stories/<id>.json + mục trong index.json.
   Cú pháp: #id/#level/#title/#vi/#blurb · "## Tên | Tên Việt" mở chương · "English | Tiếng Việt" mỗi câu ·
   dòng trống = sang đoạn · "? câu hỏi" = Suy ngẫm · "* từ | nghĩa" = từ đáng nhớ.
     node tools/build-future.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(ROOT, 'data-src/future');
const idxPath = path.join(ROOT, 'data/stories/index.json');
let idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
const made = [];
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.txt')).sort()) {
  const meta = {}, chapters = [];
  let ch = null, para = [];
  const flush = () => { if (para.length && ch) { ch.paras.push(para); para = []; } };
  for (const raw of fs.readFileSync(path.join(dir, f), 'utf8').split('\n')) {
    const ln = raw.trim();
    if (ln.startsWith('#') && !ln.startsWith('##')) { const m = ln.match(/^#(\w+)\s+(.*)$/); meta[m[1]] = m[2]; continue; }
    if (ln.startsWith('## ')) { flush(); const [t, v] = ln.slice(3).split(' | '); ch = { n: chapters.length + 1, title: t, vi: v, paras: [], think: [], vocab: [] }; chapters.push(ch); continue; }
    if (!ln) { flush(); continue; }
    if (ln.startsWith('? ')) { flush(); ch.think.push(ln.slice(2)); continue; }
    if (ln.startsWith('* ')) { flush(); const [w, v] = ln.slice(2).split(' | '); ch.vocab.push([w, v]); continue; }
    const [en, vi] = ln.split(' | ');
    if (!vi) throw new Error(`${f}: thiếu nghĩa: ${ln}`);
    para.push([en, vi]);
  }
  flush();
  const story = { id: meta.id, shelf: 'future', level: meta.level, title: meta.title, vi: meta.vi, blurb: meta.blurb, sources: [], chapters };
  fs.writeFileSync(path.join(ROOT, `data/stories/${meta.id}.json`), JSON.stringify(story));
  const words = (c) => c.paras.flat().map((x) => x[0]).join(' ').split(/\s+/).length;
  const entry = { id: meta.id, lang: 'en', shelf: 'future', level: meta.level, title: meta.title, vi: meta.vi, blurb: meta.blurb, date: '', sources: [],
    chapters: chapters.map((c) => ({ n: c.n, title: c.title, vi: c.vi, words: words(c), lines: c.paras.flat().length })) };
  idx = idx.filter((s) => s.id !== meta.id);
  idx.unshift(entry);
  made.push(`${meta.id}: ${chapters.length} chương, ${entry.chapters.map((c) => c.words).join('/')} từ`);
}
fs.writeFileSync(idxPath, JSON.stringify(idx));
console.log(made.join('\n'));
