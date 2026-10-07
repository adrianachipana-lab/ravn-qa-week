# Test Hooks Guide — SC-01 and SC-02

Author: Adriana Chipana · Track: Development · Day: Wednesday

Working notes used to write the two UI tests: which `data-testid` to use at each step, what to assert, and what can make the tests flaky. The hooks were mapped on Tuesday (`../../tuesday/adriana-chipana/site-map.md`).

## Before writing

- **Config you inherit (`playwright.config.ts`):**
  - `baseURL` is the MediBook URL, so tests can use relative paths like `/login`.
  - `timezoneId: America/La_Paz` (UTC−4).
  - `workers: 1`, `retries: 0`, `trace: on`.
  - Timeout 90 s per test.
- **Accounts:** use one of Tuesday's seeded patients (P1–P5), not the own assigned account. Read the email and password from environment variables; never write them in the spec.
- **Unique data:** put a unique marker in the reason (for example the run's timestamp), so the test can find *its* appointment and nothing else.

## SC-01 — Book a free slot

**Steps and hooks**

1. **Log in**
   - `/login` → `login-email-input`, `login-password-input`, `login-submit-btn`
   - Wait for the URL to become `/dashboard`.
2. **Open the booking page:** go to `/appointments/new`, or click `dashboard-new-appointment-btn`.
3. **Choose a doctor**
   - `appointment-form-doctor-select` is a native `<select>`.
   - Options read like `Dr. Michael Thompson — General Practice`, with an em dash, not a hyphen.
4. **Pick a day**
   - `calendar-next-month` moves one month.
   - Days are `calendar-day-YYYY-MM-DD`, for example `calendar-day-2026-11-10`.
   - Pick a working day of that doctor: Thompson works Mon–Fri.
5. **Pick a time:** slots are `time-slot-HH:MM`, for example `time-slot-10:00`. The grid appears after clicking a day, because it calls `GET /api/doctors/{id}/slots`.
6. **Reason:** `appointment-form-reason-textarea`. The counter is `reason-char-count`.
7. **Review:** `appointment-form-submit-btn` opens `confirmation-modal`.
8. **Confirm:** `confirmation-modal-confirm-btn`. The app sends `POST /api/appointments` and redirects to `/appointments`.

**What to assert**

- The URL ends in `/appointments`.
- The new row is visible, with the doctor's name in `cell-doctor` and the badge `status-badge-scheduled`.
- Optional, but stronger: the `POST /api/appointments` response is 201, and its body has `status: "scheduled"` plus the date and slot you picked.

**How to find "your" row** — the row hook includes the appointment id (`appointment-row-<id>`), and the UI doesn't show the id. Two options:

- Type your unique reason in `appointments-search-input`, then check the row that remains.
- Or read the id from the `POST /api/appointments` response while clicking Confirm, then target `appointment-row-<id>` directly. This one is more precise.

## SC-02 — Cancel own appointment

**Setup (the test creates its own appointment)** — either repeat SC-01's booking steps, or create it through the API with the logged-in page's request context, which shares the session cookie. The API route is faster and keeps SC-02 independent of SC-01 passing.

**Steps and hooks**

1. Open `/appointments/<id>`.
2. Wait for `appointment-detail-card`.
3. Click `cancel-appointment-btn`. The dialog shows `cancel-modal-confirm-btn` and `cancel-modal-keep-btn`.
4. Click `cancel-modal-confirm-btn`. The app sends `DELETE /api/appointments/<id>` and redirects to `/appointments`.

**What to assert**

- The URL ends in `/appointments`.
- `appointment-row-<id>` contains `status-badge-cancelled`.
- Optional: after reopening `/appointments/<id>`, there's no `cancel-appointment-btn` and no `edit-appointment-btn`.

## Cleanup

- **SC-01** leaves a scheduled appointment. Cancel it at the end with `DELETE /api/appointments/<id>` from the same session, even if an assertion failed — so the cleanup has to run after the test body.
- **SC-02** already ends cancelled, so it needs no cleanup.

## What can make these tests flaky — and what to avoid

- **Don't assert the time or the date in the list or the detail.** Because of the time zone bug (BUG-06), both move with the browser's zone, and the config pins La_Paz. The assertion would fail or pass for the wrong reason. Check the doctor, the status and the reason instead, or check the date and slot in the API response.
- **Don't rely on the success message.** A toast ("Appointment booked successfully" / "Appointment cancelled") appears in `toast-container` but disappears after a few seconds, so a late check sees it empty. Check it right after the click, or not at all. (Correction: on Monday and Tuesday this was wrongly recorded as "no message", BUG-26.)
- **Wait for the list to load.** "Loading…" (`appointments-loading`) appears first. Wait for your row, not for a fixed number of seconds.
- **The detail page re-renders after loading** (hydration). Wait for the element you need before reading it.
- **Hooks that repeat on the page** (`cell-date`, `status-badge-scheduled`) must be looked up inside your row, not on the whole page.
- **Month navigation:** a hard-coded day only works if it's in the month you navigated to, and it has to be a working day. Compute a future working day, or pick one far enough ahead and navigate the right number of months.
- **A taken slot won't fail the booking today** (BUG-01). Your test must not rely on that: pick a slot unlikely to be used by others, and don't assert "slot is free" in these two tests.

## Run evidence to collect (for the run log)

- Branch or commit.
- The exact command.
- Three consecutive green runs, each with its date and time.
- Path to the HTML report (`playwright-report/`) and to one trace.
- What the tests verify, and a known limitation.

Template fields are in `study-materials.pdf`, page 8 (Automation Run Log).
