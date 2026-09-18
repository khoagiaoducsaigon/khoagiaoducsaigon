import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { config, PUBLIC_DIR, MEDIA_DIR } from './config.js';
import { handleApi, json } from './routes.js';
import { startScheduler } from './scheduler.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders());
    return res.end();
  }

  try {
    if (url.pathname.startsWith('/api/')) {
      if (!authorized(req, url)) return json(res, 401, { error: 'Sai ADMIN_TOKEN' });
      return await handleApi(req, res, url);
    }
    if (url.pathname.startsWith('/media/')) {
      return serveFile(res, MEDIA_DIR, url.pathname.replace('/media/', ''));
    }
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    return serveFile(res, PUBLIC_DIR, rel, 'index.html');
  } catch (err) {
    console.error('[server]', err);
    return json(res, 500, { error: err.message || 'Loi may chu' });
  }
});

function authorized(req, url) {
  if (!config.adminToken) return true;
  const header = req.headers['x-admin-token'];
  const query = url.searchParams.get('token');
  return header === config.adminToken || query === config.adminToken;
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,x-admin-token',
  };
}

/** Phuc vu file tinh, chan duong dan vuot ra ngoai thu muc goc. */
function serveFile(res, root, relPath, fallback) {
  const safe = path.normalize(decodeURIComponent(relPath)).replace(/^(\.\.[/\\])+/, '');
  let file = path.join(root, safe);
  if (!file.startsWith(root)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    if (!fallback) { res.writeHead(404); return res.end('Not found'); }
    file = path.join(root, fallback);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  }
  const stat = fs.statSync(file);
  res.writeHead(200, {
    'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': root === MEDIA_DIR ? 'public, max-age=86400' : 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

startScheduler();

server.listen(config.port, () => {
  console.log('');
  console.log('  ┌────────────────────────────────────────────┐');
  console.log('  │  MultiPost - dang bai da nen tang          │');
  console.log('  └────────────────────────────────────────────┘');
  console.log(`  Giao dien : http://localhost:${config.port}`);
  console.log(`  URL cong khai : ${config.publicBaseUrl}`);
  console.log(`  Che do mo phong (DRY_RUN) : ${config.dryRun ? 'BAT' : 'TAT'}`);
  console.log(`  Bao ve bang ADMIN_TOKEN : ${config.adminToken ? 'CO' : 'KHONG'}`);
  console.log('');
});
