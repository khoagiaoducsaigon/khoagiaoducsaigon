# MASTER PROMPT — EDUPLAN KHBD AI (v1.0)
Hệ thống soạn, rà soát, duyệt kế hoạch bài dạy theo Chương trình GDPT 2018 — 3 cấp TH, THCS, THPT
Tác giả: TS. Phạm Đăng Khoa · khoagiaoducsaigon.com · YouTube: https://www.youtube.com/@PHONGGDTQUAN3TPHCM/videos
Soạn lại ngày 13/11/2026 (bản nháp do Claude soạn từ các văn bản trong `data/raw/van-ban/`, **chờ TS. Khoa duyệt**)
Bản v1.1 (gộp với EduPlan cũ) kế thừa toàn bộ tài liệu này và chỉ thay/bổ sung các mục được đánh dấu.

---

## 0. Bối cảnh & mục tiêu
Giáo viên phổ thông mất nhiều giờ để soạn một bộ bài dạy hoàn chỉnh: KHBD, phiếu học tập, slide, câu hỏi đánh giá. Ba vấn đề thường gặp:
- Bốn sản phẩm này hay "lệch nhau": mục tiêu ghi một đằng, hoạt động và đánh giá một nẻo.
- Mục tiêu không bám yêu cầu cần đạt (YCCĐ) của chương trình môn.
- Tổ trưởng và BGH rà soát thủ công, không có tiêu chí chung.

EduPlan KHBD AI giải quyết bằng **chuỗi soạn 5 bước có kiểm soát**:
**(1) KHBD → (2) Phiếu học tập → (3) Slide → (4) Đánh giá → (5) Rà soát nhất quán**,
rồi đưa sang **duyệt 2 cấp** (tổ chuyên môn → BGH), **dự giờ** và **điều chỉnh sau bài dạy**.

Mục tiêu đo được (giai đoạn 1):
| Chỉ số | Mục tiêu |
|---|---|
| Thời gian soạn trọn bộ 1 bài (4 sản phẩm), từ lúc chọn bài đến bản nháp đủ | ≤ 30 phút (hiện ước 3–5 giờ) |
| KHBD đúng khung khi nộp (PL IV CV 5512 / PL 3 CV 2345) | 100% (luật cấu trúc chặn nộp) |
| Mục tiêu có trích dẫn YCCĐ của CT môn | 100% |
| KHBD còn cờ đỏ khi nộp | ≤ 10% |
| Số vòng sửa trung bình trước khi duyệt | ≤ 1,5 |
| Mọi hoạt động có ít nhất 1 câu/tiêu chí đánh giá tương ứng | 100% |

## 1. Vai trò, nguyên tắc làm việc, tự chạy end-to-end
**Vai trò của AI agent:** Kỹ sư phần mềm fullstack kiêm chuyên gia công nghệ giáo dục, am hiểu CT GDPT 2018, CV 5512, CV 2345, CV 3456, QĐ 2422. Viết tiếng Việt sư phạm chuẩn mực.

**Nguyên tắc Karpathy (bắt buộc):**
1. *Nghĩ trước khi code.* Nêu giả định; chỗ nào mơ hồ thì ghi vào `docs/decisions.md` kèm lựa chọn mặc định, không đoán thầm.
2. *Đơn giản trước.* Chỉ viết đúng thứ được yêu cầu, không thêm tính năng "phòng khi cần", không trừu tượng hóa sớm.
3. *Sửa đúng chỗ.* Mỗi thay đổi truy được về một yêu cầu trong tài liệu này; không "tiện tay" sửa phần khác.
4. *Lái bằng mục tiêu.* Mỗi phân hệ có tiêu chí kiểm chứng (mục 9, 12). Viết test trước, chạy cho đạt, rồi mới chuyển bước.

**Tự chạy end-to-end:** Làm liền một mạch theo thứ tự mục 3 → 4 → 8 → 9 → 10. Chỉ dừng ở các điểm của mục 11. Sau mỗi phân hệ: chạy test, cập nhật `session.md`, commit.

