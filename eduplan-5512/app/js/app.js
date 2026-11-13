// EduPlan KHBD AI v1.1 — khởi động, định tuyến, đăng nhập, trang chủ, di trú từ EduPlan cũ.
import { S, A, moKho, taiDuLieuKhung, yccdCua, log, quyen, baiNhinThay, TRANG_THAI, raSoatSauDiTru, TO } from './state.js';
import { $, esc, ic, icons, toast, modal, closeModal, fmtDT, fmtD, opt } from './ui.js';
import { hashPassword, verifyPassword, TEN_VAI_TRO } from './auth.js';
import { uid } from './db.js';
import { phatHienKhoCu, xemTruoc, diTru } from './legacy.js';
import { taoDuLieuMau, MAT_KHAU_DEMO } from './seed.js';
import { cheDoAI, caiDatAI, luuCaiDatAI, kiemTraKetNoi } from './llm.js';
import * as BaiDay from './lesson.js';
import * as Duyet from './duyet.js';
import * as QuanTri from './quantri.js';

window.EP = A; // các hành động gọi từ giao diện
const SESSION = () => `eduplan-khbd.session.${S.cheDo}`;

// ------------------------------------------------------------------ Định tuyến
const ROUTES = [
  ['', () => trangChu()], ['soan', () => BaiDay.thietLap()], ['bai', (id, b) => BaiDay.khongGian(id, b)], ['ra-soat-nhanh', () => BaiDay.raSoatNhanh()],
  ['duyet', id => Duyet.duyet(id)], ['du-gio', id => Duyet.duGio(id)], ['kho', () => QuanTri.kho()], ['dashboard', () => QuanTri.dashboard()],
  ['quan-tri', tab => QuanTri.quanTri(tab)], ['di-tru', () => QuanTri.diTruView()]
];
export const go = path => { location.hash = '#/' + path; };
export async function render() {
  const app = $('#app');
  if (!S.user) { app.innerHTML = manDangNhap(); icons(); ganDangNhap(); return; }
  const [p, a, b] = location.hash.replace(/^#\/?/, '').split('/');
  const r = ROUTES.find(x => x[0] === (p || '')) || ROUTES[0];
  S.route = [p || '', a, b];
  app.innerHTML = header() + '<main id="main" class="max-w-[1440px] mx-auto px-3 sm:px-5 py-5 fade-in"></main>' + footer();
  icons();
  try { await r[1](a, b); } catch (e) { console.error(e); $('#main').innerHTML = `<div class="card p-6 text-rose-700">Lỗi hiển thị: ${esc(e.message)}</div>`; }
  icons();
}
S.render = render;
window.addEventListener('hashchange', render);

// ------------------------------------------------------------------ Khung giao diện
function header() {
  const u = S.user, demo = S.cheDo === 'demo';
  const tabs = [['', 'home', 'Trang chủ', true], ['soan', 'file-plus-2', 'Soạn KHBD', quyen('soan')], ['ra-soat-nhanh', 'scan-search', 'Rà soát nhanh 5512', quyen('ra_soat')],
    ['duyet', 'clipboard-check', 'Duyệt KHBD', quyen('duyet_to') || quyen('duyet_bgh') || quyen('nop')], ['du-gio', 'eye', 'Dự giờ', true], ['kho', 'library', 'Kho KHBD của tổ', quyen('kho')],
    ['dashboard', 'layout-dashboard', 'Dashboard BGH', quyen('dashboard')], ['quan-tri', 'settings-2', 'Quản trị', quyen('quan_tri')]].filter(t => t[3]);
  return `<header class="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
  <div class="h-1 ${demo ? 'bg-amber-400' : 'bg-gradient-to-r from-brand-800 via-brand-600 to-sky-400'}"></div>
  <div class="max-w-[1440px] mx-auto px-3 sm:px-5 py-2 flex flex-wrap items-center gap-2">
    <a href="#/" class="flex items-center gap-2 mr-2"><span class="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 text-white grid place-items-center">${ic('book-open-check', 'w-5 h-5')}</span>
      <span class="leading-tight"><span class="block font-extrabold text-brand-900">EduPlan <span class="text-brand-600">KHBD AI</span></span><span class="block text-[10px] text-slate-500">Soạn · Rà soát · Duyệt · Dự giờ — CT GDPT 2018</span></span></a>
    <nav class="flex items-center gap-1 overflow-x-auto order-3 xl:order-none w-full xl:w-auto" aria-label="Phân hệ">${tabs.map(([k, i, l]) => `<a href="#/${k}" class="nav-tab ${S.route[0] === k ? 'active' : ''}">${ic(i)}${l}</a>`).join('')}</nav>
    <div class="ml-auto flex items-center gap-2 flex-wrap justify-end">
      <button class="badge ${demo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'} py-1.5" onclick="EP.doiCheDo()" title="Dữ liệu thật và trình diễn tách hẳn nhau">${ic(demo ? 'presentation' : 'database', 'w-3.5 h-3.5')}${demo ? 'Chế độ trình diễn' : 'Dữ liệu thật'}</button>
      ${demo ? `<div class="flex bg-amber-50 border border-amber-200 rounded-full p-0.5" title="Đổi vai trò nhanh (chỉ ở chế độ trình diễn)">${[['gv1', 'GV'], ['tt1', 'Tổ trưởng'], ['bgh', 'BGH'], ['admin', 'Admin']].map(([id, t]) => `<button class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${u.id === id ? 'bg-white shadow text-amber-900' : 'text-amber-800'}" onclick="EP.doiVaiTro('${id}')">${t}</button>`).join('')}</div>` : ''}
      <button class="badge ${cheDoAI() === 'gemini' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} py-1.5" onclick="EP.caiDat()">${ic(cheDoAI() === 'gemini' ? 'cpu' : 'flask-conical', 'w-3.5 h-3.5')}${cheDoAI() === 'gemini' ? 'Gemini' : 'Mock AI'}</button>
      <div class="flex items-center gap-2 pl-2 border-l border-slate-200"><div class="hidden md:block leading-tight text-right"><div class="text-sm font-semibold">${esc(u.ho_ten)}</div><div class="text-[11px] text-slate-500">${esc(TEN_VAI_TRO[u.vai_tro])} · ${esc(u.to_chuyen_mon)}</div></div>
      <button class="p-2 rounded-lg hover:bg-slate-100" onclick="EP.caiDat()" aria-label="Cài đặt">${ic('settings', 'w-4 h-4')}</button>
      <button class="p-2 rounded-lg hover:bg-rose-50 text-rose-600" onclick="EP.dangXuat()" aria-label="Đăng xuất">${ic('log-out', 'w-4 h-4')}</button></div>
    </div></div>
  <div id="banner-cu"></div></header>`;
}
const footer = () => `<footer class="max-w-[1440px] mx-auto px-5 py-6 text-[11px] text-slate-400 flex flex-wrap gap-2 justify-between">
  <span>EduPlan KHBD AI v1.1 · TS. Phạm Đăng Khoa · Dữ liệu lưu trên trình duyệt (IndexedDB${S.cheDo === 'demo' ? ', CSDL trình diễn riêng' : ''}).</span>
  <span>Căn cứ: CV 5512 (PL IV) · CV 2345 (PL 3) · TT 32/2018 · CV 3456 · QĐ 2422 · PL V (CV 05/SGDĐT)</span></footer>`;

// ------------------------------------------------------------------ Đăng nhập / đăng ký
function manDangNhap() {
  const demo = S.cheDo === 'demo', trong = !S.kho.all('users').length;
  return `<div class="min-h-screen grid lg:grid-cols-2">
  <div class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600 text-white p-12">
    <div class="flex items-center gap-3"><span class="w-12 h-12 rounded-2xl bg-white/15 grid place-items-center">${ic('book-open-check', 'w-6 h-6')}</span><div><div class="text-xl font-extrabold">EduPlan KHBD AI</div><div class="text-brand-100 text-sm">Một tài khoản · một CSDL · một nhật ký cho trọn vòng</div></div></div>
    <div><h1 class="text-4xl font-extrabold leading-tight">Soạn → rà soát → nộp → duyệt<br>→ dạy → dự giờ → điều chỉnh.</h1>
      <p class="text-brand-100 mt-4 max-w-md">Chuỗi soạn 5 bước bám yêu cầu cần đạt của CT GDPT 2018, tích hợp năng lực số (CV 3456) và giáo dục AI (QĐ 2422).</p></div>
    <div class="text-xs text-brand-200">Tài khoản EduPlan cũ vẫn đăng nhập được sau khi chuyển dữ liệu.</div></div>
  <div class="flex items-center justify-center p-5 sm:p-10"><div class="w-full max-w-md space-y-4">
    <div class="flex bg-slate-100 rounded-xl p-1 text-sm font-semibold"><button class="flex-1 py-2 rounded-lg ${!demo ? 'bg-white shadow text-brand-800' : 'text-slate-500'}" onclick="EP.doiCheDo('that')">Dữ liệu thật</button>
      <button class="flex-1 py-2 rounded-lg ${demo ? 'bg-white shadow text-amber-800' : 'text-slate-500'}" onclick="EP.doiCheDo('demo')">Chế độ trình diễn</button></div>
    <div id="banner-cu"></div>
    ${S.tam.authTab === 'dk' || (trong && !demo) ? formDangKy(trong) : formDangNhap()}
    ${demo ? `<div class="card p-4 text-sm"><div class="font-semibold mb-2">Tài khoản trình diễn (mật khẩu ${MAT_KHAU_DEMO})</div><div class="grid grid-cols-2 gap-2">${S.kho.all('users').map(u => `<button class="btn btn-ghost !justify-start text-left !py-1.5" onclick="EP.dangNhapNhanh('${u.email}')"><span class="truncate">${esc(TEN_VAI_TRO[u.vai_tro])}<br><span class="text-[11px] text-slate-500">${esc(u.ho_ten)}</span></span></button>`).join('')}</div>
      ${S.kho.all('users').length ? '' : `<button class="btn btn-primary w-full mt-2" onclick="EP.napMau()">${ic('database-zap')}Nạp dữ liệu trình diễn</button>`}</div>` : ''}
  </div></div></div>`;
}
const formDangNhap = () => `<form class="card p-6 space-y-4" id="f-dn"><h2 class="font-bold text-lg">Đăng nhập</h2>
  <div><label class="label" for="dn-id">Email hoặc mã giáo viên</label><input id="dn-id" name="id" class="input" required autocomplete="username"></div>
  <div><label class="label" for="dn-pw">Mật khẩu</label><input id="dn-pw" name="pw" type="password" class="input" required autocomplete="current-password"></div>
  <button class="btn btn-primary w-full">${ic('log-in')}Đăng nhập</button>
  <p class="text-xs text-center text-slate-500">Chưa có tài khoản? <a href="#" onclick="EP.tabAuth('dk');return false" class="text-brand-700 font-semibold">Đăng ký</a></p></form>`;
const formDangKy = trong => `<form class="card p-6 space-y-3" id="f-dk"><h2 class="font-bold text-lg">${trong ? 'Tạo tài khoản quản trị đầu tiên' : 'Đăng ký tài khoản'}</h2>
  ${trong ? '<p class="text-xs text-slate-500">CSDL đang trống. Tài khoản đầu tiên là Quản trị (BGH). Nếu trường đã dùng EduPlan cũ trên trình duyệt này, hãy chuyển dữ liệu trước (banner phía trên) để giữ tài khoản cũ.</p>' : ''}
  <div><label class="label">Họ và tên *</label><input name="ho_ten" class="input" required></div>
  <div class="grid grid-cols-2 gap-2"><div><label class="label">Email *</label><input name="email" type="email" class="input" required></div><div><label class="label">Mã giáo viên</label><input name="ma_gv" class="input"></div></div>
  ${trong ? '' : `<div class="grid grid-cols-2 gap-2"><div><label class="label">Vai trò</label><select name="vai_tro" class="input">${opt([['giao_vien', 'Giáo viên bộ môn'], ['to_truong', 'Tổ trưởng chuyên môn'], ['bgh', 'Ban Giám hiệu']], 'giao_vien')}</select></div>
  <div><label class="label">Tổ chuyên môn</label><select name="to" class="input">${opt(TO, 'Toán')}</select></div></div>`}
  <div><label class="label">Khối lớp phụ trách</label><input name="khoi" class="input" placeholder="vd: 6, 7"></div>
  <div class="grid grid-cols-2 gap-2"><div><label class="label">Mật khẩu * (≥ 8 ký tự)</label><input name="pw" type="password" minlength="8" class="input" required autocomplete="new-password"></div><div><label class="label">Nhập lại *</label><input name="pw2" type="password" minlength="8" class="input" required></div></div>
  <button class="btn btn-primary w-full">${ic('user-plus')}Tạo tài khoản</button>
  ${trong ? '' : '<p class="text-xs text-center text-slate-500"><a href="#" onclick="EP.tabAuth(\'dn\');return false" class="text-brand-700 font-semibold">Quay lại đăng nhập</a></p>'}</form>`;
function ganDangNhap() {
  $('#f-dn')?.addEventListener('submit', e => { e.preventDefault(); dangNhap(e.target.id.value, e.target.pw.value); });
  $('#f-dk')?.addEventListener('submit', e => { e.preventDefault(); dangKy(new FormData(e.target)); });
  hienBannerCu();
}
A.tabAuth = t => { S.tam.authTab = t; render(); };
async function dangNhap(id, pw) {
  const k = id.trim().toLowerCase();
  const u = S.kho.one('users', x => x.email?.toLowerCase() === k || x.ma_gv?.toLowerCase() === k);
  if (!u) return toast('Không tìm thấy tài khoản.', 'error');
  const v = await verifyPassword(pw, u.mat_khau_bam);
  if (!v.ok) return toast(u.phai_doi_mat_khau && u.mat_khau_bam.startsWith('djb2:') ? 'Mật khẩu không đúng. Tài khoản này cần Quản trị đặt lại mật khẩu.' : 'Mật khẩu không đúng.', 'error');
  if (u.trang_thai === 'locked') return toast('Tài khoản đã bị khóa.', 'error');
  if (u.trang_thai === 'pending') return toast('Tài khoản đang chờ Quản trị kích hoạt.', 'warn');
  if (v.bam_lai) { u.mat_khau_bam = await hashPassword(pw); await S.kho.put('users', u); await S.kho.log(u, 'Băm lại mật khẩu', u.email, 'Chuyển từ thuật toán EduPlan cũ sang PBKDF2'); }
  S.user = u; localStorage.setItem(SESSION(), u.id);
  await log('Đăng nhập', u.ho_ten);
  if (u.phai_doi_mat_khau) return doiMatKhau(true);
  render(); chaoMung();
}
A.dangNhapNhanh = email => dangNhap(email, MAT_KHAU_DEMO);
async function dangKy(f) {
  const d = Object.fromEntries(f), trong = !S.kho.all('users').length;
  if (d.pw !== d.pw2) return toast('Mật khẩu nhập lại không khớp.', 'warn');
  if (S.kho.one('users', u => u.email.toLowerCase() === d.email.toLowerCase())) return toast('Email đã tồn tại.', 'error');
  const vai_tro = trong ? 'admin' : d.vai_tro;
  const u = { id: uid('u'), ho_ten: d.ho_ten.trim(), email: d.email.trim(), ma_gv: (d.ma_gv || '').trim(), vai_tro, to_chuyen_mon: trong ? 'Ban Giám hiệu' : d.to, cap_hoc: '',
    khoi_phu_trach: String(d.khoi || '').split(/[,;\s]+/).filter(Boolean), chuc_danh: TEN_VAI_TRO[vai_tro], mat_khau_bam: await hashPassword(d.pw), phai_doi_mat_khau: false,
    trang_thai: trong || vai_tro === 'giao_vien' ? 'active' : 'pending', quyen_duyet: vai_tro !== 'giao_vien', nguon_du_lieu: 'moi' };
  await S.kho.put('users', u);
  await S.kho.log(u, 'Đăng ký', u.email, TEN_VAI_TRO[vai_tro]);
  if (u.trang_thai !== 'active') { S.tam.authTab = 'dn'; toast('Đã đăng ký. Tài khoản Tổ trưởng/BGH cần Quản trị kích hoạt.', 'warn'); return render(); }
  S.user = u; localStorage.setItem(SESSION(), u.id); toast('Đã tạo tài khoản.', 'success'); render(); chaoMung();
}
function doiMatKhau(batBuoc = false) {
  const m = modal(batBuoc ? 'Cần đổi mật khẩu' : 'Đổi mật khẩu', `<form id="f-pw" class="space-y-3">${batBuoc ? '<p class="text-sm text-amber-700">Tài khoản chuyển từ EduPlan cũ dùng kiểu mật khẩu cũ kém an toàn. Vui lòng đặt mật khẩu mới.</p>' : ''}
    <div><label class="label">Mật khẩu mới (≥ 8 ký tự)</label><input name="a" type="password" minlength="8" class="input" required></div><div><label class="label">Nhập lại</label><input name="b" type="password" minlength="8" class="input" required></div>
    <button class="btn btn-primary w-full">Lưu mật khẩu</button></form>`);
  m.querySelector('#f-pw').onsubmit = async e => { e.preventDefault(); if (e.target.a.value !== e.target.b.value) return toast('Không khớp.', 'warn');
    S.user.mat_khau_bam = await hashPassword(e.target.a.value); S.user.phai_doi_mat_khau = false; await S.kho.put('users', S.user); await log('Đổi mật khẩu', S.user.email); closeModal(); toast('Đã đổi mật khẩu.', 'success'); render(); };
}
A.doiMatKhau = () => doiMatKhau(false);
A.dangXuat = async () => { await log('Đăng xuất', S.user?.ho_ten); S.user = null; localStorage.removeItem(SESSION()); render(); };
A.doiCheDo = async (che = S.cheDo === 'demo' ? 'that' : 'demo') => {
  S.user = null; await moKho(che);
  if (che === 'demo' && !S.kho.all('users').length) await A.napMau();
  const id = localStorage.getItem(SESSION()); S.user = id ? S.kho.get('users', id) : null; render(); if (che === 'that') hienBannerCu();
};
A.doiVaiTro = async id => { const u = S.kho.get('users', id); if (!u) return; S.user = u; localStorage.setItem(SESSION(), id); await log('Đổi vai trò (trình diễn)', u.ho_ten); render(); };
A.napMau = async () => {
  if (S.cheDo !== 'demo') return toast('Chỉ nạp dữ liệu mẫu ở chế độ trình diễn.', 'warn');
  toast('Đang tạo dữ liệu trình diễn…');
  const d = await taoDuLieuMau({ yccdCua, nls: S.data.nls, ai: S.data.ai, plv: S.data.plv });
  await S.kho.clearAll(); await S.kho.putMany(d); toast('Đã nạp dữ liệu trình diễn.', 'success'); render();
};

// ------------------------------------------------------------------ Màn chào (1 lần)
function chaoMung() {
  if (localStorage.getItem('eduplan-khbd.da-chao')) return;
  const m = modal('EduPlan đã có thêm phần Soạn KHBD', `<div class="space-y-4 text-sm">
    <p class="text-slate-600">Mọi thao tác quen thuộc vẫn giữ nguyên: <b>Rà soát nhanh 5512</b>, <b>Gửi Tổ trưởng duyệt</b>, <b>ký duyệt cấp tổ</b>, <b>phê duyệt BGH</b>, phiếu nhận xét in A4.</p>
    <ol class="space-y-2">${[['file-plus-2', 'Soạn KHBD', 'Chọn môn, lớp, bài → chọn yêu cầu cần đạt → AI soạn nháp trọn bộ: KHBD, phiếu học tập, slide, câu hỏi đánh giá.'],
      ['scan-search', 'Rà soát nhất quán', 'Luật theo CV 5512/2345 gắn cờ 🔴🟡🟢 đúng vị trí; bấm vào cờ để sửa ngay.'], ['send', 'Nộp và duyệt', 'Tổ trưởng góp ý theo dòng, so sánh phiên bản; BGH phê duyệt; dự giờ theo PL V.']]
      .map(([i, t, d], k) => `<li class="flex gap-3"><span class="w-8 h-8 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">${ic(i)}</span><div><b>${k + 1}. ${t}</b><div class="text-slate-500">${d}</div></div></li>`).join('')}</ol>
    <div class="flex justify-end"><button class="btn btn-primary" data-ok>Bắt đầu</button></div></div>`);
  m.querySelector('[data-ok]').onclick = () => { localStorage.setItem('eduplan-khbd.da-chao', '1'); closeModal(); };
}

// ------------------------------------------------------------------ Trang chủ
function trangChu() {
  const ds = baiNhinThay(), u = S.user;
  const cua = ds.filter(l => l.giao_vien_id === u.id).sort((a, b) => (b.cap_nhat_luc || '').localeCompare(a.cap_nhat_luc || ''));
  const choDuyet = ds.filter(l => (quyen('duyet_to') && l.trang_thai === 'cho_to_duyet' && l.to === u.to_chuyen_mon) || (quyen('duyet_bgh') && l.trang_thai === 'cho_bgh_duyet'));
  const gopY = S.kho.where('reviews', r => cua.some(l => l.id === r.lesson_id) && (r.gop_y_theo_dong || []).some(g => g.trang_thai === 'mo'));
  const the = (icon, so, nhan, link) => `<a href="${link}" class="card p-4 hover:border-brand-300 block"><div class="flex items-center gap-2 text-xs font-semibold text-slate-500">${ic(icon)}${nhan}</div><div class="text-3xl font-extrabold mt-1">${so}</div></a>`;
  $('#main').innerHTML = `<div class="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h1 class="text-xl font-extrabold">Xin chào, ${esc(u.ho_ten)}</h1>
    <p class="text-sm text-slate-500">${esc(TEN_VAI_TRO[u.vai_tro])} · ${esc(u.to_chuyen_mon)}${S.cheDo === 'demo' ? ' · đang ở chế độ trình diễn' : ''}</p></div>
    <div class="flex gap-2">${quyen('soan') ? `<a href="#/soan" class="btn btn-primary">${ic('file-plus-2')}Soạn KHBD mới</a>` : ''}<a href="#/ra-soat-nhanh" class="btn btn-soft">${ic('scan-search')}Rà soát nhanh 5512</a></div></div>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">${the('files', cua.length, 'KHBD của tôi', '#/')}${the('hourglass', choDuyet.length, 'Chờ tôi duyệt', '#/duyet')}
    ${the('message-square-warning', gopY.length, 'Bài có góp ý chưa xử lý', '#/duyet')}${the('badge-check', ds.filter(l => l.trang_thai === 'da_duyet').length, 'KHBD đã duyệt (tôi thấy được)', '#/kho')}</div>
  ${choDuyet.length ? `<div class="card mb-5"><div class="px-4 py-3 border-b font-bold flex items-center gap-2">${ic('inbox', 'w-4 h-4 text-brand-600')}Chờ tôi duyệt</div>${bangBai(choDuyet, true)}</div>` : ''}
  <div class="card"><div class="px-4 py-3 border-b font-bold flex items-center gap-2">${ic('files', 'w-4 h-4 text-brand-600')}KHBD của tôi</div>${cua.length ? bangBai(cua) : `<div class="p-8 text-center text-sm text-slate-500">Chưa có KHBD. <a href="#/soan" class="text-brand-700 font-semibold">Soạn bài đầu tiên</a>.</div>`}</div>`;
}
function bangBai(ds, duyet = false) {
  return `<div class="overflow-x-auto"><table class="w-full tbl"><thead><tr><th>Bài dạy</th><th>Môn / Lớp</th><th>Giáo viên</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead><tbody>
  ${ds.map(l => { const t = TRANG_THAI[l.trang_thai] || TRANG_THAI.ban_nhap; return `<tr><td><a class="font-semibold text-brand-800 hover:underline" href="#/bai/${l.id}">${esc(l.ten_bai)}</a>
    ${l.nhan ? `<span class="badge bg-violet-100 text-violet-700 ml-1">${esc(l.nhan)}</span>` : ''}<div class="text-[11px] text-slate-500">${esc(l.bo_sach || '')} · v${l.phien_ban_hien_tai || 1}</div></td>
    <td class="whitespace-nowrap">${esc(l.mon)} ${esc(l.lop ?? '')}</td><td>${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || l.legacy?.teacherName || '—')}</td>
    <td><span class="badge ${t[1]}">${t[0]}</span></td><td class="whitespace-nowrap text-xs">${fmtD(l.cap_nhat_luc)}</td>
    <td class="text-right whitespace-nowrap">${duyet ? `<a class="btn btn-primary !py-1 text-xs" href="#/duyet/${l.id}">Duyệt</a>` : `<a class="btn btn-ghost !py-1 text-xs" href="#/bai/${l.id}">Mở</a>`}</td></tr>`; }).join('')}</tbody></table></div>`;
}

