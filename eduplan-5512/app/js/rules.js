// Luật rà soát KHBD (mục 3C master prompt v1.0 + luật kế thừa EduPlan cũ, nguon = "eduplan v1").
// Mỗi luật: { id, muc: 'do'|'vang'|'xanh', nhom, mo_ta, nguon, cach_kiem, kiem(ctx) → [{vi_tri, thong_diep, de_xuat}] }
// ctx = { lesson, nd (nội dung theo khung), yccd: [YCCĐ đã chọn], assessments, worksheets, slides, integrations, nls, ai }
import { BUOC, mucTieuDong, mucTieuMon, toText, capHoc } from './khung.js';

const empty = s => !String(s ?? '').trim();
const STOP = new Set('được và của các một những cho với trong có là để theo về khi từ này đó như hoặc thì đã sẽ hs gv học sinh giáo viên bài ở tại trên dưới qua bằng nhau lại ra vào mỗi nào gì'.split(' '));
export const tokens = s => String(s || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1 && !STOP.has(w));
/** Tỉ lệ âm tiết nội dung của `ref` xuất hiện trong `text` (0–1). */
export function overlap(ref, text) {
  const r = [...new Set(tokens(ref))]; if (!r.length) return 0;
  const t = new Set(tokens(text));
  return r.filter(w => t.has(w)).length / r.length;
}
const bacCuaLop = lop => (+lop <= 3 ? 'L1-3' : +lop <= 5 ? 'L4-5' : +lop <= 7 ? 'L6-7' : +lop <= 9 ? 'L8-9' : 'L10-12');
const laTH = ctx => ctx.nd.khung === 'PL3-2345';
const nhe = ctx => ctx.lesson?.nhan === 'nhập từ EduPlan' || ctx.lesson?.che_do === 'ra_soat_nhanh';

