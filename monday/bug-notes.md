# Raw Bug Notes — MediBook

Author: Adriana Chipana · Track: Development · Day: Monday

Environment: https://medapp-nerdery.vercel.app (buggy mode ON), Chromium via Playwright, browser timezone UTC−5, 2026-09-28.
Evidence is in [`screenshots/`](screenshots/). API observations were made from the logged-in browser session (`fetch` against the same origin).
All test appointments created during the session were cancelled afterwards; the profile was restored to its original values.

Severity labels are a first guess for triage, not a final call.

## Index

| ID | Title | Role | Severity guess |
|---|---|---|---|
| BUG-01 | Same slot can be booked more than once | Patient | High |
| BUG-02 | Parallel bookings for one slot all succeed | Patient | High |
| BUG-03 | Slot picker never marks booked slots as taken | Patient | High |
| BUG-04 | Past dates can be booked from the calendar | Patient | High |
| BUG-05 | Edit accepts past dates, any time, invalid status | Patient | High |
| BUG-06 | Date/time shifted −5h (and −1 day) in list/detail | Both | High |
| BUG-07 | Patient dashboard shows system-wide totals | Patient | High |
| BUG-08 | Booking with a non-existent doctor succeeds | Patient | High |
| BUG-09 | Bookings accepted outside working days/hours | Patient | Medium |
| BUG-10 | Last slot offered ends after closing time | Patient | Medium |
| BUG-11 | Specialty taken from client, not from doctor | Patient | Medium |
| BUG-12 | Doctor can't open appointment detail | Doctor | Medium |
| BUG-13 | Invalid input returns 500 instead of 400 | Both | Medium |
| BUG-14 | Impossible date returns available slots | Patient | Medium |
| BUG-15 | Registration accepts invalid email / blank password | — | Medium |
| BUG-16 | Profile accepts blank name and invalid phone | Patient | Medium |
| BUG-17 | Reason over 500 characters exists in stored data | Patient | Medium |
| BUG-18 | Test utility endpoint readable without a session | — | Medium |
| BUG-19 | Very low text contrast on dashboard | Patient | Low |
| BUG-20 | No visible keyboard focus | Both | Low |
| BUG-21 | Status badge colours inverted | Both | Low |
| BUG-22 | Specialty filter missing 4 specialties | Patient | Low |
| BUG-23 | "View" links below minimum tap target | Both | Low |
| BUG-24 | Password field has no label or placeholder | — | Low |
| BUG-25 | Missing page heading hierarchy (no h1) | Both | Low |
| BUG-26 | No success message after booking | Patient | Low |
| BUG-27 | Past appointment still offers Edit / Cancel | Patient | Low |

---

## BUG-01

- **Title:** Same doctor / date / slot can be booked more than once
- **Role:** Patient
- **Area:** Booking (UI + `POST /api/appointments`)
- **What happened:** Booked Dr. Sarah Mitchell, 2026-09-21 17:00 through the UI, then posted the same doctor/date/slot again via API → `201 Created`. The account also already contained 7 appointments with Dr. Tomas Varga on 2026-09-24 09:00 and 2 with Dr. James Rodriguez on 2026-09-28 08:00 (created 20 s apart).
- **What I expected:** Second booking rejected with `409 Slot already booked`.
- **Evidence:** API responses (201 twice); duplicate rows visible in the appointment list.
- **Reproduction hint:** Book any free slot, then submit the same doctorId/date/timeSlot again.
- **Open question:** Is the check missing entirely, or only when the same patient books twice? Needs a second patient account to confirm cross-patient collision.

## BUG-02

- **Title:** Parallel bookings for the same slot all succeed
- **Role:** Patient
- **Area:** Booking API (race condition)
- **What happened:** Sent 3 `POST /api/appointments` in parallel for Dr. Mitchell, 2026-11-10 11:00 → all three returned `201`.
- **What I expected:** Exactly one `201`, others `409`.
- **Evidence:** Three appointment ids created for the same slot.
- **Reproduction hint:** `Promise.all` of three identical POSTs from a logged-in session.
- **Open question:** Once BUG-01 is fixed, does the fix hold under concurrency (DB-level constraint vs. read-then-write check)?

## BUG-03

- **Title:** Slot picker never marks booked slots as unavailable
- **Role:** Patient
- **Area:** `GET /api/doctors/{id}/slots`, booking time-slot grid
- **What happened:** For Dr. Mitchell on 2026-09-29, 09:00 is returned as `available: true` although a scheduled appointment exists at that time. Same for 2026-10-05 10:30. No slot was ever returned as unavailable in any check.
- **What I expected:** Booked slots returned with `available: false` and shown disabled in the UI.
- **Evidence:** Slots API response vs. appointment list for the same doctor/date.
- **Reproduction hint:** Pick a date where the doctor has a scheduled appointment and call the slots endpoint.
- **Open question:** Is this the root cause that lets the UI create BUG-01?

