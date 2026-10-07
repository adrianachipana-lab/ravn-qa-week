# Bug Report — Changed display name is not shown until the patient logs in again

Author: Adriana Chipana · Track: Development · Day: Friday (capstone)

- **Title:** After saving a new display name, the navbar and dashboard keep showing the old name, even after reload, until the patient logs out and back in
- **Summary:**
  - A patient changes their name on `/profile` and gets "Profile updated", and the API stores the new name.
  - The navbar and the dashboard greeting keep showing the old name: after navigating, and after reloading the page.
  - The new name only appears after logging out and back in, because the name shown comes from the session (`/api/auth/session`), which isn't refreshed after the update.
- **Environment:** https://medapp-nerdery.vercel.app — shared training deployment, "Buggy mode ON".
- **Device / Browser:** Chromium (Playwright 1.63) on macOS, browser zone America/La_Paz.
- **Build / Version:** not exposed by the app. Observed on the deployment live on 2026-10-02 at 14:36 UTC.
- **Role / Account:** patient (throwaway test account). Any patient account reproduces it.
- **Severity:** Medium — no data is lost, but the patient is shown wrong information about their own identity right after being told the change worked. Their screens and the doctor's (which reads the stored name) disagree.
- **Priority:** P2 — fix before release. It breaks BR-PROF-006 (a name change must appear on every open screen, with no reload), and it makes patients repeat or doubt a change that did work.
- **Preconditions:** a signed-in patient whose current name is, e.g., "QA Tue P2 2609291300".
- **Steps to Reproduce:**
  1. Go to `/profile`.
  2. Change **Name** to "Maria Renamed" and click **Save changes**.
  3. Note the toast "Profile updated" and the navbar name (top right).
  4. Click **Dashboard** and reload the page.
  5. Optional: `GET /api/profile` and `GET /api/auth/session` in the same browser.
  6. Log out and log back in.
- **Expected Result:** from step 3 on, the navbar shows "Maria Renamed", and in step 4 the dashboard says "Welcome back, Maria Renamed" — without logging out (BR-PROF-006).
- **Actual Result:**
  - **Step 3:** toast "Profile updated"; the navbar still shows "QA Tue P2 2609291300".
  - **Step 4:** after navigating and reloading, the navbar and the "Welcome back, …" heading still show the old name.
  - **Step 5:** `/api/profile` returns `name: "Maria Renamed"`; `/api/auth/session` still returns the old name.
  - **Step 6:** after a new login, the navbar and dashboard show "Maria Renamed".
- **Evidence:**
  - [`evidence/bug-01-profile-saved-navbar-old-name.png`](evidence/bug-01-profile-saved-navbar-old-name.png) — the form saved with the new name, the toast, and the navbar with the old name.
  - [`evidence/bug-01-dashboard-after-reload-old-name.png`](evidence/bug-01-dashboard-after-reload-old-name.png) — the dashboard after reload, still greeting with the old name.
  - [`evidence/bug-01-dashboard-after-new-login.png`](evidence/bug-01-dashboard-after-new-login.png) — after logging in again, the new name appears.
  - [`evidence/bug-01-stale-name-repro.json`](evidence/bug-01-stale-name-repro.json) — every value per step, including the stored name versus the session name.
- **Impact:**
  - Patients see their own old name right after "Profile updated", so they think the save failed and try again.
  - Anyone who shares a device sees an outdated name in the header.
  - Doctors' screens read the stored name, so patient and doctor can see different names for the same person.
- **Related:** the same symptom is in a previous Product cohort's raw notes (`trainees/product/belen/monday/raw-bug-notes.md`, BUG-002), which left the cause as an open question. This report adds the evidence that answers it: the stored profile has the new name and the session still has the old one.
- **Workaround:** log out and log in again after changing the name.
- **Known Limitation:**
  - Checked with one patient account and in Chromium only.
  - The doctor's live view of the renamed patient wasn't captured.
  - The cause is inferred from the evidence (the session keeps the old name; the stored profile has the new one), not from the code.
  - The reference AC also asks for the change to appear *without reload on already-open screens* (reference AC SC-09). That would need a push mechanism, which goes beyond this bug.
