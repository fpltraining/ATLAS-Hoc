/* Gom dữ liệu của 5 app cũ và các bài đọc mới về thư mục data/.

   Chạy trong thư mục atlas:
     node tools/merge-data.mjs ../_src

   Kết quả ghi đè data/, không đụng tới tiến độ học (tiến độ nằm trên iPad). */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { applyAll as applyPatches } from './apply-patches.mjs';
import { buildStories } from './build-stories.mjs';

const SRC = path.resolve(process.argv[2] || '../_src');
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'data');
const rd = (p) => fs.readFileSync(path.join(SRC, p), 'utf8');
const save = (p, v) => {
  const f = path.join(OUT, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(v));
  return fs.statSync(f).size;
};

/* Quy tắc đọc song ngữ: mỗi dòng tiếng Anh chỉ dài tới mức mắt theo kịp,
   nghĩa tiếng Việt nằm ngay dưới. Dài hơn số từ này thì phải cắt tiếp. */
const LINE_MAX = 11;

/* ---------- đọc literal trong mã nguồn cũ ------------------------------- */

function sliceLiteral(src, from) {
  let i = from, depth = 0, q = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '[' || c === '{') depth++;
    else if (c === ']' || c === '}') { depth--; if (!depth) return src.slice(from, i + 1); }
  }
  throw new Error('literal not closed');
}

function literal(src, name, ctx = {}) {
  const m = new RegExp(`\\b${name}\\s*=\\s*(?=[\\[{])`).exec(src);
  if (!m) throw new Error(`Không thấy ${name}`);
  const v = vm.runInNewContext(`(${sliceLiteral(src, m.index + m[0].length)})`, ctx);
  return JSON.parse(JSON.stringify(v));
}

/* ---------- canh dòng Anh–Việt ------------------------------------------ */

const wc = (s) => (String(s).trim().match(/\S+/g) || []).length;

function splitSentences(text) {
  return String(text)
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?…]["”’)]?)\s+(?=["“‘(]?[A-ZÀ-Ỹ0-9])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* Quy hoạch động kiểu Gale–Church: ghép câu theo tỉ lệ độ dài. */
function alignDP(a, b) {
  const la = a.map((s) => s.length), lb = b.map((s) => s.length);
  const ratio = (lb.reduce((x, y) => x + y, 0) || 1) / (la.reduce((x, y) => x + y, 0) || 1);
  const cost = (x, y) => Math.abs(x * ratio - y) / (x * ratio + y + 1);
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  const from = Array.from({ length: n + 1 }, () => Array(m + 1).fill(null));
  dp[0][0] = 0;
  const moves = [[1, 1, 0], [1, 2, 0.12], [2, 1, 0.12], [2, 2, 0.2], [1, 3, 0.3], [3, 1, 0.3]];
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      if (dp[i][j] === Infinity) continue;
      for (const [di, dj, pen] of moves) {
        if (i + di > n || j + dj > m) continue;
        const x = la.slice(i, i + di).reduce((p, q) => p + q, 0);
        const y = lb.slice(j, j + dj).reduce((p, q) => p + q, 0);
        const c = dp[i][j] + cost(x, y) + pen;
        if (c < dp[i + di][j + dj]) { dp[i + di][j + dj] = c; from[i + di][j + dj] = [i, j]; }
      }
    }
  }
  if (dp[n][m] === Infinity) return null;
  const out = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const [pi, pj] = from[i][j];
    out.unshift([a.slice(pi, i).join(' '), b.slice(pj, j).join(' ')]);
    i = pi; j = pj;
  }
  return out;
}

const CLAUSE_EN = /(?<=[,;:—–])\s+/u;
const CLAUSE_VI = /(?<=[,;:—–])\s+/u;
const CONJ_EN = /\s+(?=(?:and|but|because|when|while|which|that|who|so|if|before|after|until|though|although|as)\s)/;
const CONJ_VI = /\s+(?=(?:và|nhưng|vì|bởi vì|khi|trong khi|mà|nên|nếu|trước khi|sau khi|cho đến khi|dù|rồi|để)\s)/u;

