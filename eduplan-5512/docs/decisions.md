# Nhật ký quyết định — EduPlan KHBD AI

| Ngày | Quyết định | Lý do |
|---|---|---|
| 28/10/2026 | EduPlan 5512 CoPilot là 1 file HTML, dữ liệu IndexedDB trên trình duyệt | Yêu cầu single-file, không backend |
| 28/10/2026 | Đặt app tại `eduplan-5512/`, không đè `index.html` của StatsPro | Repo đang chứa app Vite khác |
| 10/11/2026 | Slug VPS `eduplan` → eduplan.thaykhoa-ai.tech | Ngắn, đúng tên app |
| 13/11/2026 | Dựng khung 4+3 thư mục trong `eduplan-5512/` cho bản gộp v1.1 | Chuẩn dự án AI của TS. Khoa |
| 13/11/2026 | Dừng trước khi code bản gộp | Mục 11: thiếu master prompt v1.0 và văn bản pháp lý trong data/raw; cần duyệt audit + bảng ánh xạ |
| 13/11/2026 | Đề xuất di trú bằng mô-đun JS trong trình duyệt, cùng origin; `migrate_eduplan.py` xử lý tệp JSON sao lưu | Dữ liệu cũ chỉ nằm trên IndexedDB của từng máy (xem eduplan-audit.md) |
