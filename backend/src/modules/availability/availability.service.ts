import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateBlockDto } from './dto/create-block.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async getDoctorAgenda(doctorUserId: string, from?: string, to?: string) {
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: doctorUserId,
        role: Role.DOCTOR
      },
      include: {
        doctorProfile: true
      }
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new NotFoundException('Medico no encontrado');
    }

    return {
      availabilities: await this.prisma.availability.findMany({
        where: {
          doctorId: doctor.doctorProfile.id
        },
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }]
      }),
      blocks: await this.prisma.scheduleBlock.findMany({
        where: {
          doctorId: doctor.doctorProfile.id,
          startAt: from ? { gte: new Date(from) } : undefined,
          endAt: to ? { lte: new Date(to) } : undefined
        },
        orderBy: { startAt: 'asc' }
      })
    };
  }

  async createAvailability(actor: AuthUser, input: CreateAvailabilityDto) {
    const dto = sanitizePayload(input);

    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    const doctorProfileId = await this.resolveDoctorProfileId(actor, dto.doctorUserId);

    const availability = await this.prisma.availability.create({
      data: {
        doctorId: doctorProfileId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive ?? true
      }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'AVAILABILITY_CREATE',
      entity: 'AVAILABILITY',
      entityId: availability.id,
      metadata: {
        doctorProfileId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime
      }
    });

    return availability;
  }

  async updateAvailability(actor: AuthUser, availabilityId: string, input: UpdateAvailabilityDto) {
    const dto = sanitizePayload(input);

    const availability = await this.prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        doctor: true
      }
    });

    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    await this.authorizeDoctorResource(actor, availability.doctor.userId);

    const startTime = dto.startTime ?? availability.startTime;
    const endTime = dto.endTime ?? availability.endTime;

    if (endTime <= startTime) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    const updated = await this.prisma.availability.update({
      where: { id: availabilityId },
      data: {
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive
      }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'AVAILABILITY_UPDATE',
      entity: 'AVAILABILITY',
      entityId: availabilityId,
      metadata: {
        updatedFields: Object.keys(dto)
      }
    });

    return updated;
  }

  async deleteAvailability(actor: AuthUser, availabilityId: string) {
    const availability = await this.prisma.availability.findUnique({
      where: { id: availabilityId },
      include: {
        doctor: true
      }
    });

    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    await this.authorizeDoctorResource(actor, availability.doctor.userId);

    await this.prisma.availability.delete({
      where: { id: availabilityId }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'AVAILABILITY_DELETE',
      entity: 'AVAILABILITY',
      entityId: availabilityId
    });

    return { deleted: true };
  }

  async createBlock(actor: AuthUser, input: CreateBlockDto) {
    const dto = sanitizePayload(input);

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);

    if (endAt <= startAt) {
      throw new BadRequestException('El bloque debe tener una ventana valida');
    }

    const doctorProfileId = await this.resolveDoctorProfileId(actor, dto.doctorUserId);

    const block = await this.prisma.scheduleBlock.create({
      data: {
        doctorId: doctorProfileId,
        startAt,
        endAt,
        reason: dto.reason,
        createdById: actor.id
      }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'AGENDA_BLOCK_CREATE',
      entity: 'SCHEDULE_BLOCK',
      entityId: block.id,
      metadata: {
        doctorProfileId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString()
      }
    });

    return block;
  }

  async deleteBlock(actor: AuthUser, blockId: string) {
    const block = await this.prisma.scheduleBlock.findUnique({
      where: { id: blockId },
      include: {
        doctor: true
      }
    });

    if (!block) {
      throw new NotFoundException('Bloque no encontrado');
    }

    await this.authorizeDoctorResource(actor, block.doctor.userId);

    await this.prisma.scheduleBlock.delete({
      where: { id: blockId }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'AGENDA_BLOCK_DELETE',
      entity: 'SCHEDULE_BLOCK',
      entityId: blockId
    });

    return { deleted: true };
  }

  private async resolveDoctorProfileId(actor: AuthUser, targetDoctorUserId?: string) {
    if (actor.role === Role.DOCTOR) {
      if (targetDoctorUserId && targetDoctorUserId !== actor.id) {
        throw new ForbiddenException('No puede modificar agenda de otro medico');
      }

      const ownProfile = await this.prisma.doctorProfile.findUnique({
        where: { userId: actor.id }
      });

      if (!ownProfile) {
        throw new NotFoundException('Perfil medico no encontrado');
      }

      return ownProfile.id;
    }

    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('No autorizado para esta operacion');
    }

    if (!targetDoctorUserId) {
      throw new BadRequestException('doctorUserId es obligatorio para admin');
    }

    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: targetDoctorUserId }
    });

    if (!doctorProfile) {
      throw new NotFoundException('Perfil medico no encontrado');
    }

    return doctorProfile.id;
  }

  private async authorizeDoctorResource(actor: AuthUser, doctorUserId: string) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role !== Role.DOCTOR || actor.id !== doctorUserId) {
      throw new ForbiddenException('No autorizado para este recurso');
    }
  }
}
