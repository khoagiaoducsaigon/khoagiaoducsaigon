/* MultiPost — giao dien soan va dang bai da nen tang */
'use strict';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const state = {
  platforms: [],
  selected: new Set(),
  hashtags: [],
  media: [],
  posts: [],
  dryRun: false,
};

const LABELS = {
  FACEBOOK_PAGE_ID: 'Page ID',
  FACEBOOK_PAGE_ACCESS_TOKEN: 'Page Access Token',
  INSTAGRAM_USER_ID: 'Instagram Business User ID',
  INSTAGRAM_ACCESS_TOKEN: 'Access Token',
  THREADS_USER_ID: 'Threads User ID',
  THREADS_ACCESS_TOKEN: 'Access Token',
  TIKTOK_ACCESS_TOKEN: 'Access Token',
  TIKTOK_PRIVACY_LEVEL: 'Mức riêng tư (SELF_ONLY / PUBLIC_TO_EVERYONE / MUTUAL_FOLLOW_FRIENDS)',
  TELEGRAM_BOT_TOKEN: 'Bot Token (từ @BotFather)',
  TELEGRAM_CHAT_IDS: 'Chat ID — ngăn cách bằng dấu phẩy (VD: @kenh_cua_toi,-1001234567890)',
  WHATSAPP_PHONE_NUMBER_ID: 'Phone Number ID',
  WHATSAPP_ACCESS_TOKEN: 'Access Token',
  WHATSAPP_RECIPIENTS: 'Số người nhận — E.164 không dấu +, ngăn cách bằng dấu phẩy (VD: 84901234567)',
  ZALO_OA_ACCESS_TOKEN: 'OA Access Token',
  ZALO_POST_MODE: 'Cách đăng: message (nhắn người theo dõi) / article (bài trên trang OA) / both',
  ZALO_USER_IDS: 'User ID người theo dõi — ngăn cách bằng dấu phẩy',
  ZALO_APP_ID: 'App ID (để tự làm mới token)',
  ZALO_APP_SECRET: 'App Secret (để tự làm mới token)',
  ZALO_OA_REFRESH_TOKEN: 'Refresh Token (để tự làm mới token)',
  ZALO_ARTICLE_AUTHOR: 'Tên tác giả hiển thị trên bài viết OA',
};

const STATUS_TEXT = {
  queued: 'trong hàng đợi',
  publishing: 'đang đăng',
  published: 'thành công',
  partial: 'một phần',
  failed: 'thất bại',
  scheduled: 'hẹn giờ',
};

/* ============================ API ============================ */
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `Lỗi ${res.status}`), { data });
  return data;
}

/* ============================ Tiện ích ============================ */
function toast(message, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = message;
  $('#toast-wrap').append(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 250); }, 4200);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

/* ============================ Tabs & giao diện ============================ */
$$('.tab').forEach((tab) => tab.addEventListener('click', () => {
  $$('.tab').forEach((t) => t.classList.toggle('active', t === tab));
  $$('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === `tab-${tab.dataset.tab}`));
  if (tab.dataset.tab === 'history') loadHistory();
  if (tab.dataset.tab === 'settings') loadSettings();
}));

$('#theme-toggle').addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  $('#theme-toggle').textContent = next === 'dark' ? '☀️' : '🌙';
  try { localStorage.setItem('multipost-theme', next); } catch { /* bo qua */ }
});
try {
  const saved = localStorage.getItem('multipost-theme');
  if (saved) {
    document.documentElement.dataset.theme = saved;
    $('#theme-toggle').textContent = saved === 'dark' ? '☀️' : '🌙';
  }
} catch { /* bo qua */ }

/* ============================ Nền tảng ============================ */
async function loadPlatforms() {
  const data = await api('/platforms');
  state.platforms = data.platforms;
  state.dryRun = data.dryRun;

  const badge = $('#mode-badge');
  badge.textContent = data.dryRun ? '🧪 Chế độ mô phỏng' : '🟢 Đăng thật';
  badge.className = `badge ${data.dryRun ? 'badge-dry' : 'badge-live'}`;

  const list = $('#platform-list');
  list.innerHTML = state.platforms.map((p) => `
    <div class="platform" data-id="${p.id}" role="button" tabindex="0">
      <span class="p-emoji">${p.emoji}</span>
      <div class="p-body">
        <div class="p-name">${esc(p.name)}</div>
        <div class="p-meta">
          <span class="dot ${p.configured ? 'dot-ok' : 'dot-off'}"></span>
          ${p.configured ? 'đã kết nối' : 'chưa kết nối — sẽ mô phỏng'} · tối đa ${p.limits.text.toLocaleString('vi-VN')} ký tự
        </div>
      </div>
      <input type="checkbox" ${state.selected.has(p.id) ? 'checked' : ''} tabindex="-1">
    </div>`).join('');

  list.querySelectorAll('.platform').forEach((el) => {
    const toggle = () => {
      const id = el.dataset.id;
      if (state.selected.has(id)) state.selected.delete(id); else state.selected.add(id);
      el.classList.toggle('on', state.selected.has(id));
      el.querySelector('input').checked = state.selected.has(id);
      renderPreviews();
    };
    el.addEventListener('click', toggle);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    el.classList.toggle('on', state.selected.has(el.dataset.id));
  });
}

