// Runs all suites, classifies each test, fails on unexpected regressions.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { classifyResults, printSummary } from './classify-results.mjs';

const suites = [
  { name: 'Wednesday', config: 'wednesday/playwright.config.ts', jsonDir: 'wednesday' },
  { name: 'Thursday', config: 'thursday/playwright.config.ts', jsonDir: 'thursday' },
  { name: 'Friday', config: 'friday-capstone/playwright.config.ts', jsonDir: 'friday-capstone' },
  { name: 'Improvements', config: 'improvements/playwright.config.ts', jsonDir: 'improvements' },
];

let allOk = true;

for (const suite of suites) {
  console.log(`\n${'='.repeat(60)}\n  ${suite.name}\n${'='.repeat(60)}\n`);

  const jsonPath = `${suite.jsonDir}/results.json`;

  // Run with JSON reporter — capture stdout (Playwright outputs JSON to stdout)
  let jsonOutput = null;
  try {
    jsonOutput = execSync(
      `npx playwright test -c ${suite.config} --reporter=json`,
      { env: process.env, maxBuffer: 10 * 1024 * 1024 },
    );
  } catch (e) {
    // Playwright exits non-zero on test failures but still outputs JSON
    jsonOutput = e.stdout ?? null;
  }

  if (jsonOutput && jsonOutput.length > 50) {
    writeFileSync(jsonPath, jsonOutput);
    try {
      const report = JSON.parse(jsonOutput.toString());

      // Print a brief list of test names and pass/fail
      for (const s of report.suites ?? []) {
        (function printSpecs(su) {
          for (const spec of su.specs ?? []) {
            for (const t of spec.tests ?? []) {
              const icon = t.status === 'expected' ? '✓' : t.status === 'skipped' ? '○' : '✘';
              console.log(`  ${icon} ${spec.title}`);
            }
          }
          for (const child of su.suites ?? []) printSpecs(child);
        })(s);
      }

      const classified = classifyResults(report);
      console.log(`\n  --- ${suite.name} classification ---`);
      const ok = printSummary(classified);
      if (!ok) {
        console.log(`\n  ✘ ${suite.name} has UNEXPECTED failures`);
        allOk = false;
      }
    } catch (e) {
      console.log(`  Could not parse JSON: ${e.message}`);
      allOk = false;
    }
  } else {
    console.log(`  No JSON output — suite may have crashed before producing results`);
    allOk = false;
  }
}

console.log(`\n${'='.repeat(60)}\n  FINAL RESULT\n${'='.repeat(60)}`);
if (allOk) {
  console.log('  All tests classified. No unexpected regressions.\n');
  process.exit(0);
} else {
  console.log('  UNEXPECTED FAILURES or parse errors — see above.\n');
  process.exit(1);
}
