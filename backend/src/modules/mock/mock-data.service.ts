import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import dayjs from 'dayjs';
import { AppointmentStatus } from 'src/common/enums/appointment-status.enum';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

export interface MockSpecialty {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface MockSite {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface MockPatientProfile {
  id: string;
  userId: string;
  document: string;
  birthDate: string;
  phone: string;
}

export interface MockDoctorProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  siteId?: string;
  bio?: string;
  specialties: string[];
}

export interface MockUser {
  id: string;
  email: string;
  password: string;
  role: Role;
  isActive: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
  patientProfile?: MockPatientProfile;
  doctorProfile?: MockDoctorProfile;
}

export interface MockAvailability {
  id: string;
  doctorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface MockBlock {
  id: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface MockAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  siteId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  createdById: string;
  updatedById?: string;
}

export interface MockSetting {
  key: string;
  value: string;
}

export interface MockAudit {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class MockDataService {
  private readonly users: MockUser[] = [];
  private readonly specialties: MockSpecialty[] = [];
  private readonly sites: MockSite[] = [];
  private readonly availabilities: MockAvailability[] = [];
  private readonly blocks: MockBlock[] = [];
  private readonly appointments: MockAppointment[] = [];
  private readonly settings: MockSetting[] = [
    { key: 'CANCELLATION_WINDOW_HOURS', value: '24' }
  ];
  private readonly audits: MockAudit[] = [];

  constructor(private readonly jwtService: JwtService) {
    this.bootstrapData();
  }

