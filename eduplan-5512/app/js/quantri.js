// P11 Kho KHBD của tổ · P12 Dashboard BGH · P13 Quản trị · P14 Chuyển dữ liệu (migration_logs, dry-run, báo cáo đối soát).
import { S, A, ve, boCua, ndCua, luuPhienBan, log, quyen, TRANG_THAI, TO, MON } from './state.js';
import { $, $$, esc, ic, icons, toast, modal, closeModal, fmtD, fmtDT, opt, download, confirmBox } from './ui.js';
import { RULES } from './rules.js';
import { TEN_VAI_TRO } from './auth.js';
import { uid, now } from './db.js';
import { phatHienKhoCu, xemTruoc, diTru, xoaKhoCu } from './legacy.js';
import { raSoatSauDiTru } from './state.js';
import { PROMPT_VERSION } from './llm.js';

// =========================================================== P11
export function kho() {
  const q = S.tam.kq ||= { tim: '', mon: '', lop: '', to: S.user.vai_tro === 'giao_vien' || S.user.vai_tro === 'to_truong' ? S.user.to_chuyen_mon : '' };
  const ds = S.kho.all('library').map(x => ({ x, l: S.kho.get('lessons', x.lesson_id) })).filter(({ l }) => l)
    .filter(({ x, l }) => (!q.to || x.to === q.to) && (!q.mon || l.mon === q.mon) && (!q.lop || String(l.lop) === q.lop) && (!q.tim || `${l.ten_bai} ${(x.the || []).join(' ')}`.toLowerCase().includes(q.tim.toLowerCase())));
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('library', 'w-5 h-5 text-brand-600')}Kho KHBD của tổ</h1>
  <p class="text-sm text-slate-500 mb-4">KHBD đã được BGH phê duyệt. Nhân bản làm điểm xuất phát cho bài của mình (bản sao là bản nháp mới, phải rà soát và nộp lại).</p>
  <div class="card p-3 mb-3 grid sm:grid-cols-4 gap-2"><input class="input" data-k="tim" placeholder="Tìm theo tên bài, thẻ…" value="${esc(q.tim)}"><select class="input" data-k="to">${opt(TO, q.to, 'Mọi tổ')}</select>
    <select class="input" data-k="mon">${opt(MON, q.mon, 'Mọi môn')}</select><select class="input" data-k="lop">${opt(Array.from({ length: 12 }, (_, i) => String(i + 1)), q.lop, 'Mọi lớp')}</select></div>
  <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">${ds.map(({ x, l }) => `<div class="card p-4 flex flex-col gap-2"><div class="flex justify-between gap-2"><b>${esc(l.ten_bai)}</b><span class="badge ${TRANG_THAI[l.trang_thai][1]}">${TRANG_THAI[l.trang_thai][0]}</span></div>
    <div class="text-xs text-slate-500">${esc(l.mon)} ${esc(l.lop)} · ${esc(l.bo_sach || '')} · Tổ ${esc(x.to)} · GV ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || '')}</div>
    <div class="flex flex-wrap gap-1">${(x.the || []).map(t => `<span class="badge bg-slate-100 text-slate-600">#${esc(t)}</span>`).join('')}</div><div class="text-xs text-slate-500">${x.luot_dung || 0} lượt dùng${x.danh_gia ? ` · ★ ${x.danh_gia}` : ''}</div>
    <div class="flex gap-2 mt-auto"><a class="btn btn-ghost !py-1 text-xs" href="#/bai/${l.id}/1">${ic('eye', 'w-3.5 h-3.5')}Xem</a>${quyen('soan') ? `<button class="btn btn-soft !py-1 text-xs" onclick="EP.nhanBan('${x.id}')">${ic('copy-plus', 'w-3.5 h-3.5')}Nhân bản làm bài mới</button>` : ''}</div></div>`).join('') || '<div class="card p-8 text-sm text-slate-500 md:col-span-3">Kho trống với bộ lọc này.</div>'}</div>`;
  $$('[data-k]').forEach(el => el.onchange = () => { q[el.dataset.k] = el.value; ve(); });
}
A.nhanBan = async libId => {
  const x = S.kho.get('library', libId), g = S.kho.get('lessons', x.lesson_id), bo = boCua(g.id), id = uid('l');
  const l = { ...JSON.parse(JSON.stringify(g)), id, ten_bai: `${g.ten_bai} (bản của ${S.user.ho_ten})`, trang_thai: 'ban_nhap', phien_ban_hien_tai: 0, giao_vien_id: S.user.id, to: S.user.to_chuyen_mon,
    nhan: null, nguon_ban_sao: g.id, nop_luc: null, duyet_luc: null, to_duyet_luc: null, so_vong_sua: 0, legacy: undefined, legacy_id: undefined, nguon_du_lieu: S.cheDo === 'demo' ? 'demo' : 'moi' };
  l.noi_dung.dieu_chinh = '';
  await S.kho.putMany({ worksheets: bo.worksheets.map(w => ({ ...w, id: uid('ws'), lesson_id: id })), slides: bo.slides ? [{ ...bo.slides, id: uid('sl'), lesson_id: id }] : [],
    assessments: bo.assessments ? [{ ...bo.assessments, id: uid('as'), lesson_id: id }] : [], integrations: bo.integrations.map(i => ({ ...i, id: uid('it'), lesson_id: id })) });
  await luuPhienBan(l, `Nhân bản từ kho: ${g.ten_bai}`);
  x.luot_dung = (x.luot_dung || 0) + 1; await S.kho.put('library', x);
  await log('Nhân bản KHBD từ kho', g.ten_bai); location.hash = `#/bai/${id}/1`;
};

