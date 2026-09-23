# Draft PR plans

Plans only: no branch was pushed and no remote PR was opened. Current local work
combines the research and prototype for review; it has not been split into commits.
GitHub issues are linked from the generated status page.

| Plan | Scope and proposed title | Depends on | Review / acceptance | Rollback |
| --- | --- | --- | --- | --- |
| PR-A | `docs: translate meeting into product decisions and delivery gates` -- decision log, primary-source research, spec, criteria, issue manifest, generated status | None | Trace timestamps; distinguish assumptions; client reviews business questions; SC10 | Revert documentation commit; retain issue discussion |
| PR-B | `feat: add local-first Next Step prototype` -- onboarding, weights, journey, maintenance, hidden numbers, opt-in storage, export/erase, tests, local server | PR-A provisional scope | SC01-SC09; synthetic data only; product and accessibility review | Revert app commit; explain browser data/version impact; never silently delete user data |
| PR-C | `spike: validate read-only native weight integration` -- choose OS from discovery, permission UX, canonical weight mapping, provenance/deduplication, revoked-access behavior | Client segment + privacy gates, PR-B UX feedback | Native-device evidence; reject unconsented reads; no API secrets committed; no imported data sent to analytics | Feature disabled; revoke access and remove tokens; document treatment of imported records |
| PR-D | `experiment: evaluate optional paid personalization` -- only after pilot; pricing research first, then approved model/provider if justified | Product demand, clinical/privacy review, unit economics | Explicit AI labeling, user control, safety evaluations, bounded cost, opt-out; no diagnosis or prescribing | Feature flag off; delete provider-held data per approved policy |

## PR-B reviewer checklist

- Session-only default is truthful; opt-in storage and demo are distinguishable.
- Weight changes never award extra journey progress.
- Hidden-number mode removes sensitive displays and input controls.
- Storage errors are visible; unsupported data is not silently discarded.
- Export/erase are explicit; static server cannot serve repository internals.
- Status labels local completion separately from review, pilot and launch.

## Native spike specification (not implemented)

Read weight only, on explicit consent; do not request age, sex, location, heart
rate or unrelated data. Keep source/provider record ID, measured instant, source
timezone and canonical kg. Deduplicate on provider+record ID, not timestamp
alone. Explain empty/denied/revoked states without guessing permission. Define
whether imported data is retained after disconnect with privacy reviewers.
Test unit mapping, late updates, duplicated events and deletion. Browser demo
manual records are not evidence that a device integration works.
