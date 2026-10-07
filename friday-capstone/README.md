# Friday Capstone — Adriana Chipana (Development)

**Feature:** MEDIC-108 — patient profile management (`/profile` and `PUT /api/profile`).
- **Reference artifacts:** Product's Gherkin AC and business rules for MEDIC-108 (`trainees/product/belen/friday/gherkin-ac-and-scenarios.md`, `business-rules-catalogue-medic108.md`).
- **No state map:** there is no Design state map for this feature. As the mentor proposed (2026-10-02), the screen's real `data-testid` hooks were audited instead — see "Hooks audit" below.

## Bundle

**Shared:**
1. [risk-register.md](risk-register.md) — 6 risks, scored.
2. [test-plan.md](test-plan.md) — short plan.
3. [feature-map.md](feature-map.md) — state diagram, flow, 10 entries with result.
4. [scenarios.md](scenarios.md) — 8 Gherkin scenarios, `SCEN-MED108-01` to `-08`. In every file, `SC-xx` means a reference AC scenario.
5. [bug-report.md](bug-report.md) — 1 bug with evidence: the changed name isn't shown until the next login.
6. [development-checklist.md](development-checklist.md) — 13 items.

**Development-specific:**

7. `tests/profile-ui.spec.ts` — 1 UI test, passing, built against reference AC SC-01.
8. `tests/profile-api.spec.ts` — API test, passing, built against reference AC SC-03 and SC-04. The requirement asks for reference state-map hooks; none exist for this feature, so the hooks were audited instead (see "Hooks audit").
9. [playwright.config.ts](playwright.config.ts) — runnable suite with an HTML report.
10. This README.
11. [demo-notes.md](demo-notes.md) — demo notes and the demo script.

**Stretch:** [ci/playwright-capstone.yml](ci/playwright-capstone.yml) — a CI workflow for this suite, plus safe reruns and failure artifacts. See "Stretch" below.

The written peer review is done in the 15:45 block and goes in its own PR.

## How to run

From the repo root:

```bash
npm install && npx playwright install chromium
export PATIENT_EMAIL='<test patient for the UI test>'
export API_PATIENT_EMAIL='<another test patient for the API test>'
export PATIENT_PASSWORD='<their password>'   # same for both seeded accounts; else set API_PATIENT_PASSWORD
npx playwright test -c trainees/development/submissions/friday-capstone/adriana-chipana/playwright.config.ts
npx playwright show-report trainees/development/submissions/friday-capstone/adriana-chipana/playwright-report
```

- **Accounts:** any two patient accounts work. The runs used two throwaway accounts from Tuesday's seed (`../../tuesday/adriana-chipana/seed/`). Two accounts keep the UI and API tests from editing the same profile.
- **Credentials:** read from the environment, never stored.
- **Runtime:** about 13 s for the 3 tests.

## What each test covers

