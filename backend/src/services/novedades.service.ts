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
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const fileName = `novedad_${novedad.numero_remision}_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Título con estilo
        doc.font('Helvetica-Bold')
           .fontSize(22)
           .fillColor('#1976d2')
           .text('Mercancía con Problemas en la Recepción', {
             align: 'center'
           });

        doc.moveDown(1.5);

        // Información General con mejor formato
        doc.font('Helvetica-Bold')
           .fontSize(16)
           .fillColor('#333333')
           .text('Información General');

        doc.moveDown(0.5);

        // Cuadro de información con mejor espaciado
        const infoY = doc.y;
        doc.font('Helvetica-Bold')
           .fontSize(12)
           .text('N° DE REMISIÓN:', 50, infoY)
           .font('Helvetica')
           .text(novedad.numero_remision, 180, infoY);

        doc.font('Helvetica-Bold')
           .text('FECHA:', 50, infoY + 25)
           .font('Helvetica')
           .text(new Date(novedad.fecha).toLocaleDateString('es-CO', {
             year: 'numeric',
             month: 'long',
             day: 'numeric'
           }), 180, infoY + 25);

        doc.font('Helvetica-Bold')
           .text('DILIGENCIADO POR:', 50, infoY + 50)
           .font('Helvetica')
           .text(novedad.trabajador, 180, infoY + 50);

        doc.moveDown(3);

        // Productos con mejor formato
        productos.forEach((producto, index) => {
          // Título del producto con fondo
          doc.fillColor('#1976d2')
             .opacity(0.1)
             .rect(50, doc.y, 495, 30)
             .fill();

          doc.opacity(1)
             .fillColor('#1976d2')
             .font('Helvetica-Bold')
             .fontSize(14)
             .text(`PRODUCTO ${index + 1}`, 60, doc.y - 25);

          doc.moveDown(1);

          // Detalles del producto
          const startY = doc.y;
          doc.fontSize(12)
             .fillColor('#333333');

          // Referencia
          doc.font('Helvetica-Bold')
             .text('Referencia:', 50)
             .font('Helvetica')
             .text(producto.referencia, 180);

          // Cantidades formateadas correctamente
          let cantidadTexto = '';
          if (producto.cantidad_cajas) cantidadTexto += `${producto.cantidad_cajas} cajas `;
          if (producto.cantidad_m2) cantidadTexto += `${producto.cantidad_m2} m² `;
          if (producto.cantidad_unidades) cantidadTexto += `${producto.cantidad_unidades} unidades`;

          doc.font('Helvetica-Bold')
             .text('Cantidad:', 50)
             .font('Helvetica')
             .text(cantidadTexto.trim() || 'No especificada', 180);

          // Problemas encontrados
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold')
             .text('Problemas encontrados:', 50);
          
          if(producto.desportillado) doc.font('Helvetica').text('• Desportillado', 70);
          if(producto.golpeado) doc.font('Helvetica').text('• Golpeado', 70);
          if(producto.rayado) doc.font('Helvetica').text('• Rayado', 70);
          if(producto.incompleto) doc.font('Helvetica').text('• Incompleto', 70);
          if(producto.loteado) doc.font('Helvetica').text('• Loteado', 70);
          if(producto.otro) doc.font('Helvetica').text('• Otro', 70);

          doc.moveDown(0.5);

          // Descripción y acción
          doc.font('Helvetica-Bold')
             .text('Descripción:', 50)
             .font('Helvetica')
             .text(producto.descripcion || 'No especificada', 180);

          doc.font('Helvetica-Bold')
             .text('Acción realizada:', 50)
             .font('Helvetica')
             .text(producto.accion_realizada.replace(/_/g, ' ').toUpperCase(), 180);

          // Imagen del producto
          if (producto.foto_remision_url && producto.foto_remision_url !== '/uploads/sin_imagen.jpg') {
            try {
              const imagePath = path.join(process.cwd(), producto.foto_remision_url);
              if (fs.existsSync(imagePath)) {
                doc.moveDown();
                doc.image(imagePath, {
                  width: 200,
                  align: 'center'
                });
              }
            } catch (error) {
              console.error('Error al agregar imagen:', error);
            }
          }

          doc.moveDown(2);
        });

        // Pie de página con línea decorativa
        doc.moveTo(50, doc.page.height - 50)
           .lineTo(545, doc.page.height - 50)
           .stroke();

        doc.font('Helvetica')
           .fontSize(10)
           .fillColor('#666666')
           .text('Alfa y Omega Acabados', {
             align: 'center'
           });

        doc.end();

        writeStream.on('finish', () => resolve(filePath));

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