$('#btn-toggle-all').addEventListener('click', () => {
  const all = state.selected.size === state.platforms.length;
  state.selected = all ? new Set() : new Set(state.platforms.map((p) => p.id));
  loadPlatforms().then(renderPreviews);
});

/* ============================ Soạn nội dung ============================ */
const textEl = $('#text');
textEl.addEventListener('input', () => { updateCounter(); renderPreviews(); });
['#title', '#link', '#signature'].forEach((sel) => $(sel).addEventListener('input', renderPreviews));

function updateCounter() {
  const t = textEl.value;
  const words = t.trim() ? t.trim().split(/\s+/).length : 0;
  $('#char-count').textContent = `${t.length.toLocaleString('vi-VN')} ký tự · ${words.toLocaleString('vi-VN')} từ`;
}

$('#btn-clear').addEventListener('click', () => {
  if (!textEl.value || confirm('Xoá toàn bộ nội dung đang soạn?')) {
    textEl.value = ''; updateCounter(); renderPreviews();
  }
});

/* --- Hashtag --- */
const hashtagInput = $('#hashtag-input');
hashtagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addHashtags(hashtagInput.value); hashtagInput.value = ''; }
  else if (e.key === 'Backspace' && !hashtagInput.value && state.hashtags.length) {
    state.hashtags.pop(); renderHashtags(); renderPreviews();
  }
});
$$('.chip-suggest').forEach((b) => b.addEventListener('click', () => addHashtags(b.textContent)));

function addHashtags(raw) {
  raw.split(/[,\s]+/).map((s) => s.trim().replace(/^#/, '')).filter(Boolean).forEach((tag) => {
    if (!state.hashtags.includes(tag)) state.hashtags.push(tag);
  });
  renderHashtags(); renderPreviews();
}

function renderHashtags() {
  $('#hashtag-box').querySelectorAll('.chip').forEach((c) => c.remove());
  state.hashtags.forEach((tag, i) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `#${esc(tag)} <button type="button" aria-label="Bỏ">×</button>`;
    chip.querySelector('button').addEventListener('click', () => {
      state.hashtags.splice(i, 1); renderHashtags(); renderPreviews();
    });
    $('#hashtag-box').insertBefore(chip, hashtagInput);
  });
}

/* ============================ Media ============================ */
const dropzone = $('#dropzone');
$('#btn-browse').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', (e) => uploadFiles(Array.from(e.target.files)));
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('drag'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag'));
dropzone.addEventListener('drop', (e) => {
  e.preventDefault(); dropzone.classList.remove('drag');
  uploadFiles(Array.from(e.dataTransfer.files));
});

$('#btn-add-url').addEventListener('click', () => {
  const url = $('#media-url').value.trim();
  if (!url) return;
  const isVideo = /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
  state.media.push({ url, type: isVideo ? 'video' : 'image', name: url.split('/').pop() });
  $('#media-url').value = '';
  renderMedia(); renderPreviews();
});

async function uploadFiles(files) {
  for (const file of files) {
    try {
      const data = await fileToBase64(file);
      const res = await api('/upload', {
        method: 'POST',
        body: { name: file.name, mime: file.type, data },
      });
      state.media.push({ url: res.url, type: res.type, name: res.name });
      if (res.warning) { $('#media-warning').textContent = `⚠️ ${res.warning}`; $('#media-warning').classList.remove('hidden'); }
      toast(`Đã tải lên ${file.name}`, 'ok');
    } catch (err) {
      toast(`Không tải được ${file.name}: ${err.message}`, 'err');
    }
  }
  renderMedia(); renderPreviews();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error('Không đọc được file'));
    reader.readAsDataURL(file);
  });
}

