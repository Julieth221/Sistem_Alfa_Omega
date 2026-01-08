
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FacturaFormulario } from '../entities/facturas-formulario.entity';
import { CreateFacturaFormularioDto } from '../dto/facturas-formulario.dto';

@Injectable()
export class FacturasFormularioService {
  constructor(
    @InjectRepository(FacturaFormulario)
    private facturasFormularioRepository: Repository<FacturaFormulario>,
  ) {}

  async create(createFacturaFormularioDto: CreateFacturaFormularioDto): Promise<FacturaFormulario> {
    const factura = this.facturasFormularioRepository.create(createFacturaFormularioDto);
    return this.facturasFormularioRepository.save(factura);
  }

  async findAll(numero_factura?: string, estado?: string): Promise<FacturaFormulario[]> {
    const queryBuilder = this.facturasFormularioRepository.createQueryBuilder('factura');

    if (numero_factura) {
      queryBuilder.andWhere('factura.numero_factura ILIKE :numero_factura', { numero_factura: `%${numero_factura}%` });
    }

    if (estado) {
      queryBuilder.andWhere('factura.estado = :estado', { estado });
    }

    return queryBuilder.getMany();
  }
}
