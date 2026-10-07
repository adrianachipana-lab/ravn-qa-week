# Ravn QA Week: Adriana Chipana

My deliverables from the Ravn QA Nerdery round-robin week (Development track), Sept 28 – Oct 3, 2026, with every mentor review.
The original work lives in pull requests on `ravn-qa/qa-nerdery-round-robbin-week-trainees`. This repo is my personal copy, organized by day.

## Week at a glance

| Day | Theme | Deliverables | Folder | Mentor reviews |
| --- | --- | --- | --- | --- |
| Monday | Exploratory testing & risk | 4 | [`monday/`](monday/) | [monday.md](mentor-reviews/monday.md) |
| Tuesday | Test planning & test data | 5 | [`tuesday/`](tuesday/) | [tuesday.md](mentor-reviews/tuesday.md) |
| Wednesday | Scenarios & UI automation | 4 | [`wednesday/`](wednesday/) | [wednesday.md](mentor-reviews/wednesday.md) |
| Thursday | API testing, bug reports & triage | 7 | [`thursday/`](thursday/) | [thursday.md](mentor-reviews/thursday.md) |
| Friday | Capstone: MEDIC-108 patient profile | 9 | [`friday-capstone/`](friday-capstone/) | [friday.md](mentor-reviews/friday.md) |

All 29 submitted PRs were **approved** by the mentor (PauloSzT). Monday–Thursday are merged; the Friday capstone PRs are approved and still open.

## Monday: Exploratory testing & risk

