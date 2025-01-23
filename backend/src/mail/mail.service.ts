import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NovedadEmailDto } from '../dto/mail/novedad-email.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendNovedadEmail(data: NovedadEmailDto): Promise<void> {
    const { to, productos, diligenciado_por, fecha, numero_factura, attachments } = data;

    const emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #1976d2;">Mercancía con Problemas en la Recepción</h2>
        
        <p>Señor@s,</p>
        
        <p>Cordial saludo,</p>
        
        <p>Por medio de la presente, nos permitimos informar que se han identificado novedades en la recepción de mercancía correspondiente a la remisión N° ${numero_factura}.</p>
        
        <p>Adjunto encontrarán:</p>
        <ul>
          <li>Documento PDF con el detalle de las novedades encontradas</li>
          <li>Registro fotográfico de los productos afectados</li>
        </ul>
        
        <p>Agradecemos su atención y quedamos atentos a sus comentarios.</p>
        
        <p>Cordialmente,</p>
        <p><strong>${diligenciado_por}</strong><br>
        Alfa y Omega Acabados</p>
      </div>
    `;

    await this.mailerService.sendMail({
      to: to,
      subject: 'Mercancía con Problemas en la Recepción - Remisión N° ' + numero_factura,
      html: emailContent,
      attachments: [
        {
          filename: `Novedad_Remision_${numero_factura}.pdf`,
          path: './temp/novedad.pdf',
          contentType: 'application/pdf'
        },
        ...(attachments || []).map(attachment => ({
          filename: `Producto_${attachment.referencia}.jpg`,
          path: attachment.path,
          contentType: 'image/jpeg'
        }))
      ]
    });
  }
} 