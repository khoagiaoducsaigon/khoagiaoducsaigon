// Khung kế hoạch bài dạy: PL IV CV 5512 (THCS, THPT) và PL 3 CV 2345 (Tiểu học).
// Nội dung KHBD lưu dạng JSON theo khung; parseText() đọc KHBD dạng văn bản (EduPlan cũ, dán từ Word).

export const LOAI_HD = [
  { loai: 'mo_dau', ten: 'Mở đầu', nhan: 'Hoạt động 1: Xác định vấn đề/nhiệm vụ học tập/Mở đầu' },
  { loai: 'hinh_thanh', ten: 'Hình thành kiến thức', nhan: 'Hoạt động 2: Hình thành kiến thức mới/giải quyết vấn đề' },
  { loai: 'luyen_tap', ten: 'Luyện tập', nhan: 'Hoạt động 3: Luyện tập' },
  { loai: 'van_dung', ten: 'Vận dụng', nhan: 'Hoạt động 4: Vận dụng' }
];
export const BUOC = [
  { key: 'giao', ten: 'Giao nhiệm vụ học tập' },
  { key: 'thuc_hien', ten: 'Thực hiện nhiệm vụ' },
  { key: 'bao_cao', ten: 'Báo cáo, thảo luận' },
  { key: 'ket_luan', ten: 'Kết luận, nhận định' }
];

export const capHoc = lop => (+lop <= 5 ? 'TH' : +lop <= 9 ? 'THCS' : 'THPT');
export const khungTheoLop = lop => (capHoc(lop) === 'TH' ? 'PL3-2345' : 'PL4-5512');
export const TEN_KHUNG = { 'PL4-5512': 'Phụ lục IV – CV 5512/BGDĐT-GDTrH', 'PL3-2345': 'Phụ lục 3 – CV 2345/BGDĐT-GDTH' };

const hdTrong = (loai, ten = '') => ({ loai, ten, thoi_luong: 0, muc_tieu: '', noi_dung: '', san_pham: '', to_chuc: { giao: '', thuc_hien: '', bao_cao: '', ket_luan: '' }, to_chuc_text: '' });

export function khungTrong(khung) {
  if (khung === 'PL3-2345') {
    return { khung, yeu_cau_can_dat: '', do_dung: '', hoat_dong: LOAI_HD.map(h => hdTrong(h.loai, h.ten)), dieu_chinh: '' };
  }
  return { khung: 'PL4-5512', muc_tieu: { kien_thuc: '', nang_luc: '', pham_chat: '' }, thiet_bi: '', hoat_dong: LOAI_HD.map(h => hdTrong(h.loai)), dieu_chinh: '' };
}

/** Danh sách mục tiêu (dòng) dùng cho đối chiếu YCCĐ và nhất quán. */
export function mucTieuDong(nd) {
  const src = nd.khung === 'PL3-2345' ? nd.yeu_cau_can_dat : [nd.muc_tieu?.kien_thuc, nd.muc_tieu?.nang_luc].join('\n');
  return String(src || '').split(/\n|;\s*(?=[A-ZÀ-Ỹ])/).map(s => s.replace(/^\s*[-–−•+*]\s*|^\s*\d+[.)]\s*/, '').trim()).filter(s => s.length >= 8);
}

const RX_CHUNG = /^(n[ăa]ng\s*l[ựu]c\s*chung|g[óo]p\s*ph[ầa]n|t[ựu]\s*ch[ủu]\s*v[àa]\s*t[ựu]\s*h[ọo]c|giao\s*ti[ếe]p\s*v[àa]\s*h[ợo]p\s*t[áa]c|gi[ảa]i\s*quy[ếe]t\s*v[ấa]n\s*[đd][ềe]\s*v[àa]\s*s[áa]ng\s*t[ạa]o|ch[ăa]m\s*ch[ỉi]|trung\s*th[ựu]c|tr[áa]ch\s*nhi[ệe]m|y[êe]u\s*n[ưu][ớo]c|nh[âa]n\s*[áa]i)/i;
/** Mục tiêu theo YCCĐ của môn (kiến thức, năng lực đặc thù) — bỏ năng lực chung/phẩm chất (thuộc CT tổng thể). */
export const mucTieuMon = nd => mucTieuDong(nd).filter(d => !RX_CHUNG.test(d.replace(/^n[ăa]ng\s*l[ựu]c\s*[đd][ặa]c\s*th[ùu]\s*:\s*/i, '')) || /^n[ăa]ng\s*l[ựu]c\s*[đd][ặa]c\s*th[ùu]/i.test(d));

