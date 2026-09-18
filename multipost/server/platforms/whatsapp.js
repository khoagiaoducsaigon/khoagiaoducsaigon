import { postJson, PlatformError } from './http.js';

const GRAPH = 'https://graph.facebook.com';

export default {
  id: 'whatsapp',
  name: 'WhatsApp',
  emoji: '💬',
  color: '#25D366',
  limits: { text: 4096, caption: 1024, images: 1, videos: 1 },
  mediaSupport: { text: true, image: true, video: true, multiImage: false },
  credentialKeys: ['WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_RECIPIENTS'],
  docs: 'https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages',
  warning: 'WhatsApp Cloud API chi gui tin tu do trong 24 gio ke tu tin nhan cuoi cua nguoi dung. Ngoai khung nay phai dung mau (template) da duyet.',

  isConfigured: (c) => Boolean(c.whatsapp.phoneNumberId && c.whatsapp.accessToken && c.whatsapp.recipients.length > 0),

  validate(payload) {
    const errors = [];
    if (!payload.text && payload.media.length === 0) errors.push('WhatsApp can noi dung hoac media');
    if (payload.text.length > 4096) errors.push('Tin nhan WhatsApp toi da 4.096 ky tu');
    if (payload.media.length > 1) errors.push('WhatsApp gui tung media mot - chi media dau tien duoc dung');
    return errors;
  },

  async publish(payload, creds) {
    const { phoneNumberId, accessToken, recipients } = creds.whatsapp;
    if (recipients.length === 0) throw new PlatformError('Chua khai bao WHATSAPP_RECIPIENTS');
    const url = `${GRAPH}/${creds.graphVersion}/${phoneNumberId}/messages`;
    const headers = { authorization: `Bearer ${accessToken}` };
    const media = payload.media[0];
    const ids = [];
    const failures = [];

    for (const to of recipients) {
      const body = media
        ? {
            messaging_product: 'whatsapp',
            to,
            type: media.type === 'video' ? 'video' : 'image',
            [media.type === 'video' ? 'video' : 'image']: {
              link: media.url,
              caption: payload.text.slice(0, 1024),
            },
          }
        : {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { preview_url: true, body: payload.text },
          };
      try {
        const res = await postJson(url, body, { headers });
        const id = res?.messages?.[0]?.id;
        if (id) ids.push(id);
      } catch (err) {
        failures.push(`${to}: ${err.message}`);
      }
    }

    if (ids.length === 0) {
      throw new PlatformError(failures.join(' | ') || 'Khong gui duoc toi bat ky so nao');
    }
    return {
      externalId: ids.join(','),
      url: null,
      note: failures.length
        ? `Gui thanh cong ${ids.length}/${recipients.length}. Loi: ${failures.join(' | ')}`
        : `Da gui toi ${ids.length} so`,
    };
  },
};
