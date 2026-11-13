/* Lưu trữ cục bộ bằng IndexedDB: thẻ ôn, tiến độ, nhật ký, cài đặt.
   Mỗi tài khoản có một cơ sở dữ liệu riêng trên máy (useDatabase), nên nhiều người
   dùng chung một iPad không lẫn tiến độ. Đồng bộ lên mạng nằm ở sync.js. */

import { newCard } from './srs.js';

let DB_NAME = 'atlas';
const DB_VER = 1;
let dbp = null;

/** Chọn cơ sở dữ liệu trước khi đọc ghi lần đầu (mỗi tài khoản một cái). */
export function useDatabase(name) {
  if (name === DB_NAME) return;
  if (dbp) dbp.then((db) => db.close()).catch(() => {});
  DB_NAME = name;
  dbp = null;
  cachedSettings = null;
}

/* Báo cho phần đồng bộ mỗi khi dữ liệu học thay đổi */
let onChange = null;
export const setChangeListener = (fn) => { onChange = fn; };

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cards')) {
        const s = db.createObjectStore('cards', { keyPath: 'id' });
        s.createIndex('due', 'due');
      }
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('log')) db.createObjectStore('log', { keyPath: 'at' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

function tx(store, mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    let result;
    try { result = fn(s); } catch (e) { reject(e); return; }
    t.oncomplete = () => {
      if (mode === 'readwrite' && onChange) { try { onChange(); } catch { /* bỏ qua */ } }
      resolve(result instanceof IDBRequest ? result.result : result);
    };
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}

/* ---------- kho khoá-giá trị -------------------------------------------- */

export const kvGet = (k, dflt = null) =>
  tx('kv', 'readonly', (s) => s.get(k)).then((v) => (v === undefined ? dflt : v));

export const kvSet = (k, v) => tx('kv', 'readwrite', (s) => s.put(v, k));

/* Đọc rồi ghi phải xếp hàng theo từng khoá. Bộ đếm thời gian ghi vào 'days' mỗi
   lúc, nếu trùng đúng lúc người dùng đánh dấu xong một việc thì một trong hai
   lần ghi sẽ đè mất lần kia. */
const queues = new Map();

export function kvUpdate(key, dflt, fn) {
  const prev = queues.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    const cur = await kvGet(key, dflt);
    const out = (await fn(cur)) ?? cur;
    await kvSet(key, out);
    return out;
  });
  queues.set(key, next);
  return next;
}

/* ---------- thẻ ôn ------------------------------------------------------- */

export const allCards = () => tx('cards', 'readonly', (s) => s.getAll());
export const getCard = (id) => tx('cards', 'readonly', (s) => s.get(id));
export const putCard = (c) => tx('cards', 'readwrite', (s) => s.put(c));

export function putCards(cards) {
  return tx('cards', 'readwrite', (s) => { for (const c of cards) s.put(c); });
}

export async function dueCards(at = Date.now()) {
  const all = await allCards();
  return all.filter((c) => c.due <= at);
}

/** Thêm một từ tiếng Anh vào bộ ôn: nhìn từ nhớ nghĩa, và nghe nghĩa viết lại từ. */
export async function addEnWord(word, info = {}) {
  const w = String(word).trim();
  if (!w) return 0;
  const key = w.toLowerCase();
  const fresh = [];
  for (const type of ['en-recall', 'en-spell']) {
    const id = `${type}:${key}`;
    if (await getCard(id)) continue;
    const c = newCard(w, type, info.source || 'en');
    fresh.push({ ...c, id, lang: 'en', vi: info.vi || '', ipa: info.ipa || '', ex: info.ex || '', exVi: info.exVi || '' });
  }
  if (fresh.length) await putCards(fresh);
  return fresh.length;
}

/** Thêm câu hỏi của một bài kiến thức vào hàng ôn chung. */
export async function addKnowCard(lessonId) {
  const id = `know-q:${lessonId}`;
  if (await getCard(id)) return;
  await putCard({ ...newCard(lessonId, 'know-q', lessonId), id, lang: 'know' });
}

/* ---------- nhật ký lượt ôn --------------------------------------------- */

export function logReview(entry) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction('log', 'readwrite');
    const s = t.objectStore('log');
    let at = Date.now();
    const write = () => {
      const req = s.add({ ...entry, at });
      req.onerror = (e) => { e.preventDefault(); at += 1; write(); };
    };
    write();
    t.oncomplete = resolve;
    t.onerror = () => reject(t.error);
  }));
}

