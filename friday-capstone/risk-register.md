# Risk Register — MEDIC-108 Patient Profile Management

Author: Adriana Chipana · Track: Development · Day: Friday (capstone)

Scope: the `/profile` screen and `PUT /api/profile`.
- Rules come from the reference AC and business rules (`trainees/product/belen/friday/`, BR-PROF-001 to -007).
- Probability is informed by what was observed on 2026-10-02 (`evidence/profile-api-exploration.json`, `evidence/bug-01-stale-name-repro.json`).
- Score = Probability (1–5) × Impact (1–5).

## Summary

- **R-01** — Changed name not shown where the patient sees it (stale session name) — 5 × 4 = **20**
- **R-02** — Invalid or empty display name accepted — 5 × 3 = **15**
- **R-03** — Invalid phone number stored, so the clinic can't reach the patient — 5 × 3 = **15**
- **R-04** — A patient changes identity fields (email, role) through the API — 1 × 5 = **5** (low probability today, kept for its impact)
- **R-05** — Profile changes leave no audit trail — 5 × 3 = **15**
- **R-06** — Script or markup in the name is executed somewhere it is displayed — 2 × 5 = **10**

## R-01

- **Risk ID:** R-01
- **Description:** After a patient changes their display name, the app keeps showing the old name in the header and on the dashboard until they log out and back in. Doctors and the patient can see different names for the same person.
- **Affected Roles:** Patient (own header and dashboard), Doctor (sees the stored name).
- **Probability (1-5):** 5 — reproduced every time; the name shown comes from the session token, which is only refreshed at login.
- **Impact (1-5):** 4 — the patient can't confirm the change took effect and may repeat it. Patient and doctor screens disagree, against BR-PROF-006.
- **Risk Score (P x I):** 20
- **Mitigation:** Refresh the session after a profile update, or read the display name from the profile instead of the token.
- **Testing Approach:** Change the name, then check the navbar and dashboard heading without logging out (same tab, after navigation, after reload) and in a second open session.
- **Known Limitation:** The doctor-facing view of a renamed patient was not checked live; it reads the stored name, so it should show the new one.

## R-02

- **Risk ID:** R-02
- **Description:** The display name has no validation. One character, 200 characters and whitespace-only (stored as an empty name) are all accepted, against BR-PROF-005 (required, 2–50).
- **Affected Roles:** Patient, Doctor (sees the name in the schedule), Clinic staff.
- **Probability (1-5):** 5 — every invalid case returned 200.
- **Impact (1-5):** 3 — an empty or meaningless name breaks identification in schedules and greetings.
- **Risk Score (P x I):** 15
- **Mitigation:** Validate the name on the server (trim, 2–50) and mirror it in the form with an inline error.
- **Testing Approach:** Boundary values 1, 2, 50, 51 and whitespace-only, through the UI and `PUT /api/profile`.
- **Known Limitation:** The 2–50 range is a PM decision recorded in the reference business rules. Whether the trimmed or raw length counts isn't specified.

## R-03

- **Risk ID:** R-03
- **Description:** The phone field accepts any text (e.g. `INVALID_PHONE_123`), against BR-PROF-004 (a real, usable number).
- **Affected Roles:** Patient, Clinic staff (can't call).
- **Probability (1-5):** 5 — accepted with 200.
- **Impact (1-5):** 3 — reminders and rescheduling calls fail silently.
- **Risk Score (P x I):** 15
- **Mitigation:** Validate format (E.164 or national) on the server; normalise before storing.
- **Testing Approach:** Valid E.164, valid national format, letters, too short, too long, empty (allowed?), via UI and API.
- **Known Limitation:** Whether an empty phone is allowed is not decided in the reference rules.

## R-04

- **Risk ID:** R-04
- **Description:** A patient changes fields that define their identity or permissions — the sign-in email (BR-PROF-002) or their role — by sending them to `PUT /api/profile`.
- **Affected Roles:** Patient, every other user (privilege escalation).
- **Probability (1-5):** 1 — today both are ignored: the email and the role stay unchanged.
- **Impact (1-5):** 5 — account takeover or a patient acting as a doctor.
- **Risk Score (P x I):** 5
- **Mitigation:** Allow-list the editable fields on the server (name, phone, avatar) and ignore or reject everything else.
- **Testing Approach:** Automated in `tests/profile-api.spec.ts` (reference AC SC-04): send `email` and `role` with a valid name; assert the name changes and the email and role don't.
- **Known Limitation:** Only `email` and `role` were tried, not every stored field (e.g. `doctorId`, `_id`).

## R-05

- **Risk ID:** R-05
- **Description:** Profile changes are not recorded anywhere for audit, against BR-PROF-007.
- **Affected Roles:** Clinic staff, Admin, Patient (disputes).
- **Probability (1-5):** 5 — no audit endpoint, field or UI exists.
- **Impact (1-5):** 3 — a disputed change (e.g. "I never changed my phone") can't be investigated.
- **Risk Score (P x I):** 15
- **Mitigation:** Write an audit entry (field, old value, new value, user, timestamp) on every successful update.
- **Testing Approach:** Once an audit source exists — update one field and assert exactly one matching entry. Until then: not testable; recorded as feature never built.
- **Known Limitation:** Nothing observable to test today.

## R-06

- **Risk ID:** R-06
- **Description:** A display name containing script or HTML is executed or rendered as markup somewhere it is shown.
- **Affected Roles:** Patient, Doctor (sees the name), every user of shared screens.
- **Probability (1-5):** 2 — the name is stored raw, but the profile screen renders it as text and no script ran.
- **Impact (1-5):** 5 — stored XSS in a medical app.
- **Risk Score (P x I):** 10
- **Mitigation:** Keep rendering as text everywhere (no raw HTML), and validate characters on input.
- **Testing Approach:** Save `<script>alert('xss')</script> QA` and watch for dialogs on profile, dashboard, list and the doctor's schedule.
- **Known Limitation:** Because of R-01 the dashboard kept showing the old name, so the new name was only checked on the profile screen and through the API.
