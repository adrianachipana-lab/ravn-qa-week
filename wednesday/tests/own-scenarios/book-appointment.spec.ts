import { test, expect } from '@playwright/test';
import { DOCTOR, futureSlot, loginAsPatient, uniqueReason } from '../helpers';

// SC-01 — Patient books a free slot (scenarios.md). Covers TP-01 / FM-B01–FM-B08.
test.describe('SC-01 Book appointment', () => {
  let createdId: string | undefined;

  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);
  });

  // Cleanup runs even if an assertion failed, so no scheduled appointment is left behind.
  test.afterEach(async ({ page }) => {
    if (createdId) await page.request.delete(`/api/appointments/${createdId}`);
    createdId = undefined;
  });

  test('patient books a free slot and sees it as Scheduled', async ({ page }) => {
    const slot = futureSlot();
    const reason = uniqueReason('SC-01');

    await page.goto('/appointments/new');
    // The form is a client component: wait until it has loaded before interacting.
    await page.waitForLoadState('networkidle');

    await page.getByTestId('appointment-form-doctor-select').selectOption({ label: DOCTOR.option });

    // Navigate the calendar to the target month, then pick the day.
    for (let i = 0; i < slot.monthsAhead; i++) {
      await page.getByTestId('calendar-next-month').click();
    }
    await page.getByTestId(`calendar-day-${slot.date}`).click();

    // The slot grid loads after the day is clicked (GET /api/doctors/{id}/slots).
    await page.getByTestId(`time-slot-${slot.time}`).click();
    await page.getByTestId('appointment-form-reason-textarea').fill(reason);

    await page.getByTestId('appointment-form-submit-btn').click();
    const modal = page.getByTestId('confirmation-modal');
    await expect(modal).toBeVisible();

    // Listen for the booking request before clicking, then confirm.
    const bookingResponse = page.waitForResponse(
      (r) => r.url().endsWith('/api/appointments') && r.request().method() === 'POST',
    );
    await page.getByTestId('confirmation-modal-confirm-btn').click();
    const response = await bookingResponse;

    // API level: created, scheduled, with the date and slot that were picked.
    expect(response.status()).toBe(201);
    const { data } = await response.json();
    createdId = data._id;
    expect(data.status).toBe('scheduled');
    expect(data.date.startsWith(slot.date)).toBe(true);
    expect(data.timeSlot).toBe(slot.time);

    // UI feedback: the success toast. It only stays a few seconds, so it is checked right
    // after the booking response, before anything else. (Automation Delta, Thursday.)
    await expect(page.getByTestId('toast-container')).toContainText('Appointment booked successfully');

    // UI level: back on the list, the new row shows the doctor and "Scheduled".
    // The list's date/time are not asserted on purpose: they shift with the browser
    // time zone (BUG-06), which would make this test fail for a known, unrelated bug.
    await expect(page).toHaveURL(/\/appointments$/);
    await page.getByTestId('appointments-search-input').fill(reason);
    const row = page.getByTestId(`appointment-row-${createdId}`);
    await expect(row).toBeVisible();
    await expect(row.getByTestId('cell-doctor')).toHaveText(DOCTOR.name);
    await expect(row.getByTestId('status-badge-scheduled')).toBeVisible();
  });
});
