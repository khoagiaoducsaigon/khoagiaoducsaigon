// Kiểm thử đầu cuối trên Chromium thật (Playwright). Chạy: node evals/tests/e2e.mjs
// Phục vụ cả thư mục eduplan-5512 trên CÙNG origin: /index.html = EduPlan cũ, /app/ = bản mới (mô phỏng thay file tại eduplan.thaykhoa-ai.tech).
// CDN (Tailwind, Lucide, docx, pptxgenjs) được thay bằng bản cục bộ khi môi trường không ra được mạng.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoGiaLap } from './fixtures/tao-eduplan-cu-gia-lap.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const ROOT = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const LIBS = process.env.EDUPLAN_LIBS; // thư mục node_modules có lucide, docx, pptxgenjs (tùy chọn)
const TW_CSS = process.env.EDUPLAN_TW_CSS; // CSS Tailwind dựng sẵn (tùy chọn, chỉ để chụp màn hình)
const SHOTS = process.env.EDUPLAN_SHOTS;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = join(ROOT, p.endsWith('/') ? p + 'index.html' : p);
  if (!f.startsWith(ROOT) || !existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
}).listen(0);
const BASE = `http://localhost:${server.address().port}`;

const kq = [], loi = [];
const ok = (dk, ten) => { kq.push([dk ? 'PASS' : 'FAIL', ten]); if (!dk) process.exitCode = 1; };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
if (LIBS) {
  const tw = TW_CSS ? await readFile(TW_CSS, 'utf8') : '';
  await ctx.route(/cdn\.tailwindcss\.com/, r => r.fulfill({ contentType: 'application/javascript', body: `window.tailwind={};document.head.insertAdjacentHTML('beforeend',${JSON.stringify('<style>' + tw + '</style>')});` }));
  await ctx.route(/unpkg\.com\/lucide/, async r => r.fulfill({ contentType: 'application/javascript', body: await readFile(join(LIBS, 'lucide/dist/umd/lucide.min.js'), 'utf8') }));
  await ctx.route(/jsdelivr\.net\/npm\/docx/, async r => r.fulfill({ contentType: 'application/javascript', body: await readFile(join(LIBS, 'docx/build/index.umd.js'), 'utf8') }));
  await ctx.route(/jsdelivr\.net\/npm\/pptxgenjs/, async r => r.fulfill({ contentType: 'application/javascript', body: await readFile(join(LIBS, 'pptxgenjs/dist/pptxgen.bundle.js'), 'utf8') }));
  await ctx.route(/fonts\.(googleapis|gstatic)/, r => r.abort());
}
const page = await ctx.newPage();
page.on('pageerror', e => loi.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) loi.push('console: ' + m.text()); });
page.on('dialog', d => d.accept());
const shot = async n => { if (SHOTS) { await mkdir(SHOTS, { recursive: true }); await page.screenshot({ path: join(SHOTS, n + '.png'), fullPage: true }); } };
const cho = ms => page.waitForTimeout(ms);
const EP = (fn, ...a) => page.evaluate(([f, args]) => window.EP[f](...args), [fn, a]);

// ---------------- 1) Trình duyệt đang dùng EduPlan cũ, có dữ liệu thật
await page.goto(`${BASE}/index.html`); await cho(1500);
const cu = await taoGiaLap();
await page.evaluate(async tables => {
  const db = await new Promise(r => { const q = indexedDB.open('EduPlan5512DB', 1); q.onsuccess = () => r(q.result); });
  const tx = db.transaction(Object.keys(tables), 'readwrite');
  for (const [t, rows] of Object.entries(tables)) { tx.objectStore(t).clear(); rows.forEach(x => tx.objectStore(t).put(x)); }
  await new Promise(r => (tx.oncomplete = r)); db.close();
}, cu);
ok(await page.evaluate(() => indexedDB.databases().then(d => d.some(x => x.name === 'EduPlan5512DB'))), 'Bản cũ có kho EduPlan5512DB với dữ liệu thật');

