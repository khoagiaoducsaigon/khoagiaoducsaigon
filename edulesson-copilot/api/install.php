<?php
/**
 * EduLesson Study CoPilot – Trình cài đặt máy chủ (chạy 1 lần).
 * Tạo bảng trong MySQL và ghi api/config.php. Sau khi cài xong, trang này tự khóa.
 */
declare(strict_types=1);
require __DIR__ . '/schema.php';

$cfgFile = __DIR__ . '/config.php';
$installed = is_file($cfgFile);
$error = '';
$done = false;
$v = fn(string $k, string $d = '') => htmlspecialchars((string) ($_POST[$k] ?? $d), ENT_QUOTES, 'UTF-8');

if (!$installed && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $host = trim((string) ($_POST['db_host'] ?? 'localhost'));
    $port = (int) ($_POST['db_port'] ?? 3306) ?: 3306;
    $name = trim((string) ($_POST['db_name'] ?? ''));
    $user = trim((string) ($_POST['db_user'] ?? ''));
    $pass = (string) ($_POST['db_pass'] ?? '');
    try {
        // Chỉ chấp nhận CSDL trên chính máy chủ hosting – người lạ không thể trỏ ứng dụng sang CSDL của họ
        if (!in_array(strtolower($host), ['localhost', '127.0.0.1', '::1'], true)) {
            throw new RuntimeException('Vì an toàn, chỉ chấp nhận máy chủ CSDL "localhost" (mặc định của Hostinger).');
        }
        if ($name === '' || $user === '') throw new RuntimeException('Vui lòng nhập tên CSDL và tên người dùng CSDL.');
        $pdo = new PDO(sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $name), $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        el_schema($pdo);
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
        $cfg = [
            'db_host' => $host, 'db_port' => $port, 'db_name' => $name, 'db_user' => $user, 'db_pass' => $pass,
            'allowed_origins' => [($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? 'localhost')],
            'allow_file_origin' => false,
            'installed_at' => gmdate('c'),
        ];
        $php = "<?php\n// Cấu hình EduLesson – tạo tự động bởi install.php. KHÔNG chia sẻ tệp này.\nreturn " . var_export($cfg, true) . ";\n";
        if (@file_put_contents($cfgFile, $php, LOCK_EX) === false) throw new RuntimeException('Không ghi được tệp api/config.php – kiểm tra quyền ghi của thư mục api/.');
        @chmod($cfgFile, 0640);
        $done = true;
        $installed = true;
    } catch (PDOException $e) {
        $error = 'Không kết nối được CSDL. Kiểm tra lại tên CSDL, tên người dùng và mật khẩu. (' . $e->getCode() . ')';
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
}
?><!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Cài đặt máy chủ – EduLesson</title>
<style>
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f1f5f9; color: #0f172a; }
  .wrap { max-width: 560px; margin: 40px auto; padding: 0 16px; }
  .card { background: #fff; border-radius: 18px; padding: 28px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
  h1 { font-size: 22px; margin: 0 0 4px; } p { line-height: 1.55; color: #475569; }
  label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 6px; color: #334155; }
  input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 15px; }
  .row { display: grid; grid-template-columns: 2fr 1fr; gap: 12px; }
  button, .btn { display: inline-block; margin-top: 20px; width: 100%; padding: 12px; border: 0; border-radius: 12px; background: #4f46e5; color: #fff; font-size: 15px; font-weight: 600; text-align: center; text-decoration: none; cursor: pointer; }
  .err { background: #fff1f2; color: #be123c; padding: 12px; border-radius: 10px; margin-top: 14px; }
  .ok { background: #ecfdf5; color: #047857; padding: 14px; border-radius: 10px; }
  ol { padding-left: 20px; color: #475569; line-height: 1.7; } code { background: #f1f5f9; padding: 1px 6px; border-radius: 6px; }
  .hint { font-size: 12px; color: #64748b; margin-top: 4px; }
</style>
</head>
<body>
<div class="wrap"><div class="card">
  <h1>🎓 Cài đặt máy chủ EduLesson</h1>
<?php if ($done): ?>
  <div class="ok"><b>✓ Cài đặt thành công!</b> Đã tạo các bảng dữ liệu và tệp cấu hình.</div>
  <ol>
    <li>Mở ứng dụng và <b>đăng ký tài khoản đầu tiên</b> – tài khoản này tự động là <b>Admin (Ban Giám hiệu)</b>.</li>
    <li>Giáo viên đăng ký sau sẽ <b>chờ BGH duyệt</b> tại <i>Admin Dashboard</i>.</li>
    <li>(Khuyến nghị) Xóa tệp <code>api/install.php</code> trong File Manager.</li>
  </ol>
  <a class="btn" href="../">Mở ứng dụng EduLesson →</a>
<?php elseif ($installed): ?>
  <div class="ok"><b>Máy chủ đã được cài đặt.</b> Trang này đã khóa để bảo vệ hệ thống.</div>
  <p>Muốn cài lại: xóa tệp <code>api/config.php</code> trong File Manager rồi mở lại trang này (dữ liệu trong CSDL vẫn được giữ).</p>
  <a class="btn" href="../">Mở ứng dụng EduLesson →</a>
<?php else: ?>
  <p>Nhập thông tin cơ sở dữ liệu MySQL đã tạo trong <b>hPanel → Databases → MySQL Databases</b>.</p>
  <?php if ($error): ?><div class="err"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
  <form method="post" autocomplete="off">
    <div class="row">
      <div><label>Máy chủ CSDL</label><input name="db_host" value="<?= $v('db_host', 'localhost') ?>"></div>
      <div><label>Cổng</label><input name="db_port" value="<?= $v('db_port', '3306') ?>"></div>
    </div>
    <label>Tên cơ sở dữ liệu</label><input name="db_name" value="<?= $v('db_name') ?>" placeholder="u123456789_ncbh" required>
    <div class="hint">Hostinger tự thêm tiền tố dạng <code>u123456789_</code> – nhập đầy đủ.</div>
    <label>Tên người dùng CSDL</label><input name="db_user" value="<?= $v('db_user') ?>" placeholder="u123456789_ncbh" required>
    <label>Mật khẩu CSDL</label><input name="db_pass" type="password" required>
    <button type="submit">Cài đặt máy chủ</button>
  </form>
<?php endif; ?>
</div></div>
</body>
</html>
