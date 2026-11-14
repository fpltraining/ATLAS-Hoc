/* Báo lỗi nội dung của màn hình đang xem: ghi chú kèm đường dẫn màn hình và giờ Việt Nam.
   Lưu trong máy (kv 'reports'); xem, sao chép hoặc xoá ở Cài đặt → Báo lỗi đã ghi. */
import * as store from './store.js';
import { h, sheet, closeSheet, toast } from './ui.js';

/** Giờ Việt Nam (UTC+7) dạng 14/11/2026 09:05 */
export function vnTime(t = Date.now()) {
  const d = new Date(t + 7 * 3600 * 1000);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`;
}

export function openReport() {
  const where = location.hash || '#/home';
  const title = document.getElementById('topbar-title')?.textContent || '';
  const kinds = ['Sai nội dung', 'Sai âm thanh', 'Lỗi hiển thị', 'Góp ý'];
  let kind = kinds[0];
  const seg = h('div.seg', ...kinds.map((k, i) => h('button' + (i ? '' : '.on'), {
    onclick: (e) => { kind = k; [...seg.children].forEach((b) => b.classList.toggle('on', b === e.currentTarget)); },
  }, k)));
  const box = h('textarea.scribble.long', { placeholder: 'Ví dụ: chữ 行 ở câu 3 đọc sai thanh; câu tiếng Việt dịch chưa đúng…' });
  sheet(
    h('h2', '⚑ Báo lỗi màn hình này'),
    h('div.small.faint', `${title} · ${where}`),
    seg,
    box,
    h('div.btn-row', { style: { marginTop: '12px' } },
      h('button.btn.jade', {
        onclick: async () => {
          const text = box.value.trim();
          if (!text) { toast('Viết vài chữ mô tả lỗi đã nhé.'); return; }
          await store.kvUpdate('reports', [], (r) => [{ at: Date.now(), when: vnTime(), where, title, kind, text }, ...r].slice(0, 200));
          closeSheet();
          toast('Đã ghi lại. Xem ở Cài đặt → Báo lỗi đã ghi.');
        },
      }, 'Ghi lại'),
      h('button.btn.ghost', { 'data-close': '' }, 'Đóng'),
    ),
  );
  setTimeout(() => box.focus(), 200);
}

/** Khối trong Cài đặt: danh sách báo lỗi, sao chép để gửi, xoá */
export async function reportsBlock() {
  const list = await store.kvGet('reports', []);
  const asText = () => list.map((r) => `[${r.when}] ${r.kind} · ${r.title} (${r.where})\n${r.text}`).join('\n\n');
  return h('div',
    h('h4', 'Báo lỗi đã ghi'),
    list.length
      ? h('div.small', ...list.slice(0, 5).map((r) => h('div', { style: { padding: '4px 0', borderBottom: '1px solid var(--line)' } }, h('b', `${r.when} · ${r.kind}`), ` ${r.title}: ${r.text}`)))
      : h('div.small.faint', 'Chưa có. Bấm ⚑ trên thanh đầu ở bất kỳ màn hình nào để ghi lỗi.'),
    list.length ? h('div.btn-row', { style: { marginTop: '8px' } },
      h('button.btn.sm', {
        onclick: async () => {
          try { await navigator.clipboard.writeText(asText()); toast(`Đã sao chép ${list.length} báo lỗi. Dán gửi cho người sửa app.`); } catch { toast('Máy không cho sao chép tự động.'); }
        },
      }, `Sao chép ${list.length} báo lỗi`),
      h('button.btn.sm.ghost', { onclick: async () => { if (confirm('Xoá hết báo lỗi đã ghi?')) { await store.kvSet('reports', []); toast('Đã xoá.'); closeSheet(); } } }, 'Xoá hết'),
    ) : null,
  );
}
