// Tiện ích giao diện dùng chung.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const ic = (n, c = 'w-4 h-4') => `<i data-lucide="${n}" class="${c}"></i>`;
export const icons = () => { try { window.lucide?.createIcons(); } catch { /* CDN chưa tải */ } };
export const fmtD = iso => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '—');
export const fmtDT = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
export const opt = (arr, sel, all) => (all ? `<option value="">${esc(all)}</option>` : '') + arr.map(x => { const [v, t] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`; }).join('');

export function toast(msg, type = 'info') {
  const bg = { info: 'bg-slate-900', success: 'bg-emerald-600', error: 'bg-rose-600', warn: 'bg-amber-500' }[type] || 'bg-slate-900';
  const el = document.createElement('div');
  el.className = `${bg} text-white text-sm px-4 py-3 rounded-xl shadow-lg max-w-sm fade-in`;
  el.setAttribute('role', 'status');
  el.textContent = msg;
  $('#toast-root').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = '.3s'; setTimeout(() => el.remove(), 300); }, 3500);
}

export function modal(title, body, { wide = false, size = 'max-w-lg' } = {}) {
  $('#modal-root').innerHTML = `<div class="fixed inset-0 z-[70] bg-slate-900/50 flex items-start sm:items-center justify-center p-3 overflow-y-auto" data-close-bg>
    <div class="card w-full ${wide ? 'max-w-5xl' : size} my-6 fade-in" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100"><h3 class="font-bold text-slate-900">${esc(title)}</h3>
      <button class="p-1.5 rounded-lg hover:bg-slate-100" data-close aria-label="Đóng">${ic('x', 'w-5 h-5')}</button></div>
      <div class="p-5 max-h-[78vh] overflow-y-auto">${body}</div></div></div>`;
  $('#modal-root [data-close]').onclick = closeModal;
  $('#modal-root [data-close-bg]').onclick = e => { if (e.target.hasAttribute('data-close-bg')) closeModal(); };
  icons();
  return $('#modal-root');
}
export const closeModal = () => { $('#modal-root').innerHTML = ''; };
export function confirmBox(msg, yes = 'Đồng ý') {
  return new Promise(res => {
    const m = modal('Xác nhận', `<p class="text-sm text-slate-600 mb-5">${esc(msg)}</p><div class="flex justify-end gap-2"><button class="btn btn-ghost" data-no>Hủy</button><button class="btn btn-primary" data-yes>${esc(yes)}</button></div>`);
    m.querySelector('[data-no]').onclick = () => { closeModal(); res(false); };
    m.querySelector('[data-yes]').onclick = () => { closeModal(); res(true); };
  });
}
export function download(name, content, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name });
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
export async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch { return false; } }
export const slug = s => String(s || 'bai-day').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
export function gauge(v, label, sub = '') {
  const r = 34, c = 2 * Math.PI * r, col = v >= 85 ? '#059669' : v >= 70 ? '#2563eb' : v >= 50 ? '#d97706' : '#e11d48';
  return `<div class="card p-3 flex items-center gap-3"><svg viewBox="0 0 84 84" class="w-16 h-16 -rotate-90 shrink-0" aria-hidden="true"><circle cx="42" cy="42" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="9"/>
    <circle cx="42" cy="42" r="${r}" fill="none" stroke="${col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v / 100)}"/>
    <text x="42" y="42" transform="rotate(90 42 42)" text-anchor="middle" dominant-baseline="central" font-size="18" font-weight="800" fill="${col}">${v}</text></svg>
    <div class="min-w-0"><div class="text-sm font-bold text-slate-800">${esc(label)}</div><div class="text-[11px] text-slate-500">${esc(sub)}</div></div></div>`;
}
export const MUC = { do: ['🔴', 'bg-rose-50 border-rose-200 text-rose-800', 'Chặn nộp'], vang: ['🟡', 'bg-amber-50 border-amber-200 text-amber-900', 'Cảnh báo'], xanh: ['🟢', 'bg-emerald-50 border-emerald-200 text-emerald-900', 'Gợi ý'] };
/** Diff dòng đơn giản (LCS) cho so sánh phiên bản. */
export function diffLines(a, b) {
  const A = String(a || '').split('\n'), B = String(b || '').split('\n'), n = A.length, m = B.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out = []; let i = 0, j = 0;
  while (i < n && j < m) { if (A[i] === B[j]) { out.push([' ', A[i]]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) out.push(['-', A[i++]]); else out.push(['+', B[j++]]); }
  while (i < n) out.push(['-', A[i++]]); while (j < m) out.push(['+', B[j++]]);
  return out;
}
