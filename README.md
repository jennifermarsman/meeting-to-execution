# Meeting to execution: The Next Step

A consulting team's recorded brainstorming session, translated into a traceable
delivery package and a runnable, local-first prototype. The product is a gentle
weight-and-habit journey, not a generic meeting summarizer.

## Run the prototype

Requires Node.js 22 or later. No API keys or runtime package install required.

```sh
npm start
```

Open `http://127.0.0.1:3000` for the app and
`http://127.0.0.1:3000/status.html` for the team status page.
Use `PORT=3001 npm start` if port 3000 is in use. The server binds only to loopback
and intentionally serves only allowlisted assets, not the meeting transcript.
Keep the same port/origin to access data saved in a particular browser.

Try **Explore a synthetic sample first** to see the journey without saving data.
Or begin with an empty journey: choose a focus, optional number hiding, kg/lb
units, and whether to save in this browser. Record/edit/delete dated weights,
choose a daily step, switch to maintenance, export or erase app data.

**Privacy boundary:** session-only by default; opt-in storage is unencrypted
browser local storage, not a secure health-data vault. No account, analytics,
cloud sync, AI calls or device integration. Use synthetic data for this
prototype. Plaintext exports include hidden values and must be protected
separately. No medical advice, clinical effectiveness or compliance claim.
If saved data cannot be read, the app blocks writes and offers explicit recovery
or erasure. If another tab changes saved data, reload before editing.

## Execution assets

| Asset | Purpose |
| --- | --- |
| [Decision log](docs/decisions.md) | Timestamped meeting direction vs. ideas and agent decisions |
| [Research brief](docs/research.md) | Primary-source comparison, segment recommendation, integration feasibility and uncertainties |
| [Requirements](docs/requirements.md) | Scope, traceability, data model and privacy boundaries |
| [Success criteria](docs/success-criteria.md) | Automated gates plus unmeasured discovery/pilot criteria |
| [Draft PR plans](docs/pr-plans.md) | Reviewable work slices, dependencies and rollback |
| [Execution status](docs/status.md) | Generated delivery snapshot with GitHub issue links |
| [Execution manifest](docs/execution.json) | Source of truth for issues and status generation |

This is a reviewed-by-human-needed proposal, not an approved client contract.
The client business, budget, brand clearance, specialist reviews, native platform,
paid demand and partner agreements still need human evidence.

## Reproduce and maintain

```sh
npm test                         # dependency-free unit/server/status tests
npm ci                           # browser test development dependencies
npx playwright install chromium # one-time local browser setup
npm run test:browser             # desktop and mobile-sized Chromium scenarios
npm run status                   # regenerate HTML and Markdown from manifest
npm run issues:publish           # dry-run issue descriptions
npm run issues:publish -- --apply # explicit GitHub writes, requires authenticated gh
```

Minimal Linux hosts may also need `npx playwright install-deps chromium`
(administrator permission required). Browser tests run Chromium at desktop and
mobile viewport sizes; they are not physical iPhone/Android or Safari coverage.

Issue publishing reuses stable body markers across open and closed issues,
persists each created reference, and preserves existing human edits. Run only
one publisher at a time. It does not assign people, close issues, push branches
or open PRs. Update issue bodies manually after changing delivery states;
regenerating status alone does not refresh GitHub.

No real user data belongs in Git, issue descriptions or the team status page.
The source recording has no supplied meeting date; relative deadlines have not
been converted into invented dates.
