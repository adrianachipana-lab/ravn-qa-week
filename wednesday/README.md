# Wednesday — Adriana Chipana (Development)

Test scenarios and the first Playwright UI tests for appointment booking and cancellation, written against the reference Gherkin AC (MEDIC-101).

## Deliverables

1. **[scenarios.md](scenarios.md)** — 12 own scenarios (positive, negative, boundary, edge) with the template fields and which to automate now or later.
2. **[tests/](tests/)** — Playwright UI tests in TypeScript.
   - **Required, against the reference AC:**
     - `med101-01-book-open-slot.spec.ts` → SCEN-MED101-01 (High)
     - `med101-02-taken-slot-disabled.spec.ts` → SCEN-MED101-02 (High)

     They **fail by design** on today's build: they encode the AC, and the app doesn't implement it yet.
   - **Extra, own scenarios (pass):** `own-scenarios/book-appointment.spec.ts` (SC-01), `own-scenarios/cancel-appointment.spec.ts` (SC-02).
   - `helpers.ts` — shared login, doctors, date/slot picker.
3. **[ac-gap-report.md](ac-gap-report.md)** — every failing assertion: which scenario, what the AC requires, what the app does, which one is wrong; plus where the AC itself is wrong or unclear.
4. **[run-log.md](run-log.md)** — branch and commit, command, 3 identical runs from that commit, report and trace paths, what the tests verify, limitations, stability and cleanup.
5. **[reflection.md](reflection.md)** — what Development can do to make the flow more testable, what made testing harder, what to improve before CI.
6. **Stretch — [state-map-hook-audit.md](state-map-hook-audit.md)** — the reference Design state map checked against the app's `data-testid` hooks: present, missing and brittle.
7. **[test-hooks-guide.md](test-hooks-guide.md)** — working notes: hooks per step, assertions to use and avoid.

Peer review of another intern's tests: pending, in its own PR.

## Run

```bash
export PATIENT_EMAIL='<seeded patient 1>'
export SECOND_PATIENT_EMAIL='<seeded patient 2>'
export PATIENT_PASSWORD='<seeded password>'
npx playwright test trainees/development/submissions/wednesday/adriana-chipana/tests
npx playwright show-report
```

The patient accounts come from Tuesday's seed (`../../tuesday/adriana-chipana/seed/`). Credentials are never stored in the repo.

## Evidence

- `evidence/run-1.txt`, `run-2.txt`, `run-3.txt` — console output of three consecutive runs from commit `1a6ff2b`, with each failing assertion's expected vs received value.
- `evidence/report-summary.png` — HTML report summary: 4 tests, 2 passed, 2 failed.

**What the evidence proves:**
- The two own-scenario tests pass three times in a row.
- The two AC tests fail three times in a row on exactly the same assertions — they are stable, and every failure is an AC gap documented in `ac-gap-report.md`.

**What it does not prove:**
- That the list's time is correct (not asserted, BUG-06).
- Anything about other browsers.

Traces and failure details stay local only, because they contain the typed password.
