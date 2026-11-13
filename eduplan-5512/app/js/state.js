// Trạng thái ứng dụng + dịch vụ dùng chung giữa các phân hệ.
import { Kho, DB_THAT, DB_DEMO, uid, now } from './db.js';
import { runRules } from './rules.js';
import { parseText, mucTieuDong } from './khung.js';
import { co } from './auth.js';

/** Sổ hành động gọi từ giao diện (window.EP) và hàm vẽ lại — đặt ở đây để các phân hệ dùng chung, tránh vòng phụ thuộc. */
export const A = {};
export const ve = () => S.render?.();
export const S = {
  kho: null, cheDo: localStorage.getItem('eduplan-khbd.che_do') || 'that', user: null,
  data: { nls: null, ai: null, plv: null, yccdTheoMon: {} }, route: [], tam: {}
};
export const TRANG_THAI = {
  ban_nhap: ['Bản nháp', 'bg-slate-100 text-slate-600'], cho_to_duyet: ['Chờ tổ duyệt', 'bg-amber-100 text-amber-700'], cho_bgh_duyet: ['Chờ BGH duyệt', 'bg-sky-100 text-sky-700'],
  yeu_cau_chinh_sua: ['Yêu cầu chỉnh sửa', 'bg-rose-100 text-rose-700'], da_duyet: ['Đã duyệt đạt chuẩn', 'bg-emerald-100 text-emerald-700'], da_day: ['Đã dạy', 'bg-indigo-100 text-indigo-700']
};
export const MON = ['Toán', 'Ngữ văn', 'KHTN', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Lịch sử và Địa lí', 'GDCD / GD Kinh tế và Pháp luật', 'Tin học', 'Công nghệ',
  'Tiếng Anh', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm', 'Tự nhiên và Xã hội', 'Khoa học'];
export const TO = ['Toán', 'Ngữ văn', 'KHTN', 'KHXH', 'Ngoại ngữ', 'Tin học – Công nghệ', 'Nghệ thuật – Thể chất', 'Tiểu học'];
export const BO_SACH = ['Kết nối tri thức', 'Chân trời sáng tạo', 'Cánh diều'];
export const toCuaMon = mon => ({ 'Toán': 'Toán', 'Ngữ văn': 'Ngữ văn', 'KHTN': 'KHTN', 'Vật lí': 'KHTN', 'Hóa học': 'KHTN', 'Sinh học': 'KHTN', 'Lịch sử': 'KHXH', 'Địa lí': 'KHXH',
  'Lịch sử và Địa lí': 'KHXH', 'GDCD / GD Kinh tế và Pháp luật': 'KHXH', 'Tiếng Anh': 'Ngoại ngữ', 'Tin học': 'Tin học – Công nghệ', 'Công nghệ': 'Tin học – Công nghệ' }[mon] || 'Nghệ thuật – Thể chất');
export const slugMon = m => m.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function moKho(cheDo) {
  S.kho?.close();
  S.cheDo = cheDo; localStorage.setItem('eduplan-khbd.che_do', cheDo);
  S.kho = await new Kho(cheDo === 'demo' ? DB_DEMO : DB_THAT).open();
  return S.kho;
}
export async function taiDuLieuKhung() {
  const get = async p => (await fetch(p)).json();
  [S.data.nls, S.data.ai, S.data.plv] = await Promise.all([get('data/nls.json'), get('data/ai.json'), get('data/plv.json')]);
}
export async function yccdCua(mon, lop) {
  if (!S.data.yccdTheoMon[mon]) S.data.yccdTheoMon[mon] = await (await fetch(`data/yccd/${slugMon(mon)}.json`)).json().catch(() => []);
  return S.data.yccdTheoMon[mon].filter(y => !lop || y.lop === +lop);
}
export const yccdDaChon = async lesson => { if (!lesson.yccd_ids?.length) return []; const all = await yccdCua(lesson.mon); return all.filter(y => lesson.yccd_ids.includes(y.id)); };

/** Bộ sản phẩm của một bài (4 store con). */
export function boCua(lessonId) {
  const k = S.kho;
  return { worksheets: k.where('worksheets', w => w.lesson_id === lessonId).sort((a, b) => a.thu_tu - b.thu_tu), slides: k.one('slides', s => s.lesson_id === lessonId),
    assessments: k.one('assessments', a => a.lesson_id === lessonId), integrations: k.where('integrations', x => x.lesson_id === lessonId) };
}
export function ndCua(lesson) {
  if (lesson.noi_dung?.can_doc_lai) lesson.noi_dung = parseText(lesson.noi_dung.van_ban_goc || '');
  return lesson.noi_dung;
}
export const batTatLuat = () => Object.fromEntries(S.kho.all('rules').map(r => [r.id, r.bat !== false]));

export async function raSoat(lesson) {
  const bo = boCua(lesson.id);
  const ctx = { lesson, nd: ndCua(lesson), yccd: await yccdDaChon(lesson), assessments: bo.assessments, worksheets: bo.worksheets, slides: bo.slides, integrations: bo.integrations, nls: S.data.nls, ai: S.data.ai };
  return runRules(ctx, batTatLuat());
}
/** Rà soát đồng bộ cho KHBD vừa di trú (không có YCCĐ/bộ con) — không đổi trạng thái duyệt. */
export function raSoatSauDiTru(lesson) {
  const r = runRules({ lesson, nd: lesson.noi_dung, yccd: [], nls: S.data.nls, ai: S.data.ai }, batTatLuat());
  return { id: uid('a'), lesson_id: lesson.id, phien_ban: lesson.phien_ban_hien_tai, chi_so: r.chi_so, co: r.flags, engine: 'Rà soát sau di trú (luật 3C)', luc: now() };
}

export async function luuBai(lesson) { return S.kho.put('lessons', lesson); }
export async function luuPhienBan(lesson, ghiChu = '') {
  const so = (lesson.phien_ban_hien_tai || 0) + 1;
  lesson.phien_ban_hien_tai = so;
  await S.kho.put('lesson_versions', { id: uid('lv'), lesson_id: lesson.id, so_phien_ban: so, noi_dung: JSON.parse(JSON.stringify(lesson.noi_dung)), ghi_chu: ghiChu, nguoi_sua: S.user?.ho_ten || '', luc: now() });
  await luuBai(lesson);
}
export const log = (hd, dt = '', ct = '') => S.kho.log(S.user, hd, dt, ct);
export const quyen = q => co(S.user, q);
export const tenUser = id => S.kho.get('users', id)?.ho_ten || '—';
export const baiNhinThay = () => {
  const u = S.user, all = S.kho.all('lessons');
  if (!u) return [];
  if (['admin', 'bgh'].includes(u.vai_tro)) return all;
  if (u.vai_tro === 'to_truong') return all.filter(l => l.to === u.to_chuyen_mon || l.giao_vien_id === u.id);
  return all.filter(l => l.giao_vien_id === u.id);
};
export const soMucTieu = lesson => mucTieuDong(ndCua(lesson)).length;
