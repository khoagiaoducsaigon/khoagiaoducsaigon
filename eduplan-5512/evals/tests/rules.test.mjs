// Kiểm thử khung KHBD + luật rà soát. Chạy: node --test evals/tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseText, khungTrong, mucTieuDong, toText } from '../../app/js/khung.js';
import { RULES, runRules, overlap, bangKiem4Buoc } from '../../app/js/rules.js';

const MAU = JSON.parse(readFileSync(new URL('./fixtures/eduplan-cu-mau.json', import.meta.url)));
const YCCD = JSON.parse(readFileSync(new URL('../../data/processed/yccd.json', import.meta.url)));
const NLS = JSON.parse(readFileSync(new URL('../../data/processed/nls.json', import.meta.url)));
const AI = JSON.parse(readFileSync(new URL('../../data/processed/ai.json', import.meta.url)));
const ids = (flags, id) => flags.filter(f => f.rule_id === id);

/** KHBD "đạt" dựng tay theo PL IV — mọi luật 🔴 phải im lặng. */
function khbdDat() {
  const nd = khungTrong('PL4-5512');
  nd.muc_tieu = {
    kien_thuc: '- Mô tả được đỉnh, mặt đáy, mặt bên, cạnh bên của hình chóp tam giác đều.\n- Tính được diện tích xung quanh của hình chóp tam giác đều.',
    nang_luc: '- Giải quyết được vấn đề thực tiễn gắn với tính diện tích xung quanh hình chóp tam giác đều.',
    pham_chat: 'Trung thực khi ghi kết quả đo; có trách nhiệm hoàn thành phần việc trong nhóm.'
  };
  nd.thiet_bi = 'Mô hình hình chóp bằng bìa, phiếu học tập số 1, 2, thước.';
  const hd = (ten, mt, tl) => ({ loai: '', ten, thoi_luong: tl, muc_tieu: mt, noi_dung: `Nhiệm vụ: ${mt}`, san_pham: 'Phiếu học tập của nhóm',
    to_chuc: { giao: 'GV phát phiếu học tập, giao nhiệm vụ nhóm 4 trong 7 phút với mô hình bìa.', thuc_hien: 'HS thảo luận nhóm; dự kiến khó khăn: nhầm trung đoạn với đường cao → GV gợi ý bằng mô hình.',
      bao_cao: 'Mời 2 nhóm có kết quả khác nhau trình bày, các nhóm khác phản biện.', ket_luan: 'GV nhận xét sản phẩm theo tiêu chí, chuẩn hóa kiến thức.' }, to_chuc_text: '' });
  nd.hoat_dong = [
    { ...hd('Phát hiện hình chóp trong đời sống', 'Mô tả được đỉnh, mặt đáy, mặt bên, cạnh bên của hình chóp tam giác đều qua vật thật', 10), loai: 'mo_dau' },
    { ...hd('Khám phá công thức diện tích xung quanh', 'Tính được diện tích xung quanh hình chóp tam giác đều bằng cắt ghép lưới', 20), loai: 'hinh_thanh' },
    { ...hd('Luyện tập', 'Tính diện tích xung quanh trong bài tập', 15), loai: 'luyen_tap' },
    { ...hd('Vận dụng', 'Giải quyết vấn đề thực tiễn: may mái lều', 0), loai: 'van_dung', san_pham: 'Báo cáo nộp trên Padlet trước tiết sau' }
  ];
  return nd;
}
const ctxDat = () => {
  const nd = khbdDat();
  return { lesson: { mon: 'Toán', lop: 8, so_tiet: 1 }, nd, nls: NLS, ai: AI,
    yccd: YCCD.filter(y => y.mon === 'Toán' && y.lop === 8 && /hình chóp tam giác đều/i.test(y.yccd)),
    assessments: { cau_hoi: [{ muc_do: 'NB', muc_tieu_ref: 0 }, { muc_do: 'TH', muc_tieu_ref: 1 }, { muc_do: 'VD', muc_tieu_ref: 2 }] } };
};

test('có đủ 23 luật mục 3C, mỗi luật có nguồn', () => {
  assert.equal(RULES.length, 23);
  for (const r of RULES) assert.ok(r.nguon && r.mo_ta && ['do', 'vang', 'xanh'].includes(r.muc), r.id);
  assert.equal(RULES.find(r => r.id === 'TC-07').nguon.startsWith('eduplan v1'), true);
});

test('KHBD đạt chuẩn: không có cờ đỏ, chỉ số cao', () => {
  const r = runRules(ctxDat());
  assert.deepEqual(r.flags.filter(f => f.muc === 'do'), [], JSON.stringify(r.flags.filter(f => f.muc === 'do'), null, 1));
  assert.equal(r.chan_nop, false);
  assert.ok(r.chi_so.cau_truc === 100 && r.chi_so.bam_yccd >= 60, JSON.stringify(r.chi_so));
});

test('CT-01/CT-03/TC-01 bắt thiếu mục và thiếu bước', () => {
  const c = ctxDat(); c.nd.thiet_bi = ''; c.nd.hoat_dong[1].san_pham = ''; c.nd.hoat_dong[2].to_chuc.bao_cao = '';
  const f = runRules(c).flags;
  assert.equal(ids(f, 'CT-01').length, 1);
  assert.equal(ids(f, 'CT-03')[0].vi_tri, 'hoat_dong.1.san_pham');
  assert.equal(ids(f, 'TC-01')[0].vi_tri, 'hoat_dong.2.to_chuc.bao_cao');
});

test('MT-01: chưa chọn YCCĐ → đỏ; chế độ rà soát nhanh/nhập từ EduPlan → hạ vàng', () => {
  const c = ctxDat(); c.yccd = [];
  assert.equal(ids(runRules(c).flags, 'MT-01')[0].muc, 'do');
  c.lesson.nhan = 'nhập từ EduPlan';
  assert.equal(ids(runRules(c).flags, 'MT-01')[0].muc, 'vang');
});

