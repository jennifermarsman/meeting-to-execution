import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { makeServer } from '../scripts/server.mjs';
import { generateStatus, escapeHtml } from '../scripts/generate-status.mjs';

test('static server serves app/status and refuses repository paths and writes', async t => {
  const server = makeServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const path of ['/', '/app.js', '/styles.css', '/base.css', '/status.html', '/docs/requirements.md']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 200, path);
    assert.ok(response.headers.get('content-security-policy').includes("connect-src 'none'"));
    assert.ok((await response.text()).length > 0);
  }
  for (const path of ['/.git/config', '/meeting-to-discuss-software.vtt', '/package.json', '/%2e%2e/.git/config', '/unknown']) {
    assert.equal((await fetch(`${base}${path}`)).status, 404, path);
  }
  assert.equal((await fetch(base, { method: 'POST', body: 'private' })).status, 405);
  assert.equal(await (await fetch(base, { method: 'HEAD' })).text(), '');
});

test('manifest has traceability, unique identifiers, criteria, roles and valid dependencies', async () => {
  const data = JSON.parse(await readFile(new URL('../docs/execution.json', import.meta.url), 'utf8'));
  const ids = new Set(data.items.map(item => item.id));
  assert.equal(ids.size, data.items.length);
  for (const item of data.items) {
    assert.ok(item.evidence && item.owner && item.plan && item.delivery);
    assert.ok(item.acceptance.length >= 3);
    assert.ok(['ready-for-review', 'in-progress', 'blocked', 'deferred'].includes(item.status));
    for (const dependency of item.dependsOn) assert.ok(ids.has(dependency));
    if (item.issue !== undefined) assert.ok(Number.isInteger(item.issue) && item.issue > 0);
  }
  for (const artifact of data.artifacts) assert.ok((await readFile(new URL(`../${artifact.path}`, import.meta.url), 'utf8')).length > 100);
});

test('generated status is deterministic, current and escapes markup', async () => {
  const data = JSON.parse(await readFile(new URL('../docs/execution.json', import.meta.url), 'utf8'));
  const first = generateStatus(data);
  assert.deepEqual(generateStatus(data), first);
  assert.equal(first.html, await readFile(new URL('../public/status.html', import.meta.url), 'utf8'));
  assert.equal(first.md, await readFile(new URL('../docs/status.md', import.meta.url), 'utf8'));
  data.items[0].title = '<script>alert("x")</script>';
  assert.ok(!generateStatus(data).html.includes('<script>'));
  assert.equal(escapeHtml('<>"&\''), '&lt;&gt;&quot;&amp;&#39;');
});
