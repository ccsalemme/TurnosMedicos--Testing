import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:5173').split(','),
    credentials: true
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const mockModeEnabled =
    String(configService.get<string>('MOCK_MODE', 'false')).toLowerCase() === 'true';

  if (!mockModeEnabled) {
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutdownHooks(app);
  }

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}

bootstrap();