// Từ điển kế thừa EduPlan v1
const RX_TICH_CUC = /(th[ảa]o\s*lu[ậa]n|nh[óo]m|c[ặa]p\s*[đd][ôo]i|phi[ếe]u\s*h[ọo]c\s*t[ậa]p|tr[ìi]nh\s*b[àa]y|th[ựu]c\s*h[àa]nh|th[íi]\s*nghi[ệe]m|[đd][óo]ng\s*vai|tranh\s*bi[ệe]n|kh[ăa]n\s*tr[ảa]i\s*b[àa]n|m[ảa]nh\s*gh[ée]p|s[ơo]\s*[đd][ồo]\s*t[ưu]\s*duy|tr[òo]\s*ch[ơo]i|ph[òo]ng\s*tranh|tr[ạa]m|kh[áa]m\s*ph[áa]|ph[ảa]n\s*bi[ệe]n|[đd][áa]nh\s*gi[áa]\s*ch[ée]o|[đd][ổo]i\s*ch[ée]o|t[ựu]\s*[đd][áa]nh\s*gi[áa]|d[ựu]\s*[áa]n|c[ắa]t\s*gh[ée]p|[đd]o\s*[đd][ạa]c|KWL|Padlet|Quizizz|Kahoot)/gi;
const RX_THU_DONG = /(GV\s*gi[ảa]ng|GV\s*thuy[ếe]t\s*tr[ìi]nh|GV\s*[đd][ọo]c|GV\s*gi[ảa]i\s*th[íi]ch|GV\s*gi[ớo]i\s*thi[ệe]u|GV\s*l[àa]m\s*th[íi]\s*nghi[ệe]m\s*bi[ểe]u\s*di[ễe]n|GV\s*v[ẽe]|HS\s*(l[ắa]ng\s*)?nghe|HS\s*ghi\s*ch[ée]p|ghi\s*b[àa]i|ghi\s*nh[ớo]|ch[úu]\s*[ýy]\s*l[êe]n\s*b[ảa]ng|[đd][ọo]c\s*SGK|GV\s*g[ọo]i\s*1)/gi;
const RX_LOI_THOAI = /(GV\s*(n[óo]i|h[ỏo]i)\s*:\s*["“]|HS\s*(tr[ảa]\s*l[ờo]i|n[óo]i)\s*:\s*["“]|["“][^"”]{3,}\?["”]\s*-\s*HS)/i;
const RX_DONG_TU_MO = /^(hi[ểe]u|bi[ếe]t|n[ắa]m\s*[đd][ượu][ợc]c|n[ắa]m\s*v[ữu]ng|l[àa]m\s*quen)\b/i;
const RX_DONG_TU_DO = /(n[êe]u\s*[đd][ượu][ợc]c|tr[ìi]nh\s*b[àa]y|t[íi]nh\s*[đd][ượu][ợc]c|gi[ảa]i\s*th[íi]ch|ph[âa]n\s*t[íi]ch|so\s*s[áa]nh|v[ẽe]\s*[đd][ượu][ợc]c|x[áa]c\s*[đd][ịi]nh|m[ôo]\s*t[ảa]|nh[ậa]n\s*bi[ếe]t|v[ậa]n\s*d[ụu]ng|th[ựu]c\s*hi[ệe]n|l[ấa]y\s*[đd][ượu][ợc]c|[đd][ềe]\s*xu[ấa]t|thi[ếe]t\s*k[ếe]|s[ửu]\s*d[ụu]ng\s*[đd][ượu][ợc]c|l[ậa]p\s*[đd][ượu][ợc]c|ch[ỉi]\s*ra|gi[ảa]i\s*quy[ếe]t|ph[âa]n\s*bi[ệe]t|ph[âa]n\s*lo[ạa]i|t[ạa]o\s*l[ậa]p|[đd][ọo]c\s*[đd][ượu][ợc]c|vi[ếe]t\s*[đd][ượu][ợc]c|k[ểe]\s*[đd][ượu][ợc]c)/i;
const TEN_CHUNG = /^(h[ìi]nh\s*th[àa]nh\s*ki[ếe]n\s*th[ứu]c(\s*m[ớo]i)?|m[ởo]\s*[đd][ầa]u|kh[ởo]i\s*[đd][ộo]ng|luy[ệe]n\s*t[ậa]p|v[ậa]n\s*d[ụu]ng)$/i;

const hdTen = (ctx, i) => `HĐ${i + 1}${ctx.nd.hoat_dong[i]?.ten ? ` (${ctx.nd.hoat_dong[i].ten})` : ''}`;
const stepText = h => Object.values(h.to_chuc || {}).join(' ') + ' ' + (h.to_chuc_text || '');

export const RULES = [
  { id: 'CT-01', muc: 'do', nhom: 'Cấu trúc', nguon: 'PL IV CV 5512', cach_kiem: 'cau_truc', mo_ta: 'Có đủ I. Mục tiêu (kiến thức, năng lực, phẩm chất), II. Thiết bị dạy học và học liệu, III. Tiến trình dạy học',
    kiem: ctx => laTH(ctx) ? [] : [
      ['muc_tieu.kien_thuc', 'Mục tiêu về kiến thức'], ['muc_tieu.nang_luc', 'Mục tiêu về năng lực'], ['muc_tieu.pham_chat', 'Mục tiêu về phẩm chất'], ['thiet_bi', 'Thiết bị dạy học và học liệu']
    ].filter(([p]) => empty(p.split('.').reduce((o, k) => o?.[k], ctx.nd))).map(([p, t]) => ({ vi_tri: p, thong_diep: `Thiếu "${t}".`, de_xuat: `Bổ sung ${t.toLowerCase()} theo hướng dẫn Phụ lục IV.` })) },
  { id: 'CT-02', muc: 'do', nhom: 'Cấu trúc', nguon: 'PL IV CV 5512', cach_kiem: 'cau_truc', mo_ta: 'Tiến trình đủ 4 hoạt động: Mở đầu · Hình thành kiến thức · Luyện tập · Vận dụng',
    kiem: ctx => {
      const co = new Set(ctx.nd.hoat_dong.filter(h => !empty(h.muc_tieu + h.noi_dung + h.san_pham + stepText(h))).map(h => h.loai));
      return [['mo_dau', 'Mở đầu'], ['hinh_thanh', 'Hình thành kiến thức'], ['luyen_tap', 'Luyện tập'], ['van_dung', 'Vận dụng']]
        .filter(([l]) => !co.has(l)).map(([l, t]) => ({ vi_tri: 'hoat_dong', thong_diep: `Thiếu hoạt động "${t}".`, de_xuat: `Thêm hoạt động ${t} với đủ mục tiêu, nội dung, sản phẩm, tổ chức thực hiện.` }));
    } },
  { id: 'CT-03', muc: 'do', nhom: 'Cấu trúc', nguon: 'PL IV CV 5512', cach_kiem: 'cau_truc', mo_ta: 'Mỗi hoạt động đủ a) Mục tiêu · b) Nội dung · c) Sản phẩm · d) Tổ chức thực hiện',
    kiem: ctx => laTH(ctx) ? [] : ctx.nd.hoat_dong.flatMap((h, i) => [['muc_tieu', 'a) Mục tiêu'], ['noi_dung', 'b) Nội dung'], ['san_pham', 'c) Sản phẩm']]
      .filter(([k]) => empty(h[k])).map(([k, t]) => ({ vi_tri: `hoat_dong.${i}.${k}`, thong_diep: `${hdTen(ctx, i)} thiếu ${t}.`, de_xuat: `Bổ sung ${t} cho ${hdTen(ctx, i)}.` }))
      .concat(empty(stepText(h)) ? [{ vi_tri: `hoat_dong.${i}.to_chuc`, thong_diep: `${hdTen(ctx, i)} thiếu d) Tổ chức thực hiện.`, de_xuat: 'Mô tả 4 bước tổ chức hoạt động.' }] : [])) },
  { id: 'CT-04', muc: 'vang', nhom: 'Cấu trúc', nguon: 'PL IV CV 5512', cach_kiem: 'cau_truc', mo_ta: 'Tên HĐ1, HĐ2 "thể hiện kết quả hoạt động", không để tên chung chung',
    kiem: ctx => laTH(ctx) ? [] : ctx.nd.hoat_dong.slice(0, 2).map((h, i) => ({ h, i })).filter(({ h }) => empty(h.ten) || TEN_CHUNG.test(h.ten.trim()))
      .map(({ i }) => ({ vi_tri: `hoat_dong.${i}.ten`, thong_diep: `Tên Hoạt động ${i + 1} chưa thể hiện kết quả hoạt động.`, de_xuat: 'Đặt tên nêu kết quả, ví dụ "Khám phá công thức tính diện tích xung quanh".' })) },
  { id: 'TH-01', muc: 'do', nhom: 'Cấu trúc', nguon: 'PL 3 CV 2345', cach_kiem: 'cau_truc', mo_ta: '(Tiểu học) đủ 4 phần: Yêu cầu cần đạt · Đồ dùng dạy học · Các hoạt động dạy học chủ yếu · Điều chỉnh sau bài dạy',
    kiem: ctx => !laTH(ctx) ? [] : [
      ['yeu_cau_can_dat', '1. Yêu cầu cần đạt'], ['do_dung', '2. Đồ dùng dạy học']
    ].filter(([k]) => empty(ctx.nd[k])).map(([k, t]) => ({ vi_tri: k, thong_diep: `Thiếu "${t}".`, de_xuat: `Bổ sung ${t} theo Phụ lục 3 CV 2345.` }))
      .concat(ctx.nd.hoat_dong.every(h => empty(h.to_chuc_text + stepText(h))) ? [{ vi_tri: 'hoat_dong', thong_diep: 'Thiếu "3. Các hoạt động dạy học chủ yếu".', de_xuat: 'Mô tả các hoạt động dạy học chủ yếu.' }] : []) },
  { id: 'MT-01', muc: 'do', nhom: 'Mục tiêu', nguon: 'PL IV CV 5512 mục I; TT 32/2018', cach_kiem: 'doi_chieu', mo_ta: 'Mỗi mục tiêu kiến thức/năng lực trích được ít nhất 1 YCCĐ đúng môn, lớp',
    kiem: ctx => {
      const dong = mucTieuMon(ctx.nd);
      if (!ctx.yccd?.length) return [{ vi_tri: laTH(ctx) ? 'yeu_cau_can_dat' : 'muc_tieu', thong_diep: 'Chưa chọn yêu cầu cần đạt (YCCĐ) nào của chương trình môn.', de_xuat: 'Ở bước Thiết lập, chọn YCCĐ đúng môn, lớp trong CT GDPT 2018.' }];
      const hit = dong.filter(d => ctx.yccd.some(y => overlap(y.yccd, d) >= 0.4 || overlap(d, y.yccd) >= 0.5));
      if (!hit.length) return [{ vi_tri: 'muc_tieu', thong_diep: 'Không mục tiêu nào bám được YCCĐ đã chọn.', de_xuat: 'Viết mục tiêu dựa sát câu chữ YCCĐ (động từ + nội dung).' }];
      return dong.filter(d => !hit.includes(d)).map(d => ({ muc: 'vang', vi_tri: 'muc_tieu', thong_diep: `Mục tiêu "${d.slice(0, 70)}…" chưa đối chiếu được với YCCĐ đã chọn.`, de_xuat: 'Kiểm tra lại hoặc chọn thêm YCCĐ tương ứng.' }));
    } },
  { id: 'MT-02', muc: 'vang', nhom: 'Mục tiêu', nguon: 'PL IV CV 5512 mục I', cach_kiem: 'regex', mo_ta: 'Mục tiêu dùng động từ hành vi đo được, tránh "hiểu", "biết" chung chung',
    kiem: ctx => mucTieuDong(ctx.nd).filter(d => RX_DONG_TU_MO.test(d) || !RX_DONG_TU_DO.test(d))
      .map(d => ({ vi_tri: 'muc_tieu', thong_diep: `Mục tiêu "${d.slice(0, 60)}…" chưa dùng động từ đo được.`, de_xuat: 'Dùng "nêu được", "tính được", "giải thích được", "vận dụng được"…' })) },
  { id: 'MT-03', muc: 'vang', nhom: 'Mục tiêu', nguon: 'PL IV CV 5512 mục I.3', cach_kiem: 'regex', mo_ta: 'Phẩm chất mô tả bằng hành vi, thái độ gắn nội dung bài',
    kiem: ctx => {
      if (laTH(ctx)) return [];
      const pc = String(ctx.nd.muc_tieu.pham_chat || '').trim();
      if (!pc) return [];
      const chiTen = pc.replace(/[.,;:\s]/g, ' ').split(/\s+/).filter(Boolean).every(w => /^(y[êe]u|n[ưu][ớo]c|nh[âa]n|[áa]i|ch[ăa]m|ch[ỉi]|trung|th[ựu]c|tr[áa]ch|nhi[ệe]m|v[ềe]|ph[ẩa]m|ch[ấa]t|-)$/i.test(w));
      return chiTen || pc.length < 25 ? [{ vi_tri: 'muc_tieu.pham_chat', thong_diep: 'Phẩm chất mới nêu tên, chưa mô tả hành vi gắn nội dung bài.', de_xuat: 'Ví dụ: "Trung thực khi ghi kết quả đo; có trách nhiệm hoàn thành phần việc trong nhóm".' }] : [];
    } },
  { id: 'TC-01', muc: 'do', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 4', cach_kiem: 'cau_truc', mo_ta: 'd) có đủ 4 bước: Giao nhiệm vụ · Thực hiện · Báo cáo, thảo luận · Kết luận, nhận định',
    kiem: ctx => laTH(ctx) ? [] : ctx.nd.hoat_dong.flatMap((h, i) => empty(stepText(h)) ? [] : BUOC.filter(b => empty(h.to_chuc[b.key]))
      .map(b => ({ vi_tri: `hoat_dong.${i}.to_chuc.${b.key}`, thong_diep: `${hdTen(ctx, i)} thiếu bước "${b.ten}".`, de_xuat: `Mô tả bước ${b.ten.toLowerCase()} theo ghi chú 4 Phụ lục IV.` }))) },
  { id: 'TC-02', muc: 'vang', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 4', cach_kiem: 'regex', mo_ta: 'Giao nhiệm vụ nêu rõ HS đọc/nghe/nhìn/làm gì, với thiết bị/học liệu nào',
    kiem: ctx => ctx.nd.hoat_dong.flatMap((h, i) => { const g = h.to_chuc?.giao || ''; return g && !(/(phi[ếe]u|SGK|m[ôo]\s*h[ìi]nh|video|tranh|[ảa]nh|b[ảa]ng\s*nh[óo]m|d[ụu]ng\s*c[ụu]|m[áa]y|h[ọo]c\s*li[ệe]u|b[àa]i\s*t[ậa]p|gi[ấa]y|th[ẻe])/i.test(g) && /(\d+\s*ph[úu]t|nh[óo]m|c[áa]\s*nh[âa]n|c[ặa]p)/i.test(g))
      ? [{ vi_tri: `hoat_dong.${i}.to_chuc.giao`, thong_diep: `${hdTen(ctx, i)}: lệnh giao nhiệm vụ chưa rõ học liệu và hình thức/thời gian.`, de_xuat: 'Viết theo cấu trúc: Nhiệm vụ – Hình thức – Thời gian – Học liệu – Sản phẩm.' }] : []; }) },
  { id: 'TC-03', muc: 'vang', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 4', cach_kiem: 'regex', mo_ta: 'Bước Thực hiện có dự kiến khó khăn của HS và biện pháp hỗ trợ',
    kiem: ctx => ctx.nd.hoat_dong.flatMap((h, i) => { const t = h.to_chuc?.thuc_hien || ''; return t && !/(kh[óo]\s*kh[ăa]n|h[ỗo]\s*tr[ợo]|g[ợo]i\s*[ýy]|g[ợo]i\s*m[ởo]|h[ưu][ớo]ng\s*d[ẫa]n)/i.test(t)
      ? [{ vi_tri: `hoat_dong.${i}.to_chuc.thuc_hien`, thong_diep: `${hdTen(ctx, i)}: chưa dự kiến khó khăn của HS và biện pháp hỗ trợ.`, de_xuat: 'Thêm: "Dự kiến khó khăn: … → GV hỗ trợ bằng …".' }] : []; }) },
  { id: 'TC-04', muc: 'vang', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 4', cach_kiem: 'regex', mo_ta: 'Bước Báo cáo nêu giải pháp chọn nhóm báo cáo và cách tổ chức',
    kiem: ctx => ctx.nd.hoat_dong.flatMap((h, i) => { const t = h.to_chuc?.bao_cao || ''; return t && !/(nh[óo]m|c[ặa]p|[đd][ạa]i\s*di[ệe]n|ph[òo]ng\s*tranh|tr[ưu]ng\s*b[àa]y|ch[ọo]n|m[ờo]i|lu[âa]n\s*phi[êe]n)/i.test(t)
      ? [{ vi_tri: `hoat_dong.${i}.to_chuc.bao_cao`, thong_diep: `${hdTen(ctx, i)}: chưa nêu cách chọn nhóm/HS báo cáo.`, de_xuat: 'Nêu giải pháp sư phạm: chọn nhóm có kết quả khác nhau, phòng tranh, đánh giá chéo…' }] : []; }) },
  { id: 'TC-05', muc: 'vang', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 4', cach_kiem: 'regex', mo_ta: 'Bước Kết luận phân tích sản phẩm làm căn cứ đánh giá mức độ hoàn thành',
    kiem: ctx => ctx.nd.hoat_dong.flatMap((h, i) => { const t = h.to_chuc?.ket_luan || ''; return t && !/(s[ảa]n\s*ph[ẩa]m|[đd][áa]nh\s*gi[áa]|nh[ậa]n\s*x[ée]t|chu[ẩa]n\s*h[óo]a|ti[êe]u\s*ch[íi])/i.test(t)
      ? [{ vi_tri: `hoat_dong.${i}.to_chuc.ket_luan`, thong_diep: `${hdTen(ctx, i)}: kết luận chưa phân tích sản phẩm/đánh giá mức độ hoàn thành.`, de_xuat: 'Thêm: nhận xét sản phẩm theo tiêu chí, chuẩn hóa kiến thức cần ghi nhận.' }] : []; }) },
  { id: 'TC-06', muc: 'vang', nhom: 'Tổ chức', nguon: 'PL IV CV 5512 ghi chú 2', cach_kiem: 'regex', mo_ta: 'Không ghi lời thoại GV/HS; mô tả hoạt động',
    kiem: ctx => RX_LOI_THOAI.test(toText(ctx.nd)) ? [{ vi_tri: 'hoat_dong', thong_diep: 'KHBD có ghi lời thoại GV/HS.', de_xuat: 'Thay lời thoại bằng mô tả hoạt động: GV giao/quan sát/hướng dẫn…; HS thực hiện/trình bày…' }] : [] },
  { id: 'TC-07', muc: 'xanh', nhom: 'Tổ chức', nguon: 'eduplan v1 (từ điển tích cực/thụ động)', cach_kiem: 'regex', mo_ta: 'Tỉ lệ dấu hiệu HS tích cực so với GV độc thoại',
    kiem: ctx => { const t = toText(ctx.nd); const a = (t.match(RX_TICH_CUC) || []).length, p = (t.match(RX_THU_DONG) || []).length;
      return p > 0 ? [{ vi_tri: 'hoat_dong', thong_diep: `Có ${p} dấu hiệu GV độc thoại/HS thụ động (so với ${a} dấu hiệu tích cực).`, de_xuat: 'Chuyển các đoạn "GV giảng/HS nghe, ghi chép" thành nhiệm vụ HS tự khám phá.' }] : []; } },
  { id: 'DG-01', muc: 'vang', nhom: 'Đánh giá', nguon: 'PL IV CV 5512 ghi chú 3', cach_kiem: 'regex', mo_ta: 'Có hình thức KTĐG thường xuyên; nếu chấm điểm thì công khai tiêu chí',
    kiem: ctx => { const t = toText(ctx.nd); const co = /(h[ỏo]i\s*-?\s*[đd][áa]p|phi[ếe]u|th[ựu]c\s*h[àa]nh|th[íi]\s*nghi[ệe]m|thuy[ếe]t\s*tr[ìi]nh|s[ảa]n\s*ph[ẩa]m|[đd][áa]nh\s*gi[áa]|rubric|ti[êe]u\s*ch[íi])/i.test(t);
      const out = co ? [] : [{ vi_tri: 'hoat_dong', thong_diep: 'Chưa thấy hình thức kiểm tra, đánh giá thường xuyên.', de_xuat: 'Ghi rõ hình thức: hỏi–đáp, viết, thực hành, thí nghiệm, thuyết trình, sản phẩm học tập.' }];
      if (/(ch[ấa]m\s*[đd]i[ểe]m|cho\s*[đd]i[ểe]m|thang\s*[đd]i[ểe]m|\d+\s*[đd]i[ểe]m)/i.test(t) && !/(ti[êe]u\s*ch[íi]|rubric|[đd][áa]p\s*[áa]n)/i.test(t)) out.push({ vi_tri: 'hoat_dong', thong_diep: 'Có chấm điểm nhưng chưa công khai tiêu chí.', de_xuat: 'Thông báo tiêu chí/đáp án cho HS trước khi chấm.' });
      return out; } },
  { id: 'DG-02', muc: 'vang', nhom: 'Đánh giá', nguon: 'CV 5512 mục II.4', cach_kiem: 'cau_truc', mo_ta: 'Câu hỏi đánh giá gắn mức độ NB / TH / VD / VDC, phân bổ hợp lý',
    kiem: ctx => { const q = ctx.assessments?.cau_hoi || []; if (!q.length) return [];
      const thieu = ['NB', 'TH', 'VD'].filter(m => !q.some(c => c.muc_do === m));
      return thieu.length ? [{ vi_tri: 'assessments', thong_diep: `Bộ câu hỏi thiếu mức độ: ${thieu.join(', ')}.`, de_xuat: 'Bổ sung câu hỏi để có đủ Nhận biết – Thông hiểu – Vận dụng (VDC tùy đối tượng).' }] : []; } },
  { id: 'VD-01', muc: 'vang', nhom: 'Vận dụng', nguon: 'PL IV CV 5512 HĐ4 d)', cach_kiem: 'regex', mo_ta: 'HĐ Vận dụng giao ngoài giờ trên lớp, có yêu cầu báo cáo và thời điểm chia sẻ',
    kiem: ctx => { const h = ctx.nd.hoat_dong.find(x => x.loai === 'van_dung'); if (!h || empty(h.noi_dung + stepText(h) + h.to_chuc_text)) return [];
      const t = stepText(h) + h.san_pham + h.noi_dung;
      return /(ở\s*nh[àa]|ngo[àa]i\s*gi[ờo]|n[ộo]p|b[áa]o\s*c[áa]o|ti[ếe]t\s*sau|Padlet|Classroom)/i.test(t) ? [] : [{ vi_tri: `hoat_dong.${ctx.nd.hoat_dong.indexOf(h)}`, thong_diep: 'Hoạt động Vận dụng chưa nêu giao ngoài giờ, cách nộp báo cáo và thời điểm chia sẻ.', de_xuat: 'Ví dụ: "HS thực hiện ở nhà, nộp báo cáo trên Padlet trước tiết sau; chia sẻ đầu tiết."' }]; } },
  { id: 'NQ-01', muc: 'do', nhom: 'Nhất quán', nguon: 'Chuỗi soạn 5 bước (master prompt v1.0)', cach_kiem: 'cau_truc', mo_ta: 'Mỗi mục tiêu ↔ ≥1 hoạt động ↔ ≥1 câu/tiêu chí đánh giá; phiếu, slide trỏ đúng hoạt động',
    kiem: ctx => {
      const dong = mucTieuDong(ctx.nd), out = [];
      const hdText = ctx.nd.hoat_dong.map(h => [h.ten, h.muc_tieu, h.noi_dung, h.san_pham, stepText(h)].join(' ')).join(' ');
      dong.forEach((d, i) => { if (overlap(d, hdText) < 0.3) out.push({ vi_tri: 'muc_tieu', thong_diep: `Mục tiêu ${i + 1} chưa có hoạt động tương ứng.`, de_xuat: 'Thêm/điều chỉnh hoạt động để thực hiện mục tiêu này.' }); });
      const q = ctx.assessments?.cau_hoi || [];
      if (!q.length) out.push({ vi_tri: 'assessments', thong_diep: 'Chưa có câu hỏi/tiêu chí đánh giá (bước 4).', de_xuat: 'Sinh hoặc soạn bộ câu hỏi đánh giá gắn mục tiêu.' });
      else dong.forEach((d, i) => { if (!q.some(c => +c.muc_tieu_ref === i)) out.push({ vi_tri: 'assessments', thong_diep: `Mục tiêu ${i + 1} chưa có câu hỏi đánh giá.`, de_xuat: 'Thêm ít nhất 1 câu hỏi gắn mục tiêu này.' }); });
      const nHd = ctx.nd.hoat_dong.length;
      (ctx.worksheets || []).filter(w => !(w.hoat_dong_ref >= 0 && w.hoat_dong_ref < nHd)).forEach(w => out.push({ vi_tri: 'worksheets', thong_diep: `Phiếu "${w.tieu_de}" không trỏ tới hoạt động hợp lệ.`, de_xuat: 'Gắn phiếu với đúng hoạt động.' }));
      (ctx.slides?.trang || []).filter(s => s.hoat_dong_ref != null && !(s.hoat_dong_ref >= 0 && s.hoat_dong_ref < nHd)).forEach(s => out.push({ vi_tri: 'slides', thong_diep: `Slide "${s.tieu_de}" trỏ tới hoạt động không tồn tại.`, de_xuat: 'Gắn slide với đúng hoạt động.' }));
      return out;
    } },
  { id: 'NQ-02', muc: 'vang', nhom: 'Nhất quán', nguon: 'PL IV CV 5512 ghi chú 1', cach_kiem: 'cau_truc', mo_ta: 'Thời lượng các hoạt động cộng lại khớp số tiết',
    kiem: ctx => { const tiet = +ctx.lesson?.so_tiet || 0; if (!tiet) return [];
      const tong = ctx.nd.hoat_dong.filter(h => h.loai !== 'van_dung').reduce((s, h) => s + (+h.thoi_luong || 0), 0), chuan = tiet * (capHoc(ctx.lesson.lop) === 'TH' ? 35 : 45);
      if (!tong) return [{ vi_tri: 'hoat_dong', thong_diep: 'Chưa ghi thời lượng cho các hoạt động.', de_xuat: `Phân bổ thời lượng (tổng ≈ ${chuan} phút trên lớp).` }];
      return Math.abs(tong - chuan) > Math.max(5, chuan * 0.15) ? [{ vi_tri: 'hoat_dong', thong_diep: `Tổng thời lượng trên lớp ${tong} phút, chưa khớp ${tiet} tiết (≈ ${chuan} phút).`, de_xuat: 'Điều chỉnh thời lượng các hoạt động.' }] : []; } },
  { id: 'NLS-01', muc: 'vang', nhom: 'Năng lực số & AI', nguon: 'CV 3456/BGDĐT-GDPT + phụ lục', cach_kiem: 'doi_chieu', mo_ta: 'Mã năng lực số đúng bậc theo khối lớp; biểu hiện khớp năng lực thành phần',
    kiem: ctx => (ctx.integrations || []).filter(x => x.loai === 'NLS').flatMap(x => {
      const m = String(x.ma).match(/^([1-6]\.[1-6])\.(L[\d-]+)$/), bac = bacCuaLop(ctx.lesson?.lop);
      if (!m) return [{ vi_tri: 'integrations', thong_diep: `Mã năng lực số "${x.ma}" sai định dạng (miền.năng_lực.bậc).`, de_xuat: `Ví dụ: 1.1.${bac}` }];
      if (ctx.nls && !ctx.nls.nang_luc.some(c => c.ma === m[1])) return [{ vi_tri: 'integrations', thong_diep: `Không có năng lực thành phần ${m[1]} trong khung CV 3456.`, de_xuat: 'Chọn năng lực trong danh sách 24 năng lực thành phần.' }];
      return m[2] !== bac ? [{ vi_tri: 'integrations', thong_diep: `Mã ${x.ma} không đúng bậc của lớp ${ctx.lesson.lop} (${bac}).`, de_xuat: `Đổi thành ${m[1]}.${bac}.` }] : [];
    }) },
  { id: 'AI-01', muc: 'vang', nhom: 'Năng lực số & AI', nguon: 'QĐ 2422/QĐ-BGDĐT', cach_kiem: 'doi_chieu', mo_ta: 'Nội dung AI đúng mạch/chủ đề và lớp; có yếu tố sử dụng AI an toàn, có trách nhiệm',
    kiem: ctx => {
      const ai = (ctx.integrations || []).filter(x => x.loai === 'AI'), out = [];
      ai.forEach(x => { const m = String(x.ma).match(/^(\d{1,2})\.([A-D][1-5])\.(MR)?\d+$/);
        if (!m) out.push({ vi_tri: 'integrations', thong_diep: `Mã YCCĐ giáo dục AI "${x.ma}" sai quy ước QĐ 2422 (lớp.chủ_đề.số).`, de_xuat: 'Ví dụ: 6.A1.2' });
        else if (+m[1] !== +ctx.lesson?.lop) out.push({ vi_tri: 'integrations', thong_diep: `Mã ${x.ma} thuộc lớp ${m[1]}, không phải lớp ${ctx.lesson.lop}.`, de_xuat: 'Chọn YCCĐ giáo dục AI của đúng lớp.' });
        else if (ctx.ai && !ctx.ai.yccd.some(y => y.ma === x.ma)) out.push({ vi_tri: 'integrations', thong_diep: `Không tìm thấy mã ${x.ma} trong QĐ 2422.`, de_xuat: 'Chọn mã có trong khung.' }); });
      const dungAI = /(chatgpt|gemini|copilot|tr[íi]\s*tu[ệe]\s*nh[âa]n\s*t[ạa]o|\bAI\b)/i.test(toText(ctx.nd));
      if ((ai.length || dungAI) && !ai.some(x => /\.B[1-3]\./.test(x.ma)) && !/(an\s*to[àa]n|tr[áa]ch\s*nhi[ệe]m|ki[ểe]m\s*ch[ứu]ng|ph[ảa]n\s*bi[ệe]n|[đd][ạa]o\s*[đd][ứu]c)/i.test(toText(ctx.nd) + ai.map(x => x.mo_ta_bieu_hien).join(' ')))
        out.push({ vi_tri: 'integrations', thong_diep: 'Có dùng AI nhưng chưa có yếu tố sử dụng AI an toàn, có trách nhiệm.', de_xuat: 'Thêm yêu cầu HS kiểm chứng, phản biện kết quả AI (mạch B – QĐ 2422).' });
      return out;
    } },
  { id: 'DT-01', muc: 'vang', nhom: 'Năng lực số & AI', nguon: 'CV 5512 mục II.3', cach_kiem: 'regex', mo_ta: 'Nếu dùng điện thoại: không bắt buộc HS phải có; GV trực tiếp quản lý, cho phép',
    kiem: ctx => { const t = toText(ctx.nd); return /(đi[ệe]n\s*tho[ạa]i|smartphone)/i.test(t) && !/(kh[ôo]ng\s*b[ắa]t\s*bu[ộo]c|theo\s*nh[óo]m|m[áa]y\s*c[ủu]a\s*tr[ưu][ờo]ng|GV\s*(qu[ảa]n\s*l[ýy]|cho\s*ph[ée]p))/i.test(t)
      ? [{ vi_tri: 'hoat_dong', thong_diep: 'Có dùng điện thoại nhưng chưa nêu cách tổ chức không bắt buộc HS phải có.', de_xuat: 'Ghi rõ: dùng theo nhóm/máy của trường; GV trực tiếp quản lý, cho phép.' }] : []; } }
];

const MUC_DIEM = { do: 0, vang: 1, xanh: 2 };
export function runRules(ctx, batTat = {}) {
  const flags = [];
  for (const r of RULES) {
    if (batTat[r.id] === false) continue;
    let res = [];
    try { res = r.kiem(ctx) || []; } catch (e) { res = [{ vi_tri: '', thong_diep: `Lỗi khi chạy luật: ${e.message}`, de_xuat: '' }]; }
    for (const f of res) {
      let muc = f.muc || r.muc;
      if (muc === 'do' && nhe(ctx) && ['MT-01', 'NQ-01'].includes(r.id)) muc = 'vang';
      flags.push({ rule_id: r.id, muc, nhom: r.nhom, nguon: r.nguon, vi_tri: f.vi_tri, thong_diep: f.thong_diep, de_xuat: f.de_xuat });
    }
  }
  flags.sort((a, b) => MUC_DIEM[a.muc] - MUC_DIEM[b.muc]);
  return { flags, chi_so: chiSo(ctx, flags), chan_nop: flags.some(f => f.muc === 'do') };
}

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 100);
export function chiSo(ctx, flags) {
  const nd = ctx.nd, t = toText(nd);
  // Cấu trúc: tổng số ô bắt buộc theo khung, trừ số ô thiếu (CT-01/02/03, TH-01, TC-01)
  const tongO = laTH(ctx) ? 3 + 4 : 4 + 4 * 4 + 4 * 4;
  const thieu = flags.filter(f => ['CT-01', 'CT-02', 'CT-03', 'TH-01', 'TC-01'].includes(f.rule_id)).length;
  const cau_truc = Math.max(0, pct(tongO - thieu, tongO));
  const dong = mucTieuMon(nd);
  const bam = (ctx.yccd || []).length ? dong.filter(d => ctx.yccd.some(y => overlap(y.yccd, d) >= 0.4 || overlap(d, y.yccd) >= 0.5)).length : 0;
  const a = (t.match(RX_TICH_CUC) || []).length, p = (t.match(RX_THU_DONG) || []).length;
  const tich_cuc = Math.min(96, Math.max(5, Math.round(t.trim().length < 50 ? 10 : 20 + (72 * a) / (a + p + 1) + (/\d+\s*ph[úu]t/i.test(t) ? 4 : 0))));
  const nq = flags.filter(f => f.rule_id === 'NQ-01').length, tatCa = mucTieuDong(nd);
  const vangTC = flags.filter(f => f.muc === 'vang' && /^(CT|TC|TH|DG|VD)/.test(f.rule_id)).length;
  return {
    cau_truc,
    bam_yccd: dong.length ? pct(bam, dong.length) : 0,
    tich_cuc,
    nhat_quan: Math.max(0, pct(Math.max(0, tatCa.length + 1 - nq), tatCa.length + 1)),
    tuan_thu_5512: Math.max(0, Math.min(100, cau_truc - 3 * vangTC)) // chỉ số quen thuộc của EduPlan cũ
  };
}

/** 4 bước theo cách hiển thị quen thuộc của EduPlan cũ (Đạt / Cần điều chỉnh). */
export function bangKiem4Buoc(flags) {
  const map = { giao: ['TC-02'], thuc_hien: ['TC-03', 'TC-07'], bao_cao: ['TC-04'], ket_luan: ['TC-05'] };
  return BUOC.map(b => {
    const f = flags.filter(x => map[b.key].includes(x.rule_id) || (x.rule_id === 'TC-01' && x.vi_tri.endsWith(b.key)));
    return { buoc: b.ten, trang_thai: f.length ? 'Cần điều chỉnh' : 'Đạt', phan_tich: f.length ? f.map(x => x.thong_diep).join(' ') : 'Đạt yêu cầu theo ghi chú 4 Phụ lục IV.' };
  });
}
