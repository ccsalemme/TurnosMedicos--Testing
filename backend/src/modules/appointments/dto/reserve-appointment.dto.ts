import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReserveAppointmentDto {
  @IsString()
  doctorId!: string;

  @IsString()
  specialtyId!: string;

  @IsString()
  siteId!: string;

  @IsDateString()
  startAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
