// Chấm phiếu đánh giá bài dạy theo Phụ lục V (CV 05/SGDĐT-GDPT ngày 04/01/2021).
// 12 tiêu chí, tổng 20 điểm; mức 1: 50–65%, mức 2: 65–80%, mức 3: 80–100% điểm tối đa; điểm là bội số của 0,25.

export const lamTron025 = x => Math.round(x * 4) / 4;

/** Khoảng điểm hợp lệ của một mức (0 = dưới mức 1). */
export function khoangDiem(toiDa, muc) {
  const R = [[0, 0.5], [0.5, 0.65], [0.65, 0.8], [0.8, 1]][muc];
  return [lamTron025(R[0] * toiDa), lamTron025(R[1] * toiDa)];
}

/** Điểm gợi ý khi chọn mức: lấy cận trên của khoảng (đã làm tròn 0,25). */
export const diemGoiY = (toiDa, muc) => khoangDiem(toiDa, muc)[1];

/** Kiểm tra một điểm thành phần → thông điệp lỗi hoặc ''. */
export function kiemDiem(diem, toiDa) {
  if (diem === '' || diem == null || Number.isNaN(+diem)) return 'Chưa nhập điểm';
  if (+diem < 0 || +diem > toiDa) return `Điểm phải trong khoảng 0–${toiDa}`;
  if (Math.abs(+diem * 4 - Math.round(+diem * 4)) > 1e-9) return 'Điểm phải là bội số của 0,25';
  return '';
}

export function xepLoai(tong) {
  if (tong >= 18) return 'Giỏi';
  if (tong >= 13.5) return 'Khá';
  if (tong >= 10) return 'Trung bình';
  return 'Không đạt';
}

/** Tổng hợp phiếu: { tong, xep_loai, loi[] } */
export function tongHop(plv, diem) {
  const loi = [];
  let tong = 0;
  plv.tieu_chi.forEach((t, i) => {
    const e = kiemDiem(diem[i], t.diem_toi_da);
    if (e) loi.push(`${t.ma}: ${e}`); else tong += +diem[i];
  });
  tong = lamTron025(tong);
  return { tong, xep_loai: xepLoai(tong), loi };
}

/** Gợi ý mức cho nhóm "I. Kế hoạch bài dạy" từ chỉ số rà soát P8 (người dự giờ quyết định). */
export function goiYTuRaSoat(chiSo = {}) {
  const muc = v => (v >= 85 ? 3 : v >= 70 ? 2 : v >= 50 ? 1 : 0);
  return {
    'I.1': muc(Math.round((chiSo.tich_cuc + chiSo.nhat_quan) / 2) || 0),
    'I.2': muc(chiSo.cau_truc || 0),
    'I.3': muc(chiSo.cau_truc || 0),
    'I.4': muc(chiSo.nhat_quan || 0)
  };
}
