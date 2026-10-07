# Friday: mentor reviews

Theme: Capstone: MEDIC-108 patient profile. Copied verbatim from the pull requests in `ravn-qa/qa-nerdery-round-robbin-week-trainees`.

## #182 · Risk register

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/182
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone risk register for MEDIC-108 (patient profile management).

- 6 risks scored Probability x Impact, each with affected roles, mitigation, testing approach and known limitation.
- Highest: R-01, the changed name isn't shown until the next login (20). Then name validation, phone validation and no audit trail (15 each).
- Probabilities are based on what was observed on 2026-10-02, with evidence in `evidence/`.

### Mentor review: PauloSzT · approved · 2026-10-02

> Exceptional work on this capstone Risk Register, Adriana! The structure, probability scoring grounded in live API evidence and clear mitigation strategies make this document highly actionable for product and engineering.

## #183 · Test plan

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/183
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone test plan for MEDIC-108 (patient profile management).

- Scope: the `/profile` screen and `GET`/`PUT /api/profile` for the signed-in patient.
- Expected behaviour comes from Product's reference AC and business rules (BR-PROF-001 to -007).
- Covers entry and exit criteria, test data (two throwaway patient accounts, so the UI and API tests never edit the same profile), the risk-based coverage approach and known limitations.
- The `data-testid` audit stands in for the missing Design state map.

### Mentor review: PauloSzT · approved · 2026-10-02

> Excellent submission, Adriana! This Test Plan is remarkably structured, highly pragmatic, and tightly coupled with your capstone Risk Register.

## #184 · Feature map

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/184
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone feature map for MEDIC-108 (patient profile management).

- State diagram and request flow (mermaid).
- 10 entries (FM-01 to FM-10), each with actor, trigger, expected result, API call, alternate path, hooks, test data and result.
- 4 entries fail: the stale name, name validation, phone validation and the audit, which isn't built.

### Mentor review: PauloSzT · approved · 2026-10-02

> Outstanding work on this Feature Map

## #185 · Test scenarios

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/185
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone scenarios for MEDIC-108 (patient profile management).

- 8 Gherkin scenarios, SCEN-MED108-01 to -08: positive, negative, boundary and edge.
- Each has its business rule, risk, priority, automation status and result on 2026-10-02.
- SCEN-MED108-01 and -02 are automated in the capstone suite.
- `SC-xx` in any file of the bundle means a scenario in the reference AC.

### Mentor review: PauloSzT · approved · 2026-10-02

> Excellent scenario design

## #186 · Bug report

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/186
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone bug report for MEDIC-108.

**Bug:** after a patient saves a new display name, the navbar and dashboard keep showing the old name, even after reload, until they log in again. P2, Medium.

- Evidence: three screenshots (saved with the old name in the navbar, the dashboard after reload, after a new login) and a JSON with every value per step.
- The JSON shows the stored profile has the new name while `/api/auth/session` still has the old one.
- Related to BUG-002 in a previous Product cohort's raw notes. This report adds the evidence for the cause.

### Mentor review: PauloSzT · approved · 2026-10-02

> Outstanding bug report, Adriana!

## #187 · Development checklist

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/187
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone development checklist for MEDIC-108.

- 13 items, each with why it matters, evidence, status and known limitation.
- 5 done: field allow-list, session required, success/error toast hooks, double-save prevention, independent tests.
- 2 partial: output escaping, testability hooks.
- 6 missing: name validation, phone validation, form validation, session refresh after a change, audit log, and AC/API field-name alignment (`displayName` vs `name`).

### Mentor review: PauloSzT · approved · 2026-10-02

> Great work consolidating this checklist, Adriana! The clear categorization (5 Done, 2 Partial, 6 Missing) combined with explicit evidence links and risk mappings gives the engineering team a precise roadmap for release readiness.

## #188 · UI and API tests and suite

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/188
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone automated tests and runnable suite for MEDIC-108.

- `tests/profile-ui.spec.ts`: 1 UI test, built against reference AC SC-01. It changes the name and phone, checks `toast-success`, and checks that the values persist after reload and that the email stays disabled.
- `tests/profile-api.spec.ts`: API test, built against reference AC SC-03 and SC-04. Without a session, the endpoint returns 401 `UNAUTHORIZED`. With a session, `email` and `role` in the payload are ignored while the name is updated.
- `playwright.config.ts`: one suite with `ui` and `api` projects and an HTML report. Failure artifacts are kept only when a test fails.
- `README.md`: how to run the suite, what each test covers, where the reference AC was adapted, and the `data-testid` hooks audit (in place of the missing state map).
- Evidence: 3 consecutive green runs (3/3 each), the API exploration and the hooks audit.

Each test snapshots the profile and restores it at the end. Credentials come from the environment.

### Mentor review: PauloSzT · approved · 2026-10-03

> Outstanding capstone submission, Adriana! The technical depth, test suite design, and thorough evidence collection make this an exemplary deliverable.

## #190 · CI workflow

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/190
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone stretch: CI workflow for the MEDIC-108 suite.

- `ci/playwright-capstone.yml` runs the suite on GitHub Actions. It triggers only on pull requests that change this folder, or on demand.
- It runs one job at a time, reads credentials from repository secrets, and uploads the HTML report, plus screenshots and videos on failure.
- Traces are off in CI, so the typed password is never stored in artifacts.
- It is kept in the capstone folder, so it stays inactive until it is copied to `.github/workflows/` and the three secrets are added. The steps are in the README, "Stretch".

### Mentor review: PauloSzT · approved · 2026-10-03

> Fantastic work on completing both the core capstone suite and the CI Stretch Goal, Adriana! The addition of the GitHub Actions workflow demonstrates excellent foresight in test orchestration, security, and CI/CD hygiene.

## #191 · Demo notes

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/191
- Status: Open (approved) · opened 2026-10-02
- Folder: [`friday-capstone/`](../friday-capstone/)

### What I submitted

Friday capstone demo notes for MEDIC-108.

- Feature, what was verified, UI and API coverage, key risks, bugs found, failure investigation approach, what remains unverified, and the recommendation: No-go as specified.
- Includes a 5-minute demo script.

### Mentor review: PauloSzT · approved · 2026-10-03

> Great job structuring your demo notes and presentation script, Adriana! This is an exemplary QA deliverable that balances technical automation depth with business-level risk analysis.
>
> Highlights
> Grounded Recommendation: Pushing for a No-Go based on missing business rules (validation & audit trail) and session state desynchronization (P2 bug) proves strong quality ownership.
>
> Root Cause Precision: Outstanding investigation identifying the delta between `/api/profile` state and `/api/auth/session` JWT payload.
>
> Demo Script Structure: The 5-minute timing is concise, impactful, and keeps security best practices at the forefront.
>
> Final Presentation Tips 
> 1. Highlight the AC Discrepancy: When mentioning `displayName` vs `name`, explicitly point out how automated API testing caught a false-positive that was actually silently ignoring payload attributes.
>
> 2. Pre-warmed Artifacts: Ensure your 3 screenshots (`toast-success`, `dashboard-stale-name`, `new-login-success`) are opened in adjacent browser tabs before starting the timer to avoid tab-switching delays.
