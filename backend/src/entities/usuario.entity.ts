import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { FirmaDigital } from './firma-digital.entity';

@Entity({ schema: 'SistemNovedad', name: 'usuarios' })
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column()
  apellido!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  rol!: string;

  @Column({ default: true })
  activo!: boolean;

  @Column()
  nombre_completo!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login?: Date;

  @OneToOne(() => FirmaDigital)
  @JoinColumn({ name: 'id' })
  firma_digital!: FirmaDigital;
} 