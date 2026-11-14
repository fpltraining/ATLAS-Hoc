/* Đổi câu tiếng Anh đời thường sang dạng nói rút gọn (I am → I'm, do not → don't…), như người bản xứ nói.
   Chỉ áp cho câu ví dụ, câu làm việc, câu nói theo; KHÔNG đụng phần ngữ pháp, bài thi, truyện, bài viết.
     node tools/contract-en.mjs        (ghi đè các tệp, in số câu đã đổi) */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const W = "(?=\\s+[A-Za-z])";   // phải có từ phía sau (không rút gọn ở cuối câu: "Yes, I am.")
const RULES = [
  [/\bI am\b/g, "I'm", true], [/\b(you|we|they) are\b/gi, "$1're", true],
  [/\b(he|she|it|that|there|what|where|who|how|here) is\b/gi, "$1's", true],
  [/\bdo not\b/gi, "don't"], [/\bdoes not\b/gi, "doesn't"], [/\bdid not\b/gi, "didn't"],
  [/\bis not\b/gi, "isn't"], [/\bare not\b/gi, "aren't"], [/\bwas not\b/gi, "wasn't"], [/\bwere not\b/gi, "weren't"],
  [/\bcan ?not\b/gi, "can't"], [/\bwill not\b/gi, "won't"], [/\bwould not\b/gi, "wouldn't"],
  [/\bshould not\b/gi, "shouldn't"], [/\bcould not\b/gi, "couldn't"], [/\bhave not\b/gi, "haven't"], [/\bhas not\b/gi, "hasn't"],
  [/\b(I|you|we|they|he|she|it) will\b/gi, "$1'll", true], [/\bLet us\b/g, "Let's"], [/\blet us\b/g, "let's"],
];
// từ khoá mà nếu chính là từ đang học thì không rút gọn (giữ nguyên để người học thấy từ)
const KEEP = /\b(am|is|are|not|will|do|does|did|can|cannot|let|us|was|were|have|has|would|should|could)\b/i;
function fixCase(orig, rep) { return /^[A-Z]/.test(orig) ? rep[0].toUpperCase() + rep.slice(1) : rep; }
export function contract(s) {
  let t = s;
  for (const [rx, rep, needNext] of RULES) {
    const r = needNext ? new RegExp(rx.source + W, rx.flags) : rx;
    t = t.replace(r, (m, g1) => fixCase(m, g1 !== undefined && typeof g1 === 'string' ? rep.replace('$1', g1) : rep));
  }
  return t;
}

if (process.argv[1] && process.argv[1].endsWith('contract-en.mjs')) {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const S = (f, o) => fs.writeFileSync(path.join(ROOT, f), JSON.stringify(o));
  let n = 0;
  const ch = (s) => { const t = contract(s); if (t !== s) n++; return t; };
  // kho từ: câu ví dụ (cột 4), trừ khi từ đang học là một trong các từ bị rút gọn
  const bank = J('data/en/bank.json');
  for (const r of bank) if (!KEEP.test(r[0])) r[4] = ch(r[4]);
  S('data/en/bank.json', bank);
  // câu theo chủ đề
  const sen = J('data/en/sentences.json');
  for (const r of sen) r[1] = ch(r[1]);
  S('data/en/sentences.json', sen);
  // tiếng Anh nghề
  const work = J('data/work.json');
  for (const d of work.days) for (const p of d.phrases) p.en = ch(p.en);
  for (const cv of work.convos) for (const l of cv.lines) l.en = ch(l.en);
  for (const k of ['car', 'tiktok', 'patterns']) for (const p of work[k]) p.en = ch(p.en);
  S('data/work.json', work);
  // khoá học: câu nói theo, cụm từ đi kèm, tranh luận (văn nói)
  const c = J('data/en/course.json');
  for (const s of c.shadow) s.v = s.v.map(ch);
  for (const th of c.colloc3 || []) th.v = th.v.map((x) => [ch(x[0])].concat(x.slice(1)));
  for (const d of c.debate3 || []) { d.for = d.for.map((x) => [ch(x[0])].concat(x.slice(1))); d.against = d.against.map((x) => [ch(x[0])].concat(x.slice(1))); }
  S('data/en/course.json', c);
  console.log('Đã đổi', n, 'câu sang dạng nói rút gọn');
}
