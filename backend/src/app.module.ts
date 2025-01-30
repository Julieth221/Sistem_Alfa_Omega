import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { NovedadesModule } from './modules/novedades.module';
import { ConsultasNovedadModule } from './modules/consultas-novedad.module'
import { MailerModule } from '@nestjs-modules/mailer';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './modules/users.module';
import { DatabaseModule } from './modules/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(databaseConfig),
    NovedadesModule,
    ConsultasNovedadModule,
    AuthModule,
    UsersModule,
    DatabaseModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    })
  ],
})
export class AppModule {}

