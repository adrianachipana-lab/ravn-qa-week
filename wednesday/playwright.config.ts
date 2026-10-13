import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: path.join(__dirname, 'tests'),
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
      name: 'ui-ac',
      testMatch: ['med101-*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'ui',
      testMatch: ['own-scenarios/*.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
