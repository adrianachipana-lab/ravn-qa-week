import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Capstone suite — MEDIC-108 patient profile management.
// One UI test and one API test, one HTML report. Run from the repo root:
//
//   npx playwright test -c trainees/development/submissions/friday-capstone/adriana-chipana/playwright.config.ts

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
  outputDir: path.join(__dirname, 'test-results'),

  timeout: 90_000,
  retries: 0, // a retry would hide the failure we want to see
  workers: 1, // both tests change profiles in a shared environment; keep them sequential
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
  ],

  use: {
    baseURL: 'https://medapp-nerdery.vercel.app',
    timezoneId: 'America/La_Paz',
    locale: 'en-US',
    // Failure artifacts only: a passing run stores no trace, so no typed password is recorded.
    // In CI the trace is off, because its artifacts are visible to everyone with repo access
    // and a UI trace records the typed password; the screenshot and video show it masked.
    trace: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'ui', testMatch: ['profile-ui.spec.ts'], use: { ...devices['Desktop Chrome'] } },
    { name: 'api', testMatch: ['profile-api.spec.ts'] },
  ],
});
