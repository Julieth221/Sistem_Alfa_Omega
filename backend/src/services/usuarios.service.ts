import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { hash, genSalt } from 'bcrypt';
import { User } from '../auth/interfaces/user.interface';
import { Usuario } from '../entities/usuario.entity'
import { CreateUsuarioDto } from '../dtos/create-usuario.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsuariosService {
  private readonly schema: string;

  constructor(
    @Inject('DATABASE_POOL') private pool: Pool,
    private configService: ConfigService
  ) {
    this.schema = this.configService.get('DB_SCHEMA') || 'SistemNovedad';
  }

  async getUsuarios() {
    const result = await this.pool.query(
      `SELECT * FROM "${this.schema}".usuarios ORDER BY id`
    );
    return result.rows;
  }

  async getUsuario(id: number) {
    const result = await this.pool.query(
      `SELECT * FROM "${this.schema}".usuarios WHERE id = $1`,
      [id]
    );
    return result.rows[0];
  }
  async crearUsuario(createUsuarioDto: CreateUsuarioDto) {
    const { nombre, apellido, email, rol, password } = createUsuarioDto;
    if (!password) {
      throw new BadRequestException('La contraseña es requerida.');
    }
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const salt = await genSalt(10);
      const passwordHash = await hash(password, salt);

      const userResult = await client.query(
        `INSERT INTO "${this.schema}".usuarios (nombre, apellido, email, rol) VALUES ($1, $2, $3, $4) RETURNING id`,
        [nombre, apellido, email, rol]
      );

      await client.query(
        `INSERT INTO "${this.schema}".credenciales (usuario_id, password_hash, salt) VALUES ($1, $2, $3)`,
        [userResult.rows[0].id, passwordHash, salt]
      );

      await client.query('COMMIT');
      return { message: 'Usuario creado exitosamente' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async actualizarUsuario(id: number, usuario: Partial<Usuario>) {
    const result = await this.pool.query(
      `UPDATE "${this.schema}".usuarios SET nombre = $1, apellido = $2, email = $3, rol = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *`,
      [usuario.nombre, usuario.apellido, usuario.email, usuario.rol, id]
    );
    return result.rows[0];
  }

  async toggleEstadoUsuario(id: number, activo: boolean) {
    const result = await this.pool.query(
      `UPDATE "${this.schema}".usuarios SET activo = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [activo, id]
    );
    return result.rows[0];
  }

} 