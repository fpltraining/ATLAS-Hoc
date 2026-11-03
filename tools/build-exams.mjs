/* Sinh đề thi thử HSK 1–4 (chuẩn 2025) từ chính câu và từ trong giáo trình.

     node tools/build-exams.mjs

   Mỗi câu hỏi lấy từ câu ví dụ, câu ngữ pháp và câu luyện của các bài cùng cấp hoặc thấp hơn,
   nên chỉ dùng từ người học đã gặp và đáp án luôn đúng. Phương án sai được tạo có kiểm soát:
   - nghe chọn câu: thay đúng một từ bằng từ khác cùng độ dài, cùng từ loại;
   - điền từ: phương án sai khác từ loại với đáp án, để không có hai đáp án cùng hợp lý.
   Dùng hạt giống cố định nên chạy lại cho ra cùng một bộ đề.

   Ghi ra data/exams/index.json và data/exams/<id>.json.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CUR = path.join(ROOT, 'data', 'curriculum');
const OUT = path.join(ROOT, 'data', 'exams');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const isHan = (c) => /[一-鿿]/u.test(c);
const hanOnly = (s) => [...s].filter(isHan).join('');

/* Số ngẫu nhiên có hạt giống: cùng hạt giống, cùng đề */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const shuffle = (r, arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};

/* Cấu trúc đề theo cấp: số câu từng dạng, thời gian (phút) */
const PLAN = {
  1: { minutes: 25, sections: [['Nghe', { listenWord: 8, listenMean: 7 }], ['Đọc', { fill: 8, readMean: 7 }]] },
  2: { minutes: 35, sections: [['Nghe', { listenPick: 10, listenMean: 10 }], ['Đọc', { fill: 10, readMean: 10 }]] },
  3: { minutes: 50, sections: [['Nghe', { listenPick: 10, listenMean: 10 }], ['Đọc', { fill: 10, readMean: 10 }], ['Viết', { order: 10 }]] },
  4: { minutes: 60, sections: [['Nghe', { listenPick: 12, listenMean: 13 }], ['Đọc', { fill: 13, readMean: 12 }], ['Viết', { order: 10 }]] },
};
const TESTS_PER_LEVEL = 2;
const LEN = { 1: [3, 14], 2: [4, 16], 3: [5, 20], 4: [6, 22] };

