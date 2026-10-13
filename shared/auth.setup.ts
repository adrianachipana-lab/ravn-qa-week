import { test as setup } from '@playwright/test';
import path from 'node:path';

// Reusable session via API login — avoids typing the password in the browser.
// Each test project that depends on 'auth-setup' gets a pre-authenticated storageState.
// The storageState file is gitignored and never committed.

function envRequired(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Set ${name} before running the tests.`);
  return v;
}

async function apiLogin(baseURL: string, email: string, password: string, statePath: string) {
  const { request } = await import('@playwright/test');
  const api = await request.newContext({ baseURL });
  const { csrfToken } = await (await api.get('/api/auth/csrf')).json();
  await api.post('/api/auth/callback/credentials', {
    form: { csrfToken, email, password, json: 'true' },
  });
  const session = await (await api.get('/api/auth/session')).json();
  if (session?.user?.email !== email) throw new Error(`API login failed for ${email}`);
  await api.storageState({ path: statePath });
  await api.dispose();
}

export const STORAGE_DIR = path.join(__dirname, '..', 'auth');
export const PATIENT_STATE = path.join(STORAGE_DIR, 'patient.storageState.json');
export const SECOND_PATIENT_STATE = path.join(STORAGE_DIR, 'second-patient.storageState.json');
export const API_PATIENT_STATE = path.join(STORAGE_DIR, 'api-patient.storageState.json');

setup('authenticate primary patient', async ({}) => {
  const { mkdirSync } = await import('node:fs');
  mkdirSync(STORAGE_DIR, { recursive: true });
  const baseURL = 'https://medapp-nerdery.vercel.app';
  await apiLogin(baseURL, envRequired('PATIENT_EMAIL'), envRequired('PATIENT_PASSWORD'), PATIENT_STATE);
});

setup('authenticate second patient', async ({}) => {
  const email = process.env.SECOND_PATIENT_EMAIL;
  if (!email) {
    setup.skip();
    return;
  }
  const { mkdirSync } = await import('node:fs');
  mkdirSync(STORAGE_DIR, { recursive: true });
  const baseURL = 'https://medapp-nerdery.vercel.app';
  const password = process.env.SECOND_PATIENT_PASSWORD ?? envRequired('PATIENT_PASSWORD');
  await apiLogin(baseURL, email, password, SECOND_PATIENT_STATE);
});

setup('authenticate API patient', async ({}) => {
  const email = process.env.API_PATIENT_EMAIL;
  if (!email) {
    setup.skip();
    return;
  }
  const { mkdirSync } = await import('node:fs');
  mkdirSync(STORAGE_DIR, { recursive: true });
  const baseURL = 'https://medapp-nerdery.vercel.app';
  const password = process.env.API_PATIENT_PASSWORD ?? envRequired('PATIENT_PASSWORD');
  await apiLogin(baseURL, email, password, API_PATIENT_STATE);
});
