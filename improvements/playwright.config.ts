import 'dotenv/config';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const authDir = path.join(__dirname, '..', 'auth');

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
    // Auth setup — creates storageState files for reuse
    {
      name: 'auth-setup',
      testDir: path.join(__dirname, '..', 'shared'),
      testMatch: ['auth.setup.ts'],
    },
    {
      name: 'accessibility',
      testMatch: ['accessibility.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(authDir, 'patient.storageState.json'),
      },
      dependencies: ['auth-setup'],
    },
    {
      name: 'concurrency',
      testMatch: ['concurrency.spec.ts'],
      // Concurrency test manages its own sessions (two different patients)
    },
    {
      name: 'performance',
      testMatch: ['performance.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      // Performance test manages its own auth to measure login time
    },
    {
      name: 'completed-appointment',
      testMatch: ['completed-appointment.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
      // Manages its own login for the UI verification step
    },
  ],
});
