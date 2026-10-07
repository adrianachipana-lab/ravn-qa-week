# Peer Review — Camila Mamani, Monday

Reviewer: Adriana Chipana · Track: Development · Reviewed on 2026-09-29

Artifacts reviewed (as submitted in PRs #18, #19, #20):

- `trainees/development/submissions/monday/camila-mamani/risk-register.md`
- `trainees/development/submissions/monday/camila-mamani/exploratory-charter.md` (charter + session report)
- `trainees/development/submissions/monday/camila-mamani/evidence/README.md` and `bug-notes.md` (read as supporting evidence)

---

## 1. Risk register

- **Artifact reviewed:** `risk-register.md` (RISK-01 to RISK-10)
- **Author:** Camila Mamani

### What works

- Every score has a one-line justification next to the number (e.g. RISK-01 "the appointment ID is in the URL and could be changed"), so the reasoning can be challenged, not just the number.
- Known limitations are specific and honest. RISK-01 "the screen might hide the data while the API still sends it, so a UI-only test can miss the leak" is exactly why the session later checked the API too.
- Risks are updated with session findings (RISK-03 → BUG-02, RISK-10 → BUG-03), so the register and the session report tell one story.

### Issue 1 — RISK-04 probability is based on an assumption the app disproves

- **Issue found (with evidence):** RISK-04 gives Probability 3 because "the screen might block it". The booking calendar does not block past dates: past weekdays are clickable and a booking on 2026-09-21 (a past date) was created with status Scheduled from the UI on 2026-09-28 (my Monday bug notes, BUG-04 — `trainees/development/submissions/monday/adriana-chipana/screenshots/booking-past-date-selectable.png`). The impact line ("the dashboard counts are wrong") is also a side effect, not the harm to the user.
- **Risk or ambiguity:** The risk ranks 9/25, below lower-evidence risks, so it could be deprioritised in Tuesday's test plan even though it is reproducible in two clicks.
- **Suggested improvement:** Test the UI path first (Book → any doctor → click a past weekday), then re-score to P = 5 if it reproduces. Rewrite the impact around the user: "the patient holds an appointment that can never happen; the doctor's schedule shows a slot that was never available".

### Issue 2 — Race condition is folded into double-booking, and the planned test can't prove it

- **Issue found (with evidence):** RISK-03 covers both double-booking and "both click Book at the same time". The testing approach is two browsers clicked "as close together as possible", and the known limitation already says that can't prove anything. The Monday calendar lists race conditions and double-booking as separate required areas.
- **Risk or ambiguity:** A sequential fix (check-then-insert) would make the double-booking test pass while the race stays open, and this register wouldn't show it. Also: RISK-03 is "Confirmed in session" but keeps P = 4.
- **Suggested improvement:** Split into two risks. Keep RISK-03 as sequential double-booking (P = 5, since BUG-02 confirmed it). Add a race-condition risk whose testing approach sends 3 identical `POST /api/appointments` in parallel (`Promise.all` from DevTools, or Playwright `request`) and expects exactly one `201`. In my Monday session all three parallel requests returned `201` (my bug notes, BUG-02 — `trainees/development/submissions/monday/adriana-chipana/bug-notes.md`), so it is reproducible.

### Issue 3 — "Testing Approach: Not tested today" in RISK-07, RISK-08 and RISK-09

- **Issue found (with evidence):** For RISK-07, RISK-08 and RISK-09 both *Testing Approach* and *Known Limitation* say "Not tested today".
- **Risk or ambiguity:** The template field is the plan for how to test the risk, not its status. Without a plan, whoever picks up Tuesday's test plan has to reinvent these tests, and the limitation field loses its meaning.
- **Suggested improvement:** Write the approach even if it wasn't run. For example:
  - RISK-07: "As the doctor, send `POST`, `PUT` and `DELETE` to `/api/appointments`; expect `403`."
  - RISK-08: "Register the same email again, also in uppercase and with spaces; expect `409`."
  - Keep "Not run on Monday" as the known limitation.

### Issue 4 — RISK-02 underestimates probability; the session shows it hits every patient

- **Issue found (with evidence):** RISK-02 scores P = 3 because it "mainly affects virtual appointments" in different timezones. BUG-01 in the same submission shows a Nov 2, 09:00 appointment stored correctly by the API (`bug-time-03-swagger-get-stored-0900.png`) but listed as Nov 1, 04:00 AM (`bug-time-04-safari-list-nov1-0400.png`), and patient B's Nov 3, 09:00 booking shown as Nov 2, 04:00 AM (`risk01-02`), without any timezone change.
- **Risk or ambiguity:** The register describes a narrow edge case, while the evidence shows the most common path is affected. The two artifacts disagree.
- **Suggested improvement:** Broaden the description to "date/time shown differently from what was booked, on some screens", link BUG-01, and raise P to 5.

### Issue 5 — RISK-06 is cheap to verify and has a high chance of being real

- **Issue found (with evidence):** RISK-06 is "a guess; not verified yet". Comparing the dashboard with the list takes a minute. On my account the dashboard showed 296 (later 332) total appointments, while the list had 35 (later 43). The 332 matched the system-wide appointment count.
- **Risk or ambiguity:** If it's system-wide, this is also a permission leak (aggregate data from other patients), not only a data-integrity issue, and impact 3 is too low.
- **Suggested improvement:** Run the check on your own account and record both numbers. If they differ, re-score and cross-reference RISK-01.

### Issue 6 (minor) — RISK-09 mixes a UI state with a backend outage

- **Issue found (with evidence):** RISK-09 combines "the Sign in button does not turn on" and "the backend fails", and the mitigation is "show a clear error message".
- **Risk or ambiguity:** An error message doesn't mitigate an outage, and the two causes need different tests.
- **Suggested improvement:** Keep one of them. For the backend case, say what the mitigation is (monitoring or a retry message) and how to test it (block `/api/auth/*` in DevTools and check the message).

---

## 2. Exploratory charter & session report

- **Artifact reviewed:** `exploratory-charter.md` (charter, re-charter, test notes, bugs, questions, coverage) and `evidence/README.md`
- **Author:** Camila Mamani

### What works

- **The re-charter at ~15:25 is documented with its reason** ("found the time bug off-charter during setup and followed it"), which is what session-based testing asks for.
- **The RISK-01 control test is strong:** A gets `NOT_FOUND` on B's appointment, and B gets data on the same URL, so the block is shown to be about ownership and not a broken endpoint.
- **The evidence index has "Proves / Does not prove" for every group.** It meets the interpretation rule better than most submissions.
- Classmate data is redacted in `doctor-02`, and the `/api-docs` instructor labels were reported instead of used.

### Issue 7 — The session length vs. the 90-minute time-box isn't stated

- **Issue found (with evidence):** Time-box is 90 minutes; the timestamped notes run from ~15:25 to ~16:05 (about 40 minutes).
- **Risk or ambiguity:** A reader can't tell if the rest of the time was setup, un-logged testing, or a shorter session, so the 60% coverage estimate is hard to judge.
- **Suggested improvement:** Add one line: actual start/end, and how the time split between setup, the RISK-01 charter and the re-charter.

### Issue 8 — The Chrome vs Safari question can be answered without a second browser

- **Issue found (with evidence):** The report says the time difference is "not isolated (changed page and timezone at the same time)". In `bug-time-05` the *dashboard* shows 09:00 and in `bug-time-04` the *list* shows 04:00. In my Monday session, one Chromium browser in one timezone showed 09:00 on the dashboard and 04:00 AM in the list for the same appointment, with React hydration errors (#418/#425) in the console (my bug notes, BUG-06 — `trainees/development/submissions/monday/adriana-chipana/bug-notes.md`).
- **Risk or ambiguity:** The current wording points at the browser; the evidence points at the page. This affects who the bug gets routed to.
- **Suggested improvement:** Change only one variable: same browser, same timezone, same appointment; compare dashboard, list and detail. If they differ, state the cause as "page", then repeat with only the timezone changed.

### Issue 9 — The "stored as 10:00 but 09:00 selected" question is the highest-value open lead

- **Issue found (with evidence):** Issues/questions notes that the Sep 3 booking was stored as `timeSlot "10:00"` although 09:00 was selected (`bug-time-00-booking-form-sep3-0900-selected.png` vs `bug-time-00-api-response-sep3.json`). It's listed as unexplained and not carried into `bug-notes.md` as its own note.
- **Risk or ambiguity:** If the UI sends the wrong slot, patients get booked at a different time than they chose. That is a separate and more severe defect than the display shift in BUG-01.
- **Suggested improvement:** Reproduce with DevTools → Network open and capture the `POST /api/appointments` request body. If the body says `10:00`, it's a UI bug; if it says `09:00`, it's the server. Then file it as its own bug note.

### Issue 10 (minor) — `doctor-02` doesn't show which account made the call

- **Issue found (with evidence):** The evidence README says the API screenshot "does not show the logged-in name — confirmed verbally".
- **Risk or ambiguity:** A reviewer can't verify the claim "the API returns the data to the doctor" from the evidence alone.
- **Suggested improvement:** Next time, capture `GET /api/auth/session` (it shows `role` and name) in the same screenshot or next to it.

### Issue 11 (minor) — RISK-01 edit/cancel gap is easy to close

- **Issue found (with evidence):** The coverage estimate is 60% because edit/cancel on another patient's ID wasn't tested.
- **Risk or ambiguity:** Read access being blocked doesn't prove write access is. `PUT` and `DELETE` are separate server handlers.
- **Suggested improvement:** Reuse the A/B setup: as A, send `PUT` and `DELETE` to B's appointment id and expect `404`/`403`, with B as the control again. In my Monday session both returned `404` for another patient's appointment (my session report, "Patient role — list, detail, edit, cancel" — `trainees/development/submissions/monday/adriana-chipana/exploratory-charter.md`), so this should close RISK-01 quickly.

---

## Summary

By priority:

- **High**
  - Issue 1 — Risk register: RISK-04 probability is contradicted by the UI.
  - Issue 2 — Risk register: race condition not separated from double-booking; the planned test can't prove it.
  - Issue 9 — Session report: "stored 10:00 vs selected 09:00" not followed up.
- **Medium**
  - Issue 3 — Risk register: Testing Approach left as "Not tested today" (RISK-07/08/09).
  - Issue 4 — Risk register: RISK-02 scope is narrower than the BUG-01 evidence.
  - Issue 5 — Risk register: RISK-06 unverified; likely also a permission leak.
  - Issue 7 — Session report: actual duration vs. time-box missing.
  - Issue 8 — Session report: browser vs page cause can be isolated in one browser.
- **Low**
  - Issue 6 — Risk register: RISK-09 mixes two causes.
  - Issue 10 — Evidence: logged-in account not visible in `doctor-02`.
  - Issue 11 — Session report: edit/cancel on another patient's id not tested.

Overall: the session work is careful — the control test and the "Proves / Does not prove" index are the strongest parts. The register would gain the most from re-scoring RISK-02, RISK-04 and RISK-06 with the evidence the session already produced.
