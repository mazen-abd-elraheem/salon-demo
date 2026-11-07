// ---------------------------------------------------------------------------
// Production server for Hostinger Node.js hosting.
//
// A Vite + React app builds to static files in ./dist. Node.js hosting runs a
// server process (it does NOT serve static files by itself), so this tiny,
// dependency-free server hands out the built files and falls back to
// index.html for client-side routes. Run `npm run build` first so ./dist exists.
//
// IMPORTANT: it listens on process.env.PORT — Hostinger assigns the port and
// proxies to it. Hardcoding a port is the usual cause of a blank page / 502.
// ---------------------------------------------------------------------------

import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

async function sendFile(res, filePath, statusCode = 200) {
  const data = await readFile(filePath);
  const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
  const isHtml = filePath.endsWith('.html');
  res.writeHead(statusCode, {
    'Content-Type': type,
    // Don't cache the HTML shell so new deploys show up; cache hashed assets hard.
    'Cache-Control': isHtml
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=31536000, immutable',
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    // Strip query string, decode, and prevent path traversal.
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
    const safePath = normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = join(DIST, safePath);

    // Keep the resolved path inside ./dist.
    if (!filePath.startsWith(DIST)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('Forbidden');
      return;
    }

    try {
      const info = await stat(filePath);
      if (info.isFile()) {
        await sendFile(res, filePath);
        return;
      }
    } catch {
      // Not a real file — fall through to the SPA fallback below.
    }

    // Single-page-app fallback: serve index.html for any unknown path.
    await sendFile(res, join(DIST, 'index.html'), 200);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
    // eslint-disable-next-line no-console
    console.error('[server] error handling', req.url, err);
  }
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] running on http://${HOST}:${PORT} — serving ${DIST}`);
});
