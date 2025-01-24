import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NovedadesController } from '../controllers/novedades.controller';
import { NovedadesService } from '../services/novedades.service';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { Usuario } from '../entities/usuario.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad, ProductoNovedad, Usuario]),
    MailerModule
  ],
  controllers: [NovedadesController],
  providers: [NovedadesService],
  exports: [NovedadesService]
})
export class NovedadesModule {}