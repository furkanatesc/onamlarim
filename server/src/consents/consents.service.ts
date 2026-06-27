import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Consent, ConsentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConsentDto } from './dto/create-consent.dto';

@Injectable()
export class ConsentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConsentDto): Promise<Consent> {
    try {
      return await this.prisma.consent.create({ data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2003') {
        throw new BadRequestException('Patient not found');
      }
      throw e;
    }
  }

  findAll(): Promise<Consent[]> {
    return this.prisma.consent.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Consent> {
    const consent = await this.prisma.consent.findUnique({ where: { id } });
    if (!consent) throw new NotFoundException('Consent not found');
    return consent;
  }

  async sign(id: string, signatureData: string): Promise<Consent> {
    try {
      return await this.prisma.consent.update({
        where: { id },
        data: { status: ConsentStatus.SIGNED, signatureData, signedAt: new Date() },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Consent not found');
      }
      throw e;
    }
  }
}
