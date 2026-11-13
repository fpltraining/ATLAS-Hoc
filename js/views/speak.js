/* Luyện phát âm có chấm điểm.

   #/speak                      chọn bộ luyện
   #/speak/<en|zh>/<bộ>?i=<số>  luyện lần lượt từng câu: nghe mẫu → nói → chấm

   Điểm cao nhất của từng câu lưu ở kv 'speakScores' (khoá "<ngôn ngữ>:<câu>"). */

import * as data from '../data.js';
import * as store from '../store.js';
import * as audio from '../audio.js';
import * as content from '../content.js';
import { sayEn } from '../kit.js';
import { learnedWords } from '../pool.js';
import { listen, score, verdictSpeak, canListen } from '../speech.js';
import { h, pill, progressBar } from '../ui.js';

/* Cặp câu khác nhau đúng một thanh điệu: phải nói đúng thanh thì máy mới ra đúng chữ */
const TONE_PAIRS = [
  ['我想买书。', 'Wǒ xiǎng mǎi shū.', 'Tôi muốn MUA sách.'],
  ['我想卖书。', 'Wǒ xiǎng mài shū.', 'Tôi muốn BÁN sách.'],
  ['请问，你是老师吗？', 'Qǐngwèn, nǐ shì lǎoshī ma?', 'Xin hỏi, bạn là giáo viên à?'],
  ['我要睡觉了。', 'Wǒ yào shuìjiào le.', 'Tôi đi NGỦ đây.'],
  ['我要吃水饺。', 'Wǒ yào chī shuǐjiǎo.', 'Tôi muốn ăn SỦI CẢO.'],
  ['这是我的杯子。', 'Zhè shì wǒ de bēizi.', 'Đây là CÁI CỐC của tôi.'],
  ['这是我的被子。', 'Zhè shì wǒ de bèizi.', 'Đây là CÁI CHĂN của tôi.'],
  ['我喜欢熊猫。', 'Wǒ xǐhuan xióngmāo.', 'Tôi thích GẤU TRÚC.'],
  ['妈妈骂马。', 'Māma mà mǎ.', 'Mẹ mắng con ngựa.'],
  ['他买了一件大衣。', 'Tā mǎi le yí jiàn dàyī.', 'Anh ấy mua một cái ÁO KHOÁC.'],
  ['我去问路。', 'Wǒ qù wèn lù.', 'Tôi đi HỎI ĐƯỜNG.'],
  ['汤很好喝。', 'Tāng hěn hǎohē.', 'CANH rất ngon.'],
  ['糖很好吃。', 'Táng hěn hǎochī.', 'KẸO rất ngon.'],
  ['我有四个孩子。', 'Wǒ yǒu sì ge háizi.', 'Tôi có BỐN đứa con.'],
  ['我有十个孩子。', 'Wǒ yǒu shí ge háizi.', 'Tôi có MƯỜI đứa con.'],
];

const SETS = {
  en: [
    { id: 'sounds', title: 'Âm khó với người Việt', sub: 'Phụ âm cuối, âm gió, nguyên âm dài – ngắn' },
    { id: 'phr', title: 'Cụm từ giao tiếp', sub: 'Cụm ngắn dùng hằng ngày' },
    { id: 'sent', title: 'Câu giao tiếp', sub: 'Câu A1–A2 về đời sống, công việc' },
  ],
  zh: [
    { id: 'tones', title: 'Thanh điệu qua cặp câu', sub: 'Nói đúng thanh thì máy mới ra đúng chữ', strict: true },
    { id: 'words', title: 'Từ đã học', sub: 'Từ trong các bài bạn đang học' },
    { id: 'sent', title: 'Câu trong bài học', sub: 'Câu mẫu của các bài HSK' },
  ],
};

