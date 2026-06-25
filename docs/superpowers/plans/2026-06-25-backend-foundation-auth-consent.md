# Backend Foundation (Auth + Consent) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, test-driven NestJS backend that provides real JWT authentication and an end-to-end Consent ("Onam") workflow (create → sign → archive as PDF) against a Dockerized PostgreSQL, replacing the frontend's Axios mock as the eventual real API.

**Architecture:** A standalone NestJS (TypeScript) application lives in `server/` alongside the existing Vue frontend (monorepo). Data access is via Prisma against PostgreSQL running in Docker Compose. Modules are split by responsibility: `prisma` (DB client), `users`, `auth` (JWT access+refresh, argon2 hashing, guard), `patients`, `consents` (+ synchronous PDF generation to local storage). Tests are integration/e2e via Jest + Supertest against a dedicated test database, reset between tests.

**Tech Stack:** NestJS 10, TypeScript 5, Prisma 5 + `@prisma/client`, PostgreSQL 16 (Docker), `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`, `argon2`, `class-validator` + `class-transformer`, `pdfkit`, Jest + Supertest.

## Global Constraints

- **Runtime:** Node.js ≥ 20. Package manager: `npm`.
- **Language:** TypeScript, `strict: true`. No `any` in committed code except where a third-party type forces it (comment why).
- **Backend lives in `server/`** — a separate package with its own `package.json`. Do NOT modify the root frontend `package.json` in this plan.
- **DB engine:** PostgreSQL only. Local dev + test DB run via `server/docker-compose.yml`. No SQLite fallback.
- **No PII in logs:** never log `tcNo`, `email`, `passwordHash`, or `signatureData`. Log identifiers (uuid) only.
- **Password hashing:** `argon2` (argon2id defaults). Never store or return plaintext or hash to clients.
- **JWT payload shape (canonical, used everywhere):** `{ sub: string /* user id */, email: string, role: Role }`. Access token TTL 15m, refresh token TTL 7d.
- **Role enum (canonical):** `ADMIN | DOCTOR | STAFF`.
- **Multi-branch demo data:** seed roster stays multi-specialty — Dr. Müge Ateş Tıkız (Jinekolojik Onkoloji, login user), Dr. Selin Kaya (Diş Hekimi), Dr. Emre Demir (Kardiyoloji). Do NOT collapse to one specialty.
- **Commit style:** Conventional Commits. Do NOT add a `Co-Authored-By` trailer (user preference).
- **Test DB:** `DATABASE_URL` in `.env.test` points to database `onamlarim_test`; every integration test truncates all tables in `beforeEach` via the shared `resetDb()` helper.

---

## File Structure

```
server/
  docker-compose.yml            # postgres (dev:5432, exposes onamlarim + onamlarim_test)
  package.json
  tsconfig.json
  tsconfig.build.json
  nest-cli.json
  .env                          # DATABASE_URL (dev), JWT secrets
  .env.test                     # DATABASE_URL (test)
  .gitignore
  prisma/
    schema.prisma               # User, Patient, Consent, Role, ConsentStatus
    seed.ts                     # multi-branch demo seed
  storage/consents/             # generated consent PDFs (gitignored)
  src/
    main.ts                     # bootstrap, ValidationPipe, /api prefix
    app.module.ts
    health/health.controller.ts
    config/env.ts               # typed env access
    prisma/
      prisma.service.ts
      prisma.module.ts
    users/
      users.module.ts
      users.service.ts
      users.service.spec.ts
    auth/
      auth.module.ts
      auth.service.ts
      auth.controller.ts
      auth.controller.e2e-spec.ts
      jwt.strategy.ts
      jwt-auth.guard.ts
      current-user.decorator.ts
      dto/register.dto.ts
      dto/login.dto.ts
    patients/
      patients.module.ts
      patients.service.ts
      patients.controller.ts
      patients.controller.e2e-spec.ts
      dto/create-patient.dto.ts
    consents/
      consents.module.ts
      consents.service.ts
      consents.controller.ts
      consents.controller.e2e-spec.ts
      pdf.service.ts
      pdf.service.spec.ts
      dto/create-consent.dto.ts
      dto/sign-consent.dto.ts
  test/
    setup.ts                    # resetDb() helper + global afterAll disconnect
    app-factory.ts              # createTestApp() bootstraps Nest for e2e
```

**Boundaries:** `prisma` owns the DB client (everyone consumes `PrismaService`). `users` owns user persistence + hashing. `auth` owns tokens/guards and depends on `users`. `patients` and `consents` are independent feature modules depending only on `prisma` + `auth` guard. `pdf.service` is the only unit that touches the filesystem.

---

### Task 1: Scaffold NestJS app + Docker Postgres + health check

**Files:**
- Create: `server/package.json`, `server/tsconfig.json`, `server/tsconfig.build.json`, `server/nest-cli.json`, `server/.gitignore`
- Create: `server/docker-compose.yml`, `server/.env`, `server/.env.test`
- Create: `server/src/main.ts`, `server/src/app.module.ts`, `server/src/config/env.ts`, `server/src/health/health.controller.ts`
- Create: `server/test/app-factory.ts`
- Test: `server/src/health/health.controller.e2e-spec.ts`

**Interfaces:**
- Consumes: nothing (first task).
- Produces:
  - `createTestApp(): Promise<INestApplication>` from `test/app-factory.ts` — boots the full Nest app with the same global pipes/prefix as production, for use by every e2e test.
  - `env` object from `src/config/env.ts` with typed getters: `env.databaseUrl: string`, `env.jwtAccessSecret: string`, `env.jwtRefreshSecret: string`, `env.port: number`.
  - HTTP `GET /api/health` → `200 { status: 'ok' }`.

- [ ] **Step 1: Create `server/package.json`**

