import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../mail/mail.service';
import { NovedadEmailDto } from '../dto/mail/novedad-email.dto';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('preview')
  async previewEmail(@Body() data: NovedadEmailDto) {
    if (!data.nombreUsuario) {
      data.nombreUsuario = data.diligenciado_por;
    }
    return { html: 'Vista previa del correo' };
  }

  @Post('send')
  async sendEmail(@Body() data: NovedadEmailDto) {
    if (!data.nombreUsuario) {
      data.nombreUsuario = data.diligenciado_por;
    }
    await this.mailService.sendNovedadEmail(data);
    return { message: 'Correo enviado exitosamente' };
  }
} 