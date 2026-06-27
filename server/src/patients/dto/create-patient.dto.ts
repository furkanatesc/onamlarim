import { IsOptional, IsString, Length } from 'class-validator';

export class CreatePatientDto {
  @IsString() @Length(1, 120)
  name!: string;

  @IsString() @Length(11, 11)
  tcNo!: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  email?: string;

  @IsOptional() @IsString()
  bloodType?: string;
}