function renderMedia() {
  $('#media-list').innerHTML = state.media.map((m, i) => `
    <div class="media-item">
      ${m.type === 'video'
        ? `<video src="${esc(m.url)}" muted></video>`
        : `<img src="${esc(m.url)}" alt="${esc(m.name || '')}" loading="lazy">`}
      <button class="media-del" data-i="${i}" type="button" aria-label="Xoá">×</button>
      <div class="media-meta">${m.type === 'video' ? '🎬' : '🖼️'} ${esc(m.name || m.url)}</div>
    </div>`).join('');
  $('#media-list').querySelectorAll('.media-del').forEach((b) => b.addEventListener('click', () => {
    state.media.splice(Number(b.dataset.i), 1); renderMedia(); renderPreviews();
  }));
}

/* ============================ Hẹn giờ ============================ */
$$('input[name="when"]').forEach((r) => r.addEventListener('change', () => {
  $('#schedule-box').classList.toggle('hidden', r.value !== 'later' || !r.checked);
}));

/* ============================ Xem trước ============================ */
function composeText() {
  const parts = [textEl.value.trim()];
  if (state.hashtags.length) parts.push(state.hashtags.map((h) => `#${h}`).join(' '));
  const sig = $('#signature').value.trim();
  if (sig) parts.push(sig);
  return parts.filter(Boolean).join('\n\n');
}

function renderPreviews() {
  const box = $('#preview-list');
  if (state.selected.size === 0) {
    box.innerHTML = '<p class="hint">Chọn nền tảng để xem trước.</p>';
    return;
  }
  box.innerHTML = state.platforms.filter((p) => state.selected.has(p.id)).map((p) => {
    const text = composeText();
    const limit = p.limits.text;
    const over = text.length > limit;
    const mediaNote = state.media.length
      ? `${state.media.length} media`
      : (p.mediaSupport.text ? 'không media' : '⚠️ bắt buộc có media');
    return `
      <div class="preview" style="border-left-color:${p.color}">
        <div class="preview-head">
          <span>${p.emoji} ${esc(p.name)}</span>
          <span class="${over ? 'len-bad' : 'len-ok'}">${text.length}/${limit.toLocaleString('vi-VN')}</span>
        </div>
        <div class="preview-body">${esc(text) || '<i>(trống)</i>'}</div>
        <p class="hint">${mediaNote}${p.warning ? ` · ⚠️ ${esc(p.warning)}` : ''}</p>
      </div>`;
  }).join('');
}

/* ============================ Gửi bài ============================ */
function collectPost() {
  const when = $$('input[name="when"]').find((r) => r.checked)?.value;
  return {
    title: $('#title').value.trim(),
    text: textEl.value,
    link: $('#link').value.trim(),
    signature: $('#signature').value.trim(),
    hashtags: state.hashtags,
    media: state.media,
    platforms: Array.from(state.selected),
    dryRun: $('#dry-run').checked,
    scheduledAt: when === 'later' && $('#scheduled-at').value
      ? new Date($('#scheduled-at').value).toISOString()
      : null,
  };
}

$('#btn-check').addEventListener('click', async () => {
  if (state.selected.size === 0) return toast('Hãy chọn ít nhất một nền tảng', 'err');
  try {
    const { report } = await api('/validate', { method: 'POST', body: collectPost() });
    showValidation(report);
  } catch (err) { toast(err.message, 'err'); }
});

function showValidation(report) {
  const box = $('#validation');
  const problems = Object.entries(report).filter(([, errs]) => errs.length > 0);
  box.classList.remove('hidden');
  if (problems.length === 0) {
    box.className = 'validation ok';
    box.textContent = '✅ Nội dung hợp lệ trên tất cả nền tảng đã chọn.';
    return;
  }
  box.className = 'validation bad';
  box.innerHTML = `<strong>Cần xem lại:</strong><ul>${problems.map(([id, errs]) => {
    const p = state.platforms.find((x) => x.id === id);
    return errs.map((e) => `<li>${p ? p.emoji : ''} <b>${esc(p ? p.name : id)}</b>: ${esc(e)}</li>`).join('');
  }).join('')}</ul>`;
}

