import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}
