import { Routes } from '@nestjs/core';
import { mailRoutes } from './mail.routes';

export const routes: Routes = [
  ...mailRoutes,
  // Aquí irían otras rutas
]; 