import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PatientsModule } from './patients/patients.module';
import { ConsentsModule } from './consents/consents.module';

@Module({
  imports: [PrismaModule, AuthModule, PatientsModule, ConsentsModule],
  controllers: [HealthController],
})
export class AppModule {}
