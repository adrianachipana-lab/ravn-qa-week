# Tuesday — Adriana Chipana (Development)

Test planning, site mapping and test data for MediBook appointment **booking and cancellation**.

## Deliverables

1. **[site-map.md](site-map.md)** — every page, per role (patient, doctor, no session), with states, key actions, the API calls each page makes and its `data-testid` hooks. Includes a diagram of the navigation.
2. **[feature-map.md](feature-map.md)** — booking and cancellation (plus edit): state diagram, flow diagrams, and one entry per screen/state with happy, alternate and error paths, the API call, the test data and the observed result.
3. **[test-plan.md](test-plan.md)** — short plan following the template, 20 prioritised scenarios (4 added after the mentor's rulings) linked to Monday's risks and to the feature map, and step-by-step run instructions.
4. **[test-data-sheet.md](test-data-sheet.md)** — 5 patients, 3 doctors in 3 specialties and 10 appointments in 3 states, plus read-only references for the `completed` state.
5. **[test-run.md](test-run.md)** — dry run of all 20 scenarios with the seeded data: result per scenario, evidence and bug link. Outcome: no-go (7 pass, 12 fail, 1 partial).
6. **Stretch — [seed/](seed/README.md)** — a Node script that recreates the whole data set through the API, with verify (entry check) and cleanup modes.

Peer review of another intern's plan: pending, in its own PR.

## Evidence

[evidence/README.md](evidence/README.md) lists every screenshot and captured API response with what it shows, what it proves and what it does not prove, plus a timed capture log.

## Suggested reading order

1. Site map
2. Feature map
3. Test data sheet
4. Test plan
5. Test run

The test plan refers to the ids defined in the other three documents; the test run records its first execution.
