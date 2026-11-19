/* Địa chỉ database Supabase để lưu tiến độ lên mây (đổi máy không mất, không cần sao lưu tay).
   Điền 2 dòng dưới từ Supabase → Project Settings → API: Project URL và khoá anon (public).
   Khoá anon được phép để trong app: bảng đã bật Row Level Security, mỗi người chỉ đọc/ghi được dòng của mình.
   Bảng cần tạo: supabase/migrations/20261119_connectlife_save.sql. Để trống thì app chỉ lưu trong máy như cũ. */
var G = window.G || (window.G = {});
G.CLOUD_URL = G.CLOUD_URL || '';
G.CLOUD_KEY = G.CLOUD_KEY || '';
