import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      console.log('Intento de login recibido:', loginDto.email);
      const result = await this.authService.validateUser(loginDto);
      return result;
    } catch (error: unknown) {
      console.error('Error en login:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          message: error instanceof Error ? error.message : 'Error en la autenticación',
          details: error instanceof Error ? error.message : 'Error desconocido'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 