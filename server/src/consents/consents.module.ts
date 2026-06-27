import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConsentsService } from './consents.service';
import { ConsentsController } from './consents.controller';
import { PdfService } from './pdf.service';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [ConsentsController],
  providers: [ConsentsService, PdfService],
  exports: [ConsentsService],
})
export class ConsentsModule {}
