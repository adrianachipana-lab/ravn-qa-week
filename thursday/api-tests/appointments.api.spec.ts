import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';

// API tests for POST /api/appointments — Thursday.
//   1. Happy path      — an authenticated patient books a valid slot → 201, stored as requested
//   2. Auth failure    — no session → 401 on create, list and read; nothing is created
//   3. Validation      — missing required fields → 400 VALIDATION_ERROR naming the fields
//
// Every response is checked against the same envelope: { success, data } on success,
// { success: false, error: { code, message } } on failure (see the reference API output,
// exercises/thursday/reference-api-output.md).

// Dr. Michael Thompson — General Practice, Mon–Fri 07:00–14:00, 30-minute slots.
const DOCTOR = { id: '6aa85e2fb0083185ed54c88a', specialty: 'General Practice', workingDays: [1, 2, 3, 4, 5] };
const SLOTS = ['08:30', '09:00', '10:00', '11:30', '12:00'];

// A random working day 4–8 weeks ahead, so runs don't reuse the same doctor/date/slot.
function futureSlot() {
  const day = new Date();
  day.setDate(day.getDate() + 28 + Math.floor(Math.random() * 28));
  while (!DOCTOR.workingDays.includes(day.getDay())) day.setDate(day.getDate() + 1);
  const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  return { date, timeSlot: SLOTS[Math.floor(Math.random() * SLOTS.length)] };
}

// Logs in through NextAuth's credentials endpoint and returns a request context that
// carries the session cookie. Credentials come from the environment, never from the repo.
async function loginPatient(baseURL: string): Promise<APIRequestContext> {
  const email = process.env.PATIENT_EMAIL;
  const password = process.env.PATIENT_PASSWORD;
  if (!email || !password) throw new Error('Set PATIENT_EMAIL and PATIENT_PASSWORD before running the API tests.');

  const api = await playwrightRequest.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', { form: { csrfToken, email, password, json: 'true' } });
  const session = await (await api.get('/api/auth/session')).json();
  expect(session?.user?.email, 'API login must create a patient session').toBe(email);
  return api;
}

test.describe('API — POST /api/appointments', () => {
  test('happy path: authenticated patient books a valid slot (201)', async ({ baseURL }) => {
    const patient = await loginPatient(baseURL!);
    const slot = futureSlot();
    const reason = `QA Thu API happy ${Date.now()}`;
    let createdId: string | undefined;

    try {
      const res = await patient.post('/api/appointments', {
        data: { doctorId: DOCTOR.id, date: slot.date, timeSlot: slot.timeSlot, specialty: DOCTOR.specialty, reason },
      });

      // Status and envelope
      expect(res.status()).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      createdId = body.data._id;

      // Contract: the stored appointment is exactly what was requested, and starts as scheduled.
      expect(body.data).toMatchObject({
        doctorId: DOCTOR.id,
        timeSlot: slot.timeSlot,
        specialty: DOCTOR.specialty,
        reason,
        status: 'scheduled',
      });
      expect(body.data.date.startsWith(slot.date)).toBe(true);
      expect(typeof body.data._id).toBe('string');

      // Read-back: the same patient can fetch it, and it's in their list.
      const read = await patient.get(`/api/appointments/${createdId}`);
      expect(read.status()).toBe(200);
      expect((await read.json()).data.status).toBe('scheduled');

      const list = await patient.get(`/api/appointments?search=${encodeURIComponent(reason)}`);
      const ids = (await list.json()).data.map((a: { _id: string }) => a._id);
      expect(ids).toContain(createdId);
    } finally {
      // Cleanup even if an assertion failed.
      if (createdId) await patient.delete(`/api/appointments/${createdId}`);
      await patient.dispose();
    }
  });

  test('auth failure: requests without a session are rejected (401)', async ({ baseURL }) => {
    const anonymous = await playwrightRequest.newContext({ baseURL }); // no session cookie
    const slot = futureSlot();

    // Create: a fully valid body must still be refused without a session.
    const create = await anonymous.post('/api/appointments', {
      data: { doctorId: DOCTOR.id, date: slot.date, timeSlot: slot.timeSlot, specialty: DOCTOR.specialty, reason: 'QA Thu API no-auth' },
    });
    expect(create.status()).toBe(401);
    expect(await create.json()).toEqual({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
    });

    // List and read are protected too.
    const list = await anonymous.get('/api/appointments');
    expect(list.status()).toBe(401);
    expect((await list.json()).error.code).toBe('UNAUTHORIZED');

    const read = await anonymous.get('/api/appointments/000000000000000000000000');
    expect(read.status()).toBe(401);

    await anonymous.dispose();
  });

  test('validation: missing required fields are rejected (400 VALIDATION_ERROR)', async ({ baseURL }) => {
    const patient = await loginPatient(baseURL!);

    try {
      // Count the patient's appointments first, to prove the rejected requests create nothing.
      const totalBefore = (await (await patient.get('/api/appointments?limit=1')).json()).pagination.total;

      // Empty body: every required field must be named in the message.
      const empty = await patient.post('/api/appointments', { data: {} });
      expect(empty.status()).toBe(400);
      const emptyBody = await empty.json();
      expect(emptyBody.success).toBe(false);
      expect(emptyBody.error.code).toBe('VALIDATION_ERROR');
      for (const field of ['doctorId', 'date', 'timeSlot', 'reason']) {
        expect(emptyBody.error.message).toContain(field);
      }

      // One field missing: only that field is named.
      const slot = futureSlot();
      const noReason = await patient.post('/api/appointments', {
        data: { doctorId: DOCTOR.id, date: slot.date, timeSlot: slot.timeSlot, specialty: DOCTOR.specialty },
      });
      expect(noReason.status()).toBe(400);
      expect(await noReason.json()).toEqual({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Missing fields: reason' },
      });

      // Nothing was created by the rejected requests.
      const totalAfter = (await (await patient.get('/api/appointments?limit=1')).json()).pagination.total;
      expect(totalAfter).toBe(totalBefore);
    } finally {
      await patient.dispose();
    }
  });
});
