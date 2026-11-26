// Soát trước khi phát hành: chạy app như người học thật trên iPhone / iPad giả lập (cần Playwright, như tools/ui-check.mjs).
//   1. Người học mới (3 kiểu): mở app lần đầu → kiểm tra nhanh → chọn nhân vật → lời mở đầu → buổi học đầu (Học, Luyện,
//      Kiểm tra) → 5 nhiệm vụ hôm nay → mở rương. Người mới tinh (iPhone cầm dọc), A1 (iPhone ngang), A2 (iPad).
//   2. Đầu ra: Kiểm tra tuần (nghe, đọc, nói), buổi A2 và B1, thi chứng chỉ A1 (hiểu + nói), Bắt lỗi câu, đọc truyện chỉ nghe.
//   3. Quét: mở mọi phòng, nơi nói chuyện, chủ đề từ, truyện, bảng.
// Ghi mọi lỗi JS và tệp hỏng (404). Ảnh chụp ở scratch/qa/. Chạy: node tools/qa-run.mjs (từ thư mục gốc), khoảng 10–15 phút.
// Thoát mã 1 nếu có lỗi JS, tệp hỏng, hoặc một luồng học không chạy hết.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'scratch/qa'); fs.mkdirSync(OUT, { recursive: true });
const DRV = fs.readFileSync(path.join(ROOT, 'tools/qa/driver.js'), 'utf8');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
    const idx = path.join(p, 'index.html');
    if (fs.existsSync(idx)) { res.writeHead(200, { 'content-type': 'text/html' }); fs.createReadStream(idx).pipe(res); return; }
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port + '/game/';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = [], problems = [];

async function page(dev, save) {
  const ctx = await browser.newContext({ ...devices[dev], serviceWorkers: 'block' });
  // Supabase giả: không gửi gì ra ngoài
  await ctx.route('**/*supabase.co/**', (r) => r.fulfill({ status: /app_events/.test(r.request().url()) ? 201 : 200, contentType: 'application/json', body: /settings/.test(r.request().url()) ? '{"external":{"google":false}}' : '[]' }));
  await ctx.addInitScript(DRV);
  if (save) await ctx.addInitScript((s) => { if (!localStorage.getItem('qa-seed')) { localStorage.setItem('qa-seed', 1); localStorage.setItem('thegioi-save-v1', JSON.stringify(s)); } }, save);
  const p = await ctx.newPage();
  const errs = [], fails = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400 && !/supabase/.test(r.url())) fails.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
  await p.goto(BASE); await wait(2500);
  return { ctx, p, errs, fails, ev: (f, a) => p.evaluate(f, a), shot: (n) => p.screenshot({ path: path.join(OUT, n + '.png') }) };
}
async function loop(P, fn, arg, max, delay, stop) {
  let last = '';
  for (let i = 0; i < max; i++) {
    const c = await P.ev(() => __qa.common()); if (c) { await wait(400); continue; }
    last = await P.ev(fn, arg);
    if (stop.test(last)) break;
    await wait(/mcq/.test(last) ? 1450 : /order/.test(last) ? 250 : delay);
  }
  return last;
}
const seed = (o) => Object.assign({ v: 1, nhanVat: 'han', ten: 'Minh', xp: 400, micro: 'off', luuLuc: 5, caiDat: { hoiTK: 3 } }, o);
const dv = (lv) => ({ lv, tv: lv, nghe: lv, doc: lv, gt: lv, noi: null, luc: '2026-11-20T09:00:00+07:00', dung: 12, tong: 20, ban: 2 });

