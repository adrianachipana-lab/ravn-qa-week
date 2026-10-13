import { test, expect } from '@playwright/test';

// Performance measurements on key MediBook pages.
// These are baseline measurements, not approved requirements.
// Thresholds are proposed benchmarks — if they fail, the finding is documented
// but it doesn't mean the app is broken. Product needs to define real SLAs.

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

test.describe('Performance baselines', () => {
  test('login page loads under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - start;

    test.info().annotations.push({
      type: 'metric',
      description: `Login page load: ${loadTime}ms`,
    });

    // Proposed threshold — not an approved requirement
    expect(loadTime, 'Login page load time (proposed < 3000ms)').toBeLessThan(3000);
  });

  test('dashboard loads under 5 seconds after login', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(envRequired('PATIENT_EMAIL'));
    await page.getByTestId('login-password-input').fill(envRequired('PATIENT_PASSWORD'));

    const start = Date.now();
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.waitForLoadState('networkidle');
    const loginToLoad = Date.now() - start;

    test.info().annotations.push({
      type: 'metric',
      description: `Login → Dashboard ready: ${loginToLoad}ms`,
    });

    expect(loginToLoad, 'Login → Dashboard (proposed < 5000ms)').toBeLessThan(5000);
  });

  test('API response times — appointments endpoints', async ({ baseURL }) => {
    const { request } = await import('@playwright/test');
    const api = await request.newContext({ baseURL });

    // Login
    const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
    await api.post('/api/auth/callback/credentials', {
      form: {
        csrfToken,
        email: envRequired('PATIENT_EMAIL'),
        password: envRequired('PATIENT_PASSWORD'),
        json: 'true',
      },
    });

    // Measure GET /api/appointments
    const listStart = Date.now();
    const listRes = await api.get('/api/appointments');
    const listTime = Date.now() - listStart;
    expect(listRes.status()).toBe(200);

    test.info().annotations.push({
      type: 'metric',
      description: `GET /api/appointments: ${listTime}ms (status: ${listRes.status()})`,
    });

    // Measure GET /api/auth/session
    const sessionStart = Date.now();
    const sessionRes = await api.get('/api/auth/session');
    const sessionTime = Date.now() - sessionStart;

    test.info().annotations.push({
      type: 'metric',
      description: `GET /api/auth/session: ${sessionTime}ms`,
    });

    // Measure GET /api/profile
    const profileStart = Date.now();
    const profileRes = await api.get('/api/profile');
    const profileTime = Date.now() - profileStart;

    test.info().annotations.push({
      type: 'metric',
      description: `GET /api/profile: ${profileTime}ms (status: ${profileRes.status()})`,
    });

    // Proposed thresholds — not approved requirements
    expect(listTime, 'Appointments list API (proposed < 2000ms)').toBeLessThan(2000);
    expect(sessionTime, 'Session check API (proposed < 1000ms)').toBeLessThan(1000);
    expect(profileTime, 'Profile API (proposed < 1000ms)').toBeLessThan(1000);

    await api.dispose();
  });
});
