import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProductoNovedad } from '../producto-novedad.entity';
import { ObservacionConsulta } from './observacion-consulta.entity';

@Entity({ schema: 'SistemNovedad', name: 'novedades' })
export class Novedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  numero_remision!: string;

  @Column()
  remision_factura!: string;

  @Column()
  fecha!: Date;

  @Column()
  trabajador!: string;

  @Column()
  aprobado_por!: string;

  @Column('jsonb')
  observaciones: any;

  @Column('jsonb', { nullable: true })
  remision_proveedor_urls!: any;

  @Column('jsonb', { nullable: true })
  foto_estado_urls!: any;

  @OneToMany(() => ProductoNovedad, producto => producto.novedad)
  productos!: ProductoNovedad[];

  @OneToMany(() => ObservacionConsulta, observacion => observacion.novedad)
  observaciones_consulta!: ObservacionConsulta[];
}