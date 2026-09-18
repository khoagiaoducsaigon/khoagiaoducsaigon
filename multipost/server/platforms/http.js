/** Tien ich goi HTTP dung chung cho cac adapter nen tang. */

export class PlatformError extends Error {
  constructor(message, { status, body, hint } = {}) {
    super(message);
    this.name = 'PlatformError';
    this.status = status;
    this.body = body;
    this.hint = hint;
  }
}

const DEFAULT_TIMEOUT = 60_000;

async function request(url, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...rest, signal: controller.signal });
    const text = await res.text();
    let body;
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    if (!res.ok) {
      throw new PlatformError(extractMessage(body) || `HTTP ${res.status}`, { status: res.status, body });
    }
    return body;
  } catch (err) {
    if (err instanceof PlatformError) throw err;
    if (err.name === 'AbortError') throw new PlatformError(`Qua thoi gian cho (${timeout / 1000}s)`);
    throw new PlatformError(err.message);
  } finally {
    clearTimeout(timer);
  }
}

function extractMessage(body) {
  if (!body || typeof body !== 'object') return null;
  return (
    body?.error?.message ||          // Graph API (Facebook / Instagram / Threads / WhatsApp)
    body?.error?.error_user_msg ||
    body?.description ||             // Telegram
    body?.error?.message_detail ||   // TikTok
    body?.error?.code ||
    null
  );
}

export function postForm(url, params, options = {}) {
  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    form.set(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
  }
  return request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: form,
    ...options,
  });
}

export function postJson(url, payload, { headers = {}, ...options } = {}) {
  return request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=UTF-8', ...headers },
    body: JSON.stringify(payload),
    ...options,
  });
}

export function getJson(url, options = {}) {
  return request(url, { method: 'GET', ...options });
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Doi mot container media xu ly xong (Instagram / Threads).
 * poll() tra ve { done, error } - lap toi da `tries` lan.
 */
export async function waitUntilReady(poll, { tries = 20, intervalMs = 3000 } = {}) {
  for (let i = 0; i < tries; i += 1) {
    const { done, error } = await poll(i);
    if (error) throw new PlatformError(error);
    if (done) return true;
    await sleep(intervalMs);
  }
  throw new PlatformError('Media chua xu ly xong sau thoi gian cho toi da');
}
