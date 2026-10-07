# Tuesday evidence — index

Captured on 2026-09-29 against https://medapp-nerdery.vercel.app (buggy mode ON), Chromium via Playwright, browser timezone UTC−5.

Accounts:
- **Patient** — own assigned account (credentials not stored)
- **Doctor** — own assigned account, Dr. Sarah Mitchell, General Practice
- **No session** — `curl` without a cookie
- **P1–P5** — throwaway patients created by the seed ([`../seed/`](../seed/))

## Capture log

Times are UTC−5 (UTC in the JSON files).

- **07:54** — Opened `/register` and `/api-docs` with no session; probed routes with `curl` (`/admin`, `/doctor`, `/settings` → 404).
- **07:55** — Logged in as patient. Dashboard: no `/api/*` call from the browser (server-rendered).
- **07:55** — Booking form: selecting a day calls `GET /api/doctors/{id}/slots?date=`.
- **07:56** — List page calls `GET /api/appointments?search=&status=all&sort=date&order=desc&page=1&limit=10`.
- **07:56** — Booked Dr. Mitchell 2026-10-14 10:00 through the UI → `POST 201`.
- **07:57** — Detail → Edit → Save → `PUT 200`. Cancel → Keep it (no request) → Cancel → Yes, cancel → `DELETE 200`; repeat `DELETE` → 200.
- **07:58** — Patient error paths via `fetch`: 400, 404, 500 cases.
- **07:58** — Unauthenticated checks via `curl`: 401 on the API, 307 on the pages.
- **07:59** — Profile. Logged in as doctor: dashboard, schedule; `/appointments/new` redirects; write calls → 403.
- **08:00** — Ran the seed: 5 patients, 10 appointments (see `../seed/seed-run-output.txt`).
- **08:01** — Read the completed references C01–C03 from the own patient account (read only).
- **08:04** — Form and dialog checks (`ui-01`).
- **08:08** — Retook the list screenshots after loading finished.
- **09:48** — `--verify` on the seeded data: all OK (entry check for the dry run).
- **09:50** — Dry run, API scenarios with P1/P2/P3/P4/P5 (`run-01`); 8 extra appointments cancelled at the end, A05 restored.
- **09:51** — Dry run, UI as P1: past days enabled (`run-02`), booking TP-01 and display check TP-06 (`run-03`, `run-04`).
- **09:52** — Dry run, TP-10 cancel A02 as P1 (`run-05`); TP-01 booking cancelled.
- **09:53** — Dry run, TP-16 on the completed reference C01 (`run-06`, read only).
- **09:54** — `--verify` after the run: A02 CHANGED as expected (`run-07`).
- **15:17** — After the mentor's rulings: TP-17 and TP-19 via API (`run-08`); TP-20 on a third-party-cancelled appointment, read only (`run-09`, `run-10`).
- **15:27** — TP-17 lead-time case with D2 inside her shift (`run-11`).
- **15:29** — TP-06 repeated with the browser zone set to London, Tokyo and Lima (`run-12`, `run-13`).

The flow-capture appointment (`6abbb57f4db95823cc3f3311`) ended cancelled; nothing else was written to the own accounts.

## Site map

**`sm-01-register.png`**
- Shows: `/register` with no session — name, email, password, confirm, terms checkbox.
- Proves: the page is public and has these fields. Also visible: the inputs have no labels or placeholders, so a user can't tell which field is which (accessibility note for the site map).
- Does not prove: any validation behaviour (the form was not submitted).

**`sm-02-patient-dashboard.png`**
- Shows: patient dashboard — stats and next appointments.
- Proves: the layout and the stat cards exist.
- Does not prove: that the numbers are correct (Monday BUG-07: they are system-wide).

**`sm-03-booking-form-slots.png`**
- Shows: booking form with Dr. Mitchell and Sep 30 selected, slot grid 09:00–17:00. Past weekdays (Sep 1–28) are not greyed out.
- Proves: the calendar → slot grid flow; the grid offers 17:00 although working hours end at 17:00 (Monday BUG-10); past days look selectable (Monday BUG-04).
- Does not prove: which slots are really free.

**`sm-04-patient-appointments-list.png`**
- Shows: patient list after loading — search, status filter, sortable Date and Specialty, pagination.
- Proves: the list controls exist for the patient.
- Does not prove: that sorting and filtering work (checked on Monday, not here).

