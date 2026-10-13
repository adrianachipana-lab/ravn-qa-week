import { test, expect, request as playwrightRequest } from '@playwright/test';

// Two DIFFERENT patients attempt to book the same slot simultaneously.
// Expected per API contract: exactly one 201 Created + one 409 Conflict (or 400).
// Acceptable rejections: 400, 409. Not acceptable: 200, 401, 404, 500.

const DOCTOR_ID = '6aa85e2fb0083185ed54c88a'; // Dr. Michael Thompson
const ACCEPTABLE_REJECTIONS = [400, 409];

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
  test('exactly one booking succeeds', async ({ baseURL }) => {
    const p1Email = envRequired('PATIENT_EMAIL');
    const p2Email = process.env.SECOND_PATIENT_EMAIL;
    if (!p2Email) { test.skip(true, 'SECOND_PATIENT_EMAIL not set'); return; }
    expect(p1Email, 'Accounts must differ').not.toBe(p2Email);

    const patient1 = await apiLogin(baseURL!, p1Email, envRequired('PATIENT_PASSWORD'));
    const patient2 = await apiLogin(baseURL!, p2Email, process.env.SECOND_PATIENT_PASSWORD ?? envRequired('PATIENT_PASSWORD'));

    const date = futureWorkingDay();
    const timeSlot = '12:30';

    // Pre-check: verify slot is actually available
    const slotsRes = await patient1.get(`/api/doctors/${DOCTOR_ID}/slots?date=${date}`);
    expect(slotsRes.status(), 'Slots endpoint must respond 200').toBe(200);
    const slotsBody = await slotsRes.json();
    // API returns { data: { slots: [{ time, available }] } }
    const slots = slotsBody.data?.slots ?? slotsBody.data ?? slotsBody.slots ?? slotsBody;
    const targetSlot = Array.isArray(slots)
      ? slots.find((s: { time?: string; timeSlot?: string; available?: boolean }) =>
          (s.time ?? s.timeSlot) === timeSlot && s.available !== false)
      : null;

    if (!targetSlot) {
      test.info().annotations.push({
        type: 'blocker',
        description: `Slot ${timeSlot} not found in API response for ${date}. Available: ${JSON.stringify(slots).slice(0, 200)}`,
      });
      expect(targetSlot, `Slot ${timeSlot} must exist for ${date}`).toBeTruthy();
      return;
    }

    test.info().annotations.push({
      type: 'pre-check',
      description: `Slot ${timeSlot} on ${date} confirmed available: ${JSON.stringify(targetSlot).slice(0, 150)}`,
    });

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
      const successes = [s1, s2].filter(s => s === 201).length;

      test.info().annotations.push({
        type: 'observed',
        description: `P1: HTTP ${s1}, P2: HTTP ${s2}. IDs: P1=${createdByP1[0] ?? 'none'}, P2=${createdByP2[0] ?? 'none'}`,
      });

      if (successes === 2) {
        // Both 201 — verify both actually persisted with correct data
        expect(createdByP1[0], 'P1 must have an ID').toBeTruthy();
        expect(createdByP2[0], 'P2 must have an ID').toBeTruthy();
        expect(createdByP1[0], 'IDs must differ').not.toBe(createdByP2[0]);

        const v1 = await patient1.get(`/api/appointments/${createdByP1[0]}`);
        const v2 = await patient2.get(`/api/appointments/${createdByP2[0]}`);
        expect(v1.status(), 'P1 appointment must be readable').toBe(200);
        expect(v2.status(), 'P2 appointment must be readable').toBe(200);

        const d1 = (await v1.json()).data;
        const d2 = (await v2.json()).data;

        // Both must point to same doctor/date/slot — that's what makes it a double-booking
        const bothMatch =
          d1.doctorId === DOCTOR_ID && d2.doctorId === DOCTOR_ID &&
          d1.timeSlot === timeSlot && d2.timeSlot === timeSlot &&
          d1.status === 'scheduled' && d2.status === 'scheduled';

        test.info().annotations.push({
          type: 'defect-evidence',
          description: [
            `Persistence verified — both appointments exist:`,
            `P1 (${d1.id}): doctor=${d1.doctorId}, date=${d1.date}, slot=${d1.timeSlot}, status=${d1.status}`,
            `P2 (${d2.id}): doctor=${d2.doctorId}, date=${d2.date}, slot=${d2.timeSlot}, status=${d2.status}`,
            `Both scheduled for same doctor+slot: ${bothMatch}`,
            ``,
            `Observed behavior: server accepted both concurrent POSTs returning 201.`,
            `Expected behavior: one 201, one ${ACCEPTABLE_REJECTIONS.join(' or ')}.`,
          ].join('\n'),
        });

        expect(bothMatch, 'Both appointments must match the contested slot to confirm double-booking').toBe(true);
        expect(successes, 'Only one concurrent booking should succeed — double-booking is a MediBook defect').toBe(1);

      } else if (successes === 1) {
        const winner = s1 === 201 ? { id: createdByP1[0], api: patient1 } : { id: createdByP2[0], api: patient2 };
        const loserStatus = s1 === 201 ? s2 : s1;

        // Winner must have a valid persisted appointment
        expect(winner.id, 'Winner must have an ID').toBeTruthy();
        const vw = await winner.api.get(`/api/appointments/${winner.id}`);
        expect(vw.status(), 'Winner appointment must persist').toBe(200);

        // Loser must have been rejected with an acceptable code
        expect(
          ACCEPTABLE_REJECTIONS.includes(loserStatus),
          `Rejection must be ${ACCEPTABLE_REJECTIONS.join('/')}, got ${loserStatus}`,
        ).toBe(true);

        test.info().annotations.push({
          type: 'pass',
          description: `Correct: one 201 (${winner.id}), one ${loserStatus}. Persistence verified.`,
        });

      } else {
        // Both failed — defect: at least one should succeed for a free slot
        test.info().annotations.push({
          type: 'defect',
          description: `Both failed: ${s1} and ${s2}. A free slot should accept at least one booking.`,
        });
        expect(successes, 'At least one booking must succeed for a free slot').toBeGreaterThanOrEqual(1);
      }
    } finally {
      // Each owner cleans their own
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
