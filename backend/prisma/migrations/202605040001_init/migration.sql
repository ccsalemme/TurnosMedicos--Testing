CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

CREATE TYPE "Role" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELED', 'COMPLETED', 'NO_SHOW');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "PatientProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "document" TEXT NOT NULL UNIQUE,
  "birthDate" DATE NOT NULL,
  "phone" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "ClinicSite" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "clinic_site_name_address_unique" UNIQUE ("name", "address")
);

CREATE TABLE "DoctorProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "licenseNumber" TEXT NOT NULL UNIQUE,
  "siteId" UUID REFERENCES "ClinicSite"("id"),
  "bio" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "Specialty" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "durationMinutes" INTEGER NOT NULL DEFAULT 30,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "DoctorSpecialty" (
  "doctorId" UUID NOT NULL REFERENCES "DoctorProfile"("id") ON DELETE CASCADE,
  "specialtyId" UUID NOT NULL REFERENCES "Specialty"("id") ON DELETE CASCADE,
  PRIMARY KEY ("doctorId", "specialtyId")
);

CREATE TABLE "Availability" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL REFERENCES "DoctorProfile"("id") ON DELETE CASCADE,
  "weekday" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "availability_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6),
  CONSTRAINT "availability_time_check" CHECK ("endTime" > "startTime")
);

CREATE INDEX "availability_doctor_weekday_active_idx" ON "Availability"("doctorId", "weekday", "isActive");

CREATE TABLE "ScheduleBlock" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "doctorId" UUID NOT NULL REFERENCES "DoctorProfile"("id") ON DELETE CASCADE,
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "reason" TEXT,
  "createdById" UUID REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "schedule_block_time_check" CHECK ("endAt" > "startAt")
);

CREATE INDEX "schedule_block_doctor_time_idx" ON "ScheduleBlock"("doctorId", "startAt", "endAt");

CREATE TABLE "Appointment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "patientId" UUID NOT NULL REFERENCES "User"("id"),
  "doctorId" UUID NOT NULL REFERENCES "User"("id"),
  "specialtyId" UUID NOT NULL REFERENCES "Specialty"("id"),
  "siteId" UUID NOT NULL REFERENCES "ClinicSite"("id"),
  "startAt" TIMESTAMPTZ NOT NULL,
  "endAt" TIMESTAMPTZ NOT NULL,
  "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "cancellationReason" TEXT,
  "createdById" UUID NOT NULL REFERENCES "User"("id"),
  "updatedById" UUID REFERENCES "User"("id"),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "appointment_time_check" CHECK ("endAt" > "startAt")
);

CREATE INDEX "appointment_doctor_status_start_idx" ON "Appointment"("doctorId", "status", "startAt");
CREATE INDEX "appointment_patient_status_start_idx" ON "Appointment"("patientId", "status", "startAt");
CREATE INDEX "appointment_status_start_idx" ON "Appointment"("status", "startAt");

ALTER TABLE "Appointment"
  ADD CONSTRAINT "doctor_no_overlap_active"
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));

ALTER TABLE "Appointment"
  ADD CONSTRAINT "patient_no_overlap_active"
  EXCLUDE USING gist (
    "patientId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" IN ('PENDING', 'CONFIRMED'));

CREATE TABLE "SystemSetting" (
  "key" TEXT PRIMARY KEY,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "actorId" UUID REFERENCES "User"("id"),
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX "audit_entity_created_idx" ON "AuditLog"("entity", "createdAt");
CREATE INDEX "audit_action_created_idx" ON "AuditLog"("action", "createdAt");
