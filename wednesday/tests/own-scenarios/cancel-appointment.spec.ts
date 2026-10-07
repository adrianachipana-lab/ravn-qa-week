import { test, expect } from '@playwright/test';
import { DOCTOR, futureSlot, loginAsPatient, uniqueReason } from '../helpers';

// SC-02 — Patient cancels their own appointment (scenarios.md). Covers TP-10 / FM-C01–FM-C05.
test.describe('SC-02 Cancel appointment', () => {
  let appointmentId: string;
  let reason: string;

  // Setup: log in and create the appointment to cancel through the API, using the
  // same session as the browser (page.request shares its cookies). This keeps the
  // test independent: it doesn't need SC-01 or any seeded data.
  test.beforeEach(async ({ page }) => {
    await loginAsPatient(page);

    const slot = futureSlot();
    reason = uniqueReason('SC-02');
    const created = await page.request.post('/api/appointments', {
      data: {
        doctorId: DOCTOR.id,
        date: slot.date,
        timeSlot: slot.time,
        specialty: DOCTOR.specialty,
        reason,
      },
    });
    expect(created.status()).toBe(201);
    appointmentId = (await created.json()).data._id;
  });

  // Cleanup: if the test failed before cancelling, cancel it here. Cancelling an
  // already-cancelled appointment returns 200, so this is safe either way.
  test.afterEach(async ({ page }) => {
    if (appointmentId) await page.request.delete(`/api/appointments/${appointmentId}`);
  });

  test('patient cancels a scheduled appointment and sees it as Cancelled', async ({ page }) => {
    await page.goto(`/appointments/${appointmentId}`);
    // The detail page re-renders in the browser after loading (hydration); wait for it
    // so the click isn't lost on the server-rendered HTML.
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('appointment-detail-card')).toBeVisible();
    await expect(page.getByTestId('status-badge-scheduled')).toBeVisible();

    await page.getByTestId('cancel-appointment-btn').click();
    await expect(page.getByTestId('cancel-modal-confirm-btn')).toBeVisible();

    // Listen for the cancel request before confirming.
    const cancelResponse = page.waitForResponse(
      (r) => r.url().endsWith(`/api/appointments/${appointmentId}`) && r.request().method() === 'DELETE',
    );
    await page.getByTestId('cancel-modal-confirm-btn').click();
    const response = await cancelResponse;

    // API level: the cancel succeeded and the stored status is "cancelled".
    expect(response.status()).toBe(200);
    expect((await response.json()).data.status).toBe('cancelled');

    // UI feedback: the success toast, checked right after the cancel response because it
    // disappears after a few seconds. (Automation Delta, Thursday.)
    await expect(page.getByTestId('toast-container')).toContainText('Appointment cancelled');

    // UI level: back on the list, the row shows "Cancelled".
    await expect(page).toHaveURL(/\/appointments$/);
    await page.getByTestId('appointments-search-input').fill(reason);
    const row = page.getByTestId(`appointment-row-${appointmentId}`);
    await expect(row).toBeVisible();
    await expect(row.getByTestId('status-badge-cancelled')).toBeVisible();

    // A cancelled appointment is read-only: no Edit / Cancel buttons on its detail.
    await page.goto(`/appointments/${appointmentId}`);
    await expect(page.getByTestId('status-badge-cancelled')).toBeVisible();
    await expect(page.getByTestId('cancel-appointment-btn')).toHaveCount(0);
    await expect(page.getByTestId('edit-appointment-btn')).toHaveCount(0);
  });
});
