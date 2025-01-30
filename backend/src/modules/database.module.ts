import { Module, Global } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigModule, ConfigService } from '@nestjs/config';

const databaseProvider = {
  provide: 'DATABASE_POOL',
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    return new Pool({
      user: configService.get('DB_USER'),
      host: configService.get('DB_HOST'),
      database: configService.get('DB_NAME'),
      password: configService.get('DB_PASSWORD'),
      port: configService.get('DB_PORT'),
    });
  },
};

@Global() // Hace que el módulo esté disponible globalmente
@Module({
  imports: [ConfigModule],
  providers: [databaseProvider],
  exports: ['DATABASE_POOL'],
})
export class DatabaseModule {}