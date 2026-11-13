// Di trú dữ liệu EduPlan cũ (IndexedDB 'EduPlan5512DB' / localStorage 'eduplan5512.tbl.*') sang CSDL mới.
// Hàm thuần: lapKeHoach(cu, hienCo) → { ops, baoCao, loi }. Ghi CSDL do db.js đảm nhận.
// Nguyên tắc (docs/eduplan-mapping.md đã duyệt 13/11/2026):
//  - Khóa chống trùng: legacy_id; chạy lại không nhân đôi.
//  - Dữ liệu mẫu của bản cũ không di trú, TRỪ bản ghi mẫu được dữ liệu thật tham chiếu hoặc đã bị sửa.
//  - Trường không có chỗ → legacy{}; trạng thái duyệt cũ giữ nguyên.
import { parseText, capHoc } from './khung.js';

export const BANG_CU = ['users', 'lesson_plans', 'ai_audits', 'review_notes', 'audit_logs'];
export const MAU_CU = {
  users: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
  lesson_plans: ['lp1', 'lp2', 'lp3'],
  ai_audits: ['a1', 'a2', 'a3', 'a4', 'a5'],
  review_notes: ['r1', 'r2', 'r3', 'r4', 'r5'],
  audit_logs: Array.from({ length: 15 }, (_, i) => 'log' + String(i + 1).padStart(3, '0'))
};
const MAU_KHBD_GOC = { lp1: { status: 'approved', versions: 2 }, lp2: { status: 'pending', versions: 2 }, lp3: { status: 'revise', versions: 1 } };
const BIET = {
  users: ['id', 'name', 'email', 'code', 'role', 'dept', 'grades', 'title', 'password', 'status', 'canApprove', 'createdAt'],
  lesson_plans: ['id', 'title', 'subject', 'grade', 'book', 'term', 'dept', 'schoolYear', 'teacherId', 'content', 'status', 'versions'],
  ai_audits: ['id', 'planId', 'version', 'at', 'by', 'engine', 'compliance', 'activeness', 'steps', 'suggestions'],
  review_notes: ['id', 'planId', 'version', 'reviewerId', 'reviewerName', 'level', 'verdict', 'at', 'strengths', 'weaknesses', 'solutions', 'stepNotes', 'general'],
  audit_logs: ['id', 'at', 'userId', 'userName', 'role', 'action', 'target', 'detail']
};
export const VAI_TRO = { admin: 'admin', leader: 'to_truong', teacher: 'giao_vien' };
export const TRANG_THAI = { draft: 'ban_nhap', revise: 'yeu_cau_chinh_sua', approved: 'da_duyet' };
const trangThai = p => (p.status === 'pending' ? (p.ttSignedBy ? 'cho_bgh_duyet' : 'cho_to_duyet') : TRANG_THAI[p.status] || 'ban_nhap');
const conLai = (rec, bang) => Object.fromEntries(Object.entries(rec).filter(([k]) => !BIET[bang].includes(k)));
const laMau = (bang, rec) => MAU_CU[bang].includes(rec.id);

/** Một bản ghi mẫu "đã bị sửa" so với dữ liệu mẫu gốc của bản cũ. */
function mauDaSua(bang, rec) {
  if (bang !== 'lesson_plans') return false;
  const g = MAU_KHBD_GOC[rec.id];
  return !!g && (rec.status !== g.status || (rec.versions || []).length !== g.versions);
}

/**
 * @param cu      { users:[], lesson_plans:[], ai_audits:[], review_notes:[], audit_logs:[] } — dữ liệu bản cũ
 * @param hienCo  { [store]: Set<legacy_id> } — legacy_id đã có trong CSDL mới (để không nhân đôi)
 * @param opts    { now, newId(prefix) }
 */
