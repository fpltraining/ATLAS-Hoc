/* Bảng cài đặt, mở từ nút bánh răng trên góc phải. */

import * as store from '../store.js';
import * as audio from '../audio.js';
import { STRICTNESS } from '../pen/grade.js';
import { sayEn } from '../kit.js';
import { applyTheme } from '../app.js';
import { h, toast, closeSheet } from '../ui.js';

export async function renderSettings() {
  const s = await store.settings();

  const set = async (k, v) => {
    await store.setSetting(k, v);
    if (k === 'theme') applyTheme(v);
    toast('Đã lưu.', 1400);
  };

  const seg = (key, options, current) => {
    const wrap = h('div.mode-seg', { style: { minWidth: '190px' } });
    for (const [val, label] of options) {
      wrap.append(h('button', {
        class: val === current ? 'on' : '',
        onclick: (e) => {
          for (const b of wrap.children) b.classList.remove('on');
          e.currentTarget.classList.add('on');
          set(key, val);
        },
      }, label));
    }
    return wrap;
  };

  const toggle = (key, current) => h('label.switch',
    h('input', { type: 'checkbox', checked: current, onchange: (e) => set(key, e.target.checked) }),
    h('i'),
  );

  const row = (title, sub, control) => h('div.setting',
    h('div.grow', h('b', title), sub ? h('div.small.faint', sub) : null),
    control,
  );

  const rate = (key, label) => h('div.setting',
    h('div.grow',
      h('b', label),
      h('div.small.faint', `Hiện tại ${s[key].toFixed(2)}× — người mới nên để 0,7–0,9×.`),
      h('input.range', {
        type: 'range', min: '0.5', max: '1.2', step: '0.05', value: String(s[key]),
        oninput: (e) => {
          e.target.previousElementSibling.textContent = `Hiện tại ${Number(e.target.value).toFixed(2)}× — người mới nên để 0,7–0,9×.`;
        },
        onchange: (e) => store.setSetting(key, Number(e.target.value)),
      }),
    ),
  );

  return h('div',
    h('h2', 'Cài đặt'),

    row('Mỗi ngày học bao lâu', 'Chia việc trên trang Hôm nay và đặt hạn mức từ mới.',
      seg('dailyMinutes', [[30, '30′'], [60, '1 giờ'], [90, '90′'], [120, '2 giờ']], s.dailyMinutes)),
    row('Bạn muốn học', 'Trang Hôm nay chỉ xếp việc của ngôn ngữ đã chọn.',
      seg('langs', [['both', 'Cả hai'], ['en', 'Tiếng Anh'], ['zh', 'Tiếng Trung']], s.langs || 'both')),
    row('Tiếng Anh nghề mỗi ngày', 'Câu về bán hàng, huấn luyện, TikTok.', toggle('workOn', s.workOn !== false)),
    row('Nhịp tuần', 'Thứ Bảy không thêm từ mới, Chủ nhật chỉ ôn và đọc nhẹ.', toggle('weekRhythm', s.weekRhythm)),
    row('Giao diện', null, seg('theme', [['auto', 'Theo máy'], ['light', 'Sáng'], ['dark', 'Tối']], s.theme || 'auto')),

    h('h4', 'Viết bằng Apple Pencil'),
    row('Chỉ nhận Apple Pencil', 'Bật lên thì ngón tay không vẽ được, chống tì tay tuyệt đối.', toggle('penOnly', s.penOnly)),
    row('Tiếng bút khi viết', 'Tiếng sồn sột nhẹ theo nét bút.', toggle('penSound', s.penSound)),
    row('Độ khắt khe khi chấm nét chữ Hán', 'Mới học nên để "Dễ", quen tay rồi hãy tăng lên.',
      seg('strictness', Object.entries(STRICTNESS).map(([k, v]) => [k, v.label]), s.strictness)),
    row('Kiểu ngòi bút chữ Hán', 'Bút lông đổi độ dày theo lực nhấn.', seg('brush', [['but-chi', 'Bút chì'], ['but-long', 'Bút lông']], s.brush)),
    row('Ô kẻ tập viết chữ Hán', '田 chia tư · 米 thêm đường chéo.', seg('grid', [['tian', '田'], ['mi', '米'], ['none', 'Trơn']], s.grid)),

    h('h4', 'Giọng đọc'),
    rate('enRate', 'Tốc độ giọng tiếng Anh'),
    row('Giọng tiếng Anh', audio.hasEnVoice() ? `Đang dùng: ${audio.enVoiceName()}` : 'Chưa có giọng tiếng Anh trên máy này.',
      h('button.btn.sm', { onclick: () => sayEn('Hello, nice to meet you.') }, 'Thử')),
    rate('speechRate', 'Tốc độ giọng tiếng Trung'),
    row('Giọng tiếng Trung', audio.hasVoice() ? `Đang dùng: ${audio.voiceName()}` : 'CHƯA CÓ giọng tiếng Trung trên máy này.',
      h('button.btn.sm', { onclick: () => audio.speak('你好，很高兴认识你。', { rate: s.speechRate }) }, 'Thử')),
    !audio.hasVoice() ? h('div.note.seal', { style: { marginTop: '10px' } }, audio.NO_VOICE_HELP) : null,

    h('hr.divider'),
    aiBlock(s, set),
    h('hr.divider'),
    offlineBlock(),
    h('hr.divider'),

    h('div.small.faint',
      h('p', h('b', 'ATLAS'), ': học tiếng Anh và tiếng Trung, đọc truyện song ngữ, viết bằng Apple Pencil. Chạy hoàn toàn trên máy bạn.'),
      h('p', 'Dữ liệu nét viết: hanzi-writer-data. Cấu tạo chữ: Make Me a Hanzi. Cả hai theo Arphic Public License. Âm Hán Việt: Unihan Database của Unicode.'),
      h('p', 'Không quảng cáo, không tài khoản. Dữ liệu học nằm trên máy bạn; chỉ khi bạn bật Chấm bài bằng AI và tự bấm chấm thì bài đó mới được gửi tới máy chủ bạn đã điền.'),
    ),

    h('div.btn-row', { style: { marginTop: '14px' } },
      h('a.btn.sm', { href: '#/stats', onclick: () => setTimeout(closeSheet, 30) }, 'Sao lưu dữ liệu'),
      h('button.btn.sm.ghost', { 'data-close': '' }, 'Đóng'),
    ),
  );
}

