import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { INovedadDto } from '../dto/producto-novedad.interface';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';
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
          margin: 50,
          bufferPages: true
        });

        const fileName = `novedad_${novedad.numero_remision}_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        const addHeader = () => {
          doc.font('Helvetica-Bold')
             .fontSize(20)
             .fillColor('#016165')
             .text('Mercancía con Problemas en la Recepción', {
               align: 'center'
             });
          doc.moveDown(1);
        };
        // Llamamos a addHeader solo una vez al principio
        addHeader();
        
        const infoY = doc.y;
        doc.rect(50, infoY, 500, 120)
           .fillColor('#f8f9fa')
           .fill()
           .strokeColor('#016165')
           .stroke();

        doc.fontSize(16)
           .fillColor('#016165')
           .text('Información General', 70, infoY + 15);

        doc.fontSize(12)
           .fillColor('#333333');

        const col1X = 70;
        const col2X = 300;
        let currentY = infoY + 45;

        doc.font('Helvetica-Bold')
           .text('N° DE REMISIÓN:', col1X, currentY)
           .font('Helvetica')
           .text(novedad.numero_remision, col1X + 130, currentY);

        doc.font('Helvetica-Bold')
           .text('FECHA:', col1X, currentY + 25)
           .font('Helvetica')
           .text(new Date(novedad.fecha).toLocaleDateString('es-CO', {
             year: 'numeric',
             month: 'long',
             day: 'numeric'
           }), col1X + 130, currentY + 25);

        doc.font('Helvetica-Bold')
           .text('DILIGENCIADO POR:', col1X, currentY + 50)
           .font('Helvetica')
           .text(novedad.trabajador, col1X + 130, currentY + 50);

        doc.moveDown(4);

        // Productos
        productos.forEach((producto, index) => {
          // Nueva página para cada producto
          if (index > 0) {
            doc.addPage();
          }

          const productoY = doc.y;
          
          // Título del producto con línea inferior
          doc.fillColor('#016165')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text(`PRODUCTO ${index + 1}`, 70, productoY);

          doc.moveTo(70, productoY + 25)
             .lineTo(550, productoY + 25)
             .strokeColor('#016165')
             .stroke();

          // Configuración de la tabla
          const startY = productoY + 40;
          const labelX = 70;    // Etiquetas alineadas a la izquierda
          const valueX = 220;   // Valores alineados a la izquierda con padding
          const maxWidth = 300; // Ancho máximo para valores
          let currentY = startY;

          // Función helper para agregar filas
          const addTableRow = (label: string, value: string | string[]) => {
            // Etiqueta
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#333333')
               .text(label, labelX, currentY);
            
            // Valor (puede ser string o array)
            doc.font('Helvetica');
            
            if (Array.isArray(value)) {
              // Para arrays (como tipos de novedad), usar viñetas
              const formattedValue = value.map(v => `• ${v}`).join('\n');
              const textHeight = doc.heightOfString(formattedValue, { width: maxWidth });
              doc.text(formattedValue, valueX, currentY, { width: maxWidth });
              currentY += Math.max(textHeight, 20);
            } else {
              // Para strings simples
              const textHeight = doc.heightOfString(value, { width: maxWidth });
              doc.text(value, valueX, currentY, { width: maxWidth });
              currentY += Math.max(textHeight, 20);
            }
            
            currentY += 10; // Espacio entre filas
          };

          // Referencia
          addTableRow('Referencia:', producto.referencia);

          // Cantidades
          let cantidades = [];
          if (producto.cantidad_m2) cantidades.push(`m²`);
          if (producto.cantidad_cajas) cantidades.push(`cajas`);
          if (producto.cantidad_unidades) cantidades.push(`und`);
          addTableRow('Cantidad de la novedad:', cantidades.join(', ') || 'No especificada');

          // Tipos de novedad
          const problemas = [];
          if (producto.roturas) problemas.push('Roturas');
          if (producto.desportillado) problemas.push('Desportillado');
          if (producto.golpeado) problemas.push('Golpeado');
          if (producto.rayado) problemas.push('Rayado');
          if (producto.incompleto) problemas.push('Incompleto');
          if (producto.loteado) problemas.push('Loteado');
          if (producto.otro) problemas.push('Otro');
          
          addTableRow('Tipo de novedad:', problemas);

          // Descripción
          addTableRow('Descripción:', producto.descripcion || 'No especificada');

          // Acción realizada
          addTableRow('Acción realizada:', this.formatearAccion(producto.accion_realizada));

          // Línea final de la tabla
          doc.moveTo(70, currentY)
             .lineTo(550, currentY)
             .strokeColor('#016165')
             .stroke();

          doc.moveDown(2);

          // Imagen
          if (producto.foto_remision_url) {
            // Verificar espacio para la imagen
            if (doc.y > 500) {
              doc.addPage();
              addHeader();
            }

            const imageWidth = 400;
            const imageHeight = 300;
            const pageWidth = doc.page.width;
            const x = (pageWidth - imageWidth) / 2;

            doc.image(producto.foto_remision_url, x, doc.y, {
              fit: [imageWidth, imageHeight],
              align: 'center'
            });

            doc.moveDown(2);
          }
        });

        let pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          // Ajustar la posición vertical del pie de página
          const footerY = 780; // Cambia este valor para moverlo más abajo
          
          doc.moveTo(50, footerY - 10)
             .lineTo(550, footerY - 10)
             .strokeColor('#016165')
             .stroke();

          doc.fontSize(10)
             .fillColor('#666666')
             .text('Alfa y Omega Enchapes y Acabados', 50, footerY, {
               align: 'center',
               width: 500
             })
             .text(`Página ${i + 1}`, 500, footerY, {
               align: 'right'
             });
        }

        doc.end();

        writeStream.on('finish', () => resolve(filePath));

      } catch (error) {
        reject(error);
      }
    });
  }

  private formatearAccion(accion: string): string {
    return accion
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async guardarImagen(base64Image: string, nombreArchivo: string): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, nombreArchivo);
      
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      await fs.promises.writeFile(filePath, imageBuffer);
      console.log('Imagen guardada en:', filePath);
      
      return `/uploads/${nombreArchivo}`;
    } catch (error) {
      console.error('Error al guardar imagen:', error);
      throw error;
    }
  }

  async create(novedadDto: INovedadDto): Promise<Novedad> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const novedad = this.novedadesRepository.create({
        fecha: novedadDto.fecha,
        trabajador: novedadDto.diligenciado_por,
        usuario_id: novedadDto.usuario_id,
        numero_remision: await this.getUltimoNumeroRemision()
      });

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      if (novedadDto.productos?.length > 0) {
        const productosGuardados = [];
        
        for (const producto of novedadDto.productos) {
          const productoNovedad = new ProductoNovedad();
          productoNovedad.novedad = savedNovedad;
          productoNovedad.referencia = producto.referencia;
          productoNovedad.cantidad_m2 = producto.cantidad_m2;
          productoNovedad.cantidad_cajas = producto.cantidad_cajas;
          productoNovedad.cantidad_unidades = producto.cantidad_unidades;
          productoNovedad.roturas = producto.roturas;
          productoNovedad.desportillado = producto.desportillado;
          productoNovedad.golpeado = producto.golpeado;
          productoNovedad.rayado = producto.rayado;
          productoNovedad.incompleto = producto.incompleto;
          productoNovedad.loteado = producto.loteado;
          productoNovedad.otro = producto.otro;
          productoNovedad.descripcion = producto.descripcion;
          productoNovedad.accion_realizada = producto.accion_realizada;
          productoNovedad.correo = novedadDto.correo;
          productoNovedad.foto_remision_url = producto.foto_remision || '';

          const savedProducto = await queryRunner.manager.save(ProductoNovedad, productoNovedad);
          productosGuardados.push(savedProducto);
        }

        const pdfPath = await this.generarPDF(savedNovedad, productosGuardados);

        await this.mailerService.sendMail({
          to: novedadDto.correo,
          subject: 'Mercancía con Problemas en la Recepción',
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2 style="color: #016165;">Mercancía con Problemas en la Recepción</h2>
              
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


 
  async findLastRemision(): Promise<Novedad | null> {
    try {
      const novedad = await this.novedadesRepository.findOne({
        where: {},
        order: {
          id: 'DESC'
        },
        relations: ['productos']
      });

      console.log('Última remisión encontrada:', novedad);
      return novedad;
    } catch (error) {
      console.error('Error al buscar última remisión:', error);
      throw new InternalServerErrorException(
        'Error al obtener la última remisión.'
      );
    }
  }
}
 