/** Toàn văn KHBD (phục vụ luật từ điển, xuất tệp, rà soát LLM). */
export function toText(nd, meta = {}) {
  const L = [];
  if (meta.ten_bai) L.push(`TÊN BÀI DẠY: ${meta.ten_bai}`, `Môn học/Hoạt động giáo dục: ${meta.mon || ''}; lớp: ${meta.lop || ''}`, `Thời gian thực hiện: ${meta.so_tiet || ''} tiết`, '');
  if (nd.khung === 'PL3-2345') {
    L.push('1. Yêu cầu cần đạt', nd.yeu_cau_can_dat, '2. Đồ dùng dạy học', nd.do_dung, '3. Các hoạt động dạy học chủ yếu');
    nd.hoat_dong.forEach((h, i) => L.push(`Hoạt động ${i + 1}: ${h.ten}${h.thoi_luong ? ` (${h.thoi_luong} phút)` : ''}`, h.muc_tieu ? `Mục tiêu: ${h.muc_tieu}` : '', h.to_chuc_text || [h.to_chuc.giao, h.to_chuc.thuc_hien, h.to_chuc.bao_cao, h.to_chuc.ket_luan].filter(Boolean).join('\n')));
    L.push('4. Điều chỉnh sau bài dạy', nd.dieu_chinh || '');
  } else {
    L.push('I. Mục tiêu', `1. Về kiến thức: ${nd.muc_tieu.kien_thuc}`, `2. Về năng lực: ${nd.muc_tieu.nang_luc}`, `3. Về phẩm chất: ${nd.muc_tieu.pham_chat}`,
      'II. Thiết bị dạy học và học liệu', nd.thiet_bi, 'III. Tiến trình dạy học');
    nd.hoat_dong.forEach((h, i) => {
      L.push(`${i + 1}. Hoạt động ${i + 1}: ${h.ten || LOAI_HD[i]?.ten || ''}${h.thoi_luong ? ` (${h.thoi_luong} phút)` : ''}`,
        `a) Mục tiêu: ${h.muc_tieu}`, `b) Nội dung: ${h.noi_dung}`, `c) Sản phẩm: ${h.san_pham}`, 'd) Tổ chức thực hiện:',
        ...BUOC.map((b, k) => `- Bước ${k + 1}. ${b.ten}: ${h.to_chuc[b.key] || ''}`));
    });
    if (nd.dieu_chinh) L.push('Điều chỉnh sau bài dạy', nd.dieu_chinh);
  }
  return L.filter(x => x !== undefined).join('\n');
}

// ------------------------------- Đọc văn bản -------------------------------
const RX_HD = /^\s*(?:\d+\.\s*)?Ho[ạa]t\s*[đd][ộo]ng\s*(\d)\s*[:.\-–]?\s*(.*)$/i;
const RX_PART = /^\s*([abcd])\)\s*(M[ụu]c\s*ti[êe]u|N[ộo]i\s*dung|S[ảa]n\s*ph[ẩa]m|T[ổo]\s*ch[ứu]c\s*th[ựu]c\s*hi[ệe]n)\s*:?\s*(.*)$/i;
const RX_SEC = { muc_tieu: /^\s*I\.\s*M[ỤUụu]C\s*TI[ÊEêe]U/i, thiet_bi: /^\s*II\.\s*(THI[ẾEếe]T\s*B[ỊIịi]|Thi[ếe]t\s*b[ịi])/i, tien_trinh: /^\s*III\.\s*(TI[ẾEếe]N\s*TR[ÌIìi]NH|Ti[ếe]n\s*tr[ìi]nh)/i };
const RX_MT = { kien_thuc: /^\s*\d\.\s*V[ềe]\s*ki[ếe]n\s*th[ứu]c\s*:?\s*(.*)$/i, nang_luc: /^\s*\d\.\s*V[ềe]\s*n[ăa]ng\s*l[ựu]c\s*:?\s*(.*)$/i, pham_chat: /^\s*\d\.\s*V[ềe]\s*ph[ẩa]m\s*ch[ấa]t\s*:?\s*(.*)$/i };
const buocCua = line => {
  const m = line.match(/B[ưu][ớo]c\s*([1-4])/i);
  if (m) return BUOC[+m[1] - 1].key;
  if (/chuy[ểe]n\s*giao|giao\s*nhi[ệe]m\s*v[ụu]/i.test(line)) return 'giao';
  if (/th[ựu]c\s*hi[ệe]n\s*nhi[ệe]m\s*v[ụu]/i.test(line)) return 'thuc_hien';
  if (/b[áa]o\s*c[áa]o|th[ảa]o\s*lu[ậa]n/i.test(line)) return 'bao_cao';
  if (/k[ếe]t\s*lu[ậa]n|nh[ậa]n\s*[đd][ịi]nh/i.test(line)) return 'ket_luan';
  return null;
};
const loaiCua = (so, ten) => {
  if (/m[ởo]\s*[đd][ầa]u|kh[ởo]i\s*[đd][ộo]ng|x[áa]c\s*[đd][ịi]nh\s*v[ấa]n/i.test(ten)) return 'mo_dau';
  if (/h[ìi]nh\s*th[àa]nh|ki[ếe]n\s*th[ứu]c\s*m[ớo]i|kh[áa]m\s*ph[áa]/i.test(ten)) return 'hinh_thanh';
  if (/luy[ệe]n\s*t[ậa]p|th[ựu]c\s*h[àa]nh/i.test(ten)) return 'luyen_tap';
  if (/v[ậa]n\s*d[ụu]ng/i.test(ten)) return 'van_dung';
  return LOAI_HD[Math.min(3, Math.max(0, so - 1))].loai;
};
const PART_KEY = { a: 'muc_tieu', b: 'noi_dung', c: 'san_pham', d: 'to_chuc' };
const add = (s, t) => (s ? `${s}\n${t}` : t).trim();

