import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Regression suite — Thursday.
// Wires Wednesday's UI tests and Thursday's three API tests into one run and
// one HTML report. Run from the repo root:
//
//   npx playwright test -c trainees/development/submissions/thursday/adriana-chipana/regression.config.ts
//
// Projects:
//   ui-ac  — Wednesday's 2 required UI tests, written against the reference AC (MEDIC-101).
//            They are red on this build; every failure is classified in README.md.
//   ui     — Wednesday's 2 own-scenario UI tests (SC-01 book, SC-02 cancel).
//   api    — Thursday's 3 API tests.
// The suite is not expected to be green: the seeded defects stay on (facilitator update,
// trainees/development/submissions/README.md).

const repoRoot = path.resolve(__dirname, '..');
const wednesday = 'wednesday/tests';
const thursday = 'thursday/api-tests';

export default defineConfig({
  testDir: repoRoot,
  outputDir: path.join(__dirname, 'test-results'),

  timeout: 90_000,
  retries: 0, // a retry would hide the failure we want to see
  workers: 1, // the UI tests book against the same doctor; keep them sequential
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
  ],

  use: {
    baseURL: 'https://medapp-nerdery.vercel.app',
    timezoneId: 'America/La_Paz', // same as the repo config
    locale: 'en-US',
    // Failure artifacts only: a passing run records no trace, so no typed password is stored.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'ui-ac',
      testMatch: [`${wednesday}/med101-*.spec.ts`],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui',
      testMatch: [`${wednesday}/own-scenarios/*.spec.ts`],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testMatch: [`${thursday}/*.spec.ts`],
    },
  ],
});