## BUG-04

- **Title:** Past dates are selectable and bookable in the calendar
- **Role:** Patient
- **Area:** Booking UI calendar
- **What happened:** In September 2026 (today = Sep 28), every past weekday (Sep 1–25) is clickable; only weekends are disabled. Selected Sep 21, slot 17:00, confirmed → appointment created with status Scheduled. Slots API also returns available slots for past dates.
- **What I expected:** Past days disabled; booking in the past rejected by the API.
- **Evidence:** `screenshots/booking-past-date-selectable.png`, `screenshots/booking-confirm-past-date-1700.png`
- **Reproduction hint:** Book appointment → choose a doctor → click any earlier day this month.
- **Open question:** What should happen for a slot earlier *today*?

## BUG-05

- **Title:** Edit accepts past dates, arbitrary times and invalid status values
- **Role:** Patient
- **Area:** Appointment edit (UI + `PUT /api/appointments/{id}`)
- **What happened:** Edit screen saved date 2025-01-05, time 02:17 (free time input, no slot grid). Via API, PUT accepted date 2020-01-01, timeSlot `99:99`, empty reason, `status: "approved"` (not a valid status) and `status: "completed"` set by the patient. All `200`.
- **What I expected:** Same validation as booking (future date, valid slot for that doctor, non-empty reason, status limited to allowed transitions for the role).
- **Evidence:** `screenshots/edit-form.png`; API responses and stored values read back.
- **Reproduction hint:** Open any own scheduled appointment → Edit → set a past date and any time → Save.
- **Open question:** Should patients be allowed to change status at all, other than cancelling?

## BUG-06

- **Title:** Appointment date/time shown shifted by −5h (sometimes −1 day)
- **Role:** Patient and Doctor
- **Area:** Appointment list, detail, doctor schedule
- **What happened:** Appointment stored as 2026-09-21 17:00 shows "Sep 20, 2026 · 12:00 PM" on the detail page. Stored 09:00 shows 04:00 AM in lists. The dashboard shows the stored time (09:00), so screens disagree with each other. Console shows React hydration errors #418 / #425 on the detail page.
- **What I expected:** The same wall-clock date and time on every screen, matching what was booked.
- **Evidence:** `screenshots/patient-detail-date-shift.png`, `screenshots/patient-list-status-colors-time-shift.png`, `screenshots/doctor-schedule-time-shift.png`; `screenshots/doctor-dashboard.png` shows the same doctor's dashboard listing the 2026-09-29 appointment at 09:00 (stored time) while the schedule lists it at 04:00 AM
- **Reproduction hint:** Book a slot, then compare dashboard, list and detail.
- **Open question:** Which timezone is the source of truth — clinic, server (UTC) or browser?

## BUG-07

- **Title:** Patient dashboard totals are system-wide, not per patient
- **Role:** Patient
- **Area:** Dashboard stats
- **What happened:** "Total appointments" showed 296, later 332. At that moment the system-wide appointment count was exactly 332, while the patient's own list had 43. "Upcoming (7 days)" and "Completed" also don't match the patient's own data (API: 2 upcoming, 5 completed at first check).
- **What I expected:** Counts computed only from the logged-in patient's appointments.
- **Evidence:** `screenshots/patient-dashboard-counts-296.png`, `screenshots/patient-dashboard-counts-332-no-focus-ring.png`
- **Reproduction hint:** Compare dashboard numbers with the pagination total on My appointments.
- **Open question:** Is any other per-user endpoint also unscoped?

## BUG-08

- **Title:** Booking with a non-existent doctor succeeds
- **Role:** Patient
- **Area:** `POST /api/appointments`
- **What happened:** POST with `doctorId: 000000000000000000000000` → `201`. The row appears in the list as "— / Unknown". A similar orphan ("Ghost", `doctorId: null`) already existed in the account.
- **What I expected:** `400` / `404` — doctor not found.
- **Evidence:** API response; orphan row in the list.
- **Reproduction hint:** POST a well-formed but unknown doctorId.
- **Open question:** —

## BUG-09

- **Title:** Bookings accepted outside the doctor's working days and hours
- **Role:** Patient
- **Area:** `POST /api/appointments`
- **What happened:** Dr. Mitchell works Mon–Fri 09:00–17:00. POST for Sunday 2026-10-18 at 03:00 → `201`.
- **What I expected:** Rejected — not a working day / not a valid slot.
- **Evidence:** API response; appointment visible in list.
- **Reproduction hint:** POST any weekend date or a time outside working hours.
- **Open question:** —