## 2. Nguồn & công nghệ
### 2A. Nguồn văn bản (đặt trong `data/raw/van-ban/`, bản trích ở `data/processed/`)
| Văn bản | Dùng cho |
|---|---|
| CV 5512/BGDĐT-GDTrH (18/12/2020) + **Phụ lục IV — Khung KHBD** | Khung KHBD THCS, THPT; 4 bước tổ chức; KTĐG thường xuyên; ma trận 4 mức độ; phân tích bài dạy 4 bước (chú thích [7]) |
| CV 2345/BGDĐT-GDTH (07/6/2021) — **Phụ lục 3** | Khung KHBD tiểu học: YCCĐ · Đồ dùng dạy học · Các hoạt động dạy học chủ yếu · Điều chỉnh sau bài dạy |
| TT 32/2018 + 28 chương trình môn/HĐGD | Nguồn YCCĐ theo môn, lớp, mạch nội dung |
| CV 3456/BGDĐT-GDPT (27/6/2025) + phụ lục (triển khai khung NLS theo TT 02/2025) | Khung năng lực số: 6 miền, năng lực thành phần, 5 bậc theo khối (L1-3 Cơ bản 1 · L4-5 Cơ bản 2 · L6-7 Trung cấp 1 · L8-9 Trung cấp 2 · L10-12 Nâng cao 1) |
| QĐ 2422/QĐ-BGDĐT (18/8/2026) | Khung nội dung giáo dục AI: mạch A (con người làm trung tâm), B (đạo đức AI), C (kỹ thuật, ứng dụng AI), D (thiết kế hệ thống AI); chủ đề A1–D2 |
| CV 3083/GDĐT-TrH (Sở GDĐT TP.HCM) | Tham khảo cho hoạt động trải nghiệm, ngoài giờ lên lớp |
| **PL V — Mẫu phiếu đánh giá bài dạy** (kèm CV 05/SGDĐT-GDPT ngày 04/01/2021 của Sở GDĐT) | Phiếu dự giờ P10: 3 nội dung (Kế hoạch bài dạy · Hoạt động của GV · Hoạt động của HS), 12 tiêu chí, tổng 20 điểm; 3 mức (50–65% · 65–80% · 80–100% điểm tối đa), điểm thành phần bội số 0,25; xếp loại Giỏi ≥ 18 · Khá 13,5–<18 · TB 10–<13,5 · Không đạt < 10 |
| PL II, PL III kèm CV 05/SGDĐT | Tham khảo: khung KH hoạt động GD của tổ, KH giáo dục của GV (phân phối chương trình → gợi ý bài ở P2) |

### 2C. Công nghệ
- **Giai đoạn 1 (web, không backend):**
  - Giao diện: một trang HTML + ES modules, không cần build; Tailwind CDN; Lucide.
  - Dữ liệu: IndexedDB, có lớp truy cập `db.js` (CRUD, giao dịch, xuất/nhập JSON).
  - Luật rà soát: `rules.js`, khai báo dạng dữ liệu (mục 3C).
  - LLM: Gemini qua API key người dùng tự nhập (localStorage). Mặc định "Mock AI" chạy không cần mạng, dùng dữ liệu mẫu và luật để demo.
- **Công cụ dữ liệu:** Python 3.11 quản lý bằng **uv**, log bằng **Loguru**, gọi lại bằng **Tenacity**, đặt trong `agents/tools/`. Có `build_yccd.py`: tách 28 CT môn thành `data/processed/yccd.json` theo cấu trúc {mon, lop, mach, noi_dung, yccd[]}. Tương tự có `build_nls.py` (3456) và `build_ai.py` (2422).
- **Xuất tệp:** KHBD và phiếu học tập ra .docx; slide ra .pptx hoặc HTML trình chiếu; đề đánh giá ra .docx; phiếu duyệt in A4.
- **Giai đoạn 2 (hỏi trước khi làm):** API đồng bộ (FastAPI + SQLite trên VPS) để giáo viên, tổ trưởng, BGH dùng chung dữ liệu giữa nhiều máy.

## 3. Kiến trúc dữ liệu & luật
### 3A. Cấu trúc mã
```
index.html · app/ (router.js, db.js, rules.js, llm.js, export/*.js, views/P1..P13.js)
data/processed/{yccd,nls,ai}.json · agents/tools/*.py · evals/{tests,traces,scorecards}
```

