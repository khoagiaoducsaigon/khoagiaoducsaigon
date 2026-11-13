// P2 Thiết lập bài · P3–P8 Không gian soạn 5 bước (KHBD → Phiếu → Slide → Đánh giá → Rà soát) + P7 Tích hợp · Rà soát nhanh 5512 (luồng EduPlan cũ).
import { S, A, ve, yccdCua, yccdDaChon, boCua, ndCua, raSoat, luuBai, luuPhienBan, log, quyen, TRANG_THAI, MON, BO_SACH, toCuaMon } from './state.js';
import { $, $$, esc, ic, icons, toast, modal, closeModal, opt, gauge, MUC, fmtDT, confirmBox } from './ui.js';
import { LOAI_HD, BUOC, TEN_KHUNG, khungTheoLop, khungTrong, mucTieuDong, parseText, capHoc } from './khung.js';
import { runRules, bangKiem4Buoc, overlap } from './rules.js';
import { soanTronBoAI, raSoatLLM, cheDoAI } from './llm.js';
import { soanPhieu, soanSlide, soanDanhGia, goiYTichHop } from './gen.js';
import { uid, now } from './db.js';
import { xuatKHBD, xuatPhieu, xuatSlide, xuatDanhGia } from './export.js';

const getP = (o, p) => p.split('.').reduce((x, k) => x?.[k], o);
const setP = (o, p, v) => { const ks = p.split('.'); const last = ks.pop(); ks.reduce((x, k) => (x[k] ??= {}), o)[last] = v; };
const BUOC_SOAN = [['1', 'Bước 1 — Soạn KHBD', 'file-text'], ['2', 'Bước 2 — Phiếu học tập', 'clipboard-list'], ['3', 'Bước 3 — Slide', 'presentation'],
  ['4', 'Bước 4 — Đánh giá', 'list-checks'], ['tich-hop', 'Năng lực số & AI', 'cpu'], ['5', 'Bước 5 — Rà soát nhất quán', 'scan-search']];
const buocCuaViTri = v => (/^worksheets/.test(v) ? '2' : /^slides/.test(v) ? '3' : /^assessments/.test(v) ? '4' : /^integrations/.test(v) ? 'tich-hop' : '1');

// =========================================================== P2 — Thiết lập bài
export async function thietLap() {
  if (!quyen('soan')) { $('#main').innerHTML = '<div class="card p-6">Vai trò hiện tại không soạn bài.</div>'; return; }
  const f = S.tam.tl ||= { mon: S.user.to_chuyen_mon && MON.includes(S.user.to_chuyen_mon) ? S.user.to_chuyen_mon : 'Toán', lop: S.user.khoi_phu_trach?.[0] || '6', bo_sach: BO_SACH[0], hoc_ky: 'Học kỳ I', ten_bai: '', so_tiet: 2, chon: [] };
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('file-plus-2', 'w-5 h-5 text-brand-600')}Thiết lập bài dạy</h1>
  <p class="text-sm text-slate-500 mb-4">Chọn bài và yêu cầu cần đạt (YCCĐ) của CT GDPT 2018 — mục tiêu KHBD sẽ bám đúng các YCCĐ này. Khung tự chọn theo cấp: ${esc(TEN_KHUNG['PL3-2345'])} (TH) hoặc ${esc(TEN_KHUNG['PL4-5512'])}.</p>
  <div class="grid xl:grid-cols-[360px_1fr] gap-5">
    <section class="card p-4 space-y-3 h-fit">
      <div><label class="label">Tên bài dạy *</label><input id="tl-ten" class="input" value="${esc(f.ten_bai)}" placeholder="vd: Hình chóp tam giác đều"></div>
      <div class="grid grid-cols-2 gap-2"><div><label class="label">Môn học</label><select id="tl-mon" class="input">${opt(MON, f.mon)}</select></div>
        <div><label class="label">Lớp</label><select id="tl-lop" class="input">${opt(Array.from({ length: 12 }, (_, i) => [String(i + 1), `Lớp ${i + 1} (${capHoc(i + 1)})`]), f.lop)}</select></div></div>
      <div class="grid grid-cols-2 gap-2"><div><label class="label">Bộ sách</label><select id="tl-sach" class="input">${opt(BO_SACH, f.bo_sach)}</select></div>
        <div><label class="label">Học kỳ</label><select id="tl-hk" class="input">${opt(['Học kỳ I', 'Học kỳ II'], f.hoc_ky)}</select></div></div>
      <div><label class="label">Số tiết</label><input id="tl-tiet" type="number" min="1" max="10" class="input" value="${f.so_tiet}"></div>
      <div class="text-xs bg-brand-50 text-brand-800 rounded-lg p-2">Khung: <b>${esc(TEN_KHUNG[khungTheoLop(f.lop)])}</b></div>
      <div class="flex flex-col gap-2 pt-1"><button class="btn btn-primary" id="tl-ai">${ic('sparkles')}Tạo bài & AI soạn nháp trọn bộ</button>
        <button class="btn btn-ghost" id="tl-trong">${ic('file')}Tạo bài trống (tự soạn)</button>
        <p class="text-[11px] text-slate-500">${cheDoAI() === 'gemini' ? 'Đang dùng Gemini (nội dung không kèm họ tên).' : 'Đang dùng Mock AI Sư phạm — không gửi dữ liệu ra ngoài.'} AI chỉ đề xuất, thầy cô quyết định.</p></div>
    </section>
    <section class="card p-4"><div class="flex flex-wrap items-center gap-2 mb-3"><h2 class="font-bold">Yêu cầu cần đạt — ${esc(f.mon)} lớp ${esc(f.lop)}</h2><span class="badge bg-brand-100 text-brand-800" id="tl-dem">${f.chon.length} đã chọn</span>
      <input id="tl-tim" class="input !w-64 ml-auto" placeholder="Lọc YCCĐ theo từ khóa…" value="${esc(S.tam.tlTim || '')}"></div><div id="tl-ds" class="max-h-[62vh] overflow-y-auto space-y-1 text-sm">Đang tải YCCĐ…</div></section>
  </div>`;
  const doc = () => Object.assign(f, { ten_bai: $('#tl-ten').value.trim(), mon: $('#tl-mon').value, lop: $('#tl-lop').value, bo_sach: $('#tl-sach').value, hoc_ky: $('#tl-hk').value, so_tiet: +$('#tl-tiet').value || 1 });
  ['#tl-mon', '#tl-lop'].forEach(s => $(s).onchange = () => { doc(); f.chon = []; ve(); });
  ['#tl-ten', '#tl-sach', '#tl-hk', '#tl-tiet'].forEach(s => $(s).onchange = () => { doc(); if (s === '#tl-ten') veYCCD(); });
  $('#tl-tim').oninput = e => { S.tam.tlTim = e.target.value; veYCCD(); };
  const ds = await yccdCua(f.mon, f.lop);
  function veYCCD() {
    const q = (S.tam.tlTim || '').toLowerCase();
    const xep = ds.map(y => ({ y, d: f.ten_bai ? overlap(f.ten_bai, `${y.noi_dung} ${y.yccd}`) : 0 })).filter(({ y }) => !q || `${y.mach} ${y.noi_dung} ${y.yccd}`.toLowerCase().includes(q))
      .sort((a, b) => b.d - a.d || a.y.id.localeCompare(b.y.id));
    $('#tl-ds').innerHTML = xep.length ? xep.slice(0, 300).map(({ y, d }) => `<label class="flex gap-2 p-2 rounded-lg hover:bg-slate-50 ${f.chon.includes(y.id) ? 'bg-brand-50' : ''}">
      <input type="checkbox" class="mt-1 accent-brand-600" data-y="${y.id}" ${f.chon.includes(y.id) ? 'checked' : ''}>
      <span><span class="text-[11px] text-slate-500">${esc(y.mach)}${y.noi_dung ? ' › ' + esc(y.noi_dung) : ''}${d >= 0.5 ? ' · <b class="text-emerald-700">gợi ý theo tên bài</b>' : ''}</span><br>${esc(y.yccd)}</span></label>`).join('')
      : `<p class="text-slate-500 p-4">Không có YCCĐ cho ${esc(f.mon)} lớp ${esc(f.lop)} trong dữ liệu CT 2018 đã tách. Vẫn có thể tạo bài và tự nhập mục tiêu (luật MT-01 sẽ nhắc).</p>`;
    $$('#tl-ds [data-y]').forEach(c => c.onchange = () => { const id = c.dataset.y; f.chon = c.checked ? [...f.chon, id] : f.chon.filter(x => x !== id); $('#tl-dem').textContent = `${f.chon.length} đã chọn`; c.closest('label').classList.toggle('bg-brand-50', c.checked); });
  }
  veYCCD();
  const tao = async ai => {
    doc();
    if (!f.ten_bai) return toast('Nhập tên bài dạy.', 'warn');
    if (ai && !f.chon.length && !(await confirmBox('Chưa chọn YCCĐ nào. AI sẽ soạn với mục tiêu chung chung và luật MT-01 sẽ gắn cờ đỏ. Vẫn tiếp tục?', 'Tiếp tục'))) return;
    const yccd = ds.filter(y => f.chon.includes(y.id));
    const meta = { ten_bai: f.ten_bai, mon: f.mon, lop: +f.lop, bo_sach: f.bo_sach, so_tiet: f.so_tiet };
    $('#tl-ai').disabled = true; $('#tl-ai').innerHTML = `${ic('loader-2', 'w-4 h-4 spin')}Đang soạn…`; icons();
    const lesson = { id: uid('l'), ...meta, cap_hoc: capHoc(f.lop), hoc_ky: f.hoc_ky, nam_hoc: '2026 – 2027', khung: khungTheoLop(f.lop), yccd_ids: f.chon, noi_dung: khungTrong(khungTheoLop(f.lop)),
      trang_thai: 'ban_nhap', phien_ban_hien_tai: 0, giao_vien_id: S.user.id, to: capHoc(f.lop) === 'TH' && S.user.to_chuyen_mon === 'Tiểu học' ? 'Tiểu học' : (S.user.to_chuyen_mon && S.user.to_chuyen_mon !== 'Ban Giám hiệu' ? S.user.to_chuyen_mon : toCuaMon(f.mon)),
      so_vong_sua: 0, nguon_du_lieu: S.cheDo === 'demo' ? 'demo' : 'moi' };
    if (ai) {
      const { bo, engine, canh_bao } = await soanTronBoAI(meta, yccd, S.data.nls, S.data.ai);
      if (canh_bao) toast(canh_bao, 'warn');
      lesson.noi_dung = bo.nd; lesson.ai_de_xuat = { engine, luc: now(), da_chap_nhan: false };
      await luuBo(lesson.id, bo);
      await log('Soạn bài (AI)', lesson.ten_bai, engine);
    } else await log('Tạo bài', lesson.ten_bai);
    await luuPhienBan(lesson, ai ? 'Bản nháp AI soạn' : 'Tạo mới');
    S.tam.tl = null; location.hash = `#/bai/${lesson.id}/1`;
  };
  $('#tl-ai').onclick = () => tao(true); $('#tl-trong').onclick = () => tao(false);
}
async function luuBo(lessonId, bo) {
  const k = S.kho, cu = boCua(lessonId);
  for (const w of cu.worksheets) await k.del('worksheets', w.id);
  for (const x of cu.integrations) await k.del('integrations', x.id);
  await k.putMany({
    worksheets: (bo.worksheets || []).map((w, i) => ({ id: uid('ws'), lesson_id: lessonId, thu_tu: i, ...w })),
    slides: bo.slides ? [{ id: cu.slides?.id || uid('sl'), lesson_id: lessonId, ...bo.slides }] : [],
    assessments: bo.assessments ? [{ id: cu.assessments?.id || uid('as'), lesson_id: lessonId, ...bo.assessments }] : [],
    integrations: (bo.integrations || []).map(x => ({ id: uid('it'), lesson_id: lessonId, ...x }))
  });
}

