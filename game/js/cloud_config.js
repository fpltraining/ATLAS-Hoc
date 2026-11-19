/* Địa chỉ database Supabase để lưu tiến độ lên mây (đổi máy không mất, không cần sao lưu tay).
   Project Atlashoc trên Supabase. Project URL và khoá công khai (Publishable hoặc anon public) lấy ở Project Settings → API Keys.
   Khoá anon được phép để trong app: bảng đã bật Row Level Security, mỗi người chỉ đọc/ghi được dòng của mình.
   Bảng cần tạo: supabase/migrations/20261119_connectlife_save.sql. Để trống thì app chỉ lưu trong máy như cũ. */
var G = window.G || (window.G = {});
G.CLOUD_URL = G.CLOUD_URL || 'https://zevvrhxqsplhifgrnfsa.supabase.co';
G.CLOUD_KEY = G.CLOUD_KEY || 'sb_publishable_b9ozmqB3D5cVnIbJu3zltQ_ZGtuKZYz';   // khoá công khai (publishable), không phải khoá bí mật
/* true khi đã bật Google trong Supabase (Authentication → Sign In / Providers → Google): hiện nút "Tiếp tục với Google" */
G.CLOUD_GOOGLE = false;
