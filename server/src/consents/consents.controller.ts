import { Body, Controller, Get, Header, HttpCode, Param, ParseUUIDPipe, Post, Res, UseGuards } from '@nestjs/common';
import { Consent } from '@prisma/client';
import type { Response } from 'express';
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

  @Get(':id/pdf')
  @Header('Content-Type', 'application/pdf')
  async getPdf(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response): Promise<void> {
    const { stream, filename } = await this.consents.getPdf(id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end();
      else res.end();
    });
    stream.pipe(res);
  }
}
