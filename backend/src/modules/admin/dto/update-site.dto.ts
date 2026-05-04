import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  address?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
