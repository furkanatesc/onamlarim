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
