import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile, stat } from 'node:fs/promises';
import { createGateway } from './gateway.mjs';
const root = path.resolve(process.env.STATIC_DIR || 'dist-hosted');
const gateway = createGateway();
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
};
export function createAppServer() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Referrer-Policy', 'same-origin');
      if (url.pathname.startsWith('/api/')) {
        const response = await gateway(new Request(url, { method: req.method }));
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405);
        res.end();
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        res.writeHead(400);
        res.end();
        return;
      }
      if (
        pathname.split('/').some((p) => p.startsWith('.')) ||
        pathname.includes('\\') ||
        pathname.includes('\0')
      ) {
        res.writeHead(404);
        res.end();
        return;
      }
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(404);
        res.end();
        return;
      }
      let info;
      try {
        info = await stat(file);
      } catch {
        res.writeHead(404);
        res.end();
        return;
      }
      if (!info.isFile()) {
        res.writeHead(404);
        res.end();
        return;
      }
      const basename = path.basename(file);
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      res.setHeader(
        'Cache-Control',
        pathname.startsWith('/assets/')
          ? 'public, max-age=31536000, immutable'
          : ['sw.js', 'index.html'].includes(basename)
            ? 'no-cache'
            : 'public, max-age=300',
      );
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      res.end(await readFile(file));
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end('{"error":"服务暂不可用"}');
    }
  });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createAppServer();
  server.listen(Number(process.env.PORT || 8080), '0.0.0.0', () =>
    console.log(`Xitang Weather ready on port ${server.address().port}`),
  );
  for (const signal of ['SIGTERM', 'SIGINT'])
    process.on(signal, () => server.close(() => process.exit(0)));
}
