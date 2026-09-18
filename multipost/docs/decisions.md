# Nhật ký quyết định — MultiPost

## 2026-09-18 · Không dùng thư viện ngoài

**Bối cảnh.** Ứng dụng cần chạy được trên máy chủ của phường, máy cá nhân, VPS — nơi việc cài đặt phụ thuộc có thể vướng mạng hoặc quyền quản trị.

**Quyết định.** Dùng module có sẵn của Node 20+: `node:http` thay Express, `fetch` toàn cục thay axios, file JSON ghi nguyên tử thay SQLite.

**Đánh đổi.** Phải tự viết bộ định tuyến và phục vụ file tĩnh (khoảng 80 dòng). Bù lại `npm install` không còn cần thiết, không có rủi ro chuỗi cung ứng, và ứng dụng khởi động tức thì.

---

## 2026-09-18 · Upload bằng JSON base64, không dùng multipart

**Quyết định.** `POST /api/upload` nhận `{ name, mime, data }` với `data` là chuỗi base64.

**Lý do.** Tự viết bộ phân tích `multipart/form-data` cho đúng chuẩn tốn nhiều công và dễ sinh lỗi biên. Base64 làm phình 33% dung lượng — chấp nhận được với giới hạn 30MB, đổi lại toàn bộ đường đi dữ liệu chỉ còn một định dạng duy nhất là JSON.

---

## 2026-09-18 · Mỗi nền tảng một adapter độc lập

**Quyết định.** Mỗi nền tảng là một module xuất `{ id, limits, isConfigured, validate, publish }`. Bộ điều phối không biết gì về đặc thù từng API.

**Lý do.** Sáu nền tảng có sáu quy trình khác hẳn nhau: Facebook đăng một nhịp; Instagram và Threads phải tạo container rồi chờ xử lý xong mới publish; TikTok đăng bất đồng bộ; Telegram và WhatsApp gửi vòng lặp theo từng người nhận. Gói kín khác biệt đó trong adapter giúp thêm nền tảng mới (Zalo OA, LinkedIn, X) chỉ là thêm một file, không phải sửa frontend.

---

## 2026-09-18 · Thiếu khoá thì mô phỏng, không báo lỗi

**Quyết định.** Nền tảng chưa khai báo khoá trả về kết quả `simulated` kèm lý do, thay vì ném lỗi.

**Lý do.** Người dùng đánh giá công cụ trước khi bỏ công xin quyền ứng dụng của Meta và TikTok — quy trình có thể mất nhiều ngày. Cho phép chạy thử toàn bộ luồng ngay từ phút đầu là cách rút ngắn khoảng cách đó. Huy hiệu ở thanh trên cùng luôn hiển thị rõ đang ở chế độ nào để không nhầm lẫn.

---

## 2026-09-18 · Đăng song song, hợp nhất trạng thái

**Quyết định.** `Promise.all` cho tất cả nền tảng; kết quả tổng hợp thành `published` / `partial` / `failed`.

**Lý do.** Đăng tuần tự khiến sáu nền tảng mất tới hàng chục giây và một lỗi ở nền tảng đầu sẽ chặn phần còn lại. Trạng thái `partial` cùng nút "Đăng lại phần lỗi" cho phép xử lý đúng nền tảng hỏng mà không đăng trùng ở nơi đã thành công.
