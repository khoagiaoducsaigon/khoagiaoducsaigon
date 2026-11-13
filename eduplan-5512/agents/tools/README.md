# Công cụ dữ liệu (Python 3.11+, chạy bằng uv)

| Lệnh | Đầu ra |
|---|---|
| `uv run agents/tools/build_yccd.py` | `data/processed/yccd.json` — 10.853 YCCĐ của 20 môn/HĐGD (TT 32/2018), khóa `Y00001…` |
| `uv run agents/tools/build_khung.py` | `data/processed/nls.json` (CV 3456: 6 miền, 24 năng lực, 5 bậc) · `data/processed/ai.json` (QĐ 2422: 13 chủ đề, 282 YCCĐ mã chính thức `lớp.chủ_đề.số`) |

Hạn chế đã biết: Tiếng Anh tách theo chủ điểm/chủ đề (chưa phải YCCĐ chuẩn); một số năng lực số (2.4, 3.3, 3.4, 4.4) chưa tách được dòng biểu hiện theo bậc do bảng PDF gộp ô — app dùng phần mô tả năng lực.
