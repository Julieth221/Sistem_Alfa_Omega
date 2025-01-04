import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { INovedadDto } from '../dto/producto-novedad.interface';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>,
    @InjectRepository(ProductoNovedad)
    private productosNovedadRepository: Repository<ProductoNovedad>,
    private dataSource: DataSource,
    private mailerService: MailerService
  ) {}

  async getUltimoNumeroRemision(): Promise<string> {
    try {
      // Obtener la última novedad ordenada por id de forma descendente
      const ultimaNovedad = await this.novedadesRepository
        .createQueryBuilder('novedad')
        .orderBy('novedad.id', 'DESC')
        .getOne();

      if (!ultimaNovedad) {
        return 'FNAO0001'; // Valor inicial si no hay novedades
      }

      // Extraer el número de la última remisión
      const numeroActual = parseInt(ultimaNovedad.numero_remision.replace('FNAO', ''));
      // Incrementar en 1
      const siguienteNumero = numeroActual + 1;
      // Formatear el nuevo número con ceros a la izquierda
      return `FNAO${siguienteNumero.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error al obtener último número de remisión:', error);
      throw error;
    }
  }

  async create(novedadDto: INovedadDto): Promise<Novedad> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('Datos recibidos:', novedadDto); // Debug

      // Obtener el siguiente número de remisión
      const numeroRemision = await this.getUltimoNumeroRemision();

      // Crear la novedad con todos los campos necesarios
      const novedad = this.novedadesRepository.create({
        numero_remision: numeroRemision,
        fecha: novedadDto.fecha,
        trabajador: novedadDto.diligenciado_por, // Asegurarnos de que este campo se asigne
        usuario_id: novedadDto.usuario_id
      });

      console.log('Novedad a guardar:', novedad); // Debug

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      if (novedadDto.productos?.length > 0) {
        const productosNovedad = await Promise.all(novedadDto.productos.map(async producto => {
          let foto_remision_url = 'sin_imagen.jpg';

          if (producto.foto_remision) {
            try {
              // Extraer el contenido base64
              const base64Data = producto.foto_remision.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');

              // Crear directorio si no existe
              const uploadDir = path.join(process.cwd(), 'uploads');
              if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
              }

              // Generar nombre único para el archivo
              const fileName = `remision_${savedNovedad.id}_${Date.now()}.jpg`;
              const filePath = path.join(uploadDir, fileName);

              // Comprimir y guardar la imagen
              await sharp(buffer)
                .resize(800, 800, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .jpeg({
                  quality: 60,
                  progressive: true
                })
                .toFile(filePath);

              foto_remision_url = `/uploads/${fileName}`;
            } catch (error) {
              console.error('Error procesando imagen:', error);
              foto_remision_url = 'sin_imagen.jpg';
            }
          }

          return this.productosNovedadRepository.create({
            ...producto,
            novedad_id: savedNovedad.id,
            correo: novedadDto.correo || 'darlycuberos17@gmail.com',
            foto_remision_url
          });
        }));

        await queryRunner.manager.save(ProductoNovedad, productosNovedad);
      }

      await queryRunner.commitTransaction();
      return savedNovedad;

    } catch (error: any) {
      console.error('Error en create:', error);
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await queryRunner.release();
    }
  }
  

  generateEmailPreview(novedad: Novedad, productos: ProductoNovedad[]): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h2>Novedad de Remisión</h2>
        <p><strong>Fecha:</strong> ${new Date(novedad.fecha).toLocaleDateString()}</p>
        <p><strong>Diligenciado por:</strong> ${novedad.trabajador}</p>
        <h3>Productos:</h3>
        <div style="margin-top: 20px;">
          ${productos.map(p => `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px;">
              <p><strong>Referencia:</strong> ${p.referencia}</p>
              <p><strong>Descripción:</strong> ${p.descripcion || 'No especificada'}</p>
              ${this.generateProductDetails(p)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private generateProductDetails(producto: ProductoNovedad): string {
    const detalles = [];
    if (producto.cantidad_m2) detalles.push('Cantidad en m²');
    if (producto.cantidad_cajas) detalles.push('Cantidad en cajas');
    if (producto.cantidad_unidades) detalles.push('Cantidad en unidades');
    if (producto.roturas) detalles.push('Roturas');
    if (producto.desportillado) detalles.push('Desportillado');
    if (producto.golpeado) detalles.push('Golpeado');
    if (producto.rayado) detalles.push('Rayado');
    if (producto.incompleto) detalles.push('Incompleto');
    if (producto.loteado) detalles.push('Loteado');
    if (producto.otro) detalles.push('Otro');

    return detalles.length > 0 ? 
      `<p><strong>Problemas detectados:</strong> ${detalles.join(', ')}</p>` : '';
  }

  async findLastRemision(): Promise<Novedad | null> {
    try {
      const novedad = await this.novedadesRepository.findOne({
        where: {},
        order: {
          id: 'DESC'
        },
        relations: ['productos']
      });

      console.log('Última remisión encontrada:', novedad); // Debug
      return novedad;
    } catch (error) {
      console.error('Error al buscar última remisión:', error);
      throw new InternalServerErrorException(
        'Error al obtener la última remisión'
      );
    }
  }
} 
