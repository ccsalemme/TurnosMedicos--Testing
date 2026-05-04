export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELED'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    status: number;
    message: string;
    details?: unknown;
  };
}

export interface PatientProfile {
  id: string;
  userId: string;
  document: string;
  birthDate: string;
  phone: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  licenseNumber: string;
  siteId?: string | null;
  bio?: string | null;
  site?: ClinicSite;
  specialties?: { specialty: Specialty }[];
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  isActive?: boolean;
  patientProfile?: PatientProfile | null;
  doctorProfile?: DoctorProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  durationMinutes: number;
  isActive: boolean;
}

export interface ClinicSite {
  id: string;
  name: string;
  address: string;
  isActive: boolean;
}

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  doctorProfile: DoctorProfile;
}

export interface ScheduleAvailability {
  id: string;
  doctorId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ScheduleBlock {
  id: string;
  doctorId: string;
  startAt: string;
  endAt: string;
  reason?: string | null;
}

export interface AgendaResponse {
  availabilities: ScheduleAvailability[];
  blocks: ScheduleBlock[];
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  siteId: string;
  startAt: string;
  endAt: string;
  status: AppointmentStatus;
  notes?: string | null;
  cancellationReason?: string | null;
  createdAt: string;
  patient: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  doctor: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
  specialty: Specialty;
  site: ClinicSite;
}

export interface DashboardCounters {
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  noShowAppointments: number;
  canceledAppointments: number;
}

export interface AdminDashboard {
  counters: DashboardCounters;
  upcoming: Appointment[];
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  createdAt: string;
  actor?: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'role'> | null;
  metadata?: Record<string, unknown>;
}