// ------------------------------------------------------------------ Cài đặt
A.caiDat = () => {
  const c = caiDatAI();
  const m = modal('Cài đặt', `<div class="space-y-4">
    <div><label class="label">Google Gemini API Key (để trống = Mock AI, không gửi dữ liệu ra ngoài)</label><input id="s-key" type="password" class="input" value="${esc(c.apiKey)}" placeholder="AIza…">
      <p class="text-[11px] text-slate-500 mt-1">Khóa chỉ lưu trên trình duyệt này. Khi bật, nội dung KHBD (không kèm họ tên) được gửi tới Google để soạn/rà soát.</p></div>
    <div><label class="label">Mô hình</label><select id="s-model" class="input">${opt(['gemini-2.5-flash', 'gemini-2.5-pro'], c.model)}</select></div>
    <div><label class="label">Tên trường (in trên KHBD, phiếu)</label><input id="s-truong" class="input" value="${esc(S.kho.setting('ten_truong', ''))}"></div>
    <div class="flex flex-wrap justify-between gap-2"><div class="flex gap-2"><button class="btn btn-ghost" data-test>${ic('plug-zap')}Kiểm tra kết nối</button><button class="btn btn-ghost" data-pw>${ic('key-round')}Đổi mật khẩu</button></div>
      <button class="btn btn-primary" data-save>${ic('save')}Lưu</button></div></div>`);
  m.querySelector('[data-test]').onclick = async () => { try { await kiemTraKetNoi(m.querySelector('#s-key').value.trim(), m.querySelector('#s-model').value); toast('Kết nối Gemini thành công.', 'success'); } catch (e) { toast('Lỗi: ' + e.message, 'error'); } };
  m.querySelector('[data-pw]').onclick = () => doiMatKhau(false);
  m.querySelector('[data-save]').onclick = async () => { luuCaiDatAI({ apiKey: m.querySelector('#s-key').value.trim(), model: m.querySelector('#s-model').value }); await S.kho.setSetting('ten_truong', m.querySelector('#s-truong').value.trim()); closeModal(); toast('Đã lưu cài đặt.', 'success'); render(); };
};

