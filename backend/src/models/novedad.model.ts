import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('novedades')
export class Novedad {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  referencia: string;

  @Column({ default: false })
  cantidad_m2: boolean;

  @Column({ default: false })
  cantidad_cajas: boolean;

  @Column({ default: false })
  cantidad_unidades: boolean;

  @Column({ default: false })
  roturas: boolean;

  @Column({ default: false })
  desportillado: boolean;

  @Column({ default: false })
  golpeado: boolean;

  @Column({ default: false })
  rayado: boolean;

  @Column({ default: false })
  incompleto: boolean;

  @Column({ default: false })
  loteado: boolean;

  @Column({ default: false })
  otro: boolean;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  accion_realizada: string;
} 