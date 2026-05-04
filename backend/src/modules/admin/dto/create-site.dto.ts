import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSiteDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(180)
  address!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
