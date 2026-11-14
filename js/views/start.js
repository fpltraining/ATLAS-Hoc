/* Làm quen: 4 câu hỏi ngắn để app xếp lộ trình riêng, rồi chỉ thẳng vào bài đầu tiên.
   Mở lần đầu thì trang Hôm nay mời vào đây; đổi ý thì vào lại từ Cài đặt. */

import * as store from '../store.js';
import * as content from '../content.js';
import { h } from '../ui.js';
import { zhPath, enPath, pathCard } from '../path.js';
import { buildToday } from '../plan.js';

const LANGS = [
  ['both', '汉 + Aa', 'Cả hai', 'Tiếng Anh và tiếng Trung song song mỗi ngày'],
  ['en', 'Aa', 'Tiếng Anh', 'Chỉ học tiếng Anh'],
  ['zh', '汉', 'Tiếng Trung', 'Chỉ học tiếng Trung'],
];
const MINS = [
  [30, '30′', '30 phút', 'Nhẹ nhàng: ôn thẻ + một bài học'],
  [60, '1h', '1 giờ', 'Vừa sức: ôn, học bài, đọc ngắn'],
  [90, '90′', '90 phút', 'Đều đặn: thêm đọc truyện và tiếng Anh nghề'],
  [120, '2h', '2 giờ', 'Nghiêm túc: đủ tất cả các việc'],
];

