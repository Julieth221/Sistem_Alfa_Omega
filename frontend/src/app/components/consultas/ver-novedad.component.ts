import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ConsultasService } from '../../services/consultas.service';
import { ImageViewerComponent } from '../consultas/image-viewer.component';
import { ProductosNovedadComponent } from '../consultas/productos-novedad/productos-novedad.component';

@Component({
  selector: 'app-ver-novedad',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="ver-novedad-container">
      <div class="header">
        <h2>Detalles de la Novedad</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="content">
        <div class="info-section">
          <h3>Información General</h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Proveedor:</label>
              <span>{{novedad.proveedor}}</span>
            </div>
            <div class="info-item">
              <label>NIT:</label>
              <span>{{novedad.nit}}</span>
            </div>
            <div class="info-item full-width">
              <label>Observaciones:</label>
              <span>{{novedad.observaciones}}</span>
            </div>
          </div>
        </div>

        <div class="images-section">
          <h3>Imágenes de Remisión Proveedor</h3>
          <div class="images-grid">
            <div *ngFor="let img of getImagenesArray(novedad.remision_proveedor_urls)"
                 class="image-item" (click)="verImagen(img)">
              <span>{{img.name}}</span>
            </div>
          </div>

          <h3>Imágenes de Estado Mercancía</h3>
          <div class="images-grid">
            <div *ngFor="let img of getImagenesArray(novedad.foto_estado_urls)"
                 class="image-item" (click)="verImagen(img)">
              <span>{{img.name}}</span>
            </div>
          </div>
        </div>

        <div class="actions">
          <button mat-raised-button color="primary" (click)="verProductos()">
            <mat-icon>list</mat-icon>
            Ver Productos
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ver-novedad-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .info-section {
      margin-bottom: 32px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-weight: 500;
      margin-bottom: 4px;
      color: rgba(0, 0, 0, 0.6);
    }

    .images-section {
      margin-bottom: 32px;
    }

    .images-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .image-item {
      padding: 8px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
    }

    @media (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }

      .ver-novedad-container {
        padding: 16px;
      }
    }
  `]
})
export class VerNovedadComponent implements OnInit {
  novedad: any;

  constructor(
    private consultasService: ConsultasService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<VerNovedadComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { novedadId: number }
  ) {}

  ngOnInit() {
    this.cargarNovedad();
  }

  cargarNovedad() {
    this.consultasService.getNovedad(this.data.novedadId).subscribe(
      (novedad: any) => {
        this.novedad = novedad;
      }
    );
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
      data: { imageUrl: imagen.url, imageTitle: imagen.name },
      width: '80%',
      maxWidth: '1200px'
    });
  }

  verProductos() {
    const dialogRef = this.dialog.open(ProductosNovedadComponent, {
      data: { novedadId: this.data.novedadId },
      width: '90%',
      maxWidth: '1400px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarNovedad();
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}