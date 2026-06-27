import { IsString, IsUUID, Length } from 'class-validator';

export class CreateConsentDto {
  @IsUUID()
  patientId!: string;

  @IsString() @Length(1, 200)
  procedure!: string;

  @IsString() @Length(1, 120)
  doctorName!: string;
}
