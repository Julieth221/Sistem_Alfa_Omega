import { Controller, Post, Body, Get, HttpStatus, HttpException } from '@nestjs/common';
import { NovedadesService } from '../services/novedades.service';
import { INovedadDto } from '../dto/producto-novedad.interface';

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  @Post()
  async crearNovedad(@Body() novedadDto: INovedadDto) {
    try {
      const novedad = await this.novedadesService.create(novedadDto);
      return {
        success: true,
        message: 'Novedad creada y correo enviado exitosamente',
        novedad
      };
    } catch (error: any) {
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al crear la novedad o enviar el correo',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('ultima-remision')
  async getUltimaRemision() {
    try {
      const ultimaRemision = await this.novedadesService.findLastRemision();
      return {
        success: true,
        data: ultimaRemision
      };
    } catch (error: any) {
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Error al obtener la última remisión',
        details: error.message
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
} 