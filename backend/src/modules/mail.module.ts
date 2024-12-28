import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { mailConfig } from '../config/mail.config';
import { MailService } from '../services/mail.service';
import { MailController } from '../controllers/mail.controller';
import { mailRoutes } from '../routes/mail.routes';

@Module({
  imports: [
    MailerModule.forRoot(mailConfig),
    RouterModule.register(mailRoutes)
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {} 