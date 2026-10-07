# Test Plan — Appointment Booking & Cancellation

Author: Adriana Chipana · Track: Development · Day: Tuesday · Version 1.0 (2026-09-29)

Related: [site-map.md](site-map.md) · [feature-map.md](feature-map.md) · [test-data-sheet.md](test-data-sheet.md) · Monday risk register (`../../monday/adriana-chipana/risk-register.md`)

## Plan

- **Feature / Area:** Patient booking (`/appointments/new`, `POST /api/appointments`, `GET /api/doctors/{id}/slots`) and cancellation (`/appointments/{id}`, `DELETE /api/appointments/{id}`), including the list/detail/dashboard views that show the result and the doctor role's read-only access.
- **Objective:** Decide whether a patient can reliably book a valid slot and cancel it, with the result shown consistently everywhere, and whether the system prevents invalid bookings (double-booked, past, outside hours, unknown doctor) and unauthorised writes. Output: a pass/fail per scenario with evidence, and a go / no-go note for these two flows.
- **In Scope:**
  - Booking UI: specialty filter, doctor choice, calendar, slot grid, reason, confirmation dialog.
  - Booking API: success, validation, conflict, auth, role.
  - Cancellation UI (dialog, Keep it / Yes, cancel) and API (owner, other patient, doctor, no session, idempotency).
  - Result views: list, detail, dashboard "next 3", doctor schedule.
  - Slot availability after booking and after cancellation.
  - Edit, only where it can move an appointment into an invalid slot.
