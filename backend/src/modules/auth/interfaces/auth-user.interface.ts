import { Role } from 'src/common/enums/role.enum';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
}
