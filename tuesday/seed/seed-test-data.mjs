#!/usr/bin/env node
// Seeds the Tuesday test data set through the public MediBook API.
//
//   SEED_PASSWORD='<password for the throwaway accounts>' node seed-test-data.mjs
//   SEED_PASSWORD='<same password>' node seed-test-data.mjs --verify seed-output.json
//   SEED_PASSWORD='<same password>' node seed-test-data.mjs --cleanup seed-output.json
//
// Creates 5 throwaway patients and 10 appointments with 3 doctors that are not
// assigned to any trainee, then writes every created id to seed-output.json.
// No password is stored in this file or in the output.

import { readFileSync, writeFileSync } from 'node:fs';

const BASE = process.env.BASE_URL ?? 'https://medapp-nerdery.vercel.app';
const PASSWORD = process.env.SEED_PASSWORD;
if (!PASSWORD || PASSWORD.length < 8) {
  console.error('Set SEED_PASSWORD (8+ characters) before running.');
  process.exit(1);
}

// Doctors chosen because no trainee owns their schedule.
const DOCTORS = {
  thompson: 'Dr. Michael Thompson', // General Practice, Mon–Fri 07:00–14:00, 30 min
  patel: 'Dr. Priya Patel', //         Cardiology,      Mon/Tue/Thu/Fri 09:00–16:00, 30 min
  okonkwo: 'Dr. Leila Okonkwo', //     Endocrinology,   Tue/Thu 08:00–15:00, 30 min
};

// id, patient (1–5), doctor, how far ahead (days), which slot, final state, scenario.
// slot: 'first' | 'lastValid' (last slot that ends before closing) | 'sameAs:<id>' | number (index)
const PLAN = [
  { id: 'A01', p: 1, doc: 'thompson', days: 21, slot: 'first', final: 'scheduled', scenario: 'Happy-path booking; view in list/detail' },
  { id: 'A02', p: 1, doc: 'patel', days: 22, slot: 2, final: 'scheduled', scenario: 'Cancel happy path (target to cancel during the test)' },
  { id: 'A03', p: 2, doc: 'thompson', days: 23, slot: 'lastValid', final: 'scheduled', scenario: 'Boundary: last slot that fits working hours' },
  { id: 'A04', p: 2, doc: 'okonkwo', days: 24, slot: 3, final: 'cancelled', scenario: 'Cancelled state in list/filter; re-cancel is idempotent' },
  { id: 'A05', p: 3, doc: 'patel', days: 25, slot: 4, final: 'rescheduled', scenario: 'Edit/reschedule: moved +7 days via PUT' },
  { id: 'A06', p: 3, doc: 'thompson', days: 28, slot: 5, final: 'cancelled', scenario: 'Slot freed by cancellation (paired with A07)' },
  { id: 'A07', p: 4, doc: 'thompson', days: 28, slot: 'sameAs:A06', final: 'scheduled', scenario: 'Re-book a slot released by another patient' },
  { id: 'A08', p: 4, doc: 'okonkwo', days: 31, slot: 2, final: 'scheduled', scenario: 'Pre-booked slot for the double-booking test (P5 tries the same slot)' },
  { id: 'A09', p: 5, doc: 'patel', days: 32, slot: 6, final: 'cancelled', scenario: 'Cancelled by owner; other patient cannot cancel it (404)' },
  { id: 'A10', p: 5, doc: 'okonkwo', days: 60, slot: 'first', final: 'scheduled', scenario: 'Far-future row for sort/pagination checks' },
];

// ---------- HTTP helpers ----------

function cookieHeader(jar) {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
}

function storeCookies(jar, res) {
  for (const c of res.headers.getSetCookie?.() ?? []) {
    const [pair] = c.split(';');
    const i = pair.indexOf('=');
    jar[pair.slice(0, i)] = pair.slice(i + 1);
  }
}

async function api(jar, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader(jar) },
    body: body ? JSON.stringify(body) : undefined,
  });
  storeCookies(jar, res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON error page */ }
  return { status: res.status, json };
}

async function register(name, email) {
  const r = await api({}, 'POST', '/api/auth/register', { name, email, password: PASSWORD });
  if (r.status !== 201 && r.status !== 409) throw new Error(`register ${email}: ${r.status} ${JSON.stringify(r.json)}`);
  return r.status;
}

async function login(email) {
  const jar = {};
  const csrf = await api(jar, 'GET', '/api/auth/csrf');
  const form = new URLSearchParams({ csrfToken: csrf.json.csrfToken, email, password: PASSWORD, json: 'true' });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar) },
    body: form,
  });
  storeCookies(jar, res);
  const session = await api(jar, 'GET', '/api/auth/session');
  if (session.json?.user?.email !== email) throw new Error(`login failed for ${email}`);
  return jar;
}

// ---------- scheduling helpers ----------

function addDays(date, n) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

const ymd = (d) => d.toISOString().slice(0, 10);
const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// First working day on or after `from` for this doctor.
function nextWorkingDay(doctor, from) {
  let d = new Date(from);
  while (!doctor.availableDays.includes(d.getUTCDay())) d = addDays(d, 1);
  return d;
}

