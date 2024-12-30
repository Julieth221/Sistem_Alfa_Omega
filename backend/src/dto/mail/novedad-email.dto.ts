export class NovedadEmailDto {
  to!: string;
  subject!: string;
  numeroRemision!: string;
  fecha!: Date;
  nombreUsuario!: string;
  productos!: {
    referencia: string;
    cantidad_m2?: boolean;
    cantidad_cajas?: boolean;
    cantidad_unidades?: boolean;
    roturas?: boolean;
    desportillado?: boolean;
    golpeado?: boolean;
    rayado?: boolean;
    incompleto?: boolean;
    loteado?: boolean;
    otro?: boolean;
    descripcion?: string;
    accion_realizada?: string;
    foto_remision?: string;
  }[];
  diligenciado_por!: string;
  correo!: string;
  attachments?: any[];
} 