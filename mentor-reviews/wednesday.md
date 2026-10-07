# Wednesday: mentor reviews

Theme: Scenarios & UI automation. Copied verbatim from the pull requests in `ravn-qa/qa-nerdery-round-robbin-week-trainees`.

## #92 · Playwright UI tests

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/92
- Status: Merged · opened 2026-09-30 · merged 2026-10-01
- Folder: [`wednesday/`](../wednesday/)

### What I submitted

#### What
Playwright UI tests in TypeScript for booking and cancellation.

**Required — against the reference Gherkin AC (MEDIC-101):**
- `med101-01-book-open-slot.spec.ts` → SCEN-MED101-01 (High), happy-path booking
- `med101-02-taken-slot-disabled.spec.ts` → SCEN-MED101-02 (High), booked slot disabled for another patient

These **fail by design** on today's build: they encode the AC, and the app doesn't implement it yet. Implemented behaviour uses hard assertions; AC gaps use soft assertions so every gap is reported in one run. Each gap — what the AC requires, what the app does, and which one is wrong — is in `ac-gap-report.md`, which also lists where the AC itself is wrong or unclear.

**Extra — own scenarios (pass):** `own-scenarios/book-appointment.spec.ts` (SC-01), `own-scenarios/cancel-appointment.spec.ts` (SC-02).

#### Run evidence
Commit `1a6ff2b`, three consecutive runs, identical results: SC-01 and SC-02 pass; SCEN-MED101-01 fails on 2 assertions and -02 on 4, the same ones every run (`evidence/run-1..3.txt`, `run-log.md`).

Tests use `data-testid` only, create and clean up their own data, have no fixed waits, and type-check in strict mode. Traces and failure details are kept local because they contain the typed password.

#### Also
Correction in `run-log.md`: the app does show a short success toast after booking and cancelling; Monday's BUG-26 / Tuesday's TP-18 missed it.

### Mentor review: PauloSzT · approved · 2026-09-30

> Outstanding delivery, Adriana! This PR represents a top-tier example of QA automation engineering and clear defect disclosure.
>
> Key Engineering Highlights:
>
> Strategic Soft Assertions (expect.soft): Excellent implementation for surfacing all AC/UI gaps in a single execution run without breaking the execution flow unnecessarily.
>
> Automation Best Practices:
>
> Strict use of resilient data-testid selectors.
>
> Efficient setup/teardown via direct API calls (apiLogin, page.request) keeping tests independent and fast.
>
> Explicit handling of time-zone variances (pinning location checks without fragile UI text assertions).
>
> Clean TypeScript typing and strict environment variable security.
>
> AC Gap Report & Analysis: Your breakdown in ac-gap-report.md correctly identifies the discrepancies between actual application state, backend endpoints (GET /api/doctors/{id}/slots), and Gherkin specifications (e.g., past dates in AC, missing hold endpoint, status code inconsistencies).

## #93 · Test scenarios

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/93
- Status: Merged · opened 2026-09-30 · merged 2026-10-01
- Folder: [`wednesday/`](../wednesday/)

### What I submitted

#### What
12 own test scenarios for booking and cancellation (positive, negative, boundary, edge) with the template fields, the risk each covers, and whether to automate it now or later. Includes the Wednesday README.

### Mentor review: PauloSzT · approved · 2026-09-30

> Good work, Adriana! This Pull Request represents an exemplary, production-grade test automation package.
>
> Key Strengths & Engineering Excellence:
>
> Solid Test Strategy (scenarios.md): Your 12 scenarios provide comprehensive coverage across positive, negative, boundary, and edge cases. The decision matrix on what to automate now vs. later based on active bugs (e.g., BUG-005, time-zone issues) is technically sound.
>
> Mastery of Assertions & Reporting (expect.soft): Using soft assertions for AC gaps allows the suite to surface every single defect in SCEN-MED101-01 and SCEN-MED101-02 in a single run while maintaining hard assertions for core functionality.
>
> Automation & Test Design Best Practices:
>
> Clean reliance on resilient data-testid selectors.
>
> Teardown logic via API calls (afterEach) ensuring zero pollution of shared environments.
>
> Secure handling of user credentials via environment variables.
>
> Elimination of fixed sleeps, using network-driven synchronization instead.
>
> Detailed Documentation: The ac-gap-report.md and test-hooks-guide.md provide full clarity on application discrepancies and architectural recommendations for future CI integration.

## #94 · Reflection

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/94
- Status: Merged · opened 2026-09-30 · merged 2026-10-01
- Folder: [`wednesday/`](../wednesday/)

### What I submitted

#### What
Reflection on Development's quality contribution: what Development can do to make the flow more testable, what selector/data/API issues made testing harder, and what to improve before adding the suite to CI.

### Mentor review: PauloSzT · approved · 2026-09-30

> Excellent analysis, Adriana! Your insights in reflection.md clearly demonstrate a mature engineering mindset that goes beyond test writing into pipeline optimization and system testability.
>
> Key Value Highlights:Testability & Backend Hardening: Right on point regarding server-side validation layers and dedicated cleanup endpoints to avoid residual data buildup in shared environments.   
>
> CI Best Practices (storageState & test.fail()): Reusing session state via storageState to protect secrets in traces, alongside using test.fail() for known AC gap annotations, is the ideal approach for maintaining a healthy green CI pipeline while bugs are actively being addressed.   
>
> Hydration Awareness: Great catch on SSR hydration risks during Playwright UI element interactions.

## #95 · State map hook audit

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/95
- Status: Merged · opened 2026-09-30 · merged 2026-10-01
- Folder: [`wednesday/`](../wednesday/)

### What I submitted

#### What
Stretch: the reference Design state map checked against the app's `data-testid` hooks.

- Missing: `no-slots-message`, field-level and form-level error hooks, `back-to-list` on not-found, `cell-status` / `cell-actions`.
- Brittle: selected slot only via CSS class, status only as `status-badge-<value>`, transient toast without its own hook.
- A malformed appointment id crashes the page (undesigned state).

### Mentor review: PauloSzT · approved · 2026-09-30

> Impressive work on the Stretch deliverable, Adriana! Your audit in state-map-hook-audit.md goes well beyond basic selector checks and provides real architectural value for the frontend team.   
>
> Key Value Highlights:Selector Brittleness Detection: Spotting the antipattern of value-embedded test IDs (status-badge-<value>) and CSS-only selection states (bg-blue-600) shows great foresight into test maintainability.   
>
> Undesigned State Identification: Excellent edge-case testing uncovering that malformed IDs break Next.js server-side rendering instead of showing a gracefully handled 404/not-found screen.   
>
> Actionable Recommendations: The breakdown of Missing vs. Brittle vs. Present hooks provides an exact roadmap for Development to improve application testability