export function buildExams({ quiet = false } = {}) {
  const idx = readJson(path.join(CUR, 'index.json'));
  const lv25 = readJson(path.join(ROOT, 'data', 'hsk2025.json'));
  const lvNum = (w) => { const v = lv25[w] || lv25[w.replace(/儿$/, '')]; return v ? (v === '7-9' ? 7 : Number(v)) : null; };

  // Từ và câu theo cấp bài (cấp nhóm 2025 của bài)
  const words = [];      // { w, py, vi, pos, lv }
  const sentences = [];  // { cn, py, vi, lv }
  const seenCn = new Set();
  for (const l of idx.lessons) {
    const L = readJson(path.join(CUR, l.file));
    const addS = (s) => {
      if (!s?.cn || !s.py || !s.vi || seenCn.has(s.cn)) return;
      if (/[A-Za-z0-9０-９]/.test(s.cn) || s.cn.includes('·') || s.cn.includes('=') || s.cn.includes('…')) return;
      seenCn.add(s.cn);
      sentences.push({ cn: s.cn, py: s.py, vi: s.vi, lv: l.level });
    };
    for (const w of L.words) {
      words.push({ w: w.w, py: w.py, vi: w.vi, pos: w.pos, lv: lvNum(w.w) || l.level });
      (w.ex || []).forEach(addS);
    }
    for (const g of L.grammar || []) (g.ex || []).forEach(addS);
    (L.sentences || []).forEach(addS);
  }

  // Tách từ: so khớp dài nhất theo từ vựng trong giáo trình
  const dict = new Set([...words.map((w) => w.w), ...Object.keys(readJson(path.join(ROOT, 'data', 'zh-dict.json'))).filter((w) => [...w].length > 1)]);
  const tokenize = (s) => {
    const out = [];
    let i = 0;
    const chars = [...s];
    while (i < chars.length) {
      if (!isHan(chars[i])) { out.push(chars[i]); i++; continue; }
      let len = Math.min(4, chars.length - i);
      while (len > 1 && !dict.has(chars.slice(i, i + len).join(''))) len--;
      out.push(chars.slice(i, i + len).join(''));
      i += len;
    }
    return out;
  };
  const byWord = new Map(words.map((w) => [w.w, w]));
  // Hư từ một chữ được phép đứng riêng khi cắt câu thành mảnh
  const FUNC = new Set([...'的了着过吗呢吧很也都不没在是和把被给对从到就才还又再一个们地得这那有我你他她它要会能想去来上下里']);
  const known = (tk) => !isHan(tk[0]) || dict.has(tk) || FUNC.has(tk);

  /* Cắt câu thành 4 mảnh ở những chỗ tự nhiên. Chỗ cắt xấu: giữa hai chữ đơn dính liền
     (每|天, 看|看, 了|一), giữa số và lượng từ. Thử mọi cách, chọn cách không có chỗ xấu
     và các mảnh dài đều nhau nhất; không có thì trả null để bỏ câu đó. */
  const zhDict = readJson(path.join(ROOT, 'data', 'zh-dict.json'));
  const FREE = new Set([...'我你他她它很也都不没在是就才还又再把被给对从到和跟要会能想请别']);
  const NUM = new Set([...'一二两三四五六七八九十百千几半每这那哪']);
  const MEASURE = new Set([...'个件本张只条位次天年块双杯瓶碗家辆层岁分点']);
  const badCut = (a, b) => {
    const la = [...a], lb = [...b];
    if (NUM.has(la[la.length - 1]) && MEASURE.has(lb[0])) return true;
    if (la.length === 1 && lb.length === 1) {
      if (a === b || zhDict[a + b]) return true;
      if (!FREE.has(a) && !FREE.has(b)) return true;
    }
    if (a === '了' || b === '的' || b === '了' || b === '得' || b === '着' || b === '过') return true;
    return false;
  };
  const splitChunks = (toks) => {
    const n = toks.length;
    let best = null;
    for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
      const cuts = [i, j, k];
      if (cuts.some((c) => badCut(toks[c - 1], toks[c]))) continue;
      const parts = [toks.slice(0, i), toks.slice(i, j), toks.slice(j, k), toks.slice(k)].map((p) => p.join(''));
      if (new Set(parts).size < 4) continue;
      const lens = parts.map((p) => [...p].length);
      const spread = Math.max(...lens) - Math.min(...lens);
      if (!best || spread < best.spread) best = { parts, spread };
    }
    return best && best.spread <= 4 ? best.parts : null;
  };
  const allCn = new Set(sentences.map((s) => s.cn));

  fs.mkdirSync(OUT, { recursive: true });
  const index = [];

  for (const level of [1, 2, 3, 4]) {
    const plan = PLAN[level];
    const [minLen, maxLen] = LEN[level];
    const pool = sentences.filter((s) => s.lv <= level && hanOnly(s.cn).length >= minLen && hanOnly(s.cn).length <= maxLen);
    const fresh = pool.filter((s) => s.lv === level);
    const wordsUpTo = words.filter((w) => w.lv <= level);
    const wordsAt = words.filter((w) => w.lv === level);
    const used = new Set();

    for (let t = 1; t <= TESTS_PER_LEVEL; t++) {
      const r = rng(level * 1000 + t * 17);
      const take = (pred) => {
        // Ưu tiên câu của đúng cấp, rồi mới tới câu cấp dưới
        for (const src of [shuffle(r, fresh), shuffle(r, pool)]) {
          for (const s of src) if (!used.has(s.cn) && pred(s)) { used.add(s.cn); return s; }
        }
        return null;
      };
      const otherVi = (s, n) => shuffle(r, pool.filter((x) => x.cn !== s.cn && x.vi !== s.vi && Math.abs(hanOnly(x.cn).length - hanOnly(s.cn).length) <= 6))
        .slice(0, n).map((x) => x.vi);

      const makers = {
        listenWord() {
          const cands = shuffle(r, wordsAt.filter((w) => !used.has(`w:${w.w}`)));
          for (const w of cands) {
            const others = shuffle(r, wordsUpTo.filter((o) => o.w !== w.w && [...o.w].length === [...w.w].length)).slice(0, 3);
            if (others.length < 3) continue;
            used.add(`w:${w.w}`);
            const opts = shuffle(r, [w, ...others]);
            return { t: 'listenWord', audio: w.w, opts: opts.map((o) => o.w), a: opts.indexOf(w), py: w.py, vi: w.vi };
          }
          return null;
        },
        listenMean() {
          const s = take(() => true);
          if (!s) return null;
          const wrong = otherVi(s, 2);
          if (wrong.length < 2) return null;
          const opts = shuffle(r, [s.vi, ...wrong]);
          return { t: 'listenMean', audio: s.cn, opts, a: opts.indexOf(s.vi), cn: s.cn, py: s.py };
        },
        listenPick() {
          for (let tries = 0; tries < 40; tries++) {
            const s = take((x) => tokenize(x.cn).some((tk) => byWord.has(tk)));
            if (!s) return null;
            const toks = tokenize(s.cn);
            const slots = shuffle(r, toks.map((tk, i) => i).filter((i) => byWord.has(toks[i]) && toks[i].length >= 1));
            const variants = new Set();
            for (const i of slots) {
              const src = byWord.get(toks[i]);
              const subs = shuffle(r, wordsUpTo.filter((o) => o.w !== src.w && o.pos === src.pos && [...o.w].length === [...src.w].length));
              for (const o of subs) {
                const v = toks.map((tk, k) => (k === i ? o.w : tk)).join('');
                if (v !== s.cn && !allCn.has(v)) { variants.add(v); break; }
              }
              if (variants.size >= 2) break;
            }
            if (variants.size < 2) { used.delete(s.cn); continue; }
            const opts = shuffle(r, [s.cn, ...variants]);
            return { t: 'listenPick', audio: s.cn, opts, a: opts.indexOf(s.cn), py: s.py, vi: s.vi };
          }
          return null;
        },
        fill() {
          for (let tries = 0; tries < 60; tries++) {
            const s = take((x) => tokenize(x.cn).some((tk) => byWord.get(tk)?.lv === level || (level === 1 && byWord.has(tk))));
            if (!s) return null;
            const toks = tokenize(s.cn);
            const slots = shuffle(r, toks.map((tk, i) => i).filter((i) => {
              const w = byWord.get(toks[i]);
              return w && (w.lv === level || level === 1) && toks.filter((x) => x === toks[i]).length === 1;
            }));
            if (!slots.length) { used.delete(s.cn); continue; }
            const i = slots[0];
            const ans = byWord.get(toks[i]);
            const others = shuffle(r, wordsUpTo.filter((o) => o.pos !== ans.pos && o.w !== ans.w && !s.cn.includes(o.w)
              && Math.abs([...o.w].length - [...ans.w].length) <= 1)).slice(0, 3);
            if (others.length < 3) { used.delete(s.cn); continue; }
            const opts = shuffle(r, [ans, ...others]);
            const q = toks.map((tk, k) => (k === i ? '（　　）' : tk)).join('');
            return { t: 'fill', q, opts: opts.map((o) => o.w), a: opts.indexOf(ans), cn: s.cn, py: s.py, vi: s.vi };
          }
          return null;
        },
        readMean() {
          const s = take(() => true);
          if (!s) return null;
          const wrong = otherVi(s, 2);
          if (wrong.length < 2) return null;
          const opts = shuffle(r, [s.vi, ...wrong]);
          return { t: 'readMean', q: s.cn, opts, a: opts.indexOf(s.vi), py: s.py };
        },
        order() {
          for (let tries = 0; tries < 60; tries++) {
            const s = take((x) => {
              const body = x.cn.replace(/[。！？]$/u, '');
              return !/[，、：；“”！？。]/u.test(body) && hanOnly(body).length >= 6 && hanOnly(body).length <= 14;
            });
            if (!s) return null;
            const end = (s.cn.match(/[。！？]$/u) || ['。'])[0];
            const toks = tokenize(s.cn.replace(/[。！？]$/u, ''));
            if (toks.length < 4 || !toks.every(known)) { used.delete(s.cn); continue; }
            const chunks = splitChunks(toks);
            if (!chunks) { used.delete(s.cn); continue; }
            if (chunks.some((c) => !c) || new Set(chunks).size < 4) { used.delete(s.cn); continue; }
            let shown = shuffle(r, chunks);
            if (shown.join('') === chunks.join('')) shown = [shown[1], shown[0], ...shown.slice(2)];
            return { t: 'order', chunks: shown, answer: chunks, end, cn: s.cn, py: s.py, vi: s.vi };
          }
          return null;
        },
      };

      const sections = plan.sections.map(([name, counts]) => {
        const items = [];
        for (const [type, n] of Object.entries(counts)) {
          for (let k = 0; k < n; k++) {
            const it = makers[type]();
            if (!it) throw new Error(`HSK${level} đề ${t}: không đủ dữ liệu cho dạng ${type}`);
            items.push(it);
          }
        }
        return { name, items };
      });
      const id = `hsk${level}-${t}`;
      const total = sections.reduce((s, x) => s + x.items.length, 0);
      fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify({ id, level, title: `HSK ${level} · Đề ${t}`, minutes: plan.minutes, sections }));
      index.push({ id, level, title: `HSK ${level} · Đề ${t}`, minutes: plan.minutes, questions: total, sections: sections.map((s) => [s.name, s.items.length]) });
    }
  }
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index));
  if (!quiet) console.log('Đề thi thử:', index.map((e) => `${e.id} (${e.questions} câu)`).join(' · '));
  return index;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) buildExams();
