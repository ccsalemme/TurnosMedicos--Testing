import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MockController } from './mock.controller';
import { MockDataService } from './mock-data.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', ''),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '8h') as any
        }
      })
    })
  ],
  controllers: [MockController],
  providers: [MockDataService]
})
export class MockModule {}
