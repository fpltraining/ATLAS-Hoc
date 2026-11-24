-- Số liệu dùng app và lỗi, ẩn danh (game/js/track.js). Chạy một lần trong Supabase → SQL Editor.
-- Không có tên, email hay câu người học nói: chỉ có mã máy ngẫu nhiên, tên sự kiện và vài con số.
-- App chỉ được GHI (khoá công khai); xem số liệu trong Table Editor hoặc SQL Editor của Supabase.
create table if not exists public.app_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  device text not null,            -- mã máy ngẫu nhiên tạo trong app, không gắn với tài khoản
  ver text,                        -- phiên bản app (game/sw.js VERSION)
  name text not null,              -- mo_app, nhiem_vu, bai_qua, dau_vao, truyen, on_xong, bat_loi, tai_khoan, loi
  props jsonb not null default '{}'::jsonb
);
alter table public.app_events enable row level security;
drop policy if exists "ghi so lieu an danh" on public.app_events;
create policy "ghi so lieu an danh" on public.app_events
  for insert to anon, authenticated
  with check (char_length(name) <= 40 and char_length(device) <= 40 and coalesce(char_length(ver), 0) <= 40 and pg_column_size(props) <= 2000);
-- không tạo policy đọc: chỉ chủ project xem được
create index if not exists app_events_name_at on public.app_events (name, at desc);

-- Vài câu xem nhanh:
-- số máy mở app mỗi ngày (giờ Việt Nam):
--   select (at at time zone 'Asia/Ho_Chi_Minh')::date as ngay, count(distinct device) from app_events where name = 'mo_app' group by 1 order by 1 desc;
-- lỗi hay gặp nhất 7 ngày qua:
--   select props->>'msg' as loi, count(*) from app_events where name = 'loi' and at > now() - interval '7 days' group by 1 order by 2 desc limit 20;
-- tỉ lệ làm xong từng nhiệm vụ:
--   select props->>'id' as nhiem_vu, count(*) from app_events where name = 'nhiem_vu' group by 1;