```json
{
  "name": "onamlarim-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "db:up": "docker compose up -d",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "test": "jest --runInBand",
    "test:e2e": "jest --runInBand"
  },
  "prisma": { "seed": "ts-node prisma/seed.ts" },
  "dependencies": {
    "@nestjs/common": "^10.4.0",
    "@nestjs/core": "^10.4.0",
    "@nestjs/jwt": "^10.2.0",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.4.0",
    "@prisma/client": "^5.22.0",
    "argon2": "^0.41.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "pdfkit": "^0.15.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.0",
    "@nestjs/testing": "^10.4.0",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.14.0",
    "@types/passport-jwt": "^4.0.1",
    "@types/pdfkit": "^0.13.4",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.4"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testRegex": ".*\\.(spec|e2e-spec)\\.ts$",
    "transform": { "^.+\\.ts$": "ts-jest" },
    "setupFilesAfterEnv": ["<rootDir>/test/setup.ts"],
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 2: Create TypeScript + Nest config**

`server/tsconfig.json`:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "strict": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "declaration": false,
    "sourceMap": true
  }
}
```

`server/tsconfig.build.json`:
```json
{ "extends": "./tsconfig.json", "exclude": ["node_modules", "dist", "test", "**/*spec.ts"] }
```

`server/nest-cli.json`:
```json
{ "$schema": "https://json.schemastore.org/nest-cli", "collection": "@nestjs/schematics", "sourceRoot": "src" }
```

`server/.gitignore`:
```
node_modules
dist
.env
.env.test
storage/consents/*
!storage/consents/.gitkeep
```

Also create empty file `server/storage/consents/.gitkeep`.

- [ ] **Step 3: Create env files and typed env accessor**

`server/.env`:
```
DATABASE_URL="postgresql://onamlarim:onamlarim@localhost:5432/onamlarim?schema=public"
JWT_ACCESS_SECRET="dev-access-secret-change-me"
JWT_REFRESH_SECRET="dev-refresh-secret-change-me"
PORT=3000
```

`server/.env.test`:
```
DATABASE_URL="postgresql://onamlarim:onamlarim@localhost:5432/onamlarim_test?schema=public"
JWT_ACCESS_SECRET="test-access-secret"
JWT_REFRESH_SECRET="test-refresh-secret"
PORT=3001
```

`server/src/config/env.ts`:
```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  get databaseUrl(): string { return required('DATABASE_URL'); },
  get jwtAccessSecret(): string { return required('JWT_ACCESS_SECRET'); },
  get jwtRefreshSecret(): string { return required('JWT_REFRESH_SECRET'); },
  get port(): number { return Number(process.env.PORT ?? 3000); },
};
```

- [ ] **Step 4: Create `server/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: onamlarim-postgres
    environment:
      POSTGRES_USER: onamlarim
      POSTGRES_PASSWORD: onamlarim
      POSTGRES_DB: onamlarim
    ports:
      - "5432:5432"
    volumes:
      - onamlarim_pgdata:/var/lib/postgresql/data
      - ./docker/init-test-db.sql:/docker-entrypoint-initdb.d/init-test-db.sql
volumes:
  onamlarim_pgdata:
```

Create `server/docker/init-test-db.sql` so the test database exists on first boot:
```sql
CREATE DATABASE onamlarim_test;
```

- [ ] **Step 5: Create health controller, app module, bootstrap**

`server/src/health/health.controller.ts`:
```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
```

`server/src/app.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController],
})
export class AppModule {}
```

`server/src/main.ts`:
```ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(env.port);
}
void bootstrap();
```

- [ ] **Step 6: Create the e2e app factory**

`server/test/app-factory.ts`:
```ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app;
}
```

Create a minimal `server/test/setup.ts` for now (expanded in Task 2):
```ts
// Loads test env for every Jest run.
import { config } from 'dotenv';
config({ path: '.env.test' });
```
Add `dotenv` to devDependencies (`npm i -D dotenv` in step 8).

- [ ] **Step 7: Write the failing e2e test**

`server/src/health/health.controller.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';

describe('Health (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });

  it('GET /api/health returns ok', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 8: Install deps and start Postgres**

Run (from `server/`):
```bash
npm install
npm i -D dotenv
npm run db:up
```
Expected: `npm install` completes; `docker compose up -d` reports `onamlarim-postgres` started. Verify with `docker ps` (container healthy).

- [ ] **Step 9: Run the test to verify it fails, then passes**

Run: `npm test -- health`
Expected first run BEFORE code complete: FAIL. After steps 5–7 are in place: PASS (1 test).

- [ ] **Step 10: Commit**

```bash
git add server/
git commit -m "feat(server): scaffold NestJS app, docker postgres, health check"
```

---

### Task 2: Prisma integration + initial schema + test DB harness

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/prisma/prisma.service.ts`, `server/src/prisma/prisma.module.ts`
- Modify: `server/src/app.module.ts` (import PrismaModule)
- Modify: `server/test/setup.ts` (add `resetDb()` + global teardown)
- Test: `server/src/prisma/prisma.service.spec.ts`

**Interfaces:**
- Consumes: `env.databaseUrl` (Task 1).
- Produces:
  - `PrismaService` (extends `PrismaClient`, implements `OnModuleInit`/`OnModuleDestroy`) — injectable DB client.
  - `PrismaModule` — global module exporting `PrismaService`.
  - Prisma models: `User { id, email, passwordHash, name, role: Role, createdAt }`, `Patient { id, name, tcNo, phone, email, bloodType, status, createdAt }`, `Consent { id, patientId, patient, procedure, doctorName, status: ConsentStatus, signatureData?, pdfPath?, signedAt?, createdAt }`. Enums `Role = ADMIN|DOCTOR|STAFF`, `ConsentStatus = PENDING|SIGNED`.
  - `resetDb(): Promise<void>` from `test/setup.ts` — truncates User, Patient, Consent.

