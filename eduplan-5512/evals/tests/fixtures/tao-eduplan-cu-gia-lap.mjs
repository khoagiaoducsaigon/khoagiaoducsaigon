// Tạo bộ "EduPlan cũ giả lập" (mục 8 v1.1) từ CHÍNH mã nguồn bản cũ (eduplan-5512/index.html):
// dữ liệu mẫu do buildSeed() của bản cũ sinh ra + các bản ghi "thật" mô phỏng trường đã dùng app.
// Chạy: node evals/tests/fixtures/tao-eduplan-cu-gia-lap.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const src = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
const pick = (a, b) => src.slice(src.indexOf(a), src.indexOf(b));
const code = [
  "const nowISO = () => new Date().toISOString();",
  pick('async function hashPw(pw)', '/* ---------------------------- 2. DANH MỤC'),
  "const SCHOOL_YEAR = '2026 – 2027';",
  pick('const T8_O1', '/* ------------------------- 4. DATABASE LAYER'),
  pick('async function buildSeed()', '/* -------------------------- 5. TRẠNG THÁI APP'),
  'return { buildSeed, hashPw };'
].join('\n');
const { buildSeed, hashPw } = new Function('window', code)({ crypto: globalThis.crypto });

export async function taoGiaLap() {
  const db = await buildSeed();
  const pw = await hashPw('matkhau1');
  const d = s => new Date(s).toISOString();
  // Bản ghi "thật"
  db.users.push(
    { id: 'u_real1', name: 'Trần Văn Hòa', email: 'hoa.tv@truong.edu.vn', code: 'GV-T22', role: 'teacher', dept: 'Toán', grades: '9', title: 'Giáo viên Toán', password: pw, status: 'active', canApprove: false, createdAt: d('2026-11-02T08:00:00'), soDienThoai: '0900000000' },
    { id: 'u_real2', name: 'Lý Thị Ngọc', email: 'ngoc.lt@truong.edu.vn', code: 'GV-V09', role: 'teacher', dept: 'Ngữ văn', grades: '11', title: 'Giáo viên Ngữ văn', password: 'djb2:1a2b3c4d', status: 'active', canApprove: false, createdAt: d('2026-11-03T08:00:00') }
  );
  const content = 'KẾ HOẠCH BÀI DẠY\nThời lượng: 1 tiết\nI. MỤC TIÊU\n1. Về kiến thức: Giải được phương trình bậc nhất một ẩn.\nII. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU\n- Phiếu học tập\nIII. TIẾN TRÌNH DẠY HỌC\nHoạt động 1: Mở đầu (5 phút)\na) Mục tiêu: Gợi vấn đề.\nb) Nội dung: Bài toán cân thăng bằng.\nc) Sản phẩm: Câu trả lời.\nd) Tổ chức thực hiện:\n- Bước 1. Chuyển giao nhiệm vụ: GV chiếu hình cân.\n- Bước 2. Thực hiện nhiệm vụ: HS thảo luận nhóm đôi.\n- Bước 3. Báo cáo, thảo luận: 2 nhóm trình bày.\n- Bước 4. Kết luận, nhận định: GV chốt.';
  db.lesson_plans.push(
    { id: 'lp_real1', title: 'Phương trình bậc nhất một ẩn', subject: 'Toán', grade: '8', book: 'Kết nối tri thức', term: 'Học kỳ II', dept: 'Toán', schoolYear: '2026 – 2027',
      teacherId: 'u_real1', teacherName: 'Trần Văn Hòa', content, status: 'pending', createdAt: d('2026-11-05T19:00:00'), updatedAt: d('2026-11-06T19:00:00'), submittedAt: d('2026-11-06T19:00:00'),
      ttSignedBy: 'ThS. Lê Văn Hùng', ttSignedAt: d('2026-11-07T10:00:00'), bghSignedBy: null, bghSignedAt: null, onTime: true, ghiChuRieng: 'trường lạ cần vào legacy',
      versions: [{ v: 1, at: d('2026-11-05T19:00:00'), by: 'Trần Văn Hòa', note: 'Tạo mới', content, score: 70 }, { v: 2, at: d('2026-11-06T19:00:00'), by: 'Trần Văn Hòa', note: 'Sửa', content, score: 74 }] },
    { id: 'lp_real2', title: 'Bản nháp chưa nộp', subject: 'Ngữ văn', grade: '11', book: 'Cánh diều', term: 'Học kỳ I', dept: 'Ngữ văn', schoolYear: '2026 – 2027',
      teacherId: 'u_real2', teacherName: 'Lý Thị Ngọc', content: 'Nội dung nháp', status: 'draft', createdAt: d('2026-11-08T19:00:00'), updatedAt: d('2026-11-08T19:00:00'), submittedAt: null,
      ttSignedBy: null, ttSignedAt: null, bghSignedBy: null, bghSignedAt: null, onTime: true, versions: [{ v: 1, at: d('2026-11-08T19:00:00'), by: 'Lý Thị Ngọc', note: 'Tạo mới', content: 'Nội dung nháp', score: null }] }
  );
  db.ai_audits.push({ id: 'a_real1', planId: 'lp_real1', version: 2, at: d('2026-11-06T19:05:00'), by: 'Trần Văn Hòa', engine: 'Mock AI Sư phạm', compliance: 74, activeness: 60,
    summary: 'x', steps: [{ step: 1, status: 'Đạt', analysis: 'ok' }, { step: 2, status: 'Cần điều chỉnh', analysis: 'HS còn thụ động' }, { step: 3, status: 'Đạt', analysis: 'ok' }, { step: 4, status: 'Đạt', analysis: 'ok' }],
    strengths: [], weaknesses: [], solutions: [], suggestions: [{ activity: 'HĐ1', original: 'a', revised: 'b', rationale: 'c' }] });
  // Phiếu duyệt THẬT trên KHBD MẪU lp2 (trường đã dùng bài mẫu thật) → lp2 phải được giữ
  db.review_notes.push({ id: 'r_real1', planId: 'lp2', version: 2, reviewerId: 'u1', reviewerName: 'TS. Nguyễn Minh Quang', level: 'Ban Giám hiệu', verdict: 'Chưa đạt', at: d('2026-11-09T09:00:00'),
    strengths: 'Học liệu tốt', weaknesses: 'HĐ 2.1 thụ động', solutions: 'Theo đề xuất AI', stepNotes: ['', '', '', ''], general: 'Đề nghị sửa', compliance: 78, activeness: 65 });
  db.audit_logs.push({ id: 'log_real1', at: d('2026-11-06T19:00:00'), userId: 'u_real1', userName: 'Trần Văn Hòa', role: 'teacher', action: 'Nộp bài', target: 'Phương trình bậc nhất một ẩn', detail: 'v2' },
    { id: 'log_real2', at: d('2026-11-09T09:00:00'), userId: 'u1', userName: 'TS. Nguyễn Minh Quang', role: 'admin', action: 'Yêu cầu chỉnh sửa', target: 'Hình chóp tam giác đều và diện tích xung quanh', detail: 'BGH: Chưa đạt' });
  return db;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = await taoGiaLap();
  writeFileSync(new URL('./eduplan-cu-gia-lap.json', import.meta.url), JSON.stringify({ app: 'EduPlan 5512 CoPilot', schema: 1, tables: db }, null, 1));
  console.log(Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length])));
}
