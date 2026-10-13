import path from 'node:path';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: path.join(__dirname, 'api-tests'),
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
  },
});
