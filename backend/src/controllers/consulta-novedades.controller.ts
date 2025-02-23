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
    @Body() datos: { observacion: string }
  ) {
    try {
      this.logger.log(`Agregando observación para novedad ${novedadId}`);
      this.logger.debug('Datos recibidos:', datos);

      if (!datos || !datos.observacion || datos.observacion.trim() === '') {
        throw new HttpException('La observación no puede estar vacía', HttpStatus.BAD_REQUEST);
      }

      const resultado = await this.consultaService.agregarObservacion(
        novedadId,
        datos.observacion.trim()
      );

      return {
        success: true,
        message: 'Observación agregada exitosamente',
        data: resultado
      };

    } catch (error: any) {
      this.logger.error(`Error al agregar observación: ${error.message}`);
      throw new HttpException(
        error.message || 'Error al agregar la observación',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/observaciones')
  async obtenerObservaciones(@Param('id') novedadId: number) {
    try {
      return await this.consultaService.obtenerObservaciones(novedadId);
    } catch (error: any) {
      this.logger.error(`Error al obtener observaciones: ${error.message}`);
      throw new HttpException(
        `Error al obtener observaciones: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('observaciones/:id')
  async actualizarObservacion(
    @Param('id') id: number,
    @Body('observacion') observacion: string
  ) {
    try {
      if (!observacion) {
        throw new HttpException('La observación no puede estar vacía', HttpStatus.BAD_REQUEST);
      }

      return await this.consultaService.actualizarObservacion(id, observacion);
    } catch (error: any) {
      this.logger.error(`Error al actualizar observación: ${error.message}`);
      throw new HttpException(
        `Error al actualizar observación: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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