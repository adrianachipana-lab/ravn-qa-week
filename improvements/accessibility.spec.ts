import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility checks using axe-core on key MediBook pages.
// Limitations: axe catches ~30-40% of WCAG issues; manual review is still needed
// for keyboard navigation, focus order, and screen reader behavior.
// These tests document the current state — violations are findings, not test failures.

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running.`);
  return v;
}

async function loginUI(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('login-email-input').fill(envRequired('PATIENT_EMAIL'));
  await page.getByTestId('login-password-input').fill(envRequired('PATIENT_PASSWORD'));
  await page.getByTestId('login-submit-btn').click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe('Accessibility audit (axe-core)', () => {
  test('login page — no critical violations', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    // Log all violations as annotations for the report
    for (const v of results.violations) {
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} (${v.nodes.length} instances) — ${v.helpUrl}`,
      });
    }

    expect(critical, `Critical a11y violations on /login`).toHaveLength(0);
    // Serious violations are documented but don't fail the test
    if (serious.length > 0) {
      test.info().annotations.push({
        type: 'a11y-summary',
        description: `${serious.length} serious violations found on /login — see annotations above`,
      });
    }
  });

  test('dashboard — no critical violations (authenticated)', async ({ page }) => {
    await loginUI(page);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');

    for (const v of results.violations) {
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} (${v.nodes.length} instances)`,
      });
    }

    expect(critical, `Critical a11y violations on /dashboard`).toHaveLength(0);
  });

  test('appointments page — no critical violations', async ({ page }) => {
    await loginUI(page);
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');

    for (const v of results.violations) {
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} (${v.nodes.length} instances)`,
      });
    }

    expect(critical, `Critical a11y violations on /appointments`).toHaveLength(0);
  });

  test('profile page — no critical violations', async ({ page }) => {
    await loginUI(page);
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');

    for (const v of results.violations) {
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} (${v.nodes.length} instances)`,
      });
    }

    expect(critical, `Critical a11y violations on /profile`).toHaveLength(0);
  });
});
