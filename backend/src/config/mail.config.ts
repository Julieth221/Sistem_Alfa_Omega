import { MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

export const mailConfig = (configService: ConfigService): MailerOptions => ({
  transport: {
    host: configService.get('MAIL_HOST'),
    port: Number(configService.get('MAIL_PORT')),
    secure: configService.get('MAIL_SECURE') === 'true',
    auth: {
      user: configService.get('MAIL_USER'),
      pass: configService.get('MAIL_PASSWORD'),
    },
  },
  defaults: {
    from: configService.get('MAIL_FROM'),
  },
});