function tryClauses(en, vi, reEn, reVi) {
  const a = en.split(reEn).filter(Boolean);
  const b = vi.split(reVi).filter(Boolean);
  if (a.length < 2 || b.length < 2) return null;
  const al = alignDP(a, b);
  if (!al || al.length < 2) return null;
  // Mảnh quá ngắn (một từ) thường là canh sai
  if (al.some(([x, y]) => wc(x) < 2 || wc(y) < 2)) return null;
  return al;
}

/* Khi không còn dấu câu để bám: cắt tiếng Anh trước một từ nối hoặc giới từ gần
   giữa câu, rồi cắt tiếng Việt ở vị trí tương ứng theo tỉ lệ. Hai vế không khớp
   từng chữ nhưng vẫn cùng một ý, và mắt không phải chờ cả câu dài mới thấy nghĩa. */
const BREAK_EN = new Set('and but or that which who whose when while because if so as than to in on at for with from of by into over under after before until about through without between against instead rather since where once'.split(' '));
const BREAK_VI = new Set('và nhưng hoặc rằng mà khi vì nếu nên như hơn để trong ở tại cho với từ của bởi vào trên dưới sau trước đến về qua giữa rồi là thì thay đang đã sẽ không chỉ mới cũng luôn vẫn lại những các mọi mỗi'.split(' '));

