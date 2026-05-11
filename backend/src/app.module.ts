import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { validateEnv } from './config/env.validation';
import { MockModule } from './modules/mock/mock.module';

dotenv.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv
    }),
    MockModule
  ]
})
export class AppModule {}
