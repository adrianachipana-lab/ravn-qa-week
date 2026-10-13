// Classifies Playwright JSON results into: passed, known-defect, unexpected, blocked, skipped.
// Known defects are identified by test title + specific error pattern, not just suite name.

const KNOWN_DEFECTS = [
  {
    // Wednesday AC gap: generic toast text + slot stays available
    titlePattern: /SCEN-MED101-01/,
    errorPattern: /toContainText|toHaveAttribute.*available/,
    bug: 'BUG-03: slot stays available after booking + generic toast text',
  },
  {
    // Wednesday AC gap: booked slot not disabled
    titlePattern: /SCEN-MED101-02/,
    errorPattern: /toBeDisabled|toHaveAttribute|toContainText/,
    bug: 'BUG-01/BUG-03: booked slot not disabled for other patients',
  },
  {
    // Accessibility: login page password input missing label
    titlePattern: /login page/i,
    errorPattern: /label|Form elements must have labels|Critical a11y/,
    bug: 'A11Y-01: password input #login-password has no label (WCAG 4.1.2)',
  },
  {
    // Concurrency: double-booking or inconsistent rejection
    titlePattern: /concurrent|concurrency|booking succeeds/i,
    errorPattern: /Only one concurrent booking|double-booking|At least one booking|P1 must have|P2 must have|must differ|must persist|Rejection must be/,
    bug: 'RACE-01: concurrent booking behavior inconsistent — sometimes double-booking, sometimes partial rejection',
  },
];

const BLOCKED_PATTERNS = [
  {
    titlePattern: /completed appointment/i,
    errorPattern: /No completed appointment|blocker/i,
    reason: 'No completed appointment fixture available — neither patient nor doctor API allows status change',
  },
];

const ENV_ERROR_PATTERNS = [
  /Set .+ before running/,
  /Login failed for/,
  /PATIENT_EMAIL/,
  /PATIENT_PASSWORD/,
  /net::ERR_/,
  /ECONNREFUSED/,
];

/**
 * @param {{ suites: Array }} jsonReport - Playwright JSON report
 * @returns {{ passed: Array, knownDefects: Array, unexpected: Array, blocked: Array, skipped: Array }}
 */
export function classifyResults(jsonReport) {
  const results = { passed: [], knownDefects: [], unexpected: [], blocked: [], skipped: [] };

  function walk(suite) {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const title = [...(suite.title ? [suite.title] : []), spec.title].join(' > ');
        const status = test.status; // 'expected', 'unexpected', 'skipped', 'flaky'
        const results_ = test.results ?? [];
        const lastResult = results_.at(-1);
        const errorText = lastResult?.errors?.map(e => e.message ?? '').join('\n') ?? '';

        const entry = {
          title,
          status,
          duration: results_.reduce((s, r) => s + (r.duration ?? 0), 0),
          error: errorText.slice(0, 300),
        };

        if (status === 'skipped') {
          results.skipped.push(entry);
          continue;
        }

        if (status === 'expected') {
          results.passed.push(entry);
          continue;
        }

        // Check if it's an env/auth error (not a known defect)
        if (ENV_ERROR_PATTERNS.some(p => p.test(errorText))) {
          results.unexpected.push({ ...entry, reason: 'Environment/auth error — not a known defect' });
          continue;
        }

        // Check if it's a blocked test
        const blocked = BLOCKED_PATTERNS.find(b =>
          b.titlePattern.test(title) && b.errorPattern.test(errorText)
        );
        if (blocked) {
          results.blocked.push({ ...entry, reason: blocked.reason });
          continue;
        }

        // Check if it matches a known defect
        const known = KNOWN_DEFECTS.find(k =>
          k.titlePattern.test(title) && k.errorPattern.test(errorText)
        );
        if (known) {
          results.knownDefects.push({ ...entry, bug: known.bug });
          continue;
        }

        // Unknown failure — this is a regression
        results.unexpected.push({ ...entry, reason: 'Does not match any known defect pattern' });
      }
    }
    for (const child of suite.suites ?? []) {
      walk(child);
    }
  }

  for (const suite of jsonReport.suites ?? []) {
    walk(suite);
  }

  return results;
}

export function printSummary(classified) {
  const { passed, knownDefects, unexpected, blocked, skipped } = classified;
  const total = passed.length + knownDefects.length + unexpected.length + blocked.length + skipped.length;

  console.log(`\n  Total: ${total} tests`);
  console.log(`  ✓ Passed: ${passed.length}`);
  if (knownDefects.length) {
    console.log(`  ⚠ Known defects: ${knownDefects.length}`);
    for (const d of knownDefects) console.log(`    - ${d.title} → ${d.bug}`);
  }
  if (blocked.length) {
    console.log(`  ◻ Blocked: ${blocked.length}`);
    for (const b of blocked) console.log(`    - ${b.title} → ${b.reason}`);
  }
  if (skipped.length) {
    console.log(`  ○ Skipped: ${skipped.length}`);
    for (const s of skipped) console.log(`    - ${s.title}`);
  }
  if (unexpected.length) {
    console.log(`  ✘ UNEXPECTED: ${unexpected.length}`);
    for (const u of unexpected) console.log(`    - ${u.title} → ${u.reason}\n      ${u.error.slice(0, 150)}`);
  }

  return unexpected.length === 0;
}
