# Frontend ↔ Backend API Integration — Design

**Date:** 2026-06-28
**Status:** Approved (brainstorming), ready for implementation plan
**Branch:** `feat/frontend-api-integration`
**Builds on:** Phase 0 backend foundation (`server/`, merged to `main` at `d668adb`) — auth, patients, consents, PDF-on-sign.

## Goal

Wire the Vue 3 SPA's auth, patients, and consents modules to the real NestJS backend for **local development**, while keeping the deployed Vercel demo working on mock data (Vercel cannot reach a localhost backend). Inventory and MHRS stay on mock — they have no backend yet (Phase 1).

This is the ROADMAP Faz 0 "Frontend entegrasyonu" item, scoped to the three modules the backend actually serves.

## Scope

**In scope:** Auth (real JWT login + silent refresh + `/auth/me` token validation), Patients (list/create), Consents (list/create/sign + PDF download link).

**Out of scope (stays mock / deferred):** Inventory, MHRS (no backend); full Profile-page hydration (backend lacks specialty/clinic/education fields — stays static demo, header greeting uses real identity); cloud deployment of the backend (separate infra plan); Vercel hitting a real API.

## Key constraint: dual mode (real vs mock), single switch point

The deployed Vercel demo must keep working with polished mock data. The same build supports both modes via one env var:

- `VITE_API_URL` **set** (local dev, `.env.local`) → real backend.
- `VITE_API_URL` **absent** (Vercel) → mock data, demo behaves as today.

**The service layer is the single switch point.** Stores always call an API service; the service decides real-vs-mock based on `API_ENABLED = !!import.meta.env.VITE_API_URL`. Stores stay single-path; loading/error states are uniform across both modes. The current "catch network error → return mock" hack in `src/api/axios.js` is removed in favor of this explicit env gate.

## Architecture

New file layout under `src/api/`:

```
src/api/
  client.js        # axios instance (baseURL = VITE_API_URL); request interceptor attaches
                   # access token; response interceptor does 401 silent-refresh + one retry
  config.js        # export const API_ENABLED = !!import.meta.env.VITE_API_URL
  auth.api.js      # login(), refresh(), me()           (+ mock fallback)
  patients.api.js  # list(), create()                   (+ adapter + mock fallback)
  consents.api.js  # list(), create(), sign(), pdfUrl() (+ adapter + mock fallback)
  mock/
    seed.js        # the hardcoded arrays currently living in the stores, moved here;
                   # services return this when API_ENABLED is false
```

`src/api/axios.js` is replaced by `src/api/client.js`. Existing stores (`useConsentStore`, `usePatientStore`) keep their public surface (state + computed + actions) so Vue components are untouched; their internals change to call services.

## Auth flow

**Login (`Login.vue` → `auth.api.login`):**
- `handleLogin()` calls real `POST /api/auth/login`. The demo username `dr.muge` is mapped to the seeded email by appending `@onamlarim.com` when the input contains no `@` → `{ email: 'dr.muge@onamlarim.com', password: '123456' }`. Quick-fill unchanged.
- Success → store `accessToken` + `refreshToken` in localStorage → existing reveal animation → dashboard. **UX/animation preserved exactly**; only the fake `setTimeout` is replaced by the real call.
- Failure (401 / wrong password / backend down) → do not trigger reveal; show a polite inline error under the card; clear loading.
- Mock mode (Vercel, no `VITE_API_URL`): `auth.api.login` returns a synthetic success → demo still opens.

**Token storage & transport:**
- Both tokens in `localStorage`: `onamlarim_access`, `onamlarim_refresh`. The old `onamlarim_token` key is removed.
- `client.js` request interceptor sets `Authorization: Bearer <accessToken>`.

**Silent refresh (401):**
- Response interceptor on 401 → `POST /api/auth/refresh` with the refresh token → store new tokens → retry the original request **once**. If refresh itself fails (or the 401 came from the refresh call) → clear tokens → redirect to `/login`. Guard against infinite loops: the refresh request is not itself retried.

**Token validation on app load (`/auth/me`):**
- On app init (when `API_ENABLED` and a token exists), call `GET /api/auth/me`. Invalid/expired token → clear + redirect to `/login`. Valid → populate a small `useAuthStore` with `{ name, email, role }`.
- The header greeting/identity uses `useAuthStore` (real session user) instead of a hardcoded "Dr. Müge". The Profile page's rich demo fields (specialty, clinic, education) stay static for now.

