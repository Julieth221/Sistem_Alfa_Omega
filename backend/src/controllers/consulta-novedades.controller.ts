import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger } from '@nestjs/common';
import { ConsultasNovedadesService } from '../services/consulta-novedades.service';
import { ConsultaNovedadDto, ObservacionConsultaDto } from '../dto/consulta-novedades.dto';

@Controller('consultas-novedades')
export class ConsultasNovedadesController {
  private readonly logger = new Logger(ConsultasNovedadesController.name);

  constructor(private readonly consultaService: ConsultasNovedadesService) {}

  @Get('consulta')
  async consultarNovedades(@Query() filtros: ConsultaNovedadDto) {
    this.logger.log(`Consultando novedades con filtros: ${JSON.stringify(filtros)}`);
    try {
      const resultado = await this.consultaService.consultarNovedades(filtros);
      this.logger.log(`Novedades encontradas: ${resultado.length}`);
      return resultado;
    } catch (error: any) {
      this.logger.error(`Error al consultar novedades: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async obtenerNovedad(@Param('id') id: number) {
    this.logger.log(`Obteniendo novedad con ID: ${id}`);
    try {
      const novedad = await this.consultaService.obtenerNovedad(id);
      this.logger.log(`Novedad encontrada: ${JSON.stringify(novedad)}`);
      return novedad;
    } catch (error: any) {
      this.logger.error(`Error al obtener novedad: ${error.message}`);
      throw error;
    }
  }

  @Post(':id/observaciones')
  async agregarObservacion(
    @Param('id') id: number,
    @Body() datos: ObservacionConsultaDto
  ) {
    this.logger.log(`Agregando observación a novedad ${id}: ${JSON.stringify(datos)}`);
    try {
      return await this.consultaService.agregarObservacion(datos);
    } catch (error: any) {
      this.logger.error(`Error al agregar observación: ${error.message}`);
      throw error;
    }
  }

  @Put(':id')
  async actualizarNovedad(@Param('id') id: number, @Body() datos: any) {
    return await this.consultaService.actualizarNovedad(id, datos);
  }

  @Delete(':id')
  async eliminarNovedad(@Param('id') id: number) {
    return await this.consultaService.eliminarNovedad(id);
  }
}