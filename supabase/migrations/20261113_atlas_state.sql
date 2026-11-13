-- Tiến độ học của mỗi tài khoản ATLAS: một dòng mỗi người, cả gói dữ liệu ở dạng JSON.
create table if not exists public.atlas_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.atlas_state enable row level security;

-- Mỗi người chỉ đọc và ghi được dòng của chính mình
drop policy if exists "atlas_state_select_own" on public.atlas_state;
create policy "atlas_state_select_own" on public.atlas_state
  for select using (auth.uid() = user_id);

drop policy if exists "atlas_state_insert_own" on public.atlas_state;
create policy "atlas_state_insert_own" on public.atlas_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "atlas_state_update_own" on public.atlas_state;
create policy "atlas_state_update_own" on public.atlas_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
