/* Giọng đọc có sẵn của iPad (Web Speech API), cả tiếng Trung lẫn tiếng Anh.
   Miễn phí và chạy offline sau khi iOS đã tải giọng về. */

let zhVoice = null;
let enVoice = null;
let ready = false;
let unlocked = false;

let wantEn = '';   // tên giọng người dùng chọn trong Cài đặt, rỗng là tự chọn
let wantZh = '';

/* Điểm cho giọng: giọng Premium/Enhanced (bản tải về của iOS) nghe tự nhiên hơn hẳn bản Compact */
/* Safari trên iPad thường chỉ ghi loại giọng trong voiceURI
   (com.apple.voice.premium.en-US.Ava), tên chỉ là "Ava", nên xét cả hai */
const idOf = (v) => `${v.name} ${v.voiceURI || ''}`;

export function tierOf(v) {
  const s = idOf(v);
  if (/premium|cao cấp/i.test(s)) return 'Cao cấp';
  if (/enhanced|nâng cao/i.test(s)) return 'Nâng cao';
  if (/compact/i.test(s)) return 'Rút gọn';
  return '';
}

function quality(v) {
  let q = 0;
  const s = idOf(v);
  const tier = tierOf(v);
  if (tier === 'Cao cấp') q += 30;
  if (tier === 'Nâng cao') q += 20;
  if (/siri/i.test(s)) q += 15;
  if (tier === 'Rút gọn' || /eloquence|novelty/i.test(s)) q -= 30;
  if (/^(bad news|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|albert|fred|junior|ralph|kathy|bahh)\b/i.test(v.name)) q -= 100;
  if (v.localService) q += 2;
  return q;
}

const best = (list, bonus) => list.slice().sort((a, b) => (quality(b) + bonus(b)) - (quality(a) + bonus(a)))[0] || null;

export const label = (v) => `${v.name}${tierOf(v) ? ` (${tierOf(v)})` : ''} · ${v.lang}`;

export function voiceList(lang) {
  const re = lang === 'en' ? /^en/i : /^zh/i;
  return (speechSynthesis.getVoices() || []).filter((v) => re.test(v.lang) && quality(v) > -50)
    .sort((a, b) => quality(b) - quality(a) || a.name.localeCompare(b.name));
}

function pickVoice() {
  const voices = speechSynthesis.getVoices() || [];
  const zh = voices.filter((v) => /^zh/i.test(v.lang));
  const en = voices.filter((v) => /^en/i.test(v.lang));
  // Tiếng Trung: ưu tiên giọng phổ thông đại lục (zh-CN) hơn Đài Loan/Hồng Kông
  zhVoice = zh.find((v) => wantZh && (v.voiceURI === wantZh || v.name === wantZh)) ||
    best(zh, (v) => (/zh[-_]CN/i.test(v.lang) ? 50 : 0));
  // Tiếng Anh: ưu tiên giọng Mỹ
  enVoice = en.find((v) => wantEn && (v.voiceURI === wantEn || v.name === wantEn)) ||
    best(en, (v) => (/en[-_]US/i.test(v.lang) ? 50 : 0) + (/samantha|ava|allison|nicky|aria|jenny|zoe|evan|nathan/i.test(v.name) ? 5 : 0));
  ready = true;
  return zhVoice;
}

/* Đặt giọng theo tên đã lưu trong Cài đặt */
export function setVoices({ en, zh } = {}) {
  if (en !== undefined) wantEn = en || '';
  if (zh !== undefined) wantZh = zh || '';
  if ('speechSynthesis' in window) pickVoice();
}

export function initVoices() {
  if (!('speechSynthesis' in window)) return;
  pickVoice();
  speechSynthesis.addEventListener('voiceschanged', pickVoice);
  // Safari đôi khi trả danh sách rỗng ở lần gọi đầu
  setTimeout(pickVoice, 400);
  setTimeout(pickVoice, 1500);
}

export function hasVoice() {
  if (!ready) pickVoice();
  return !!zhVoice;
}

export function hasEnVoice() {
  if (!ready) pickVoice();
  return !!enVoice;
}

export function voiceName() {
  return zhVoice ? label(zhVoice) : '';
}

export function enVoiceName() {
  return enVoice ? label(enVoice) : '';
}

/**
 * iOS chỉ cho phép phát âm sau một thao tác chạm đầu tiên của người dùng.
 * Gọi hàm này trong sự kiện chạm để "mở khoá" âm thanh cho cả phiên.
 */
export function unlock() {
  if (unlocked || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    speechSynthesis.speak(u);
    unlocked = true;
  } catch { /* bỏ qua */ }
}

/** Đọc một chuỗi. lang 'zh' mặc định; rate 1 = bình thường, 0.6 = chậm để tập nghe. */
export function speak(text, { rate = 0.85, onEnd, lang = 'zh' } = {}) {
  if (!('speechSynthesis' in window) || !text) return false;
  if (!ready) pickVoice();
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = lang === 'en' ? enVoice : zhVoice;
    if (voice) u.voice = voice;
    u.lang = voice?.lang || (lang === 'en' ? 'en-US' : 'zh-CN');
    u.rate = Math.max(0.35, Math.min(1.4, rate));
    u.pitch = 1;
    if (onEnd) { u.onend = onEnd; u.onerror = onEnd; }
    speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stop() {
  try { speechSynthesis.cancel(); } catch { /* bỏ qua */ }
}

/** Hướng dẫn hiện cho người dùng khi iPad chưa có giọng tiếng Trung. */
export const BETTER_VOICE_HELP =
  'Giọng nghe máy móc là do máy đang dùng bản rút gọn. Để có giọng tự nhiên hơn: vào Cài đặt của iPad → ' +
  'Trợ năng → Nội dung nói → Giọng nói → chọn ngôn ngữ (Tiếng Anh hoặc Tiếng Trung) → tải giọng có chữ ' +
  '"Nâng cao" hoặc "Cao cấp" (ví dụ Ava, Zoe, Evan cho tiếng Anh; Lilian, Tingting cho tiếng Trung). ' +
  'Tải xong đóng hẳn app rồi mở lại, chọn giọng mới ở đây.';

export const NO_VOICE_HELP =
  'iPad chưa có giọng đọc tiếng Trung. Vào Cài đặt → Trợ năng → Nội dung nói → ' +
  'Giọng nói → Thêm giọng nói… → chọn Tiếng Trung (Trung Quốc đại lục), tải về ' +
  'rồi mở lại app. Giọng tải một lần, sau đó dùng được offline.';
