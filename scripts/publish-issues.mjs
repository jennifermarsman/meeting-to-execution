import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const manifest = new URL('../docs/execution.json', import.meta.url);
const data = JSON.parse(await readFile(manifest, 'utf8'));
const marker = id => `<!-- meeting-to-execution:${id} -->`;
const body = item => `${marker(item.id)}
## Context and evidence
${item.evidence}

## Delivery status
${item.status}: ${item.delivery}

## Owner
${item.owner}
Role ownership is proposed unless explicitly recorded in the meeting. No GitHub assignee is set.

## Acceptance criteria
${item.acceptance.map(text => `- [ ] ${text}`).join('\n')}

## Dependencies
${item.dependsOn.map(id => {
  const dependency = data.items.find(entry => entry.id === id);
  return dependency?.issue ? `- #${dependency.issue}: ${dependency.title}` : `- ${id}`;
}).join('\n') || 'None.'}

## Draft PR plan
${item.plan}; see docs/pr-plans.md. Local implementation does not mean merged or approved.
`;
if (!process.argv.includes('--apply')) {
  for (const item of data.items) console.log(`${item.id}: ${item.title}\n${body(item)}\n`);
  console.log('Dry run only. Use npm run issues:publish -- --apply to create missing issues.');
  process.exit(0);
}
const gh = args => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 10 * 1024 * 1024 }).trim();
// Read every issue (including closed issues), so reruns can reuse stable body markers.
const rows = gh(['api', '--paginate', `repos/${data.repository}/issues?state=all&per_page=100`,
  '--jq', '.[] | select(has("pull_request") | not) | {number, body} | tojson']);
const existing = rows.split('\n').filter(Boolean).map(row => JSON.parse(row));
for (const item of data.items) {
  const matches = existing.filter(issue => issue.body?.includes(marker(item.id)));
  if (matches.length > 1) throw new Error(`Multiple issues carry marker ${item.id}; resolve duplicates before publishing.`);
  let found = matches[0];
  // GitHub's list endpoint can briefly lag behind a just-created issue.
  if (item.issue && !found) {
    const known = JSON.parse(gh(['api', `repos/${data.repository}/issues/${item.issue}`]));
    if (!known.pull_request && known.body?.includes(marker(item.id))) found = known;
    else throw new Error(`Issue marker for ${item.id} is missing; refusing to create a duplicate.`);
  }
  if (item.issue && found.number !== item.issue) throw new Error(`Conflicting issue reference for ${item.id}; refusing to replace it.`);
  if (found) {
    item.issue = found.number;
    console.log(`Reused #${item.issue}: ${item.id}`);
  } else {
    const url = gh(['issue', 'create', '--repo', data.repository, '--title', item.title, '--body', body(item)]);
    const match = url.match(/\/issues\/(\d+)$/);
    if (!match) throw new Error(`Issue creation response was unexpected: ${url}. Check GitHub before retrying.`);
    item.issue = Number(match[1]);
    console.log(`Created #${item.issue}: ${item.id}`);
  }
  await writeFile(manifest, `${JSON.stringify(data, null, 2)}\n`);
}
console.log('Issue references saved. Existing issue bodies and human edits were not modified. Run npm run status.');