function splitAtRatio(words, ratio, marks) {
  let best = -1, bestScore = Infinity;
  for (let i = 2; i <= words.length - 2; i++) {
    const w = words[i].toLowerCase().replace(/[^\p{L}]/gu, '');
    const prev = words[i - 1];
    const isMark = marks.has(w) || /[,;:—–]$/.test(prev);
    const score = Math.abs(i / words.length - ratio) + (isMark ? 0 : 0.3);
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}

function forceSplit(en, vi) {
  const a = en.split(/\s+/), b = vi.split(/\s+/);
  if (a.length < 6 || b.length < 4) return null;
  const i = splitAtRatio(a, 0.5, BREAK_EN);
  if (i < 0) return null;
  const j = splitAtRatio(b, i / a.length, BREAK_VI);
  if (j < 0) return null;
  return [[a.slice(0, i).join(' '), b.slice(0, j).join(' ')], [a.slice(i).join(' '), b.slice(j).join(' ')]];
}

function breakLong(pair, depth = 0) {
  const [en, vi] = pair;
  if (wc(en) <= LINE_MAX || depth > 4) return [pair];
  const al = tryClauses(en, vi, CLAUSE_EN, CLAUSE_VI) || tryClauses(en, vi, CONJ_EN, CONJ_VI) || forceSplit(en, vi);
  if (!al) return [pair];
  return al.flatMap((p) => breakLong(p, depth + 1));
}

/** Canh hai đoạn văn thành các dòng [en, vi] ngắn. */
export function toLines(enPara, viPara) {
  const a = splitSentences(enPara), b = splitSentences(viPara);
  const al = alignDP(a, b) || [[enPara, viPara]];
  return al.flatMap((p) => breakLong(p));
}

/* App dành cho mọi người nên lời nhắn người học dùng "bạn". Nguồn cũ của ATLAS và
   các câu hỏi gợi ý viết "anh"; đổi ở đây, chừa "tiếng Anh", "nhà khoa học Anh"
   và nhân vật "anh Long" trong truyện. */
function ban(s) {
  if (typeof s !== 'string') return s;
  return s.replace(/(?<![\p{L}])([Aa])nh(?![\p{L}])/gu, (m, c, at) => {
    const before = s.slice(Math.max(0, at - 8), at).toLowerCase();
    const after = s.slice(at + 3, at + 9);
    if (/(tiếng|học|nước|người|bảng|nhà) $/u.test(before)) return m;
    if (/^ (Long|ấy|ta)/u.test(after)) return m;
    return c === 'A' ? 'Bạn' : 'bạn';
  });
}

const stat = { lines: 0, long: 0, max: 0 };
function track(lines) {
  for (const [en] of lines) {
    const n = wc(en);
    stat.lines++;
    if (n > LINE_MAX) stat.long++;
    stat.max = Math.max(stat.max, n);
  }
  return lines;
}

/* ---------- nguồn ------------------------------------------------------- */

const ink = rd('sites/inklish/index.html');
const atlas = rd('ATLAS/index.html');
const hub = rd('sites/hub/index.html');
const snHtml = rd('sites/songngu/index.html');
const snData = rd('sites/songngu/data-all.js');

const D = literal(ink, 'D');

if (process.argv[3] === '--sa') {
  for (const c of D.sa.chapters) {
    console.log(`## ${c.n} | ${c.title} | ${c.vi}`);
    console.log(c.en.join('\n'));
  }
  process.exit(0);
}

/* ---------- 1. Khoá tiếng Anh (Inklish) ---------------------------------- */

const CO = (s) => s.trim().split('|').map((x) => x.trim()).filter(Boolean).map((x) => {
  const i = x.indexOf('=');
  return [x.slice(0, i).trim(), x.slice(i + 1).trim()];
});
const course = {
  stages: literal(ink, 'STAGES'),
  blocks: literal(ink, 'BLOCKS'),
  ph0: D.ph0, ph: D.ph,
  sounds: D.sounds, core: D.core, gram: D.gram, phr: D.phr,
  weeks: D.weeks, sent: D.sent, gist: D.gist,
  irreg: literal(ink, 'IRREG'),
  gramB2: literal(ink, 'GRAM_B2'),
  gramC1: literal(ink, 'GRAM_C1'),
  colloc: literal(ink, 'COLLOC', { CO }),
  shadow: literal(ink, 'SHADOW'),
  writeTasks: literal(ink, 'WRITE_TASKS'),
  speakTasks: literal(ink, 'SPEAK_TASKS'),
  a1sent: D.sa.chapters.flatMap((c) => c.en),
};
const BOOK = literal(ink, 'BOOK');

/* ---------- 2. Kho từ tiếng Anh gộp -------------------------------------- */

const key = (s) => String(s).toLowerCase().replace(/[’]/g, "'").trim();
const bank = new Map();
function addWord(w, f) {
  const k = key(w);
  if (!k) return;
  const cur = bank.get(k) || { w, src: [] };
  for (const [a, b] of Object.entries(f)) if (b && !cur[a]) cur[a] = b;
  if (f.from && !cur.src.includes(f.from)) cur.src.push(f.from);
  delete cur.from;
  bank.set(k, cur);
}

const atlasWords = literal(atlas, 'WORD_BANK_RAW');
const atlasSent = literal(atlas, 'SENTENCE_BANK_RAW');
for (const r of atlasWords) {
  addWord(r[1], { ipa: r[2], pos: r[3], vi: r[4], ex: r[5], exVi: r[6], topic: r[7], lv: r[8], from: 'atlas' });
}

const V = vm.runInNewContext(`${snData};VOCAB`);
for (const t of V.en) {
  for (const w of t.words) {
    addWord(w.word, { ipa: w.phonetic, vi: w.meaningVi, ex: w.example, exVi: w.exampleVi, lv: t.level, from: 'songngu' });
  }
}
course.core.forEach((sess, i) => {
  for (const [w, vi] of sess) addWord(w, { vi, lv: 1, from: 'core', sess: i + 1 });
});
course.weeks.forEach((wk) => {
  for (const [w, vi] of wk.words) addWord(w, { vi, lv: 2, from: 'week', week: wk.n });
});

const bankRows = [...bank.values()].map((b) => [b.w, b.ipa || '', b.pos || '', b.vi || '', b.ex || '', b.exVi || '', b.topic || '', b.lv || 2]);

/* Từ điển tra nhanh khi chạm vào một từ trong lúc đọc */
const dict = {};
for (const b of bank.values()) dict[key(b.w)] = [b.vi || '', b.ipa || ''];
for (const s of course.phr) for (const [w, vi] of s) if (!dict[key(w)]) dict[key(w)] = [vi, ''];
for (const c of course.colloc) for (const [w, vi] of c.v) if (!dict[key(w)]) dict[key(w)] = [vi, ''];
for (const g of course.irreg) {
  for (const v of g.v) for (const form of v.slice(0, 3)) {
    for (const f of String(form).split('/')) if (!dict[key(f)]) dict[key(f)] = [v[3], ''];
  }
}

/* ---------- 3. Chủ đề song ngữ (Song Ngữ) -------------------------------- */

const topics = [];
const byName = new Map();
for (const lang of ['en', 'zh']) {
  for (const t of V[lang]) {
    const name = t.topic || t.name || t.title;
    let e = byName.get(name);
    if (!e) { e = { name, lv: t.level || 1, en: [], zh: [] }; byName.set(name, e); topics.push(e); }
    for (const w of t.words) e[lang].push([w.word, w.phonetic || '', w.meaningVi || '', w.example || '', w.exampleVi || '']);
  }
}
const refSections = literal(snHtml, 'REF_SECTIONS');

/* ---------- 4. Tiếng Anh nghề (Han's English Hub) ------------------------ */

const newStart = hub.indexOf('function renderNew');
const work = {
  days: literal(hub, 'DAYS'),
  convos: literal(hub, 'CONVOS'),
  car: literal(hub, 'CAR_PHRASES'),
  tiktok: literal(hub, 'TT_PHRASES'),
  aov: literal(hub, 'AOV_SECS'),
  currency: literal(hub, 'CUR_DATA'),
  patterns: literal(hub.slice(newStart), 'ph'),
};

/* ---------- 5. Kiến thức (ATLAS) ----------------------------------------- */

const make = (id, domain, title, summary, paragraphs, simple, example, task, question, options, correct, explanation) =>
  ({ id, domain, title, summary, paragraphs, simple, example, task, question, options, correct, explanation });
const mk = (title, summary, paragraphs, simple, example, task, question, options, explanation, vocab) =>
  ({ title, summary, paragraphs, simple, example, task, question, options, explanation, vocab });
const lessons = literal(atlas, 'lessons', { make });
const caseStudies = literal(atlas, 'caseStudies');
const lessonsEN = literal(atlas, 'lessonsEN', { mk });

function knowLesson(l) {
  const en = lessonsEN[l.id] || {
    title: l.title_en, summary: l.summary_en, paragraphs: l.paragraphs_en, simple: l.simple_en, example: l.example_en,
    task: l.task_en, question: l.question_en, options: l.options_en, explanation: l.explanation_en, vocab: l.vocab || [],
  };
  const paras = (l.paragraphs || []).map((p, i) => track(toLines((en.paragraphs || [])[i] || '', ban(p))));
  return {
    id: l.id, domain: l.domain, title: l.title, titleEn: en.title, summary: ban(l.summary), paras,
    simple: ban(l.simple), example: ban(l.example), task: ban(l.task), source: l.sourceNote || '',
    q: { vi: ban(l.question), en: en.question, opts: (l.options || []).map(ban), optsEn: en.options, a: l.correct, why: ban(l.explanation) },
    vocab: en.vocab || [],
  };
}
const order = ['money-1', 'thinking-1', 'money-2', 'money-3'];
const rest = lessons.filter((l) => !order.includes(l.id)).map((l) => l.id);
const know = {
  domains: literal(atlas, 'domains'),
  order: [...order, ...rest, ...caseStudies.map((c) => c.id)],
  lessons: [...lessons, ...caseStudies].map(knowLesson),
  specializations: literal(atlas, 'specializations'),
  pathStages: literal(atlas, 'PATH_STAGES'),
  freePrompts: literal(atlas, 'FREE_PROMPTS'),
  topics: literal(atlas, 'TOPICS'),
};

/* ---------- 6. Bài đọc ---------------------------------------------------- */

function parseStories(text, file) {
  const out = [];
  let story = null, ch = null, para = null;
  const flushPara = () => { if (para && para.length) ch.paras.push(para); para = null; };
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
      const parts = line.slice(1).split('|').map((x) => x.trim());
      const [q, qVi, ...opts] = parts;
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
    if (line.startsWith('>')) { ch.say = ban(line.slice(1).trim()); return; }
    const parts = line.split(' | ').map((x) => x.trim());
    if (!para) para = [];
    if (story.lang === 'zh') {
      // Tiếng Trung: chữ Hán | pinyin | nghĩa Việt
      if (parts.length !== 3) throw new Error(`${where}: dòng tiếng Trung phải có đủ chữ Hán, pinyin, nghĩa: ${line}`);
      para.push([parts[0], parts[2], parts[1]]);
    } else {
      if (parts.length !== 2) throw new Error(`${where}: dòng thiếu nghĩa tiếng Việt: ${line}`);
      // Chỉ bài viết trực tiếp cho người đọc mới đổi xưng hô; lời trong truyện giữ nguyên
      const direct = ['true', 'news', 'mystery'].includes(story.shelf);
      para.push([parts[0], direct ? ban(parts[1]) : parts[1]]);
    }
  });
  if (ch) flushPara();
  for (const s of out) s.blurb = ban(s.blurb);
  return out;
}

