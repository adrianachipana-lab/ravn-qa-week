# Test Data Sheet — Appointment Booking & Cancellation

Author: Adriana Chipana · Track: Development · Day: Tuesday

Data set for the scenarios in [test-plan.md](test-plan.md). **5 patients, 3 doctors in 3 specialties, 10 appointments in 3 states**, plus reference rows for the states the UI can't create.

- **Reproducible:** P1–P5 and A01–A10 are created by [`seed/seed-test-data.mjs`](seed/seed-test-data.mjs) through the public API. Run output: [`seed/seed-run-output.txt`](seed/seed-run-output.txt); ids: [`seed/seed-output.json`](seed/seed-output.json).
- **Current run:** `2609291300`, created 2026-09-29 13:00 UTC on https://medapp-nerdery.vercel.app. A new run gets new emails and ids; dates are computed relative to the run day.
- **Isolation:** only doctors that no trainee is assigned to are used (D1–D3), so no one else's doctor schedule gets extra rows. No shared practice account is written to.
- **Secrets:** no password is stored here or in the seed files. The seed reads it from `SEED_PASSWORD`.

## Patients

#### P1 — Patient

- **Attributes:** `qa.adriana.tue.2609291300.p1@test.com` · name "QA Tue P1 2609291300"
- **Initial State:** Registered, logged in; owns A01, A02
- **Used By Scenario:** Book happy path; cancel happy path; cross-patient cancel attempt on A09
- **Setup Method:** Seed (`POST /api/auth/register`)
- **Cleanup Needed:** Appointments: `--cleanup`. Account: can't be deleted (no endpoint)

#### P2 — Patient

- **Attributes:** `…p2@test.com`
- **Initial State:** Owns A03, A04
- **Used By Scenario:** Last-valid-slot boundary; cancelled state in list
- **Setup Method:** Seed
- **Cleanup Needed:** Same as P1

#### P3 — Patient

- **Attributes:** `…p3@test.com`
- **Initial State:** Owns A05 (rescheduled), A06 (cancelled)
- **Used By Scenario:** Edit/reschedule; release a slot by cancelling
- **Setup Method:** Seed
- **Cleanup Needed:** Same as P1

#### P4 — Patient

- **Attributes:** `…p4@test.com`
- **Initial State:** Owns A07, A08
- **Used By Scenario:** Re-book a released slot; owner of the slot used in the double-booking test
- **Setup Method:** Seed
- **Cleanup Needed:** Same as P1

#### P5 — Patient

