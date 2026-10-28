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

## Việc có thể làm tiếp
- Xuất .docx chuẩn; nhập KHBD .docx để AI đọc; lưu tệp KHBD trên Supabase Storage; gọi Gemini qua Edge Function để giấu API key.
