import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NovedadEmailDto } from './dto/novedad-email.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendNovedadEmail(data: NovedadEmailDto) {
    const { to, productos, nombreUsuario, fecha } = data;

    await this.mailerService.sendMail({
      to: to,
      subject: 'Mercancía con Problemas en la Recepción',
      template: 'novedad',
      context: {
        productos,
        nombreUsuario,
        fecha
      },
      attachments: [
        {
          filename: 'logo.png',
          path: './src/assets/logo.png',
          cid: 'logo'
        },
        ...data.attachments || []
      ]
    });
  }
} 