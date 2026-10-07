import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import {
  MITCHELL,
  apiLogin,
  futureMitchellSlot,
  loginAs,
  patientCredentials,
  secondPatientCredentials,
  uniqueReason,
} from './helpers';

// Reference AC: MEDIC-101 · SCEN-MED101-02 (High) — an already-booked slot must be
// visibly and functionally disabled for a second patient.
// trainees/product/belen/wednesday/gherkin-ac.md#scen-med101-02
//
// Expected result on today's build: FAIL. The slot stays enabled, is marked
// data-available="true", has no "Unavailable" label, and can be selected (BUG-01, BUG-03).
test.describe('SCEN-MED101-02 Booked slot is disabled for another patient', () => {
  let owner: APIRequestContext;
  let existingId: string;
  let slot: ReturnType<typeof futureMitchellSlot>;

  // Given Dr. Sarah Mitchell has an existing "Scheduled" appointment at 09:00 on a working day.
  // The first patient creates it through the API so the test doesn't depend on seed data.
  test.beforeEach(async ({ baseURL }) => {
    const first = patientCredentials();
    owner = await apiLogin(playwrightRequest, baseURL!, first.email, first.password);
    slot = futureMitchellSlot('09:00');
    const created = await owner.post('/api/appointments', {
      data: {
        doctorId: MITCHELL.id,
        date: slot.date,
        timeSlot: slot.time,
        specialty: MITCHELL.specialty,
        reason: uniqueReason('MED101-02 existing'),
      },
    });
    expect(created.status()).toBe(201);
    existingId = (await created.json()).data._id;
  });

  // Cleanup: the owner cancels the setup appointment.
  test.afterEach(async () => {
    if (existingId) await owner.delete(`/api/appointments/${existingId}`);
    await owner.dispose();
  });

  test('second patient cannot select a slot that is already booked', async ({ page }) => {
    test.info().annotations.push({ type: 'AC', description: 'SCEN-MED101-02 (BR-MED101-01), related BUG-005' });

    // Record any booking request the second patient's page sends.
    const bookingRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('/api/appointments') && r.method() === 'POST') bookingRequests.push(r.url());
    });

    // And a second patient opens the schedule view for Dr. Mitchell on that date
    await loginAs(page, secondPatientCredentials());
    await page.goto('/appointments/new');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('appointment-form-doctor-select').selectOption({ label: MITCHELL.option });
    for (let i = 0; i < slot.monthsAhead; i++) await page.getByTestId('calendar-next-month').click();
    await page.getByTestId(`calendar-day-${slot.date}`).click();

    const takenSlot = page.getByTestId(`time-slot-${slot.time}`);
    await expect(takenSlot).toBeVisible();

    // Then the 09:00 slot is rendered as disabled …
    // GAP: the button is enabled.
    await expect.soft(takenSlot, 'Booked slot must be disabled').toBeDisabled();
    // … in a machine-readable way (the app already exposes data-available on each slot).
    // GAP: it says "true".
    await expect.soft(takenSlot, 'Booked slot must be marked unavailable').toHaveAttribute('data-available', 'false');
    // And the patient sees the slot labeled "Unavailable".
    // GAP: the label is just the time.
    await expect.soft(takenSlot, 'Booked slot must be labeled "Unavailable"').toContainText('Unavailable');

    // When the second patient attempts to select the 09:00 slot
    // (a short timeout: a disabled button can't be clicked, and that's the expected outcome).
    await takenSlot.click({ timeout: 2_000 }).catch(() => {});
    await page.getByTestId('appointment-form-reason-textarea').fill(uniqueReason('MED101-02 attempt'));

    // Then it cannot be selected: the form must not let the patient continue with that slot.
    // GAP: after clicking, Review & book becomes enabled.
    await expect
      .soft(page.getByTestId('appointment-form-submit-btn'), 'Form must not accept the booked slot')
      .toBeDisabled();

    // And no booking request is created for the second patient.
    expect(bookingRequests, 'No booking request may be sent for a booked slot').toHaveLength(0);
  });
});
