# Exercise — Bad Bug Report Rewrite

Author: Adriana Chipana · Track: Development · Day: Thursday

Source: `exercises/thursday/bad-bug-report.md` ("Booking is broken").

## Triage of the original

The original describes **three different defects** and an opinion. Only one of them has enough detail to reproduce:

1. **"Two people ended up with the same appointment"** — double-booking. This is the one the steps point at, so it's the report below.
2. **"The times look weird sometimes"** — the date/time display shift. Already filed as BR-02 in [bug-reports.md](bug-reports.md); it gets its own report, not a line in this one.
3. **"The dashboard numbers might be off"** — the reporter says they "didn't check properly". The Failure Triage Lab confirmed it is three separate counter bugs (total, completed, upcoming) — see [failure-triage-verdict.md](failure-triage-verdict.md), t01/t03/t05. Not part of this report.

These sentences are feelings or guesses, not observations, so they're dropped:
- "the whole scheduling module feels rushed"
- "this is urgent, we cannot ship like this"
- "it worked fine last week I think"

## Rewritten report

- **Title:** A second patient can book the same doctor, date and time slot that another patient already booked
- **Summary:** After patient A books a slot, the slot is still offered as available and patient B can book it too. Both bookings are accepted (`201`), and the doctor ends up with two scheduled appointments in one slot.
- **Environment:** https://medapp-nerdery.vercel.app — shared training deployment, "Buggy mode ON".
- **Device / Browser:** any. Reproduced through the API (Node.js 20) and in Chromium on macOS.
- **Build / Version:** not exposed by the app. Reproduced on the deployment live on 2026-10-01 at 14:25 UTC.
- **Role / Account:** two different patient accounts (A and B). Any two patient accounts reproduce it.
- **Severity:** Critical — two patients are confirmed for the same visit.
- **Priority:** P1 — fix before release. The booking rule is the core of the feature.
  - Severity says how bad the effect is; priority says how soon it must be fixed. Here both are high, but for different reasons.
  - The original's "Very high" gave a severity and no priority.
- **Preconditions:** Dr. Sarah Mitchell (Mon–Fri 09:00–17:00, 30-minute slots) has no appointment on 2026-11-24 at 15:30.
- **Steps to Reproduce:**
  1. As patient A, open Book appointment → Dr. Sarah Mitchell → 24 Nov 2026 → 15:30 → enter a reason → Review & book → Confirm booking.
  2. As patient B, in another browser, open Book appointment → Dr. Sarah Mitchell → 24 Nov 2026.
  3. Look at the 15:30 slot, select it, enter a reason → Review & book → Confirm booking.
- **Expected Result:** in step 3, 15:30 is shown as unavailable and can't be selected. If patient B's booking still reaches the server, it is rejected with `409 Conflict`. Only patient A's appointment exists.
- **Actual Result:**
  - 15:30 is shown as available and can be selected; patient B's booking is accepted (`201`).
  - `GET /api/doctors/<id>/slots?date=2026-11-24` still returns 15:30 as `available: true` after patient A's booking.
  - The doctor has two scheduled appointments at 15:30.
- **Evidence:** [`evidence/br-01-double-booking-repro.json`](evidence/br-01-double-booking-repro.json) — both requests, both `201` responses with their ids, and slot availability before and after.
- **Impact:** any slot can be overbooked, and nothing tells either patient. The doctor's schedule can't be trusted.
- **Workaround:** none for patients.
- **Known Limitation:**
  - Reproduced with one doctor.
  - The "worked last week" claim from the original can't be checked; there is no earlier evidence.

## What was wrong with the original, and what it would have cost

- **No environment, account or role.** A developer can't tell where to look or with which users.
- **"Book it again" is ambiguous** (same patient or a different one? same slot? which doctor?). Each reading is a different test, so the first hour goes on guessing.
- **Three defects in one report.** Whoever picks it up can fix one and close the ticket, and the other two disappear. Each needs its own owner and its own verification.
- **Severity given, priority missing, no evidence.** It can't be ranked against other work. Without a request, response or screenshot, the developer has to rerun everything before believing it.
- **Opinions mixed with observations** ("feels rushed", "worked fine last week I think"). They add nothing reproducible, and they put the reader on the defensive instead of on the defect.