**Router guard:**
- Keep the existing presence-based guard, updated to read `onamlarim_access`. Real validity is enforced by the `/auth/me` check + 401 interceptor.

## Data flow & adapters

General pattern per data store: store calls service → tracks loading/error → holds data. In mock mode the service returns `seed.js`; store code is identical.

**Patients (`usePatientStore` + `patients.api.js`):**
- `load()`: `GET /api/patients` → adapter maps each record to the frontend shape. Backend has no `lastVisit`/`status` → **derive in adapter**: `lastVisit ← createdAt` (date part), `status ← 'Active'` (default). Other fields map 1:1.
- `registerPatient(dto)`: `POST /api/patients` with `{ name, tcNo, phone?, email?, bloodType? }` → run the returned record through the adapter, `unshift` into the list. Backend 400/409 → error state.
- `filteredPatients` / `searchQuery` unchanged (client-side search).

**Consents (`useConsentStore` + `consents.api.js`):**
- `load()`: `GET /api/consents` → adapter maps: `doctor ← doctorName`, `signature ← signatureData`, `status ← status.toLowerCase()` (PENDING→pending), `date ← signedAt || createdAt`, `patientName ← lookup by patientId from the patients list`.
- `createConsent(dto)`: `POST /api/consents` with `{ patientId, procedure, doctorName }`. Adapter (write side) maps `doctor → doctorName` and takes `patientId` from the selected patient.
- `signConsent(id, signatureDataUrl)`: `POST /api/consents/:id/sign` with `{ signatureData }` → run returned record through adapter, update state.
- `pendingConsents` / `signedConsents` computed unchanged (lowercase status preserved).

**PDF link (UI):** Signed consents show a small "PDF" link/badge. Clicking opens the PDF via an authenticated request to the new backend download endpoint (new tab / download). The frontend reads `pdfPath` presence to decide whether to show the link.

**Load ordering:** The consents adapter needs the patients list for `patientName`. On dashboard mount, **load patients first, then consents**, so consent rows can resolve names from the in-memory patient list.

## Required backend additions (small, on `main` lineage)

Two unavoidable backend changes, each a small TDD commit:

1. **CORS (`server/src/main.ts`):** enable CORS for the Vite dev origin — `app.enableCors({ origin: ['http://localhost:5173'], credentials: true })`. Without it the browser blocks cross-origin calls from `localhost:5173` to `localhost:3000`. Test: e2e asserting the preflight returns the correct `Access-Control-Allow-Origin`.

2. **PDF download endpoint (`server/src/consents/consents.controller.ts` + service):** `GET /api/consents/:id/pdf` behind `JwtAuthGuard` — streams the file at `pdfPath` as `application/pdf`; 404 if the consent or PDF is missing. The PDF is currently written to disk but never served. Test: register→login→patient→consent→sign→`GET .../pdf` → 200 + `content-type: application/pdf`; nonexistent id → 404; no token → 401.

## Local development workflow

Documented in a README/dev note:

```
1. Docker Postgres:   cd server && docker compose up -d
2. Migrate + seed:    npm run db:migrate && npm run db:seed   (creates login user)
3. Backend:           npm run start:dev      (→ localhost:3000)
4. Frontend:          (repo root) put VITE_API_URL=http://localhost:3000/api in .env.local → npm run dev (→ localhost:5173)
5. Log in: dr.muge / 123456
```

- `.env.local` is gitignored; add `.env.example` with `VITE_API_URL=` as documentation.
- Vercel has no `VITE_API_URL` → mock mode → demo unchanged.

## Testing

**Backend (TDD, existing Jest + supertest harness):**
- CORS preflight test (above).
- PDF endpoint tests (above): 200 + `application/pdf`, 404, 401.

**Frontend (new, minimal):**
- Add **Vitest** and write **unit tests for the adapter + service layer only** — the backend↔frontend shape mapping (both directions) and the mock/real switch. Adapters are the most fragile part and are pure functions, so they are cheap, high-value coverage.
- No Vue component tests — verified manually.

**End-to-end manual verification (via run skill):** bring up Docker + seed + backend + frontend → log in `dr.muge/123456` → add a patient (appears in list) → create a consent → sign it → the PDF link opens.

## Risks / notes

- The two backend additions touch code already merged to `main`; they ship as small commits on this branch and merge back with the frontend work.
- `patientName` resolution depends on the patients list being loaded first; if a consent references a patient not in the loaded list (shouldn't happen with the seed), the adapter falls back to showing the `patientId`.
- Silent-refresh must not loop: the refresh call is excluded from retry.
