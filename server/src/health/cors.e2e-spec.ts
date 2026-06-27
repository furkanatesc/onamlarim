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
