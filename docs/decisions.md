# decisions.md

| Ngày | Quyết định | Lý do |
|---|---|---|
| 28/10/2026 | Đặt EduLesson ở thư mục `edulesson-copilot/` thay vì `index.html` gốc | Gốc repo đang là ứng dụng StatsPro (Vite) – tránh ghi đè |
| 28/10/2026 | Biểu đồ vẽ bằng SVG/CSS thuần, không dùng thư viện chart | Giữ đúng yêu cầu chỉ Tailwind + Lucide + Vanilla JS, chạy được khi mở file trực tiếp |
| 28/10/2026 | Mock AI dùng bộ quy tắc Regex 5 nhóm nguyên nhân | Trải nghiệm ngay không cần API key; minh bạch, kiểm chứng được |
| 28/10/2026 | Gọi Gemini qua header `x-goog-api-key`, khóa lưu LocalStorage | Không lộ khóa trên URL; dữ liệu không rời trình duyệt ngoài Gemini |
