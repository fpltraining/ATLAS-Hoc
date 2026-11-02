/* Pinyin và thanh điệu — phần phải học TRƯỚC khi động vào chữ Hán.

   Giải thích luôn quy chiếu sang tiếng Việt, vì người Việt vốn đã quen với
   ngôn ngữ có thanh điệu — đây là lợi thế mà người nói tiếng Anh không có.
*/

import * as store from '../store.js';
import * as audio from '../audio.js';
import { h, section, toast } from '../ui.js';

const TONES = [
  { n: 1, mark: 'mā', cn: '妈', vi: 'mẹ', shape: '˥ ˥', desc: 'Cao và PHẲNG, kéo đều như đang ngân một nốt nhạc.',
    tip: 'Tiếng Việt không có thanh nào phẳng cao như vậy. Gần nhất là giọng bạn khi hát nốt "la" và giữ nguyên.' },
  { n: 2, mark: 'má', cn: '麻', vi: 'cây gai', shape: '˧ ˥', desc: 'Đi LÊN, từ giữa vút lên cao.',
    tip: 'Rất giống DẤU SẮC tiếng Việt: "má", "cá". Đây là thanh dễ nhất với người Việt.' },
  { n: 3, mark: 'mǎ', cn: '马', vi: 'con ngựa', shape: '˨ ˩ ˦', desc: 'XUỐNG thấp rồi mới lên. Trong câu thường chỉ xuống thấp là đủ.',
    tip: 'Gần với DẤU HỎI tiếng Việt: "mả", "hỏi". Đừng cố lên cao ở cuối khi nói nhanh.' },
  { n: 4, mark: 'mà', cn: '骂', vi: 'mắng', shape: '˥ ˩', desc: 'Đổ DỐC dứt khoát từ cao xuống thấp.',
    tip: 'Giống lúc bạn quát "Này!" hoặc nói dấu NẶNG mạnh: "mạ". Phải dứt khoát, đừng kéo dài.' },
  { n: 0, mark: 'ma', cn: '吗', vi: '(trợ từ hỏi)', shape: '·', desc: 'KHINH THANH — đọc nhẹ, ngắn, không có cao độ riêng.',
    tip: 'Xuất hiện ở chữ thứ hai của 妈妈, 谢谢, 名字. Đọc lướt qua như không có dấu.' },
];

const INITIALS = [
  { g: 'Môi', items: [['b', '爸'], ['p', '怕'], ['m', '妈'], ['f', '饭']] },
  { g: 'Đầu lưỡi', items: [['d', '大'], ['t', '他'], ['n', '你'], ['l', '来']] },
  { g: 'Gốc lưỡi', items: [['g', '狗'], ['k', '看'], ['h', '好']] },
  { g: 'Mặt lưỡi', items: [['j', '叫'], ['q', '去'], ['x', '写']] },
  { g: 'Uốn lưỡi', items: [['zh', '中'], ['ch', '吃'], ['sh', '是'], ['r', '热']] },
  { g: 'Đầu lưỡi phẳng', items: [['z', '坐'], ['c', '菜'], ['s', '三']] },
  { g: 'Bán nguyên âm', items: [['y', '也'], ['w', '我']] },
];

const FINALS = [
  { g: 'Đơn', items: [['a', '啊'], ['o', '哦'], ['e', '饿'], ['i', '一'], ['u', '五'], ['ü', '女']] },
  { g: 'Kép', items: [['ai', '爱'], ['ei', '给'], ['ao', '好'], ['ou', '有'], ['er', '二']] },
  { g: 'Có -n', items: [['an', '安'], ['en', '很'], ['in', '新'], ['un', '问'], ['ün', '云']] },
  { g: 'Có -ng', items: [['ang', '上'], ['eng', '冷'], ['ing', '听'], ['ong', '中']] },
  { g: 'Bắt đầu i-', items: [['ia', '家'], ['ie', '姐'], ['iao', '叫'], ['iu', '六'], ['ian', '天'], ['iang', '想']] },
  { g: 'Bắt đầu u-', items: [['ua', '花'], ['uo', '我'], ['uai', '快'], ['ui', '水'], ['uan', '关'], ['uang', '王']] },
  { g: 'Bắt đầu ü-', items: [['üe', '月'], ['üan', '元']] },
];

