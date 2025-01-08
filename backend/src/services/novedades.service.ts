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
           .text('DILIGENCIADO POR:', col1X, currentY)
           .font('Helvetica')
           .text(novedad.trabajador, col1X + 130, currentY + 50);

        doc.moveDown(5);

        productos.forEach((producto, index) => {
          if (doc.y > 650) {
            doc.addPage();
            addHeader();
          }

          const productoY = doc.y;
          doc.rect(50, productoY, 500, 200)
             .fillColor('#ffffff')
             .fill()
             .strokeColor('#016165')
             .stroke();

          doc.fillColor('#016165')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text(`PRODUCTO ${index + 1}`, 70, productoY + 15);

          let rowY = productoY + 45;
          const colWidth = 240;
          
          const addRow = (label: string, value: string, indent = false) => {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#333333')
               .text(label, indent ? 90 : 70, rowY);
            
            doc.font('Helvetica')
               .text(value, indent ? 200 : 180, rowY);
            
            rowY += 20;
          };

          addRow('Referencia:', producto.referencia);

          if (producto.cantidad_m2 || producto.cantidad_cajas || producto.cantidad_unidades) {
            addRow('Cantidad de la novedad:', '');
            if (producto.cantidad_m2) addRow('M2:', producto.cantidad_m2.toString(), true);
            if (producto.cantidad_cajas) addRow('Cajas:', producto.cantidad_cajas.toString(), true);
            if (producto.cantidad_unidades) addRow('Unidades:', producto.cantidad_unidades.toString(), true);
          }

          const problemas = [];
          if (producto.roturas) problemas.push('Roturas');
          if (producto.desportillado) problemas.push('Desportillado');
          if (producto.golpeado) problemas.push('Golpeado');
          if (producto.rayado) problemas.push('Rayado');
          if (producto.incompleto) problemas.push('Incompleto');
          if (producto.loteado) problemas.push('Loteado');
          if (producto.otro) problemas.push('Otro');

          if (problemas.length > 0) {
            addRow('Tipo de novedad:', problemas.join(', '));
          }

          if (producto.descripcion) {
            addRow('Descripción:', producto.descripcion);
          }
          
          addRow('Acción realizada:', this.formatearAccion(producto.accion_realizada));

          if (producto.foto_remision_url) {
            if (doc.y > 600) {
              doc.addPage();
              addHeader();
            }

            doc.image(producto.foto_remision_url, {
              fit: [400, 300],
              align: 'center'
            });
          }

          doc.moveDown(2);
        });

        let pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          doc.moveTo(50, 750)
             .lineTo(550, 750)
             .strokeColor('#016165')
             .stroke();

          doc.fontSize(10)
             .fillColor('#666666')
             .text('Alfa y Omega Acabados', 50, 760, {
               align: 'center',
               width: 500
             })
             .text(`Página ${i + 1} de ${pages.count}`, 500, 760, {
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
 