**`sm-05-patient-profile.png`**
- Shows: profile form — name, read-only email, phone, avatar "not yet implemented".
- Proves: the profile fields and states.
- Does not prove: save behaviour.

**`sm-06-doctor-dashboard.png`**
- Shows: doctor dashboard — Today, Upcoming, Completed, Patients, next 5 appointments with patient names.
- Proves: the doctor view differs from the patient view on the same route.
- Does not prove: that the counts are correct.

**`sm-07-doctor-schedule.png`**
- Shows: doctor "My schedule" after loading — Patient column instead of Doctor, no New appointment button.
- Proves: the doctor gets a read-only list on `/appointments`.
- Does not prove: what the doctor's detail page shows (Monday BUG-12). Patient names in the schedule belong to other trainees' test bookings.

**`sm-08-list-loading-state.png`**
- Shows: list while loading ("Loading…", `appointments-loading`).
- Proves: the loading state exists.
- Does not prove: anything about how long it takes.

## Feature map — booking and cancellation

**`fm-01-booking-confirm-dialog.png`**
- Shows: confirmation dialog repeating doctor, specialty, date (2026-10-14), time (10:00) and reason.
- Proves: the review step exists and shows what will be booked.
- Does not prove: that the booked time is displayed the same afterwards.

**`fm-02-detail-scheduled.png`**
- Shows: detail of the appointment booked for 2026-10-14 10:00 (see `fm-01`), with Edit and Cancel appointment buttons. The page shows **Oct 13, 2026 · 05:00 AM**.
- Proves: the entry point for edit and cancel, and that the detail page still shifts date and time (Monday BUG-06) — reproduced today with a fresh booking.
- Does not prove: why (the stored value in `api-01` is correct).

**`fm-03-cancel-confirm-dialog.png`**
- Shows: "Cancel appointment?" dialog with Keep it / Yes, cancel.
- Proves: cancellation asks for confirmation.
- Does not prove: anything about the doctor side.

## API and UI checks (JSON)

**`api-01-book-post-appointment.json`**
- Shows: request and response of the UI booking — body `{doctorId, date, timeSlot, specialty, reason}` → 201, status `scheduled`.
- Proves: the UI books through `POST /api/appointments`, and the client sends `specialty` itself.
- Does not prove: what happens when the slot is taken.

**`api-02-edit-put-appointment.json`**
- Shows: edit save → `PUT /api/appointments/{id}` with `{date, timeSlot, reason}` → 200.
- Proves: the edit path and its payload.
- Does not prove: validation (Monday BUG-05).

**`api-03-cancel-delete-appointment.json`**
- Shows: `DELETE` → 200 with status `cancelled`; "Keep it" sent no request; second `DELETE` → 200.
- Proves: the cancel path, the Keep-it alternate path and idempotency.
- Does not prove: what the doctor sees afterwards.

**`api-04-error-paths-patient.json`**
- Shows, as patient:
  - Missing fields → 400.
  - Slots without a date → 400.
  - Slots on a weekend → `available:false`.
  - Another patient's appointment: GET and DELETE → 404.
  - Malformed id → 500.
  - Doctor directory schedules.
- Proves: which error paths already behave and which don't (the 500).
- Does not prove: behaviour for other patients' ids beyond the one tried.

**`api-05-unauthenticated.json`**
- Shows: no cookie — list, book and cancel → 401; `/appointments/new` and `/appointments/{id}` → 307 `/login`; doctor directory → 200 (public).
- Proves: session enforcement on these endpoints and pages.
- Does not prove: expired-session behaviour.

**`api-06-doctor-write-blocked.json`**
- Shows: logged in as doctor (session role shown) — `POST`, `PUT`, `DELETE` → 403 with messages; `/appointments/new` redirected to `/appointments`.
- Proves: the doctor role can't write, in the API and in the UI.
- Does not prove: an admin's behaviour.

**`ui-01-form-and-dialog-checks.json`**
- Shows:
  - A cancelled appointment has no buttons.
  - The slot booked by seed A01 is still clickable.
  - Empty or spaces-only reason keeps the button disabled.
  - `maxlength=500`, but a 520-character value set by script enables submit.
  - Dialog Cancel sends no request.
- Proves: the feature-map items that were still "Not verified" at the time of the check.
- Does not prove: behaviour in other browsers.

## Dry run (test-run.md)