- **Attributes:** `…p5@test.com`
- **Initial State:** Owns A09 (cancelled), A10
- **Used By Scenario:** **Second booker** in the double-booking test (tries A08's slot); far-future row
- **Setup Method:** Seed
- **Cleanup Needed:** Same as P1

#### PX — Patient (own assigned account)

- **Attributes:** own patient account
- **Initial State:** Holds pre-seeded completed appointments C01–C03
- **Used By Scenario:** Read-only: completed state in list/filter/dashboard
- **Setup Method:** Pre-existing (program seed)
- **Cleanup Needed:** None — read only, never written

#### DR — Doctor (own assigned account)

- **Attributes:** Dr. Sarah Mitchell, General Practice
- **Initial State:** Read-only doctor role
- **Used By Scenario:** Doctor can't book / edit / cancel (403); doctor list and detail views
- **Setup Method:** Pre-existing
- **Cleanup Needed:** None — writes are blocked

## Doctors

#### D1 — Doctor

- **Attributes:** Dr. Michael Thompson · General Practice · id `6aa85e2fb0083185ed54c88a` · Mon–Fri · 07:00–14:00 · 30 min
- **Initial State:** Pre-existing, not assigned to a trainee
- **Used By Scenario:** First slot (07:00), last valid slot (13:30), slot release + re-book
- **Setup Method:** Pre-existing (read via `GET /api/doctors`)
- **Cleanup Needed:** None

#### D2 — Doctor

- **Attributes:** Dr. Priya Patel · Cardiology · id `6aa85e2fb0083185ed54c88b` · Mon/Tue/Thu/Fri · 09:00–16:00 · 30 min
- **Initial State:** Pre-existing
- **Used By Scenario:** Cancel happy path; reschedule; cross-patient cancel
- **Setup Method:** Pre-existing
- **Cleanup Needed:** None

#### D3 — Doctor

- **Attributes:** Dr. Leila Okonkwo · Endocrinology · id `6aa86161517271c458e7b6c2` · Tue/Thu only · 08:00–15:00 · 30 min
- **Initial State:** Pre-existing
- **Used By Scenario:** Non-working-day checks (Mon/Wed/Fri disabled); double-booking slot
- **Setup Method:** Pre-existing
- **Cleanup Needed:** None

## Appointments

#### A01 — Appointment

- **Attributes:** P1 · D1 · 2026-10-20 07:00 · id `6abbb6924db95823cc3f3317`
- **Initial State:** **scheduled**
- **Used By Scenario:** Book happy path; view in list/detail/dashboard; first slot of the day
- **Setup Method:** Seed: `POST`
- **Cleanup Needed:** `--cleanup` cancels

#### A02 — Appointment

- **Attributes:** P1 · D2 · 2026-10-22 10:00 · id `6abbb6934db95823cc3f3318`
- **Initial State:** **scheduled**
- **Used By Scenario:** Cancel happy path (the test cancels it); Keep it path
- **Setup Method:** Seed: `POST`
- **Cleanup Needed:** Re-run seed after the cancel test

#### A03 — Appointment

- **Attributes:** P2 · D1 · 2026-10-22 13:30 · id `6abbb6944db95823cc3f3319`
- **Initial State:** **scheduled**
- **Used By Scenario:** Boundary: last slot that ends at closing (13:30 + 30 = 14:00)
- **Setup Method:** Seed: `POST` (slot computed as start + duration ≤ end)
- **Cleanup Needed:** `--cleanup`

#### A04 — Appointment

- **Attributes:** P2 · D3 · 2026-10-27 09:30 · id `6abbb6954db95823cc3f331a`
- **Initial State:** **cancelled**
- **Used By Scenario:** Cancelled badge; Cancelled filter; read-only detail; re-cancel is idempotent
- **Setup Method:** Seed: `POST` → `DELETE`
- **Cleanup Needed:** None (already cancelled)

#### A05 — Appointment

- **Attributes:** P3 · D2 · booked 2026-10-26, moved to 2026-11-02 11:00 · id `6abbb6964db95823cc3f331b`
- **Initial State:** **scheduled** (rescheduled)
- **Used By Scenario:** Edit/reschedule; list order after a date change
- **Setup Method:** Seed: `POST` → `PUT` (+7 days)
- **Cleanup Needed:** `--cleanup`

#### A06 — Appointment

- **Attributes:** P3 · D1 · 2026-10-27 09:30 · id `6abbb6974db95823cc3f331c`
- **Initial State:** **cancelled**
- **Used By Scenario:** Slot released by cancellation
- **Setup Method:** Seed: `POST` → `DELETE`
- **Cleanup Needed:** None

#### A07 — Appointment

- **Attributes:** P4 · D1 · 2026-10-27 09:30 (same slot as A06) · id `6abbb6984db95823cc3f331d`
- **Initial State:** **scheduled**
- **Used By Scenario:** Another patient can book a slot released by a cancellation
- **Setup Method:** Seed: `POST` after A06 is cancelled
- **Cleanup Needed:** `--cleanup`

#### A08 — Appointment

- **Attributes:** P4 · D3 · 2026-11-03 09:00 · id `6abbb6994db95823cc3f331e`
- **Initial State:** **scheduled**
- **Used By Scenario:** **Double-booking:** P5 books D3 2026-11-03 09:00 → expect 409; slot should show as taken
- **Setup Method:** Seed: `POST`
- **Cleanup Needed:** `--cleanup`; also cancel any duplicate the test creates

#### A09 — Appointment

- **Attributes:** P5 · D2 · 2026-11-02 12:00 · id `6abbb6994db95823cc3f331f`
- **Initial State:** **cancelled**
- **Used By Scenario:** Cross-patient: P1 tries to cancel/view it → expect 404
- **Setup Method:** Seed: `POST` → `DELETE`
- **Cleanup Needed:** None

#### A10 — Appointment

- **Attributes:** P5 · D3 · 2026-12-01 08:00 · id `6abbb69a4db95823cc3f3320`
- **Initial State:** **scheduled**
- **Used By Scenario:** Far-future row: sort by date, pagination order, next-month navigation
- **Setup Method:** Seed: `POST`
- **Cleanup Needed:** `--cleanup`

#### C01 — Appointment (reference)

- **Attributes:** PX · Dr. Roberto Silva · Orthopedics · 2026-09-28 09:30 · id `6aba799fa6236c75a6e7d75f`
- **Initial State:** **completed**
- **Used By Scenario:** Completed badge and filter; no Cancel/Edit on completed
- **Setup Method:** Pre-existing program seed
- **Cleanup Needed:** None — read only

#### C02 — Appointment (reference)

- **Attributes:** PX · Dr. Hannah Kim · Neurology · 2026-09-22 14:30 · id `6aba799fa6236c75a6e7d760`
- **Initial State:** **completed**
- **Used By Scenario:** Completed count on dashboard vs list
- **Setup Method:** Pre-existing program seed
- **Cleanup Needed:** None — read only

#### C03 — Appointment (reference)

- **Attributes:** PX · Dr. Leila Okonkwo · Endocrinology · 2026-09-08 13:00 · id `6aba799fa6236c75a6e7d763`
- **Initial State:** **completed**
- **Used By Scenario:** Completed row for the same doctor (D3) as seeded data
- **Setup Method:** Pre-existing program seed
- **Cleanup Needed:** None — read only

## Coverage check

**Against the requirement**

- **Patients** — Target: ≥ 5 · In this sheet: 5 seeded (P1–P5) + 1 reference (PX)
- **Doctors** — Target: ≥ 3, 2+ specialties · In this sheet: 3 (D1–D3) across 3 specialties, plus DR for the doctor role
- **Appointments** — Target: ≥ 10 across states · In this sheet: 10 seeded: 7 scheduled (1 rescheduled), 3 cancelled · plus 3 completed references

**By state**

- **scheduled** — Rows: A01, A02, A03, A05, A07, A08, A10 · How it's reached: `POST`
- **scheduled (after edit)** — Rows: A05 · How it's reached: `POST` → `PUT`
- **cancelled** — Rows: A04, A06, A09 · How it's reached: `POST` → `DELETE`
- **completed** — Rows: C01–C03 · How it's reached: **No UI or API path for a patient** — only program seed data

## Input values

The entities above are *who* and *what* a test uses. These are the *values* typed or sent, chosen at the edges where behaviour should change. The ones marked *(observed)* were already sent on Monday or in today's dry run ([test-run.md](test-run.md)); the rest are still to run.

#### IN-R — Reason text (limit 500, required)

- **Empty ""** — expected: Review & book disabled; API 400 · observed: button disabled *(observed)*
- **Spaces only "   "** — expected: disabled; API 400 · observed: button disabled *(observed)*
- **1 character "x"** — expected: accepted
- **500 characters** — expected: accepted, counter 500/500
- **501 characters** — expected: blocked in the UI; API 400 · observed: typing capped by `maxlength`; a value set by script enables submit *(observed)*
- **600 characters via API** — expected: 400 · observed: 500 server error *(observed, Monday BUG-13)*
- **Special characters `<script>alert(1)</script>` and emoji/accents "Dolor de cabeza — ñandú"** — expected: stored and shown as plain text

#### IN-D — Appointment date (relative to "today" = run day)

- **Yesterday** — expected: day disabled; API 400 · observed: enabled; API 201 *(observed, TP-04)*
- **Today, a slot earlier than now** — expected: disabled; API 400 (mentor rule 5)
- **Today, a slot starting in less than 15 minutes** — expected: disabled; API 400 (minimum lead time; 15 min is the mentor's example)
- **Today, a slot later than now** — expected: accepted
- **Doctor's non-working day (D3 on a Monday)** — expected: disabled; API 400 · observed: slots empty; API 201 *(observed, TP-07)*
- **Weekend** — expected: disabled · observed: disabled *(observed)*
- **Far future (+1 year)** — expected: accepted or a documented booking horizon (none found)
- **Impossible date 2026-02-30** — expected: 400 · observed: slots endpoint 200 *(observed, Monday BUG-14)*
- **Malformed date "2026-13-01", "abc"** — expected: 400 · observed: 500 *(observed, Monday BUG-13)*

#### IN-T — Time slot (D1: 07:00–14:00, 30 min)

- **First slot 07:00** — expected: accepted *(observed, A01)*
- **Last valid slot 13:30** — expected: accepted *(observed, A03)*
- **Closing time 14:00** — expected: not offered; API 400, because 14:00 + 30 min > end of shift (mentor rule 6) · observed: offered *(observed, TP-05)*
- **Before opening 06:30 / 03:00** — expected: API 400 · observed: 03:00 → 201 *(observed, TP-07)*
- **Off-grid 07:15** — expected: API 400
- **Invalid "99:99"** — expected: 400 · observed: accepted by PUT *(observed, Monday BUG-05)*

#### IN-DOC — Doctor id

- **Valid (D1)** — expected: accepted *(observed)*
- **Well-formed but unknown `000000000000000000000000`** — expected: 404 · observed: 201 *(observed, TP-08)*
- **Malformed "abc"** — expected: 400 · observed: 500 on slots *(observed, Monday BUG-13)*
- **Missing** — expected: 400 "Missing fields" *(observed, TP-09 variant)*

#### IN-ID — Appointment id in the URL / API

- **Own appointment** — expected: 200 *(observed)*
- **Another patient's appointment (A09 as P1)** — expected: 404 · observed: 404 *(observed, TP-11)*
- **Malformed "abc"** — expected: 400 or 404 · observed: 500 *(observed, `api-04`)*

## Known limitations

- **Current state after the 2026-09-29 dry run:** A02 is `cancelled` (TP-10 cancels it on purpose). All other rows are unchanged (`evidence/run-07-verify-after-run.txt`). Re-seed before running TP-10 again.

- `completed` can't be produced by the seed without using the patient `PUT status` path, which Monday showed is a defect (BUG-05). Tests that need a completed row use the read-only C01–C03 references, which belong to the own assigned account and change if the program re-seeds.
- Seeded accounts can't be removed; each run leaves 5 more users. Use one run per day and reuse it.
- The seed does not create the double-booking duplicate itself — that's the test's job — so A08 only proves the *setup* for that scenario.
- The seed relies on the slots endpoint to pick valid times; if the endpoint ever marks booked slots as taken (fixing BUG-03), the plan still works because each row uses a different doctor/date/slot, except A07, which re-uses a slot only after A06 is cancelled.
