import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/common/enums/role.enum';

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role!: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
