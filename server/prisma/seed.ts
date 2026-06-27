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
    data: { name: 'Merve Demir', tcNo: '10984950384', bloodType: 'O Rh-' },
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