  getAuthUserFromToken(token: string | undefined): AuthUser {
    if (!token) {
      throw new UnauthorizedException('Token requerido');
    }

    try {
      const payload = this.jwtService.verify<{ sub: string; email: string; role: Role }>(token);
      const user = this.users.find((item) => item.id === payload.sub && item.isActive);

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  ensureRole(user: AuthUser, roles: Role[]) {
    if (!roles.includes(user.role)) {
      throw new ForbiddenException('No autorizado');
    }
  }

  registerPatient(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    document: string;
    birthDate: string;
    phone: string;
  }) {
    const email = input.email.toLowerCase();

    if (this.users.some((user) => user.email === email)) {
      throw new BadRequestException('El email ya esta registrado');
    }

    if (this.users.some((user) => user.patientProfile?.document === input.document)) {
      throw new BadRequestException('El documento ya esta registrado');
    }

    const userId = this.newId('usr');
    const profile: MockPatientProfile = {
      id: this.newId('pat'),
      userId,
      document: input.document,
      birthDate: new Date(input.birthDate).toISOString(),
      phone: input.phone
    };

    const user: MockUser = {
      id: userId,
      email,
      password: input.password,
      role: Role.PATIENT,
      isActive: true,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      patientProfile: profile
    };

    this.users.push(user);
    this.recordAudit('PATIENT_REGISTER', 'USER', user.id, user.id, { email: user.email });

    return this.buildAuthResponse(user);
  }

  login(input: { email: string; password: string }) {
    const email = input.email.toLowerCase();
    const user = this.users.find((item) => item.email === email);

    if (!user || user.password !== input.password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    this.recordAudit('LOGIN', 'USER', user.id, user.id);
    return this.buildAuthResponse(user);
  }

  me(userId: string) {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return this.toPublicUser(user);
  }

  getMyProfile(userId: string) {
    return this.me(userId);
  }

  updateMyProfile(userId: string, input: { firstName?: string; lastName?: string; phone?: string; birthDate?: string }) {
    const user = this.findUser(userId);

    if (input.firstName) {
      user.firstName = input.firstName;
    }
    if (input.lastName) {
      user.lastName = input.lastName;
    }
    if (input.phone) {
      user.phone = input.phone;
      if (user.patientProfile) {
        user.patientProfile.phone = input.phone;
      }
    }
    if (input.birthDate && user.patientProfile) {
      user.patientProfile.birthDate = new Date(input.birthDate).toISOString();
    }

    this.recordAudit('PROFILE_UPDATE', 'USER', user.id, user.id, {
      updatedFields: Object.keys(input)
    });

    return this.toPublicUser(user);
  }

  listSpecialties(activeOnly = true) {
    return this.specialties
      .filter((item) => (activeOnly ? item.isActive : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  createSpecialty(actor: AuthUser, input: { name: string; description?: string; durationMinutes: number; isActive?: boolean }) {
    this.ensureRole(actor, [Role.ADMIN]);

    if (this.specialties.some((item) => item.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('La especialidad ya existe');
    }

    const specialty: MockSpecialty = {
      id: this.newId('spc'),
      name: input.name,
      description: input.description,
      durationMinutes: input.durationMinutes,
      isActive: input.isActive ?? true
    };

    this.specialties.push(specialty);
    this.recordAudit('SPECIALTY_CREATE', 'SPECIALTY', specialty.id, actor.id, { name: specialty.name });

    return specialty;
  }

  updateSpecialty(actor: AuthUser, id: string, input: { name?: string; description?: string; durationMinutes?: number; isActive?: boolean }) {
    this.ensureRole(actor, [Role.ADMIN]);

    const specialty = this.specialties.find((item) => item.id === id);
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    if (input.name) {
      specialty.name = input.name;
    }
    if (input.description !== undefined) {
      specialty.description = input.description;
    }
    if (input.durationMinutes !== undefined) {
      specialty.durationMinutes = input.durationMinutes;
    }
    if (input.isActive !== undefined) {
      specialty.isActive = input.isActive;
    }

    this.recordAudit('SPECIALTY_UPDATE', 'SPECIALTY', id, actor.id, {
      updatedFields: Object.keys(input)
    });

    return specialty;
  }

  listDoctors(query?: { specialtyId?: string; siteId?: string }) {
    const doctors = this.users.filter((user) => user.role === Role.DOCTOR && user.isActive);

    return doctors
      .filter((doctor) => {
        const profile = doctor.doctorProfile;
        if (!profile) {
          return false;
        }
        if (query?.siteId && profile.siteId !== query.siteId) {
          return false;
        }
        if (query?.specialtyId && !profile.specialties.includes(query.specialtyId)) {
          return false;
        }
        return true;
      })
      .map((doctor) => this.toPublicDoctor(doctor));
  }

  createDoctor(actor: AuthUser, input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    licenseNumber: string;
    phone: string;
    siteId?: string;
    specialtyIds: string[];
    bio?: string;
  }) {
    this.ensureRole(actor, [Role.ADMIN]);

    if (this.users.some((item) => item.email === input.email.toLowerCase())) {
      throw new BadRequestException('El email ya esta registrado');
    }

    if (
      this.users.some((item) => item.doctorProfile?.licenseNumber === input.licenseNumber)
    ) {
      throw new BadRequestException('La matricula ya esta registrada');
    }

    this.ensureSpecialtiesExist(input.specialtyIds);

    const userId = this.newId('usr');
    const profile: MockDoctorProfile = {
      id: this.newId('docp'),
      userId,
      licenseNumber: input.licenseNumber,
      siteId: input.siteId,
      bio: input.bio,
      specialties: [...input.specialtyIds]
    };

    const doctor: MockUser = {
      id: userId,
      email: input.email.toLowerCase(),
      password: input.password,
      role: Role.DOCTOR,
      isActive: true,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      doctorProfile: profile
    };

    this.users.push(doctor);
    this.recordAudit('DOCTOR_CREATE', 'USER', doctor.id, actor.id, {
      specialtyIds: input.specialtyIds
    });

    return this.toPublicDoctor(doctor);
  }

  updateDoctor(actor: AuthUser, doctorUserId: string, input: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    siteId?: string;
    specialtyIds?: string[];
    bio?: string;
    isActive?: boolean;
  }) {
    this.ensureRole(actor, [Role.ADMIN]);

    const doctor = this.findUser(doctorUserId);
    if (doctor.role !== Role.DOCTOR || !doctor.doctorProfile) {
      throw new NotFoundException('Medico no encontrado');
    }

    if (input.specialtyIds) {
      this.ensureSpecialtiesExist(input.specialtyIds);
      doctor.doctorProfile.specialties = [...input.specialtyIds];
    }

    if (input.firstName) {
      doctor.firstName = input.firstName;
    }
    if (input.lastName) {
      doctor.lastName = input.lastName;
    }
    if (input.phone) {
      doctor.phone = input.phone;
    }
    if (input.siteId !== undefined) {
      doctor.doctorProfile.siteId = input.siteId;
    }
    if (input.bio !== undefined) {
      doctor.doctorProfile.bio = input.bio;
    }
    if (input.isActive !== undefined) {
      doctor.isActive = input.isActive;
    }

    this.recordAudit('DOCTOR_UPDATE', 'USER', doctor.id, actor.id, {
      updatedFields: Object.keys(input)
    });

    return this.toPublicDoctor(doctor);
  }

  getDoctorAgenda(doctorUserId: string, from?: string, to?: string) {
    const doctor = this.findUser(doctorUserId);
    if (doctor.role !== Role.DOCTOR || !doctor.doctorProfile) {
      throw new NotFoundException('Medico no encontrado');
    }

    const start = from ? new Date(from).getTime() : Number.MIN_SAFE_INTEGER;
    const end = to ? new Date(to).getTime() : Number.MAX_SAFE_INTEGER;

    return {
      availabilities: this.availabilities
        .filter((item) => item.doctorId === doctor.doctorProfile!.id)
        .sort((a, b) => a.weekday - b.weekday),
      blocks: this.blocks
        .filter((item) => item.doctorId === doctor.doctorProfile!.id)
        .filter((item) => {
          const startAt = new Date(item.startAt).getTime();
          const endAt = new Date(item.endAt).getTime();
          return startAt >= start && endAt <= end;
        })
    };
  }

  createAvailability(actor: AuthUser, input: { doctorUserId?: string; weekday: number; startTime: string; endTime: string; isActive?: boolean }) {
    const doctorProfileId = this.resolveDoctorProfileId(actor, input.doctorUserId);

    if (input.endTime <= input.startTime) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    const availability: MockAvailability = {
      id: this.newId('avl'),
      doctorId: doctorProfileId,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      isActive: input.isActive ?? true
    };

    this.availabilities.push(availability);
    this.recordAudit('AVAILABILITY_CREATE', 'AVAILABILITY', availability.id, actor.id);

    return availability;
  }

  updateAvailability(actor: AuthUser, availabilityId: string, input: { weekday?: number; startTime?: string; endTime?: string; isActive?: boolean }) {
    const availability = this.availabilities.find((item) => item.id === availabilityId);
    if (!availability) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    const doctorUserId = this.findDoctorUserIdByProfileId(availability.doctorId);
    this.authorizeDoctorResource(actor, doctorUserId);

    const startTime = input.startTime ?? availability.startTime;
    const endTime = input.endTime ?? availability.endTime;
    if (endTime <= startTime) {
      throw new BadRequestException('La hora de fin debe ser mayor a la de inicio');
    }

    if (input.weekday !== undefined) {
      availability.weekday = input.weekday;
    }
    if (input.startTime !== undefined) {
      availability.startTime = input.startTime;
    }
    if (input.endTime !== undefined) {
      availability.endTime = input.endTime;
    }
    if (input.isActive !== undefined) {
      availability.isActive = input.isActive;
    }

    this.recordAudit('AVAILABILITY_UPDATE', 'AVAILABILITY', availability.id, actor.id);
    return availability;
  }

  deleteAvailability(actor: AuthUser, availabilityId: string) {
    const index = this.availabilities.findIndex((item) => item.id === availabilityId);
    if (index < 0) {
      throw new NotFoundException('Disponibilidad no encontrada');
    }

    const availability = this.availabilities[index];
    const doctorUserId = this.findDoctorUserIdByProfileId(availability.doctorId);
    this.authorizeDoctorResource(actor, doctorUserId);

    this.availabilities.splice(index, 1);
    this.recordAudit('AVAILABILITY_DELETE', 'AVAILABILITY', availabilityId, actor.id);

    return { deleted: true };
  }

  createBlock(actor: AuthUser, input: { doctorUserId?: string; startAt: string; endAt: string; reason?: string }) {
    const doctorProfileId = this.resolveDoctorProfileId(actor, input.doctorUserId);

    const startAt = new Date(input.startAt);
    const endAt = new Date(input.endAt);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      throw new BadRequestException('El bloque debe tener una ventana valida');
    }

    const block: MockBlock = {
      id: this.newId('blk'),
      doctorId: doctorProfileId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      reason: input.reason
    };

    this.blocks.push(block);
    this.recordAudit('AGENDA_BLOCK_CREATE', 'SCHEDULE_BLOCK', block.id, actor.id);

    return block;
  }

  deleteBlock(actor: AuthUser, blockId: string) {
    const index = this.blocks.findIndex((item) => item.id === blockId);
    if (index < 0) {
      throw new NotFoundException('Bloque no encontrado');
    }

    const block = this.blocks[index];
    const doctorUserId = this.findDoctorUserIdByProfileId(block.doctorId);
    this.authorizeDoctorResource(actor, doctorUserId);

    this.blocks.splice(index, 1);
    this.recordAudit('AGENDA_BLOCK_DELETE', 'SCHEDULE_BLOCK', blockId, actor.id);

    return { deleted: true };
  }

  reserveAppointment(actor: AuthUser, input: { doctorId: string; specialtyId: string; siteId: string; startAt: string; notes?: string }) {
    this.ensureRole(actor, [Role.PATIENT]);

    const doctor = this.findUser(input.doctorId);
    if (doctor.role !== Role.DOCTOR || !doctor.doctorProfile || !doctor.isActive) {
      throw new NotFoundException('Medico no encontrado');
    }

    const specialty = this.findSpecialty(input.specialtyId);
    if (!doctor.doctorProfile.specialties.includes(specialty.id)) {
      throw new BadRequestException('El medico no atiende esta especialidad');
    }

    this.findSite(input.siteId);

    const startAt = new Date(input.startAt);
    if (Number.isNaN(startAt.getTime()) || startAt <= new Date()) {
      throw new BadRequestException('Solo puede reservar turnos futuros');
    }

    const endAt = dayjs(startAt).add(specialty.durationMinutes, 'minute').toDate();
    this.assertAgendaAvailability(doctor.doctorProfile.id, startAt, endAt);
    this.assertConflicts(doctor.id, actor.id, startAt, endAt, undefined);

    const appointment: MockAppointment = {
      id: this.newId('apt'),
      patientId: actor.id,
      doctorId: doctor.id,
      specialtyId: specialty.id,
      siteId: input.siteId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: AppointmentStatus.PENDING,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      createdById: actor.id
    };

    this.appointments.push(appointment);
    this.recordAudit('APPOINTMENT_RESERVE', 'APPOINTMENT', appointment.id, actor.id);

    return this.toPublicAppointment(appointment);
  }

  getMyAppointments(actor: AuthUser, query: { status?: AppointmentStatus; from?: string; to?: string }) {
    if (actor.role === Role.ADMIN) {
      return this.listAppointments(query);
    }

    if (actor.role === Role.DOCTOR) {
      return this.listAppointments({ ...query, doctorId: actor.id });
    }

    return this.listAppointments({ ...query, patientId: actor.id });
  }

  getOperationalBoard(actor: AuthUser, query: { status?: AppointmentStatus; from?: string; to?: string; doctorId?: string; patientId?: string }) {
    this.ensureRole(actor, [Role.ADMIN]);
    return this.listAppointments(query);
  }

  cancelAppointment(actor: AuthUser, appointmentId: string, input: { reason?: string }) {
    const appointment = this.findAppointment(appointmentId);

    const isOwner = appointment.patientId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para cancelar este turno');
    }

    if (![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
      throw new BadRequestException('Solo se pueden cancelar turnos pendientes o confirmados');
    }

    if (isOwner) {
      const diffHours = dayjs(appointment.startAt).diff(dayjs(), 'hour', true);
      const hoursWindow = Number(this.settings.find((item) => item.key === 'CANCELLATION_WINDOW_HOURS')?.value ?? '24');
      if (diffHours < hoursWindow) {
        throw new BadRequestException(`Solo se puede cancelar con ${hoursWindow} horas de anticipacion`);
      }
    }

    appointment.status = AppointmentStatus.CANCELED;
    appointment.cancellationReason = input.reason;
    appointment.updatedById = actor.id;

    this.recordAudit('APPOINTMENT_CANCEL', 'APPOINTMENT', appointment.id, actor.id);

    return this.toPublicAppointment(appointment);
  }

  rescheduleAppointment(actor: AuthUser, appointmentId: string, input: { newStartAt: string }) {
    const appointment = this.findAppointment(appointmentId);

    const isOwner = appointment.patientId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para reprogramar este turno');
    }

    if (![AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)) {
      throw new BadRequestException('Solo se pueden reprogramar turnos pendientes o confirmados');
    }

    const newStartAt = new Date(input.newStartAt);
    if (Number.isNaN(newStartAt.getTime()) || newStartAt <= new Date()) {
      throw new BadRequestException('La nueva fecha debe ser valida y futura');
    }

    const specialty = this.findSpecialty(appointment.specialtyId);
    const newEndAt = dayjs(newStartAt).add(specialty.durationMinutes, 'minute').toDate();

    const doctor = this.findUser(appointment.doctorId);
    if (!doctor.doctorProfile) {
      throw new NotFoundException('Perfil medico no encontrado');
    }

    this.assertAgendaAvailability(doctor.doctorProfile.id, newStartAt, newEndAt);
    this.assertConflicts(appointment.doctorId, appointment.patientId, newStartAt, newEndAt, appointment.id);

    appointment.startAt = newStartAt.toISOString();
    appointment.endAt = newEndAt.toISOString();
    appointment.status = AppointmentStatus.PENDING;
    appointment.updatedById = actor.id;

    this.recordAudit('APPOINTMENT_RESCHEDULE', 'APPOINTMENT', appointment.id, actor.id);
    return this.toPublicAppointment(appointment);
  }

  confirmAppointment(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, AppointmentStatus.CONFIRMED, [AppointmentStatus.PENDING]);
  }

  completeAppointment(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, AppointmentStatus.COMPLETED, [AppointmentStatus.CONFIRMED]);
  }

