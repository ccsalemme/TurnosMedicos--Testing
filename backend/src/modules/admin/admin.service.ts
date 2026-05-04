import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import dayjs from 'dayjs';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async listUsers(role?: Role) {
    return this.prisma.user.findMany({
      where: {
        role: role as never
      },
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
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }]
    });
  }

  async updateUserRole(actorId: string, userId: string, input: UpdateUserRoleDto) {
    const dto = sanitizePayload(input);

    if (actorId === userId && dto.isActive === false) {
      throw new BadRequestException('No puede desactivarse a si mismo');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: dto.role as never,
        isActive: dto.isActive
      }
    });

    await this.auditService.record({
      actorId,
      action: 'ADMIN_UPDATE_USER_ROLE',
      entity: 'USER',
      entityId: userId,
      metadata: {
        role: dto.role,
        isActive: dto.isActive
      }
    });

    return updated;
  }

  async listSites() {
    return this.prisma.clinicSite.findMany({
      orderBy: { name: 'asc' }
    });
  }

  async createSite(actorId: string, input: CreateSiteDto) {
    const dto = sanitizePayload(input);

    const site = await this.prisma.clinicSite.create({
      data: {
        name: dto.name,
        address: dto.address,
        isActive: dto.isActive ?? true
      }
    });

    await this.auditService.record({
      actorId,
      action: 'SITE_CREATE',
      entity: 'SITE',
      entityId: site.id
    });

    return site;
  }

  async updateSite(actorId: string, siteId: string, input: UpdateSiteDto) {
    const dto = sanitizePayload(input);

    const site = await this.prisma.clinicSite.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      throw new NotFoundException('Sede no encontrada');
    }

    const updated = await this.prisma.clinicSite.update({
      where: { id: siteId },
      data: {
        name: dto.name,
        address: dto.address,
        isActive: dto.isActive
      }
    });

    await this.auditService.record({
      actorId,
      action: 'SITE_UPDATE',
      entity: 'SITE',
      entityId: siteId,
      metadata: {
        updatedFields: Object.keys(dto)
      }
    });

    return updated;
  }

  async getSettings() {
    return this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' }
    });
  }

  async updateSetting(actorId: string, key: string, input: UpdateSettingDto) {
    const dto = sanitizePayload(input);

    const setting = await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value: dto.value },
      create: {
        key,
        value: dto.value
      }
    });

    await this.auditService.record({
      actorId,
      action: 'SETTING_UPDATE',
      entity: 'SYSTEM_SETTING',
      entityId: key,
      metadata: { value: dto.value }
    });

    return setting;
  }

  async getDashboard() {
    const now = new Date();
    const weekEnd = dayjs(now).add(7, 'day').toDate();

    const [
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      noShowAppointments,
      canceledAppointments,
      upcoming
    ] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.NO_SHOW } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CANCELED } }),
      this.prisma.appointment.findMany({
        where: {
          startAt: {
            gte: now,
            lte: weekEnd
          },
          status: {
            in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]
          }
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          specialty: true,
          site: true
        },
        orderBy: {
          startAt: 'asc'
        },
        take: 20
      })
    ]);

    return {
      counters: {
        totalAppointments,
        pendingAppointments,
        confirmedAppointments,
        completedAppointments,
        noShowAppointments,
        canceledAppointments
      },
      upcoming
    };
  }
}