// =========================================================== P12
export function dashboard() {
  if (!quyen('dashboard')) { $('#main').innerHTML = '<div class="card p-6">Chỉ Ban Giám hiệu xem Dashboard.</div>'; return; }
  const ls = S.kho.all('lessons'), nop = ls.filter(l => l.trang_thai !== 'ban_nhap'), duyet = ls.filter(l => ['da_duyet', 'da_day'].includes(l.trang_thai));
  const ngay = (a, b) => (new Date(b) - new Date(a)) / 864e5;
  const tg = duyet.filter(l => l.nop_luc && l.duyet_luc).map(l => ngay(l.nop_luc, l.duyet_luc));
  const coDo = nop.filter(l => l.co_do_khi_nop != null), vong = nop.map(l => l.so_vong_sua || 0);
  const it = S.kho.all('integrations'), coNLS = new Set(it.filter(x => x.loai === 'NLS').map(x => x.lesson_id)), coAI = new Set(it.filter(x => x.loai === 'AI').map(x => x.lesson_id));
  const obs = S.kho.all('observations'), xl = ['Giỏi', 'Khá', 'Trung bình', 'Không đạt'].map(k => [k, obs.filter(o => o.phieu_PLV.xep_loai === k).length]);
  const tb = a => (a.length ? (a.reduce((s, x) => s + x, 0) / a.length) : null);
  const f1 = v => (v == null ? '—' : v.toFixed(1));
  const theTo = [...new Set(ls.map(l => l.to).filter(Boolean))].map(t => { const a = ls.filter(l => l.to === t); return { t, tong: a.length, nop: a.filter(l => l.trang_thai !== 'ban_nhap').length, duyet: a.filter(l => ['da_duyet', 'da_day'].includes(l.trang_thai)).length,
    cho: a.filter(l => ['cho_to_duyet', 'cho_bgh_duyet'].includes(l.trang_thai)).length, sua: a.filter(l => l.trang_thai === 'yeu_cau_chinh_sua').length }; });
  const kpi = (i, n, v, s) => `<div class="card p-4"><div class="text-xs font-semibold text-slate-500 flex items-center gap-1">${ic(i)}${n}</div><div class="text-3xl font-extrabold mt-1">${v}</div><div class="text-[11px] text-slate-500">${s}</div></div>`;
  log('Xem dashboard', 'Toàn trường');
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('layout-dashboard', 'w-5 h-5 text-brand-600')}Dashboard BGH — quản trị chuyên môn</h1>
  <p class="text-sm text-slate-500 mb-4">Số liệu tính trực tiếp từ CSDL ${S.cheDo === 'demo' ? '<b>trình diễn</b>' : 'thật'} (${ls.length} KHBD).</p>
  <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
    ${kpi('badge-check', 'Tổng số giáo án đã duyệt', duyet.length, `trên ${nop.length} KHBD đã nộp`)}
    ${kpi('target', 'Tỷ lệ giáo án đạt chuẩn', nop.length ? `${((duyet.length / nop.length) * 100).toFixed(1)}%` : '—', 'đã duyệt / đã nộp')}
    ${kpi('timer', 'Thời gian nộp → duyệt TB', tg.length ? `${f1(tb(tg))} ngày` : '—', `${tg.length} bài có đủ mốc thời gian`)}
    ${kpi('repeat', 'Số vòng sửa TB', f1(tb(vong)), 'trước khi duyệt')}
    ${kpi('octagon-x', '% KHBD còn cờ đỏ khi nộp', coDo.length ? `${((coDo.filter(l => l.co_do_khi_nop > 0).length / coDo.length) * 100).toFixed(1)}%` : '—', `${coDo.length} lượt nộp có ghi nhận`)}
    ${kpi('cpu', 'Tích hợp năng lực số', ls.length ? `${((coNLS.size / ls.length) * 100).toFixed(0)}%` : '—', 'KHBD có mã NLS (CV 3456)')}
    ${kpi('brain', 'Tích hợp giáo dục AI', ls.length ? `${((coAI.size / ls.length) * 100).toFixed(0)}%` : '—', 'KHBD có YCCĐ AI (QĐ 2422)')}
    ${kpi('eye', 'Dự giờ (PL V)', obs.length, xl.filter(x => x[1]).map(([k, n]) => `${k} ${n}`).join(' · ') || 'chưa có')}</div>
  <div class="grid xl:grid-cols-2 gap-4"><div class="card p-4"><div class="font-bold mb-3">Tiến độ theo tổ chuyên môn</div>${theTo.map(x => `<div class="mb-3"><div class="flex justify-between text-sm"><b>${esc(x.t)}</b><span class="text-xs text-slate-500">${x.duyet}/${x.nop} đã duyệt · ${x.cho} chờ · ${x.sua} cần sửa</span></div>
      <div class="h-3 rounded-full bg-slate-100 overflow-hidden flex"><div class="bg-emerald-500" style="width:${x.tong ? (x.duyet / x.tong) * 100 : 0}%"></div><div class="bg-sky-400" style="width:${x.tong ? (x.cho / x.tong) * 100 : 0}%"></div><div class="bg-rose-400" style="width:${x.tong ? (x.sua / x.tong) * 100 : 0}%"></div></div></div>`).join('') || '<p class="text-sm text-slate-500">Chưa có dữ liệu.</p>'}
      <div class="flex gap-3 text-[11px] text-slate-500"><span>■ <span class="text-emerald-600">đã duyệt</span></span><span>■ <span class="text-sky-500">chờ duyệt</span></span><span>■ <span class="text-rose-500">cần sửa</span></span></div></div>
    <div class="card p-4"><div class="font-bold mb-3">Nhật ký gần đây</div><div class="max-h-80 overflow-y-auto text-xs space-y-1.5">${S.kho.all('activity_logs').slice().sort((a, b) => b.luc.localeCompare(a.luc)).slice(0, 25)
      .map(g => `<div class="flex gap-2"><span class="text-slate-400 w-28 shrink-0">${fmtDT(g.luc)}</span><span><b>${esc(g.nguoi)}</b> — ${esc(g.hanh_dong)} <span class="text-slate-500">${esc(g.doi_tuong)}</span></span></div>`).join('')}</div></div></div>`;
}

// =========================================================== P13
export function quanTri(tab = 'nguoi-dung') {
  if (!quyen('quan_tri')) { $('#main').innerHTML = '<div class="card p-6">Chỉ Quản trị truy cập.</div>'; return; }
  const tabs = [['nguoi-dung', 'users', 'Người dùng'], ['luat', 'list-checks', 'Luật rà soát'], ['prompt', 'file-code-2', 'Phiên bản prompt'], ['sao-luu', 'hard-drive-download', 'Sao lưu / khôi phục'], ['nhat-ky', 'scroll-text', 'Nhật ký'], ['di-tru', 'archive-restore', 'Chuyển dữ liệu (P14)']];
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-3 flex items-center gap-2">${ic('settings-2', 'w-5 h-5 text-brand-600')}Quản trị</h1>
  <div class="flex gap-1 border-b mb-4 overflow-x-auto">${tabs.map(([k, i, n]) => `<a href="#/${k === 'di-tru' ? 'di-tru' : 'quan-tri/' + k}" class="px-3 py-2 text-sm font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap ${tab === k ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500'}">${ic(i, 'w-3.5 h-3.5')}${n}</a>`).join('')}</div><div id="qt"></div>`;
  const el = $('#qt');
  if (tab === 'nguoi-dung') el.innerHTML = `<div class="card overflow-x-auto"><table class="w-full tbl"><thead><tr><th>Người dùng</th><th>Vai trò</th><th>Tổ / Khối</th><th>Quyền duyệt</th><th>Trạng thái</th><th>Nguồn</th><th></th></tr></thead><tbody>
    ${S.kho.all('users').map(u => `<tr><td><b>${esc(u.ho_ten)}</b><div class="text-[11px] text-slate-500">${esc(u.email)} · ${esc(u.ma_gv || '')}</div>${u.phai_doi_mat_khau ? '<span class="badge bg-amber-100 text-amber-800">phải đổi mật khẩu</span>' : ''}</td>
      <td><select class="input !py-1 text-xs" data-u="${u.id}" data-f="vai_tro" ${u.id === S.user.id ? 'disabled' : ''}>${opt(Object.entries(TEN_VAI_TRO), u.vai_tro)}</select></td>
      <td><select class="input !py-1 text-xs" data-u="${u.id}" data-f="to_chuyen_mon">${opt(['Ban Giám hiệu', ...TO], u.to_chuyen_mon)}</select><div class="text-[11px] text-slate-500">Khối ${esc((u.khoi_phu_trach || []).join(', ') || '—')}</div></td>
      <td><input type="checkbox" class="accent-brand-600" data-u="${u.id}" data-f="quyen_duyet" ${u.quyen_duyet ? 'checked' : ''}></td>
      <td>${u.trang_thai === 'active' ? '<span class="badge bg-emerald-100 text-emerald-700">Hoạt động</span>' : u.trang_thai === 'pending' ? '<span class="badge bg-amber-100 text-amber-700">Chờ kích hoạt</span>' : '<span class="badge bg-rose-100 text-rose-700">Đã khóa</span>'}</td>
      <td class="text-xs">${u.nguon_du_lieu === 'eduplan_cu' ? '<span class="badge bg-violet-100 text-violet-700">EduPlan cũ</span>' : esc(u.nguon_du_lieu || 'mới')}</td>
      <td class="text-right whitespace-nowrap">${u.id === S.user.id ? '' : `<button class="btn btn-ghost !py-1 text-xs" onclick="EP.ttUser('${u.id}','${u.trang_thai === 'active' ? 'locked' : 'active'}')">${u.trang_thai === 'active' ? 'Khóa' : 'Kích hoạt'}</button>
        <button class="btn btn-ghost !py-1 text-xs" onclick="EP.datLaiMK('${u.id}')" title="Đặt mật khẩu tạm và bắt đổi ở lần đăng nhập sau">${ic('key-round', 'w-3.5 h-3.5')}</button>`}</td></tr>`).join('')}</tbody></table></div>`;
  if (tab === 'luat') el.innerHTML = `<div class="card overflow-x-auto"><table class="w-full tbl"><thead><tr><th>Bật</th><th>Mã</th><th>Mức</th><th>Nội dung kiểm</th><th>Nguồn</th><th>Cách kiểm</th></tr></thead><tbody>
    ${RULES.map(r => { const bat = S.kho.get('rules', r.id)?.bat !== false; return `<tr><td><input type="checkbox" class="accent-brand-600" data-rule="${r.id}" ${bat ? 'checked' : ''}></td><td class="font-semibold">${r.id}</td><td>${{ do: '🔴', vang: '🟡', xanh: '🟢' }[r.muc]}</td>
      <td>${esc(r.mo_ta)}</td><td class="text-xs">${esc(r.nguon)}</td><td class="text-xs">${r.cach_kiem}</td></tr>`; }).join('')}</tbody></table></div>`;
  if (tab === 'prompt') el.innerHTML = `<div class="card p-4 text-sm space-y-2">${Object.entries(PROMPT_VERSION).map(([k, v]) => `<div><code>${k}</code> → <b>${v}</b></div>`).join('')}
    <p class="text-xs text-slate-500">Prompt nằm trong <code>app/js/llm.js</code>, mỗi lần đổi nội dung tăng số phiên bản. Mọi KHBD AI soạn lưu kèm tên engine + phiên bản prompt (trường <code>ai_de_xuat.engine</code>).</p></div>`;
  if (tab === 'sao-luu') el.innerHTML = `<div class="grid md:grid-cols-2 gap-4"><div class="card p-4 space-y-2"><div class="font-bold">Sao lưu</div><p class="text-xs text-slate-500">CSDL ${S.cheDo === 'demo' ? 'trình diễn' : 'thật'} · ${(S.kho.sizeBytes() / 1024).toFixed(0)} KB</p>
      <button class="btn btn-primary" onclick="EP.saoLuu()">${ic('download')}Tải bản sao lưu JSON</button></div>
    <div class="card p-4 space-y-2"><div class="font-bold">Khôi phục / nhập</div><p class="text-xs text-slate-500">Nhận tệp sao lưu của bản mới, hoặc tệp do <code>migrate_eduplan.py</code> tạo từ bản sao lưu EduPlan cũ (gộp, không nhân đôi theo legacy_id).</p>
      <label class="btn btn-soft cursor-pointer">${ic('upload')}Chọn tệp JSON<input type="file" accept=".json" class="hidden" id="nhap"></label></div>
    ${S.cheDo === 'demo' ? `<div class="card p-4 space-y-2"><div class="font-bold">Dữ liệu trình diễn</div><button class="btn btn-ghost" onclick="EP.napMau()">${ic('database-zap')}Nạp lại dữ liệu trình diễn</button></div>` : ''}</div>`;
  if (tab === 'nhat-ky') el.innerHTML = `<div class="card overflow-x-auto max-h-[70vh]"><table class="w-full tbl"><thead><tr><th>Thời gian</th><th>Người</th><th>Hành động</th><th>Đối tượng</th><th>Chi tiết</th></tr></thead><tbody>
    ${S.kho.all('activity_logs').slice().sort((a, b) => b.luc.localeCompare(a.luc)).slice(0, 500).map(g => `<tr><td class="text-xs whitespace-nowrap">${fmtDT(g.luc)}</td><td class="text-xs">${esc(g.nguoi)}${g.nguon_du_lieu === 'eduplan_cu' ? ' <span class="badge bg-violet-100 text-violet-700">cũ</span>' : ''}</td><td><span class="badge bg-slate-100 text-slate-700">${esc(g.hanh_dong)}</span></td><td class="text-xs">${esc(g.doi_tuong)}</td><td class="text-xs text-slate-500">${esc(g.chi_tiet)}</td></tr>`).join('')}</tbody></table></div>`;
  $$('[data-u]').forEach(c => c.onchange = async () => { const u = S.kho.get('users', c.dataset.u); u[c.dataset.f] = c.type === 'checkbox' ? c.checked : c.value; await S.kho.put('users', u); await log('Cập nhật người dùng', u.ho_ten, `${c.dataset.f}=${u[c.dataset.f]}`); toast('Đã cập nhật.', 'success'); });
  $$('[data-rule]').forEach(c => c.onchange = async () => { await S.kho.put('rules', { id: c.dataset.rule, bat: c.checked }); await log(c.checked ? 'Bật luật' : 'Tắt luật', c.dataset.rule); toast('Đã cập nhật luật.', 'success'); });
  const nhap = $('#nhap'); if (nhap) nhap.onchange = () => nhapTep(nhap.files[0]);
  icons();
}
A.ttUser = async (id, tt) => { const u = S.kho.get('users', id); u.trang_thai = tt; await S.kho.put('users', u); await log(tt === 'locked' ? 'Khóa tài khoản' : 'Kích hoạt tài khoản', u.ho_ten); ve(); };
A.datLaiMK = async id => {
  const u = S.kho.get('users', id), tam = Math.random().toString(36).slice(2, 10);
  const { hashPassword } = await import('./auth.js');
  u.mat_khau_bam = await hashPassword(tam); u.phai_doi_mat_khau = true; await S.kho.put('users', u); await log('Đặt lại mật khẩu', u.ho_ten);
  modal('Mật khẩu tạm', `<p class="text-sm">Mật khẩu tạm của <b>${esc(u.ho_ten)}</b>: <code class="text-lg">${tam}</code></p><p class="text-xs text-slate-500 mt-2">Gửi riêng cho giáo viên; hệ thống bắt đổi ở lần đăng nhập sau.</p>`);
};
A.saoLuu = async () => { download(`EduPlanKHBD_${S.cheDo}_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(S.kho.exportAll(), null, 1), 'application/json'); await log('Sao lưu', 'Toàn bộ CSDL', 'JSON'); };
async function nhapTep(file) {
  if (!file) return;
  let d; try { d = JSON.parse(await file.text()); } catch { return toast('Tệp không phải JSON hợp lệ.', 'error'); }
  const t = d.tables || {};
  if (d.loai === 'di_tru_eduplan_cu') {
    const daCo = s => new Set(S.kho.where(s, r => r.nguon_du_lieu === 'eduplan_cu').map(r => r.legacy_id));
    const moi = Object.fromEntries(Object.entries(t).map(([s, arr]) => [s, arr.filter(r => !daCo(s).has(r.legacy_id))]));
    if (!(await confirmBox(`Nhập dữ liệu di trú từ "${file.name}": ${Object.entries(moi).map(([s, a]) => `${s} ${a.length}`).join(', ')} bản ghi mới (bỏ qua bản đã có).`, 'Nhập'))) return;
    await S.kho.putMany(moi); await S.kho.putMany({ migration_logs: (d.migration_logs || []).map(m => ({ id: uid('mig'), ...m, nguon: `${m.nguon || ''} (migrate_eduplan.py)` })) });
    await S.kho.putMany({ audits: (moi.lessons || []).map(l => raSoatSauDiTru(S.kho.get('lessons', l.id))) });
    await log('Nhập di trú (Python)', file.name); toast('Đã nhập dữ liệu di trú.', 'success'); return ve();
  }
  if (!(await confirmBox(`Khôi phục từ "${file.name}" sẽ THAY TOÀN BỘ CSDL ${S.cheDo === 'demo' ? 'trình diễn' : 'thật'} hiện tại. Nên sao lưu trước. Tiếp tục?`, 'Khôi phục'))) return;
  const me = S.user; await S.kho.importAll(d, { thayThe: true }); S.user = S.kho.get('users', me.id) || null;
  await log('Khôi phục CSDL', file.name); toast('Đã khôi phục.', 'success'); ve();
}

// =========================================================== P14 — Chuyển dữ liệu
export async function diTruView() {
  if (!quyen('di_tru')) { $('#main').innerHTML = '<div class="card p-6">Chỉ Quản trị truy cập.</div>'; return; }
  quanTri('di-tru');
  const tt = S.kho.setting('di_tru_eduplan_cu'), logs = S.kho.all('migration_logs').slice().sort((a, b) => b.luc.localeCompare(a.luc));
  const cu = S.tam.khoCu ?? (S.tam.khoCu = await phatHienKhoCu().catch(() => null));
  const TEN = { users: 'Người dùng', lesson_plans: 'KHBD', ai_audits: 'Kết quả AI', review_notes: 'Phiếu nhận xét', audit_logs: 'Nhật ký' };
  $('#qt').innerHTML = `<div class="grid md:grid-cols-3 gap-3 mb-4">
    <div class="card p-4 text-sm"><div class="font-bold mb-1">Kho EduPlan cũ trên trình duyệt này</div>${cu ? `${esc(cu.nguon)}: ${Object.entries(cu.so_ban_ghi).map(([k, v]) => `${TEN[k]} ${v}`).join(', ')}` : 'Không phát hiện (hoặc đã xóa).'}</div>
    <div class="card p-4 text-sm"><div class="font-bold mb-1">Trạng thái</div>${tt ? `Đã chuyển lúc ${fmtDT(tt.luc)}<br>Giữ kho cũ đến <b>${fmtD(tt.giu_kho_cu_den)}</b>${tt.da_xoa_kho_cu_luc ? `<br>Đã xóa kho cũ ${fmtDT(tt.da_xoa_kho_cu_luc)}` : ''}` : 'Chưa chuyển.'}</div>
    <div class="card p-4 text-sm flex flex-col gap-2"><button class="btn btn-soft" onclick="EP.dryRun()" ${cu ? '' : 'disabled'}>${ic('flask-conical')}Chạy lại --dry-run</button><button class="btn btn-primary" onclick="EP.moDiTru()" ${cu ? '' : 'disabled'}>${ic('archive-restore')}Chuyển dữ liệu</button>
      <button class="btn btn-danger" onclick="EP.xoaCu()" ${tt && !tt.da_xoa_kho_cu_luc ? '' : 'disabled'}>${ic('trash-2')}Xóa kho cũ (sau 30 ngày)</button></div></div>
  <div class="card overflow-x-auto"><div class="px-4 py-3 border-b font-bold">migration_logs (${logs.length})</div><table class="w-full tbl"><thead><tr><th>Lúc</th><th>Loại</th><th>Người chạy</th><th>Kết quả</th><th>Đọc / ghi / bỏ qua / lỗi theo bảng</th><th></th></tr></thead><tbody>
  ${logs.map(m => `<tr><td class="text-xs whitespace-nowrap">${fmtDT(m.luc)}</td><td>${m.dry_run ? '<span class="badge bg-slate-100">dry-run</span>' : '<span class="badge bg-brand-100 text-brand-800">thật</span>'}<div class="text-[10px] text-slate-500">${esc(m.nguon || '')}</div></td><td class="text-xs">${esc(m.nguoi_chay)}</td>
    <td class="text-xs">${esc(m.ket_qua || '')}${m.doi_soat ? `<br>Đối soát: ${m.doi_soat.mau.length} mẫu, ${m.doi_soat.lech.length} lệch` : ''}</td>
    <td class="text-[11px]">${Object.entries(m.bao_cao || {}).map(([b, r]) => `${TEN[b] || b}: ${r.doc}/${r.ghi}/${r.bo_qua_mau + r.bo_qua_da_co}/${r.loi}`).join('<br>')}</td>
    <td><button class="btn btn-ghost !py-1 text-xs" onclick="EP.taiBaoCao('${m.id}')">${ic('download', 'w-3.5 h-3.5')}Báo cáo</button></td></tr>`).join('') || '<tr><td colspan="6" class="text-center text-slate-500 py-6">Chưa có lần chạy nào.</td></tr>'}</tbody></table></div>`;
  icons();
}
A.dryRun = async () => { const cu = S.tam.khoCu || await phatHienKhoCu(); if (!cu) return; await diTru(S.kho, cu.du_lieu, { nguoiChay: S.user, dryRun: true }); toast('Đã chạy dry-run (không ghi dữ liệu).', 'success'); ve(); };
A.xoaCu = async () => { if (!(await confirmBox('Xóa vĩnh viễn kho EduPlan cũ trên trình duyệt này?', 'Xóa'))) return; try { await xoaKhoCu(S.kho); S.tam.khoCu = null; await log('Xóa kho EduPlan cũ', 'trình duyệt'); toast('Đã xóa kho cũ.', 'success'); ve(); } catch (e) { toast(e.message, 'warn'); } };
A.taiBaoCao = id => { const m = S.kho.get('migration_logs', id); download(`doi-soat-di-tru_${m.luc.slice(0, 10)}.json`, JSON.stringify(m, null, 1), 'application/json'); };
