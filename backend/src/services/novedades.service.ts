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
import { Usuario } from '../entities/usuario.entity';

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

  private async generarPDF(novedad: Novedad, productos: ProductoNovedad[], usuario: Usuario): Promise<string> {
    return new Promise(async (resolve, reject) => {
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
           .text('N° DE REMISIÓN Y/O FACTURA:', col1X, currentY)
           .font('Helvetica')
           .text(novedad.remision_factura, col1X + 130, currentY);

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

        doc.font('Helvetica-Bold')
           .text('APROBADO POR:', col1X, currentY + 75)
           .font('Helvetica')
           .text(novedad.aprobado_por, col1X + 130, currentY + 75);

        doc.moveDown(3);

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
          if (producto.foto_remision_urls.length > 0) {
            doc.addPage();
            doc.fontSize(16)
               .text('Imágenes del Producto', { align: 'center' });
            
            const imagesPerRow = Math.min(producto.foto_remision_urls.length, 2);
            const imageWidth = 250;
            const imageHeight = 200;
            const margin = 50;
            
            producto.foto_remision_urls.forEach((url, imgIndex) => {
              const row = Math.floor(imgIndex / 2);
              const col = imgIndex % 2;
              const x = margin + (col * (imageWidth + margin));
              const y = 100 + (row * (imageHeight + margin));
              
              doc.image(url, x, y, {
                fit: [imageWidth, imageHeight]
              });
            });
          }

          // Mostrar imágenes de devolución si existen
          if (producto.foto_devolucion_urls?.length > 0) {
            // Similar al código anterior para fotos de remisión
          }
        });

        // Después de todos los productos, agregar la imagen de remisión del proveedor
        if (novedad.remision_proveedor_urls.length > 0) {
          doc.addPage();
          doc.fontSize(14).text('Imágenes de Remisión del Proveedor', { align: 'center' });
          
          const imagesPerRow = Math.min(novedad.remision_proveedor_urls.length, 2);
          for (let i = 0; i < novedad.remision_proveedor_urls.length; i++) {
            const x = 50 + (i % 2) * 250;
            const y = 100 + Math.floor(i / 2) * 300;
            doc.image(novedad.remision_proveedor_urls[i], x, y, {
              fit: [200, 200],
              align: 'center'
            });
          }
        }

        // Agregar firma digital automáticamente
        if (usuario.firma_digital) {
          doc.image(usuario.firma_digital.firma_url, {
            fit: [200, 100],
            align: 'center'
          });
          doc.moveDown();
          doc.text(usuario.nombre_completo, {
            align: 'center'
          });
        }

        let pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);

          // Ajustar la posición vertical del pie de página
          const footerY = 760; // Cambia este valor para moverlo más abajo
          
          doc.moveTo(50, footerY - 10)
             .lineTo(550, footerY - 10)
             .strokeColor('#016165')
             .stroke();

          doc.fontSize(10)
             .fillColor('#666666')
            //  .text('Alfa y Omega Enchapes y Acabados', 50, footerY, {
            //    align: 'center',
            //    width: 500
            //  })
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
      const usuario = await this.usuarioRepository.findOne({
        where: { id: novedadDto.usuario_id },
        relations: ['firma_digital']
      });

      if (!usuario) {
        throw new Error('Usuario no encontrado');
      }

      // Crear la novedad
      const novedad = new Novedad();
      novedad.numero_remision = await this.getUltimoNumeroRemision();
      novedad.fecha = novedadDto.fecha;
      novedad.trabajador = usuario.nombre_completo;
      novedad.usuario_id = novedadDto.usuario_id;
      novedad.remision_proveedor_urls  = novedadDto.remision_proveedor_urls || [];
      novedad.proveedor = novedadDto.proveedor;
      novedad.remision_factura = novedadDto.remision_factura;
      novedad.nit = novedadDto.nit;
      novedad.aprobado_por = novedadDto.aprobado_por;
      novedad.observaciones = novedadDto.observaciones;
      novedad.foto_estado_urls = novedadDto.foto_estado_urls || [];

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      if (novedadDto.productos?.length > 0) {
        const productosGuardados: ProductoNovedad[] = [];
        
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

        const pdfPath = await this.generarPDF(savedNovedad, productosGuardados, usuario);

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
            path: pdfPath
          }]
        });
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
 