// ---------- 1. người học mới ----------
async function newLearner(dev, maxLv, tag) {
  const P = await page(dev);
  for (let i = 0; i < 80; i++) { const r = await P.ev((lv) => __qa.vocab(lv), maxLv); if (r === 'gone') break; await wait(r === 'result' ? 1000 : 450); }
  const placed = await P.ev(() => G.S.dauVao && G.S.dauVao.lv);
  await P.ev(() => { const i = document.querySelector('.cr-name'); if (i) i.value = 'Lan'; const b = document.querySelector('.cr-go'); if (b) b.click(); });
  await wait(600);
  for (let i = 0; i < 10; i++) { const t = await P.ev(() => { const b = __qa.byText('.modal button', /Tiếp|Ra khỏi nhà/); if (!b) return null; b.click(); return 1; }); if (!t) break; await wait(350); }
  await wait(9000); await P.shot(tag + '-1-city');
  const id = await P.ev(() => { const nl = G.nextLesson(); return nl && nl.id; });
  const auto = await P.ev(() => document.getElementById('panel').classList.contains('open'));
  if (!auto) await P.ev((x) => G.openLesson(x), id);
  const covered = await P.ev(() => !!document.querySelector('.modal, .cgate'));   // không được có màn nào che buổi học đầu
  const last = await loop(P, (x) => __qa.lesson(x), id, 400, 500, /^(finish|closed)$/);
  await P.shot(tag + '-2-lesson-result');
  const pass = await P.ev((x) => G.S.phong[x], id);
  await P.ev(() => G.closeLesson()); await wait(1500);
  const qlog = {};
  const quest = async (q, fn, max) => {
    await P.ev(() => { G.closeLesson(); document.querySelectorAll('.modal').forEach((m) => m.remove()); });
    await P.ev((x) => G.questAct(x), q); await wait(1500);
    qlog[q] = await loop(P, fn, null, max, 800, /^done$/);
    if (qlog[q] !== 'done') await P.shot(tag + '-quest-' + q);
    return qlog[q];
  };
  await quest('doc', async () => {
    const q = window.__qa; let s;
    if ((s = document.querySelector('.rd-next')) && q.vis(s)) { s.click(); return 'open'; }
    const qs = q.all('.rd-q');
    if (qs.length && !document.querySelector('.rd-opt.ok, .rd-opt.no')) {
      const title = document.getElementById('panel-title').textContent.trim();
      const st = (await (await fetch('../data/stories/index.json')).json()).filter((x) => x.title === title)[0];
      const full = await (await fetch('../data/stories/' + st.id + '.json')).json();
      const ch = full.chapters[+(/Chương (\d+)/.exec(document.querySelector('.lsub').textContent)[1]) - 1];
      qs.forEach((qq, i) => { const right = ch.quiz[i].opts[ch.quiz[i].a]; const b = [].filter.call(qq.querySelectorAll('.rd-opt'), (o) => o.textContent === right)[0]; if (b) b.click(); });
      return 'quiz';
    }
    if ((s = q.byText('#panel-body button.seal', /Đọc xong/))) { s.click(); return 'done'; }
    return 'wait';
  }, 40);
  await quest('on', () => {
    const q = window.__qa; let s;
    if ((s = q.byText('#panel-body button', /Ôn thêm 5 câu|Ôn \d+ câu khó/))) { s.click(); return 'start'; }
    if ((s = q.byText('#panel-body .rv-show', /Xem đáp án/))) { s.click(); return 'show'; }
    if ((s = q.byText('#panel-body .rv-grade button', /Nhớ chắc/))) { s.click(); return 'grade'; }
    if ((s = q.byText('#panel-body button.seal', /^Xong ›/))) { s.click(); return 'done'; }
    return 'wait';
  }, 40);
  await quest('tu', () => {
    const q = window.__qa; let s;
    if ((s = q.byText('#panel-body button.seal', /^Tiếp ›|Nghe chọn nghĩa/))) { s.click(); return 'next'; }
    const o = q.all('#panel-body .opts .opt'); if (o.length && !document.querySelector('#panel-body .opt.ok')) { o[0].click(); return 'quiz'; }
    return document.querySelector('.tp-res') ? 'done' : 'wait';
  }, 80);
  await quest('noi', () => {
    const q = window.__qa; let s;
    if ((s = q.all('#panel-body .menu3 button.big:not(.done)')[0]) && !document.querySelector('.chatlog')) { s.click(); return 'talk'; }
    const o = q.all('#panel-body .chatopts .opt').filter((x) => x.className.indexOf(' no') < 0)[0]; if (o) { o.click(); return 'reply'; }
    return document.querySelector('#panel-body .result') ? 'done' : 'wait';
  }, 80);
  await P.ev(() => { G.closeLesson(); G.claimChest(); }); await wait(1500);
  await P.ev(() => __qa.common()); await P.ev(() => G.goLobby()); await wait(1200); await P.shot(tag + '-3-lobby');
  const day = await P.ev(() => ({ p: G.dayProgress(), chest: !!G.today().ruong, viec: Object.keys(G.today().viec) }));
  const ok = pass && pass.diem >= 8 && day.p.done === day.p.all && day.chest && !covered;
  report.push(`Người mới ${tag}: đầu vào ${placed} → buổi ${id} ${pass ? pass.diem + '/10' : 'chưa qua'}${auto ? ' (tự mở)' : ''}, nhiệm vụ ${day.p.done}/${day.p.all} (${day.viec.join(', ')}), ${day.p.mins}/${day.p.goal} phút, rương ${day.chest ? 'đã mở' : 'chưa'}${covered ? ', CÓ MÀN CHE BÀI ĐẦU' : ''}${Object.keys(qlog).filter((k) => qlog[k] !== 'done').map((k) => ' · ' + k + ' dừng ở "' + qlog[k] + '"').join('')}`);
  if (!ok) problems.push('Người mới ' + tag + ' chưa chạy hết ngày học đầu');
  P.errs.forEach((e) => problems.push(tag + ' lỗi JS: ' + e)); [...new Set(P.fails)].forEach((f) => problems.push(tag + ' tệp hỏng: ' + f));
  await P.ctx.close();
}

