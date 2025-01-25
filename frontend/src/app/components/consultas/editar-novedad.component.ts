import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConsultasService } from '../../services/consultas.service';
import { ImageViewerComponent } from '../consultas/image-viewer.component';

@Component({
  selector: 'app-editar-novedad',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <div class="editar-novedad-container">
      <div class="header">
        <h2>Editar Novedad</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="editarForm" (ngSubmit)="onSubmit()">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Número de Remisión</mat-label>
            <input matInput formControlName="numero_remision">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Remisión Factura</mat-label>
            <input matInput formControlName="remision_factura">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Fecha</mat-label>
            <input matInput type="date" formControlName="fecha">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Trabajador</mat-label>
            <input matInput formControlName="trabajador">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Proveedor</mat-label>
            <input matInput formControlName="proveedor">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>NIT</mat-label>
            <input matInput formControlName="nit">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput formControlName="observaciones" rows="4"></textarea>
          </mat-form-field>
        </div>

        <div class="images-section">
          <h3>Imágenes de Remisión Proveedor</h3>
          <div class="images-grid">
            <div *ngFor="let img of getImagenesArray(novedad?.remision_proveedor_urls)"
                 class="image-item" (click)="verImagen(img)">
              <span>{{img.name}}</span>
            </div>
          </div>

          <h3>Imágenes de Estado Mercancía</h3>
          <div class="images-grid">
            <div *ngFor="let img of getImagenesArray(novedad?.foto_estado_urls)"
                 class="image-item" (click)="verImagen(img)">
              <span>{{img.name}}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button mat-button type="button" (click)="onClose()">Cancelar</button>
          <button mat-raised-button type="button" color="accent" (click)="enviarCorreo()">
            <mat-icon>email</mat-icon>
            Enviar Correo
          </button>
          <button mat-raised-button color="primary" type="submit" [disabled]="!editarForm.valid">
            <mat-icon>save</mat-icon>
            Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .editar-novedad-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .images-section {
      margin-bottom: 24px;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .image-item {
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .editar-novedad-container {
        padding: 16px;
      }

      .actions {
        flex-direction: column;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class EditarNovedadComponent implements OnInit {
  editarForm: FormGroup;
  novedad: any;

  constructor(
    private fb: FormBuilder,
    private consultasService: ConsultasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<EditarNovedadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { novedad: any }
  ) {
    this.editarForm = this.fb.group({
      numero_remision: ['', Validators.required],
      remision_factura: ['', Validators.required],
      fecha: ['', Validators.required],
      trabajador: ['', Validators.required],
      proveedor: ['', Validators.required],
      nit: ['', Validators.required],
      observaciones: ['']
    });
  }

  ngOnInit() {
    this.novedad = this.data.novedad;
    if (this.novedad) {
      this.editarForm.patchValue({
        numero_remision: this.novedad.numero_remision,
        remision_factura: this.novedad.remision_factura,
        fecha: this.formatDate(this.novedad.fecha),
        trabajador: this.novedad.trabajador,
        proveedor: this.novedad.proveedor,
        nit: this.novedad.nit,
        observaciones: this.novedad.observaciones
      });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toISOString().split('T')[0];
  }

  getImagenesArray(urlsString: string): any[] {
    try {
      return JSON.parse(urlsString) || [];
    } catch {
      return [];
    }
  }

  verImagen(imagen: any) {
    this.dialog.open(ImageViewerComponent, {
      data: { imageUrl: imagen.url, imageTitle: imagen.name },
      width: '80%',
      maxWidth: '1200px'
    });
  }

  enviarCorreo() {
    this.consultasService.enviarCorreo(this.novedad.id).subscribe(
      () => {
        this.snackBar.open('Correo enviado exitosamente', 'Cerrar', {
          duration: 3000
        });
      },
      error => {
        this.snackBar.open('Error al enviar el correo', 'Cerrar', {
          duration: 3000
        });
      }
    );
  }

  onSubmit() {
    if (this.editarForm.valid) {
      const novedadActualizada = {
        ...this.editarForm.value,
        id: this.novedad.id
      };

      this.consultasService.actualizarNovedad(this.novedad.id, novedadActualizada)
        .subscribe(
          () => {
            this.snackBar.open('Novedad actualizada exitosamente', 'Cerrar', {
              duration: 3000
            });
            this.dialogRef.close(true);
          },
          error => {
            this.snackBar.open('Error al actualizar la novedad', 'Cerrar', {
              duration: 3000
            });
          }
        );
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}