- **Out of Scope:**
  - Registration and profile (used only for setup).
  - Admin role and bug-toggle settings.
  - Search / sort / pagination beyond checking that the booked row appears.
  - Notifications (no feature exists).
  - Performance / load.
  - Mobile layout and cross-browser runs beyond one extra browser for the time-display check.
  - Accessibility (tracked separately from Monday's notes).
- **Business rules (confirmed by the mentor, 2026-09-29):**
  - **Time zone:** date and time are always shown in the clinic's local time. If they are stored in UTC, every screen converts them to the clinic's zone.
  - **No past bookings:** booking is blocked for any time that has already passed. That includes today at an hour that's gone, and anything less than a minimum lead time (e.g. 15 minutes) ahead. Enforced in the UI and validated in the backend.
  - **Slot must fit the shift:** start + duration ≤ end of shift. With a 17:00 end and 30-minute slots, the last bookable slot is 16:30.
  - **Patient transitions:** a patient may only cancel (or reschedule). `completed` and `approved` belong to the doctor, clinic or system. The backend must answer 403 or 400 when a patient token tries them.
  - **Feedback:** every booking and cancellation shows visual confirmation (toast or modal), so users don't click again and create duplicates.
  - **Doctor view:** seeing the patient's full name is expected. The API returning the patient's email to the doctor is over-fetching — a privacy observation, not a UI bug.
  - **Cancelled by someone else:** a clinic, admin or automated process may cancel appointments. Expected, but the app should say who cancelled and why, and notify the patient.
- **Assumptions (not yet confirmed):**
  - A **scheduled** appointment blocks its doctor + date + slot for everyone until cancelled.
  - Doctors are read-only in this build (matches what the API enforces today).
- **Dependencies:**
  - Environment https://medapp-nerdery.vercel.app is up and in the agreed bug mode.
  - `GET /api/doctors` returns D1–D3 with their schedules.
  - The seed script can register accounts (open registration).
  - The own doctor account is available for the role checks.
- **Entry Criteria:**
  - `SEED_PASSWORD=… node seed-test-data.mjs --verify seed-output.json` (from `seed/`) reports all seeded rows as expected (the environment is shared and changed overnight once).
  - Seed run completed with 10 appointments in the expected states (`seed-run-output.txt` shows every step 2xx).
  - Doctor and patient logins work.
  - Feature-map items marked "Not verified" reviewed (only FM-C07 is left).
- **Exit Criteria:**
  - Every P1 scenario executed with evidence (screenshot or API response + one-line interpretation).
  - Every failure logged as a bug note with repro and linked to a risk.
  - Seeded appointments cleaned up (`--cleanup`) or kept on purpose for Wednesday and noted.
  - Go / no-go written: **no-go** if any of TP-01, TP-02, TP-04, TP-06 or TP-11 fails.
- **Tools Needed:**
  - Chromium + one other browser (Safari or Firefox); DevTools Network and Sensors (timezone). The first run used Chromium with three time zones because no second engine was installed.
  - Node.js 20 for the seed; `curl` or DevTools `fetch` for the API cases.
  - Playwright (from Wednesday) for the automation candidates.
- **Resources Needed:**
  - One tester, ~2 hours for manual execution.
  - The own patient and doctor accounts; 5 seeded patients.
  - Product answers to the open questions below.
- **Environments:**
  - Shared Vercel deployment — production-like, with seeded defects on.
  - Browser timezone UTC−5 by default; one run with the timezone changed.
  - Shared data: don't write to the shared practice accounts, and don't book with doctors assigned to other trainees.
- **Risks:** from Monday's register — R-01 double-booking (25), R-02 race condition (20), R-03 timezone display (20), R-04 disallowed state changes (16), R-05 past-date booking (15), R-06 cross-user data (15), R-07 orphan doctor (12), R-10 outside working hours (12). Plan risk: the shared environment can change under the test (Monday: 4 appointments on the own account changed status overnight without a known cause).
- **Test Data:** [test-data-sheet.md](test-data-sheet.md) — P1–P5, D1–D3, A01–A10 (seeded), C01–C03 (read-only completed references), PX/DR own accounts.
- **Coverage Approach:** risk-based. P1 scenarios cover the top risks through **both UI and API**: the UI shows what a patient experiences, and the API proves the server enforces the rule even if the UI is bypassed. Each scenario maps to a feature-map row (FM-xx) so gaps are visible. Automation candidates are marked for Wednesday (UI) and Thursday (API).
- **Known Limitations:**
  - No written acceptance criteria; expected results come from the confirmed business rules and the assumptions above.
  - `completed` state can only be checked with pre-seeded rows.
  - True concurrency is approximated with parallel requests from one client.
  - The shared environment is not reset between runs.
  - Still open: the exact minimum lead time (15 minutes was given as an example) and the clinic's time zone value for this environment.

## Scenarios

Priority: **P1** = must pass for go · **P2** = should pass · **P3** = nice to have. Automation: **UI** (Wednesday) · **API** (Thursday) · **manual**.

#### TP-01 — Book a free slot

- **Type:** positive
- **Priority:** P1
- **Risk:** —
- **Feature map:** FM-B01–B08
- **Data:** P1, D1
- **Steps:** Book D1, free weekday, first slot, reason → Confirm
- **Expected:** 201; row in list, detail and dashboard with the same date/time
- **Automation:** UI

#### TP-02 — Book an already-booked slot

- **Type:** negative
- **Priority:** P1
- **Risk:** R-01
- **Feature map:** FM-B04, B07
- **Data:** P5, A08
- **Steps:** As P5, open D3 2026-11-03: 09:00 shown taken; POST same slot
- **Expected:** Slot disabled in UI; API 409
- **Automation:** UI + API

#### TP-03 — Parallel bookings for one free slot

- **Type:** negative
- **Priority:** P1
- **Risk:** R-02
- **Feature map:** FM-B07
- **Data:** P4, P5, D1
- **Steps:** 3 parallel POSTs, same doctor/date/slot
- **Expected:** Exactly one 201, others 409
- **Automation:** API

#### TP-04 — Past date is not bookable

- **Type:** negative
- **Priority:** P1
- **Risk:** R-05
- **Feature map:** FM-B03, B07
- **Data:** P1, D1
- **Steps:** UI: click yesterday · API: POST yesterday
- **Expected:** Day disabled; API 400
- **Automation:** UI + API

#### TP-05 — Last valid slot vs closing time

- **Type:** boundary
- **Priority:** P2
- **Risk:** R-10
- **Feature map:** FM-B04
- **Data:** A03, D1
- **Steps:** Open D1 on a weekday; read last slot
- **Expected:** Last slot 13:30 (13:30 + 30 min = 14:00, end of shift); 14:00 not offered
- **Automation:** API

#### TP-06 — Booked time shown consistently

- **Type:** positive
- **Priority:** P1
- **Risk:** R-03
- **Feature map:** FM-B08
- **Data:** A01, DR
- **Steps:** Compare A01 on dashboard, list, detail; repeat in a second browser and with timezone changed
- **Expected:** Same date and 07:00 everywhere, in the clinic's local time
- **Automation:** UI

#### TP-07 — Non-working day and outside hours

- **Type:** negative
- **Priority:** P2
- **Risk:** R-10
- **Feature map:** FM-B03, B04
- **Data:** D3
- **Steps:** UI: Monday disabled for D3 · API: POST D3 on a Monday, and at 03:00
- **Expected:** Disabled; API 400
- **Automation:** API

#### TP-08 — Unknown doctor

- **Type:** negative
- **Priority:** P2
- **Risk:** R-07
- **Feature map:** FM-B07
- **Data:** P1
- **Steps:** POST with a well-formed unknown doctorId
- **Expected:** 404/400, nothing created
- **Automation:** API

#### TP-09 — Missing fields / no session

- **Type:** negative
- **Priority:** P2
- **Risk:** —
- **Feature map:** FM-B07
- **Data:** P1
- **Steps:** POST without date/timeSlot/reason; POST with no cookie
- **Expected:** 400; 401
- **Automation:** API

#### TP-10 — Cancel own appointment

- **Type:** positive
- **Priority:** P1
- **Risk:** —
- **Feature map:** FM-C02–C05
- **Data:** P1, A02
- **Steps:** Detail → Cancel → Keep it (no request) → Cancel → Yes, cancel
- **Expected:** Keep it: unchanged · Yes: 200, Cancelled in list and filter, and a visible confirmation (toast or modal)
- **Automation:** UI

#### TP-11 — Cancel someone else's appointment

- **Type:** negative
- **Priority:** P1
- **Risk:** R-06
- **Feature map:** FM-C04
- **Data:** P1, A09
- **Steps:** As P1, `DELETE` and open A09's URL
- **Expected:** 404 / "not found"; A09 unchanged
- **Automation:** API

#### TP-12 — Doctor can't book or cancel

- **Type:** negative
- **Priority:** P1
- **Risk:** R-04
- **Feature map:** FM-B01, C04
- **Data:** DR, A01
- **Steps:** As doctor: open `/appointments/new`; POST, PUT, DELETE
- **Expected:** Redirect to list; 403 × 3
- **Automation:** API

#### TP-13 — Slot released after cancel

- **Type:** positive
- **Priority:** P2
- **Risk:** R-01
- **Feature map:** FM-C05
- **Data:** A06, A07
- **Steps:** Check A07 booked the slot A06 released
- **Expected:** A07 scheduled at the same doctor/date/slot
- **Automation:** API

#### TP-14 — Cancel is idempotent / read-only after cancel

- **Type:** edge
- **Priority:** P3
- **Risk:** —
- **Feature map:** FM-C06
- **Data:** A04
- **Steps:** Open A04 (no Edit/Cancel); DELETE again
- **Expected:** No buttons; 200, still cancelled
- **Automation:** API

#### TP-15 — Edit can't move into an invalid slot

- **Type:** negative
- **Priority:** P2
- **Risk:** R-05, R-01
- **Feature map:** FM-E02
- **Data:** A05
- **Steps:** Edit A05 to a past date; to A08's slot
- **Expected:** 400/409; unchanged
- **Automation:** API

#### TP-16 — Completed appointment can't be cancelled

- **Type:** negative
- **Priority:** P3
- **Risk:** R-04
- **Feature map:** FM-C01
- **Data:** C01 (read-only)
- **Steps:** Open C01 detail (no DELETE sent)
- **Expected:** No Cancel/Edit shown
- **Automation:** manual

#### TP-17 — Earlier today / inside the lead time is not bookable

- **Type:** boundary
- **Priority:** P1
- **Risk:** R-05
- **Feature map:** FM-B04, FM-B07
- **Data:** P1, D1 on a working day, run during D1's hours
- **Steps:** Open today in the calendar; try a slot that already passed, and one that starts in less than 15 minutes; POST both via API
- **Expected:** Both slots not offered or disabled; API 400 for both (mentor rule 5)
- **Automation:** UI + API

#### TP-18 — Visual confirmation after booking and cancelling

- **Type:** positive
- **Priority:** P2
- **Risk:** R-08
- **Feature map:** FM-B08, FM-C07
- **Data:** P1, D1
- **Steps:** Book an appointment; cancel it; watch `toast-container` or a modal after each action
- **Expected:** A confirmation appears after each action (mentor rule 2)
- **Automation:** UI

#### TP-19 — Patient can't set doctor/system-only states

- **Type:** negative
- **Priority:** P1
- **Risk:** R-04
- **Feature map:** FM-E02, state transitions
- **Data:** P3, A05
- **Steps:** As P3, `PUT` A05 with `status: completed`, then `status: approved`; read A05 back
- **Expected:** 403 or 400 for both; A05 stays `scheduled` (mentor rule 4)
- **Automation:** API

#### TP-20 — Cancellation by someone else shows who and why

- **Type:** positive (suggestion)
- **Priority:** P3
- **Risk:** R-06, R-08
- **Feature map:** FM-C06, FM-C07
- **Data:** own patient account (4 appointments cancelled on 2026-09-28 at 23:44 by a third party)
- **Steps:** Open one of those cancelled appointments as the patient
- **Expected:** The detail says who cancelled (clinic, doctor, system) and why; the patient was notified (mentor rule 7)
- **Automation:** manual

## Traceability

Each Monday risk, the scenarios that cover it, the feature-map entries they exercise, the data they use and today's dry-run result ([test-run.md](test-run.md)).

- **R-01 Same slot booked twice (25)** → TP-02, TP-13 · FM-B04, FM-B07, FM-C05 · A08 + P5, A06/A07 · dry run: TP-02 Fail, TP-13 Pass
- **R-02 Concurrent bookings all succeed (20)** → TP-03 · FM-B07 · P4, P5, D1 · dry run: Fail
- **R-03 Date/time shown differently (20)** → TP-06, TP-01 · FM-B08 · A01 / fresh booking · dry run: Fail (cause narrowed to browser-side formatting)
- **R-04 Disallowed state changes (16)** → TP-12, TP-15, TP-16, TP-19 · FM-B01, FM-C04, FM-E02 · DR, A05, C01 · dry run: TP-12 Pass, TP-15 Fail, TP-16 Pass
- **R-05 Booking into the past (15)** → TP-04, TP-15, TP-17 · FM-B03, FM-B07, FM-E02 · P1, D1, A05 · dry run: both Fail
- **R-06 Reading other users' data (15)** → TP-11 · FM-C01, FM-C04 · A09 as P1 · dry run: Pass
- **R-07 Non-existent doctor (12)** → TP-08 · FM-B07 · P1 · dry run: Fail
- **R-08 No notification of changes (12)** → TP-18 (confirmation), TP-20 (who cancelled); also observed inside TP-01 and TP-10 · FM-B08, FM-C07 · dry run: no message shown in either
- **R-09 Unvalidated fields (12)** → TP-15; reason length in input set IN-R · FM-B05, FM-E02 · dry run: Fail
- **R-10 Outside working hours / slot grid (12)** → TP-05, TP-07 · FM-B04 · D1, D3 · dry run: both Fail
- **R-11 Weak registration data (12)** → not covered: registration is out of scope for this plan
- **R-12 500 instead of 400 (8)** → TP-09 covers the 400 path; malformed ids and dates in input sets IN-D, IN-DOC, IN-ID · dry run: TP-09 Pass; malformed ids still 500

**Gaps:** R-11 has no scenario (out of scope). TP-06 ran in Chromium only (with three browser time zones); a second browser engine is still to do.

## How to run

1. **Seed** (once per day), from `seed/`:
   ```bash
   SEED_PASSWORD='<password>' node seed-test-data.mjs
   ```
   Check `seed-run-output.txt`: 5 × `registered (201)` and 10 rows with the expected final state.
   Before every session (not only after seeding), check nothing drifted:
   ```bash
   SEED_PASSWORD='<password>' node seed-test-data.mjs --verify seed-output.json
   ```
   Every row must print `OK`. A `CHANGED` row means someone or something modified it — re-seed, or note it before testing.
2. **Log in:**
   - Seeded patients use the emails in `seed-output.json` and the same `SEED_PASSWORD`.
   - Own accounts use the program credentials. They're not stored in the repo.
3. **UI scenarios:** run them in Chromium with DevTools → Network open, and save the screenshot plus the matching request/response for each step to `evidence/`.
4. **API scenarios:**
   - Run them from DevTools on the logged-in tab: `await fetch('/api/appointments', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...})})`.
   - For "no session", use `curl` without a cookie.
5. **Record** each scenario as pass/fail with evidence, and add each failure to the bug notes with the TP id.
6. **Cleanup:**
   ```bash
   SEED_PASSWORD='<password>' node seed-test-data.mjs --cleanup seed-output.json
   ```
   Then cancel any duplicate created by TP-02 / TP-03 by hand.

## Result of the first run

Dry run on 2026-09-29, all 20 scenarios: **no-go**. 7 pass, 12 fail, 1 partial. Details and evidence per scenario are in [test-run.md](test-run.md).
