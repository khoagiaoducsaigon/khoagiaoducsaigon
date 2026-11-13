// Kiểm chéo: công cụ Python migrate_eduplan.py và app/js/migrate.js cho cùng kết quả trên bộ "EduPlan cũ giả lập".
// Đồng thời kiểm --dry-run không ghi gì và chạy lại với --target không nhân đôi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taoGiaLap } from './fixtures/tao-eduplan-cu-gia-lap.mjs';
import { lapKeHoach } from '../../app/js/migrate.js';

const TOOL = fileURLToPath(new URL('../../agents/tools/migrate_eduplan.py', import.meta.url));
const run = args => { try { return { code: 0, out: execFileSync('uv', ['run', '-q', TOOL, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }; } catch (e) { return { code: e.status, out: e.stdout }; } };

test('Python ↔ JS: cùng tập legacy_id cho mọi store, cùng báo cáo', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mig-'));
  const cu = await taoGiaLap();
  const backup = join(dir, 'backup.json'), out = join(dir, 'out.json');
  writeFileSync(backup, JSON.stringify({ tables: cu }));

  const dry = run([backup, '--dry-run']);
  assert.equal(dry.code, 0);
  assert.equal(existsSync(out), false, '--dry-run không được ghi tệp');

  assert.equal(run([backup, '--out', out]).code, 0);
  const py = JSON.parse(readFileSync(out, 'utf8'));
  const js = lapKeHoach(cu);
  for (const store of ['users', 'lessons', 'lesson_versions', 'reviews', 'audits', 'activity_logs']) {
    assert.deepEqual(py.tables[store].map(r => r.legacy_id).sort(), js.ops[store].map(r => r.legacy_id).sort(), store);
  }
  assert.deepEqual(py.migration_logs[0].bao_cao, js.baoCao);
  const trangThai = arr => Object.fromEntries(arr.map(l => [l.legacy_id, l.trang_thai]));
  assert.deepEqual(trangThai(py.tables.lessons), trangThai(js.ops.lessons));

  // Chạy lại với --target = kết quả lần 1 → không ghi thêm gì
  const out2 = join(dir, 'out2.json');
  assert.equal(run([backup, '--out', out2, '--target', out]).code, 0);
  const py2 = JSON.parse(readFileSync(out2, 'utf8'));
  for (const [s, arr] of Object.entries(py2.tables)) assert.equal(arr.length, 0, s);
});