export function lapKeHoach(cu, hienCo = {}, opts = {}) {
  const now = opts.now || new Date().toISOString();
  let seq = 0;
  const newId = opts.newId || (p => `${p}_m${Date.now().toString(36)}${(seq++).toString(36)}`);
  const daCo = (store, lid) => hienCo[store]?.has(lid);
  const goc = { legacy_id: null, nguon_du_lieu: 'eduplan_cu', ngay_di_tru: now };
  const baoCao = {}, loi = [];
  const ops = { users: [], lessons: [], lesson_versions: [], reviews: [], audits: [], activity_logs: [] };
  BANG_CU.forEach(b => { baoCao[b] = { doc: (cu[b] || []).length, ghi: 0, bo_qua_mau: 0, bo_qua_da_co: 0, loi: 0 }; });

  // 1) Xác định bản ghi mẫu nào phải giữ (được tham chiếu bởi dữ liệu thật, hoặc đã bị sửa)
  const thatPlans = (cu.lesson_plans || []).filter(p => !laMau('lesson_plans', p) || mauDaSua('lesson_plans', p));
  const giuPlan = new Set(thatPlans.map(p => p.id));
  for (const b of ['ai_audits', 'review_notes']) (cu[b] || []).filter(r => !laMau(b, r)).forEach(r => giuPlan.add(r.planId));
  const plans = (cu.lesson_plans || []).filter(p => giuPlan.has(p.id));
  const audits = (cu.ai_audits || []).filter(a => giuPlan.has(a.planId) && (!laMau('ai_audits', a) || mauDaSua('lesson_plans', (cu.lesson_plans || []).find(p => p.id === a.planId) || {})));
  const notes = (cu.review_notes || []).filter(n => giuPlan.has(n.planId) && (!laMau('review_notes', n) || mauDaSua('lesson_plans', (cu.lesson_plans || []).find(p => p.id === n.planId) || {})));
  const logs = (cu.audit_logs || []).filter(l => !laMau('audit_logs', l));
  const giuUser = new Set((cu.users || []).filter(u => !laMau('users', u)).map(u => u.id));
  plans.forEach(p => giuUser.add(p.teacherId)); notes.forEach(n => giuUser.add(n.reviewerId)); logs.forEach(l => giuUser.add(l.userId));
  const users = (cu.users || []).filter(u => giuUser.has(u.id));
  const dem = (b, giu) => { baoCao[b].bo_qua_mau = (cu[b] || []).length - giu.length; };
  dem('users', users); dem('lesson_plans', plans); dem('ai_audits', audits); dem('review_notes', notes); dem('audit_logs', logs);

  // 2) Ánh xạ người dùng (id cũ → id mới; nếu đã di trú trước đó thì dùng lại id mới đã có)
  const uMap = new Map(Object.entries(opts.idDaCo?.users || {}));
  const pMap = new Map(Object.entries(opts.idDaCo?.lessons || {}));
  for (const u of users) {
    if (daCo('users', u.id)) { baoCao.users.bo_qua_da_co++; continue; }
    try {
      if (!u.email && !u.code) throw new Error('thiếu email và mã GV');
      const id = newId('u'); uMap.set(u.id, id);
      ops.users.push({ ...goc, legacy_id: u.id, id, ho_ten: u.name, email: u.email || '', ma_gv: u.code || '', vai_tro: VAI_TRO[u.role] || 'giao_vien',
        to_chuyen_mon: u.dept || '', cap_hoc: '', khoi_phu_trach: String(u.grades || '').split(/[,;\s]+/).filter(Boolean), chuc_danh: u.title || '',
        mat_khau_bam: u.password || '', phai_doi_mat_khau: String(u.password || '').startsWith('djb2:') || !u.password,
        trang_thai: u.status || 'active', quyen_duyet: !!u.canApprove, tao_luc: u.createdAt || now, cap_nhat_luc: now, legacy: conLai(u, 'users') });
      baoCao.users.ghi++;
    } catch (e) { baoCao.users.loi++; loi.push({ bang: 'users', legacy_id: u.id, loi: e.message }); }
  }
  const uid = old => uMap.get(old) || null;

  // 3) KHBD + phiên bản
  for (const p of plans) {
    if (daCo('lessons', p.id)) { baoCao.lesson_plans.bo_qua_da_co++; continue; }
    try {
      if (!p.title) throw new Error('thiếu tên bài');
      const id = newId('l'); pMap.set(p.id, id);
      const tiet = (String(p.content || '').match(/(\d+)\s*ti[ếe]t/i) || [])[1];
      const versions = (p.versions && p.versions.length) ? p.versions : [{ v: 1, at: p.createdAt || now, by: p.teacherName || '', note: 'Bản gốc', content: p.content || '' }];
      ops.lessons.push({ ...goc, legacy_id: p.id, id, ten_bai: p.title, cap_hoc: capHoc(p.grade || 10), mon: p.subject || '', lop: +p.grade || null, bo_sach: p.book || '',
        hoc_ky: p.term || '', nam_hoc: p.schoolYear || '', so_tiet: tiet ? +tiet : null, khung: 'PL4-5512', yccd_ids: [], noi_dung: parseText(p.content || ''),
        trang_thai: trangThai(p), phien_ban_hien_tai: versions.length, giao_vien_id: uid(p.teacherId), to: p.dept || '', nhan: 'nhập từ EduPlan', che_do: 'ra_soat_nhanh',
        tao_luc: p.createdAt || now, cap_nhat_luc: p.updatedAt || now, nop_luc: p.submittedAt || null, legacy: conLai(p, 'lesson_plans') });
      versions.forEach((v, i) => ops.lesson_versions.push({ ...goc, legacy_id: `${p.id}#v${v.v ?? i + 1}`, id: newId('lv'), lesson_id: id, so_phien_ban: v.v ?? i + 1,
        noi_dung: parseText(v.content || ''), ghi_chu: v.note || '', nguoi_sua: v.by || '', luc: v.at || now, legacy: { score: v.score ?? null } }));
      baoCao.lesson_plans.ghi++;
    } catch (e) { baoCao.lesson_plans.loi++; loi.push({ bang: 'lesson_plans', legacy_id: p.id, loi: e.message }); }
  }
  const lid = old => pMap.get(old) || null;

  // 4) Phiếu nhận xét → reviews (giữ nguyên người duyệt, thời điểm); bổ sung lượt ký từ chữ ký cũ nếu không có phiếu tương ứng
  for (const n of notes) {
    if (daCo('reviews', n.id)) { baoCao.review_notes.bo_qua_da_co++; continue; }
    try {
      if (!lid(n.planId)) throw new Error('KHBD tham chiếu không có trong lần di trú này');
      ops.reviews.push({ ...goc, legacy_id: n.id, id: newId('r'), lesson_id: lid(n.planId), phien_ban: n.version ?? null, cap: n.level === 'Tổ chuyên môn' ? 'to' : 'bgh',
        nguoi_duyet_id: uid(n.reviewerId), nguoi_duyet_ten: n.reviewerName || '', ket_luan: n.verdict || '', uu_diem: n.strengths || '', ton_tai: n.weaknesses || '',
        giai_phap: n.solutions || '', nhan_xet_4_buoc: n.stepNotes || [], nhan_xet_chung: n.general || '', gop_y_theo_dong: [], luc: n.at || now, legacy: conLai(n, 'review_notes') });
      baoCao.review_notes.ghi++;
    } catch (e) { baoCao.review_notes.loi++; loi.push({ bang: 'review_notes', legacy_id: n.id, loi: e.message }); }
  }
  for (const p of plans) {
    if (!lid(p.id)) continue;
    for (const [cap, ten, luc] of [['to', p.ttSignedBy, p.ttSignedAt], ['bgh', p.bghSignedBy, p.bghSignedAt]]) {
      if (!ten) continue;
      const lk = `${p.id}#ky-${cap}`;
      const coPhieu = notes.some(n => n.planId === p.id && (n.level === 'Tổ chuyên môn' ? 'to' : 'bgh') === cap && n.verdict === 'Đạt');
      if (coPhieu || daCo('reviews', lk)) continue;
      ops.reviews.push({ ...goc, legacy_id: lk, id: newId('r'), lesson_id: lid(p.id), phien_ban: (p.versions || []).length || 1, cap, nguoi_duyet_id: null, nguoi_duyet_ten: ten,
        ket_luan: 'Đạt', uu_diem: '', ton_tai: '', giai_phap: '', nhan_xet_4_buoc: [], nhan_xet_chung: 'Ký duyệt (chuyển từ chữ ký trên EduPlan cũ, không kèm phiếu).', gop_y_theo_dong: [], luc: luc || now, legacy: { nguon: 'chu_ky_cu' } });
    }
  }

  // 5) Kết quả AI cũ → audits (giữ nguyên, gắn nguồn eduplan v1)
  for (const a of audits) {
    if (daCo('audits', a.id)) { baoCao.ai_audits.bo_qua_da_co++; continue; }
    try {
      if (!lid(a.planId)) throw new Error('KHBD tham chiếu không có trong lần di trú này');
      const co = (a.steps || []).filter(s => s.status !== 'Đạt').map(s => ({ rule_id: `EDUPLAN-B${s.step}`, muc: 'vang', nhom: 'Tổ chức', nguon: 'eduplan v1', vi_tri: 'hoat_dong', thong_diep: s.analysis, de_xuat: '' }))
        .concat((a.suggestions || []).map(s => ({ rule_id: 'EDUPLAN-DX', muc: 'xanh', nhom: 'Đề xuất', nguon: 'eduplan v1', vi_tri: 'hoat_dong', thong_diep: s.activity, de_xuat: s.revised })));
      ops.audits.push({ ...goc, legacy_id: a.id, id: newId('a'), lesson_id: lid(a.planId), phien_ban: a.version ?? null, chi_so: { tuan_thu_5512: a.compliance ?? null, tich_cuc: a.activeness ?? null },
        co, engine: `${a.engine || 'EduPlan cũ'} (eduplan v1)`, luc: a.at || now, legacy: { ...conLai(a, 'ai_audits'), steps: a.steps, suggestions: a.suggestions } });
      baoCao.ai_audits.ghi++;
    } catch (e) { baoCao.ai_audits.loi++; loi.push({ bang: 'ai_audits', legacy_id: a.id, loi: e.message }); }
  }

  // 6) Nhật ký
  for (const l of logs) {
    if (daCo('activity_logs', l.id)) { baoCao.audit_logs.bo_qua_da_co++; continue; }
    ops.activity_logs.push({ ...goc, legacy_id: l.id, id: newId('log'), nguoi: l.userName || '', nguoi_id: uid(l.userId), vai_tro: VAI_TRO[l.role] || l.role || '',
      hanh_dong: l.action || '', doi_tuong: l.target || '', chi_tiet: l.detail || '', luc: l.at || now, legacy: conLai(l, 'audit_logs') });
    baoCao.audit_logs.ghi++;
  }
  return { ops, baoCao, loi };
}

