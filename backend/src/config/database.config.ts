import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    schema: process.env.DB_SCHEMA,
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: process.env.APP_ENV === 'development',
    logging: process.env.APP_ENV === 'development',
    ssl: process.env.APP_ENV === 'production',
};