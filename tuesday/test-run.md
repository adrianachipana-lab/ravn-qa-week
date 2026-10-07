# Test Run — Dry Run of the Booking & Cancellation Plan

Author: Adriana Chipana · Track: Development · Day: Tuesday

A first manual execution of every scenario in [test-plan.md](test-plan.md), to check that the plan can be run by someone else as written and to record a baseline before Wednesday's automation.

- **Date:** 2026-09-29, 09:50–09:54 (UTC−5); entry check at 09:48
- **Environment:** https://medapp-nerdery.vercel.app, buggy mode ON · Chromium via Playwright, browser timezone America/Lima (UTC−5)
- **Data:** seed run `2609291300` ([test-data-sheet.md](test-data-sheet.md))
- **How it was run:** UI scenarios in the browser as P1 (and the own patient account for TP-16); API scenarios as manual requests with the seeded accounts. Every request and response is saved in [`evidence/`](evidence/README.md).

**Note added after the run:** on 2026-09-29 the mentor confirmed the business rules behind TP-04, TP-05, TP-06, TP-10 and TP-15. The results below don't change: every *Fail* is now a confirmed bug, and the missing confirmation in TP-01/TP-10 is a confirmed UX bug. TP-17 to TP-20 were added to the plan afterwards and run the same day between 15:17 and 15:29.

## Entry check

- `seed-test-data.mjs --verify` before the run: **all 10 seeded rows as expected** ([`seed/seed-verify-output.txt`](seed/seed-verify-output.txt)).
- Patient and doctor logins worked.

## Summary

