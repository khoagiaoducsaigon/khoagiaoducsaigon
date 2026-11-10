# session.md — EduLesson Study CoPilot

## Bối cảnh
- Ứng dụng single-file `edulesson-copilot/index.html`: SHCM theo Nghiên cứu bài học (CV 1315/BGDĐT-GDTrH, CV 5555/BGDĐT-GDTrH).
- Stack: Tailwind CDN + Lucide CDN + Vanilla JS; IndexedDB (6 bảng) + LocalStorage (session, cấu hình AI); Gemini API hoặc Mock AI.

## Đã hoàn thành (28/10/2026)
- Auth đăng ký/đăng nhập (SHA-256), RBAC 4 vai trò, 1-Click Role Switcher.
- 5 phân hệ: Kế hoạch (B1) · Smart Logger (B2, timer, regex ghi nhanh) · Analytics (KPI, line chart, donut, heatmap, chẩn đoán regex, AI) · Biên bản 4 bước + 12 tiêu chí + so sánh KHBD (B3–4, in/PDF, Word, copy) · Admin (so sánh điểm trường, users, DB, audit).
- Dữ liệu mẫu: 6 user (mật khẩu 123456), 3 chu trình, 8 ghi chép dự giờ, 1 biên bản, 1 KHBD tinh chỉnh.
- Kiểm thử Playwright: không lỗi JS; KPI 82% · GV nói 38% · điểm nghẽn phút 18–22.

## Triển khai
- Đích: https://ncbh.thaykhoa-ai.tech (sub-domain ĐÃ TẠO 28/10/2026; chờ xác nhận upload + SSL) — hướng dẫn: `edulesson-copilot/DEPLOY.md`; workflow `.github/workflows/deploy-hostinger.yml` chờ chủ tài khoản tạo sub-domain + FTP secrets.

## v1.1 – Đồng bộ đám mây Supabase (28/10/2026)
- Supabase Auth + RLS + Realtime; IndexedDB làm bộ nhớ đệm; hàng đợi ngoại tuyến tự đẩy khi có mạng.
- SQL nhúng trong app (thẻ `#sqlSchema`), test trên PostgreSQL 16: 11/11 kịch bản bảo mật đạt.
- Test 2 trình duyệt với Supabase giả lập: 23/23 kịch bản đạt (realtime, duyệt TK, khóa TK, ngoại tuyến, không mất chữ đang gõ).
- Việc của chủ tài khoản: tạo dự án Supabase, chạy SQL, điền URL + anon key (xem DEPLOY.md mục C).

## v1.2 – Chuyển sang MySQL trên Hostinger (28/10/2026)
- Lý do: Supabase miễn phí tự tạm dừng khi ít dùng → chọn MySQL sẵn có trong gói hosting (ổn định, 0đ, không giới hạn lượt).
- `edulesson-copilot/api/`: index.php (API), schema.php, install.php (trình cài đặt tự khóa), .htaccess.
- Ứng dụng tự dò `api/` → tự vào chế độ máy chủ; cập nhật 4 giây/lần; hàng đợi ngoại tuyến; BGH tạo TK + đặt lại mật khẩu.
- Test thật PHP 8.3 + MariaDB 10.11: API bảo mật 24/24; đầu-cuối 2 trình duyệt 24/24; chế độ cục bộ không hồi quy.
- Việc của chủ tài khoản: tạo MySQL DB trên hPanel → upload api/ → mở api/install.php (DEPLOY.md mục C).

## Đưa lên VPS (10/11/2026) – chờ chạy .bat
- Bộ triển khai: `deploy/vps-edulesson/` (build-deploy.sh → deploy-edulesson.sh tự chứa; trien-khai-edulesson.bat).
- Đích: https://edulesson.thaykhoa-ai.tech (Caddy tĩnh, thư mục /opt/eduscience/portal/edulesson).
- Đã chạy thử trên VPS mô phỏng: IP xung đột → dừng; validate lỗi → khôi phục; lần đầu đủ 6 bước; chạy lại không trùng.
- Còn lại: anh/chị chạy .bat từ Windows + thêm bản ghi A `edulesson` → 72.62.72.204 trong hPanel khi script nhắc.

## Kịch bản review 25 giây (Reels/Shorts) – 10/11/2026
- 6 phân cảnh: Hook → Smart Logger → Bản đồ nhiệt + AI → Biên bản CV 1315 → Admin CV 5555 → CTA. Lời đọc khoảng 105 âm tiết, khung 9:16.

## Lời giới thiệu cho người mới – 10/11/2026
- Đã soạn trong chat: app là gì, dành cho ai, bắt đầu trong 3 phút, 4 vai trò, 5 phân hệ, mẹo, an toàn dữ liệu.

## Việc có thể làm tiếp
- Xuất .docx chuẩn; nhập KHBD .docx để AI đọc; lưu tệp KHBD trên Supabase Storage; gọi Gemini qua Edge Function để giấu API key.