$('#btn-publish').addEventListener('click', async () => {
  if (state.selected.size === 0) return toast('Hãy chọn ít nhất một nền tảng', 'err');
  const post = collectPost();
  const btn = $('#btn-publish');
  btn.disabled = true;
  $('#publish-status').textContent = post.scheduledAt ? 'Đang lên lịch…' : 'Đang gửi tới các nền tảng…';

  try {
    const { post: saved } = await api('/posts', { method: 'POST', body: post });
    if (saved.status === 'scheduled') {
      toast(`Đã hẹn giờ lúc ${fmtTime(saved.scheduledAt)}`, 'ok');
      $('#publish-status').textContent = `⏰ Hẹn giờ ${fmtTime(saved.scheduledAt)}`;
    } else {
      const ok = saved.results.filter((r) => r.status !== 'error').length;
      toast(`Xong: ${ok}/${saved.results.length} nền tảng`, ok === saved.results.length ? 'ok' : 'err');
      $('#publish-status').innerHTML = saved.results.map((r) =>
        `${state.platforms.find((p) => p.id === r.platform)?.emoji || ''} <span class="r-${r.status}">${r.status === 'ok' ? '✓' : r.status === 'simulated' ? '~' : '✗'}</span>`).join(' &nbsp; ');
    }
    loadHistory();
  } catch (err) {
    if (err.data?.report) showValidation(err.data.report);
    toast(err.message, 'err');
    $('#publish-status').textContent = '';
  } finally {
    btn.disabled = false;
  }
});

/* ============================ Lịch sử ============================ */
$('#btn-refresh').addEventListener('click', loadHistory);
$('#history-filter').addEventListener('change', loadHistory);

async function loadHistory() {
  try {
    const status = $('#history-filter').value;
    const { posts, stats } = await api(`/posts${status ? `?status=${status}` : ''}`);
    state.posts = posts;
    renderStats(stats);
    renderHistory(posts);
  } catch (err) { toast(err.message, 'err'); }
}

function renderStats(stats) {
  const cells = [
    { val: stats.total, lbl: 'Bài đã soạn' },
    { val: stats.published, lbl: 'Lượt đăng thành công' },
    { val: stats.failed, lbl: 'Lượt thất bại' },
    { val: stats.scheduled, lbl: 'Đang hẹn giờ' },
  ];
  const perPlatform = Object.entries(stats.byPlatform).map(([id, v]) => {
    const p = state.platforms.find((x) => x.id === id);
    return { val: `${v.ok}/${v.ok + v.error}`, lbl: `${p ? p.emoji : ''} ${p ? p.name : id}` };
  });
  $('#stats').innerHTML = [...cells, ...perPlatform].map((c) =>
    `<div class="stat"><div class="stat-val">${esc(c.val)}</div><div class="stat-lbl">${esc(c.lbl)}</div></div>`).join('');
}