  noShowAppointment(actor: AuthUser, appointmentId: string) {
    return this.transitionByDoctor(actor, appointmentId, AppointmentStatus.NO_SHOW, [AppointmentStatus.CONFIRMED]);
  }

  adminUsers(actor: AuthUser, role?: Role) {
    this.ensureRole(actor, [Role.ADMIN]);
    return this.users
      .filter((item) => (role ? item.role === role : true))
      .sort((a, b) => `${a.role}-${a.lastName}`.localeCompare(`${b.role}-${b.lastName}`))
      .map((item) => this.toPublicUser(item));
  }

  adminUpdateUserRole(actor: AuthUser, userId: string, input: { role: Role; isActive?: boolean }) {
    this.ensureRole(actor, [Role.ADMIN]);

    if (actor.id === userId && input.isActive === false) {
      throw new BadRequestException('No puede desactivarse a si mismo');
    }

    const user = this.findUser(userId);
    user.role = input.role;
    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    this.recordAudit('ADMIN_UPDATE_USER_ROLE', 'USER', user.id, actor.id);
    return this.toPublicUser(user);
  }

  adminSites(actor: AuthUser) {
    this.ensureRole(actor, [Role.ADMIN]);
    return [...this.sites].sort((a, b) => a.name.localeCompare(b.name));
  }

