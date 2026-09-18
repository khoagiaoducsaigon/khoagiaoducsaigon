import { postForm, getJson, waitUntilReady, PlatformError } from './http.js';

const GRAPH = 'https://graph.facebook.com';

export default {
  id: 'instagram',
  name: 'Instagram',
  emoji: '📸',
  color: '#E1306C',
  limits: { text: 2200, images: 10, videos: 1, hashtags: 30 },
  mediaSupport: { text: false, image: true, video: true, multiImage: true },
  credentialKeys: ['INSTAGRAM_USER_ID', 'INSTAGRAM_ACCESS_TOKEN'],
  docs: 'https://developers.facebook.com/docs/instagram-api/guides/content-publishing',

  isConfigured: (c) => Boolean(c.instagram.userId && c.instagram.accessToken),

  validate(payload) {
    const errors = [];
    if (payload.media.length === 0) errors.push('Instagram bat buoc phai co it nhat 1 anh hoac video');
    if (payload.text.length > 2200) errors.push('Caption vuot qua 2.200 ky tu');
    const tags = (payload.text.match(/#[^\s#]+/g) || []).length;
    if (tags > 30) errors.push(`Instagram toi da 30 hashtag (dang co ${tags})`);
    return errors;
  },

  async publish(payload, creds) {
    const { userId, accessToken } = creds.instagram;
    const base = `${GRAPH}/${creds.graphVersion}`;
    const media = payload.media.slice(0, 10);
    if (media.length === 0) throw new PlatformError('Instagram can it nhat 1 media');

    let creationId;
    if (media.length === 1) {
      const m = media[0];
      const container = await postForm(`${base}/${userId}/media`, {
        ...(m.type === 'video'
          ? { media_type: 'REELS', video_url: m.url }
          : { image_url: m.url }),
        caption: payload.text,
        access_token: accessToken,
      });
      creationId = container.id;
    } else {
      // Carousel: tao container con roi gom lai
      const children = [];
      for (const m of media) {
        const child = await postForm(`${base}/${userId}/media`, {
          ...(m.type === 'video' ? { media_type: 'VIDEO', video_url: m.url } : { image_url: m.url }),
          is_carousel_item: 'true',
          access_token: accessToken,
        });
        children.push(child.id);
      }
      const container = await postForm(`${base}/${userId}/media`, {
        media_type: 'CAROUSEL',
        children: children.join(','),
        caption: payload.text,
        access_token: accessToken,
      });
      creationId = container.id;
    }

    await waitUntilReady(async () => {
      const st = await getJson(
        `${base}/${creationId}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`,
      );
      if (st.status_code === 'ERROR') return { error: st.status || 'Instagram xu ly media that bai' };
      return { done: st.status_code === 'FINISHED' };
    });

    const published = await postForm(`${base}/${userId}/media_publish`, {
      creation_id: creationId,
      access_token: accessToken,
    });

    let permalink = null;
    try {
      const info = await getJson(`${base}/${published.id}?fields=permalink&access_token=${encodeURIComponent(accessToken)}`);
      permalink = info.permalink || null;
    } catch { /* permalink chi la thong tin phu */ }

    return { externalId: published.id, url: permalink };
  },
};