export async function render() {
  const [s, en, course, lessons] = await Promise.all([store.settings(), store.enState(), content.course(), store.lessonProgress()]);
  const enSess = Object.values(en.sess || {}).reduce((a, m) => a + Object.values(m || {}).filter((x) => x.done).length, 0);
  const enHas = (en.stage || 0) > 0 || enSess > 0;
  const zhHas = Object.values(lessons).some((p) => p?.done);
  const pg = await store.kvGet('pron-zh', { passed: {} });
  const pronHas = Object.keys(pg.passed || {}).length > 0;

  const ans = {
    langs: s.langs || 'both',
    mins: s.onboarded ? s.dailyMinutes : 60,
    en: enHas ? 'keep' : 'new',
    zh: zhHas ? 'keep' : s.zhSkipPron ? 'hsk' : 'pron',
  };
  const stage = course.stages[en.stage || 0];
  const el = h('div.stack.start');
  let step = 0;

  const steps = () => ['langs', 'mins', ...(ans.langs !== 'zh' ? ['en'] : []), ...(ans.langs !== 'en' ? ['zh'] : []), 'done'];

  function choice(list, key, cls = '') {
    return h(`div.choice-grid${cls}`, ...list.map(([v, mark, title, sub]) => h(`button.choice${ans[key] === v ? '.on' : ''}`, {
      onclick: () => { ans[key] = v; step++; draw(); },
    }, h('span.choice-mark', mark), h('span.choice-text', h('b', title), h('span', sub)))));
  }

  function head(q, hint) {
    const all = steps();
    return h('div',
      h('div.start-progress', ...all.slice(0, -1).map((_, i) => h(`i${i < step ? '.done' : i === step ? '.on' : ''}`))),
      h('div.small.faint', `Câu ${step + 1}/${all.length - 1}`),
      h('h1.start-q', q),
      hint ? h('p.muted', hint) : null,
    );
  }

  async function draw() {
    const key = steps()[step];
    const back = step ? h('button.btn.ghost.sm', { onclick: () => { step--; draw(); } }, '‹ Quay lại') : null;
    if (key === 'langs') {
      el.replaceChildren(
        h('div.start-hello',
          h('img.start-welcome', { src: 'img/moments/welcome.webp', alt: 'Han và Kai' }),
          h('div', h('b', 'Chào bạn! Mình là Han và Kai.'), h('div.small.muted', 'Trả lời 4 câu (1 phút), app xếp lộ trình riêng và chỉ đúng bài cần học trước.')),
        ),
        h('div.card', head('Bạn muốn học gì?'), choice(LANGS, 'langs')),
      );
    } else if (key === 'mins') {
      el.replaceChildren(h('div.card', head('Mỗi ngày bạn học được bao lâu?', 'Mới bắt đầu nên chọn 30 phút hoặc 1 giờ. Quen rồi tăng lên trong Cài đặt.'), choice(MINS, 'mins', '.g4'), back));
    } else if (key === 'en') {
      const opts = [
        ...(enHas ? [['keep', '↻', `Học tiếp chỗ đang dừng`, `${stage.name} · ${stage.cefr}`]] : []),
        ['new', 'A0', 'Mới bắt đầu hoặc mất gốc', 'Học từ âm và 600 từ lõi (Chặng 0)'],
        ['test', '?', 'Biết chút ít', 'Làm bài xếp lớp 10 phút, app chọn chặng hợp với bạn'],
      ];
      el.replaceChildren(h('div.card', head('Tiếng Anh của bạn đang thế nào?'), choice(opts, 'en'), back));
    } else if (key === 'zh') {
      const opts = [
        ...(zhHas ? [['keep', '↻', 'Học tiếp bài HSK đang dừng', 'Phát âm vẫn mở để học xen kẽ']] : []),
        ['pron', '音', 'Chưa biết gì', 'Học phát âm 10 bài trước (khuyên dùng), xong mới vào HSK 1'],
        ['hsk', 'ā', 'Đã đọc được pinyin và 4 thanh', 'Vào thẳng HSK 1 bài 1'],
      ];
      el.replaceChildren(h('div.card', head('Tiếng Trung của bạn đang thế nào?', pronHas ? `Bạn đã qua ${Object.keys(pg.passed).length}/10 bài phát âm.` : ''), choice(opts, 'zh'), back));
    } else {
      await save();
      el.replaceChildren(h('div.card', h('div.small.faint', 'Xong!'), h('h1.start-q', 'Lộ trình của bạn'), h('p.muted', 'Đang xếp…')));
      const [plan, zp, ep] = await Promise.all([buildToday(), ans.langs !== 'en' ? zhPath() : null, ans.langs !== 'zh' ? enPath() : null]);
      const first = ans.langs !== 'zh' && ans.en === 'test' ? { href: '#/en/placement', title: 'Bài xếp lớp tiếng Anh (10 phút)' } : plan.steps.find((x) => !x.done) || plan.steps[0];
      el.replaceChildren(h('div.card',
        h('div.small.faint', 'Xong! Đây là lộ trình của bạn'),
        h('h1.start-q', 'Bắt đầu từ đây'),
        h('div.start-first', h('span.small', 'Việc đầu tiên'), h('b', first.title), first.desc ? h('div.small.muted', first.desc) : null),
        h('a.btn.seal.block', { href: first.href, style: { marginTop: '12px' } }, 'Học ngay ›'),
        h('div.stack', { style: { marginTop: '16px' } },
          ep ? pathCard(ep) : null,
          zp ? pathCard(zp) : null,
        ),
        h('p.small.muted', { style: { marginTop: '12px' } },
          `Mỗi ngày app xếp sẵn ${plan.steps.length} việc trong khoảng ${plan.steps.reduce((a, x) => a + x.mins, 0)} phút ở trang Hôm nay, làm lần lượt từ trên xuống. Đổi lựa chọn bất cứ lúc nào ở Cài đặt → Lộ trình học.`),
        h('div.btn-row', h('a.btn.ghost', { href: '#/home' }, 'Về trang Hôm nay'), back),
      ));
    }
    window.scrollTo(0, 0);
  }

  async function save() {
    await store.setSetting('langs', ans.langs);
    await store.setSetting('dailyMinutes', ans.mins);
    if (ans.zh === 'hsk') await store.setSetting('zhSkipPron', true);
    if (ans.zh === 'pron') await store.setSetting('zhSkipPron', false);
    await store.setSetting('onboarded', true);
  }

  draw();
  return { title: 'Lộ trình học', el };
}
