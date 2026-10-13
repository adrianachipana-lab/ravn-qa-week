import { test, expect } from '@playwright/test';

// Concurrency test: two patients attempt to book the same slot simultaneously.
// Tests server-side handling — does the second request get rejected, or double-booking?
// Same class of bug as backend audit FIX-02.

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
  day.setDate(day.getDate() + 42 + Math.floor(Math.random() * 14));
  while (![1, 2, 3, 4, 5].includes(day.getDay())) day.setDate(day.getDate() + 1);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

test.describe('Concurrent booking — same slot, two patients', () => {
  test('only one booking should succeed when two patients book the same slot simultaneously', async ({ baseURL }) => {
    const secondEmail = process.env.SECOND_PATIENT_EMAIL;
    if (!secondEmail) {
      test.skip(true, 'SECOND_PATIENT_EMAIL not set');
      return;
    }

    const password = envRequired('PATIENT_PASSWORD');
    const patient1Email = envRequired('PATIENT_EMAIL');
    const patient1 = await apiLoginContext(baseURL!, patient1Email, password);
    const patient2 = await apiLoginContext(baseURL!, secondEmail, process.env.SECOND_PATIENT_PASSWORD ?? password);

    const date = futureWorkingDay();
    const timeSlot = '12:30';
    const createdByP1: string[] = [];
    const createdByP2: string[] = [];

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

      if (res1.status() === 201 && body1.data?.id) createdByP1.push(body1.data.id);
      if (res2.status() === 201 && body2.data?.id) createdByP2.push(body2.data.id);

      const statuses = [res1.status(), res2.status()];
      const successCount = statuses.filter((s) => s === 201).length;

      test.info().annotations.push({
        type: 'result',
        description: `Patient1: ${res1.status()}, Patient2: ${res2.status()}. Slot: ${date} ${timeSlot}. IDs created: P1=${createdByP1.join(',') || 'none'}, P2=${createdByP2.join(',') || 'none'}`,
      });

      if (successCount === 2) {
        // DEFECT: double-booking. Verify via GET that both actually persisted.
        const verify1 = createdByP1[0] ? await patient1.get(`/api/appointments/${createdByP1[0]}`) : null;
        const verify2 = createdByP2[0] ? await patient2.get(`/api/appointments/${createdByP2[0]}`) : null;

        const persisted1 = verify1?.ok() ? (await verify1.json()).data : null;
        const persisted2 = verify2?.ok() ? (await verify2.json()).data : null;

        test.info().annotations.push({
          type: 'defect',
          description: [
            `DOUBLE-BOOKING CONFIRMED via persistence check:`,
            `P1 appointment ${createdByP1[0]}: status=${persisted1?.status}, date=${persisted1?.date}, slot=${persisted1?.timeSlot}`,
            `P2 appointment ${createdByP2[0]}: status=${persisted2?.status}, date=${persisted2?.date}, slot=${persisted2?.timeSlot}`,
            `Observed behavior: server accepted both concurrent POST requests returning 201.`,
            `Expected behavior: exactly one 201, the other should receive 409 Conflict or 400.`,
            `Note: this documents the observed behavior. The root cause (missing transaction/lock) is a hypothesis, not confirmed from these tests alone.`,
          ].join('\n'),
        });

        expect(successCount, 'Only one concurrent booking should succeed — double-booking is a defect').toBe(1);

      } else if (successCount === 1) {
        // Correct: one accepted, one rejected
        const failStatus = statuses.find((s) => s !== 201);
        test.info().annotations.push({
          type: 'pass',
          description: `Concurrency handled correctly: one 201, one ${failStatus}`,
        });

      } else {
        // Both failed — this is also a defect (one should succeed for a free slot)
        test.info().annotations.push({
          type: 'defect',
          description: `Both requests failed: ${res1.status()} and ${res2.status()}. At least one should succeed for a free slot.`,
        });
        expect(successCount, 'At least one booking should succeed for a free slot').toBeGreaterThanOrEqual(1);
      }
    } finally {
      // Cleanup: each owner deletes their own appointments
      for (const id of createdByP1) {
        const del = await patient1.delete(`/api/appointments/${id}`);
        test.info().annotations.push({
          type: 'cleanup',
          description: `P1 delete ${id}: ${del.status()}`,
        });
      }
      for (const id of createdByP2) {
        const del = await patient2.delete(`/api/appointments/${id}`);
        test.info().annotations.push({
          type: 'cleanup',
          description: `P2 delete ${id}: ${del.status()}`,
        });
      }
      await patient1.dispose();
      await patient2.dispose();
    }
  });
});
