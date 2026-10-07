# Thursday: mentor reviews

Theme: API testing, bug reports & triage. Copied verbatim from the pull requests in `ravn-qa/qa-nerdery-round-robbin-week-trainees`.

## #133 · Peer reproducibility review of Emmanuel Martinez's bug reports

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/133
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Peer reproducibility review of Emmanuel Martinez's Thursday bug reports (PR #124), using the peer review template. Each report's steps were followed exactly, cold, with a different account, OS and browser.

#### Verdict
- **BUG-017** (logout doesn't end the session): reproduced first try. Added finding: Logout never calls `/api/auth/signout`; the session cookie expires 8 h after login.
- **BUG-010** (repeated Confirm creates duplicates): reproduced first try without throttling — 5 clicks, 5 × 201, 5 identical appointments in 40 ms (cancelled afterwards).

#### Improvements suggested (7)
Name the missing sign-out call; split cookie clearing from token revocation; fill in the token lifetime; say any account works; note it reproduces without throttling; separate the UI fix from the server-side double-booking gap; use an unassigned doctor in the example.

Evidence: `evidence/peer-review-bug017-repro.json`, `evidence/peer-review-bug010-repro.json` (no tokens stored).

### Mentor review: PauloSzT · approved · 2026-10-02

> Excellent peer review, Adriana! Your independent, cold-reproduction testing and deep-dive technical insights bring immense value to Emmanuel's PR

## #138 · Formal bug reports

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/138
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Two formal bug reports (study-materials template), re-reproduced on 2026-10-01 with fresh evidence:
- **BR-01** — a second patient can book a slot another patient already booked; the slot stays "available" (two patients, 201 and 201).
- **BR-02** — detail and list re-format the stored clinic time with the browser's time zone (25 Nov 10:00 shown as 24 Nov 05:00 AM in Lima, 06:00 in La Paz, 11:00 in Madrid; server HTML correct).

Evidence: `evidence/br-01-double-booking-repro.json`, `br-02-timezone-repro.json`, `br-02-detail-lima.png`.

### Mentor review: PauloSzT · approved · 2026-10-01

> Excellent work on these bug reports, Adriana! They are super clear, well-structured, and easy to follow. Any dev can pick these up and reproduce the issues right away.

## #139 · API tests and regression suite

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/139
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
- **3 API tests** for `POST /api/appointments` (all pass): happy path (201 + read-back), auth failure (401 on create/list/read), validation (400 `VALIDATION_ERROR`, nothing created).
- **Regression suite** (`regression.config.ts`): Wednesday's UI tests (MEDIC-101 AC tests + SC-01/SC-02) and the 3 API tests in one run and one HTML report. 7 tests in 67 s; screenshots, traces and video kept only for failing tests.
- **README**: how to run, what each test covers, and — per the facilitator's update — **every red test explained** (SCEN-MED101-01: feature never built; SCEN-MED101-02: planted bug, most likely) plus what would break first among the green ones.

Evidence: `evidence/regression-full-run.txt` (2 red, 5 green).

### Mentor review: PauloSzT · approved · 2026-10-01

> Overall, great work structuring the regression suite setup! The documentation in the comments is very clear, and setting workers: 1 along with retries: 0 is the right strategy to avoid race conditions and catch real issues.

## #140 · Automation delta

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/140
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Automation Delta: one assertion added to Wednesday's SC-01 and SC-02 — the success toast ("Appointment booked successfully" / "Appointment cancelled"), checked right after the response because it is transient. Earlier findings had recorded it as missing.

Rerun evidence: baseline 5/5, three runs after the change 5/5, and a mutation check showing the new assertion fails on a wrong text (`evidence/regression-*.txt`, `delta-mutation-check.txt`).

### Mentor review: PauloSzT · approved · 2026-10-01

> Great work on this PR, Adriana! The technical approach, documentation, and testing rigor are top-notch.

## #141 · Failure triage verdict report

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/141
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Failure Triage Lab (`triage-lab/` on the `triage` branch): six red tests, one verdict each with evidence from the failure snapshot, trace and API data.
- **Product bugs:** t01 (total = system-wide 735), t03 (completed = completed + cancelled), t05 (upcoming 21 vs 1).
- **Test bugs:** t02 (wrong data-testid), t04 (counted rows while loading), t06 (hard-coded id of another patient's appointment).

### Mentor review: PauloSzT · approved · 2026-10-02

> Outstanding triage work, Adriana! The depth of analysis and the data-driven verification using API inspection alongside failure snapshots make this report exceptionally high quality.

## #142 · Bad bug report rewrite

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/142
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Block 2 exercise: "Booking is broken" split into the three defects it describes, the double-booking one rewritten as a reproducible report, and the weaknesses removed with what each would have cost a developer.

### Mentor review: PauloSzT · approved · 2026-10-02

> You did a fantastic job untangling a vague, multi-issue report into an executive-ready, highly actionable bug report.

## #143 · API contract review

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/143
- Status: Merged · opened 2026-10-01 · merged 2026-10-02
- Folder: [`thursday/`](../thursday/)

### What I submitted

#### What
Contract review of `POST /api/appointments` against MEDIC-101 and the confirmed rules: envelope consistency (three breaks), status codes (past date, unknown doctor, taken slot, off-hours all 201), error contracts (one `VALIDATION_ERROR` for every rule), unenforced AC, and a verdict on cases 7 and 8 (both bugs).

### Mentor review: PauloSzT · approved · 2026-10-02

> Outstanding work on this contract review, Adriana! Your cross-referencing of test evidence against MEDIC-101 acceptance criteria and mentor business rules is top-tier QA work.
