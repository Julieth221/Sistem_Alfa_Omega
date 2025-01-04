import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { mailConfig } from '../config/mail.config';
import { MailService } from './mail.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => mailConfig(configService),
      inject: [ConfigService],
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule {} 