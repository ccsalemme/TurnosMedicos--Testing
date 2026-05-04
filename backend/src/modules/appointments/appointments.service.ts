import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AppointmentStatus as PrismaAppointmentStatus,
  Prisma
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';
import { Role } from 'src/common/enums/role.enum';
import { sanitizePayload } from 'src/common/utils/sanitize.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { ListAppointmentsQueryDto } from './dto/list-appointments-query.dto';
import { ReserveAppointmentDto } from './dto/reserve-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

const ACTIVE_BOOKING_STATUSES: PrismaAppointmentStatus[] = [
  PrismaAppointmentStatus.PENDING,
  PrismaAppointmentStatus.CONFIRMED
];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService
  ) {}

  async reserve(actor: AuthUser, input: ReserveAppointmentDto) {
    if (actor.role !== Role.PATIENT) {
      throw new ForbiddenException('Solo los pacientes pueden reservar turnos');
    }

    const dto = sanitizePayload(input);
    const startAt = new Date(dto.startAt);

    if (Number.isNaN(startAt.getTime())) {
      throw new BadRequestException('Fecha de turno invalida');
    }

    if (startAt <= new Date()) {
      throw new BadRequestException('Solo puede reservar turnos futuros');
    }

    const doctor = await this.prisma.user.findFirst({
      where: {
        id: dto.doctorId,
        role: Role.DOCTOR,
        isActive: true
      },
      include: {
        doctorProfile: {
          include: {
            specialties: true
          }
        }
      }
    });

    if (!doctor || !doctor.doctorProfile) {
      throw new NotFoundException('Medico no encontrado');
    }

    const specialty = await this.prisma.specialty.findFirst({
      where: {
        id: dto.specialtyId,
        isActive: true
      }
    });

    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    const doctorHasSpecialty = doctor.doctorProfile.specialties.some(
      (item) => item.specialtyId === specialty.id
    );

    if (!doctorHasSpecialty) {
      throw new BadRequestException('El medico no atiende esta especialidad');
    }

    const site = await this.prisma.clinicSite.findFirst({
      where: {
        id: dto.siteId,
        isActive: true
      }
    });

    if (!site) {
      throw new NotFoundException('Sede no disponible');
    }

    const endAt = dayjs(startAt).add(specialty.durationMinutes, 'minute').toDate();

    await this.assertAgendaAvailability(doctor.doctorProfile.id, startAt, endAt);

    try {
      const appointment = await this.prisma.$transaction(
        async (tx) => {
          const doctorConflict = await tx.appointment.findFirst({
            where: {
              doctorId: doctor.id,
              status: { in: ACTIVE_BOOKING_STATUSES },
              startAt: { lt: endAt },
              endAt: { gt: startAt }
            }
          });

          if (doctorConflict) {
            throw new ConflictException('El medico ya tiene un turno en esa franja');
          }

          const patientConflict = await tx.appointment.findFirst({
            where: {
              patientId: actor.id,
              status: { in: ACTIVE_BOOKING_STATUSES },
              startAt: { lt: endAt },
              endAt: { gt: startAt }
            }
          });

          if (patientConflict) {
            throw new ConflictException('Ya tiene un turno reservado en esa franja');
          }

          return tx.appointment.create({
            data: {
              patientId: actor.id,
              doctorId: doctor.id,
              specialtyId: specialty.id,
              siteId: site.id,
              startAt,
              endAt,
              status: PrismaAppointmentStatus.PENDING,
              notes: dto.notes,
              createdById: actor.id
            },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: true,
              site: true
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      await this.auditService.record({
        actorId: actor.id,
        action: 'APPOINTMENT_RESERVE',
        entity: 'APPOINTMENT',
        entityId: appointment.id,
        metadata: {
          doctorId: doctor.id,
          patientId: actor.id,
          startAt: appointment.startAt.toISOString(),
          endAt: appointment.endAt.toISOString()
        }
      });

      return appointment;
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }
  }

  async getMyAppointments(actor: AuthUser, query: ListAppointmentsQueryDto) {
    if (actor.role === Role.ADMIN) {
      return this.listAppointments(query);
    }

    if (actor.role === Role.DOCTOR) {
      return this.listAppointments({
        ...query,
        doctorId: actor.id
      });
    }

    return this.listAppointments({
      ...query,
      patientId: actor.id
    });
  }

  async getOperationalBoard(query: ListAppointmentsQueryDto) {
    return this.listAppointments(query);
  }

  async cancel(actor: AuthUser, appointmentId: string, input: CancelAppointmentDto) {
    const dto = sanitizePayload(input);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    const isOwner = appointment.patientId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para cancelar este turno');
    }

    if (!ACTIVE_BOOKING_STATUSES.includes(appointment.status)) {
      throw new BadRequestException('Solo se pueden cancelar turnos pendientes o confirmados');
    }

    if (isOwner) {
      const hoursWindow = await this.getCancellationWindowHours();
      const diffHours = dayjs(appointment.startAt).diff(dayjs(), 'hour', true);

      if (diffHours < hoursWindow) {
        throw new BadRequestException(
          `Solo se puede cancelar con ${hoursWindow} horas de anticipacion`
        );
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: PrismaAppointmentStatus.CANCELED,
        cancellationReason: dto.reason,
        updatedById: actor.id
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        specialty: true,
        site: true
      }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: 'APPOINTMENT_CANCEL',
      entity: 'APPOINTMENT',
      entityId: appointmentId,
      metadata: {
        reason: dto.reason
      }
    });

    return updated;
  }

  async reschedule(actor: AuthUser, appointmentId: string, input: RescheduleAppointmentDto) {
    const dto = sanitizePayload(input);

    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        specialty: true
      }
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    const isOwner = appointment.patientId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para reprogramar este turno');
    }

    if (!ACTIVE_BOOKING_STATUSES.includes(appointment.status)) {
      throw new BadRequestException('Solo se pueden reprogramar turnos pendientes o confirmados');
    }

    const newStartAt = new Date(dto.newStartAt);

    if (Number.isNaN(newStartAt.getTime()) || newStartAt <= new Date()) {
      throw new BadRequestException('La nueva fecha debe ser valida y futura');
    }

    const newEndAt = dayjs(newStartAt)
      .add(appointment.specialty.durationMinutes, 'minute')
      .toDate();

    const doctorProfile = await this.prisma.doctorProfile.findUnique({
      where: { userId: appointment.doctorId }
    });

    if (!doctorProfile) {
      throw new NotFoundException('Perfil medico no encontrado');
    }

    await this.assertAgendaAvailability(doctorProfile.id, newStartAt, newEndAt);

    try {
      const updated = await this.prisma.$transaction(
        async (tx) => {
          const doctorConflict = await tx.appointment.findFirst({
            where: {
              id: { not: appointment.id },
              doctorId: appointment.doctorId,
              status: { in: ACTIVE_BOOKING_STATUSES },
              startAt: { lt: newEndAt },
              endAt: { gt: newStartAt }
            }
          });

          if (doctorConflict) {
            throw new ConflictException('La nueva franja ya esta ocupada para el medico');
          }

          const patientConflict = await tx.appointment.findFirst({
            where: {
              id: { not: appointment.id },
              patientId: appointment.patientId,
              status: { in: ACTIVE_BOOKING_STATUSES },
              startAt: { lt: newEndAt },
              endAt: { gt: newStartAt }
            }
          });

          if (patientConflict) {
            throw new ConflictException('El paciente ya tiene un turno en la nueva franja');
          }

          return tx.appointment.update({
            where: { id: appointmentId },
            data: {
              startAt: newStartAt,
              endAt: newEndAt,
              status: PrismaAppointmentStatus.PENDING,
              updatedById: actor.id
            },
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              doctor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              },
              specialty: true,
              site: true
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      await this.auditService.record({
        actorId: actor.id,
        action: 'APPOINTMENT_RESCHEDULE',
        entity: 'APPOINTMENT',
        entityId: appointmentId,
        metadata: {
          newStartAt: newStartAt.toISOString(),
          newEndAt: newEndAt.toISOString()
        }
      });

      return updated;
    } catch (error) {
      this.handleConstraintError(error);
      throw error;
    }
  }

  async markConfirmed(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, PrismaAppointmentStatus.CONFIRMED, [
      PrismaAppointmentStatus.PENDING
    ]);
  }

  async markCompleted(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, PrismaAppointmentStatus.COMPLETED, [
      PrismaAppointmentStatus.CONFIRMED
    ]);
  }

  async markNoShow(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, PrismaAppointmentStatus.NO_SHOW, [
      PrismaAppointmentStatus.CONFIRMED
    ]);
  }

  private async transitionByDoctor(
    actor: AuthUser,
    appointmentId: string,
    targetStatus: PrismaAppointmentStatus,
    allowedCurrent: PrismaAppointmentStatus[]
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    const isAdmin = actor.role === Role.ADMIN;
    const isDoctorOwner = actor.role === Role.DOCTOR && appointment.doctorId === actor.id;

    if (!isDoctorOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para actualizar este turno');
    }

    if (!allowedCurrent.includes(appointment.status)) {
      throw new BadRequestException('Transicion de estado no permitida');
    }

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: targetStatus,
        updatedById: actor.id
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        specialty: true,
        site: true
      }
    });

    await this.auditService.record({
      actorId: actor.id,
      action: `APPOINTMENT_STATUS_${targetStatus}`,
      entity: 'APPOINTMENT',
      entityId: appointmentId
    });

    return updated;
  }

  private async listAppointments(query: ListAppointmentsQueryDto) {
    return this.prisma.appointment.findMany({
      where: {
        status: query.status as PrismaAppointmentStatus | undefined,
        doctorId: query.doctorId,
        patientId: query.patientId,
        startAt: {
          gte: query.from ? new Date(query.from) : undefined,
          lte: query.to ? new Date(query.to) : undefined
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        specialty: true,
        site: true
      },
      orderBy: { startAt: 'asc' }
    });
  }

  private async assertAgendaAvailability(
    doctorProfileId: string,
    startAt: Date,
    endAt: Date
  ): Promise<void> {
    const weekday = dayjs(startAt).day();
    const startTime = dayjs(startAt).format('HH:mm');
    const endTime = dayjs(endAt).format('HH:mm');

    const availability = await this.prisma.availability.findFirst({
      where: {
        doctorId: doctorProfileId,
        weekday,
        isActive: true,
        startTime: { lte: startTime },
        endTime: { gte: endTime }
      }
    });

    if (!availability) {
      throw new BadRequestException('La franja no se encuentra en agenda activa del medico');
    }

    const block = await this.prisma.scheduleBlock.findFirst({
      where: {
        doctorId: doctorProfileId,
        startAt: { lt: endAt },
        endAt: { gt: startAt }
      }
    });

    if (block) {
      throw new BadRequestException('La franja seleccionada esta bloqueada por indisponibilidad');
    }
  }

  private async getCancellationWindowHours(): Promise<number> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'CANCELLATION_WINDOW_HOURS' }
    });

    if (setting) {
      const parsed = Number(setting.value);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    return this.configService.get<number>('DEFAULT_CANCELLATION_WINDOW_HOURS', 24);
  }

  private handleConstraintError(error: unknown): void {
    if (
      error instanceof PrismaClientKnownRequestError &&
      ['P2002', 'P2004'].includes(error.code)
    ) {
      throw new ConflictException(
        'Conflicto de concurrencia: el turno fue tomado o modificado por otro usuario'
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      throw new ConflictException('Conflicto de concurrencia, intente nuevamente');
    }
  }
}
