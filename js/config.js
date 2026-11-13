/* Cấu hình đăng nhập và đồng bộ qua Supabase.

   Để trống thì app chạy như cũ: không đăng nhập, dữ liệu chỉ nằm trên máy.
   Điền địa chỉ dự án và khoá anon (khoá công khai, an toàn khi để trong app vì
   bảng dữ liệu đã bật Row Level Security) để bật màn đăng nhập.
   Cách tạo bảng: supabase/migrations/20261113_atlas_state.sql */

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';
