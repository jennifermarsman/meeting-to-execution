# Success criteria and verification

These are proposed acceptance gates, not metrics agreed in the recording.
Automated results are recorded separately in `execution.json` and the generated
status page; do not interpret implementation status as customer validation.

## Prototype acceptance

| Gate | Measurable requirement | Evidence method |
| --- | --- | --- |
| SC01 | Start on a documented command with no API keys; app and status return HTTP 200. Repository files return 404. | Server tests |
| SC02 | Onboarding works without identifying fields; explicit opt-in is required for persistence; unit/mode preferences survive opted-in reload. | Browser scenarios |
| SC03 | Correct kg/lb conversion within 0.000001 kg round-trip; dates/nonfinite/nonpositive/out-of-range values rejected; same-date writes require explicit edit. | Model tests |
| SC04 | One completion per local day, undo supported; no duplicate rewards after reload; prompt swaps only change that day's prompt. | Model and browser tests |
| SC05 | Number hiding removes weight/target values and chart from DOM, not merely CSS; habit journey still works. | Browser tests |
| SC06 | Maintenance can be selected without a loss target; reaching target cannot change target or force loss behavior. | Model/browser tests |
| SC07 | Export has version, canonical units and complete state; cancel erase preserves state; confirm erase removes app record and resets UI. | Browser tests |
| SC08 | Corrupt/version-mismatched storage and blocked writes show visible errors and do not overwrite previous data. | Storage/model/browser tests |
| SC09 | All local pages work at 375px and 1280px with no horizontal overflow; keyboard focus and labeled inputs available; no page errors or external network requests. | Browser automation plus manual assistive-technology review before pilot |
| SC10 | Every delivery item has evidence, a proposed owner, acceptance criteria, status and issue reference after publishing; regeneration is deterministic. | Manifest/status tests and GitHub readback |

## Discovery gates (not yet measured)

1. Recruit 12 consenting adults from the proposed behavioral segment; record
   device mix and current workflow without collecting health measurements.
2. At least 10/12 complete onboarding, a synthetic check-in, number hiding,
   maintenance selection and erase without intervention; median onboarding
   under 90 seconds and repeat check-in under 30 seconds.
3. At least 8/12 correctly explain where data is stored, how to erase it, and that
   prompts are authored, not AI or medical advice.
4. Before a consented 14-day pilot, obtain product/privacy/clinical approval.
   Proposed engagement gate: at least 50% of enrolled participants voluntarily
   return and complete a chosen step on day 7; track missing follow-up explicitly.
   This is a learning threshold, not an industry benchmark.
5. Do not use weight lost as the MVP success metric. Gather qualitative pressure/
   discomfort feedback; any serious concern blocks wider release pending review.

## Metric definitions for a later approved pilot

- Activation: onboarding plus first voluntary step completion, not opening a tab.
- D7 retention: activated participants completing a step on their seventh local
  calendar day after activation / activated participants with seven days elapsed.
- DAU/WAU/MAU: distinct consenting participants completing a meaningful action in
  one, seven or thirty calendar days; not downloads or raw event counts.
- Paid intent: interview evidence, not a conversion rate. Actual conversion
  requires a separately approved billing experiment.

Prototype collects no telemetry, so these population metrics are **unmeasured**.
Collecting aggregate events later requires its own consent/minimization review.
