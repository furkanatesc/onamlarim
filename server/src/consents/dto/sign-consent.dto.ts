import { IsString, MinLength } from 'class-validator';

export class SignConsentDto {
  @IsString() @MinLength(1)
  signatureData!: string;
}
