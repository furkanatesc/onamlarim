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