/* Chấm bài viết và bài nói bằng AI: tắt cho tới khi điền đủ địa chỉ hàm và khoá anon */
function aiBlock(s, set) {
  const field = (key, ph, type = 'text') => h('input.scribble', {
    type, placeholder: ph, value: s[key] || '', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
    style: { width: '100%', marginTop: '6px' },
    onchange: (e) => set(key, e.target.value.trim()),
  });
  return h('div',
    h('h4', 'Chấm bài bằng AI'),
    h('p.small.faint', 'Tắt sẵn. Điền địa chỉ hàm "grade" trên Supabase và khoá anon của dự án để bật nút "Chấm bằng AI" ở mục Viết và Nói lại của tiếng Anh. Khoá Claude nằm trên máy chủ, không nằm trong app. Cách cài xem README.'),
    field('aiUrl', 'https://<dự-án>.supabase.co/functions/v1/grade', 'url'),
    field('aiKey', 'Khoá anon (public) của dự án Supabase', 'password'),
  );
}

/* Bao nhiêu phần nội dung đã nằm sẵn trong máy, để biết khi nào yên tâm tắt mạng. */
function offlineBlock() {
  const line = h('p.small.faint', 'Đang kiểm tra…');
  const btn = h('button.btn.sm.ghost', {
    onclick: async () => {
      const reg = await navigator.serviceWorker?.ready.catch(() => null);
      if (!reg?.active) return toast('Chưa bật được chế độ offline trên trình duyệt này.');
      reg.active.postMessage('fill-offline');
      toast('Đang tải phần còn thiếu…');
      setTimeout(refresh, 4000);
    },
  }, 'Tải nốt');

  async function refresh() {
    try {
      const idx = await fetch('data/curriculum/index.json').then((r) => r.json());
      const strokes = await fetch('data/strokes/index.json').then((r) => r.json());
      const stories = await fetch('data/stories/index.json').then((r) => r.json());
      const total = idx.lessons.length + new Set(Object.values(strokes)).size + stories.length;
      const keys = await caches.keys();
      const rt = keys.find((k) => k.endsWith('-runtime'));
      const have = rt ? (await (await caches.open(rt)).keys())
        .filter((r) => /\/data\/(curriculum\/lesson-|strokes\/|stories\/)/.test(r.url) && !/index\.json/.test(r.url)).length : 0;
      line.textContent = have >= total
        ? `Đã lưu đủ ${total} tệp nội dung, học được cả khi không có mạng.`
        : `Mới lưu ${have}/${total} tệp nội dung. Cứ mở app khi có mạng, nó tự tải tiếp.`;
      btn.hidden = have >= total;
    } catch {
      line.textContent = 'Chưa đọc được tình trạng lưu trữ.';
    }
  }
  refresh();

  return h('div', h('h4', 'Dùng khi không có mạng'), line, btn);
}