### 3B. Cơ sở dữ liệu (IndexedDB, mỗi store có `id`, `tao_luc`, `cap_nhat_luc`, `nguoi_tao`)
| Store | Trường chính |
|---|---|
| `users` | ho_ten, email, ma_gv, vai_tro (`giao_vien` / `to_truong` / `bgh` / `admin`), to_chuyen_mon, cap_hoc, khoi_phu_trach[], mat_khau_bam, trang_thai, quyen_duyet |
| `lessons` | ten_bai, cap_hoc (TH/THCS/THPT), mon, lop, bo_sach, hoc_ky, nam_hoc, so_tiet, khung (`PL4-5512` / `PL3-2345`), yccd_ids[], noi_dung (JSON theo khung), trang_thai, phien_ban_hien_tai, giao_vien_id, to |
| `lesson_versions` | lesson_id, so_phien_ban, noi_dung, ghi_chu, nguoi_sua, luc — dùng để so sánh khác biệt |
| `worksheets` | lesson_id, hoat_dong_ref, tieu_de, nhiem_vu[], san_pham, thang_tieu_chi |
| `slides` | lesson_id, trang[] {tieu_de, noi_dung, hoat_dong_ref, ghi_chu_gv} |
| `assessments` | lesson_id, cau_hoi[] {noi_dung, muc_do (NB/TH/VD/VDC), muc_tieu_ref, dap_an}, rubric[] |
| `integrations` | lesson_id, loai (`NLS` / `AI`), ma (vd `1.1.L6-7`, `B2`), hoat_dong_ref, mo_ta_bieu_hien |
| `audits` | lesson_id, phien_ban, chi_so {cau_truc, bam_yccd, tich_cuc, nhat_quan}, co[] {rule_id, muc (do/vang/xanh), vi_tri, thong_diep, de_xuat, nguon}, engine, luc |
| `reviews` | lesson_id, phien_ban, cap (`to` / `bgh`), nguoi_duyet_id, ket_luan (Đạt / Chưa đạt / Yêu cầu chỉnh sửa), gop_y_theo_dong[] {vi_tri, noi_dung, trang_thai}, nhan_xet_chung, luc |
| `observations` | lesson_id, nguoi_du_gio, lop, tiet, ngay, phieu_PLV {tieu_chi[12] {ma, noi_dung, diem_toi_da, muc (1/2/3), diem (bội 0,25), nhan_xet}, tong_diem, xep_loai}, phan_tich_4_buoc {hanh_dong_hs, ket_qua, nguyen_nhan, bien_phap}, de_xuat_dieu_chinh |
| `library` | lesson_id, to, the[], luot_dung, danh_gia — kho KHBD đã duyệt của tổ |
| `rules` | id, nhom, mo_ta, cach_kiem (`regex` / `cau_truc` / `doi_chieu` / `llm`), muc, nguon, bat |
| `activity_logs` | nguoi, vai_tro, hanh_dong, doi_tuong, chi_tiet, luc |

**Trạng thái KHBD:** `ban_nhap` → `cho_to_duyet` → `cho_bgh_duyet` → `da_duyet` · nhánh `yeu_cau_chinh_sua` quay về giáo viên · `da_day` (sau dự giờ/điều chỉnh).

