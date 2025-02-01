import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultasNovedadesController } from '../controllers/consulta-novedades.controller';
import { ConsultasNovedadesService } from '../services/consulta-novedades.service';
import {ObservacionConsulta} from '../entities/consultas-novedades/observacion-consulta.entity'
import { NovedadesModule } from './novedades.module';
import { Novedad } from '../entities/consultas-novedades/Con-novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Novedad, ProductoNovedad, ObservacionConsulta]),
    NovedadesModule
  ],
  controllers: [ConsultasNovedadesController],
  providers: [ConsultasNovedadesService],
  exports: [ConsultasNovedadesService]
})
export class ConsultasNovedadModule {}