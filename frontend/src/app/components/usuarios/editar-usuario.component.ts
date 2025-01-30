import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Usuario } from '../../services/usuarios.service';

@Component({
  selector: 'app-editar-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{data.titulo}}</h2>
    <form [formGroup]="usuarioForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="apellido" required>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" required type="email">
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="rol" required>
            <mat-option value="USUARIO">Usuario</mat-option>
            <mat-option value="SUPERVISOR">Supervisor</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width" *ngIf="!data.usuario">
          <mat-label>Contraseña</mat-label>
          <input matInput formControlName="password" type="password" required>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onClose()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="!usuarioForm.valid">
          {{data.usuario ? 'Actualizar' : 'Crear'}}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
  `]
})
export class EditarUsuarioComponent {
  usuarioForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditarUsuarioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { titulo: string; usuario?: Usuario }
  ) {
    this.usuarioForm = this.fb.group({
      nombre: [data.usuario?.nombre || '', Validators.required],
      apellido: [data.usuario?.apellido || '', Validators.required],
      email: [data.usuario?.email || '', [Validators.required, Validators.email]],
      rol: [data.usuario?.rol || 'USUARIO', Validators.required],
      password: ['', data.usuario ? [] : Validators.required]
    });
  }

  onSubmit() {
    if (this.usuarioForm.valid) {
      this.dialogRef.close(this.usuarioForm.value);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
} 