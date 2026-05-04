import {
  IsDateString,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

export class RegisterPatientDto {
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
  @MinLength(6)
  @MaxLength(20)
  document!: string;

  @IsDateString()
  birthDate!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(25)
  phone!: string;
}
