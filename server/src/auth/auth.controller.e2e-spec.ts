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