/** Đọc KHBD dạng văn bản → khung PL IV (best-effort, không làm mất chữ: giữ van_ban_goc). */
export function parseText(text) {
  const nd = khungTrong('PL4-5512');
  nd.hoat_dong = [];
  nd.van_ban_goc = text;
  let sec = null, mt = null, hd = null, part = null, step = null;
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (RX_SEC.muc_tieu.test(line)) { sec = 'muc_tieu'; mt = null; continue; }
    if (RX_SEC.thiet_bi.test(line)) { sec = 'thiet_bi'; continue; }
    if (RX_SEC.tien_trinh.test(line)) { sec = 'tien_trinh'; continue; }
    const mHd = line.match(RX_HD);
    if (mHd && (sec === 'tien_trinh' || sec === null || sec === 'thiet_bi')) {
      sec = 'tien_trinh';
      const so = +mHd[1];
      const tenDong = mHd[2].replace(/\(.*?ph[úu]t.*?\)/i, '').trim();
      const tl = (mHd[2].match(/(\d+)\s*ph[úu]t/i) || [])[1];
      if (so <= nd.hoat_dong.length && nd.hoat_dong[so - 1]) { hd = nd.hoat_dong[so - 1]; }
      else { hd = hdTrong(loaiCua(so, tenDong), tenDong); nd.hoat_dong.push(hd); }
      if (tl) hd.thoi_luong += +tl;
      part = null; step = null;
      continue;
    }
    if (sec === 'muc_tieu') {
      let hit = false;
      for (const [k, rx] of Object.entries(RX_MT)) { const m = line.match(rx); if (m) { mt = k; nd.muc_tieu[k] = add(nd.muc_tieu[k], m[1]); hit = true; break; } }
      if (!hit) { if (mt) nd.muc_tieu[mt] = add(nd.muc_tieu[mt], line); else nd.muc_tieu.kien_thuc = add(nd.muc_tieu.kien_thuc, line); }
      continue;
    }
    if (sec === 'thiet_bi') { nd.thiet_bi = add(nd.thiet_bi, line.replace(/^[-–•]\s*/, '')); continue; }
    if (sec === 'tien_trinh' && hd) {
      const mP = line.match(RX_PART);
      if (mP) {
        part = PART_KEY[mP[1].toLowerCase()];
        step = null;
        if (part !== 'to_chuc') hd[part] = add(hd[part], mP[3]);
        else if (mP[3]) { hd.to_chuc_text = add(hd.to_chuc_text, mP[3]); }
        continue;
      }
      if (part === 'to_chuc') {
        const b = buocCua(line);
        if (b && /^[-–•]?\s*(B[ưu][ớo]c|Chuy[ểe]n|Giao|Th[ựu]c|B[áa]o|K[ếe]t)/i.test(line)) step = b;
        const clean = line.replace(/^[-–•]\s*/, '').replace(/^B[ưu][ớo]c\s*\d\s*[.:]\s*[^:]{0,40}:\s*/i, '');
        if (step) hd.to_chuc[step] = add(hd.to_chuc[step], clean);
        else hd.to_chuc_text = add(hd.to_chuc_text, line);
        continue;
      }
      if (part) { hd[part] = add(hd[part], line); continue; }
      const tl = line.match(/(\d+)\s*ph[úu]t/i);
      if (/^\d+\.\d+\./.test(line)) { hd.noi_dung = add(hd.noi_dung, line); if (tl) hd.thoi_luong += +tl[1]; }
    }
  }
  while (nd.hoat_dong.length < 4) nd.hoat_dong.push(hdTrong(LOAI_HD[nd.hoat_dong.length].loai));
  return nd;
}
