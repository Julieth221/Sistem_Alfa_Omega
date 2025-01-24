import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Novedad } from './novedad.entity';


@Entity('productos_novedad', { schema: 'SistemNovedad' })
export class ProductoNovedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'novedad_id' })
  novedad_id!: number;

  @Column()
  referencia!: string;

  @Column({ default: false })
  cantidad_m2!: boolean;

  @Column({ default: false })
  cantidad_cajas!: boolean;

  @Column({ default: false })
  cantidad_unidades!: boolean;

  @Column({ default: false })
  roturas!: boolean;

  @Column({ default: false })
  desportillado!: boolean;

  @Column({ default: false })
  golpeado!: boolean;

  @Column({ default: false })
  rayado!: boolean;

  @Column({ default: false })
  incompleto!: boolean;

  @Column({ default: false })
  loteado!: boolean;

  @Column({ default: false })
  otro!: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion?: string;

  @Column({ nullable: true })
  correo!: string;

  @Column({ length: 50 })
  accion_realizada!: string;

  @Column('jsonb', { nullable: false })
  foto_remision_urls!: Array<{
    name: string;
    url: string;
  }>;

  @Column('jsonb', { nullable: true })
  foto_devolucion_urls!: Array<{
    name: string;
    url: string;
  }>;

  @ManyToOne(() => Novedad, novedad => novedad.productos)
  @JoinColumn({ name: 'novedad_id' })
  novedad!: Novedad;
} 