- [ ] **Step 1: Write `server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  DOCTOR
  STAFF
}

enum ConsentStatus {
  PENDING
  SIGNED
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(STAFF)
  createdAt    DateTime @default(now())
}

model Patient {
  id        String    @id @default(uuid())
  name      String
  tcNo      String    @unique
  phone     String?
  email     String?
  bloodType String?
  status    String    @default("Active")
  createdAt DateTime  @default(now())
  consents  Consent[]
}

model Consent {
  id            String        @id @default(uuid())
  patientId     String
  patient       Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  procedure     String
  doctorName    String
  status        ConsentStatus @default(PENDING)
  signatureData String?
  pdfPath       String?
  signedAt      DateTime?
  createdAt     DateTime      @default(now())
}
```

- [ ] **Step 2: Generate client + create migration**

Run (from `server/`):
```bash
npx prisma migrate dev --name init
```
Expected: creates `prisma/migrations/<ts>_init/`, applies to `onamlarim` dev DB, generates `@prisma/client`. Then apply to the test DB:
```bash
dotenv -e .env.test -- npx prisma migrate deploy
```
(If `dotenv-cli` is not installed, run `npx dotenv-cli -e .env.test -- npx prisma migrate deploy`; add `dotenv-cli` to devDependencies.)
Expected: "All migrations have been applied" against `onamlarim_test`.

- [ ] **Step 3: Create PrismaService + PrismaModule**

`server/src/prisma/prisma.service.ts`:
```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> { await this.$connect(); }
  async onModuleDestroy(): Promise<void> { await this.$disconnect(); }
}
```

`server/src/prisma/prisma.module.ts`:
```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
```

Modify `server/src/app.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 4: Expand `server/test/setup.ts` with resetDb + teardown**

```ts
import { config } from 'dotenv';
config({ path: '.env.test' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function resetDb(): Promise<void> {
  // Order respects FK: consents reference patients.
  await prisma.consent.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
}

afterAll(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 5: Write the failing integration test**

`server/src/prisma/prisma.service.spec.ts`:
```ts
import { PrismaService } from './prisma.service';
import { resetDb } from '../../test/setup';

describe('PrismaService (integration)', () => {
  const prisma = new PrismaService();
  beforeAll(async () => { await prisma.$connect(); });
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await prisma.$disconnect(); });

  it('persists and reads a patient', async () => {
    const created = await prisma.patient.create({
      data: { name: 'Test Hasta', tcNo: '11111111111' },
    });
    const found = await prisma.patient.findUnique({ where: { id: created.id } });
    expect(found?.name).toBe('Test Hasta');
    expect(found?.status).toBe('Active');
  });
});
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- prisma.service`
Expected: PASS (1 test). If it fails with "table does not exist", re-run the test-DB migrate from Step 2.

- [ ] **Step 7: Commit**

```bash
git add server/
git commit -m "feat(server): prisma schema (user/patient/consent) + test db harness"
```

---

### Task 3: Users module (create + findByEmail with argon2 hashing)

**Files:**
- Create: `server/src/users/users.service.ts`, `server/src/users/users.module.ts`
- Test: `server/src/users/users.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService` (Task 2), `Role` enum.
- Produces:
  - `UsersService.create(input: { email: string; password: string; name: string; role?: Role }): Promise<User>` — hashes password with argon2, stores `passwordHash`, returns the `User` row.
  - `UsersService.findByEmail(email: string): Promise<User | null>`.
  - `UsersService.findById(id: string): Promise<User | null>`.
  - `UsersService.verifyPassword(user: User, password: string): Promise<boolean>`.
  - `UsersModule` exporting `UsersService`.

- [ ] **Step 1: Write the failing test**

`server/src/users/users.service.spec.ts`:
```ts
import { Test } from '@nestjs/testing';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersService } from './users.service';
import { resetDb } from '../../test/setup';

describe('UsersService', () => {
  let service: UsersService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UsersService],
    }).compile();
    service = moduleRef.get(UsersService);
  });
  beforeEach(async () => { await resetDb(); });

  it('creates a user with a hashed password (never plaintext)', async () => {
    const user = await service.create({ email: 'a@b.com', password: 'secret123', name: 'Ada' });
    expect(user.email).toBe('a@b.com');
    expect(user.passwordHash).not.toBe('secret123');
    expect(user.passwordHash.startsWith('$argon2')).toBe(true);
  });

  it('finds a user by email and verifies the password', async () => {
    await service.create({ email: 'a@b.com', password: 'secret123', name: 'Ada' });
    const found = await service.findByEmail('a@b.com');
    expect(found).not.toBeNull();
    expect(await service.verifyPassword(found!, 'secret123')).toBe(true);
    expect(await service.verifyPassword(found!, 'wrong')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- users.service`
Expected: FAIL ("Cannot find module './users.service'").

- [ ] **Step 3: Implement UsersService + module**

`server/src/users/users.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateUserInput): Promise<User> {
    const passwordHash = await argon2.hash(input.password);
    return this.prisma.user.create({
      data: { email: input.email, passwordHash, name: input.name, role: input.role ?? Role.STAFF },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  verifyPassword(user: User, password: string): Promise<boolean> {
    return argon2.verify(user.passwordHash, password);
  }
}
```

`server/src/users/users.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';

@Module({ providers: [UsersService], exports: [UsersService] })
export class UsersModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- users.service`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/users
git commit -m "feat(server): users service with argon2 hashing"
```

---

### Task 4: Auth — registration endpoint

**Files:**
- Create: `server/src/auth/dto/register.dto.ts`
- Create: `server/src/auth/auth.service.ts`, `server/src/auth/auth.controller.ts`, `server/src/auth/auth.module.ts`
- Modify: `server/src/app.module.ts` (import AuthModule)
- Test: `server/src/auth/auth.controller.e2e-spec.ts`

**Interfaces:**
- Consumes: `UsersService` (Task 3).
- Produces:
  - `RegisterDto { email: string; password: string; name: string }` (validated).
  - `AuthService.register(dto: RegisterDto): Promise<PublicUser>` where `PublicUser = { id: string; email: string; name: string; role: Role }` (NEVER includes `passwordHash`).
  - `POST /api/auth/register` → `201 { id, email, name, role }`; duplicate email → `409`.
  - `toPublicUser(user: User): PublicUser` helper (exported from `auth.service.ts`, reused by later tasks).

- [ ] **Step 1: Write the failing e2e test**

`server/src/auth/auth.controller.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';
import { resetDb } from '../../test/setup';

describe('Auth — register (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await createTestApp(); });
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await app.close(); });

  it('registers a new user and never returns the password hash', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'dr.muge@onamlarim.com', password: 'secret123', name: 'Dr. Müge' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: 'dr.muge@onamlarim.com', name: 'Dr. Müge', role: 'STAFF' });
    expect(res.body.id).toBeDefined();
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email with 409', async () => {
    const body = { email: 'dup@onamlarim.com', password: 'secret123', name: 'Dup' };
    await request(app.getHttpServer()).post('/api/auth/register').send(body);
    const res = await request(app.getHttpServer()).post('/api/auth/register').send(body);
    expect(res.status).toBe(409);
  });

  it('rejects invalid payloads with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123', name: '' });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth.controller`
Expected: FAIL (404 on the route / module not found).

- [ ] **Step 3: Implement DTO, service, controller, module**

`server/src/auth/dto/register.dto.ts`:
```ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  name!: string;
}
```

`server/src/auth/auth.service.ts`:
```ts
import { ConflictException, Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(private readonly users: UsersService) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.users.create({ email: dto.email, password: dto.password, name: dto.name });
    return toPublicUser(user);
  }
}
```

`server/src/auth/auth.controller.ts`:
```ts
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService, PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }
}
```

`server/src/auth/auth.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

