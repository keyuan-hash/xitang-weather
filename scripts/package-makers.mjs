import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'release/makers');
// Only generated release files are replaced. Source references are never packaged.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(path.join(root, 'dist-hosted'), output, { recursive: true });
await mkdir(path.join(output, 'cloud-functions/api'), { recursive: true });
const gateway = await readFile(path.join(root, 'server/gateway.mjs'), 'utf8');
await writeFile(path.join(output, 'cloud-functions/api/[kind].js'),
  `import { setDefaultResultOrder } from 'node:dns';\nimport { setDefaultAutoSelectFamily } from 'node:net';\nsetDefaultResultOrder('ipv4first');\nsetDefaultAutoSelectFamily(false);\n${gateway}\nconst gateway = createGateway();\nexport function onRequest({ request }) { return gateway(request); }\n`);
await writeFile(path.join(output, 'package.json'), JSON.stringify({
  name: 'xitang-weather-makers', private: true, type: 'module', version: '1.2.0',
}, null, 2));
const header = (source, value) => ({ source, headers: [{ key: 'Cache-Control', value }] });
await writeFile(path.join(output, 'edgeone.json'), JSON.stringify({
  cloudFunctions: { regions: { overseas: ['ap-hongkong'] } },
  headers: [
    header('/', 'no-cache'), header('/index.html', 'no-cache'),
    header('/sw.js', 'no-cache'), header('/manifest.webmanifest', 'no-cache'),
    header('/api/*', 'no-store'),
    header('/assets/*', 'public, max-age=31536000, immutable'),
    { source: '/*', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }] },
  ],
}, null, 2));
const archive = path.join(root, 'release/xitang-weather-makers.zip');
await rm(archive, { force: true });
execFileSync('/usr/bin/zip', ['-qr', archive, '.'], { cwd: output });
console.log(`Makers upload archive: ${archive}`);
