import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { join } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

import { Novedad } from '../entities/novedad.entity';
import { ProductoNovedad } from '../entities/producto-novedad.entity';
import { Usuario } from '../entities/usuario.entity';
import { INovedadDto } from '../dto/producto-novedad.interface';

interface ImageData {
  name?: string;
  url: string;
}

type AccionRealizada = 'rechazado_devuelto' | 'rechazado_descargado';

@Injectable()
export class NovedadesService {
  private readonly logger = new Logger(NovedadesService.name);

  constructor(
    @InjectRepository(Novedad)
    private novedadesRepository: Repository<Novedad>,
    @InjectRepository(ProductoNovedad)
    private productosNovedadRepository: Repository<ProductoNovedad>,
    @InjectRepository(Usuario)
    private usuarioRepository: Repository<Usuario>,
    private dataSource: DataSource,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async getUltimoNumeroRemision(): Promise<string> {
    try {
      const ultimaNovedad = await this.novedadesRepository
        .createQueryBuilder('novedad')
        .orderBy('novedad.id', 'DESC')
        .getOne();

      if (!ultimaNovedad) return 'FNAO0001';

      const siguienteId = ultimaNovedad.id + 1;
      return `FNAO${siguienteId.toString().padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('Error al obtener último número de remisión:', error);
      throw error;
    }
  }

  // =========================
  // Helpers para imágenes base64 y layout
  // =========================

  private normalizeImages(input: any): ImageData[] {
    if (!input) return [];

    const arr = Array.isArray(input) ? input : [input];

    return arr
      .filter(Boolean)
      .map((item: any) => {
        if (typeof item === 'string') return { url: item } as ImageData;
        if (item?.url) return { url: item.url, name: item.name } as ImageData;
        return null;
      })
      .filter(Boolean) as ImageData[];
  }

  private imageToBufferIfNeeded(url: string): Buffer | string {
    if (!url) return '';

    // Caso principal: data URI (base64)
    if (url.startsWith('data:image/')) {
      const base64 = url.split(',')[1] ?? '';
      return Buffer.from(base64, 'base64');
    }

    // Caso: ruta absoluta (si algún día existiera)
    if (path.isAbsolute(url)) return url;

    // Caso: "/algo/..." => convertir a path absoluto del proyecto
    const clean = url.startsWith('/') ? url.slice(1) : url;
    return join(process.cwd(), clean);
  }

  private ensureSpace(doc: any, neededHeight: number, footerSpace = 130) {
    const bottomLimit = doc.page.height - doc.page.margins.bottom - footerSpace;
    if (doc.y + neededHeight > bottomLimit) doc.addPage();
  }

  private moveDownLines(doc: any, lines = 3) {
    doc.moveDown(lines);
  }

  private drawSectionTitle(doc: any, title: string) {
    this.ensureSpace(doc, 40);

    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#016165')
      .text(title, doc.page.margins.left, doc.y, { align: 'left' });

    doc
      .moveTo(doc.page.margins.left, doc.y + 6)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 6)
      .strokeColor('#e6ecec')
      .stroke();

    doc.moveDown(1.2);
  }

  private drawDivider(doc: any) {
    this.ensureSpace(doc, 20);
    doc
      .moveTo(doc.page.margins.left, doc.y + 6)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y + 6)
      .strokeColor('#eef2f7')
      .stroke();
    doc.moveDown(1.2);
  }

  // =========================
  // ✅ PRODUCTO: TÍTULO + TABLA exactamente como tu diseño original
  // =========================
  private renderProductoHeaderYTabla(doc: any, producto: any, i: number) {
    // Asegurar un bloque razonable (título + tabla)
    this.ensureSpace(doc, 260);

    const productoY = doc.y;

    // Título del producto con línea inferior (igual al snippet)
    doc
      .fillColor('#016165')
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(`PRODUCTO ${i + 1}`, 70, productoY);

    doc
      .moveTo(70, productoY + 25)
      .lineTo(550, productoY + 25)
      .strokeColor('#016165')
      .stroke();

    doc.moveDown(2);

    // Configuración de la tabla (igual al snippet)
    const startY = doc.y;
    const labelX = 70;
    const valueX = 220;
    const maxWidth = 300;
    let currentY = startY;

    const safe = (v: any) =>
      v !== undefined && v !== null && String(v).trim() !== '' ? String(v) : 'N/A';

    // Helper para que una fila larga no se meta al footer
    const ensureRowSpace = (needed: number) => {
      const prev = currentY;
      doc.y = currentY;
      this.ensureSpace(doc, needed);
      // Si saltó de página, doc.y cambia; sincronizamos currentY
      if (doc.y !== prev) currentY = doc.y;
    };

    // Función helper para agregar filas (misma alineación, color, etc.)
    const addTableRow = (label: string, value: string | string[]) => {
      doc.font('Helvetica-Bold').fontSize(11);
      const labelH = doc.heightOfString(label, { width: 140 });

      const formattedValue = Array.isArray(value)
        ? value.map((v) => `• ${v}`).join('\n')
        : safe(value);

      doc.font('Helvetica').fontSize(11);
      const valueH = doc.heightOfString(formattedValue, { width: maxWidth });

      ensureRowSpace(Math.max(labelH, valueH) + 20);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#333333')
        .text(label, labelX, currentY);

      doc
        .font('Helvetica')
        .fontSize(11)
        .fillColor('#333333')
        .text(formattedValue, valueX, currentY, { width: maxWidth });

      currentY += Math.max(valueH, 20);
      currentY += 10;
    };

    // Detalles del producto
    addTableRow('Referencia:', safe(producto?.referencia));

    // Cantidades (mantiene "true cajas" si viene boolean true)
    // Cantidades (✅ NO acepta booleanos, solo números/strings con valor)
    const cantidades: string[] = [];

    const hasQty = (v: any) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'boolean') return false;
      if (typeof v === 'number') return v > 0;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return false;
        const n = Number(s);
        return Number.isFinite(n) && n > 0;
      }
      return false;
    };

     if (hasQty(producto?.cantidad_m2)) cantidades.push(`${producto?.cantidad_m2} m²`);
     if (hasQty(producto?.cantidad_cajas)) cantidades.push(`${producto?.cantidad_cajas} cajas`);
     if (hasQty(producto?.cantidad_unidades)) cantidades.push(`${producto?.cantidad_unidades} und`);
     addTableRow('Cantidad de la novedad:', cantidades.join(', ') || 'No especificada');


    // Tipos de novedad (con bullets como tu snippet)
    const problemas: string[] = [];
    if (producto?.roturas) problemas.push('Roturas');
    if (producto?.desportillado) problemas.push('Desportillado');
    if (producto?.golpeado) problemas.push('Golpeado');
    if (producto?.rayado) problemas.push('Rayado');
    if (producto?.incompleto) problemas.push('Incompleto');
    if (producto?.loteado) problemas.push('Loteado');
    if (producto?.otro) problemas.push('Otro');

    addTableRow('Tipo de novedad:', problemas.length ? problemas : 'Ninguno');

    // Descripción (siempre, para que se vea igual)
    addTableRow('Descripción:', safe(producto?.descripcion));

    addTableRow(
      'Acción realizada:',
      this.formatearAccion(producto?.accion_realizada as AccionRealizada),
    );

    // Almacén (con punto final)
    addTableRow('Almacén:', 'Almacén Principal.');

    // Dejar el cursor al final real de la tabla
    doc.y = currentY;
    doc.moveDown(2);
  }

  /**
   * ✅ IMÁGENES: sin nombre/caption dentro del cuadro.
   * Render en columna (una debajo de otra), con "3 espacios" entre imágenes.
   */
  private renderImagesStack(doc: any, rawImages: any, opts?: { title?: string }) {
    const images = this.normalizeImages(rawImages);
    if (!images.length) return;

    if (opts?.title) this.drawSectionTitle(doc, opts.title);

    const marginL = doc.page.margins.left;
    const marginR = doc.page.margins.right;
    const contentWidth = doc.page.width - marginL - marginR;

    const cardPadding = 10;
    const imgH = 200;
    const maxCardW = 430;
    const cardW = Math.min(contentWidth, maxCardW);
  const imgW = cardW - cardPadding * 2;

    // ✅ sin caption
    const cardH = cardPadding + imgH + cardPadding;

    for (let idx = 0; idx < images.length; idx++) {
      this.ensureSpace(doc, cardH + 30);

      const x = marginL + (contentWidth - cardW) / 2;
      const y = doc.y;

      doc.roundedRect(x, y, cardW, cardH, 10).fillColor('#f8f9fa').fill();
      doc
        .roundedRect(x, y, cardW, cardH, 10)
        .lineWidth(1)
        .strokeColor('#e5e7eb')
        .stroke();

      const imgBoxX = x + cardPadding;
      const imgBoxY = y + cardPadding;
      const imgBoxW = imgW;
      const imgBoxH = imgH;

      doc.save();
      doc.roundedRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 8).clip();

      try {
        const src = this.imageToBufferIfNeeded(images[idx].url);
        doc.image(src, imgBoxX, imgBoxY, {
          fit: [imgBoxW, imgBoxH],
          align: 'center',
          valign: 'center',
        });
      } catch (e) {
        doc
          .fillColor('#9ca3af')
          .font('Helvetica')
          .fontSize(10)
          .text('No se pudo cargar la imagen', imgBoxX, imgBoxY + imgBoxH / 2 - 5, {
            width: imgBoxW,
            align: 'center',
          });
      }

      doc.restore();

      doc.y = y + cardH;
      this.moveDownLines(doc, 3);
    }
  }

  private addFooterToAllPages(doc: any, logoPath: string) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      const footerBaseY = doc.page.height - doc.page.margins.bottom - 60;
      const lineY = footerBaseY - 60;

      doc
        .moveTo(doc.page.margins.left, lineY)
        .lineTo(doc.page.width - doc.page.margins.right, lineY)
        .strokeColor('#016165')
        .stroke();

      try {
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, doc.page.margins.left, lineY + 10, { width: 40 });
        }
      } catch (error: any) {
        this.logger.warn(`Error al cargar el logo en el footer: ${error.message}`);
      }

      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor('#9ca3af')
        .text('Almacén Principal: Calle 11 # 25-24 Yopal-Casanare', 100, lineY + 12, {
          align: 'center',
        })
        .text('Correo: gerencia@enchapesyacabadosalfayomega.com', 100, lineY + 24, {
          align: 'center',
        })
        .text('Tel: 6333237 - 3164012888', 100, lineY + 36, { align: 'center' })
        .text(`Página ${i + 1} de ${pages.count}`, doc.page.margins.left, lineY + 54, {
          align: 'right',
        });
    }
  }

  private formatearAccion(accion: AccionRealizada): string {
    const acciones: Record<string, string> = {
      rechazado_devuelto: 'Rechazado y Devuelto',
      rechazado_descargado: 'Rechazado y Descargado',
    };
    return acciones[accion] || accion;
  }

  private formatearProblemas(producto: any): string {
    const problemas = [];
    if (producto.roturas) problemas.push('Roturas');
    if (producto.desportillado) problemas.push('Desportillado');
    if (producto.golpeado) problemas.push('Golpeado');
    if (producto.rayado) problemas.push('Rayado');
    if (producto.incompleto) problemas.push('Incompleto');
    if (producto.loteado) problemas.push('Loteado');
    if (producto.otro) problemas.push('Otro');
    return problemas.length ? problemas.join(', ') : 'Ninguno';
  }

  // =========================
  // PDF principal (CON TABLA ORIGINAL + IMÁGENES SIN NOMBRE)
  // =========================
  public async generarPDF(novedad: Novedad, productos: ProductoNovedad[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc: any = new (PDFDocument as any)({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const logoPath = join(process.cwd(), 'public', 'images', 'logo2.png');

        // Logo header
        try {
          if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 30, { width: 95 });
          }
        } catch {
          this.logger.warn('No se pudo cargar logo en header');
        }

        // Encabezado
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#111827')
          .text('ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S', 75, 40, {
            align: 'center',
          });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#374151')
          .text('NIT 900.532.727-3', 75, 60, { align: 'center' });

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#016165')
          .text('NOVEDADES EN LA RECEPCIÓN DE MERCANCIA', 75, 78, { align: 'center' });

        const fechaHoy = format(new Date(), 'dd/MM/yyyy');
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#111827')
          .text('Fecha:', 470, 55)
          .text(fechaHoy, 470, 70);

        doc.moveDown(5);

        // =========================
        // Caja Información General
        // =========================
        const infoY = doc.y;
        const infoH = 155;

        doc
          .roundedRect(50, infoY, 500, infoH, 10)
          .fillColor('#f8f9fa')
          .fill()
          .strokeColor('#016165')
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#016165')
          .text('Información General', 70, infoY + 16);

        doc.fontSize(11).fillColor('#111827');

        const rows = [
          ['N° DE REMISIÓN:', novedad.remision_factura ?? 'N/A'],
          ['FECHA:', novedad.fecha ? format(new Date(novedad.fecha as any), 'dd/MM/yyyy') : 'N/A'],
          ['PROVEEDOR:', novedad.proveedor ?? 'N/A'],
          ['NIT:', novedad.nit ?? 'N/A'],
          // ['DILIGENCIADO POR:', novedad.trabajador ?? 'N/A'],
        ];

        let y = infoY + 40;
        for (const [label, value] of rows) {
          doc.font('Helvetica-Bold').text(label, 70, y);
          doc.font('Helvetica').text(value, 210, y, { width: 330 });
          y += 22;
        }

        doc.y = infoY + infoH + 10;
        this.moveDownLines(doc, 3);

        // =========================
        // Productos (TABLA ORIGINAL)
        // =========================
        for (let i = 0; i < productos.length; i++) {
          const producto = productos[i];

          // ✅ Título + tabla exactamente como tu diseño
          this.renderProductoHeaderYTabla(doc, producto, i);

          // "3 espacios" luego del detalle
          this.moveDownLines(doc, 3);

          // Fotos Remisión
          const fotosRemision = this.normalizeImages((producto as any).foto_remision_urls);
          if (fotosRemision.length) {
            this.renderImagesStack(doc, fotosRemision, {
              title: `Imágenes de Remisión - Ref: ${producto.referencia ?? 'N/A'}`,
            });
          }

          // Fotos Devolución (solo si aplica)
          const fotosDevolucion = this.normalizeImages((producto as any).foto_devolucion_urls);
          if (fotosDevolucion.length && (producto as any).accion_realizada === 'rechazado_devuelto') {
            this.renderImagesStack(doc, fotosDevolucion, {
              title: `Imágenes de Devolución - Ref: ${producto.referencia ?? 'N/A'}`,
            });
          }

          // separador entre productos (sin forzar página)
          if (i < productos.length - 1) {
            this.drawDivider(doc);
            this.moveDownLines(doc, 2);
          }
        }

        // =========================
        // Imágenes generales
        // =========================
        const remisionProveedor = this.normalizeImages((novedad as any).remision_proveedor_urls);
        if (remisionProveedor.length) {
          this.ensureSpace(doc, 120);
          this.renderImagesStack(doc, remisionProveedor, {
            title: 'Imágenes de Remisión del Proveedor',
          });
        }

        const fotosEstado = this.normalizeImages((novedad as any).foto_estado_urls);
        if (fotosEstado.length) {
          this.ensureSpace(doc, 120);
          this.renderImagesStack(doc, fotosEstado, {
            title: 'Imágenes del Estado',
          });
        }

        // Footer + paginación (una sola vez)
        this.addFooterToAllPages(doc, logoPath);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // =========================
  // CREATE
  // =========================
  async create(novedadDto: INovedadDto): Promise<Novedad> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const usuario = await this.usuarioRepository.findOne({
        where: { id: novedadDto.usuario_id },
      });

      if (!usuario) throw new NotFoundException('Usuario no encontrado');

      const novedad = new Novedad();

      novedad.trabajador = usuario.nombre_completo;
      novedad.remision_proveedor_urls = (novedadDto as any).remision_proveedor_urls || [];
      novedad.remision_factura = novedadDto.remision_factura;
      novedad.fecha = novedadDto.fecha;
      novedad.proveedor = novedadDto.proveedor;
      novedad.nit = novedadDto.nit;
      novedad.aprobado_por = novedadDto.aprobado_por;
      novedad.observaciones = novedadDto.observaciones;
      novedad.foto_estado_urls = (novedadDto as any).foto_estado_urls || [];
      novedad.usuario_id = usuario.id;

      novedad.numero_remision = await this.getUltimoNumeroRemision();

      const savedNovedad = await queryRunner.manager.save(Novedad, novedad);

      const productosGuardados: ProductoNovedad[] = [];

      if ((novedadDto as any).productos?.length > 0) {
        for (const producto of (novedadDto as any).productos) {
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
          productoNovedad.correo = (novedadDto as any).correo;

          // Guardas base64 directo en DB:
          productoNovedad.foto_remision_urls = producto.foto_remision_urls || [];
          productoNovedad.foto_devolucion_urls = producto.foto_devolucion_urls || [];

          const savedProducto = await queryRunner.manager.save(
            ProductoNovedad,
            productoNovedad,
          );
          productosGuardados.push(savedProducto);
        }
      }

      // Generar PDF
      const pdfBuffer = await this.generarPDF(savedNovedad, productosGuardados);

      // Enviar email
      await this.mailerService.sendMail({
        to: (novedadDto as any).correo,
        subject: 'Mercancía con Problemas en la Recepción',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #016165;">Mercancía con Problemas en la Recepción</h2>
            <p>Señores ${novedad.proveedor},</p>
            <p>Cordial saludo,</p>
            <p>
              Por medio de la presente, nos permitimos informar que se han identificado novedades en la recepción
              de mercancía correspondiente a la remisión N° ${savedNovedad.remision_factura}.
            </p>
            <p>Adjunto encontrarán:</p>
            <ul>
              <li>Documento PDF con el detalle de las novedades encontradas</li>
              <li>Registro fotográfico de los productos afectados</li>
            </ul>
            <p>Agradecemos su atención y quedamos atentos a sus comentarios.</p>
            <p>Cordialmente,</p>
            <p><strong>${savedNovedad.trabajador}</strong><br/>Alfa y Omega Enchapes y Acabados</p>
          </div>
        `,
        attachments: [
          {
            filename: `novedad_${savedNovedad.remision_factura}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      await queryRunner.commitTransaction();
      return savedNovedad;
    } catch (error) {
      this.logger.error('Error en create:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findLastRemision(): Promise<Novedad | null> {
    try {
      return await this.novedadesRepository.findOne({
        where: {},
        order: { id: 'DESC' },
        relations: ['productos'],
      });
    } catch (error) {
      this.logger.error('Error al buscar última remisión:', error);
      throw new InternalServerErrorException('Error al obtener la última remisión.');
    }
  }

  // =========================
  // Preview PDF (MISMO ESTILO: TABLA ORIGINAL + IMÁGENES SIN NOMBRE)
  // =========================
  async generatePreviewPdf(novedadDto: any, productoDto: any[]): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc: any = new (PDFDocument as any)({
          size: 'A4',
          margin: 50,
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c: Buffer) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        const logoPath = join(process.cwd(), 'public', 'images', 'logo2.png');

        try {
          if (fs.existsSync(logoPath)) doc.image(logoPath, 40, 30, { width: 95 });
        } catch {}

        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#111827')
          .text('ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S', 75, 40, { align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#374151')
          .text('NIT 900.532.727-3', 75, 60, { align: 'center' });

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#016165')
          .text('NOVEDADES EN LA RECEPCIÓN DE MERCANCIA', 75, 78, { align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#111827')
          .text('Fecha:', 470, 55)
          .text(format(new Date(), 'dd/MM/yyyy'), 470, 70);

        doc.moveDown(5);

        // Info general
        const infoY = doc.y;
        const infoH = 155;

        doc
          .roundedRect(50, infoY, 500, infoH, 10)
          .fillColor('#f8f9fa')
          .fill()
          .strokeColor('#016165')
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#016165')
          .text('Información General', 70, infoY + 16);

        const rows = [
          ['N° DE REMISIÓN:', novedadDto?.remision_factura || 'N/A'],
          ['FECHA:', novedadDto?.fecha ? format(new Date(novedadDto.fecha), 'dd/MM/yyyy') : 'N/A'],
          ['PROVEEDOR:', novedadDto?.proveedor || 'N/A'],
          ['NIT:', novedadDto?.nit || 'N/A'],
          ['DILIGENCIADO POR:', novedadDto?.trabajador || 'N/A'],
        ];

        let y = infoY + 48;
        for (const [label, value] of rows) {
          doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(label, 70, y);
          doc.font('Helvetica').fillColor('#374151').text(value, 210, y, { width: 330 });
          y += 22;
        }

        doc.y = infoY + infoH + 10;
        this.moveDownLines(doc, 3);

        // Productos preview (TABLA ORIGINAL)
        if (Array.isArray(productoDto) && productoDto.length) {
          for (let i = 0; i < productoDto.length; i++) {
            const producto = productoDto[i];

            this.renderProductoHeaderYTabla(doc, producto, i);

            this.moveDownLines(doc, 3);

            const fotosRemision = this.normalizeImages(producto.foto_remision_urls);
            if (fotosRemision.length) {
              this.renderImagesStack(doc, fotosRemision, {
                title: `Imágenes de Remisión - Ref: ${producto.referencia || 'N/A'}`,
              });
            }

            const fotosDevolucion = this.normalizeImages(producto.foto_devolucion_urls);
            if (fotosDevolucion.length && producto.accion_realizada === 'rechazado_devuelto') {
              this.renderImagesStack(doc, fotosDevolucion, {
                title: `Imágenes de Devolución - Ref: ${producto.referencia || 'N/A'}`,
              });
            }

            if (i < productoDto.length - 1) {
              this.drawDivider(doc);
              this.moveDownLines(doc, 2);
            }
          }
        }

        const remisionProveedor = this.normalizeImages(novedadDto?.remision_proveedor_urls);
        if (remisionProveedor.length) {
          this.ensureSpace(doc, 120);
          this.renderImagesStack(doc, remisionProveedor, {
            title: 'Imágenes de Remisión del Proveedor',
          });
        }

        const fotosEstado = this.normalizeImages(novedadDto?.foto_estado_urls);
        if (fotosEstado.length) {
          this.ensureSpace(doc, 120);
          this.renderImagesStack(doc, fotosEstado, {
            title: 'Imágenes del Estado de la Mercancía',
          });
        }

        this.addFooterToAllPages(doc, logoPath);

        doc.end();
      } catch (error) {
        this.logger.error('Error generando Preview PDF:', error);
        reject(error);
      }
    });
  }

  async enviarCorreoNovedad(novedadId: number): Promise<void> {
    try {
      const novedad = await this.novedadesRepository.findOne({
        where: { id: novedadId },
        relations: ['productos'],
      });

      if (!novedad) throw new Error('Novedad no encontrada');
      if (!novedad.productos?.length) throw new Error('La novedad no tiene productos asociados');

      const correoDestino = (novedad.productos[0] as any)?.correo;
      if (!correoDestino) throw new Error('No se encontró un correo válido en los productos');

      const pdfBuffer = await this.generarPDF(novedad, novedad.productos);

      await this.mailerService.sendMail({
        to: correoDestino,
        subject: 'Mercancía con Problemas en la Recepción',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2 style="color: #016165;">Mercancía con Problemas en la Recepción</h2>
            <p>Señores ${novedad.proveedor},</p>
            <p>Cordial saludo,</p>
            <p>
              Se identificaron novedades en la recepción de mercancía correspondiente a la remisión
              N° ${novedad.remision_factura}.
            </p>
            <p>Cordialmente,</p>
            <p><strong>${novedad.trabajador}</strong><br/>Alfa y Omega Enchapes y Acabados</p>
          </div>
        `,
        attachments: [
          {
            filename: `novedad-${novedad.remision_factura}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });

      this.logger.log(`Correo enviado exitosamente para la novedad ${novedadId}`);
    } catch (error) {
      this.logger.error(`Error al enviar correo para novedad ${novedadId}:`, error);
      throw error;
    }
  }
}
