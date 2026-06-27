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
