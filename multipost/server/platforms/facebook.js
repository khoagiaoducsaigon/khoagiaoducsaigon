import { postForm, PlatformError } from './http.js';

const GRAPH = 'https://graph.facebook.com';

export default {
  id: 'facebook',
  name: 'Facebook Page',
  emoji: '📘',
  color: '#1877F2',
  limits: { text: 63206, images: 10, videos: 1 },
  mediaSupport: { text: true, image: true, video: true, multiImage: true },
  credentialKeys: ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
  docs: 'https://developers.facebook.com/docs/pages-api/posts',

  isConfigured: (c) => Boolean(c.facebook.pageId && c.facebook.accessToken),

  validate(payload) {
    const errors = [];
    if (!payload.text && payload.media.length === 0) errors.push('Facebook can it nhat noi dung chu hoac 1 media');
    if (payload.text.length > 63206) errors.push('Noi dung vuot qua 63.206 ky tu');
    return errors;
  },

  async publish(payload, creds) {
    const { pageId, accessToken } = creds.facebook;
    const base = `${GRAPH}/${creds.graphVersion}`;
    const images = payload.media.filter((m) => m.type === 'image');
    const videos = payload.media.filter((m) => m.type === 'video');

    // Video: dang thang qua /videos
    if (videos.length > 0) {
      const res = await postForm(`${base}/${pageId}/videos`, {
        file_url: videos[0].url,
        description: payload.text,
        access_token: accessToken,
      });
      return { externalId: res.id, url: `https://facebook.com/${res.id}` };
    }

    // Nhieu anh: upload ngam (published=false) roi gan vao mot bai viet
    if (images.length > 1) {
      const attached = [];
      for (const img of images.slice(0, 10)) {
        const up = await postForm(`${base}/${pageId}/photos`, {
          url: img.url, published: 'false', access_token: accessToken,
        });
        attached.push({ media_fbid: up.id });
      }
      const res = await postForm(`${base}/${pageId}/feed`, {
        message: payload.text,
        attached_media: attached,
        access_token: accessToken,
      });
      return { externalId: res.id, url: permalink(res.id) };
    }

    // Mot anh
    if (images.length === 1) {
      const res = await postForm(`${base}/${pageId}/photos`, {
        url: images[0].url, caption: payload.text, access_token: accessToken,
      });
      const id = res.post_id || res.id;
      if (!id) throw new PlatformError('Facebook khong tra ve ID bai viet');
      return { externalId: id, url: permalink(id) };
    }

    // Chi chu (kem link neu co)
    const res = await postForm(`${base}/${pageId}/feed`, {
      message: payload.text,
      link: payload.link || undefined,
      access_token: accessToken,
    });
    return { externalId: res.id, url: permalink(res.id) };
  },
};

function permalink(id) {
  const [pageId, postId] = String(id).split('_');
  return postId ? `https://facebook.com/${pageId}/posts/${postId}` : `https://facebook.com/${id}`;
}
