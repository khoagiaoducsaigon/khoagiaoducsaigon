import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { config, credentialsFrom, CREDENTIAL_KEYS, SECRET_KEYS, maskSecret, MEDIA_DIR } from './config.js';
import { store } from './store.js';
import { describePlatforms, getPlatform, platformMap } from './platforms/index.js';
import { publishPost, retryFailed, validatePost } from './publisher.js';

const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const EXT_BY_MIME = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm',
};

export async function handleApi(req, res, url) {
  const route = url.pathname.replace(/^\/api/, '') || '/';
  const method = req.method;

  if (route === '/health') return json(res, 200, { ok: true, dryRun: config.dryRun, time: new Date().toISOString() });

  if (route === '/platforms' && method === 'GET') {
    return json(res, 200, { platforms: describePlatforms(credentialsFrom(store.settings)), dryRun: config.dryRun });
  }

  if (route === '/settings' && method === 'GET') {
    const stored = store.settings;
    const out = {};
    for (const key of CREDENTIAL_KEYS) {
      const value = stored[key] ?? process.env[key] ?? '';
      out[key] = SECRET_KEYS.has(key) ? maskSecret(value) : value;
      out[`${key}__set`] = Boolean(value);
      out[`${key}__fromEnv`] = !stored[key] && Boolean(process.env[key]);
    }
    return json(res, 200, { settings: out, publicBaseUrl: config.publicBaseUrl, dryRun: config.dryRun });
  }

  if (route === '/settings' && method === 'POST') {
    const body = await readJson(req);
    const patch = {};
    for (const key of CREDENTIAL_KEYS) {
      if (!(key in body)) continue;
      const value = String(body[key] ?? '').trim();
      if (SECRET_KEYS.has(key) && value.includes('••')) continue; // gia tri bi che, giu nguyen
      patch[key] = value;
    }
    store.saveSettings(patch);
    return json(res, 200, { ok: true, platforms: describePlatforms(credentialsFrom(store.settings)) });
  }

  if (route === '/upload' && method === 'POST') return handleUpload(req, res);

  if (route === '/validate' && method === 'POST') {
    const body = await readJson(req);
    const post = normalizePost(body);
    return json(res, 200, { report: validatePost(post), payloads: previewPayloads(post) });
  }

  if (route === '/posts' && method === 'GET') {
    const status = new URL(url).searchParams.get('status') || undefined;
    return json(res, 200, { posts: store.listPosts({ status }), stats: store.stats() });
  }

  if (route === '/posts' && method === 'POST') {
    const body = await readJson(req);
    let post;
    try { post = normalizePost(body); } catch (err) { return json(res, 400, { error: err.message }); }

    const report = validatePost(post);
    const blocking = Object.entries(report).filter(([, errs]) => errs.length > 0);
    if (blocking.length > 0 && !body.force) {
      return json(res, 400, { error: 'Noi dung chua hop le', report });
    }

    const record = {
      id: randomUUID(),
      ...post,
      status: post.scheduledAt ? 'scheduled' : 'queued',
      results: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.insertPost(record);

    if (record.status === 'scheduled') return json(res, 201, { post: record });

    const published = await publishPost(record.id);
    return json(res, 201, { post: published });
  }

  const postMatch = route.match(/^\/posts\/([\w-]+)(\/(retry|publish|status))?$/);
  if (postMatch) {
    const [, id, , action] = postMatch;
    const post = store.getPost(id);
    if (!post) return json(res, 404, { error: 'Khong tim thay bai dang' });

    if (method === 'GET') return json(res, 200, { post });
    if (method === 'DELETE') {
      store.deletePost(id);
      return json(res, 200, { ok: true });
    }
    if (method === 'POST' && action === 'retry') return json(res, 200, { post: await retryFailed(id) });
    if (method === 'POST' && action === 'publish') {
      store.updatePost(id, { scheduledAt: null });
      return json(res, 200, { post: await publishPost(id) });
    }
    if (method === 'POST' && action === 'status') return json(res, 200, { post: await refreshStatus(post) });
  }

  if (route === '/templates' && method === 'GET') return json(res, 200, { templates: store.listTemplates() });
  if (route === '/templates' && method === 'POST') {
    const body = await readJson(req);
    if (!body.name) return json(res, 400, { error: 'Thieu ten mau' });
    return json(res, 200, {
      template: store.saveTemplate({
        id: body.id || randomUUID(),
        name: String(body.name),
        text: String(body.text || ''),
        hashtags: Array.isArray(body.hashtags) ? body.hashtags : [],
        platforms: Array.isArray(body.platforms) ? body.platforms : [],
        updatedAt: new Date().toISOString(),
      }),
    });
  }
  const tplMatch = route.match(/^\/templates\/([\w-]+)$/);
  if (tplMatch && method === 'DELETE') return json(res, 200, { ok: store.deleteTemplate(tplMatch[1]) });

  if (route === '/stats' && method === 'GET') return json(res, 200, store.stats());

  return json(res, 404, { error: `Khong co API ${method} ${route}` });
}

/** Chuan hoa va kiem tra du lieu bai dang tu giao dien. */
function normalizePost(body) {
  const platformIds = Array.isArray(body.platforms) ? body.platforms.filter((p) => platformMap.has(p)) : [];
  if (platformIds.length === 0) throw new Error('Chua chon nen tang nao');

  const media = (Array.isArray(body.media) ? body.media : [])
    .map((m) => ({
      url: String(m.url || '').trim(),
      type: m.type === 'video' ? 'video' : 'image',
      name: m.name ? String(m.name) : undefined,
    }))
    .filter((m) => m.url);

  let scheduledAt = null;
  if (body.scheduledAt) {
    const t = Date.parse(body.scheduledAt);
    if (Number.isNaN(t)) throw new Error('Thoi diem hen gio khong hop le');
    if (t > Date.now() + 5000) scheduledAt = new Date(t).toISOString();
  }

  const overrides = {};
  for (const [key, value] of Object.entries(body.overrides || {})) {
    if (!platformMap.has(key) || !value) continue;
    const entry = {};
    if (typeof value.text === 'string' && value.text.trim()) entry.text = value.text;
    if (Array.isArray(value.hashtags) && value.hashtags.length) entry.hashtags = value.hashtags;
    if (Object.keys(entry).length) overrides[key] = entry;
  }

  return {
    text: String(body.text || ''),
    title: String(body.title || ''),
    link: String(body.link || ''),
    signature: String(body.signature || ''),
    hashtags: (Array.isArray(body.hashtags) ? body.hashtags : []).map(String).filter(Boolean),
    media,
    platforms: platformIds,
    overrides,
    scheduledAt,
    dryRun: Boolean(body.dryRun),
  };
}

function previewPayloads(post) {
  const out = {};
  for (const id of post.platforms) {
    const platform = getPlatform(id);
    const payload = { text: buildText(post, id), media: post.media };
    out[id] = { text: payload.text, length: payload.text.length, limit: platform.limits.text };
  }
  return out;
}

function buildText(post, platformId) {
  const override = post.overrides?.[platformId];
  const baseText = (override?.text ?? post.text ?? '').trim();
  const hashtags = (override?.hashtags ?? post.hashtags ?? [])
    .map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
  return [baseText, hashtags, (post.signature || '').trim()].filter(Boolean).join('\n\n');
}

async function refreshStatus(post) {
  const creds = credentialsFrom(store.settings);
  const results = await Promise.all((post.results || []).map(async (r) => {
    const platform = platformMap.get(r.platform);
    if (!platform?.checkStatus || r.status !== 'ok' || !r.externalId) return r;
    try {
      const st = await platform.checkStatus(r.externalId, creds);
      return { ...r, remoteStatus: st?.status || null, note: st?.status ? `Trang thai: ${st.status}` : r.note };
    } catch (err) {
      return { ...r, remoteStatus: `loi: ${err.message}` };
    }
  }));
  return store.updatePost(post.id, { results });
}

/** Upload media duoi dang base64 JSON - tranh phai tu viet bo phan tich multipart. */
async function handleUpload(req, res) {
  const body = await readJson(req, MAX_UPLOAD_BYTES * 1.4);
  const { name = 'media', mime = '', data = '' } = body;
  if (!data) return json(res, 400, { error: 'Thieu du lieu file' });

  const buffer = Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ''), 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return json(res, 413, { error: `File vuot qua ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` });
  }

  const ext = EXT_BY_MIME[mime] || path.extname(String(name)).slice(0, 6) || '.bin';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  fs.writeFileSync(path.join(MEDIA_DIR, filename), buffer);

  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(config.publicBaseUrl);
  return json(res, 201, {
    url: `${config.publicBaseUrl}/media/${filename}`,
    type: mime.startsWith('video') ? 'video' : 'image',
    name: String(name),
    size: buffer.length,
    warning: isLocal
      ? 'PUBLIC_BASE_URL dang tro ve localhost. Instagram, Threads va TikTok can URL cong khai moi tai duoc media.'
      : null,
  });
}

export function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'cache-control': 'no-store',
  });
  res.end(body);
}

function readJson(req, limit = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(new Error('Du lieu gui len qua lon')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(new Error('JSON khong hop le')); }
    });
    req.on('error', reject);
  });
}
