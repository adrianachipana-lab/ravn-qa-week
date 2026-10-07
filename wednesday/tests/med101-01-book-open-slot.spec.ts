import { test, expect, request as playwrightRequest } from '@playwright/test';
import { MITCHELL, futureMitchellSlot, loginAsPatient, uniqueReason } from './helpers';

// Reference AC: MEDIC-101 · SCEN-MED101-01 (High) — happy-path booking.
// trainees/product/belen/wednesday/gherkin-ac.md#scen-med101-01
//
// The test encodes the AC as written. Parts the app implements are hard assertions;
// parts the app does not implement yet are soft assertions (expect.soft), so one run
// reports every gap instead of stopping at the first one. Expected result on today's
// build: FAIL on the confirmation message and on the slot still being offered.
test.describe('SCEN-MED101-01 Book an open slot', () => {
  let createdId: string | undefined;

  test.afterEach(async ({ page }) => {
    if (createdId) await page.request.delete(`/api/appointments/${createdId}`);
    createdId = undefined;
  });

  test('patient books an open, in-hours slot and sees it confirmed', async ({ page, baseURL }) => {
    test.info().annotations.push({ type: 'AC', description: 'SCEN-MED101-01 (BR-MED101-01, BR-MED101-03)' });

    // AC: "the 14:00 slot on <a working day> is open". The AC's example date is in the
    // past, so a future working day for Dr. Mitchell is used instead.
    const slot = futureMitchellSlot('14:00');
    const reason = uniqueReason('MED101-01');

    // Given the patient is on the booking page for Dr. Sarah Mitchell
    await loginAsPatient(page);
    await page.goto('/appointments/new');
    await page.waitForLoadState('networkidle');
    await page.getByTestId('appointment-form-doctor-select').selectOption({ label: MITCHELL.option });

    // When the patient selects the 14:00 slot, enters a reason, and submits the confirmation
    for (let i = 0; i < slot.monthsAhead; i++) await page.getByTestId('calendar-next-month').click();
    await page.getByTestId(`calendar-day-${slot.date}`).click();
    await page.getByTestId(`time-slot-${slot.time}`).click();
    await page.getByTestId('appointment-form-reason-textarea').fill(reason);
    await page.getByTestId('appointment-form-submit-btn').click();
    await expect(page.getByTestId('confirmation-modal')).toBeVisible();

    const bookingResponse = page.waitForResponse(
      (r) => r.url().endsWith('/api/appointments') && r.request().method() === 'POST',
    );
    await page.getByTestId('confirmation-modal-confirm-btn').click();
    const response = await bookingResponse;

    // Then the booking is accepted with a 201 Created response
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    createdId = data._id;
    expect(data.status).toBe('scheduled');
    expect(data.date.startsWith(slot.date)).toBe(true);
    expect(data.timeSlot).toBe(slot.time);

    // And the patient sees the confirmation message from the AC.
    // GAP: the app shows no message after booking (toast-container stays empty).
    const message = `Your appointment with ${MITCHELL.name} on ${slot.date} at ${slot.time} has been confirmed`;
    await expect
      .soft(page.getByTestId('toast-container'), 'AC confirmation message after booking')
      .toContainText(message, { timeout: 5_000 });

    // And the appointment appears in the Appointments list with status "Scheduled"
    await expect(page).toHaveURL(/\/appointments$/);
    await page.getByTestId('appointments-search-input').fill(reason);
    const row = page.getByTestId(`appointment-row-${createdId}`);
    await expect(row).toBeVisible();
    await expect(row.getByTestId('status-badge-scheduled')).toBeVisible();

    // And the 14:00 slot no longer appears as available to any other patient.
    // The slots endpoint is public, so a fresh context with no session stands in for "any other patient".
    // GAP: the endpoint keeps returning the booked slot as available (BUG-03).
    const otherPatient = await playwrightRequest.newContext({ baseURL });
    const slots = await (await otherPatient.get(`/api/doctors/${MITCHELL.id}/slots?date=${slot.date}`)).json();
    const bookedSlot = slots.data.slots.find((s: { time: string }) => s.time === slot.time);
    expect.soft(bookedSlot?.available, 'Booked 14:00 slot must not be available to other patients').toBe(false);
    await otherPatient.dispose();
  });
});
