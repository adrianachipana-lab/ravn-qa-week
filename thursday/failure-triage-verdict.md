# Failure Triage Lab — Verdict Report

Author: Adriana Chipana · Track: Development · Day: Thursday

- **Lab:** `triage-lab/` on branch `triage` (commit `3b076bf`) — six Playwright tests, all red.
- **How it was run:** on 2026-10-01 at about 10:00 (UTC−5) with the repo's `playwright.config.ts` (trace on, La_Paz time zone). The tests ran unedited, from a copy outside git.
- **Data:** each failure's page snapshot (`error-context.md`) and trace were read. The lab account's data was then checked through the API, read only — see [`evidence/triage-data.json`](evidence/triage-data.json).

**Result:** 3 product bugs (t01, t03, t05) and 3 test bugs (t02, t04, t06).

---

## t01 — the dashboard total matches the number of appointments the patient owns

- **Failing test:** `t01-dashboard-total.spec.ts`
- **Verdict:** PRODUCT BUG
- **Evidence:**
  - Assertion `expect(shown).toBe(mine.length)` → **Expected: 57, Received: 735**.
  - The API returns all of the patient's appointments in one page (`pagination.total: 57`, 57 rows returned). The helper's `limit=200` is capped at 100 by the server, so nothing was cut off.
  - `GET /api/test/reset` reports **735 appointments in the whole system**, the exact number the dashboard shows.
  - Screenshot: [`evidence/triage-t01-failure.png`](evidence/triage-t01-failure.png).
- **Root cause:** the dashboard's "Total appointments" is computed over every appointment in the system instead of the logged-in patient's.
- **Draft bug title:** "Patient dashboard 'Total appointments' shows the system-wide count (735) instead of the patient's own (57)"

## t02 — the dashboard offers a shortcut to book a new appointment

- **Failing test:** `t02-new-appointment-button.spec.ts`
- **Verdict:** TEST BUG
- **Evidence:**
  - `getByTestId('dashboard-new-appointment-button')` → "element(s) not found" after 5 s.
  - The page snapshot at failure shows the shortcut is there: link "Book new" → `/appointments/new`, containing button "Book new".
  - Its hook is **`dashboard-new-appointment-btn`** (mapped on Tuesday, site map; checked again in the rendered page).
  - Screenshot: [`evidence/triage-t02-failure.png`](evidence/triage-t02-failure.png) shows the "Book new" button.
- **Root cause:** the test uses a `data-testid` that doesn't exist (`-button` instead of `-btn`). The feature works.
- **What would make this test trustworthy:**
  - Use the real hook `dashboard-new-appointment-btn`.
  - Keep hook names in one shared constants file taken from the app, so a typo can't compile into a test.
  - Assert the shortcut's target, too (it leads to `/appointments/new`), not just that it's visible.

## t03 — the completed counter excludes cancelled appointments

- **Failing test:** `t03-completed-count.spec.ts`
- **Verdict:** PRODUCT BUG
- **Evidence:**
  - Assertion `expect(shown).toBe(completed)` → **Expected: 5, Received: 40**.
  - The API shows this patient has **5 completed and 35 cancelled** appointments, and 5 + 35 = **40**, exactly what the counter shows.
  - Unlike t01, the number isn't system-wide: it's this patient's completed **plus** cancelled.
- **Root cause:** the dashboard's "Completed" counter includes cancelled appointments. That is exactly what the test's name says it must not do.
- **Draft bug title:** "Patient dashboard 'Completed' counter includes cancelled appointments (shows 40 = 5 completed + 35 cancelled)"

## t04 — the appointments page lists the patient's appointments

