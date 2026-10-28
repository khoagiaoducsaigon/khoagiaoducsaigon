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

## C. Bật cơ sở dữ liệu đám mây Supabase (dùng chung toàn trường, thời gian thực)
1. Tạo dự án miễn phí tại **supabase.com** → chọn vùng **Southeast Asia (Singapore)**.
2. Mở ứng dụng → màn hình đăng nhập → **"Cấu hình máy chủ đám mây (Supabase)"** → **Sao chép SQL**.
   Trên Supabase: **SQL Editor** → dán → **Run** (chạy 1 lần, chạy lại vẫn an toàn).
3. **Authentication → Sign In / Providers → Email**: trường nội bộ có thể tắt *Confirm email*.
   Nếu bật: **Authentication → URL Configuration → Site URL** = `https://ncbh.thaykhoa-ai.tech`.
4. **Project Settings → API**: sao chép **Project URL** và khóa **anon public** → dán vào hộp cấu hình → **Kiểm tra kết nối** → **Lưu & kết nối**.
   ⚠️ Không bao giờ dùng khóa `service_role` trên web.
5. Đăng ký tài khoản **đầu tiên** → tự động là **Admin**. Giáo viên đăng ký sau sẽ ở trạng thái *chờ duyệt*; BGH duyệt tại **Admin Dashboard → Hàng chờ phê duyệt**.
6. Để mọi giáo viên **không phải tự cấu hình**: mở `index.html`, điền vào dòng
   `const CLOUD_PRESET = { url: '', anonKey: '' };` rồi tải lại tệp lên hosting.
7. Dữ liệu mẫu/cục bộ cũ: sau khi Admin đăng nhập lần đầu, **Admin Dashboard** hiện nút
   **"Đẩy dữ liệu cục bộ cũ lên mây"**. Hoặc dùng **Gộp JSON lên mây** với tệp sao lưu.

### Bảo mật đã kiểm thử (PostgreSQL 16 thật, 11 kịch bản)
| Kịch bản | Kết quả |
|---|---|
| Khách chưa đăng nhập đọc dữ liệu | Bị từ chối |
| Tài khoản chờ duyệt / bị khóa đọc hoặc ghi | Không thấy gì, ghi bị chặn |
| Người lạ tự khai vai trò Admin khi đăng ký | Vẫn ở trạng thái chờ duyệt |
| GV tự nâng quyền / đổi vai trò người khác | Bị trigger và RLS chặn |
| Giả mạo "người ghi" (updated_by) | Máy chủ ghi đè bằng danh tính thật |
| Sửa hoặc xóa nhật ký hệ thống | Chỉ Admin được xóa, không ai được sửa |
