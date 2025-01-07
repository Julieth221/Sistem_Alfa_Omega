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
import * as PDFDocument from 'pdfkit';

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
      // Obtener la última novedad ordenada por ID
      const ultimaNovedad = await this.novedadesRepository
        .createQueryBuilder('novedad')
        .orderBy('novedad.id', 'DESC')
        .getOne();

      if (!ultimaNovedad) {
        return 'FNAO0001';
      }

      const siguienteId = ultimaNovedad.id + 1;
      return `FNAO${siguienteId.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error al obtener último número de remisión:', error);
      throw error;
    }
  }

  private async generarPDF(novedad: Novedad, productos: ProductoNovedad[]): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const fileName = `novedad_${novedad.numero_remision}_${Date.now()}.pdf`;
        const filePath = `./uploads/${fileName}`;
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Diseño del PDF
        doc.fontSize(20).text('Mercancía con Problemas en la Recepción', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`N° DE REMISIÓN: ${novedad.numero_remision}`);
        doc.text(`FECHA: ${new Date(novedad.fecha).toLocaleDateString()}`);
        doc.text(`DILIGENCIADO POR: ${novedad.trabajador}`);
        doc.moveDown();

        // Agregar productos
        productos.forEach(producto => {
          doc.text('PRODUCTO:');
          doc.text(`Referencia: ${producto.referencia}`);
          doc.text('Problemas encontrados:');
          if (producto.desportillado) doc.text('- Desportillado');
          if (producto.golpeado) doc.text('- Golpeado');
          if (producto.rayado) doc.text('- Rayado');
          if (producto.incompleto) doc.text('- Incompleto');
          if (producto.loteado) doc.text('- Loteado');
          if (producto.otro) doc.text('- Otro');
          doc.text(`Descripción: ${producto.descripcion}`);
          doc.text(`Acción realizada: ${producto.accion_realizada}`);
          doc.moveDown();
        });

        doc.end();

        writeStream.on('finish', () => {
          resolve(filePath);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  async create(novedadDto: INovedadDto): Promise<Novedad> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Crear la novedad
      const novedad = this.novedadesRepository.create({
        fecha: novedadDto.fecha,
        trabajador: novedadDto.diligenciado_por,
        usuario_id: novedadDto.usuario_id
      });

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      // Crear productos de la novedad
      if (novedadDto.productos?.length > 0) {
        const productosNovedad = await Promise.all(novedadDto.productos.map(async producto => {
          // Generar una URL por defecto si no hay foto
          const foto_remision_url = producto.foto_remision 
            ? `/uploads/remision_${savedNovedad.id}_${Date.now()}.jpg`
            : '/uploads/sin_imagen.jpg';

          return this.productosNovedadRepository.create({
            ...producto,
            novedad_id: savedNovedad.id,
            correo: novedadDto.correo,
            foto_remision_url // Agregar la URL de la foto
          });
        }));

        const productosGuardados = await queryRunner.manager.save(ProductoNovedad, productosNovedad);

        // Generar PDF
        const pdfPath = await this.generarPDF(savedNovedad, productosGuardados);

        // Enviar correo
        await this.mailerService.sendMail({
          to: novedadDto.correo,
          subject: 'Mercancía con Problemas en la Recepción',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #1976d2;">Mercancía con Problemas en la Recepción</h2>
              
              <p>Señor@s,</p>
              
              <p>Cordial saludo,</p>
              
              <p>Por medio de la presente, nos permitimos informar que se han identificado novedades en la recepción de mercancía correspondiente a la remisión N° ${savedNovedad.numero_remision}.</p>
              
              <p>Adjunto encontrarán:</p>
              <ul>
                <li>Documento PDF con el detalle de las novedades encontradas</li>
                <li>Registro fotográfico de los productos afectados</li>
              </ul>
              
              <p>Agradecemos su atención y quedamos atentos a sus comentarios.</p>
              
              <p>Cordialmente,</p>
              <p><strong>${savedNovedad.trabajador}</strong><br>
              Alfa y Omega Acabados</p>
            </div>
          `,
          attachments: [
            {
              filename: `novedad_${savedNovedad.numero_remision}.pdf`,
              path: pdfPath
            }
          ]
        });

        // Limpiar el archivo PDF temporal
        fs.unlinkSync(pdfPath);
      }

      await queryRunner.commitTransaction();
      return savedNovedad;

    } catch (error) {
      console.error('Error en create:', error);
      await queryRunner.rollbackTransaction();
      throw error;
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
