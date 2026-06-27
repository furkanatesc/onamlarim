import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Consent } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { SignConsentDto } from './dto/sign-consent.dto';

@Controller('consents')
@UseGuards(JwtAuthGuard)
export class ConsentsController {
  constructor(private readonly consents: ConsentsService) {}

  @Post()
  create(@Body() dto: CreateConsentDto): Promise<Consent> {
    return this.consents.create(dto);
  }

  @Get()
  findAll(): Promise<Consent[]> {
    return this.consents.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Consent> {
    return this.consents.findOne(id);
  }

  @Post(':id/sign')
  @HttpCode(200)
  sign(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SignConsentDto): Promise<Consent> {
    return this.consents.sign(id, dto.signatureData);
  }
}
