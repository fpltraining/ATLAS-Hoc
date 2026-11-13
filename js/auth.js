/* Đăng nhập bằng tài khoản Supabase (email + mật khẩu).

   Chỉ bật khi js/config.js có địa chỉ dự án và khoá anon. Phiên đăng nhập được giữ
   trong máy, nên mở app khi không có mạng vẫn học được bằng tài khoản lần trước.
   Mỗi tài khoản dùng một cơ sở dữ liệu riêng trên máy: người đăng nhập đầu tiên
   trên máy nhận luôn dữ liệu đang có (dữ liệu học trước khi có đăng nhập). */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { h } from './ui.js';

const LIB = 'js/vendor/supabase-2.119.0.js';
const LAST = 'atlas-last-user';
const OWNER = 'atlas-db-owner';

export const configured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;
let user = null;

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* bỏ qua */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* bỏ qua */ } },
};

function loadLib() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = LIB;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Không tải được thư viện đăng nhập.'));
    document.head.append(s);
  });
}

export async function getClient() {
  if (client) return client;
  await loadLib();
  client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'atlas-auth' },
  });
  return client;
}

export const currentUser = () => user;

/** Tên cơ sở dữ liệu trên máy cho tài khoản này */
export function dbNameFor(uid) {
  const owner = ls.get(OWNER);
  if (!owner) { ls.set(OWNER, uid); return 'atlas'; }
  return owner === uid ? 'atlas' : `atlas-${uid}`;
}

function remember(u) {
  user = { id: u.id, email: u.email };
  ls.set(LAST, JSON.stringify(user));
  return user;
}

/* Bỏ phần mã đăng nhập Supabase gắn trên địa chỉ (sau khi bấm link trong email) */
function cleanHash() {
  if (/access_token|error_description|type=recovery|type=signup/.test(location.hash)) {
    history.replaceState(null, '', `${location.pathname}#/home`);
  }
}

/**
 * Bảo đảm đã đăng nhập. Hiện màn đăng nhập trong khung khởi động nếu cần.
 * Trả về { id, email }.
 */
export async function ensureLogin(host) {
  const wasRecovery = /type=recovery/.test(location.hash);
  let c;
  try {
    c = await getClient();
  } catch (e) {
    // Không tải được thư viện (mất mạng ở lần đầu): dùng tài khoản lần trước nếu có
    const last = JSON.parse(ls.get(LAST) || 'null');
    if (last) { user = last; return user; }
    throw e;
  }
  let session = null;
  try {
    ({ data: { session } } = await c.auth.getSession());
  } catch { /* mất mạng khi làm mới phiên */ }
  cleanHash();
  if (session?.user && wasRecovery) {
    remember(session.user);
    await newPasswordForm(host, c);
    return user;
  }
  if (session?.user) return remember(session.user);
  // Không có mạng mà máy đã từng đăng nhập: cho học tiếp, mạng có lại thì đồng bộ
  const last = JSON.parse(ls.get(LAST) || 'null');
  if (last && !navigator.onLine) { user = last; return user; }
  return loginForm(host, c);
}

function field(type, placeholder, autocomplete) {
  return h('input.scribble.login-input', { type, placeholder, autocomplete, autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false' });
}

function loginForm(host, c) {
  return new Promise((resolve) => {
    const email = field('email', 'Email', 'username');
    const pass = field('password', 'Mật khẩu (ít nhất 6 ký tự)', 'current-password');
    const msg = h('div.small.login-msg');
    const busy = (on) => { for (const b of form.querySelectorAll('button')) b.disabled = on; };
    const say = (t, bad = true) => { msg.textContent = t; msg.classList.toggle('bad', bad); };
    const vals = () => ({ email: email.value.trim(), password: pass.value });

    const login = async () => {
      const v = vals();
      if (!v.email || !v.password) return say('Nhập email và mật khẩu.');
      busy(true); say('Đang đăng nhập…', false);
      const { data, error } = await c.auth.signInWithPassword(v);
      busy(false);
      if (error) return say(/Invalid login/i.test(error.message) ? 'Sai email hoặc mật khẩu.'
        : /not confirmed/i.test(error.message) ? 'Email chưa được xác nhận. Mở thư xác nhận trong hộp thư rồi đăng nhập lại.'
          : navigator.onLine ? `Không đăng nhập được: ${error.message}` : 'Cần có mạng để đăng nhập lần đầu.');
      form.remove();
      resolve(remember(data.user));
    };
    const signup = async () => {
      const v = vals();
      if (!v.email || v.password.length < 6) return say('Nhập email và mật khẩu từ 6 ký tự trở lên.');
      busy(true); say('Đang tạo tài khoản…', false);
      const { data, error } = await c.auth.signUp({ ...v, options: { emailRedirectTo: location.origin + location.pathname } });
      busy(false);
      if (error) return say(/registered/i.test(error.message) ? 'Email này đã có tài khoản. Bấm Đăng nhập.' : `Không tạo được tài khoản: ${error.message}`);
      if (!data.session) return say('Đã tạo tài khoản. Mở email xác nhận trong hộp thư, bấm link rồi quay lại đăng nhập.', false);
      form.remove();
      resolve(remember(data.user));
    };
    const forgot = async () => {
      const v = vals();
      if (!v.email) return say('Nhập email trước, rồi bấm Quên mật khẩu.');
      busy(true);
      const { error } = await c.auth.resetPasswordForEmail(v.email, { redirectTo: location.origin + location.pathname });
      busy(false);
      say(error ? `Không gửi được: ${error.message}` : 'Đã gửi email đặt lại mật khẩu. Mở thư và bấm link trong đó.', !!error);
    };
    pass.addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });

    const form = h('div.login-card',
      h('h2', 'Đăng nhập'),
      h('p.small', 'Mỗi người một tài khoản. Tiến độ học được lưu lên mạng, đổi máy không mất.'),
      email, pass,
      h('button.btn.seal.block', { onclick: login }, 'Đăng nhập'),
      h('button.btn.block', { onclick: signup }, 'Tạo tài khoản mới'),
      h('button.btn.ghost.block', { onclick: forgot }, 'Quên mật khẩu'),
      msg,
    );
    host.append(form);
    setTimeout(() => email.focus(), 50);
  });
}

function newPasswordForm(host, c) {
  return new Promise((resolve) => {
    const pass = field('password', 'Mật khẩu mới (ít nhất 6 ký tự)', 'new-password');
    const msg = h('div.small.login-msg');
    const save = async () => {
      if (pass.value.length < 6) { msg.textContent = 'Mật khẩu cần từ 6 ký tự trở lên.'; return; }
      const { error } = await c.auth.updateUser({ password: pass.value });
      if (error) { msg.textContent = `Không đổi được: ${error.message}`; return; }
      form.remove();
      resolve();
    };
    const form = h('div.login-card', h('h2', 'Đặt mật khẩu mới'), pass,
      h('button.btn.seal.block', { onclick: save }, 'Lưu mật khẩu'), msg);
    host.append(form);
  });
}

export async function signOut() {
  try { await (await getClient()).auth.signOut({ scope: 'local' }); } catch { /* bỏ qua */ }
  ls.del(LAST);
  user = null;
  location.hash = '#/home';
  location.reload();
}
