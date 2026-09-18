import { postForm, getJson, waitUntilReady, sleep, PlatformError } from './http.js';

const THREADS_API = 'https://graph.threads.net/v1.0';

export default {
  id: 'threads',
  name: 'Threads',
  emoji: '🧵',
  color: '#000000',
  limits: { text: 500, images: 20, videos: 1 },
  mediaSupport: { text: true, image: true, video: true, multiImage: true },
  credentialKeys: ['THREADS_USER_ID', 'THREADS_ACCESS_TOKEN'],
  docs: 'https://developers.facebook.com/docs/threads/posts',

  isConfigured: (c) => Boolean(c.threads.userId && c.threads.accessToken),

  validate(payload) {
    const errors = [];
    if (!payload.text && payload.media.length === 0) errors.push('Threads can noi dung chu hoac media');
    if (payload.text.length > 500) errors.push(`Threads toi da 500 ky tu (dang co ${payload.text.length})`);
    return errors;
  },

  async publish(payload, creds) {
    const { userId, accessToken } = creds.threads;
    const media = payload.media.slice(0, 20);
    let creationId;

    if (media.length === 0) {
      const c = await postForm(`${THREADS_API}/${userId}/threads`, {
        media_type: 'TEXT', text: payload.text, access_token: accessToken,
      });
      creationId = c.id;
    } else if (media.length === 1) {
      const m = media[0];
      const c = await postForm(`${THREADS_API}/${userId}/threads`, {
        media_type: m.type === 'video' ? 'VIDEO' : 'IMAGE',
        ...(m.type === 'video' ? { video_url: m.url } : { image_url: m.url }),
        text: payload.text,
        access_token: accessToken,
      });
      creationId = c.id;
    } else {
      const children = [];
      for (const m of media) {
        const child = await postForm(`${THREADS_API}/${userId}/threads`, {
          media_type: m.type === 'video' ? 'VIDEO' : 'IMAGE',
          ...(m.type === 'video' ? { video_url: m.url } : { image_url: m.url }),
          is_carousel_item: 'true',
          access_token: accessToken,
        });
        children.push(child.id);
      }
      const c = await postForm(`${THREADS_API}/${userId}/threads`, {
        media_type: 'CAROUSEL',
        children: children.join(','),
        text: payload.text,
        access_token: accessToken,
      });
      creationId = c.id;
    }

    if (media.length > 0) {
      await waitUntilReady(async () => {
        const st = await getJson(
          `${THREADS_API}/${creationId}?fields=status,error_message&access_token=${encodeURIComponent(accessToken)}`,
        );
        if (st.status === 'ERROR') return { error: st.error_message || 'Threads xu ly media that bai' };
        return { done: st.status === 'FINISHED' };
      });
    } else {
      // Threads yeu cau cho khoang 30 giay giua tao va dang; voi bai chu thi ngan hon
      await sleep(1000);
    }

    const published = await postForm(`${THREADS_API}/${userId}/threads_publish`, {
      creation_id: creationId, access_token: accessToken,
    });
    if (!published.id) throw new PlatformError('Threads khong tra ve ID bai dang');

    let permalink = null;
    try {
      const info = await getJson(`${THREADS_API}/${published.id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`);
      permalink = info.permalink || null;
    } catch { /* bo qua */ }

    return { externalId: published.id, url: permalink };
  },
};
