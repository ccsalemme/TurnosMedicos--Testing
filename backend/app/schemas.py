from __future__ import annotations

from enum import Enum

from pydantic import BaseModel


class Role(str, Enum):
    PATIENT = 'PATIENT'
    DOCTOR = 'DOCTOR'
    ADMIN = 'ADMIN'


class AppointmentStatus(str, Enum):
    PENDING = 'PENDING'
    CONFIRMED = 'CONFIRMED'
    CANCELED = 'CANCELED'
    COMPLETED = 'COMPLETED'
    NO_SHOW = 'NO_SHOW'


class RegisterPatientIn(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    document: str
    birthDate: str
    phone: str


class LoginIn(BaseModel):
    email: str
    password: str


class UpdateMyProfileIn(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    birthDate: str | None = None


class CreateSpecialtyIn(BaseModel):
    name: str
    description: str | None = None
    durationMinutes: int
    isActive: bool | None = None


class UpdateSpecialtyIn(BaseModel):
    name: str | None = None
    description: str | None = None
    durationMinutes: int | None = None
    isActive: bool | None = None


class CreateDoctorIn(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    licenseNumber: str
    phone: str
    siteId: str | None = None
    specialtyIds: list[str]
    bio: str | None = None


class UpdateDoctorIn(BaseModel):
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    siteId: str | None = None
    specialtyIds: list[str] | None = None
    bio: str | None = None
    isActive: bool | None = None


class CreateAvailabilityIn(BaseModel):
    doctorUserId: str | None = None
    weekday: int
    startTime: str
    endTime: str
    isActive: bool | None = None


class UpdateAvailabilityIn(BaseModel):
    weekday: int | None = None
    startTime: str | None = None
    endTime: str | None = None
    isActive: bool | None = None


class CreateBlockIn(BaseModel):
    doctorUserId: str | None = None
    startAt: str
    endAt: str
    reason: str | None = None


class ReserveAppointmentIn(BaseModel):
    doctorId: str
    specialtyId: str
    siteId: str
    startAt: str
    notes: str | None = None


class CancelAppointmentIn(BaseModel):
    reason: str | None = None


class RescheduleAppointmentIn(BaseModel):
    newStartAt: str


class UpdateUserRoleIn(BaseModel):
    role: Role
    isActive: bool | None = None


class CreateSiteIn(BaseModel):
    name: str
    address: str
    isActive: bool | None = None


class UpdateSiteIn(BaseModel):
    name: str | None = None
    address: str | None = None
    isActive: bool | None = None


class UpdateSettingIn(BaseModel):
    value: str
