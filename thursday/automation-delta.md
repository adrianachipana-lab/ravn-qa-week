# Automation Delta

Author: Adriana Chipana · Track: Development · Day: Thursday

- **Original test or suite area:** Wednesday's own-scenario UI tests, now part of the regression suite:
  - `wednesday/adriana-chipana/tests/own-scenarios/book-appointment.spec.ts` (SC-01)
  - `wednesday/adriana-chipana/tests/own-scenarios/cancel-appointment.spec.ts` (SC-02)
- **Change made:** one assertion added to each test, right after the booking or cancel response:
  - SC-01 expects `toast-container` to contain "Appointment booked successfully".
  - SC-02 expects `toast-container` to contain "Appointment cancelled".
  - Nothing else changed.
- **Why this change matters:**
  - On Monday (BUG-26) and Tuesday (TP-18) the success message was recorded as missing, and Wednesday's tests deliberately didn't check it.
  - On Wednesday the MEDIC-101 test caught the toast: it exists, but only for a few seconds, and earlier checks ran after it had gone.
  - Without this assertion, the suite can't notice if the feedback disappears for real. With it, the user-visible confirmation is covered, and the assertion runs early enough to see the toast.
- **Evidence from rerun:**
  - The delta runs below cover the `ui` and `api` projects (the 5 tests the change can affect). They were made before the `ui-ac` tests were added back to the default run.
  - **Baseline, before the change:** 5/5 passed in 27 s — [`evidence/regression-baseline.txt`](evidence/regression-baseline.txt).
  - **After the change, three consecutive runs:** 5/5 passed each time, in 22.2 s, 22.2 s and 23.1 s — [`evidence/regression-run-1.txt`](evidence/regression-run-1.txt), [`-2`](evidence/regression-run-2.txt), [`-3`](evidence/regression-run-3.txt).
  - **The new assertion can fail (mutation check):**
    - With the expected text temporarily changed to a wrong value, SC-01 failed with `Expected substring: "Appointment booked successfullyX"`.
    - The change was then reverted — [`evidence/delta-mutation-check.txt`](evidence/delta-mutation-check.txt).
    - This shows the assertion reads the real toast and isn't vacuous.
- **Remaining risk or limitation:**
  - The toast is transient and has no hook of its own, only its container. If the app shows it later or for a shorter time, this check can become flaky.
  - It checks the app's generic text, not the specific message MEDIC-101 asks for ("Your appointment with … on … at … has been confirmed"). That gap stays documented in the AC test SCEN-MED101-01 (`ui-ac` project).
  - The toast container was briefly `aria-hidden` on Wednesday, so a visible toast doesn't prove screen readers announce it.