export const allLogs = () => tx('log', 'readonly', (s) => s.getAll());

/* ---------- cài đặt ------------------------------------------------------ */

export const DEFAULTS = {
  dailyMinutes: 120,      // quỹ thời gian mỗi ngày
  weekRhythm: true,       // thứ Bảy củng cố, Chủ nhật nhẹ
  strictness: 'de',
  brush: 'but-long',
  grid: 'tian',
  speechRate: 0.85,       // giọng tiếng Trung
  enRate: 0.85,           // giọng tiếng Anh
  penOnly: false,
  showHint: true,
  penSound: true,
  readSize: 22,           // cỡ chữ tiếng Anh trong bài đọc
  readMode: 'both',       // both: Anh trên Việt dưới · hide: che tiếng Việt
  theme: 'auto',
  aiVoice: true,          // phát giọng AI có sẵn thay cho giọng máy
  enVoice: '',           // tên giọng tiếng Anh đã chọn, rỗng là tự chọn giọng tốt nhất
  zhVoice: '',           // tên giọng tiếng Trung đã chọn
  aiUrl: '',             // địa chỉ hàm chấm bài trên Supabase, để trống là tắt
  aiKey: '',             // khoá anon của dự án Supabase
};

let cachedSettings = null;

export async function settings() {
  if (!cachedSettings) cachedSettings = { ...DEFAULTS, ...(await kvGet('settings', {})) };
  return cachedSettings;
}

export async function setSetting(key, value) {
  const s = await settings();
  s[key] = value;
  cachedSettings = s;
  await kvSet('settings', s);
  return s;
}

/* ---------- tiến độ tiếng Trung ----------------------------------------- */

export const lessonProgress = () => kvGet('lessons', {});

export function markLesson(id, patch) {
  return kvUpdate('lessons', {}, (all) => {
    all[id] = { ...(all[id] || {}), ...patch };
    return all;
  });
}

/* ---------- nhật ký từng ngày -------------------------------------------- */

export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const blankDay = () => ({ steps: {}, secs: {}, newEn: 0, newZh: 0, note: '', self: null });

export const allDays = () => kvGet('days', {});

export async function today() {
  const all = await allDays();
  return { ...blankDay(), ...(all[dayKey()] || {}) };
}

export function patchToday(fn) {
  const k = dayKey();
  return kvUpdate('days', {}, (all) => {
    const d = { ...blankDay(), ...(all[k] || {}) };
    fn(d);
    all[k] = d;
    return all;
  });
}

export const markStep = (key, on = true) => patchToday((d) => { d.steps[key] = on; });
export const addSeconds = (track, s) => patchToday((d) => { d.secs[track] = (d.secs[track] || 0) + s; });

/* ---------- tiến độ các nhánh -------------------------------------------- */

export const enState = () => kvGet('en', { stage: 0, sess: {} });
export const updateEn = (fn) => kvUpdate('en', { stage: 0, sess: {} }, fn);

export const readState = () => kvGet('read', { stories: {}, words: 0, secs: 0, current: null });
export const updateRead = (fn) => kvUpdate('read', { stories: {}, words: 0, secs: 0, current: null }, fn);

export const workState = () => kvGet('work', { done: {}, notes: {} });
export const updateWork = (fn) => kvUpdate('work', { done: {}, notes: {} }, fn);

export const knowState = () => kvGet('know', { done: {} });
export const updateKnow = (fn) => kvUpdate('know', { done: {} }, fn);

/* ---------- sao lưu / khôi phục ------------------------------------------ */

const KV_KEYS = ['settings', 'lessons', 'days', 'en', 'read', 'work', 'know', 'notes', 'writes', 'writeScores', 'bookWork', 'bookScore', 'bookPage', 'lastBackup',
  'challenge', 'games', 'examResults', 'speakScores'];

export async function exportAll({ mark = true } = {}) {
  const [cards, logs] = await Promise.all([allCards(), allLogs()]);
  const kv = {};
  for (const k of KV_KEYS) kv[k] = await kvGet(k);
  if (mark) await kvSet('lastBackup', dayKey());
  return { app: 'atlas', version: 1, exportedAt: new Date().toISOString(), cards, logs, kv };
}

