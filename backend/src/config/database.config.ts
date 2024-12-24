import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    host: process.env.DB_HOST, 
    port: +process.env.DB_PORT, 
    username: process.env.DB_USER, 
    password: process.env.DB_PASS, 
    database: process.env.DB_NAME, 
    entities: [__dirname + '/../**/*.entity{.ts,.js}'], // Asegúrate de que las entidades se carguen correctamente
    synchronize: true, // Solo para desarrollo, no usar en producción
};