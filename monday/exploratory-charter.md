# Exploratory Charter & Session Report — MediBook

Author: Adriana Chipana · Track: Development · Day: Monday

## Charter

- **Charter:** Explore appointment booking, editing and cancellation with a patient and a doctor account, the browser UI and the REST API, to discover scheduling conflicts, date/time handling problems, role-permission gaps and data-integrity issues.
- **Time-box:** 90 minutes
- **Mission:** Find out whether a patient can end up with an appointment that is wrong (duplicated, in the past, at the wrong time, outside the doctor's hours, pointing to invalid data), and whether each role can only see and do what it should.
- **Roles covered (at least two):**
  - Patient — own assigned account
  - Doctor — own assigned account (Dr. Sarah Mitchell, General Practice)
- **Areas in scope:**
  - Login / logout, and access to protected pages and APIs without a session
  - Patient dashboard counts and "next appointments"
  - Booking flow: specialty filter, doctor list, calendar, time slots, confirmation
  - Appointment list: search, status filter, sorting, pagination
  - Appointment detail, edit and cancel
  - Doctor schedule and doctor read-only enforcement
  - Profile update
  - Registration validation
  - API behaviour behind each of the above (`/api/appointments`, `/api/doctors/{id}/slots`, `/api/profile`, `/api/auth/register`)
- **Areas out of scope:**
  - Admin role and bug-toggle settings
  - Database reset / test utility endpoints (write operations)
  - Writes on the shared practice accounts
  - Performance / load testing
  - Email or push notifications (no such feature visible)
  - Cross-browser and mobile layouts

## Session report

- **Session date:** 2026-09-28
- **Actual time (vs. 90-min time-box):** two blocks, approx. 14:35–14:50 and 18:50–19:05 (UTC−5), plus review of results in between
- **Roles used:** Patient (own account), Doctor (own account — Dr. Sarah Mitchell, General Practice), unauthenticated visitor
- **Environment / browser:** https://medapp-nerdery.vercel.app, buggy mode ON; Chromium driven through Playwright MCP; `curl` for unauthenticated API checks
- **Test data created:** 8 test appointments on the own patient account (all cancelled at the end), 3 throwaway registrations (cannot be deleted — no endpoint). Profile changes restored. No writes on shared accounts.

### Test notes

**Doctor role**
- Dashboard and "My schedule" load; schedule shows patients by full name, including other trainees. Some rows show the generic name "Patient" (shared practice account).
- Read-only is enforced by the API: booking, editing and cancelling return `403` with clear messages ("Doctor accounts cannot …").
- Opening an appointment from the schedule shows "Appointment not found" even though the API returns it (BUG-12).
- Times in the schedule are 5 hours earlier than the stored slot (BUG-06).

**Patient role — booking**
- Specialty filter is missing 4 specialties that have doctors (BUG-22).
- Calendar lets me pick past weekdays; the slot grid is the same for past dates; a past booking was created successfully (BUG-04).
- Slot grid always shows every slot as free, even when the doctor already has a scheduled appointment (BUG-03). Booking the same slot again succeeds (BUG-01), and three parallel requests for one slot all succeed (BUG-02).
- The last slot offered ends after the doctor's closing time, for both 30- and 45-minute doctors (BUG-10). API also accepts a Sunday 03:00 booking (BUG-09).
- API trusts the client for specialty (BUG-11) and accepts a doctor id that doesn't exist (BUG-08).
- No success message after confirming (BUG-26).

**Patient role — list, detail, edit, cancel**
- List, detail and dashboard disagree on date/time (−5h, sometimes −1 day) (BUG-06). Hydration errors in the console on the detail page.
- Status filter, literal search (special characters don't break it), sorting by date/specialty and pagination all worked: 43 rows across 5 pages, no duplicates or gaps, filter resets to page 1.
- Status badge colours are inverted (BUG-21).
- Edit uses a free date and time input with no restriction; saved a 2025 date at 02:17. API accepts invalid status values and lets the patient mark an appointment completed (BUG-05).
- Cancel asks for confirmation and works. Cancelling an already-cancelled appointment returns `200` (idempotent).
- Past appointments still show Edit/Cancel (BUG-27).
- Accessing, editing or cancelling another patient's appointment by id returns `404` — patient isolation held.

**Patient role — dashboard and profile**
- Dashboard totals match the whole system's appointment count, not the patient's (BUG-07).
- Profile accepts a blank name and a non-phone value (BUG-16).

**Unauthenticated / registration / login**
- Protected pages redirect to `/login`; appointment and profile APIs return `401`. The utility counts endpoint answers without a session (BUG-18).
- Login gives the same message for wrong password and unknown user (no account enumeration).
- Registration: duplicate email rejected regardless of case or spaces; `role` field ignored (no privilege escalation); short password rejected. Invalid email format and whitespace-only password accepted (BUG-15); blank name → `500` (BUG-13).

**Accessibility (spot checks)**
- Dashboard grey text ≈ 1.4:1 contrast (BUG-19); no visible focus ring when tabbing (BUG-20); "View" links 32×17 px (BUG-23); password input without accessible name (BUG-24); no `h1` on dashboard/list (BUG-25).

### Bugs found

27 raw notes — see [bug-notes.md](bug-notes.md). The highest-impact group is scheduling integrity: BUG-01, BUG-02, BUG-03, BUG-04, BUG-05, BUG-06, BUG-07 and BUG-08.

Pre-existing data in the account that points to the same problems (origin unknown, created 2026-09-14 to 09-18): 7 identical ENT bookings in one slot, an appointment with no doctor ("Ghost"), a 2 730-character reason, and specialty/reason mismatches.

### Issues / questions

- Which timezone is the source of truth for appointments (clinic, UTC, browser)? Needed to decide the expected result for BUG-06 and the "earlier today" boundary for past-date checks.
- Are notifications in scope? None are visible in the app, so notification-failure risk (R-08) could only be assessed from UI feedback.
- Should a doctor see patients' full names and emails for every appointment, or only what's needed for the visit?
- Should patients be able to change an appointment's status at all, other than cancelling?
- The public OpenAPI spec (`/api/openapi`) describes seeded defects in its field descriptions. I did not use it as a source for this session; flagged to raise with the mentor.

### Coverage estimate

| Area | Coverage |
|---|---|
| Booking (UI + API) | High |
| Edit / cancel | High |
| Appointment list (search, filter, sort, pagination) | Medium–High (own account only; large shared datasets not used) |
| Doctor role | Medium (schedule + write enforcement; no doctor-side workflows exist) |
| Dashboard | Medium |
| Registration / login | Medium (no rate-limit or session-expiry testing) |
| Profile | Low–Medium (avatar upload not implemented) |
| Accessibility | Low (automated spot checks on 3 pages, one keyboard check) |
| Notifications | Not covered (no feature visible) |
| Admin role | Not covered (out of scope) |

Overall: roughly 60–65% of the patient/doctor surface explored; scheduling rules and role permissions in depth, visual/accessibility and cross-browser only lightly.
