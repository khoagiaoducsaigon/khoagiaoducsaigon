# 🚀 MultiPost — Đăng bài đồng thời lên 7 nền tảng

Soạn **một lần**, đăng cùng lúc lên **Facebook Page, Instagram, Threads, TikTok, Telegram, WhatsApp và Zalo OA**.
Full-stack, không phụ thuộc thư viện ngoài — chỉ cần Node.js 20 trở lên là chạy được ngay.

---

## Chạy trong 3 bước

```bash
cd multipost
cp .env.example .env      # điền khoá API (hoặc nhập trực tiếp trong tab Cài đặt)
npm start                 # mở http://localhost:8787
```

Không cần `npm install` — dự án dùng 100% module có sẵn của Node.

Muốn thử trước khi nối API thật:

```bash
DRY_RUN=1 npm start       # mô phỏng toàn bộ, không gọi API nào
```

---

## Tính năng

| Nhóm | Chi tiết |
|---|---|
| Soạn bài | Trình soạn chung, đếm ký tự/từ, chữ ký cuối bài, quản lý hashtag dạng thẻ, lưu mẫu tái sử dụng |
| Media | Kéo thả ảnh/video (≤ 30MB), hoặc dán URL công khai; xem trước thu nhỏ |
| Xem trước | Bản xem trước riêng cho từng nền tảng kèm bộ đếm giới hạn ký tự theo thời gian thực |
| Kiểm tra trước | Bắt lỗi trước khi đăng: thiếu media, vượt ký tự, quá 30 hashtag của Instagram… |
| Đăng song song | Gọi 7 API đồng thời bằng `Promise.all`, một nền tảng lỗi không kéo theo các nền tảng còn lại |
| Hẹn giờ | Bộ lập lịch chạy trong tiến trình server, quét mỗi 15 giây |
| Theo dõi | Lịch sử đầy đủ, bảng kết quả từng nền tảng, link bài đăng, thời gian xử lý, đăng lại phần lỗi |
| Bảo mật | Khoá lưu cục bộ, che khi hiển thị; tuỳ chọn `ADMIN_TOKEN` chặn truy cập giao diện |
| Giao diện | Tiếng Việt, sáng/tối, đáp ứng mọi kích thước màn hình |

---

## Kiến trúc

```
multipost/
├── server/
│   ├── index.js              Máy chủ HTTP, phục vụ file tĩnh, cổng bảo vệ ADMIN_TOKEN
│   ├── config.js             Đọc .env, gom thông tin kết nối
│   ├── store.js              Lưu trữ JSON có ghi nguyên tử
│   ├── routes.js             Toàn bộ API
│   ├── publisher.js          Điều phối đăng song song, kiểm tra, đăng lại
│   ├── scheduler.js          Vòng lặp bài hẹn giờ
│   └── platforms/            Mỗi nền tảng một adapter độc lập
│       ├── http.js           fetch có timeout, chuẩn hoá thông báo lỗi
│       ├── facebook.js  instagram.js  threads.js  tiktok.js
│       └── telegram.js  whatsapp.js   zalo.js
├── public/                   Giao diện (HTML + CSS + JS thuần)
├── data/                     db.json + media đã tải lên (không đưa lên git)
└── docs/decisions.md         Nhật ký quyết định kỹ thuật
```

**Thêm nền tảng mới** chỉ cần tạo một file trong `server/platforms/` theo giao diện sau rồi khai báo trong `index.js`:

```js
export default {
  id, name, emoji, color, limits, mediaSupport, credentialKeys, docs,
  isConfigured(creds) { … },      // đã đủ khoá chưa
  validate(payload)   { … },      // trả về mảng thông báo lỗi
  async publish(payload, creds) { … },  // trả về { externalId, url, note }
};
```

Giao diện, phần kiểm tra và bảng kết quả tự động nhận nền tảng mới — không phải sửa frontend.

---

## API

