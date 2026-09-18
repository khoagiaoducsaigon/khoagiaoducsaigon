import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './config.js';

const DB_FILE = path.join(DATA_DIR, 'db.json');
const EMPTY = { posts: [], settings: {}, templates: [], version: 1 };

let db = load();
let writeTimer = null;

function load() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed };
  } catch {
    return structuredClone(EMPTY);
  }
}

/** Ghi nguyen tu: ghi file tam roi doi ten, tranh hong du lieu khi tat dot ngot. */
function flush() {
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    try { flush(); } catch (err) { console.error('[store] khong ghi duoc db.json:', err.message); }
  }, 50);
}

process.on('exit', () => { if (writeTimer) { clearTimeout(writeTimer); try { flush(); } catch {} } });

export const store = {
  get settings() { return db.settings; },

  saveSettings(patch) {
    db.settings = { ...db.settings, ...patch };
    persist();
    return db.settings;
  },

  listPosts({ status, limit = 100 } = {}) {
    let rows = [...db.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (status) rows = rows.filter((p) => p.status === status);
    return rows.slice(0, limit);
  },

  getPost(id) { return db.posts.find((p) => p.id === id) || null; },

  insertPost(post) {
    db.posts.unshift(post);
    if (db.posts.length > 1000) db.posts.length = 1000;
    persist();
    return post;
  },

  updatePost(id, patch) {
    const post = db.posts.find((p) => p.id === id);
    if (!post) return null;
    Object.assign(post, patch, { updatedAt: new Date().toISOString() });
    persist();
    return post;
  },

  deletePost(id) {
    const i = db.posts.findIndex((p) => p.id === id);
    if (i === -1) return false;
    db.posts.splice(i, 1);
    persist();
    return true;
  },

  /** Bai da den gio dang. */
  duePosts(now = Date.now()) {
    return db.posts.filter(
      (p) => p.status === 'scheduled' && p.scheduledAt && Date.parse(p.scheduledAt) <= now,
    );
  },

  listTemplates() { return db.templates; },

  saveTemplate(tpl) {
    const i = db.templates.findIndex((t) => t.id === tpl.id);
    if (i === -1) db.templates.unshift(tpl); else db.templates[i] = tpl;
    persist();
    return tpl;
  },

  deleteTemplate(id) {
    const i = db.templates.findIndex((t) => t.id === id);
    if (i === -1) return false;
    db.templates.splice(i, 1);
    persist();
    return true;
  },

  stats() {
    const byPlatform = {};
    let published = 0, failed = 0, scheduled = 0;
    for (const post of db.posts) {
      if (post.status === 'scheduled') scheduled += 1;
      for (const r of post.results || []) {
        const bucket = (byPlatform[r.platform] ||= { ok: 0, error: 0 });
        if (r.status === 'ok' || r.status === 'simulated') { bucket.ok += 1; published += 1; }
        else if (r.status === 'error') { bucket.error += 1; failed += 1; }
      }
    }
    return { total: db.posts.length, published, failed, scheduled, byPlatform };
  },
};