## BUG-10

- **Title:** Last slot offered ends after the doctor's closing time
- **Role:** Patient
- **Area:** Slot generation
- **What happened:** Dr. Mitchell (09:00–17:00, 30 min) offers 17:00. Dr. Emily Chen (10:00–18:00) offers 18:00. Dr. Hannah Kim (10:00–17:00, 45 min) offers 16:45 (ends 17:30). Dr. James Rodriguez (08:00–15:00, 45 min) offers 14:45 (ends 15:30).
- **What I expected:** Last slot must end at or before closing time.
- **Evidence:** `screenshots/booking-past-date-selectable.png` (17:00 slot visible); slots API responses.
- **Reproduction hint:** Choose any doctor and look at the last slot for a working day.
- **Open question:** —

## BUG-11

- **Title:** Appointment specialty comes from the client, not from the doctor
- **Role:** Patient
- **Area:** `POST /api/appointments`
- **What happened:** POST for Dr. Mitchell (General Practice) with `specialty: "Cardiology"` → stored and displayed as Cardiology.
- **What I expected:** Specialty derived from the doctor, or rejected when it doesn't match.
- **Evidence:** API response; list row "Dr. Sarah Mitchell | Cardiology".
- **Reproduction hint:** Include a different `specialty` in the booking body.
- **Open question:** Explains some mismatched rows in existing data (e.g. "Contact lens fitting" under Cardiology)?

## BUG-12

- **Title:** Doctor sees "Appointment not found" when opening an appointment
- **Role:** Doctor
- **Area:** Doctor schedule → View
- **What happened:** From My schedule, View on a 2026-09-29 appointment shows "Appointment not found." `GET /api/appointments/{id}` for the same id returns `200` with full data.
- **What I expected:** Appointment detail shown (read-only).
- **Evidence:** `screenshots/doctor-detail-not-found.png`
- **Reproduction hint:** Log in as doctor → Appointments → View on any row.
- **Open question:** Frontend role check or wrong data mapping?

## BUG-13

- **Title:** Invalid input returns 500 instead of a validation error
- **Role:** Patient / unauthenticated
- **Area:** Several APIs
- **What happened:** `500` for: booking with a 600-character reason; `GET /api/appointments/abc`; `GET /api/doctors/abc/slots`; slots with `date=2026-13-01` or `date=abc`; registration with a blank name.
- **What I expected:** `400` with a clear message.
- **Evidence:** API status codes.
- **Reproduction hint:** Send any of the inputs above.
- **Open question:** —

## BUG-14

- **Title:** Impossible date returns available slots
- **Role:** Patient
- **Area:** `GET /api/doctors/{id}/slots`
- **What happened:** `date=2026-02-30` → `200`, 17 slots available.
- **What I expected:** `400` invalid date.
- **Evidence:** API response.
- **Reproduction hint:** Call the slots endpoint with Feb 30.
- **Open question:** Could such a date be booked via POST?

## BUG-15

