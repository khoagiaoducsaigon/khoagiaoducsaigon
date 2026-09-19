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

---

## 2026-09-19 · Bổ sung Zalo OA với cơ chế tự làm mới token

**Bối cảnh.** Zalo là kênh chạm tới người dân hiệu quả nhất ở cấp phường, nhưng Open API của Zalo khác hẳn năm nền tảng kia ở hai điểm: access token chỉ sống một giờ, và API trả về HTTP 200 kèm mã lỗi nằm trong thân tin (`error !== 0`) thay vì dùng mã trạng thái HTTP.

**Quyết định.** Adapter Zalo tự kiểm tra `error` trong thân tin thay vì dựa vào `res.ok`. Khi gặp mã lỗi token, adapter tự gọi `oauth.zaloapp.com` làm mới một lần rồi thử lại; token mới được ghi thẳng vào `data/db.json`.

**Điểm phải cẩn thận.** Zalo cấp **refresh token mới** sau mỗi lần làm mới và vô hiệu hoá token cũ. Nếu không lưu lại ngay, lần làm mới kế tiếp sẽ hỏng và phải vào trang quản trị lấy tay. Vì vậy thao tác lưu nằm ngay sau khi nhận phản hồi, trước cả lần gọi lại API.

**Đánh đổi.** Adapter Zalo phải nhập `store` để ghi token — phá vỡ nguyên tắc adapter thuần tuý của năm nền tảng còn lại. Chấp nhận đánh đổi này vì phương án thay thế là bắt người dùng dán token mỗi giờ, không dùng được trong thực tế.

---

## 2026-09-19 · Tách `requiredKeys` khỏi `credentialKeys`

**Vấn đề.** Zalo có sáu khoá cấu hình nhưng chỉ hai khoá là bắt buộc; bốn khoá còn lại phục vụ việc tự làm mới token. Thông báo "chưa cấu hình" liệt kê cả sáu khiến người dùng tưởng phải điền hết.

**Quyết định.** Thêm trường tuỳ chọn `requiredKeys`; khi không khai báo thì lấy `credentialKeys` như cũ. Biểu mẫu Cài đặt vẫn hiện đủ sáu ô, còn thông báo thiếu khoá chỉ nêu phần thật sự bắt buộc.

---

## 2026-09-19 · Lỗi xác thực dừng ngay, không lặp theo từng người nhận

**Vấn đề.** Zalo và WhatsApp gửi theo vòng lặp từng người nhận, mỗi lỗi được ghi kèm ID người nhận. Khi token hỏng, lỗi chung bị nhân lên thành N dòng gắn nhầm vào N người — vừa gọi API thừa N lần, vừa che mất nguyên nhân thật.

**Quyết định.** Lỗi xác thực được đánh dấu `fatal` và ném thẳng ra khỏi vòng lặp. Thông báo trả về đúng một dòng: "Zalo từ chối làm mới token".