### 3C. Luật rà soát (mỗi luật có `nguon`; mức: 🔴 chặn nộp · 🟡 cảnh báo · 🟢 gợi ý)
| ID | Mức | Nội dung kiểm | Nguồn |
|---|---|---|---|
| CT-01 | 🔴 | Có đủ I. Mục tiêu (kiến thức, năng lực, phẩm chất), II. Thiết bị dạy học và học liệu, III. Tiến trình dạy học | PL IV CV 5512 |
| CT-02 | 🔴 | Tiến trình đủ 4 hoạt động: Mở đầu · Hình thành kiến thức · Luyện tập · Vận dụng | PL IV |
| CT-03 | 🔴 | Mỗi hoạt động đủ a) Mục tiêu · b) Nội dung · c) Sản phẩm · d) Tổ chức thực hiện | PL IV |
| CT-04 | 🟡 | Tên HĐ1, HĐ2 "thể hiện kết quả hoạt động" (không để tên chung chung) | PL IV |
| TH-01 | 🔴 | (Tiểu học) đủ 4 phần: YCCĐ · Đồ dùng dạy học · Các hoạt động dạy học chủ yếu · Điều chỉnh sau bài dạy | PL 3 CV 2345 |
| MT-01 | 🔴 | Mỗi mục tiêu kiến thức/năng lực trích được ít nhất 1 YCCĐ đúng môn, lớp trong `yccd.json` | PL IV mục I; TT 32 |
| MT-02 | 🟡 | Mục tiêu dùng động từ hành vi đo được ("nêu được", "tính được"…), tránh "hiểu", "biết" chung chung | PL IV mục I |
| MT-03 | 🟡 | Phẩm chất mô tả bằng hành vi, thái độ gắn nội dung bài, không chép nguyên tên phẩm chất | PL IV mục I.3 |
| TC-01 | 🔴 | d) có đủ 4 bước: Giao nhiệm vụ · Thực hiện · Báo cáo, thảo luận · Kết luận, nhận định | PL IV ghi chú 4 |
| TC-02 | 🟡 | Giao nhiệm vụ nêu rõ học sinh đọc/nghe/nhìn/làm gì, với thiết bị/học liệu nào | PL IV ghi chú 4 |
| TC-03 | 🟡 | Bước Thực hiện có dự kiến khó khăn của HS và biện pháp hỗ trợ | PL IV ghi chú 4 |
| TC-04 | 🟡 | Bước Báo cáo nêu giải pháp chọn nhóm báo cáo và cách tổ chức | PL IV ghi chú 4 |
| TC-05 | 🟡 | Bước Kết luận phân tích sản phẩm làm căn cứ đánh giá mức độ hoàn thành | PL IV ghi chú 4 |
| TC-06 | 🟡 | Không ghi lời thoại GV/HS; mô tả hoạt động (GV giao/quan sát/hướng dẫn…; HS thực hiện/trình bày…) | PL IV ghi chú 2 |
| TC-07 | 🟢 | Tỉ lệ dấu hiệu HS tích cực / GV độc thoại (từ điển, LLM xác nhận) | Thực tiễn rà soát |
| DG-01 | 🟡 | Có hình thức KTĐG thường xuyên (hỏi–đáp, viết, thực hành, thí nghiệm, thuyết trình, sản phẩm); nếu chấm điểm thì công khai tiêu chí | PL IV ghi chú 3 |
| DG-02 | 🟡 | Câu hỏi đánh giá gắn mức độ NB / TH / VD / VDC, có phân bổ hợp lý | CV 5512 mục II.4 |
| VD-01 | 🟡 | HĐ Vận dụng giao ngoài giờ trên lớp, có yêu cầu báo cáo và thời điểm chia sẻ | PL IV HĐ4 d) |
| NQ-01 | 🔴 | Nhất quán: mỗi mục tiêu ↔ ≥1 hoạt động ↔ ≥1 câu/tiêu chí đánh giá; phiếu học tập và slide trỏ đúng hoạt động | Chuỗi 5 bước |
| NQ-02 | 🟡 | Thời lượng các hoạt động cộng lại khớp số tiết | PL IV ghi chú 1 |
| NLS-01 | 🟡 | Mã năng lực số đúng bậc theo khối lớp; biểu hiện mô tả khớp năng lực thành phần | CV 3456 + PL |
| AI-01 | 🟡 | Nội dung AI đúng mạch/chủ đề và cấp học; có yếu tố sử dụng AI an toàn, có trách nhiệm khi HS dùng AI | QĐ 2422 (B2) |
| DT-01 | 🟡 | Nếu dùng điện thoại: không bắt buộc HS phải có; do GV trực tiếp quản lý, cho phép | CV 5512 mục II.3 |

Kiểu kiểm: `cau_truc` (đọc JSON nội dung theo khung) · `regex` · `doi_chieu` (so với yccd/nls/ai.json) · `llm` (Gemini, trả JSON, luôn kèm trích dẫn vị trí). Luật LLM không được tự hạ mức 🔴.

