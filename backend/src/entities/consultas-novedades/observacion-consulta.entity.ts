import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Novedad } from './Con-novedad.entity';

@Entity({ schema: 'SistemNovedad', name: 'observaciones_consulta' })
export class ObservacionConsulta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'novedad_id' })
  novedad_id!: number;

  @Column()
  observacion!: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => Novedad, novedad => novedad.observaciones_consulta)
  @JoinColumn({ name: 'novedad_id' })
  novedad!: Novedad;
}