const RULES = [
  {
    t: 'Hai thanh 3 đứng cạnh nhau → chữ đầu đọc thành thanh 2',
    d: 'Đây là quy tắc quan trọng nhất. 你好 viết là nǐ hǎo nhưng ĐỌC là ní hǎo. ' +
       'Lý do đơn giản: hai thanh trầm liên tiếp rất khó phát âm. Chữ viết KHÔNG đổi, chỉ cách đọc đổi.',
    ex: [['你好', 'nǐ hǎo → ní hǎo', 'xin chào'], ['很好', 'hěn hǎo → hén hǎo', 'rất tốt'], ['我想', 'wǒ xiǎng → wó xiǎng', 'tôi muốn']],
  },
  {
    t: 'Biến điệu của 不 bù',
    d: '不 vốn là thanh 4. Khi đứng TRƯỚC một chữ thanh 4 khác, nó đổi thành thanh 2 (bú). ' +
       'Trước thanh 1, 2, 3 thì giữ nguyên bù.',
    ex: [['不是', 'bú shì', 'không phải (是 thanh 4 → bú)'], ['不好', 'bù hǎo', 'không tốt (好 thanh 3 → giữ bù)'], ['不吃', 'bù chī', 'không ăn']],
  },
  {
    t: 'Biến điệu của 一 yī',
    d: 'Đứng một mình hoặc khi đếm số thì đọc yī. Trước thanh 1, 2, 3 đọc yì. Trước thanh 4 đọc yí.',
    ex: [['一、二、三', 'yī, èr, sān', 'đếm số → giữ yī'], ['一天', 'yì tiān', 'một ngày'], ['一个', 'yí ge', 'một cái']],
  },
  {
    t: 'ü mất hai chấm sau j, q, x, y',
    d: 'Viết ju, qu, xu, yu nhưng vẫn ĐỌC là jü, qü, xü, yü. Vì j/q/x/y không bao giờ ghép với u thật, ' +
       'nên không sợ nhầm. Riêng sau n và l thì hai chấm phải giữ: nǚ (女), lǜ (绿).',
    ex: [['去', 'qù (đọc "chuy")', 'đi'], ['女', 'nǚ', 'nữ — giữ hai chấm'], ['学', 'xué', 'học']],
  },
  {
    t: 'zh ch sh r — âm uốn lưỡi mà tiếng Việt không có',
    d: 'Cong đầu lưỡi lên chạm vòm miệng rồi mới bật hơi. Người Việt hay đọc thành "tr", "ch", "s", "r" ' +
       'của tiếng Việt — nghe ra ngay là người nước ngoài. Hãy tập trước gương: đầu lưỡi phải CUỘN LÊN.',
    ex: [['中国', 'Zhōngguó', 'Trung Quốc'], ['吃饭', 'chīfàn', 'ăn cơm'], ['是', 'shì', 'là'], ['热', 'rè', 'nóng']],
  },
];

