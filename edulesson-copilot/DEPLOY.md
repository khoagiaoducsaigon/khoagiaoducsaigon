# Triển khai EduLesson lên ncbh.thaykhoa-ai.tech (Hostinger)

## A. Tạo sub-domain (hPanel, ~1 phút)
1. hPanel → **Websites** → chọn website `thaykhoa-ai.tech` → **Domains → Subdomains**.
2. Tên: `ncbh` → giữ tuỳ chọn thư mục mặc định (`public_html/ncbh`) → **Create**.
3. **Security → SSL**: cài SSL miễn phí cho `ncbh.thaykhoa-ai.tech` (thường tự cấp trong 5–15 phút).

## B1. Cách nhanh nhất – tải tay (~2 phút)
**Files → File Manager** → mở `public_html/ncbh` → **Upload** 2 tệp `index.html` và `.htaccess` trong thư mục này.
Mở https://ncbh.thaykhoa-ai.tech là chạy.

## B2. Cách tự động – mỗi lần sửa code là web tự cập nhật
1. hPanel → **Files → FTP Accounts** → tạo tài khoản FTP mới, thư mục gốc = `public_html/ncbh`.
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**, tạo:

| Secret | Giá trị |
|---|---|
| `FTP_SERVER` | Hostname FTP trong hPanel (vd `ftp.thaykhoa-ai.tech` hoặc IP) |
| `FTP_USERNAME` | Tên tài khoản FTP vừa tạo |
| `FTP_PASSWORD` | Mật khẩu tài khoản FTP đó |
| `FTP_SERVER_DIR` | *(tuỳ chọn)* bỏ trống nếu FTP account đã trỏ vào `public_html/ncbh` |

3. GitHub → **Actions → Deploy EduLesson to Hostinger → Run workflow**.
Từ đó, mỗi lần đẩy thay đổi trong `edulesson-copilot/` lên GitHub, web tự cập nhật.

> Mật khẩu chỉ nhập vào GitHub Secrets (được mã hoá), không gửi qua chat, không ghi vào code.

## C. Bật máy chủ dữ liệu MySQL trên Hostinger (dùng chung toàn trường) – ~5 phút
Không phát sinh chi phí, không tự tạm dừng, không giới hạn lượt đọc/ghi, dữ liệu nằm trên hosting của trường.

1. **hPanel → Databases → MySQL Databases** → tạo:
   - Tên cơ sở dữ liệu (vd `u123456789_ncbh`)
   - Tên người dùng (vd `u123456789_ncbh`) + **mật khẩu mạnh** → ghi lại 3 thông tin này.
2. Tải thư mục **`api/`** lên cùng chỗ với `index.html` (`public_html/ncbh/api/`) – bằng File Manager, hoặc GitHub Actions tự tải (mục B2).
3. Mở **https://ncbh.thaykhoa-ai.tech/api/install.php** → nhập 3 thông tin ở bước 1 → **Cài đặt máy chủ**.
   - Trang cài đặt tự tạo bảng + tệp `api/config.php`, sau đó **tự khóa**.
   - Vì an toàn chỉ chấp nhận máy chủ CSDL `localhost` (mặc định của Hostinger).
4. Mở lại **https://ncbh.thaykhoa-ai.tech** → ứng dụng **tự nhận ra máy chủ**, không cần cấu hình gì thêm.
5. **Đăng ký tài khoản đầu tiên** → tự động là **Admin (BGH)**.
6. Giáo viên tự đăng ký (email hoặc SĐT) → BGH duyệt ở **Admin Dashboard → Hàng chờ phê duyệt**.
   Hoặc BGH tạo sẵn tài khoản: **Quản trị người dùng → Thêm** (nhập mật khẩu → tài khoản đăng nhập được ngay).
7. Dữ liệu mẫu/cục bộ cũ: **Admin Dashboard → "Đẩy dữ liệu cục bộ cũ lên máy chủ"**, hoặc **Gộp JSON lên máy chủ**.
8. (Khuyến nghị) Sau khi cài xong, xóa tệp `api/install.php` trong File Manager.

### Quên mật khẩu / sao lưu
- GV quên mật khẩu → BGH vào **Quản trị người dùng → Sửa → Đặt lại mật khẩu**.
- Sao lưu: **Dữ liệu → Xuất toàn bộ (JSON)** trong ứng dụng, và/hoặc **hPanel → Databases → phpMyAdmin → Export**.
- Hostinger cũng có sao lưu tự động hằng tuần/ngày tùy gói (hPanel → Files → Backups).

### Bảo mật đã kiểm thử (PHP 8.3 + MariaDB 10.11 thật)
| Kịch bản | Kết quả |
|---|---|
| Khách chưa đăng nhập đọc dữ liệu | 401 – bị từ chối |
| Người lạ đăng ký và tự khai vai trò Admin | Chờ duyệt, không có phiên đăng nhập |
| GV tự nâng quyền / đổi tên đăng nhập / sửa hồ sơ người khác | Máy chủ giữ nguyên / 403 |
| SQL injection qua mã bản ghi, bảng lạ | Bị từ chối (truy vấn tham số hóa + kiểm tra định dạng) |
| Dò mật khẩu 8 lần | Tạm khóa đăng nhập 15 phút |
| Sửa / xóa nhật ký hệ thống | GV không được; chỉ Admin được xóa |
| Lô thao tác có 1 lệnh trái phép | Cả lô bị hủy (giao dịch toàn vẹn) |
| Admin khóa GV | Phiên của GV bị chặn ngay lập tức |
| Mật khẩu | Băm bcrypt (`password_hash`), không bao giờ gửi về trình duyệt |
| Tệp `config.php` chứa mật khẩu CSDL | Chặn truy cập web (.htaccess) + không đưa lên Git |
