import { Injectable, NotFoundException, Logger, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { Novedad } from '../entities/consultas-novedades/Con-novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { ObservacionConsulta } from '../entities/consultas-novedades/observacion-consulta.entity';
import { ConsultaNovedadDto, ObservacionConsultaDto } from '../dto/consulta-novedades.dto';

@Injectable()
export class ConsultasNovedadesService {
  private readonly logger = new Logger(ConsultasNovedadesService.name);
  private readonly schema: string;

  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private configService: ConfigService,
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>,
    @InjectRepository(ProductoNovedad)
    private productosRepository: Repository<ProductoNovedad>,
    @InjectRepository(ObservacionConsulta)
    private observacionesRepository: Repository<ObservacionConsulta>
  ) {
    this.schema = this.configService.get('DB_SCHEMA') || 'SistemNovedad';
  }

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
        // Filtrado exacto por remisión_factura
        queryBuilder.where('novedad.remision_factura = :remision', {
          remision: filtros.remision_factura
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

  async getProductosNovedad(novedadId: number) {
    this.logger.log(`Obteniendo productos para la novedad ID: ${novedadId}`);
    try {
      const productos = await this.productosRepository.find({
        where: { novedad: { id: novedadId } },
        relations: ['novedad']
      });

      if (!productos.length) {
        throw new NotFoundException(`No se encontraron productos para la novedad ID ${novedadId}`);
      }

      return productos;
    } catch (error: any) {
      this.logger.error(`Error al obtener productos: ${error.message}`);
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

  async obtenerNovedadCompleta(id: number): Promise<{ novedad: any; productos: any[] }> {
    const novedad = await this.novedadesRepository.findOne({
      where: { id },
      relations: ['productos']
    });

    if (!novedad) {
      throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
    }

    return {
      novedad,
      productos: novedad.productos || []
    };
  }

  async agregarObservacion(novedadId: number, observacion: string): Promise<ObservacionConsulta> {
    try {
      if (!observacion || observacion.trim() === '') {
        throw new BadRequestException('La observación no puede estar vacía');
      }

      // Verificar si la novedad existe
      const novedad = await this.novedadesRepository.findOne({
        where: { id: novedadId }
      });

      if (!novedad) {
        throw new NotFoundException(`Novedad con ID ${novedadId} no encontrada`);
      }

      // Crear y guardar la observación
      const nuevaObservacion = this.observacionesRepository.create({
        novedad_id: novedadId,  // Asegúrate de que este campo coincida con tu entidad
        observacion: observacion.trim(),
        created_at: new Date(),
        updated_at: new Date()
      });

      const observacionGuardada = await this.observacionesRepository.save(nuevaObservacion);
      
      this.logger.log(`Observación agregada exitosamente para novedad ${novedadId}`);
      return observacionGuardada;

    } catch (error) {
      this.logger.error(`Error al agregar observación para novedad ${novedadId}:`, error);
      throw error;
    }
  }

  async obtenerObservaciones(novedadId: number): Promise<ObservacionConsulta[]> {
    try {
      const observaciones = await this.observacionesRepository
        .createQueryBuilder('observacion')
        .where('observacion.novedad_id = :novedadId', { novedadId })
        .orderBy('observacion.created_at', 'DESC')
        .getMany();

      return observaciones;
    } catch (error) {
      this.logger.error(`Error al obtener observaciones para novedad ${novedadId}:`, error);
      throw error;
    }
  }

  async actualizarObservacion(id: number, observacion: string): Promise<ObservacionConsulta> {
    try {
      if (!observacion || observacion.trim() === '') {
        throw new BadRequestException('La observación no puede estar vacía');
      }

      const observacionExistente = await this.observacionesRepository.findOne({
        where: { id }
      });

      if (!observacionExistente) {
        throw new NotFoundException(`Observación con ID ${id} no encontrada`);
      }

      observacionExistente.observacion = observacion.trim();
      observacionExistente.updated_at = new Date();

      const observacionActualizada = await this.observacionesRepository.save(observacionExistente);
      
      this.logger.log(`Observación ${id} actualizada exitosamente`);
      return observacionActualizada;
    } catch (error) {
      this.logger.error(`Error al actualizar observación ${id}:`, error);
      throw error;
    }
  }

  async actualizarNovedad(id: number, datos: any) {
    this.logger.log(`Actualizando novedad ID ${id}`);
    try {
      const novedad = await this.novedadesRepository.findOne({
        where: { id },
        relations: ['productos']
      });

      if (!novedad) {
        throw new NotFoundException(`Novedad con ID ${id} no encontrada`);
      }

      // Actualizar datos básicos de la novedad
      const novedadActualizada = {
        numero_remision: datos.numero_remision,
        remision_factura: datos.remision_factura,
        fecha: datos.fecha,
        trabajador: datos.trabajador,
        proveedor: datos.proveedor,
        nit: datos.nit,
        observaciones: datos.observaciones,
        remision_proveedor_urls: datos.remision_proveedor_urls,
        foto_estado_urls: datos.foto_estado_urls,
        foto_remision_urls: datos.foto_remision_urls,
        foto_devolucion_urls: datos.foto_devolucion_urls
      };

      Object.assign(novedad, novedadActualizada);
      await this.novedadesRepository.save(novedad);

      // Actualizar productos
      if (datos.productos && datos.productos.length > 0) {
        await this.actualizarProductos(novedad.id, datos.productos);
      }

      return await this.novedadesRepository.findOne({
        where: { id },
        relations: ['productos']
      });
    } catch (error: any) {
      this.logger.error(`Error al actualizar novedad: ${error.message}`);
      throw error;
    }
  }

  private async actualizarProductos(novedadId: number, productos: any[]) {
    try {
      // Obtener IDs de productos existentes
      const productosExistentes = await this.productosRepository.find({
        where: { novedad: { id: novedadId } }
      });
      
      const idsExistentes = productosExistentes.map(p => p.id);
      const idsNuevos = productos.filter(p => p.id).map(p => p.id);

      // Eliminar productos que ya no están en la lista
      const idsAEliminar = idsExistentes.filter(id => !idsNuevos.includes(id));
      if (idsAEliminar.length > 0) {
        await this.productosRepository.delete(idsAEliminar);
      }

      // Actualizar o crear productos
      for (const producto of productos) {
        const productoData = {
          novedad: { id: novedadId },
          ...producto
        };

        if (producto.id) {
          // Actualizar producto existente
          const { id, ...updateData } = productoData;
          await this.productosRepository.update(id, updateData);
        } else {
          // Crear nuevo producto
          await this.productosRepository.save(productoData);
        }
      }
    } catch (error: any) {
      this.logger.error(`Error al actualizar productos: ${error.message}`);
      throw error;
    }
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