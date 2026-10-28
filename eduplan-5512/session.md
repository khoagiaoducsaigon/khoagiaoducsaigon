# session.md — EduPlan 5512 CoPilot

## Trạng thái (28/10/2026)
- Đã xong: `eduplan-5512/index.html` (single-file, ~1.600 dòng) — Tailwind CDN + Lucide + Vanilla JS.
- Đặt trong thư mục riêng để không đè `index.html` của app Vite StatsPro ở gốc repo.
- Đã kiểm thử bằng Chromium headless: đăng nhập, chạy AI, áp dụng đề xuất, lưu/gửi duyệt, ký duyệt cấp tổ, lịch sử, dashboard, reset dữ liệu mẫu, reload (dữ liệu vẫn còn). Không có lỗi JS.

## Kiến trúc
- DB: IndexedDB `EduPlan5512DB` (5 bảng: users, lesson_plans, ai_audits, review_notes, audit_logs) + bản sao trong localStorage `eduplan5512.tbl.*`.
- Cài đặt: `eduplan5512.settings` (apiKey, model, tên trường); phiên đăng nhập: `eduplan5512.session`.
- AI: Gemini `v1beta/models/{model}:generateContent` (JSON mode) → lỗi thì tự chuyển sang Mock AI. Mock = kết quả dựng sẵn cho 3 bài mẫu + công cụ phân tích Regex cho văn bản tự do.
- Quy trình duyệt: Bản nháp → Chờ duyệt → (Tổ trưởng ký: vẫn Chờ duyệt, gắn "Tổ đã ký") → BGH: Đã duyệt đạt chuẩn / Yêu cầu chỉnh sửa.
- Dashboard: số liệu nền (BASELINE 364/409) + CSDL trực tiếp → dữ liệu mẫu cho 365/412 = 88,6%.

## Tài khoản mẫu (mật khẩu 123456)
u1 BGH hieutruong@ · u2 TT Toán tt.toan@ · u3 TT Ngữ văn tt.nguvan@ · u4 GV Toán mai.vt@ · u5 GV Văn bao.dq@ · u6 GV KHTN tam.nt@ (đuôi @eduplan.edu.vn)

## Việc có thể làm tiếp
- Xuất .docx thật (thư viện docx), đồng bộ cloud (Supabase/Firebase), biểu đồ xu hướng theo tháng.
