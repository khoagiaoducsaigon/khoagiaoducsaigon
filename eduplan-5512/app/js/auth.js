// Mật khẩu: PBKDF2-SHA256 (WebCrypto), muối riêng từng tài khoản.
// Đọc được mật khẩu băm của EduPlan cũ ('sha256:' muối chung, 'djb2:' dự phòng) để băm lại khi đăng nhập lần đầu.
const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
export const PBKDF2_ITER = 120000;

async function derive(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, key, 256);
}

export async function hashPassword(pw, iter = PBKDF2_ITER) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${iter}$${b64(salt)}$${b64(await derive(pw, salt, iter))}`;
}

/** Thuật toán của EduPlan cũ (index.html v1): 'sha256:' + hex(SHA-256('eduplan5512::' + pw)), dự phòng 'djb2:'. */
export async function legacyHash(pw) {
  return 'sha256:' + hex(await crypto.subtle.digest('SHA-256', enc.encode('eduplan5512::' + pw)));
}
export function legacyDjb2(pw) {
  const s = 'eduplan5512::' + pw; let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return 'djb2:' + h.toString(16);
}

const sameStr = (a, b) => a.length === b.length && [...a].reduce((d, c, i) => d | (c.charCodeAt(0) ^ b.charCodeAt(i)), 0) === 0;

/** → { ok, bam_lai } — bam_lai=true: đăng nhập đúng bằng thuật toán cũ, cần lưu lại bằng PBKDF2. */
export async function verifyPassword(pw, stored = '') {
  if (stored.startsWith('pbkdf2$')) {
    const [, iter, salt, hash] = stored.split('$');
    return { ok: sameStr(b64(await derive(pw, unb64(salt), +iter)), hash), bam_lai: false };
  }
  if (stored.startsWith('sha256:')) return { ok: sameStr(await legacyHash(pw), stored), bam_lai: true };
  if (stored.startsWith('djb2:')) return { ok: sameStr(legacyDjb2(pw), stored), bam_lai: true };
  return { ok: false, bam_lai: false };
}

export const QUYEN = {
  giao_vien: ['soan', 'ra_soat', 'nop', 'kho'],
  to_truong: ['soan', 'ra_soat', 'nop', 'kho', 'duyet_to', 'du_gio'],
  bgh: ['soan', 'ra_soat', 'kho', 'duyet_bgh', 'du_gio', 'dashboard'],
  admin: ['soan', 'ra_soat', 'kho', 'duyet_bgh', 'du_gio', 'dashboard', 'quan_tri', 'di_tru']
};
export const TEN_VAI_TRO = { giao_vien: 'Giáo viên bộ môn', to_truong: 'Tổ trưởng chuyên môn', bgh: 'Ban Giám hiệu', admin: 'BGH / Quản trị' };
export const co = (user, q) => !!user && (QUYEN[user.vai_tro] || []).includes(q);
