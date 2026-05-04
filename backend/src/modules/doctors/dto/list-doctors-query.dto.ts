import { IsOptional, IsString } from 'class-validator';

export class ListDoctorsQueryDto {
  @IsOptional()
  @IsString()
  specialtyId?: string;

  @IsOptional()
  @IsString()
  siteId?: string;
}
