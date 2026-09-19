import { PlatformError } from './http.js';
import { store } from '../store.js';

const OPEN_API = 'https://openapi.zalo.me';
const OAUTH_URL = 'https://oauth.zaloapp.com/v4/oa/access_token';

/** Ma loi Zalo bao token het han hoac khong hop le. */
const TOKEN_ERRORS = new Set([-216, -201, -32, 401]);

export default {
  id: 'zalo',
  name: 'Zalo OA',
  emoji: '💙',
  color: '#0068FF',
  limits: { text: 2000, title: 100, images: 1, videos: 0 },
  mediaSupport: { text: true, image: true, video: false, multiImage: false },
  credentialKeys: [
    'ZALO_OA_ACCESS_TOKEN', 'ZALO_POST_MODE', 'ZALO_USER_IDS',
    'ZALO_APP_ID', 'ZALO_APP_SECRET', 'ZALO_OA_REFRESH_TOKEN',
  ],
  docs: 'https://developers.zalo.me/docs/official-account/bat-dau',
  requiredKeys: ['ZALO_OA_ACCESS_TOKEN', 'ZALO_USER_IDS'],
  warning: 'Access token của Zalo OA chỉ sống 1 giờ. Khai báo thêm App ID, App Secret và Refresh Token để hệ thống tự làm mới.',

  isConfigured: (c) => Boolean(
    (c.zalo.accessToken || (c.zalo.refreshToken && c.zalo.appId && c.zalo.appSecret))
    && (c.zalo.mode === 'article' || c.zalo.userIds.length > 0),
  ),

  validate(payload, creds) {
    const errors = [];
    const mode = creds?.zalo?.mode || 'message';
    if (!payload.text && payload.media.length === 0) errors.push('Zalo OA cần nội dung chữ hoặc ảnh');
    if (payload.text.length > 2000) {
      errors.push(`Tin nhắn Zalo OA tối đa 2.000 ký tự (đang có ${payload.text.length})`);
    }
    if (payload.media.some((m) => m.type === 'video')) {
      errors.push('Zalo OA qua API này chỉ gửi ảnh — video sẽ bị bỏ qua');
    }
    if (mode !== 'article' && payload.media.filter((m) => m.type === 'image').length > 1) {
      errors.push('Tin nhắn Zalo OA chỉ kèm 1 ảnh — chỉ ảnh đầu tiên được dùng');
    }
    return errors;
  },

  async publish(payload, creds) {
    const mode = creds.zalo.mode || 'message';
    const notes = [];
    const ids = [];

    if (mode === 'article' || mode === 'both') {
      const article = await createArticle(payload, creds);
      ids.push(article.id);
      notes.push(article.note);
    }
    if (mode === 'message' || mode === 'both') {
      const sent = await sendToFollowers(payload, creds);
      ids.push(...sent.ids);
      notes.push(sent.note);
    }

    return {
      externalId: ids.filter(Boolean).join(',') || null,
      url: null,
      note: notes.filter(Boolean).join(' · '),
    };
  },
};

/* ---------------------- Bài viết trên trang OA ---------------------- */
async function createArticle(payload, creds) {
  const cover = payload.media.find((m) => m.type === 'image');
  const body = {
    type: 'normal',
    title: (payload.title || payload.text.split('\n')[0] || 'Thông báo').slice(0, 100),
    author: creds.zalo.author || '',
    description: payload.text.slice(0, 500),
    body: [{ type: 'text', content: payload.text }],
    status: 'show',
    comment: 'hide',
    ...(cover ? { cover: { cover_type: 'photo', photo_url: cover.url, status: 'show' } } : {}),
  };

  const res = await zaloCall(creds, `${OPEN_API}/v2.0/article/create`, body);
  const id = res?.data?.id || res?.data?.token || null;
  return { id, note: `Đã tạo bài viết trên trang OA${id ? ` (${id})` : ''}` };
}

