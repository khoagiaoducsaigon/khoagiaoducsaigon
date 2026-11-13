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

## 10/11/2026 — Đưa lên VPS (skill dua-app-len-vps)
- Phiên cloud KHÔNG ssh được (không có khóa, cổng 22 bị chặn, chưa kết nối máy tính qua Remote Control) → chưa triển khai, chưa curl.
- Đã soạn bộ triển khai: `eduplan-5512/deploy/deploy-windows.cmd` (scp + ssh) và `deploy-vps.sh` (chép file, thêm khối Caddy + validate/khôi phục, sửa apps.json + index.html cổng ứng dụng kèm sao lưu, reload, restart proxy khi DNS đúng, curl kiểm tra). Chạy lại nhiều lần không bị trùng.
- Slug: `eduplan` → https://eduplan.thaykhoa-ai.tech
- Còn lại: thêm bản ghi A `eduplan` → 72.62.72.204 trên hPanel; chạy deploy-windows.cmd; đối chiếu kết quả curl (200, đúng dung lượng, tls=0, title "EduPlan 5512 CoPilot").

## 13/11/2026 — Master prompt v1.1 (bản gộp soạn KHBD + EduPlan)
- Đã dựng khung 4+3 trong eduplan-5512/ (prompts, data/raw/private, agents, evals, outputs, docs, CLAUDE.md, .gitignore).
- Đã làm 2B·B1 (khảo sát từ mã nguồn, CHƯA đối chiếu VPS): docs/eduplan-audit.md. 2B·B3 nháp: docs/eduplan-mapping.md.
- Phát hiện then chốt: dữ liệu cũ chỉ ở IndexedDB từng trình duyệt → di trú trong trình duyệt, cùng origin eduplan.thaykhoa-ai.tech; eduplan-old không thấy dữ liệu.
- ĐANG DỪNG (mục 11): thiếu master prompt v1.0; thiếu CV 5512 (PL IV, V), CV 2345, CV 3456, QĐ 2422, CT môn trong data/raw; chờ duyệt audit + ánh xạ.
- 13/11: Đã nhận CV 5512 (.doc, chỉ thân văn bản, thiếu Phụ lục 1–4 và tiêu chí phân tích bài dạy). Xem data/raw/van-ban/README.md. Vẫn dừng: thiếu v1.0, phụ lục, CV 2345, 3456, QĐ 2422, CT môn.
- 13/11 (lần 2): Đã nạp CV 3456 + PL khung NLS, QĐ 2422 (khung GD AI), CV 3083 HCM (HĐTN). CV 5512 gửi lại trùng bản cũ (vẫn thiếu phụ lục). Còn thiếu: PL CV 5512, CV 2345, CT môn, master prompt v1.0.
- 13/11 (lần 3): Đã nạp TT 32/2018 + 28 CT môn (data/processed/ct-gdpt-2018/). Còn thiếu: PL CV 5512, CV 2345, master prompt v1.0; chờ duyệt audit + ánh xạ.
- 13/11 (lần 4): Đã có PL IV CV 5512 + CV 2345. Hồ sơ văn bản đủ để code. Còn: master prompt v1.0 (chặn), tiêu chí phân tích bài dạy "PL V" (chỉ cần cho dự giờ), duyệt audit + ánh xạ.
- 13/11 (lần 5): TS. Khoa gửi "master prompt 1.0" = đề bài gốc EduPlan (đã có). Vẫn thiếu master prompt v1.0 của APP SOẠN KHBD (P1–P13, 3B, 3C, chuỗi 5 bước). Hồ sơ văn bản: đủ trừ "PL V".
- 13/11 (lần 6): Đã soạn master prompt v1.0 nháp: prompts/system/master-prompt-v1.0-soan-khbd.md (P1–P13, 3B 14 store, 3C 24 luật có nguồn). Chờ duyệt v1.0 + audit + ánh xạ → rồi code theo v1.1.
- 13/11 (lần 7): Đã nhận PL V (12 tiêu chí/20 điểm) + PL II, III (CV 05/SGDĐT). Cập nhật v1.0. Hồ sơ văn bản ĐỦ. Chỉ còn chờ duyệt: v1.0, audit, ánh xạ.