| Deliverable | What I did | PR | Status |
| --- | --- | --- | --- |
| Risk register | Risk register with 12 risks scored by probability × impact, sorted by score. | [#21](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/21) | Merged |
| Exploratory charter and session report | Exploratory charter and session report for booking, editing and cancellation, in one file following the Monday template. | [#22](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/22) | Merged |
| Session report | Session report for the exploratory charter: test notes per role, what worked, open questions and coverage estimate. | [#23](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/23) | Closed |
| Bug notes | 27 raw bug notes using the Monday template, with an index and severity guess. Evidence screenshots in `screenshots/`. | [#24](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/24) | Merged |
| Peer review of Camila Mamani | Peer review of Camila Mamani's Monday risk register and exploratory charter + session report (PRs #18, #19, #20), using the peer review template. | [#46](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/46) | Merged |

## Tuesday: Test planning & test data

| Deliverable | What I did | PR | Status |
| --- | --- | --- | --- |
| Site map | MediBook site map for the patient, doctor and no-session views: navigation diagram, route summary, and one entry per page (states, roles, key actions, API calls, `data-testid` hooks), plus testability notes for… | [#54](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/54) | Merged |
| Feature map | Feature map for appointment booking and cancellation (plus edit): state diagram, booking and cancellation flow diagrams, and 17 entries with happy / alternate / error paths, API call, test data, result and notes.… | [#55](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/55) | Merged |
| Test data sheet and seed script | Test data sheet: 5 patients, 3 doctors in 3 specialties, 10 appointments in 3 states, read-only references for the completed state, and input value sets (reason, date, time slot, doctor id, appointment id) with… | [#56](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/56) | Merged |
| Test plan and dry run | Short test plan for booking and cancellation following the template, with the business rules confirmed by the mentor, 20 prioritised scenarios linked to Monday's risks and the feature map, traceability, and… | [#57](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/57) | Merged |
| Peer review of Camila Mamani's test plan | Peer review of Camila Mamani's Tuesday test plan (PR #66), using the peer review template. Her test data sheet (PR #67) was read as supporting context. | [#88](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/88) | Merged |

## Wednesday: Scenarios & UI automation

| Deliverable | What I did | PR | Status |
| --- | --- | --- | --- |
| Playwright UI tests | Playwright UI tests in TypeScript for booking and cancellation. | [#92](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/92) | Merged |
| Test scenarios | 12 own test scenarios for booking and cancellation (positive, negative, boundary, edge) with the template fields, the risk each covers, and whether to automate it now or later. Includes the Wednesday README. | [#93](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/93) | Merged |
| Reflection | Reflection on Development's quality contribution: what Development can do to make the flow more testable, what selector/data/API issues made testing harder, and what to improve before adding the suite to CI. | [#94](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/94) | Merged |
| State map hook audit | Stretch: the reference Design state map checked against the app's `data-testid` hooks. | [#95](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/95) | Merged |

## Thursday: API testing, bug reports & triage

| Deliverable | What I did | PR | Status |
| --- | --- | --- | --- |
| Peer reproducibility review of Emmanuel Martinez's bug reports | Peer reproducibility review of Emmanuel Martinez's Thursday bug reports (PR #124), using the peer review template. Each report's steps were followed exactly, cold, with a different account, OS and browser. | [#133](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/133) | Merged |
| Formal bug reports | Two formal bug reports (study-materials template), re-reproduced on 2026-10-01 with fresh evidence: - **BR-01** — a second patient can book a slot another patient already booked; the slot stays "available" (two… | [#138](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/138) | Merged |
| API tests and regression suite | - **3 API tests** for `POST /api/appointments` (all pass): happy path (201 + read-back), auth failure (401 on create/list/read), validation (400 `VALIDATION_ERROR`, nothing created). - **Regression suite**… | [#139](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/139) | Merged |
| Automation delta | Automation Delta: one assertion added to Wednesday's SC-01 and SC-02 — the success toast ("Appointment booked successfully" / "Appointment cancelled"), checked right after the response because it is transient.… | [#140](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/140) | Merged |
| Failure triage verdict report | Failure Triage Lab (`triage-lab/` on the `triage` branch): six red tests, one verdict each with evidence from the failure snapshot, trace and API data. - **Product bugs:** t01 (total = system-wide 735), t03… | [#141](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/141) | Merged |
| Bad bug report rewrite | Block 2 exercise: "Booking is broken" split into the three defects it describes, the double-booking one rewritten as a reproducible report, and the weaknesses removed with what each would have cost a developer. | [#142](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/142) | Merged |
| API contract review | Contract review of `POST /api/appointments` against MEDIC-101 and the confirmed rules: envelope consistency (three breaks), status codes (past date, unknown doctor, taken slot, off-hours all 201), error contracts… | [#143](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/143) | Merged |

## Friday: Capstone: MEDIC-108 patient profile

| Deliverable | What I did | PR | Status |
| --- | --- | --- | --- |
| Risk register | Friday capstone risk register for MEDIC-108 (patient profile management). | [#182](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/182) | Open (approved) |
| Test plan | Friday capstone test plan for MEDIC-108 (patient profile management). | [#183](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/183) | Open (approved) |
| Feature map | Friday capstone feature map for MEDIC-108 (patient profile management). | [#184](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/184) | Open (approved) |
| Test scenarios | Friday capstone scenarios for MEDIC-108 (patient profile management). | [#185](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/185) | Open (approved) |
| Bug report | Friday capstone bug report for MEDIC-108. | [#186](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/186) | Open (approved) |
| Development checklist | Friday capstone development checklist for MEDIC-108. | [#187](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/187) | Open (approved) |
| UI and API tests and suite | Friday capstone automated tests and runnable suite for MEDIC-108. | [#188](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/188) | Open (approved) |
| CI workflow | Friday capstone stretch: CI workflow for the MEDIC-108 suite. | [#190](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/190) | Open (approved) |
| Demo notes | Friday capstone demo notes for MEDIC-108. | [#191](https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/191) | Open (approved) |

## Notes

- Files were copied as merged on `main` (Monday–Thursday) and from the approved Friday branches. `main` holds the latest version, including test updates made on Thursday (Automation Delta).
- The tests and seed scripts were written to run inside the original repo, which has the shared `package.json` and the app under test. Paths in the READMEs that point to `trainees/...` refer to that repo.
- No credentials are stored: the tests read `PATIENT_EMAIL` / `PATIENT_PASSWORD` from the environment.
- Peer reviews of classmates' work are included as my own deliverables for Monday, Tuesday, and Thursday.
