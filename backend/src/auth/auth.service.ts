import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    this.pool = new Pool({
      user: this.configService.get('DB_USER'),
      host: this.configService.get('DB_HOST'),
      database: this.configService.get('DB_NAME'),
      password: this.configService.get('DB_PASSWORD'),
      port: parseInt(this.configService.get('DB_PORT') || '5432'),
    });
  }

  async validateUser(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;
    
    try {
      const result = await this.pool.query(`
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.email,
          u.rol,
          u.activo,
          c.password_hash
        FROM "SistemNovedad".usuarios u
        LEFT JOIN "SistemNovedad".credenciales c ON u.id = c.usuario_id
        WHERE u.email = $1 AND u.activo = true
      `, [email]);

      if (result.rows.length === 0) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isValid) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      return {
        token: jwt.sign(
          { userId: user.id, email: user.email, rol: user.rol },
          this.configService.get<string>('JWT_SECRET') || 'SistemAlfaOmega2024SecretKey',
          { expiresIn: '8h' }
        ),
        user: {
          id: user.id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          rol: user.rol
        }
      };
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }
} 
