# Risk Register — MediBook

Author: Adriana Chipana · Track: Development · Day: Monday

Scoring: Probability (1–5) × Impact (1–5) = Risk Score (1–25). Probability is informed by what the exploratory session observed (see [exploratory-charter.md](exploratory-charter.md) and [bug-notes.md](bug-notes.md)); impact is judged from the user's point of view.

## Coverage of required risk areas

| Area | Risks |
|---|---|
| Double-booking | R-01 |
| Race conditions | R-02 |
| Timezone issues | R-03 |
| Past-date scheduling | R-05 |
| Permission leaks | R-04, R-06 |
| Notification failures | R-08 |
| Data integrity | R-07, R-09, R-10 |

## Summary

| ID | Risk | P | I | Score |
|---|---|---|---|---|
| R-01 | Same slot booked twice | 5 | 5 | 25 |
| R-02 | Concurrent bookings all succeed | 4 | 5 | 20 |
| R-03 | Date/time shown differently across screens (timezone) | 5 | 4 | 20 |
| R-04 | Role can perform disallowed state changes | 4 | 4 | 16 |
| R-05 | Booking / rescheduling into the past | 5 | 3 | 15 |
| R-06 | User reads other users' or system-wide data | 3 | 5 | 15 |
| R-07 | Appointments reference non-existent doctors | 3 | 4 | 12 |
| R-08 | No notification of booking changes | 4 | 3 | 12 |
| R-09 | Server trusts unvalidated / client-supplied fields | 4 | 3 | 12 |
| R-10 | Bookings outside working hours / slot grid | 4 | 3 | 12 |
| R-11 | Accounts created with invalid email / weak password | 4 | 3 | 12 |
| R-12 | Invalid input causes 500 instead of validation errors | 4 | 2 | 8 |

## R-01

- **Risk ID:** R-01
- **Description:** Two patients can book the same doctor, date and time slot because the booking flow does not check whether the slot is already taken.
- **Affected Roles:** Patient (both bookers), Doctor (overbooked schedule)
- **Probability (1-5):** 5
- **Impact (1-5):** 5
- **Risk Score (P x I):** 25
- **Mitigation:** Server-side uniqueness check on doctor + date + timeSlot for active appointments; the slots endpoint must mark booked slots as unavailable.
- **Testing Approach:** Book a slot, then book the same slot again (UI and API). Expect 409 on the second attempt and the slot shown as unavailable in the picker.
- **Known Limitation:** Tested with one patient account; cross-patient collision inferred from the doctor's schedule data, not reproduced with two live accounts.

## R-02

- **Risk ID:** R-02
- **Description:** Concurrent booking requests for the same slot all succeed (race condition), even if a sequential conflict check is added later.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 5
- **Risk Score (P x I):** 20
- **Mitigation:** Enforce uniqueness at the database level (unique index or transaction), not only in application code.
- **Testing Approach:** Fire 3+ parallel `POST /api/appointments` for the same slot; expect exactly one 201 and the rest 409.
- **Known Limitation:** Parallel requests sent from one browser only; not load-tested.

## R-03

- **Risk ID:** R-03
- **Description:** Appointment date and time are shown differently on different screens because of timezone conversion (list and detail shift by −5h and sometimes −1 day; the dashboard shows the stored time).
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 5
- **Impact (1-5):** 4
- **Risk Score (P x I):** 20
- **Mitigation:** Define a clinic timezone explicitly and render date + timeSlot as clinic-local wall time consistently on server and client.
- **Testing Approach:** Book a known slot and compare dashboard, list, detail and the doctor's schedule. Repeat with a slot near midnight and with the browser set to another timezone.
- **Known Limitation:** Tested from one timezone (UTC−5) only.

## R-04

- **Risk ID:** R-04
- **Description:** Users can perform state changes their role should not allow — e.g. a patient marking their own appointment "completed" or setting a status outside the defined set.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 4
- **Risk Score (P x I):** 16
- **Mitigation:** Server-side allow-list of state transitions per role; validate status against the enum.
- **Testing Approach:** For each role, attempt each transition (scheduled → completed, → cancelled, → unknown value) via API. Confirm doctor write attempts return 403.
- **Known Limitation:** Doctor read-only behaviour confirmed; admin role and any doctor-side "complete" flow not covered.

## R-05

- **Risk ID:** R-05
- **Description:** Patients can book or reschedule appointments to dates and times in the past.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 5
- **Impact (1-5):** 3
- **Risk Score (P x I):** 15
- **Mitigation:** Disable past days in the calendar and in the edit date input; reject past date/time on POST and PUT.
- **Testing Approach:** Try booking yesterday and a slot earlier today; try editing an existing appointment to a past date (UI and API).
- **Known Limitation:** The "earlier today" boundary depends on which timezone the server uses — see R-03.

