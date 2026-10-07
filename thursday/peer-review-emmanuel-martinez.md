# Peer Reproducibility Review — Emmanuel Martinez, Thursday Bug Reports

Reviewer: Adriana Chipana · Track: Development · Reviewed on 2026-10-01

- **Artifact reviewed:** `trainees/development/submissions/thursday/emmanuel-martinez/bug-report.md` (PR #124) — BUG-017 and BUG-010, with the evidence in `evidences/`.
- **Author:** Emmanuel Martinez
- **How it was reviewed:** I followed each report's steps exactly as written, on 2026-10-01 at about 12:29 (UTC−5). I used a throwaway patient account instead of his, in Chromium (Playwright 1.63) on macOS. Results are in [`evidence/peer-review-bug017-repro.json`](evidence/peer-review-bug017-repro.json) and [`evidence/peer-review-bug010-repro.json`](evidence/peer-review-bug010-repro.json).

## Reproducibility verdict

- **BUG-017 (logout doesn't end the session):** **Reproduced** — every step, first try, with a different account and on a different OS and browser.
- **BUG-010 (repeated Confirm creates duplicates):** **Reproduced** — first try, and more easily than the report says: no network throttling was needed.

Both reports can be reproduced by someone who has never seen them before, which is the bar for this review.

## What works

- **Steps are concrete and ordered.** BUG-017's step 7 gives the exact `curl` command, so the "token still accepted" claim can be checked outside the browser in seconds.
- **Evidence is sensitive-data aware.** Tokens are cropped in the screenshots and the email is redacted in the API output — evidence that can be shared as-is.
- **Expected and Actual mirror each other line by line.** It's obvious which expectation failed.
- **Known limitations are honest and specific**, for example "only against `api/profile`" and "not measured how long the token stays valid". That told me exactly where to look further (below).
- **BUG-010 separates the display issue it noticed** (Oct 5 05:00 shown vs Oct 6 10:00 stored) instead of mixing it in. That's good scoping.

## BUG-017 — Logout doesn't clear the session cookies and the old token is still accepted

### Issue 1 — The report can now name where the logout fails

- **Issue found (with evidence):**
  - Clicking **Logout** sends **no request** to `/api/auth/signout`. The app only navigates to `/login`.
  - The `__Secure-next-auth.session-token` cookie is byte-for-byte the same before and after, and `/dashboard` still opens.
  - (`peer-review-bug017-repro.json` → `requestsTo_/api/auth/signout_whenClickingLogout: []`, `sessionTokenUnchangedAfterLogout: true`)
- **Risk or ambiguity:** as written, a developer has to rediscover whether the sign-out endpoint is broken or never called. Those are different fixes in different places.
- **Suggested improvement:** add one line to Actual Result: "No request to `/api/auth/signout` is sent when Logout is clicked (DevTools → Network)". That moves the report from symptom to the failing component.

### Issue 2 — The expected result bundles two fixes with different owners

- **Issue found (with evidence):** Expected Result asks for both "the session cookies are cleared" and "protected endpoints return a 401 … while using the old session token". The session token is a self-contained signed token (it starts `eyJ…`, a JWT), and the server accepts it until it expires.
- **Risk or ambiguity:**
  - Fixing the button — calling sign-out so the cookie is deleted — fixes the first expectation, but **not** the second. A copied token would still work until it expires.
  - A developer could fix the button, see the test still "fail" on the second point, and not know whether that's in scope.
  - Revoking a stateless token needs a server-side change: a session store or denylist, or a short lifetime.
- **Suggested improvement:** split it into two expectations with their own priority:
  - (a) Logout calls sign-out and clears the cookie — frontend, P1.
  - (b) A token is rejected after logout — backend design decision: revocation list or short session lifetime.

  Say which one the report requires.

### Issue 3 (minor) — The token lifetime can be filled in

- **Issue found (with evidence):** Known Limitation says it "was not measured how long the token stays valid". The cookie's expiry is **8 hours after login** (logged in 17:29 UTC → expires 01:29 UTC). `/api/auth/session` returned the same window for the old token.
- **Risk or ambiguity:** "valid for an unknown time" reads as possibly forever. 8 hours is concrete exposure that someone can weigh.
- **Suggested improvement:** replace that limitation with the measured value: "the old token stays valid until the cookie's expiry, 8 h after login".

### Issue 4 (minor) — Role / Account blocks a cold reproduction

- **Issue found (with evidence):** Role / Account says "Ask test data owner for access credentials" and names two specific accounts. I reproduced it with an unrelated patient account, so any patient works.
- **Risk or ambiguity:** "ask the owner" adds a hand-off that isn't actually needed, and a reader may think the bug depends on those accounts.
- **Suggested improvement:** "Any patient account" (reproduced with an unrelated patient account). Keep the named ones as where it was first seen.

## BUG-010 — Multiple appointments can be created from repeated submissions

### Issue 5 — It reproduces without throttling, so the report understates it

- **Issue found (with evidence):**
  - Five quick clicks on **Confirm booking**, with **no network throttling**:
    - 5 `POST /api/appointments` → **201** ×5;
    - 5 identical appointments, created within **40 ms** (17:29:44.094Z – .134Z);
    - the button stayed enabled after every click.
  - (`peer-review-bug010-repro.json`)
- **Risk or ambiguity:** the steps' note suggests 3G throttling. A reader may think it only happens on slow networks and lower the priority.
- **Suggested improvement:** state that it reproduces on a normal connection with 2+ quick clicks, and keep throttling as a way to make it easier to see.

### Issue 6 — The report covers a UI fix and a backend gap; say which is which

- **Issue found (with evidence):** Expected Result lists "the button disables" (frontend) and "any booking request for an already taken slot is rejected by the server" (backend).
  - The second is the double-booking rule.
  - The reference AC asks for it as a `409` (MEDIC-101 BR-MED101-04), and the facilitator's update lists "a 409 on a collision" as a **feature never built**.
  - My Tuesday run shows the same server gap without any UI: three parallel API requests for one slot all returned 201 (`../../tuesday/adriana-chipana/test-run.md`, TP-03).
- **Risk or ambiguity:**
  - Disabling the button stops accidental double-clicks but not the server accepting duplicates.
  - If a developer only fixes the button, BUG-010 looks fixed while the data problem remains.
- **Suggested improvement:**
  - Keep BUG-010 as the frontend bug (button disables, a single request per confirmation).
  - Link the backend part to the existing double-booking finding or ticket (MEDIC-101 / BR-MED101-04) instead of re-filing it here.
  - The idempotency-key idea in Known Limitation fits well as the suggested backend fix.

### Issue 7 (minor) — The example uses another trainee's doctor

- **Issue found (with evidence):** step 3 uses Dr. Hannah Kim, who is assigned to another trainee. The evidence shows 17 duplicates in her schedule.
- **Risk or ambiguity:** anyone reproducing the report as written adds more duplicate rows to that trainee's doctor schedule in the shared environment.
- **Suggested improvement:** suggest a doctor no trainee is assigned to (e.g. Dr. Michael Thompson, Dr. Priya Patel or Dr. Leila Okonkwo), and add "cancel the duplicates afterwards" to the steps.

## Summary

- **Reproducibility:** both reports reproduce first try, cold, on a different account, OS and browser.
- **Highest-value changes:**
  - BUG-017 — name the missing sign-out request (Issue 1), and split "clear the cookie" from "revoke the token" (Issue 2).
  - BUG-010 — remove the implication that throttling is needed (Issue 5), and separate the UI fix from the server-side double-booking gap (Issue 6).
- **Minor:** fill in the measured 8-hour token lifetime (Issue 3), say any account works (Issue 4), and use an unassigned doctor in the example (Issue 7).
