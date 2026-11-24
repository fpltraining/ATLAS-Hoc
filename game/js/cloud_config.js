/* Địa chỉ database Supabase để lưu tiến độ lên mây (đổi máy không mất, không cần sao lưu tay).
   Project Atlashoc trên Supabase. Project URL và khoá công khai (Publishable hoặc anon public) lấy ở Project Settings → API Keys.
   Khoá anon được phép để trong app: bảng đã bật Row Level Security, mỗi người chỉ đọc/ghi được dòng của mình.
   Bảng cần tạo: supabase/migrations/20261119_connectlife_save.sql. Để trống thì app chỉ lưu trong máy như cũ. */
var G = window.G || (window.G = {});
G.CLOUD_URL = G.CLOUD_URL || 'https://zevvrhxqsplhifgrnfsa.supabase.co';
G.CLOUD_KEY = G.CLOUD_KEY || 'sb_publishable_b9ozmqB3D5cVnIbJu3zltQ_ZGtuKZYz';   // khoá công khai (publishable), không phải khoá bí mật
/* Nút "Tiếp tục với Google" tự hiện khi Supabase đã bật Google (Authentication → Sign In / Providers → Google);
   app hỏi Supabase mỗi lần mở màn đăng nhập, không cần sửa dòng này. false = luôn ẩn. */
G.CLOUD_GOOGLE = 'auto';
/* Kho giọng đọc (audio/, khoảng 24.000 tệp mp3): để trống là tải cùng chỗ với app. Khi lượng người dùng tăng, chép thư mục audio/
   lên CDN (Cloudflare R2, Bunny…) rồi ghi địa chỉ vào đây, kết thúc bằng dấu /, ví dụ 'https://cdn.connectlife.vn/audio/'.
   Lưu ý: giọng đọc trên CDN chỉ được giữ bằng bộ nhớ đệm thường của trình duyệt; muốn học offline trọn vẹn thì để trống (cùng chỗ với app). */
G.AUDIO_BASE = G.AUDIO_BASE || '';
