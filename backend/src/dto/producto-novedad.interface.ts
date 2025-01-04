export interface IProductoNovedadDto {
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
  accion_realizada?: 'rechazado_devuelto' | 'rechazado_descargado';
  foto_remision_url: string;
  correo: string;
} 

export interface INovedadDto {
  fecha: Date;
  diligenciado_por: string;
  correo: string;
  usuario_id?: number;
  productos: {
    referencia: string;
    cantidad_m2: boolean;
    cantidad_cajas: boolean;
    cantidad_unidades: boolean;
    roturas: boolean;
    desportillado: boolean;
    golpeado: boolean;
    rayado: boolean;
    incompleto: boolean;
    loteado: boolean;
    otro: boolean;
    descripcion: string;
    accion_realizada: string;
    foto_remision?: string;
    correo?: string;
  }[];
}