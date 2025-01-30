import { Controller, Get, Post, Put, Patch, Param, Body } from '@nestjs/common';
import { UsuariosService } from '../services/usuarios.service';
import { User } from '../auth/interfaces/user.interface';
import { Usuario } from '../entities/usuario.entity'

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async getUsuarios() {
    return this.usuariosService.getUsuarios();
  }

  @Get(':id')
  async getUsuario(@Param('id') id: number) {
    return this.usuariosService.getUsuario(id);
  }

  @Post()
  async crearUsuario(@Body() usuario: Usuario) {
    return this.usuariosService.crearUsuario(usuario);
  }

  @Put(':id')
  async actualizarUsuario(@Param('id') id: number, @Body() usuario: Partial<Usuario>) {
    return this.usuariosService.actualizarUsuario(id, usuario);
  }

  @Patch(':id/estado')
  async toggleEstadoUsuario(@Param('id') id: number, @Body() body: { activo: boolean }) {
    return this.usuariosService.toggleEstadoUsuario(id, body.activo);
  }
} 