/** Đối soát sau di trú: so số bản ghi + 10 bản ghi ngẫu nhiên so từng trường (mục 2B bước 5). */
export function doiSoat(cu, moi, soMau = 10, rand = Math.random) {
  const kq = { bang: {}, mau: [], lech: [] };
  const theoLegacy = (store) => new Map((moi[store] || []).filter(r => r.nguon_du_lieu === 'eduplan_cu').map(r => [r.legacy_id, r]));
  const U = theoLegacy('users'), L = theoLegacy('lessons'), R = theoLegacy('reviews'), A = theoLegacy('audits'), G = theoLegacy('activity_logs');
  const cap = [['users', U, (o, n) => [['name', n.ho_ten], ['email', n.email], ['password', n.mat_khau_bam]]],
    ['lesson_plans', L, (o, n) => [['title', n.ten_bai], ['subject', n.mon], ['status', n.trang_thai === trangThai(o) ? o.status : n.trang_thai], ['content', n.noi_dung?.van_ban_goc]]],
    ['review_notes', R, (o, n) => [['reviewerName', n.nguoi_duyet_ten], ['verdict', n.ket_luan], ['at', n.luc]]],
    ['ai_audits', A, (o, n) => [['compliance', n.chi_so?.tuan_thu_5512], ['activeness', n.chi_so?.tich_cuc]]],
    ['audit_logs', G, (o, n) => [['action', n.hanh_dong], ['at', n.luc]]]];
  const pool = [];
  for (const [b, M, f] of cap) {
    const nguon = cu[b] || [], co = nguon.filter(o => M.has(o.id));
    kq.bang[b] = { cu: nguon.length, moi_co_legacy: co.length };
    co.forEach(o => pool.push([b, o, M.get(o.id), f]));
  }
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  for (const [b, o, n, f] of pool.slice(0, soMau)) {
    const sai = f(o, n).filter(([k, v]) => (o[k] ?? '') !== (v ?? '')).map(([k]) => k);
    kq.mau.push({ bang: b, legacy_id: o.id, khop: !sai.length, truong_lech: sai });
    if (sai.length) kq.lech.push({ bang: b, legacy_id: o.id, truong_lech: sai });
  }
  return kq;
}
