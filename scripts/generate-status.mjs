import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function generateStatus(data) {
  const e = escapeHtml;
  const count = status => data.items.filter(item => item.status === status).length;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(data.project)} | Execution status</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/styles.css"></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">n.</span><span>the next step<span class="brand-sub">FROM CONVERSATION TO DELIVERY</span></span></a><nav aria-label="Main navigation"><a href="/">Prototype</a><a href="/status.html" class="active">Team status</a></nav></header>
<main id="main" class="status-main"><span class="eyebrow">MEETING TO EXECUTION / ${e(data.asOf)}</span><h1>A conversation, put into motion.</h1><p>${e(data.release)}</p><p class="fine">Generated snapshot, not a live GitHub or CI feed. Run <code>npm run status</code> to rebuild from the execution manifest. No personal app data appears here.</p>
<div class="status-metrics">${[['ready-for-review', 'Ready for review'], ['in-progress', 'In progress'], ['blocked', 'Blocked'], ['deferred', 'Deferred']].map(([status, label]) => `<div class="card"><strong>${count(status)}</strong><span>${label}</span></div>`).join('')}</div>
<section class="card"><span class="eyebrow">THE PAPER TRAIL</span><h2>Decisions you can trace back</h2><p>Meeting direction is separated from research-backed proposals and open approvals.</p><div class="artifact-links">${data.artifacts.map(a => `<a href="/${e(a.path)}">${e(a.title)}</a>`).join('')}</div><p class="fine">Source: ${e(data.source)} in the private repository. PR plans are drafts; no remote PR, merge or deployment is implied.</p></section>
<section class="card"><span class="eyebrow">VERIFICATION / ${e(data.verification.state)}</span><p>${e(data.verification.summary)}</p></section>
<div class="status-items">${data.items.map(item => `<article class="card"><span class="status-label ${e(item.status)}">${e(item.status)}</span><h2>${e(item.title)}</h2><p>${e(item.delivery)}</p><p class="fine"><strong>Owner:</strong> ${e(item.owner)}<br><strong>Evidence:</strong> ${e(item.evidence)}<br><strong>Depends on:</strong> ${e(item.dependsOn.join(', ') || 'None')}<br><strong>PR plan:</strong> ${e(item.plan)}</p><details><summary>Acceptance criteria</summary><ul>${item.acceptance.map(a => `<li>${e(a)}</li>`).join('')}</ul></details><p>${item.issue ? `<a href="https://github.com/${e(data.repository)}/issues/${Number(item.issue)}">GitHub issue #${Number(item.issue)}</a>` : 'GitHub issue not yet published.'}</p></article>`).join('')}</div>
<footer><span class="footer-brand">Done locally is not launched.</span><a href="/docs/execution.json">Execution manifest</a><a href="/">Open the prototype</a></footer></main></body></html>
`;
  const md = `# ${data.project}: execution status\n\nAs of ${data.asOf}. Generated from \`docs/execution.json\`; not a live feed.\n\n${data.release}\n\n## Verification\n\n${data.verification.state}: ${data.verification.summary}\n\n## Artifacts\n\n${data.artifacts.map(a => `- [${a.title}](${a.path.split('/').at(-1)})`).join('\n')}\n\n## Delivery\n\n| Item | State | GitHub issue | PR plan | Delivery |\n| --- | --- | --- | --- | --- |\n${data.items.map(i => `| ${i.title} | ${i.status} | ${i.issue ? `[#${i.issue}](https://github.com/${data.repository}/issues/${i.issue})` : 'Not published'} | ${i.plan} | ${i.delivery} |`).join('\n')}\n\nPR plans are drafts. No remote PR, merge, production deployment, user study, or specialist approval is implied.\n`;
  return { html, md };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const data = JSON.parse(await readFile(new URL('../docs/execution.json', import.meta.url), 'utf8'));
  const { html, md } = generateStatus(data);
  await Promise.all([
    writeFile(new URL('../public/status.html', import.meta.url), html),
    writeFile(new URL('../docs/status.md', import.meta.url), md)
  ]);
  console.log(`Generated status for ${data.items.length} execution items.`);
}
