import {
  INestApplication,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const skipConnect = process.env.PRISMA_SKIP_CONNECT_ON_STARTUP === 'true';

    if (skipConnect) {
      this.logger.warn('PRISMA_SKIP_CONNECT_ON_STARTUP=true, se omite conexion inicial a base de datos');
      return;
    }

    try {
      await this.$connect();
    } catch (error) {
      const allowStartupWithoutDb = process.env.NODE_ENV !== 'production';

      if (allowStartupWithoutDb) {
        this.logger.error(
          'No se pudo conectar a PostgreSQL al iniciar. La API levanta en modo degradado hasta que la DB este disponible.'
        );
        return;
      }

      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}
