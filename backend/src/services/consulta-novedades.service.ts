import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Novedad } from '../entities/consultas-novedades/Con-novedad.entity';
import { ObservacionConsulta } from '../entities/consultas-novedades/observacion-consulta.entity';
import { ConsultaNovedadDto, ObservacionConsultaDto } from '../dto/consulta-novedades.dto';

@Injectable()
export class ConsultasNovedadesService {
  private readonly logger = new Logger(ConsultasNovedadesService.name);

  constructor(
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>,
    @InjectRepository(ObservacionConsulta)
    private observacionesRepository: Repository<ObservacionConsulta>
  ) {}

  async consultarNovedades(filtros: ConsultaNovedadDto) {
    try {
      this.logger.log(`Consultando novedades con filtros: ${JSON.stringify(filtros)}`);
      
      const queryBuilder = this.novedadesRepository
        .createQueryBuilder('novedad')
        .leftJoinAndSelect('novedad.productos', 'productos')
        .leftJoinAndSelect('novedad.observaciones_consulta', 'observaciones')
        .orderBy('novedad.fecha', 'DESC');

      if (filtros.remision_factura) {
        queryBuilder.andWhere('novedad.remision_factura ILIKE :remision', {
          remision: `%${filtros.remision_factura}%`
        });
      }

      if (filtros.fecha_inicio && filtros.fecha_fin) {
        queryBuilder.andWhere('novedad.fecha BETWEEN :inicio AND :fin', {
          inicio: filtros.fecha_inicio,
          fin: filtros.fecha_fin
        });
      }

      const novedades = await queryBuilder.getMany();
      this.logger.log(`Se encontraron ${novedades.length} novedades`);
      
      return novedades;
    } catch (error: any) {
      this.logger.error(`Error al consultar novedades: ${error.message}`);
      throw error;
    }
  }

  async obtenerNovedad(id: number) {
    const novedad = await this.novedadesRepository.findOne({
      where: { id },
      relations: ['productos', 'observaciones']
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
    }

    return novedad;
  }

  async agregarObservacion(datos: ObservacionConsultaDto) {
    const novedad = await this.novedadesRepository.findOne({
      where: { id: datos.novedad_id }
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${datos.novedad_id} no encontrada`);
    }

    const observacion = this.observacionesRepository.create({
      novedad_id: datos.novedad_id,
      usuario_id: datos.usuario_id,
      observacion: datos.observacion
    });

    return await this.observacionesRepository.save(observacion);
  }

  async actualizarNovedad(id: number, datos: any) {
    const novedad = await this.novedadesRepository.findOne({
      where: { id }
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
    }

    Object.assign(novedad, datos);
    return await this.novedadesRepository.save(novedad);
  }

  async eliminarNovedad(id: number) {
    const novedad = await this.novedadesRepository.findOne({
      where: { id }
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
    }

    await this.novedadesRepository.remove(novedad);
  }
}