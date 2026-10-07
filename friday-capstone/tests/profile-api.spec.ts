import { test, expect, request as playwrightRequest } from '@playwright/test';
import { credentials, loginAPI, restore, snapshot } from './helpers';

// Reference AC: MEDIC-108 · SC-03 (High) and SC-04 (High) on PUT /api/profile.
// trainees/product/belen/friday/gherkin-ac-and-scenarios.md (BR-PROF-003, BR-PROF-002)
//
//   SC-03: an unauthenticated PUT is rejected with 401 and error.code UNAUTHORIZED
//   SC-04: a PUT that tries to change the email leaves the stored email unchanged,
//          and the response echoes the original email
//
// The checks follow the profile states and hooks the UI exposes: the email field is
// shown but disabled (profile-email-input), so the API must not let it change either.

test.describe('MEDIC-108 — PUT /api/profile protects identity fields', () => {
  test('SC-03: no session → 401 UNAUTHORIZED, nothing changes', async ({ baseURL }) => {
    const anonymous = await playwrightRequest.newContext({ baseURL }); // no cookie
    const res = await anonymous.put('/api/profile', { data: { name: 'Hacker Name' } });

    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');

    // Reading the profile without a session is refused too.
    expect((await anonymous.get('/api/profile')).status()).toBe(401);
    await anonymous.dispose();
  });

  test('SC-04: email (and role) cannot be changed through the profile endpoint', async ({ baseURL }) => {
    const { email } = credentials('API_PATIENT');
    const patient = await loginAPI(baseURL!, credentials('API_PATIENT'));
    const original = await snapshot(patient);
    const newName = `QA Capstone API ${Date.now().toString().slice(-6)}`;

    try {
      // The AC's payload: a new email together with a legitimate name change.
      // A role is sent as well, to check the endpoint doesn't accept privilege changes.
      const res = await patient.put('/api/profile', {
        data: { email: `changed.${Date.now()}@example.com`, role: 'doctor', name: newName },
      });

      // The legitimate change is applied…
      expect(res.status()).toBe(200);
      const { success, data } = await res.json();
      expect(success).toBe(true);
      expect(data.name).toBe(newName);

      // …and the identity fields are not: the response echoes the original email and role
      expect(data.email).toBe(email);
      expect(data.role).toBe('patient');

      // …and so does a fresh read of the stored profile.
      const stored = (await (await patient.get('/api/profile')).json()).data;
      expect(stored.email).toBe(email);
      expect(stored.role).toBe('patient');

      // The session still belongs to the same account.
      const session = await (await patient.get('/api/auth/session')).json();
      expect(session.user.email).toBe(email);
    } finally {
      await restore(patient, original);
      await patient.dispose();
    }
  });
});
