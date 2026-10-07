# Test Scenarios — Appointment Booking & Cancellation

Author: Adriana Chipana · Track: Development · Day: Wednesday

12 scenarios for the booking and cancellation flows: positive, negative, boundary and edge. They come from Tuesday's test plan (TP-xx), feature map (FM-xx) and data sheet (`../../tuesday/adriana-chipana/`). Expected results use the business rules the mentor confirmed on 2026-09-29.

**Automation candidate:**
- **yes** — automate today; passes on the current build, so it can run green 3 times in a row.
- **later** — worth automating, but fails today because of a known bug; it becomes a regression test once fixed.
- **no** — better kept manual.

**How these relate to the tests:** the two required UI tests follow the reference AC (MEDIC-101: SCEN-MED101-01 and -02), as the mentor asked — see `ac-gap-report.md`. SC-01 and SC-02 from this list are automated too, as extra tests in `tests/own-scenarios/`. They pass today and guard the booking and cancelling flows while the AC tests fail on known gaps.

---

## SC-01 — Patient books a free slot

- **Scenario ID:** SC-01
- **Title:** Patient books a free slot with a doctor
- **Type:** positive
- **Actor:** Patient (seeded P1–P5)
- **Preconditions:** Logged in as a patient; the chosen doctor has a working day at least a few weeks ahead with free slots.
- **Steps:**
  1. Open Book appointment.
  2. Choose a doctor.
  3. Move to a future month and pick one of the doctor's working days.
  4. Pick a time slot.
  5. Type a reason.
  6. Review & book → Confirm booking.
- **Expected Result:** Redirect to My appointments; a new row with that doctor and the status Scheduled; the API holds the appointment as `scheduled` with the chosen date and slot.
- **Risk Covered:** core happy path (baseline for R-01, R-03)
- **Automation Candidate:** yes
- **Source:** TP-01, FM-B01–FM-B08

```gherkin
Scenario: Patient books a free slot
  Given I am logged in as a patient
  And I am on the Book appointment page
  When I choose a doctor, a future working day and a free time slot
  And I enter a reason and confirm the booking
  Then I am taken to My appointments
  And the new appointment is listed as Scheduled with that doctor
```

## SC-02 — Patient cancels their own appointment

- **Scenario ID:** SC-02
- **Title:** Patient cancels one of their scheduled appointments
- **Type:** positive
- **Actor:** Patient (owner of the appointment)
- **Preconditions:** The patient owns a scheduled future appointment. The test should create it itself (see the guide) so it doesn't depend on seed data.
- **Steps:**
  1. Open the appointment's detail.
  2. Cancel appointment.
  3. Yes, cancel.
- **Expected Result:** Redirect to My appointments; the row shows Cancelled; the API holds status `cancelled`; the detail no longer offers Edit or Cancel.
- **Risk Covered:** core cancel path (baseline for R-06)
- **Automation Candidate:** yes
- **Source:** TP-10, FM-C01–FM-C05

```gherkin
Scenario: Patient cancels their own scheduled appointment
  Given I am logged in as a patient
  And I have a scheduled appointment in the future
  When I open the appointment and choose Cancel appointment
  And I confirm with "Yes, cancel"
  Then I am taken to My appointments
  And the appointment is listed as Cancelled
```

## SC-03 — "Keep it" leaves the appointment unchanged

- **Scenario ID:** SC-03
- **Title:** Closing the cancel dialog with "Keep it" does not cancel
- **Type:** positive (alternate path)
- **Actor:** Patient (owner)
- **Preconditions:** A scheduled future appointment owned by the patient.
- **Steps:**
  1. Open the detail.
  2. Cancel appointment.
  3. Keep it.
- **Expected Result:** Dialog closes; status stays Scheduled; no request is sent to the API.
- **Risk Covered:** accidental cancellation
- **Automation Candidate:** yes (good third test if time allows)
- **Source:** FM-C03

## SC-04 — A slot booked by one patient can't be booked by another

- **Scenario ID:** SC-04
- **Title:** Second patient can't book a slot that is already taken
- **Type:** negative
- **Actor:** Two patients (P4 owns the slot, P5 tries it)
- **Preconditions:** A scheduled appointment exists for a doctor, date and slot (seed A08).
- **Steps:**
  1. As P5, open Book appointment for the same doctor and day.
  2. Look at that slot.
  3. Try to book it.
- **Expected Result:** Slot shown as unavailable; if forced through the API, 409 "Slot already booked".
- **Risk Covered:** R-01 (25)
- **Automation Candidate:** later — fails today (slot shown free, booking 201)
- **Source:** TP-02

## SC-05 — Past dates and past hours can't be booked

- **Scenario ID:** SC-05
- **Title:** Days and hours that already passed are not selectable
- **Type:** negative
- **Actor:** Patient
- **Preconditions:** Logged in as a patient; a doctor with a working day earlier this week.
- **Steps:**
  1. Open Book appointment.
  2. Choose the doctor.
  3. Try to pick yesterday.
  4. Pick today and look at slots that already passed.
- **Expected Result:** Yesterday disabled; today's past slots not offered; API rejects both with 400.
- **Risk Covered:** R-05 (15)
- **Automation Candidate:** later — fails today
- **Source:** TP-04, TP-17

