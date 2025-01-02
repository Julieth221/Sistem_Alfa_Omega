import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Novedad } from './novedad.entity';

@Entity({ schema: 'SistemNovedad', name: 'productos_novedad' })
export class ProductoNovedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Novedad, novedad => novedad.productos, { onDelete: 'CASCADE' })
  novedad!: Novedad;

  @Column()
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
  descripcion!: string;

  @Column({ nullable: true })
  correo!: string;

  @Column({ 
    nullable: true,
    type: 'varchar',
    length: 50,
    enum: ['rechazado_devuelto', 'rechazado_descargado']
  })
  accion_realizada!: string;

  @Column({ nullable: true })
  foto_remision_url!: string;
} 