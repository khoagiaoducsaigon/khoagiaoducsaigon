<?php
/**
 * EduLesson Study CoPilot – API đồng bộ dữ liệu (PHP 8 + MySQL/MariaDB).
 * Chạy trên hosting chia sẻ (Hostinger) – không cần thư viện ngoài.
 *
 *   GET  ?r=ping                 Kiểm tra máy chủ
 *   POST ?r=auth/register        Đăng ký (tài khoản đầu tiên = Admin, còn lại chờ duyệt)
 *   POST ?r=auth/login           Đăng nhập → token
 *   GET  ?r=auth/me              Hồ sơ người đang đăng nhập
 *   POST ?r=auth/logout          Đăng xuất
 *   POST ?r=auth/password        Đổi mật khẩu (Admin: đặt lại cho người khác)
 *   POST ?r=admin/create_user    Admin tạo tài khoản cho GV
 *   GET  ?r=sync/pull&since=N    Lấy các thay đổi có rev > N
 *   POST ?r=sync/push            Gửi thay đổi (upsert / delete)
 */
declare(strict_types=1);

const EL_VERSION = '1.2.0';
const EL_STORES = ['users', 'lesson_studies', 'observation_logs', 'meeting_minutes', 'adapted_plans', 'audit_logs'];
const EL_ROLES = ['admin' => 'Ban Giám hiệu / Admin', 'leader' => 'Tổ trưởng chuyên môn', 'teacher' => 'GV dạy minh họa', 'observer' => 'GV dự giờ'];
const EL_STATUSES = ['active', 'pending', 'locked', 'profile'];
const EL_SESSION_DAYS = 30;
const EL_MAX_RECORD = 3 * 1024 * 1024;

final class ElFail extends Exception
{
    public function __construct(string $message, int $code = 400, public string $error = 'bad_request')
    {
        parent::__construct($message, $code);
    }
}

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');
header('Referrer-Policy: no-referrer');

function out(array $data, int $code = 200): never
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function fail(string $message, int $code = 400, string $error = 'bad_request'): never
{
    out(['error' => $error, 'message' => $message], $code);
}

set_exception_handler(function (Throwable $e): void {
    error_log('[EduLesson API] ' . $e->getMessage());
    if ($e instanceof PDOException && str_contains($e->getMessage(), 'SQLSTATE[HY000] [')) {
        fail('Không kết nối được cơ sở dữ liệu. Kiểm tra lại cấu hình api/config.php.', 503, 'db_unavailable');
    }
    fail('Lỗi máy chủ. Vui lòng thử lại.', 500, 'server_error');
});

$cfgFile = __DIR__ . '/config.php';
$CFG = is_file($cfgFile) ? (require $cfgFile) : null;

// ------------------------------------------------------------------ CORS (mặc định chỉ cùng tên miền)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');
    $self = ($https ? 'https://' : 'http://') . ($_SERVER['HTTP_HOST'] ?? '');
    $allowed = (array) ($CFG['allowed_origins'] ?? []);
    if ($origin === $self || in_array($origin, $allowed, true) || ($origin === 'null' && !empty($CFG['allow_file_origin']))) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, X-Auth-Token');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Max-Age: 600');
    }
}
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$route = (string) ($_GET['r'] ?? 'ping');
if (!is_array($CFG)) {
    if ($route === 'ping') out(['ok' => true, 'installed' => false, 'version' => EL_VERSION]);
    fail('Máy chủ chưa được cài đặt – Admin hãy mở api/install.php.', 503, 'not_installed');
}

// ------------------------------------------------------------------ Tiện ích
function db(): PDO
{
    static $pdo = null;
    global $CFG;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $CFG['db_host'], (int) ($CFG['db_port'] ?? 3306), $CFG['db_name']);
        $pdo = new PDO($dsn, $CFG['db_user'], $CFG['db_pass'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+00:00'");
    }
    return $pdo;
}

function cut(string $s, int $max): string
{
    $s = trim($s);
    return function_exists('mb_substr') ? mb_substr($s, 0, $max) : substr($s, 0, $max);
}

