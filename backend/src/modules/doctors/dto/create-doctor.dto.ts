import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

export class CreateDoctorDto {
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, {
    message: 'La contrasena debe incluir mayuscula, minuscula y numero'
  })
  password!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(40)
  licenseNumber!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(25)
  phone!: string;

  @IsOptional()
  @IsString()
  siteId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  specialtyIds!: string[];
}
