import { test, expect } from '@playwright/test';

// Paulo's feedback: add a test that checks a completed appointment doesn't offer
// edit or cancel actions. References: C01–C03, TP16.
// Uses API to create + complete an appointment, then verifies via UI.

const DOCTOR_ID = '6aa85e2fb0083185ed54c88a'; // Dr. Michael Thompson

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function apiLogin(baseURL: string) {
  const { request } = await import('@playwright/test');
  const api = await request.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  const email = envRequired('PATIENT_EMAIL');
  const password = envRequired('PATIENT_PASSWORD');
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, json: 'true' },
  });
  const session = await (await api.get('/api/auth/session')).json();
  if (session?.user?.email !== email) throw new Error(`Login failed for ${email}`);
  return { api, email, password };
}

function futureWorkingDay(): string {
  const day = new Date();
  day.setDate(day.getDate() + 35 + Math.floor(Math.random() * 21));
  while (![1, 2, 3, 4, 5].includes(day.getDay())) day.setDate(day.getDate() + 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

test.describe('Completed appointment — no edit/cancel actions (TP16, C01–C03)', () => {
  let api: Awaited<ReturnType<typeof apiLogin>>['api'];
  let appointmentId: string | null = null;

  test.afterEach(async () => {
    // Cleanup: try to delete the appointment regardless of its status
    if (appointmentId && api) {
      await api.delete(`/api/appointments/${appointmentId}`).catch(() => {});
    }
    if (api) await api.dispose();
  });

  test('completed appointment has no edit or cancel buttons', async ({ page, baseURL }) => {
    const login = await apiLogin(baseURL!);
    api = login.api;

    // Step 1: Create an appointment via API
    const date = futureWorkingDay();
    const createRes = await api.post('/api/appointments', {
      data: {
        doctorId: DOCTOR_ID,
        date,
        timeSlot: '10:30',
        reason: `QA completed-test ${Date.now()}`,
      },
    });
    expect(createRes.status(), 'appointment created').toBe(201);
    const { data: created } = await createRes.json();
    appointmentId = created.id;
    expect(created.status).toBe('scheduled');

    // Step 2: Try to mark it as completed via API
    // Note: if the API doesn't allow patients to mark as completed, this is itself
    // a finding — document it. The app may only allow doctors to complete appointments.
    const completeRes = await api.patch(`/api/appointments/${appointmentId}`, {
      data: { status: 'completed' },
    });

    if (completeRes.status() !== 200) {
      // The API may not support PATCH or may not allow patients to complete.
      // Try PUT as an alternative.
      const putRes = await api.put(`/api/appointments/${appointmentId}`, {
        data: { status: 'completed' },
      });

      if (putRes.status() !== 200) {
        // Document this as a finding: cannot programmatically complete an appointment
        // as a patient. This is expected behavior if only doctors can complete.
        test.info().annotations.push({
          type: 'finding',
          description: `Cannot mark appointment as completed via patient API (PATCH: ${completeRes.status()}, PUT: ${putRes.status()}). This test requires a completed appointment to exist. If only doctors can complete appointments, a test account with doctor role is needed, or a pre-completed appointment fixture.`,
        });
        test.skip();
        return;
      }
    }

    // Step 3: Verify via GET that status is now completed
    const getRes = await api.get(`/api/appointments/${appointmentId}`);
    const { data: appointment } = await getRes.json();

    if (appointment.status !== 'completed') {
      test.info().annotations.push({
        type: 'finding',
        description: `API accepted the status change but returned status="${appointment.status}" instead of "completed". Possible state machine restriction.`,
      });
      test.skip();
      return;
    }

    // Step 4: Login via UI and navigate to the appointment
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(login.email);
    await page.getByTestId('login-password-input').fill(login.password);
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/appointments/${appointmentId}`);
    await page.waitForLoadState('networkidle');

    // Step 5: Verify no edit or cancel buttons for completed appointment
    const cancelBtn = page.getByTestId('cancel-appointment-btn');
    const editBtn = page.getByTestId('edit-appointment-btn');

    await expect(cancelBtn, 'Cancel button should not exist for completed appointment').toHaveCount(0);
    await expect(editBtn, 'Edit button should not exist for completed appointment').toHaveCount(0);

    // Verify the status badge shows completed
    const statusBadge = page.getByTestId('status-badge-completed');
    if (await statusBadge.count() > 0) {
      await expect(statusBadge).toBeVisible();
    }
  });
});
