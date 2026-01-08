
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

enum EstadoEntrega {
  ENTREGADO = 'entregado',
  NO_ENTREGADO = 'no_entregado',
}

export class CreateFacturaFormularioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  numero_factura!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre_cliente!: string;

  @IsString()
  @IsNotEmpty()
  observaciones!: string;

  @IsEnum(EstadoEntrega)
  @IsNotEmpty()
  estado!: EstadoEntrega;

  @IsOptional()
  @IsDateString()
  fecha_entrega?: Date;
}
