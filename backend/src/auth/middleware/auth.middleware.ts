import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { User } from '../interfaces/user.interface';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      const decoded = await this.jwtService.verifyAsync(token);
      console.log('Decoded JWT:', decoded);
      req.user = {
        id: decoded.id,
        nombre: decoded.nombre,
        apellido: decoded.apellido,
        email: decoded.email,
        rol: decoded.rol,
        activo: decoded.activo,
        nombre_completo: decoded.nombre_completo,
        last_login: decoded.last_login,
      } as User; // Asegúrate de que todas las propiedades necesarias estén presentes 
      next();
    } catch {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

export function esAdmin(req: Request, res: Response, next: NextFunction) {
  if ((req.user as User).rol !== 'ADMIN') {
    throw new UnauthorizedException('Acceso no autorizado');
  }
  next();
}