  adminCreateSite(actor: AuthUser, input: { name: string; address: string; isActive?: boolean }) {
    this.ensureRole(actor, [Role.ADMIN]);

    const site: MockSite = {
      id: this.newId('ste'),
      name: input.name,
      address: input.address,
      isActive: input.isActive ?? true
    };

    this.sites.push(site);
    this.recordAudit('SITE_CREATE', 'SITE', site.id, actor.id);
    return site;
  }

  adminUpdateSite(actor: AuthUser, siteId: string, input: { name?: string; address?: string; isActive?: boolean }) {
    this.ensureRole(actor, [Role.ADMIN]);

    const site = this.findSite(siteId);
    if (input.name) {
      site.name = input.name;
    }
    if (input.address) {
      site.address = input.address;
    }
    if (input.isActive !== undefined) {
      site.isActive = input.isActive;
    }

    this.recordAudit('SITE_UPDATE', 'SITE', site.id, actor.id);
    return site;
  }

  adminSettings(actor: AuthUser) {
    this.ensureRole(actor, [Role.ADMIN]);
    return [...this.settings];
  }

  adminUpdateSetting(actor: AuthUser, key: string, value: string) {
    this.ensureRole(actor, [Role.ADMIN]);

    const setting = this.settings.find((item) => item.key === key);
    if (setting) {
      setting.value = value;
      this.recordAudit('SETTING_UPDATE', 'SYSTEM_SETTING', key, actor.id, { value });
      return setting;
    }

    const created: MockSetting = { key, value };
    this.settings.push(created);
    this.recordAudit('SETTING_UPDATE', 'SYSTEM_SETTING', key, actor.id, { value });

    return created;
  }

