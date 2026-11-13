// Dữ liệu trình diễn (mục 8 v1.0): chỉ nạp vào CSDL 'EduPlanKHBD_demo', không bao giờ trộn với dữ liệu thật.
// 6 tài khoản · 3 bộ bài trọn vẹn (mỗi cấp 1 bài, YCCĐ trích đúng CT 2018) · 4 lượt duyệt · 1 phiếu dự giờ · 15 nhật ký.
import { soanTronBo } from './gen.js';
import { hashPassword } from './auth.js';
import { uid } from './db.js';
import { runRules } from './rules.js';

export const MAT_KHAU_DEMO = '123456';
const BAI = [
  { key: 'toan3', ten_bai: 'Hình tròn: tâm, bán kính, đường kính', mon: 'Toán', lop: 3, bo_sach: 'Kết nối tri thức', so_tiet: 1, hoc_ky: 'Học kỳ II', to: 'Toán', tim: /tâm, bán kính, đường kính/i, gv: 'gv1' },
  { key: 'toan8', ten_bai: 'Hình chóp tam giác đều và diện tích xung quanh', mon: 'Toán', lop: 8, bo_sach: 'Kết nối tri thức', so_tiet: 2, hoc_ky: 'Học kỳ II', to: 'Toán', tim: /hình chóp tam giác đều/i, gv: 'gv1' },
  { key: 'van10', ten_bai: 'Nghệ thuật xây dựng hình tượng nhân vật sử thi', mon: 'Ngữ văn', lop: 10, bo_sach: 'Chân trời sáng tạo', so_tiet: 2, hoc_ky: 'Học kỳ I', to: 'Ngữ văn', tim: /sử thi/i, gv: 'gv2' }
];

