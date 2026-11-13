// Phát hiện và chuyển kho EduPlan cũ trên CHÍNH trình duyệt này (mục 2B v1.1: dữ liệu cũ chỉ nằm ở IndexedDB/localStorage).
// Bản mới phải chạy cùng tên miền eduplan.thaykhoa-ai.tech mới đọc được kho cũ.
import { BANG_CU, lapKeHoach, doiSoat } from './migrate.js';
import { uid, now } from './db.js';

export const DB_CU = 'EduPlan5512DB', LS_CU = 'eduplan5512.tbl.', GIU_KHO_CU_NGAY = 30;

async function coIDBCu() {
  if (indexedDB.databases) { try { return (await indexedDB.databases()).some(d => d.name === DB_CU); } catch { /* bỏ qua */ } }
  return null; // trình duyệt không cho liệt kê → dựa vào bản sao localStorage
}
function docIDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_CU);
    r.onupgradeneeded = () => { r.transaction.abort(); res(null); }; // không tồn tại → không tạo mới
    r.onerror = () => res(null);
    r.onsuccess = async () => {
      const db = r.result, out = {};
      try {
        for (const b of BANG_CU) {
          out[b] = db.objectStoreNames.contains(b) ? await new Promise((ok, ko) => { const q = db.transaction(b).objectStore(b).getAll(); q.onsuccess = () => ok(q.result || []); q.onerror = () => ko(q.error); }) : [];
        }
        db.close(); res(out);
      } catch (e) { db.close(); rej(e); }
    };
  });
}
function docLS() {
  const out = {}; let co = false;
  for (const b of BANG_CU) { try { out[b] = JSON.parse(localStorage.getItem(LS_CU + b) || '[]'); } catch { out[b] = []; } if (out[b].length) co = true; }
  return co ? out : null;
}

/** → null | { nguon, du_lieu, so_ban_ghi, api_key_cu } */
export async function phatHienKhoCu() {
  let du_lieu = null, nguon = null;
  const coIDB = await coIDBCu();
  if (coIDB !== false) { du_lieu = await docIDB().catch(() => null); nguon = 'IndexedDB'; }
  if (!du_lieu || !BANG_CU.some(b => du_lieu[b]?.length)) { du_lieu = docLS(); nguon = 'localStorage'; }
  if (!du_lieu) return null;
  let api_key_cu = '';
  try { api_key_cu = JSON.parse(localStorage.getItem('eduplan5512.settings') || '{}').apiKey || ''; } catch { /* bỏ qua */ }
  return { nguon, du_lieu, so_ban_ghi: Object.fromEntries(BANG_CU.map(b => [b, du_lieu[b].length])), api_key_cu };
}

const hienCo = kho => ({
  users: new Set(kho.where('users', r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id)),
  lessons: new Set(kho.where('lessons', r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id)),
  reviews: new Set(kho.where('reviews', r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id)),
  audits: new Set(kho.where('audits', r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id)),
  activity_logs: new Set(kho.where('activity_logs', r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id))
});
const idDaCo = kho => ({
  users: Object.fromEntries(kho.where('users', r => r.nguon_du_lieu === 'eduplan_cu').map(r => [r.legacy_id, r.id])),
  lessons: Object.fromEntries(kho.where('lessons', r => r.nguon_du_lieu === 'eduplan_cu').map(r => [r.legacy_id, r.id]))
});

/** Xem trước (dry-run): không ghi gì vào CSDL, chỉ trả kế hoạch + báo cáo. */
export function xemTruoc(kho, cu) { return lapKeHoach(cu, hienCo(kho), { idDaCo: idDaCo(kho), newId: uid }); }

/**
 * Di trú thật: ghi trong 1 giao dịch, ghi migration_logs, đối soát, rà soát lại KHBD (không đổi trạng thái duyệt).
 * @param raSoat (lesson) => audit | null — do app truyền vào (dùng rules.js)
 */
export async function diTru(kho, cu, { nguoiChay, dryRun = false, raSoat, nguon = 'trình duyệt' } = {}) {
  const ke = xemTruoc(kho, cu);
  const log = { id: uid('mig'), luc: now(), dry_run: dryRun, nguon, nguoi_chay: nguoiChay?.ho_ten || '', bao_cao: ke.baoCao, loi: ke.loi };
  if (dryRun || ke.loi.length) {
    log.ket_qua = ke.loi.length ? 'dừng: có bản ghi lỗi (mục 11)' : 'dry-run';
    await kho.put('migration_logs', log);
    return { ...ke, log };
  }
  await kho.putMany(ke.ops);
  if (raSoat) {
    const audits = ke.ops.lessons.map(l => raSoat(l)).filter(Boolean);
    await kho.putMany({ audits });
  }
  const moi = { users: kho.all('users'), lessons: kho.all('lessons'), reviews: kho.all('reviews'), audits: kho.all('audits'), activity_logs: kho.all('activity_logs') };
  log.doi_soat = doiSoat(cu, moi);
  log.ket_qua = log.doi_soat.lech.length ? 'lệch đối soát — cần kiểm tra (mục 11)' : 'thành công';
  await kho.put('migration_logs', log);
  const giu = new Date(Date.now() + GIU_KHO_CU_NGAY * 864e5).toISOString();
  await kho.setSetting('di_tru_eduplan_cu', { luc: log.luc, giu_kho_cu_den: giu });
  return { ...ke, log };
}

/** Chỉ cho xóa kho cũ sau 30 ngày kể từ lần di trú thành công. */
export async function xoaKhoCu(kho) {
  const tt = kho.setting('di_tru_eduplan_cu');
  if (!tt || new Date(tt.giu_kho_cu_den) > new Date()) throw new Error(`Kho cũ được giữ đến ${tt ? new Date(tt.giu_kho_cu_den).toLocaleDateString('vi-VN') : '(chưa di trú)'}.`);
  await new Promise(res => { const r = indexedDB.deleteDatabase(DB_CU); r.onsuccess = r.onerror = r.onblocked = () => res(); });
  BANG_CU.forEach(b => localStorage.removeItem(LS_CU + b));
  await kho.setSetting('di_tru_eduplan_cu', { ...tt, da_xoa_kho_cu_luc: now() });
}