## 4. Phân hệ (P1–P13)
| Mã | Phân hệ | Nội dung chính | Vai trò |
|---|---|---|---|
| P1 | Tài khoản & phân quyền | Đăng ký, đăng nhập, hồ sơ (cấp, tổ, khối), RBAC 4 vai trò, đổi vai trò nhanh để demo | Tất cả |
| P2 | Thiết lập bài dạy | Chọn cấp → môn → lớp → bộ sách → bài; tự nạp YCCĐ gợi ý từ `yccd.json`; chọn khung tự động theo cấp | GV |
| P3 | Bước 1 — Soạn KHBD | Trình soạn theo khung (biểu mẫu từng mục), AI soạn nháp từ YCCĐ, sửa trực tiếp, lưu phiên bản | GV |
| P4 | Bước 2 — Phiếu học tập | Sinh phiếu cho từng hoạt động có sản phẩm, có thang tiêu chí; xuất .docx | GV |
| P5 | Bước 3 — Slide | Sinh slide theo tiến trình, mỗi trang gắn hoạt động; xuất .pptx/HTML | GV |
| P6 | Bước 4 — Đánh giá | Ngân hàng câu hỏi 4 mức độ gắn mục tiêu, rubric cho sản phẩm/dự án; xuất đề | GV |
| P7 | Tích hợp năng lực số & AI | Gợi ý điểm tích hợp NLS (3456) và giáo dục AI (2422) vào hoạt động, ghi mã và biểu hiện | GV |
| P8 | Bước 5 — Rà soát nhất quán | Chạy luật 3C + LLM, hiển thị cờ tại đúng vị trí, chỉ số, gợi ý sửa 1 chạm; chặn nộp khi còn 🔴 | GV, TT, BGH |
| P9 | Duyệt 2 cấp | Tổ trưởng → BGH; góp ý theo dòng; phiên bản; so sánh khác biệt giữa phiên bản; ký duyệt | TT, BGH |
| P10 | Dự giờ (PL V) | Phiếu đánh giá bài dạy PL V: 12 tiêu chí/20 điểm, chọn mức 1–3 có mô tả mức hiện ngay, tự tính tổng và xếp loại, in A4; AI gợi ý điểm nhóm "1. Kế hoạch bài dạy" từ kết quả P8 (người dự giờ quyết định); phân tích bài dạy 4 bước (CV 5512 chú thích [7]); đề xuất điều chỉnh → ghi vào "Điều chỉnh sau bài dạy" | TT, BGH, GV |
| P11 | Kho KHBD của tổ | Tìm theo môn/lớp/bài/thẻ; nhân bản bài đã duyệt làm điểm xuất phát; đánh giá, lượt dùng | Tất cả |
| P12 | Dashboard BGH | Tiến độ nộp/duyệt theo tổ, % cờ đỏ, thời gian nộp→duyệt, số vòng sửa, mức tích hợp NLS/AI, kết quả dự giờ | BGH |
| P13 | Quản trị | Người dùng, bật/tắt luật, phiên bản prompt, sao lưu/khôi phục JSON, nhật ký | Admin |

## 5. AI & prompt
- Prompt nằm trong `prompts/tasks/` (soan_khbd, phieu, slide, danh_gia, tich_hop, ra_soat), có số phiên bản. Mỗi lần gọi ghi vào `evals/traces/`, ẩn dữ liệu cá nhân.
- Đầu ra LLM luôn là JSON theo schema. Không parse được thì hỏi lại một lần (Tenacity), vẫn lỗi thì dùng Mock và báo người dùng.
- AI chỉ **đề xuất**, giáo viên **quyết định**. Mọi nội dung AI sinh ra được đánh dấu cho đến khi GV chấp nhận.
- Không bịa YCCĐ: chỉ trích từ `yccd.json`; không tìm thấy thì ghi "chưa xác định" và gắn cờ MT-01.