// ---------- 2. đầu ra ----------
async function outcome() {
  const P = await page('iPhone 15 landscape', seed({ hhTang: 2, rank: 3, dauVao: dv(2) }));
  await P.ev(() => document.querySelectorAll('.modal, .cgate').forEach((m) => m.remove()));
  await P.ev(() => G.openWeekly()); await wait(900);
  await loop(P, () => __qa.weekly(), null, 60, 1300, /^done$/);
  const wk = await P.ev(() => (G.S.tuan || []).slice(-1)[0]);
  report.push('Kiểm tra tuần: ' + (wk ? `nghe ${wk.nghe}, đọc ${wk.doc}, nói ${wk.noi}, tổng ${wk.tong}/100` : 'KHÔNG XONG'));
  if (!wk || wk.tong < 90) problems.push('Kiểm tra tuần chưa chạy hết hoặc chấm sai đáp án đúng');
  for (const id of ['en-a1-02', 'en-a2-01', 'en-b1-01']) {
    await P.ev((x) => { G.closeLesson(); G.openLesson(x); }, id); await wait(900);
    await loop(P, (x) => __qa.lesson(x), id, 300, 650, /^(finish|closed)$/);
    const r = await P.ev((x) => G.S.phong[x], id);
    report.push(`Buổi ${id}: ${r ? r.diem + '/10' : 'KHÔNG XONG'}`); if (!r || r.diem < 8) problems.push('Buổi ' + id + ' không học hết được');
  }
  await P.ev(() => { G.closeLesson(); G.openLesson('en-a1-test'); }); await wait(900);
  for (let i = 0; i < 260; i++) {
    const c = await P.ev(() => __qa.common()); if (c) { await wait(400); continue; }
    let r = await P.ev(() => __qa.lesson('en-a1-test')); if (r === 'wait') r = 'w:' + await P.ev(() => __qa.weekly());
    if (await P.ev(() => !!document.querySelector('.modal.grad'))) break;
    if (r === 'closed' || r === 'w:done') break;
    await wait(/mcq/.test(r) ? 1450 : 700);
  }
  await wait(1200); await P.shot('outcome-cert');
  const cert = await P.ev(() => ({ c: G.S.totNghiep && G.S.totNghiep.en && G.S.totNghiep.en.A1, share: !!document.querySelector('.modal.grad .grad-share') }));
  report.push('Thi chứng chỉ A1: ' + (cert.c ? `hiểu ${cert.c.diem}/${cert.c.tong}, nói ${cert.c.noi}/100, ${cert.share ? 'có nút chia sẻ' : 'thiếu nút chia sẻ'}` : 'KHÔNG NHẬN ĐƯỢC'));
  if (!cert.c) problems.push('Thi chứng chỉ A1 không chạy hết');
  await P.ev(() => { document.querySelectorAll('.modal').forEach((m) => m.remove()); G.closeLesson(); G.openFix(); }); await wait(800);
  await loop(P, () => __qa.fix(), null, 40, 900, /^done$/);
  const fx = await P.ev(() => G.fixStats()); report.push(`Bắt lỗi câu: đúng ${fx.ok} câu trong lượt 10 câu`); if (fx.ok < 10) problems.push('Bắt lỗi câu chấm sai');
  await P.ev(() => { G.closeLesson(); G.openReader(); }); await wait(1500);
  await P.ev(() => document.querySelector('.rd-next').click()); await wait(1500);
  const rd = await P.ev(async () => {
    const b = __qa.byText('#panel-body button', /Ẩn chữ/); if (b) b.click(); await new Promise((r) => setTimeout(r, 300));
    const blur = document.querySelectorAll('.rd-hideen .rd-line:not(.seen)').length; document.querySelector('.rd-listen').click(); await new Promise((r) => setTimeout(r, 2500));
    return { blur, now: document.querySelectorAll('.rd-now').length };
  });
  report.push(`Đọc truyện: chỉ nghe ẩn ${rd.blur} câu, nghe cả chương ${rd.now ? 'đang phát' : 'KHÔNG PHÁT'}`); if (!rd.blur || !rd.now) problems.push('Đọc truyện chỉ nghe / nghe cả chương không chạy');
  P.errs.forEach((e) => problems.push('đầu ra lỗi JS: ' + e)); [...new Set(P.fails)].forEach((f) => problems.push('đầu ra tệp hỏng: ' + f));
  await P.ctx.close();
}

// ---------- 3. quét mọi màn ----------
async function crawl() {
  const P = await page('iPhone 15 landscape', seed({ xp: 900, hhTang: 4, rank: 4, dauVao: dv(4) }));
  await P.ev(() => document.querySelectorAll('.modal, .cgate').forEach((m) => m.remove()));
  const ids = await P.ev(() => Object.keys(G.ROOMS).filter((k) => G.ROOMS[k].lang === 'en')), empty = [];
  for (const id of ids) {
    const r = await P.ev((x) => {
      G.closeLesson(); G.openLesson(x);
      const b = document.getElementById('panel-body'), l = [].filter.call(b.querySelectorAll('button.big'), (e) => /1 · (Học|Ôn tập)/.test(e.textContent))[0], n = b.textContent.length;
      if (l) l.click();
      return { n, l: !!l, after: document.getElementById('panel-body').textContent.length, g: !!G.ROOMS[x].group };
    }, id);
    if (!r.n || (!r.g && (!r.l || !r.after))) empty.push(id);
  }
  const life = await P.ev(() => Object.keys(G.LIFE).filter((k) => G.LIFE[k].lang === 'en'));
  for (const id of life) { await P.ev((x) => { G.closeLesson(); G.openLife(x); const t = document.querySelector('#panel-body .menu3 button.big'); if (t) t.click(); }, id); await wait(150); }
  await P.ev(() => { G.closeLesson(); G.openTopics(); }); await wait(1500);
  const tops = await P.ev(() => (G.TOPICS_EN || []).map((t) => t.id));
  for (const id of tops) { await P.ev((x) => G.openTopic(x), id); await wait(250); }
  for (let i = 0; i < 5; i++) { await P.ev((x) => G.openMemMap(x), i); await wait(300); }
  await P.ev(() => G.openReader()); await wait(1500);
  const ns = await P.ev(() => document.querySelectorAll('.rd-story').length);
  for (let i = 0; i < ns; i++) { await P.ev(() => G.openReader()); await wait(400); await P.ev((k) => { const b = document.querySelectorAll('.rd-story')[k]; if (b) b.click(); }, i); await wait(600); }
  for (const f of ['openToday', 'openHome', 'openReview', 'openReviewHard', 'openWeekly', 'openCanDo', 'openFix', 'openFinalExam', 'openCloudLogin']) {
    await P.ev((x) => { G.closeLesson(); document.querySelectorAll('.cgate').forEach((m) => m.remove()); if (G[x]) G[x](function () {}); }, f); await wait(600);
  }
  for (let t = 0; t < 4; t++) { await P.ev((k) => { document.querySelectorAll('.cgate, .modal').forEach((m) => m.remove()); G.closeLesson(); G.goLobby(); document.querySelectorAll('.lb-tabs button')[k].click(); }, t); await wait(500); }
  report.push(`Quét: ${ids.length} phòng, ${life.length} nơi nói chuyện, ${tops.length} chủ đề, ${ns} truyện, 9 bảng, 4 tab Sảnh${empty.length ? ', MÀN TRỐNG: ' + empty.join(' ') : ''}`);
  empty.forEach((e) => problems.push('màn trống: ' + e));
  P.errs.forEach((e) => problems.push('quét lỗi JS: ' + e)); [...new Set(P.fails)].forEach((f) => problems.push('quét tệp hỏng: ' + f));
  await P.ctx.close();
}

