import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { UsuariosService, Usuario } from '../../services/usuarios.service';
import { EditarUsuarioComponent } from './editar-usuario.component';
import { ConfirmDialogComponent } from '../consultas/confirm-dialog.component';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="usuarios-container" *ngIf="isAdmin">
      <div class="header">
        <h2>Gestión de Usuarios</h2>
        <button mat-raised-button color="primary" (click)="agregarUsuario()">
          <mat-icon>person_add</mat-icon>
          Nuevo Usuario
        </button>
      </div>

      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> ID </th>
            <td mat-cell *matCellDef="let usuario"> {{usuario.id}} </td>
          </ng-container>

          <!-- Nombre Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Nombre </th>
            <td mat-cell *matCellDef="let usuario"> {{usuario.nombre_completo}} </td>
          </ng-container>

          <!-- Email Column -->
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Email </th>
            <td mat-cell *matCellDef="let usuario"> {{usuario.email}} </td>
          </ng-container>

          <!-- Rol Column -->
          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Rol </th>
            <td mat-cell *matCellDef="let usuario">
              <mat-chip-grid>
                <mat-chip [color]="getRolColor(usuario.rol)" selected>
                  {{usuario.rol}}
                </mat-chip>
              </mat-chip-grid>
            </td>
          </ng-container>

          <!-- Estado Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Estado </th>
            <td mat-cell *matCellDef="let usuario">
              <mat-chip-grid>
                <mat-chip [color]="usuario.activo ? 'primary' : 'warn'" selected>
                  {{usuario.activo ? 'Activo' : 'Inactivo'}}
                </mat-chip>
              </mat-chip-grid>
            </td>
          </ng-container>

          <!-- Fecha Creación Column -->
          <ng-container matColumnDef="created_at">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Fecha Creación </th>
            <td mat-cell *matCellDef="let usuario"> {{usuario.created_at | date:'medium'}} </td>
          </ng-container>

          <!-- Último Login Column -->
          <ng-container matColumnDef="last_login">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Último Acceso </th>
            <td mat-cell *matCellDef="let usuario"> 
              {{usuario.last_login ? (usuario.last_login | date:'medium') : 'Sin accesos'}} 
            </td>
          </ng-container>

          <!-- Acciones Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let usuario">
              <button mat-icon-button color="primary" 
                      matTooltip="Editar usuario"
                      (click)="editarUsuario(usuario)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button [color]="usuario.activo ? 'warn' : 'primary'"
                      [matTooltip]="usuario.activo ? 'Desactivar usuario' : 'Activar usuario'"
                      (click)="toggleEstadoUsuario(usuario)">
                <mat-icon>{{usuario.activo ? 'block' : 'check_circle'}}</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]"
                      aria-label="Seleccionar página de usuarios"
                      (page)="dataSource.paginator?.firstPage()"
                      #paginator>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .usuarios-container {
      padding: 24px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;

      h2 {
        margin: 0;
        font-size: 24px;
        color: #1a237e;
      }
    }

    .table-container {
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .mat-column-acciones {
      width: 120px;
      text-align: center;
    }

    .mat-column-activo,
    .mat-column-rol {
      width: 120px;
    }

    th.mat-header-cell {
      background: #f5f5f5;
      color: rgba(0, 0, 0, 0.87);
      font-weight: 500;
      padding: 0 16px;
    }

    td.mat-cell {
      padding: 16px;
    }

    tr.mat-row:hover {
      background: #f5f5f5;
    }

    .mat-chip-list {
      pointer-events: none;
    }
  `]
})
export class UsuariosComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource: MatTableDataSource<Usuario>;
  isAdmin = false;
  displayedColumns: string[] = [
    'id', 'nombre', 'email', 'rol', 'activo', 
    'created_at', 'last_login', 'acciones'
  ];

  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource<Usuario>();
  }

  ngOnInit() {
    this.checkAdminRole();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  private checkAdminRole() {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        this.isAdmin = user?.rol === 'ADMIN';
        if (this.isAdmin) {
          this.cargarUsuarios();
        }
      },
      error: (error) => {
        console.error('Error al verificar rol:', error);
        this.snackBar.open('Error al verificar permisos', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  private cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe({
      next: (usuarios: Usuario[]) => {
        this.dataSource.data = usuarios;
      },
      error: (error: any) => {
        console.error('Error al cargar usuarios:', error);
        this.snackBar.open('Error al cargar usuarios', 'Cerrar', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  agregarUsuario() {
    const dialogRef = this.dialog.open(EditarUsuarioComponent, {
      width: '600px',
      data: { titulo: 'Nuevo Usuario' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.crearUsuario(result).subscribe({
          next: () => {
            this.snackBar.open('Usuario creado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.cargarUsuarios();
          },
          error: (error: any) => {
            console.error('Error al crear usuario:', error);
            this.snackBar.open('Error al crear usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  editarUsuario(usuario: Usuario) {
    const dialogRef = this.dialog.open(EditarUsuarioComponent, {
      width: '600px',
      data: { titulo: 'Editar Usuario', usuario }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.actualizarUsuario(usuario.id!, result).subscribe({
          next: () => {
            this.snackBar.open('Usuario actualizado exitosamente', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.cargarUsuarios();
          },
          error: (error: any) => {
            console.error('Error al actualizar usuario:', error);
            this.snackBar.open('Error al actualizar usuario', 'Cerrar', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  toggleEstadoUsuario(usuario: Usuario) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '350px',
      data: { 
        title: usuario.activo ? 'Desactivar Usuario' : 'Activar Usuario',
        message: usuario.activo ? 
          '¿Está seguro que desea desactivar este usuario?' : 
          '¿Está seguro que desea activar este usuario?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuariosService.toggleEstadoUsuario(usuario.id!, !usuario.activo).subscribe({
          next: () => {
            this.snackBar.open(
              `Usuario ${usuario.activo ? 'desactivado' : 'activado'} exitosamente`, 
              'Cerrar', 
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.cargarUsuarios();
          },
          error: (error: any) => {
            console.error('Error al actualizar estado:', error);
            this.snackBar.open(
              'Error al actualizar estado del usuario', 
              'Cerrar', 
              { duration: 3000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  getRolColor(rol: string): string {
    switch (rol) {
      case 'SUPERVISOR': return 'accent';
      case 'USUARIO': return 'primary';
      default: return 'default';
    }
  }
} 