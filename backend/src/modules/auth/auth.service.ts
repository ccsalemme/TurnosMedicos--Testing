import {
  BadRequestException,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { Role } from 'src/common/enums/role.enum';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async registerPatient(input: RegisterPatientDto) {
    const dto = sanitizePayload(input);

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existingEmail) {
      throw new BadRequestException('El email ya esta registrado');
    }

    const existingDocument = await this.prisma.patientProfile.findUnique({
      where: { document: dto.document }
    });

    if (existingDocument) {
      throw new BadRequestException('El documento ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        role: Role.PATIENT,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        patientProfile: {
          create: {
            document: dto.document,
            birthDate: new Date(dto.birthDate),
            phone: dto.phone
          }
        }
      },
      include: {
        patientProfile: true,
        doctorProfile: true
      }
    });

    await this.auditService.record({
      actorId: user.id,
      action: 'PATIENT_REGISTER',
      entity: 'USER',
      entityId: user.id,
      metadata: { email: user.email }
    });

    return this.buildAuthResponse(user);
  }

  async login(input: LoginDto) {
    const dto = sanitizePayload(input);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        patientProfile: true,
        doctorProfile: {
          include: {
            site: true,
            specialties: {
              include: {
                specialty: true
              }
            }
          }
        }
      }
    });

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    await this.auditService.record({
      actorId: user.id,
      action: 'LOGIN',
      entity: 'USER',
      entityId: user.id
    });

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true,
        doctorProfile: {
          include: {
            site: true,
            specialties: {
              include: {
                specialty: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.toPublicUser(user);
  }

  private buildAuthResponse(user: {
    id: string;
    email: string;
    role: Role | string;
    firstName: string;
    lastName: string;
    patientProfile: unknown;
    doctorProfile: unknown;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: this.toPublicUser(user)
    };
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    role: Role | string;
    firstName: string;
    lastName: string;
    patientProfile: unknown;
    doctorProfile: unknown;
  }) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      patientProfile: user.patientProfile,
      doctorProfile: user.doctorProfile
    };
  }
}
