import facebook from './facebook.js';
import instagram from './instagram.js';
import threads from './threads.js';
import tiktok from './tiktok.js';
import telegram from './telegram.js';
import whatsapp from './whatsapp.js';
import zalo from './zalo.js';

export const platforms = [facebook, instagram, threads, tiktok, telegram, whatsapp, zalo];
export const platformMap = new Map(platforms.map((p) => [p.id, p]));

export function getPlatform(id) {
  const p = platformMap.get(id);
  if (!p) throw new Error(`Khong ho tro nen tang "${id}"`);
  return p;
}

/** Mo ta nen tang cho giao dien (khong chua bi mat). */
export function describePlatforms(creds) {
  return platforms.map((p) => ({
    id: p.id,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    limits: p.limits,
    mediaSupport: p.mediaSupport,
    credentialKeys: p.credentialKeys,
    docs: p.docs,
    warning: p.warning || null,
    configured: p.isConfigured(creds),
  }));
}