**`profile-ui.spec.ts` — reference AC SC-01, "Patient updates display name and phone number via UI"**
- Logs in through the form and opens `/profile`.
- Changes the name (unique, 2–50 characters) and the phone (`+15550199`, the AC's example), then saves.
- Asserts:
  - `PUT /api/profile` → 200;
  - `toast-success` contains "Profile updated", and there is no `toast-error`;
  - after reload, both fields show the new values;
  - the email field is still disabled.
- `afterEach` restores the original name, phone and avatar.

**`profile-api.spec.ts` — reference AC SC-03 and SC-04**
- **SC-03:** without a session, `PUT` and `GET /api/profile` → 401, `error.code` `UNAUTHORIZED`.
- **SC-04:** signed in, `PUT` with a new `email`, `role: "doctor"` and a new name.
  - The name changes; the email and role don't, both in the response and in a fresh read.
  - The session still belongs to the same account.
  - The profile is restored at the end.

## Adapted from the reference AC

The AC describes intent; the app names things differently. The tests follow the app's real hooks and contract, and these differences are findings, not test choices:

- **Field name.** SC-02 sends `displayName`, but the API's field is `name`. `displayName` is silently ignored (200, nothing changes), so SC-02 as written can never pass. The API test uses SC-03 and SC-04 instead, which are unaffected.
- **Copy.**
  - Button: "Save Profile" in the AC → "Save changes" in the app (hook `profile-save-btn`).
  - Toast: "Profile updated successfully" in the AC → "Profile updated" in the app (hook `toast-success`).
- **Test data.** The AC's accounts (`patient@test.com`, `nerd2@test.com`, `candidate@test.com`) are shared or another trainee's. The tests use throwaway accounts.
- **Scenarios not automated green:**
  - SC-05 (phone validation) and SC-06 (name 2–50) fail today.
  - SC-09 (real-time name propagation) fails even after reload — see `bug-report.md`.
  - SC-10 (audit log) has nothing to observe.

  All are written up in `scenarios.md` and `development-checklist.md`.

## Hooks audit (in place of the Design state map)

The `/profile` screen was checked idle, while saving (request held with `page.route`), after saving, and with a forced server error (`evidence/profile-hook-audit.json`).

- **Present:**
  - `page-title`, `profile-card`, `profile-form`;
  - `profile-name-input`, `profile-email-input` (disabled), `profile-phone-input`, `profile-avatar-input` (disabled);
  - `profile-save-btn`;
  - `toast-container` with `toast-success` / `toast-error`.

  Labels are linked to their inputs (`for=`).
- **Saving state:** the button reads "Saving…" and is disabled; there's no dedicated hook, but the `disabled` attribute is enough to assert it.
- **Missing:**
  - **Field-level validation hooks:** the form has no validation messages at all, so there is nothing to hook.
  - **Avatar:** no image or preview element.
  - **Helper text:** no hook for "Avatar uploads not yet implemented".
- **Correction to earlier work:** this audit shows each toast has its own hook (`toast-success`, `toast-error`). Wednesday's state map audit said the toast had no hook of its own; that was wrong.

## Evidence

- `evidence/run-1.txt`, `run-2.txt`, `run-3.txt` — three consecutive green runs (3/3 each, ~13 s).
- `evidence/profile-api-exploration.json` — what `PUT /api/profile` accepts and ignores.
- `evidence/profile-hook-audit.json` — the hooks audit.
- `evidence/bug-01-*.png`, `bug-01-stale-name-repro.json` — the bug report's reproduction.

**What it proves:**
- The update-and-persist path and the identity-field protection work, and are guarded by tests that pass repeatedly and clean up after themselves.

**What it does not prove:**
- Validation, name propagation and audit — they fail or don't exist, and are documented instead.
- Other browsers.

Failure artifacts (screenshot, trace, video) are kept only when a test fails, and they're git-ignored because a UI failure trace contains the typed password.

## Known limitations

- Chromium only.
- The doctor's view of a renamed patient was not captured.
- The empty-phone and trimmed-length rules are open in the reference business rules.

## Stretch

**Cleanup so the tests can be rerun safely**
- Each test snapshots the profile before changing it and restores it afterwards (`afterEach` in the UI test, `finally` in the API test), even when an assertion fails.
- The two tests use different accounts and run one at a time, so they never edit the same profile.

**Failure artifacts**
- A failing test keeps a screenshot and a video, and locally also a trace.
- A passing run keeps none.

**CI — `ci/playwright-capstone.yml`**
- **What it does:**
  - Runs the suite on GitHub Actions when a pull request changes this folder, or on demand from the Actions tab.
  - Installs the dependencies and Chromium, then runs the same command as "How to run".
  - Uploads the HTML report on every run, and the screenshots and videos when a test fails. Both are kept for 7 days.
- **Design choices:**
  - **Only this folder triggers it,** so other trainees' pushes never run it.
  - **One run at a time** (`concurrency`), because the tests edit real profiles in a shared environment.
  - **Credentials come from repository secrets,** never from the file.
  - **Traces are off in CI** (`process.env.CI` in `playwright.config.ts`). CI artifacts are visible to everyone with repo access, and a UI trace records the typed password; the screenshot and video only show it masked.
- **To enable it:**
  1. Copy the file to `.github/workflows/playwright-capstone.yml`. GitHub only runs workflows from that folder, so where it is now it stays inactive.
  2. Add three repository secrets: `CAPSTONE_PATIENT_EMAIL`, `CAPSTONE_API_PATIENT_EMAIL` and `CAPSTONE_PATIENT_PASSWORD`.
  3. Open a pull request that touches this folder, or run it from the Actions tab.
- **Next improvement:** log in once through the API and reuse the session (`storageState`). The password would never be typed in the browser, so traces could be turned back on in CI.
