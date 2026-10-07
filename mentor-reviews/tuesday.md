# Tuesday: mentor reviews

Theme: Test planning & test data. Copied verbatim from the pull requests in `ravn-qa/qa-nerdery-round-robbin-week-trainees`.

## #54 · Site map

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/54
- Status: Merged · opened 2026-09-29 · merged 2026-09-30
- Folder: [`tuesday/`](../tuesday/)

### What I submitted

#### What
MediBook site map for the patient, doctor and no-session views: navigation diagram, route summary, and one entry per page (states, roles, key actions, API calls, `data-testid` hooks), plus testability notes for Wednesday's tests.

Also includes the Tuesday README and the evidence index (`evidence/README.md`: what each file shows, proves and does not prove, with a timed capture log).

#### Evidence
`evidence/sm-01` to `sm-08` screenshots.

#### Known limitations
Admin role not mapped (out of scope); mobile layout not captured.

### Mentor review: PauloSzT · approved · 2026-09-29

> Good work on sitemap

## #55 · Feature map

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/55
- Status: Merged · opened 2026-09-29 · merged 2026-09-30
- Folder: [`tuesday/`](../tuesday/)

### What I submitted

#### What
Feature map for appointment booking and cancellation (plus edit): state diagram, booking and cancellation flow diagrams, and 17 entries with happy / alternate / error paths, API call, test data, result and notes. Expected results use the business rules confirmed by the mentor on 2026-09-29.

#### Evidence
Captured request/response for book, edit, cancel, patient error paths, no-session and doctor write attempts (`evidence/api-01` to `api-06`), form and dialog checks (`ui-01`) and screenshots (`fm-01` to `fm-03`).

### Mentor review: PauloSzT · approved · 2026-09-29

> Fantastic work on this Feature Map, Adriana! The clarity, state mapping, and sequence modeling are exemplary.
>
> Highlights:
>
> Mermaid Diagrams: The state diagram and sequence diagrams provide a crystal-clear architectural overview of the appointment lifecycle and API interactions.
>
> Comprehensive Coverage (FM-B01 to FM-E02): Mapping happy paths, alternate paths, and error conditions with explicit test data references (A01-A09, D1-D3, P1-P5) makes this document directly actionable for test case generation.
>
> Mentor Rule Alignment: Successfully incorporating the updated mentor business rules (e.g., status transition permissions, lead-time expectations, UX toast feedback requirement) shows great attention to detail.
>
> Traceability: Excellent linking between test outcomes (Pass/Fail/Partial) and specific evidence files / bug IDs from earlier sessions.

## #56 · Test data sheet and seed script

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/56
- Status: Merged · opened 2026-09-29 · merged 2026-09-30
- Folder: [`tuesday/`](../tuesday/)

### What I submitted

#### What
Test data sheet: 5 patients, 3 doctors in 3 specialties, 10 appointments in 3 states, read-only references for the completed state, and input value sets (reason, date, time slot, doctor id, appointment id) with expected and observed results.

#### Stretch
`seed/seed-test-data.mjs` recreates the data set through the public API only, with `--verify` (entry check) and `--cleanup` modes. Run and verify outputs are included; no password is stored (read from `SEED_PASSWORD`).

#### Known limitations
`completed` can't be created through the UI/API without using a known defect, so it uses pre-seeded references. Accounts can't be deleted (no endpoint).

### Mentor review: PauloSzT · approved · 2026-09-29

> Outstanding work on this submission, Adriana! The level of engineering maturity shown in both the script design and data sheet documentation is top-tier.
>
> Highlights:
>
> Production-Grade Seed Script (seed-test-data.mjs): Creating a fully repeatable, zero-defect seed script using standard Node.js native fetch against public APIs is excellent practice.
>
> Safety & Environment Isolation: Reading secrets dynamically from SEED_PASSWORD and targeting unassigned doctors (D1–D3) ensures zero interference with other trainees' test setups.
>
> Entry Check & Drift Detection (--verify): Adding a --verify flag to validate test data integrity prior to test runs (and catching expected state changes like A02 during dry runs) shows strong test architecture discipline.
>
> Thorough Boundary Mapping: The Input Values section (IN-R, IN-D, IN-T) provides crystal-clear edge-case coverage that directly supports Wednesday's automation effort.

## #57 · Test plan and dry run

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/57
- Status: Merged · opened 2026-09-29 · merged 2026-09-30
- Folder: [`tuesday/`](../tuesday/)

### What I submitted

#### What
Short test plan for booking and cancellation following the template, with the business rules confirmed by the mentor, 20 prioritised scenarios linked to Monday's risks and the feature map, traceability, and step-by-step run instructions.

Includes a first dry run of all 20 scenarios (`test-run.md`).

#### Result
**No-go** — 7 pass, 12 fail, 1 partial. Highlights:
- Same slot booked by two different patients, and 3 parallel requests all return 201.
- Past dates, today's past hours and slots 3 minutes ahead are all bookable.
- The list/detail convert the stored clinic time as UTC into the browser's time zone (London +1h, Tokyo +9h, Lima −5h and −1 day); the dashboard stays correct.
- A patient can set `completed` / `approved` through the API.

#### Evidence
`evidence/run-01` to `run-13`.

### Mentor review: PauloSzT · approved · 2026-09-30

> Excellent work, Adriana! The structure of your test plan and the technical rigor in your baseline run are top-tier. The timezone isolation (TP-06) and the cross-patient concurrency evidence (TP-02 & TP-03) provide crystal-clear justification for the No-Go status.
> 
> Suggestions & Minor Refinements:
> 
> TP-06 Scope Alignment: Update the TP-06 description in test-plan.md to reflect that regional timezones were verified via Chromium timezone emulation rather than a distinct secondary browser engine.
> 
> Lead Time Parameter (TP-17): Keep a note for Product regarding the 15-minute lead time rule so that tomorrow’s Playwright time-based assertions use an agreed fixed baseline.
> 
> Automation Coverage for TP-16: Since reference rows C01–C03 exist in the seed, consider adding a quick Playwright assertion tomorrow to confirm that the UI hides "Edit/Cancel" action buttons on completed status automatically.

## #88 · Peer review of Camila Mamani's test plan

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/88
- Status: Merged · opened 2026-09-30 · merged 2026-10-01
- Folder: [`tuesday/`](../tuesday/)

### What I submitted

#### What
Peer review of Camila Mamani's Tuesday test plan (PR #66), using the peer review template. Her test data sheet (PR #67) was read as supporting context.

#### Gaps found (6)
1. Exit criteria can't be met on this build (release gate mixed with test exit).
2. TP-06 expects the doctor to complete an appointment (200), but the doctor role is read-only by design.
3. Scenarios aren't executable from the plan: no data IDs, preconditions or steps.
4. Plan risks aren't linked to the Monday risk register's top scores.
5. TP-04's expected error has no rule behind it.
6. (minor) No boundary scenarios for the lead time and end-of-shift slot.

### Mentor review: PauloSzT · approved · 2026-09-30

> Outstanding job on this peer review, Adriana!