| Method | Đường dẫn | Công dụng |
|---|---|---|
| GET | `/api/health` | Kiểm tra máy chủ |
| GET | `/api/platforms` | Danh sách nền tảng + trạng thái kết nối |
| GET · POST | `/api/settings` | Đọc (đã che) / lưu thông tin kết nối |
| POST | `/api/validate` | Kiểm tra nội dung, không đăng |
| POST | `/api/upload` | Tải media lên (JSON base64) |
| GET · POST | `/api/posts` | Lịch sử · tạo bài (đăng ngay hoặc hẹn giờ) |
| GET · DELETE | `/api/posts/:id` | Xem · xoá |
| POST | `/api/posts/:id/retry` | Đăng lại riêng những nền tảng bị lỗi |
| POST | `/api/posts/:id/publish` | Đăng ngay bài đang hẹn giờ |
| POST | `/api/posts/:id/status` | Tra trạng thái xử lý (TikTok) |
| GET · POST | `/api/templates` | Mẫu nội dung |
| GET | `/api/stats` | Thống kê tổng hợp |

---

## Bốn điều dễ vấp

1. **Instagram, Threads và TikTok tải media từ URL** — chúng không nhận file trực tiếp. Khi tải ảnh từ máy lên, phải đặt `PUBLIC_BASE_URL` trỏ tới tên miền công khai (chạy thử thì dùng ngrok hoặc Cloudflare Tunnel). Giao diện sẽ cảnh báo nếu phát hiện `localhost`.
2. **WhatsApp có cửa sổ 24 giờ** — chỉ nhắn tự do trong 24 giờ kể từ tin nhắn cuối của người dùng. Ngoài khung đó phải dùng mẫu (template) đã được Meta duyệt.
3. **TikTok đăng bất đồng bộ** — API trả `publish_id` trước, video hoàn tất sau. Dùng nút **Kiểm tra trạng thái** trong tab Lịch sử.
4. **Token Zalo OA chỉ sống 1 giờ** — khai báo thêm `ZALO_APP_ID`, `ZALO_APP_SECRET` và `ZALO_OA_REFRESH_TOKEN` thì hệ thống tự làm mới và ghi lại token mới, không phải dán tay mỗi giờ. Zalo cấp refresh token **mới** sau mỗi lần làm mới, nên đừng dùng lại token cũ ở công cụ khác.

Nền tảng nào chưa khai báo khoá sẽ tự chuyển sang **chế độ mô phỏng** thay vì báo lỗi — nhờ vậy có thể dùng thử ngay từ phút đầu.

---

## Zalo OA — ba cách đăng

Đặt `ZALO_POST_MODE` để chọn:

| Giá trị | Hành vi | Dùng khi |
|---|---|---|
| `message` *(mặc định)* | Nhắn trực tiếp tới danh sách `ZALO_USER_IDS` | Thông báo cần tới tay từng người dân đã theo dõi OA |
| `article` | Tạo bài viết trên trang OA | Nội dung công khai, ai vào OA cũng đọc được |
| `both` | Làm cả hai | Thông báo quan trọng cần vừa đăng vừa đẩy tin |

Ở chế độ `article` không cần `ZALO_USER_IDS`. Ảnh gửi kèm tin nhắn được tải về rồi đẩy lên Zalo để lấy `attachment_id` — nên ảnh vẫn phải có URL truy cập được từ máy chủ.

---

## Biến môi trường

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `PORT` | `8787` | Cổng máy chủ |
| `PUBLIC_BASE_URL` | `http://localhost:$PORT` | URL công khai để các nền tảng tải media |
| `DRY_RUN` | `0` | `1` = mô phỏng toàn bộ |
| `ADMIN_TOKEN` | *(trống)* | Đặt giá trị để bắt buộc header `x-admin-token` |
| `GRAPH_API_VERSION` | `v21.0` | Phiên bản Meta Graph API |

Khoá từng nền tảng xem trong `.env.example` hoặc tab **Kết nối nền tảng** của giao diện.

---

## Quyền (scope) cần xin

| Nền tảng | Quyền |
|---|---|
| Facebook Page | `pages_manage_posts`, `pages_read_engagement` |
| Instagram | `instagram_basic`, `instagram_content_publish` |
| Threads | `threads_basic`, `threads_content_publish` |
| TikTok | `video.publish`, `video.upload` |
| Telegram | Bot phải là quản trị viên của kênh/nhóm |
| WhatsApp | `whatsapp_business_messaging` |
| Zalo OA | `oa.manage.message` (nhắn người theo dõi), `oa.manage.article` (đăng bài trên trang OA) |