// ---------------- 2) Mở bản mới cùng origin → phát hiện kho cũ → di trú
await page.goto(`${BASE}/app/`); await cho(2000);
ok(await page.locator('text=Phát hiện dữ liệu EduPlan cũ').count() > 0, 'Bản mới tự phát hiện kho EduPlan cũ (banner)');
await shot('01-dang-nhap-banner-di-tru');
await EP('moDiTru'); await cho(600);
ok(await page.locator('text=Xem trước').count() > 0, 'Hộp xem trước số bản ghi (dry-run) hiển thị');
await shot('02-xem-truoc-di-tru');
await page.click('button:has-text("Xác nhận chuyển")'); await cho(1500);
const sau = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('EduPlanKHBD'); q.onsuccess = async () => { const db = q.result, o = {};
  for (const s of ['users', 'lessons', 'reviews', 'audits', 'activity_logs', 'migration_logs', 'lesson_versions']) o[s] = await new Promise(k => { const g = db.transaction(s).objectStore(s).getAll(); g.onsuccess = () => k(g.result); }); db.close(); r(o); }; }));
ok(sau.lessons.filter(l => l.nguon_du_lieu === 'eduplan_cu').length === 3, `Di trú 3 KHBD (thật + mẫu được dùng thật) — có ${sau.lessons.length}`);
ok(sau.users.length === 4, `Di trú 4 tài khoản — có ${sau.users.length}`);
ok(sau.lessons.find(l => l.legacy_id === 'lp_real1')?.trang_thai === 'cho_bgh_duyet', 'Trạng thái duyệt cũ giữ nguyên (lp_real1: chờ BGH)');
ok(sau.audits.some(a => a.engine.includes('Rà soát sau di trú')), 'Đã rà soát lại KHBD di trú (không đổi trạng thái)');
const mlog = sau.migration_logs.find(m => !m.dry_run);
ok(mlog?.ket_qua === 'thành công' && mlog.doi_soat.lech.length === 0 && mlog.doi_soat.mau.length === 10, `Đối soát 10 bản ghi khớp — ${mlog?.ket_qua}`);
ok(await page.evaluate(() => indexedDB.databases().then(d => d.some(x => x.name === 'EduPlan5512DB'))), 'Kho cũ vẫn được giữ sau khi chuyển');

// chạy lại → không nhân đôi
const truoc = sau.lessons.length;
await page.reload(); await cho(1500);
ok(await page.locator('text=Phát hiện dữ liệu EduPlan cũ').count() === 0, 'Đã chuyển xong → không còn banner');

// ---------------- 3) Tài khoản cũ đăng nhập bằng mật khẩu cũ → băm lại PBKDF2
await page.fill('#dn-id', 'hoa.tv@truong.edu.vn'); await page.fill('#dn-pw', 'matkhau1'); await page.click('#f-dn button'); await cho(1500);
ok(await page.locator('text=Xin chào, Trần Văn Hòa').count() > 0, 'Giáo viên cũ đăng nhập được bằng mật khẩu cũ');
const hash = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('EduPlanKHBD'); q.onsuccess = () => { const g = q.result.transaction('users').objectStore('users').getAll(); g.onsuccess = () => { r(g.result.find(u => u.email === 'hoa.tv@truong.edu.vn').mat_khau_bam); q.result.close(); }; }; }));
ok(hash.startsWith('pbkdf2$'), 'Mật khẩu cũ được băm lại bằng PBKDF2 ở lần đăng nhập đầu');
await page.click('button:has-text("Bắt đầu")').catch(() => {});
ok(await page.locator('text=Phương trình bậc nhất một ẩn').count() > 0, 'KHBD cũ của giáo viên hiện trên trang chủ');
await shot('03-trang-chu-gv-cu');
// dry-run lần 2 từ P14 (cần quyền quản trị → dùng hàm lõi trực tiếp)
const lan2 = await page.evaluate(async () => { const m = await import('/app/js/legacy.js'); const s = await import('/app/js/state.js'); const cu = await m.phatHienKhoCu(); const k = m.xemTruoc(s.S.kho, cu.du_lieu); return Object.values(k.ops).reduce((a, x) => a + x.length, 0); });
ok(lan2 === 0, `Chạy lại di trú (dry-run) không ghi thêm bản ghi nào — ${lan2}`);
const sl = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('EduPlanKHBD'); q.onsuccess = () => { const g = q.result.transaction('lessons').objectStore('lessons').count(); g.onsuccess = () => { r(g.result); q.result.close(); }; }; }));
ok(sl === truoc, 'Số KHBD không đổi sau khi tải lại/chạy lại');

