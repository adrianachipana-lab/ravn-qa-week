# Peer Review — Camila Mamani, Tuesday Test Plan

Reviewer: Adriana Chipana · Track: Development · Reviewed on 2026-09-30

- **Artifact reviewed:** `trainees/development/submissions/tuesday/camila-mamani/test-plan.md` (PR #66). `test-data.md` (PR #67) was read as supporting context.
- **Author:** Camila Mamani

## What works

- **Priority and level rules are stated with a reason.** "P1 when the patient acts on wrong info… because patients get hurt" and "API when the bug lives in the server, because the UI hides actions the server still accepts" make every row's priority and level checkable, not a matter of taste.
- **The assumption about time is sourced.** "The server `timeSlot` is the clinic's local time, confirmed in PR review" turns an open question into a documented decision that TP-08 can rely on.
- **The shared-environment risk is in Dependencies.** "Data may be reset without notice → … the test creates its own data through the API" is exactly the right mitigation for this environment.
- **Known defects are linked to scenarios.** The `Covers` column ties TP-03, TP-07, TP-08 and TP-10–TP-12 to D1–D8, so the plan shows which tests are expected to fail today.

## Gap 1 — The exit criteria can't be met, so the plan has no real end

- **Issue found (with evidence):** Exit Criteria says "All feature map rows and TP-01 to TP-20 tested; no P1 bug still open". But 17 of the 20 scenarios are P1, and the plan's own Known Defects list P1-level problems that are open today: D1 (patient can complete), D2 (wrong time), D4 (double booking).
- **Risk or ambiguity:** "No P1 bug open" is a release gate, not an exit criterion for testing. As written, testing can never finish on this build, and the plan doesn't say what the outcome of a run is when it ends with open P1s. "Tested" is also undefined: executed once? With evidence?
- **Suggested improvement:** Split the two ideas.
  - *Exit (testing done):* every P1 scenario executed with evidence, every failure logged as a bug with a TP id, and data cleaned up.
  - *Go / no-go (release):* no-go while any P1 is open; the product owner decides on P2/P3.

## Gap 2 — TP-06 expects a behaviour the program says is intentionally blocked

- **Issue found (with evidence):** TP-06 is "Doctor completes appointment → 200" (P1), and Known Defect 3 calls the doctor's 403 a "confirmed backend defect".
- **Contradicting evidence:**
  - The program's account notes say doctor accounts are read-only and "booking, editing and cancelling are blocked. That is intentional."
  - The app enforces it with explicit messages ("Doctor accounts cannot modify appointments"); see `trainees/development/submissions/tuesday/adriana-chipana/evidence/api-06-doctor-write-blocked.json`.
- **Risk or ambiguity:** a P1 test that fails by design on correct behaviour produces a false defect and inflates the no-go. The mentor did say `completed` belongs to "the doctor, clinic or system" — but that describes who owns the transition, not that this build's doctor role should have it.
- **Suggested improvement:** Move TP-06 out of the defect list and into an open question for Product: "Who completes an appointment in this build, and through which interface?" Until that's answered, keep the scenario as P3 or blocked. TP-07 (patient completes → 403) stays as it is; that one is a real, confirmed gap.

## Gap 3 — The scenarios can't be executed from the plan alone

- **Issue found (with evidence):** Each TP row has a one-line "scenario → expected result", but no preconditions, no data and no steps.
  - TP-13, TP-14 and TP-19 say "Patient B … patient A's appointment" without saying which accounts or which appointment.
  - `test-data.md` defines P1–P5 and A1–A10, but no TP row refers to them (e.g. TP-03 needs A4/A5; TP-04 needs A7).
- **Risk or ambiguity:** the Development watch point for Tuesday is a plan "executable by another developer". Another developer would have to guess the data for most rows, and two people running the same TP could test different things.
- **Suggested improvement:** Add the data ID to each row. TP-03 → A4 + A5 (D2, slot X); TP-13/14/19 → P2 acting on an A-row owned by P1. Add a "How to run" section: seed or create the data, which account runs which TP, and where evidence goes.

## Gap 4 — The risk list misses the top risks from Monday's register

- **Issue found (with evidence):** Risks lists three:
  - (1) cancel doesn't go through;
  - (2) cancelling an already-cancelled appointment;
  - (3) the API works with no token.

  The Monday risk register's highest scores are RISK-01 (patient sees others' appointments, 20), RISK-03 (double-booking, 20) and RISK-02 (timezone, 15). They appear only as Known Defects (D2, D4) or as TP coverage, not as plan risks.
- **Risk or ambiguity:** the plan's risks drive what gets tested first. Without the scored risks, the reader can't tell why TP-03 or TP-08 matter more than TP-10 (badge colour).
- **Suggested improvement:** Reference the Monday register by ID and score in Risks, e.g. "RISK-03 double-booking (20) → TP-03, TP-18". Keep the three new risks as additions.

## Gap 5 — TP-04's expected result has no source

- **Issue found (with evidence):** TP-04 is "Cancel an already-cancelled appointment → returns error" (P2).
  - Neither the feature map nor the mentor's rules define that behaviour.
  - Today the API answers 200 and leaves the status `cancelled`; see `…/tuesday/adriana-chipana/test-run.md`, TP-14.
- **Risk or ambiguity:** an idempotent 200 is a common, defensible design for cancel. Expecting an error without a rule behind it turns a design choice into a bug report.
- **Suggested improvement:** Either cite the rule that requires an error, or phrase the expected result as the invariant that matters: "status stays Cancelled and nothing else changes; the response is 200 or 4xx, but never a new appointment or a status flip".

## Gap 6 (minor) — Missing boundary scenarios for time

- **Issue found (with evidence):** TP-15 covers past dates, but no scenario covers the two time rules the mentor confirmed on 2026-09-29:
  - today's earlier hours / minimum lead time;
  - the last slot must end within the shift (start + duration ≤ end).
- **Risk or ambiguity:** both are reproducible today (slots 3 minutes ahead and the 14:00 end-of-shift slot are bookable), so they're cheap P1/P2 findings the plan would miss.
- **Suggested improvement:** Add two boundary rows: "Slot less than 15 minutes ahead → not offered, API rejects" and "Last slot of the day ends at or before shift end".

## Summary

- **Gaps found:** 6. The five main ones:
  1. Exit criteria can't be met.
  2. TP-06 expects intentionally blocked behaviour.
  3. Scenarios not executable without data and steps.
  4. Risks not linked to the Monday register.
  5. TP-04 expected result without a rule.

  Gap 6, missing time boundaries, is minor.
- **Strongest parts:** the stated priority and level rules, and the sourced timezone assumption. They make the plan easy to challenge, which is what made this review possible.
