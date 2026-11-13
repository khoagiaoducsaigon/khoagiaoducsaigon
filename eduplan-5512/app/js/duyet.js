// P9 Duyệt 2 cấp (tổ → BGH): giữ tên nút, thứ tự, trạng thái quen thuộc của EduPlan cũ; thêm góp ý theo dòng, phiên bản, so sánh khác biệt.
// P10 Dự giờ theo Phụ lục V (CV 05/SGDĐT-GDPT 04/01/2021) + phân tích bài dạy 4 bước (CV 5512, chú thích [7]).
import { S, A, ve, boCua, ndCua, raSoat, luuBai, log, quyen, baiNhinThay, TRANG_THAI } from './state.js';
import { $, $$, esc, ic, icons, toast, modal, closeModal, fmtDT, fmtD, opt, diffLines, copyText } from './ui.js';
import { toText, BUOC, LOAI_HD, TEN_KHUNG } from './khung.js';
import { uid, now } from './db.js';
import { tongHop, diemGoiY, khoangDiem, goiYTuRaSoat, kiemDiem } from './plv.js';

const L = id => S.kho.get('lessons', id);
const capCua = () => (quyen('duyet_bgh') ? 'bgh' : quyen('duyet_to') ? 'to' : null);
const coTheDuyet = l => (capCua() === 'to' && l.trang_thai === 'cho_to_duyet' && l.to === S.user.to_chuyen_mon && S.user.quyen_duyet !== false)
  || (capCua() === 'bgh' && l.trang_thai === 'cho_bgh_duyet' && S.user.quyen_duyet !== false);

