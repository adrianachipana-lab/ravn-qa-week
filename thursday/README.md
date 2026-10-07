# Thursday — Adriana Chipana (Development)

API tests, regression suite, formal bug reports and Automation Delta for appointment booking and cancellation.

## Deliverables

1. **[bug-reports.md](bug-reports.md)** — 2 formal bug reports, re-reproduced on 2026-10-01 with fresh evidence:
   - BR-01 — double-booking across patients.
   - BR-02 — date/time follows the browser's time zone.
2. **[api-tests/appointments.api.spec.ts](api-tests/appointments.api.spec.ts)** — 3 passing API tests for `POST /api/appointments`:
   - happy path (201 + read-back);
   - auth failure (401 on create, list and read);
   - validation failure (400 `VALIDATION_ERROR` naming the missing fields, and nothing created).
3. **Regression suite** — [regression.config.ts](regression.config.ts): Wednesday's UI tests plus the 3 API tests, in one run and one HTML report, with every red test explained. See "Regression suite" below.
4. **[automation-delta.md](automation-delta.md)** — success-toast assertion added to SC-01 and SC-02, with baseline, 3 reruns and a mutation check.
5. **[failure-triage-verdict.md](failure-triage-verdict.md)** — Failure Triage Lab (`triage-lab/` on the `triage` branch): 6 red tests, 3 product bugs (t01, t03, t05) and 3 test bugs (t02, t04, t06), each with evidence from the failure snapshot, trace and API data.
6. **[peer-review-emmanuel-martinez.md](peer-review-emmanuel-martinez.md)** — peer reproducibility review of Emmanuel Martinez's bug reports (PR #124): both bugs reproduced cold, plus 7 improvements.

7. **Block 2 exercises:**
   - **[bad-bug-report-rewrite.md](bad-bug-report-rewrite.md)** — "Booking is broken" split into its three defects and rewritten as one reproducible report, with the weaknesses removed.
   - **[api-contract-review.md](api-contract-review.md)** — `POST /api/appointments` checked for envelope, status codes, error contracts and unenforced AC. Cases 7 and 8 are both bugs.

Stretch (GitHub Actions on push) not done: a workflow in this shared repo would run on every trainee's push, and it would need the test credentials as repository secrets.

## Regression suite

- **Suite scope** — one config, [regression.config.ts](regression.config.ts), three projects, one HTML report:
  - `ui-ac` — Wednesday's 2 required UI tests, written against the reference AC (MEDIC-101): SCEN-MED101-01 and SCEN-MED101-02.
  - `ui` — Wednesday's 2 own-scenario UI tests: SC-01 (book) and SC-02 (cancel).
  - `api` — Thursday's 3 API tests.
- **How to run locally** (from the repo root):
  ```bash
  npm install && npx playwright install chromium
  export PATIENT_EMAIL='<test patient 1>'
  export SECOND_PATIENT_EMAIL='<test patient 2>'   # used by SCEN-MED101-02
  export PATIENT_PASSWORD='<their password>'
  npx playwright test -c trainees/development/submissions/thursday/adriana-chipana/regression.config.ts
  npx playwright show-report trainees/development/submissions/thursday/adriana-chipana/playwright-report
  ```
  Run one group only with `--project=ui-ac`, `--project=ui` or `--project=api`.
- **Prerequisites / test data:**
  - Patient accounts: any two patient accounts work; the runs used two throwaway accounts from Tuesday's seed (`../../tuesday/adriana-chipana/seed/`). Credentials are read from the environment and never stored.
  - Doctors: Dr. Sarah Mitchell (ui-ac) and Dr. Michael Thompson (ui, api).
  - Each test creates the appointment it needs and cancels it at the end.
- **What each test covers:**
  - **SCEN-MED101-01** — patient books Dr. Mitchell at 14:00 on a future working day.
    - Hard checks: 201 with the picked date and slot; row shown as Scheduled.
    - AC checks: the AC's exact confirmation message; the slot is no longer offered to other patients.
  - **SCEN-MED101-02** — a slot booked by patient 1 is opened by patient 2 in the UI.
    - AC checks: the slot is disabled, marked `data-available="false"`, labelled "Unavailable", and can't be used to continue.
    - Hard check: no booking request is sent.
  - **SC-01** — patient books through the UI: 201 with the picked date and slot, success toast, row shown as Scheduled.
  - **SC-02** — patient cancels through the UI: 200 `cancelled`, success toast, row shown as Cancelled; the cancelled detail has no Edit/Cancel.
  - **API happy path** — authenticated `POST` → 201; the body matches the request with status `scheduled`; read-back and list include it.
  - **API auth failure** — no session → 401 `UNAUTHORIZED` on create, list and read.
  - **API validation** — empty body → 400 naming all four required fields; missing `reason` → exact error envelope; the patient's appointment count is unchanged.
