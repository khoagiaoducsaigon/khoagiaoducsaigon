// Bộ sinh nội dung "Mock AI Sư phạm" (không cần mạng): soạn trọn bộ 5 bước từ YCCĐ đã chọn.
// Bản nháp tuân thủ Phụ lục IV CV 5512 / Phụ lục 3 CV 2345 để GV chỉnh sửa; Gemini (llm.js) thay thế khi có API key.
import { khungTrong, mucTieuDong, capHoc, LOAI_HD } from './khung.js';

const ngan = (s, n = 60) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s; };
const vietHoa = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const bo = s => String(s || '').replace(/[.;]\s*$/, '');

/** Phân bổ thời lượng trên lớp (phút) theo số tiết: 15% · 45% · 40% ; Vận dụng giao về nhà. */
export function phanBoThoiGian(soTiet, lop) {
  const tong = (+soTiet || 1) * (capHoc(lop) === 'TH' ? 35 : 45);
  const a = Math.max(5, Math.round(tong * 0.15)), b = Math.round(tong * 0.45);
  return [a, b, tong - a - b, 0];
}

export function soanKHBD(meta, yccd = []) {
  const { ten_bai = 'Bài học', mon = '', lop = 6, bo_sach = '', so_tiet = 1 } = meta;
  const yc = yccd.map(y => bo(y.yccd));
  const ycChinh = yc.length ? yc : [`Nêu được nội dung chính của bài "${ten_bai}"`];
  const [t1, t2, t3] = phanBoThoiGian(so_tiet, lop);
  const thucTe = ycChinh.find(y => /th[ựu]c\s*ti[ễe]n|gi[ảa]i\s*quy[ếe]t|v[ậa]n\s*d[ụu]ng/i.test(y))
    || `Vận dụng được hiểu biết (${ycChinh[0].replace(/^(nh[ậa]n\s*bi[ếe]t\s*v[àa]\s*)?/i, '').replace(/,\s*\.\.\.$|\.\.\.$/, '')}) để giải quyết tình huống học tập mới`;
  const hdText = (k, mt, nd, sp, giao, th, bc, kl, tl, ten) => ({ loai: LOAI_HD[k].loai, ten, thoi_luong: tl, muc_tieu: mt, noi_dung: nd, san_pham: sp,
    to_chuc: { giao, thuc_hien: th, bao_cao: bc, ket_luan: kl }, to_chuc_text: '' });

  if (capHoc(lop) === 'TH') {
    const nd = khungTrong('PL3-2345');
    nd.yeu_cau_can_dat = ycChinh.map(y => `- ${vietHoa(y)}.`).join('\n') + '\n- Góp phần phát triển năng lực giao tiếp và hợp tác: trình bày được ý kiến của mình trong nhóm.\n- Chăm chỉ: hoàn thành được các nhiệm vụ học tập được giao.';
    nd.do_dung = `- GV: tranh ảnh, vật thật/mô hình minh họa, phiếu học tập, máy chiếu (nếu có).\n- HS: SGK ${mon} ${lop}${bo_sach ? ` (${bo_sach})` : ''}, bộ đồ dùng học tập, bảng con.`;
    const tc = [
      `Khởi động (${t1} phút): GV tổ chức trò chơi/câu đố gắn với "${ten_bai}"; HS tham gia theo nhóm đôi, chia sẻ điều em đã biết. GV dẫn dắt vào bài.`,
      `Khám phá (${t2} phút): HS quan sát tranh/vật thật theo nhóm 4, thực hiện nhiệm vụ trong phiếu học tập: ${ycChinh.map(ngan).join('; ')}. HS giao tiếp và hợp tác, trình bày ý kiến của mình trong nhóm. GV theo dõi, gợi ý nhóm gặp khó khăn. Đại diện nhóm trình bày; GV nhận xét, chốt kiến thức.`,
      `Luyện tập (${t3} phút): HS chăm chỉ hoàn thành các nhiệm vụ học tập được giao: làm bài tập cá nhân trong SGK/phiếu, đổi chéo vở kiểm tra theo đáp án GV đưa ra; GV nhận xét, tuyên dương.`,
      `Vận dụng (ở nhà): HS tìm ví dụ về ${ngan(ten_bai, 40)} trong gia đình/đời sống, kể lại cho người thân và chia sẻ với lớp ở tiết sau.`
    ];
    nd.hoat_dong = nd.hoat_dong.map((h, i) => ({ ...h, thoi_luong: [t1, t2, t3, 0][i], muc_tieu: i === 1 ? ycChinh.join('; ') : h.muc_tieu, to_chuc_text: tc[i] }));
    return nd;
  }

  const nd = khungTrong('PL4-5512');
  nd.muc_tieu.kien_thuc = ycChinh.map(y => `- ${vietHoa(y)}.`).join('\n');
  nd.muc_tieu.nang_luc = [
    `- Năng lực đặc thù: ${vietHoa(bo(thucTe))}.`,
    '- Năng lực chung: Giao tiếp và hợp tác – trình bày được kết quả thảo luận nhóm, lắng nghe và phản biện ý kiến của bạn; Tự chủ và tự học – tự hoàn thành được phiếu học tập cá nhân.'
  ].join('\n');
  nd.muc_tieu.pham_chat = 'Chăm chỉ: hoàn thành đầy đủ các nhiệm vụ trong phiếu học tập. Trung thực: ghi đúng kết quả thảo luận và tự đánh giá khách quan. Trách nhiệm: hoàn thành phần việc được giao trong nhóm.';
  nd.thiet_bi = `- GV: máy chiếu, slide bài giảng, phiếu học tập số 1, 2, bảng tiêu chí đánh giá sản phẩm.\n- HS: SGK ${mon} ${lop}${bo_sach ? ` (${bo_sach})` : ''}, bảng nhóm, bút lông.`;
  const yc2 = ycChinh.slice(0, Math.max(1, ycChinh.length - (ycChinh.length > 1 ? 1 : 0)));
  nd.hoat_dong = [
    hdText(0, `Kết nối trải nghiệm của HS với nội dung "${ten_bai}"; xác định được vấn đề cần giải quyết trong bài.`,
      `HS quan sát tình huống/hình ảnh thực tế liên quan đến "${ten_bai}" và trả lời câu hỏi gợi mở.`,
      'Câu trả lời của HS về vấn đề cần giải quyết, ghi trên bảng nhóm.',
      `GV chiếu tình huống thực tế, giao nhiệm vụ: trong 3 phút, làm việc theo cặp, quan sát hình ảnh và dự đoán câu trả lời cho câu hỏi gợi mở.`,
      'HS thảo luận cặp đôi, ghi dự đoán. Dự kiến khó khăn: HS chưa liên hệ được với kiến thức đã học → GV gợi ý bằng câu hỏi phụ.',
      'GV mời 2 cặp có dự đoán khác nhau trình bày; các cặp khác nhận xét, bổ sung.',
      'GV nhận xét câu trả lời, ghi nhận các dự đoán và nêu vấn đề cần giải quyết trong bài học.', t1, `Khơi gợi vấn đề: ${ngan(ten_bai, 50)} trong đời sống`),
    hdText(1, yc2.map(vietHoa).join('; ') + '.',
      `HS làm việc với SGK và phiếu học tập số 1 theo nhóm 4 để: ${yc2.map(y => ngan(y, 80)).join('; ')}.`,
      'Phiếu học tập số 1 hoàn chỉnh của nhóm; kết luận kiến thức do HS tự rút ra.',
      'GV chia nhóm 4, phát phiếu học tập số 1 và giao nhiệm vụ: trong 12 phút, nhóm đọc SGK, quan sát học liệu và hoàn thành các câu hỏi trong phiếu; sản phẩm trình bày trên bảng nhóm.',
      'HS làm việc cá nhân 3 phút rồi thảo luận nhóm thống nhất kết quả (kĩ thuật khăn trải bàn). Dự kiến khó khăn: nhầm lẫn khái niệm → GV hỗ trợ bằng câu hỏi gợi mở, không làm thay.',
      'Các nhóm trưng bày sản phẩm theo hình thức phòng tranh; GV mời 2 nhóm có kết quả khác nhau trình bày, các nhóm khác phản biện theo bảng tiêu chí.',
      'GV nhận xét sản phẩm theo tiêu chí, chuẩn hóa kiến thức trọng tâm, đánh giá quá trình làm việc của các nhóm.', t2, `Khám phá ${ngan(ten_bai, 55)}`),
    hdText(2, `Củng cố, rèn kĩ năng: ${ycChinh.map(y => ngan(y, 70)).join('; ')}.`,
      'Hệ thống câu hỏi, bài tập trong phiếu học tập số 2 (từ nhận biết đến vận dụng).',
      'Lời giải các bài tập trong phiếu học tập số 2.',
      'GV phát phiếu học tập số 2, giao nhiệm vụ: trong 10 phút, làm việc cá nhân, hoàn thành các bài tập theo thứ tự mức độ.',
      'HS làm bài cá nhân. Dự kiến khó khăn: HS chậm ở bài vận dụng → GV gợi ý bước giải, cho HS khá hỗ trợ bạn.',
      'HS đổi chéo phiếu theo cặp, chấm theo đáp án GV chiếu; GV mời 1–2 HS có cách làm khác trình bày.',
      'GV nhận xét, chữa lỗi sai phổ biến, chuẩn hóa phương pháp giải.', t3, 'Luyện tập'),
    hdText(3, vietHoa(bo(thucTe)) + '.',
      `HS phát hiện một tình huống thực tiễn gắn với "${ten_bai}" và vận dụng kiến thức để giải quyết.`,
      'Báo cáo ngắn (1 trang A4 hoặc video 60 giây) nộp trên Padlet lớp.',
      'GV giao nhiệm vụ ở nhà: mỗi nhóm chọn 1 tình huống thực tiễn, vận dụng kiến thức bài học để giải quyết; nộp báo cáo trên Padlet trước tiết sau.',
      'HS thực hiện ở nhà theo nhóm. Dự kiến khó khăn: chưa chọn được tình huống → GV gợi ý danh sách tình huống mẫu trên Padlet.',
      'Đầu tiết sau, GV chọn 2 sản phẩm tiêu biểu để nhóm trình bày; các nhóm khác nhận xét, đánh giá chéo theo tiêu chí.',
      'GV nhận xét, đánh giá sản phẩm theo tiêu chí đã công bố, ghi nhận sự tiến bộ của HS.', 0, 'Vận dụng')
  ];
  return nd;
}

