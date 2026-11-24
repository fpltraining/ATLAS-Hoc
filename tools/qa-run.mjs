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
  report.push(`Người mới ${tag}: đầu vào ${placed} → buổi ${id} ${pass ? pass.diem + '/10' : 'chưa qua'}${auto ? ' (tự mở)' : ''}, nhiệm vụ ${day.p.done}/${day.p.all} (${day.viec.join(', ')}), rương ${day.chest ? 'đã mở' : 'chưa'}${covered ? ', CÓ MÀN CHE BÀI ĐẦU' : ''}${Object.keys(qlog).filter((k) => qlog[k] !== 'done').map((k) => ' · ' + k + ' dừng ở "' + qlog[k] + '"').join('')}`);
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

// node tools/qa-run.mjs [moi|moi1|dau-ra|quet] để chạy riêng một phần (moi1: một người học A1, khoảng 3 phút)
const ONLY = process.argv[2] || '';
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