// ---------- 5. Trường Lạc trấn (tiếng Trung): người đang học tiếng Anh chuyển sang tiếng Trung ----------
// Hồ sơ riêng: XP, nhiệm vụ, rương của tiếng Trung tính riêng; học phòng Phát âm, đủ 4 nhiệm vụ, mở rương; về tiếng Anh còn nguyên.
async function zhFlow() {
  const P = await page('iPhone 15 landscape', seed({ hhTang: 2, rank: 3, dauVao: dv(2) }));
  await P.ev(() => document.querySelectorAll('.modal, .cgate').forEach((m) => m.remove()));
  const en0 = await P.ev(() => ({ xp: G.S.xp, viec: Object.keys(G.today().viec).length }));
  await P.ev(() => { const b = [].filter.call(document.querySelectorAll('.city-chip'), (x) => /Trường Lạc/.test(x.textContent))[0]; b.click(); });
  await wait(1500); await P.shot('zh-1-lobby');
  const a = await P.ev(() => ({ lang: G.lang(), xp: G.S.xp, hero: document.querySelector('.hero-sub').textContent, sh: (document.querySelector('.sh-card b') || {}).textContent || '' }));
  const switched = a.lang === 'zh' && a.xp === 0 && /Trường Lạc/.test(a.hero) && /pinyin/.test(a.sh);
  // việc nên làm đầu tiên: phòng Phát âm (pinyin, 4 thanh) với cô Vương
  await P.ev(() => document.querySelector('.sh-card .sh-go').click()); await wait(1500);
  await loop(P, (x) => __qa.lesson(x), 'zh-py', 300, 450, /^(finish|closed)$/);
  await P.shot('zh-2-lesson');
  const les = await P.ev(() => ({ p: G.S.phong['zh-py'], bai: !!G.today().viec.bai, cards: G.srsCount() }));
  const zlog = {};
  const quest = async (q, fn, max) => {
    await P.ev(() => { G.closeLesson(); document.querySelectorAll('.modal').forEach((m) => m.remove()); });
    await P.ev((x) => G.questAct(x), q); await wait(1500);
    zlog[q] = await loop(P, fn, null, max, 700, /^done$/);
    if (zlog[q] !== 'done') await P.shot('zh-quest-' + q);
  };
  await quest('noi', () => {
    const q = window.__qa; let s;
    if ((s = q.byText('#panel-body button', /^Mình đã nói xong/))) { s.click(); return 'said'; }
    if ((s = q.byText('#panel-body button.link', /Tiếp tục|Bỏ qua/))) { s.click(); return 'skip'; }
    if (G.today().viec.noi) return 'done';
    return 'wait';
  }, 40);
  await quest('on', () => {
    const q = window.__qa; let s;
    if ((s = q.byText('#panel-body button', /Ôn thêm 5 câu|Ôn \d+ câu khó/))) { s.click(); return 'start'; }
    if ((s = q.byText('#panel-body .rv-show', /Xem đáp án/))) { s.click(); return 'show'; }
    if ((s = q.byText('#panel-body .rv-grade button', /Nhớ chắc/))) { s.click(); return 'grade'; }
    if (G.today().viec.on) return 'done';
    return 'wait';
  }, 40);
  let pyRows = 0;
  await quest('doc', async () => {
    const q = window.__qa; let s;
    if ((s = document.querySelector('.rd-next')) && q.vis(s)) { s.click(); return 'open'; }
    window.__zhPy = Math.max(window.__zhPy || 0, document.querySelectorAll('.rd-zh .rd-py').length);   // đếm trong trang (biến của bộ soát không vào được trang)
    const qs = q.all('.rd-q');
    if (qs.length && !document.querySelector('.rd-opt.ok, .rd-opt.no')) { qs.forEach((qq) => { const o = qq.querySelector('.rd-opt'); if (o) o.click(); }); return 'quiz'; }
    if ((s = q.byText('#panel-body button.seal', /Đọc xong/))) { s.click(); return 'done'; }
    return 'wait';
  }, 40);
  pyRows = await P.ev(() => window.__zhPy || 0);
  // viết 5 chữ Hán: vẽ từng nét theo nét mẫu (driver.js writeStroke); thử một nét sai chiều phải bị báo lỗi
  await P.ev(() => { G.closeLesson(); G.questAct('viet'); }); await wait(2500);
  await P.ev(() => __qa.writeStroke(true)); await wait(300);
  const wrongMsg = await P.ev(() => (document.querySelector('.wr-fb') || {}).textContent || '');
  for (let i = 0; i < 700; i++) {
    const r = await P.ev(() => __qa.writeStroke()); zlog.viet = r;
    if (r === 'no-pad') break;
    await wait(r === 'anim' || r === 'round-wait' ? 350 : 110);
  }
  const wr = await P.ev(() => ({ n: Object.keys(G.S.vietChu || {}).length, done: !!G.today().viec.viet }));
  if (wr.done) zlog.viet = 'done';
  await P.shot('zh-4-write-done');
  await P.ev(() => { G.closeLesson(); G.claimChest(); }); await wait(1200);
  await P.ev(() => { __qa.common(); G.goLobby(); }); await wait(1000); await P.shot('zh-3-lobby-done');
  const day = await P.ev(() => ({ p: G.dayProgress(), chest: !!G.today().ruong, xp: G.S.xp }));
  // Học viện 4 tầng: phòng phát âm (nghe chọn pinyin), bài HSK tải theo cấp, hội thoại có pinyin, bài đo, kiểm tra tuần, thi Nền tảng
  const zx = {};
  await P.ev(() => { G.closeLesson(); G.openZhHall(); }); await wait(900); await P.shot('zh-5-hall');
  zx.hall = await P.ev(() => ({ floors: document.querySelectorAll('.zh-floor').length, rooms: document.querySelectorAll('.zh-room').length }));
  await P.ev(() => { G.closeLesson(); G.openLesson('zh-n01'); }); await wait(1500);
  zx.n01 = await loop(P, (x) => __qa.lesson(x), 'zh-n01', 300, 450, /^(finish|closed)$/);
  await P.ev(() => { G.closeLesson(); G.openLesson('zh-l001'); }); await wait(2500); await P.shot('zh-6-hsk1');
  zx.l001 = await loop(P, (x) => __qa.lesson(x), 'zh-l001', 400, 450, /^(finish|closed)$/);
  zx.p = await P.ev(() => ({ n01: G.S.phong['zh-n01'], l001: G.S.phong['zh-l001'], c1: !!(G.ZH_LOADED && G.ZH_LOADED['data/zh_c1.js']), c3: !!(G.ZH_LOADED && G.ZH_LOADED['data/zh_c3.js']) }));
  await P.ev(() => { G.closeLesson(); G.S.phong['zh-l002'] = { sao: 1, diem: 8 }; G.openLife('zh-school'); }); await wait(900);
  zx.talk = await loop(P, () => {
    const q = window.__qa; let s;
    if ((s = q.all('#panel-body .menu3 button.big:not(.done)')[0]) && !document.querySelector('.chatlog')) { s.click(); return 'talk'; }
    window.__zhTalkPy = Math.max(window.__zhTalkPy || 0, document.querySelectorAll('#panel-body .chatlog .py').length);
    const o = q.all('#panel-body .chatopts .opt').filter((x) => x.className.indexOf(' no') < 0)[0]; if (o) { o.click(); return 'reply'; }
    return document.querySelector('#panel-body .result') ? 'done' : 'wait';
  }, null, 80, 700, /^done$/);
  zx.talkPy = await P.ev(() => window.__zhTalkPy || 0); await P.shot('zh-7-talk');
  await P.ev(() => { G.closeLesson(); G.openZhPlacement(function () {}); }); await wait(2500);
  zx.pl = await loop(P, () => __qa.zhTest(), null, 200, 600, /^(result|closed)$/); await P.shot('zh-8-placement');
  zx.dv = await P.ev(() => ({ lv: G.S.dauVao && G.S.dauVao.lv, start: G.S.zhStart, next: G.zhNextLesson() && G.zhNextLesson().id }));
  await P.ev(() => { G.closeLesson(); G.openWeekly(); }); await wait(1500);
  zx.wk = await loop(P, () => __qa.zhTest(), null, 120, 600, /^(done|closed)$/);
  zx.wkr = await P.ev(() => (G.S.tuan || []).slice(-1)[0] || null);
  await P.ev(() => { G.closeLesson(); G.openLesson('zh-x1'); }); await wait(2500);
  zx.ex = await loop(P, () => __qa.zhTest(), null, 200, 600, /^(grad|done|fail|closed)$/); await wait(800); await P.shot('zh-9-cert');
  zx.cert = await P.ev(() => (G.S.totNghiep && G.S.totNghiep.zh && G.S.totNghiep.zh['Nền tảng']) || null);
  await P.ev(() => { document.querySelectorAll('.modal').forEach((m) => m.remove()); G.closeLesson(); G.goLobby(); }); await wait(800);
  const zhXpEnd = await P.ev(() => G.S.xp);
  const ok2 = zx.hall.floors === 4 && zx.p.n01 && zx.p.n01.diem >= 8 && zx.p.l001 && zx.p.l001.diem >= 8 && zx.p.c1 && !zx.p.c3 && zx.talk === 'done' && zx.talkPy > 0
    && zx.dv.lv >= 1 && zx.dv.start && zx.wkr && zx.wkr.tong >= 60 && zx.cert;
  report.push(`Trường Lạc trấn · Học viện: ${zx.hall.floors} tầng; Nền tảng 1 (nghe chọn pinyin) ${zx.p.n01 ? zx.p.n01.diem + '/10' : 'CHƯA QUA'}; HSK1 bài 1 ${zx.p.l001 ? zx.p.l001.diem + '/10' : 'CHƯA QUA'} (tải ${zx.p.c1 ? 'đúng' : 'THIẾU'} tệp cấp 1${zx.p.c3 ? ', TẢI THỪA cấp 3' : ''}); hội thoại ${zx.talk === 'done' ? 'xong, pinyin ' + zx.talkPy + ' dòng' : 'dừng ở "' + zx.talk + '"'}; bài đo ${zx.dv.lv !== undefined ? 'cấp ' + zx.dv.lv + ' → bắt đầu ' + zx.dv.start : 'CHƯA XONG'}; kiểm tra tuần ${zx.wkr ? zx.wkr.tong + '/100' : 'CHƯA XONG'}; thi Nền tảng ${zx.cert ? 'có chứng chỉ, hiểu ' + zx.cert.diem + '/' + zx.cert.tong : 'CHƯA ĐẠT (' + zx.ex + ')'}`);
  if (!ok2) problems.push('Trường Lạc trấn: Học viện / hội thoại / bài đo / thi chưa chạy hết');
  // bản đồ 3D Trường Lạc trấn (data/city_zh.js): vào từ nút đất sét ở Sảnh, Tiểu Long nói, đi qua 3 khu,
  // nói chuyện với Tiểu Mỹ ở cổng Học viện, vào Học viện mở bảng phòng học, về Sảnh
  await P.ev(() => { const b = [].filter.call(document.querySelectorAll('button.clay-btn'), (x) => /Trường Lạc/.test(x.textContent))[0]; b.click(); });
  await wait(7000); await P.shot('zh-10-city');
  const city = await P.ev(() => ({ c: G.W3D && G.W3D.city, s: G.debugState().scene, d3: G.debugState().mode3d, face: document.querySelector('#kai .kai-face img').getAttribute('data-asset'), goal: G.debugState().goal }));
  city.walk = [];
  for (const sid of ['center_zh', 'newtown_zh', 'oldtown_zh']) { await P.ev((x) => G.enterScene(x, { x: 778, y: 760, dir: 'up' }), sid); await wait(900); city.walk.push(await P.ev(() => G.debugState().scene)); }
  await P.ev(() => G.enterScene('center_zh', { x: 1050, y: 590, dir: 'up' })); await wait(1200);
  city.near = await P.ev(() => G.debugState().near);
  await P.ev(() => document.getElementById('act').click()); await wait(1200);
  city.talk = await P.ev(() => document.getElementById('panel').classList.contains('open') && document.getElementById('panel-title').textContent);
  await P.ev(() => { G.closeLesson(); G.enterScene('center_zh', { x: 1190, y: 540, dir: 'up' }); }); await wait(1200);
  await P.ev(() => document.getElementById('act').click()); await wait(1200);
  city.hall = await P.ev(() => document.getElementById('panel-title').textContent); await P.shot('zh-11-city-hall');
  // đồng cỏ ngoài phố (anh Han 25/11/2026): đi bộ ra khỏi phố cổ sang đồng cỏ, thấy vòng núi xa (Đơn R), tới mép thì dừng trước chân núi, quay về
  await P.ev(() => { G.closeLesson(); G.enterScene('oldtown_zh', { x: 150, y: 760, dir: 'left' }); }); await wait(1200);
  await P.ev(() => G.debugGo(-700, 760)); await wait(5000);
  city.out = await P.ev(() => { const s = G.debugState(), w = G.W3D.state(); return { s: s.scene, x: Math.round(s.x), out: Math.round(G.countryNow()), far: w.far, farShown: w.farShown, country: w.country, limit: G.debugFree(-1700, 760), radar: document.getElementById('radar-name').textContent }; });
  await P.shot('zh-12-country');
  await P.ev(() => G.debugGo(-1450, 760)); await wait(5000);
  city.edge = await P.ev(() => Math.round(G.debugState().x)); await P.shot('zh-13-mountains');
  await P.ev(() => G.debugGo(300, 760)); await wait(8000);
  city.back = await P.ev(() => ({ s: G.debugState().scene, x: Math.round(G.debugState().x), out: G.countryNow() }));
  await P.ev(() => { G.closeLesson(); G.goLobby(); }); await wait(900);
  const outOk = city.out.s === 'oldtown_zh' && city.out.x < -300 && city.out.out > 0 && city.out.far >= 8 && city.out.farShown >= 8 && city.out.country > 150
    && city.out.limit === false && /Đồng cỏ/.test(city.out.radar) && city.edge < -1200 && city.edge > -1530 && city.back.x > 0 && city.back.out === 0;
  const cityOk = city.c === 'zh' && city.d3 && city.s === 'oldtown_zh' && city.face === 'long_face.png' && /Học viện/.test(city.goal || '')
    && city.walk.join() === 'center_zh,newtown_zh,oldtown_zh' && /Tiểu Mỹ/.test(city.near || '') && /bạn cùng lớp/.test(city.talk || '') && /Học viện Hán ngữ/.test(city.hall || '') && outOk;
  report.push(`Trường Lạc trấn · bản đồ 3D: ${city.d3 ? '3D' : '2D'}, vào ${city.s}, Tiểu Long ${city.face === 'long_face.png' ? 'nói' : 'CHƯA'}; ghim "${city.goal}"; đi qua ${city.walk.join(' → ')}; ${city.near} → ${city.talk || 'KHÔNG MỞ'}; Học viện → ${city.hall}`);
  report.push(`Trường Lạc trấn · đồng cỏ: ra tới x ${city.out.x} (cách phố ${city.out.out} px, bản đồ nhỏ "${city.out.radar}"), ${city.out.country} cây đá, núi xa ${city.out.farShown}/${city.out.far} tấm; tới mép dừng ở x ${city.edge}${city.out.limit === false ? ', quá mép bị chặn' : ', QUÁ MÉP VẪN ĐI ĐƯỢC'}; quay về ${city.back.s} x ${city.back.x}${outOk ? '' : ' · CHƯA ĐẠT'}`);
  if (!cityOk) problems.push('Trường Lạc trấn: bản đồ 3D chưa chạy hết' + (outOk ? '' : ' (đồng cỏ ngoài phố)'));
  // về Brightford: hồ sơ tiếng Anh còn nguyên
  await P.ev(() => { const b = [].filter.call(document.querySelectorAll('.city-chip'), (x) => /Brightford/.test(x.textContent))[0]; b.click(); });
  await wait(1200);
  const en1 = await P.ev(() => ({ lang: G.lang(), xp: G.S.xp, viec: Object.keys(G.today().viec).length, zhXp: G.R.zh.xp }));
  const back = en1.lang === 'en' && en1.xp === en0.xp && en1.viec === en0.viec && en1.zhXp === zhXpEnd;
  const ok = switched && les.p && les.p.diem >= 8 && les.bai && day.p.done === day.p.all && day.chest && pyRows > 0 && back && wr.n >= 5 && /ngược chiều|chiều|thứ tự/i.test(wrongMsg);
  report.push(`Trường Lạc trấn: ${switched ? 'đổi sang tiếng Trung, hồ sơ riêng' : 'ĐỔI THÀNH PHỐ LỖI ' + JSON.stringify(a)}; phòng Phát âm ${les.p ? les.p.diem + '/10' : 'chưa qua'}, ${les.cards} thẻ ôn; nhiệm vụ ${day.p.done}/${day.p.all}${Object.keys(zlog).filter((k) => zlog[k] !== 'done').map((k) => ' · ' + k + ' dừng ở "' + zlog[k] + '"').join('')}, rương ${day.chest ? 'đã mở' : 'chưa'}, ${day.xp} XP tiếng Trung; truyện có pinyin ${pyRows} dòng; viết ${wr.n} chữ từng nét${/ngược chiều|chiều|thứ tự/i.test(wrongMsg) ? ', nét sai chiều bị báo' : ', NÉT SAI KHÔNG BỊ BÁO'}; về Brightford ${back ? 'XP và nhiệm vụ tiếng Anh còn nguyên' : 'LỆCH ' + JSON.stringify([en0, en1])}`);
  if (!ok) problems.push('Trường Lạc trấn: luồng học tiếng Trung chưa chạy hết');
  P.errs.forEach((e) => problems.push('tiếng Trung lỗi JS: ' + e)); [...new Set(P.fails)].forEach((f) => problems.push('tiếng Trung tệp hỏng: ' + f));
  await P.ctx.close();
}

