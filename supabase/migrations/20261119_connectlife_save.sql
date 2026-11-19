-- ConnectLife: tiến độ học của mỗi tài khoản, một dòng mỗi người (cả gói tiến độ dạng JSON).
-- Chạy một lần trong Supabase → SQL Editor. Đăng nhập bằng email + mật khẩu (Supabase Auth).

create table if not exists public.connectlife_save (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  luu_luc    bigint not null default 0,          -- thời điểm lưu trên máy (ms), bản mới hơn mới được ghi đè
  updated_at timestamptz not null default now()
);
alter table public.connectlife_save enable row level security;

drop policy if exists "cl_save_select_own" on public.connectlife_save;
create policy "cl_save_select_own" on public.connectlife_save for select using (auth.uid() = user_id);
drop policy if exists "cl_save_insert_own" on public.connectlife_save;
create policy "cl_save_insert_own" on public.connectlife_save for insert with check (auth.uid() = user_id);
drop policy if exists "cl_save_update_own" on public.connectlife_save;
create policy "cl_save_update_own" on public.connectlife_save for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bản lưu theo giờ (giữ 60 bản gần nhất mỗi người) để lỡ ghi nhầm vẫn lấy lại được
create table if not exists public.connectlife_save_history (
  id       bigserial primary key,
  user_id  uuid not null references auth.users (id) on delete cascade,
  data     jsonb not null,
  luu_luc  bigint,
  saved_at timestamptz not null default now()
);
alter table public.connectlife_save_history enable row level security;
drop policy if exists "cl_hist_select_own" on public.connectlife_save_history;
create policy "cl_hist_select_own" on public.connectlife_save_history for select using (auth.uid() = user_id);

-- Trước khi ghi đè: máy nào gửi bản cũ hơn bản trên mây thì giữ nguyên bản trên mây;
-- mỗi giờ cất một bản vào lịch sử.
create or replace function public.connectlife_before_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.luu_luc < old.luu_luc then
    return old;
  end if;
  if not exists (select 1 from connectlife_save_history h where h.user_id = old.user_id and h.saved_at > now() - interval '1 hour') then
    insert into connectlife_save_history (user_id, data, luu_luc) values (old.user_id, old.data, old.luu_luc);
    delete from connectlife_save_history h where h.user_id = old.user_id
      and h.id not in (select id from connectlife_save_history where user_id = old.user_id order by id desc limit 60);
  end if;
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists connectlife_before_update on public.connectlife_save;
create trigger connectlife_before_update before update on public.connectlife_save
  for each row execute function public.connectlife_before_update();
