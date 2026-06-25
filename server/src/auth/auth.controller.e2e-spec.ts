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
