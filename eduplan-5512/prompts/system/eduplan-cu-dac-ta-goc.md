# Đặc tả gốc của EduPlan 5512 CoPilot (bản đang chạy — "EduPlan cũ")

> Nguồn: đề bài TS. Phạm Đăng Khoa giao ngày 28/10/2026, gửi lại ngày 13/11/2026 với tên "master prompt 1.0".
> Đây là đặc tả của **app EduPlan hiện có** (`index.html`), KHÔNG phải "app soạn KHBD v1.0" mà master prompt v1.1 tham chiếu (P1–P13, schema 3B, luật 3C, chuỗi soạn 5 bước).

## Tóm tắt yêu cầu
- 1 file HTML; Tailwind CDN; Lucide; Vanilla JS; Gemini API key trong localStorage; mặc định Mock AI.
- Auth + RBAC 3 vai trò (BGH/Admin, Tổ trưởng, Giáo viên) + 1-Click Role Switcher.
- IndexedDB + LocalStorage, 5 bảng: users, lesson_plans, ai_audits, review_notes, audit_logs; lọc đa chiều; sao lưu/khôi phục JSON/CSV.
- 4 phân hệ: (1) AI Workspace rà soát 5512 — 3 bài mẫu, 2 đồng hồ chỉ số, bảng kiểm 4 bước, đề xuất tinh chỉnh, Lưu CSDL / Gửi Tổ trưởng duyệt; (2) Phiếu nhận xét chuẩn Sở — Sao chép nhanh, In A4; (3) Kho hồ sơ — mở lại, lịch sử phiên, tải bản tối ưu; (4) Admin Dashboard — 88.6%, biểu đồ theo tổ, quản lý người dùng, audit logs, xuất dữ liệu.
- Dữ liệu mẫu: 6 user, 3 KHBD, 5 phiếu duyệt, 15 log.

Mọi tên nút, trạng thái, luồng trong đặc tả này là "thói quen thao tác" phải giữ khi gộp (mục 0 và P9/P12 của v1.1).
