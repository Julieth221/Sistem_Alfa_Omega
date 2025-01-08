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
          margin: 50
        });

        const fileName = `novedad_${novedad.numero_remision}_${Date.now()}.pdf`;
        const filePath = path.join(process.cwd(), 'uploads', fileName);
        const writeStream = fs.createWriteStream(filePath);

        doc.pipe(writeStream);

        // Encabezado
        doc.image(path.join(process.cwd(), 'src', 'assets', 'images', 'logo2.png'), 50, 20, { width: 100 }) // Cambia la ruta al logo
           .font('Helvetica-Bold')
           .fontSize(24) // Aumentar tamaño del título
           .fillColor('#1976d2')
           .text('Mercancía con Problemas en la Recepción', {
             align: 'right'
           });

        doc.moveDown(1.5);

        // Información General
        doc.font('Helvetica-Bold')
           .fontSize(20) // Tamaño de letra más grande
           .fillColor('#000000') // Color del texto
           .text('Información General');

        doc.moveDown();

        // Tabla de información general
        const infoY = doc.y;
        const startX = 50;
        const colWidth = 200;

        // Cambiar color de la tabla
        doc.fillColor('#e3f2fd') // Color azul claro
           .rect(startX, infoY, colWidth * 2, 50)
           .fill();

        // Dibujar líneas de la tabla de información
        doc.lineWidth(0.5)
           .moveTo(startX, infoY)
           .lineTo(startX + colWidth * 2, infoY)
           .stroke();

        // Información General
        const drawInfoRow = (label: string, value: string, y: number) => {
          doc.font('Helvetica-Bold')
             .fillColor('#000000') // Color menos negro
             .text(label, startX, y)
             .font('Helvetica')
             .fillColor('#666666') // Color normal para el valor
             .text(value, startX + colWidth, y);
        };

        drawInfoRow('N° DE REMISIÓN:', novedad.numero_remision || '', infoY + 10);
        drawInfoRow('FECHA:', new Date(novedad.fecha).toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }), infoY + 30);
        drawInfoRow('DILIGENCIADO POR:', novedad.trabajador, infoY + 50);

        doc.moveDown(4);

        // Productos
        productos.forEach((producto, index) => {
          doc.font('Helvetica-Bold')
             .fontSize(14)
             .text(`PRODUCTO ${index + 1}`, { underline: true });
          
          doc.moveDown();

          // Tabla de producto
          const tableY = doc.y;
          const tableStartX = startX;
          const labelWidth = 150;
          const valueWidth = 300;
          const rowHeight = 25;

          // Función para dibujar fila de la tabla
          const drawTableRow = (label: string, value: string, y: number) => {
            // Dibuja el fondo de la fila
            doc.fillColor('#f5f5f5')
               .rect(tableStartX, y, labelWidth + valueWidth, rowHeight)
               .fill();

            // Dibuja el borde
            doc.lineWidth(0.5)
               .strokeColor('#000000')
               .moveTo(tableStartX, y)
               .lineTo(tableStartX + labelWidth + valueWidth, y)
               .stroke();

            // Escribe el contenido
            doc.fillColor('#000000')
               .font('Helvetica-Bold')
               .text(label, tableStartX + 5, y + 7)
               .font('Helvetica')
               .text(value, tableStartX + labelWidth + 5, y + 7);
          };

          let currentY = tableY;

          // Referencia
          drawTableRow('Referencia:', producto.referencia, currentY);
          currentY += rowHeight;

          // Cantidad
          const cantidades = [];
          if (producto.cantidad_cajas) cantidades.push(`${producto.cantidad_cajas} cajas`);
          if (producto.cantidad_m2) cantidades.push(`${producto.cantidad_m2} m²`);
          if (producto.cantidad_unidades) cantidades.push(`${producto.cantidad_unidades} unidades`);
          drawTableRow('Cantidad:', cantidades.join(', '), currentY);
          currentY += rowHeight;

          // Problemas encontrados
          const problemas = [];
          if (producto.roturas) problemas.push('Roturas');
          if (producto.desportillado) problemas.push('Desportillado');
          if (producto.golpeado) problemas.push('Golpeado');
          if (producto.rayado) problemas.push('Rayado');
          if (producto.incompleto) problemas.push('Incompleto');
          if (producto.loteado) problemas.push('Loteado');
          if (producto.otro) problemas.push('Otro');
          drawTableRow('Tipo de novedad:', problemas.join(', '), currentY);
          currentY += rowHeight;

          // Descripción
          drawTableRow('Descripción:', producto.descripcion || '', currentY);
          currentY += rowHeight;

          // Acción realizada
          drawTableRow('Acción realizada:', producto.accion_realizada.toUpperCase().replace(/_/g, ' '), currentY);
          currentY += rowHeight;

          // Imagen
          if (producto.foto_remision_url && producto.foto_remision_url !== '/uploads/sin_imagen.jpg') {
            try {
              const imagePath = path.join(process.cwd(), producto.foto_remision_url);
              if (fs.existsSync(imagePath)) {
                doc.moveDown(2);
                doc.image(imagePath, {
                  fit: [300, 300],
                  align: 'center'
                });
              }
            } catch (error) {
              console.error('Error al cargar imagen:', error);
            }
          }

          doc.moveDown(3);
        });

        // Pie de página
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

  private async guardarImagen(base64Image: string, nombreArchivo: string): Promise<string> {
    try {
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, nombreArchivo);
      
      // Corregir el manejo de base64
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
        usuario_id: novedadDto.usuario_id
      });

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      // Crear productos de la novedad
      if (novedadDto.productos?.length > 0) {
        const productosNovedad = await Promise.all(novedadDto.productos.map(async producto => {
          const foto_remision_url = producto.foto_remision 
            ? `/uploads/remision_${savedNovedad.id}_${Date.now()}.jpg`
            : '/uploads/sin_imagen.jpg';

          return this.productosNovedadRepository.create({
            ...producto,
            novedad_id: savedNovedad.id,
            correo: novedadDto.correo,
            foto_remision_url
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
        'Error al obtener la última remisión.'
      );
    }
  }
}
 