// ---------- 4. lưu trên mây: đã đăng nhập, vào map và học thì không bị văng ra (lỗi 24/11/2026) ----------
// Supabase giả có nhớ bản lưu. Một máy: lưu ngoài phố chỉ đẩy lên, không nạp lại app. Máy khác lưu lúc đang ngoài phố:
// chờ, không đụng tiến độ, không ghi đè mây; về Sảnh mới gộp (có buổi của máy kia, giữ XP của máy này).
async function cloudFlow() {
  const ctx = await browser.newContext({ ...devices['iPhone 15 landscape'], serviceWorkers: 'block' });
  const cloud = { row: null, posts: 0 }, J = (o) => JSON.stringify(o), user = { id: 'qa-user', email: 'qa@test' };
  await ctx.route('**/*supabase.co/**', (r) => {
    const u = r.request().url(), m = r.request().method(), json = (b, s) => r.fulfill({ status: s || 200, contentType: 'application/json', body: J(b) });
    if (/settings/.test(u)) return json({ external: { google: false } });
    if (/\/auth\/v1\/token/.test(u)) return json({ access_token: 'a', refresh_token: 'r', expires_in: 3600, user });
    if (/connectlife_save/.test(u) && m === 'GET') return json(cloud.row ? [cloud.row] : []);
    if (/connectlife_save/.test(u) && m === 'POST') {
      const b = JSON.parse(r.request().postData() || '{}'); cloud.posts++;
      if (!cloud.row || b.luu_luc >= cloud.row.luu_luc) cloud.row = { data: b.data, luu_luc: b.luu_luc };
      return json([{ luu_luc: cloud.row.luu_luc }], 201);
    }
    return json([], /app_events/.test(u) ? 201 : 200);
  });
  const s0 = seed({ hhTang: 2, rank: 3, dauVao: dv(2) });
  cloud.row = { data: Object.assign({}, s0, { xp: 300, luuLuc: 3 }), luu_luc: 3 };   // trên mây: bản cũ hơn của chính máy này
  await ctx.addInitScript(DRV);
  await ctx.addInitScript(([s, u]) => {
    if (localStorage.getItem('qa-seed')) return;
    localStorage.setItem('qa-seed', 1); localStorage.setItem('thegioi-save-v1', JSON.stringify(s));
    localStorage.setItem('cl-cloud', JSON.stringify({ at: 'a', rt: 'r', exp: Date.now() + 3600e3, user: u }));
  }, [s0, user]);
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  // trang tự nạp lại giữa chừng (lỗi cũ) thì lệnh đang chạy hỏng: coi như bị văng ra, không dừng cả bộ soát
  const ev = (f, a) => p.evaluate(f, a).catch((e) => ({ navErr: String(e.message || e).slice(0, 80) }));
  await p.goto(BASE); await wait(3000);
  await ev(() => { document.querySelectorAll('.modal, .cgate').forEach((m) => m.remove()); window.__stay = 1; G.goCity('en'); });
  await wait(1500);
  // ngoài phố app tự lưu vài giây một lần (mỗi lần lưu đặt lại 5 giây chờ đồng bộ): gọi đồng bộ ngay như lúc hết 5 giây chờ
  await ev(() => { G.S.xp += 5; G.save(); G.cloudSync(); }); await wait(4000);
  const a = await ev(() => ({ stay: window.__stay === 1, city: getComputedStyle(document.getElementById('play')).display !== 'none', xp: G.S.xp }));
  const fine = a.stay && a.city && cloud.row.data.xp === a.xp;
  // máy khác (iPad) học thêm buổi en-a1-02 và lưu lúc máy này đang ngoài phố
  const other = JSON.parse(J(cloud.row.data)); other.phong = other.phong || {}; other.phong['en-a1-02'] = { sao: 2, diem: 9 }; other.luuLuc = cloud.row.luu_luc + 5000;
  cloud.row = { data: other, luu_luc: other.luuLuc };
  await ev(() => { G.S.xp += 7; G.save(); G.cloudSync(); }); await wait(4000);
  const b = await ev(() => ({ stay: window.__stay === 1, wait: G._cloudWait === true, notYet: !(G.S.phong || {})['en-a1-02'], xp: G.S.xp }));
  const held = b.stay && b.wait && b.notYet && !!cloud.row.data.phong['en-a1-02'];
  await ev(() => G.goLobby()); await wait(5000);
  const c = await ev(() => ({ got: !!(G.S.phong || {})['en-a1-02'], xp: G.S.xp }));
  const merged = c.got && c.xp === b.xp;
  report.push(`Mây: vào map lưu ${fine ? 'không bị văng ra' : 'BỊ VĂNG RA / KHÔNG ĐẨY LÊN ' + J(Object.assign({ cloudXp: cloud.row.data.xp }, a))}; máy khác lưu lúc ngoài phố: ${held ? 'chờ, không cắt ngang' : 'CẮT NGANG HOẶC GHI ĐÈ ' + J(Object.assign({ cloudCo: !!cloud.row.data.phong['en-a1-02'] }, b))}; về Sảnh: ${merged ? 'đã gộp buổi của máy kia, giữ XP ' + c.xp : 'CHƯA GỘP ĐỦ'}`);
  if (!fine) problems.push('mây: vào map lưu thì bị văng ra hoặc không đẩy lên');
  if (!held) problems.push('mây: máy khác lưu lúc đang ngoài phố thì bị cắt ngang / ghi đè');
  if (!merged) problems.push('mây: về Sảnh chưa gộp đủ tiến độ hai máy');
  errs.forEach((e) => problems.push('mây lỗi JS: ' + e));
  await ctx.close();
}

