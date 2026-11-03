/* Chấm bài viết và bài nói bằng AI.

   Tắt sẵn. Chỉ chạy khi người dùng điền địa chỉ hàm "grade" trên Supabase và khoá
   anon của dự án trong Cài đặt. Khoá Claude nằm trên máy chủ, không bao giờ ở trong app.
   Bài chỉ được gửi đi khi người dùng tự bấm nút chấm.
*/

import * as store from './store.js';
import { h } from './ui.js';

export async function aiConfig() {
  const s = await store.settings();
  const url = (s.aiUrl || '').trim();
  const key = (s.aiKey || '').trim();
  return url && key ? { url, key } : null;
}

export async function grade(payload) {
  const cfg = await aiConfig();
  if (!cfg) throw new Error('Chưa bật chấm bằng AI. Vào Cài đặt để điền địa chỉ máy chủ.');
  let res;
  try {
    res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}`, apikey: cfg.key },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Không kết nối được máy chủ chấm bài. Kiểm tra mạng.');
  }
  let data = null;
  try { data = await res.json(); } catch { /* bỏ qua */ }
  if (!res.ok || !data || !data.ok) throw new Error((data && data.error) || `Máy chủ báo lỗi ${res.status}.`);
  return data.result;
}

/* Khung nhận xét */
export function feedbackCard(r) {
  return h('div.card.stack',
    h('div.row', { style: { gap: '10px', alignItems: 'baseline' } },
      h('div.score-big', `${r.score}/10`),
      h('div', h('b', `Trình độ thể hiện: ${r.band}`), h('div.small.faint', 'AI chấm, chỉ để tham khảo')),
    ),
    h('p', r.summary),
    r.strengths && r.strengths.length
      ? h('div', h('h4', 'Làm tốt'), h('ul', ...r.strengths.map((x) => h('li', x)))) : null,
    r.fixes && r.fixes.length
      ? h('div', h('h4', 'Cần sửa'), ...r.fixes.map((f) => h('div', { style: { margin: '8px 0' } },
        h('div', h('s.faint', f.wrong), ' → ', h('b', f.right)),
        h('div.small.muted', f.why))))
      : null,
    r.better ? h('div', h('h4', 'Bản sửa gợi ý'), h('p', { style: { whiteSpace: 'pre-wrap' } }, r.better)) : null,
    r.tip ? h('div.note', h('b', 'Luyện tiếp: '), r.tip) : null,
  );
}

/* Nút "Chấm bằng AI" kèm chỗ hiện kết quả. getPayload trả về payload hoặc chuỗi lỗi. */
export function gradeButton(getPayload, onResult) {
  const out = h('div');
  const btn = h('button.btn.block', {
    onclick: async () => {
      const p = getPayload();
      if (typeof p === 'string') { out.replaceChildren(h('p.small.muted', p)); return; }
      if (!(await aiConfig())) {
        out.replaceChildren(h('p.small.muted', 'Chấm bằng AI đang tắt. Bật trong Cài đặt (bánh răng) → mục "Chấm bài bằng AI".'));
        return;
      }
      btn.disabled = true;
      btn.textContent = 'Đang chấm…';
      out.replaceChildren();
      try {
        const r = await grade(p);
        out.replaceChildren(feedbackCard(r));
        if (onResult) await onResult(r);
      } catch (e) {
        out.replaceChildren(h('p.small.muted', e.message));
      } finally {
        btn.disabled = false;
        btn.textContent = '✦ Chấm bằng AI';
      }
    },
  }, '✦ Chấm bằng AI');
  return h('div.stack', btn, out);
}
