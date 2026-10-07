# AC Gap Report — MEDIC-101 vs. the App

Author: Adriana Chipana · Track: Development · Day: Wednesday

The two required UI tests are written against the reference Gherkin AC, **MEDIC-101 — Prevent Booking an Already-Taken Slot** (`trainees/product/belen/wednesday/gherkin-ac.md`). They encode the AC as written, so where the app doesn't do what the AC says, the tests fail — on purpose. This report lists every failing assertion, what the AC requires, what the app does, and which one I believe is wrong.

Tests:
- `tests/med101-01-book-open-slot.spec.ts` → SCEN-MED101-01 (High)
- `tests/med101-02-taken-slot-disabled.spec.ts` → SCEN-MED101-02 (High)

Implemented behaviour is asserted with hard assertions, so a regression there stops the test. AC gaps use soft assertions, so each run reports **all** gaps, not just the first one.

## Why these two scenarios

- **Highest priority:** both are High, which covers "the two highest-priority scenarios". -03, -04, -06, -07 and -08 are High too, so priority alone doesn't pick them.
- **They're the core of the ticket:** -01 is the happy path the rest builds on. -02 is the double-booking defect MEDIC-101 exists to fix, and it links to BUG-005.
- **They rest on settled rules:**
  - -05 and -09 depend on the 3-hour cutoff, which the AC itself calls "a flagged PM assumption".
  - -03 and -08 depend on the 5-minute slot hold, which has no API or UI surface at all in the app.
  - -06 needs a concurrency harness (the AC says so: "later").

## SCEN-MED101-01 — Book an open slot

Result on today's build: **fails on 2 of 9 assertions** (same 2 in every run).

**Passes (implemented):**
- Booking is accepted with **201 Created**; the stored status is `scheduled`, with the date and slot picked.
- The appointment appears in the patient's list with **Scheduled**.

**Gap 1 — Confirmation message**
- **AC requires:** "Your appointment with Dr. Sarah Mitchell on `<date>` at 14:00 has been confirmed".
- **App does:** shows a short toast, "Appointment booked successfully", with no doctor, date or time. It disappears after a few seconds.
- **Which is wrong:** the **app**. The AC's message is what lets a patient catch a wrong booking at the moment they make it — especially important here, because the list shows the time shifted by time zone (BUG-06). Minor severity: feedback exists; it's just not specific.

**Gap 2 — Slot still offered to other patients**
- **AC requires:** "the 14:00 slot … no longer appears as available to any other patient".
- **App does:** `GET /api/doctors/{id}/slots` still returns 14:00 with `available: true` right after it was booked. Every patient keeps seeing it as free.
- **Which is wrong:** the **app** (BUG-03 / BUG-005). This is the defect MEDIC-101 is about.

## SCEN-MED101-02 — Booked slot is disabled for another patient

Result on today's build: **fails on 4 of 6 assertions** (same 4 in every run).

**Passes (implemented):** no booking request is sent while the second patient interacts with the slot (the app only sends one on Confirm).

**Gap 3 — Slot not disabled**
- **AC requires:** "the 09:00 slot is rendered as disabled".
- **App does:** the button is enabled.
- **Which is wrong:** the **app**.

**Gap 4 — Not machine-readably unavailable**
- **AC requires:** the slot is "visibly and functionally disabled", and the state map (B5a) asks for "an unavailable state that does not rely on styling alone".
- **App does:** each slot already carries `data-available`, but it says `"true"` for the booked slot.
- **Which is wrong:** the **app**. The hook exists; the value is wrong because the slots endpoint doesn't know about bookings (Gap 2).

**Gap 5 — No "Unavailable" label**
- **AC requires:** "sees the slot labeled 'Unavailable'".
- **App does:** the label is just the time, "09:00".
- **Which is wrong:** the **app**.

**Gap 6 — Slot can be selected**
- **AC requires:** the slot "cannot be highlighted or selected".
- **App does:** clicking highlights it, and after typing a reason, Review & book is enabled. The patient can continue to confirmation, and Monday showed the booking then succeeds (BUG-01).
- **Which is wrong:** the **app**.

## Where I think the AC is wrong or unclear

1. **Example data can't be used as written.**
   - The dates (2026-09-17, 2026-09-18) are already in the past, so any test using them hits the past-date rule instead of the rule under test.
   - The patients (`candidate@test.com`, `patient@test.com`, `nerd2@test.com`) are shared or someone else's accounts, which the program asks us not to write to.
   - The tests keep the AC's doctor and times (Dr. Mitchell, 14:00 and 09:00) but use a future working day and seeded test patients. The AC should state data as rules ("a future working day"), not fixed dates.
2. **The 3-hour cutoff contradicts the mentor's ruling.** SCEN-05 and SCEN-09 use 3 hours; on 2026-09-29 the mentor gave a minimum lead time of about 15 minutes. The AC already flags 3 hours as an unvalidated PM assumption. The number needs one owner before -05 and -09 can be automated.
3. **The slot hold (SCEN-03, SCEN-08) has no observable surface.** There's no hold endpoint, no hold state in the slot data, and no UI for it. "No selection hold is created" in SCEN-02 can't be verified today, which is why the test checks the observable part: no booking request.
4. **Status codes and messages aren't consistent.**
   - Conflicts use `409` (-03, -06), but working-day and cutoff violations use `422` (-04, -05, -09).
   - The app's existing validation errors use `400` with a `VALIDATION_ERROR` code.
   - The AC also fixes exact message copy in six places. Either is fine, but the AC should say whether copy is part of the contract or an example.
5. **Time zone is not specified.** "14:00" is never said to be clinic time. The mentor ruled it is (2026-09-29), and the state map says the AC "doesn't settle it either". Without it, SCEN-01's "confirmed at 14:00" can't be checked on the list, which today shows another hour depending on the browser (BUG-06).
6. **SCEN-01's last step is really SCEN-02.** "No longer appears as available to any other patient" is the double-booking rule. It fails for the same reason SCEN-02 fails, so the happy path can never pass until the defect is fixed. Splitting it out would let -01 guard the happy path on its own.

## Summary for the mentor

- **SCEN-MED101-01:** 2 gaps — generic confirmation copy (minor); booked slot still offered to others (critical, BUG-03).
- **SCEN-MED101-02:** 4 gaps — slot enabled, `data-available="true"`, no "Unavailable" label, selectable (critical, BUG-01/BUG-005).
- **AC issues:** past example dates and shared accounts; 3-hour vs 15-minute conflict; unobservable hold; 409/422/400 inconsistency; no time zone; SCEN-01 depends on the SCEN-02 fix.
