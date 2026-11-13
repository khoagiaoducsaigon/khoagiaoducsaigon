// Gemini (API key người dùng tự nhập, lưu localStorage). Không có key → Mock AI (gen.js).
// Prompt có số phiên bản (mục 5 v1.0); đầu ra luôn JSON; lỗi parse → hỏi lại 1 lần, vẫn lỗi → dùng Mock và báo người dùng.
// AI chỉ ĐỀ XUẤT — nội dung AI sinh được đánh dấu cho đến khi GV chấp nhận. Không đưa họ tên/email vào prompt.
import { soanTronBo } from './gen.js';
import { khungTrong, toText } from './khung.js';

export const PROMPT_VERSION = { soan_tron_bo: 'soan_tron_bo@1.0', ra_soat: 'ra_soat@1.0' };
const KEY = 'eduplan-khbd.ai';
export const caiDatAI = () => { try { return { model: 'gemini-2.5-flash', apiKey: '', ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return { model: 'gemini-2.5-flash', apiKey: '' }; } };
export const luuCaiDatAI = v => localStorage.setItem(KEY, JSON.stringify(v));
export const cheDoAI = () => (caiDatAI().apiKey ? 'gemini' : 'mock');

async function goiGemini(prompt) {
  const { apiKey, model } = caiDatAI();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, responseMimeType: 'application/json' } })
  });
  if (!r.ok) { let m = String(r.status); try { m = (await r.json()).error?.message || m; } catch { /* */ } throw new Error(m); }
  const d = await r.json();
  return JSON.parse((d.candidates?.[0]?.content?.parts || []).map(p => p.text).join('').replace(/^```(json)?|```$/g, '').trim());
}
async function goiJSON(prompt, kiem) {
  let loi;
  for (let lan = 0; lan < 2; lan++) {
    try { const j = await goiGemini(lan ? prompt + '\n\nLƯU Ý: lần trước trả sai định dạng. CHỈ trả JSON hợp lệ đúng cấu trúc.' : prompt); kiem(j); return j; }
    catch (e) { loi = e; }
  }
  throw loi;
}

const promptSoan = (meta, yccd) => `[${PROMPT_VERSION.soan_tron_bo}] Bạn là chuyên gia soạn kế hoạch bài dạy theo CT GDPT 2018.
Soạn TRỌN BỘ cho bài "${meta.ten_bai}" — môn ${meta.mon}, lớp ${meta.lop}, bộ sách ${meta.bo_sach || '(không rõ)'}, ${meta.so_tiet} tiết.
Khung: ${+meta.lop <= 5 ? 'Phụ lục 3 CV 2345 (tiểu học)' : 'Phụ lục IV CV 5512'}. Mục tiêu PHẢI bám sát câu chữ các YCCĐ sau (không bịa YCCĐ khác):
${yccd.map((y, i) => `${i + 1}. ${y.yccd}`).join('\n')}
Yêu cầu: 4 hoạt động (Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng); mỗi hoạt động có mục tiêu, nội dung, sản phẩm và 4 bước (giao nhiệm vụ nêu rõ học liệu, hình thức, thời gian; thực hiện có dự kiến khó khăn + hỗ trợ; báo cáo nêu cách chọn nhóm; kết luận phân tích sản phẩm). Không ghi lời thoại GV/HS. Vận dụng giao ngoài giờ, có cách nộp.
Chỉ trả JSON:
{"muc_tieu":{"kien_thuc":"- ...","nang_luc":"- ...","pham_chat":"..."},"thiet_bi":"...","yeu_cau_can_dat":"(chỉ tiểu học)","do_dung":"(chỉ tiểu học)",
"hoat_dong":[{"ten":"tên thể hiện kết quả","thoi_luong":10,"muc_tieu":"","noi_dung":"","san_pham":"","to_chuc":{"giao":"","thuc_hien":"","bao_cao":"","ket_luan":""}}],
"phieu":[{"hoat_dong_ref":1,"tieu_de":"","nhiem_vu":[""],"san_pham":"","thang_tieu_chi":[""]}],
"cau_hoi":[{"noi_dung":"","muc_do":"NB|TH|VD|VDC","muc_tieu_ref":0,"dap_an":""}]}
(muc_tieu_ref là số thứ tự dòng mục tiêu, tính từ 0, theo thứ tự các dòng "- " trong kien_thuc rồi nang_luc.)`;

