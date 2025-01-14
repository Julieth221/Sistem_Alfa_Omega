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
  foto_remision_urls?: string[];
  foto_devolucion_urls?: string[];
  correo: string;
} 

export interface INovedadDto {
  fecha: Date;
  diligenciado_por: string;
  usuario_id: number;
  correo: string;
  proveedor: string;
  remision_proveedor_urls?: string[]; // URL de la imagen
  remision_factura: string;
  nit: string;
  trabajador: string;
  observaciones: string;
  foto_estado_urls?: string[]; // URL de la imagen
  aprobado_por: string;
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
    foto_remision_urls?: string[];
    foto_devolucion_urls?: string[];
    correo?: string;
  }[];
}