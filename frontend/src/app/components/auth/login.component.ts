import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <img src="assets/images/logo2.png" alt="Logo" class="login-logo">
        <h2>Iniciar Sesión</h2>
        
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              placeholder="ejemplo@correo.com"
              [class.error]="isFieldInvalid('email')"
            >
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              {{ getErrorMessage('email') }}
            </div>
          </div>

          <div class="form-group">
            <label for="password">Contraseña</label>
            <div class="password-input">
              <input 
                [type]="showPassword ? 'text' : 'password'"
                id="password" 
                formControlName="password"
                placeholder="Ingrese su contraseña"
                [class.error]="isFieldInvalid('password')"
              >
              <i 
                [class]="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"
                (click)="togglePassword()"
              ></i>
            </div>
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              {{ getErrorMessage('password') }}
            </div>
          </div>

          <div class="error-message" *ngIf="loginError">
            {{ loginError }}
          </div>

          <button type="submit" [disabled]="loginForm.invalid || isLoading">
            <i class="fas fa-spinner fa-spin" *ngIf="isLoading"></i>
            {{ isLoading ? 'Iniciando sesión...' : 'Ingresar' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getErrorMessage(field: string): string {
    const control = this.loginForm.get(field);
    
    if (!control) return '';
    
    if (field === 'email') {
      if (control.hasError('required')) return 'El correo es requerido';
      if (control.hasError('email')) return 'Ingrese un correo válido';
    }
    
    if (field === 'password') {
      if (control.hasError('required')) return 'La contraseña es requerida';
      if (control.hasError('minlength')) return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    return '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.loginError = '';

      this.authService.login(
        this.loginForm.value.email,
        this.loginForm.value.password
      ).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading = false;
          this.loginError = error.error.message || 'Error al iniciar sesión';
        }
      });
    } else {
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control) {
          control.markAsTouched();
        }
      });
    }
  }
} 