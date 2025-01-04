import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { ProductoNovedad } from './producto-novedad.entity';
import { Usuario } from './usuario.entity';

@Entity({ schema: 'SistemNovedad', name: 'novedades' })
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

  @CreateDateColumn({ name: 'created_at' })
  created_at!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at!: Date;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @OneToMany(() => ProductoNovedad, productoNovedad => productoNovedad.novedad)
  productos!: ProductoNovedad[];
} 