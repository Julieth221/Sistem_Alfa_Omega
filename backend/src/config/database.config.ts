import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'sistem',
  database: process.env.DB_NAME || 'SISTEMA_ALFA_OMEGA',
  schema: process.env.DB_SCHEMA || 'SistemNovedad',
  entities: [join(__dirname, '..', '**', '*.entity{.ts,.js}')],
  synchronize: false,
  logging: true,
};