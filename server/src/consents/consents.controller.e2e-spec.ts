import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from '../../test/app-factory';
import { resetDb } from '../../test/setup';

const SIGNATURE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><path d="M 10 15 Q 30 5 50 15 T 90 15" fill="none" stroke="black" stroke-width="2"/></svg>';

const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';

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
    expect(created.status).toBe(201);
    const signed = await request(app.getHttpServer())
      .post(`/api/consents/${created.body.id}/sign`).set(auth())
      .send({ signatureData: SIGNATURE });
    expect(signed.status).toBe(200);
    expect(signed.body.status).toBe('SIGNED');
    expect(signed.body.signedAt).not.toBeNull();
    expect(signed.body.pdfPath).toBe(`storage/consents/${created.body.id}.pdf`);
  });

  it('lists consents', async () => {
    await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId, procedure: 'Kanal Tedavisi', doctorName: 'Dr. Selin Kaya' });
    const list = await request(app.getHttpServer()).get('/api/consents').set(auth());
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('returns 404 for a nonexistent consent id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/consents/${NONEXISTENT_ID}`).set(auth());
    expect(res.status).toBe(404);
  });

  it('returns 404 when signing a nonexistent consent', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/consents/${NONEXISTENT_ID}/sign`).set(auth())
      .send({ signatureData: SIGNATURE });
    expect(res.status).toBe(404);
  });

  it('rejects invalid create body with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId: 'not-a-uuid', procedure: '', doctorName: '' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed consent id with 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/consents/not-a-uuid').set(auth());
    expect(res.status).toBe(400);
  });

  it('rejects a consent for a nonexistent patient with 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/consents').set(auth())
      .send({ patientId: NONEXISTENT_ID, procedure: 'Histeroskopi', doctorName: 'Dr. Müge Ateş Tıkız' });
    expect(res.status).toBe(400);
  });
});
