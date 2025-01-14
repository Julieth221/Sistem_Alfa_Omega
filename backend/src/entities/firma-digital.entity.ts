import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('firmas_digitales', { schema: 'SistemNovedad' })
export class FirmaDigital {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  usuario_id!: number;

  @Column('text')
  firma_url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;
} 