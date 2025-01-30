import { Module } from '@nestjs/common';
import { UsuariosController } from '../controllers/usuarios.controller';
import { UsuariosService } from '../services/usuarios.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../entities/usuario.entity';
import { DatabaseModule } from '../modules/database.module'

@Module({
  imports: [DatabaseModule],
    controllers: [UsuariosController],
    providers: [UsuariosService],
    exports: [UsuariosService]
})
export class UsersModule {} 