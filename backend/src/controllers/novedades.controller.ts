import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { NovedadesService } from '../services/novedades.service';

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  @Get('ultima-remision')
  async getUltimaRemision() {
    try {
      const ultimaNovedad = await this.novedadesService.findLastRemision();
      return ultimaNovedad || { numero_remision: 'FNAO0000' };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener última remisión');
    }
  }
} 