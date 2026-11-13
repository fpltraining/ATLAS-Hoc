/* Đồng bộ tiến độ học lên Supabase (bảng atlas_state, một dòng mỗi tài khoản).

   Cách làm đơn giản, đủ cho một người học trên một hoặc hai máy:
     - mở app: lấy bản trên mạng; bản mạng mới hơn và máy chưa có gì đổi thì dùng bản mạng;
     - học tới đâu: 20 giây sau lần đổi cuối thì đẩy cả gói lên, đóng app hoặc có mạng lại cũng đẩy;
     - hai máy cùng đổi khi chưa kịp đồng bộ: bản nào sửa sau cùng thì giữ bản đó. */

import * as store from './store.js';
import { getClient } from './auth.js';

const DELAY = 20000;
let uid = null;
let timer = 0;
let quiet = false;
let state = { at: null, status: 'Chưa đồng bộ', busy: false };
const listeners = new Set();

const K = {
  dirty: () => `atlas-dirty-${uid}`,
  synced: () => `atlas-synced-${uid}`,
};
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};

export const syncState = () => state;
export const onSync = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
function set(patch) { state = { ...state, ...patch }; for (const fn of listeners) fn(state); }

function markDirty() {
  if (quiet || !uid) return;
  if (!ls.get(K.dirty())) ls.set(K.dirty(), String(Date.now()));
  clearTimeout(timer);
  timer = setTimeout(push, DELAY);
}

/** Bắt đầu theo dõi thay đổi và lấy bản trên mạng (đợi tối đa vài giây để không treo khi mạng yếu) */
export async function start(userId) {
  uid = userId;
  store.setChangeListener(markDirty);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && ls.get(K.dirty())) push();
    if (document.visibilityState === 'visible') pull({ rerender: true });
  });
  window.addEventListener('online', () => sync());
  setInterval(() => { if (ls.get(K.dirty())) push(); }, 5 * 60000);
  await Promise.race([pull(), new Promise((r) => setTimeout(r, 6000))]);
}

/** Lấy bản trên mạng. Trả về true nếu đã thay dữ liệu trên máy. */
export async function pull({ rerender = false } = {}) {
  if (!uid || state.busy || !navigator.onLine) return false;
  set({ busy: true, status: 'Đang lấy dữ liệu…' });
  try {
    const c = await getClient();
    const { data: row, error } = await c.from('atlas_state').select('data, updated_at').eq('user_id', uid).maybeSingle();
    if (error) throw error;
    const synced = Number(ls.get(K.synced()) || 0);
    const dirty = Number(ls.get(K.dirty()) || 0);
    if (!row) {
      set({ busy: false });
      await push();
      return false;
    }
    const remoteAt = Date.parse(row.updated_at);
    if (remoteAt > synced && (!dirty || remoteAt > dirty)) {
      quiet = true;
      try { await store.replaceAll(row.data); } finally { quiet = false; }
      ls.set(K.synced(), String(remoteAt));
      ls.del(K.dirty());
      set({ busy: false, at: remoteAt, status: 'Đã lấy bản mới nhất' });
      if (rerender) window.dispatchEvent(new HashChangeEvent('hashchange'));
      return true;
    }
    set({ busy: false, at: synced || remoteAt, status: 'Đã đồng bộ' });
    if (dirty) await push();
    return false;
  } catch (e) {
    set({ busy: false, status: navigator.onLine ? 'Lỗi đồng bộ, sẽ thử lại' : 'Đang offline, sẽ đồng bộ khi có mạng' });
    return false;
  }
}

/** Đẩy cả gói dữ liệu trên máy lên mạng */
export async function push() {
  clearTimeout(timer);
  if (!uid || state.busy) return false;
  if (!navigator.onLine) { set({ status: 'Đang offline, sẽ đồng bộ khi có mạng' }); return false; }
  const startedAt = Date.now();
  set({ busy: true, status: 'Đang lưu lên mạng…' });
  try {
    const c = await getClient();
    const data = await store.exportAll({ mark: false });
    const { data: row, error } = await c.from('atlas_state')
      .upsert({ user_id: uid, data, updated_at: new Date().toISOString() })
      .select('updated_at').single();
    if (error) throw error;
    const at = Date.parse(row.updated_at);
    ls.set(K.synced(), String(at));
    if (Number(ls.get(K.dirty()) || 0) <= startedAt) ls.del(K.dirty());
    set({ busy: false, at, status: 'Đã đồng bộ' });
    return true;
  } catch (e) {
    set({ busy: false, status: 'Lỗi đồng bộ, sẽ thử lại' });
    clearTimeout(timer);
    timer = setTimeout(push, 60000);
    return false;
  }
}

export async function sync() {
  const changed = await pull({ rerender: true });
  if (!changed && ls.get(K.dirty())) await push();
}

/** Giờ Việt Nam cho dòng "đồng bộ lúc …" */
export function vnTime(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
}
