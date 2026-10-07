import { expect, request as playwrightRequest, type APIRequestContext, type Page } from '@playwright/test';

// Credentials come from the environment, never from the repo.
// PATIENT_* is used by the UI test, API_PATIENT_* by the API test, so the two tests
// never edit the same profile.
export function credentials(prefix: 'PATIENT' | 'API_PATIENT') {
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`] ?? process.env.PATIENT_PASSWORD;
  if (!email || !password) throw new Error(`Set ${prefix}_EMAIL (and a password) before running the tests.`);
  return { email, password };
}

// Logs in through the real login form and waits for the dashboard.
export async function loginUI(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// Logs in through NextAuth's credentials endpoint; the returned context keeps the session cookie.
export async function loginAPI(baseURL: string, { email, password }: { email: string; password: string }): Promise<APIRequestContext> {
  const api = await playwrightRequest.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', { form: { csrfToken, email, password, json: 'true' } });
  const session = await (await api.get('/api/auth/session')).json();
  expect(session?.user?.email, 'API login must create a session').toBe(email);
  return api;
}

// The editable profile fields, used to restore a profile after a test changed it.
export type ProfileSnapshot = { name: string; phone: string; avatarUrl: string };

export async function snapshot(api: APIRequestContext): Promise<ProfileSnapshot> {
  const { data } = await (await api.get('/api/profile')).json();
  return { name: data.name, phone: data.phone ?? '', avatarUrl: data.avatarUrl ?? '' };
}

export async function restore(api: APIRequestContext, original: ProfileSnapshot) {
  const res = await api.put('/api/profile', { data: original });
  expect(res.status(), 'profile restore').toBe(200);
}
