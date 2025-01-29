import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ConsultasService } from '../../services/consultas.service';
import { ImageViewerComponent } from '../consultas/image-viewer.component';
import { ProductosNovedadComponent } from '../consultas/productos-novedad/productos-novedad.component';
import { EditarNovedadComponent } from '../consultas/editar-novedad.component';
import { VerNovedadComponent } from '../consultas/ver-novedad.component';
import { ConfirmDialogComponent } from '../consultas/confirm-dialog.component';
import { AgregarObservacionComponent } from '../consultas/agregar-observacion.component';

@Component({
  selector: 'app-consultas',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule
  ],
  template: `
    <div class="consultas-container">
       <div class="header">
        <h2>Consulta de Novedades</h2>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Filtrar por Remisión Factura</mat-label>
            <input matInput [(ngModel)]="filtroRemision" (keyup)="aplicarFiltro()">
            <button mat-icon-button matSuffix (click)="limpiarFiltro()" *ngIf="filtroRemision">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>
        </div>
      </div>

      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Columnas definidas anteriormente -->
          <ng-container matColumnDef="numero_remision">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>N° Remisión</th>
            <td mat-cell *matCellDef="let row">{{row.numero_remision}}</td>
          </ng-container>

          <ng-container matColumnDef="remision_factura">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Remisión Factura</th>
            <td mat-cell *matCellDef="let row">{{row.remision_factura}}</td>
          </ng-container>

        <!-- Fecha -->
        <ng-container matColumnDef="fecha">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha</th>
          <td mat-cell *matCellDef="let row">{{row.fecha | date:'dd/MM/yyyy'}}</td>
        </ng-container>

        <!-- Trabajador -->
        <ng-container matColumnDef="trabajador">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Diligenciado por</th>
          <td mat-cell *matCellDef="let row">{{row.trabajador}}</td>
        </ng-container>

          <ng-container matColumnDef="aprobado_por">
            <th mat-header-cell *matHeaderCellDef>Aprobado Por</th>
            <td mat-cell *matCellDef="let row">{{row.aprobado_por}}</td>
          </ng-container>

          <ng-container matColumnDef="correo">
            <th mat-header-cell *matHeaderCellDef>Correo</th>
            <td mat-cell *matCellDef="let row">{{row.productos[0]?.correo}}</td>
          </ng-container>

          <ng-container matColumnDef="observaciones">
            <th mat-header-cell *matHeaderCellDef>Observaciones</th>
            <td mat-cell *matCellDef="let row">
              <div class="observaciones-container">
                <div *ngFor="let obs of row.observaciones" class="observacion-item">
                  <span>{{obs.observacion}}</span>
                  <small>{{obs.created_at | date:'dd/MM/yyyy HH:mm'}}</small>
                </div>
                <button mat-icon-button (click)="agregarObservacion(row)" matTooltip="Agregar observación">
                  <mat-icon>add_comment</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let row">
              <div class="acciones-container">
                <button mat-icon-button color="primary" (click)="verNovedad(row)" matTooltip="Ver Novedad">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" (click)="confirmarEdicion(row)" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button color="warn" (click)="confirmarEliminacion(row)" matTooltip="Eliminar">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" 
                      [pageSize]="10"
                      showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .consultas-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 20px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 80%;
    }

    .observaciones-container {
      max-width: 300px;
    }

    .observacion-item {
      display: flex;
      flex-direction: column;
      margin-bottom: 8px;
      
      small {
        color: rgba(0, 0, 0, 0.54);
      }
    }

    .acciones-container {
      display: flex;
      gap: 8px;
    }

    mat-form-field {
      width: 80%;
      max-width: 300px;
    }

    @media (max-width: 600px) {
      .consultas-container {
        padding: 16px;
      }

      .filters {
       flex-direction: column;
        align-items: stretch;
      } 

      mat-form-field {
        max-width: none;
      }
    }
  `]
})
export class ConsultasComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  dataSource: any[] = [];
  displayedColumns: string[] = [
    'numero_remision',
    'remision_factura',
    'fecha',
    'trabajador',
    'aprobado_por',
    'correo',
    'observaciones',
    'acciones'
  ];

  filtroRemision: string = '';
  loading: boolean = false;

  constructor(
    private consultasService: ConsultasService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // No cargar datos inicialmente
    this.dataSource = [];
  }

  aplicarFiltro() {
    if (!this.filtroRemision.trim()) {
      this.snackBar.open('Por favor ingrese un número de remisión', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.consultasService.getNovedades(this.filtroRemision).subscribe({
      next: (response) => {
        this.dataSource = response;
        this.loading = false;
        if (response.length === 0) {
          this.snackBar.open('No se encontraron novedades', 'Cerrar', {
            duration: 3000
          });
        }
      },
      error: (error) => {
        console.error('Error:', error);
        this.loading = false;
        this.snackBar.open('Error al buscar la novedad', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  limpiarFiltro() {
    this.filtroRemision = '';
    this.dataSource = []; // Limpiar la tabla
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
      data: { imageUrl: imagen.url },
      width: '80%',
      maxWidth: '1200px'
    });
  }

  verNovedad(novedad: any) {
    const dialogRef = this.dialog.open(VerNovedadComponent, {
      data: { novedadId: novedad.id },
      width: '50%',
      maxWidth: '1200px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.aplicarFiltro();
    });
  }

  editarNovedad(novedad: any) {
    const dialogRef = this.dialog.open(EditarNovedadComponent, {
      width: '60%',
      maxWidth: '1200px',
      data: { novedad: novedad }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.aplicarFiltro(); // Recargar datos
        this.snackBar.open('Novedad actualizada exitosamente', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  confirmarEdicion(novedad: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Edición',
        message: '¿Está seguro que desea editar esta novedad?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.editarNovedad(novedad);
      }
    });
  }

  confirmarEliminacion(novedad: any) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: '¿Está seguro que desea eliminar esta novedad?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.eliminarNovedad(novedad);
      }
    });
  }

  eliminarNovedad(novedad: any) {
    this.consultasService.eliminarNovedad(novedad.id).subscribe(
      () => {
        this.aplicarFiltro();
        this.snackBar.open('Novedad eliminada exitosamente', 'Cerrar', {
          duration: 3000
        });
      },
      error => {
        this.snackBar.open('Error al eliminar la novedad', 'Cerrar', {
          duration: 3000
        });
      }
    );
  }

  agregarObservacion(novedad: any) {
    const dialogRef = this.dialog.open(AgregarObservacionComponent, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(observacion => {
      if (observacion) {
        this.consultasService.agregarObservacion(novedad.id, observacion).subscribe(
          () => {
            this.aplicarFiltro();
            this.snackBar.open('Observación agregada exitosamente', 'Cerrar', {
              duration: 3000
            });
          },
          error => {
            this.snackBar.open('Error al agregar la observación', 'Cerrar', {
              duration: 3000
            });
          }
        );
      }
    });
  }
} 