/** Danh sách mục của một bộ: [{ t: câu, py?: phiên âm, vi?: nghĩa, note?: ghi chú }] */
async function items(lang, set) {
  if (lang === 'en') {
    const course = await content.course();
    if (set === 'sounds') {
      return course.sounds.flatMap((s) => s.pairs.flat().map((w) => ({ t: w, note: s.title })));
    }
    if (set === 'phr') return course.phr.flat().map(([t, vi]) => ({ t, vi }));
    return course.a1sent.map((t) => ({ t }));
  }
  if (set === 'tones') return TONE_PAIRS.map(([t, py, vi]) => ({ t, py, vi }));
  if (set === 'words') {
    const ws = await learnedWords('zh', 20);
    return ws.filter((w) => w.lang === 'zh').map((w) => ({ t: w.w, py: w.py, vi: w.vi }));
  }
  const [idx, progress] = await Promise.all([data.curriculum(), store.lessonProgress()]);
  let upto = idx.lessons.findIndex((l) => !progress[l.id]?.done);
  if (upto < 0) upto = idx.lessons.length - 1;
  const out = [];
  for (const meta of idx.lessons.slice(Math.max(0, upto - 4), Math.max(upto + 1, 3))) {
    const L = await data.lesson(meta.file);
    for (const s of L.sentences || []) out.push({ t: s.cn, py: s.py, vi: s.vi, note: `Bài ${meta.no ?? meta.id}` });
  }
  return out;
}

export async function render(route) {
  const [lang, set] = route.args;
  if (!lang) return hub();
  const meta = (SETS[lang] || []).find((s) => s.id === set);
  if (!meta) return hub();
  await data.ensureHanViet();
  const list = await items(lang, set);
  if (!list.length) return { title: 'Luyện phát âm', el: h('div.empty', 'Chưa có câu nào để luyện ở bộ này.') };
  return practice(lang, meta, list, Number(route.query.i) || 0);
}

async function hub() {
  const scores = await store.kvGet('speakScores', {});
  const avg = (lang) => {
    const v = Object.entries(scores).filter(([k]) => k.startsWith(`${lang}:`)).map(([, s]) => s);
    return v.length ? `${v.length} câu đã luyện · trung bình ${Math.round(v.reduce((a, b) => a + b, 0) / v.length)} điểm` : 'Chưa luyện câu nào';
  };
  const group = (lang, name) => h('div.stack',
    h('div.row.spread', h('h3', name), h('span.small.faint', avg(lang))),
    ...SETS[lang].map((s) => h('a.hub-tile', { href: `#/speak/${lang}/${s.id}` },
      h('span.hub-mark', lang === 'zh' ? '声' : '🗣'),
      h('span.grow', h('b', s.title), h('span.small.faint.block', s.sub)),
      h('span.faint', '›'))),
  );
  return {
    title: 'Luyện phát âm',
    el: h('div.stack',
      !canListen ? h('div.note.seal', 'Trình duyệt này không nghe được giọng nói. Trên iPad hãy mở app bằng Safari và bật Siri (Cài đặt → Siri).') : null,
      h('div.note', 'Nghe mẫu, bấm micro rồi nói. Máy chấm theo mức người nghe có hiểu bạn không, không bắt lỗi từng âm. Từ 70 điểm là đủ để hội thoại. Cần có mạng khi chấm.'),
      group('en', 'Tiếng Anh'),
      group('zh', 'Tiếng Trung'),
    ),
  };
}

