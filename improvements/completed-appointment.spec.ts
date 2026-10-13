import { test, expect, request as playwrightRequest } from '@playwright/test';

// Paulo TP16, C01–C03: completed appointment must not show edit or cancel buttons.
//
// Strategy: search the patient's appointment list for an existing completed appointment.
// If none exists, document the blocker. We do NOT create-then-complete because neither
// patient nor doctor accounts can change status to 'completed' via API (verified Oct 13).
// The test fixture is a pre-existing completed appointment — it must not be modified or deleted.

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function apiLoginAs(baseURL: string, email: string, password: string) {
  const api = await playwrightRequest.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, json: 'true' },
  });
  const session = await (await api.get('/api/auth/session')).json();
  if (session?.user?.email !== email) throw new Error(`Login failed for ${email}`);
  return api;
}

test.describe('Completed appointment — no edit/cancel actions (TP16, C01–C03)', () => {
  // This test does NOT create data — it uses a pre-existing completed appointment.
  // Nothing to clean up. The fixture must remain intact for future runs.

  test('completed appointment has no edit or cancel buttons', async ({ page, baseURL }) => {
    const patientEmail = envRequired('PATIENT_EMAIL');
    const patientPassword = envRequired('PATIENT_PASSWORD');
    const patientApi = await apiLoginAs(baseURL!, patientEmail, patientPassword);

    try {
      // Step 1: Find a completed appointment in the patient's list
      const listRes = await patientApi.get('/api/appointments');
      expect(listRes.status(), 'GET /api/appointments must succeed').toBe(200);
      const listBody = await listRes.json();
      const items: Array<{ id: string; status: string }> = listBody.data ?? [];

      const completedAppt = items.find((a) => a.status === 'completed');

      if (!completedAppt) {
        test.info().annotations.push({
          type: 'blocker',
          description: [
            `No completed appointments found for ${patientEmail}.`,
            `Total appointments: ${items.length}.`,
            `Statuses found: ${[...new Set(items.map((a) => a.status))].join(', ') || 'none'}.`,
            `Blocker: neither patient nor doctor API allows PATCH/PUT status to 'completed' (verified Oct 13).`,
            `Resolution: need a completed appointment fixture in the test data, or an admin/facilitator endpoint.`,
          ].join('\n'),
        });
        expect(completedAppt, 'No completed appointment available — see blocker annotation').toBeTruthy();
        return;
      }

      const appointmentId = completedAppt.id;
      test.info().annotations.push({
        type: 'setup',
        description: `Using existing completed appointment ${appointmentId}`,
      });

      // Step 2: Verify via API that status is really 'completed'
      const getRes = await patientApi.get(`/api/appointments/${appointmentId}`);
      expect(getRes.status()).toBe(200);
      const { data: appointment } = await getRes.json();
      expect(appointment.status, 'appointment must be completed').toBe('completed');

      // Step 3: Login via UI and navigate to the appointment detail
      await page.goto('/login');
      await page.getByTestId('login-email-input').fill(patientEmail);
      await page.getByTestId('login-password-input').fill(patientPassword);
      await page.getByTestId('login-submit-btn').click();
      await expect(page).toHaveURL(/\/dashboard$/);

      await page.goto(`/appointments/${appointmentId}`);
      await page.waitForLoadState('networkidle');

      // Step 4: Verify no edit or cancel buttons
      const cancelBtn = page.getByTestId('cancel-appointment-btn');
      const editBtn = page.getByTestId('edit-appointment-btn');

      await expect(cancelBtn, 'Cancel button must not exist for completed appointment').toHaveCount(0);
      await expect(editBtn, 'Edit button must not exist for completed appointment').toHaveCount(0);

      // Step 5: Verify status badge shows completed
      const statusBadge = page.getByTestId('status-badge-completed');
      await expect(statusBadge, 'Status badge should show completed').toBeVisible();
    } finally {
      // No cleanup — we did not create any data
      await patientApi.dispose();
    }
  });
});