function body(bool $assoc = true): array|stdClass
{
    if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 12 * 1024 * 1024) fail('Dữ liệu gửi lên quá lớn.', 413, 'too_large');
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') return $assoc ? [] : new stdClass();
    $j = json_decode($raw, $assoc);
    if (!is_array($j) && !($j instanceof stdClass)) fail('Dữ liệu JSON không hợp lệ.');
    return $j;
}

function post(): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') fail('Phương thức không hợp lệ.', 405, 'method_not_allowed');
}

function ip(): string
{
    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

function normLogin(string $s): string
{
    $s = strtolower(trim($s));
    if (preg_match('/^[+0-9 .\-]+$/', $s)) {
        $s = (string) preg_replace('/[^0-9+]/', '', $s);
        if (str_starts_with($s, '+84')) $s = '0' . substr($s, 3);
    }
    return $s;
}

function validLogin(string $s): bool
{
    return (bool) (filter_var($s, FILTER_VALIDATE_EMAIL) || preg_match('/^0\d{9,10}$/', $s));
}

/** Khóa bộ đếm rev – tuần tự hóa mọi thao tác ghi để thứ tự rev luôn khớp thứ tự commit */
function lockRev(): void
{
    db()->query("SELECT v FROM el_meta WHERE k = 'rev' FOR UPDATE")->fetchAll();
}

function nextRev(): int
{
    db()->exec("UPDATE el_meta SET v = LAST_INSERT_ID(v + 1) WHERE k = 'rev'");
    return (int) db()->lastInsertId();
}

function userOut(array $u): array
{
    $d = json_decode($u['data'] ?: '{}', true) ?: [];
    unset($d['passwordHash']);
    return array_merge($d, ['id' => $u['id'], 'role' => $u['role'], 'status' => $u['status'], 'hasLogin' => !empty($u['login'])]);
}

function statusMsg(string $s): string
{
    return $s === 'pending' ? 'Tài khoản đang chờ Ban Giám hiệu phê duyệt.' : 'Tài khoản đã bị khóa. Liên hệ Ban Giám hiệu.';
}

function token(): string
{
    $t = (string) ($_SERVER['HTTP_X_AUTH_TOKEN'] ?? '');
    if ($t === '' && preg_match('/Bearer\s+([a-f0-9]{64})/', (string) ($_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? ''), $m)) $t = $m[1];
    return preg_match('/^[a-f0-9]{64}$/', $t) ? $t : '';
}

function me(bool $requireActive = true): array
{
    $t = token();
    if ($t === '') fail('Chưa đăng nhập.', 401, 'unauthorized');
    $st = db()->prepare('SELECT u.* FROM el_sessions s JOIN el_users u ON u.id = s.user_id
                         WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() AND u.deleted = 0');
    $st->execute([hash('sha256', $t)]);
    $u = $st->fetch();
    if (!$u) fail('Phiên đăng nhập đã hết hạn – vui lòng đăng nhập lại.', 401, 'unauthorized');
    if ($requireActive && $u['status'] !== 'active') fail(statusMsg($u['status']), 403, 'not_active');
    return $u;
}

function issueToken(string $uid): string
{
    $t = bin2hex(random_bytes(32));
    db()->prepare('INSERT INTO el_sessions (token_hash, user_id, created_at, expires_at, ip)
                   VALUES (?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP() + INTERVAL ' . EL_SESSION_DAYS . ' DAY, ?)')
        ->execute([hash('sha256', $t), $uid, ip()]);
    return $t;
}

function attempts(string $kind, string $col, string $val, int $minutes): int
{
    $col = $col === 'ip' ? 'ip' : 'login';
    $st = db()->prepare("SELECT COUNT(*) FROM el_login_attempts WHERE kind = ? AND $col = ? AND at > UTC_TIMESTAMP() - INTERVAL $minutes MINUTE");
    $st->execute([$kind, $val]);
    return (int) $st->fetchColumn();
}

function logAttempt(string $kind, string $login): void
{
    db()->prepare('INSERT INTO el_login_attempts (kind, ip, login, at) VALUES (?, ?, ?, UTC_TIMESTAMP())')->execute([$kind, ip(), cut($login, 190)]);
}

function housekeeping(): void
{
    if (random_int(1, 50) !== 1) return;
    db()->exec('DELETE FROM el_sessions WHERE expires_at < UTC_TIMESTAMP()');
    db()->exec('DELETE FROM el_login_attempts WHERE at < UTC_TIMESTAMP() - INTERVAL 1 DAY');
}

/** Đọc và kiểm tra dữ liệu người dùng mới (đăng ký hoặc Admin tạo) */
function newUserInput(array $b): array
{
    $name = cut((string) ($b['name'] ?? ''), 120);
    $login = normLogin(cut((string) ($b['login'] ?? ''), 190));
    $pw = (string) ($b['password'] ?? '');
    $role = (string) ($b['role'] ?? 'observer');
    if ((function_exists('mb_strlen') ? mb_strlen($name) : strlen($name)) < 3) fail('Họ tên tối thiểu 3 ký tự.');
    if (!validLogin($login)) fail('Email hoặc số điện thoại không hợp lệ.');
    if (strlen($pw) < 8 || strlen($pw) > 200) fail('Mật khẩu tối thiểu 8 ký tự.');
    if (!isset(EL_ROLES[$role])) $role = 'observer';
    return [$name, $login, $pw, $role, cut((string) ($b['campus'] ?? ''), 100), cut((string) ($b['department'] ?? ''), 100), cut((string) ($b['title'] ?? ''), 120)];
}

function insertUser(string $login, string $pw, string $role, string $status, array $data, string $by): array
{
    $st = db()->prepare('SELECT id FROM el_users WHERE login = ?');
    $st->execute([$login]);
    if ($st->fetch()) throw new ElFail('Email/SĐT đã được đăng ký.', 409, 'conflict');
    $id = 'u_' . bin2hex(random_bytes(8));
    $data = array_merge(['id' => $id, 'contact' => $login, 'createdAt' => gmdate('Y-m-d\TH:i:s\Z'), 'lastLogin' => null], $data);
    db()->prepare('INSERT INTO el_users (id, login, password_hash, role, status, data, rev, deleted, updated_at, updated_by)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 0, UTC_TIMESTAMP(), ?)')
        ->execute([$id, $login, password_hash($pw, PASSWORD_DEFAULT), $role, $status, json_encode($data, JSON_UNESCAPED_UNICODE), nextRev(), $by ?: $id]);
    $st = db()->prepare('SELECT * FROM el_users WHERE id = ?');
    $st->execute([$id]);
    return $st->fetch();
}

/** Ghi hồ sơ người dùng qua đồng bộ – chỉ Admin được đổi vai trò/trạng thái và sửa hồ sơ người khác */
function upsertUser(array $me, string $id, stdClass $data, string $cid): int
{
    $isAdmin = $me['role'] === 'admin';
    $role = (string) ($data->role ?? '');
    $status = (string) ($data->status ?? '');
    unset($data->role, $data->status, $data->hasLogin, $data->passwordHash);
    $st = db()->prepare('SELECT * FROM el_users WHERE id = ?');
    $st->execute([$id]);
    $old = $st->fetch();

    if ($old && !(int) $old['deleted']) {
        if (!$isAdmin && $id !== $me['id']) throw new ElFail('Không có quyền sửa hồ sơ của người khác.', 403, 'forbidden');
        $newRole = $old['role'];
        $newStatus = $old['status'];
        if ($isAdmin && $id !== $me['id']) { // Admin không tự hạ quyền/khóa chính mình
            if (isset(EL_ROLES[$role])) $newRole = $role;
            if (in_array($status, EL_STATUSES, true)) $newStatus = $status;
            if ($newStatus === 'active' && empty($old['password_hash'])) $newStatus = 'profile';
        }
        if (!empty($old['login'])) $data->contact = $old['login']; // tên đăng nhập chỉ đổi ở máy chủ
        $rev = nextRev();
        db()->prepare('UPDATE el_users SET role = ?, status = ?, data = ?, rev = ?, updated_at = UTC_TIMESTAMP(), updated_by = ?, client_id = ? WHERE id = ?')
            ->execute([$newRole, $newStatus, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $rev, $me['id'], $cid, $id]);
        return $rev;
    }
    if (!$isAdmin) throw new ElFail('Chỉ Ban Giám hiệu được tạo hồ sơ người dùng.', 403, 'forbidden');
    $rev = nextRev(); // hồ sơ GV không có tài khoản đăng nhập
    db()->prepare("INSERT INTO el_users (id, login, password_hash, role, status, data, rev, deleted, updated_at, updated_by, client_id)
                   VALUES (?, NULL, NULL, ?, 'profile', ?, ?, 0, UTC_TIMESTAMP(), ?, ?)
                   ON DUPLICATE KEY UPDATE login = NULL, password_hash = NULL, role = VALUES(role), status = 'profile', data = VALUES(data),
                     rev = VALUES(rev), deleted = 0, updated_at = VALUES(updated_at), updated_by = VALUES(updated_by), client_id = VALUES(client_id)")
        ->execute([$id, isset(EL_ROLES[$role]) ? $role : 'observer', json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), $rev, $me['id'], $cid]);
    return $rev;
}

// ------------------------------------------------------------------ Định tuyến
switch ($route) {
    case 'ping':
        $rev = (int) db()->query("SELECT v FROM el_meta WHERE k = 'rev'")->fetchColumn();
        out(['ok' => true, 'installed' => true, 'version' => EL_VERSION, 'rev' => $rev, 'time' => gmdate('c')]);

    case 'auth/register':
        post();
        $b = body();
        if (attempts('register', 'ip', ip(), 60) >= 5) fail('Quá nhiều lượt đăng ký từ máy này. Vui lòng thử lại sau 1 giờ.', 429, 'rate_limited');
        [$name, $login, $pw, $role, $campus, $dept] = newUserInput($b);
        logAttempt('register', $login);
        $pdo = db();
        $pdo->beginTransaction();
        try {
            lockRev();
            $first = (int) $pdo->query("SELECT COUNT(*) FROM el_users WHERE role = 'admin' AND status = 'active' AND deleted = 0")->fetchColumn() === 0;
            $u = insertUser($login, $pw, $first ? 'admin' : $role, $first ? 'active' : 'pending',
                ['name' => $name, 'title' => $first ? 'Quản trị viên – Ban Giám hiệu' : EL_ROLES[$role], 'campus' => $campus, 'department' => $dept], '');
            $pdo->commit();
        } catch (ElFail $e) {
            $pdo->rollBack();
            fail($e->getMessage(), $e->getCode(), $e->error);
        }
        if ($first) out(['token' => issueToken($u['id']), 'user' => userOut($u), 'firstAdmin' => true]);
        out(['pending' => true]);

    case 'auth/login':
        post();
        $b = body();
        $login = normLogin(cut((string) ($b['login'] ?? ''), 190));
        if (attempts('login', 'ip', ip(), 15) >= 30 || ($login !== '' && attempts('login', 'login', $login, 15) >= 8)) {
            fail('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.', 429, 'rate_limited');
        }
        $st = db()->prepare('SELECT * FROM el_users WHERE login = ? AND deleted = 0');
        $st->execute([$login]);
        $u = $st->fetch();
        if (!$u || empty($u['password_hash']) || !password_verify((string) ($b['password'] ?? ''), $u['password_hash'])) {
            logAttempt('login', $login);
            fail('Sai thông tin đăng nhập.', 400, 'invalid_credentials');
        }
        if ($u['status'] !== 'active') fail(statusMsg($u['status']), 403, 'not_active');
        if (password_needs_rehash($u['password_hash'], PASSWORD_DEFAULT)) {
            db()->prepare('UPDATE el_users SET password_hash = ? WHERE id = ?')->execute([password_hash((string) $b['password'], PASSWORD_DEFAULT), $u['id']]);
        }
        db()->prepare("DELETE FROM el_login_attempts WHERE kind = 'login' AND login = ?")->execute([$login]);
        housekeeping();
        out(['token' => issueToken($u['id']), 'user' => userOut($u)]);

    case 'auth/me':
        out(['user' => userOut(me())]);

    case 'auth/logout':
        post();
        if (($t = token()) !== '') db()->prepare('DELETE FROM el_sessions WHERE token_hash = ?')->execute([hash('sha256', $t)]);
        out(['ok' => true]);

    case 'auth/password':
        post();
        $u = me();
        $b = body();
        $new = (string) ($b['new_password'] ?? '');
        if (strlen($new) < 8 || strlen($new) > 200) fail('Mật khẩu mới tối thiểu 8 ký tự.');
        $target = (string) ($b['user_id'] ?? '');
        if ($target !== '' && $target !== $u['id']) {
            if ($u['role'] !== 'admin') fail('Chỉ Ban Giám hiệu được đặt lại mật khẩu cho người khác.', 403, 'forbidden');
            $st = db()->prepare('SELECT * FROM el_users WHERE id = ? AND deleted = 0');
            $st->execute([$target]);
            $t = $st->fetch();
            if (!$t || empty($t['login'])) fail('Người dùng này chưa có tài khoản đăng nhập.', 400);
            db()->prepare('UPDATE el_users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $target]);
            db()->prepare('DELETE FROM el_sessions WHERE user_id = ?')->execute([$target]);
            out(['ok' => true]);
        }
        if (!password_verify((string) ($b['old_password'] ?? ''), (string) $u['password_hash'])) fail('Mật khẩu hiện tại không đúng.', 400, 'invalid_credentials');
        db()->prepare('UPDATE el_users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $u['id']]);
        db()->prepare('DELETE FROM el_sessions WHERE user_id = ? AND token_hash <> ?')->execute([$u['id'], hash('sha256', token())]);
        out(['ok' => true]);

    case 'admin/create_user':
        post();
        $u = me();
        if ($u['role'] !== 'admin') fail('Chỉ Ban Giám hiệu được tạo tài khoản.', 403, 'forbidden');
        $b = body();
        [$name, $login, $pw, $role, $campus, $dept, $title] = newUserInput($b);
        $status = in_array($b['status'] ?? '', ['active', 'pending', 'locked'], true) ? $b['status'] : 'active';
        $pdo = db();
        $pdo->beginTransaction();
        try {
            lockRev();
            $nu = insertUser($login, $pw, $role, $status, ['name' => $name, 'title' => $title ?: EL_ROLES[$role], 'campus' => $campus, 'department' => $dept], $u['id']);
            $pdo->commit();
        } catch (ElFail $e) {
            $pdo->rollBack();
            fail($e->getMessage(), $e->getCode(), $e->error);
        }
        out(['user' => userOut($nu)]);

    case 'sync/pull':
        me();
        $since = max(0, (int) ($_GET['since'] ?? 0));
        $pdo = db();
        $pdo->exec('START TRANSACTION WITH CONSISTENT SNAPSHOT');
        $rev = (int) $pdo->query("SELECT v FROM el_meta WHERE k = 'rev'")->fetchColumn();
        $changes = [];
        $st = $pdo->prepare('SELECT id, role, status, data, deleted, client_id, (login IS NOT NULL) AS has_login
                             FROM el_users WHERE rev > ? AND rev <= ? AND (? > 0 OR deleted = 0) ORDER BY rev');
        $st->execute([$since, $rev, $since]);
        foreach ($st as $r) {
            $changes[] = ['store' => 'users', 'id' => $r['id'], 'role' => $r['role'], 'status' => $r['status'], 'data' => $r['data'],
                'deleted' => (int) $r['deleted'], 'client_id' => $r['client_id'], 'has_login' => (bool) $r['has_login']];
        }
        $st = $pdo->prepare('SELECT store, id, data, deleted, client_id FROM el_records
                             WHERE rev > ? AND rev <= ? AND (? > 0 OR deleted = 0) ORDER BY rev');
        $st->execute([$since, $rev, $since]);
        foreach ($st as $r) {
            $changes[] = ['store' => $r['store'], 'id' => $r['id'], 'data' => $r['data'], 'deleted' => (int) $r['deleted'], 'client_id' => $r['client_id']];
        }
        $pdo->commit();
        out(['rev' => $rev, 'changes' => $changes]);

    case 'sync/push':
        post();
        $u = me();
        $b = body(false);
        $ops = $b->ops ?? null;
        $cid = substr((string) preg_replace('/[^A-Za-z0-9_\-]/', '', (string) ($b->client_id ?? '')), 0, 64);
        if (!is_array($ops) || !$ops || count($ops) > 500) fail('Danh sách thao tác không hợp lệ (1–500).');
        $isAdmin = $u['role'] === 'admin';
        $pdo = db();
        $pdo->beginTransaction();
        try {
            lockRev();
            $last = 0;
            foreach ($ops as $op) {
                $kind = (string) ($op->op ?? '');
                $store = (string) ($op->store ?? '');
                $id = (string) ($op->id ?? '');
                if (!in_array($store, EL_STORES, true)) throw new ElFail('Bảng dữ liệu không hợp lệ.');
                if (!preg_match('/^[A-Za-z0-9_.:\-]{1,64}$/', $id)) throw new ElFail('Mã bản ghi không hợp lệ.');
                if ($kind === 'upsert') {
                    $data = $op->data ?? null;
                    if (!($data instanceof stdClass)) throw new ElFail('Dữ liệu bản ghi không hợp lệ.');
                    unset($data->passwordHash);
                    $data->id = $id;
                    if ($store === 'users') {
                        $last = upsertUser($u, $id, $data, $cid);
                        continue;
                    }
                    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
                    if (strlen($json) > EL_MAX_RECORD) throw new ElFail('Bản ghi quá lớn (tối đa 3 MB).', 413, 'too_large');
                    if ($store === 'audit_logs') { // nhật ký: chỉ ghi thêm – gửi lại bản đã có thì bỏ qua
                        $st = $pdo->prepare("SELECT 1 FROM el_records WHERE store = 'audit_logs' AND id = ?");
                        $st->execute([$id]);
                        if ($st->fetch()) continue;
                    }
                    $last = nextRev();
                    $pdo->prepare('INSERT INTO el_records (store, id, data, rev, deleted, updated_at, updated_by, client_id)
                                   VALUES (?, ?, ?, ?, 0, UTC_TIMESTAMP(), ?, ?)
                                   ON DUPLICATE KEY UPDATE data = VALUES(data), rev = VALUES(rev), deleted = 0,
                                     updated_at = VALUES(updated_at), updated_by = VALUES(updated_by), client_id = VALUES(client_id)')
                        ->execute([$store, $id, $json, $last, $u['id'], $cid]);
                } elseif ($kind === 'delete') {
                    if ($store === 'users') {
                        if (!$isAdmin) throw new ElFail('Chỉ Ban Giám hiệu được xóa người dùng.', 403, 'forbidden');
                        if ($id === $u['id']) throw new ElFail('Không thể tự xóa tài khoản của mình.', 403, 'forbidden');
                        $last = nextRev();
                        $pdo->prepare("UPDATE el_users SET deleted = 1, login = NULL, password_hash = NULL, data = '{}', rev = ?,
                                         updated_at = UTC_TIMESTAMP(), updated_by = ?, client_id = ? WHERE id = ?")
                            ->execute([$last, $u['id'], $cid, $id]);
                        $pdo->prepare('DELETE FROM el_sessions WHERE user_id = ?')->execute([$id]);
                    } else {
                        if ($store === 'audit_logs' && !$isAdmin) throw new ElFail('Chỉ Ban Giám hiệu được xóa nhật ký hệ thống.', 403, 'forbidden');
                        $last = nextRev();
                        $pdo->prepare("UPDATE el_records SET deleted = 1, data = '{}', rev = ?, updated_at = UTC_TIMESTAMP(), updated_by = ?, client_id = ?
                                       WHERE store = ? AND id = ? AND deleted = 0")
                            ->execute([$last, $u['id'], $cid, $store, $id]);
                    }
                } else {
                    throw new ElFail('Thao tác không hợp lệ.');
                }
            }
            $pdo->commit();
        } catch (ElFail $e) {
            $pdo->rollBack();
            fail($e->getMessage(), $e->getCode(), $e->error);
        }
        out(['ok' => true, 'rev' => $last]);

    default:
        fail('Không tìm thấy chức năng.', 404, 'not_found');
}
