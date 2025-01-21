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
import { resolve } from 'path';
import { format } from 'date-fns';
import { NotFoundException } from '@nestjs/common';

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

  private async generarPDF(novedad: Novedad, productos: ProductoNovedad[], usuario: Usuario): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        const chunks: Buffer[] = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // Título
        doc.font('Helvetica-Bold')
           .fontSize(20)
           .fillColor('#016165')
           .text('Mercancía con Problemas en la Recepción', {
             align: 'center'
           });
        doc.moveDown();

        // Información básica
        doc.fontSize(12)
           .fillColor('#000000')
           .text(`N° DE REMISIÓN: ${novedad.remision_factura}`)
           .text(`FECHA: ${format(new Date(novedad.fecha), 'dd/MM/yyyy')}`)
           .text(`PROVEEDOR: ${novedad.proveedor}`)
           .text(`NIT: ${novedad.nit}`);
        doc.moveDown();

        // Productos
        productos.forEach(async (producto, index) => {
          doc.fontSize(14)
             .text(`Producto ${index + 1}`, { underline: true });
          
          doc.fontSize(12)
             .text(`Referencia: ${producto.referencia}`);

          // Cantidades
          const cantidades = [];
          if (producto.cantidad_m2) cantidades.push('M2');
          if (producto.cantidad_cajas) cantidades.push('CAJAS');
          if (producto.cantidad_unidades) cantidades.push('UNIDADES');
          if (cantidades.length > 0) {
            doc.text(`Cantidad de la novedad: ${cantidades.join(', ')}`);
          }

          // Tipos de novedad
          const novedades = [];
          if (producto.roturas) novedades.push('Roturas');
          if (producto.desportillado) novedades.push('Desportillado');
          if (producto.golpeado) novedades.push('Golpeado');
          if (producto.rayado) novedades.push('Rayado');
          if (producto.incompleto) novedades.push('Incompleto');
          if (producto.loteado) novedades.push('Loteado');
          if (producto.otro) novedades.push('Otro');
          if (novedades.length > 0) {
            doc.text(`Tipo de novedad: ${novedades.join(', ')}`);
          }

          // Mostrar imágenes de devolución si existen
          if (producto.foto_devolucion_urls?.length > 0) {
            // Similar al código anterior para fotos de remisión
          }
          if (producto.accion_realizada) {
            doc.text(`Acción realizada: ${this.formatearAccion(producto.accion_realizada as 'rechazado_devuelto' | 'rechazado_descargado')}`);
          }

          // Manejo de imágenes
          if (producto.foto_remision_urls) {
            try {
              const urls = Array.isArray(producto.foto_remision_urls) 
                ? producto.foto_remision_urls 
                : JSON.parse(producto.foto_remision_urls);

              for (const url of urls) {
                if (typeof url === 'string') {
                  if (url.startsWith('data:image')) {
                    // Imagen en base64
                    const base64Data = url.split(',')[1];
                    const imageBuffer = Buffer.from(base64Data, 'base64');
                    doc.image(imageBuffer, {
                      fit: [200, 200],
                      align: 'center'
                    });
                  } else {
                    // URL o ruta de archivo
                    doc.image(url, {
                      fit: [200, 200],
                      align: 'center'
                    });
                  }
                  doc.moveDown();
                }
              }
            } catch (imgError) {
              console.error('Error al procesar imágenes:', imgError);
            }
          }

          doc.moveDown(2);
        });

        // Firma
        doc.moveDown();
        doc.text(`Diligenciado por: ${usuario.nombre_completo}`);
        
        if (usuario.firma_digital?.firma_url) {
          try {
            const firmaUrl = usuario.firma_digital.firma_url;
            if (firmaUrl.startsWith('data:image')) {
              const base64Data = firmaUrl.split(',')[1];
              const imageBuffer = Buffer.from(base64Data, 'base64');
              doc.image(imageBuffer, {
                fit: [150, 100],
                align: 'center'
              });
            } else {
              doc.image(firmaUrl, {
                fit: [150, 100],
                align: 'center'
              });
            }
          } catch (firmaError) {
            console.error('Error al procesar firma:', firmaError);
          }
        }

        doc.end();
      } catch (error) {
        console.error('Error al generar PDF:', error);
        reject(error);
      }
    });
  }

  private formatearAccion(accion: 'rechazado_devuelto' | 'rechazado_descargado'): string {
    const acciones: Record<string, string> = {
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
      const usuario = await this.usuarioRepository.findOne({
        where: { id: novedadDto.usuario_id },
        relations: ['firma_digital']
      });

      if (!usuario) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Crear la novedad
      const novedad = new Novedad();
      novedad.numero_remision = await this.getUltimoNumeroRemision();
      novedad.fecha = novedadDto.fecha;
      novedad.trabajador = usuario.nombre_completo;
      novedad.usuario_id = novedadDto.usuario_id;
      novedad.remision_proveedor_urls = novedadDto.remision_proveedor_urls || [];
      novedad.proveedor = novedadDto.proveedor;
      novedad.remision_factura = novedadDto.remision_factura;
      novedad.nit = novedadDto.nit;
      novedad.aprobado_por = novedadDto.aprobado_por;
      novedad.observaciones = novedadDto.observaciones;
      novedad.foto_estado_urls = novedadDto.foto_estado_urls || [];

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

        // Generar PDF
        const pdfBuffer = await this.generarPDF(savedNovedad, productosGuardados, usuario);

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

  async generatePreviewPdf(novedadDto: INovedadDto): Promise<Buffer> {
    try {
      console.log('Iniciando generación de preview PDF');
      
      const usuario = await this.usuarioRepository.findOne({
        where: { id: novedadDto.usuario_id },
        relations: ['firma_digital']
      });

      if (!usuario) {
        throw new BadRequestException('Usuario no encontrado');
      }

      // Crear novedad temporal con TODOS los datos del formulario
      const novedad = new Novedad();
      novedad.numero_remision = novedadDto.remision_factura;
      novedad.fecha = novedadDto.fecha;
      novedad.trabajador = usuario.nombre_completo; // Nombre del usuario logueado
      novedad.remision_factura = novedadDto.remision_factura;
      novedad.proveedor = novedadDto.proveedor;
      novedad.nit = novedadDto.nit;
      novedad.aprobado_por = novedadDto.aprobado_por;
      novedad.observaciones = novedadDto.observaciones;
      novedad.remision_proveedor_urls = novedadDto.remision_proveedor_urls || [];
      novedad.foto_estado_urls = novedadDto.foto_estado_urls || [];

      // Crear productos con todos los detalles
      const productos: ProductoNovedad[] = (novedadDto.productos || []).map(producto => {
        const productoNovedad = new ProductoNovedad();
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
        productoNovedad.foto_remision_urls = producto.foto_remision_urls || [];
        productoNovedad.foto_devolucion_urls = producto.foto_devolucion_urls || [];
        return productoNovedad;
      });

      return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            bufferPages: true
          });

          const chunks: Buffer[] = [];
          doc.on('data', chunk => chunks.push(chunk));
          doc.on('end', () => resolve(Buffer.concat(chunks)));

          // Usar el mismo método que genera el PDF final
          this.generarContenidoPDF(doc, novedad, productos, usuario);

          doc.end();
        } catch (error) {
          console.error('Error generando preview:', error);
          reject(error);
        }
      });

    } catch (error) {
      console.error('Error en generatePreviewPdf:', error);
      throw new InternalServerErrorException('Error al generar la vista previa del PDF');
    }
  }

  private generarContenidoPDF(
    doc: PDFKit.PDFDocument, 
    novedad: Novedad, 
    productos: ProductoNovedad[], 
    usuario: Usuario
  ): void {
    try {
      // Título y encabezado
      doc.font('Helvetica-Bold')
         .fontSize(20)
         .fillColor('#016165')
         .text('Mercancía con Problemas en la Recepción', {
           align: 'center'
         });
      doc.moveDown(1);

      // Información básica
      doc.fontSize(12)
         .fillColor('#000000')
         .text(`N° DE REMISIÓN: ${novedad.remision_factura || ''}`)
         .text(`FECHA: ${new Date(novedad.fecha).toLocaleDateString()}`)
         .text(`PROVEEDOR: ${novedad.proveedor || ''}`)
         .text(`NIT: ${novedad.nit || ''}`);
      doc.moveDown();

      // Productos
      productos.forEach((producto, index) => {
        doc.fontSize(14)
           .text(`Producto ${index + 1}`, { underline: true });
        
        doc.fontSize(12)
           .text(`Referencia: ${producto.referencia}`);

        // Cantidades
        let cantidades = [];
        if (producto.cantidad_m2) cantidades.push('M2');
        if (producto.cantidad_cajas) cantidades.push('Cajas');
        if (producto.cantidad_unidades) cantidades.push('Unidades');
        if (cantidades.length > 0) {
          doc.text(`Cantidad de la novedad: ${cantidades.join(', ')}`);
        }

        // Tipos de novedad
        let novedades = [];
        if (producto.roturas) novedades.push('Roturas');
        if (producto.desportillado) novedades.push('Desportillado');
        if (producto.golpeado) novedades.push('Golpeado');
        if (producto.rayado) novedades.push('Rayado');
        if (producto.incompleto) novedades.push('Incompleto');
        if (producto.loteado) novedades.push('Loteado');
        if (producto.otro) novedades.push('Otro');
        if (novedades.length > 0) {
          doc.text(`Tipo de novedad: ${novedades.join(', ')}`);
        }

        // Descripción y acción
        if (producto.descripcion) {
          doc.text(`Descripción: ${producto.descripcion}`);
        }
        if (producto.accion_realizada) {
          doc.text(`Acción realizada: ${this.formatearAccion(producto.accion_realizada as 'rechazado_devuelto' | 'rechazado_descargado')}`);
        }

        // Imágenes
        if (producto.foto_remision_urls && producto.foto_remision_urls.length > 0) {
          doc.moveDown();
          doc.text('Imágenes de la novedad:');
          producto.foto_remision_urls.forEach((url, imgIndex) => {
            try {
              if (typeof url === 'string' && url.startsWith('data:image')) {
                // Si es una imagen en base64
                doc.image(Buffer.from(url.split(',')[1], 'base64'), {
                  fit: [200, 200],
                  align: 'center'
                });
              } else if (typeof url === 'string') {
                // Si es una ruta de archivo
                doc.image(url, {
                  fit: [200, 200],
                  align: 'center'
                });
              }
            } catch (imgError) {
              console.error(`Error al procesar imagen ${imgIndex}:`, imgError);
            }
          });
        }

        // Imágenes de devolución si aplica
        if (producto.accion_realizada === 'rechazado_devuelto' && 
            producto.foto_devolucion_urls && 
            producto.foto_devolucion_urls.length > 0) {
          doc.moveDown();
          doc.text('Imágenes de devolución:');
          producto.foto_devolucion_urls.forEach((url, imgIndex) => {
            try {
              if (typeof url === 'string' && url.startsWith('data:image')) {
                doc.image(Buffer.from(url.split(',')[1], 'base64'), {
                  fit: [200, 200],
                  align: 'center'
                });
              } else if (typeof url === 'string') {
                doc.image(url, {
                  fit: [200, 200],
                  align: 'center'
                });
              }
            } catch (imgError) {
              console.error(`Error al procesar imagen de devolución ${imgIndex}:`, imgError);
            }
          });
        }

        doc.moveDown(2);
      });

      // Firma y pie de página
      doc.moveDown();
      doc.text(`Diligenciado por: ${usuario.nombre_completo || ''}`);
      
      if (usuario.firma_digital?.firma_url) {
        try {
          doc.image(usuario.firma_digital.firma_url, {
            fit: [150, 100],
            align: 'center'
          });
        } catch (firmaError) {
          console.error('Error al procesar firma digital:', firmaError);
        }
      }
    } catch (error) {
      console.error('Error al generar contenido del PDF:', error);
      throw error;
    }
  }
}
