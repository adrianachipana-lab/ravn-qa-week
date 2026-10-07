# Formal Bug Reports

Author: Adriana Chipana · Track: Development · Day: Thursday

Two defects found on Monday and confirmed since, re-reproduced on 2026-10-01 with fresh evidence. Both are written so a developer who has never seen MedicApp can reproduce them without a follow-up question.

---

## BR-01 — A second patient can book a slot another patient already booked

- **Title:** Same doctor, date and time slot can be booked by two different patients; the slot stays "available" after the first booking
- **Summary:**
  - After patient A books Dr. Sarah Mitchell on 2026-11-24 at 15:30, the slots endpoint still reports 15:30 as available.
  - Patient B can then book the same slot and gets `201 Created`.
  - The doctor ends up with two scheduled appointments for one 30-minute slot.
- **Environment:** https://medapp-nerdery.vercel.app — shared training deployment, "Buggy mode ON" banner shown.
- **Device / Browser:** API calls from Node.js 20 (`fetch`). Same behaviour through the UI in Chromium (Playwright 1.63) on macOS — see Evidence.
- **Build / Version:** not exposed by the app (no version in the UI or API). Observed on the deployment live on 2026-10-01 at 14:25 UTC.
- **Role / Account:** two patient accounts. They are throwaway accounts created through `/api/auth/register` for testing; any two patient accounts reproduce it.
- **Severity:** Critical — two patients are confirmed for the same visit; one of them is turned away at the clinic.
- **Priority:** P1 — fix before release. It breaks the core rule of the booking feature, and it is the defect MEDIC-101 exists to fix (BR-MED101-01, SCEN-MED101-02).
- **Preconditions:**
  - Two different logged-in patients, A and B.
  - Dr. Sarah Mitchell (id `6aa85e2fb0083185ed54c887`, Mon–Fri 09:00–17:00, 30-minute slots).
  - A future working day where 15:30 has no appointment.
- **Steps to Reproduce:**
  1. `GET /api/doctors/6aa85e2fb0083185ed54c887/slots?date=2026-11-24` → note that 15:30 is `available: true`.
  2. As patient A: `POST /api/appointments` with `{ "doctorId": "6aa85e2fb0083185ed54c887", "date": "2026-11-24", "timeSlot": "15:30", "specialty": "General Practice", "reason": "Patient A" }`.
  3. Repeat step 1.
  4. As patient B: send the same `POST` with `"reason": "Patient B"`.
  5. *(UI variant)* As patient B: Book appointment → Dr. Sarah Mitchell → 24 Nov → 15:30 → reason → Review & book → Confirm booking.
- **Expected Result:**
  - Step 3 reports 15:30 as `available: false`.
  - In the UI the 15:30 slot is disabled and labelled "Unavailable" (SCEN-MED101-02).
  - Step 4 is rejected with `409 Conflict`, and no second appointment exists.
- **Actual Result:**
  - Step 2 → `201`, appointment `6abe6d70d7ea35df06f9bd98`, status `scheduled`.
  - Step 3 → 15:30 is still `available: true`.
  - Step 4 → `201`, appointment `6abe6d71d7ea35df06f9bd99`, status `scheduled`, for the same doctor, date and slot.
  - In the UI, the slot is enabled, carries `data-available="true"`, can be selected, and booking succeeds.
- **Evidence:**
  - `evidence/br-01-double-booking-repro.json` — requests, responses and slot availability before and after, captured 2026-10-01 14:25 UTC. Both appointments were cancelled afterwards.
  - `../../wednesday/adriana-chipana/evidence/run-1.txt` – `run-3.txt` — the SCEN-MED101-02 UI test fails three runs in a row on: slot not disabled, `data-available` `"true"`, no "Unavailable" label, form accepts the slot.
  - `../../tuesday/adriana-chipana/evidence/run-01-api-scenarios.json` → TP-02 (second patient books a taken slot → 201) and TP-03 (3 parallel requests for one slot → 201, 201, 201).
- **Impact:**
  - Every doctor's schedule can be overbooked, by accident (two patients viewing the same day) or through parallel requests.
  - The app gives no signal; both patients see "Scheduled".
  - The slots endpoint is the root cause: it never marks booked slots as taken, so the UI can't disable them either.
