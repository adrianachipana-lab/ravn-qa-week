# Automation Run Log — Wednesday UI Tests

Author: Adriana Chipana · Track: Development · Day: Wednesday

## Suite

- **Required tests (against the reference AC, MEDIC-101):**
  - `tests/med101-01-book-open-slot.spec.ts` → SCEN-MED101-01 (High) — happy-path booking
  - `tests/med101-02-taken-slot-disabled.spec.ts` → SCEN-MED101-02 (High) — booked slot disabled for another patient
- **Extra tests (own scenarios, `scenarios.md`):**
  - `tests/own-scenarios/book-appointment.spec.ts` → SC-01
  - `tests/own-scenarios/cancel-appointment.spec.ts` → SC-02
- **Shared:** `tests/helpers.ts` — login (UI and API), doctors, date/slot picker, unique reason.

## Automation Run Log

- **Branch / Commit:** `adriana-chipana-wednesday-ui-tests` @ `1a6ff2b` ("Add Playwright UI tests for wednesday"). All three runs below were made from that commit.
- **Command** (from the repo root, with two seeded test patients in the environment):
  ```bash
  export PATIENT_EMAIL='<seeded patient 1>'
  export SECOND_PATIENT_EMAIL='<seeded patient 2>'
  export PATIENT_PASSWORD='<seeded password>'   # both seeded patients share it; else set SECOND_PATIENT_PASSWORD
  npx playwright test trainees/development/submissions/wednesday/adriana-chipana/tests --reporter=list
  ```
- **Run 1 Result:** 2 passed (SC-01, SC-02), 2 failed as expected (SCEN-MED101-01, -02) — 2026-09-30 10:27:29 (UTC−5) — [`evidence/run-1.txt`](evidence/run-1.txt)
- **Run 2 Result:** identical — same 2 pass, same 2 fail on the same assertions — 10:28:26 — [`evidence/run-2.txt`](evidence/run-2.txt)
- **Run 3 Result:** identical — 10:29:22 — [`evidence/run-3.txt`](evidence/run-3.txt)
- **Report / Trace Path:**
  - HTML report: `playwright-report/index.html`, opened with `npx playwright show-report`. It was regenerated at 10:32 with the default reporters, with the same result: [`evidence/report-summary.png`](evidence/report-summary.png).
  - Traces: `test-results/<test>/trace.zip` (trace is always on in the config).
  - **Not committed:** traces, failure screenshots, videos, and the report's detail pages for failing tests. All of them contain the password typed into the login form (the failure page snapshot and the trace record it). They are kept locally; open with `npx playwright show-trace <path>`.
- **What these tests verify:**
  - **SCEN-MED101-01** — a patient books Dr. Sarah Mitchell at 14:00 on a future working day.
    - Hard assertions (implemented today): the API answers 201 with `scheduled`, the date and the slot; the list shows the row as Scheduled.
    - Soft assertions (AC gaps):
      - the AC's exact confirmation message;
      - the booked slot is no longer offered to other patients.
  - **SCEN-MED101-02** — a first patient holds Dr. Mitchell at 09:00 (created via API); a second patient opens that day in the UI.
    - Soft assertions (AC gaps):
      - the slot is disabled;
      - it is marked `data-available="false"`;
      - it is labeled "Unavailable";
      - the form won't accept it.
    - Hard assertion: no booking request is sent.
  - **SC-01 / SC-02** — booking and cancelling own appointments through the UI, checked in the API response and in the list; the cancelled detail has no Edit/Cancel.
- **Known Limitation:**
  - The two AC tests **fail by design** until the app implements MEDIC-101. Each gap, what the AC requires, what the app does and which one I believe is wrong are in [`ac-gap-report.md`](ac-gap-report.md).
  - The AC's example data is adapted: its dates are in the past and its patients are shared or other trainees' accounts. The tests keep the AC's doctor and times and use a future working day and seeded patients.
  - List date/time is not asserted in SC-01, because it follows the browser's time zone (BUG-06; the config pins America/La_Paz).
  - SCEN-02's "no selection hold is created" can't be observed, because the app has no hold. The test checks the observable part: no booking request.
  - Chromium only.
  - Each run leaves cancelled rows in the shared environment (no delete endpoint).

## Stability and independence

- **Deterministic:** the same 2 tests passed and the same 6 assertions failed (2 in SCEN-MED101-01, 4 in SCEN-MED101-02) in all three runs. There was no flaky result and no retries (`retries: 0`).
- **Own data:** every test creates the appointment it needs:
  - SCEN-02 and SC-02 create it through the API;
  - SCEN-01 and SC-01 book it through the UI.
- **Isolation:** the random future working day and slot keep repeated runs from reusing the same doctor, date and slot.
- **Cleanup:** `afterEach` cancels what the test created, even when assertions fail.
  - Checked after the runs: all 25 `QA Wed` appointments on the test account are cancelled; none is left scheduled.
- **Selectors:** `data-testid` only (`getByTestId`), plus the `data-available` attribute on slots.
- **Waits:** no fixed sleeps. The tests wait for:
  - the network to settle before interacting with pages that re-render in the browser;
  - the POST/DELETE response before asserting.

  Web-first assertions retry by themselves.
- **TypeScript:** type-checks cleanly in strict mode.

## Correction to earlier findings

While writing SCEN-MED101-01, the test caught a toast, "Appointment booked successfully", and cancelling shows "Appointment cancelled". Both appear for a few seconds in `toast-container`. On Monday (BUG-26) and Tuesday (TP-18) these were recorded as "no success message", because the check ran after the toast had already gone. The real gap is that the message is generic and short-lived, not that it's missing.