- **Total runtime:** 67 s for the 7 tests ([`evidence/regression-full-run.txt`](evidence/regression-full-run.txt)). The limit is 5 minutes.
- **Failure artifacts produced:**
  - Screenshot, trace and video, kept only for failing tests (`retain-on-failure` / `only-on-failure`), in `test-results/`.
  - In the full run, both red tests produced `test-failed-1.png` and `trace.zip`; the 5 green tests produced none, so no typed password is stored for them.
  - `test-results/` and `playwright-report/` are git-ignored, because failure traces contain the typed password.

### Explaining the red

The seeded defects stay on all day (facilitator update, `trainees/development/submissions/README.md`), so the suite is not expected to be green. Result of the full run: **2 red, 5 green**.

I can't switch the seeded defects off (that's admin-only), so "planted" vs "feature never built" is a judgment from what the app exposes, not a verified toggle. The reasoning is on each line.

- **SCEN-MED101-01 — Feature never built.**
  - It fails on the AC's confirmation message. The AC asks for "Your appointment with Dr. Sarah Mitchell on `<date>` at 14:00 has been confirmed"; the app only has one fixed, generic toast ("Appointment booked successfully"), with no doctor, date or time to fill in.
  - Its second failing check — the booked slot is still offered as available — is most likely a **planted bug**: the slots endpoint already returns a per-slot `available` flag, so availability is modelled and only its value is wrong.
  - With defects off, I'd expect that second check to pass and the test to stay red on the message alone.
- **SCEN-MED101-02 — Planted bug (most likely).**
  - The plumbing for a taken slot already exists: each slot carries `data-available`, and slot buttons have a disabled style (`disabled:opacity-50`).
  - What fails is the *value*: a booked slot comes back `available: true`, so it's enabled, selectable and not disabled. With correct availability, three of its four failing checks should pass.
  - The fourth — the "Unavailable" label — may be **feature never built**: the slot buttons only ever render the time. If it's still red with defects off, that's the reason.
  - Not a test bug: each check asserts exactly what SCEN-MED101-02 says ("rendered as disabled and cannot be highlighted or selected", "labeled 'Unavailable'").

Nothing in the run is a **test bug** or a **genuine bug** that I can separate from the seeded defects. MEDIC-101 also lists a `409` on collision and a slot hold, which the facilitator names as features never built. My two tests don't assert them, because neither is observable through the UI today.

### What I'd expect to break first

The 5 green tests:

- **SC-01's success-toast check** is the most fragile. The toast lasts a few seconds and has no hook of its own, so a slower deploy or a shorter toast would turn it red before anything functional broke.
- **API validation** would break first if input validation regressed: it asserts the exact `VALIDATION_ERROR` envelope and message, so any change to required fields or error wording shows up immediately.
- **API auth failure** would catch a dropped session check on create, list or read — the most serious regression this suite covers.
- **Blind spots** — what would *not* break:
  - The API happy path checks that the new appointment is in the patient's list, not that the list contains *only* the patient's appointments. A defect that leaked other patients' rows into the list would pass this suite.
  - No green test asserts a displayed time, so a time-zone change would only show in the red `ui-ac` tests.

## Evidence

- `evidence/regression-full-run.txt` — the full suite (7 tests: 2 red, 5 green), 67 s.
- `evidence/regression-baseline.txt` — `ui` + `api` projects before the Automation Delta: 5/5 passed.
- `evidence/regression-run-1.txt` … `-3.txt` — `ui` + `api` after the delta, three consecutive runs: 5/5 passed each time.
- `evidence/delta-mutation-check.txt` — the new assertion fails when the expected text is wrong.
- `evidence/br-01-double-booking-repro.json`, `br-02-timezone-repro.json`, `br-02-detail-lima.png` — fresh reproductions for the bug reports.
- `evidence/triage-data.json`, `triage-t01/t02/t04/t06-failure.png` — data and failure screenshots behind the triage verdicts.
- `evidence/peer-review-bug017-repro.json`, `peer-review-bug010-repro.json` — the reproduction runs behind the peer review.

**What it proves:**
- The suite runs in about a minute.
- The 5 green tests pass repeatedly.
- The 2 red tests fail on the same AC checks every time, and each failure is explained above.
- Failures leave screenshots and traces.
- Both reported bugs still reproduce on 2026-10-01.

**What it does not prove:** behaviour in other browsers, or under real concurrent load.
