import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { databaseConfig } from './config/database.config'; // Importa la configuración de la base de datos
import { UsersModule } from './users/users.module'; // Importa el módulo de usuarios

@Module({
  imports: [
    ConfigModule.forRoot(), // Carga las variables de entorno
    TypeOrmModule.forRoot(databaseConfig), // Conectar a la base de datos
    UsersModule, // Importa tu módulo de usuarios
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

