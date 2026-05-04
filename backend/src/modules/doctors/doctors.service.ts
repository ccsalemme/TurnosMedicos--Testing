import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Role } from 'src/common/enums/role.enum';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { ListDoctorsQueryDto } from './dto/list-doctors-query.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async list(query: ListDoctorsQueryDto) {
    return this.prisma.user.findMany({
      where: {
        role: Role.DOCTOR as never,
        isActive: true,
        doctorProfile: {
          is: {
            siteId: query.siteId,
            specialties: query.specialtyId
              ? {
                  some: {
                    specialtyId: query.specialtyId
                  }
                }
              : undefined
          }
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
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
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
    });
  }

  async create(actorId: string, input: CreateDoctorDto) {
    const dto = sanitizePayload(input);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() }
    });

    if (existingUser) {
      throw new BadRequestException('El email ya esta registrado');
    }

    const existingDoctor = await this.prisma.doctorProfile.findUnique({
      where: { licenseNumber: dto.licenseNumber }
    });

    if (existingDoctor) {
      throw new BadRequestException('La matricula ya esta registrada');
    }

    const specialties = await this.prisma.specialty.findMany({
      where: {
        id: { in: dto.specialtyIds },
        isActive: true
      }
    });

    if (specialties.length !== dto.specialtyIds.length) {
      throw new BadRequestException('Una o mas especialidades no son validas');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const doctor = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: Role.DOCTOR,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          doctorProfile: {
            create: {
              licenseNumber: dto.licenseNumber,
              siteId: dto.siteId,
              bio: dto.bio
            }
          }
        },
        include: {
          doctorProfile: true
        }
      });

      if (!createdUser.doctorProfile) {
        throw new BadRequestException('No se pudo crear el perfil medico');
      }

      await tx.doctorSpecialty.createMany({
        data: dto.specialtyIds.map((specialtyId) => ({
          doctorId: createdUser.doctorProfile!.id,
          specialtyId
        }))
      });

      return tx.user.findUniqueOrThrow({
        where: { id: createdUser.id },
        include: {
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
    });

    await this.auditService.record({
      actorId,
      action: 'DOCTOR_CREATE',
      entity: 'USER',
      entityId: doctor.id,
      metadata: {
        email: doctor.email,
        specialtyIds: dto.specialtyIds
      }
    });

    return doctor;
  }

  async update(actorId: string, doctorUserId: string, input: UpdateDoctorDto) {
    const dto = sanitizePayload(input);

    const doctorUser = await this.prisma.user.findFirst({
      where: {
        id: doctorUserId,
        role: Role.DOCTOR as never
      },
      include: {
        doctorProfile: true
      }
    });

    if (!doctorUser || !doctorUser.doctorProfile) {
      throw new NotFoundException('Medico no encontrado');
    }

    const doctorProfileId = doctorUser.doctorProfile.id;

    if (dto.specialtyIds && dto.specialtyIds.length > 0) {
      const specialties = await this.prisma.specialty.findMany({
        where: {
          id: { in: dto.specialtyIds },
          isActive: true
        }
      });

      if (specialties.length !== dto.specialtyIds.length) {
        throw new BadRequestException('Una o mas especialidades no son validas');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: doctorUserId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          isActive: dto.isActive
        }
      });

      await tx.doctorProfile.update({
        where: { userId: doctorUserId },
        data: {
          siteId: dto.siteId,
          bio: dto.bio
        }
      });

      if (dto.specialtyIds) {
        await tx.doctorSpecialty.deleteMany({
          where: { doctorId: doctorProfileId }
        });

        if (dto.specialtyIds.length > 0) {
          await tx.doctorSpecialty.createMany({
            data: dto.specialtyIds.map((specialtyId) => ({
              doctorId: doctorUser.doctorProfile!.id,
              specialtyId
            }))
          });
        }
      }

      return tx.user.findUniqueOrThrow({
        where: { id: doctorUserId },
        include: {
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
    });

    await this.auditService.record({
      actorId,
      action: 'DOCTOR_UPDATE',
      entity: 'USER',
      entityId: doctorUserId,
      metadata: { updatedFields: Object.keys(dto) }
    });

    return updated;
  }
}
