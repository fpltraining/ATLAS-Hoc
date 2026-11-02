/* Tiếng bút chạy trên giấy.
 *
 * Viết trên kính iPad không có tiếng, mà tai thiếu phản hồi thì tay cũng thấy
 * hụt — cảm giác viết "thật" một phần nằm ở tiếng sồn sột của ngòi bút.
 *
 * Âm thanh được TỔNG HỢP tại chỗ bằng Web Audio, không tải file nào: giữ app
 * nhẹ và chạy được offline. Cách làm: một vòng lặp tạp âm trắng đã lọc, biên độ
 * bám theo tốc độ và lực nhấn của ngòi bút. Viết nhanh và nhấn mạnh thì tiếng
 * to và đục hơn, di nhẹ thì gần như im.
 */

let ctx = null;
let noise = null;      // nguồn tạp âm chạy liên tục
let bandpass = null;
let gain = null;
let sanSang = false;

/** Tạo tạp âm trắng dài 2 giây rồi cho lặp — rẻ hơn nhiều so với sinh từng mẫu. */
function taoBoDemTapAm(ac) {
  const len = Math.floor(ac.sampleRate * 2);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/**
 * Dựng chuỗi xử lý âm thanh. Phải gọi TRONG một thao tác chạm của người dùng —
 * iOS chặn mọi âm thanh khởi tạo ngoài cử chỉ người dùng.
 */
export function initSound() {
  if (sanSang) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    ctx = new AC();
    noise = ctx.createBufferSource();
    noise.buffer = taoBoDemTapAm(ctx);
    noise.loop = true;

    // Dải quanh 2 kHz nghe giống ngòi bút cọ giấy; để rộng cho khỏi ù một nốt.
    bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2000;
    bandpass.Q.value = 0.7;

    gain = ctx.createGain();
    gain.gain.value = 0;          // im cho tới khi đặt bút

    noise.connect(bandpass).connect(gain).connect(ctx.destination);
    noise.start();
    sanSang = true;
    return true;
  } catch {
    sanSang = false;
    return false;
  }
}

/** Đặt bút xuống: mở tiếng rất nhanh để nghe khớp với lúc chạm. */
export function batDau() {
  if (!sanSang) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
}

/**
 * Cập nhật tiếng theo nét đang viết.
 * @param {number} tocDo  pixel mỗi mili-giây
 * @param {number} luc    lực nhấn 0…1 (bằng 0 nếu viết bằng ngón tay)
 */
export function capNhat(tocDo, luc) {
  if (!sanSang) return;
  const t = ctx.currentTime;

  // Tốc độ quyết định phần lớn: bút đứng yên thì gần như không có tiếng.
  const theoTocDo = Math.min(1, tocDo / 1.6);
  const theoLuc = 0.45 + 0.55 * (luc || 0.4);
  const muc = Math.min(0.055, 0.055 * theoTocDo * theoLuc);

  // setTargetAtTime cho biên độ đổi mượt, tránh tiếng lách tách khi giật cấp.
  gain.gain.setTargetAtTime(muc, t, 0.02);
  // Nhấn mạnh nghe trầm và dày hơn, giống ngòi tì sát mặt giấy.
  bandpass.frequency.setTargetAtTime(2600 - 900 * (luc || 0.4), t, 0.05);
}

/** Nhấc bút: tắt dần cho hết tiếng, không cắt phựt. */
export function ketThuc() {
  if (!sanSang) return;
  gain.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
}

export function dungHan() {
  if (!sanSang) return;
  try { gain.gain.value = 0; ctx.suspend(); } catch { /* bỏ qua */ }
}
