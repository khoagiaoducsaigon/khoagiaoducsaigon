# Khảo sát EduPlan hiện tại (mục 2B · Bước 1 — chỉ đọc)

> **Nguồn khảo sát:** mã nguồn `eduplan-5512/index.html` (commit 8f8091e, 9d64f1c) trên nhánh `claude/upbeat-bardeen-f4nise`.
> **Chưa xác minh trên VPS:** phiên khảo sát chạy trên cloud, không SSH được tới 72.62.72.204, proxy chặn truy cập eduplan.thaykhoa-ai.tech.
> Cần đối chiếu: file `/opt/eduscience/portal/eduplan/index.html` trên VPS có trùng mã nguồn này không (so `sha256sum`). Nếu khác, khảo sát lại từ bản trên VPS.

## 1. Kiến trúc
| Hạng mục | Hiện trạng |
|---|---|
| Dạng ứng dụng | **1 file HTML tĩnh**, không có backend, không có API riêng |
| Phục vụ | Caddy `file_server`, root `/srv/portal/eduplan` (theo `deploy/deploy-vps.sh`) |
| Thư viện ngoài | Tailwind CDN, Lucide (unpkg), Google Fonts |
| Gọi máy chủ ngoài | Chỉ khi người dùng nhập Gemini API Key: `generativelanguage.googleapis.com` (gửi nội dung KHBD) |
| Route | **Một trang duy nhất** `/`. Không có hash route, không có đường dẫn sâu tới KHBD |

## 2. Nơi lưu dữ liệu — điểm quyết định cho việc di trú
- **Toàn bộ dữ liệu nằm trên trình duyệt của từng người dùng**: IndexedDB `EduPlan5512DB` (version 1) + bản sao trong localStorage `eduplan5512.tbl.<bảng>`.
- **Máy chủ không có bản ghi nào** ⇒ không di trú phía máy chủ được ⇒ áp dụng nhánh "tự phát hiện kho cũ" ở cuối mục 2B.
- Kho gắn với **origin** `https://eduplan.thaykhoa-ai.tech`. Bản mới **phải chạy đúng origin này** mới đọc được kho cũ. Bản đặt ở `eduplan-old.*` hay `khbd.*` sẽ không thấy dữ liệu.
- Mỗi trình duyệt có **một CSDL riêng, không đồng bộ**. Hai giáo viên dùng hai máy là hai CSDL khác nhau; tổ trưởng không thấy bài của giáo viên trên máy khác. Đây là giới hạn lớn nhất của bản hiện tại.
- Mỗi trình duyệt **tự nạp dữ liệu mẫu** khi mở lần đầu (6 user, 3 KHBD, 5 audit, 5 phiếu, 15 log, id cố định). Khi di trú phải **tách dữ liệu mẫu khỏi dữ liệu thật**.
- Khóa phụ trong localStorage:
  - `eduplan5512.settings`: apiKey **(Gemini key dạng rõ — không được di trú lên máy chủ)**, model, school, department, city
  - `eduplan5512.session`: id người dùng đang đăng nhập

## 3. Schema (object store, keyPath `id`)
| Bảng | Trường |
|---|---|
| `users` | id, name, email, code, role, dept, grades, title, password, status (active/pending/locked), canApprove, createdAt |
| `lesson_plans` | id, title, subject, grade, book, term, dept, schoolYear, teacherId, teacherName, content, status, createdAt, updatedAt, submittedAt, ttSignedBy, ttSignedAt, bghSignedBy, bghSignedAt, onTime, sampleKey?, versions[] {v, at, by, note, content, score} |
| `ai_audits` | id, planId, version, at, by, engine, compliance, activeness, summary, steps[4] {step, status, analysis}, strengths[], weaknesses[], solutions[], suggestions[] {activity, original, revised, rationale} |
| `review_notes` | id, planId, version, reviewerId, reviewerName, reviewerTitle?, level (Tổ chuyên môn / Ban Giám hiệu), verdict (Đạt / Chưa đạt), at, strengths, weaknesses, solutions (text), stepNotes[4], general, compliance?, activeness? |
| `audit_logs` | id, at, userId, userName, role, action, target, detail |

Lưu ý: `review_notes.planId`, `ai_audits.planId` → `lesson_plans.id`; `lesson_plans.teacherId` → `users.id`. Người ký duyệt được lưu **bằng tên**, không có id.