const stories = [];
const storyDir = path.join(ROOT, 'data-src', 'stories');
for (const f of fs.readdirSync(storyDir).filter((x) => x.endsWith('.txt')).sort()) {
  stories.push(...parseStories(fs.readFileSync(path.join(storyDir, f), 'utf8'), f));
}

// "The Slow Message" của Inklish: canh lại từng cụm từ bản dịch theo đoạn
const sb = D.sb;
stories.push({
  id: 'slow-message', lang: 'en', shelf: 'long', level: 'B1', title: sb.title, vi: sb.vi, blurb: sb.blurb, sources: [],
  chapters: sb.chapters.map((c) => ({
    n: c.n, title: c.title, vi: c.vi, quiz: [], gloss: {}, say: `Tóm tắt chương này bằng 1–2 câu tiếng Anh. Gợi nhớ: ${D.gist[c.n] || ''}`,
    paras: c.text.map((t, i) => toLines(t, (D.svi[c.n] || [])[i] || '')),
  })),
});

const tokens = (s) => (String(s).toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) || []);
const hanzi = (s) => [...String(s)].filter((c) => /[一-鿿]/u.test(c));
const coreSet = new Set(course.core.flat().map(([w]) => key(w)));

/* Chữ Hán trong truyện có dữ liệu nét để viết bằng bút không */
const strokeIndex = JSON.parse(rd('ButHan/data/strokes/index.json'));
const hskChars = new Map();
const zhIdx = JSON.parse(rd('ButHan/data/curriculum/index.json'));
for (const l of zhIdx.lessons) {
  for (const ch of hanzi(JSON.parse(rd(`ButHan/data/curriculum/${l.file}`)).words.map((w) => w.w).join(''))) {
    if (!hskChars.has(ch)) hskChars.set(ch, l.level);
  }
}
const noStroke = new Set();
const zhLevels = {};

