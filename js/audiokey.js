/* Khoá của một câu trong kho âm thanh giọng AI: dùng chung cho app và công cụ tạo âm thanh.
   Tiếng Anh không phân biệt hoa thường; khoảng trắng thừa bị bỏ. FNV-1a 32 bit. */

export function norm(lang, text) {
  const t = String(text).replace(/\s+/g, ' ').trim();
  return lang === 'en' ? t.toLowerCase() : t;
}

export function audioKey(lang, text) {
  const s = `${lang}|${norm(lang, text)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
