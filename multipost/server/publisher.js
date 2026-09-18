import { randomUUID } from 'node:crypto';
import { config, credentialsFrom } from './config.js';
import { store } from './store.js';
import { getPlatform, platforms } from './platforms/index.js';

/**
 * Chuan bi noi dung rieng cho tung nen tang:
 * - Lay ban ghi de (override) neu nguoi dung soan rieng, khong thi dung ban chung.
 * - Ghep hashtag va chu ky.
 */
export function buildPayload(post, platformId) {
  const override = post.overrides?.[platformId];
  const baseText = (override?.text ?? post.text ?? '').trim();
  const hashtags = (override?.hashtags ?? post.hashtags ?? [])
    .map((h) => (h.startsWith('#') ? h : `#${h}`))
    .join(' ');
  const signature = (post.signature || '').trim();
  const text = [baseText, hashtags, signature].filter(Boolean).join('\n\n');

  return {
    text,
    title: post.title || '',
    link: post.link || '',
    media: post.media || [],
  };
}

/** Kiem tra truoc khi dang, tra ve { platformId: [loi...] }. */
export function validatePost(post) {
  const report = {};
  for (const platformId of post.platforms) {
    const platform = getPlatform(platformId);
    report[platformId] = platform.validate(buildPayload(post, platformId));
  }
  return report;
}

/** Dang song song len tat ca nen tang duoc chon. */
export async function publishPost(postId) {
  const post = store.getPost(postId);
  if (!post) throw new Error('Khong tim thay bai dang');

  store.updatePost(postId, { status: 'publishing', startedAt: new Date().toISOString() });
  const creds = credentialsFrom(store.settings);

  const results = await Promise.all(
    post.platforms.map((platformId) => publishOne(post, platformId, creds)),
  );

  const anyOk = results.some((r) => r.status === 'ok' || r.status === 'simulated');
  const anyError = results.some((r) => r.status === 'error');
  const status = anyError ? (anyOk ? 'partial' : 'failed') : 'published';

  return store.updatePost(postId, { status, results, finishedAt: new Date().toISOString() });
}

async function publishOne(post, platformId, creds) {
  const startedAt = Date.now();
  const base = { platform: platformId, startedAt: new Date(startedAt).toISOString() };
  let platform;
  try {
    platform = getPlatform(platformId);
  } catch (err) {
    return { ...base, status: 'error', error: err.message, durationMs: 0 };
  }

  const payload = buildPayload(post, platformId);
  const errors = platform.validate(payload);
  if (errors.length > 0) {
    return { ...base, status: 'error', error: errors.join('; '), durationMs: Date.now() - startedAt };
  }

  const simulate = config.dryRun || post.dryRun || !platform.isConfigured(creds);
  if (simulate) {
    const reason = config.dryRun || post.dryRun
      ? 'Che do mo phong (DRY_RUN)'
      : `Chua cau hinh: ${platform.credentialKeys.join(', ')}`;
    return {
      ...base,
      status: 'simulated',
      externalId: `sim_${randomUUID().slice(0, 8)}`,
      url: null,
      note: reason,
      preview: payload.text.slice(0, 400),
      durationMs: Date.now() - startedAt,
    };
  }

  try {
    const res = await platform.publish(payload, creds);
    return {
      ...base,
      status: 'ok',
      externalId: res.externalId || null,
      url: res.url || null,
      note: res.note || null,
      durationMs: Date.now() - startedAt,
    };
  } catch (err) {
    return {
      ...base,
      status: 'error',
      error: err.message,
      detail: err.body ? JSON.stringify(err.body).slice(0, 800) : null,
      durationMs: Date.now() - startedAt,
    };
  }
}

/** Dang lai chi nhung nen tang that bai cua mot bai da co. */
export async function retryFailed(postId) {
  const post = store.getPost(postId);
  if (!post) throw new Error('Khong tim thay bai dang');
  const failed = (post.results || []).filter((r) => r.status === 'error').map((r) => r.platform);
  if (failed.length === 0) return post;

  const creds = credentialsFrom(store.settings);
  store.updatePost(postId, { status: 'publishing' });
  const retried = await Promise.all(failed.map((id) => publishOne(post, id, creds)));

  const merged = (post.results || []).map((r) => retried.find((n) => n.platform === r.platform) || r);
  const anyError = merged.some((r) => r.status === 'error');
  const anyOk = merged.some((r) => r.status === 'ok' || r.status === 'simulated');
  const status = anyError ? (anyOk ? 'partial' : 'failed') : 'published';

  return store.updatePost(postId, { status, results: merged, finishedAt: new Date().toISOString() });
}

export function platformIds() {
  return platforms.map((p) => p.id);
}