// =========================================================== Không gian soạn 5 bước
const suaDuoc = l => (l.giao_vien_id === S.user.id || quyen('quan_tri')) && ['ban_nhap', 'yeu_cau_chinh_sua'].includes(l.trang_thai);
export async function khongGian(id, buoc = '1') {
  const l = S.kho.get('lessons', id);
  if (!l) { $('#main').innerHTML = '<div class="card p-6">Không tìm thấy bài dạy (có thể thuộc CSDL khác: dữ liệu thật / trình diễn).</div>'; return; }
  const nd = ndCua(l), edit = suaDuoc(l), r = await raSoat(l);
  S.tam.r = r;
  const doTheoBuoc = {}; r.flags.forEach(f => { const b = buocCuaViTri(f.vi_tri || ''); (doTheoBuoc[b] ||= []).push(f); });
  const gopY = S.kho.where('reviews', x => x.lesson_id === l.id).flatMap(x => (x.gop_y_theo_dong || []).map(g => ({ ...g, review_id: x.id, cap: x.cap })));
  const t = TRANG_THAI[l.trang_thai] || TRANG_THAI.ban_nhap;
  $('#main').innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3 mb-4">
    <div><div class="flex flex-wrap items-center gap-2"><h1 class="text-xl font-extrabold">${esc(l.ten_bai)}</h1><span class="badge ${t[1]}">${t[0]}</span>${l.nhan ? `<span class="badge bg-violet-100 text-violet-700">${esc(l.nhan)}</span>` : ''}
      ${l.ai_de_xuat && !l.ai_de_xuat.da_chap_nhan ? `<span class="badge bg-amber-100 text-amber-800" title="${esc(l.ai_de_xuat.engine)}">${ic('sparkles', 'w-3 h-3')}Nội dung AI đề xuất — chờ GV chấp nhận</span>` : ''}</div>
      <p class="text-sm text-slate-500">${esc(l.mon)} ${esc(l.lop ?? '')} · ${esc(l.bo_sach || '')} · ${l.so_tiet || '?'} tiết · ${esc(TEN_KHUNG[nd.khung])} · v${l.phien_ban_hien_tai || 1} · GV ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || l.legacy?.teacherName || '—')}</p></div>
    <div class="flex flex-wrap gap-2">${l.ai_de_xuat && !l.ai_de_xuat.da_chap_nhan && edit ? `<button class="btn btn-soft" onclick="EP.chapNhanAI('${l.id}')">${ic('check-check')}Chấp nhận nội dung AI</button>` : ''}
      ${edit ? `<button class="btn btn-ghost" onclick="EP.soanLaiAI('${l.id}')">${ic('sparkles')}AI soạn lại trọn bộ</button><button class="btn btn-ghost" onclick="EP.luuPB('${l.id}')">${ic('save')}Lưu phiên bản</button>` : ''}
      <button class="btn btn-ghost" onclick="EP.xuatKHBD('${l.id}')">${ic('file-down')}Xuất KHBD .docx</button>
      ${['cho_to_duyet', 'cho_bgh_duyet'].includes(l.trang_thai) && l.giao_vien_id === S.user.id ? `<button class="btn btn-ghost" onclick="EP.rutLai('${l.id}')">${ic('undo-2')}Rút lại để sửa</button>` : ''}</div></div>
  ${!edit ? `<div class="bg-slate-100 text-slate-600 text-sm rounded-xl px-4 py-2 mb-3">${['da_duyet', 'da_day'].includes(l.trang_thai) ? 'KHBD đã duyệt: chỉ cập nhật được mục "Điều chỉnh sau bài dạy" (từ phân hệ Dự giờ).' : 'Chế độ xem (bài đang chờ duyệt hoặc không phải bài của bạn).'}</div>` : ''}
  <div class="grid ${buoc === '5' && !gopY.length ? 'xl:grid-cols-[230px_1fr]' : 'xl:grid-cols-[230px_1fr_320px]'} gap-4">
    <nav class="card p-2 h-fit space-y-1" aria-label="Các bước soạn">${BUOC_SOAN.map(([k, ten, i], n) => `<a href="#/bai/${l.id}/${k}" class="step ${buoc === k ? 'active' : ''}">
      <span class="dot">${k === 'tich-hop' ? ic(i, 'w-3.5 h-3.5') : n < 4 ? n + 1 : 5}${(doTheoBuoc[k] || (k === '5' ? r.flags : [])).some(f => f.muc === 'do') ? '<span class="red"></span>' : ''}</span><span>${ten}</span></a>`).join('')}
      <div class="border-t mt-2 pt-2 px-2 text-[11px] text-slate-500">Cờ: 🔴 ${r.flags.filter(f => f.muc === 'do').length} · 🟡 ${r.flags.filter(f => f.muc === 'vang').length} · 🟢 ${r.flags.filter(f => f.muc === 'xanh').length}</div></nav>
    <section id="ws-body" class="min-w-0"></section>
    <aside class="space-y-3">${buoc === '5' ? '' : panelCo(doTheoBuoc[buoc] || [], l.id)}${panelGopY(gopY, l)}</aside>
  </div>`;
  const body = $('#ws-body');
  if (buoc === '1') body.innerHTML = editorKHBD(l, nd, edit);
  else if (buoc === '2') body.innerHTML = editorPhieu(l, edit);
  else if (buoc === '3') body.innerHTML = editorSlide(l, edit);
  else if (buoc === '4') body.innerHTML = editorDanhGia(l, nd, edit);
  else if (buoc === 'tich-hop') body.innerHTML = editorTichHop(l, edit);
  else body.innerHTML = buocRaSoat(l, r);
  ganSua(l, buoc);
  icons();
  if (S.tam.hl) { const el = document.querySelector(`[data-path="${S.tam.hl}"]`) || document.querySelector(`[data-path^="${S.tam.hl.split('.').slice(0, 2).join('.')}"]`); S.tam.hl = null; if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('hl'); el.focus?.(); setTimeout(() => el.classList.remove('hl'), 2500); } }
}
const panelCo = (flags, lid) => `<div class="card"><div class="px-3 py-2 border-b text-sm font-bold">Rà soát bước này (${flags.length})</div><div class="max-h-[50vh] overflow-y-auto">${flags.length ? flags.map(f => theCo(f, lid)).join('') : '<p class="p-3 text-xs text-emerald-700">Không có cờ ở bước này.</p>'}</div></div>`;
const theCo = (f, lid) => `<button class="w-full text-left p-2.5 border-b last:border-0 text-xs ${MUC[f.muc][1]} border-l-4" onclick="EP.denCo('${lid}','${esc(f.vi_tri || '')}')">
  <div class="font-semibold">${MUC[f.muc][0]} ${esc(f.rule_id)} · ${esc(f.thong_diep)}</div>${f.de_xuat ? `<div class="mt-0.5 opacity-80">→ ${esc(f.de_xuat)}</div>` : ''}<div class="mt-0.5 text-[10px] opacity-70">Nguồn: ${esc(f.nguon)}</div></button>`;
function panelGopY(ds, l) {
  if (!ds.length) return '';
  return `<div class="card"><div class="px-3 py-2 border-b text-sm font-bold">Góp ý theo dòng của tổ/BGH (${ds.filter(g => g.trang_thai === 'mo').length} mở)</div>${ds.map(g => `<div class="p-2.5 border-b last:border-0 text-xs ${g.trang_thai === 'mo' ? '' : 'opacity-60'}">
    <button class="font-semibold text-brand-800 hover:underline" onclick="EP.denCo('${l.id}','${esc(g.vi_tri)}')">${esc(g.vi_tri)}</button> · ${esc(g.nguoi || '')} (${g.cap === 'to' ? 'Tổ' : 'BGH'})
    <div class="mt-0.5">${esc(g.noi_dung)}</div>${g.trang_thai === 'mo' && l.giao_vien_id === S.user.id ? `<button class="btn btn-ghost !py-0.5 !px-2 text-[11px] mt-1" onclick="EP.xuLyGopY('${g.review_id}','${g.id}','${l.id}')">${ic('check', 'w-3 h-3')}Đã xử lý</button>` : g.trang_thai !== 'mo' ? '<div class="text-emerald-700 mt-0.5">✓ Đã xử lý</div>' : ''}</div>`).join('')}</div>`;
}
const ta = (path, val, edit, rows = 3, ph = '') => `<textarea class="input text-sm" rows="${rows}" data-path="${path}" ${edit ? '' : 'readonly'} placeholder="${esc(ph)}">${esc(val)}</textarea>`;
const inp = (path, val, edit, type = 'text', cls = '') => `<input class="input text-sm ${cls}" type="${type}" data-path="${path}" value="${esc(val)}" ${edit ? '' : 'readonly'}>`;

function editorKHBD(l, nd, edit) {
  const yc = S.data.yccdTheoMon[l.mon]?.filter(y => (l.yccd_ids || []).includes(y.id)) || [];
  const dc = `<div class="card p-4"><label class="label">Điều chỉnh sau bài dạy</label>${ta('dieu_chinh', nd.dieu_chinh, edit || ['da_duyet', 'da_day'].includes(l.trang_thai) && l.giao_vien_id === S.user.id, 3, 'Ghi sau khi dạy/dự giờ…')}</div>`;
  const ycBox = `<div class="card p-4 text-sm"><div class="font-bold mb-1">YCCĐ đã chọn (${(l.yccd_ids || []).length})</div>${yc.length ? `<ul class="list-disc pl-5 text-slate-600 space-y-0.5">${yc.map(y => `<li>${esc(y.yccd)}</li>`).join('')}</ul>` : '<p class="text-amber-700 text-xs">Chưa có YCCĐ (KHBD nhập từ EduPlan cũ hoặc tạo trống).</p>'}
    ${edit ? `<button class="btn btn-ghost !py-1 text-xs mt-2" onclick="EP.chonYCCD('${l.id}')">${ic('list-plus', 'w-3.5 h-3.5')}Chọn YCCĐ</button>` : ''}</div>`;
  const goc = nd.van_ban_goc ? `<details class="card p-4"><summary class="cursor-pointer text-sm font-semibold">Văn bản gốc (nhập từ EduPlan/dán) — đã tự tách vào khung bên dưới</summary><pre class="mt-2 text-xs whitespace-pre-wrap bg-slate-50 rounded-lg p-3 max-h-72 overflow-y-auto">${esc(nd.van_ban_goc)}</pre></details>` : '';
  if (nd.khung === 'PL3-2345') {
    return `<div class="space-y-3">${ycBox}${goc}<div class="card p-4 space-y-3"><div><label class="label">1. Yêu cầu cần đạt</label>${ta('yeu_cau_can_dat', nd.yeu_cau_can_dat, edit, 5)}</div>
      <div><label class="label">2. Đồ dùng dạy học</label>${ta('do_dung', nd.do_dung, edit, 3)}</div></div>
      <div class="card p-4 space-y-3"><div class="label">3. Các hoạt động dạy học chủ yếu</div>${nd.hoat_dong.map((h, i) => `<div class="border rounded-xl p-3 space-y-2" data-path="hoat_dong.${i}">
        <div class="grid grid-cols-[1fr_110px] gap-2">${inp(`hoat_dong.${i}.ten`, h.ten, edit)}${inp(`hoat_dong.${i}.thoi_luong`, h.thoi_luong, edit, 'number')}</div>${ta(`hoat_dong.${i}.to_chuc_text`, h.to_chuc_text, edit, 4, 'Mô tả hoạt động của GV và HS')}</div>`).join('')}</div>${dc}</div>`;
  }
  return `<div class="space-y-3">${ycBox}${goc}
  <div class="card p-4 space-y-3"><h2 class="font-bold">I. Mục tiêu</h2>
    <div><label class="label">1. Về kiến thức</label>${ta('muc_tieu.kien_thuc', nd.muc_tieu.kien_thuc, edit, 4)}</div>
    <div><label class="label">2. Về năng lực</label>${ta('muc_tieu.nang_luc', nd.muc_tieu.nang_luc, edit, 3)}</div>
    <div><label class="label">3. Về phẩm chất</label>${ta('muc_tieu.pham_chat', nd.muc_tieu.pham_chat, edit, 2)}</div></div>
  <div class="card p-4"><h2 class="font-bold mb-2">II. Thiết bị dạy học và học liệu</h2>${ta('thiet_bi', nd.thiet_bi, edit, 3)}</div>
  <div class="card p-4 space-y-4"><h2 class="font-bold">III. Tiến trình dạy học</h2>${nd.hoat_dong.map((h, i) => `<div class="border rounded-xl p-3 space-y-2" data-path="hoat_dong.${i}">
    <div class="text-xs font-bold text-brand-700">${esc(LOAI_HD[i]?.nhan || `Hoạt động ${i + 1}`)}</div>
    <div class="grid grid-cols-[1fr_110px] gap-2"><div><label class="label">Tên hoạt động (thể hiện kết quả)</label>${inp(`hoat_dong.${i}.ten`, h.ten, edit)}</div><div><label class="label">Thời lượng (phút)</label>${inp(`hoat_dong.${i}.thoi_luong`, h.thoi_luong, edit, 'number')}</div></div>
    <div class="grid md:grid-cols-3 gap-2"><div><label class="label">a) Mục tiêu</label>${ta(`hoat_dong.${i}.muc_tieu`, h.muc_tieu, edit, 3)}</div><div><label class="label">b) Nội dung</label>${ta(`hoat_dong.${i}.noi_dung`, h.noi_dung, edit, 3)}</div><div><label class="label">c) Sản phẩm</label>${ta(`hoat_dong.${i}.san_pham`, h.san_pham, edit, 3)}</div></div>
    <div class="label">d) Tổ chức thực hiện</div><div class="grid md:grid-cols-2 gap-2">${BUOC.map((b, k) => `<div><label class="text-[11px] font-semibold text-slate-500">Bước ${k + 1}. ${b.ten}</label>${ta(`hoat_dong.${i}.to_chuc.${b.key}`, h.to_chuc[b.key], edit, 3)}</div>`).join('')}</div>
    ${h.to_chuc_text ? `<div><label class="text-[11px] font-semibold text-slate-500">Tổ chức thực hiện (văn bản chưa tách bước)</label>${ta(`hoat_dong.${i}.to_chuc_text`, h.to_chuc_text, edit, 2)}</div>` : ''}</div>`).join('')}</div>${dc}</div>`;
}
function editorPhieu(l, edit) {
  const { worksheets } = boCua(l.id), nd = ndCua(l);
  const hdOpt = nd.hoat_dong.map((h, i) => [i, `HĐ${i + 1}: ${h.ten || LOAI_HD[i]?.ten || ''}`]);
  return `<div class="flex flex-wrap gap-2 mb-3">${edit ? `<button class="btn btn-soft" onclick="EP.sinhLai('${l.id}','phieu')">${ic('sparkles')}Sinh lại từ KHBD</button><button class="btn btn-ghost" onclick="EP.themPhieu('${l.id}')">${ic('plus')}Thêm phiếu</button>` : ''}
    <button class="btn btn-ghost" onclick="EP.xuatPhieu('${l.id}')">${ic('file-down')}Xuất phiếu .docx</button></div>
  <div class="space-y-3">${worksheets.map((w, k) => `<div class="card p-4 space-y-2" data-path="worksheets.${k}"><div class="grid md:grid-cols-[1fr_260px_auto] gap-2 items-end">
    <div><label class="label">Tiêu đề</label><input class="input text-sm" data-ws="${w.id}" data-f="tieu_de" value="${esc(w.tieu_de)}" ${edit ? '' : 'readonly'}></div>
    <div><label class="label">Gắn với hoạt động</label><select class="input text-sm" data-ws="${w.id}" data-f="hoat_dong_ref" ${edit ? '' : 'disabled'}>${opt(hdOpt, w.hoat_dong_ref)}</select></div>
    ${edit ? `<button class="btn btn-danger !py-2" onclick="EP.xoaPhieu('${w.id}','${l.id}')" aria-label="Xóa phiếu">${ic('trash-2')}</button>` : ''}</div>
    <div><label class="label">Nhiệm vụ (mỗi dòng một câu)</label><textarea class="input text-sm" rows="4" data-ws="${w.id}" data-f="nhiem_vu" ${edit ? '' : 'readonly'}>${esc((w.nhiem_vu || []).join('\n'))}</textarea></div>
    <div class="grid md:grid-cols-2 gap-2"><div><label class="label">Sản phẩm</label><input class="input text-sm" data-ws="${w.id}" data-f="san_pham" value="${esc(w.san_pham)}" ${edit ? '' : 'readonly'}></div>
    <div><label class="label">Tiêu chí (mỗi dòng một tiêu chí)</label><textarea class="input text-sm" rows="2" data-ws="${w.id}" data-f="thang_tieu_chi" ${edit ? '' : 'readonly'}>${esc((w.thang_tieu_chi || []).join('\n'))}</textarea></div></div></div>`).join('') || '<div class="card p-6 text-sm text-slate-500">Chưa có phiếu học tập.</div>'}</div>`;
}
function editorSlide(l, edit) {
  const sl = boCua(l.id).slides || { trang: [] }, nd = ndCua(l);
  const hdOpt = [['', '(chung)'], ...nd.hoat_dong.map((h, i) => [i, `HĐ${i + 1}`])];
  return `<div class="flex flex-wrap gap-2 mb-3">${edit ? `<button class="btn btn-soft" onclick="EP.sinhLai('${l.id}','slide')">${ic('sparkles')}Sinh lại từ KHBD</button><button class="btn btn-ghost" onclick="EP.themSlide('${l.id}')">${ic('plus')}Thêm trang</button>` : ''}
    <button class="btn btn-ghost" onclick="EP.xuatSlide('${l.id}')">${ic('file-down')}Xuất slide .pptx</button></div>
  <div class="grid md:grid-cols-2 gap-3">${sl.trang.map((t, k) => `<div class="card overflow-hidden" data-path="slides.${k}"><div class="px-3 py-2 text-[11px] font-semibold bg-slate-50 border-b flex items-center gap-2">Trang ${k + 1}
    <select class="input !w-auto !py-0.5 text-xs ml-auto" data-sl="${k}" data-f="hoat_dong_ref" ${edit ? '' : 'disabled'}>${opt(hdOpt, t.hoat_dong_ref ?? '')}</select>${edit ? `<button class="text-rose-600" onclick="EP.xoaSlide('${l.id}',${k})" aria-label="Xóa trang">${ic('x', 'w-3.5 h-3.5')}</button>` : ''}</div>
    <div class="p-3 space-y-2"><input class="input font-bold" data-sl="${k}" data-f="tieu_de" value="${esc(t.tieu_de)}" ${edit ? '' : 'readonly'}><textarea class="input text-sm" rows="4" data-sl="${k}" data-f="noi_dung" ${edit ? '' : 'readonly'}>${esc(t.noi_dung)}</textarea>
    <textarea class="input text-xs" rows="2" data-sl="${k}" data-f="ghi_chu_gv" placeholder="Ghi chú cho GV" ${edit ? '' : 'readonly'}>${esc(t.ghi_chu_gv || '')}</textarea></div></div>`).join('') || '<div class="card p-6 text-sm text-slate-500">Chưa có slide.</div>'}</div>`;
}
function editorDanhGia(l, nd, edit) {
  const as = boCua(l.id).assessments || { cau_hoi: [], rubric: [] }, mt = mucTieuDong(nd);
  const mtOpt = mt.map((m, i) => [i, `MT${i + 1}: ${m.slice(0, 50)}…`]);
  return `<div class="flex flex-wrap gap-2 mb-3">${edit ? `<button class="btn btn-soft" onclick="EP.sinhLai('${l.id}','danh_gia')">${ic('sparkles')}Sinh lại từ mục tiêu</button><button class="btn btn-ghost" onclick="EP.themCau('${l.id}')">${ic('plus')}Thêm câu hỏi</button>` : ''}
    <button class="btn btn-ghost" onclick="EP.xuatDanhGia('${l.id}')">${ic('file-down')}Xuất đề .docx</button></div>
  <div class="card mb-3 p-3 text-xs text-slate-600">Phân bổ: ${['NB', 'TH', 'VD', 'VDC'].map(m => `${m} ${as.cau_hoi.filter(c => c.muc_do === m).length}`).join(' · ')} — mức độ theo CV 5512 mục II.4. Mỗi mục tiêu cần ít nhất 1 câu (luật NQ-01).</div>
  <div class="card overflow-x-auto" data-path="assessments"><table class="w-full tbl"><thead><tr><th class="w-10">#</th><th>Câu hỏi</th><th class="w-28">Mức độ</th><th class="w-56">Mục tiêu</th><th>Đáp án</th><th></th></tr></thead><tbody>
  ${as.cau_hoi.map((c, k) => `<tr><td>${k + 1}</td><td><textarea class="input text-sm" rows="2" data-cq="${k}" data-f="noi_dung" ${edit ? '' : 'readonly'}>${esc(c.noi_dung)}</textarea></td>
    <td><select class="input text-sm" data-cq="${k}" data-f="muc_do" ${edit ? '' : 'disabled'}>${opt([['NB', 'Nhận biết'], ['TH', 'Thông hiểu'], ['VD', 'Vận dụng'], ['VDC', 'Vận dụng cao']], c.muc_do)}</select></td>
    <td><select class="input text-xs" data-cq="${k}" data-f="muc_tieu_ref" ${edit ? '' : 'disabled'}>${opt(mtOpt, c.muc_tieu_ref)}</select></td>
    <td><textarea class="input text-xs" rows="2" data-cq="${k}" data-f="dap_an" ${edit ? '' : 'readonly'}>${esc(c.dap_an || '')}</textarea></td>
    <td>${edit ? `<button class="text-rose-600" onclick="EP.xoaCau('${l.id}',${k})" aria-label="Xóa câu">${ic('trash-2')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div>
  ${as.rubric?.length ? `<div class="card p-4 mt-3"><div class="font-bold text-sm mb-2">Rubric sản phẩm</div><table class="w-full tbl"><tbody>${as.rubric.map(r => `<tr><td class="font-semibold">${esc(r.tieu_chi)}</td>${r.muc.map((m, k) => `<td><span class="text-[10px] text-slate-400">Mức ${k + 1}</span><br>${esc(m)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}`;
}
function editorTichHop(l, edit) {
  const ds = boCua(l.id).integrations, nls = S.data.nls, ai = S.data.ai, nd = ndCua(l);
  const bac = nls.bac.find(b => b.lop.includes(+l.lop));
  const aiLop = ai.yccd.filter(y => y.lop === +l.lop);
  const hdOpt = nd.hoat_dong.map((h, i) => [i, `HĐ${i + 1}: ${h.ten || LOAI_HD[i]?.ten || ''}`]);
  return `<div class="card p-4 mb-3 text-sm"><b>Năng lực số (CV 3456):</b> lớp ${esc(l.lop)} thuộc bậc <b>${esc(bac?.ma)} – ${esc(bac?.ten)}</b> (${esc(bac?.nhiem_vu)}; ${esc(bac?.tu_chu)}). Mã: <code>miền.năng_lực.bậc</code>.
    <br><b>Giáo dục AI (QĐ 2422):</b> ${aiLop.length} YCCĐ có mã cho lớp ${esc(l.lop)}.
    ${edit ? `<div class="flex gap-2 mt-2"><button class="btn btn-soft !py-1" onclick="EP.sinhLai('${l.id}','tich_hop')">${ic('sparkles')}Gợi ý tích hợp</button><button class="btn btn-ghost !py-1" onclick="EP.themTH('${l.id}','NLS')">${ic('plus')}Năng lực số</button><button class="btn btn-ghost !py-1" onclick="EP.themTH('${l.id}','AI')">${ic('plus')}Giáo dục AI</button></div>` : ''}</div>
  <div class="space-y-2" data-path="integrations">${ds.map(x => `<div class="card p-3 grid md:grid-cols-[90px_1fr_200px_auto] gap-2 items-start">
    <span class="badge ${x.loai === 'NLS' ? 'bg-sky-100 text-sky-800' : 'bg-violet-100 text-violet-800'}">${x.loai === 'NLS' ? 'Năng lực số' : 'Giáo dục AI'}</span>
    <div class="space-y-1">${x.loai === 'NLS' ? `<select class="input text-sm" data-it="${x.id}" data-f="ma" ${edit ? '' : 'disabled'}>${opt(nls.nang_luc.map(c => [`${c.ma}.${bac?.ma}`, `${c.ma}.${bac?.ma} – ${c.ten}`]), x.ma)}${nls.nang_luc.some(c => `${c.ma}.${bac?.ma}` === x.ma) ? '' : `<option selected>${esc(x.ma)}</option>`}</select>`
      : `<select class="input text-sm" data-it="${x.id}" data-f="ma" ${edit ? '' : 'disabled'}>${opt(aiLop.map(y => [y.ma, `${y.ma} – ${y.yccd.slice(0, 90)}`]), x.ma)}${aiLop.some(y => y.ma === x.ma) ? '' : `<option selected>${esc(x.ma)}</option>`}</select>`}
      <textarea class="input text-xs" rows="2" data-it="${x.id}" data-f="mo_ta_bieu_hien" placeholder="Biểu hiện cụ thể trong hoạt động" ${edit ? '' : 'readonly'}>${esc(x.mo_ta_bieu_hien || '')}</textarea></div>
    <select class="input text-sm" data-it="${x.id}" data-f="hoat_dong_ref" ${edit ? '' : 'disabled'}>${opt(hdOpt, x.hoat_dong_ref)}</select>
    ${edit ? `<button class="text-rose-600 p-2" onclick="EP.xoaTH('${x.id}','${l.id}')" aria-label="Xóa">${ic('trash-2')}</button>` : '<span></span>'}</div>`).join('') || '<div class="card p-6 text-sm text-slate-500">Chưa có nội dung tích hợp.</div>'}</div>`;
}
function buocRaSoat(l, r) {
  const cs = r.chi_so, k4 = bangKiem4Buoc(r.flags), nop = l.giao_vien_id === S.user.id && ['ban_nhap', 'yeu_cau_chinh_sua'].includes(l.trang_thai);
  const nhom = m => r.flags.filter(f => f.muc === m);
  return `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">${gauge(cs.tuan_thu_5512, 'Tỷ lệ tuân thủ CV 5512', 'Chỉ số quen thuộc của EduPlan')}${gauge(cs.tich_cuc, 'Tỷ lệ tích cực hóa học sinh', 'Từ điển eduplan v1')}
    ${gauge(cs.cau_truc, 'Cấu trúc theo khung', 'PL IV / PL 3 CV 2345')}${gauge(cs.bam_yccd, 'Bám YCCĐ', 'Đối chiếu CT GDPT 2018')}${gauge(cs.nhat_quan, 'Nhất quán 5 bước', 'Mục tiêu ↔ hoạt động ↔ đánh giá')}
    <div class="card p-3 text-sm flex flex-col justify-center">${r.chan_nop ? `<b class="text-rose-700">${ic('octagon-x', 'w-4 h-4 inline')} Còn ${nhom('do').length} cờ đỏ — chưa nộp được</b>` : `<b class="text-emerald-700">${ic('check-circle-2', 'w-4 h-4 inline')} Không còn cờ đỏ — nộp được</b>`}
      ${cheDoAI() === 'gemini' ? `<button class="btn btn-ghost !py-1 text-xs mt-2" onclick="EP.gopYAI('${l.id}')">${ic('sparkles', 'w-3.5 h-3.5')}Gemini góp ý thêm</button>` : ''}</div></div>
  <div class="card mb-3"><div class="px-4 py-2 border-b font-bold text-sm">Bảng kiểm 4 bước tổ chức hoạt động</div><div class="grid md:grid-cols-4 divide-x">${k4.map((b, i) => `<div class="p-3 text-xs">
    <div class="font-semibold">Bước ${i + 1}: ${esc(b.buoc)}</div><span class="badge ${b.trang_thai === 'Đạt' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} my-1">${b.trang_thai}</span><div class="text-slate-600">${esc(b.phan_tich)}</div></div>`).join('')}</div></div>
  <div class="card mb-3"><div class="px-4 py-2 border-b font-bold text-sm">Cờ rà soát (${r.flags.length}) — bấm để đến đúng vị trí</div><div id="co-llm"></div>${['do', 'vang', 'xanh'].map(m => nhom(m).map(f => theCo(f, l.id)).join('')).join('') || '<p class="p-4 text-sm text-emerald-700">Không có cờ.</p>'}</div>
  <div class="card p-3 flex flex-wrap gap-2 justify-end sticky bottom-3 shadow-lg">
    <button class="btn btn-ghost" onclick="EP.xuatKHBD('${l.id}')">${ic('file-down')}Xuất bài dạy hoàn thiện</button>
    ${nop ? `<button class="btn btn-soft" onclick="EP.luuKetQua('${l.id}')">${ic('database')}Lưu vào Cơ sở dữ liệu trường</button>
    <button class="btn btn-primary" ${r.chan_nop ? 'disabled title="Còn cờ đỏ"' : ''} onclick="EP.guiDuyet('${l.id}')">${ic('send')}Gửi Tổ trưởng duyệt</button>` : ''}</div>`;
}

// ---- gắn sự kiện chỉnh sửa (tự lưu khi rời ô)
function ganSua(l, buoc) {
  const luu = async () => { await luuBai(l); };
  $$('[data-path]').forEach(el => { if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
    el.onchange = async () => { setP(l.noi_dung, el.dataset.path, el.type === 'number' ? +el.value : el.value); await luu(); toast('Đã lưu.', 'success'); ve(); }; });
  const bo = boCua(l.id);
  $$('[data-ws]').forEach(el => el.onchange = async () => { const w = bo.worksheets.find(x => x.id === el.dataset.ws); const f = el.dataset.f;
    w[f] = ['nhiem_vu', 'thang_tieu_chi'].includes(f) ? el.value.split('\n').filter(Boolean) : f === 'hoat_dong_ref' ? +el.value : el.value; await S.kho.put('worksheets', w); ve(); });
  $$('[data-sl]').forEach(el => el.onchange = async () => { const t = bo.slides.trang[+el.dataset.sl]; t[el.dataset.f] = el.dataset.f === 'hoat_dong_ref' ? (el.value === '' ? null : +el.value) : el.value; await S.kho.put('slides', bo.slides); ve(); });
  $$('[data-cq]').forEach(el => el.onchange = async () => { const c = bo.assessments.cau_hoi[+el.dataset.cq]; c[el.dataset.f] = el.dataset.f === 'muc_tieu_ref' ? +el.value : el.value; await S.kho.put('assessments', bo.assessments); ve(); });
  $$('[data-it]').forEach(el => el.onchange = async () => { const x = bo.integrations.find(i => i.id === el.dataset.it); x[el.dataset.f] = el.dataset.f === 'hoat_dong_ref' ? +el.value : el.value; await S.kho.put('integrations', x); ve(); });
}

// ---- hành động
const L = id => S.kho.get('lessons', id);
A.denCo = (id, viTri) => { S.tam.hl = viTri; const b = buocCuaViTri(viTri); if (location.hash === `#/bai/${id}/${b}`) ve(); else location.hash = `#/bai/${id}/${b}`; };
A.luuPB = async id => { await luuPhienBan(L(id), 'Lưu thủ công'); await log('Lưu phiên bản', L(id).ten_bai, `v${L(id).phien_ban_hien_tai}`); toast('Đã lưu phiên bản.', 'success'); ve(); };
A.chapNhanAI = async id => { const l = L(id); l.ai_de_xuat.da_chap_nhan = true; l.ai_de_xuat.chap_nhan_luc = now(); await luuBai(l); await log('Chấp nhận nội dung AI', l.ten_bai); ve(); };
A.soanLaiAI = async id => {
  if (!(await confirmBox('AI soạn lại trọn bộ sẽ THAY nội dung KHBD, phiếu, slide, đánh giá hiện tại (phiên bản cũ vẫn lưu trong lịch sử). Tiếp tục?', 'Soạn lại'))) return;
  const l = L(id); await luuPhienBan(l, 'Trước khi AI soạn lại');
  const { bo, engine, canh_bao } = await soanTronBoAI(l, await yccdDaChon(l), S.data.nls, S.data.ai);
  if (canh_bao) toast(canh_bao, 'warn');
  l.noi_dung = bo.nd; l.ai_de_xuat = { engine, luc: now(), da_chap_nhan: false }; await luuBai(l); await luuBo(l.id, bo); await log('Soạn lại (AI)', l.ten_bai, engine); ve();
};
A.sinhLai = async (id, loai) => {
  const l = L(id), nd = ndCua(l), bo = boCua(id);
  if (loai === 'phieu') await luuBo(id, { ...bo, slides: null, assessments: null, integrations: bo.integrations, worksheets: soanPhieu(nd) });
  if (loai === 'slide') await S.kho.put('slides', { id: bo.slides?.id || uid('sl'), lesson_id: id, ...soanSlide(nd, l) });
  if (loai === 'danh_gia') await S.kho.put('assessments', { id: bo.assessments?.id || uid('as'), lesson_id: id, ...soanDanhGia(nd) });
  if (loai === 'tich_hop') { for (const x of bo.integrations) await S.kho.del('integrations', x.id); await S.kho.putMany({ integrations: goiYTichHop(nd, l, S.data.nls, S.data.ai).map(x => ({ id: uid('it'), lesson_id: id, ...x })) }); }
  toast('Đã sinh lại.', 'success'); ve();
};
A.themPhieu = async id => { const n = boCua(id).worksheets.length; await S.kho.put('worksheets', { id: uid('ws'), lesson_id: id, thu_tu: n, hoat_dong_ref: 1, tieu_de: `Phiếu học tập số ${n + 1}`, nhiem_vu: [], san_pham: '', thang_tieu_chi: [] }); ve(); };
A.xoaPhieu = async (wid) => { await S.kho.del('worksheets', wid); ve(); };
A.themSlide = async id => { const s = boCua(id).slides || { id: uid('sl'), lesson_id: id, trang: [] }; s.trang.push({ tieu_de: 'Trang mới', noi_dung: '', hoat_dong_ref: null, ghi_chu_gv: '' }); await S.kho.put('slides', s); ve(); };
A.xoaSlide = async (id, k) => { const s = boCua(id).slides; s.trang.splice(k, 1); await S.kho.put('slides', s); ve(); };
A.themCau = async id => { const a = boCua(id).assessments || { id: uid('as'), lesson_id: id, cau_hoi: [], rubric: [] }; a.cau_hoi.push({ noi_dung: '', muc_do: 'NB', muc_tieu_ref: 0, dap_an: '' }); await S.kho.put('assessments', a); ve(); };
A.xoaCau = async (id, k) => { const a = boCua(id).assessments; a.cau_hoi.splice(k, 1); await S.kho.put('assessments', a); ve(); };
A.themTH = async (id, loai) => { const l = L(id), bac = S.data.nls.bac.find(b => b.lop.includes(+l.lop))?.ma; const ai = S.data.ai.yccd.find(y => y.lop === +l.lop);
  await S.kho.put('integrations', { id: uid('it'), lesson_id: id, loai, ma: loai === 'NLS' ? `1.1.${bac}` : ai?.ma || '', hoat_dong_ref: 1, mo_ta_bieu_hien: '' }); ve(); };
A.xoaTH = async xid => { await S.kho.del('integrations', xid); ve(); };
A.xuLyGopY = async (rid, gid) => { const r = S.kho.get('reviews', rid); const g = r.gop_y_theo_dong.find(x => x.id === gid); g.trang_thai = 'da_xu_ly'; g.xu_ly_luc = now(); await S.kho.put('reviews', r); await log('Xử lý góp ý theo dòng', g.vi_tri); ve(); };
A.chonYCCD = async id => {
  const l = L(id), ds = await yccdCua(l.mon, l.lop);
  const m = modal(`Chọn YCCĐ — ${l.mon} lớp ${l.lop}`, `<input class="input mb-2" id="yc-tim" placeholder="Lọc…"><div id="yc-ds" class="max-h-[55vh] overflow-y-auto text-sm"></div><div class="flex justify-end mt-3"><button class="btn btn-primary" id="yc-ok">Lưu</button></div>`, { size: 'max-w-3xl' });
  const chon = new Set(l.yccd_ids || []);
  const veDs = q => { m.querySelector('#yc-ds').innerHTML = ds.filter(y => !q || y.yccd.toLowerCase().includes(q)).slice(0, 300).map(y => `<label class="flex gap-2 p-1.5"><input type="checkbox" data-y="${y.id}" ${chon.has(y.id) ? 'checked' : ''}><span><span class="text-[11px] text-slate-500">${esc(y.noi_dung)}</span><br>${esc(y.yccd)}</span></label>`).join('');
    m.querySelectorAll('[data-y]').forEach(c => c.onchange = () => (c.checked ? chon.add(c.dataset.y) : chon.delete(c.dataset.y))); };
  veDs(''); m.querySelector('#yc-tim').oninput = e => veDs(e.target.value.toLowerCase());
  m.querySelector('#yc-ok').onclick = async () => { l.yccd_ids = [...chon]; await luuBai(l); closeModal(); ve(); };
};
A.luuKetQua = async id => {
  const l = L(id), r = await raSoat(l);
  await S.kho.put('audits', { id: uid('a'), lesson_id: id, phien_ban: l.phien_ban_hien_tai, chi_so: r.chi_so, co: r.flags, engine: `Luật 3C${cheDoAI() === 'gemini' ? ' + Gemini' : ''}`, luc: now() });
  await luuPhienBan(l, 'Lưu sau rà soát'); await log('Lưu CSDL', l.ten_bai, `Tuân thủ 5512: ${r.chi_so.tuan_thu_5512}%`); toast('Đã lưu vào cơ sở dữ liệu trường.', 'success'); ve();
};
A.guiDuyet = async id => {
  const l = L(id), r = await raSoat(l);
  if (r.chan_nop) return toast('Còn cờ đỏ — chưa nộp được.', 'error');
  if (l.trang_thai === 'yeu_cau_chinh_sua') l.so_vong_sua = (l.so_vong_sua || 0) + 1;
  Object.assign(l, { trang_thai: 'cho_to_duyet', nop_luc: now(), co_do_khi_nop: r.flags.filter(f => f.muc === 'do').length, co_vang_khi_nop: r.flags.filter(f => f.muc === 'vang').length });
  await S.kho.put('audits', { id: uid('a'), lesson_id: id, phien_ban: l.phien_ban_hien_tai + 1, chi_so: r.chi_so, co: r.flags, engine: 'Luật 3C (khi nộp)', luc: now() });
  await luuPhienBan(l, 'Nộp duyệt'); await log('Gửi Tổ trưởng duyệt', l.ten_bai, `v${l.phien_ban_hien_tai}`); toast('Đã gửi Tổ trưởng chuyên môn duyệt.', 'success'); ve();
};
A.rutLai = async id => { const l = L(id); l.trang_thai = 'ban_nhap'; await luuBai(l); await log('Rút lại KHBD', l.ten_bai); ve(); };
A.gopYAI = async id => { const l = L(id); const box = $('#co-llm'); box.innerHTML = `<p class="p-3 text-xs">${ic('loader-2', 'w-3.5 h-3.5 spin inline')} Gemini đang đọc…</p>`; icons();
  const co = await raSoatLLM(ndCua(l), l); box.innerHTML = co.map(f => theCo(f, id)).join('') || '<p class="p-3 text-xs text-slate-500">Gemini không có góp ý thêm.</p>'; };
const truong = () => S.kho.setting('ten_truong', '');
A.xuatKHBD = async id => { try { await xuatKHBD(L(id), ndCua(L(id)), truong()); await log('Xuất KHBD .docx', L(id).ten_bai); } catch (e) { toast(e.message, 'error'); } };
A.xuatPhieu = async id => { try { await xuatPhieu(L(id), boCua(id).worksheets); } catch (e) { toast(e.message, 'error'); } };
A.xuatSlide = async id => { try { await xuatSlide(L(id), boCua(id).slides); } catch (e) { toast(e.message, 'error'); } };
A.xuatDanhGia = async id => { try { await xuatDanhGia(L(id), ndCua(L(id)), boCua(id).assessments); } catch (e) { toast(e.message, 'error'); } };

// =========================================================== Rà soát nhanh 5512 (luồng EduPlan cũ, giữ tên nút quen thuộc)
export async function raSoatNhanh() {
  const q = S.tam.rq ||= { ten_bai: '', mon: 'Toán', lop: '8', bo_sach: BO_SACH[0], hoc_ky: 'Học kỳ I', van_ban: '', kq: null };
  const mau = S.tam.mauCu || (S.tam.mauCu = await (await fetch('data/mau-eduplan-cu.json')).json());
  const NUT = { nv10: 'Ngữ văn 10 (Chân trời sáng tạo – Nghệ thuật xây dựng hình tượng nhân vật)', toan8: 'Toán 8 (Kết nối tri thức – Hình chóp tam giác đều và diện tích xung quanh)', khtn6: 'KHTN 6 (Cánh diều – Lực tiếp xúc và lực không tiếp xúc)' };
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('scan-search', 'w-5 h-5 text-brand-600')}Không gian rà soát & đối soát 5512</h1>
  <p class="text-sm text-slate-500 mb-4">Dán kế hoạch bài dạy → rà soát theo khung Phụ lục IV và 4 bước tổ chức hoạt động (luồng quen thuộc của EduPlan).</p>
  <div class="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-5"><section class="card p-4 space-y-3">
    <div class="label">Nạp nhanh dữ liệu mẫu</div><div class="grid gap-2">${Object.entries(NUT).map(([k, t], i) => `<button class="text-left text-sm px-3 py-2 rounded-xl border hover:bg-brand-50" onclick="EP.mauCu('${k}')"><b class="text-brand-700">${i + 1}.</b> ${esc(t)}</button>`).join('')}</div>
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-2"><div class="col-span-2 sm:col-span-3"><label class="label">Tên bài dạy</label><input id="rq-ten" class="input" value="${esc(q.ten_bai)}"></div>
      <div><label class="label">Môn học</label><select id="rq-mon" class="input">${opt(MON, q.mon)}</select></div><div><label class="label">Khối lớp</label><select id="rq-lop" class="input">${opt(Array.from({ length: 12 }, (_, i) => String(i + 1)), q.lop)}</select></div>
      <div><label class="label">Bộ sách</label><select id="rq-sach" class="input">${opt(BO_SACH, q.bo_sach)}</select></div></div>
    <div><label class="label">Nội dung kế hoạch bài dạy</label><textarea id="rq-vb" class="input font-mono text-xs" rows="18">${esc(q.van_ban)}</textarea></div>
    <button class="btn btn-primary w-full py-3" id="rq-chay">${ic('scan-search', 'w-5 h-5')}Chạy AI rà soát chuẩn 5512</button></section>
    <section id="rq-kq" class="space-y-3">${q.kq ? '' : '<div class="card p-10 text-center text-sm text-slate-500">Kết quả rà soát hiển thị tại đây.</div>'}</section></div>`;
  const doc = () => Object.assign(q, { ten_bai: $('#rq-ten').value.trim(), mon: $('#rq-mon').value, lop: $('#rq-lop').value, bo_sach: $('#rq-sach').value, van_ban: $('#rq-vb').value });
  A.mauCu = k => { const m = mau[k]; Object.assign(q, { ten_bai: m.meta.title, mon: m.meta.subject, lop: m.meta.grade, bo_sach: m.meta.book, hoc_ky: m.meta.term, van_ban: m.content, kq: null }); ve(); };
  $('#rq-chay').onclick = () => { doc(); if (q.van_ban.trim().length < 30) return toast('Dán nội dung KHBD (tối thiểu 30 ký tự).', 'warn');
    const nd = parseText(q.van_ban); q.kq = { nd, r: runRules({ lesson: { lop: +q.lop, so_tiet: +(q.van_ban.match(/(\d+)\s*ti[ếe]t/i) || [])[1] || 0, che_do: 'ra_soat_nhanh' }, nd, yccd: [] }) };
    log('Chạy phân tích AI', q.ten_bai || '(chưa đặt tên)', `Tuân thủ 5512: ${q.kq.r.chi_so.tuan_thu_5512}%`); veKQ(); };
  function veKQ() {
    if (!q.kq) return;
    const { r } = q.kq, k4 = bangKiem4Buoc(r.flags);
    $('#rq-kq').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">${gauge(r.chi_so.tuan_thu_5512, 'Tỷ lệ tuân thủ CV 5512', 'Cấu trúc PL IV & 4 thành phần')}${gauge(r.chi_so.tich_cuc, 'Tỷ lệ tích cực hóa học sinh', 'HS chủ động so với GV độc thoại')}</div>
      <div class="card"><div class="px-4 py-2 border-b font-bold text-sm">Bảng kiểm 4 bước tổ chức hoạt động</div>${k4.map((b, i) => `<div class="p-3 border-b last:border-0 text-sm"><b>Bước ${i + 1}: ${esc(b.buoc)}</b>
        <span class="badge ${b.trang_thai === 'Đạt' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'} ml-1">${b.trang_thai}</span><div class="text-xs text-slate-600 mt-1">${esc(b.phan_tich)}</div></div>`).join('')}</div>
      <div class="card"><div class="px-4 py-2 border-b font-bold text-sm">Đề xuất tinh chỉnh sư phạm (${r.flags.length})</div>${r.flags.map(f => `<div class="p-2.5 border-b text-xs ${MUC[f.muc][1]} border-l-4"><b>${MUC[f.muc][0]} ${esc(f.thong_diep)}</b>${f.de_xuat ? `<div>→ ${esc(f.de_xuat)}</div>` : ''}<div class="text-[10px] opacity-70">${esc(f.rule_id)} · ${esc(f.nguon)}</div></div>`).join('')}</div>
      <div class="card p-3 flex flex-wrap justify-end gap-2">${quyen('nop') ? `<button class="btn btn-soft" id="rq-luu">${ic('database')}Lưu vào Cơ sở dữ liệu trường</button><button class="btn btn-primary" id="rq-gui">${ic('send')}Gửi Tổ trưởng duyệt</button>` : ''}</div>`;
    icons();
    const luu = async gui => { doc(); if (!q.ten_bai) return toast('Nhập tên bài dạy.', 'warn');
      const l = { id: uid('l'), ten_bai: q.ten_bai, mon: q.mon, lop: +q.lop, cap_hoc: capHoc(q.lop), bo_sach: q.bo_sach, hoc_ky: q.hoc_ky, nam_hoc: '2026 – 2027', so_tiet: +(q.van_ban.match(/(\d+)\s*ti[ếe]t/i) || [])[1] || null,
        khung: 'PL4-5512', yccd_ids: [], noi_dung: parseText(q.van_ban), trang_thai: gui ? 'cho_to_duyet' : 'ban_nhap', phien_ban_hien_tai: 0, giao_vien_id: S.user.id,
        to: S.user.to_chuyen_mon !== 'Ban Giám hiệu' ? S.user.to_chuyen_mon : toCuaMon(q.mon), che_do: 'ra_soat_nhanh', so_vong_sua: 0, nop_luc: gui ? now() : null, co_do_khi_nop: gui ? q.kq.r.flags.filter(f => f.muc === 'do').length : null, nguon_du_lieu: S.cheDo === 'demo' ? 'demo' : 'moi' };
      await luuPhienBan(l, gui ? 'Nộp duyệt (rà soát nhanh)' : 'Lưu từ rà soát nhanh');
      await S.kho.put('audits', { id: uid('a'), lesson_id: l.id, phien_ban: 1, chi_so: q.kq.r.chi_so, co: q.kq.r.flags, engine: 'Luật 3C (rà soát nhanh)', luc: now() });
      await log(gui ? 'Gửi Tổ trưởng duyệt' : 'Lưu CSDL', l.ten_bai, 'Rà soát nhanh'); S.tam.rq = null; toast(gui ? 'Đã gửi Tổ trưởng duyệt.' : 'Đã lưu.', 'success'); location.hash = `#/bai/${l.id}/5`; };
    $('#rq-luu') && ($('#rq-luu').onclick = () => luu(false)); $('#rq-gui') && ($('#rq-gui').onclick = () => luu(true));
  }
  veKQ();
}
