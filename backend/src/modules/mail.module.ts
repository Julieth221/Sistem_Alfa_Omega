import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { mailConfig } from '../config/mail.config';
import { MailService } from '../mail/mail.service';
import { MailController } from '../controllers/mail.controller';
import { mailRoutes } from '../routes/mail.routes';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => mailConfig(configService),
      inject: [ConfigService],
    }),
    RouterModule.register(mailRoutes)
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {} 