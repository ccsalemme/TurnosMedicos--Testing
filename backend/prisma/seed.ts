import bcrypt from 'bcrypt';
import { AppointmentStatus, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const passwordHashCache = new Map<string, string>();

function dateAt(dayOffset: number, hour: number, minute = 0) {
  const value = new Date();
  value.setSeconds(0, 0);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function addMinutes(value: Date, minutes: number) {
  return new Date(value.getTime() + minutes * 60_000);
}

async function getPasswordHash(password: string) {
  if (passwordHashCache.has(password)) {
    return passwordHashCache.get(password)!;
  }

  const hash = await bcrypt.hash(password, 12);
  passwordHashCache.set(password, hash);
  return hash;
}

async function upsertUser(input: {
  email: string;
  password: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone: string;
}) {
  const passwordHash = await getPasswordHash(input.password);

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      isActive: true
    },
    create: {
      email: input.email,
      passwordHash,
      role: input.role,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      isActive: true
    }
  });
}

async function ensureAvailability(
  doctorId: string,
  weekday: number,
  startTime: string,
  endTime: string
) {
  const existing = await prisma.availability.findFirst({
    where: {
      doctorId,
      weekday,
      startTime,
      endTime
    }
  });

  if (existing) {
    if (!existing.isActive) {
      return prisma.availability.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
    }

    return existing;
  }

  return prisma.availability.create({
    data: {
      doctorId,
      weekday,
      startTime,
      endTime,
      isActive: true
    }
  });
}

async function upsertAppointmentByNote(input: {
  note: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  siteId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  createdById: string;
  updatedById?: string;
  cancellationReason?: string;
}) {
  const existing = await prisma.appointment.findFirst({
    where: {
      notes: input.note
    }
  });

  const data = {
    patientId: input.patientId,
    doctorId: input.doctorId,
    specialtyId: input.specialtyId,
    siteId: input.siteId,
    startAt: input.startAt,
    endAt: input.endAt,
    status: input.status,
    notes: input.note,
    cancellationReason: input.cancellationReason,
    createdById: input.createdById,
    updatedById: input.updatedById
  };

  if (existing) {
    return prisma.appointment.update({
      where: { id: existing.id },
      data
    });
  }

  return prisma.appointment.create({ data });
}

