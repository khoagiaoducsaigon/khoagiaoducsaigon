// Kiểm thử di trú EduPlan cũ (mục 2B, 9 của master prompt v1.1) + mật khẩu + phiếu PL V.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { taoGiaLap } from './fixtures/tao-eduplan-cu-gia-lap.mjs';
import { lapKeHoach, doiSoat } from '../../app/js/migrate.js';
import { hashPassword, verifyPassword, legacyHash } from '../../app/js/auth.js';
import { tongHop, xepLoai, kiemDiem, diemGoiY, khoangDiem } from '../../app/js/plv.js';

const PLV = JSON.parse(readFileSync(new URL('../../data/processed/plv.json', import.meta.url)));
const hienCoTu = ops => Object.fromEntries(Object.entries({ users: ops.users, lessons: ops.lessons, reviews: ops.reviews, audits: ops.audits, activity_logs: ops.activity_logs })
  .map(([k, v]) => [k, new Set(v.map(r => r.legacy_id))]));

test('di trú: giữ dữ liệu thật + bản ghi mẫu được tham chiếu, bỏ dữ liệu mẫu còn lại', async () => {
  const cu = await taoGiaLap();
  const { ops, baoCao, loi } = lapKeHoach(cu);
  assert.deepEqual(loi, []);
  assert.deepEqual(ops.lessons.map(l => l.legacy_id).sort(), ['lp2', 'lp_real1', 'lp_real2']);
  assert.deepEqual(ops.users.map(u => u.legacy_id).sort(), ['u1', 'u4', 'u_real1', 'u_real2']);
  assert.deepEqual(ops.audits.map(a => a.legacy_id), ['a_real1']);
  assert.deepEqual(ops.activity_logs.map(l => l.legacy_id).sort(), ['log_real1', 'log_real2']);
  assert.equal(baoCao.lesson_plans.bo_qua_mau, 2);
  assert.equal(baoCao.audit_logs.bo_qua_mau, 15);
  // Tổng đọc = ghi + bỏ qua + lỗi cho mọi bảng
  for (const [b, r] of Object.entries(baoCao)) assert.equal(r.doc, r.ghi + r.bo_qua_mau + r.bo_qua_da_co + r.loi, b);
});

test('di trú: trạng thái duyệt cũ giữ nguyên, người duyệt + thời điểm giữ nguyên', async () => {
  const cu = await taoGiaLap();
  const { ops } = lapKeHoach(cu);
  const tt = Object.fromEntries(ops.lessons.map(l => [l.legacy_id, l.trang_thai]));
  assert.deepEqual(tt, { lp2: 'cho_bgh_duyet', lp_real1: 'cho_bgh_duyet', lp_real2: 'ban_nhap' });
  const r = ops.reviews.find(x => x.legacy_id === 'r_real1');
  assert.equal(r.nguoi_duyet_ten, 'TS. Nguyễn Minh Quang');
  assert.equal(r.luc, cu.review_notes.find(x => x.id === 'r_real1').at);
  assert.equal(r.cap, 'bgh');
  // Chữ ký tổ của lp_real1 không có phiếu → sinh lượt duyệt "chu_ky_cu"
  const ky = ops.reviews.find(x => x.legacy_id === 'lp_real1#ky-to');
  assert.ok(ky && ky.legacy.nguon === 'chu_ky_cu' && ky.nguoi_duyet_ten === 'ThS. Lê Văn Hùng');
  assert.ok(ops.lessons.every(l => l.nhan === 'nhập từ EduPlan'));
  assert.equal(ops.lesson_versions.filter(v => v.lesson_id === ops.lessons.find(l => l.legacy_id === 'lp_real1').id).length, 2);
});

test('di trú: trường lạ vào legacy{}, không mất chữ, djb2 → bắt đổi mật khẩu', async () => {
  const cu = await taoGiaLap();
  const { ops } = lapKeHoach(cu);
  assert.equal(ops.users.find(u => u.legacy_id === 'u_real1').legacy.soDienThoai, '0900000000');
  assert.equal(ops.lessons.find(l => l.legacy_id === 'lp_real1').legacy.ghiChuRieng, 'trường lạ cần vào legacy');
  assert.equal(ops.lessons.find(l => l.legacy_id === 'lp_real1').noi_dung.van_ban_goc, cu.lesson_plans.find(p => p.id === 'lp_real1').content);
  assert.equal(ops.lessons.find(l => l.legacy_id === 'lp_real1').so_tiet, 1);
  assert.equal(ops.users.find(u => u.legacy_id === 'u_real2').phai_doi_mat_khau, true);
  assert.equal(ops.users.find(u => u.legacy_id === 'u_real1').phai_doi_mat_khau, false);
  assert.equal(ops.users.find(u => u.legacy_id === 'u1').vai_tro, 'admin');
});

test('di trú chạy 2 lần không nhân đôi', async () => {
  const cu = await taoGiaLap();
  const lan1 = lapKeHoach(cu);
  const lan2 = lapKeHoach(cu, hienCoTu(lan1.ops));
  for (const [store, arr] of Object.entries(lan2.ops)) assert.equal(arr.length, 0, store);
  assert.equal(lan2.baoCao.lesson_plans.bo_qua_da_co, 3);
});

test('đối soát: 10 bản ghi ngẫu nhiên khớp từng trường', async () => {
  const cu = await taoGiaLap();
  const { ops } = lapKeHoach(cu);
  const kq = doiSoat(cu, ops, 10, () => 0.42);
  assert.equal(kq.mau.length, 10);
  assert.deepEqual(kq.lech, []);
  assert.equal(kq.bang.lesson_plans.moi_co_legacy, 3);
});

test('mật khẩu: PBKDF2 mới + đọc được mật khẩu cũ để băm lại', async () => {
  const h = await hashPassword('123456', 1000);
  assert.ok(h.startsWith('pbkdf2$1000$'));
  assert.deepEqual(await verifyPassword('123456', h), { ok: true, bam_lai: false });
  assert.equal((await verifyPassword('sai', h)).ok, false);
  const cu = await taoGiaLap();
  const u4 = cu.users.find(u => u.id === 'u4');
  assert.equal(u4.password, await legacyHash('123456'));
  assert.deepEqual(await verifyPassword('123456', u4.password), { ok: true, bam_lai: true });
});

test('phiếu PL V: 12 tiêu chí, tổng 20, xếp loại đúng 4 ngưỡng, điểm bội 0,25', () => {
  assert.equal(PLV.tieu_chi.length, 12);
  assert.equal(PLV.tieu_chi.reduce((s, t) => s + t.diem_toi_da, 0), 20);
  assert.equal(xepLoai(17.75), 'Khá'); assert.equal(xepLoai(18), 'Giỏi'); assert.equal(xepLoai(13.5), 'Khá');
  assert.equal(xepLoai(13.25), 'Trung bình'); assert.equal(xepLoai(10), 'Trung bình'); assert.equal(xepLoai(9.75), 'Không đạt');
  assert.equal(kiemDiem(0.3, 1), 'Điểm phải là bội số của 0,25');
  assert.equal(kiemDiem(2.25, 2), 'Điểm phải trong khoảng 0–2');
  assert.equal(diemGoiY(2, 3), 2); assert.deepEqual(khoangDiem(2, 2), [1.25, 1.5]);
  const full = tongHop(PLV, PLV.tieu_chi.map(t => t.diem_toi_da));
  assert.deepEqual(full, { tong: 20, xep_loai: 'Giỏi', loi: [] });
  assert.equal(tongHop(PLV, PLV.tieu_chi.map(() => '')).loi.length, 12);
});
