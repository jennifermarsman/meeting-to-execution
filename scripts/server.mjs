import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, extname } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assets = ['index.html', 'styles.css', 'base.css', 'app.js', 'model.js', 'storage.js', 'favicon.svg', 'status.html'];
const docs = ['decisions.md', 'research.md', 'requirements.md', 'success-criteria.md', 'pr-plans.md', 'status.md', 'execution.json'];
const routes = new Map([
  ['/', 'public/index.html'],
  ...assets.map(name => [`/${name}`, `public/${name}`]),
  ...docs.map(name => [`/docs/${name}`, `docs/${name}`])
]);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.md': 'text/plain', '.json': 'application/json' };

export function makeServer() {
  return createServer(async (req, res) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end('Method not allowed'); return;
    }
    const path = (req.url ?? '').split('?')[0];
    const file = routes.get(path);
    if (!file) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const body = await readFile(resolve(root, file));
      res.writeHead(200, { 'Content-Type': `${mime[extname(file)]}; charset=utf-8` });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (cause) {
      console.error(`Unable to serve ${file}: ${cause.message}`);
      res.writeHead(500); res.end('Required asset unavailable. Run npm run status if the status page is missing.');
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
  const server = makeServer();
  server.on('error', cause => { console.error(cause.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`The Next Step: http://127.0.0.1:${port}\nTeam status: http://127.0.0.1:${port}/status.html`));
}