export function soanPhieu(nd) {
  return nd.hoat_dong.map((h, i) => ({ h, i })).filter(({ h }) => h.loai === 'hinh_thanh' || h.loai === 'luyen_tap').map(({ h, i }, k) => ({
    hoat_dong_ref: i, tieu_de: `Phiếu học tập số ${k + 1} – ${h.ten || LOAI_HD[i].ten}`,
    nhiem_vu: String(h.muc_tieu || h.noi_dung).split(/;\s*/).filter(Boolean).map((m, j) => `Câu ${j + 1}. ${vietHoa(bo(m)).replace(/được\s*/i, '')}.`),
    san_pham: h.san_pham || 'Bài làm của nhóm', thang_tieu_chi: ['Đúng nội dung (4 điểm)', 'Đầy đủ các câu (3 điểm)', 'Trình bày rõ ràng (2 điểm)', 'Hợp tác tốt (1 điểm)']
  }));
}

export function soanSlide(nd, meta) {
  const trang = [{ tieu_de: meta.ten_bai, noi_dung: `${meta.mon} ${meta.lop}${meta.bo_sach ? ` – ${meta.bo_sach}` : ''}`, hoat_dong_ref: null, ghi_chu_gv: 'Ổn định lớp.' },
    { tieu_de: 'Mục tiêu bài học', noi_dung: mucTieuDong(nd).map(m => '• ' + ngan(m, 110)).join('\n'), hoat_dong_ref: null, ghi_chu_gv: 'Giới thiệu mục tiêu ngắn gọn.' }];
  nd.hoat_dong.forEach((h, i) => trang.push({ tieu_de: `Hoạt động ${i + 1}: ${h.ten || LOAI_HD[i].ten}`, noi_dung: [h.to_chuc?.giao || h.to_chuc_text, h.san_pham ? `Sản phẩm: ${h.san_pham}` : ''].filter(Boolean).join('\n'),
    hoat_dong_ref: i, ghi_chu_gv: h.to_chuc?.thuc_hien || '' }));
  trang.push({ tieu_de: 'Tổng kết', noi_dung: 'Điều em đã học được hôm nay là gì? Điều em còn băn khoăn?', hoat_dong_ref: null, ghi_chu_gv: 'Phiếu thoát (exit ticket).' });
  return { trang };
}

