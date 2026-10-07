# Demo Notes — MEDIC-108 Patient Profile Management

Author: Adriana Chipana · Track: Development · Day: Friday (capstone)

- **Feature:** MEDIC-108 — a signed-in patient views and edits their profile (name, phone; email read-only; avatar not implemented) on `/profile` and through `PUT /api/profile`.
- **What I verified:**
  - Update and persist through the UI.
  - Identity fields (email, role) protected in the API.
  - Session required.
  - Name and phone validation.
  - Where a changed name appears.
  - Script in the name.
  - Saving and error states.
  - The screen's `data-testid` hooks.
- **UI coverage:** `tests/profile-ui.spec.ts`, built on reference AC SC-01 — change name and phone, save, success toast (`toast-success`), values persist after reload, email stays disabled. Green 3 runs in a row.
- **API coverage:** `tests/profile-api.spec.ts`, built on reference AC SC-03 and SC-04:
  - 401 `UNAUTHORIZED` without a session;
  - `email` and `role` in the payload are ignored while the name is updated.

  Green 3 runs in a row.
- **Key risks:**
  - R-01 — stale name after a change (20);
  - R-02 — no name validation (15);
  - R-03 — no phone validation (15);
  - R-05 — no audit trail (15).
- **Bugs found:** the changed name isn't shown in the navbar or dashboard until the next login, even after reload (`bug-report.md`, P2). Also documented:
  - names of 1/51/200 characters and whitespace-only accepted;
  - free-text phone accepted;
  - no audit;
  - the AC's `displayName` field silently ignored by the API.
- **Failure investigation approach:**
  - **API before UI:** compare what the API stored with what the screen shows. That's how the bug was located: `/api/profile` had the new name, `/api/auth/session` had the old one.
  - **Force states the app rarely shows:** `page.route` holds the request (saving) or fails it (error), so the hooks for each state can be checked.
  - **Product bug or test bug:** each red check is classified, as in Thursday's triage.
- **What remains unverified:**
  - The doctor's view of a renamed patient.
  - Real-time propagation to already-open sessions.
  - Script rendering on screens other than `/profile`.
  - Other browsers.
  - The audit log, which doesn't exist.
- **Recommendation:** **No-go for MEDIC-108 as specified.**
  - The core path works and the identity fields are safe.
  - But three agreed rules aren't implemented: name validation (BR-PROF-005), phone validation (BR-PROF-004) and audit (BR-PROF-007). A fourth (BR-PROF-006, name everywhere) is broken by the stale session name.
  - **Fix first:** server-side validation, and refreshing the session after an update. Then automate SCEN-MED108-03 to -06 (`scenarios.md`) as regression tests.

## Demo script (5 minutes)

1. **0:00–0:30 — Feature.** "MEDIC-108 lets a patient keep their name and phone up to date. I tested the profile screen and its API against Product's acceptance criteria."
2. **0:30–1:15 — Risks.** Show `risk-register.md`: stale name (20), name and phone validation (15 each), no audit (15). "I prioritised what a patient or the clinic would act on wrongly."
3. **1:15–2:45 — Run the suite live.** `npx playwright test -c …/friday-capstone/adriana-chipana/playwright.config.ts` → 3 passed. Open the HTML report and show:
   - **UI test:** saves, toast-success, reload, persisted.
   - **API test:** email and role ignored, 401 without a session.

   "Each test restores the profile, so it's safe to rerun."
4. **2:45–3:45 — The bug.** Show the three screenshots:
   - "Profile updated" with the old name in the navbar;
   - the dashboard after reload, still old;
   - after a new login, new.

   "The API has the new name; the session still has the old one."
5. **3:45–4:30 — How I investigated, and what's left.**
   - API vs session comparison.
   - `page.route` to force the saving and error states for the hooks audit.
   - The `displayName` mismatch in the AC.
   - Not verified: the doctor's view, already-open sessions, the audit log.
6. **4:30–5:00 — Recommendation.** "No-go as specified: validation and audit aren't built, and the name doesn't update until the next login. Fix server-side validation and the session refresh first."

**Before recording or presenting:** set the environment variables before sharing the screen, run the suite once beforehand, and have the report and the three screenshots open. Don't open the trace of a failed UI test on screen: it contains the typed password.
