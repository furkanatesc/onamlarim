import { Injectable, NotFoundException } from '@nestjs/common';
import { Patient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePatientDto): Promise<Patient> {
    return this.prisma.patient.create({ data: dto });
  }

  findAll(): Promise<Patient[]> {
    return this.prisma.patient.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string): Promise<Patient> {
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }
}
