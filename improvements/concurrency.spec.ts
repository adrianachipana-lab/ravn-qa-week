import { test, expect, request as playwrightRequest } from '@playwright/test';

// Concurrency test: two DIFFERENT patients attempt to book the same slot simultaneously.
// Expected: exactly one 201 and one rejection (400/409). A 500 is not an acceptable rejection.
// Observed on MediBook: both get 201 — double-booking (race condition).

const DOCTOR_ID = '6aa85e2fb0083185ed54c88a'; // Dr. Michael Thompson — not assigned to any trainee

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function apiLogin(baseURL: string, email: string, password: string) {
  const api = await playwrightRequest.newContext({ baseURL });
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
  test('exactly one booking succeeds when two patients book the same slot simultaneously', async ({ baseURL }) => {
    const p1Email = envRequired('PATIENT_EMAIL');
    const p2Email = process.env.SECOND_PATIENT_EMAIL;
    if (!p2Email) { test.skip(true, 'SECOND_PATIENT_EMAIL not set'); return; }
    expect(p1Email, 'The two patient accounts must be different').not.toBe(p2Email);

    const p1Password = envRequired('PATIENT_PASSWORD');
    const p2Password = process.env.SECOND_PATIENT_PASSWORD ?? p1Password;
    const patient1 = await apiLogin(baseURL!, p1Email, p1Password);
    const patient2 = await apiLogin(baseURL!, p2Email, p2Password);

    const date = futureWorkingDay();
    const timeSlot = '12:30';

    // Verify the slot is available before the test
    const slotsCheck = await patient1.get(`/api/doctors/${DOCTOR_ID}/slots?date=${date}`);
    if (slotsCheck.ok()) {
      test.info().annotations.push({
        type: 'pre-check',
        description: `Slots for ${date}: ${(await slotsCheck.json()).data?.length ?? '?'} available`,
      });
    }

    const createdByP1: string[] = [];
    const createdByP2: string[] = [];

    try {
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

      const s1 = res1.status();
      const s2 = res2.status();
      const successes = [s1, s2].filter((s) => s === 201).length;

      test.info().annotations.push({
        type: 'observed',
        description: `P1: ${s1}, P2: ${s2}. Slot: ${date} ${timeSlot}. Created: P1=${createdByP1[0] ?? 'none'}, P2=${createdByP2[0] ?? 'none'}`,
      });

      if (successes === 2) {
        // Verify both persisted with correct data
        const v1 = await patient1.get(`/api/appointments/${createdByP1[0]}`);
        const v2 = await patient2.get(`/api/appointments/${createdByP2[0]}`);
        const d1 = v1.ok() ? (await v1.json()).data : null;
        const d2 = v2.ok() ? (await v2.json()).data : null;

        expect(createdByP1[0], 'IDs must be different').not.toBe(createdByP2[0]);

        test.info().annotations.push({
          type: 'defect',
          description: [
            `DOUBLE-BOOKING: both requests returned 201 and both appointments persist.`,
            `P1 (${createdByP1[0]}): status=${d1?.status}, doctor=${d1?.doctorId}, date=${d1?.date}, slot=${d1?.timeSlot}`,
            `P2 (${createdByP2[0]}): status=${d2?.status}, doctor=${d2?.doctorId}, date=${d2?.date}, slot=${d2?.timeSlot}`,
            `Expected: one 201 + one 400/409. Observed: two 201.`,
          ].join('\n'),
        });

        expect(successes, 'Only one concurrent booking should succeed').toBe(1);

      } else if (successes === 1) {
        const failStatus = s1 !== 201 ? s1 : s2;
        // A 500 is not an acceptable rejection
        expect(failStatus, 'Rejection should be 400 or 409, not 500').toBeLessThan(500);
        test.info().annotations.push({ type: 'pass', description: `Correct: one 201, one ${failStatus}` });

      } else {
        // Both failed — at least one should succeed for a free slot
        test.info().annotations.push({
          type: 'defect',
          description: `Both failed: ${s1} and ${s2}. At least one should succeed for a free slot.`,
        });
        expect(successes, 'At least one booking should succeed for a free slot').toBeGreaterThanOrEqual(1);
      }
    } finally {
      for (const id of createdByP1) {
        const d = await patient1.delete(`/api/appointments/${id}`);
        test.info().annotations.push({ type: 'cleanup', description: `P1 delete ${id}: ${d.status()}` });
      }
      for (const id of createdByP2) {
        const d = await patient2.delete(`/api/appointments/${id}`);
        test.info().annotations.push({ type: 'cleanup', description: `P2 delete ${id}: ${d.status()}` });
      }
      await patient1.dispose();
      await patient2.dispose();
    }
  });
});