## SC-06 — Minimum lead time of 15 minutes

- **Scenario ID:** SC-06
- **Title:** A slot starting in less than 15 minutes is not bookable
- **Type:** edge
- **Actor:** Patient
- **Preconditions:** Run during a doctor's working hours, less than 15 minutes before one of their slots.
- **Steps:**
  1. Open today for that doctor.
  2. Look for the next slot.
  3. Try to book it.
- **Expected Result:** Slot not offered; API 400.
- **Risk Covered:** R-05
- **Automation Candidate:** later — fails today; also hard to automate because it depends on the clock (needs a fixed "now")
- **Source:** TP-17 (lead-time part)

## SC-07 — Last slot of the day fits the shift

- **Scenario ID:** SC-07
- **Title:** The last slot offered ends at or before the end of the shift
- **Type:** boundary
- **Actor:** Patient
- **Preconditions:** A doctor with known hours, e.g. Dr. Michael Thompson, 07:00–14:00, 30-minute slots.
- **Steps:**
  1. Open a working day for that doctor.
  2. Read the last slot in the grid.
- **Expected Result:** Last slot 13:30 (13:30 + 30 min = 14:00); 14:00 not offered.
- **Risk Covered:** R-10 (12)
- **Automation Candidate:** later — fails today (14:00 is offered)
- **Source:** TP-05

## SC-08 — Reason is required

- **Scenario ID:** SC-08
- **Title:** Review & book stays disabled with an empty or spaces-only reason
- **Type:** negative
- **Actor:** Patient
- **Preconditions:** Doctor, day and slot selected.
- **Steps:**
  1. Leave the reason empty.
  2. Then type only spaces.
- **Expected Result:** Review & book disabled in both cases.
- **Risk Covered:** R-09 (12)
- **Automation Candidate:** yes — passes today
- **Source:** FM-B05, IN-R

## SC-09 — Reason length limit (500 characters)

- **Scenario ID:** SC-09
- **Title:** 500 characters are accepted, 501 are not
- **Type:** boundary
- **Actor:** Patient
- **Preconditions:** Doctor, day and slot selected.
- **Steps:**
  1. Type exactly 500 characters.
  2. Then try 501.
- **Expected Result:** 500 → counter 500/500, can continue. 501 → the extra character is not accepted (counter stays 500/500); the API rejects more than 500 with 400.
- **Risk Covered:** R-09, R-12
- **Automation Candidate:** yes for the UI part (typing is capped by `maxlength`); later for the API part (600 characters return 500 today)
- **Source:** IN-R

## SC-10 — Doctor can't reach the booking form

- **Scenario ID:** SC-10
- **Title:** A doctor opening Book appointment is sent back to the schedule
- **Type:** negative
- **Actor:** Doctor
- **Preconditions:** Logged in as a doctor.
- **Steps:**
  1. Open `/appointments/new` directly.
- **Expected Result:** Redirected to `/appointments` (My schedule); no booking form shown.
- **Risk Covered:** R-04 (16)
- **Automation Candidate:** yes — passes today
- **Source:** TP-12, FM-B01

## SC-11 — A patient can't open another patient's appointment

- **Scenario ID:** SC-11
- **Title:** Another patient's appointment URL shows "not found"
- **Type:** negative (security)
- **Actor:** Patient P1, appointment owned by P5
- **Preconditions:** An appointment owned by another patient (seed A09).
- **Steps:**
  1. As P1, open `/appointments/<P5's appointment id>`.
- **Expected Result:** "Appointment not found"; no data of the other patient shown.
- **Risk Covered:** R-06 (15)
- **Automation Candidate:** yes — passes today
- **Source:** TP-11, FM-C01

## SC-12 — Booked time is shown the same everywhere

- **Scenario ID:** SC-12
- **Title:** Dashboard, list and detail show the booked clinic time
- **Type:** edge
- **Actor:** Patient
- **Preconditions:** A booked appointment; browser in any time zone.
- **Steps:**
  1. Book a slot at 07:00.
  2. Compare the dashboard card, the list row and the detail.
  3. Repeat with another browser time zone.
- **Expected Result:** 07:00 on every screen, whatever the browser's time zone.
- **Risk Covered:** R-03 (20)
- **Automation Candidate:** later — fails today (list/detail follow the browser's zone)
- **Source:** TP-06

---

## Coverage summary

- **Positive:** SC-01, SC-02, SC-03
- **Negative:** SC-04, SC-05, SC-08, SC-10, SC-11
- **Boundary:** SC-07, SC-09
- **Edge:** SC-06, SC-12
- **Automate today (pass now):** SC-01, SC-02, then SC-03, SC-08, SC-10, SC-11
- **Automate later (regression checks once fixed):** SC-04, SC-05, SC-06, SC-07, SC-12

## Why SC-01 and SC-02 are automated too

- **They are green today:** booking and cancelling are the core of the feature, and they work on the current build. That makes them the regression net while the AC tests fail by design.
- **They complement the AC tests:** SCEN-MED101-01 overlaps with SC-01 but also checks the AC's confirmation copy and slot release; SC-02 (cancel) has no AC test in today's pair.
- **They chain naturally:** SC-02 needs an appointment to cancel, which it creates through the API, so each test sets up and cleans up its own data.
