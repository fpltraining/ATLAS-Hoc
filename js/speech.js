/* Nghe người học nói và chấm điểm phát âm ở mức "người nghe hiểu được".

   Dùng nhận dạng giọng nói có sẵn của trình duyệt (trên iPad là của Apple, cần mạng).
   Máy so chữ nó nghe được với câu mẫu, nên đây là điểm "nói ra có được hiểu không",
   không phải phân tích âm vị từng âm. Cách chấm cố ý dễ:
     - tiếng Anh: từ sai một chữ cái vẫn tính (máy nghe "ship" thay "sheep" thì không);
     - tiếng Trung: chữ đồng âm tính là đúng, sai thanh điệu không trừ điểm
       (trừ bài luyện thanh điệu, ở đó phải ra đúng chữ);
     - lấy điểm cao nhất trong các cách nghe máy đưa ra. */

import * as data from './data.js';

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
export const canListen = !!SR;

/** Nghe một lần. Trả về Promise<string[]> các cách nghe, hoặc lỗi có .message tiếng Việt. */
export function listen(lang, { onInterim, onStart } = {}) {
  return new Promise((resolve, reject) => {
    if (!SR) { reject(new Error('Trình duyệt này không nghe được giọng nói. Trên iPad hãy mở bằng Safari và bật Siri.')); return; }
    const r = new SR();
    r.lang = lang === 'zh' ? 'zh-CN' : 'en-US';
    r.interimResults = true;
    r.maxAlternatives = 5;
    r.continuous = false;
    let finals = [];
    let done = false;
    r.onstart = () => onStart?.();
    r.onresult = (e) => {
      const res = e.results[e.results.length - 1];
      if (res.isFinal) finals = [...res].map((a) => a.transcript);
      else onInterim?.(res[0].transcript);
    };
    r.onerror = (e) => {
      if (done) return;
      done = true;
      const msg = {
        'not-allowed': 'Chưa cho phép dùng micro. Vào Cài đặt iPad → Safari → Micro, chọn Cho phép.',
        'service-not-allowed': 'Nhận dạng giọng nói đang tắt. Bật Siri trong Cài đặt iPad rồi thử lại.',
        network: 'Cần có mạng để máy nghe được giọng nói.',
        'no-speech': 'Máy chưa nghe thấy gì. Nói to và gần micro hơn nhé.',
        aborted: 'Đã dừng.',
      }[e.error] || 'Máy chưa nghe được. Thử lại nhé.';
      reject(new Error(msg));
    };
    r.onend = () => {
      if (done) return;
      done = true;
      if (finals.length) resolve(finals);
      else reject(new Error('Máy chưa nghe thấy gì. Nói to và gần micro hơn nhé.'));
    };
    try { r.start(); } catch (e) { done = true; reject(new Error('Không mở được micro. Thử lại sau giây lát.')); }
    listen.stop = () => { try { r.stop(); } catch { /* bỏ qua */ } };
  });
}

/* ---------- chuẩn hoá ---------- */

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function enNum(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` ${enNum(n % 100)}` : ''}`;
  if (n < 10000) return `${enNum(Math.floor(n / 1000))} thousand${n % 1000 ? ` ${enNum(n % 1000)}` : ''}`;
  return String(n);
}
const CN_D = '零一二三四五六七八九';
function zhNum(n) {
  if (n < 10) return CN_D[n];
  if (n < 20) return `十${n % 10 ? CN_D[n % 10] : ''}`;
  if (n < 100) return `${CN_D[Math.floor(n / 10)]}十${n % 10 ? CN_D[n % 10] : ''}`;
  if (n < 1000) return `${CN_D[Math.floor(n / 100)]}百${n % 100 ? (n % 100 < 10 ? `零${CN_D[n % 100]}` : zhNum(n % 100).replace(/^十/, '一十')) : ''}`;
  if (n < 10000) {
    const rest = n % 1000;
    return `${CN_D[Math.floor(n / 1000)]}千${rest ? (rest < 100 ? `零${zhNum(rest)}` : zhNum(rest)) : ''}`;
  }
  return String(n);
}

const CONTRACT = { "i'm": 'i am', "you're": 'you are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "we're": 'we are',
  "they're": 'they are', "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', cannot: 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "i'll": 'i will', "i've": 'i have', "that's": 'that is',
  "what's": 'what is', "let's": 'let us', "there's": 'there is', "wasn't": 'was not', "weren't": 'were not' };

export function enWords(s) {
  return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/\d+/g, (d) => ` ${enNum(Number(d))} `)
    .replace(/[^a-z' ]+/g, ' ')
    .split(/\s+/).filter(Boolean)
    .flatMap((w) => (CONTRACT[w] || w.replace(/'s$/, '').replace(/'/g, '')).split(' '));
}

function zhChars(s) {
  return [...String(s).replace(/\d+/g, (d) => zhNum(Number(d)))].filter(data.isHan);
}

const toneless = (py) => String(py || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ü/g, 'v').toLowerCase().split(/[\s,，;；]/)[0];

/* Khoảng cách sửa chữ, dừng sớm khi đã quá max */
function edit(a, b, max = 2) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/* Ghép hai chuỗi theo kiểu dãy con chung dài nhất; trả về mảng đánh dấu khớp cho chuỗi mẫu */
function align(target, heard, same) {
  const n = target.length, m = heard.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i][j] = same(target[i], heard[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
  }
  const hit = new Array(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (same(target[i], heard[j])) { hit[i] = true; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return hit;
}

const enSame = (a, b) => {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 4) return edit(a, b, 1) <= 1;   // sai một chữ cái trong từ dài
  return false;
};

/**
 * Chấm một lần nói. strict = true (bài thanh điệu): tiếng Trung phải ra đúng chữ.
 * Trả về { score 0–100, units: [{ t, ok }], heard }
 */
export function score(lang, target, alternatives, { strict = false } = {}) {
  let best = null;
  for (const heard of alternatives) {
    let units, hit;
    if (lang === 'zh') {
      const t = zhChars(target);
      const hc = zhChars(heard);
      const same = strict ? (a, b) => a === b
        : (a, b) => a === b || (toneless(data.pyOf(a)) && toneless(data.pyOf(a)) === toneless(data.pyOf(b)));
      hit = align(t, hc, same);
      units = t.map((c, k) => ({ t: c, ok: hit[k] }));
    } else {
      const t = enWords(target);
      hit = align(t, enWords(heard), enSame);
      units = t.map((w, k) => ({ t: w, ok: hit[k] }));
    }
    const n = units.length || 1;
    const s = Math.round((units.filter((u) => u.ok).length / n) * 100);
    if (!best || s > best.score) best = { score: s, units, heard };
  }
  return best || { score: 0, units: [], heard: '' };
}

/** Lời nhận xét theo điểm, dễ tính: 70 trở lên là người nghe đã hiểu */
export function verdictSpeak(s) {
  if (s >= 90) return { text: 'Rất rõ', tone: 'jade', sub: 'Người bản xứ nghe hiểu ngay.' };
  if (s >= 70) return { text: 'Nghe hiểu được', tone: 'jade', sub: 'Đủ rõ để hội thoại. Có thể nói lại để tròn hơn.' };
  if (s >= 45) return { text: 'Gần được rồi', tone: '', sub: 'Người nghe hiểu ý chính. Nghe mẫu lại những chữ màu cam.' };
  return { text: 'Thử lại nhé', tone: 'seal', sub: 'Nghe mẫu chậm rồi nói lại từng cụm.' };
}

export { enNum, zhNum };
