import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { NovedadesService } from '../services/novedades.service';
import { NovedadesController } from '../controllers/novedades.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Novedad, ProductoNovedad])],
  providers: [NovedadesService],
  controllers: [NovedadesController],
  exports: [NovedadesService]
})
export class NovedadesModule {}