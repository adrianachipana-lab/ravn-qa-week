# Development Checklist — MEDIC-108 Patient Profile Management

Author: Adriana Chipana · Track: Development · Day: Friday (capstone)

What Development should have in place before MEDIC-108 ships, checked against the app on 2026-10-02.

**Status:**
- **Done** — in place and verified.
- **Missing** — not in place.
- **Partial** — in place but incomplete.

## 1. Server allow-lists the editable fields

- **Item:** `PUT /api/profile` only applies `name`, `phone` and `avatarUrl`; other fields are ignored or rejected.
- **Why it matters:** stops a patient changing their sign-in email or role (BR-PROF-002, R-04).
- **Evidence:** `tests/profile-api.spec.ts` (reference AC SC-04): `email` and `role` sent → both unchanged; three green runs (`evidence/run-1..3.txt`).
- **Status:** Done
- **Known Limitation:** only `email` and `role` were tried, not every stored field.

## 2. Endpoint requires a session

- **Item:** `GET` and `PUT /api/profile` answer 401 without a session.
- **Why it matters:** only the patient can read or change their profile (BR-PROF-003).
- **Evidence:** `tests/profile-api.spec.ts` (reference AC SC-03).
- **Status:** Done
- **Known Limitation:** the 401 body has an empty `message`, unlike other endpoints' "Not authenticated".

## 3. Name validated on the server

- **Item:** trim, required, 2–50 characters; 400 with a field-level error otherwise.
- **Why it matters:** BR-PROF-005; an empty or 200-character name breaks identification (R-02).
- **Evidence:** `evidence/profile-api-exploration.json` — 1, 51 and 200 characters → 200; whitespace-only saved as `""`.
- **Status:** Missing
- **Known Limitation:** the trimmed-vs-raw length rule is not decided.

## 4. Phone validated on the server

- **Item:** E.164 or valid national format; 400 otherwise.
- **Why it matters:** BR-PROF-004; the clinic must be able to call (R-03).
- **Evidence:** `INVALID_PHONE_123` → 200 (`profile-api-exploration.json`).
- **Status:** Missing
- **Known Limitation:** whether an empty phone is allowed is open.

## 5. Form mirrors the server rules

- **Item:** inline errors, `maxlength`/`required` on the name, a phone pattern.
- **Why it matters:** the patient sees the problem before saving, and tests get a field-level hook.
- **Evidence:** `profile-hook-audit.json` — no `maxlength`, no `required`, no validation messages or hooks.
- **Status:** Missing
- **Known Limitation:** —

## 6. Session refreshed after a profile change

- **Item:** after a successful update, the displayed name (navbar, dashboard) uses the new value without a new login.
- **Why it matters:** BR-PROF-006; the bug in `bug-report.md` (R-01).
- **Evidence:** `evidence/bug-01-*.png`, `bug-01-stale-name-repro.json`.
- **Status:** Missing
- **Known Limitation:** live update on *already open* screens would also need a push mechanism.

## 7. Output is escaped wherever the name is shown

- **Item:** the name is rendered as text on every screen — profile, navbar, dashboard, doctor schedule.
- **Why it matters:** stored XSS (R-06).
- **Evidence:** `<script>` name rendered as text on `/profile`, no dialog.
- **Status:** Partial
- **Known Limitation:** other screens show the old name (item 6), so they weren't verified with the new value.

## 8. Success and error feedback have their own hooks

- **Item:** `toast-success` and `toast-error` for the save result.
- **Why it matters:** users get feedback; tests assert the right outcome without reading colours.
- **Evidence:** `profile-hook-audit.json` — "Profile updated" in `toast-success`; a forced 500 shows "Failed to save profile" in `toast-error`. Used by `tests/profile-ui.spec.ts`.
- **Status:** Done
- **Known Limitation:** the toast is transient.

## 9. Double save prevented

- **Item:** the save button is disabled while the request is in flight.
- **Why it matters:** avoids duplicate writes (the booking flow lacks this — Thursday peer review, BUG-010).
- **Evidence:** `profile-hook-audit.json` — "Saving…", `disabled: true`.
- **Status:** Done
- **Known Limitation:** no dedicated saving-state hook.

## 10. Every profile change is audited

- **Item:** an entry with field, old value, new value, user and timestamp.
- **Why it matters:** BR-PROF-007; disputes and compliance (R-05).
- **Evidence:** no audit endpoint, field or screen exists.
- **Status:** Missing (feature never built)
- **Known Limitation:** nothing to observe today.

## 11. Testability hooks cover every state

- **Item:** hooks for the form, each input, save, success, error, and validation and empty states.
- **Why it matters:** stands in for the missing Design state map (mentor, 2026-10-02).
- **Evidence:** `profile-hook-audit.json`.
  - **Present:** form, card, 4 inputs, save, `toast-success`, `toast-error`.
  - **Missing:** field-level validation hooks, an avatar image/preview hook, a hook for the "not yet implemented" note.
- **Status:** Partial
- **Known Limitation:** —

## 12. Contract matches the AC's field names

- **Item:** the API, the reference AC and the UI agree on field names and copy.
- **Why it matters:** a client following the AC sends `displayName`, which the API silently ignores (200, nothing changes).
- **Evidence:** `profile-api-exploration.json` — `displayName` → 200, name unchanged. AC copy "Save Profile" / "Profile updated successfully" vs the app's "Save changes" / "Profile updated".
- **Status:** Missing
- **Known Limitation:** either side may be the one to change; flagged, not decided.

## 13. Automated tests are independent and leave no trace

- **Item:** each test creates or snapshots its data and restores it; no credentials in the repo or in passing-run artifacts.
- **Why it matters:** safe to rerun in a shared environment.
- **Evidence:**
  - Profiles checked after three runs: back to their original values.
  - Credentials come from the environment.
  - `trace: retain-on-failure`, so passing runs store no trace.
- **Status:** Done
- **Known Limitation:** cancelled or edited data history stays in the shared environment.

**Summary:** 5 done, 2 partial, 6 missing (items 3, 4, 5, 6, 10, 12).
