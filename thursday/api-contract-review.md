# API Contract Review — `POST /api/appointments`

Author: Adriana Chipana · Track: Development · Day: Thursday

- **Sources:**
  - The reference captures in `exercises/thursday/reference-api-output.md` (16 Sep 2026).
  - My own captures:
    - `../../tuesday/adriana-chipana/evidence/api-04-error-paths-patient.json`
    - `../../tuesday/adriana-chipana/evidence/run-01-api-scenarios.json`
    - Thursday's API tests and `evidence/br-01-double-booking-repro.json`
- **Judged against:**
  - the reference AC (MEDIC-101, `trainees/product/belen/wednesday/gherkin-ac.md`);
  - the business rules the mentor confirmed on 2026-09-29;
  - not against what the API happens to do today.

## 1. Is the response shape consistent?

**Mostly yes.** Every JSON response uses one envelope:
- success → `{ "success": true, "data": … }`
- failure → `{ "success": false, "error": { "code", "message" } }`

This holds for 201, 400, 401 and 404. Thursday's API tests assert it for 201, 400 and 401.

**Three breaks:**
- A malformed id (`GET /api/appointments/abc`) returns **500 with an empty body** — no envelope at all (`api-04` → `get_malformed_id`).
- An over-long reason (600 characters) returns **500** `SERVER_ERROR` "Failed to create appointment". The envelope is there, but it's the wrong class of error for invalid input (Monday BUG-13).
- `GET /api/profile` with no session returns `UNAUTHORIZED` with an **empty `message`**, while `/api/appointments` says "Not authenticated". Same code, different contract.

## 2. Are the status codes right?

- **No session → 401** — correct (reference case 1; Thursday auth test).
- **Valid booking → 201** with the created resource — correct (reference case 2; Thursday happy-path test).
- **Missing fields → 400 `VALIDATION_ERROR`** — correct (reference cases 3–6; Thursday validation test).
- **Date in the past → 201** — **wrong.**
  - Expected: 400/422 — the mentor's rule 5 (any time already passed is not bookable) and MEDIC-101 SCEN-05 (past slots "must not be bookable").
  - Reference case 7 (2020-01-01 → 201) and my TP-04 (2026-09-28 → 201) agree.
- **Doctor that doesn't exist → 201** — **wrong.**
  - Expected: 404 (or 400). There is no AC line for it, but a booking that references no doctor breaks data integrity: it shows as "— / Unknown" in the list.
  - Reference case 8 and my TP-08 agree.
- **Slot already taken → 201** — **wrong.** MEDIC-101 BR-MED101-04 requires `409 Conflict` (`br-01`: two patients, 201 and 201).
- **Non-working day / outside hours → 201** — **wrong.** MEDIC-101 SCEN-04 requires `422` "Dr. … is not available on this day" (TP-07: Monday for a Tue/Thu doctor → 201; 03:00 → 201).
- **Reason over 500 characters → 500** — **wrong.** It's invalid input, so 400.
- **Malformed id → 500** — **wrong.** 400 or 404.

## 3. Do the error contracts give a client enough to act on?

**Partly.**
- `VALIDATION_ERROR` is one code for every rule, and the failing fields only appear inside a human sentence ("Missing fields: date, timeSlot, reason"). A client that wants to highlight the right form field has to parse English.
- **Suggested contract:** keep `code`, and add a machine-readable list, e.g. `"fields": ["date", "timeSlot"]`, plus a distinct code per rule once the rules exist (`SLOT_TAKEN`, `OUTSIDE_WORKING_HOURS`, `PAST_SLOT`). `NOT_FOUND` and `UNAUTHORIZED` are already specific enough.
- **Status-code mismatch:** the AC itself mixes `409` (conflict) and `422` (working day, cutoff) while the existing validation uses `400`. The team should pick one rule (for example: 400 for malformed input, 409 for conflicts, 422 for business-rule violations) and apply it everywhere.

## 4. Which acceptance criteria does this endpoint not enforce?

- **BR-MED101-01 / -04 — no double-booking, 409 on collision.** Not enforced: a taken slot is accepted, sequentially and in parallel. The facilitator lists the 409 as a feature never built.
- **BR-MED101-02 — working days and hours.** Not enforced on `POST`: the slots endpoint returns no slots on a non-working day, but the booking endpoint doesn't check.
- **BR-MED101-07 / mentor rule 5 — no past or too-soon slots.** Not enforced: past dates, today's past hours and slots 3 minutes ahead are all accepted (Tuesday TP-04, TP-17).
- **Referential integrity of `doctorId`.** Not enforced: an unknown doctor is accepted.
- **Reason length limit (500).** Not enforced as a validation: it crashes instead (500).
- **Specialty comes from the doctor.** Not enforced: the client sends `specialty`, and a mismatched value is stored as sent (Monday BUG-11). The response shape lets the client decide something the server should own.

## Cases 7 and 8 — bug, AC gap or intended?

- **Case 7, date in the past → Bug.**
  - The rule exists and is agreed (mentor rule 5, MEDIC-101 SCEN-05), and the UI calendar already tries to block some days (weekends).
  - Accepting 2020-01-01 contradicts an agreed requirement, so it's not intended. The only open point is the minimum lead time (15 min given as an example vs. 3 h in the AC), which affects today's slots, not past dates.
- **Case 8, non-existent doctor → Bug, with an AC gap.**
  - No AC line covers it, so it's also a gap worth adding to MEDIC-101 ("a booking for an unknown doctor is rejected with 404").
  - But it's a bug regardless: the stored record points at nothing, shows as "— / Unknown", and can't be honoured by anyone. No business reason makes that intended.
