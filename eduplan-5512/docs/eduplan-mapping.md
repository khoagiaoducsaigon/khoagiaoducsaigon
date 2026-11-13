# Bảng ánh xạ EduPlan cũ → hệ mới (mục 2B · Bước 3) — BẢN NHÁP, CHỜ DUYỆT

> Tên store/trường **phía mới** chỉ chắc chắn ở những gì v1.1 nêu rõ: `lessons`, `reviews`, `migration_logs`, `legacy_id`, `nguon_du_lieu`, `ngay_di_tru`, `legacy{}`, `nhan`.
> Những tên khác cần **schema 3B của master prompt v1.0**. Chưa có tài liệu này nên các tên đó được đánh dấu `(?)` và sẽ chốt lại khi có.

## Trường chung, thêm vào mọi bản ghi được di trú
| Trường mới | Giá trị |
|---|---|
| `legacy_id` | `id` cũ (khóa chống trùng khi chạy lại) |
| `nguon_du_lieu` | `eduplan_cu` |
| `ngay_di_tru` | thời điểm chạy di trú (ISO) |

**Dữ liệu mẫu cũ** (id `u1–u6`, `lp1–lp3`, `a1–a5`, `r1–r5`, `log001–log015`, hoặc KHBD có `sampleKey`): **không di trú** vào dữ liệu thật. Ghi số lượng vào `migration_logs.bo_qua` với lý do "dữ liệu mẫu".

## users → users (?)
| Cũ | Mới | Ghi chú |
|---|---|---|
| id | legacy_id | id mới sinh lại |
| name, email, code | ho_ten (?), email, ma_gv (?) | |
| role | vai_tro | admin→`bgh`(?), leader→`to_truong`(?), teacher→`giao_vien`(?) |
| dept, grades, title | to_chuyen_mon (?), khoi_phu_trach (?), chuc_danh (?) | |
| password | mat_khau_bam | `sha256:` giữ nguyên, băm lại khi đăng nhập lần đầu · `djb2:` gắn cờ `phai_doi_mat_khau=true` |
| status | trang_thai | active / pending / locked giữ nguyên |
| canApprove | quyen_duyet (?) | |
| createdAt | ngay_tao | |

## lesson_plans → lessons
| Cũ | Mới | Ghi chú |
|---|---|---|
| id | legacy_id | |
| title, subject, grade, book, term, schoolYear, dept | ten_bai, mon, khoi, bo_sach, hoc_ky, nam_hoc, to (?) | Cấp học suy từ khối: 1–5 TH, 6–9 THCS, 10–12 THPT |
| teacherId | giao_vien_id | ánh xạ qua legacy_id của users |
| content | Phiên bản 1 của KHBD mới | gắn `nhan = "nhập từ EduPlan"`; nếu chưa tách được thành schema mới thì giữ nguyên văn |
| versions[] | phien_ban[] (?) | giữ đủ mọi phiên bản, thứ tự, người sửa, thời điểm |
| status | trang_thai | draft→Bản nháp · pending→Chờ duyệt · revise→Yêu cầu chỉnh sửa · approved→Đã duyệt. **Không đổi khi chạy rà soát mới** |
| ttSignedBy/At, bghSignedBy/At | các lượt trong `reviews` | đồng thời lưu bản gốc vào legacy{} |
| teacherName, onTime, sampleKey, createdAt/updatedAt/submittedAt | legacy{} hoặc trường mới tương ứng (?) | không bỏ trường nào |

## review_notes → reviews
| Cũ | Mới | Ghi chú |
|---|---|---|
| id | legacy_id | |
| planId, version | lesson_id, phien_ban | qua legacy_id |
| reviewerId, reviewerName, level, at | nguoi_duyet_id, nguoi_duyet_ten, cap_duyet, thoi_diem | **giữ nguyên người duyệt và thời điểm** |
| verdict | ket_luan | Đạt / Chưa đạt |
| strengths, weaknesses, solutions, stepNotes[4], general | uu_diem, ton_tai, giai_phap, nhan_xet_4_buoc, y_kien | |
| compliance, activeness | legacy{} | ảnh chụp điểm AI tại lúc duyệt |

## ai_audits → bảng kết quả rà soát (?) của P8
Giữ nguyên toàn bộ: compliance, activeness, steps, strengths, weaknesses, solutions, suggestions, engine. Gắn `nguon_luat = "eduplan v1"`.

## audit_logs → nhật ký (?)
Giữ nguyên `at, userId (→legacy), userName, role, action, target, detail`.

## Không di trú lên máy chủ
`eduplan5512.settings.apiKey` (khóa Gemini). Chỉ chuyển sang kho cục bộ của bản mới nếu người dùng đồng ý.

## Cần thầy quyết định
1. Tên vai trò, tên store chuẩn của v1.0 (gửi file master prompt v1.0).
2. Dữ liệu mẫu cũ: bỏ qua (đề xuất) hay chuyển vào chế độ trình diễn.
3. Đồng ý cơ chế băm lại mật khẩu khi đăng nhập lần đầu.
