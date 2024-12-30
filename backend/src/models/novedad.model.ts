import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'SistemNovedad', name: 'novedades' })
export class Novedad {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  referencia!: string;

  @Column({ name: 'cantidad_m2', default: false })
  cantidad_m2!: boolean;

  @Column({ name: 'cantidad_cajas', default: false })
  cantidad_cajas!: boolean;

  @Column({ name: 'cantidad_unidades', default: false })
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

  @Column({ name: 'accion_realizada', type: 'text', nullable: true })
  accion_realizada!: string;

  constructor(partial: Partial<Novedad> = {}) {
    Object.assign(this, partial);
  }
} 