test('MT-02 bắt động từ mơ hồ; TC-06 bắt lời thoại', () => {
  const c = ctxDat(); c.nd.muc_tieu.kien_thuc = 'Hiểu về hình chóp tam giác đều và các yếu tố của nó.';
  c.nd.hoat_dong[0].to_chuc.giao += ' GV hỏi: "Các em thấy hình gì?"';
  const f = runRules(c).flags;
  assert.ok(ids(f, 'MT-02').length >= 1);
  assert.equal(ids(f, 'TC-06').length, 1);
});

test('NQ-01: mục tiêu không có câu hỏi đánh giá → đỏ', () => {
  const c = ctxDat(); c.assessments.cau_hoi = [{ muc_do: 'NB', muc_tieu_ref: 0 }];
  const f = ids(runRules(c).flags, 'NQ-01');
  assert.ok(f.length >= 1 && f.every(x => x.muc === 'do'));
});

test('NLS-01 & AI-01 kiểm mã đúng bậc/lớp theo CV 3456, QĐ 2422', () => {
  const c = ctxDat();
  c.integrations = [{ loai: 'NLS', ma: '1.1.L6-7' }, { loai: 'AI', ma: '6.A1.2' }, { loai: 'NLS', ma: '9.9.L8-9' }];
  const f = runRules(c).flags;
  assert.ok(ids(f, 'NLS-01').some(x => x.thong_diep.includes('không đúng bậc')));
  assert.ok(ids(f, 'NLS-01').some(x => x.thong_diep.includes('sai định dạng') || x.thong_diep.includes('Không có năng lực')));
  assert.ok(ids(f, 'AI-01').some(x => x.thong_diep.includes('lớp 6')));
  c.integrations = [{ loai: 'NLS', ma: '1.1.L8-9' }, { loai: 'AI', ma: '8.B2.1', mo_ta_bieu_hien: 'HS kiểm chứng kết quả AI' }];
  const f2 = runRules(c).flags;
  assert.equal(ids(f2, 'NLS-01').length, 0);
});

test('NQ-02 thời lượng; DG-02 thiếu mức độ', () => {
  const c = ctxDat(); c.lesson.so_tiet = 2;
  assert.equal(ids(runRules(c).flags, 'NQ-02').length, 1);
  c.lesson.so_tiet = 1; c.assessments.cau_hoi = [{ muc_do: 'NB', muc_tieu_ref: 0 }, { muc_do: 'NB', muc_tieu_ref: 1 }, { muc_do: 'NB', muc_tieu_ref: 2 }];
  assert.equal(ids(runRules(c).flags, 'DG-02').length, 1);
});

test('TH-01: khung tiểu học thiếu đồ dùng → đỏ', () => {
  const nd = khungTrong('PL3-2345'); nd.yeu_cau_can_dat = 'Nhận biết được tâm, bán kính, đường kính của hình tròn.';
  nd.hoat_dong[0].to_chuc_text = 'HS quan sát đồ vật hình tròn theo nhóm.';
  const f = runRules({ lesson: { mon: 'Toán', lop: 3, so_tiet: 1 }, nd, yccd: [] }).flags;
  assert.ok(ids(f, 'TH-01').some(x => x.vi_tri === 'do_dung'));
  assert.equal(ids(f, 'CT-01').length, 0);
});

test('parseText đọc đúng 3 KHBD mẫu của EduPlan cũ (không mất chữ)', () => {
  for (const [k, m] of Object.entries(MAU)) {
    const nd = parseText(m.content);
    assert.equal(nd.van_ban_goc, m.content, k);
    assert.ok(nd.muc_tieu.kien_thuc || nd.muc_tieu.nang_luc, `${k} mục tiêu`);
    assert.ok(nd.thiet_bi, `${k} thiết bị`);
    assert.ok(nd.hoat_dong.length >= 4, `${k} số HĐ`);
    assert.ok(mucTieuDong(nd).length >= 1, `${k} dòng mục tiêu`);
  }
  const nv = parseText(MAU.nv10.content);
  assert.ok(nv.hoat_dong[1].to_chuc.bao_cao.includes('phòng tranh'));
  assert.equal(nv.hoat_dong[0].thoi_luong, 7);
});

test('luật đánh giá đúng xu hướng: NV10 tốt hơn KHTN6 (khớp kết quả EduPlan cũ)', () => {
  const run = k => runRules({ lesson: { lop: +MAU[k].meta.grade, so_tiet: 2, che_do: 'ra_soat_nhanh' }, nd: parseText(MAU[k].content), yccd: [] });
  const nv = run('nv10'), kh = run('khtn6');
  assert.ok(nv.chi_so.tich_cuc > kh.chi_so.tich_cuc, `${nv.chi_so.tich_cuc} vs ${kh.chi_so.tich_cuc}`);
  assert.ok(nv.chi_so.tuan_thu_5512 > kh.chi_so.tuan_thu_5512, `${nv.chi_so.tuan_thu_5512} vs ${kh.chi_so.tuan_thu_5512}`);
  const k4 = bangKiem4Buoc(kh.flags);
  assert.equal(k4.length, 4);
  assert.ok(k4.some(b => b.trang_thai === 'Cần điều chỉnh'));
});

test('overlap & toText ổn định', () => {
  assert.ok(overlap('Tính được diện tích xung quanh của hình chóp', 'HS tính được diện tích xung quanh hình chóp tam giác đều') > 0.8);
  assert.ok(toText(khbdDat(), { ten_bai: 'X' }).includes('III. Tiến trình dạy học'));
});