// node tools/qa-run.mjs [moi|moi1|dau-ra|quet|may|zh] để chạy riêng một phần (moi1: một người học A1, khoảng 3 phút; may: lưu trên mây; zh: Trường Lạc trấn, cả bản đồ 3D)
const ONLY = process.argv[2] || '';
if (!ONLY || ONLY === 'may') await cloudFlow();
if (!ONLY || ONLY === 'zh') await zhFlow();
if (ONLY === 'moi1') await newLearner('iPhone 15 landscape', 2, 'A1-iPhone-ngang');
if (!ONLY || ONLY === 'moi') {
  await newLearner('iPhone 15', 0, 'moi-tinh-iPhone-doc');
  await newLearner('iPhone 15 landscape', 2, 'A1-iPhone-ngang');
  await newLearner('iPad Pro 11 landscape', 3, 'A2-iPad');
}
if (!ONLY || ONLY === 'dau-ra') await outcome();
if (!ONLY || ONLY === 'quet') await crawl();
await browser.close(); server.close();
console.log(report.map((r) => '· ' + r).join('\n'));
console.log(problems.length ? '\n✗ ' + problems.length + ' vấn đề:\n' + [...new Set(problems)].map((x) => '  - ' + x).join('\n') : '\n✓ Đạt: học được trọn từ đầu, không lỗi JS, không tệp hỏng');
process.exit(problems.length ? 1 : 0);
