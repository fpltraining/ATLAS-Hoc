"""Máy chủ thử nghiệm cho Bút Hán.

    python tools/serve.py

Khác gì so với `python -m http.server`?

  * Xử lý được NHIỀU yêu cầu cùng lúc. Bản có sẵn của Python chỉ phục vụ
    một yêu cầu tại một thời điểm, nên khi app tải mấy mảnh dữ liệu nét
    cùng lúc là kết nối bị đứt.
  * Lắng nghe trên mọi địa chỉ mạng và IN SẴN đường dẫn để mở trên iPad.
  * Tắt bộ nhớ đệm, để sửa code xong tải lại là thấy ngay.
"""

import http.server
import socket
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8123


class Handler(http.server.SimpleHTTPRequestHandler):
    # Mặc định là HTTP/1.0: đóng kết nối sau mỗi tệp, nên mở một bài học phải
    # bắt tay TCP lại vài chục lần. Qua Wi-Fi tới iPad, chừng đó lượt bắt tay là
    # thấy rõ độ trễ. HTTP/1.1 giữ kết nối lại để dùng tiếp.
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        # Đang phát triển thì không nên để trình duyệt giữ bản cũ
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        # Chỉ ghi lỗi, không ghi mọi yêu cầu cho đỡ rối màn hình.
        # Phải dò cẩn thận: hàm này được gọi với số tham số khác nhau tuỳ chỗ,
        # đọc thẳng args[1] là có lúc vỡ và làm chết luôn luồng phục vụ.
        if any(str(a).startswith(("4", "5")) and len(str(a)) == 3 for a in args):
            super().log_message(fmt, *args)


class ThreadedServer(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True
    # Mở một bài học là hàng chục yêu cầu bắn đi gần như cùng lúc (module, mảnh
    # nét, ảnh). Hàng đợi mặc định chỉ 5 chỗ, quá ngắn cho loạt đó — chỗ thừa bị
    # từ chối thẳng và trình duyệt báo ERR_CONNECTION_RESET giữa chừng.
    request_queue_size = 128


def local_ip():
    """Địa chỉ IP trong mạng LAN, để iPad truy cập được."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))      # không gửi gì cả, chỉ để hỏi hệ điều hành
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


if __name__ == "__main__":
    ip = local_ip()
    print()
    print("  But Han dang chay")
    print(f"  Tren may nay : http://localhost:{PORT}")
    if ip:
        print(f"  Tren iPad    : http://{ip}:{PORT}")
        print()
        print("  Mo dia chi tren bang Safari cua iPad (iPad phai cung mang Wi-Fi).")
    else:
        print("  Khong doc duoc dia chi IP - hay chay lenh ipconfig de xem.")
    print()
    print("  Nhan Ctrl+C de dung.")
    print()

    with ThreadedServer(("0.0.0.0", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  Da dung may chu.\n")
