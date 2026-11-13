// Lớp CSDL (IndexedDB) — 2 CSDL tách hẳn: dữ liệu thật 'EduPlanKHBD' và trình diễn 'EduPlanKHBD_demo' (mục 8 v1.1).
// Dữ liệu nhỏ (một trường) nên giữ bản sao trong bộ nhớ, ghi xuống IndexedDB theo từng thao tác.
export const DB_THAT = 'EduPlanKHBD', DB_DEMO = 'EduPlanKHBD_demo', DB_VERSION = 1;
export const STORES = ['users', 'lessons', 'lesson_versions', 'worksheets', 'slides', 'assessments', 'integrations', 'audits',
  'reviews', 'observations', 'library', 'rules', 'activity_logs', 'migration_logs', 'settings'];

export const uid = p => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export const now = () => new Date().toISOString();

export class Kho {
  constructor(name) { this.name = name; this.idb = null; this.cache = {}; STORES.forEach(s => (this.cache[s] = [])); }
  async open() {
    this.idb = await new Promise((res, rej) => {
      const r = indexedDB.open(this.name, DB_VERSION);
      r.onupgradeneeded = () => STORES.forEach(s => { if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s, { keyPath: 'id' }); });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    for (const s of STORES) this.cache[s] = await this._all(s);
    return this;
  }
  close() { this.idb?.close(); }
  _all(s) { return new Promise((res, rej) => { const r = this.idb.transaction(s).objectStore(s).getAll(); r.onsuccess = () => res(r.result || []); r.onerror = () => rej(r.error); }); }
  _tx(stores, fn) {
    return new Promise((res, rej) => { const tx = this.idb.transaction(stores, 'readwrite'); fn(tx); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  }
  all(s) { return this.cache[s]; }
  get(s, id) { return this.cache[s].find(r => r.id === id) || null; }
  where(s, fn) { return this.cache[s].filter(fn); }
  one(s, fn) { return this.cache[s].find(fn) || null; }
  async put(s, rec) {
    rec.cap_nhat_luc = now(); rec.tao_luc ||= rec.cap_nhat_luc;
    await this._tx([s], tx => tx.objectStore(s).put(rec));
    const i = this.cache[s].findIndex(r => r.id === rec.id);
    i >= 0 ? (this.cache[s][i] = rec) : this.cache[s].push(rec);
    return rec;
  }
  /** Ghi nhiều store trong MỘT giao dịch (dùng cho di trú: hoặc ghi hết, hoặc không ghi gì). */
  async putMany(map) {
    const stores = Object.keys(map).filter(s => map[s]?.length);
    if (!stores.length) return;
    await this._tx(stores, tx => stores.forEach(s => map[s].forEach(r => tx.objectStore(s).put(r))));
    for (const s of stores) for (const r of map[s]) { const i = this.cache[s].findIndex(x => x.id === r.id); i >= 0 ? (this.cache[s][i] = r) : this.cache[s].push(r); }
  }
  async del(s, id) { await this._tx([s], tx => tx.objectStore(s).delete(id)); this.cache[s] = this.cache[s].filter(r => r.id !== id); }
  async clearAll() { await this._tx(STORES, tx => STORES.forEach(s => tx.objectStore(s).clear())); STORES.forEach(s => (this.cache[s] = [])); }
  setting(key, def = null) { return this.get('settings', key)?.value ?? def; }
  async setSetting(key, value) { return this.put('settings', { id: key, value }); }
  exportAll() { return { app: 'EduPlan KHBD AI', schema: '1.1', xuat_luc: now(), tables: Object.fromEntries(STORES.map(s => [s, this.cache[s]])) }; }
  async importAll(data, { thayThe = false } = {}) {
    const t = data.tables || data;
    if (thayThe) await this.clearAll();
    await this.putMany(Object.fromEntries(STORES.filter(s => Array.isArray(t[s])).map(s => [s, t[s]])));
  }
  sizeBytes() { return new Blob([JSON.stringify(this.cache)]).size; }
  async log(user, hanh_dong, doi_tuong = '', chi_tiet = '') {
    return this.put('activity_logs', { id: uid('log'), nguoi: user?.ho_ten || 'Khách', nguoi_id: user?.id || null, vai_tro: user?.vai_tro || '', hanh_dong, doi_tuong, chi_tiet, luc: now() });
  }
}
