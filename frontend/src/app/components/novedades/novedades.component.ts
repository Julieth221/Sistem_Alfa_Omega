import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { PreviewPdfComponent } from './preview-pdf.component';
import { NovedadesService } from '../../services/novedades.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-novedades',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <div class="novedades-container">
      <h2>Registro de Novedades</h2>
      
      <form [formGroup]="novedadForm" (ngSubmit)="onSubmit()">
        <div class="form-header">
          <mat-form-field>
            <mat-label>N° DE REMISIÓN</mat-label>
            <input matInput [value]="numeroRemision" readonly>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Fecha</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>

        <div formArrayName="productos">
          <div *ngFor="let producto of productos.controls; let i=index" [formGroupName]="i">
            <div class="producto-container">
              <mat-form-field class="referencia-field">
                <mat-label>Referencia del producto</mat-label>
                <input matInput formControlName="referencia">
              </mat-form-field>

              <div class="cantidad-novedad">
                <h4>Cantidad de la novedad</h4>
                <mat-checkbox formControlName="cantidad_m2">M2</mat-checkbox>
                <mat-checkbox formControlName="cantidad_cajas">CAJAS</mat-checkbox>
                <mat-checkbox formControlName="cantidad_unidades">UNIDADES</mat-checkbox>
              </div>

              <div class="tipo-novedad">
                <h4>Tipo de novedad</h4>
                <mat-checkbox formControlName="roturas">Roturas</mat-checkbox>
                <mat-checkbox formControlName="desportillado">Desportillado</mat-checkbox>
                <mat-checkbox formControlName="golpeado">Golpeado</mat-checkbox>
                <mat-checkbox formControlName="rayado">Rayado</mat-checkbox>
                <mat-checkbox formControlName="incompleto">Incompleto</mat-checkbox>
                <mat-checkbox formControlName="loteado">Loteado</mat-checkbox>
                <mat-checkbox formControlName="otro">Otro</mat-checkbox>
              </div>

              <div class="descripcion-accion-container">
                <mat-form-field class="descripcion-field">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="5"></textarea>
                </mat-form-field>

                <mat-form-field class="accion-field">
                  <mat-label>Acción Realizada</mat-label>
                  <mat-select formControlName="accion_realizada">
                    <mat-option value="rechazado_devuelto">Rechazado y Devuelto</mat-option>
                    <mat-option value="rechazado_descargado">Rechazado y Descargado</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="file-upload">
                <label>Anexar Remisión</label>
                <input type="file" (change)="onFileSelected($event, i)" accept="image/*">
              </div>
            </div>
          </div>
        </div>

        <button mat-button type="button" (click)="agregarProducto()">
          <mat-icon>add</mat-icon> Agregar otro producto
        </button>

        <div class="form-footer">
          <div class="datos-contacto">
            <mat-form-field>
              <mat-label>Diligenciado por</mat-label>
              <input matInput formControlName="diligenciado_por">
            </mat-form-field>

            <mat-form-field>
              <mat-label>Correo electrónico</mat-label>
              <input matInput formControlName="correo" type="email">
            </mat-form-field>
          </div>

          <div class="firma-digital">
            <label>Firma Digital</label>
            <div class="firma-placeholder" [class.has-image]="firmaDigitalUrl">
              <img *ngIf="firmaDigitalUrl" src="assets/images/FirmaDigital.png" alt="Firma digital">
              <span *ngIf="!firmaDigitalUrl">Haga clic para agregar firma</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button mat-raised-button color="primary" type="submit">
            <mat-icon>send</mat-icon> Enviar
          </button>
        </div>
      </form>
    </div>
  `,
})
export class NovedadesComponent implements OnInit {
  novedadForm!: FormGroup;
  numeroRemision: string = '';
  firmaDigitalUrl: string = 'assets/images/firma-digital.png';

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private novedadesService: NovedadesService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.createForm();
    this.generarNumeroRemision();
  }

  createForm() {
    this.novedadForm = this.fb.group({
      fecha: ['', Validators.required],
      productos: this.fb.array([]),
      diligenciado_por: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]]
    });
    this.agregarProducto();
  }

  get productos() {
    return this.novedadForm.get('productos') as FormArray;
  }

  agregarProducto() {
    const producto = this.fb.group({
      referencia: ['', Validators.required],
      cantidad_m2: [false],
      cantidad_cajas: [false],
      cantidad_unidades: [false],
      roturas: [false],
      desportillado: [false],
      golpeado: [false],
      rayado: [false],
      incompleto: [false],
      loteado: [false],
      otro: [false],
      descripcion: ['', Validators.required],
      accion_realizada: ['', Validators.required],
      foto_remision: [null]
    });

    this.productos.push(producto);
  }

  onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    // Aquí iría la lógica para manejar el archivo
  }

  async generarNumeroRemision() {
    try {
      // Obtener el último número de remisión de la base de datos
      const ultimaRemision = await this.novedadesService.getUltimaRemision().toPromise();
      
      if (ultimaRemision && ultimaRemision.numero_remision) {
        // Si existe una última remisión, incrementamos el número
        const numeroActual = parseInt(ultimaRemision.numero_remision.split('FNAO')[1]);
        this.numeroRemision = `FNAO${(numeroActual + 1).toString().padStart(4, '0')}`;
      } else {
        // Si no hay remisiones previas, empezamos con FNAO0001
        this.numeroRemision = 'FNAO0001';
      }
    } catch (error: any) {
      console.error('Error al generar número de remisión:', error);
      
      if (error.status === 401) {
        this.snackBar.open('Sesión expirada. Por favor, inicie sesión nuevamente', 'Cerrar', {
          duration: 5000
        });
        this.router.navigate(['/login']);
      } else {
        // En caso de error, asignamos el primer número
        this.numeroRemision = 'FNAO0001';
        this.snackBar.open('Se generó un nuevo número de remisión', 'Cerrar', {
          duration: 3000
        });
      }
    }
  }

  onSubmit() {
    if (this.novedadForm.valid) {
      const dialogRef = this.dialog.open(PreviewPdfComponent, {
        width: '800px',
        data: {
          formData: this.novedadForm.value,
          numeroRemision: this.numeroRemision
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.guardarNovedad();
        }
      });
    }
  }

  private guardarNovedad() {
    const formData = this.novedadForm.value;
    this.novedadesService.crearNovedad({
      ...formData,
      numero_remision: this.numeroRemision
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Novedad registrada con éxito', 'Cerrar', {
          duration: 3000
        });
        this.novedadForm.reset();
        this.generarNumeroRemision();
      },
      error: (error) => {
        this.snackBar.open('Error al registrar la novedad', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }
} 