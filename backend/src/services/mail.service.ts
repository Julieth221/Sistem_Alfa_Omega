import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NovedadEmailDto } from './../dto/mail/novedad-email.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendNovedadEmail(data: NovedadEmailDto) {
    const {
      to,
      subject,
      numeroRemision,
      fecha,
      productos,
      diligenciado_por,
      nombreUsuario
    } = data;

    return this.mailerService.sendMail({
      to,
      subject,
      template: 'novedad',
      context: {
        numeroRemision,
        fecha,
        productos,
        diligenciado_por,
        nombreUsuario
      },
      attachments: productos.map(p => ({
        filename: `remision_${p.referencia}.jpg`,
        path: p.foto_remision
      }))
    });
  }
} 