export function soanDanhGia(nd) {
  const dong = mucTieuDong(nd), cau_hoi = [];
  dong.forEach((m, i) => {
    const nd0 = bo(m).replace(/^(n[êe]u|m[ôo]\s*t[ảa]|tr[ìi]nh\s*b[àa]y|t[íi]nh|gi[ảa]i\s*th[íi]ch|v[ậa]n\s*d[ụu]ng|nh[ậa]n\s*bi[ếe]t)\s*(được)?\s*/i, '');
    cau_hoi.push({ noi_dung: `Nêu ${nd0}.`, muc_do: 'NB', muc_tieu_ref: i, dap_an: 'Theo nội dung chuẩn hóa ở Hoạt động 2.' });
    cau_hoi.push({ noi_dung: `Giải thích và lấy ví dụ minh họa: ${nd0}.`, muc_do: 'TH', muc_tieu_ref: i, dap_an: 'HS giải thích đúng, ví dụ phù hợp.' });
    if (i === dong.length - 1 || i === 0) cau_hoi.push({ noi_dung: `Vận dụng ${nd0} để giải quyết một tình huống thực tiễn do GV đưa ra.`, muc_do: 'VD', muc_tieu_ref: i, dap_an: 'Lời giải đúng, lập luận rõ.' });
  });
  if (dong.length) cau_hoi.push({ noi_dung: 'Đề xuất một tình huống mới trong đời sống và giải quyết bằng kiến thức của bài.', muc_do: 'VDC', muc_tieu_ref: dong.length - 1, dap_an: 'Tình huống mới, giải quyết hợp lí.' });
  return { cau_hoi, rubric: [
    { tieu_chi: 'Nội dung chính xác', muc: ['Chưa đúng', 'Đúng một phần', 'Đúng, đủ', 'Đúng, đủ, sâu sắc'] },
    { tieu_chi: 'Vận dụng thực tiễn', muc: ['Chưa có', 'Có nhưng chưa phù hợp', 'Phù hợp', 'Sáng tạo'] },
    { tieu_chi: 'Trình bày', muc: ['Khó theo dõi', 'Chưa mạch lạc', 'Rõ ràng', 'Rõ ràng, hấp dẫn'] }
  ] };
}

