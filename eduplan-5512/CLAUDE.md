# EduPlan KHBD AI — bối cảnh dự án

- Chủ dự án: TS. Phạm Đăng Khoa. Trả lời bằng tiếng Việt, thân mật, dùng bảng khi có số liệu.
- Bản đang có: `index.html` (EduPlan 5512 CoPilot, single-file, IndexedDB `EduPlan5512DB`). Triển khai: `deploy/`.
- Đang làm: bản gộp v1.1 (soạn KHBD 5 bước + rà soát + duyệt 2 cấp + di trú). Master prompt v1.1 do chủ dự án gửi; **v1.0 chưa có trong repo**.
- Đọc trước khi làm: `session.md`, `docs/eduplan-audit.md`, `docs/eduplan-mapping.md`, `docs/decisions.md`.
- Khung thư mục: prompts/ · data/ (raw, raw/private, processed) · agents/ · evals/ · outputs/ · docs/.
- Nguyên tắc: dữ liệu nhạy cảm (sao lưu người dùng, mật khẩu băm, API key) chỉ ở `data/raw/private/`, không vào outputs, không gửi cho AI, không log ra ngoài. Mỗi quyết định quan trọng ghi `docs/decisions.md`.
- Điểm dừng bắt buộc: xem mục 11 master prompt v1.1.
