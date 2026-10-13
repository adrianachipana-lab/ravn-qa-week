import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Accessibility audit using axe-core (WCAG 2.0 AA).
//
// SCOPE: axe catches ~30-40% of WCAG issues automatically. It checks DOM structure,
// ARIA attributes, color contrast ratios, and form labels. It does NOT check:
// - Keyboard navigation order and focus management
// - Screen reader announcements and live regions
// - Cognitive accessibility and reading level
// - Motion/animation preferences
// Manual review is needed for those.
//
// Authenticated pages use storageState from auth-setup (no password typed in browser).
// Login page is tested without auth (anonymous).

test.describe('Accessibility audit (axe-core WCAG 2.0 AA)', () => {
  test('login page', async ({ browser }) => {
    // Login page must be tested WITHOUT storageState (anonymous visitor)
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Record every violation with full detail for evidence
    for (const v of results.violations) {
      const elements = v.nodes.map(n => n.html).join(' | ');
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} — impact: ${v.impact}, instances: ${v.nodes.length}, elements: ${elements.slice(0, 200)}`,
      });
    }

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, 'Critical a11y violations on /login').toHaveLength(0);

    await context.close();
  });

  test('dashboard (authenticated via storageState)', async ({ page }) => {
    // storageState is injected by the project config — already authenticated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    for (const v of results.violations) {
      const elements = v.nodes.map(n => n.html).join(' | ');
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} — impact: ${v.impact}, instances: ${v.nodes.length}, elements: ${elements.slice(0, 200)}`,
      });
    }

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, 'Critical a11y violations on /dashboard').toHaveLength(0);
  });

  test('appointments (authenticated via storageState)', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    for (const v of results.violations) {
      const elements = v.nodes.map(n => n.html).join(' | ');
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} — impact: ${v.impact}, instances: ${v.nodes.length}, elements: ${elements.slice(0, 200)}`,
      });
    }

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, 'Critical a11y violations on /appointments').toHaveLength(0);
  });

  test('profile (authenticated via storageState)', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    for (const v of results.violations) {
      const elements = v.nodes.map(n => n.html).join(' | ');
      test.info().annotations.push({
        type: `a11y-${v.impact}`,
        description: `[${v.id}] ${v.help} — impact: ${v.impact}, instances: ${v.nodes.length}, elements: ${elements.slice(0, 200)}`,
      });
    }

    const critical = results.violations.filter(v => v.impact === 'critical');
    expect(critical, 'Critical a11y violations on /profile').toHaveLength(0);
  });
});
