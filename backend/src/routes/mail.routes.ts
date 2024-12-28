import { Routes } from '@nestjs/core';
import { MailController } from '../controllers/mail.controller';

export const mailRoutes: Routes = [
  {
    path: 'mail',
    module: MailController,
    children: [
      {
        path: 'preview',
        method: 'post',
        handler: 'previewEmail',
      },
      {
        path: 'send',
        method: 'post',
        handler: 'sendEmail',
      },
    ],
  },
]; 