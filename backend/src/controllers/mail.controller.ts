import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from '../services/mail.service';
import { NovedadEmailDto } from '../dto/mail/novedad-email.dto';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('preview')
  async previewEmail(@Body() data: NovedadEmailDto) {
    return { html: 'Vista previa del correo' };
  }

  @Post('send')
  async sendEmail(@Body() data: NovedadEmailDto) {
    await this.mailService.sendNovedadEmail(data);
    return { message: 'Correo enviado exitosamente' };
  }
} 