- **Title:** Registration accepts an invalid email and a whitespace-only password
- **Role:** Unauthenticated
- **Area:** `POST /api/auth/register`
- **What happened:** Email without "@" → `201` (account created). Password of 8 spaces → `201`. Registering with the literal `not-an-email` returned 409 "already registered", suggesting others hit this too.
- **What I expected:** `400` for invalid email format and blank password.
- **Evidence:** API responses (3 throwaway accounts created; they can't be deleted — no endpoint).
- **Reproduction hint:** Register with `email: "abc"` or `password: "        "`.
- **Open question:** Does the UI form validate these, or only the browser's `type=email`?

## BUG-16

- **Title:** Profile accepts a blank name and an invalid phone
- **Role:** Patient
- **Area:** `PUT /api/profile`
- **What happened:** `name: "   "` → `200`, name saved empty. `phone: "abc<script>"` → `200`, saved as-is. (Restored afterwards.)
- **What I expected:** `400` for blank name and non-phone values.
- **Evidence:** API responses and profile read back.
- **Reproduction hint:** PUT the values above.
- **Open question:** Is the stored phone rendered unescaped anywhere?

## BUG-17

- **Title:** Stored reason exceeds the 500-character limit
- **Role:** Patient
- **Area:** Data integrity
- **What happened:** An existing appointment in the account has a 2 730-character reason, although the form counter shows /500 and POST with 600 characters fails.
- **What I expected:** No stored reason over 500 characters.
- **Evidence:** API list data.
- **Reproduction hint:** Try the edit flow (PUT) with >500 characters — likely path.
- **Open question:** Which path let it through: edit, an older version, or seeding?

## BUG-18

- **Title:** Test utility endpoint readable without a session
- **Role:** Unauthenticated
- **Area:** `GET /api/test/reset`
- **What happened:** Without logging in, returns total users, doctors and appointments.
- **What I expected:** `401` / disabled outside test environments.
- **Evidence:** `curl` response `200`.
- **Reproduction hint:** Open the endpoint in a private window.
- **Open question:** Is this intentional for the training environment?

## BUG-19

- **Title:** Very low text contrast on the dashboard
- **Role:** Patient
- **Area:** Dashboard
- **What happened:** Subtitle, card labels and next-appointment meta text use `rgb(209,213,219)` on white: contrast ≈ 1.41–1.47:1. Green completed count ≈ 3.30:1.
- **What I expected:** ≥ 4.5:1 for normal text.
- **Evidence:** `screenshots/patient-dashboard-counts-296.png`
- **Reproduction hint:** Open the dashboard; measure with any contrast checker.
- **Open question:** —

## BUG-20

- **Title:** No visible keyboard focus indicator
- **Role:** Both
- **Area:** Navbar and dashboard
- **What happened:** Pressing Tab moves focus (element matches `:focus-visible`) but computed outline is `none` and there is no box-shadow — nothing visible.
- **What I expected:** A visible focus ring on every interactive element.
- **Evidence:** `screenshots/patient-dashboard-counts-332-no-focus-ring.png` (taken after two Tab presses)
- **Reproduction hint:** Load dashboard, press Tab.
- **Open question:** —

## BUG-21

- **Title:** Status badge colours inverted
- **Role:** Both
- **Area:** Appointment list
- **What happened:** "Cancelled" shown in green, "Completed" in red.
- **What I expected:** Colours that match the meaning (e.g. completed = green / neutral, cancelled = red / grey).
- **Evidence:** `screenshots/patient-list-status-colors-time-shift.png`
- **Reproduction hint:** Filter the list by Cancelled / Completed.
- **Open question:** —

## BUG-22

- **Title:** Booking specialty filter is missing 4 specialties
- **Role:** Patient
- **Area:** Booking form
- **What happened:** Filter lists 6 specialties; doctors exist for Endocrinology, Psychiatry, Ophthalmology and ENT, which are not in the filter.
- **What I expected:** Filter built from the doctors' actual specialties.
- **Evidence:** `screenshots/booking-form-specialty-filter.png`
- **Reproduction hint:** Open the specialty dropdown and compare with the doctor dropdown.
- **Open question:** —

## BUG-23

- **Title:** "View" links below minimum tap target size
- **Role:** Both
- **Area:** Appointment list
- **What happened:** "View" links measure 32×17 px.
- **What I expected:** ≥ 44×44 px target.
- **Evidence:** Measured bounding boxes.
- **Reproduction hint:** Inspect a View link.
- **Open question:** —

## BUG-24

- **Title:** Login password field has no label or placeholder
- **Role:** Unauthenticated
- **Area:** Login
- **What happened:** Email field has a placeholder; password field has no label, aria-label or placeholder.
- **What I expected:** An accessible name for every input.
- **Evidence:** Accessibility snapshot of `/login`.
- **Reproduction hint:** Inspect the password input.
- **Open question:** —

## BUG-25

- **Title:** Missing page heading hierarchy
- **Role:** Both
- **Area:** Dashboard, appointment list
- **What happened:** Dashboard uses only `h3` elements; the appointment list has no `h1`.
- **What I expected:** One `h1` per page and a logical heading order.
- **Evidence:** DOM inspection.
- **Reproduction hint:** List headings with a screen reader or devtools.
- **Open question:** —

## BUG-26

- **Title:** No success feedback after booking
- **Role:** Patient
- **Area:** Booking confirmation
- **What happened:** After "Confirm booking" the app redirects to the list with no message.
- **What I expected:** Confirmation message announced to the user.
- **Evidence:** Observed during booking.
- **Reproduction hint:** Book any appointment.
- **Open question:** Related to notification risk R-08.

## BUG-27

- **Title:** Past appointment still offers Edit and Cancel
- **Role:** Patient
- **Area:** Appointment detail
- **What happened:** Appointment dated 2026-09-21 (past) shows Edit and Cancel appointment buttons.
- **What I expected:** Past appointments read-only.
- **Evidence:** `screenshots/patient-detail-date-shift.png`
- **Reproduction hint:** Open any past scheduled appointment.
- **Open question:** —
