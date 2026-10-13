import { test, expect } from '@playwright/test';

// Paulo's feedback: add a test that checks a completed appointment doesn't offer
// edit or cancel actions. References: C01–C03, TP16.
//
// Strategy: use DOCTOR account to mark an appointment as completed, then verify
// as the PATIENT that the appointment detail page has no edit/cancel buttons.
// Patient accounts cannot change status to completed — only doctors can.

const DOCTOR_ID = '6aa85e2fb0083185ed54c887'; // Dr. Sarah Mitchell — assigned to nerd1

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function apiLoginAs(baseURL: string, email: string, password: string) {
  const { request } = await import('@playwright/test');
  const api = await request.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, json: 'true' },
  });
  const session = await (await api.get('/api/auth/session')).json();
  if (session?.user?.email !== email) throw new Error(`Login failed for ${email}`);
  return api;
}

function futureWorkingDay(): string {
  const day = new Date();
  day.setDate(day.getDate() + 35 + Math.floor(Math.random() * 21));
  while (![1, 2, 3, 4, 5].includes(day.getDay())) day.setDate(day.getDate() + 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

test.describe('Completed appointment — no edit/cancel actions (TP16, C01–C03)', () => {
  let patientApi: Awaited<ReturnType<typeof apiLoginAs>> | null = null;
  let doctorApi: Awaited<ReturnType<typeof apiLoginAs>> | null = null;
  let appointmentId: string | null = null;

  test.afterEach(async () => {
    if (appointmentId && patientApi) {
      await patientApi.delete(`/api/appointments/${appointmentId}`).catch(() => {});
    }
    if (patientApi) await patientApi.dispose();
    if (doctorApi) await doctorApi.dispose();
  });

  test('completed appointment has no edit or cancel buttons', async ({ page, baseURL }) => {
    const patientEmail = envRequired('PATIENT_EMAIL');
    const patientPassword = envRequired('PATIENT_PASSWORD');
    const doctorEmail = process.env.DOCTOR_EMAIL ?? 'doctor1@test.com';
    const doctorPassword = process.env.DOCTOR_PASSWORD ?? 'Doctor1234!';

    patientApi = await apiLoginAs(baseURL!, patientEmail, patientPassword);
    doctorApi = await apiLoginAs(baseURL!, doctorEmail, doctorPassword);

    // Step 1: Patient creates an appointment
    const date = futureWorkingDay();
    const createRes = await patientApi.post('/api/appointments', {
      data: {
        doctorId: DOCTOR_ID,
        date,
        timeSlot: '10:00',
        reason: `QA TP16 completed-test ${Date.now()}`,
      },
    });
    expect(createRes.status(), 'patient creates appointment').toBe(201);
    const { data: created } = await createRes.json();
    appointmentId = created.id;
    expect(created.status).toBe('scheduled');

    // Step 2: Doctor marks it as completed
    // Try PATCH first, then PUT — the API contract may vary
    let completed = false;
    for (const method of ['patch', 'put'] as const) {
      const res = await doctorApi[method](`/api/appointments/${appointmentId}`, {
        data: { status: 'completed' },
      });
      if (res.status() === 200) {
        const body = await res.json();
        if (body.data?.status === 'completed') {
          completed = true;
          break;
        }
      }
    }

    if (!completed) {
      // Try the patient changing status — some apps allow it
      for (const method of ['patch', 'put'] as const) {
        const res = await patientApi[method](`/api/appointments/${appointmentId}`, {
          data: { status: 'completed' },
        });
        if (res.status() === 200) {
          const body = await res.json();
          if (body.data?.status === 'completed') {
            completed = true;
            break;
          }
        }
      }
    }

    if (!completed) {
      // Search for any already-completed appointment in the patient's list
      const listRes = await patientApi.get('/api/appointments');
      if (listRes.ok()) {
        const listBody = await listRes.json();
        const items = listBody.data ?? listBody.appointments ?? [];
        const completedAppt = items.find((a: { status: string }) => a.status === 'completed');
        if (completedAppt) {
          appointmentId = completedAppt.id;
          completed = true;
          test.info().annotations.push({
            type: 'setup',
            description: `Used existing completed appointment ${appointmentId} (could not create one programmatically)`,
          });
        }
      }
    }

    if (!completed) {
      test.info().annotations.push({
        type: 'blocker',
        description: 'Cannot obtain a completed appointment: doctor PATCH/PUT rejected, patient PATCH/PUT rejected, no existing completed appointments found. Need: (1) a doctor endpoint that accepts status changes, or (2) a pre-completed fixture.',
      });
      expect(completed, 'No completed appointment available — see blocker annotation').toBe(true);
      return;
    }

    // Step 3: Verify the appointment is completed via GET
    const getRes = await patientApi.get(`/api/appointments/${appointmentId}`);
    expect(getRes.status()).toBe(200);
    const { data: appointment } = await getRes.json();
    expect(appointment.status, 'appointment must be completed').toBe('completed');

    // Step 4: Patient logs in via UI and navigates to the appointment
    await page.goto('/login');
    await page.getByTestId('login-email-input').fill(patientEmail);
    await page.getByTestId('login-password-input').fill(patientPassword);
    await page.getByTestId('login-submit-btn').click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.goto(`/appointments/${appointmentId}`);
    await page.waitForLoadState('networkidle');

    // Step 5: Verify no edit or cancel buttons for completed appointment
    const cancelBtn = page.getByTestId('cancel-appointment-btn');
    const editBtn = page.getByTestId('edit-appointment-btn');

    await expect(cancelBtn, 'Cancel button must not exist for completed appointment').toHaveCount(0);
    await expect(editBtn, 'Edit button must not exist for completed appointment').toHaveCount(0);

    // Verify the status badge shows completed
    const statusBadge = page.getByTestId('status-badge-completed');
    await expect(statusBadge, 'Status badge should show completed').toBeVisible();
  });
});
