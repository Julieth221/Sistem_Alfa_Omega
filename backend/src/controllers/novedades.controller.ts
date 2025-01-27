import { Controller, Get, Post, Body, UseGuards, Request, HttpException, HttpStatus, InternalServerErrorException, Header, Res } from '@nestjs/common';
import { NovedadesService } from '../services/novedades.service';
import { INovedadDto, IProductoNovedadDto } from '../dto/producto-novedad.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest, Response } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: number;
    email: string;
    roles: string[];
  }
}

@Controller('novedades')
export class NovedadesController {
  constructor(private readonly novedadesService: NovedadesService) {}

  @Get('ultimo-numero')
  async getUltimoNumeroRemision() {
    try {
      const numeroRemision = await this.novedadesService.getUltimoNumeroRemision();
      return { numeroRemision };
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Request() req: RequestWithUser, @Body() novedadDto: INovedadDto) {
    try {
      const novedadWithUser = {
        ...novedadDto,
        usuario_id: req.user.id
      };
      
      const novedad = await this.novedadesService.create(novedadWithUser);
      return {
        success: true,
        message: 'Novedad creada y correo enviado exitosamente',
        novedad
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard)
  @Header('Content-Type', 'application/pdf')
  async generatePreview(@Body() novedadDto: INovedadDto, @Res() res: Response): Promise<void> {
    try {
      const pdfBuffer = await this.novedadesService.generatePreviewPdf(novedadDto);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length,
      });
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generando preview:', error);
      throw new InternalServerErrorException('Error al generar el PDF');
    }
  }
} 