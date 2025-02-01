import { Controller, Get, Post, Put, Delete, Body, Param, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConsultasNovedadesService } from '../services/consulta-novedades.service';
import { ConsultaNovedadDto, ObservacionConsultaDto } from '../dto/consulta-novedades.dto';
import { NovedadesService } from '../services/novedades.service';
import { Novedad } from '../entities/novedad.entity';

@Controller('consultas-novedades')
export class ConsultasNovedadesController {
  private readonly logger = new Logger(ConsultasNovedadesController.name);

  constructor(
    private readonly consultaService: ConsultasNovedadesService,
    private readonly novedadesService: NovedadesService
  ) {}

  @Get('consulta')
  async consultarNovedades(@Query() filtros: any) {
    this.logger.log(`Consultando novedades con filtros: ${JSON.stringify(filtros)}`);
    return await this.consultaService.consultarNovedades(filtros);
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
    @Param('id') novedadId: number,
    @Body() datos: ObservacionConsultaDto
  ) {
    this.logger.log(`Agregando observación a novedad ${novedadId}: ${JSON.stringify(datos)}`);
    return await this.consultaService.agregarObservacion(novedadId, datos.observacion);
  }

  @Get(':id/observaciones')
  async obtenerObservaciones(@Param('id') novedadId: number) {
    return await this.consultaService.obtenerObservaciones(novedadId);
  }

  @Put('observaciones/:id')
  async actualizarObservacion(
    @Param('id') id: number,
    @Body() datos: {observacion: string}
  ) {
    return await this.consultaService.actualizarObservacion(id, datos.observacion);
  }

  @Put(':id')
  async actualizarNovedad(@Param('id') id: number, @Body() datos: any) {
    return await this.consultaService.actualizarNovedad(id, datos);
  }

  @Post(':id/enviar-correo')
  async enviarCorreoActualizacion(@Param('id') id: number) {
    try {
      await this.novedadesService.enviarCorreoNovedad(id);
      return { message: 'Correo enviado exitosamente' };
    } catch (error: any) {
      this.logger.error(`Error al enviar correo para novedad ${id}: ${error.message}`);
      throw new HttpException(
        `Error al enviar correo: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async eliminarNovedad(@Param('id') id: number) {
    return await this.consultaService.eliminarNovedad(id);
  }

  @Get(':id/productos')
  async getProductosNovedad(@Param('id') id: number) {
    this.logger.log(`Obteniendo productos para novedad ID: ${id}`);
    return await this.consultaService.getProductosNovedad(id);
  }
}