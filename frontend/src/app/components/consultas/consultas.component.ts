import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ConsultasService } from '../../services/consultas.service';
import { ImageViewerComponent } from '../shared/image-viewer.component';
import { ProductosNovedadComponent } from './productos-novedad.component';
import { EditarNovedadComponent } from './editar-novedad.component';

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
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule
  ],
  template: `
    <div class="consultas-container">
      <h2>Consulta de Formatos</h2>

      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar por N° de Remisión</mat-label>
        <input matInput (keyup)="applyFilter($event)" placeholder="Ej. FNAO0001" #input>
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <div class="mat-elevation-z8">
        <table mat-table [dataSource]="dataSource" matSort>
          <!-- Remisión Factura Column -->
          <ng-container matColumnDef="remision_factura">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> N° Remisión </th>
            <td mat-cell *matCellDef="let row"> {{row.remision_factura}} </td>
          </ng-container>

          <!-- Fecha Column -->
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Fecha </th>
            <td mat-cell *matCellDef="let row"> {{row.fecha | date}} </td>
          </ng-container>

          <!-- Proveedor Column -->
          <ng-container matColumnDef="proveedor">
            <th mat-header-cell *matHeaderCellDef mat-sort-header> Proveedor </th>
            <td mat-cell *matCellDef="let row"> {{row.proveedor}} </td>
          </ng-container>

          <!-- Imágenes Remisión Column -->
          <ng-container matColumnDef="remision_proveedor_urls">
            <th mat-header-cell *matHeaderCellDef> Imágenes Remisión </th>
            <td mat-cell *matCellDef="let row">
              <div *ngFor="let img of getImagenesArray(row.remision_proveedor_urls)">
                <a (click)="verImagen(img)">{{img.name}}</a>
              </div>
            </td>
          </ng-container>

          <!-- Imágenes Estado Column -->
          <ng-container matColumnDef="foto_estado_urls">
            <th mat-header-cell *matHeaderCellDef> Imágenes Estado </th>
            <td mat-cell *matCellDef="let row">
              <div *ngFor="let img of getImagenesArray(row.foto_estado_urls)">
                <a (click)="verImagen(img)">{{img.name}}</a>
              </div>
            </td>
          </ng-container>

          <!-- Observaciones Column -->
          <ng-container matColumnDef="observaciones">
            <th mat-header-cell *matHeaderCellDef> Observaciones </th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button (click)="agregarObservacion(row)">
                <mat-icon>comment</mat-icon>
              </button>
            </td>
          </ng-container>

          <!-- Acciones Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let row">
              <button mat-icon-button color="primary" (click)="editarNovedad(row)">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="verProductos(row)">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="eliminarNovedad(row)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Seleccionar página"></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .consultas-container {
      padding: 20px;
    }

    .search-field {
      width: 100%;
      max-width: 500px;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
    }

    .mat-column-acciones {
      width: 120px;
      text-align: center;
    }

    a {
      color: #1976d2;
      cursor: pointer;
      text-decoration: underline;
    }

    .mat-elevation-z8 {
      overflow-x: auto;
    }
  `]
})
export class ConsultasComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<any>;

  dataSource: any;
  displayedColumns: string[] = [
    'remision_factura',
    'fecha',
    'proveedor',
    'remision_proveedor_urls',
    'foto_estado_urls',
    'observaciones',
    'acciones'
  ];

  constructor(
    private consultasService: ConsultasService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    this.consultasService.getNovedades().subscribe(data => {
      this.dataSource = data;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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

  verProductos(novedad: any) {
    this.dialog.open(ProductosNovedadComponent, {
      data: { novedadId: novedad.id },
      width: '90%',
      maxWidth: '1400px'
    });
  }

  editarNovedad(novedad: any) {
    const dialogRef = this.dialog.open(EditarNovedadComponent, {
      data: { novedad },
      width: '90%',
      maxWidth: '1400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  agregarObservacion(novedad: any) {
    // Implementar diálogo para agregar observación
  }

  eliminarNovedad(novedad: any) {
    // Implementar confirmación y eliminación
  }
} 