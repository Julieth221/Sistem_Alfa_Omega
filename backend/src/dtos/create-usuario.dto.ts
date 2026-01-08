import { IsString, IsEmail, IsNotEmpty, MinLength, IsIn } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  apellido!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['ADMIN', 'SUPERVISOR', 'USUARIO'])
  rol!: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
}