- **Result: No-go** for booking and cancellation. 6 of the 10 P1 scenarios fail (TP-02, TP-03, TP-04, TP-06, TP-17, TP-19) and TP-01 only partly passes.
- **20 scenarios run:** 7 pass, 12 fail, 1 partial (TP-01–TP-16 in the morning, TP-17–TP-20 at 15:17 after the mentor's rulings).
- **What works:** cancellation (own appointment, other patient's, doctor, idempotency), session and role enforcement, releasing a slot, read-only completed and cancelled appointments.
- **What fails:** everything that should *prevent a bad booking* — taken slot, parallel requests, past date, non-working day, off-hours, unknown doctor, invalid edit — plus the date/time shown in the list and detail.

## Results by scenario

### TP-01 — Book a free slot (P1)

- **Result:** Partial
- **Actual:** Booking D1 on 2026-10-21 at 07:00 through the UI returned 201 and the row appears in the list, detail and dashboard. The dashboard and the server-rendered detail show Oct 21, 07:00, but the list and the detail page (after it loads in the browser) show Oct 20, 02:00 AM — see TP-06.
- **Evidence:** `evidence/run-03-tp01-tp06-booking-and-display.json`
- **Bug:** Monday BUG-06

### TP-02 — Book an already-booked slot (P1)

- **Result:** Fail
- **Actual:** As P5, D3's slot for 2026-11-03 09:00 (booked by P4, A08) is returned as `available: true`, and `POST` for the same slot returns **201**. Expected: taken + 409.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-02`
- **Bug:** Monday BUG-01, BUG-03 — now reproduced **across two different patients**, which Monday could only infer.

### TP-03 — Parallel bookings for one free slot (P1)

- **Result:** Fail
- **Actual:** 3 parallel `POST` for D1 2026-10-30 08:00 (P4, P5, P4) → **201, 201, 201**. Expected: exactly one 201.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-03`
- **Bug:** Monday BUG-02, now with two different patients.

### TP-04 — Past date is not bookable (P1)

- **Result:** Fail
- **Actual:** In the calendar, Sep 25 and Sep 28 are enabled (`disabled: false`, pointer cursor); only weekends are blocked. `POST` for 2026-09-28 returns **201**.
- **Evidence:** `evidence/run-02-tp04-past-days-enabled.png`, `evidence/run-01-api-scenarios.json` → `TP-04 (API part)`
- **Bug:** Monday BUG-04

### TP-05 — Last valid slot vs closing time (P2)

- **Result:** Fail
- **Actual:** D1 (07:00–14:00, 30 min) on 2026-10-21 offers 15 slots from 07:00 to **14:00**. Expected last slot: 13:30.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-05`
- **Bug:** Monday BUG-10

### TP-06 — Booked time shown consistently (P1)

- **Result:** Fail
- **Actual:** Same appointment (stored 2026-10-21 07:00):
  - API: 2026-10-21 07:00
  - Dashboard: Oct 21, 2026 at 07:00
  - Detail as sent by the server: Oct 21, 2026 · 07:00 AM
  - **Detail after it loads in the browser: Oct 20, 2026 · 02:00 AM**
  - **List: Oct 20, 2026 · 02:00 AM**
  - Console on the detail page: React errors #425, #418, #423 (hydration text mismatch).
- **Evidence:** `evidence/run-03-tp01-tp06-booking-and-display.json`, `evidence/run-04-tp06-detail-after-hydration.png`
- **Repeat with other time zones (15:29):** A01 (stored 2026-10-20 07:00) in Chromium with the browser zone set to London, Tokyo and Lima. The dashboard shows 07:00 in all three. The list and detail show **08:00 AM** (London), **04:00 PM** (Tokyo) and **Oct 19, 02:00 AM** (Lima).
- **Evidence (repeat):** `evidence/run-12-tp06-timezones.json`, `evidence/run-13-tp06-detail-london.png`
- **Bug:** Monday BUG-06. **Cause narrowed:** the stored value and the server-rendered HTML are correct; the list and detail treat the stored clinic time as UTC and convert it to the browser's zone, so the time moves with the browser. Expected (mentor rule 1): clinic-local 07:00 on every screen. Only Chromium is installed, so the "second browser" part of the plan was covered with time zones instead.

### TP-07 — Non-working day and outside hours (P2)

- **Result:** Fail
- **Actual:** The slots endpoint correctly returns no slots for D3 on a Monday (2026-10-26). But `POST` for that Monday → **201**, and `POST` for D1 at 03:00 → **201**. Expected: both 400.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-07`
- **Bug:** Monday BUG-09

### TP-08 — Unknown doctor (P2)

- **Result:** Fail
- **Actual:** `POST` with `doctorId 000000000000000000000000` → **201**.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-08`
- **Bug:** Monday BUG-08

### TP-09 — Missing fields / no session (P2)

- **Result:** Pass
- **Actual:** Missing date/timeSlot/reason → 400 "Missing fields: date, timeSlot, reason". No cookie → 401.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-09`

### TP-10 — Cancel own appointment (P1)

- **Result:** Pass
- **Actual:** As P1 on A02: Keep it → still `scheduled` (checked in the API). Yes, cancel → redirect to `/appointments`, API status `cancelled`, row badge `status-badge-cancelled`, row listed under the Cancelled filter. No success message (minor, Monday BUG-26).
- **Evidence:** `evidence/run-05-tp10-cancel-own.json`

### TP-11 — Cancel someone else's appointment (P1)

- **Result:** Pass
- **Actual:** As P1 on P5's A09: `GET` 404, `DELETE` 404. Control: P5 still reads A09 as `cancelled`, unchanged.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-11`

### TP-12 — Doctor can't book or cancel (P1)

- **Result:** Pass
- **Actual:** As the doctor: `/appointments/new` redirects to `/appointments`; `POST`, `PUT`, `DELETE` → 403 with clear messages.
- **Evidence:** `evidence/api-06-doctor-write-blocked.json` (captured the same morning, 07:59)

### TP-13 — Slot released after cancel (P2)

- **Result:** Pass
- **Actual:** A07 (P4) is `scheduled` on D1 2026-10-27 09:30, the slot A06 (P3) released by cancelling.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-13`

### TP-14 — Cancel is idempotent / read-only after cancel (P3)

- **Result:** Pass
- **Actual:** `DELETE` on the already-cancelled A04 → 200, still `cancelled`. Cancelled detail has no Edit/Cancel buttons (checked earlier, `ui-01`).
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-14`, `evidence/ui-01-form-and-dialog-checks.json`

### TP-15 — Edit can't move into an invalid slot (P2)

- **Result:** Fail
- **Actual:** As P3 on A05: `PUT` to 2026-09-01 (past) → **200**; `PUT` to A08's taken slot → **200**. A05 was put back to 2026-11-02 11:00 right after.
- **Evidence:** `evidence/run-01-api-scenarios.json` → `TP-15`
- **Bug:** Monday BUG-05

### TP-16 — Completed appointment can't be cancelled (P3)

- **Result:** Pass
- **Actual:** C01 detail shows `status-badge-completed` and no buttons. No request was sent.
- **Evidence:** `evidence/run-06-tp16-completed-readonly.json`

### TP-17 — Earlier today / inside the lead time is not bookable (P1, added after the rulings)

- **Result:** Fail
- **Actual (past hours):** Run at 15:17, after D1's shift (07:00–14:00). The slots endpoint still offers **all 15 of today's slots, every one already past**, and `POST` for today at 14:00 returns **201**.
- **Actual (lead time):** Run at 15:27 with D2 (Tuesday 09:00–16:00). The next slot, 15:30, was **3 minutes** away; it was offered and `POST` returned **201**. Expected: blocked (less than 15 minutes ahead).
- **Evidence:** `evidence/run-08-tp17-tp19-api.json` → `TP-17`, `evidence/run-11-tp17-lead-time.json`
- **Bug:** same defect as TP-04 (Monday BUG-04), now also for today's past hours.

### TP-18 — Visual confirmation after booking and cancelling (P2, added after the rulings)

- **Result:** Fail
- **Actual:** `toast-container` stayed empty after the TP-01 booking and after the TP-10 cancellation; no modal appeared.
- **Evidence:** `evidence/run-03-tp01-tp06-booking-and-display.json` (`toastAfterBooking`), `evidence/run-05-tp10-cancel-own.json` (`toast`)
- **Bug:** Monday BUG-26, confirmed as a UX bug by the mentor.

### TP-19 — Patient can't set doctor/system-only states (P1, added after the rulings)

- **Result:** Fail
- **Actual:** As P3 on A05, `PUT status: completed` → **200** (stored `completed`), `PUT status: approved` → **200** (stored `approved`). Expected 403/400. A05 was then set back to `scheduled` so the seeded data stays valid — note this used the same unprotected path.
- **Evidence:** `evidence/run-08-tp17-tp19-api.json` → `TP-19`
- **Bug:** Monday BUG-05; the mentor rates it a serious backend security/validation bug.

### TP-20 — Cancellation by someone else shows who and why (P3, added after the rulings)

- **Result:** Fail (suggestion)
- **Actual:** One of the 4 appointments cancelled on 2026-09-28 at 23:44 (Sep 29 09:00, Dr. Mitchell) shows only "Cancelled" — no one and no reason. The API record has no field for it either (`notes` is empty; there is no `cancelledBy` or `cancellationReason`). No notification reached the patient.
- **Evidence:** `evidence/run-09-tp20-cancelled-by-third-party.json`, `evidence/run-10-tp20-cancelled-detail.png`
- **Note:** this needs a data-model change (who cancelled and why), not only a UI change — flag it rather than mock it in tests.

## Cleanup

- The 8 extra appointments created by TP-02, TP-03, TP-04, TP-07 and TP-08 were cancelled at the end of the API run (`cleanup` in `run-01`: 8 × 200). The TP-01 booking was cancelled after TP-06.
- A05 was restored after TP-15.
- `--verify` after the run: **1 row changed — A02 is now cancelled**, which is expected because TP-10 cancels it ([`evidence/run-07-verify-after-run.txt`](evidence/run-07-verify-after-run.txt)). Re-seed before running TP-10 again.

## What the dry run changed in the plan

- TP-02 and TP-03 now have real two-patient evidence, so R-01/R-02 no longer rely on inference.
- TP-06 narrowed the timezone bug: the list and detail convert the stored clinic time as if it were UTC, so the shown time follows the browser's zone (London +1h, Tokyo +9h, Lima −5h and −1 day).
- The verify step caught the expected A02 change, which confirms it's worth running before each session in a shared environment.
