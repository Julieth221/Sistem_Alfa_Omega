import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home">
      <div class="hero">
        <div class="content-container">
          <img src="assets/images/logo.png" alt="ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S." class="logo">
          <div class="company-info">
            <h1>Sistema de Gestión de Novedades</h1>
          </div>
          <button class="login-btn" (click)="navigateToLogin()">
            <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
          </button>
        </div>
      </div>
      <footer>
        <p class="copyright">© {{currentYear}} ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S. Todos los derechos reservados.</p>
      </footer>
    </div>
  `
})
export class HomeComponent {
  currentYear: number = new Date().getFullYear();

  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
} 