- **Failing test:** `t04-appointments-list.spec.ts`
- **Verdict:** TEST BUG
- **Evidence:**
  - `expect(rows).toBeGreaterThan(0)` → **Received: 0**.
  - The page snapshot at failure shows the table body with a single cell, **"Loading..."** (`appointments-loading`); the screenshot is the same ([`evidence/triage-t04-failure.png`](evidence/triage-t04-failure.png)).
  - The list loads its rows in the browser after navigation (`GET /api/appointments?…`; Tuesday's site map). The patient has 57 appointments, and on the same page, a test that waits for its row finds them (Wednesday's SC-01/SC-02, Thursday's regression runs).
- **Root cause:** `locator(...).count()` returns immediately and doesn't wait. The rows were counted while the list was still loading.
- **What would make this test trustworthy:** use a web-first assertion that retries, for example waiting until `appointments-loading` is gone and asserting the first `appointment-row-*` is visible, or `expect(rows).not.toHaveCount(0)` instead of `count()` plus `toBeGreaterThan`.

## t05 — the upcoming counter only counts the next 7 days

- **Failing test:** `t05-upcoming-window.spec.ts`
- **Verdict:** PRODUCT BUG
- **Evidence:**
  - Assertion `expect(shown).toBe(within7)` → **Expected: 1, Received: 21**.
  - The patient has exactly one scheduled appointment in the next 7 days, 2026-10-07 at 15:00. The answer is 1 with both definitions of "within 7 days":
    - the test's (the date at midnight UTC);
    - the clinic slot time.
  - The dashboard's own "Next 3 appointments" list on the same screen shows only two upcoming appointments, on Oct 7 and Oct 13 (see the t01 screenshot).
  - 21 is also more than the patient's 17 scheduled appointments in total, so no 7-day window over their data can produce it.
- **Root cause:** the "Upcoming (7 days)" counter isn't scoped to the patient and/or the 7-day window. The exact rule behind 21 can't be identified from outside the app.
- **Draft bug title:** "Patient dashboard 'Upcoming (7 days)' shows 21 while the patient has 1 scheduled appointment in the next 7 days"
- **Note on the test:** it compares `new Date(a.date)` (midnight UTC) with "now", so a same-day appointment later today would be left out. That didn't change today's result, but it would make the test wrong near the edges of the window. Using date plus `timeSlot` in clinic time would make it exact.

## t06 — a patient can open an appointment from its detail page

- **Failing test:** `t06-appointment-detail.spec.ts`
- **Verdict:** TEST BUG
- **Evidence:**
  - `getByTestId('appointment-detail-card')` not found after 8 s. The page snapshot at failure shows "Appointment not found."
  - The hard-coded `APPOINTMENT_ID = "6aa85e2fb0083185ed54c8a8"` returns **404** to the lab's patient through the API.
  - Read with the doctor account, the same id returns **200**: it belongs to **a different patient**, with Dr. Sarah Mitchell on 2026-09-16.
  - Screenshot: [`evidence/triage-t06-failure.png`](evidence/triage-t06-failure.png).
- **Root cause:** the test opens someone else's appointment. "Not found" is the correct, protective behaviour (it's how the app keeps patients out of each other's records), so the test's own data is wrong.
- **What would make this test trustworthy:**
  - Create the appointment the test opens, as the same patient, through `POST /api/appointments` in setup.
  - Open that id, and cancel it in teardown — instead of a hard-coded id from a seed run that can be reassigned or re-seeded.

---

## Patterns

- **The three product bugs are all dashboard counters,** and each is wrong in a different way:
  - Total — system-wide (735).
  - Completed — includes cancelled (40).
  - Upcoming — neither scoped nor windowed correctly (21).

  On Monday they were logged as a single issue (BUG-07). The lab shows they need three separate fixes.
- **The three test bugs are the classic kinds:**
  - wrong selector (t02);
  - missing wait (t04);
  - stale or foreign test data (t06).

  Each one was proved by the page snapshot at the moment of failure, not by reading the test name.
- **Read the assertion, not the title:**
  - t03's title ("excludes cancelled") turned out to be the exact bug.
  - t06's title ("a patient can open an appointment") describes something that works. Its assertion was simply pointed at the wrong record.
