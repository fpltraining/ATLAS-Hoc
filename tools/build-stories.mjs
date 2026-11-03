/* Dựng lại bài đọc từ data-src/stories/*.txt vào data/stories/.

     node tools/build-stories.mjs

   Không cần thư mục ../_src: dùng dữ liệu đã có trong data/ (từ lõi tiếng Anh, chỉ mục nét chữ Hán).
   Bài "slow-message" (lấy từ Inklish) giữ nguyên như trong data/stories/.
   merge-data.mjs cũng gọi tệp này, nên hai đường dựng cho cùng một kết quả.

   Định dạng một bài:
     @id, @lang zh (nếu là tiếng Trung), @shelf, @level, @title, @vi, @blurb, @date, @source Tên | url
     ## số | Tên chương | Tên tiếng Việt
     tiếng Anh | tiếng Việt                       (tiếng Trung: chữ Hán | pinyin | tiếng Việt)
     ? Câu hỏi | Câu hỏi tiếng Việt | Đúng* | Sai | Sai
     ~ từ = nghĩa
     ! tiếng Anh | tiếng Việt                     (một dòng của phần "Điều rút ra"; tiếng Trung: chữ Hán | pinyin | tiếng Việt)
     > Gợi ý nói hoặc viết sau khi đọc
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data');
const DIR = path.join(ROOT, 'data-src', 'stories');
const LINE_MAX = 11;
const ZH_MAX = 15;

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const key = (s) => String(s).toLowerCase().replace(/[’]/g, "'").trim();
const wc = (s) => (String(s).trim().match(/\S+/g) || []).length;
const tokens = (s) => (String(s).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []);
const hanzi = (s) => [...String(s)].filter((c) => /[一-鿿]/u.test(c));

/* Bài viết trực tiếp cho người đọc xưng "bạn" thay cho "anh" (giống merge-data.mjs) */
function ban(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/(?<![\p{L}])([Aa])nh(?![\p{L}])/gu, (m, c, at) => {
    const before = s.slice(Math.max(0, at - 8), at).toLowerCase();
    const after = s.slice(at + 3, at + 9);
    if (/(tiếng|học|nước|người) $/u.test(before)) return m;
    if (/^ (Long|ấy|ta)/u.test(after)) return m;
    return c === 'A' ? 'Bạn' : 'bạn';
  });
}

export function parseStories(text, file) {
  const out = [];
  let story = null, ch = null, para = null;
  const flushPara = () => { if (para && para.length) ch.paras.push(para); para = null; };
  const pair = (line, where) => {
    const parts = line.split(' | ').map((x) => x.trim());
    if (story.lang === 'zh') {
      if (parts.length !== 3) throw new Error(`${where}: dòng tiếng Trung phải có đủ chữ Hán, pinyin, nghĩa: ${line}`);
      return [parts[0], parts[2], parts[1]];
    }
    if (parts.length !== 2) throw new Error(`${where}: dòng thiếu nghĩa tiếng Việt: ${line}`);
    const direct = ['true', 'news', 'mystery'].includes(story.shelf);
    return [parts[0], direct ? ban(parts[1]) : parts[1]];
  };
  text.split(/\r?\n/).forEach((raw, ln) => {
    const line = raw.trim();
    const where = `${file}:${ln + 1}`;
    if (!line) { if (ch) flushPara(); return; }
    if (line.startsWith('@')) {
      const sp = line.indexOf(' ');
      const k = line.slice(1, sp), v = line.slice(sp + 1).trim();
      if (k === 'id') { story = { id: v, sources: [], chapters: [] }; ch = null; out.push(story); return; }
      if (k === 'source') { const [name, url] = v.split('|').map((x) => x.trim()); story.sources.push({ name, url }); return; }
      story[k] = v;
      return;
    }
    if (line.startsWith('##')) {
      if (ch) flushPara();
      const [n, title, vi] = line.slice(2).split('|').map((x) => x.trim());
      ch = { n: Number(n), title, vi, paras: [], quiz: [], gloss: {} };
      story.chapters.push(ch);
      return;
    }
    if (line.startsWith('?')) {
      if (ch) flushPara();
      const [q, qVi, ...opts] = line.slice(1).split('|').map((x) => x.trim());
      const a = opts.findIndex((o) => o.endsWith('*'));
      if (a < 0) throw new Error(`${where}: câu hỏi chưa đánh dấu đáp án đúng bằng *`);
      ch.quiz.push({ q, qVi, opts: opts.map((o) => o.replace(/\*$/, '').trim()), a });
      return;
    }
    if (line.startsWith('~')) {
      const i = line.indexOf('=');
      ch.gloss[key(line.slice(1, i))] = line.slice(i + 1).trim();
      return;
    }
    if (line.startsWith('!')) {
      if (ch) flushPara();
      (ch.lesson = ch.lesson || []).push(pair(line.slice(1).trim(), where));
      return;
    }
    if (line.startsWith('>')) { ch.say = ban(line.slice(1).trim()); return; }
    if (!ch) throw new Error(`${where}: dòng nội dung nằm ngoài chương: ${line}`);
    if (!para) para = [];
    para.push(pair(line, where));
  });
  if (ch) flushPara();
  for (const s of out) s.blurb = ban(s.blurb);
  return out;
}