  adminDashboard(actor: AuthUser) {
    this.ensureRole(actor, [Role.ADMIN]);

    const now = dayjs();
    const nextWeek = dayjs().add(7, 'day');

    const counters = {
      totalAppointments: this.appointments.length,
      pendingAppointments: this.appointments.filter((a) => a.status === AppointmentStatus.PENDING).length,
      confirmedAppointments: this.appointments.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
      completedAppointments: this.appointments.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
      noShowAppointments: this.appointments.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
      canceledAppointments: this.appointments.filter((a) => a.status === AppointmentStatus.CANCELED).length
    };

    const upcoming = this.appointments
      .filter((appointment) => {
        const start = dayjs(appointment.startAt);
        return (
          (appointment.status === AppointmentStatus.PENDING ||
            appointment.status === AppointmentStatus.CONFIRMED) &&
          start.isAfter(now) &&
          start.isBefore(nextWeek)
        );
      })
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .slice(0, 20)
      .map((item) => this.toPublicAppointment(item));

    return { counters, upcoming };
  }

  auditLogs(actor: AuthUser, query?: { action?: string; entity?: string; actorId?: string; from?: string; to?: string }) {
    this.ensureRole(actor, [Role.ADMIN]);

    const from = query?.from ? new Date(query.from).getTime() : Number.MIN_SAFE_INTEGER;
    const to = query?.to ? new Date(query.to).getTime() : Number.MAX_SAFE_INTEGER;

    return this.audits
      .filter((item) => (query?.action ? item.action === query.action : true))
      .filter((item) => (query?.entity ? item.entity === query.entity : true))
      .filter((item) => (query?.actorId ? item.actorId === query.actorId : true))
      .filter((item) => {
        const createdAt = new Date(item.createdAt).getTime();
        return createdAt >= from && createdAt <= to;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200)
      .map((item) => ({
        id: item.id,
        action: item.action,
        entity: item.entity,
        entityId: item.entityId,
        createdAt: item.createdAt,
        actor: item.actorId
          ? (() => {
              const actorUser = this.users.find((user) => user.id === item.actorId);
              return actorUser
                ? {
                    id: actorUser.id,
                    firstName: actorUser.firstName,
                    lastName: actorUser.lastName,
                    email: actorUser.email,
                    role: actorUser.role
                  }
                : null;
            })()
          : null,
        metadata: item.metadata
      }));
  }

  private transitionByDoctor(actor: AuthUser, appointmentId: string, target: AppointmentStatus, allowedCurrent: AppointmentStatus[]) {
    const appointment = this.findAppointment(appointmentId);

    const isDoctorOwner = actor.role === Role.DOCTOR && appointment.doctorId === actor.id;
    const isAdmin = actor.role === Role.ADMIN;
    if (!isDoctorOwner && !isAdmin) {
      throw new ForbiddenException('No autorizado para actualizar este turno');
    }

    if (!allowedCurrent.includes(appointment.status)) {
      throw new BadRequestException('Transicion de estado no permitida');
    }

    appointment.status = target;
    appointment.updatedById = actor.id;

    this.recordAudit(`APPOINTMENT_STATUS_${target}`, 'APPOINTMENT', appointment.id, actor.id);
    return this.toPublicAppointment(appointment);
  }

  private listAppointments(query: { status?: AppointmentStatus; from?: string; to?: string; doctorId?: string; patientId?: string }) {
    const from = query.from ? new Date(query.from).getTime() : Number.MIN_SAFE_INTEGER;
    const to = query.to ? new Date(query.to).getTime() : Number.MAX_SAFE_INTEGER;

    return this.appointments
      .filter((item) => (query.status ? item.status === query.status : true))
      .filter((item) => (query.doctorId ? item.doctorId === query.doctorId : true))
      .filter((item) => (query.patientId ? item.patientId === query.patientId : true))
      .filter((item) => {
        const start = new Date(item.startAt).getTime();
        return start >= from && start <= to;
      })
      .sort((a, b) => a.startAt.localeCompare(b.startAt))
      .map((item) => this.toPublicAppointment(item));
  }

  private assertAgendaAvailability(doctorProfileId: string, startAt: Date, endAt: Date) {
    const weekday = dayjs(startAt).day();
    const startTime = dayjs(startAt).format('HH:mm');
    const endTime = dayjs(endAt).format('HH:mm');

    const inAvailability = this.availabilities.some((slot) => {
      return (
        slot.doctorId === doctorProfileId &&
        slot.isActive &&
        slot.weekday === weekday &&
        slot.startTime <= startTime &&
        slot.endTime >= endTime
      );
    });

    if (!inAvailability) {
      throw new BadRequestException('La franja no se encuentra en agenda activa del medico');
    }

    const overlapBlock = this.blocks.some((block) => {
      if (block.doctorId !== doctorProfileId) {
        return false;
      }
      const blockStart = new Date(block.startAt).getTime();
      const blockEnd = new Date(block.endAt).getTime();
      return blockStart < endAt.getTime() && blockEnd > startAt.getTime();
    });

    if (overlapBlock) {
      throw new BadRequestException('La franja seleccionada esta bloqueada por indisponibilidad');
    }
  }

  private assertConflicts(doctorId: string, patientId: string, startAt: Date, endAt: Date, excludeAppointmentId?: string) {
    const activeStatuses = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

    const hasDoctorConflict = this.appointments.some((appointment) => {
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      if (appointment.doctorId !== doctorId || !activeStatuses.includes(appointment.status)) {
        return false;
      }
      return (
        new Date(appointment.startAt).getTime() < endAt.getTime() &&
        new Date(appointment.endAt).getTime() > startAt.getTime()
      );
    });

    if (hasDoctorConflict) {
      throw new BadRequestException('El medico ya tiene un turno en esa franja');
    }

    const hasPatientConflict = this.appointments.some((appointment) => {
      if (excludeAppointmentId && appointment.id === excludeAppointmentId) {
        return false;
      }
      if (appointment.patientId !== patientId || !activeStatuses.includes(appointment.status)) {
        return false;
      }
      return (
        new Date(appointment.startAt).getTime() < endAt.getTime() &&
        new Date(appointment.endAt).getTime() > startAt.getTime()
      );
    });

    if (hasPatientConflict) {
      throw new BadRequestException('Ya tiene un turno reservado en esa franja');
    }
  }

  private resolveDoctorProfileId(actor: AuthUser, targetDoctorUserId?: string) {
    if (actor.role === Role.DOCTOR) {
      if (targetDoctorUserId && targetDoctorUserId !== actor.id) {
        throw new ForbiddenException('No puede modificar agenda de otro medico');
      }

      const profileId = this.findUser(actor.id).doctorProfile?.id;
      if (!profileId) {
        throw new NotFoundException('Perfil medico no encontrado');
      }

      return profileId;
    }

    this.ensureRole(actor, [Role.ADMIN]);

    if (!targetDoctorUserId) {
      throw new BadRequestException('doctorUserId es obligatorio para admin');
    }

    const target = this.findUser(targetDoctorUserId);
    if (!target.doctorProfile) {
      throw new NotFoundException('Perfil medico no encontrado');
    }

    return target.doctorProfile.id;
  }

  private authorizeDoctorResource(actor: AuthUser, doctorUserId: string) {
    if (actor.role === Role.ADMIN) {
      return;
    }

    if (actor.role !== Role.DOCTOR || actor.id !== doctorUserId) {
      throw new ForbiddenException('No autorizado para este recurso');
    }
  }

  private findDoctorUserIdByProfileId(profileId: string) {
    const doctor = this.users.find((user) => user.doctorProfile?.id === profileId);
    if (!doctor) {
      throw new NotFoundException('Perfil medico no encontrado');
    }
    return doctor.id;
  }

  private findUser(userId: string) {
    const user = this.users.find((item) => item.id === userId);
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  private findSpecialty(specialtyId: string) {
    const specialty = this.specialties.find((item) => item.id === specialtyId && item.isActive);
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    return specialty;
  }

  private findSite(siteId: string) {
    const site = this.sites.find((item) => item.id === siteId && item.isActive);
    if (!site) {
      throw new NotFoundException('Sede no disponible');
    }
    return site;
  }

  private findAppointment(appointmentId: string) {
    const appointment = this.appointments.find((item) => item.id === appointmentId);
    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }
    return appointment;
  }

  private ensureSpecialtiesExist(specialtyIds: string[]) {
    const validIds = this.specialties.filter((item) => item.isActive).map((item) => item.id);
    const allValid = specialtyIds.every((id) => validIds.includes(id));
    if (!allValid) {
      throw new BadRequestException('Una o mas especialidades no son validas');
    }
  }

  private toPublicUser(user: MockUser) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      isActive: user.isActive,
      patientProfile: user.patientProfile ?? null,
      doctorProfile: user.doctorProfile
        ? {
            ...user.doctorProfile,
            site: user.doctorProfile.siteId
              ? this.sites.find((site) => site.id === user.doctorProfile!.siteId)
              : undefined,
            specialties: user.doctorProfile.specialties.map((specialtyId) => ({
              specialty: this.specialties.find((item) => item.id === specialtyId)
            }))
          }
        : null
    };
  }

