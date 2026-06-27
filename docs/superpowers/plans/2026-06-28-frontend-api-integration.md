# Frontend ↔ Backend API Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Vue 3 SPA's auth, patients, and consents modules to the real NestJS backend for local development, while the deployed Vercel demo keeps running on mock data.

**Architecture:** A single switch point in a new `src/api/` service layer: stores always call services; each service hits the real backend when `VITE_API_URL` is set, else returns mock seed data. Backend↔frontend shape differences are reconciled by per-resource adapters. Two small backend additions (CORS, PDF download endpoint) support the integration.

**Tech Stack:** Vue 3 + Vite + Pinia + axios (frontend); NestJS + Prisma + Jest/supertest (backend); Vitest (new, frontend unit tests for the api/adapter layer).

## Global Constraints

- Backend lives in `server/` (own package.json); root frontend package.json is the Vue app. Backend uses TypeScript `strict: true`, no `any` except where a third-party type forces it.
- Backend error narrowing uses `Prisma.PrismaClientKnownRequestError`. Conventional Commits, NO `Co-Authored-By` trailer.
- Backend test DB: Docker Postgres, integration tests truncate via `resetDb()` in `beforeEach`. Backend global API prefix is `api`. JWT payload `{ sub, email, role }`.
- Frontend dual mode: `API_ENABLED = !!import.meta.env.VITE_API_URL`. When false, every service returns mock data so the Vercel demo is unchanged. Never hardcode the backend URL in source — always read `import.meta.env.VITE_API_URL`.
- Frontend teal brand `#088496`; do not alter existing component markup/styles beyond the wiring described. Preserve the Login reveal animation exactly.
- Token storage keys: `onamlarim_access`, `onamlarim_refresh` (the old `onamlarim_token` key is removed).
- Seeded login user: `dr.muge@onamlarim.com` / `123456` / role DOCTOR. Demo username `dr.muge` maps to email by appending `@onamlarim.com` when the input has no `@`.
- Adapter field mappings (backend → frontend):
  - Patient: `lastVisit ← createdAt` (YYYY-MM-DD slice), `status ← 'Active'` (default); name/tcNo/phone/email/bloodType/id 1:1.
  - Consent: `doctor ← doctorName`, `signature ← signatureData`, `status ← status.toLowerCase()`, `date ← (signedAt || createdAt)` (YYYY-MM-DD slice), `patientName ← lookup by patientId in the patients list (fallback to patientId)`, plus pass through `id`, `patientId`, `procedure`, `pdfPath`.
  - Consent write (frontend → backend create): `{ patientId, procedure, doctorName: doctor }`.

---

### Task 1: Backend — enable CORS for the Vite dev origin

**Files:**
- Modify: `server/src/main.ts`
- Test: `server/src/health/cors.e2e-spec.ts` (create)

**Interfaces:**
- Consumes: existing `AppModule`, `createTestApp` test factory.
- Produces: CORS enabled on the Nest app for origin `http://localhost:5173`.

- [ ] **Step 1: Write the failing test**

`server/src/health/cors.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';

describe('CORS (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  it('allows the Vite dev origin on a preflight request', async () => {
    const res = await request(app.getHttpServer())
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npm test -- cors`
Expected: FAIL — `access-control-allow-origin` is undefined (CORS not enabled). NOTE: `createTestApp` must enable CORS the same way the real bootstrap does — see Step 3; update the factory too.

- [ ] **Step 3: Enable CORS in bootstrap and the test factory**

In `server/src/main.ts`, after `app.setGlobalPrefix('api');` add:
```ts
  app.enableCors({ origin: ['http://localhost:5173'], credentials: true });
```

In `server/test/app-factory.ts`, after `app.setGlobalPrefix('api');` add the same line:
```ts
  app.enableCors({ origin: ['http://localhost:5173'], credentials: true });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd server && npm test -- cors`
Expected: PASS.

- [ ] **Step 5: Run the full backend suite + commit**

Run: `cd server && npm test` → expect all suites pass.
```bash
git add server/src/main.ts server/test/app-factory.ts server/src/health/cors.e2e-spec.ts
git commit -m "feat(server): enable CORS for the Vite dev origin"
```

---

### Task 2: Backend — protected PDF download endpoint

**Files:**
- Modify: `server/src/consents/consents.service.ts` (add `getPdf`)
- Modify: `server/src/consents/consents.controller.ts` (add `GET :id/pdf`)
- Test: `server/src/consents/consents.controller.e2e-spec.ts` (add cases)

**Interfaces:**
- Consumes: `ConsentsService.findOne`, the `pdfPath` column, Node `fs`/`path`.
- Produces:
  - `ConsentsService.getPdf(id: string): Promise<{ stream: ReadStream; filename: string }>` — throws `NotFoundException` if the consent or its PDF file is missing.
  - `GET /api/consents/:id/pdf` (behind `JwtAuthGuard`) → streams `application/pdf`.

- [ ] **Step 1: Write the failing tests**

Add to `server/src/consents/consents.controller.e2e-spec.ts` (inside the existing `describe`, reusing its `token`, `patientId`, `auth()` helpers and the `SIGNATURE` constant):
```ts
  it('downloads the PDF of a signed consent', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId, procedure: 'Histeroskopi', doctorName: 'Dr. Müge Ateş Tıkız' });
    await request(app.getHttpServer())
      .post(`/api/consents/${created.body.id}/sign`).set(auth())
      .send({ signatureData: SIGNATURE });
    const res = await request(app.getHttpServer())
      .get(`/api/consents/${created.body.id}/pdf`).set(auth());
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 404 for the PDF of a nonexistent consent', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consents/00000000-0000-0000-0000-000000000000/pdf').set(auth());
    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated PDF download with 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consents/00000000-0000-0000-0000-000000000000/pdf');
    expect(res.status).toBe(401);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd server && npm test -- consents.controller`