export async function taoDuLieuMau({ yccdCua, nls, ai, plv }) {
  const pw = await hashPassword(MAT_KHAU_DEMO);
  const t = s => new Date(s).toISOString();
  const U = (id, ho_ten, email, vai_tro, to, khoi, extra = {}) => ({ id, ho_ten, email, ma_gv: email.split('@')[0].toUpperCase(), vai_tro, to_chuyen_mon: to, cap_hoc: '', khoi_phu_trach: khoi,
    chuc_danh: '', mat_khau_bam: pw, phai_doi_mat_khau: false, trang_thai: 'active', quyen_duyet: vai_tro !== 'giao_vien', tao_luc: t('2026-08-15T08:00:00'), nguon_du_lieu: 'demo', ...extra });
  const users = [
    U('admin', 'Quản trị hệ thống', 'admin@demo.edu.vn', 'admin', 'Ban Giám hiệu', [], { chuc_danh: 'Quản trị' }),
    U('bgh', 'TS. Nguyễn Minh Quang', 'hieutruong@demo.edu.vn', 'bgh', 'Ban Giám hiệu', [], { chuc_danh: 'Hiệu trưởng' }),
    U('tt1', 'ThS. Lê Văn Hùng', 'tt.toan@demo.edu.vn', 'to_truong', 'Toán', ['8', '9'], { chuc_danh: 'Tổ trưởng tổ Toán' }),
    U('tt2', 'ThS. Phạm Thị Lan', 'tt.nguvan@demo.edu.vn', 'to_truong', 'Ngữ văn', ['10', '11'], { chuc_danh: 'Tổ trưởng tổ Ngữ văn' }),
    U('gv1', 'Võ Thị Mai', 'mai.vt@demo.edu.vn', 'giao_vien', 'Toán', ['3', '8'], { chuc_danh: 'Giáo viên Toán' }),
    U('gv2', 'Đặng Quốc Bảo', 'bao.dq@demo.edu.vn', 'giao_vien', 'Ngữ văn', ['10'], { chuc_danh: 'Giáo viên Ngữ văn' })
  ];
  const out = { users, lessons: [], lesson_versions: [], worksheets: [], slides: [], assessments: [], integrations: [], audits: [], reviews: [], observations: [], library: [], activity_logs: [] };
  const L = {};
  for (const b of BAI) {
    const yccd = (await yccdCua(b.mon, b.lop)).filter(y => b.tim.test(y.yccd));
    const bo = soanTronBo(b, yccd, nls, ai);
    // Cài sẵn 1–2 cờ 🟡 để demo luồng sửa
    if (b.key === 'toan8') bo.nd.hoat_dong[2].to_chuc.bao_cao = 'GV gọi 1 HS lên bảng làm bài, cả lớp theo dõi.';
    if (b.key === 'van10') bo.nd.muc_tieu.pham_chat = 'Trách nhiệm.';
    const id = `bai_${b.key}`;
    const lesson = { id, ten_bai: b.ten_bai, cap_hoc: b.lop <= 5 ? 'TH' : b.lop <= 9 ? 'THCS' : 'THPT', mon: b.mon, lop: b.lop, bo_sach: b.bo_sach, hoc_ky: b.hoc_ky, nam_hoc: '2026 – 2027',
      so_tiet: b.so_tiet, khung: bo.nd.khung, yccd_ids: yccd.map(y => y.id), noi_dung: bo.nd, trang_thai: 'ban_nhap', phien_ban_hien_tai: 1, giao_vien_id: b.gv, to: b.to,
      tao_luc: t('2026-10-01T19:00:00'), so_vong_sua: 0, nguon_du_lieu: 'demo' };
    L[b.key] = lesson;
    out.lessons.push(lesson);
    out.lesson_versions.push({ id: uid('lv'), lesson_id: id, so_phien_ban: 1, noi_dung: JSON.parse(JSON.stringify(bo.nd)), ghi_chu: 'Bản nháp AI soạn', nguoi_sua: users.find(u => u.id === b.gv).ho_ten, luc: t('2026-10-01T19:00:00') });
    bo.worksheets.forEach((w, i) => out.worksheets.push({ id: uid('ws'), lesson_id: id, thu_tu: i, ...w }));
    out.slides.push({ id: uid('sl'), lesson_id: id, ...bo.slides });
    out.assessments.push({ id: uid('as'), lesson_id: id, ...bo.assessments });
    bo.integrations.forEach(x => out.integrations.push({ id: uid('it'), lesson_id: id, ...x }));
    const r = runRules({ lesson, nd: bo.nd, yccd, ...bo, nls, ai });
    out.audits.push({ id: uid('a'), lesson_id: id, phien_ban: 1, chi_so: r.chi_so, co: r.flags, engine: 'Mock AI Sư phạm', luc: t('2026-10-01T19:05:00') });
  }
  // Trạng thái + lượt duyệt (4)
  const rv = (lesson, cap, nguoi, ket_luan, luc, extra = {}) => ({ id: uid('r'), lesson_id: lesson.id, phien_ban: lesson.phien_ban_hien_tai, cap, nguoi_duyet_id: nguoi, nguoi_duyet_ten: users.find(u => u.id === nguoi).ho_ten,
    ket_luan, uu_diem: '', ton_tai: '', giai_phap: '', nhan_xet_4_buoc: ['', '', '', ''], nhan_xet_chung: '', gop_y_theo_dong: [], luc: t(luc), ...extra });
  Object.assign(L.toan3, { trang_thai: 'da_duyet', nop_luc: t('2026-10-03T20:00:00'), duyet_luc: t('2026-10-06T10:00:00'), co_do_khi_nop: 0 });
  out.reviews.push(rv(L.toan3, 'to', 'tt1', 'Đạt', '2026-10-04T15:00:00', { uu_diem: 'Bám sát YCCĐ lớp 3; hoạt động khám phá bằng vật thật phù hợp HS tiểu học.', giai_phap: 'Bổ sung câu hỏi vận dụng cho HS khá giỏi.' }));
  out.reviews.push(rv(L.toan3, 'bgh', 'bgh', 'Đạt', '2026-10-06T10:00:00', { uu_diem: 'KHBD đúng khung CV 2345, chuỗi hoạt động mạch lạc.', nhan_xet_chung: 'Đề nghị chia sẻ trong sinh hoạt chuyên môn tổ.' }));
  out.library.push({ id: uid('lib'), lesson_id: L.toan3.id, to: 'Toán', the: ['hình học', 'tiểu học', 'trực quan'], luot_dung: 3, danh_gia: 4.7 });
  Object.assign(L.toan8, { trang_thai: 'cho_bgh_duyet', nop_luc: t('2026-10-14T20:00:00'), co_do_khi_nop: 0 });
  out.reviews.push(rv(L.toan8, 'to', 'tt1', 'Đạt', '2026-10-15T16:00:00', { uu_diem: 'Học liệu trực quan, có cắt ghép lưới hình chóp.', ton_tai: 'HĐ3 bước báo cáo còn gọi 1 HS lên bảng.',
    gop_y_theo_dong: [{ id: uid('gy'), vi_tri: 'hoat_dong.2.to_chuc.bao_cao', noi_dung: 'Nên cho HS đổi chéo vở, chấm theo đáp án để nhiều HS cùng tham gia.', trang_thai: 'mo', nguoi: 'ThS. Lê Văn Hùng', luc: t('2026-10-15T16:00:00') }] }));
  Object.assign(L.van10, { trang_thai: 'cho_to_duyet', nop_luc: t('2026-10-20T21:00:00'), so_vong_sua: 1, co_do_khi_nop: 0, phien_ban_hien_tai: 2 });
  out.reviews.push(rv(L.van10, 'to', 'tt2', 'Yêu cầu chỉnh sửa', '2026-10-18T09:00:00', { phien_ban: 1, ton_tai: 'Phẩm chất mới nêu tên.', giai_phap: 'Mô tả phẩm chất bằng hành vi gắn với bài sử thi.',
    gop_y_theo_dong: [{ id: uid('gy'), vi_tri: 'muc_tieu.pham_chat', noi_dung: 'Viết rõ hành vi: trân trọng vẻ đẹp người anh hùng, có trách nhiệm với cộng đồng…', trang_thai: 'mo', nguoi: 'ThS. Phạm Thị Lan', luc: t('2026-10-18T09:00:00') }] }));
  out.lesson_versions.push({ id: uid('lv'), lesson_id: L.van10.id, so_phien_ban: 2, noi_dung: JSON.parse(JSON.stringify(L.van10.noi_dung)), ghi_chu: 'Sửa theo góp ý tổ (lần 1)', nguoi_sua: 'Đặng Quốc Bảo', luc: t('2026-10-20T20:50:00') });
  // Phiếu dự giờ PL V (1)
  const muc = [3, 3, 2, 2, 3, 2, 2, 3, 3, 2, 2, 3];
  const diem = plv.tieu_chi.map((tc, i) => ({ ma: tc.ma, muc: muc[i], diem: [0, 0.65, 0.8, 1][muc[i]] * tc.diem_toi_da, nhan_xet: '' }))
    .map(x => ({ ...x, diem: Math.round(x.diem * 4) / 4 }));
  const tong = diem.reduce((s, x) => s + x.diem, 0);
  out.observations.push({ id: uid('ob'), lesson_id: L.toan3.id, nguoi_du_gio: 'tt1', ten_nguoi_du_gio: 'ThS. Lê Văn Hùng', lop: '3A2', tiet: 2, ngay: t('2026-10-09T08:00:00'),
    phieu_PLV: { tieu_chi: diem, tong_diem: tong, xep_loai: tong >= 18 ? 'Giỏi' : tong >= 13.5 ? 'Khá' : tong >= 10 ? 'Trung bình' : 'Không đạt' },
    phan_tich_4_buoc: { hanh_dong_hs: 'HS quan sát đồ vật hình tròn, dùng compa vẽ và chỉ tâm, bán kính, đường kính theo nhóm.', ket_qua: 'Đa số HS nhận biết đúng; 3 HS còn nhầm bán kính với đường kính.',
      nguyen_nhan: 'Chưa có hoạt động so sánh độ dài bán kính – đường kính bằng thao tác gấp giấy.', bien_phap: 'Bổ sung thao tác gấp đôi hình tròn bằng giấy để HS tự phát hiện đường kính gấp đôi bán kính.' },
    de_xuat_dieu_chinh: 'Thêm thao tác gấp giấy hình tròn ở hoạt động Khám phá.' });
  L.toan3.noi_dung.dieu_chinh = 'Sau dự giờ 09/10: thêm thao tác gấp giấy hình tròn ở hoạt động Khám phá để HS phát hiện quan hệ bán kính – đường kính.';
  // Nhật ký (15)
  const g = (luc, nguoi, vai_tro, hanh_dong, doi_tuong, chi_tiet = '') => ({ id: uid('log'), luc: t(luc), nguoi: users.find(u => u.id === nguoi).ho_ten, nguoi_id: nguoi, vai_tro, hanh_dong, doi_tuong, chi_tiet });
  out.activity_logs.push(
    g('2026-10-01T19:00:00', 'gv1', 'giao_vien', 'Soạn bài (AI)', L.toan3.ten_bai, 'Mock AI Sư phạm'), g('2026-10-01T19:30:00', 'gv1', 'giao_vien', 'Soạn bài (AI)', L.toan8.ten_bai, 'Mock AI Sư phạm'),
    g('2026-10-01T20:00:00', 'gv2', 'giao_vien', 'Soạn bài (AI)', L.van10.ten_bai, 'Mock AI Sư phạm'), g('2026-10-03T20:00:00', 'gv1', 'giao_vien', 'Gửi Tổ trưởng duyệt', L.toan3.ten_bai, 'v1'),
    g('2026-10-04T15:00:00', 'tt1', 'to_truong', 'Ký duyệt cấp tổ', L.toan3.ten_bai, 'Đạt'), g('2026-10-06T10:00:00', 'bgh', 'bgh', 'Phê duyệt', L.toan3.ten_bai, 'Đã duyệt đạt chuẩn'),
    g('2026-10-09T08:00:00', 'tt1', 'to_truong', 'Dự giờ (PL V)', L.toan3.ten_bai, `${tong} điểm`), g('2026-10-09T09:00:00', 'gv1', 'giao_vien', 'Điều chỉnh sau bài dạy', L.toan3.ten_bai),
    g('2026-10-14T20:00:00', 'gv1', 'giao_vien', 'Gửi Tổ trưởng duyệt', L.toan8.ten_bai, 'v1'), g('2026-10-15T16:00:00', 'tt1', 'to_truong', 'Ký duyệt cấp tổ', L.toan8.ten_bai, 'Đạt · 1 góp ý theo dòng'),
    g('2026-10-17T21:00:00', 'gv2', 'giao_vien', 'Gửi Tổ trưởng duyệt', L.van10.ten_bai, 'v1'), g('2026-10-18T09:00:00', 'tt2', 'to_truong', 'Yêu cầu chỉnh sửa', L.van10.ten_bai, '1 góp ý theo dòng'),
    g('2026-10-20T21:00:00', 'gv2', 'giao_vien', 'Gửi Tổ trưởng duyệt', L.van10.ten_bai, 'v2'), g('2026-10-22T14:00:00', 'bgh', 'bgh', 'Xem dashboard', 'Toàn trường'),
    g('2026-10-25T10:00:00', 'admin', 'admin', 'Sao lưu', 'Toàn bộ CSDL', 'JSON'));
  return out;
}
