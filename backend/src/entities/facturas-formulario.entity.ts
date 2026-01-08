
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'facturas_formulario', schema: 'SistemNovedad' })
export class FacturaFormulario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'character varying', length: 50, nullable: false })
  numero_factura!: string;

  @Column({ type: 'character varying', length: 200, nullable: false })
  nombre_cliente!: string;

  @Column({ type: 'text', nullable: false })
  observaciones!: string;

  @Column({ type: 'character varying', length: 50, nullable: false })
  estado!: string;

  @Column({ type: 'date', nullable: true })
  fecha_entrega!: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
  update_at!: Date;
}