## 4. Vai trò và trạng thái
- **Vai trò:** `admin` (BGH), `leader` (Tổ trưởng chuyên môn), `teacher` (Giáo viên bộ môn).
- **Trạng thái KHBD:** `draft` (Bản nháp) → `pending` (Chờ duyệt) → `revise` (Yêu cầu chỉnh sửa) | `approved` (Đã duyệt đạt chuẩn).
- **Duyệt 2 cấp:** khi Tổ trưởng chấm Đạt, trạng thái vẫn là `pending` nhưng có thêm `ttSignedBy`. Khi BGH chấm Đạt → `approved`. Bất kỳ cấp nào chấm Chưa đạt → `revise`.
- **Tên nút quen tay cần giữ:** "Chạy AI rà soát chuẩn 5512", "Lưu vào Cơ sở dữ liệu trường", "Gửi Tổ trưởng duyệt", "Lưu phiếu & ký duyệt cấp tổ", "Lưu phiếu & phê duyệt BGH", "Sao chép nhanh (Zalo/Email)", "In phiếu A4".

## 5. Mật khẩu
`sha256:` + SHA-256 hex của chuỗi `"eduplan5512::" + mật_khẩu`, dùng **muối cố định chung** cho mọi tài khoản. Trường hợp dự phòng là `djb2:`, rất yếu.
⇒ Không đủ an toàn để đưa lên máy chủ. Đề xuất: khi người dùng đăng nhập lần đầu trên bản mới, hệ thống kiểm tra bằng thuật toán cũ, rồi băm lại bằng thuật toán mạnh (argon2id hoặc bcrypt). Tài khoản `djb2:` gắn cờ "bắt đổi mật khẩu lần sau". Không reset hàng loạt.

## 6. Luật rà soát hiện có (ứng viên đưa vào `rules.js`, nguon = "eduplan v1")
- **Regex cấu trúc:** I. Mục tiêu; Thiết bị dạy học/học liệu; Tiến trình; năng lực; phẩm chất.
- **Đủ 4 hoạt động:** Mở đầu/Khởi động · Hình thành kiến thức · Luyện tập · Vận dụng.
- **Đủ 4 thành phần mỗi hoạt động:** a) Mục tiêu · b) Nội dung · c) Sản phẩm · d) Tổ chức thực hiện (đếm theo dòng).
- **4 bước tổ chức:** Chuyển giao · Thực hiện · Báo cáo/thảo luận · Kết luận/nhận định/chuẩn hóa.
- **Từ điển tích cực** (~30 mẫu: nhóm, thảo luận, phiếu học tập, mảnh ghép, khăn trải bàn, trạm, Padlet…) và **từ điển thụ động** (GV giảng, thuyết trình, HS nghe, ghi chép, đọc SGK, GV gọi 1…).
- **Công thức điểm:**
  - Tuân thủ = cấu trúc 30 + hoạt động 20 + thành phần 25 + bước 25, trừ 25 nếu bài dưới 300 ký tự.
  - Tích cực = 20 + 72·tc/(tc+td+1) + 4 điểm nếu có thời lượng; tc là số dấu hiệu tích cực, td là số dấu hiệu thụ động.
- **Prompt Gemini:** vai trò chuyên gia Sở, đối soát Phụ lục IV, trả JSON (compliance, activeness, steps, strengths, weaknesses, solutions, suggestions).
- **Hạn chế đã biết:** regex đếm từ khóa nên dễ bị "lừa" bằng cách chèn từ khóa; chưa có luật Phụ lục V, năng lực số, CV 2345/3456.

## 7. Số bản ghi thật
**Không đo được từ máy chủ** vì dữ liệu nằm rải trên từng trình duyệt. Cách đo: trong bản mới, màn hình "Chuyển dữ liệu" đếm theo từng bảng ngay trên máy người dùng và ghi vào `migration_logs`. Có thể đo sớm hơn bằng cách nhờ các tổ trưởng dùng nút "Sao lưu Database (JSON)" có sẵn rồi gửi tệp về (đưa vào `data/raw/private/eduplan-backup/`).

## 8. Hệ quả cho kế hoạch v1.1
1. Di trú = **mô-đun JS chạy trong trình duyệt**, cùng origin. Việc này thay cho Bước 4 phía máy chủ. `migrate_eduplan.py` vẫn có ích để xử lý **tệp JSON sao lưu** mà Admin xuất ra.
2. Triển khai xanh–lục: bản mới thay file tại **cùng** `eduplan.thaykhoa-ai.tech`. `eduplan-old` chỉ giữ để quay lui giao diện, **không chứa dữ liệu**, vì khác origin.
3. Nên có giai đoạn 2 (API + CSDL máy chủ). Không có nó thì "duyệt 2 cấp" chỉ chạy khi giáo viên, tổ trưởng và BGH dùng chung một trình duyệt.