/** Soạn trọn bộ: Gemini nếu có key, ngược lại Mock. → { bo, engine, canh_bao } */
export async function soanTronBoAI(meta, yccd, nls, ai) {
  const mock = soanTronBo(meta, yccd, nls, ai);
  if (cheDoAI() !== 'gemini') return { bo: mock, engine: 'Mock AI Sư phạm', canh_bao: '' };
  try {
    const j = await goiJSON(promptSoan(meta, yccd), x => { if (!Array.isArray(x.hoat_dong) || x.hoat_dong.length < 4) throw new Error('thiếu hoạt động'); });
    const nd = khungTrong(+meta.lop <= 5 ? 'PL3-2345' : 'PL4-5512');
    if (nd.khung === 'PL4-5512') { Object.assign(nd.muc_tieu, j.muc_tieu || {}); nd.thiet_bi = j.thiet_bi || ''; }
    else { nd.yeu_cau_can_dat = j.yeu_cau_can_dat || j.muc_tieu?.kien_thuc || ''; nd.do_dung = j.do_dung || j.thiet_bi || ''; }
    nd.hoat_dong = nd.hoat_dong.map((h, i) => { const g = j.hoat_dong[i] || {}; const tc = { giao: '', thuc_hien: '', bao_cao: '', ket_luan: '', ...(g.to_chuc || {}) };
      return { ...h, ten: g.ten || h.ten, thoi_luong: +g.thoi_luong || 0, muc_tieu: g.muc_tieu || '', noi_dung: g.noi_dung || '', san_pham: g.san_pham || '', to_chuc: tc,
        to_chuc_text: nd.khung === 'PL3-2345' ? Object.values(tc).filter(Boolean).join('\n') : '' }; });
    const bo = { nd, worksheets: Array.isArray(j.phieu) && j.phieu.length ? j.phieu : mock.worksheets, slides: mock.slides,
      assessments: Array.isArray(j.cau_hoi) && j.cau_hoi.length ? { cau_hoi: j.cau_hoi, rubric: mock.assessments.rubric } : mock.assessments, integrations: mock.integrations };
    return { bo, engine: `Google ${caiDatAI().model} (${PROMPT_VERSION.soan_tron_bo})`, canh_bao: '' };
  } catch (e) {
    return { bo: mock, engine: 'Mock AI Sư phạm (dự phòng)', canh_bao: `Gemini lỗi: ${e.message}. Đã dùng Mock AI.` };
  }
}

/** Rà soát bổ sung bằng LLM cho các luật kiểu 'llm' — chỉ thêm cờ vàng/xanh, không bao giờ hạ cờ đỏ. */
export async function raSoatLLM(nd, meta) {
  if (cheDoAI() !== 'gemini') return [];
  const prompt = `[${PROMPT_VERSION.ra_soat}] Rà soát KHBD theo Phụ lục IV CV 5512. Chỉ nêu tối đa 5 góp ý quan trọng nhất về: mục tiêu đo được, lệnh giao nhiệm vụ, hỗ trợ HS, cách tổ chức báo cáo, kết luận.
Mỗi góp ý trích vị trí. Trả JSON: {"co":[{"vi_tri":"hoat_dong.1.to_chuc.giao","thong_diep":"","de_xuat":""}]}
KHBD:\n"""\n${toText(nd, meta).slice(0, 12000)}\n"""`;
  try {
    const j = await goiJSON(prompt, x => { if (!Array.isArray(x.co)) throw new Error('sai cấu trúc'); });
    return j.co.slice(0, 5).map(c => ({ rule_id: 'LLM', muc: 'vang', nhom: 'Góp ý AI', nguon: `Gemini (${PROMPT_VERSION.ra_soat}) theo PL IV`, vi_tri: String(c.vi_tri || ''), thong_diep: String(c.thong_diep || ''), de_xuat: String(c.de_xuat || '') }));
  } catch { return []; }
}

export async function kiemTraKetNoi(apiKey, model) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify({ contents: [{ parts: [{ text: 'Trả lời: OK' }] }] }) });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error?.message || r.status);
  return true;
}