Expected: FAIL — `GET :id/pdf` returns 404 for the signed consent (route does not exist yet).

- [ ] **Step 3: Add `getPdf` to the service**

In `server/src/consents/consents.service.ts`, add imports at the top:
```ts
import { createReadStream, existsSync, ReadStream } from 'fs';
import { join } from 'path';
```
Add this method to the `ConsentsService` class:
```ts
  async getPdf(id: string): Promise<{ stream: ReadStream; filename: string }> {
    const consent = await this.findOne(id); // throws 404 if the consent is missing
    if (!consent.pdfPath) throw new NotFoundException('Consent PDF not found');
    const absPath = join(process.cwd(), consent.pdfPath);
    if (!existsSync(absPath)) throw new NotFoundException('Consent PDF not found');
    return { stream: createReadStream(absPath), filename: `${consent.id}.pdf` };
  }
```

- [ ] **Step 4: Add the controller route**

In `server/src/consents/consents.controller.ts`, add to the imports from `@nestjs/common`: `Header`, `Res`. Import the Express `Response` type: `import type { Response } from 'express';`. Add this method to the controller:
```ts
  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async getPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    const { stream, filename } = await this.consents.getPdf(id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    stream.pipe(res);
  }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd server && npm test -- consents.controller`
Expected: PASS (all consents tests including the 3 new ones).

- [ ] **Step 6: Run the full backend suite + commit**

Run: `cd server && npm test` → expect all suites pass.
```bash
git add server/src/consents/consents.service.ts server/src/consents/consents.controller.ts server/src/consents/consents.controller.e2e-spec.ts
git commit -m "feat(server): protected consent PDF download endpoint"
```

---

### Task 3: Frontend — Vitest harness + api config + env example

**Files:**
- Modify: `package.json` (add vitest + `test:unit` script)
- Create: `vitest.config.js`
- Create: `src/api/config.js`
- Create: `src/api/config.spec.js`
- Create: `.env.example`
- Modify: `.gitignore` (ensure `.env.local` ignored)

**Interfaces:**
- Produces: `API_ENABLED` (boolean) and `API_BASE_URL` (string) from `src/api/config.js`.

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Add the test script and vitest config**

In `package.json` `scripts`, add: `"test:unit": "vitest run"`.

`vitest.config.js`:
```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.js'],
  },
})
```

- [ ] **Step 3: Write the failing test**

`src/api/config.spec.js`:
```js
import { describe, it, expect } from 'vitest'
import { API_ENABLED, API_BASE_URL } from './config.js'

describe('api config', () => {
  it('exposes API_ENABLED as a boolean reflecting VITE_API_URL presence', () => {
    expect(typeof API_ENABLED).toBe('boolean')
    // With no VITE_API_URL set in the unit-test env, the API is disabled (mock mode).
    expect(API_ENABLED).toBe(false)
    expect(API_BASE_URL).toBe('')
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./config.js` does not exist.

- [ ] **Step 5: Implement config**

`src/api/config.js`:
```js
// Single source of truth for whether the SPA talks to the real backend.
// VITE_API_URL is set in .env.local for local dev; absent on Vercel (mock mode).
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''
export const API_ENABLED = !!API_BASE_URL
```

`.env.example`:
```
# Local development: point the SPA at the local NestJS backend.
# Leave unset (or omit this file) for mock mode (Vercel demo).
VITE_API_URL=http://localhost:3000/api
```

Ensure `.gitignore` contains `.env.local` (add it if missing).

- [ ] **Step 6: Run test to verify it passes + commit**

Run: `npm run test:unit`
Expected: PASS.
```bash
git add package.json package-lock.json vitest.config.js src/api/config.js src/api/config.spec.js .env.example .gitignore
git commit -m "chore(web): vitest harness + api config (env-gated mode switch)"
```

---

### Task 4: Frontend — mock seed module

**Files:**
- Create: `src/api/mock/seed.js`
- Create: `src/api/mock/seed.spec.js`