const longLines = [];
const index = stories.map((s) => {
  const zh = s.lang === 'zh';
  const uniq = new Set();
  let total = 0, inCore = 0;
  const chapters = s.chapters.map((c) => {
    let words = 0, lines = 0;
    for (const p of c.paras) {
      for (const [text, vi] of p) {
        if (!vi) throw new Error(`${s.id}: dòng thiếu nghĩa: ${text}`);
        lines++;
        if (zh) {
          const cs = hanzi(text);
          if (cs.length > 15) longLines.push(`${s.id} ch${c.n} (${cs.length} chữ): ${text}`);
          for (const t of cs) {
            words++; total++; uniq.add(t);
            if (!strokeIndex[t]) noStroke.add(t);
            const lv = hskChars.get(t) || 'ngoài';
            zhLevels[s.id] = zhLevels[s.id] || {};
            zhLevels[s.id][lv] = (zhLevels[s.id][lv] || 0) + 1;
          }
        } else {
          const n = wc(text);
          if (n > LINE_MAX) longLines.push(`${s.id} ch${c.n} (${n} từ): ${text}`);
          for (const t of tokens(text)) { words++; total++; uniq.add(t); if (coreSet.has(t)) inCore++; }
        }
      }
    }
    return { n: c.n, title: c.title, vi: c.vi, words, lines };
  });
  save(`stories/${s.id}.json`, s);
  return {
    id: s.id, lang: zh ? 'zh' : 'en', shelf: s.shelf, level: s.level, title: s.title, vi: s.vi, blurb: s.blurb,
    date: s.date || '', sources: s.sources, chapters, words: total,
    corePct: total ? Math.round((inCore / total) * 100) : 0, uw: [...uniq],
  };
});
console.log('Chữ Hán trong truyện chưa có dữ liệu nét:', [...noStroke].join('') || '(không có)');
console.log('Phân bố chữ theo cấp HSK:', JSON.stringify(zhLevels));