const bacCuaLop = lop => (+lop <= 3 ? 'L1-3' : +lop <= 5 ? 'L4-5' : +lop <= 7 ? 'L6-7' : +lop <= 9 ? 'L8-9' : 'L10-12');
export function goiYTichHop(nd, meta, nls, ai) {
  const bac = bacCuaLop(meta.lop), out = [];
  const t = JSON.stringify(nd.hoat_dong);
  const chon = [];
  if (/SGK|t[ìi]m\s*ki[ếe]m|tra\s*c[ứu]u/i.test(t)) chon.push(['1.1', 1, 'HS tìm kiếm, chọn lọc thông tin phục vụ nhiệm vụ học tập.']);
  if (/Padlet|video|slide|tr[ìi]nh\s*chi[ếe]u/i.test(t)) chon.push(['3.1', 3, 'HS tạo sản phẩm số (báo cáo, video ngắn) và chia sẻ trên Padlet.']);
  if (/nh[óo]m/i.test(t)) chon.push(['2.4', 3, 'HS phối hợp nhóm qua công cụ số khi làm sản phẩm vận dụng.']);
  if (!chon.length) chon.push(['1.1', 1, 'HS tìm kiếm thông tin trong môi trường số.']);
  chon.slice(0, 2).forEach(([ma, hd, mo]) => { if (!nls || nls.nang_luc.some(c => c.ma === ma)) out.push({ loai: 'NLS', ma: `${ma}.${bac}`, hoat_dong_ref: hd, mo_ta_bieu_hien: mo }); });
  const yc = (ai?.yccd || []).filter(y => y.lop === +meta.lop && !y.mo_rong);
  const ai1 = yc.find(y => y.chu_de === 'B2') || yc.find(y => y.mach.startsWith('Đạo đức')) || yc[0];
  if (ai1) out.push({ loai: 'AI', ma: ai1.ma, hoat_dong_ref: 3, mo_ta_bieu_hien: `${ai1.yccd} (Khi dùng công cụ AI hỗ trợ sản phẩm vận dụng, HS kiểm chứng và ghi rõ phần do AI hỗ trợ.)` });
  return out;
}

/** Soạn trọn bộ 5 bước (bản nháp). */
export function soanTronBo(meta, yccd, nls, ai) {
  const nd = soanKHBD(meta, yccd);
  return { nd, worksheets: soanPhieu(nd), slides: soanSlide(nd, meta), assessments: soanDanhGia(nd), integrations: goiYTichHop(nd, meta, nls, ai) };
}
