import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpClientModule } from '@angular/common/http';

type EstadoEntrega = 'entregado' | 'no_entregado';

interface FacturaFormularioPayload {
  numero_factura: string;
  nombre_cliente: string;
  observaciones: string;
  estado: EstadoEntrega;
  fecha_entrega: string | null; // YYYY-MM-DD
}

@Component({
  selector: 'app-material-pendiente',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="novedades-container">
      <h2>Material pendiente por entregar</h2>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-header">
          <mat-form-field>
            <mat-label>Agregar número de factura</mat-label>
            <input matInput formControlName="numero_factura" />
            <mat-error *ngIf="c('numero_factura').hasError('required')">
              Este campo es obligatorio
            </mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Nombre del cliente</mat-label>
            <input matInput formControlName="nombre_cliente" />
            <mat-error *ngIf="c('nombre_cliente').hasError('required')">
              Este campo es obligatorio
            </mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Observaciones</mat-label>
            <textarea matInput rows="3" formControlName="observaciones"></textarea>
            <mat-error *ngIf="c('observaciones').hasError('required')">
              Este campo es obligatorio
            </mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option [value]="'no_entregado'">No entregado</mat-option>
              <mat-option [value]="'entregado'">Entregado</mat-option>
            </mat-select>
            <mat-error *ngIf="c('estado').hasError('required')">
              Este campo es obligatorio
            </mat-error>
          </mat-form-field>

          <mat-form-field *ngIf="mostrarFechaEntrega" class="fade-in">
            <mat-label>Fecha de entrega</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha_entrega" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="c('fecha_entrega').hasError('required')">
              La fecha de entrega es obligatoria cuando el estado es "Entregado"
            </mat-error>
          </mat-form-field>
        </div>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || loading">
            <mat-icon>save</mat-icon>
            {{ loading ? 'Guardando...' : 'Guardar' }}
          </button>

          <button mat-stroked-button type="button" (click)="reset()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Limpiar
          </button>
        </div>
      </form>
    </div>
  `,
  // Estilos mínimos para quedar igual al layout de "novedades" (grid/spacing). Si ya los tienes globales, puedes quitar esto.
  styles: [`
    .novedades-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 2rem auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,.08);
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }
    .novedades-container h2 {
      color: #1976d2;
      font-size: 1.8rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 3px solid #1976d2;
      text-align: center;
      font-weight: 500;
    }
    .form-header {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
    }
    mat-form-field { width: 100%; }
    .actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    .fade-in { animation: fadeIn .25s ease-in; }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @media (max-width: 768px) {
      .form-header { grid-template-columns: 1fr; gap: 1rem; }
      .actions { justify-content: stretch; flex-direction: column; }
    }
  `],
})
export class MaterialPendienteComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // ✅ Ajusta esto a tu backend real
  private readonly API_BASE_URL = 'http://localhost:3000/facturas-formulario';

  form!: FormGroup;
  loading = false;
  mostrarFechaEntrega = false;

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      numero_factura: ['', [Validators.required, Validators.maxLength(50)]],
      nombre_cliente: ['', [Validators.required, Validators.maxLength(200)]],
      observaciones: ['', [Validators.required]],
      estado: ['no_entregado' as EstadoEntrega, [Validators.required]],
      fecha_entrega: [null as Date | null],
    });

    // ✅ Mostrar/ocultar fecha + validación condicional
    this.form.get('estado')!
      .valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((estado: EstadoEntrega) => {
        this.mostrarFechaEntrega = estado === 'entregado';

        const fechaCtrl = this.form.get('fecha_entrega')!;
        if (estado === 'entregado') {
          fechaCtrl.setValidators([Validators.required]);
        } else {
          fechaCtrl.clearValidators();
          fechaCtrl.setValue(null);
        }
        fechaCtrl.updateValueAndValidity({ emitEvent: false });
      });

    // Inicializar visual
    this.mostrarFechaEntrega = this.form.get('estado')!.value === 'entregado';
  }

  c(name: string): AbstractControl {
    return this.form.get(name)!;
  }

  reset(): void {
    this.form.reset({
      numero_factura: '',
      nombre_cliente: '',
      observaciones: '',
      estado: 'no_entregado',
      fecha_entrega: null,
    });
    this.mostrarFechaEntrega = false;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    try {
      const payload: FacturaFormularioPayload = {
        numero_factura: String(this.c('numero_factura').value).trim(),
        nombre_cliente: String(this.c('nombre_cliente').value).trim(),
        observaciones: String(this.c('observaciones').value).trim(),
        estado: this.c('estado').value,
        fecha_entrega: this.toDateOnly(this.c('fecha_entrega').value),
      };

      await this.http.post(this.API_BASE_URL, payload).toPromise();

      this.snackBar.open('Registro guardado exitosamente', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });

      this.reset();
    } catch (e: any) {
      console.error(e);
      this.snackBar.open('Error al guardar el registro', 'Cerrar', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    } finally {
      this.loading = false;
    }
  }

  private toDateOnly(value: Date | string | null): string | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
