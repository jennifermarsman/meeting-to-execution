# Research brief

Desk research checked September 23, 2026. Primary vendor documentation describes
capability, not independent effectiveness. This is a product recommendation,
not medical advice, a legal opinion, market sizing, or completed user research.

## Recommendation

Test a **private, low-pressure daily journey for adult weight trackers and device
owners**, including people maintaining their weight. Make weight recording easy
but optional; reward returning to a self-chosen activity, never losing more
weight. Start with a responsive prototype, then choose the first native platform
from recruited users' devices rather than assuming iOS or Android dominance.

This is an inference from the meeting and the comparison below. The combination
is a positioning hypothesis, not a claim that competitors lack these features.
Do not choose a clinical, GLP-1, older-adult-only, or bodybuilding-only segment
without evidence and appropriate specialist review.

## Competitive evidence

| Product / source | Verified observation | Consequence |
| --- | --- | --- |
| MyFitnessPal [S1] | Premium includes faster logging such as barcode and meal scanning. | Photo logging alone is not a defensible differentiator; avoid building a food database first. |
| Noom [S2] | Offers a maintenance mode with lessons, a maintenance graph and community; availability varies. | Maintenance is necessary for our concept, not novel by itself. |
| Finch [S3] | Small self-care goals and a pet-based experience are established product patterns. | Cozy daily engagement is an interaction hypothesis, not a new market category. |
| RevenueCat [S4] | Its 2026 report analyzes subscription apps using its dataset and distinguishes retention from renewal. | Benchmark definitions matter; paid subscription survival is not DAU or proof of demand for this product. |

No reliable segment-specific "top ten most sticky apps" ranking was established.
Vendor feature pages cannot resolve that meeting question. Do not invent a
ranking or extrapolate clinical benefit from retention.

## Segment tradeoff (our qualitative assessment)

| Candidate | Fit to discussion | Main uncertainty | Decision |
| --- | --- | --- | --- |
| Existing adult trackers/device owners seeking a gentler experience | Strong: 08:22-09:40 and 22:22-24:12 | Will they use a companion alongside existing apps? | First discovery cohort |
| Older adults | Mentioned as an example, not selected | Accessibility, willingness to pay, device mix not established | Include in research, do not assume exclusivity |
| Bodybuilders | Client anecdote, not confirmed business | Training/nutrition expertise and crowded specialist workflows | Await client clarification |
| GLP-1 users / clinical care | Mentioned as market context | Higher clinical/content/privacy complexity | Exclude from initial positioning |
| Everyone seeking weight loss | Broad client aspiration | Weak differentiation and unbounded scope | Do not target initially |

Recruit 12 consenting adults across existing-device and manual-tracking habits,
including maintainers. Ask about their last abandoned app, what they already
use, hidden-number preference, willingness to try a companion, and phone OS.
Observe tasks instead of asking only whether they "like" the idea. This has not
been performed. The threshold in `success-criteria.md` is a proposed gate.

## Platform and partner feasibility

| Option | Evidence | Constraints and proposed next experiment |
| --- | --- | --- |
| Apple HealthKit [S5] | Permissioned central store for iPhone/Apple Watch data; per-type control and privacy requirements. | Native entitlement/usage descriptions; denied reads can look like no data. Request weight only in a native spike; prove revocation and duplicate handling. |
| Android Health Connect [S6] | Supports `WeightRecord` and separate weight read/write permissions. | Native Android integration; consent and availability need device testing. Build read-only spike, not a browser "connect" button. |
| Withings Public API [S7] | Consented account access via OAuth; device setup remains in Withings' app. | Developer credentials, secure token lifecycle, backend/webhook handling and scoped historical import. First direct-scale candidate; no deal negotiated. |
| Garmin Health API [S8] | Approval needed for evaluation; commercial use requires license payment. | Business approval/licensing unknown. Defer until the customer segment justifies cost. |

Prefer aggregation through native health stores before many vendor APIs. This is
an engineering recommendation, not a claim that every device syncs every field.
Never promise importing Duolingo/MyFitnessPal streaks: no supported cross-product
streak interface was established.

## Business model recommendation

Keep manual tracking, maintenance, number hiding, export and erase free. Test
paid convenience only after users return voluntarily: curated personalization,
optional integrations, and later explicitly disclosed AI. Do not price privacy
or basic safety behind a paywall. Prototype has no trial, billing, ads or revenue.

Explore monthly/annual subscription concepts with users without charging.
Hardware bundling is a separate partner negotiation, not assumed revenue.
Use a unit-economics worksheet before launch: net receipts minus store/payment
fees, hosting, support, model usage, and acquisition cost; client must supply
budget and margin constraints. No revenue forecast or optimal price is claimed.

## Privacy and safety implications

Apple places specific restrictions on HealthKit data use and disclosure [S5].
FTC guidance explains that certain consumer health apps and connected products
may fall under the Health Breach Notification Rule [S9]. Do not label this
prototype "HIPAA compliant" or assume no obligations because it has no account.
Counsel/privacy specialists must assess the actual product, data flows and
jurisdictions before real-user collection or integration.

Browser local storage persists by origin and may be unavailable due to browser
policy [S10]. Our implementation uses it only with explicit opt-in, exposes
errors, and does not claim app-level encryption. Device/browser access and
downloaded exports remain risks. Use synthetic data for evaluation. No health
information is sent to an AI provider.

Do not implement BMI recommendations, calorie budgets, medical signals, weight
loss prescriptions, or food/animal comparisons presented as facts. Author
non-clinical reflection prompts and disclose they are not AI. Hiding numbers is
a display preference, not treatment or a guarantee of safety for any condition.

## Source register

Links are supplied for the requested research asset. Accessed September 23, 2026.

- **S1** MyFitnessPal, Premium features: https://support.myfitnesspal.com/hc/en-us/articles/360032625951-MyFitnessPal-Premium-features
- **S2** Noom, Maintenance Mode: https://www.noom.com/support/faqs/using-the-app/daily-features/2026/03/maintenance-mode/
- **S3** Finch, Our Approach to Self-Care: https://help.finchcare.com/hc/en-us/articles/37935669335309-Our-Approach-to-Self-Care
- **S4** RevenueCat, State of Subscription Apps 2026: https://www.revenuecat.com/state-of-subscription-apps
- **S5** Apple, HealthKit and protecting user privacy: https://developer.apple.com/documentation/healthkit and https://developer.apple.com/documentation/healthkit/protecting-user-privacy
- **S6** Android Developers, Health Connect data types: https://developer.android.com/health-and-fitness/health-connect/data-types
- **S7** Withings, OAuth web flow: https://developer.withings.com/developer-guide/v3/integration-guide/public-health-data-api/get-access/oauth-web-flow/
- **S8** Garmin, Health API: https://developer.garmin.com/gc-developer-program/health-api/
- **S9** FTC, Complying with the Health Breach Notification Rule: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0
- **S10** MDN, Window.localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
