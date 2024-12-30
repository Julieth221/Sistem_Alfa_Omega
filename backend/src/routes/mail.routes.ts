import { Routes } from '@nestjs/core';
import { MailController } from '../controllers/mail.controller';

export const mailRoutes: Routes = [
  {
    path: 'mail',
    children: [
      {
        path: 'send-novedad',
        module: MailController,
      },
      {
        path: 'preview',
        module: MailController,
      }
    ]
  }
]; 