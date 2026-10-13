import 'dotenv/config';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Improvements suite — additional tests beyond the original QA week deliverables.
// These are OUR improvements, not attributed to Paulo's feedback.

export default defineConfig({
  testDir: __dirname,
  outputDir: path.join(__dirname, 'test-results'),

  timeout: 90_000,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: path.join(__dirname, 'playwright-report'), open: 'never' }],
  ],

  use: {
    baseURL: 'https://medapp-nerdery.vercel.app',
    timezoneId: 'America/La_Paz',
    locale: 'en-US',
    trace: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'accessibility',
      testMatch: ['accessibility.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'concurrency',
      testMatch: ['concurrency.spec.ts'],
    },
    {
      name: 'performance',
      testMatch: ['performance.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'completed-appointment',
      testMatch: ['completed-appointment.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