async function seed() {
  const admin = await upsertUser({
    email: 'admin@clinica.local',
    password: 'Admin123!',
    role: Role.ADMIN,
    firstName: 'Alicia',
    lastName: 'Admin',
    phone: '+5491100000001'
  });

  const siteCentro = await prisma.clinicSite.upsert({
    where: {
      name_address: {
        name: 'Sede Centro',
        address: 'Av. Principal 123'
      }
    },
    update: {
      isActive: true
    },
    create: {
      name: 'Sede Centro',
      address: 'Av. Principal 123',
      isActive: true
    }
  });

  const siteNorte = await prisma.clinicSite.upsert({
    where: {
      name_address: {
        name: 'Sede Norte',
        address: 'Calle Salud 456'
      }
    },
    update: {
      isActive: true
    },
    create: {
      name: 'Sede Norte',
      address: 'Calle Salud 456',
      isActive: true
    }
  });

  const siteSur = await prisma.clinicSite.upsert({
    where: {
      name_address: {
        name: 'Sede Sur',
        address: 'Bv. Bienestar 789'
      }
    },
    update: {
      isActive: true
    },
    create: {
      name: 'Sede Sur',
      address: 'Bv. Bienestar 789',
      isActive: true
    }
  });

  const cardiologia = await prisma.specialty.upsert({
    where: { name: 'Cardiologia' },
    update: {
      description: 'Atencion cardiologica integral',
      durationMinutes: 30,
      isActive: true
    },
    create: {
      name: 'Cardiologia',
      description: 'Atencion cardiologica integral',
      durationMinutes: 30,
      isActive: true
    }
  });

  const pediatria = await prisma.specialty.upsert({
    where: { name: 'Pediatria' },
    update: {
      description: 'Atencion de ninos y adolescentes',
      durationMinutes: 20,
      isActive: true
    },
    create: {
      name: 'Pediatria',
      description: 'Atencion de ninos y adolescentes',
      durationMinutes: 20,
      isActive: true
    }
  });

  const dermatologia = await prisma.specialty.upsert({
    where: { name: 'Dermatologia' },
    update: {
      description: 'Atencion de piel y anexos',
      durationMinutes: 25,
      isActive: true
    },
    create: {
      name: 'Dermatologia',
      description: 'Atencion de piel y anexos',
      durationMinutes: 25,
      isActive: true
    }
  });

  const clinicaGeneral = await prisma.specialty.upsert({
    where: { name: 'Clinica General' },
    update: {
      description: 'Consultas medicas generales para adultos',
      durationMinutes: 30,
      isActive: true
    },
    create: {
      name: 'Clinica General',
      description: 'Consultas medicas generales para adultos',
      durationMinutes: 30,
      isActive: true
    }
  });

  const doctorLaura = await upsertUser({
    email: 'doctor1@clinica.local',
    password: 'Doctor123!',
    role: Role.DOCTOR,
    firstName: 'Laura',
    lastName: 'Medina',
    phone: '+5491100000002'
  });

  const doctorMartin = await upsertUser({
    email: 'doctor2@clinica.local',
    password: 'Doctor123!',
    role: Role.DOCTOR,
    firstName: 'Martin',
    lastName: 'Rios',
    phone: '+5491100000003'
  });

  const doctorValeria = await upsertUser({
    email: 'doctor3@clinica.local',
    password: 'Doctor123!',
    role: Role.DOCTOR,
    firstName: 'Valeria',
    lastName: 'Costa',
    phone: '+5491100000005'
  });

  const doctorLauraProfile = await prisma.doctorProfile.upsert({
    where: {
      userId: doctorLaura.id
    },
    update: {
      licenseNumber: 'MN-12345',
      siteId: siteCentro.id,
      bio: 'Especialista en cardiologia y clinica general.'
    },
    create: {
      userId: doctorLaura.id,
      licenseNumber: 'MN-12345',
      siteId: siteCentro.id,
      bio: 'Especialista en cardiologia y clinica general.'
    }
  });

  const doctorMartinProfile = await prisma.doctorProfile.upsert({
    where: {
      userId: doctorMartin.id
    },
    update: {
      licenseNumber: 'MN-67890',
      siteId: siteNorte.id,
      bio: 'Pediatria ambulatoria y seguimiento integral.'
    },
    create: {
      userId: doctorMartin.id,
      licenseNumber: 'MN-67890',
      siteId: siteNorte.id,
      bio: 'Pediatria ambulatoria y seguimiento integral.'
    }
  });

  const doctorValeriaProfile = await prisma.doctorProfile.upsert({
    where: {
      userId: doctorValeria.id
    },
    update: {
      licenseNumber: 'MN-44556',
      siteId: siteSur.id,
      bio: 'Dermatologia clinica y control preventivo.'
    },
    create: {
      userId: doctorValeria.id,
      licenseNumber: 'MN-44556',
      siteId: siteSur.id,
      bio: 'Dermatologia clinica y control preventivo.'
    }
  });

  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorLauraProfile.id,
        specialtyId: cardiologia.id
      }
    },
    update: {},
    create: {
      doctorId: doctorLauraProfile.id,
      specialtyId: cardiologia.id
    }
  });

  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorLauraProfile.id,
        specialtyId: clinicaGeneral.id
      }
    },
    update: {},
    create: {
      doctorId: doctorLauraProfile.id,
      specialtyId: clinicaGeneral.id
    }
  });

  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorMartinProfile.id,
        specialtyId: pediatria.id
      }
    },
    update: {},
    create: {
      doctorId: doctorMartinProfile.id,
      specialtyId: pediatria.id
    }
  });

  await prisma.doctorSpecialty.upsert({
    where: {
      doctorId_specialtyId: {
        doctorId: doctorValeriaProfile.id,
        specialtyId: dermatologia.id
      }
    },
    update: {},
    create: {
      doctorId: doctorValeriaProfile.id,
      specialtyId: dermatologia.id
    }
  });

  await ensureAvailability(doctorLauraProfile.id, 1, '09:00', '13:00');
  await ensureAvailability(doctorLauraProfile.id, 3, '14:00', '18:00');
  await ensureAvailability(doctorMartinProfile.id, 2, '08:00', '12:00');
  await ensureAvailability(doctorMartinProfile.id, 4, '10:00', '16:00');
  await ensureAvailability(doctorValeriaProfile.id, 5, '09:00', '14:00');
  await ensureAvailability(doctorValeriaProfile.id, 6, '09:00', '12:00');

  const patientSofia = await upsertUser({
    email: 'paciente@clinica.local',
    password: 'Paciente123!',
    role: Role.PATIENT,
    firstName: 'Sofia',
    lastName: 'Perez',
    phone: '+5491100000004'
  });

  const patientLucas = await upsertUser({
    email: 'paciente2@clinica.local',
    password: 'Paciente123!',
    role: Role.PATIENT,
    firstName: 'Lucas',
    lastName: 'Gomez',
    phone: '+5491100000006'
  });

  const patientCarla = await upsertUser({
    email: 'paciente3@clinica.local',
    password: 'Paciente123!',
    role: Role.PATIENT,
    firstName: 'Carla',
    lastName: 'Suarez',
    phone: '+5491100000007'
  });

  await prisma.patientProfile.upsert({
    where: {
      userId: patientSofia.id
    },
    update: {
      document: '30111222',
      birthDate: new Date('1993-04-15'),
      phone: '+5491100000004'
    },
    create: {
      userId: patientSofia.id,
      document: '30111222',
      birthDate: new Date('1993-04-15'),
      phone: '+5491100000004'
    }
  });

  await prisma.patientProfile.upsert({
    where: {
      userId: patientLucas.id
    },
    update: {
      document: '32444555',
      birthDate: new Date('1989-11-03'),
      phone: '+5491100000006'
    },
    create: {
      userId: patientLucas.id,
      document: '32444555',
      birthDate: new Date('1989-11-03'),
      phone: '+5491100000006'
    }
  });

  await prisma.patientProfile.upsert({
    where: {
      userId: patientCarla.id
    },
    update: {
      document: '28999000',
      birthDate: new Date('1978-02-21'),
      phone: '+5491100000007'
    },
    create: {
      userId: patientCarla.id,
      document: '28999000',
      birthDate: new Date('1978-02-21'),
      phone: '+5491100000007'
    }
  });

  const blockReason = 'SEED_BLOCK_CAPACITACION_CARDIO';
  const existingBlock = await prisma.scheduleBlock.findFirst({
    where: {
      doctorId: doctorLauraProfile.id,
      reason: blockReason
    }
  });

  const blockStartAt = dateAt(6, 12, 0);
  const blockEndAt = dateAt(6, 14, 0);

  if (existingBlock) {
    await prisma.scheduleBlock.update({
      where: { id: existingBlock.id },
      data: {
        startAt: blockStartAt,
        endAt: blockEndAt,
        createdById: admin.id
      }
    });
  } else {
    await prisma.scheduleBlock.create({
      data: {
        doctorId: doctorLauraProfile.id,
        startAt: blockStartAt,
        endAt: blockEndAt,
        reason: blockReason,
        createdById: admin.id
      }
    });
  }

  const pendingStart = dateAt(2, 10, 0);
  const confirmedStart = dateAt(3, 11, 0);
  const canceledStart = dateAt(4, 15, 0);
  const completedStart = dateAt(-2, 9, 0);
  const noShowStart = dateAt(-1, 14, 0);

  await upsertAppointmentByNote({
    note: 'SEED_DEMO_APPT_PENDING',
    patientId: patientSofia.id,
    doctorId: doctorLaura.id,
    specialtyId: cardiologia.id,
    siteId: siteCentro.id,
    startAt: pendingStart,
    endAt: addMinutes(pendingStart, cardiologia.durationMinutes),
    status: AppointmentStatus.PENDING,
    createdById: patientSofia.id
  });

  await upsertAppointmentByNote({
    note: 'SEED_DEMO_APPT_CONFIRMED',
    patientId: patientLucas.id,
    doctorId: doctorMartin.id,
    specialtyId: pediatria.id,
    siteId: siteNorte.id,
    startAt: confirmedStart,
    endAt: addMinutes(confirmedStart, pediatria.durationMinutes),
    status: AppointmentStatus.CONFIRMED,
    createdById: patientLucas.id,
    updatedById: doctorMartin.id
  });

  await upsertAppointmentByNote({
    note: 'SEED_DEMO_APPT_CANCELED',
    patientId: patientCarla.id,
    doctorId: doctorValeria.id,
    specialtyId: dermatologia.id,
    siteId: siteSur.id,
    startAt: canceledStart,
    endAt: addMinutes(canceledStart, dermatologia.durationMinutes),
    status: AppointmentStatus.CANCELED,
    createdById: patientCarla.id,
    updatedById: patientCarla.id,
    cancellationReason: 'Cancelado por motivo personal (demo seed).'
  });

  await upsertAppointmentByNote({
    note: 'SEED_DEMO_APPT_COMPLETED',
    patientId: patientSofia.id,
    doctorId: doctorLaura.id,
    specialtyId: clinicaGeneral.id,
    siteId: siteCentro.id,
    startAt: completedStart,
    endAt: addMinutes(completedStart, clinicaGeneral.durationMinutes),
    status: AppointmentStatus.COMPLETED,
    createdById: patientSofia.id,
    updatedById: doctorLaura.id
  });

  await upsertAppointmentByNote({
    note: 'SEED_DEMO_APPT_NO_SHOW',
    patientId: patientLucas.id,
    doctorId: doctorMartin.id,
    specialtyId: pediatria.id,
    siteId: siteNorte.id,
    startAt: noShowStart,
    endAt: addMinutes(noShowStart, pediatria.durationMinutes),
    status: AppointmentStatus.NO_SHOW,
    createdById: patientLucas.id,
    updatedById: doctorMartin.id
  });

  await prisma.systemSetting.upsert({
    where: { key: 'CANCELLATION_WINDOW_HOURS' },
    update: { value: process.env.DEFAULT_CANCELLATION_WINDOW_HOURS ?? '24' },
    create: {
      key: 'CANCELLATION_WINDOW_HOURS',
      value: process.env.DEFAULT_CANCELLATION_WINDOW_HOURS ?? '24'
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      action: 'SYSTEM_SEED',
      entity: 'SYSTEM',
      metadata: {
        message: 'Seed demo ejecutado con datos genericos',
        users: {
          admin: 1,
          doctors: 3,
          patients: 3
        },
        at: new Date().toISOString()
      }
    }
  });

  console.log('Seed demo finalizado.');
  console.log('Admin: admin@clinica.local / Admin123!');
  console.log('Doctor: doctor1@clinica.local / Doctor123!');
  console.log('Doctor: doctor2@clinica.local / Doctor123!');
  console.log('Doctor: doctor3@clinica.local / Doctor123!');
  console.log('Paciente: paciente@clinica.local / Paciente123!');
  console.log('Paciente: paciente2@clinica.local / Paciente123!');
  console.log('Paciente: paciente3@clinica.local / Paciente123!');
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
