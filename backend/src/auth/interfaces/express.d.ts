import { User } from '../interfaces/user.interface';
import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: User; // Agrega la propiedad user
    }
  }
} 