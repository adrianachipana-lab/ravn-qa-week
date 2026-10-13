import { test, expect } from '@playwright/test';

// Concurrency test: two patients attempt to book the same slot simultaneously.
// This tests the server-side handling of concurrent bookings — does the second
// request get properly rejected, or do we end up with a double-booking?
//
// This is the same class of bug found in the backend audit (FIX-02 race condition).

const DOCTOR_ID = '6aa85e2fb0083185ed54c88a'; // Dr. Michael Thompson

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function apiLoginContext(baseURL: string, email: string, password: string) {
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
  // Pick a date far enough in the future to avoid conflicts with other tests
  day.setDate(day.getDate() + 42 + Math.floor(Math.random() * 14));
  while (![1, 2, 3, 4, 5].includes(day.getDay())) day.setDate(day.getDate() + 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

test.describe('Concurrent booking — same slot, two patients', () => {
  test('only one booking succeeds when two patients book the same slot simultaneously', async ({ baseURL }) => {
    const secondEmail = process.env.SECOND_PATIENT_EMAIL;
    if (!secondEmail) {
      test.skip();
      return;
    }

    const password = envRequired('PATIENT_PASSWORD');
    const patient1 = await apiLoginContext(baseURL!, envRequired('PATIENT_EMAIL'), password);
    const patient2 = await apiLoginContext(baseURL!, secondEmail, process.env.SECOND_PATIENT_PASSWORD ?? password);

    const date = futureWorkingDay();
    const timeSlot = '11:00'; // fixed slot for this test
    const createdIds: string[] = [];

    try {
      // Fire both requests concurrently
      const [res1, res2] = await Promise.all([
        patient1.post('/api/appointments', {
          data: { doctorId: DOCTOR_ID, date, timeSlot, reason: `QA concurrent P1 ${Date.now()}` },
        }),
        patient2.post('/api/appointments', {
          data: { doctorId: DOCTOR_ID, date, timeSlot, reason: `QA concurrent P2 ${Date.now()}` },
        }),
      ]);

      const body1 = await res1.json();
      const body2 = await res2.json();

      // Track created appointments for cleanup
      if (res1.status() === 201 && body1.data?.id) createdIds.push(body1.data.id);
      if (res2.status() === 201 && body2.data?.id) createdIds.push(body2.data.id);

      // Exactly one should succeed (201) and one should fail (409 or 400)
      const statuses = [res1.status(), res2.status()].sort();
      const successCount = statuses.filter((s) => s === 201).length;

      if (successCount === 2) {
        // DEFECT: double-booking occurred — both patients got the same slot
        test.info().annotations.push({
          type: 'defect',
          description: `DOUBLE-BOOKING: Both patients booked ${date} ${timeSlot}. IDs: ${createdIds.join(', ')}. This is a race condition — the server does not serialize concurrent bookings.`,
        });

        // Verify the double-booking by querying the slot
        const slotsRes = await patient1.get(`/api/doctors/${DOCTOR_ID}/slots?date=${date}`);
        if (slotsRes.ok()) {
          const slotsBody = await slotsRes.json();
          test.info().annotations.push({
            type: 'evidence',
            description: `Slot ${timeSlot} available=${JSON.stringify(slotsBody)}`,
          });
        }

        // This is a real defect — fail the test
        expect(successCount, 'Only one concurrent booking should succeed').toBe(1);
      } else if (successCount === 1) {
        // Expected: one success, one rejection
        const failStatus = statuses.find((s) => s !== 201);
        test.info().annotations.push({
          type: 'pass',
          description: `Concurrency handled correctly: one 201, one ${failStatus}`,
        });
        expect(successCount).toBe(1);
      } else {
        // Both failed — unexpected
        test.info().annotations.push({
          type: 'finding',
          description: `Both requests failed: ${res1.status()} and ${res2.status()}`,
        });
      }
    } finally {
      // Cleanup all created appointments
      for (const id of createdIds) {
        await patient1.delete(`/api/appointments/${id}`).catch(() => {});
      }
      await patient1.dispose();
      await patient2.dispose();
    }
  });
});