async function pickSlot(jar, doctor, date, choice) {
  const r = await api(jar, 'GET', `/api/doctors/${doctor._id}/slots?date=${date}`);
  const slots = (r.json?.data?.slots ?? []).map((s) => s.time);
  if (!slots.length) throw new Error(`no slots for ${doctor.name} on ${date}`);
  if (choice === 'first') return slots[0];
  if (choice === 'lastValid') {
    const end = toMin(doctor.workingHours.end);
    return slots.filter((t) => toMin(t) + doctor.slotDurationMin <= end).at(-1);
  }
  return slots[Math.min(choice, slots.length - 1)];
}

// ---------- seed ----------

async function seed() {
  const run = new Date().toISOString().replace(/\D/g, '').slice(2, 12);
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const out = { base: BASE, run, createdAt: new Date().toISOString(), patients: [], appointments: [] };

  const doctors = (await api({}, 'GET', '/api/doctors')).json.data;
  const doc = Object.fromEntries(
    Object.entries(DOCTORS).map(([k, name]) => [k, doctors.find((d) => d.name === name)]),
  );

  const jars = {};
  for (let p = 1; p <= 5; p++) {
    const email = `qa.adriana.tue.${run}.p${p}@test.com`;
    const status = await register(`QA Tue P${p} ${run}`, email);
    jars[p] = await login(email);
    out.patients.push({ key: `P${p}`, email, registerStatus: status });
    console.log(`P${p} ${email} registered (${status}) and logged in`);
  }

  const byId = {};
  for (const a of PLAN) {
    const d = doc[a.doc];
    const date = ymd(nextWorkingDay(d, addDays(today, a.days)));
    const time = String(a.slot).startsWith('sameAs:')
      ? byId[a.slot.split(':')[1]].timeSlot
      : await pickSlot(jars[a.p], d, date, a.slot);

    const booked = await api(jars[a.p], 'POST', '/api/appointments', {
      doctorId: d._id, date, timeSlot: time, specialty: d.specialty,
      reason: `QA Tue seed ${a.id} - ${a.scenario}`,
    });
    if (booked.status !== 201) throw new Error(`${a.id} booking: ${booked.status} ${JSON.stringify(booked.json)}`);
    const rec = { ...a, patient: `P${a.p}`, doctor: d.name, specialty: d.specialty, date, timeSlot: time, _id: booked.json.data._id, steps: ['POST 201'] };

    if (a.final === 'cancelled') {
      const r = await api(jars[a.p], 'DELETE', `/api/appointments/${rec._id}`);
      rec.steps.push(`DELETE ${r.status}`);
    }
    if (a.final === 'rescheduled') {
      const newDate = ymd(nextWorkingDay(d, addDays(new Date(date + 'T00:00:00Z'), 7)));
      const r = await api(jars[a.p], 'PUT', `/api/appointments/${rec._id}`, { date: newDate, timeSlot: time, reason: `${booked.json.data.reason} (rescheduled)` });
      rec.steps.push(`PUT ${r.status} ${date} -> ${newDate}`);
      rec.originalDate = date;
      rec.date = newDate;
    }

    const check = await api(jars[a.p], 'GET', `/api/appointments/${rec._id}`);
    rec.storedStatus = check.json?.data?.status;
    byId[a.id] = rec;
    out.appointments.push(rec);
    console.log(`${a.id} P${a.p} ${d.name} ${rec.date} ${time} -> ${rec.storedStatus} [${rec.steps.join(', ')}]`);
  }

  // A06 must be cancelled before A07 re-books the slot; the plan order guarantees that.
  writeFileSync('seed-output.json', JSON.stringify(out, null, 2));
  console.log(`\nWrote seed-output.json (${out.patients.length} patients, ${out.appointments.length} appointments)`);
}

// ---------- verify ----------

// Entry check before a test run: every seeded row must still have the state,
// date and slot the seed left it in. The environment is shared, so this can drift.
async function verify(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const jars = {};
  for (const p of data.patients) jars[p.key] = await login(p.email);
  let drift = 0;
  for (const a of data.appointments) {
    const r = await api(jars[a.patient], 'GET', `/api/appointments/${a._id}`);
    const got = r.json?.data;
    const want = { status: a.storedStatus, date: a.date, timeSlot: a.timeSlot };
    const now = got && { status: got.status, date: got.date.slice(0, 10), timeSlot: got.timeSlot };
    const ok = r.status === 200 && JSON.stringify(now) === JSON.stringify(want);
    if (!ok) drift++;
    console.log(`${a.id} ${ok ? 'OK     ' : 'CHANGED'} expected ${want.status} ${want.date} ${want.timeSlot}` +
      (ok ? '' : ` | got ${r.status} ${now ? `${now.status} ${now.date} ${now.timeSlot}` : ''}`));
  }
  console.log(drift ? `\n${drift} row(s) changed — re-seed before testing.` : '\nAll seeded rows as expected.');
  process.exitCode = drift ? 1 : 0;
}

// ---------- cleanup ----------

async function cleanup(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  const jars = {};
  for (const p of data.patients) jars[p.key] = await login(p.email);
  for (const a of data.appointments) {
    const r = await api(jars[a.patient], 'DELETE', `/api/appointments/${a._id}`);
    console.log(`${a.id} cancel -> ${r.status}`);
  }
  console.log('Appointments cancelled. Accounts remain: the API has no delete-account endpoint.');
}

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] ?? 'seed-output.json' : null;
};
const run = arg('--verify') ? verify(arg('--verify'))
  : arg('--cleanup') ? cleanup(arg('--cleanup'))
  : seed();
run.catch((e) => {
  console.error(e.message);
  process.exit(1);
});
