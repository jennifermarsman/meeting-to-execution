# The Next Step: prototype specification

Status: agent-authored proposal implemented for evaluation, not client-approved
production requirements. Traceability uses `decisions.md` IDs and elapsed VTT
timestamps. Research recommendations appear in `research.md`.

## Product promise and boundaries

"A small next step, on your terms." An adult can track weight privately, choose
a gentle daily prompt, and see a journey that continues in maintenance.
Success means a usable, voluntary loop, not a promised medical outcome.

Responsive browser app with no runtime dependencies, backend health storage,
account, external assets, telemetry or AI. Node serves an explicit list of static
assets on loopback. It must not expose the transcript, repository internals or
arbitrary files. No deployment or public sharing is authorized by this build.

## Functional scope

| ID | Requirement | Evidence / rationale | Acceptance |
| --- | --- | --- | --- |
| R01 | Onboard with mode (habits, weight goal, maintenance), units (kg/lb), number visibility and explicit optional local saving. No name, age, gender, height or email required. | D02, D04, A03; 16:19-17:07 is a proposal, not permission to collect everything | All choices editable; session-only default |
| R02 | Add dated weights; optional target entered by user; neutral history and graph; edit same-day record explicitly; delete entries. | D04, 15:03-15:29 | Canonical kg, one entry/date, finite positive values, valid non-future dates, no silent overwrite |
| R03 | Daily authored prompt, alternative prompt, optional completion and undo; local-calendar-day key; one earned journey step/day. | 21:41-22:13; A05 | Reload/double-click cannot multiply rewards; no streak punishment or weight-based rewards |
| R04 | Cozy visual trail and supportive copy; progress linked to completed days. | 24:25-25:28 | Works from empty state and beyond seven completed days |
| R05 | Hide weight values, chart and target from rendered DOM and accessible labels; retain habit journey. | 22:52-23:25; A04 | Logging/editing weights unavailable until numbers shown; not a storage security feature |
| R06 | Maintenance and habits available at any time; reaching self-set loss target suggests maintenance but never lowers target. | 15:33-16:16; D05 | No forced switch, recommendation or target modification |
| R07 | Export versioned JSON with an explicit sensitive-data warning; delete only this app's data after confirmation. | D02; A03 | Export includes canonical units and settings; cancel erase is safe; storage errors visible |
| R08 | Optional browser persistence, explicit session-only and synthetic-demo labels, storage failure recovery. | D02; A02 | No health data network requests; failed writes do not show successful save; corrupt/unsupported data never silently overwritten |
| R09 | Team status page generated from a checked-in execution manifest: artifacts, issue links, PR plans, delivery states, blockers and verification record. | User request | No personal app data, no fabricated live CI or deployment status |
| R10 | Accessible responsive UX. | Agent quality bar | Labeled controls, keyboard operation, focus visibility, live messages, table alternative to chart, 375px and desktop layouts |

## Data contract

One browser key: `next-step:v1`. JSON object:
`version: 1`, `profile: {mode, unit, hideNumbers, persist, targetKg}`,
`weights: [{date: "YYYY-MM-DD", kg: number}]`,
`days: {"YYYY-MM-DD": {prompt: integer, completed: boolean}}`.

Dates use the device's local calendar. Date arithmetic for rotation uses UTC
midnight of that calendar date, avoiding elapsed-hour/DST mistakes. Viewing the
app across midnight refreshes today's prompt; travel uses the current local date.
Weight range 1-700 kg is an engineering input guard, **not** an adult healthy
range. Target has the same guard; no clinical target calculation. lb uses
0.45359237 kg per lb; canonical kg is never rounded on unit changes. UI rounds to
one decimal. Export is plaintext and explicitly warned even with numbers hidden.

Schema validation applies to stored data as well as UI writes. Unknown schema
versions and malformed data block loading and saving until the user explicitly
erases the app record. Storage failures leave the previous confirmed state intact.
Only one open app tab should edit a session; a storage change from another tab
blocks further edits until reload to avoid lost updates.

## Architecture

- `public/model.js`: pure validation, date/unit functions, daily completion and
  weights; shared by browser and Node tests.
- `public/app.js`: DOM UI and event handling, no remote calls.
- `public/storage.js`: explicit validated read/write/erase boundary.
- `public/styles.css`, `public/index.html`: self-contained responsive presentation.
- `scripts/server.mjs`: allowlisted static server with restrictive headers.
- `docs/execution.json`: delivery source of truth, no health records.
- `scripts/publish-issues.mjs`: explicit GitHub publishing using `gh`, stable
  body markers for repeatability, issue metadata persisted after each create.
- `scripts/generate-status.mjs`: reproducible static HTML and Markdown status.

Browser local storage is not encrypted by this app and is not a production
health-data vault. Session-only mode is lost on reload. Synthetic preview never
persists. Browser data clear removes local records; exported files and browser/
OS backups must be deleted separately. No service worker/offline-install claim.

## Out of scope / release gates

Real AI, medical/nutrition advice, photo/calorie logging, social comparison,
location, notifications, billing, native apps, account recovery/cloud sync,
partner/device integrations, imports from other apps, clinical effectiveness
and legal compliance certification. Integrations are research/PR plans only.

Before a real-user pilot: client approves segment/business/brand; privacy and
clinical reviewers approve copy, collection, consent, retention and incident
handling; accessibility and target-device usability evidence exists. Production
also needs its own secure storage/auth architecture, threat model, operating
procedures and integration permission lifecycle. These are not silently marked
done by finishing a demo.
