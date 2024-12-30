import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <nav class="sidebar">
        <div class="sidebar-header">
          <img src="assets/images/logo.png" alt="Logo" class="logo">
          <h3>{{ currentUser?.nombre }} {{ currentUser?.apellido }}</h3>
          <p>{{ currentUser?.rol }}</p>
        </div>
        
        <ul class="nav-links">
          <li>
            <a routerLink="./novedades" routerLinkActive="active">
              <i class="fas fa-file-alt"></i> Registro de Novedades
            </a>
          </li>
          <li>
            <a routerLink="./consultas" routerLinkActive="active">
              <i class="fas fa-search"></i> Consulta de Formatos
            </a>
          </li>
          <ng-container *ngIf="isAdmin">
            <li>
              <a routerLink="./usuarios" routerLinkActive="active">
                <i class="fas fa-users"></i> Gestión de Usuarios
              </a>
            </li>
          </ng-container>
        </ul>

        <div class="sidebar-footer">
          <button (click)="logout()" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Cerrar Sesión
          </button>
        </div>
      </nav>

      <main class="content">
        <header class="content-header">
          <h2>Sistema de Gestión de Novedades</h2>
        </header>
        
        <div class="content-body">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent {
  currentUser: User | null = null;
  isAdmin: boolean = false;

  constructor(private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.rol === 'ADMIN';
    });
  }

  logout(): void {
    this.authService.logout();
  }
} 