// ---------------- 4) Chế độ trình diễn: trọn vòng
await EP('doiCheDo', 'demo'); await cho(3500);
ok(await page.locator('text=Tài khoản trình diễn').count() > 0, 'Chế độ trình diễn: CSDL riêng, tự nạp dữ liệu mẫu');
await EP('dangNhapNhanh', 'mai.vt@demo.edu.vn'); await cho(1500);
await page.click('button:has-text("Bắt đầu")').catch(() => {});
await page.goto(`${BASE}/app/#/soan`); await cho(1200);
await page.fill('#tl-ten', 'Hình chóp tứ giác đều'); await page.dispatchEvent('#tl-ten', 'change');
await page.selectOption('#tl-mon', 'Toán'); await cho(500); await page.selectOption('#tl-lop', '8'); await cho(1200);
await page.fill('#tl-tim', 'hình chóp'); await cho(400);
const nChon = await page.locator('#tl-ds [data-y]').count();
await page.locator('#tl-ds [data-y]').first().check(); await page.locator('#tl-ds [data-y]').nth(1).check();
ok(nChon >= 2, `Tìm thấy YCCĐ "hình chóp" Toán 8 trong CT 2018 (${nChon})`);
await shot('04-thiet-lap-bai');
await page.click('#tl-ai'); await cho(2500);
ok(/#\/bai\/.+\/1/.test(page.url()), 'Tạo bài + AI soạn nháp → vào bước 1');
await shot('05-buoc1-soan-khbd');
const idBai = page.url().split('/bai/')[1].split('/')[0];
for (const b of ['2', '3', '4', 'tich-hop']) { await page.goto(`${BASE}/app/#/bai/${idBai}/${b}`); await cho(800); }
await shot('06-tich-hop');
await page.goto(`${BASE}/app/#/bai/${idBai}/5`); await cho(1200);
await shot('07-buoc5-ra-soat');
const chan = await page.locator('button:has-text("Gửi Tổ trưởng duyệt")').isDisabled();
ok(!chan, 'Bản nháp AI không còn cờ đỏ → nút "Gửi Tổ trưởng duyệt" mở');
// xuất tệp
const dl = async fn => { const p = page.waitForEvent('download', { timeout: 15000 }).catch(() => null); await EP(fn, idBai); const d = await p; return d ? d.suggestedFilename() : null; };
const f1 = await dl('xuatKHBD'), f2 = await dl('xuatSlide'), f3 = await dl('xuatPhieu'), f4 = await dl('xuatDanhGia');
ok(f1?.endsWith('.docx') && f2?.endsWith('.pptx') && f3?.endsWith('.docx') && f4?.endsWith('.docx'), `Xuất tệp: ${[f1, f2, f3, f4].join(', ')}`);
await page.click('button:has-text("Gửi Tổ trưởng duyệt")'); await cho(1200);
// tổ trưởng ký
await EP('doiVaiTro', 'tt1'); await page.goto(`${BASE}/app/#/duyet/${idBai}`); await cho(1200);
await EP('gopYDong', 'hoat_dong.0.ten'); await cho(300); await page.fill('#gy', 'Tên hoạt động nên nêu rõ kết quả.'); await page.click('#gy-ok'); await cho(600);
await shot('08-duyet-cap-to');
await page.click('button:has-text("Lưu phiếu & ký duyệt cấp tổ")'); await cho(1200);
// BGH phê duyệt
await EP('doiVaiTro', 'bgh'); await page.goto(`${BASE}/app/#/duyet/${idBai}`); await cho(1200);
await page.click('button:has-text("Lưu phiếu & phê duyệt BGH")'); await cho(1200);
const tt = await page.evaluate(id => import('/app/js/state.js').then(s => s.S.kho.get('lessons', id).trang_thai), idBai);
ok(tt === 'da_duyet', `Luồng nộp → tổ duyệt → BGH duyệt chạy đúng (trạng thái: ${tt})`);
ok(await page.evaluate(id => import('/app/js/state.js').then(s => !!s.S.kho.one('library', x => x.lesson_id === id)), idBai), 'KHBD đã duyệt vào Kho của tổ');
// dự giờ PL V
await EP('doiVaiTro', 'tt1'); await page.goto(`${BASE}/app/#/du-gio/${idBai}`); await cho(1200);
for (let i = 0; i < 12; i++) { await EP('chonMuc', i, 3); await cho(60); }
await page.fill('[data-ob="de_xuat"]', 'Bổ sung thao tác gấp mô hình.'); await page.dispatchEvent('[data-ob="de_xuat"]', 'change');
await shot('09-du-gio-plv');
await page.click('button:has-text("Lưu phiếu")'); await cho(1200);
const ob = await page.evaluate(id => import('/app/js/state.js').then(s => { const o = s.S.kho.one('observations', x => x.lesson_id === id); const l = s.S.kho.get('lessons', id); return { tong: o?.phieu_PLV.tong_diem, xl: o?.phieu_PLV.xep_loai, dc: l.noi_dung.dieu_chinh, tt: l.trang_thai }; }), idBai);
ok(ob.tong === 20 && ob.xl === 'Giỏi', `Phiếu PL V: ${ob.tong}/20 — ${ob.xl}`);
ok(ob.dc.includes('gấp mô hình') && ob.tt === 'da_day', 'Đề xuất điều chỉnh đẩy về "Điều chỉnh sau bài dạy", trạng thái "Đã dạy"');
// dashboard
await EP('doiVaiTro', 'bgh'); await page.goto(`${BASE}/app/#/dashboard`); await cho(1200);
ok(await page.locator('text=Tổng số giáo án đã duyệt').count() > 0, 'Dashboard BGH hiển thị từ CSDL');
await shot('10-dashboard');
// rà soát nhanh (luồng EduPlan cũ)
await EP('doiVaiTro', 'gv1'); await page.goto(`${BASE}/app/#/ra-soat-nhanh`); await cho(1000);
await EP('mauCu', 'khtn6'); await cho(500); await page.click('#rq-chay'); await cho(800);
ok(await page.locator('text=Bảng kiểm 4 bước tổ chức hoạt động').count() > 0, 'Rà soát nhanh 5512 (luồng cũ) chạy, giữ tên nút quen thuộc');
await shot('11-ra-soat-nhanh');
// P14 + quản trị
await EP('doiVaiTro', 'admin'); await page.goto(`${BASE}/app/#/quan-tri/luat`); await cho(800);
ok(await page.locator('[data-rule]').count() === 23, '23 luật hiển thị, bật/tắt được');
await page.goto(`${BASE}/app/#/di-tru`); await cho(800);
ok(await page.locator('text=migration_logs').count() > 0, 'P14 Chuyển dữ liệu hiển thị migration_logs');
// dữ liệu thật không bị trộn dữ liệu trình diễn
const tron = await page.evaluate(() => new Promise(r => { const q = indexedDB.open('EduPlanKHBD'); q.onsuccess = () => { const g = q.result.transaction('lessons').objectStore('lessons').getAll(); g.onsuccess = () => { r(g.result.filter(l => l.nguon_du_lieu === 'demo').length); q.result.close(); }; }; }));
ok(tron === 0, 'CSDL thật không lẫn dữ liệu trình diễn');

ok(loi.length === 0, `Không có lỗi JS (${loi.length})${loi.length ? ': ' + loi.slice(0, 3).join(' | ') : ''}`);
await browser.close(); server.close();
const bc = kq.map(([s, t]) => `${s}  ${t}`).join('\n');
console.log(bc);
console.log(`\n${kq.filter(k => k[0] === 'PASS').length}/${kq.length} đạt`);
await writeFile(join(ROOT, 'evals/traces/e2e-ket-qua.txt'), `${new Date().toISOString()}\n${bc}\n`);
