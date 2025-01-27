import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NovedadesController } from '../controllers/novedades.controller';
import { NovedadesService } from '../services/novedades.service';
import { ConsultasNovedadesController } from '../controllers/consulta-novedades.controller';
import { ConsultasNovedadesService } from '../services/consulta-novedades.service';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { Usuario } from '../entities/usuario.entity';
import { ObservacionConsulta } from '../entities/consultas-novedades/observacion-consulta.entity';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Novedad, 
      ProductoNovedad, 
      Usuario,
      ObservacionConsulta
    ]),
    MailerModule
  ],
  controllers: [NovedadesController, ConsultasNovedadesController],
  providers: [NovedadesService, ConsultasNovedadesService],
  exports: [NovedadesService, ConsultasNovedadesService]
})
export class NovedadesModule {}