## R-06

- **Risk ID:** R-06
- **Description:** A user can read data belonging to other users or to the whole system (other patients' appointments, system-wide totals).
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 3
- **Impact (1-5):** 5
- **Risk Score (P x I):** 15
- **Mitigation:** Scope every query by the session user; compute dashboard stats per user; disable unauthenticated utility endpoints in production.
- **Testing Approach:** As patient A, request patient B's appointment by id (GET/PUT/DELETE). Compare dashboard counts with the user's own list. Call APIs without a session.
- **Known Limitation:** Object-level access held (404) in my tests; the observed leak was aggregate counts. Admin role not tested.

## R-07

- **Risk ID:** R-07
- **Description:** Appointments can reference a doctor that does not exist, leaving orphaned records ("— / Unknown") in lists.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 3
- **Impact (1-5):** 4
- **Risk Score (P x I):** 12
- **Mitigation:** Validate that doctorId exists on create; handle deleted doctors explicitly.
- **Testing Approach:** POST with a well-formed but non-existent doctorId; expect 400/404, not 201.
- **Known Limitation:** No doctor-deletion flow available to test.

## R-08

- **Risk ID:** R-08
- **Description:** Patients and doctors are not notified when an appointment is booked, changed or cancelled, so they miss appointments or show up to cancelled ones.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 3
- **Risk Score (P x I):** 12
- **Mitigation:** Clear in-app confirmation after each action; email/notification to both parties on booking, reschedule and cancellation.
- **Testing Approach:** Book, edit and cancel; check for success feedback in the UI and for any notification reaching patient and doctor.
- **Known Limitation:** No notification feature is visible in the app; not confirmed whether it is out of scope or missing.

## R-09

- **Risk ID:** R-09
- **Description:** Stored data becomes inconsistent because the server trusts client-supplied or unvalidated fields (specialty different from the doctor's, reason over the 500-character limit, malformed time slots).
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 3
- **Risk Score (P x I):** 12
- **Mitigation:** Derive specialty from the doctor on the server; validate reason length and timeSlot format on POST and PUT.
- **Testing Approach:** POST/PUT with a mismatched specialty, a 501+ character reason and `99:99` as time slot; expect 400.
- **Known Limitation:** Some inconsistent data already existed in the account before testing; its origin is unknown.

## R-10

- **Risk ID:** R-10
- **Description:** Appointments can be booked outside the doctor's working days/hours or off the slot grid (the last slot offered ends after closing time).
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 3
- **Risk Score (P x I):** 12
- **Mitigation:** Generate slots so that start + duration ≤ end of working hours; reject bookings not in the generated slot list.
- **Testing Approach:** For doctors with 30- and 45-minute slots, check the last slot offered; POST a Sunday or 03:00 booking.
- **Known Limitation:** Holidays and doctor time off are not modelled in the app.

## R-11

- **Risk ID:** R-11
- **Description:** Accounts are created with invalid emails or weak passwords, so users can't be contacted and accounts are easy to compromise.
- **Affected Roles:** Patient (new registrations)
- **Probability (1-5):** 4
- **Impact (1-5):** 3
- **Risk Score (P x I):** 12
- **Mitigation:** Server-side email format validation; reject whitespace-only passwords; require a non-blank name.
- **Testing Approach:** Register with no "@" in the email, 8 spaces as password, a blank name, and a duplicate email in different case.
- **Known Limitation:** No email verification flow exists to test.

## R-12

- **Risk ID:** R-12
- **Description:** Invalid input causes server errors (500) instead of clear validation messages, so users can't recover and real failures are harder to spot in monitoring.
- **Affected Roles:** Patient, Doctor
- **Probability (1-5):** 4
- **Impact (1-5):** 2
- **Risk Score (P x I):** 8
- **Mitigation:** Validate ids, dates and strings before querying; map validation failures to 400.
- **Testing Approach:** Send malformed ids, impossible dates (2026-02-30, 2026-13-01), over-limit strings and blank names.
- **Known Limitation:** Only API responses checked; UI error display not verified for each case.

## Stretch (optional)

- **Risk that needs an automated regression check:** R-01 / R-02 (double-booking and concurrent booking).
- **Why:** Highest score, easy to reintroduce with any change to the booking code, and cheap to automate as an API test: book a slot, book it again, then fire parallel requests and assert exactly one 201.
