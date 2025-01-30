import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Usuario } from '../../services/usuarios.service';
import { passwordMatchValidator } from '../../validators/password-match.validator';

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
          <mat-error *ngIf="usuarioForm.get('nombre')?.hasError('required')">
            El nombre es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Apellido</mat-label>
          <input matInput formControlName="apellido" required>
          <mat-error *ngIf="usuarioForm.get('apellido')?.hasError('required')">
            El apellido es requerido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" required type="email">
          <mat-error *ngIf="usuarioForm.get('email')?.hasError('required')">
            El email es requerido
          </mat-error>
          <mat-error *ngIf="usuarioForm.get('email')?.hasError('email')">
            Por favor ingrese un email válido
          </mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Rol</mat-label>
          <mat-select formControlName="rol" required>
            <mat-option value="ADMIN">Administrador</mat-option>
            <mat-option value="SUPERVISOR">Supervisor</mat-option>
            <mat-option value="USUARIO">Usuario</mat-option>
          </mat-select>
          <mat-error *ngIf="usuarioForm.get('rol')?.hasError('required')">
            El rol es requerido
          </mat-error>
        </mat-form-field>

        <ng-container *ngIf="!data.usuario">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput formControlName="password" type="password" required>
            <mat-error *ngIf="usuarioForm.get('password')?.hasError('required')">
              La contraseña es requerida
            </mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirmar Contraseña</mat-label>
            <input matInput formControlName="confirmPassword" type="password" required>
            <mat-error *ngIf="usuarioForm.get('confirmPassword')?.hasError('required')">
              La confirmación de contraseña es requerida
            </mat-error>
            <mat-error *ngIf="usuarioForm.hasError('passwordMismatch')">
              Las contraseñas no coinciden
            </mat-error>
          </mat-form-field>
        </ng-container>
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
    mat-dialog-content {
      min-width: 350px;
      max-height: 80vh;
      padding: 20px;
    }
    mat-dialog-actions {
      padding: 20px;
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
      nombre: [data.usuario?.nombre || '', [Validators.required, Validators.minLength(2)]],
      apellido: [data.usuario?.apellido || '', [Validators.required, Validators.minLength(2)]],
      email: [data.usuario?.email || '', [Validators.required, Validators.email]],
      rol: [data.usuario?.rol || 'USUARIO', Validators.required],
      password: ['', data.usuario ? [] : [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', data.usuario ? [] : [Validators.required]]
    }, { validators: data.usuario ? [] : [passwordMatchValidator] });
  }

  onSubmit() {
    if (this.usuarioForm.valid) {
      const formValue = { ...this.usuarioForm.value };
      delete formValue.confirmPassword; // Eliminar confirmPassword antes de enviar
      this.dialogRef.close(formValue);
    }
  }

  onClose() {
    this.dialogRef.close();
  }
} 