async function practice(lang, meta, list, start) {
  const settings = await store.settings();
  const scores = await store.kvGet('speakScores', {});
  let i = Math.max(0, Math.min(list.length - 1, start));
  const body = h('div');
  const say = (t, slow) => (lang === 'en'
    ? sayEn(t, slow ? { rate: 0.6 } : {})
    : audio.speak(t, { rate: slow ? 0.55 : settings.speechRate, lang: 'zh' }));

  function show() {
    const it = list[i];
    const key = `${lang}:${it.t}`;
    const live = h('div.small.faint', { style: { minHeight: '22px', marginTop: '8px' } });
    const result = h('div');
    const mic = h('button.mic-btn', { 'aria-label': 'Nói' }, '🎙');
    let busy = false;

    mic.onclick = async () => {
      if (busy) { listen.stop?.(); return; }
      busy = true;
      mic.classList.add('on');
      live.textContent = 'Đang nghe… nói đi nào';
      result.replaceChildren();
      try {
        const alts = await listen(lang, { onInterim: (t) => { live.textContent = t; } });
        const r = score(lang, it.t, alts, { strict: !!meta.strict });
        const v = verdictSpeak(r.score);
        live.textContent = `Máy nghe được: “${r.heard}”`;
        const prev = scores[key];
        if (prev == null || r.score > prev) {
          scores[key] = r.score;
          await store.kvUpdate('speakScores', {}, (all) => { all[key] = Math.max(all[key] || 0, r.score); return all; });
        }
        result.replaceChildren(h(`div.note.${v.tone}`, { style: { marginTop: '10px' } },
          h('div.row', { style: { gap: '12px', alignItems: 'baseline' } },
            h('span.score-big', String(r.score)),
            h('div', h('b', v.text), h('div.small', v.sub))),
          h('div.speak-units', { style: { marginTop: '8px' } },
            ...r.units.map((u) => h(`span.${u.ok ? 'u-ok' : 'u-miss'}${lang === 'zh' ? '.cn' : ''}`, u.t))),
          r.units.some((u) => !u.ok) ? h('div.small', { style: { marginTop: '6px' } }, 'Chữ màu cam là chỗ máy chưa nghe ra. Bấm "Nghe chậm" rồi nói lại.') : null,
        ));
      } catch (e) {
        live.textContent = e.message;
      } finally {
        busy = false;
        mic.classList.remove('on');
      }
    };

    body.replaceChildren(h('div.card',
      h('div.row.spread', pill(`${i + 1}/${list.length}`, 'plain'),
        h('span.small.faint', scores[key] != null ? `Điểm cao nhất: ${scores[key]}` : (it.note || meta.title))),
      h('div', { style: { margin: '8px 0' } }, progressBar((i + 1) / list.length)),
      h('div.center', { style: { margin: '18px 0 6px' } },
        h(lang === 'zh' ? 'div.cn' : 'div', { style: { fontSize: lang === 'zh' ? '34px' : '28px', fontWeight: 600, lineHeight: 1.3 } }, it.t),
        it.py ? h('div.py', { style: { fontSize: '18px', marginTop: '4px' } }, it.py) : null,
        it.vi ? h('div.muted', { style: { marginTop: '4px' } }, it.vi) : null,
        it.note && scores[key] != null ? h('div.small.faint', it.note) : null,
      ),
      h('div.btn-row', { style: { justifyContent: 'center' } },
        h('button.btn', { onclick: () => say(it.t, false) }, '🔊 Nghe mẫu'),
        h('button.btn.ghost', { onclick: () => say(it.t, true) }, '🐢 Nghe chậm')),
      h('div.center', { style: { marginTop: '16px' } }, mic, h('div.small.faint', 'Bấm micro rồi nói. Bấm lần nữa để dừng.')),
      live, result,
      h('div.btn-row', { style: { marginTop: '14px' } },
        h('button.btn.ghost', { disabled: i === 0, onclick: () => { i--; go(); } }, '‹ Câu trước'),
        h('button.btn.primary', { onclick: () => { if (i < list.length - 1) { i++; go(); } else { location.hash = '#/speak'; } } },
          i < list.length - 1 ? 'Câu tiếp ›' : 'Xong bộ này')),
    ));
    setTimeout(() => say(it.t, false), 250);
  }
  function go() {
    history.replaceState(null, '', `#/speak/${lang}/${meta.id}?i=${i}`);
    show();
  }
  show();
  return { title: meta.title, el: body, cleanup: () => listen.stop?.() };
}
