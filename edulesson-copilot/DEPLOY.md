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
