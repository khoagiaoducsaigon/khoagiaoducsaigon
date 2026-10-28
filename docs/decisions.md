# decisions.md

| Ngày | Quyết định | Lý do |
|---|---|---|
| 28/10/2026 | Đặt EduLesson ở thư mục `edulesson-copilot/` thay vì `index.html` gốc | Gốc repo đang là ứng dụng StatsPro (Vite) – tránh ghi đè |
| 28/10/2026 | Biểu đồ vẽ bằng SVG/CSS thuần, không dùng thư viện chart | Giữ đúng yêu cầu chỉ Tailwind + Lucide + Vanilla JS, chạy được khi mở file trực tiếp |
| 28/10/2026 | Mock AI dùng bộ quy tắc Regex 5 nhóm nguyên nhân | Trải nghiệm ngay không cần API key; minh bạch, kiểm chứng được |
| 28/10/2026 | Gọi Gemini qua header `x-goog-api-key`, khóa lưu LocalStorage | Không lộ khóa trên URL; dữ liệu không rời trình duyệt ngoài Gemini |
| 28/10/2026 | Sub-domain `ncbh.thaykhoa-ai.tech` (NCBH = Nghiên cứu bài học) | Ngắn, đúng thuật ngữ ngành, dễ nhớ với GV |
| 28/10/2026 | Deploy bằng GitHub Actions + FTPS, mật khẩu trong GitHub Secrets | Claude không đăng nhập được hPanel; tự động hoá mà không lộ thông tin đăng nhập |
| 28/10/2026 | Supabase Auth thay cho mật khẩu băm tự quản ở chế độ đám mây | Không đưa mã băm mật khẩu lên bảng công khai; dùng hạ tầng xác thực chuẩn |
| 28/10/2026 | RLS: chỉ tài khoản `active` đọc/ghi; TK đầu tiên = Admin; TK mới chờ BGH duyệt | URL web công khai → bất kỳ ai cũng có thể đăng ký; phải chặn từ máy chủ |
| 28/10/2026 | Mỗi bảng dạng (id, data jsonb) + cột role/status riêng cho users | Ánh xạ 1-1 với IndexedDB, không phải viết lại logic ứng dụng |
| 28/10/2026 | Không tự vẽ lại màn hình khi người dùng đang gõ; hiện nút "Có cập nhật mới" | Realtime không được làm mất dữ liệu đang nhập |
| 28/10/2026 | Đăng xuất ở chế độ đám mây xóa bộ nhớ đệm cục bộ | Máy tính phòng GV dùng chung – không để lộ dữ liệu trường |
| 28/10/2026 | **Thay Supabase bằng MySQL trên Hostinger** (API PHP trong `api/`) | Supabase miễn phí tự tạm dừng khi ít dùng; MySQL đã có trong gói hosting, không giới hạn lượt, 0đ, cùng tên miền, dữ liệu do trường kiểm soát |
| 28/10/2026 | Cập nhật theo chu kỳ 4 giây (30 giây khi ẩn tab) thay cho WebSocket | Hosting chia sẻ không hỗ trợ WebSocket; 4 giây đủ nhanh cho SHCM; mỗi lần hỏi rất nhẹ (chỉ lấy thay đổi mới theo số rev) |
| 28/10/2026 | Trình cài đặt chỉ nhận CSDL `localhost`, tự khóa sau khi cài | Ngăn người lạ chiếm trang cài đặt trỏ ứng dụng sang CSDL của họ |
| 28/10/2026 | Ứng dụng tự dò `api/` cạnh index.html | Giáo viên không phải cấu hình gì; BGH chỉ cài 1 lần |