export async function render() {
  const settings = await store.settings();
  const say = (cn) => {
    if (!audio.speak(cn, { rate: settings.speechRate })) toast('Trình duyệt không đọc được.');
    else if (!audio.hasVoice()) toast(audio.NO_VOICE_HELP, 7000);
  };

  const el = h('div.stack');

  el.append(h('div.card',
    h('h1', 'Pinyin & thanh điệu'),
    h('p.muted.small', { style: { marginTop: '6px' } },
      'Pinyin là cách ghi âm tiếng Trung bằng chữ Latin. Học chắc phần này trước, ',
      'vì sai thanh điệu là người nghe hiểu sang nghĩa khác hẳn.'),
    !audio.hasVoice() ? h('div.note.seal', { style: { marginTop: '10px' } }, audio.NO_VOICE_HELP) : null,
  ));

  /* ---- 5 thanh ---- */
  const toneGrid = h('div.tone-grid');
  for (const t of TONES) {
    toneGrid.append(h('div.card.tone-card.card-tap', { onclick: () => say(t.cn) },
      h('div.small.faint', t.n ? `Thanh ${t.n}` : 'Khinh thanh'),
      h('div.tone-mark', t.mark),
      h('div.tone-shape', t.shape),
      h('div.cn', { style: { fontSize: '26px', marginTop: '4px' } }, t.cn),
      h('div.small.faint', t.vi),
    ));
  }
  el.append(section('Năm thanh điệu — cùng âm "ma"', toneGrid,
    h('div.card', { style: { marginTop: '12px' } },
      ...TONES.map((t) => h('div', { style: { padding: '8px 0', borderBottom: '1px solid var(--line)' } },
        h('div.row', { style: { gap: '9px' } },
          h('b', { style: { minWidth: '84px' } }, t.n ? `Thanh ${t.n} (${t.mark})` : `Khinh thanh`),
          h('span.small', t.desc),
        ),
        h('div.small.muted', { style: { marginTop: '2px' } }, '↳ ', t.tip),
      )),
    )));

  /* ---- thanh mẫu ---- */
  const iniWrap = h('div.card');
  for (const grp of INITIALS) {
    iniWrap.append(h('div', { style: { padding: '9px 0', borderBottom: '1px solid var(--line)' } },
      h('div.small.faint', { style: { marginBottom: '6px' } }, grp.g),
      h('div.syl-grid', ...grp.items.map(([p, cn]) =>
        h('button.syl', { onclick: () => say(cn) }, h('b', p), h('small.cn', cn)))),
    ));
  }
  el.append(section('21 thanh mẫu (phụ âm đầu)', iniWrap,
    h('p.small.faint', 'Chạm vào ô để nghe chữ ví dụ.')));

  /* ---- vận mẫu ---- */
  const finWrap = h('div.card');
  for (const grp of FINALS) {
    finWrap.append(h('div', { style: { padding: '9px 0', borderBottom: '1px solid var(--line)' } },
      h('div.small.faint', { style: { marginBottom: '6px' } }, grp.g),
      h('div.syl-grid', ...grp.items.map(([p, cn]) =>
        h('button.syl', { onclick: () => say(cn) }, h('b', p), h('small.cn', cn)))),
    ));
  }
  el.append(section('Vận mẫu (vần)', finWrap));

  /* ---- quy tắc biến điệu ---- */
  const rules = h('div.stack');
  for (const r of RULES) {
    rules.append(h('div.card',
      h('h3', r.t),
      h('p.small.muted', { style: { marginTop: '6px' } }, r.d),
      ...r.ex.map(([cn, py, vi]) => h('div.sent',
        h('div.row.spread',
          h('div',
            h('div.cn', { style: { fontSize: '19px' } }, cn),
            h('div.py.small', py),
            h('div.small.faint', vi),
          ),
          h('button.speak-btn', { onclick: () => say(cn) }, '🔊'),
        ),
      )),
    ));
  }
  el.append(section('Quy tắc biến điệu bắt buộc thuộc', rules));

  /* ---- luyện nghe phân biệt thanh ---- */
  el.append(section('Luyện phân biệt thanh điệu', toneQuiz(say)));

  return { title: 'Pinyin', el };
}

/** Bài tập nhanh: nghe một trong bốn thanh của "ma" rồi chọn đúng. */
function toneQuiz(say) {
  const items = TONES.filter((t) => t.n > 0);
  let answer = null, streak = 0;
  const status = h('div.small.faint', { style: { minHeight: '22px' } }, 'Bấm "Phát" rồi chọn thanh bạn nghe được.');
  const opts = h('div.row.wrap', { style: { gap: '8px' } });

  function pick() {
    answer = items[Math.floor(Math.random() * items.length)];
    say(answer.cn);
  }

  for (const t of items) {
    opts.append(h('button.btn.sm', {
      onclick: () => {
        if (!answer) { status.textContent = 'Bấm "Phát" trước đã.'; return; }
        if (t.n === answer.n) {
          streak++;
          status.textContent = `Đúng! Đó là ${answer.mark} (${answer.cn} — ${answer.vi}). Chuỗi đúng: ${streak}`;
          answer = null;
        } else {
          streak = 0;
          status.textContent = `Chưa đúng. Nghe lại xem cao độ đi lên hay đi xuống.`;
        }
      },
    }, `Thanh ${t.n}`, ' ', h('span.faint', t.shape)));
  }

  return h('div.card',
    h('div.btn-row', { style: { marginBottom: '10px' } },
      h('button.btn.jade', { onclick: pick }, '▶ Phát một thanh'),
      h('button.btn.sm.ghost', { onclick: () => answer && say(answer.cn) }, '↻ Nghe lại'),
    ),
    opts,
    h('div', { style: { marginTop: '10px' } }, status),
  );
}