/** Thay toàn bộ dữ liệu trên máy bằng bản lấy từ mạng (khác importAll là xoá trước). */
export async function replaceAll(data) {
  await tx('cards', 'readwrite', (s) => s.clear());
  await tx('log', 'readwrite', (s) => s.clear());
  await tx('kv', 'readwrite', (s) => { for (const k of KV_KEYS) s.delete(k); });
  cachedSettings = null;
  return importAll(data);
}

/**
 * Khôi phục. Nhận cả file sao lưu của app này lẫn của Bút Hán, Inklish và ATLAS cũ.
 * Trả về một câu mô tả đã nhập gì.
 */
export async function importAll(data) {
  if (data?.app === 'atlas') {
    if (Array.isArray(data.cards)) await putCards(data.cards);
    if (Array.isArray(data.logs)) await tx('log', 'readwrite', (s) => { for (const l of data.logs) s.put(l); });
    for (const [k, v] of Object.entries(data.kv || {})) if (v !== null && v !== undefined) await kvSet(k, v);
    cachedSettings = null;
    return `Đã khôi phục ${data.cards?.length || 0} thẻ và toàn bộ tiến độ.`;
  }
  if (data?.app === 'buthan') {
    const cards = (data.cards || []).map((c) => ({ ...c, lang: 'zh' }));
    await putCards(cards);
    if (data.lessons) await kvUpdate('lessons', {}, (cur) => ({ ...data.lessons, ...cur }));
    if (Array.isArray(data.logs)) await tx('log', 'readwrite', (s) => { for (const l of data.logs) s.put(l); });
    return `Đã nhập từ Bút Hán: ${cards.length} thẻ tiếng Trung và tiến độ các bài.`;
  }
  if (Array.isArray(data?.cards) && data?.sess) return importInklish(data);
  if (data?.completions || data?.wordCards) return importAtlas(data);
  throw new Error('Không nhận ra định dạng file sao lưu này.');
}

const DAY_MS = 86400000;

async function importInklish(d) {
  const cards = [];
  for (const c of d.cards) {
    if (!c.en) continue;
    const type = c.mode === 'recall' ? 'en-recall' : 'en-spell';
    const ivl = Math.max(0, Math.round(c.st || 0));
    cards.push({
      ...newCard(c.en, type, 'inklish'),
      id: `${type}:${c.en.toLowerCase()}`, lang: 'en', vi: c.vi || '',
      state: ivl ? 'review' : 'new', ivl, reps: c.reps || 0, lapses: c.lapses || 0,
      due: c.due ? new Date(`${c.due}T04:00:00`).getTime() : Date.now(),
    });
  }
  await putCards(cards);
  await updateEn((s) => {
    s.stage = Number(d.stage) || 0;
    for (const [st, m] of Object.entries(d.sess || {})) {
      s.sess[st] = s.sess[st] || {};
      for (const [n, v] of Object.entries(m)) s.sess[st][n] = { done: !!v.done, blocks: {}, doneAt: v.doneAt || v.date };
    }
    return s;
  });
  return `Đã nhập từ Inklish: ${cards.length} thẻ tiếng Anh, chặng ${Number(d.stage) || 0}.`;
}

async function importAtlas(d) {
  const today0 = Date.now();
  const cards = [];
  // File sao lưu của ATLAS chỉ giữ mã từ, nên phải tra lại nghĩa trong kho từ
  const dict = await fetch('data/en/dict.json').then((r) => r.json()).catch(() => ({}));
  for (const [id, c] of Object.entries(d.wordCards || {})) {
    const due = c.due ? new Date(`${c.due}T04:00:00`).getTime() : today0;
    const ivl = Math.max(1, Math.round((due - today0) / DAY_MS));
    const key = String(id).toLowerCase();
    const word = dict[key] ? key : key.replace(/[-_]/g, ' ');
    const [vi = '', ipa = ''] = dict[word] || [];
    for (const type of ['en-recall', 'en-spell']) {
      cards.push({ ...newCard(word, type, 'atlas'), id: `${type}:${word}`, lang: 'en', vi, ipa, state: 'review', ivl, due });
    }
  }
  await putCards(cards);
  await updateKnow((s) => {
    for (const c of d.completions || []) s.done[c.lesson_id] = { at: c.completed_at || c.at || '' };
    return s;
  });
  return `Đã nhập từ ATLAS: ${cards.length} thẻ tiếng Anh, ${(d.completions || []).length} bài kiến thức.`;
}
