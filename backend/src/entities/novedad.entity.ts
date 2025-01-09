import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductoNovedad } from './producto-novedad.entity';
import { Usuario } from './usuario.entity';

@Entity('novedades', { schema: 'SistemNovedad' })
export class Novedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  numero_remision!: string;

  @Column({ type: 'date' })
  fecha!: Date;

  @Column({ nullable: true })
  trabajador!: string;

  @Column({ name: 'usuario_id', nullable: true })
  usuario_id!: number;

  @Column({ type: 'text' })
  remision_proveedor!: string;

  @Column({ length: 100 })
  proveedor!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => ProductoNovedad, productoNovedad => productoNovedad.novedad)
  productos!: ProductoNovedad[];
} 