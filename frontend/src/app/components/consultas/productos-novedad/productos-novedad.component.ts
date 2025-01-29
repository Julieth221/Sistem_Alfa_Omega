import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConsultasService } from '../../../services/consultas.service';
import { ImageViewerComponent } from '../image-viewer.component';

@Component({
  selector: 'app-productos-novedad',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="productos-container">
      <div class="header">
        <h2>Productos de la Novedad</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="table-container mat-elevation-z8">
        <table mat-table [dataSource]="productos">
          <!-- Referencia Column -->
          <ng-container matColumnDef="referencia">
            <th mat-header-cell *matHeaderCellDef>Referencia</th>
            <td mat-cell *matCellDef="let producto">{{producto.referencia}}</td>
          </ng-container>

          <!-- Cantidad Column -->
          <ng-container matColumnDef="cantidad">
            <th mat-header-cell *matHeaderCellDef>Cantidad</th>
            <td mat-cell *matCellDef="let producto">
              <div class="cantidad-info">
                <span *ngIf="producto.cantidad_m2">{{producto.cantidad_m2}} M²</span>
                <span *ngIf="producto.cantidad_cajas">{{producto.cantidad_cajas}} Cajas</span>
                <span *ngIf="producto.cantidad_unidades">{{producto.cantidad_unidades}} Unidades</span>
              </div>
            </td>
          </ng-container>

          <!-- Tipo Novedad Column -->
          <ng-container matColumnDef="tipo_novedad">
            <th mat-header-cell *matHeaderCellDef>Tipo de Novedad</th>
            <td mat-cell *matCellDef="let producto">
              <ul class="novedad-list">
                <li *ngIf="producto.roturas">Roturas</li>
                <li *ngIf="producto.desportillado">Desportillado</li>
                <li *ngIf="producto.golpeado">Golpeado</li>
                <li *ngIf="producto.rayado">Rayado</li>
                <li *ngIf="producto.incompleto">Incompleto</li>
                <li *ngIf="producto.loteado">Loteado</li>
                <li *ngIf="producto.otro">Otro</li>
              </ul>
            </td>
          </ng-container>

          <!-- Acción Realizada Column -->
          <ng-container matColumnDef="accion_realizada">
            <th mat-header-cell *matHeaderCellDef>Acción Realizada</th>
            <td mat-cell *matCellDef="let producto">{{producto.accion_realizada}}</td>
          </ng-container>

          <!-- Descripción Column -->
          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef>Descripción</th>
            <td mat-cell *matCellDef="let producto">{{producto.descripcion}}</td>
          </ng-container>

          <!-- Fotos Remisión Column -->
          <ng-container matColumnDef="foto_remision">
            <th mat-header-cell *matHeaderCellDef>Fotos Remisión</th>
            <td mat-cell *matCellDef="let producto">
              <div class="images-grid">
                <div *ngFor="let img of getImagenesArray(producto.foto_remision_urls)" 
                     class="image-preview" 
                     (click)="verImagen(img)">
                  <img [src]="img.url" [alt]="img.name">
                  <span class="image-name">{{img.name}}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Fotos Devolución Column -->
          <ng-container matColumnDef="foto_devolucion">
            <th mat-header-cell *matHeaderCellDef>Fotos Devolución</th>
            <td mat-cell *matCellDef="let producto">
              <div class="images-grid">
                <div *ngFor="let img of getImagenesArray(producto.foto_devolucion_urls)" 
                     class="image-preview" 
                     (click)="verImagen(img)">
                  <img [src]="img.url" [alt]="img.name">
                  <span class="image-name">{{img.name}}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <div class="actions">
        <button mat-button (click)="onClose()">
          <mat-icon>arrow_back</mat-icon>
          Volver
        </button>
      </div>
    </div>
  `,
  styles: [`
    .productos-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 24px;
    }

    table {
      width: 100%;
    }

    .novedad-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .cantidad-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 8px;
      padding: 8px;
    }

    .image-preview {
      position: relative;
      cursor: pointer;
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
    }

    .image-preview img {
      width: 100%;
      height: 100px;
      object-fit: cover;
    }

    .image-name {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 4px;
      font-size: 12px;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .actions {
      display: flex;
      justify-content: flex-start;
      margin-top: 16px;
    }

    @media (max-width: 600px) {
      .productos-container {
        padding: 16px;
      }

      .mat-column-tipo_novedad,
      .mat-column-accion_realizada {
        min-width: 150px;
      }
    }
  `]
})
export class ProductosNovedadComponent implements OnInit {
  productos: any[] = [];
  displayedColumns: string[] = [
    'referencia',
    'cantidad',
    'tipo_novedad',
    'accion_realizada',
    'descripcion',
    'foto_remision',
    'foto_devolucion'
  ];

  constructor(
    private consultasService: ConsultasService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ProductosNovedadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { novedadId: number }
  ) {}

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.consultasService.getProductosNovedad(this.data.novedadId)
      .subscribe((productos: any) => {
        this.productos = productos;
      });
  }

  getImagenesArray(urlsData: any): Array<{name: string, url: string}> {
    if (!urlsData) return [];
    
    try {
      if (Array.isArray(urlsData)) return urlsData;
      return JSON.parse(urlsData);
    } catch (error) {
      console.error('Error al parsear imágenes:', error);
      return [];
    }
  }

  verImagen(imagen: {url: string, name: string}) {
    this.dialog.open(ImageViewerComponent, {
      data: { imageUrl: imagen.url, imageTitle: imagen.name },
      width: '40%',
      maxWidth: '400px'
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
} 