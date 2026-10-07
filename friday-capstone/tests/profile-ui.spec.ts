import { test, expect } from '@playwright/test';
import { credentials, loginUI, restore, snapshot, type ProfileSnapshot } from './helpers';

// Reference AC: MEDIC-108 · SC-01 (High) — "Patient updates display name and phone number via UI".
// trainees/product/belen/friday/gherkin-ac-and-scenarios.md, SC-01 (AC-01, BR-PROF-001)
//
//   When the patient updates "Display Name" and "Phone Number" and saves
//   Then a success notification is displayed
//   And reloading /profile shows the new name and phone
//
// Adapted to the app as it is: the button is "Save changes" (hook profile-save-btn), not
// "Save Profile", and the notification reads "Profile updated", not "Profile updated
// successfully". Both are copy differences recorded in README.md, not behaviour gaps.

test.describe('MEDIC-108 SC-01 — update name and phone in the profile UI', () => {
  let original: ProfileSnapshot | undefined;

  // Cleanup: put the profile back the way it was, even if an assertion failed.
  test.afterEach(async ({ page }) => {
    if (original) await restore(page.request, original);
    original = undefined;
  });

  test('patient saves a new name and phone and sees them after reload', async ({ page }) => {
    const newName = `QA Capstone ${Date.now().toString().slice(-6)}`; // unique, 2–50 chars (BR-PROF-005)
    const newPhone = '+15550199'; // the AC's own example value

    // Given an authenticated patient on the /profile page
    await loginUI(page, credentials('PATIENT'));
    original = await snapshot(page.request); // page.request shares the browser's session
    await page.goto('/profile');
    await page.waitForLoadState('networkidle'); // the form re-renders after load; wait before typing
    await expect(page.getByTestId('profile-name-input')).toHaveValue(original.name);

    // When the patient updates name and phone and saves
    await page.getByTestId('profile-name-input').fill(newName);
    await page.getByTestId('profile-phone-input').fill(newPhone);
    const saved = page.waitForResponse((r) => r.url().endsWith('/api/profile') && r.request().method() === 'PUT');
    await page.getByTestId('profile-save-btn').click();
    const response = await saved;

    // Then the save succeeds and a success notification is shown
    expect(response.status()).toBe(200);
    // (each toast has its own hook: toast-success / toast-error)
    await expect(page.getByTestId('toast-success')).toContainText('Profile updated');
    await expect(page.getByTestId('toast-error')).toHaveCount(0);

    // And reloading /profile shows the new values (persisted, not just kept in the form)
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('profile-name-input')).toHaveValue(newName);
    await expect(page.getByTestId('profile-phone-input')).toHaveValue(newPhone);

    // And the email is still shown and still read-only (BR-PROF-002)
    await expect(page.getByTestId('profile-email-input')).toBeDisabled();
  });
});