## 6. Giao diện
- Tiếng Việt sư phạm; tông xanh học đường (#2563eb, #1e40af, #f8fafc); dùng tốt trên điện thoại khi duyệt.
- Thanh tiến trình chuỗi 5 bước luôn hiện; bước nào còn cờ 🔴 thì hiện chấm đỏ.
- Bố cục 2 cột: soạn bên trái, cờ rà soát và gợi ý bên phải; bấm vào cờ thì nhảy tới đúng vị trí.

## 7. Bảo mật & dữ liệu nhạy cảm
- Mật khẩu băm (giai đoạn 1: PBKDF2 qua WebCrypto, muối riêng từng tài khoản; giai đoạn 2: argon2id).
- API key chỉ lưu trên trình duyệt người dùng. Dữ liệu cá nhân không đưa vào prompt (thay bằng mã).
- `data/raw/private/` và `outputs/` không đồng bộ git.

## 8. Dữ liệu mẫu
- 6 tài khoản: 1 Admin, 1 BGH, 2 tổ trưởng, 2 giáo viên.
- 3 bộ bài trọn vẹn (KHBD + phiếu + slide + đánh giá + rà soát), mỗi cấp một bài, YCCĐ trích đúng CT 2018:
  - **TH — Toán 3:** Hình tròn: tâm, bán kính, đường kính (khung CV 2345)
  - **THCS — Toán 8:** Hình chóp tam giác đều, diện tích xung quanh (PL IV)
  - **THPT — Ngữ văn 10:** Nghệ thuật xây dựng hình tượng nhân vật sử thi (PL IV)
- Mỗi bộ mẫu cố ý có 1–2 cờ 🟡 để demo luồng sửa.
- 4 lượt duyệt mẫu, 1 phiếu dự giờ mẫu, 15 dòng nhật ký.
- Chế độ trình diễn có nút "Nạp/Xóa dữ liệu mẫu" riêng.

## 9. Kiểm thử
- Test phiếu PL V: điểm bội 0,25, không vượt điểm tối đa, xếp loại đúng 4 ngưỡng (17,75 → Khá; 18 → Giỏi; 13,5 → Khá; 9,75 → Không đạt).
- Unit test cho mọi luật 3C: mỗi luật có ít nhất 1 ca đạt và 1 ca vi phạm (`evals/tests/rules/`).
- Test chuỗi 5 bước: tạo bài → soạn → phiếu → slide → đánh giá → rà soát → nộp → tổ duyệt → BGH duyệt → dự giờ → điều chỉnh.
- Test đối chiếu YCCĐ: 3 bài mẫu trích đúng YCCĐ (so văn bản gốc).
- Test xuất tệp: .docx/.pptx mở được, đủ mục.
- Bảng điểm `evals/scorecards/v1.0.json` ghi các chỉ số của mục 0 trên bộ mẫu.

## 10. Đưa lên VPS
- Tên miền: **khbd.thaykhoa-ai.tech** (theo skill `dua-app-len-vps`: thư mục portal, khối Caddy, bản ghi A, thẻ trên trang chủ, curl kiểm tra).
- Kiểm tra cuối bằng curl từ VPS: mã 200, TLS hợp lệ, title đúng.

## 11. Điểm dừng
- Thiếu văn bản nguồn trong `data/raw/` cho phần đang làm (hiện đã đủ cho v1.0).
- Trước khi chọn thư viện xuất .pptx/.docx có giấy phép không phải MIT/Apache/BSD.
- Trước khi đưa lên VPS lần đầu.
- Xong giai đoạn 1: hỏi có làm giai đoạn 2 (API đồng bộ) không.

## 12. Tiêu chí đạt & báo cáo cuối (10 tiêu chí)
1. Chạy được chuỗi 5 bước trọn vẹn cho cả 3 cấp.
2. Khung KHBD đúng PL IV (THCS, THPT) và PL 3 CV 2345 (TH); luật 🔴 chặn nộp đúng.
3. 100% mục tiêu của bài mẫu có trích YCCĐ đúng CT 2018.
4. Rà soát nhất quán phát hiện đúng các lệch đã cài sẵn trong bộ test.
5. Tích hợp NLS/AI có mã đúng bậc, đúng mạch.
6. Duyệt 2 cấp có góp ý theo dòng, phiên bản, so sánh khác biệt.
7. Dự giờ chấm đúng PL V (12 tiêu chí, tổng 20, xếp loại đúng ngưỡng), ghi phân tích 4 bước và đẩy được "Điều chỉnh sau bài dạy" về KHBD.
8. Dashboard BGH hiển thị đúng số liệu từ CSDL.
9. Xuất .docx/.pptx mở được; tất cả test trong mục 9 đạt.
10. Chạy công khai tại khbd.thaykhoa-ai.tech, curl 200, TLS hợp lệ.

**Báo cáo cuối:** đường dẫn công khai; bảng chỉ số mục 0 (trước/sau trên bộ mẫu); số test đạt/tổng; các quyết định quan trọng đã ghi trong `docs/decisions.md`; việc còn treo.