- **Workaround:** none for patients. The clinic would have to check each doctor's schedule for duplicates by hand.
- **Known Limitation:**
  - Reproduced on one doctor and through the API and Chromium only.
  - The parallel-request case (TP-03) was sent from one client, so it shows the absence of a conflict check rather than a measured race window.

---

## BR-02 — Appointment detail and list show a different date and time than the one booked, depending on the browser's time zone

- **Title:** Detail and list re-format the stored clinic time with the browser's time zone (Lima: shown 1 day and 5 hours early)
- **Summary:**
  - An appointment booked for 25 Nov 2026 at 10:00 is stored and server-rendered as 25 Nov 10:00. After the page loads in the browser, the detail and the list show:
    - **24 Nov 05:00 AM** in Lima;
    - **24 Nov 06:00 AM** in La Paz;
    - **25 Nov 11:00 AM** in Madrid.
  - The dashboard keeps showing 10:00. The time a patient sees depends on where their browser is, not on the clinic.
- **Environment:** https://medapp-nerdery.vercel.app — shared training deployment, "Buggy mode ON".
- **Device / Browser:** Chromium (Playwright 1.63) on macOS, with the browser time zone set to America/Lima, America/La_Paz and Europe/Madrid. On Monday the same shift was observed by another trainee in Safari.
- **Build / Version:** not exposed by the app. Observed on the deployment live on 2026-10-01 at 14:26 UTC.
- **Role / Account:** patient (throwaway test account). The doctor's schedule shows the same shift.
- **Severity:** Critical — a patient can go to the clinic at the wrong time or on the wrong day.
- **Priority:** P1 — fix before release. Confirmed by the mentor (2026-09-29): appointment times must always be shown in the clinic's local time.
- **Preconditions:** a logged-in patient; browser time zone America/Lima (or any zone other than the one the dates are stored against).
- **Steps to Reproduce:**
  1. Book Dr. Sarah Mitchell on 2026-11-25 at 10:00 (UI or `POST /api/appointments` with `"date": "2026-11-25", "timeSlot": "10:00"`).
  2. `GET /api/appointments/<id>` → `date: "2026-11-25T00:00:00.000Z"`, `timeSlot: "10:00"`.
  3. Open `/appointments/<id>` and wait for the page to finish loading.
  4. Open My appointments and find the same row.
  5. Open the dashboard and find the same appointment under "Next 3 appointments".
  6. Change the browser's time zone (e.g. DevTools → Sensors → Location) and repeat steps 3–4.
- **Expected Result:** detail, list and dashboard all show 25 Nov 2026, 10:00 (clinic time), in every browser time zone.
- **Actual Result:**
  - The server-rendered HTML of the detail shows "Nov 25, 2026 · 10:00 AM". After the page loads, it changes to "Nov 24, 2026 · 05:00 AM" (Lima), "Nov 24 · 06:00 AM" (La Paz) or "Nov 25 · 11:00 AM" (Madrid).
  - The list shows the same shifted values.
  - The dashboard shows 10:00.
  - The detail page logs React errors #418 / #425 (hydration text mismatch).
- **Evidence:**
  - `evidence/br-02-timezone-repro.json` — stored value, server-rendered HTML and the shown value per browser zone, captured 2026-10-01 14:26 UTC.
  - `evidence/br-02-detail-lima.png` — the detail page in Lima showing "Nov 24, 2026 · 05:00 AM".
  - `../../tuesday/adriana-chipana/evidence/run-03-tp01-tp06-booking-and-display.json`, `run-12-tp06-timezones.json` — the same shift on Tuesday, with London (+1 h), Tokyo (+9 h) and Lima (−5 h, −1 day).
- **Impact:**
  - Patients and doctors read different times for the same appointment, and the two screens patients use most (list and detail) are the ones that are wrong.
  - Combined with BR-01, a patient can't reliably see when they're booked.
  - Tests can't assert the displayed time on those screens.
- **Workaround:** use the dashboard's "Next 3 appointments" card, which shows the stored time — only for the next three.
- **Known Limitation:**
  - The cause is inferred from the evidence, not from the code: the server value and HTML are right, and the shift appears when the browser re-formats the date.
  - Not checked with a zone ahead of UTC by more than the stored offset (e.g. Asia/Tokyo for dates near midnight), beyond Tuesday's run.