// =========================================================== P9
export async function duyet(id) {
  if (id) return chiTiet(id);
  const ds = baiNhinThay().filter(l => l.trang_thai !== 'ban_nhap').sort((a, b) => (b.nop_luc || '').localeCompare(a.nop_luc || ''));
  const cho = ds.filter(coTheDuyet), cua = ds.filter(l => l.giao_vien_id === S.user.id);
  const row = l => { const t = TRANG_THAI[l.trang_thai]; const rv = S.kho.where('reviews', r => r.lesson_id === l.id); return `<tr><td><a class="font-semibold text-brand-800 hover:underline" href="#/duyet/${l.id}">${esc(l.ten_bai)}</a>
    <div class="text-[11px] text-slate-500">${esc(l.mon)} ${esc(l.lop ?? '')} · ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || l.legacy?.teacherName || '')}</div></td><td><span class="badge ${t[1]}">${t[0]}</span></td>
    <td class="text-xs">${fmtD(l.nop_luc)}</td><td class="text-xs">${rv.map(r => `${r.cap === 'to' ? 'Tổ' : 'BGH'}: ${esc(r.ket_luan)}`).join('<br>') || '—'}</td>
    <td class="text-right"><a class="btn ${coTheDuyet(l) ? 'btn-primary' : 'btn-ghost'} !py-1 text-xs" href="#/duyet/${l.id}">${coTheDuyet(l) ? 'Duyệt' : 'Xem'}</a></td></tr>`; };
  const bang = (arr, rong) => `<div class="overflow-x-auto"><table class="w-full tbl"><thead><tr><th>Bài dạy</th><th>Trạng thái</th><th>Nộp</th><th>Lượt duyệt</th><th></th></tr></thead><tbody>${arr.map(row).join('') || `<tr><td colspan="5" class="text-center text-slate-500 py-6">${rong}</td></tr>`}</tbody></table></div>`;
  $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('clipboard-check', 'w-5 h-5 text-brand-600')}Duyệt kế hoạch bài dạy</h1>
  <p class="text-sm text-slate-500 mb-4">Quy trình: Giáo viên <b>Gửi Tổ trưởng duyệt</b> → Tổ trưởng <b>ký duyệt cấp tổ</b> → BGH <b>phê duyệt</b> (đạt chuẩn) · bất kỳ cấp nào có thể <b>Yêu cầu chỉnh sửa</b>.</p>
  ${capCua() ? `<div class="card mb-4"><div class="px-4 py-3 border-b font-bold">Chờ ${capCua() === 'to' ? `tổ ${esc(S.user.to_chuyen_mon)}` : 'Ban Giám hiệu'} duyệt (${cho.length})</div>${bang(cho, 'Không có KHBD chờ duyệt.')}</div>` : ''}
  ${cua.length ? `<div class="card mb-4"><div class="px-4 py-3 border-b font-bold">KHBD tôi đã nộp</div>${bang(cua, '')}</div>` : ''}
  <div class="card"><div class="px-4 py-3 border-b font-bold">Toàn bộ hồ sơ đã nộp (${ds.length})</div>${bang(ds, 'Chưa có hồ sơ.')}</div>`;
}

async function chiTiet(id) {
  const l = L(id); if (!l) { $('#main').innerHTML = '<div class="card p-6">Không tìm thấy KHBD.</div>'; return; }
  const nd = ndCua(l), r = await raSoat(l), duyetDuoc = coTheDuyet(l), cap = capCua();
  const rv = S.kho.where('reviews', x => x.lesson_id === id).sort((a, b) => a.luc.localeCompare(b.luc));
  const pb = S.kho.where('lesson_versions', v => v.lesson_id === id).sort((a, b) => a.so_phien_ban - b.so_phien_ban);
  const f = S.tam.rv?.id === id ? S.tam.rv : (S.tam.rv = { id, uu_diem: '', ton_tai: r.flags.filter(x => x.muc !== 'xanh').slice(0, 4).map(x => x.thong_diep).join('\n'), giai_phap: r.flags.filter(x => x.de_xuat).slice(0, 3).map(x => x.de_xuat).join('\n'),
    nhan_xet_4_buoc: ['', '', '', ''], nhan_xet_chung: '', gop_y: [] });
  const t = TRANG_THAI[l.trang_thai];
  $('#main').innerHTML = `<div class="flex flex-wrap items-start justify-between gap-3 mb-4"><div><a href="#/duyet" class="text-xs text-brand-700">← Danh sách duyệt</a>
    <h1 class="text-xl font-extrabold">${esc(l.ten_bai)} <span class="badge ${t[1]} align-middle">${t[0]}</span></h1>
    <p class="text-sm text-slate-500">${esc(l.mon)} ${esc(l.lop ?? '')} · ${esc(TEN_KHUNG[nd.khung])} · v${l.phien_ban_hien_tai} · Cờ: 🔴 ${r.flags.filter(x => x.muc === 'do').length} 🟡 ${r.flags.filter(x => x.muc === 'vang').length} · Tuân thủ 5512 ${r.chi_so.tuan_thu_5512}% · Bám YCCĐ ${r.chi_so.bam_yccd}%</p></div>
    <div class="flex gap-2"><a class="btn btn-ghost" href="#/bai/${id}/1">${ic('folder-open')}Mở trong không gian soạn</a>${pb.length > 1 ? `<button class="btn btn-ghost" onclick="EP.soSanh('${id}')">${ic('git-compare')}So sánh phiên bản</button>` : ''}</div></div>
  <div class="grid xl:grid-cols-[minmax(0,1fr)_420px] gap-4">
    <section class="card p-4"><div class="font-bold mb-2">Nội dung KHBD ${duyetDuoc ? '<span class="text-xs font-normal text-slate-500">— bấm "Góp ý" cạnh từng mục để góp ý theo dòng</span>' : ''}</div><div class="space-y-2 text-sm">${xemND(nd, duyetDuoc)}</div></section>
    <aside class="space-y-3">
      ${rv.length ? `<div class="card"><div class="px-4 py-2 border-b font-bold text-sm">Lịch sử duyệt</div>${rv.map(x => `<div class="p-3 border-b last:border-0 text-xs"><b>${x.cap === 'to' ? 'Tổ chuyên môn' : 'Ban Giám hiệu'}</b> · ${esc(x.nguoi_duyet_ten)} · ${fmtDT(x.luc)} · v${x.phien_ban ?? '?'}
        <span class="badge ${x.ket_luan === 'Đạt' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} ml-1">${esc(x.ket_luan)}</span>${x.legacy?.nguon === 'chu_ky_cu' ? ' <span class="badge bg-violet-100 text-violet-700">chữ ký EduPlan cũ</span>' : ''}
        ${(x.gop_y_theo_dong || []).map(g => `<div class="mt-1 pl-2 border-l-2 ${g.trang_thai === 'mo' ? 'border-amber-400' : 'border-emerald-400'}"><code>${esc(g.vi_tri)}</code>: ${esc(g.noi_dung)} ${g.trang_thai === 'mo' ? '' : '✓'}</div>`).join('')}
        <div class="mt-1 flex gap-1"><button class="btn btn-ghost !py-0.5 !px-2 text-[11px]" onclick="EP.inPhieu('${x.id}')">${ic('printer', 'w-3 h-3')}In A4</button><button class="btn btn-ghost !py-0.5 !px-2 text-[11px]" onclick="EP.chepPhieu('${x.id}')">${ic('copy', 'w-3 h-3')}Sao chép</button></div></div>`).join('')}</div>` : ''}
      ${duyetDuoc ? `<div class="card p-4 space-y-2"><div class="font-bold">Phiếu nhận xét — cấp ${cap === 'to' ? 'Tổ chuyên môn' : 'Ban Giám hiệu'}</div>
        ${[['uu_diem', 'Ưu điểm'], ['ton_tai', 'Tồn tại, hạn chế'], ['giai_phap', 'Giải pháp khắc phục']].map(([k, n]) => `<div><label class="label">${n}</label><textarea class="input text-sm" rows="3" data-rv="${k}">${esc(f[k])}</textarea></div>`).join('')}
        <div class="label">Nhận xét 4 bước tổ chức hoạt động</div>${BUOC.map((b, i) => `<input class="input text-xs" data-rv4="${i}" placeholder="Bước ${i + 1}: ${b.ten}" value="${esc(f.nhan_xet_4_buoc[i])}">`).join('')}
        <div><label class="label">Ý kiến chung</label><input class="input text-sm" data-rv="nhan_xet_chung" value="${esc(f.nhan_xet_chung)}"></div>
        <div class="text-xs text-slate-500">${f.gop_y.length} góp ý theo dòng sẽ gửi kèm.</div>
        <div class="flex flex-wrap gap-2 pt-1"><button class="btn btn-success" onclick="EP.ketLuan('${id}','Đạt')">${ic('pen-line')}${cap === 'to' ? 'Lưu phiếu & ký duyệt cấp tổ' : 'Lưu phiếu & phê duyệt BGH'}</button>
          <button class="btn btn-danger" onclick="EP.ketLuan('${id}','Yêu cầu chỉnh sửa')">${ic('rotate-ccw')}Yêu cầu chỉnh sửa</button></div></div>`
      : `<div class="card p-4 text-sm text-slate-500">${cap ? 'KHBD này không ở bước chờ bạn duyệt.' : 'Bạn đang xem hồ sơ.'}</div>`}
    </aside></div>`;
  $$('[data-rv]').forEach(el => el.oninput = () => { f[el.dataset.rv] = el.value; });
  $$('[data-rv4]').forEach(el => el.oninput = () => { f.nhan_xet_4_buoc[+el.dataset.rv4] = el.value; });
  icons();
}
function xemND(nd, gopY) {
  const muc = (path, nhan, val) => `<div class="border rounded-lg p-2 ${S.tam.rv?.gop_y?.some(g => g.vi_tri === path) ? 'border-amber-400 bg-amber-50' : ''}"><div class="flex items-center justify-between"><span class="text-[11px] font-semibold text-slate-500">${esc(nhan)}</span>
    ${gopY ? `<button class="text-[11px] text-brand-700 font-semibold" onclick="EP.gopYDong('${path}')">${ic('message-square-plus', 'w-3 h-3 inline')} Góp ý</button>` : ''}</div><div class="whitespace-pre-wrap">${esc(val || '—')}</div></div>`;
  if (nd.khung === 'PL3-2345') return [muc('yeu_cau_can_dat', '1. Yêu cầu cần đạt', nd.yeu_cau_can_dat), muc('do_dung', '2. Đồ dùng dạy học', nd.do_dung),
    ...nd.hoat_dong.map((h, i) => muc(`hoat_dong.${i}.to_chuc_text`, `3. Hoạt động ${i + 1}: ${h.ten}`, h.to_chuc_text)), muc('dieu_chinh', '4. Điều chỉnh sau bài dạy', nd.dieu_chinh)].join('');
  return [muc('muc_tieu.kien_thuc', 'I.1 Về kiến thức', nd.muc_tieu.kien_thuc), muc('muc_tieu.nang_luc', 'I.2 Về năng lực', nd.muc_tieu.nang_luc), muc('muc_tieu.pham_chat', 'I.3 Về phẩm chất', nd.muc_tieu.pham_chat),
    muc('thiet_bi', 'II. Thiết bị dạy học và học liệu', nd.thiet_bi),
    ...nd.hoat_dong.flatMap((h, i) => [`<div class="font-semibold text-brand-800 pt-2">Hoạt động ${i + 1}: ${esc(h.ten || LOAI_HD[i]?.ten || '')}${h.thoi_luong ? ` (${h.thoi_luong} phút)` : ''}</div>`,
      muc(`hoat_dong.${i}.muc_tieu`, 'a) Mục tiêu', h.muc_tieu), muc(`hoat_dong.${i}.noi_dung`, 'b) Nội dung', h.noi_dung), muc(`hoat_dong.${i}.san_pham`, 'c) Sản phẩm', h.san_pham),
      ...BUOC.map((b, k) => muc(`hoat_dong.${i}.to_chuc.${b.key}`, `d) Bước ${k + 1}. ${b.ten}`, h.to_chuc[b.key]))])].join('');
}
A.gopYDong = path => {
  const m = modal(`Góp ý cho mục: ${path}`, `<textarea id="gy" class="input" rows="4" placeholder="Nội dung góp ý cụ thể…"></textarea><div class="flex justify-end mt-3"><button class="btn btn-primary" id="gy-ok">Thêm góp ý</button></div>`);
  m.querySelector('#gy-ok').onclick = () => { const v = m.querySelector('#gy').value.trim(); if (!v) return; S.tam.rv.gop_y.push({ id: uid('gy'), vi_tri: path, noi_dung: v, trang_thai: 'mo', nguoi: S.user.ho_ten, luc: now() }); closeModal(); ve(); };
};
A.ketLuan = async (id, ketLuan) => {
  const l = L(id), f = S.tam.rv, cap = capCua();
  if (ketLuan !== 'Đạt' && !f.gop_y.length && !f.ton_tai.trim()) return toast('Yêu cầu chỉnh sửa cần nêu tồn tại hoặc góp ý theo dòng.', 'warn');
  await S.kho.put('reviews', { id: uid('r'), lesson_id: id, phien_ban: l.phien_ban_hien_tai, cap, nguoi_duyet_id: S.user.id, nguoi_duyet_ten: S.user.ho_ten, ket_luan: ketLuan, uu_diem: f.uu_diem, ton_tai: f.ton_tai,
    giai_phap: f.giai_phap, nhan_xet_4_buoc: f.nhan_xet_4_buoc, nhan_xet_chung: f.nhan_xet_chung, gop_y_theo_dong: f.gop_y, luc: now() });
  let hd;
  if (ketLuan !== 'Đạt') { l.trang_thai = 'yeu_cau_chinh_sua'; hd = 'Yêu cầu chỉnh sửa'; }
  else if (cap === 'to') { l.trang_thai = 'cho_bgh_duyet'; l.to_duyet_luc = now(); hd = 'Ký duyệt cấp tổ'; }
  else { l.trang_thai = 'da_duyet'; l.duyet_luc = now(); hd = 'Phê duyệt';
    if (!S.kho.one('library', x => x.lesson_id === id)) await S.kho.put('library', { id: uid('lib'), lesson_id: id, to: l.to, the: [l.mon, `lớp ${l.lop}`], luot_dung: 0, danh_gia: null }); }
  await luuBai(l); await log(hd, l.ten_bai, `${cap === 'to' ? 'Tổ' : 'BGH'}: ${ketLuan}${f.gop_y.length ? ` · ${f.gop_y.length} góp ý theo dòng` : ''}`);
  S.tam.rv = null; toast(hd === 'Phê duyệt' ? 'Đã phê duyệt — KHBD đạt chuẩn, đưa vào Kho của tổ.' : hd === 'Ký duyệt cấp tổ' ? 'Đã ký duyệt cấp tổ — chuyển BGH.' : 'Đã gửi yêu cầu chỉnh sửa.', 'success');
  location.hash = '#/duyet';
};
A.soSanh = id => {
  const pb = S.kho.where('lesson_versions', v => v.lesson_id === id).sort((a, b) => a.so_phien_ban - b.so_phien_ban), l = L(id);
  const m = modal('So sánh phiên bản', `<div class="flex gap-2 items-center mb-3 text-sm">Từ <select id="v1" class="input !w-auto">${opt(pb.map(v => [v.so_phien_ban, `v${v.so_phien_ban} – ${v.ghi_chu}`]), pb[pb.length - 2]?.so_phien_ban)}</select>
    đến <select id="v2" class="input !w-auto">${opt(pb.map(v => [v.so_phien_ban, `v${v.so_phien_ban} – ${v.ghi_chu}`]), pb[pb.length - 1]?.so_phien_ban)}</select></div><div id="df" class="text-xs font-mono max-h-[60vh] overflow-y-auto"></div>`, { wide: true });
  const veDf = () => { const a = pb.find(v => v.so_phien_ban === +m.querySelector('#v1').value), b = pb.find(v => v.so_phien_ban === +m.querySelector('#v2').value);
    const d = diffLines(toText(a.noi_dung, l), toText(b.noi_dung, l));
    m.querySelector('#df').innerHTML = d.map(([k, s]) => `<div class="${k === '+' ? 'bg-emerald-50 text-emerald-900' : k === '-' ? 'bg-rose-50 text-rose-900 line-through' : 'text-slate-500'} px-2">${k} ${esc(s)}</div>`).join('') || 'Không khác biệt.'; };
  m.querySelector('#v1').onchange = veDf; m.querySelector('#v2').onchange = veDf; veDf();
};
function phieuHTML(x) {
  const l = L(x.lesson_id) || {}, truong = S.kho.setting('ten_truong', ''), d = new Date(x.luc);
  const ds = s => esc(s || '').split('\n').filter(Boolean).map(v => `<div>- ${v}</div>`).join('') || '<div>……………………</div>';
  return `<div class="phieu"><table style="width:100%"><tr><td style="text-align:center;width:45%"><b>${esc(truong || 'TRƯỜNG ……………')}</b><br><b>${x.cap === 'to' ? 'TỔ ' + esc(String(l.to || '').toUpperCase()) : 'BAN GIÁM HIỆU'}</b></td>
    <td style="text-align:center"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b><br><b>Độc lập - Tự do - Hạnh phúc</b><br><i>ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}</i></td></tr></table>
    <h2 style="text-align:center;font-weight:700;margin:12px 0 4px">PHIẾU NHẬN XÉT KẾ HOẠCH BÀI DẠY</h2><div style="text-align:center;font-style:italic">(Theo Phụ lục IV Công văn 5512/BGDĐT-GDTrH)</div>
    <p>Giáo viên: <b>${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || l.legacy?.teacherName || '')}</b> — Bài: <b>${esc(l.ten_bai)}</b> — ${esc(l.mon)} ${esc(l.lop ?? '')} — Người nhận xét: ${esc(x.nguoi_duyet_ten)}</p>
    <b>1. Ưu điểm</b>${ds(x.uu_diem)}<b>2. Tồn tại, hạn chế</b>${ds(x.ton_tai)}<b>3. Nhận xét 4 bước tổ chức hoạt động</b>
    <table class="grid">${BUOC.map((b, i) => `<tr><td style="width:35%">Bước ${i + 1}: ${b.ten}</td><td>${esc((x.nhan_xet_4_buoc || [])[i] || '')}</td></tr>`).join('')}</table>
    ${(x.gop_y_theo_dong || []).length ? `<b>Góp ý theo dòng</b>${x.gop_y_theo_dong.map(g => `<div>- [${esc(g.vi_tri)}] ${esc(g.noi_dung)}</div>`).join('')}` : ''}
    <b>4. Giải pháp khắc phục</b>${ds(x.giai_phap)}<b>5. Đánh giá chung: </b>${x.ket_luan === 'Đạt' ? '☒ Đạt ☐ Chưa đạt' : '☐ Đạt ☒ Chưa đạt (yêu cầu chỉnh sửa)'}<div>${esc(x.nhan_xet_chung || '')}</div>
    <table style="width:100%;margin-top:18px"><tr><td style="text-align:center"><b>GIÁO VIÊN</b><div style="height:60px"></div></td><td style="text-align:center"><b>${x.cap === 'to' ? 'TỔ TRƯỞNG CHUYÊN MÔN' : 'HIỆU TRƯỞNG'}</b><div style="height:60px"></div><b>${esc(x.nguoi_duyet_ten)}</b></td></tr></table></div>`;
}
A.inPhieu = rid => { $('#print-area').innerHTML = phieuHTML(S.kho.get('reviews', rid)); log('In phiếu nhận xét A4', L(S.kho.get('reviews', rid).lesson_id)?.ten_bai); setTimeout(() => window.print(), 50); };
A.chepPhieu = async rid => { const x = S.kho.get('reviews', rid), l = L(x.lesson_id);
  const t = `📋 PHIẾU NHẬN XÉT KHBD — ${l.ten_bai} (${l.mon} ${l.lop})\nNgười nhận xét: ${x.nguoi_duyet_ten} (${x.cap === 'to' ? 'Tổ' : 'BGH'}) · ${fmtDT(x.luc)}\n✅ Ưu điểm: ${x.uu_diem}\n⚠️ Tồn tại: ${x.ton_tai}\n💡 Giải pháp: ${x.giai_phap}\n${(x.gop_y_theo_dong || []).map(g => `• [${g.vi_tri}] ${g.noi_dung}`).join('\n')}\n🏁 Kết luận: ${x.ket_luan}`;
  toast((await copyText(t)) ? 'Đã sao chép — dán vào Zalo/Email.' : 'Không sao chép được.', 'success'); };

// =========================================================== P10 — Dự giờ (PL V)
export async function duGio(id) {
  const plv = S.data.plv;
  if (!id) {
    const ds = baiNhinThay().filter(l => l.trang_thai !== 'ban_nhap');
    const obs = S.kho.all('observations').sort((a, b) => b.ngay.localeCompare(a.ngay));
    $('#main').innerHTML = `<h1 class="text-xl font-extrabold mb-1 flex items-center gap-2">${ic('eye', 'w-5 h-5 text-brand-600')}Dự giờ — Phiếu đánh giá bài dạy (Phụ lục V)</h1>
    <p class="text-sm text-slate-500 mb-4">${esc(plv.nguon)}. 12 tiêu chí · 20 điểm · Giỏi ≥ 18 · Khá 13,5–<18 · TB 10–<13,5 · Không đạt < 10.</p>
    ${quyen('du_gio') ? `<div class="card mb-4"><div class="px-4 py-3 border-b font-bold">Chọn KHBD để dự giờ</div><div class="overflow-x-auto"><table class="w-full tbl"><tbody>${ds.map(l => `<tr><td>${esc(l.ten_bai)}<div class="text-[11px] text-slate-500">${esc(l.mon)} ${esc(l.lop ?? '')} · ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || '')}</div></td><td><span class="badge ${TRANG_THAI[l.trang_thai][1]}">${TRANG_THAI[l.trang_thai][0]}</span></td><td class="text-right"><a class="btn btn-primary !py-1 text-xs" href="#/du-gio/${l.id}">Dự giờ</a></td></tr>`).join('') || '<tr><td class="text-slate-500 p-4">Chưa có KHBD đã nộp.</td></tr>'}</tbody></table></div></div>` : ''}
    <div class="card"><div class="px-4 py-3 border-b font-bold">Phiếu dự giờ đã lưu (${obs.length})</div><div class="overflow-x-auto"><table class="w-full tbl"><thead><tr><th>Ngày</th><th>Bài dạy</th><th>Lớp</th><th>Người dự</th><th>Tổng</th><th>Xếp loại</th><th></th></tr></thead><tbody>
    ${obs.map(o => `<tr><td>${fmtD(o.ngay)}</td><td>${esc(L(o.lesson_id)?.ten_bai || '')}</td><td>${esc(o.lop)}</td><td>${esc(o.ten_nguoi_du_gio)}</td><td><b>${o.phieu_PLV.tong_diem}</b>/20</td><td>${esc(o.phieu_PLV.xep_loai)}</td>
      <td class="text-right"><button class="btn btn-ghost !py-1 text-xs" onclick="EP.inPLV('${o.id}')">${ic('printer', 'w-3.5 h-3.5')}In A4</button></td></tr>`).join('') || '<tr><td colspan="7" class="text-center text-slate-500 py-6">Chưa có phiếu.</td></tr>'}</tbody></table></div></div>`;
    return;
  }
  const l = L(id); if (!l) return;
  const r = await raSoat(l), goiY = goiYTuRaSoat(r.chi_so);
  const f = S.tam.ob?.id === id ? S.tam.ob : (S.tam.ob = { id, lop: '', tiet: 1, ngay: new Date().toISOString().slice(0, 10), muc: plv.tieu_chi.map(() => 0), diem: plv.tieu_chi.map(() => ''), nhan_xet: plv.tieu_chi.map(() => ''),
    p4: { hanh_dong_hs: '', ket_qua: '', nguyen_nhan: '', bien_phap: '' }, de_xuat: '' });
  const th = tongHop(plv, f.diem);
  $('#main').innerHTML = `<a href="#/du-gio" class="text-xs text-brand-700">← Dự giờ</a><h1 class="text-xl font-extrabold mb-1">Phiếu đánh giá bài dạy — ${esc(l.ten_bai)}</h1>
  <p class="text-sm text-slate-500 mb-3">${esc(l.mon)} ${esc(l.lop ?? '')} · GV ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || '')} · ${esc(plv.nguon)}</p>
  <div class="card p-3 mb-3 grid sm:grid-cols-4 gap-2 text-sm"><div><label class="label">Lớp</label><input class="input" data-ob="lop" value="${esc(f.lop)}"></div><div><label class="label">Tiết</label><input class="input" type="number" data-ob="tiet" value="${f.tiet}"></div>
    <div><label class="label">Ngày</label><input class="input" type="date" data-ob="ngay" value="${f.ngay}"></div>
    <div class="flex items-end"><button class="btn btn-soft w-full" onclick="EP.goiYPLV('${id}')" title="Từ chỉ số rà soát: cấu trúc ${r.chi_so.cau_truc}%, nhất quán ${r.chi_so.nhat_quan}%">${ic('sparkles')}AI gợi ý nhóm "Kế hoạch bài dạy"</button></div></div>
  <div class="card overflow-x-auto mb-3"><table class="w-full tbl"><thead><tr><th class="w-16">Mã</th><th>Tiêu chí</th><th class="w-14">Tối đa</th><th class="w-56">Mức</th><th class="w-24">Điểm</th></tr></thead><tbody>
  ${plv.tieu_chi.map((tc, i) => { const e = f.diem[i] === '' ? '' : kiemDiem(f.diem[i], tc.diem_toi_da); return `${i % 4 === 0 ? `<tr><td colspan="5" class="bg-brand-50 font-bold text-brand-900">${i / 4 + 1}. ${esc(tc.nhom)}</td></tr>` : ''}<tr>
    <td class="font-semibold">${tc.ma}</td><td>${esc(tc.noi_dung)}${f.muc[i] ? `<div class="text-[11px] text-slate-500 mt-1 bg-slate-50 rounded p-1.5">Mức ${f.muc[i]}: ${esc(tc.muc[f.muc[i] - 1])}</div>` : ''}
      <input class="input text-xs mt-1" data-nx="${i}" placeholder="Nhận xét (tùy chọn)" value="${esc(f.nhan_xet[i])}"></td><td>${tc.diem_toi_da}</td>
    <td><div class="flex gap-1">${[1, 2, 3].map(m => `<button class="btn ${f.muc[i] === m ? 'btn-primary' : 'btn-ghost'} !px-2 !py-1 text-xs" onclick="EP.chonMuc(${i},${m})" title="${khoangDiem(tc.diem_toi_da, m).join('–')} điểm">Mức ${m}</button>`).join('')}</div>${goiY[tc.ma] ? `<div class="text-[10px] text-violet-700 mt-0.5">AI gợi ý: mức ${goiY[tc.ma] || '<1'}</div>` : ''}</td>
    <td><input class="input text-sm ${e ? 'border-rose-400' : ''}" type="number" step="0.25" min="0" max="${tc.diem_toi_da}" data-d="${i}" value="${f.diem[i]}">${e ? `<div class="text-[10px] text-rose-600">${esc(e)}</div>` : ''}</td></tr>`; }).join('')}
  <tr class="bg-slate-50 font-bold"><td colspan="4" class="text-right">Tổng điểm · Xếp loại</td><td>${th.loi.length ? `${th.tong} (chưa đủ)` : `${th.tong} · ${th.xep_loai}`}</td></tr></tbody></table></div>
  <div class="card p-4 mb-3 space-y-2"><div class="font-bold text-sm">Phân tích bài dạy theo 4 bước (CV 5512, chú thích [7])</div>
    ${[['hanh_dong_hs', '(1) Mô tả hành động của HS (đọc, nghe, viết, nói, làm)'], ['ket_qua', '(2) Đánh giá kết quả: điều HS đã học được, chưa học được'], ['nguyen_nhan', '(3) Phân tích nguyên nhân'], ['bien_phap', '(4) Biện pháp khắc phục, hoàn thiện kế hoạch dạy học']]
      .map(([k, n]) => `<div><label class="label">${n}</label><textarea class="input text-sm" rows="2" data-p4="${k}">${esc(f.p4[k])}</textarea></div>`).join('')}
    <div><label class="label">Đề xuất điều chỉnh (sẽ đưa vào mục "Điều chỉnh sau bài dạy" của KHBD)</label><textarea class="input text-sm" rows="2" data-ob="de_xuat">${esc(f.de_xuat)}</textarea></div></div>
  <div class="card p-3 flex justify-end gap-2"><button class="btn btn-primary" onclick="EP.luuPLV('${id}')">${ic('save')}Lưu phiếu & đẩy điều chỉnh về KHBD</button></div>`;
  $$('[data-ob]').forEach(el => el.onchange = () => { f[el.dataset.ob] = el.type === 'number' ? +el.value : el.value; });
  $$('[data-nx]').forEach(el => el.onchange = () => { f.nhan_xet[+el.dataset.nx] = el.value; });
  $$('[data-p4]').forEach(el => el.onchange = () => { f.p4[el.dataset.p4] = el.value; });
  $$('[data-d]').forEach(el => el.onchange = () => { f.diem[+el.dataset.d] = el.value === '' ? '' : +el.value; ve(); });
  icons();
}
A.chonMuc = (i, m) => { const f = S.tam.ob, tc = S.data.plv.tieu_chi[i]; f.muc[i] = m; f.diem[i] = diemGoiY(tc.diem_toi_da, m); ve(); };
A.goiYPLV = async id => { const r = await raSoat(L(id)), g = goiYTuRaSoat(r.chi_so), f = S.tam.ob;
  S.data.plv.tieu_chi.forEach((tc, i) => { if (g[tc.ma]) { f.muc[i] = g[tc.ma]; f.diem[i] = diemGoiY(tc.diem_toi_da, g[tc.ma]); } });
  toast('Đã gợi ý mức cho nhóm "Kế hoạch bài dạy" từ kết quả rà soát — người dự giờ kiểm tra, điều chỉnh.', 'info'); ve(); };
A.luuPLV = async id => {
  const f = S.tam.ob, plv = S.data.plv, th = tongHop(plv, f.diem), l = L(id);
  if (th.loi.length) return toast(`Chưa hoàn chỉnh: ${th.loi[0]}`, 'warn');
  await S.kho.put('observations', { id: uid('ob'), lesson_id: id, nguoi_du_gio: S.user.id, ten_nguoi_du_gio: S.user.ho_ten, lop: f.lop, tiet: f.tiet, ngay: new Date(f.ngay).toISOString(),
    phieu_PLV: { tieu_chi: plv.tieu_chi.map((tc, i) => ({ ma: tc.ma, muc: f.muc[i], diem: +f.diem[i], nhan_xet: f.nhan_xet[i] })), tong_diem: th.tong, xep_loai: th.xep_loai },
    phan_tich_4_buoc: f.p4, de_xuat_dieu_chinh: f.de_xuat });
  if (f.de_xuat.trim()) { const nd = ndCua(l); nd.dieu_chinh = [nd.dieu_chinh, `Sau dự giờ ${new Date(f.ngay).toLocaleDateString('vi-VN')} (${S.user.ho_ten}): ${f.de_xuat.trim()}`].filter(Boolean).join('\n');
    if (l.trang_thai === 'da_duyet') l.trang_thai = 'da_day'; await luuBai(l); }
  await log('Dự giờ (PL V)', l.ten_bai, `${th.tong} điểm · ${th.xep_loai}`); S.tam.ob = null; toast(`Đã lưu phiếu: ${th.tong}/20 — ${th.xep_loai}.`, 'success'); location.hash = '#/du-gio';
};
A.inPLV = oid => {
  const o = S.kho.get('observations', oid), l = L(o.lesson_id) || {}, plv = S.data.plv;
  $('#print-area').innerHTML = `<div class="phieu"><div style="text-align:center"><b>PHIẾU ĐÁNH GIÁ BÀI DẠY</b><br><i>(${esc(plv.nguon)})</i></div>
    <p>Tên bài dạy: <b>${esc(l.ten_bai)}</b> — Môn: ${esc(l.mon)} — Lớp: ${esc(o.lop)} — Tiết: ${o.tiet} — Ngày: ${fmtD(o.ngay)}<br>Giáo viên thực hiện: ${esc(S.kho.get('users', l.giao_vien_id)?.ho_ten || '')}</p>
    <table class="grid"><tr><th>Nội dung</th><th>Tiêu chí</th><th>Tối đa</th><th>Điểm</th></tr>${plv.tieu_chi.map((tc, i) => `<tr><td>${i % 4 === 0 ? esc(tc.nhom) : ''}</td><td>${esc(tc.noi_dung)}</td><td>${tc.diem_toi_da}</td><td>${o.phieu_PLV.tieu_chi[i]?.diem ?? ''}</td></tr>`).join('')}
    <tr><td colspan="2"><b>Tổng điểm</b></td><td>20</td><td><b>${o.phieu_PLV.tong_diem}</b></td></tr></table><p><b>Xếp loại: ${esc(o.phieu_PLV.xep_loai)}</b></p>
    <p><b>Phân tích 4 bước:</b><br>(1) ${esc(o.phan_tich_4_buoc.hanh_dong_hs)}<br>(2) ${esc(o.phan_tich_4_buoc.ket_qua)}<br>(3) ${esc(o.phan_tich_4_buoc.nguyen_nhan)}<br>(4) ${esc(o.phan_tich_4_buoc.bien_phap)}</p>
    <p style="text-align:right"><b>Người đánh giá</b><br><i>(Ký và ghi rõ họ tên)</i><br><br><br>${esc(o.ten_nguoi_du_gio)}</p></div>`;
  setTimeout(() => window.print(), 50);
};
