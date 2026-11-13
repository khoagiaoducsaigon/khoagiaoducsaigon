# Nhật ký quyết định — EduPlan KHBD AI

| Ngày | Quyết định | Lý do |
|---|---|---|
| 28/10/2026 | EduPlan 5512 CoPilot là 1 file HTML, dữ liệu IndexedDB trên trình duyệt | Yêu cầu single-file, không backend |
| 28/10/2026 | Đặt app tại `eduplan-5512/`, không đè `index.html` của StatsPro | Repo đang chứa app Vite khác |
| 10/11/2026 | Slug VPS `eduplan` → eduplan.thaykhoa-ai.tech | Ngắn, đúng tên app |
| 13/11/2026 | Dựng khung 4+3 thư mục trong `eduplan-5512/` cho bản gộp v1.1 | Chuẩn dự án AI của TS. Khoa |
| 13/11/2026 | Dừng trước khi code bản gộp | Mục 11: thiếu master prompt v1.0 và văn bản pháp lý trong data/raw; cần duyệt audit + bảng ánh xạ |
| 13/11/2026 | Đề xuất di trú bằng mô-đun JS trong trình duyệt, cùng origin; `migrate_eduplan.py` xử lý tệp JSON sao lưu | Dữ liệu cũ chỉ nằm trên IndexedDB của từng máy (xem eduplan-audit.md) |
| 13/11/2026 | Nhận CV 5512 (thân văn bản), lưu data/raw/van-ban/, trích UTF-8 sang data/processed/ | Văn bản công khai, không thuộc raw/private |
| 13/11/2026 | Nạp CV 3456 (+ phụ lục khung NLS), QĐ 2422, CV 3083 HCM vào data/raw/van-ban | Nguồn cho luật năng lực số/AI (P8) |
| 13/11/2026 | Đề xuất mã năng lực số dạng `miền.năng-lực.bậc` (vd 1.1.L6-7) | Phụ lục 3456 không có ký hiệu mã sẵn — chờ TS. Khoa xác nhận |
| 13/11/2026 | Nạp TT 32/2018 + 28 chương trình GDPT 2018 (tách từ ZIP nhúng), trích UTF-8 theo môn | Nguồn YCCĐ để rà soát mục tiêu KHBD bám chương trình |
| 13/11/2026 | Nạp Phụ lục IV CV 5512 (Khung KHBD THCS/THPT) và CV 2345 (PL3 Khung KHBD tiểu học) | App cần 2 khung KHBD theo cấp: TH dùng CV 2345, THCS–THPT dùng PL IV CV 5512 |
| 13/11/2026 | Lưu đề bài gốc EduPlan (gửi với tên "master prompt 1.0") vào prompts/system/eduplan-cu-dac-ta-goc.md | Đây là đặc tả app cũ, không phải v1.0 app soạn KHBD mà v1.1 tham chiếu |