  private toPublicDoctor(user: MockUser) {
    const publicUser = this.toPublicUser(user);
    return {
      id: publicUser.id,
      firstName: publicUser.firstName,
      lastName: publicUser.lastName,
      email: publicUser.email,
      phone: publicUser.phone,
      doctorProfile: publicUser.doctorProfile
    };
  }

  private toPublicAppointment(appointment: MockAppointment) {
    const patient = this.findUser(appointment.patientId);
    const doctor = this.findUser(appointment.doctorId);
    const specialty = this.findSpecialtyForAnyState(appointment.specialtyId);
    const site = this.findSiteForAnyState(appointment.siteId);

    return {
      id: appointment.id,
      patientId: appointment.patientId,
      doctorId: appointment.doctorId,
      specialtyId: appointment.specialtyId,
      siteId: appointment.siteId,
      startAt: appointment.startAt,
      endAt: appointment.endAt,
      status: appointment.status,
      notes: appointment.notes,
      cancellationReason: appointment.cancellationReason,
      createdAt: appointment.createdAt,
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email
      },
      doctor: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        email: doctor.email
      },
      specialty,
      site
    };
  }

  private findSpecialtyForAnyState(specialtyId: string) {
    const specialty = this.specialties.find((item) => item.id === specialtyId);
    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }
    return specialty;
  }

  private findSiteForAnyState(siteId: string) {
    const site = this.sites.find((item) => item.id === siteId);
    if (!site) {
      throw new NotFoundException('Sede no encontrada');
    }
    return site;
  }

  private buildAuthResponse(user: MockUser) {
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      accessToken,
      user: this.toPublicUser(user)
    };
  }

  private newId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private recordAudit(action: string, entity: string, entityId?: string, actorId?: string, metadata?: Record<string, unknown>) {
    this.audits.push({
      id: this.newId('adt'),
      action,
      entity,
      entityId,
      actorId,
      metadata,
      createdAt: new Date().toISOString()
    });
  }

  private bootstrapData() {
    const siteCentro: MockSite = {
      id: 'site_centro',
      name: 'Sede Centro',
      address: 'Av. Principal 123',
      isActive: true
    };
    const siteNorte: MockSite = {
      id: 'site_norte',
      name: 'Sede Norte',
      address: 'Calle Salud 456',
      isActive: true
    };
    const siteSur: MockSite = {
      id: 'site_sur',
      name: 'Sede Sur',
      address: 'Bv. Bienestar 789',
      isActive: true
    };
    this.sites.push(siteCentro, siteNorte, siteSur);

    const cardiologia: MockSpecialty = {
      id: 'spc_cardiologia',
      name: 'Cardiologia',
      description: 'Atencion cardiologica integral',
      durationMinutes: 30,
      isActive: true
    };
    const pediatria: MockSpecialty = {
      id: 'spc_pediatria',
      name: 'Pediatria',
      description: 'Atencion de ninos y adolescentes',
      durationMinutes: 20,
      isActive: true
    };
    const dermatologia: MockSpecialty = {
      id: 'spc_dermatologia',
      name: 'Dermatologia',
      description: 'Atencion de piel y anexos',
      durationMinutes: 25,
      isActive: true
    };
    const clinicaGeneral: MockSpecialty = {
      id: 'spc_clinicageneral',
      name: 'Clinica General',
      description: 'Consultas medicas generales',
      durationMinutes: 30,
      isActive: true
    };
    this.specialties.push(cardiologia, pediatria, dermatologia, clinicaGeneral);

    const admin: MockUser = {
      id: 'usr_admin',
      email: 'admin@clinica.local',
      password: 'Admin123!',
      role: Role.ADMIN,
      isActive: true,
      firstName: 'Alicia',
      lastName: 'Admin',
      phone: '+5491100000001'
    };

    const doctor1: MockUser = {
      id: 'usr_doc1',
      email: 'doctor1@clinica.local',
      password: 'Doctor123!',
      role: Role.DOCTOR,
      isActive: true,
      firstName: 'Laura',
      lastName: 'Medina',
      phone: '+5491100000002',
      doctorProfile: {
        id: 'docp_1',
        userId: 'usr_doc1',
        licenseNumber: 'MN-12345',
        siteId: siteCentro.id,
        bio: 'Especialista en cardiologia y clinica general.',
        specialties: [cardiologia.id, clinicaGeneral.id]
      }
    };

    const doctor2: MockUser = {
      id: 'usr_doc2',
      email: 'doctor2@clinica.local',
      password: 'Doctor123!',
      role: Role.DOCTOR,
      isActive: true,
      firstName: 'Martin',
      lastName: 'Rios',
      phone: '+5491100000003',
      doctorProfile: {
        id: 'docp_2',
        userId: 'usr_doc2',
        licenseNumber: 'MN-67890',
        siteId: siteNorte.id,
        bio: 'Pediatria ambulatoria y seguimiento integral.',
        specialties: [pediatria.id]
      }
    };

    const doctor3: MockUser = {
      id: 'usr_doc3',
      email: 'doctor3@clinica.local',
      password: 'Doctor123!',
      role: Role.DOCTOR,
      isActive: true,
      firstName: 'Valeria',
      lastName: 'Costa',
      phone: '+5491100000005',
      doctorProfile: {
        id: 'docp_3',
        userId: 'usr_doc3',
        licenseNumber: 'MN-44556',
        siteId: siteSur.id,
        bio: 'Dermatologia clinica y control preventivo.',
        specialties: [dermatologia.id]
      }
    };

    const paciente1: MockUser = {
      id: 'usr_pat1',
      email: 'paciente@clinica.local',
      password: 'Paciente123!',
      role: Role.PATIENT,
      isActive: true,
      firstName: 'Sofia',
      lastName: 'Perez',
      phone: '+5491100000004',
      patientProfile: {
        id: 'pat_1',
        userId: 'usr_pat1',
        document: '30111222',
        birthDate: new Date('1993-04-15').toISOString(),
        phone: '+5491100000004'
      }
    };

    const paciente2: MockUser = {
      id: 'usr_pat2',
      email: 'paciente2@clinica.local',
      password: 'Paciente123!',
      role: Role.PATIENT,
      isActive: true,
      firstName: 'Lucas',
      lastName: 'Gomez',
      phone: '+5491100000006',
      patientProfile: {
        id: 'pat_2',
        userId: 'usr_pat2',
        document: '32444555',
        birthDate: new Date('1989-11-03').toISOString(),
        phone: '+5491100000006'
      }
    };

    const paciente3: MockUser = {
      id: 'usr_pat3',
      email: 'paciente3@clinica.local',
      password: 'Paciente123!',
      role: Role.PATIENT,
      isActive: true,
      firstName: 'Carla',
      lastName: 'Suarez',
      phone: '+5491100000007',
      patientProfile: {
        id: 'pat_3',
        userId: 'usr_pat3',
        document: '28999000',
        birthDate: new Date('1978-02-21').toISOString(),
        phone: '+5491100000007'
      }
    };

    this.users.push(admin, doctor1, doctor2, doctor3, paciente1, paciente2, paciente3);

    this.availabilities.push(
      { id: 'avl_1', doctorId: 'docp_1', weekday: 1, startTime: '09:00', endTime: '13:00', isActive: true },
      { id: 'avl_2', doctorId: 'docp_1', weekday: 3, startTime: '14:00', endTime: '18:00', isActive: true },
      { id: 'avl_3', doctorId: 'docp_2', weekday: 2, startTime: '08:00', endTime: '12:00', isActive: true },
      { id: 'avl_4', doctorId: 'docp_2', weekday: 4, startTime: '10:00', endTime: '16:00', isActive: true },
      { id: 'avl_5', doctorId: 'docp_3', weekday: 5, startTime: '09:00', endTime: '14:00', isActive: true }
    );

    this.blocks.push({
      id: 'blk_1',
      doctorId: 'docp_1',
      startAt: dayjs().add(6, 'day').hour(12).minute(0).second(0).millisecond(0).toISOString(),
      endAt: dayjs().add(6, 'day').hour(14).minute(0).second(0).millisecond(0).toISOString(),
      reason: 'Capacitacion'
    });

    this.appointments.push(
      {
        id: 'apt_1',
        patientId: 'usr_pat1',
        doctorId: 'usr_doc1',
        specialtyId: cardiologia.id,
        siteId: siteCentro.id,
        startAt: dayjs().add(2, 'day').hour(10).minute(0).second(0).millisecond(0).toISOString(),
        endAt: dayjs().add(2, 'day').hour(10).minute(30).second(0).millisecond(0).toISOString(),
        status: AppointmentStatus.PENDING,
        notes: 'Control anual',
        createdAt: new Date().toISOString(),
        createdById: 'usr_pat1'
      },
      {
        id: 'apt_2',
        patientId: 'usr_pat2',
        doctorId: 'usr_doc2',
        specialtyId: pediatria.id,
        siteId: siteNorte.id,
        startAt: dayjs().add(3, 'day').hour(11).minute(0).second(0).millisecond(0).toISOString(),
        endAt: dayjs().add(3, 'day').hour(11).minute(20).second(0).millisecond(0).toISOString(),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Consulta pediatrica',
        createdAt: new Date().toISOString(),
        createdById: 'usr_pat2',
        updatedById: 'usr_doc2'
      },
      {
        id: 'apt_3',
        patientId: 'usr_pat3',
        doctorId: 'usr_doc3',
        specialtyId: dermatologia.id,
        siteId: siteSur.id,
        startAt: dayjs().add(4, 'day').hour(15).minute(0).second(0).millisecond(0).toISOString(),
        endAt: dayjs().add(4, 'day').hour(15).minute(25).second(0).millisecond(0).toISOString(),
        status: AppointmentStatus.CANCELED,
        cancellationReason: 'Cancelado por motivo personal',
        createdAt: new Date().toISOString(),
        createdById: 'usr_pat3',
        updatedById: 'usr_pat3'
      }
    );

    this.recordAudit('SYSTEM_MOCK_BOOTSTRAP', 'SYSTEM', 'mock_init', admin.id, {
      users: this.users.length,
      appointments: this.appointments.length
    });
  }
}
