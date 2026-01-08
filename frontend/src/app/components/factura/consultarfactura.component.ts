import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';

type EstadoEntrega = 'entregado' | 'no_entregado';

interface FacturaFormulario {
  id: number;
  numero_factura: string;
  nombre_cliente: string;
  observaciones: string;
  estado: EstadoEntrega;
  fecha_entrega: string | null; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-consultar-factura',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="consultas-container">
      <div class="header">
        <h2>Consulta de facturas</h2>

        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Filtrar por número de factura</mat-label>
            <input
              matInput
              [(ngModel)]="filtroNumeroFactura"
              placeholder="Ej: FAC-001"
            />
            <button mat-icon-button matSuffix (click)="limpiarNumero()" *ngIf="filtroNumeroFactura">
              <mat-icon>close</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filtrar por estado</mat-label>
            <mat-select [(ngModel)]="filtroEstado">
              <mat-option [value]="''">Todos</mat-option>
              <mat-option [value]="'no_entregado'">No entregado</mat-option>
              <mat-option [value]="'entregado'">Entregado</mat-option>
            </mat-select>
          </mat-form-field>

          <button mat-raised-button color="primary" (click)="aplicarFiltro()" [disabled]="loading">
            <mat-icon>search</mat-icon>
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>

          <button mat-stroked-button (click)="limpiarFiltros()" [disabled]="loading">
            <mat-icon>refresh</mat-icon>
            Limpiar
          </button>
        </div>
      </div>

      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="dataSource" matSort>

          <ng-container matColumnDef="numero_factura">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Número factura</th>
            <td mat-cell *matCellDef="let row">{{ row.numero_factura }}</td>
          </ng-container>

          <ng-container matColumnDef="nombre_cliente">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Cliente</th>
            <td mat-cell *matCellDef="let row">{{ row.nombre_cliente }}</td>
          </ng-container>

          <ng-container matColumnDef="observaciones">
            <th mat-header-cell *matHeaderCellDef>Observaciones</th>
            <td mat-cell *matCellDef="let row" class="observaciones-cell">
              {{ row.observaciones }}
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Estado</th>
            <td mat-cell *matCellDef="let row">
              <span class="badge" [class.ok]="row.estado === 'entregado'" [class.pending]="row.estado === 'no_entregado'">
                {{ row.estado === 'entregado' ? 'Entregado' : 'No entregado' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="fecha_entrega">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Fecha entrega</th>
            <td mat-cell *matCellDef="let row">
              {{ row.fecha_entrega ? (row.fecha_entrega | date:'dd/MM/yyyy') : '-' }}
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div class="empty" *ngIf="!loading && dataSource.data.length === 0">
          No hay resultados con los filtros actuales.
        </div>

        <mat-paginator
          [pageSizeOptions]="[5, 10, 25, 100]"
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
      font-family: Roboto, "Helvetica Neue", sans-serif;
    }
    .header { margin-bottom: 20px; }
    h2 {
      color: #1976d2;
      font-weight: 500;
      margin: 0 0 12px 0;
    }
    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }
    mat-form-field {
      width: 80%;
      max-width: 320px;
    }
    .table-container {
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }
    table { width: 100%; }
    .observaciones-cell { max-width: 420px; white-space: normal; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge.ok { background: rgba(76, 175, 80, 0.15); color: #2e7d32; }
    .badge.pending { background: rgba(244, 67, 54, 0.10); color: #c62828; }
    .empty {
      padding: 16px;
      color: rgba(0,0,0,.6);
    }
    @media (max-width: 600px) {
      .consultas-container { padding: 16px; }
      .filters { flex-direction: column; align-items: stretch; }
      mat-form-field { max-width: none; width: 100%; }
    }
  `],
})
export class ConsultarFacturaComponent implements OnInit {
  // ✅ Ajusta esto a tu backend real
  private readonly API_BASE_URL = 'http://localhost:3000/facturas-formulario';

  displayedColumns: Array<keyof Pick<FacturaFormulario,
    'numero_factura' | 'nombre_cliente' | 'observaciones' | 'estado' | 'fecha_entrega'
  >> = ['numero_factura', 'nombre_cliente', 'observaciones', 'estado', 'fecha_entrega'];

  dataSource = new MatTableDataSource<FacturaFormulario>([]);
  loading = false;

  filtroNumeroFactura = '';
  filtroEstado: '' | EstadoEntrega = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  limpiarNumero(): void {
    this.filtroNumeroFactura = '';
    this.aplicarFiltro();
  }

  limpiarFiltros(): void {
    this.filtroNumeroFactura = '';
    this.filtroEstado = '';
    this.aplicarFiltro();
  }

  aplicarFiltro(): void {
    // Mantiene el comportamiento “tipo consultas.component.ts”: al filtrar, recarga.
    if (this.paginator) this.paginator.firstPage();
    this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.loading = true;
    try {
      let params = new HttpParams();

      const nf = this.filtroNumeroFactura?.trim();
      const estadoFiltro = this.filtroEstado;

      // Si no hay filtros activos, vaciar la tabla y no hacer llamada a la API
      if (!nf && !estadoFiltro) {
        this.dataSource.data = [];
        this.loading = false;
        return;
      }

      if (nf) params = params.set('numero_factura', nf);

      if (estadoFiltro) params = params.set('estado', estadoFiltro);

      const data = await this.http
        .get<FacturaFormulario[]>(this.API_BASE_URL, { params })
        .toPromise();

      this.dataSource.data = Array.isArray(data) ? data : [];
    } catch (e: any) {
      console.error(e);
      this.snackBar.open('Error al consultar facturas', 'Cerrar', {
        duration: 3500,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
      this.dataSource.data = [];
    } finally {
      this.loading = false;
    }
  }
}
