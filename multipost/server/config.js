import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = path.join(ROOT, 'data');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');
export const PUBLIC_DIR = path.join(ROOT, 'public');

/** Doc file .env kieu don gian, khong ghi de bien moi truong da co san. */
function loadDotEnv() {
  const file = path.join(ROOT, '.env');
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadDotEnv();

for (const dir of [DATA_DIR, MEDIA_DIR]) fs.mkdirSync(dir, { recursive: true });

export const config = {
  port: Number(process.env.PORT || 8787),
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 8787}`).replace(/\/+$/, ''),
  dryRun: process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true',
  adminToken: process.env.ADMIN_TOKEN || '',
  graphVersion: process.env.GRAPH_API_VERSION || 'v21.0',
  timezone: process.env.TZ_DISPLAY || 'Asia/Ho_Chi_Minh',
};

/**
 * Thong tin dang nhap cua tung nen tang.
 * Uu tien gia tri luu trong data/db.json (nhap tu giao dien), sau do moi den .env.
 */
export function credentialsFrom(stored = {}) {
  const pick = (key, fallback = '') => {
    const v = stored[key];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
    return (process.env[key] || fallback).trim();
  };
  const list = (key) => pick(key).split(',').map((s) => s.trim()).filter(Boolean);

  return {
    graphVersion: config.graphVersion,
    facebook: { pageId: pick('FACEBOOK_PAGE_ID'), accessToken: pick('FACEBOOK_PAGE_ACCESS_TOKEN') },
    instagram: { userId: pick('INSTAGRAM_USER_ID'), accessToken: pick('INSTAGRAM_ACCESS_TOKEN') },
    threads: { userId: pick('THREADS_USER_ID'), accessToken: pick('THREADS_ACCESS_TOKEN') },
    tiktok: { accessToken: pick('TIKTOK_ACCESS_TOKEN'), privacyLevel: pick('TIKTOK_PRIVACY_LEVEL', 'SELF_ONLY') },
    telegram: { botToken: pick('TELEGRAM_BOT_TOKEN'), chatIds: list('TELEGRAM_CHAT_IDS') },
    whatsapp: {
      phoneNumberId: pick('WHATSAPP_PHONE_NUMBER_ID'),
      accessToken: pick('WHATSAPP_ACCESS_TOKEN'),
      recipients: list('WHATSAPP_RECIPIENTS'),
    },
  };
}

/** Cac khoa duoc phep luu tu giao dien Cai dat. */
export const CREDENTIAL_KEYS = [
  'FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN',
  'INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN',
  'THREADS_USER_ID', 'THREADS_ACCESS_TOKEN',
  'TIKTOK_ACCESS_TOKEN', 'TIKTOK_PRIVACY_LEVEL',
  'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_IDS',
  'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_RECIPIENTS',
];

/** Khoa bi mat -> che bot khi tra ve giao dien. */
export const SECRET_KEYS = new Set([
  'FACEBOOK_PAGE_ACCESS_TOKEN', 'INSTAGRAM_ACCESS_TOKEN', 'THREADS_ACCESS_TOKEN',
  'TIKTOK_ACCESS_TOKEN', 'TELEGRAM_BOT_TOKEN', 'WHATSAPP_ACCESS_TOKEN',
]);

export function maskSecret(value) {
  if (!value) return '';
  const s = String(value);
  if (s.length <= 8) return '••••••••';
  return `${s.slice(0, 4)}••••••••${s.slice(-4)}`;
}
