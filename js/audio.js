/* Giọng đọc có sẵn của iPad (Web Speech API), cả tiếng Trung lẫn tiếng Anh.
   Miễn phí và chạy offline sau khi iOS đã tải giọng về. */

let zhVoice = null;
let enVoice = null;
let ready = false;
let unlocked = false;

function pickVoice() {
  const voices = speechSynthesis.getVoices() || [];
  const zh = voices.filter((v) => /^zh/i.test(v.lang));
  // Ưu tiên giọng phổ thông đại lục (zh-CN) hơn Đài Loan/Hồng Kông
  zhVoice =
    zh.find((v) => /zh[-_]CN/i.test(v.lang) && v.localService) ||
    zh.find((v) => /zh[-_]CN/i.test(v.lang)) ||
    zh.find((v) => v.localService) ||
    zh[0] || null;
  const en = voices.filter((v) => /^en/i.test(v.lang));
  enVoice =
    en.find((v) => /en[-_]US/i.test(v.lang) && /samantha|ava|allison|nicky|aria|jenny/i.test(v.name)) ||
    en.find((v) => /en[-_]US/i.test(v.lang) && v.localService) ||
    en.find((v) => /en[-_]US/i.test(v.lang)) ||
    en[0] || null;
  ready = true;
  return zhVoice;
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
  return zhVoice ? `${zhVoice.name} (${zhVoice.lang})` : '';
}

export function enVoiceName() {
  return enVoice ? `${enVoice.name} (${enVoice.lang})` : '';
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
export const NO_VOICE_HELP =
  'iPad chưa có giọng đọc tiếng Trung. Vào Cài đặt → Trợ năng → Nội dung nói → ' +
  'Giọng nói → Thêm giọng nói… → chọn Tiếng Trung (Trung Quốc đại lục), tải về ' +
  'rồi mở lại app. Giọng tải một lần, sau đó dùng được offline.';
