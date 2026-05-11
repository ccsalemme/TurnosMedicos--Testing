import {
  AdminDashboard,
  AgendaResponse,
  ApiEnvelope,
  Appointment,
  AppointmentStatus,
  AuditLogEntry,
  AuthResponse,
  ClinicSite,
  Doctor,
  Specialty,
  User,
  UserRole
} from '../types/domain';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
}

const toQueryString = (params?: Record<string, string | undefined>) => {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.append(key, value);
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.error?.message ?? 'No se pudo completar la operacion',
      payload?.error?.status ?? response.status,
      payload?.error?.details
    );
  }

  return payload.data;
}

export const api = {
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input }),

  registerPatient: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    document: string;
    birthDate: string;
    phone: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body: input }),

  me: (token: string) => request<User>('/auth/me', { token }),

  updateMyProfile: (
    token: string,
    input: { firstName?: string; lastName?: string; phone?: string; birthDate?: string }
  ) => request<User>('/users/me', { method: 'PATCH', token, body: input }),

  getSpecialties: () => request<Specialty[]>('/specialties'),

  getAdminSpecialties: (token: string) => request<Specialty[]>('/specialties/admin/all', { token }),

  createSpecialty: (
    token: string,
    input: { name: string; description?: string; durationMinutes: number; isActive?: boolean }
  ) => request<Specialty>('/specialties', { method: 'POST', token, body: input }),

  updateSpecialty: (
    token: string,
    specialtyId: string,
    input: { name?: string; description?: string; durationMinutes?: number; isActive?: boolean }
  ) => request<Specialty>(`/specialties/${specialtyId}`, { method: 'PATCH', token, body: input }),

  getDoctors: (query?: { specialtyId?: string; siteId?: string }) =>
    request<Doctor[]>(`/doctors${toQueryString(query)}`),

  createDoctor: (
    token: string,
    input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      licenseNumber: string;
      phone: string;
      siteId?: string;
      specialtyIds: string[];
      bio?: string;
    }
  ) => request<Doctor>('/doctors', { method: 'POST', token, body: input }),

  updateDoctor: (
    token: string,
    doctorId: string,
    input: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      siteId?: string;
      specialtyIds?: string[];
      bio?: string;
      isActive?: boolean;
    }
  ) => request<Doctor>(`/doctors/${doctorId}`, { method: 'PATCH', token, body: input }),

  getDoctorAgenda: (doctorUserId: string, query?: { from?: string; to?: string }) =>
    request<AgendaResponse>(`/availability/doctor/${doctorUserId}${toQueryString(query)}`),

  createAvailability: (
    token: string,
    input: {
      doctorUserId?: string;
      weekday: number;
      startTime: string;
      endTime: string;
      isActive?: boolean;
    }
  ) => request('/availability/slots', { method: 'POST', token, body: input }),

  updateAvailability: (
    token: string,
    availabilityId: string,
    input: { weekday?: number; startTime?: string; endTime?: string; isActive?: boolean }
  ) => request(`/availability/slots/${availabilityId}`, { method: 'PATCH', token, body: input }),

  deleteAvailability: (token: string, availabilityId: string) =>
    request(`/availability/slots/${availabilityId}`, { method: 'DELETE', token }),

  createBlock: (
    token: string,
    input: { doctorUserId?: string; startAt: string; endAt: string; reason?: string }
  ) => request('/availability/blocks', { method: 'POST', token, body: input }),

  deleteBlock: (token: string, blockId: string) =>
    request(`/availability/blocks/${blockId}`, { method: 'DELETE', token }),

  reserveAppointment: (
    token: string,
    input: { doctorId: string; specialtyId: string; siteId: string; startAt: string; notes?: string }
  ) => request<Appointment>('/appointments/reserve', { method: 'POST', token, body: input }),

  getMyAppointments: (
    token: string,
    query?: {
      status?: AppointmentStatus;
      from?: string;
      to?: string;
    }
  ) => request<Appointment[]>(`/appointments/my${toQueryString(query)}`, { token }),

  getAdminBoard: (
    token: string,
    query?: {
      status?: AppointmentStatus;
      from?: string;
      to?: string;
      doctorId?: string;
      patientId?: string;
    }
  ) => request<Appointment[]>(`/appointments/admin/board${toQueryString(query as Record<string, string>)}`, { token }),

  cancelAppointment: (token: string, appointmentId: string, reason?: string) =>
    request<Appointment>(`/appointments/${appointmentId}/cancel`, {
      method: 'PATCH',
      token,
      body: { reason }
    }),

  rescheduleAppointment: (token: string, appointmentId: string, newStartAt: string) =>
    request<Appointment>(`/appointments/${appointmentId}/reschedule`, {
      method: 'PATCH',
      token,
      body: { newStartAt }
    }),

  confirmAppointment: (token: string, appointmentId: string) =>
    request<Appointment>(`/appointments/${appointmentId}/confirm`, {
      method: 'PATCH',
      token
    }),

  completeAppointment: (token: string, appointmentId: string) =>
    request<Appointment>(`/appointments/${appointmentId}/complete`, {
      method: 'PATCH',
      token
    }),

  noShowAppointment: (token: string, appointmentId: string) =>
    request<Appointment>(`/appointments/${appointmentId}/no-show`, {
      method: 'PATCH',
      token
    }),

  adminUsers: (token: string, role?: UserRole) =>
    request<User[]>(`/admin/users${toQueryString({ role })}`, { token }),

  adminUpdateUserRole: (
    token: string,
    userId: string,
    input: { role: UserRole; isActive?: boolean }
  ) => request<User>(`/admin/users/${userId}/role`, { method: 'PATCH', token, body: input }),

  adminSites: (token: string) => request<ClinicSite[]>('/admin/sites', { token }),

  adminCreateSite: (
    token: string,
    input: { name: string; address: string; isActive?: boolean }
  ) => request<ClinicSite>('/admin/sites', { method: 'POST', token, body: input }),

  adminUpdateSite: (
    token: string,
    siteId: string,
    input: { name?: string; address?: string; isActive?: boolean }
  ) => request<ClinicSite>(`/admin/sites/${siteId}`, { method: 'PATCH', token, body: input }),

  adminSettings: (token: string) => request<{ key: string; value: string }[]>('/admin/settings', { token }),

  adminUpdateSetting: (token: string, key: string, value: string) =>
    request<{ key: string; value: string }>(`/admin/settings/${key}`, {
      method: 'PUT',
      token,
      body: { value }
    }),

  adminDashboard: (token: string) => request<AdminDashboard>('/admin/dashboard', { token }),

  auditLogs: (token: string) => request<AuditLogEntry[]>('/audit', { token })
};
