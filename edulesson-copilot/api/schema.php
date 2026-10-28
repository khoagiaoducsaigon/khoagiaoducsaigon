<?php
/**
 * EduLesson Study CoPilot – cấu trúc cơ sở dữ liệu MySQL/MariaDB.
 * Được gọi bởi install.php. Chạy lại nhiều lần vẫn an toàn.
 */
declare(strict_types=1);

function el_schema(PDO $pdo): void
{
    $opt = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

    // Bộ đếm phiên bản toàn cục: mọi thay đổi nhận một số rev tăng dần để đồng bộ gia tăng
    $pdo->exec("CREATE TABLE IF NOT EXISTS el_meta (
        k VARCHAR(32) NOT NULL PRIMARY KEY,
        v BIGINT NOT NULL DEFAULT 0
    ) $opt");
    $pdo->exec("INSERT IGNORE INTO el_meta (k, v) VALUES ('rev', 0), ('schema', 1)");

    // Người dùng: login + password_hash chỉ nằm ở máy chủ, không bao giờ trả về trình duyệt
    $pdo->exec("CREATE TABLE IF NOT EXISTS el_users (
        id            VARCHAR(64)  NOT NULL PRIMARY KEY,
        login         VARCHAR(190) NULL UNIQUE,
        password_hash VARCHAR(255) NULL,
        role          VARCHAR(16)  NOT NULL DEFAULT 'observer',
        status        VARCHAR(16)  NOT NULL DEFAULT 'pending',
        data          LONGTEXT     NOT NULL,
        rev           BIGINT       NOT NULL DEFAULT 0,
        deleted       TINYINT(1)   NOT NULL DEFAULT 0,
        updated_at    DATETIME     NOT NULL,
        updated_by    VARCHAR(64)  NULL,
        client_id     VARCHAR(64)  NULL,
        KEY idx_users_rev (rev)
    ) $opt");

    // 5 bảng nghiệp vụ (lesson_studies, observation_logs, meeting_minutes, adapted_plans, audit_logs)
    $pdo->exec("CREATE TABLE IF NOT EXISTS el_records (
        store      VARCHAR(32) NOT NULL,
        id         VARCHAR(64) NOT NULL,
        data       LONGTEXT    NOT NULL,
        rev        BIGINT      NOT NULL DEFAULT 0,
        deleted    TINYINT(1)  NOT NULL DEFAULT 0,
        updated_at DATETIME    NOT NULL,
        updated_by VARCHAR(64) NULL,
        client_id  VARCHAR(64) NULL,
        PRIMARY KEY (store, id),
        KEY idx_records_rev (rev)
    ) $opt");

    $pdo->exec("CREATE TABLE IF NOT EXISTS el_sessions (
        token_hash CHAR(64)    NOT NULL PRIMARY KEY,
        user_id    VARCHAR(64) NOT NULL,
        created_at DATETIME    NOT NULL,
        expires_at DATETIME    NOT NULL,
        ip         VARCHAR(45) NULL,
        KEY idx_sessions_user (user_id)
    ) $opt");

    $pdo->exec("CREATE TABLE IF NOT EXISTS el_login_attempts (
        id    BIGINT AUTO_INCREMENT PRIMARY KEY,
        kind  VARCHAR(16)  NOT NULL,
        ip    VARCHAR(45)  NOT NULL,
        login VARCHAR(190) NOT NULL DEFAULT '',
        at    DATETIME     NOT NULL,
        KEY idx_attempts_ip (kind, ip, at),
        KEY idx_attempts_login (kind, login, at)
    ) $opt");
}
