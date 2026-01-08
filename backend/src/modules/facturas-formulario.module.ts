
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacturaFormulario } from '../entities/facturas-formulario.entity';
import { FacturasFormularioService } from '../services/facturas-formulario.service';
import { FacturasFormularioController } from '../controllers/facturas-formulario.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FacturaFormulario])],
  providers: [FacturasFormularioService],
  controllers: [FacturasFormularioController],
  exports: [FacturasFormularioService] // Exportar el servicio si otros módulos lo necesitan
})
export class FacturasFormularioModule {}
