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

  async consultarNovedades(filtros: any) {
    this.logger.log(`Consultando novedades con filtros: ${JSON.stringify(filtros)}`);
    try {
      const queryBuilder = this.novedadesRepository
        .createQueryBuilder('novedad')
        .leftJoinAndSelect('novedad.productos', 'productos');

      // Solo agregamos el join si la relación existe
      const metadata = this.novedadesRepository.metadata;
      if (metadata.relations.some(rel => rel.propertyName === 'observaciones_consulta')) {
        queryBuilder.leftJoinAndSelect('novedad.observaciones_consulta', 'observaciones');
      }

      if (filtros.remision_factura) {
        queryBuilder.andWhere('novedad.remision_factura ILIKE :remision', {
          remision: `%${filtros.remision_factura}%`
        });
      }

      queryBuilder.orderBy('novedad.fecha', 'DESC');

      const novedades = await queryBuilder.getMany();
      this.logger.log(`Se encontraron ${novedades.length} novedades`);
      return novedades;
    } catch (error: any) {
      this.logger.error(`Error al consultar novedades: ${error.message}`);
      throw error;
    }
  }

  async obtenerNovedad(id: number) {
    try {
      const novedad = await this.novedadesRepository.findOne({
        where: { id },
        relations: ['productos']
      });
      
      if (!novedad) {
        throw new Error(`Novedad con ID ${id} no encontrada`);
      }
      
      return novedad;
    } catch (error: any) {
      this.logger.error(`Error al obtener novedad: ${error.message}`);
      throw error;
    }
  }

  async agregarObservacion(datos: any) {
    try {
      const observacion = this.observacionesRepository.create(datos);
      return await this.observacionesRepository.save(observacion);
    } catch (error: any) {
      this.logger.error(`Error al agregar observación: ${error.message}`);
      throw error;
    }
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