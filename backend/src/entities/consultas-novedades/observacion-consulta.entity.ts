import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Novedad } from './Con-novedad.entity';

@Entity({ schema: 'SistemNovedad', name: 'observaciones_consulta' })
export class ObservacionConsulta {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  observacion!: string;

  @Column()
  fecha!: Date;

  @ManyToOne(() => Novedad, novedad => novedad.observaciones_consulta)
  @JoinColumn({ name: 'novedad_id' })
  novedad!: Novedad;
}