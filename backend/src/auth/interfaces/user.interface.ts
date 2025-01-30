export interface User {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'SUPERVISOR' | 'USUARIO';
  activo: boolean;
  nombre_completo?: string;
  last_login?: Date;
  password?: string;
} 