# Monday: mentor reviews

Theme: Exploratory testing & risk. Copied verbatim from the pull requests in `ravn-qa/qa-nerdery-round-robbin-week-trainees`.

## #21 · Risk register

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/21
- Status: Merged · opened 2026-09-29 · merged 2026-09-29
- Folder: [`monday/`](../monday/)

### What I submitted

#### What
Risk register with 12 risks scored by probability × impact, sorted by score.

Covers all required areas: double-booking (R-01), race conditions (R-02), timezone (R-03), past-date scheduling (R-05), permission leaks (R-04, R-06), notification failures (R-08) and data integrity (R-07, R-09, R-10).

#### Highlights
- R-01 Same slot booked twice — 25
- R-02 Concurrent bookings all succeed — 20
- R-03 Date/time shown differently across screens — 20

#### Stretch
R-01 / R-02 flagged as the automated regression candidate (API conflict test).

### Mentor review: PauloSzT · approved · 2026-09-29

> Outstanding work on your Risk Register, Adriana! This submission reflects a deep understanding of quality engineering and backend architecture.

## #22 · Exploratory charter and session report

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/22
- Status: Merged · opened 2026-09-29 · merged 2026-09-29
- Folder: [`monday/`](../monday/)

### What I submitted

#### What
Exploratory charter and session report for booking, editing and cancellation, in one file following the Monday template.

Roles: patient and doctor (plus unauthenticated checks). Evidence screenshots are in the bug notes PR (#24).

#### Result
- Doctor read-only enforced by the API (403); patient isolation held (404 on other patients' appointments).
- Main problems in scheduling integrity: double-booking, past dates, timezone shift, unscoped dashboard totals.
- 27 raw bug notes in #24.

#### Known limitations
- Session shorter than the 90-minute time-box (two blocks).
- Coverage ~60–65%: accessibility, notifications and admin role only lightly or not covered.

### Mentor review: PauloSzT · approved · 2026-09-29

> Excellent work on this submission, Adriana! This is a comprehensive, highly technical exploratory testing report.
>
> Highlights:Multi-Layer Testing: Great job testing both through the UI (using Playwright MCP) and directly against the REST API (using curl). 
> Testing both layers allowed you to uncover critical discrepancies like BUG-05 (bypassing status checks) and BUG-12 (UI "Not Found" vs API returning 200).   
>
> Business Risk Coverage: You uncovered 27 defects, focusing heavily on core business risks like double-booking, race conditions, and timezone rendering issues.   
>
> Clear Boundaries & Limitations: Your coverage estimation table and open questions show high QA maturity and awareness of what was tested vs. what remains out of scope.

## #23 · Session report

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/23
- Status: Closed · opened 2026-09-29
- Folder: [`monday/`](../monday/)

### What I submitted

#### What
Session report for the exploratory charter: test notes per role, what worked, open questions and coverage estimate.

#### Result
- Doctor read-only enforced by the API (403); patient isolation held (404 on other patients' appointments).
- Main problems in scheduling integrity: double-booking, past dates, timezone shift, unscoped dashboard totals.
- 27 raw bug notes in the bug notes PR.

### Mentor review

_No review on this PR._

### Comment: adrianachipana-lab · 2026-09-29

> Merged into #22 — charter and session report are one deliverable.

## #24 · Bug notes

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/24
- Status: Merged · opened 2026-09-29 · merged 2026-09-29
- Folder: [`monday/`](../monday/)

### What I submitted

#### What
27 raw bug notes using the Monday template, with an index and severity guess. Evidence screenshots in `screenshots/`.

#### Top findings
- BUG-01 / BUG-02: same slot can be booked more than once, also in parallel
- BUG-03: slot picker never marks booked slots as taken
- BUG-04 / BUG-05: past dates bookable; edit accepts any date, time and status
- BUG-06: date/time shifted −5h (sometimes −1 day) in list and detail
- BUG-07: patient dashboard shows system-wide totals

### Mentor review: PauloSzT · approved · 2026-09-29

> Exceptional work on this submission, Adriana! Documenting 27 detailed bugs with this level of technical isolation is outstanding.
>
> Highlights:Deep Technical Isolation: Your investigation into BUG-02 using concurrent Promise.all requests, and linking BUG-01 to BUG-03 (where the slots API fails to mark booked slots as unavailable), shows high-level engineering thinking.   
>
> Root Cause Clues: Identifying React hydration errors (#418 / #425) for BUG-06 (timezone shift) gives the development team an immediate starting point to fix the issue.
>  
> Holistic QA Approach: Including accessibility issues (contrast ratios, focus rings, heading hierarchy in BUG-19 to BUG-25) alongside critical security and data integrity findings demonstrates a complete quality mindset.

## #46 · Peer review of Camila Mamani

- PR: https://github.com/ravn-qa/qa-nerdery-round-robbin-week-trainees/pull/46
- Status: Merged · opened 2026-09-29 · merged 2026-09-30
- Folder: [`monday/`](../monday/)

### What I submitted

#### What
Peer review of Camila Mamani's Monday risk register and exploratory charter + session report (PRs #18, #19, #20), using the peer review template.

#### Summary
- 11 issues, each with evidence, the risk it creates and a suggested improvement.
- High priority: RISK-04 probability contradicted by the UI; race condition not separated from double-booking; the "stored 10:00 vs selected 09:00" lead not followed up.
- What works: score justifications, the RISK-01 control test, and the "Proves / Does not prove" evidence index.

### Mentor review: PauloSzT · approved · 2026-09-29

> Hi Adriana! Thank you for such a detailed, constructive, and highly technical peer review for Camila.
