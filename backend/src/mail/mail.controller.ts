import { Controller, Post, Body } from '@nestjs/common';
import { MailService } from './mail.service';
import { NovedadEmailDto } from './dto/novedad-email.dto';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('preview')
  async previewEmail(@Body() data: NovedadEmailDto) {
    // Aquí iría la lógica para generar la vista previa
    return { html: 'Vista previa del correo' };
  }

  @Post('send')
  async sendEmail(@Body() data: NovedadEmailDto) {
    await this.mailService.sendNovedadEmail(data);
    return { message: 'Correo enviado exitosamente' };
  }
} 