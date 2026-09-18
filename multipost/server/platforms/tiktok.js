import { postJson, PlatformError } from './http.js';

const API = 'https://open.tiktokapis.com/v2';

export default {
  id: 'tiktok',
  name: 'TikTok',
  emoji: '🎵',
  color: '#FE2C55',
  limits: { text: 2200, title: 90, images: 35, videos: 1 },
  mediaSupport: { text: false, image: true, video: true, multiImage: true },
  credentialKeys: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_PRIVACY_LEVEL'],
  docs: 'https://developers.tiktok.com/doc/content-posting-api-get-started',

  isConfigured: (c) => Boolean(c.tiktok.accessToken),

  validate(payload) {
    const errors = [];
    if (payload.media.length === 0) errors.push('TikTok bat buoc co video hoac anh');
    if (payload.text.length > 2200) errors.push('Mo ta TikTok vuot qua 2.200 ky tu');
    const hasVideo = payload.media.some((m) => m.type === 'video');
    const hasImage = payload.media.some((m) => m.type === 'image');
    if (hasVideo && hasImage) errors.push('TikTok khong dang lan video va anh trong cung mot bai');
    return errors;
  },

  async publish(payload, creds) {
    const { accessToken, privacyLevel } = creds.tiktok;
    const headers = { authorization: `Bearer ${accessToken}` };
    const videos = payload.media.filter((m) => m.type === 'video');
    const images = payload.media.filter((m) => m.type === 'image');
    const title = (payload.title || payload.text || '').slice(0, 90);

    let res;
    if (videos.length > 0) {
      res = await postJson(`${API}/post/publish/video/init/`, {
        post_info: {
          title: payload.text.slice(0, 2200),
          privacy_level: privacyLevel || 'SELF_ONLY',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: { source: 'PULL_FROM_URL', video_url: videos[0].url },
      }, { headers });
    } else if (images.length > 0) {
      res = await postJson(`${API}/post/publish/content/init/`, {
        media_type: 'PHOTO',
        post_mode: 'DIRECT_POST',
        post_info: {
          title,
          description: payload.text.slice(0, 2200),
          privacy_level: privacyLevel || 'SELF_ONLY',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_cover_index: 0,
          photo_images: images.slice(0, 35).map((m) => m.url),
        },
      }, { headers });
    } else {
      throw new PlatformError('TikTok can it nhat 1 video hoac anh');
    }

    if (res?.error?.code && res.error.code !== 'ok') {
      throw new PlatformError(res.error.message || res.error.code, { body: res });
    }
    const publishId = res?.data?.publish_id;
    if (!publishId) throw new PlatformError('TikTok khong tra ve publish_id', { body: res });

    return {
      externalId: publishId,
      url: null,
      note: 'TikTok xu ly bat dong bo. Dung "Kiem tra trang thai" hoac mo Inbox ung dung TikTok de xac nhan.',
    };
  },

  /** Tra cuu trang thai xu ly cua mot lan dang. */
  async checkStatus(publishId, creds) {
    const res = await postJson(`${API}/post/publish/status/fetch/`, { publish_id: publishId }, {
      headers: { authorization: `Bearer ${creds.tiktok.accessToken}` },
    });
    return res?.data || res;
  },
};