/* Chép phần bổ sung cho chữ Hán trong truyện sang data/ (giống bước cuối của merge-data.mjs):
   data-src/strokes-extra.json -> data/strokes/stories.json + chỉ mục nét
   data-src/zh-extra.txt       -> từ điển chạm tra (zh-dict.json) và âm Hán Việt (hanviet.json) */
function syncZhExtras() {
  const extraStrokes = readJson(path.join(ROOT, 'data-src', 'strokes-extra.json'));
  fs.writeFileSync(path.join(OUT, 'strokes', 'stories.json'), JSON.stringify(extraStrokes));
  const sIdxF = path.join(OUT, 'strokes', 'index.json');
  const sIdx = readJson(sIdxF);
  for (const ch of Object.keys(extraStrokes)) if (!sIdx[ch]) sIdx[ch] = 'stories';
  fs.writeFileSync(sIdxF, JSON.stringify(sIdx));

  const zhExtra = fs.readFileSync(path.join(ROOT, 'data-src', 'zh-extra.txt'), 'utf8')
    .split(/\r?\n/).map((l) => l.split(' | ').map((x) => x.trim())).filter((p) => p.length === 4);
  const dictF = path.join(OUT, 'zh-dict.json');
  const dict = readJson(dictF);
  for (const [w, py, hv, vi] of zhExtra) dict[w] = [py, hv, vi];
  fs.writeFileSync(dictF, JSON.stringify(dict));
  const hvF = path.join(OUT, 'hanviet.json');
  const hv = readJson(hvF);
  for (const [w, py, h] of zhExtra) if ([...w].length === 1 && !hv[w]) hv[w] = { py, hv: h };
  fs.writeFileSync(hvF, JSON.stringify(hv));
}

export function buildStories({ quiet = false } = {}) {
  syncZhExtras();
  const stories = [];
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith('.txt')).sort()) {
    stories.push(...parseStories(fs.readFileSync(path.join(DIR, f), 'utf8'), f));
  }

  const course = readJson(path.join(OUT, 'en', 'course.json'));
  const coreSet = new Set(course.core.flat().map(([w]) => key(w)));
  const strokeIndex = readJson(path.join(OUT, 'strokes', 'index.json'));
  const idxF = path.join(OUT, 'stories', 'index.json');
  const oldIdx = fs.existsSync(idxF) ? readJson(idxF) : [];
  const ours = new Set(stories.map((s) => s.id));
  const kept = oldIdx.filter((s) => !ours.has(s.id)); // slow-message và bài không có trong data-src

  const longLines = [];
  const noStroke = new Set();
  const index = stories.map((s) => {
    const zh = s.lang === 'zh';
    const uniq = new Set();
    let total = 0, inCore = 0;
    const count = (text, c) => {
      if (zh) {
        const cs = hanzi(text);
        if (cs.length > ZH_MAX) longLines.push(`${s.id} ch${c.n} (${cs.length} chữ): ${text}`);
        for (const t of cs) { total++; uniq.add(t); if (!strokeIndex[t]) noStroke.add(t); }
        return cs.length;
      }
      const n = wc(text);
      if (n > LINE_MAX) longLines.push(`${s.id} ch${c.n} (${n} từ): ${text}`);
      const tk = tokens(text);
      for (const t of tk) { total++; uniq.add(t); if (coreSet.has(t)) inCore++; }
      return tk.length;
    };
    const chapters = s.chapters.map((c) => {
      let words = 0, lines = 0;
      for (const p of c.paras) for (const [text, vi] of p) {
        if (!vi) throw new Error(`${s.id}: dòng thiếu nghĩa: ${text}`);
        lines++; words += count(text, c);
      }
      for (const [text] of c.lesson || []) count(text, c);
      return { n: c.n, title: c.title, vi: c.vi, words, lines };
    });
    fs.writeFileSync(path.join(OUT, 'stories', `${s.id}.json`), JSON.stringify(s));
    return {
      id: s.id, lang: zh ? 'zh' : 'en', shelf: s.shelf, level: s.level, title: s.title, vi: s.vi, blurb: s.blurb,
      date: s.date || '', sources: s.sources, chapters, words: total,
      corePct: total ? Math.round((inCore / total) * 100) : 0, uw: [...uniq],
    };
  });

  // Giữ thứ tự cũ: bài cũ theo vị trí cũ, bài mới nối vào cuối
  const byId = new Map([...kept, ...index].map((s) => [s.id, s]));
  const order = [...oldIdx.map((s) => s.id).filter((id) => byId.has(id)), ...index.map((s) => s.id).filter((id) => !oldIdx.some((o) => o.id === id))];
  fs.writeFileSync(idxF, JSON.stringify(order.map((id) => byId.get(id))));

  if (!quiet) {
    console.log('Bài đọc:', index.map((s) => `${s.id} ${s.chapters.length}ch ${s.words}${s.lang === 'zh' ? 'chữ' : 'w'}`).join(' | '));
    console.log('Dòng quá dài:', longLines.length ? `\n  ${longLines.join('\n  ')}` : 0);
    console.log('Chữ Hán chưa có dữ liệu nét:', [...noStroke].join('') || '(không có)');
  }
  return { longLines, noStroke: [...noStroke] };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildStories();
