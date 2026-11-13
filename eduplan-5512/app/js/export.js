// Xuất tệp: KHBD / phiếu học tập / đề đánh giá → .docx (thư viện docx, MIT); slide → .pptx (pptxgenjs, MIT).
// Thư viện chỉ tải khi người dùng bấm xuất (không làm chậm lúc mở app).
import { LOAI_HD, BUOC, TEN_KHUNG, mucTieuDong } from './khung.js';
import { download, slug } from './ui.js';

const LIB = { docx: 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js', pptx: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js' };
const taiScript = (src, global) => window[global] ? Promise.resolve(window[global]) : new Promise((res, rej) => {
  const s = Object.assign(document.createElement('script'), { src, onload: () => res(window[global]), onerror: () => rej(new Error(`Không tải được thư viện (${src.split('/npm/')[1]}) — kiểm tra kết nối mạng.`)) });
  document.head.appendChild(s);
});

async function docxTu(khoi, ten) {
  const D = await taiScript(LIB.docx, 'docx');
  const P = (text, o = {}) => new D.Paragraph({ children: [new D.TextRun({ text: String(text ?? ''), bold: o.bold, italics: o.italics, size: o.size || 26, font: 'Times New Roman' })],
    heading: o.h, alignment: o.center ? D.AlignmentType.CENTER : undefined, spacing: { after: 80 } });
  const children = [];
  for (const k of khoi) {
    if (k.t === 'h1') children.push(P(k.v, { bold: true, center: true, size: 30 }));
    else if (k.t === 'h2') children.push(P(k.v, { bold: true, size: 27 }));
    else if (k.t === 'i') children.push(P(k.v, { italics: true }));
    else String(k.v ?? '').split('\n').forEach(line => children.push(P(line)));
  }
  const doc = new D.Document({ sections: [{ properties: { page: { margin: { top: 1134, bottom: 1134, left: 1701, right: 1134 } } }, children }] });
  download(`${ten}.docx`, await D.Packer.toBlob(doc));
}

export function khoiKHBD(lesson, nd, truong = '') {
  const K = [{ t: 'p', v: `Trường: ${truong}` }, { t: 'p', v: `Tổ: ${lesson.to || ''}` }, { t: 'h1', v: `TÊN BÀI DẠY: ${String(lesson.ten_bai).toUpperCase()}` },
    { t: 'p', v: `Môn học/Hoạt động giáo dục: ${lesson.mon}; lớp: ${lesson.lop}` }, { t: 'p', v: `Thời gian thực hiện: ${lesson.so_tiet || ''} tiết` }, { t: 'i', v: `Khung: ${TEN_KHUNG[nd.khung]}` }];
  if (nd.khung === 'PL3-2345') {
    K.push({ t: 'h2', v: '1. Yêu cầu cần đạt' }, { t: 'p', v: nd.yeu_cau_can_dat }, { t: 'h2', v: '2. Đồ dùng dạy học' }, { t: 'p', v: nd.do_dung }, { t: 'h2', v: '3. Các hoạt động dạy học chủ yếu' });
    nd.hoat_dong.forEach((h, i) => K.push({ t: 'p', v: `Hoạt động ${i + 1}: ${h.ten || LOAI_HD[i].ten}${h.thoi_luong ? ` (${h.thoi_luong} phút)` : ''}` }, { t: 'p', v: h.to_chuc_text || Object.values(h.to_chuc).filter(Boolean).join('\n') }));
    K.push({ t: 'h2', v: '4. Điều chỉnh sau bài dạy' }, { t: 'p', v: nd.dieu_chinh || '…………………………………………' });
    return K;
  }
  K.push({ t: 'h2', v: 'I. Mục tiêu' }, { t: 'p', v: `1. Về kiến thức:\n${nd.muc_tieu.kien_thuc}` }, { t: 'p', v: `2. Về năng lực:\n${nd.muc_tieu.nang_luc}` }, { t: 'p', v: `3. Về phẩm chất: ${nd.muc_tieu.pham_chat}` },
    { t: 'h2', v: 'II. Thiết bị dạy học và học liệu' }, { t: 'p', v: nd.thiet_bi }, { t: 'h2', v: 'III. Tiến trình dạy học' });
  nd.hoat_dong.forEach((h, i) => {
    K.push({ t: 'h2', v: `${i + 1}. Hoạt động ${i + 1}: ${h.ten || LOAI_HD[i].ten}${h.thoi_luong ? ` (${h.thoi_luong} phút)` : ''}` },
      { t: 'p', v: `a) Mục tiêu: ${h.muc_tieu}` }, { t: 'p', v: `b) Nội dung: ${h.noi_dung}` }, { t: 'p', v: `c) Sản phẩm: ${h.san_pham}` }, { t: 'p', v: 'd) Tổ chức thực hiện:' },
      ...BUOC.map(b => ({ t: 'p', v: `- ${b.ten}: ${h.to_chuc[b.key] || ''}` })));
    if (h.to_chuc_text) K.push({ t: 'p', v: h.to_chuc_text });
  });
  if (nd.dieu_chinh) K.push({ t: 'h2', v: 'Điều chỉnh sau bài dạy' }, { t: 'p', v: nd.dieu_chinh });
  return K;
}

