// Runs all test suites and reports combined results.
// Every suite runs regardless of failures in previous ones.
// Exit code is non-zero if any suite had unexpected failures.
import { execSync } from 'node:child_process';

const suites = [
  { name: 'Wednesday', config: 'wednesday/playwright.config.ts', knownFailures: true },
  { name: 'Thursday', config: 'thursday/playwright.config.ts', knownFailures: false },
  { name: 'Friday', config: 'friday-capstone/playwright.config.ts', knownFailures: false },
  { name: 'Improvements', config: 'improvements/playwright.config.ts', knownFailures: true },
];

const results = [];

for (const suite of suites) {
  console.log(`\n${'='.repeat(60)}\n  ${suite.name}\n${'='.repeat(60)}\n`);
  try {
    execSync(`npx playwright test -c ${suite.config}`, { stdio: 'inherit' });
    results.push({ ...suite, status: 'passed' });
  } catch {
    results.push({ ...suite, status: 'failed' });
  }
}

console.log(`\n${'='.repeat(60)}\n  SUMMARY\n${'='.repeat(60)}`);
let hasUnexpected = false;
for (const r of results) {
  const icon = r.status === 'passed' ? '✓' : r.knownFailures ? '⚠' : '✘';
  const note = r.status === 'failed' && r.knownFailures ? ' (has known defects)' : '';
  console.log(`  ${icon} ${r.name}: ${r.status}${note}`);
  if (r.status === 'failed' && !r.knownFailures) hasUnexpected = true;
}

if (hasUnexpected) {
  console.log('\n  RESULT: UNEXPECTED FAILURES — see above\n');
  process.exit(1);
} else {
  console.log('\n  RESULT: All suites completed (known defects may still show as failed)\n');
  process.exit(0);
}
