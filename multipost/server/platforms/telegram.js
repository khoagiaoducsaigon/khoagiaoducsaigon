import { postJson, PlatformError } from './http.js';

const API = 'https://api.telegram.org';

export default {
  id: 'telegram',
  name: 'Telegram',
  emoji: '✈️',
  color: '#229ED9',
  limits: { text: 4096, caption: 1024, images: 10, videos: 10 },
  mediaSupport: { text: true, image: true, video: true, multiImage: true },
  credentialKeys: ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_IDS'],
  docs: 'https://core.telegram.org/bots/api#sendmessage',

  isConfigured: (c) => Boolean(c.telegram.botToken && c.telegram.chatIds.length > 0),

  validate(payload) {
    const errors = [];
    if (!payload.text && payload.media.length === 0) errors.push('Telegram can noi dung hoac media');
    if (payload.media.length === 0 && payload.text.length > 4096) {
      errors.push(`Tin nhan Telegram toi da 4.096 ky tu (dang co ${payload.text.length})`);
    }
    if (payload.media.length > 0 && payload.text.length > 1024) {
      errors.push('Chu thich kem media toi da 1.024 ky tu - phan du se duoc gui thanh tin nhan rieng');
    }
    return errors;
  },

  async publish(payload, creds) {
    const { botToken, chatIds } = creds.telegram;
    if (chatIds.length === 0) throw new PlatformError('Chua khai bao TELEGRAM_CHAT_IDS');
    const base = `${API}/bot${botToken}`;
    const media = payload.media.slice(0, 10);
    const sent = [];

    for (const chatId of chatIds) {
      if (media.length === 0) {
        const r = await call(base, 'sendMessage', {
          chat_id: chatId,
          text: payload.text,
          parse_mode: 'HTML',
          disable_web_page_preview: false,
        });
        sent.push({ chatId, messageId: r.message_id });
        continue;
      }

      const caption = payload.text.slice(0, 1024);
      const overflow = payload.text.slice(1024);

      if (media.length === 1) {
        const m = media[0];
        const method = m.type === 'video' ? 'sendVideo' : 'sendPhoto';
        const r = await call(base, method, {
          chat_id: chatId,
          [m.type === 'video' ? 'video' : 'photo']: m.url,
          caption,
          parse_mode: 'HTML',
        });
        sent.push({ chatId, messageId: r.message_id });
      } else {
        const group = media.map((m, i) => ({
          type: m.type === 'video' ? 'video' : 'photo',
          media: m.url,
          ...(i === 0 ? { caption, parse_mode: 'HTML' } : {}),
        }));
        const r = await call(base, 'sendMediaGroup', { chat_id: chatId, media: group });
        sent.push({ chatId, messageId: Array.isArray(r) ? r[0]?.message_id : r?.message_id });
      }

      if (overflow) {
        await call(base, 'sendMessage', { chat_id: chatId, text: overflow, parse_mode: 'HTML' });
      }
    }

    const first = sent[0];
    return {
      externalId: sent.map((s) => `${s.chatId}:${s.messageId}`).join(','),
      url: publicLink(first),
      note: `Da gui toi ${sent.length} dich`,
    };
  },
};

async function call(base, method, params) {
  const res = await postJson(`${base}/${method}`, params);
  if (!res.ok) throw new PlatformError(res.description || `Telegram ${method} that bai`, { body: res });
  return res.result;
}

function publicLink(sent) {
  if (!sent) return null;
  const chat = String(sent.chatId);
  if (chat.startsWith('@')) return `https://t.me/${chat.slice(1)}/${sent.messageId}`;
  return null;
}
