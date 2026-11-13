# EduPlan KHBD AI v1.1 (bản gộp)

Web tĩnh (HTML + ES modules, không build) — mở qua HTTP (VPS hoặc `python3 -m http.server` trong thư mục này), không mở bằng file://.

| Thư mục | Nội dung |
|---|---|
| `index.html` | Khung trang (Tailwind CDN, Lucide) |
| `js/khung.js` | Khung KHBD PL IV CV 5512 / PL 3 CV 2345, đọc KHBD văn bản |
| `js/rules.js` | 23 luật rà soát 3C (có nguồn) + chỉ số |
| `js/migrate.js`, `js/legacy.js` | Di trú EduPlan cũ (IndexedDB cùng origin), đối soát |
| `js/gen.js`, `js/llm.js` | Mock AI soạn 5 bước / Gemini |
| `js/lesson.js`, `js/duyet.js`, `js/quantri.js` | Phân hệ P2–P14 |
| `data/` | YCCĐ CT 2018 theo môn, khung NLS (CV 3456), khung AI (QĐ 2422), PL V |

Kiểm thử: `node --test evals/tests/*.test.mjs` (23) · `node evals/tests/e2e.mjs` (30, Playwright).
Triển khai: `deploy/deploy-v1.1.sh` (xanh–lục, symlink, quay lui 1 lệnh).
