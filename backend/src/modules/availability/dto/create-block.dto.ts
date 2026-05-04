import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBlockDto {
  @IsOptional()
  @IsString()
  doctorUserId?: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