Modify `server/src/app.module.ts` to add `AuthModule` to `imports`:
```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth.controller`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/auth server/src/app.module.ts
git commit -m "feat(server): auth register endpoint with validation + duplicate guard"
```

---

### Task 5: Auth — login with JWT access + refresh tokens

**Files:**
- Create: `server/src/auth/dto/login.dto.ts`
- Modify: `server/src/auth/auth.service.ts` (add `login`, `signTokens`)
- Modify: `server/src/auth/auth.controller.ts` (add `POST /auth/login`)
- Modify: `server/src/auth/auth.module.ts` (register `JwtModule`)
- Modify: `server/src/auth/auth.controller.e2e-spec.ts` (add login describe block)

**Interfaces:**
- Consumes: `UsersService`, `PublicUser`, `toPublicUser`, `env.jwtAccessSecret`, `env.jwtRefreshSecret`.
- Produces:
  - `LoginDto { email: string; password: string }`.
  - `Tokens { accessToken: string; refreshToken: string }`.
  - `AuthService.login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens>` — throws `UnauthorizedException` on bad credentials.
  - `AuthService.signTokens(user: { id: string; email: string; role: Role }): Promise<Tokens>` (reused by refresh in Task 6).
  - JWT payload: `{ sub, email, role }`.
  - `POST /api/auth/login` → `200 { user, accessToken, refreshToken }`.

- [ ] **Step 1: Write the failing test (append to `auth.controller.e2e-spec.ts`)**

```ts
describe('Auth — login (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await createTestApp(); });
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await app.close(); });

  async function registerUser() {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'login@onamlarim.com', password: 'secret123', name: 'Login User' });
  }

  it('returns access + refresh tokens for valid credentials', async () => {
    await registerUser();
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login@onamlarim.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.user.email).toBe('login@onamlarim.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('rejects wrong password with 401', async () => {
    await registerUser();
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'login@onamlarim.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth.controller`
Expected: FAIL on the login describe block (404).

- [ ] **Step 3: Implement LoginDto + JwtModule wiring + service.login**

`server/src/auth/dto/login.dto.ts`:
```ts
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}
```

Modify `server/src/auth/auth.module.ts` to register a default (access) `JwtModule`:
```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { env } from '../config/env';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      secret: env.jwtAccessSecret,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
```

Modify `server/src/auth/auth.service.ts` — add imports, JwtService injection, `Tokens`, `signTokens`, `login`:
```ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { env } from '../config/env';

export interface PublicUser { id: string; email: string; name: string; role: Role; }
export interface Tokens { accessToken: string; refreshToken: string; }

export function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<PublicUser> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.users.create({ email: dto.email, password: dto.password, name: dto.name });
    return toPublicUser(user);
  }

  async login(dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await this.users.verifyPassword(user, dto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.signTokens(user);
    return { user: toPublicUser(user), ...tokens };
  }

  async signTokens(user: { id: string; email: string; role: Role }): Promise<Tokens> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: env.jwtAccessSecret, expiresIn: '15m',
    });
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: env.jwtRefreshSecret, expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
```

Modify `server/src/auth/auth.controller.ts` — add login route (returns 200 explicitly):
```ts
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService, PublicUser, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.login(dto);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth.controller`
Expected: PASS (5 tests total across register + login).

- [ ] **Step 5: Commit**

```bash
git add server/src/auth
git commit -m "feat(server): jwt login with access + refresh tokens"
```

---

### Task 6: JWT guard, `GET /auth/me`, and token refresh

**Files:**
- Create: `server/src/auth/jwt.strategy.ts`, `server/src/auth/jwt-auth.guard.ts`, `server/src/auth/current-user.decorator.ts`
- Modify: `server/src/auth/auth.module.ts` (add PassportModule + JwtStrategy)
- Modify: `server/src/auth/auth.service.ts` (add `refresh`)
- Modify: `server/src/auth/auth.controller.ts` (add `GET /auth/me`, `POST /auth/refresh`)
- Modify: `server/src/auth/auth.controller.e2e-spec.ts` (add protected-route block)

**Interfaces:**
- Consumes: `env.jwtAccessSecret`, `env.jwtRefreshSecret`, `UsersService`, `AuthService.signTokens`, `toPublicUser`.
- Produces:
  - `JwtStrategy` validating access tokens, attaching `req.user: { id, email, role }`.
  - `JwtAuthGuard` (`AuthGuard('jwt')`).
  - `@CurrentUser()` param decorator → `{ id: string; email: string; role: Role }`.
  - `AuthService.refresh(refreshToken: string): Promise<Tokens>` — verifies against refresh secret, re-issues tokens; throws `UnauthorizedException` if invalid.
  - `GET /api/auth/me` (protected) → `200 PublicUser`.
  - `POST /api/auth/refresh` `{ refreshToken }` → `200 Tokens`.

- [ ] **Step 1: Write the failing test (append to `auth.controller.e2e-spec.ts`)**

```ts
describe('Auth — protected + refresh (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => { app = await createTestApp(); });
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await app.close(); });

  async function loginTokens() {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'me@onamlarim.com', password: 'secret123', name: 'Me User' });
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'me@onamlarim.com', password: 'secret123' });
    return res.body as { accessToken: string; refreshToken: string };
  }

  it('rejects /auth/me without a token', async () => {
    const res = await request(app.getHttpServer()).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token', async () => {
    const { accessToken } = await loginTokens();
    const res = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@onamlarim.com');
  });

  it('issues new tokens from a valid refresh token', async () => {
    const { refreshToken } = await loginTokens();
    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.accessToken).toBe('string');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- auth.controller`
Expected: FAIL on the new block (`/auth/me` returns 404, not 401).

- [ ] **Step 3: Implement strategy, guard, decorator, refresh**

`server/src/auth/jwt.strategy.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '@prisma/client';
import { env } from '../config/env';

interface JwtPayload { sub: string; email: string; role: Role; }
export interface AuthUser { id: string; email: string; role: Role; }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.jwtAccessSecret,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

`server/src/auth/jwt-auth.guard.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

`server/src/auth/current-user.decorator.ts`:
```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './jwt.strategy';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    return ctx.switchToHttp().getRequest().user as AuthUser;
  },
);
```

Modify `server/src/auth/auth.module.ts` — add `PassportModule` + `JwtStrategy`, export it:
```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { env } from '../config/env';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({ secret: env.jwtAccessSecret, signOptions: { expiresIn: '15m' } }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
```

Modify `server/src/auth/auth.service.ts` — add `refresh` (append method + needed imports `JwtService` already present):
```ts
  async refresh(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; email: string; role: Role }>(
        refreshToken, { secret: env.jwtRefreshSecret },
      );
      const user = await this.users.findById(payload.sub);
      if (!user) throw new UnauthorizedException('Invalid refresh token');
      return this.signTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
```

Modify `server/src/auth/auth.controller.ts` — add protected `me` and `refresh`:
```ts
import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { AuthService, PublicUser, Tokens } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<PublicUser> {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<{ user: PublicUser } & Tokens> {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser): { id: string; email: string; role: AuthUser['role'] } {
    return { id: user.id, email: user.email, role: user.role };
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body('refreshToken') refreshToken: string): Promise<Tokens> {
    return this.auth.refresh(refreshToken);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- auth.controller`
Expected: PASS (8 tests total). Note `/auth/me` returns `email` so the assertion passes.

- [ ] **Step 5: Commit**

```bash
git add server/src/auth
git commit -m "feat(server): jwt guard, /auth/me, and token refresh"
```

---

### Task 7: Patients module (protected CRUD)

**Files:**
- Create: `server/src/patients/dto/create-patient.dto.ts`
- Create: `server/src/patients/patients.service.ts`, `patients.controller.ts`, `patients.module.ts`
- Modify: `server/src/app.module.ts` (import PatientsModule)
- Test: `server/src/patients/patients.controller.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard` (Task 6), `AuthModule`.
- Produces:
  - `CreatePatientDto { name: string; tcNo: string; phone?: string; email?: string; bloodType?: string }`.
  - `PatientsService.create(dto)`, `.findAll()`, `.findOne(id)` returning Prisma `Patient`.
  - `GET/POST /api/patients`, `GET /api/patients/:id` — all behind `JwtAuthGuard`.

- [ ] **Step 1: Write the failing e2e test**

`server/src/patients/patients.controller.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';
import { resetDb } from '../../test/setup';

describe('Patients (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await resetDb();
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'staff@onamlarim.com', password: 'secret123', name: 'Staff' });
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'staff@onamlarim.com', password: 'secret123' });
    token = res.body.accessToken;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('rejects unauthenticated access with 401', async () => {
    const res = await request(app.getHttpServer()).get('/api/patients');
    expect(res.status).toBe(401);
  });

  it('creates and lists patients', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/patients').set(auth())
      .send({ name: 'Ahmet Yılmaz', tcNo: '23485910292', bloodType: 'A Rh+' });
    expect(create.status).toBe(201);
    expect(create.body.id).toBeDefined();

    const list = await request(app.getHttpServer()).get('/api/patients').set(auth());
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('Ahmet Yılmaz');
  });

  it('fetches one patient by id', async () => {
    const create = await request(app.getHttpServer())
      .post('/api/patients').set(auth())
      .send({ name: 'Merve Demir', tcNo: '10984950384' });
    const res = await request(app.getHttpServer())
      .get(`/api/patients/${create.body.id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.tcNo).toBe('10984950384');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- patients.controller`
Expected: FAIL (404 / module not found).

- [ ] **Step 3: Implement DTO, service, controller, module**

`server/src/patients/dto/create-patient.dto.ts`:
```ts
import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePatientDto {
  @IsString() @Length(1, 120)
  name!: string;

  @IsString() @Length(11, 11)
  tcNo!: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  bloodType?: string;
}
```

`server/src/patients/patients.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePatientDto): Promise<Patient> {
    return this.prisma.patient.create({ data: dto });
  }

  findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
```

`server/src/patients/patients.controller.ts`:
```ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  create(@Body() dto: CreatePatientDto): Promise<Patient> {
    return this.patients.create(dto);
  }

  @Get()
  findAll(): Promise<Patient[]> {
    return this.patients.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Patient> {
    return this.patients.findOne(id);
  }
}
```

`server/src/patients/patients.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';

@Module({
  imports: [AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
```

Add `PatientsModule` to `app.module.ts` imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- patients.controller`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/patients server/src/app.module.ts
git commit -m "feat(server): protected patients CRUD"
```

---

### Task 8: Consents module (create / list / get / sign — protected)

**Files:**
- Create: `server/src/consents/dto/create-consent.dto.ts`, `server/src/consents/dto/sign-consent.dto.ts`
- Create: `server/src/consents/consents.service.ts`, `consents.controller.ts`, `consents.module.ts`
- Modify: `server/src/app.module.ts` (import ConsentsModule)
- Test: `server/src/consents/consents.controller.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `JwtAuthGuard`, `AuthModule`. Patient rows from Task 7's data model.
- Produces:
  - `CreateConsentDto { patientId: string; procedure: string; doctorName: string }`.
  - `SignConsentDto { signatureData: string }` (a data-URL string, matching `signature_pad` output used by the frontend).
  - `ConsentsService.create(dto)`, `.findAll()`, `.findOne(id)`, `.sign(id, signatureData)` — `sign` sets `status=SIGNED`, stores `signatureData`, sets `signedAt`. (PDF generation is added in Task 9.)
  - `GET/POST /api/consents`, `GET /api/consents/:id`, `POST /api/consents/:id/sign` — behind `JwtAuthGuard`.

- [ ] **Step 1: Write the failing e2e test**

`server/src/consents/consents.controller.e2e-spec.ts`:
```ts
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';
import { resetDb } from '../../test/setup';

const SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>';

describe('Consents (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let patientId: string;

  beforeAll(async () => { app = await createTestApp(); });
  afterAll(async () => { await app.close(); });
  beforeEach(async () => {
    await resetDb();
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email: 'doc@onamlarim.com', password: 'secret123', name: 'Doc' });
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'doc@onamlarim.com', password: 'secret123' });
    token = login.body.accessToken;
    const patient = await request(app.getHttpServer())
      .post('/api/patients').set({ Authorization: `Bearer ${token}` })
      .send({ name: 'Elif Kaya', tcNo: '59203948591' });
    patientId = patient.body.id;
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  it('creates a pending consent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId, procedure: 'Histeroskopi', doctorName: 'Dr. Müge Ateş Tıkız' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.signatureData).toBeNull();
  });

  it('signs a consent and marks it signed', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId, procedure: 'Histeroskopi', doctorName: 'Dr. Müge Ateş Tıkız' });
    const signed = await request(app.getHttpServer())
      .post(`/api/consents/${created.body.id}/sign`).set(auth())
      .send({ signatureData: SIGNATURE });
    expect(signed.status).toBe(200);
    expect(signed.body.status).toBe('SIGNED');
    expect(signed.body.signedAt).not.toBeNull();
  });

  it('lists consents', async () => {
    await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId, procedure: 'Kanal Tedavisi', doctorName: 'Dr. Selin Kaya' });
    const list = await request(app.getHttpServer()).get('/api/consents').set(auth());
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- consents.controller`
Expected: FAIL (404 / module not found).

- [ ] **Step 3: Implement DTOs, service, controller, module**

`server/src/consents/dto/create-consent.dto.ts`:
```ts
import { IsString, IsUUID, Length } from 'class-validator';

export class CreateConsentDto {
  @IsUUID()
  patientId!: string;

  @IsString() @Length(1, 200)
  procedure!: string;

  @IsString() @Length(1, 120)
  doctorName!: string;
}
```

`server/src/consents/dto/sign-consent.dto.ts`:
```ts
import { IsString, MinLength } from 'class-validator';

export class SignConsentDto {
  @IsString() @MinLength(1)
  signatureData!: string;
}
```

`server/src/consents/consents.service.ts`:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Consent, ConsentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ConsentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateConsentDto): Promise<Consent> {
    return this.prisma.consent.create({ data: dto });
  }

  findAll(): Promise<Consent[]> {
    return this.prisma.consent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Consent> {
    const consent = await this.prisma.consent.findUnique({ where: { id } });
    if (!consent) throw new NotFoundException('Consent not found');
    return consent;
  }

  async sign(id: string, signatureData: string): Promise<Consent> {
    await this.findOne(id); // throws 404 if missing
    return this.prisma.consent.update({
      where: { id },
      data: { status: ConsentStatus.SIGNED, signatureData, signedAt: new Date() },
    });
  }
}
```

`server/src/consents/consents.controller.ts`:
```ts
import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { Consent } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { SignConsentDto } from './dto/sign-consent.dto';

@Controller('consents')
@UseGuards(JwtAuthGuard)
export class ConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Post()
  create(@Body() dto: CreateConsentDto): Promise<Consent> {
    return this.consents.create(dto);
  }

  @Get()
  findAll(): Promise<Consent[]> {
    return this.consents.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Consent> {
    return this.consents.findOne(id);
  }

  @Post(':id/sign')
  @HttpCode(200)
  sign(@Param('id') id: string, @Body() dto: SignConsentDto): Promise<Consent> {
    return this.consents.sign(id, dto.signatureData);
  }
}
```

`server/src/consents/consents.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ConsentsService } from './consents.service';
import { ConsentsController } from './consents.controller';

@Module({
  imports: [AuthModule],
  controllers: [ConsentsController],
  providers: [ConsentsService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
```

Add `ConsentsModule` to `app.module.ts` imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- consents.controller`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/consents server/src/app.module.ts
git commit -m "feat(server): protected consents create/list/get/sign"
```

---

### Task 9: Consent PDF generation (synchronous, local storage)

> **Scope note:** This task generates the PDF synchronously to local disk on sign — enough to satisfy the Phase 0 "PDF üretilir ve arşivlenir" DoD locally. The async SQS-worker + Turkish object-storage version is deferred to the separate Infrastructure plan.

**Files:**
- Create: `server/src/consents/pdf.service.ts`
- Modify: `server/src/consents/consents.service.ts` (call PdfService on sign, store `pdfPath`)
- Modify: `server/src/consents/consents.module.ts` (provide PdfService)
- Test: `server/src/consents/pdf.service.spec.ts`
- Modify: `server/src/consents/consents.controller.e2e-spec.ts` (assert `pdfPath` after sign)

**Interfaces:**
- Consumes: `Consent` row, `pdfkit`, Node `fs`.
- Produces:
  - `PdfService.generateConsentPdf(consent: { id: string; procedure: string; doctorName: string; signatureData: string | null }): Promise<string>` — writes `storage/consents/<id>.pdf`, returns the relative path.
  - On sign, `ConsentsService.sign` sets `pdfPath` to that path.

- [ ] **Step 1: Write the failing unit test**

`server/src/consents/pdf.service.spec.ts`:
```ts
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  const service = new PdfService();
  const id = 'test-consent-id';
  const path = join(process.cwd(), 'storage', 'consents', `${id}.pdf`);

  afterAll(() => { if (existsSync(path)) rmSync(path); });

  it('writes a non-empty PDF file and returns its relative path', async () => {
    const rel = await service.generateConsentPdf({
      id, procedure: 'Histeroskopi', doctorName: 'Dr. Müge', signatureData: 'data:image/svg+xml;utf8,<svg/>',
    });
    expect(rel).toBe(`storage/consents/${id}.pdf`);
    expect(existsSync(path)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- pdf.service`
Expected: FAIL ("Cannot find module './pdf.service'").

- [ ] **Step 3: Implement PdfService**

`server/src/consents/pdf.service.ts`:
```ts
import { Injectable } from '@nestjs/common';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import PDFDocument from 'pdfkit';

interface ConsentPdfInput {
  id: string;
  procedure: string;
  doctorName: string;
  signatureData: string | null;
}

@Injectable()
export class PdfService {
  private readonly dir = join(process.cwd(), 'storage', 'consents');

  generateConsentPdf(consent: ConsentPdfInput): Promise<string> {
    mkdirSync(this.dir, { recursive: true });
    const absPath = join(this.dir, `${consent.id}.pdf`);
    const relPath = `storage/consents/${consent.id}.pdf`;

    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = createWriteStream(absPath);
      doc.pipe(stream);
      doc.fontSize(18).text('Onam Belgesi', { align: 'center' }).moveDown();
      doc.fontSize(12).text(`Onam No: ${consent.id}`);
      doc.text(`İşlem: ${consent.procedure}`);
      doc.text(`Hekim: ${consent.doctorName}`);
      doc.moveDown().text(consent.signatureData ? 'İmzalanmıştır.' : 'İmza bekliyor.');
      doc.end();
      stream.on('finish', () => resolve(relPath));
      stream.on('error', reject);
    });
  }
}
```

- [ ] **Step 4: Run unit test to verify it passes**

Run: `npm test -- pdf.service`
Expected: PASS (1 test).

- [ ] **Step 5: Wire PdfService into sign flow**

Modify `server/src/consents/consents.service.ts` — inject `PdfService`, generate PDF on sign:
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Consent, ConsentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { PdfService } from './pdf.service';

@Injectable()
export class ConsentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  create(dto: CreateConsentDto): Promise<Consent> {
    return this.prisma.consent.create({ data: dto });
  }

  findAll(): Promise<Consent[]> {
    return this.prisma.consent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Consent> {
    const consent = await this.prisma.consent.findUnique({ where: { id } });
    if (!consent) throw new NotFoundException('Consent not found');
    return consent;
  }

  async sign(id: string, signatureData: string): Promise<Consent> {
    const consent = await this.findOne(id);
    const pdfPath = await this.pdf.generateConsentPdf({
      id: consent.id, procedure: consent.procedure, doctorName: consent.doctorName, signatureData,
    });
    return this.prisma.consent.update({
      where: { id },
      data: { status: ConsentStatus.SIGNED, signatureData, signedAt: new Date(), pdfPath },
    });
  }
}
```

Modify `server/src/consents/consents.module.ts` providers to include `PdfService`:
```ts
  providers: [ConsentsService, PdfService],
```
(add the import).

- [ ] **Step 6: Strengthen the e2e sign test**

In `consents.controller.e2e-spec.ts`, inside the "signs a consent" test, after the existing assertions add:
```ts
    expect(signed.body.pdfPath).toBe(`storage/consents/${created.body.id}.pdf`);
```

- [ ] **Step 7: Run the full consents suite**

Run: `npm test -- consents`
Expected: PASS (pdf.service 1 + consents.controller 3).

- [ ] **Step 8: Commit**

```bash
git add server/src/consents
git commit -m "feat(server): generate consent pdf on sign (local storage)"
```

---

### Task 10: Multi-branch demo seed

**Files:**
- Create: `server/prisma/seed.ts`
- Test: `server/prisma/seed.spec.ts`

**Interfaces:**
- Consumes: `PrismaClient`, `argon2`.
- Produces:
  - `seed(): Promise<void>` — idempotent (clears then inserts) seed creating the login user `dr.muge@onamlarim.com` (password `123456`, role DOCTOR), the multi-branch doctor roster reference, demo patients, and demo consents (1 pending, 1 signed). Exported so the test can call it; also runnable via `npm run db:seed`.

- [ ] **Step 1: Write the failing test**

`server/prisma/seed.spec.ts`:
```ts
import { PrismaClient } from '@prisma/client';
import { seed } from './seed';
import { resetDb } from '../test/setup';

const prisma = new PrismaClient();

describe('seed', () => {
  beforeEach(async () => { await resetDb(); });
  afterAll(async () => { await prisma.$disconnect(); });

  it('creates the login user and multi-branch demo data', async () => {
    await seed();
    const muge = await prisma.user.findUnique({ where: { email: 'dr.muge@onamlarim.com' } });
    expect(muge?.role).toBe('DOCTOR');

    const patients = await prisma.patient.count();
    expect(patients).toBeGreaterThanOrEqual(3);

    const signed = await prisma.consent.count({ where: { status: 'SIGNED' } });
    const pending = await prisma.consent.count({ where: { status: 'PENDING' } });
    expect(signed).toBeGreaterThanOrEqual(1);
    expect(pending).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- seed`
Expected: FAIL ("Cannot find module './seed'").

- [ ] **Step 3: Implement the seed**

`server/prisma/seed.ts`:
```ts
import { PrismaClient, Role, ConsentStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

export async function seed(): Promise<void> {
  await prisma.consent.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Login user (demo) — Dr. Müge Ateş Tıkız, Jinekolojik Onkoloji.
  await prisma.user.create({
    data: {
      email: 'dr.muge@onamlarim.com',
      passwordHash: await argon2.hash('123456'),
      name: 'Dr. Müge Ateş Tıkız',
      role: Role.DOCTOR,
    },
  });

  // Multi-branch demo patients.
  const ahmet = await prisma.patient.create({
    data: { name: 'Ahmet Yılmaz', tcNo: '23485910292', bloodType: 'A Rh+', phone: '+90 532 123 45 67' },
  });
  const elif = await prisma.patient.create({
    data: { name: 'Elif Kaya', tcNo: '59203948591', bloodType: 'AB Rh+' },
  });
  await prisma.patient.create({
    data: { name: 'Merve Demir', tcNo: '10984950384', bloodType: '0 Rh-' },
  });

  // Demo consents across specialties: one pending, one signed.
  await prisma.consent.create({
    data: { patientId: elif.id, procedure: 'Histeroskopi', doctorName: 'Dr. Müge Ateş Tıkız', status: ConsentStatus.PENDING },
  });
  await prisma.consent.create({
    data: {
      patientId: ahmet.id, procedure: 'Koroner Anjiyografi', doctorName: 'Dr. Emre Demir',
      status: ConsentStatus.SIGNED, signedAt: new Date(),
      signatureData: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>',
    },
  });
}

if (require.main === module) {
  seed()
    .then(() => prisma.$disconnect())
    .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- seed`
Expected: PASS (1 test).

- [ ] **Step 5: Run the full suite + seed the dev DB**

Run: `npm test`
Expected: ALL suites PASS (health, prisma, users, auth, patients, consents, pdf, seed).
Then seed the dev database for manual checks:
```bash
npm run db:seed
```
Expected: completes without error.

- [ ] **Step 6: Commit**

```bash
git add server/prisma/seed.ts server/prisma/seed.spec.ts
git commit -m "feat(server): multi-branch demo seed (login user + patients + consents)"
```

---

## Self-Review

**1. Spec coverage (against ROADMAP Faz 0 backend DoD — "gerçek hesapla giriş, gerçek onam oluştur/imzala, PDF Türkiye'de üretilir/arşivlenir, hiçbir PII AWS'te kalıcı değil"):**
- Real login → Tasks 4–6 (register/login/JWT/guard/refresh). ✓
- Create + sign consent → Tasks 8. ✓
- PDF generated + archived → Task 9 (local; async/TR-storage deferred to infra plan, noted). ✓
- No PII in AWS → N/A at this local stage; enforced later by infra plan. Global Constraint "no PII in logs" covers code hygiene now. ✓
- Patients data model → Task 7. ✓
- DB schema/migration → Task 2. ✓
- Multi-branch demo data (memory constraint) → Task 10. ✓
- Frontend integration (remove axios mock) → **explicitly out of scope** for this plan; it is the next sub-plan, as agreed. Noted in plan intro + ROADMAP.

**2. Placeholder scan:** No "TBD"/"TODO"/"handle edge cases" left. Every code step shows full code. ✓

**3. Type consistency:** `PublicUser`, `Tokens`, `AuthUser`, `toPublicUser`, `signTokens`, `JwtAuthGuard`, `PrismaService`, `resetDb`, `createTestApp` are defined once and consumed with identical signatures across Tasks 1–10. JWT payload `{ sub, email, role }` is identical in `signTokens` (Task 5), `refresh` (Task 6), and `JwtStrategy.validate` (Task 6). Consent `sign` signature `(id, signatureData)` is identical in Tasks 8 and 9. ✓

**Open follow-ups (separate plans, not this one):**
- Infrastructure plan: Terraform/AWS landing zone, Cloudflare, TR-Postgres + VPN, async PDF via SQS → TR object storage, CI/CD. Blocked on the Turkish-provider decision (ROADMAP §5).
- Frontend integration plan: remove `src/api/axios.js` mock, point stores at this API, real token/refresh handling.
- Later Phase 1 items: RBAC enforcement (roles exist but aren't yet enforced per-route), audit log, KVKK data-subject rights.
