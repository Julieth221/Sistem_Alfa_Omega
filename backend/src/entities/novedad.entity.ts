import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { ProductoNovedad } from './producto-novedad.entity';

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

  @ManyToOne(() => Usuario, { nullable: true })
  usuario!: Usuario;

  @Column({ nullable: true })
  usuario_id!: number;

  @OneToMany(() => ProductoNovedad, productoNovedad => productoNovedad.novedad)
  productos!: ProductoNovedad[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
} 