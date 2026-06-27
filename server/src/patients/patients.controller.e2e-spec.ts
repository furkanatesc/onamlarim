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
    expect(create.status).toBe(201);
    const res = await request(app.getHttpServer())
      .get(`/api/patients/${create.body.id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.tcNo).toBe('10984950384');
  });

  it('returns 404 for a nonexistent patient id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/patients/00000000-0000-0000-0000-000000000000').set(auth());
    expect(res.status).toBe(404);
  });

  it('rejects invalid create body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/patients').set(auth())
      .send({ name: '', tcNo: '123' });
    expect(res.status).toBe(400);
  });
});