**Interfaces:**
- Produces:
  - `mockPatients()` → array of patient objects in **frontend shape** (`{ id, name, tcNo, phone, email, bloodType, lastVisit, status }`).
  - `mockConsents()` → array of consent objects in **frontend shape** (`{ id, patientId, patientName, procedure, doctor, status, date, signature, pdfPath }`).
  - Each call returns a fresh deep copy (so mock mutations don't leak across reloads).

- [ ] **Step 1: Write the failing test**

`src/api/mock/seed.spec.js`:
```js
import { describe, it, expect } from 'vitest'
import { mockPatients, mockConsents } from './seed.js'

describe('mock seed', () => {
  it('returns multi-branch patients in frontend shape', () => {
    const list = mockPatients()
    expect(list.length).toBeGreaterThanOrEqual(5)
    expect(list[0]).toHaveProperty('lastVisit')
    expect(list[0]).toHaveProperty('status')
  })
  it('returns consents in frontend shape with lowercase status', () => {
    const list = mockConsents()
    expect(list.some(c => c.status === 'pending')).toBe(true)
    expect(list.some(c => c.status === 'signed')).toBe(true)
    expect(list[0]).toHaveProperty('patientName')
    expect(list[0]).toHaveProperty('doctor')
  })
  it('returns fresh copies each call', () => {
    expect(mockPatients()).not.toBe(mockPatients())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./seed.js` does not exist.

- [ ] **Step 3: Implement seed (move the hardcoded data out of the stores)**

`src/api/mock/seed.js` — copy the exact arrays currently hardcoded in `src/store/usePatientStore.js` (the 6 patients) and `src/store/useConsentStore.js` (the 4 consents), wrapped in factory functions returning deep copies:
```js
const PATIENTS = [
  { id: 'P-101', name: 'Ahmet Yılmaz', tcNo: '23485910292', phone: '+90 532 123 45 67', email: 'ahmet.yilmaz@email.com', bloodType: 'A Rh+', lastVisit: '2026-06-10', status: 'Active' },
  { id: 'P-102', name: 'Merve Demir', tcNo: '10984950384', phone: '+90 543 987 65 43', email: 'merve.demir@email.com', bloodType: '0 Rh-', lastVisit: '2026-06-08', status: 'Active' },
  { id: 'P-103', name: 'Caner Özkan', tcNo: '48201938592', phone: '+90 505 456 78 90', email: 'caner.ozkan@email.com', bloodType: 'B Rh+', lastVisit: '2026-06-05', status: 'Completed' },
  { id: 'P-104', name: 'Elif Kaya', tcNo: '59203948591', phone: '+90 555 111 22 33', email: 'elif.kaya@email.com', bloodType: 'AB Rh+', lastVisit: '2026-06-11', status: 'Active' },
  { id: 'P-105', name: 'Mustafa Şahin', tcNo: '30491827463', phone: '+90 533 444 55 66', email: 'mustafa.sahin@email.com', bloodType: '0 Rh+', lastVisit: '2026-05-28', status: 'Inactive' },
  { id: 'P-106', name: 'Zeynep Çelik', tcNo: '18492039485', phone: '+90 542 333 44 55', email: 'zeynep.celik@email.com', bloodType: 'A Rh-', lastVisit: '2026-06-09', status: 'Active' },
]

const CONSENTS = [
  { id: 'C-901', patientId: 'P-101', patientName: 'Ahmet Yılmaz', procedure: 'Diş İmplantı Cerrahisi', doctor: 'Dr. Selin Kaya', status: 'pending', date: '2026-06-11', signature: null, pdfPath: null },
  { id: 'C-902', patientId: 'P-102', patientName: 'Merve Demir', procedure: 'Koroner Anjiyografi', doctor: 'Dr. Emre Demir', status: 'signed', date: '2026-06-10', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>', pdfPath: null },
  { id: 'C-903', patientId: 'P-104', patientName: 'Elif Kaya', procedure: 'Histeroskopi', doctor: 'Dr. Müge Ateş Tıkız', status: 'pending', date: '2026-06-11', signature: null, pdfPath: null },
  { id: 'C-904', patientId: 'P-106', patientName: 'Zeynep Çelik', procedure: 'Kanal Tedavisi', doctor: 'Dr. Selin Kaya', status: 'signed', date: '2026-06-09', signature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 5 25 C 20 5 40 5 60 25 S 80 5 95 15" fill="none" stroke="black" stroke-width="2"/></svg>', pdfPath: null },
]

export const mockPatients = () => structuredClone(PATIENTS)
export const mockConsents = () => structuredClone(CONSENTS)
```

- [ ] **Step 4: Run test to verify it passes + commit**

Run: `npm run test:unit`
Expected: PASS.
```bash
git add src/api/mock/seed.js src/api/mock/seed.spec.js
git commit -m "feat(web): mock seed module (frontend-shaped demo data)"
```

---

### Task 5: Frontend — axios client with token + silent-refresh interceptors

**Files:**
- Create: `src/api/client.js`
- Create: `src/api/tokens.js`
- Create: `src/api/tokens.spec.js`
- Delete: `src/api/axios.js` (old mock interceptor — replaced)

**Interfaces:**
- Produces:
  - `src/api/tokens.js`: `getAccess()`, `getRefresh()`, `setTokens({accessToken, refreshToken})`, `clearTokens()` over localStorage keys `onamlarim_access` / `onamlarim_refresh`.
  - `src/api/client.js`: default export `apiClient` (axios instance, `baseURL = API_BASE_URL`); request interceptor attaches `Authorization: Bearer <access>`; response interceptor performs one silent refresh on 401 then retries; exported `setOnAuthFailure(fn)` to register a redirect-to-login callback.

- [ ] **Step 1: Write the failing test (token helpers)**

`src/api/tokens.spec.js`:
```js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAccess, getRefresh, setTokens, clearTokens } from './tokens.js'

describe('token helpers', () => {
  beforeEach(() => {
    const store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
    })
  })
  it('round-trips tokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    expect(getAccess()).toBe('a')
    expect(getRefresh()).toBe('r')
  })
  it('clears tokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    clearTokens()
    expect(getAccess()).toBe(null)
    expect(getRefresh()).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./tokens.js` does not exist.

- [ ] **Step 3: Implement tokens**

`src/api/tokens.js`:
```js
const ACCESS_KEY = 'onamlarim_access'
const REFRESH_KEY = 'onamlarim_refresh'

export const getAccess = () => localStorage.getItem(ACCESS_KEY)
export const getRefresh = () => localStorage.getItem(REFRESH_KEY)

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Implement the axios client (no separate unit test — exercised via manual e2e in Task 12)**

`src/api/client.js`:
```js
import axios from 'axios'
import { API_BASE_URL } from './config.js'
import { getAccess, getRefresh, setTokens, clearTokens } from './tokens.js'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

let onAuthFailure = () => {}
export function setOnAuthFailure(fn) { onAuthFailure = fn }

apiClient.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    // Do not try to refresh the refresh call itself, and only retry once.
    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/refresh')) {
      original._retry = true
      const refreshToken = getRefresh()
      if (!refreshToken) { clearTokens(); onAuthFailure(); return Promise.reject(error) }
      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken })
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(original)
      } catch (refreshErr) {
        clearTokens()
        onAuthFailure()
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
```

- [ ] **Step 6: Delete the old mock interceptor + commit**

Delete `src/api/axios.js` (nothing imports it after this plan — verify with `grep -rn "api/axios" src` returning nothing).
Run: `npm run test:unit` → PASS.
```bash
git rm src/api/axios.js
git add src/api/client.js src/api/tokens.js src/api/tokens.spec.js
git commit -m "feat(web): axios client with token + silent-refresh interceptors"
```

---

### Task 6: Frontend — auth API service

**Files:**
- Create: `src/api/auth.api.js`
- Create: `src/api/auth.api.spec.js`

**Interfaces:**
- Consumes: `apiClient` (Task 5), `setTokens`/`clearTokens` (Task 5), `API_ENABLED` (Task 3).
- Produces:
  - `toEmail(username)` → appends `@onamlarim.com` if no `@`.
  - `login(username, password): Promise<{ name, email, role }>` — real mode posts `/auth/login`, stores tokens, returns the logged-in user (from a follow-up `me()` or the login response); mock mode returns a synthetic doctor user and sets no tokens.
  - `me(): Promise<{ name, email, role } | null>` — real mode GETs `/auth/me`; mock mode returns the synthetic doctor user.
  - `logout()` — clears tokens.

- [ ] **Step 1: Write the failing test**

`src/api/auth.api.spec.js`:
```js
import { describe, it, expect } from 'vitest'
import { toEmail } from './auth.api.js'

describe('toEmail', () => {
  it('appends the domain when no @ is present', () => {
    expect(toEmail('dr.muge')).toBe('dr.muge@onamlarim.com')
  })
  it('leaves a full email untouched', () => {
    expect(toEmail('x@y.com')).toBe('x@y.com')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./auth.api.js` does not exist.

- [ ] **Step 3: Implement auth.api**

`src/api/auth.api.js`:
```js
import apiClient from './client.js'
import { API_ENABLED } from './config.js'
import { setTokens, clearTokens } from './tokens.js'

const MOCK_USER = { name: 'Dr. Müge Ateş Tıkız', email: 'dr.muge@onamlarim.com', role: 'DOCTOR' }

export function toEmail(username) {
  return username.includes('@') ? username : `${username}@onamlarim.com`
}

export async function login(username, password) {
  if (!API_ENABLED) return { ...MOCK_USER }
  const { data } = await apiClient.post('/auth/login', { email: toEmail(username), password })
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return me()
}

export async function me() {
  if (!API_ENABLED) return { ...MOCK_USER }
  const { data } = await apiClient.get('/auth/me')
  // Backend /auth/me returns the current user; normalize to { name, email, role }.
  return { name: data.name, email: data.email, role: data.role }
}

export function logout() {
  clearTokens()
}
```

- [ ] **Step 4: Run test to verify it passes + commit**

Run: `npm run test:unit`
Expected: PASS.
```bash
git add src/api/auth.api.js src/api/auth.api.spec.js
git commit -m "feat(web): auth API service (login/me/logout, username→email)"
```

---

### Task 7: Frontend — patients API service + adapter

**Files:**
- Create: `src/api/patients.api.js`
- Create: `src/api/patients.api.spec.js`

**Interfaces:**
- Consumes: `apiClient`, `API_ENABLED`, `mockPatients` (Task 4).
- Produces:
  - `toFrontendPatient(backend)` → `{ id, name, tcNo, phone, email, bloodType, lastVisit, status }` (derives lastVisit from createdAt, status 'Active').
  - `list(): Promise<Patient[]>` — real: GET `/patients` mapped through the adapter; mock: `mockPatients()`.
  - `create(form): Promise<Patient>` — real: POST `/patients` with `{ name, tcNo, phone, email, bloodType }`, returns adapted record; mock: builds a frontend record locally (id `P-<random>`, lastVisit today, status 'Active').

- [ ] **Step 1: Write the failing test**

`src/api/patients.api.spec.js`:
```js
import { describe, it, expect } from 'vitest'
import { toFrontendPatient } from './patients.api.js'

describe('toFrontendPatient', () => {
  it('derives lastVisit from createdAt and defaults status to Active', () => {
    const out = toFrontendPatient({
      id: 'u1', name: 'Ada', tcNo: '12345678901', phone: null, email: null,
      bloodType: 'A Rh+', createdAt: '2026-06-28T09:30:00.000Z',
    })
    expect(out.lastVisit).toBe('2026-06-28')
    expect(out.status).toBe('Active')
    expect(out.name).toBe('Ada')
    expect(out.phone).toBe(null)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./patients.api.js` does not exist.

- [ ] **Step 3: Implement patients.api**

`src/api/patients.api.js`:
```js
import apiClient from './client.js'
import { API_ENABLED } from './config.js'
import { mockPatients } from './mock/seed.js'

export function toFrontendPatient(b) {
  return {
    id: b.id,
    name: b.name,
    tcNo: b.tcNo,
    phone: b.phone ?? '',
    email: b.email ?? '',
    bloodType: b.bloodType ?? '',
    lastVisit: b.createdAt ? b.createdAt.slice(0, 10) : '',
    status: 'Active',
  }
}

export async function list() {
  if (!API_ENABLED) return mockPatients()
  const { data } = await apiClient.get('/patients')
  return data.map(toFrontendPatient)
}

export async function create(form) {
  const payload = {
    name: form.name,
    tcNo: form.tcNo,
    phone: form.phone || undefined,
    email: form.email || undefined,
    bloodType: form.bloodType || undefined,
  }
  if (!API_ENABLED) {
    return { id: `P-${Math.floor(Math.random() * 9000 + 1000)}`, ...form, lastVisit: new Date().toISOString().slice(0, 10), status: 'Active' }
  }
  const { data } = await apiClient.post('/patients', payload)
  return toFrontendPatient(data)
}
```

- [ ] **Step 4: Run test to verify it passes + commit**

Run: `npm run test:unit`
Expected: PASS.
```bash
git add src/api/patients.api.js src/api/patients.api.spec.js
git commit -m "feat(web): patients API service + backend→frontend adapter"
```

---

### Task 8: Frontend — consents API service + adapter

**Files:**
- Create: `src/api/consents.api.js`
- Create: `src/api/consents.api.spec.js`

**Interfaces:**
- Consumes: `apiClient`, `API_ENABLED`, `API_BASE_URL`, `mockConsents` (Task 4), `getAccess` (Task 5).
- Produces:
  - `toFrontendConsent(backend, patientsById)` → `{ id, patientId, patientName, procedure, doctor, status, date, signature, pdfPath }`.
  - `list(patients): Promise<Consent[]>` — real: GET `/consents`, map with a patientId→name index built from `patients`; mock: `mockConsents()`.
  - `create(form): Promise<Consent>` — real: POST `/consents` `{ patientId, procedure, doctorName: form.doctor }`, adapt (patientName from `form.patientName`); mock: local record.
  - `sign(id, signatureDataUrl, patientsById): Promise<Consent>` — real: POST `/consents/:id/sign` `{ signatureData }`, adapt; mock: local update.
  - `pdfHref(consent): string` — returns a URL/marker the UI uses for the PDF link (real: `${API_BASE_URL}/consents/${id}/pdf`; the link is fetched with the auth token at click time — see Task 11).

- [ ] **Step 1: Write the failing test**

`src/api/consents.api.spec.js`:
```js
import { describe, it, expect } from 'vitest'
import { toFrontendConsent } from './consents.api.js'

describe('toFrontendConsent', () => {
  const patientsById = { p1: 'Ada Lovelace' }
  it('maps backend fields and resolves patientName, lowercasing status', () => {
    const out = toFrontendConsent({
      id: 'c1', patientId: 'p1', procedure: 'Histeroskopi', doctorName: 'Dr. Müge',
      status: 'SIGNED', signatureData: 'data:...', signedAt: '2026-06-28T10:00:00.000Z',
      createdAt: '2026-06-27T08:00:00.000Z', pdfPath: 'storage/consents/c1.pdf',
    }, patientsById)
    expect(out.doctor).toBe('Dr. Müge')
    expect(out.signature).toBe('data:...')
    expect(out.status).toBe('signed')
    expect(out.date).toBe('2026-06-28')
    expect(out.patientName).toBe('Ada Lovelace')
    expect(out.pdfPath).toBe('storage/consents/c1.pdf')
  })
  it('falls back to date=createdAt and patientName=patientId when unsigned/unknown', () => {
    const out = toFrontendConsent({
      id: 'c2', patientId: 'pX', procedure: 'X', doctorName: 'D',
      status: 'PENDING', signatureData: null, signedAt: null,
      createdAt: '2026-06-27T08:00:00.000Z', pdfPath: null,
    }, {})
    expect(out.status).toBe('pending')
    expect(out.date).toBe('2026-06-27')
    expect(out.patientName).toBe('pX')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./consents.api.js` does not exist.

- [ ] **Step 3: Implement consents.api**

`src/api/consents.api.js`:
```js
import apiClient from './client.js'
import { API_ENABLED, API_BASE_URL } from './config.js'
import { mockConsents } from './mock/seed.js'

export function toFrontendConsent(b, patientsById = {}) {
  return {
    id: b.id,
    patientId: b.patientId,
    patientName: patientsById[b.patientId] || b.patientId,
    procedure: b.procedure,
    doctor: b.doctorName,
    status: (b.status || '').toLowerCase(),
    date: (b.signedAt || b.createdAt || '').slice(0, 10),
    signature: b.signatureData ?? null,
    pdfPath: b.pdfPath ?? null,
  }
}

function indexNames(patients = []) {
  return Object.fromEntries(patients.map((p) => [p.id, p.name]))
}

export async function list(patients = []) {
  if (!API_ENABLED) return mockConsents()
  const { data } = await apiClient.get('/consents')
  const byId = indexNames(patients)
  return data.map((c) => toFrontendConsent(c, byId))
}

export async function create(form) {
  if (!API_ENABLED) {
    return {
      id: `C-${Math.floor(Math.random() * 9000 + 1000)}`,
      patientId: form.patientId, patientName: form.patientName,
      procedure: form.procedure, doctor: form.doctor,
      status: 'pending', date: new Date().toISOString().slice(0, 10),
      signature: null, pdfPath: null,
    }
  }
  const { data } = await apiClient.post('/consents', {
    patientId: form.patientId, procedure: form.procedure, doctorName: form.doctor,
  })
  const out = toFrontendConsent(data, {})
  out.patientName = form.patientName // we know it from the form selection
  return out
}

export async function sign(id, signatureDataUrl, patientsById = {}) {
  if (!API_ENABLED) {
    return { id, status: 'signed', signature: signatureDataUrl, date: new Date().toISOString().slice(0, 10), pdfPath: null, _mock: true }
  }
  const { data } = await apiClient.post(`/consents/${id}/sign`, { signatureData: signatureDataUrl })
  return toFrontendConsent(data, patientsById)
}

export function pdfHref(consent) {
  return `${API_BASE_URL}/consents/${consent.id}/pdf`
}
```

- [ ] **Step 4: Run test to verify it passes + commit**

Run: `npm run test:unit`
Expected: PASS.
```bash
git add src/api/consents.api.js src/api/consents.api.spec.js
git commit -m "feat(web): consents API service + backend↔frontend adapter"
```

---

### Task 9: Frontend — auth store + real login + app-init validation + guard

**Files:**
- Create: `src/store/useAuthStore.js`
- Modify: `src/views/Login.vue` (script: real login)
- Modify: `src/router/index.js` (token key + onAuthFailure redirect)
- Modify: `src/main.js` (register onAuthFailure; validate token on boot)
- Modify: `src/layouts/Header.vue` (greeting from auth store) — locate the hardcoded doctor name and bind to the store

**Interfaces:**
- Consumes: `login`/`me`/`logout` (Task 6), `getAccess` (Task 5), `setOnAuthFailure` (Task 5), `API_ENABLED`.
- Produces: `useAuthStore` with state `{ user }` and actions `signIn(username,password)`, `loadMe()`, `signOut()`.

- [ ] **Step 1: Write the failing test (store action shape, mock mode)**

`src/store/useAuthStore.spec.js`:
```js
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './useAuthStore.js'

describe('useAuthStore (mock mode)', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('signIn populates the user in mock mode', async () => {
    const store = useAuthStore()
    const user = await store.signIn('dr.muge', '123456')
    expect(user.email).toBe('dr.muge@onamlarim.com')
    expect(store.user?.role).toBe('DOCTOR')
  })
})
```
(Requires `pinia` — already a dependency.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit`
Expected: FAIL — `./useAuthStore.js` does not exist.

- [ ] **Step 3: Implement the auth store**

`src/store/useAuthStore.js`:
```js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login as apiLogin, me as apiMe, logout as apiLogout } from '../api/auth.api.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)

  async function signIn(username, password) {
    user.value = await apiLogin(username, password)
    return user.value
  }
  async function loadMe() {
    user.value = await apiMe()
    return user.value
  }
  function signOut() {
    apiLogout()
    user.value = null
  }
  return { user, signIn, loadMe, signOut }
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Wire real login into `Login.vue`**

In `src/views/Login.vue` `<script setup>`: import the store and make `handleLogin` async. Replace the body of `handleLogin` so it calls `authStore.signIn(username.value, password.value)` and only proceeds to the reveal/animation + `localStorage`-less navigation on success; on failure show an inline error and stop. Keep the existing `revealing`/`isLoading`/reveal `requestAnimationFrame` sequence and timers exactly; only the credential step changes. Concretely:
```js
import { useAuthStore } from '../store/useAuthStore'
const authStore = useAuthStore()
const errorMsg = ref('')

async function handleLogin() {
  if (!username.value || !password.value || revealing.value) return
  isLoading.value = true
  errorMsg.value = ''
  try {
    await authStore.signIn(username.value, password.value)
  } catch (e) {
    isLoading.value = false
    errorMsg.value = 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.'
    return
  }
  isLoading.value = false
  revealing.value = true
  // ... keep the existing reveal sequence that previously followed the setTimeout,
  // EXCEPT remove the line `localStorage.setItem('onamlarim_token', 'demo-token')`
  // (tokens are now set by authStore.signIn in real mode; in mock mode the guard
  //  must still allow entry — see Step 6 note).
}
```
Add an error line in the template under the form (only shown when `errorMsg`):
```html
<p v-if="errorMsg" class="mt-2 text-xs font-semibold text-rose-600">{{ errorMsg }}</p>
```
Remove the old `localStorage.setItem('onamlarim_token', 'demo-token')` and the `loginTimer`-only fake-auth assumption. Keep the reveal animation timing.

- [ ] **Step 6: Update the router guard + main.js boot validation**

In `src/router/index.js`, change the guard to use the access-token key and a mock-mode allowance:
```js
import { API_ENABLED } from '../api/config.js'
// ...
router.beforeEach((to, from, next) => {
  const authed = API_ENABLED ? !!localStorage.getItem('onamlarim_access') : !!localStorage.getItem('onamlarim_demo')
  if (to.path.startsWith('/dashboard') && !authed) next('/login')
  else if (to.path === '/login' && authed) next('/dashboard/overview')
  else next()
})
```
In mock mode, `Login.vue` must set `localStorage.setItem('onamlarim_demo', '1')` after a successful (synthetic) `signIn` so the guard still admits the demo. (Add that one line in the mock branch — gate it on `!API_ENABLED` via an import, or always set it; real mode relies on `onamlarim_access`.) Import `API_ENABLED` into `Login.vue` and set `onamlarim_demo` only when `!API_ENABLED`.

In `src/main.js`, register the auth-failure redirect and validate any existing token on boot before mount:
```js
import { setOnAuthFailure } from './api/client.js'
import { API_ENABLED } from './api/config.js'
import { useAuthStore } from './store/useAuthStore'
// ... after app.use(pinia) and app.use(router):
setOnAuthFailure(() => {
  localStorage.removeItem('onamlarim_access')
  localStorage.removeItem('onamlarim_refresh')
  router.push('/login')
})
if (API_ENABLED && localStorage.getItem('onamlarim_access')) {
  const auth = useAuthStore()
  auth.loadMe().catch(() => {
    localStorage.removeItem('onamlarim_access')
    localStorage.removeItem('onamlarim_refresh')
  })
}
app.mount('#app')
```

- [ ] **Step 7: Header greeting from the auth store**

In `src/layouts/Header.vue`, import `useAuthStore`, and replace the hardcoded current-doctor name/identity in the header with `authStore.user?.name || 'Dr. Müge Ateş Tıkız'` (fallback keeps the mock/demo display). Do not change layout/styles — only the bound text.

- [ ] **Step 8: Run unit tests + commit**

Run: `npm run test:unit` → PASS.
```bash
git add src/store/useAuthStore.js src/store/useAuthStore.spec.js src/views/Login.vue src/router/index.js src/main.js src/layouts/Header.vue
git commit -m "feat(web): real JWT login, auth store, boot validation, guard"
```

---

### Task 10: Frontend — patients store wired to the API

**Files:**
- Modify: `src/store/usePatientStore.js`

**Interfaces:**
- Consumes: `list`/`create` from `patients.api.js` (Task 7).
- Produces: `usePatientStore` with `patients`, `searchQuery`, `filteredPatients` (unchanged surface) plus `loading`, `error`, `load()`, and an async `registerPatient(form)`. The hardcoded array is removed (data now comes from the service; mock mode still yields the seed via the service).

- [ ] **Step 1: Rewrite the store to use the service**

`src/store/usePatientStore.js`:
```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as patientsApi from '../api/patients.api.js'

export const usePatientStore = defineStore('patient', () => {
  const patients = ref([])
  const loading = ref(false)
  const error = ref('')
  const searchQuery = ref('')

  const filteredPatients = computed(() => {
    if (!searchQuery.value.trim()) return patients.value
    const query = searchQuery.value.toLowerCase().trim()
    return patients.value.filter(
      (p) => p.name.toLowerCase().includes(query) ||
             p.tcNo.includes(query) ||
             (p.phone || '').includes(query) ||
             p.id.toLowerCase().includes(query),
    )
  })

  async function load() {
    loading.value = true; error.value = ''
    try { patients.value = await patientsApi.list() }
    catch (e) { error.value = 'Hastalar yüklenemedi.' }
    finally { loading.value = false }
  }

  async function registerPatient(form) {
    const created = await patientsApi.create(form)
    patients.value.unshift(created)
    return created
  }

  return { patients, loading, error, searchQuery, filteredPatients, load, registerPatient }
})
```

- [ ] **Step 2: Make the create form await the async action**

In `src/components/ActionModals.vue`, change `submitPatient` to be `async` and `await patientStore.registerPatient(...)`, with a try/catch that surfaces a failure (keep the existing reset + `closeModal` on success):
```js
async function submitPatient() {
  try {
    await patientStore.registerPatient({ ...patientForm.value })
  } catch (e) {
    alert('Hasta kaydedilemedi. Bilgileri kontrol edin.')
    return
  }
  patientForm.value = { name: '', tcNo: '', phone: '', email: '', bloodType: 'A Rh+' }
  closeModal()
}
```

- [ ] **Step 3: Verify unit tests still pass + commit**

Run: `npm run test:unit` → PASS (no store unit test asserts the old hardcoded array; adapters covered in Task 7).
```bash
git add src/store/usePatientStore.js src/components/ActionModals.vue
git commit -m "feat(web): patients store wired to API (load + register)"
```

---

### Task 11: Frontend — consents store wired + load order + PDF link

**Files:**
- Modify: `src/store/useConsentStore.js`
- Modify: `src/components/ActionModals.vue` (`submitConsent` async)
- Modify: `src/views/Consents.vue` (`saveSignature` async; PDF link in details modal)
- Modify: `src/layouts/MainLayout.vue` (load patients then consents on mount)

**Interfaces:**
- Consumes: `list`/`create`/`sign`/`pdfHref` from `consents.api.js` (Task 8); `usePatientStore` for names + load order; `getAccess` (Task 5) for the authenticated PDF fetch.
- Produces: `useConsentStore` with `consents`, `pendingConsents`, `signedConsents` (unchanged surface) plus `loading`, `error`, `load()`, async `createConsent(form)`, async `signConsent(id, dataUrl)`, and `openPdf(consent)`.

- [ ] **Step 1: Rewrite the store**

`src/store/useConsentStore.js`:
```js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as consentsApi from '../api/consents.api.js'
import { usePatientStore } from './usePatientStore.js'
import { getAccess } from '../api/tokens.js'
import { API_ENABLED } from '../api/config.js'

export const useConsentStore = defineStore('consent', () => {
  const consents = ref([])
  const loading = ref(false)
  const error = ref('')

  const pendingConsents = computed(() => consents.value.filter((c) => c.status === 'pending'))
  const signedConsents = computed(() => consents.value.filter((c) => c.status === 'signed'))

  function patientsById() {
    const patientStore = usePatientStore()
    return Object.fromEntries(patientStore.patients.map((p) => [p.id, p.name]))
  }

  async function load() {
    loading.value = true; error.value = ''
    try {
      const patientStore = usePatientStore()
      consents.value = await consentsApi.list(patientStore.patients)
    } catch (e) { error.value = 'Onamlar yüklenemedi.' }
    finally { loading.value = false }
  }

  async function createConsent(form) {
    const created = await consentsApi.create(form)
    consents.value.unshift(created)
    return created
  }

  async function signConsent(id, signatureDataUrl) {
    const updated = await consentsApi.sign(id, signatureDataUrl, patientsById())
    const idx = consents.value.findIndex((c) => c.id === id)
    if (idx !== -1) consents.value[idx] = { ...consents.value[idx], ...updated }
  }

  // Open the signed PDF. Real mode fetches with the auth token and opens a blob URL.
  async function openPdf(consent) {
    if (!API_ENABLED || !consent.pdfPath) { window.alert('PDF yalnızca canlı backend modunda hazırdır.'); return }
    const res = await fetch(consentsApi.pdfHref(consent), { headers: { Authorization: `Bearer ${getAccess()}` } })
    if (!res.ok) { window.alert('PDF açılamadı.'); return }
    const blob = await res.blob()
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return { consents, loading, error, pendingConsents, signedConsents, load, createConsent, signConsent, openPdf }
})
```

- [ ] **Step 2: Make the consent create + sign callers async**

In `src/components/ActionModals.vue`, change `submitConsent` to `async` and `await consentStore.createConsent(...)` (keep the patient lookup by index and the existing reset + close):
```js
async function submitConsent() {
  const patient = patientStore.patients[consentForm.value.patientIndex]
  if (!patient) return
  try {
    await consentStore.createConsent({
      patientId: patient.id, patientName: patient.name,
      procedure: consentForm.value.procedure, doctor: consentForm.value.doctor,
    })
  } catch (e) { alert('Onam oluşturulamadı.'); return }
  consentForm.value = { patientIndex: '', procedure: '', doctor: 'Dr. Müge Ateş Tıkız' }
  closeModal()
}
```

In `src/views/Consents.vue`, change `saveSignature` to `async` and `await consentStore.signConsent(...)`:
```js
async function saveSignature(dataUrl) {
  if (signingConsent.value) {
    try { await consentStore.signConsent(signingConsent.value.id, dataUrl) }
    catch (e) { alert('İmza kaydedilemedi.') }
  }
  isSignatureOpen.value = false
  signingConsent.value = null
}
```

- [ ] **Step 3: Add the PDF link in the consent details modal**

In `src/views/Consents.vue`, inside the details modal footer (the `div` containing the "Kapat" button, around line 192), add a PDF button shown only for signed consents with a `pdfPath`:
```html
<button
  v-if="selectedDetailsConsent.status === 'signed' && selectedDetailsConsent.pdfPath"
  @click="consentStore.openPdf(selectedDetailsConsent)"
  class="px-4 py-2 border border-[#088496]/30 text-[#088496] rounded-xl text-xs font-semibold hover:bg-[#088496]/10 transition-colors"
>
  PDF'i Aç
</button>
```
(`consentStore` is already in scope in `Consents.vue`.)

- [ ] **Step 4: Load data on dashboard mount (patients first, then consents)**

In `src/layouts/MainLayout.vue` `<script setup>`, add an `onMounted` that loads patients then consents so consent rows resolve patient names:
```js
import { onMounted } from 'vue'
import { usePatientStore } from '../store/usePatientStore'
import { useConsentStore } from '../store/useConsentStore'
const patientStore = usePatientStore()
const consentStore = useConsentStore()
onMounted(async () => {
  await patientStore.load()
  await consentStore.load()
})
```
(If `MainLayout.vue` has no `<script setup>` yet, add one; do not change its template/styles.)

- [ ] **Step 5: Verify unit tests + commit**

Run: `npm run test:unit` → PASS.
```bash
git add src/store/useConsentStore.js src/components/ActionModals.vue src/views/Consents.vue src/layouts/MainLayout.vue
git commit -m "feat(web): consents store wired to API + PDF link + dashboard load order"
```

---

### Task 12: Dev docs + full manual end-to-end verification

**Files:**
- Create: `docs/local-development.md`
- Modify: `README.md` (link to the dev doc, if a README exists; else skip)

**Interfaces:**
- Consumes: everything above.
- Produces: a documented local run flow; a verified end-to-end happy path.

- [ ] **Step 1: Write the dev doc**

`docs/local-development.md`:
```md
# Local Development (frontend + real backend)

1. Start Postgres:        cd server && docker compose up -d
2. Migrate + seed:        npm run db:migrate && npm run db:seed   (creates dr.muge@onamlarim.com / 123456)
3. Start the backend:     npm run start:dev        # http://localhost:3000
4. Configure the SPA:     in the repo root, create .env.local with:
                          VITE_API_URL=http://localhost:3000/api
5. Start the frontend:    npm run dev              # http://localhost:5173
6. Log in with: dr.muge / 123456

Without VITE_API_URL the SPA runs in mock mode (the Vercel demo behavior).
```

- [ ] **Step 2: Run the full test suites**

Run: `cd server && npm test` → all backend suites pass.
Run: `npm run test:unit` (repo root) → all frontend unit tests pass.

- [ ] **Step 3: Manual end-to-end verification (via the run skill)**

Bring up Docker + seed + backend (`npm run start:dev`) + frontend (`.env.local` set, `npm run dev`). Then verify in the browser:
1. Log in `dr.muge / 123456` → reveal animation → dashboard (network tab shows a real `POST /api/auth/login` 200).
2. Patients page lists seeded patients (real `GET /api/patients`). Add a patient → it appears (real `POST /api/patients` 201).
3. Consents page lists seeded consents with patient names resolved. Create a consent → appears as "İmza Bekliyor".
4. Sign it → becomes "İmzalandı"; open details → "PDF'i Aç" downloads/opens a real PDF.
5. Reload the page while logged in → stays authenticated (boot `GET /api/auth/me`).

- [ ] **Step 4: Commit**

```bash
git add docs/local-development.md README.md
git commit -m "docs: local development flow for frontend↔backend integration"
```

---

## Self-Review notes (for the executor)

- **Spec coverage:** dual-mode switch (Task 3), mock preservation (Tasks 4/6/7/8 mock branches), auth + silent refresh + /auth/me (Tasks 5/6/9), patients (Tasks 7/10), consents + PDF (Tasks 8/11 + backend Task 2), CORS (Task 1), adapters (Tasks 7/8), Vitest for adapters/services (Tasks 3–8), dev flow + manual e2e (Task 12). All spec sections map to a task.
- **Load-order dependency:** consents need patients loaded first for name resolution — enforced in Task 11 Step 4 (MainLayout) and the store reads `usePatientStore().patients` at `list()` time.
- **Backend additions ship on this branch** (Tasks 1–2) and merge back with the frontend work.
- **No component tests** by design; Vue wiring is verified manually in Task 12.