/* ---------------------- Tin nhắn tới người theo dõi ---------------------- */
async function sendToFollowers(payload, creds) {
  const { userIds } = creds.zalo;
  if (userIds.length === 0) throw new PlatformError('Chưa khai báo ZALO_USER_IDS');

  const image = payload.media.find((m) => m.type === 'image');
  let attachmentId = null;
  if (image) attachmentId = await uploadImage(image.url, creds);

  const ids = [];
  const failures = [];
  for (const userId of userIds) {
    const message = attachmentId
      ? {
          text: payload.text.slice(0, 2000),
          attachment: {
            type: 'template',
            payload: { template_type: 'media', elements: [{ media_type: 'image', attachment_id: attachmentId }] },
          },
        }
      : { text: payload.text.slice(0, 2000) };

    try {
      const res = await zaloCall(creds, `${OPEN_API}/v3.0/oa/message/cs`, {
        recipient: { user_id: userId },
        message,
      });
      const id = res?.data?.message_id || res?.data?.msg_id;
      if (id) ids.push(id);
    } catch (err) {
      // Loi xac thuc anh huong moi nguoi nhan - dung ngay, dung goi API 
      // them mot lan cho tung nguoi con lai.
      if (err.fatal) throw err;
      failures.push(`${userId}: ${err.message}`);
    }
  }

  if (ids.length === 0) {
    throw new PlatformError(failures.join(' | ') || 'Không gửi được tới người theo dõi nào');
  }
  return {
    ids,
    note: failures.length
      ? `Gửi thành công ${ids.length}/${userIds.length}. Lỗi: ${failures.join(' | ')}`
      : `Đã gửi tới ${ids.length} người theo dõi`,
  };
}

/** Tai anh tu URL roi day len Zalo de lay attachment_id. */
async function uploadImage(url, creds) {
  let blob;
  try {
    const download = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    if (!download.ok) throw new Error(`HTTP ${download.status}`);
    blob = await download.blob();
  } catch (err) {
    throw new PlatformError(`Không tải được ảnh từ ${url}: ${err.message}`);
  }

  const form = new FormData();
  form.append('file', blob, url.split('/').pop() || 'image.jpg');
  const res = await zaloCall(creds, `${OPEN_API}/v2.0/oa/upload/image`, form);

  const attachmentId = res?.data?.attachment_id;
  if (!attachmentId) throw new PlatformError('Zalo không trả về attachment_id', { body: res });
  return attachmentId;
}

/**
 * Goi Open API cua Zalo. Zalo tra ve HTTP 200 kem ma loi trong than tin,
 * nen phai kiem tra `error !== 0`. Gap loi token thi tu lam moi mot lan roi thu lai.
 */
async function zaloCall(creds, url, body, { retried = false } = {}) {
  const accessToken = creds.zalo.accessToken;
  if (!accessToken) {
    if (retried) throw fatal(new PlatformError('Chưa có ZALO_OA_ACCESS_TOKEN'));
    await refreshAccessToken(creds);
    return zaloCall(creds, url, body, { retried: true });
  }

  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { access_token: accessToken, ...(isForm ? {} : { 'content-type': 'application/json' }) },
      body: isForm ? body : JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    throw new PlatformError(`Không gọi được Zalo API: ${err.message}`);
  }

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

  const code = Number(data?.error ?? 0);
  if (code === 0 && res.ok) return data;

  if (!retried && (TOKEN_ERRORS.has(code) || res.status === 401)) {
    await refreshAccessToken(creds);
    return zaloCall(creds, url, body, { retried: true });
  }

  throw new PlatformError(data?.message || `Zalo trả về lỗi ${code || res.status}`, {
    status: res.status, body: data,
  });
}

/**
 * Lam moi access token bang refresh token.
 * Zalo cap refresh token moi moi lan goi, phai luu lai ngay neu khong lan sau se hong.
 */
async function refreshAccessToken(creds) {
  const { appId, appSecret, refreshToken } = creds.zalo;
  if (!appId || !appSecret || !refreshToken) {
    throw fatal(new PlatformError(
      'Access token Zalo đã hết hạn. Khai báo ZALO_APP_ID, ZALO_APP_SECRET và ZALO_OA_REFRESH_TOKEN để tự làm mới.',
    ));
  }

  const form = new URLSearchParams({ refresh_token: refreshToken, app_id: appId, grant_type: 'refresh_token' });
  let res;
  try {
    res = await fetch(OAUTH_URL, {
      method: 'POST',
      headers: { secret_key: appSecret, 'content-type': 'application/x-www-form-urlencoded' },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw fatal(new PlatformError(`Không làm mới được token Zalo: ${err.message}`));
  }

  const data = await res.json().catch(() => ({}));
  if (!data.access_token) {
    throw fatal(new PlatformError(
      data?.error_description || data?.error_name || 'Zalo từ chối làm mới token', { body: data },
    ));
  }

  creds.zalo.accessToken = data.access_token;
  if (data.refresh_token) creds.zalo.refreshToken = data.refresh_token;

  store.saveSettings({
    ZALO_OA_ACCESS_TOKEN: data.access_token,
    ...(data.refresh_token ? { ZALO_OA_REFRESH_TOKEN: data.refresh_token } : {}),
  });
  console.log('[zalo] da lam moi access token');
}

/** Danh dau loi anh huong toan bo lan dang, khong rieng mot nguoi nhan. */
function fatal(err) {
  err.fatal = true;
  return err;
}
