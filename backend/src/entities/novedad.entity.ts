import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductoNovedad } from './producto-novedad.entity';
import { Usuario } from './usuario.entity';

@Entity('novedades', { schema: 'SistemNovedad' })
export class Novedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  numero_remision!: string;

  @Column({ length: 20 })
  remision_factura!: string;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ length: 20 })
  nit!: string;

  @Column({ length: 100 })
  trabajador!: string;
 
  @Column({ type: 'text' })
  observaciones!: string;

  @Column({ length: 100 })
  aprobado_por!: string;

  @Column('text', { array: true })
  remision_proveedor_urls!: string[];

  @Column('text', { array: true })
  foto_estado_urls!: string[];

  @Column({ length: 100 })
  proveedor!: string;

  @Column({ nullable: true })
  usuario_id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @OneToMany(() => ProductoNovedad, productoNovedad => productoNovedad.novedad)
  productos!: ProductoNovedad[];
} 