// ------------------------------------------------------------------ Di trú từ EduPlan cũ (mục 2B v1.1)
async function hienBannerCu() {
  if (S.cheDo !== 'that') return;
  const tt = S.kho.setting('di_tru_eduplan_cu');
  const cu = S.tam.khoCu ?? (S.tam.khoCu = await phatHienKhoCu().catch(() => null));
  const el = $('#banner-cu'); if (!el || !cu) return;
  if (tt?.luc) { const ke = xemTruoc(S.kho, cu.du_lieu); if (!Object.values(ke.ops).some(a => a.length)) return; }
  el.innerHTML = `<div class="bg-violet-50 border border-violet-200 text-violet-900 text-sm rounded-xl px-4 py-3 m-2 flex flex-wrap items-center gap-3">
    ${ic('archive-restore', 'w-5 h-5')}<span><b>Phát hiện dữ liệu EduPlan cũ</b> trên trình duyệt này (${Object.entries(cu.so_ban_ghi).map(([k, v]) => `${v} ${k}`).join(', ')}).</span>
    <button class="btn btn-primary !py-1 ml-auto" onclick="EP.moDiTru()">Chuyển dữ liệu EduPlan cũ sang bản mới</button></div>`;
  icons();
}
A.moDiTru = async () => {
  const cu = S.tam.khoCu || await phatHienKhoCu();
  if (!cu) return toast('Không tìm thấy dữ liệu EduPlan cũ trên trình duyệt này.', 'warn');
  const ke = xemTruoc(S.kho, cu.du_lieu);
  const TEN = { users: 'Người dùng', lesson_plans: 'Kế hoạch bài dạy', ai_audits: 'Kết quả AI', review_notes: 'Phiếu nhận xét', audit_logs: 'Nhật ký' };
  const m = modal('Chuyển dữ liệu EduPlan cũ sang bản mới', `<div class="space-y-3 text-sm">
    <p>Xem trước (chưa ghi gì). Nguồn: <b>${esc(cu.nguon)}</b>. Kho cũ được <b>giữ nguyên thêm 30 ngày</b> sau khi chuyển.</p>
    <table class="w-full tbl"><thead><tr><th>Bảng</th><th>Đọc</th><th>Sẽ ghi</th><th>Bỏ qua (dữ liệu mẫu)</th><th>Bỏ qua (đã có)</th><th>Lỗi</th></tr></thead><tbody>
    ${Object.entries(ke.baoCao).map(([b, r]) => `<tr><td>${TEN[b]}</td><td>${r.doc}</td><td><b>${r.ghi}</b></td><td>${r.bo_qua_mau}</td><td>${r.bo_qua_da_co}</td><td class="${r.loi ? 'text-rose-600 font-bold' : ''}">${r.loi}</td></tr>`).join('')}</tbody></table>
    ${ke.loi.length ? `<div class="bg-rose-50 text-rose-800 rounded-lg p-3">Có ${ke.loi.length} bản ghi lỗi → theo quy định, dừng lại để kiểm tra trước khi chuyển:<ul class="list-disc pl-5">${ke.loi.map(e => `<li>${esc(e.bang)} #${esc(e.legacy_id)}: ${esc(e.loi)}</li>`).join('')}</ul></div>` : ''}
    <ul class="text-xs text-slate-500 list-disc pl-5"><li>Trạng thái duyệt, người duyệt, thời điểm duyệt giữ nguyên; KHBD gắn nhãn "nhập từ EduPlan".</li><li>Tài khoản cũ đăng nhập bằng mật khẩu cũ; hệ thống tự băm lại an toàn hơn ở lần đầu.</li><li>Dữ liệu mẫu của bản cũ không chuyển (trừ khi đã được dùng thật).</li></ul>
    ${cu.api_key_cu ? '<label class="flex items-center gap-2"><input type="checkbox" id="mg-key"> Chuyển cả Gemini API key cũ (chỉ lưu trên trình duyệt này)</label>' : ''}
    <div class="flex justify-end gap-2"><button class="btn btn-ghost" data-dry>Ghi nhật ký dry-run</button><button class="btn btn-primary" data-go ${ke.loi.length || !Object.values(ke.ops).some(a => a.length) ? 'disabled' : ''}>Xác nhận chuyển</button></div></div>`, { size: 'max-w-3xl' });
  const nguoi = S.user || { ho_ten: 'Người dùng trình duyệt' };
  m.querySelector('[data-dry]').onclick = async () => { await diTru(S.kho, cu.du_lieu, { nguoiChay: nguoi, dryRun: true }); toast('Đã ghi nhật ký dry-run vào migration_logs.', 'success'); };
  m.querySelector('[data-go]').onclick = async () => {
    const kq = await diTru(S.kho, cu.du_lieu, { nguoiChay: nguoi, raSoat: raSoatSauDiTru });
    if (m.querySelector('#mg-key')?.checked) luuCaiDatAI({ ...caiDatAI(), apiKey: cu.api_key_cu });
    closeModal();
    toast(kq.log.ket_qua === 'thành công' ? `Đã chuyển xong (${kq.ops.lessons.length} KHBD, ${kq.ops.users.length} tài khoản). Đối soát khớp.` : `Kết quả: ${kq.log.ket_qua}`, kq.log.ket_qua === 'thành công' ? 'success' : 'warn');
    render();
  };
};

// ------------------------------------------------------------------ Khởi động
(async function boot() {
  try {
    await Promise.all([moKho(S.cheDo), taiDuLieuKhung()]);
    if (S.cheDo === 'demo' && !S.kho.all('users').length) await A.napMau();
    const id = localStorage.getItem(SESSION());
    const u = id && S.kho.get('users', id);
    if (u && u.trang_thai === 'active' && !u.phai_doi_mat_khau) S.user = u;
    await render();
    if (S.user) { hienBannerCu(); chaoMung(); }
  } catch (e) { console.error(e); $('#app').innerHTML = `<div class="p-8 text-rose-700">Không khởi động được: ${esc(e.message)}</div>`; }
})();
