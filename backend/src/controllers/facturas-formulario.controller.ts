
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FacturasFormularioService } from '../services/facturas-formulario.service';
import { CreateFacturaFormularioDto } from '../dto/facturas-formulario.dto';
import { FacturaFormulario } from '../entities/facturas-formulario.entity';

@Controller('facturas-formulario')
export class FacturasFormularioController {
  constructor(private readonly facturasFormularioService: FacturasFormularioService) {}

  @Post()
  async create(@Body() createFacturaFormularioDto: CreateFacturaFormularioDto): Promise<FacturaFormulario> {
    return this.facturasFormularioService.create(createFacturaFormularioDto);
  }

  @Get()
  async findAll(
    @Query('numero_factura') numero_factura?: string,
    @Query('estado') estado?: string,
  ): Promise<FacturaFormulario[]> {
    return this.facturasFormularioService.findAll(numero_factura, estado);
  }
}