**`run-01-api-scenarios.json`**
- Shows: every API request and response for TP-02, 03, 04, 05, 07, 08, 09, 11, 13, 14, 15, plus the cleanup list.
- Proves: which rules the server enforces today (auth, ownership, missing fields) and which it doesn't (conflicts, past dates, working hours, unknown doctor, edit validation), with two different patients.
- Does not prove: true simultaneity — the parallel requests come from one client.

**`run-02-tp04-past-days-enabled.png`**
- Shows: calendar for Dr. Thompson in September; past weekdays look active, weekends are greyed out.
- Proves: together with the DOM check in `test-run.md` (`disabled: false`), past days are selectable.
- Does not prove: anything about today's earlier slots.

**`run-03-tp01-tp06-booking-and-display.json`**
- Shows: one fresh booking (2026-10-21 07:00) as seen by the API, the dashboard, the server-rendered detail, the detail after loading and the list.
- Proves: the stored value and the server HTML are correct; the list and the loaded detail shift to Oct 20, 02:00 AM.
- Does not prove: behaviour in other browsers or timezones.

**`run-04-tp06-detail-after-hydration.png`**
- Shows: the detail page for that booking after it loads — Oct 20, 2026 · 02:00 AM.
- Proves: what the patient actually sees.
- Does not prove: the cause on its own (see `run-03`).

**`run-05-tp10-cancel-own.json`**
- Shows: Keep it leaves A02 scheduled; Yes, cancel → `/appointments`, API `cancelled`, `status-badge-cancelled`, row listed under the Cancelled filter, no toast.
- Proves: the cancel happy path and its alternate path.
- Does not prove: the doctor-side view.

**`run-06-tp16-completed-readonly.json`**
- Shows: completed reference C01 has `status-badge-completed` and no buttons.
- Proves: a completed appointment can't be edited or cancelled from the UI.
- Does not prove: the API rejects it (not sent, to keep the reference untouched).

**`run-07-verify-after-run.txt`**
- Shows: `--verify` output after the run — A02 CHANGED (cancelled by TP-10), the other 9 OK.
- Proves: the verify step detects drift.
- Does not prove: who changed a row.

**`run-08-tp17-tp19-api.json`**
- Shows: TP-17 — at 15:17 the slots endpoint offers all 15 of today's already-past slots for D1, and booking today 14:00 returns 201 (then cancelled). TP-19 — the patient sets `completed` and `approved` with 200; A05 restored to `scheduled`.
- Proves: past hours of today are bookable, and the backend doesn't restrict status changes by role.
- Does not prove: the lead-time (less than 15 min) case — it was run after the doctor's shift.

**`run-09-tp20-cancelled-by-third-party.json`**
- Shows: an appointment cancelled on 2026-09-28 at 23:44 by someone other than the patient; the API record's fields (no canceller or cancellation reason) and the detail text.
- Proves: neither the UI nor the data model records who cancelled or why.
- Does not prove: who actually cancelled it.

**`run-10-tp20-cancelled-detail.png`**
- Shows: the same cancelled appointment as the patient sees it — only the "Cancelled" badge.
- Proves: what the patient is told (nothing about the cause).
- Does not prove: whether a notification was sent through another channel.

**`run-11-tp17-lead-time.json`**
- Shows: at 15:27, D2's next slot (15:30) was 3 minutes away, still offered, and booking it returned 201 (then cancelled).
- Proves: there is no minimum lead time.
- Does not prove: behaviour at exactly 15 minutes ahead (the boundary value).

**`run-12-tp06-timezones.json`**
- Shows: the same appointment (stored 2026-10-20 07:00) on dashboard, list and detail with the browser zone set to London, Tokyo and Lima.
- Proves: the dashboard is stable; the list and detail convert the stored time as UTC into the browser's zone.
- Does not prove: behaviour in a non-Chromium engine.

**`run-13-tp06-detail-london.png`**
- Shows: the detail page for that appointment with the browser in London — Oct 20, 2026 · 08:00 AM.
- Proves: what a patient abroad would see.
- Does not prove: anything on its own about the other zones (see `run-12`).

## Seed run

**`../seed/seed-run-output.txt`**
- Shows: console output of the seed — 5 × register 201, 10 appointments with every step's status.
- Proves: the data set can be recreated through the API only.
- Does not prove: that it will work after the environment is re-seeded (doctor names are looked up at run time, ids are not hard-coded).

**`../seed/seed-output.json`**
- Shows: every created id, date, slot and final stored status.
- Proves: the ids used in the test data sheet.
- Does not prove: that the rows are unchanged later (shared environment).