/* Từ điển tiếng Trung để chạm tra khi đọc */
const zhDict = {};
for (const l of zhIdx.lessons) {
  for (const w of JSON.parse(rd(`ButHan/data/curriculum/${l.file}`)).words) zhDict[w.w] = [w.py, w.hv, w.vi];
}
for (const t of topics) {
  for (const [w, py, vi] of t.zh) if (!zhDict[w]) zhDict[w] = [py, '', vi];
}
/* Từ trong truyện nhưng ngoài giáo trình HSK */
const zhExtra = fs.readFileSync(path.join(ROOT, 'data-src', 'zh-extra.txt'), 'utf8')
  .split(/\r?\n/).map((l) => l.split(' | ').map((x) => x.trim())).filter((p) => p.length === 4);
for (const [w, py, hv, vi] of zhExtra) zhDict[w] = [py, hv, vi];
const charVi = JSON.parse(rd('ButHan/data/char-vi.json'));
for (const [ch, v] of Object.entries(charVi)) {
  if (!zhDict[ch]) zhDict[ch] = ['', '', typeof v === 'string' ? v : v.vi || ''];
}

/* ---------- ghi ra --------------------------------------------------------- */

const sizes = {
  'en/course.json': save('en/course.json', course),
  'en/bank.json': save('en/bank.json', bankRows),
  'en/dict.json': save('en/dict.json', dict),
  'en/sentences.json': save('en/sentences.json', atlasSent),
  'en/book.json': save('en/book.json', BOOK),
  'topics.json': save('topics.json', { topics, ref: refSections }),
  'work.json': save('work.json', work),
  'know.json': save('know.json', know),
  'stories/index.json': save('stories/index.json', index),
  'zh-dict.json': save('zh-dict.json', zhDict),
};

/* Tiếng Trung giữ nguyên dữ liệu của Bút Hán */
for (const f of ['curriculum', 'strokes']) {
  fs.cpSync(path.join(SRC, 'ButHan/data', f), path.join(OUT, f), { recursive: true });
}
for (const f of ['radicals.json', 'hanviet.json', 'decomp.json', 'char-vi.json']) {
  fs.copyFileSync(path.join(SRC, 'ButHan/data', f), path.join(OUT, f));
}

/* Chữ Hán trong truyện chưa có trong giáo trình: thêm dữ liệu nét và âm Hán Việt để viết được bằng bút */
const extraStrokes = JSON.parse(fs.readFileSync(path.join(ROOT, 'data-src', 'strokes-extra.json'), 'utf8'));
fs.writeFileSync(path.join(OUT, 'strokes', 'stories.json'), JSON.stringify(extraStrokes));
const strokeIdxOut = JSON.parse(fs.readFileSync(path.join(OUT, 'strokes', 'index.json'), 'utf8'));
for (const ch of Object.keys(extraStrokes)) strokeIdxOut[ch] = 'stories';
fs.writeFileSync(path.join(OUT, 'strokes', 'index.json'), JSON.stringify(strokeIdxOut));
const hvOut = JSON.parse(fs.readFileSync(path.join(OUT, 'hanviet.json'), 'utf8'));
for (const [w, py, hv] of zhExtra) if ([...w].length === 1 && !hvOut[w]) hvOut[w] = { py, hv };
fs.writeFileSync(path.join(OUT, 'hanviet.json'), JSON.stringify(hvOut));

console.log(sizes);
console.log('Kho từ tiếng Anh:', bankRows.length, '· chủ đề:', topics.length, '· câu nghề:', work.days.length, 'ngày');
console.log('Bài kiến thức:', know.lessons.length, '· dòng:', stat.lines, '· dòng dài:', stat.long, '· dài nhất:', stat.max);
console.log('Bài đọc:', index.map((s) => `${s.id}[${s.level}] ${s.words}w core${s.corePct}%`).join(' | '));
console.log(`Dòng vượt ${LINE_MAX} từ trong bài đọc:`, longLines.length);
if (process.argv.includes('--long')) console.log(longLines.join('\n'));
const perStory = {};
for (const l of longLines) { const k = l.split(' ')[0]; perStory[k] = (perStory[k] || 0) + 1; }
console.log(perStory);

/* Dựng lại bài đọc bằng cùng công cụ với tools/build-stories.mjs (hỗ trợ phần "Điều rút ra"),
   rồi áp các bản sửa trong data-src/patches/ (lỗi Hán Việt, phiên âm, từ bổ sung) */
buildStories({ quiet: true });
applyPatches();
