import { expect, type Page } from '@playwright/test';

// Dr. Michael Thompson — General Practice, Mon–Fri 07:00–14:00, 30-minute slots.
// No trainee is assigned to him, so these tests don't add rows to anyone's schedule.
export const DOCTOR = {
  id: '6aa85e2fb0083185ed54c88a',
  name: 'Dr. Michael Thompson',
  option: 'Dr. Michael Thompson — General Practice', // exact text of the <option>, with an em dash
  specialty: 'General Practice',
  workingDays: [1, 2, 3, 4, 5], // 0 = Sunday … 6 = Saturday
  slots: ['08:00', '09:30', '10:30', '11:00', '12:30'], // valid slots inside his shift
};

// Credentials come from the environment so they never end up in the repo.
export function patientCredentials() {
  const email = process.env.PATIENT_EMAIL;
  const password = process.env.PATIENT_PASSWORD;
  if (!email || !password) {
    throw new Error('Set PATIENT_EMAIL and PATIENT_PASSWORD before running the tests.');
  }
  return { email, password };
}

// A unique text for the reason field, so each test can find its own appointment.
export function uniqueReason(label: string) {
  return `QA Wed ${label} ${Date.now()}`;
}

// Picks a random working day for the doctor 4–8 weeks ahead and one of his slots.
// Random, so repeated runs don't keep hitting the same doctor/date/slot.
export function futureSlot() {
  const day = new Date();
  day.setDate(day.getDate() + 28 + Math.floor(Math.random() * 28));
  while (!DOCTOR.workingDays.includes(day.getDay())) day.setDate(day.getDate() + 1);

  const yyyy = day.getFullYear();
  const mm = String(day.getMonth() + 1).padStart(2, '0');
  const dd = String(day.getDate()).padStart(2, '0');
  const time = DOCTOR.slots[Math.floor(Math.random() * DOCTOR.slots.length)];

  // How many times to press "next month" from the month the calendar opens on.
  const now = new Date();
  const monthsAhead = (yyyy - now.getFullYear()) * 12 + (day.getMonth() - now.getMonth());

  return { date: `${yyyy}-${mm}-${dd}`, time, monthsAhead };
}

// Logs in through the real login form and waits for the dashboard.
export async function loginAsPatient(page: Page) {
  await loginAs(page, patientCredentials());
}

// Same login, for any patient (used for the second patient in the AC tests).
export async function loginAs(page: Page, { email, password }: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

// ---------- Reference AC (MEDIC-101) ----------

// The AC uses Dr. Sarah Mitchell: Mon–Fri 09:00–17:00, 30-minute slots.
export const MITCHELL = {
  id: '6aa85e2fb0083185ed54c887',
  name: 'Dr. Sarah Mitchell',
  option: 'Dr. Sarah Mitchell — General Practice',
  specialty: 'General Practice',
  workingDays: [1, 2, 3, 4, 5],
};

// A second patient for scenarios that need two people (the AC's "any other patient").
export function secondPatientCredentials() {
  const email = process.env.SECOND_PATIENT_EMAIL;
  const password = process.env.SECOND_PATIENT_PASSWORD ?? process.env.PATIENT_PASSWORD;
  if (!email || !password) {
    throw new Error('Set SECOND_PATIENT_EMAIL (and SECOND_PATIENT_PASSWORD if it differs) before running the AC tests.');
  }
  return { email, password };
}

// A random working day for Dr. Mitchell 4–8 weeks ahead, with the given slot time.
// The AC's own example dates (2026-09-17/18) are already in the past, so they can't be used as-is.
export function futureMitchellSlot(time: string) {
  const day = new Date();
  day.setDate(day.getDate() + 28 + Math.floor(Math.random() * 28));
  while (!MITCHELL.workingDays.includes(day.getDay())) day.setDate(day.getDate() + 1);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  const now = new Date();
  const monthsAhead = (day.getFullYear() - now.getFullYear()) * 12 + (day.getMonth() - now.getMonth());
  return { date, time, monthsAhead };
}

// Logs in through the API (NextAuth credentials) and returns a request context that
// keeps the session cookie. Used to set up data as a patient without opening a browser.
export async function apiLogin(playwright: typeof import('@playwright/test').request, baseURL: string, email: string, password: string) {
  const api = await playwright.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', { form: { csrfToken, email, password, json: 'true' } });
  const session = await (await api.get('/api/auth/session')).json();
  if (session?.user?.email !== email) throw new Error(`API login failed for ${email}`);
  return api;
}
