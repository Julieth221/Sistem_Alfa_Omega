import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ConsultasService } from '../../services/consultas.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-agregar-observacion',
  standalone: true,
     imports: [
       CommonModule,
       FormsModule,
       MatDialogModule,
       MatFormFieldModule,
       MatInputModule,
       MatButtonModule
     ],

  template: `
    <h2 mat-dialog-title>{{ data.observacion ? 'Editar Observación' : 'Agregar Observación' }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="fill" class="w-100">
        <mat-label>Observación</mat-label>
        <textarea 
          matInput 
          [(ngModel)]="observacion" 
          placeholder="Escriba su observación aquí"
          rows="4"
          required>
        </textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!observacion.trim()"
        (click)="onSave()">
        Guardar
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-form-field {
      width: 100%;
      min-width: 300px;
    }
    mat-dialog-content {
      padding-top: 20px;
    }
  `]
})
export class AgregarObservacionComponent {
  observacion: string;

  constructor(
    public dialogRef: MatDialogRef<AgregarObservacionComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private consultasService: ConsultasService,
    private snackBar: MatSnackBar
  ) {
    this.observacion = data.observacion || '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSave(): Promise<void> {
    try {
      if (!this.observacion?.trim()) {
        this.snackBar.open('Por favor, ingrese una observación', 'Cerrar', {
          duration: 3000
        });
        return;
      }

      let result;
      if (this.data.observacionId) {
        // Editar observación existente
        result = await this.consultasService
          .actualizarObservacion(this.data.observacionId, this.observacion.trim())
          .toPromise();
      } else {
        // Agregar nueva observación
        result = await this.consultasService
          .agregarObservacion(this.data.novedadId, this.observacion.trim())
          .toPromise();
      }

      this.dialogRef.close(result);
    } catch (error) {
      console.error('Error al guardar observación:', error);
      this.snackBar.open(
        'Error al guardar la observación',
        'Cerrar',
        { duration: 3000 }
      );
    }
  }
}