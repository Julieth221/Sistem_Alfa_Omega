export interface NovedadEmailDto {
  to: string;
  productos: Array<{
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
  }>;
  nombreUsuario: string;
  fecha: Date;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
} 