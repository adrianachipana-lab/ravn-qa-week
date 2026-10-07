# Seed script — Tuesday test data

Creates the data set described in [`../test-data-sheet.md`](../test-data-sheet.md) using only the public MediBook API (no database access, no admin endpoints).

## What it does

1. Reads the doctor directory (`GET /api/doctors`) and picks D1–D3 by name: Dr. Michael Thompson, Dr. Priya Patel, Dr. Leila Okonkwo. No trainee is assigned to them.
2. Registers 5 patients with unique emails `qa.adriana.tue.<run>.p<n>@test.com` (`POST /api/auth/register`) and logs each one in through NextAuth (`/api/auth/csrf` → `/api/auth/callback/credentials`).
3. For each of the 10 planned appointments:
   - Finds the doctor's next working day at the planned offset.
   - Asks the slots endpoint for valid times.
   - Books with `POST /api/appointments`.
   - Where the plan says so, cancels (`DELETE`) or reschedules (`PUT`).
   - Reads the appointment back to record the stored status.
4. Writes every id to `seed-output.json`.

The script never uses a known defect to create data. For example, it doesn't set `status: completed` through `PUT`, which is why completed rows come from pre-existing data.

## Run

Node.js 20 or newer (uses the built-in `fetch`).

```bash
cd trainees/development/submissions/tuesday/adriana-chipana/seed
SEED_PASSWORD='<8+ characters>' node seed-test-data.mjs
```

- `SEED_PASSWORD` is the password given to the 5 new accounts. It is read from the environment and never written to disk by the script.
- `BASE_URL` (optional) points to another environment. The default is the shared Vercel deployment.

Expected output: 5 lines `registered (201) and logged in`, then 10 lines `A01 … -> scheduled|cancelled [POST 201, …]`. See [`seed-run-output.txt`](seed-run-output.txt) for the 2026-09-29 run.

## Verify (entry check)

```bash
SEED_PASSWORD='<same password>' node seed-test-data.mjs --verify seed-output.json
```

Logs in as each seeded patient and compares every appointment with the state, date and slot recorded at seed time. It prints `OK` or `CHANGED` per row and exits with code 1 if anything drifted, so it can gate a test run. Example outputs: [`seed-verify-output.txt`](seed-verify-output.txt) (before the dry run, all OK) and [`../evidence/run-07-verify-after-run.txt`](../evidence/run-07-verify-after-run.txt) (after it, A02 changed by TP-10, as expected).

## Cleanup

```bash
SEED_PASSWORD='<same password>' node seed-test-data.mjs --cleanup seed-output.json
```

Logs in as each seeded patient and cancels every appointment the seed created. The accounts stay, because the API has no delete-account endpoint.

## Files

- `seed-test-data.mjs` — the script.
- `seed-output.json` — ids, dates, slots and stored status from the last run. It contains no passwords.
- `seed-run-output.txt` — console output of the last run.
- `seed-verify-output.txt` — `--verify` output taken before the dry run.

## Known limitations

- Each run adds 5 users to the shared environment.
- Dates are relative to the run day, so ids and dates change between runs; the data sheet lists the 2026-09-29 run.
- If a planned slot is already taken, the booking still succeeds today (Monday BUG-01). Once the conflict check exists, a clash would fail the run with a clear `409` message instead of creating a duplicate.
