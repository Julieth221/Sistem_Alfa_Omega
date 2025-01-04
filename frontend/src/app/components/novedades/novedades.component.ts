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

interface ApiResponse {
  message: string;
  novedad?: any;
}

// Primero definimos la interfaz para el producto
interface ProductoNovedad {
  referencia: string;
  cantidad_m2: boolean;
  cantidad_cajas: boolean;
  cantidad_unidades: boolean;
  roturas: boolean;
  desportillado: boolean;
  golpeado: boolean;
  rayado: boolean;
  incompleto: boolean;
  loteado: boolean;
  otro: boolean;
  descripcion: string;
  accion_realizada: string;
  foto_remision?: string;
  correo?: string;
}

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
    this.novedadForm = this.fb.group({
      fecha: ['', Validators.required],
      diligenciado_por: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      productos: this.fb.array([])
    });

    this.cargarUltimoNumeroRemision();
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

  async onFileSelected(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      try {
        // Verificar el tamaño del archivo
        if (file.size > 5000000) { // 5MB
          this.snackBar.open('La imagen es demasiado grande. Máximo 5MB', 'Cerrar', {
            duration: 3000
          });
          return;
        }

        // Optimizar la imagen antes de convertirla a base64
        const optimizedImage = await this.optimizeImage(file);
        const productos = this.novedadForm.get('productos') as FormArray;
        const producto = productos.at(index);
        producto.patchValue({ foto_remision: optimizedImage });
      } catch (error) {
        console.error('Error al procesar la imagen:', error);
        this.snackBar.open('Error al procesar la imagen', 'Cerrar', {
          duration: 3000
        });
      }
    }
  }

  private async optimizeImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Redimensionar si la imagen es muy grande
          if (width > 800) {
            height = Math.round((height * 800) / width);
            width = 800;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convertir a JPEG con calidad reducida
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              } else {
                reject(new Error('Error al optimizar la imagen'));
              }
            },
            'image/jpeg',
            0.6 // calidad 60%
          );
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  private async cargarUltimoNumeroRemision() {
    try {
      const resultado = await this.novedadesService.getUltimoNumeroRemision().toPromise();
      this.numeroRemision = resultado || 'FNAO0001'; // Valor por defecto si es undefined
    } catch (error) {
      console.error('Error al cargar número de remisión:', error);
      this.snackBar.open('Error al cargar número de remisión', 'Cerrar', {
        duration: 3000
      });
      this.numeroRemision = 'FNAO0001'; // Valor por defecto en caso de error
    }
  }

  async onSubmit() {
    if (this.novedadForm.valid) {
      const formData = {
        ...this.novedadForm.value,
        numero_remision: this.numeroRemision,
        diligenciado_por: this.novedadForm.get('diligenciado_por')?.value
      };

      console.log('Datos a enviar:', formData); // Debug

      const dialogRef = this.dialog.open(PreviewPdfComponent, {
        width: '800px',
        data: {
          formData,
          numeroRemision: this.numeroRemision
        }
      });

      dialogRef.afterClosed().subscribe(async result => {
        if (result?.action === 'success') {
          // Actualizar el número de remisión después de crear la novedad
          await this.cargarUltimoNumeroRemision();
          this.resetForm();
        }
      });
    }
  }

  private resetForm() {
    this.novedadForm.reset();
    while (this.productos.length) {
      this.productos.removeAt(0);
    }
    // Cargar el nuevo número de remisión después de resetear
    this.cargarUltimoNumeroRemision();
  }
} 