export const xuatKHBD = (lesson, nd, truong) => docxTu(khoiKHBD(lesson, nd, truong), `KHBD_${slug(lesson.ten_bai)}`);
export const xuatPhieu = (lesson, ws) => docxTu(ws.flatMap(w => [{ t: 'h1', v: w.tieu_de.toUpperCase() }, { t: 'p', v: `Bài: ${lesson.ten_bai} – ${lesson.mon} ${lesson.lop}` },
  { t: 'p', v: 'Họ tên/Nhóm: ……………………………… Lớp: ………' }, { t: 'h2', v: 'Nhiệm vụ' }, { t: 'p', v: (w.nhiem_vu || []).join('\n') }, { t: 'h2', v: 'Sản phẩm cần nộp' }, { t: 'p', v: w.san_pham },
  { t: 'h2', v: 'Tiêu chí đánh giá' }, { t: 'p', v: (w.thang_tieu_chi || []).map(x => '☐ ' + x).join('\n') }, { t: 'p', v: ' ' }]), `Phieu-hoc-tap_${slug(lesson.ten_bai)}`);
export function xuatDanhGia(lesson, nd, as) {
  const mt = mucTieuDong(nd), TEN = { NB: 'Nhận biết', TH: 'Thông hiểu', VD: 'Vận dụng', VDC: 'Vận dụng cao' };
  return docxTu([{ t: 'h1', v: `CÂU HỎI ĐÁNH GIÁ – ${String(lesson.ten_bai).toUpperCase()}` }, { t: 'i', v: 'Mức độ theo CV 5512 mục II.4: Nhận biết – Thông hiểu – Vận dụng – Vận dụng cao' },
    ...(as?.cau_hoi || []).map((c, i) => ({ t: 'p', v: `Câu ${i + 1} [${TEN[c.muc_do] || c.muc_do}] (mục tiêu ${+c.muc_tieu_ref + 1}: ${(mt[c.muc_tieu_ref] || '').slice(0, 60)}…): ${c.noi_dung}` })),
    { t: 'h2', v: 'Đáp án / hướng dẫn chấm' }, ...(as?.cau_hoi || []).map((c, i) => ({ t: 'p', v: `Câu ${i + 1}: ${c.dap_an || ''}` })),
    { t: 'h2', v: 'Rubric đánh giá sản phẩm' }, ...(as?.rubric || []).map(r => ({ t: 'p', v: `${r.tieu_chi}: ${r.muc.map((m, k) => `Mức ${k + 1} – ${m}`).join(' | ')}` }))], `Danh-gia_${slug(lesson.ten_bai)}`);
}
export async function xuatSlide(lesson, sl) {
  const P = await taiScript(LIB.pptx, 'PptxGenJS');
  const pres = new P(); pres.layout = 'LAYOUT_WIDE';
  (sl?.trang || []).forEach((t, i) => {
    const s = pres.addSlide();
    s.background = { color: i === 0 ? '1E40AF' : 'F8FAFC' };
    s.addText(t.tieu_de, { x: 0.5, y: i === 0 ? 2.3 : 0.4, w: 12.3, h: 1, fontSize: i === 0 ? 36 : 26, bold: true, color: i === 0 ? 'FFFFFF' : '1E3A8A', fontFace: 'Arial' });
    s.addText(t.noi_dung || '', { x: 0.5, y: i === 0 ? 3.4 : 1.5, w: 12.3, h: 5, fontSize: i === 0 ? 20 : 18, color: i === 0 ? 'DBEAFE' : '334155', valign: 'top', fontFace: 'Arial' });
    if (t.ghi_chu_gv) s.addNotes(t.ghi_chu_gv);
  });
  await pres.writeFile({ fileName: `Slide_${slug(lesson.ten_bai)}.pptx` });
}
