import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getMyProfile(userId: string) {
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
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async updateMyProfile(userId: string, input: UpdateMyProfileDto) {
    const dto = sanitizePayload(input);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        patientProfile: true
      }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone
        }
      });

      if (user.role === Role.PATIENT && dto.birthDate) {
        if (!user.patientProfile) {
          throw new BadRequestException('Perfil de paciente no disponible');
        }

        await tx.patientProfile.update({
          where: { userId },
          data: {
            birthDate: new Date(dto.birthDate),
            phone: dto.phone ?? undefined
          }
        });
      }

      return updated;
    });

    await this.auditService.record({
      actorId: userId,
      action: 'PROFILE_UPDATE',
      entity: 'USER',
      entityId: userId,
      metadata: {
        updatedFields: Object.keys(dto)
      }
    });

    return this.getMyProfile(updatedUser.id);
  }
}
