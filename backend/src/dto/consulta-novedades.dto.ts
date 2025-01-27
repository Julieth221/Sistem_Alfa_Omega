export class ConsultaNovedadDto {
    remision_factura?: string;
    fecha_inicio?: Date;
    fecha_fin?: Date;
  }
  
  export class ObservacionConsultaDto {
    novedad_id!: number;
    usuario_id!: number;
    observacion!: string;
  }