function renderHistory(posts) {
  const box = $('#history-list');
  if (posts.length === 0) { box.innerHTML = '<p class="hint">Chưa có bài nào.</p>'; return; }

  box.innerHTML = posts.map((post) => {
    const results = post.results || [];
    const rows = results.map((r) => {
      const p = state.platforms.find((x) => x.id === r.platform);
      const detail = r.status === 'error'
        ? esc(r.error || '')
        : [r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">mở bài đăng</a>` : '', esc(r.note || '')].filter(Boolean).join(' · ');
      return `<tr>
        <td>${p ? p.emoji : ''} ${esc(p ? p.name : r.platform)}</td>
        <td class="r-${r.status}">${r.status}</td>
        <td>${detail || '—'}</td>
        <td>${r.durationMs != null ? `${(r.durationMs / 1000).toFixed(1)}s` : '—'}</td>
      </tr>`;
    }).join('');

    const hasFailed = results.some((r) => r.status === 'error');
    return `
      <div class="history-item" data-id="${post.id}">
        <div class="history-head">
          <span class="status-pill st-${post.status}">${STATUS_TEXT[post.status] || post.status}</span>
          <span class="hint">${post.scheduledAt ? `⏰ ${fmtTime(post.scheduledAt)}` : fmtTime(post.createdAt)}
            · ${post.platforms.map((id) => state.platforms.find((p) => p.id === id)?.emoji || id).join(' ')}
            ${post.media?.length ? ` · ${post.media.length} media` : ''}</span>
        </div>
        <div class="history-text">${esc(post.text || '(không có nội dung chữ)')}</div>
        ${rows ? `<table class="result-table"><thead><tr><th>Nền tảng</th><th>Kết quả</th><th>Chi tiết</th><th>Thời gian</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
        <div class="history-actions">
          ${hasFailed ? '<button class="btn btn-secondary btn-sm" data-act="retry">↻ Đăng lại phần lỗi</button>' : ''}
          ${post.status === 'scheduled' ? '<button class="btn btn-secondary btn-sm" data-act="publish">🚀 Đăng ngay</button>' : ''}
          ${results.some((r) => r.platform === 'tiktok' && r.status === 'ok') ? '<button class="btn btn-secondary btn-sm" data-act="status">🔎 Kiểm tra trạng thái</button>' : ''}
          <button class="btn btn-secondary btn-sm" data-act="clone">📋 Soạn lại từ bài này</button>
          <button class="btn btn-danger btn-sm" data-act="delete">🗑 Xoá</button>
        </div>
      </div>`;
  }).join('');

  box.querySelectorAll('[data-act]').forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.closest('.history-item').dataset.id;
    const act = btn.dataset.act;
    try {
      if (act === 'delete') {
        if (!confirm('Xoá bài này khỏi lịch sử?')) return;
        await api(`/posts/${id}`, { method: 'DELETE' });
      } else if (act === 'clone') {
        clonePost(state.posts.find((p) => p.id === id));
        return;
      } else {
        btn.disabled = true;
        await api(`/posts/${id}/${act}`, { method: 'POST' });
      }
      toast('Đã cập nhật', 'ok');
      loadHistory();
    } catch (err) { toast(err.message, 'err'); btn.disabled = false; }
  }));
}

function clonePost(post) {
  if (!post) return;
  $('#title').value = post.title || '';
  textEl.value = post.text || '';
  $('#link').value = post.link || '';
  $('#signature').value = post.signature || '';
  state.hashtags = [...(post.hashtags || [])];
  state.media = [...(post.media || [])];
  state.selected = new Set(post.platforms || []);
  renderHashtags(); renderMedia(); updateCounter();
  loadPlatforms().then(renderPreviews);
  $$('.tab').find((t) => t.dataset.tab === 'compose').click();
  toast('Đã nạp lại nội dung vào ô soạn', 'ok');
}

/* ============================ Mẫu ============================ */
async function loadTemplates() {
  try {
    const { templates } = await api('/templates');
    $('#template-picker').innerHTML = '<option value="">— Mẫu có sẵn —</option>'
      + templates.map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');
    state.templates = templates;
  } catch { /* khong chan giao dien */ }
}

$('#template-picker').addEventListener('change', (e) => {
  const tpl = (state.templates || []).find((t) => t.id === e.target.value);
  if (!tpl) return;
  textEl.value = tpl.text;
  state.hashtags = [...(tpl.hashtags || [])];
  if (tpl.platforms?.length) state.selected = new Set(tpl.platforms);
  renderHashtags(); updateCounter();
  loadPlatforms().then(renderPreviews);
});

$('#save-template').addEventListener('click', async () => {
  const name = prompt('Tên mẫu:');
  if (!name) return;
  try {
    await api('/templates', {
      method: 'POST',
      body: { name, text: textEl.value, hashtags: state.hashtags, platforms: Array.from(state.selected) },
    });
    toast('Đã lưu mẫu', 'ok');
    loadTemplates();
  } catch (err) { toast(err.message, 'err'); }
});

/* ============================ Cài đặt ============================ */
async function loadSettings() {
  try {
    const { settings } = await api('/settings');
    $('#settings-form').innerHTML = state.platforms.map((p) => `
      <div class="settings-group">
        <h3>${p.emoji} ${esc(p.name)} ${p.configured ? '<span class="dot dot-ok"></span>' : '<span class="dot dot-off"></span>'}</h3>
        <p class="hint">${p.warning ? `⚠️ ${esc(p.warning)} · ` : ''}<a href="${esc(p.docs)}" target="_blank" rel="noopener">Tài liệu API</a></p>
        ${p.credentialKeys.map((key) => `
          <label class="field">
            <span class="field-label">${esc(LABELS[key] || key)}${settings[`${key}__fromEnv`] ? ' <em>(đang lấy từ .env)</em>' : ''}</span>
            <input type="text" data-key="${key}" value="${esc(settings[key] || '')}" placeholder="chưa đặt" autocomplete="off">
          </label>`).join('')}
      </div>`).join('');
  } catch (err) { toast(err.message, 'err'); }
}

$('#btn-save-settings').addEventListener('click', async () => {
  const body = {};
  $('#settings-form').querySelectorAll('input[data-key]').forEach((i) => { body[i.dataset.key] = i.value; });
  try {
    const res = await api('/settings', { method: 'POST', body });
    state.platforms = res.platforms;
    $('#settings-status').textContent = `Đã lưu lúc ${new Date().toLocaleTimeString('vi-VN')}`;
    toast('Đã lưu thông tin kết nối', 'ok');
    loadPlatforms();
    loadSettings();
  } catch (err) { toast(err.message, 'err'); }
});

/* ============================ Khởi động ============================ */
(async function init() {
  updateCounter();
  try {
    await loadPlatforms();
    state.selected = new Set(state.platforms.filter((p) => p.configured).map((p) => p.id));
    await loadPlatforms();
    renderPreviews();
  } catch (err) {
    toast(`Không kết nối được máy chủ: ${err.message}`, 'err');
  }
  loadTemplates();
  loadHistory();
})();
