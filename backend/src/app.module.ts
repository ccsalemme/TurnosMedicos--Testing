import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './modules/admin/admin.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { DoctorsModule } from './modules/doctors/doctors.module';
import { SpecialtiesModule } from './modules/specialties/specialties.module';
import { UsersModule } from './modules/users/users.module';
import { MockModule } from './modules/mock/mock.module';

dotenv.config();
const mockModeEnabled = (process.env.MOCK_MODE ?? '').toLowerCase() === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    ...(mockModeEnabled
      ? [MockModule]
      : [
          PrismaModule,
          AuditModule,
          AuthModule,
          UsersModule,
          SpecialtiesModule,
          DoctorsModule,
          AvailabilityModule,
          AppointmentsModule,
          AdminModule
        ])
    // Provisional fallback requested by user:
    // keep DB modules disabled while MOCK_MODE=true.
  ]
})
export class AppModule {}
