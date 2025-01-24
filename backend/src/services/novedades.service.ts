import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { INovedadDto, IProductoNovedadDto } from '../dto/producto-novedad.interface';
import { MailerService } from '@nestjs-modules/mailer';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { Usuario } from '../entities/usuario.entity';
import { resolve } from 'path';
import { format } from 'date-fns';
import { NotFoundException } from '@nestjs/common';
import { width } from 'pdfkit/js/page';

interface ImageData {
  name?: string;
  url: string;
}

type AccionRealizada = 'rechazado_devuelto' | 'rechazado_descargado';

@Injectable()
export class NovedadesService {
  constructor(
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>,
    @InjectRepository(ProductoNovedad)
    private productosNovedadRepository: Repository<ProductoNovedad>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private dataSource: DataSource,
    private mailerService: MailerService,
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

  // Función helper para procesar URLs de imágenes
  private processImageUrls(urlsData: Array<{ name: string; url: string; }>): Array<{ name: string; url: string; }> {
    try {
      if (!urlsData) return [];
      return Array.isArray(urlsData) ? urlsData : [urlsData];
    } catch (error) {
      console.error('Error procesando URLs:', error);
      return [];
    }
  }

  private async generarPDF (novedad: Novedad, productos: ProductoNovedad[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Configuración de imágenes
      const IMAGE_CONFIG = {
        producto: {
          fit: [400, 300],
          align: 'center'
        },
        general: {
          fit: [500, 350],
          align: 'center'
        }
      };

        // Título y encabezado
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#016165')
           .text('Mercancía con Problemas en la Recepción', { align: 'center' });
        doc.moveDown();

        // Información General con nuevo diseño
        const infoY = doc.y;
        doc.rect(50, infoY, 500, 150)
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

        // Primera columna
        doc.font('Helvetica-Bold')
           .text('N° DE REMISIÓN:', col1X, currentY)
           .font('Helvetica')
           .text(novedad.remision_factura, col1X + 130, currentY);

        doc.font('Helvetica-Bold')
           .text('FECHA:', col1X, currentY + 25)
           .font('Helvetica')
           .text(new Date(novedad.fecha).toLocaleDateString(), col1X + 130, currentY + 25);

        doc.font('Helvetica-Bold')
           .text('PROVEEDOR:', col1X, currentY + 50)
           .font('Helvetica')
           .text(novedad.proveedor, col1X + 130, currentY + 50);

        // Segunda columna
        doc.font('Helvetica-Bold')
           .text('NIT:', col1X, currentY +75)
           .font('Helvetica')
           .text(novedad.nit, col1X + 130, currentY + 75);

        doc.font('Helvetica-Bold')
           .text('DILIGENCIADO POR:', col1X, currentY + 100)
           .font('Helvetica')
           .text(novedad.trabajador, col1X + 130, currentY + 100);

        doc.font('Helvetica-Bold')
           .text('APROBADO POR:', col1X, currentY + 125)
           .font('Helvetica')
           .text(novedad.aprobado_por || 'No especificado', col1X + 130, currentY + 125);

        doc.moveDown(2);

        // Productos con tabla mejorada
        for (let i = 0; i < productos.length; i++) {
          const producto = productos[i];
          
          // Si no es el primer producto, agregar nueva página
          if (i > 0) {
            doc.addPage();
          }

          const productoY = doc.y;
          
          // Título del producto con línea inferior
          doc.fillColor('#016165')
             .fontSize(16)
             .font('Helvetica-Bold')
             .text(`PRODUCTO ${i + 1}`, 70, productoY);

          doc.moveTo(70, productoY + 25)
             .lineTo(550, productoY + 25)
             .strokeColor('#016165')
             .stroke();
             doc.moveDown(2);

          // Configuración de la tabla
          const startY = doc.y;
          const labelX = 70;
          const valueX = 220;
          const maxWidth = 300;
          let currentY = startY;

          // Función helper para agregar filas
          const addTableRow = (label: string, value: string | string[]) => {
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .fillColor('#333333')
               .text(label, labelX, currentY);
            
            doc.font('Helvetica');
            
            if (Array.isArray(value)) {
              const formattedValue = value.map(v => `• ${v}`).join('\n');
              const textHeight = doc.heightOfString(formattedValue, { width: maxWidth });
              doc.text(formattedValue, valueX, currentY, { width: maxWidth });
              currentY += Math.max(textHeight, 20);
            } else {
              const textHeight = doc.heightOfString(value, { width: maxWidth });
              doc.text(value, valueX, currentY, { width: maxWidth });
              currentY += Math.max(textHeight, 20);
            }
            
            currentY += 10;
          };

          doc.moveDown(2);

          // Detalles del producto
          addTableRow('Referencia:', producto.referencia);

          // Cantidades
          const cantidades = [];
          if (producto.cantidad_m2) cantidades.push(`${producto.cantidad_m2} m²`);
          if (producto.cantidad_cajas) cantidades.push(`${producto.cantidad_cajas} cajas`);
          if (producto.cantidad_unidades) cantidades.push(`${producto.cantidad_unidades} und`);
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
          
          if (problemas.length > 0) {
            addTableRow('Tipo de novedad:', problemas);
          }

          if (producto.descripcion) {
            addTableRow('Descripción:', producto.descripcion);
          }

          addTableRow('Acción realizada:', 
            this.formatearAccion(producto.accion_realizada as AccionRealizada)
          );
          doc.moveDown(1);

          // Imágenes de remisión del producto
          if (producto.foto_remision_urls?.length) {
            doc.addPage(); // Nueva página para las imágenes
            
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text(`Imágenes de Remisión - Ref: ${producto.referencia}`, {
                 underline: true,
                 align: 'center'
               });
            doc.moveDown(2);

            for (const [index, imgData] of producto.foto_remision_urls.entries()) {
              // Calcular posición Y para cada imagen
              const yPos = doc.y;
              
              // Si la imagen no cabe en la página actual, crear nueva página
              if (yPos > 500) {
                doc.addPage();
              }

              doc.image(imgData.url, {
                fit: [400, 300],
                align: 'center',
               
              });
              
              doc.moveDown(2); // Espacio entre imágenes
            }
          }

          // Imágenes de devolución del producto (si aplica)
          if (producto.foto_devolucion_urls?.length && 
              producto.accion_realizada === 'rechazado_devuelto') {
            doc.addPage();
            
            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text(`Imágenes de Devolución - Ref: ${producto.referencia}`, {
                 underline: true,
                 align: 'center'
               });
            doc.moveDown(2);

            for (const [index, imgData] of producto.foto_devolucion_urls.entries()) {
              const yPos = doc.y;
              
              if (yPos > 500) {
                doc.addPage();
              }

              doc.image(imgData.url, {
                fit: [400, 300],
                align: 'center'
              });
              
              doc.moveDown(2);
            }
          }
        }

        // Imágenes generales al final
        if (novedad.remision_proveedor_urls?.length || novedad.foto_estado_urls?.length) {
          doc.addPage();
          
          // Imágenes de remisión del proveedor
          if (novedad.remision_proveedor_urls?.length) {
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .text('Imágenes de Remisión del Proveedor', {
                 underline: true,
                 align: 'center'
               });
            doc.moveDown(2);

            for (const imgData of novedad.remision_proveedor_urls) {
              const yPos = doc.y;
              if (yPos > 500) {
                doc.addPage();
              }

              doc.image(imgData.url, {
                fit: [500, 350],
                align: 'center',
              });
              
              doc.moveDown(3);
            }
          }

          // Imágenes del estado
          if (novedad.foto_estado_urls?.length) {
            if (doc.y > 400) 
              doc.addPage();
            
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .text('Imágenes del Estado', {
                 underline: true,
                 align: 'center'
               });
            doc.moveDown(2);

            for (const imgData of novedad.foto_estado_urls) {
              const yPos = doc.y;
              
              if (yPos > 500) {
                doc.addPage();
              }

              doc.image(imgData.url, {
                fit: [500, 350],
                align: 'center',
              });
              
              doc.moveDown(3);
            }
          }
        }

        // Numeración de páginas
        let pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          
          const footerY = 740;
          
          doc.moveTo(50, footerY - 10)
             .lineTo(550, footerY - 10)
             .strokeColor('#016165')
             .stroke();

          doc.fontSize(10)
             
             .fillColor('#666666')
             .text(
               `Alfa y Omega Enchapes y Acabados - Página ${i + 1} de ${pages.count}`, 50, footerY,
               {align: 'center',
                }
             );
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  } 

  private formatearAccion(accion: AccionRealizada): string {
    const acciones = {
      'rechazado_devuelto': 'Rechazado y Devuelto',
      'rechazado_descargado': 'Rechazado y Descargado'
    };
    return acciones[accion] || accion;
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
      // Primero, obtener los datos del usuario
      const usuario = await this.usuarioRepository.findOne({ 
        where: { id: novedadDto.usuario_id }
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const novedad = new Novedad();
      
      // Asignar el nombre del usuario como trabajador
      novedad.trabajador = usuario.nombre_completo;
      
      // Asignar el resto de los campos
      novedad.remision_proveedor_urls = novedadDto.remision_proveedor_urls || [];
      novedad.remision_factura = novedadDto.remision_factura;
      novedad.fecha = novedadDto.fecha;
      novedad.proveedor = novedadDto.proveedor;
      novedad.nit = novedadDto.nit;
      novedad.aprobado_por = novedadDto.aprobado_por;
      novedad.observaciones = novedadDto.observaciones;
      novedad.foto_estado_urls = novedadDto.foto_estado_urls || [];
      novedad.usuario_id = usuario.id;

      // Obtener el número de remisión
      novedad.numero_remision = await this.getUltimoNumeroRemision();

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);
      const productosGuardados: ProductoNovedad[] = [];

      if (novedadDto.productos?.length > 0) {
        for (const producto of novedadDto.productos) {
          const productoNovedad = new ProductoNovedad();
          productoNovedad.novedad_id = savedNovedad.id;
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
          productoNovedad.foto_remision_urls = producto.foto_remision_urls || [];
          productoNovedad.foto_devolucion_urls = producto.foto_devolucion_urls || [];
          
          const savedProducto = await queryRunner.manager.save(ProductoNovedad, productoNovedad);
          productosGuardados.push(savedProducto);
        }
      }

      // Generar PDF con los productos guardados
      const pdfBuffer = await this.generarPDF(savedNovedad, productosGuardados);

      // Enviar email
      await this.mailerService.sendMail({
        to: novedadDto.correo,
        subject: 'Mercancía con Problemas en la Recepción',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #016165;">Mercancía con Problemas en la Recepción</h2>
            
            <p>Señores ${novedad.proveedor},</p>
            
            <p>Cordial saludo,</p>
            
            <p>Por medio de la presente, nos permitimos informar que se han identificado novedades en la recepción de mercancía correspondiente a la remisión N° ${savedNovedad.remision_factura}.</p>
            
            <p>Adjunto encontrarán:</p>
            <ul>
              <li>Documento PDF con el detalle de las novedades encontradas</li>
              <li>Registro fotográfico de los productos afectados</li>
            </ul>
            
            <p>Agradecemos su atención y quedamos atentos a sus comentarios.</p>
            
            <p>Cordialmente,</p>
            <p><strong>${savedNovedad.trabajador}</strong><br>
            Alfa y Omega Enchapes y Acabados</p>
          </div>
        `,
        attachments: [{
          filename: `novedad_${savedNovedad.remision_factura}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
      });

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

  async generatePreviewPdf(novedadDto: INovedadDto, productoDto: IProductoNovedadDto): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          bufferPages: true
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunks.push.bind(chunks));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Título y encabezado
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#016165')
           .text('Mercancía con Problemas en la Recepción', { align: 'center' });
        doc.moveDown();

        // Información General con nuevo diseño
        const infoY = doc.y;
        doc.rect(50, infoY, 500, 150)
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

        // Primera columna
        doc.font('Helvetica-Bold')
           .text('N° DE REMISIÓN:', col1X, currentY)
           .font('Helvetica')
           .text(novedadDto.remision_factura, col1X + 130, currentY);

        doc.font('Helvetica-Bold')
           .text('FECHA:', col1X, currentY + 25)
           .font('Helvetica')
           .text(new Date(novedadDto.fecha).toLocaleDateString(), col1X + 130, currentY + 25);

        doc.font('Helvetica-Bold')
           .text('PROVEEDOR:', col1X, currentY + 50)
           .font('Helvetica')
           .text(novedadDto.proveedor, col1X + 130, currentY + 50);

        // Segunda columna
        doc.font('Helvetica-Bold')
           .text('NIT:', col1X, currentY +75)
           .font('Helvetica')
           .text(novedadDto.nit, col1X + 130, currentY + 75);

        doc.font('Helvetica-Bold')
           .text('DILIGENCIADO POR:', col1X, currentY + 100)
           .font('Helvetica')
           .text(novedadDto.trabajador, col1X + 130, currentY + 100);

        doc.font('Helvetica-Bold')
           .text('APROBADO POR:', col1X, currentY + 125)
           .font('Helvetica')
           .text(novedadDto.aprobado_por || 'No especificado', col1X + 130, currentY + 125);

        doc.moveDown(2);

        // Productos con tabla mejorada
        // for (let i = 0; i < productoDto.length; i++) {
        //   const producto = productoDto[i];
          
        //   // Si no es el primer producto, agregar nueva página
        //   if (i > 0) {
        //     doc.addPage();
        //   }

        //   const productoY = doc.y;
          
        //   // Título del producto con línea inferior
        //   doc.fillColor('#016165')
        //      .fontSize(16)
        //      .font('Helvetica-Bold')
        //      .text(`PRODUCTO ${i + 1}`, 70, productoY);

        //   doc.moveTo(70, productoY + 25)
        //      .lineTo(550, productoY + 25)
        //      .strokeColor('#016165')
        //      .stroke();
        //      doc.moveDown(2);

        //   // Configuración de la tabla
        //   const startY = doc.y;
        //   const labelX = 70;
        //   const valueX = 220;
        //   const maxWidth = 300;
        //   let currentY = startY;

        //   // Función helper para agregar filas
        //   const addTableRow = (label: string, value: string | string[]) => {
        //     doc.font('Helvetica-Bold')
        //        .fontSize(11)
        //        .fillColor('#333333')
        //        .text(label, labelX, currentY);
            
        //     doc.font('Helvetica');
            
        //     if (Array.isArray(value)) {
        //       const formattedValue = value.map(v => `• ${v}`).join('\n');
        //       const textHeight = doc.heightOfString(formattedValue, { width: maxWidth });
        //       doc.text(formattedValue, valueX, currentY, { width: maxWidth });
        //       currentY += Math.max(textHeight, 20);
        //     } else {
        //       const textHeight = doc.heightOfString(value, { width: maxWidth });
        //       doc.text(value, valueX, currentY, { width: maxWidth });
        //       currentY += Math.max(textHeight, 20);
        //     }
            
        //     currentY += 10;
        //   };

        //   doc.moveDown(2);

        //   // Detalles del producto
        //   addTableRow('Referencia:', producto.referencia);

        //   // Cantidades
        //   const cantidades = [];
        //   if (producto.cantidad_m2) cantidades.push(`${productoDto.cantidad_m2} m²`);
        //   if (producto.cantidad_cajas) cantidades.push(`${productoDto.cantidad_cajas} cajas`);
        //   if (producto.cantidad_unidades) cantidades.push(`${productoDto.cantidad_unidades} und`);
        //   addTableRow('Cantidad de la novedad:', cantidades.join(', ') || 'No especificada');

        //   // Tipos de novedad
        //   const problemas = [];
        //   if (producto.roturas) problemas.push('Roturas');
        //   if (producto.desportillado) problemas.push('Desportillado');
        //   if (producto.golpeado) problemas.push('Golpeado');
        //   if (producto.rayado) problemas.push('Rayado');
        //   if (producto.incompleto) problemas.push('Incompleto');
        //   if (producto.loteado) problemas.push('Loteado');
        //   if (producto.otro) problemas.push('Otro');
          
        //   if (problemas.length > 0) {
        //     addTableRow('Tipo de novedad:', problemas);
        //   }

        //   if (productoDto.descripcion) {
        //     addTableRow('Descripción:', productoDto.descripcion);
        //   }

        //   addTableRow('Acción realizada:', 
        //     this.formatearAccion(productoDto.accion_realizada as AccionRealizada)
        //   );
        //   doc.moveDown(1);

        //   // Imágenes de remisión del producto
        //   if (productoDto.foto_remision_urls?.length) {
        //     doc.addPage(); // Nueva página para las imágenes
            
        //     doc.font('Helvetica-Bold')
        //        .fontSize(12)
        //        .text(`Imágenes de Remisión - Ref: ${productoDto.referencia}`, {
        //          underline: true,
        //          align: 'center'
        //        });
        //     doc.moveDown(2);

        //     for (const [index, imgData] of productoDto.foto_remision_urls.entries()) {
        //       // Calcular posición Y para cada imagen
        //       const yPos = doc.y;
              
        //       // Si la imagen no cabe en la página actual, crear nueva página
        //       if (yPos > 500) {
        //         doc.addPage();
        //       }

        //       doc.image(imgData.url, {
        //         fit: [400, 300],
        //         align: 'center',
               
        //       });
              
        //       doc.moveDown(2); // Espacio entre imágenes
        //     }
        //   }

        //   // Imágenes de devolución del producto (si aplica)
        //   if (productoDto.foto_devolucion_urls?.length && 
        //     productoDto.accion_realizada === 'rechazado_devuelto') {
        //     doc.addPage();
            
        //     doc.font('Helvetica-Bold')
        //        .fontSize(12)
        //        .text(`Imágenes de Devolución - Ref: ${productoDto.referencia}`, {
        //          underline: true,
        //          align: 'center'
        //        });
        //     doc.moveDown(2);

        //     for (const [index, imgData] of productoDto.foto_devolucion_urls.entries()) {
        //       const yPos = doc.y;
              
        //       if (yPos > 500) {
        //         doc.addPage();
        //       }

        //       doc.image(imgData.url, {
        //         fit: [400, 300],
        //         align: 'center'
        //       });
              
        //       doc.moveDown(2);
        //     }
        //   }
        // }

        // // Imágenes generales al final
        // if (novedadDto.remision_proveedor_urls?.length || novedadDto.foto_estado_urls?.length) {
        //   doc.addPage();
          
        //   // Imágenes de remisión del proveedor
        //   if (novedadDto.remision_proveedor_urls?.length) {
        //     doc.font('Helvetica-Bold')
        //        .fontSize(14)
        //        .text('Imágenes de Remisión del Proveedor', {
        //          underline: true,
        //          align: 'center'
        //        });
        //     doc.moveDown(2);

        //     for (const imgData of novedadDto.remision_proveedor_urls) {
        //       const yPos = doc.y;
        //       if (yPos > 500) {
        //         doc.addPage();
        //       }

        //       doc.image(imgData.url, {
        //         fit: [500, 350],
        //         align: 'center',
        //       });
              
        //       doc.moveDown(3);
        //     }
        //   }

        //   // Imágenes del estado
        //   if (novedadDto.foto_estado_urls?.length) {
        //     if (doc.y > 400) 
        //       doc.addPage();
            
        //     doc.font('Helvetica-Bold')
        //        .fontSize(14)
        //        .text('Imágenes del Estado', {
        //          underline: true,
        //          align: 'center'
        //        });
        //     doc.moveDown(2);

        //     for (const imgData of novedadDto.foto_estado_urls) {
        //       const yPos = doc.y;
              
        //       if (yPos > 500) {
        //         doc.addPage();
        //       }

        //       doc.image(imgData.url, {
        //         fit: [500, 350],
        //         align: 'center',
        //       });
              
        //       doc.moveDown(3);
        //     }
        //   }
        // }

        // // Numeración de páginas
        // let pages = doc.bufferedPageRange();
        // for (let i = 0; i < pages.count; i++) {
        //   doc.switchToPage(i);
          
        //   const footerY = 740;
          
        //   doc.moveTo(50, footerY - 10)
        //      .lineTo(550, footerY - 10)
        //      .strokeColor('#016165')
        //      .stroke();

        //   doc.fontSize(10)
             
        //      .fillColor('#666666')
        //      .text(
        //        `Alfa y Omega Enchapes y Acabados - Página ${i + 1} de ${pages.count}`, 50, footerY,
        //        {align: 'center',
        //         }
        //      );
        // }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  } 
  
}



