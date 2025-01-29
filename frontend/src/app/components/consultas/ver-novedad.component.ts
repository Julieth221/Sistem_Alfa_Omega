import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    <div class="dialog-container">
      <div class="header">
        <h2>Detalles de la Novedad</h2>
        <button mat-icon-button (click)="onClose()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="content-container">
        <div class="ver-novedad-container">
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
            <div class="images-container">
              <div *ngFor="let img of novedad?.remision_proveedor_urls"
                   class="image-card">
                <div class="image-preview" (click)="verImagen(img)">
                  <img [src]="img.url" [alt]="img.name">
                </div>
                <span class="image-name">{{img.name}}</span>
              </div>
            </div>

            <h3>Imágenes de Estado Mercancía</h3>
            <div class="images-container">
              <div *ngFor="let img of novedad?.foto_estado_urls"
                   class="image-card">
                <div class="image-preview" (click)="verImagen(img)">
                  <img [src]="img.url" [alt]="img.name">
                </div>
                <span class="image-name">{{img.name}}</span>
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
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      height: 90vh; /* Altura máxima del diálogo */
      max-height: 90vh;
    }

    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: white;
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }

    .content-container {
      flex: 1;
      overflow-y: auto;
      padding: 0 24px;
    }

    .ver-novedad-container {
      padding: 24px 0;
      max-width: 1200px;
      margin: 0 auto;
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

    .images-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .image-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .image-preview {
      width: 100%;
      height: 200px;
      cursor: pointer;
      overflow: hidden;
      position: relative;
    }

    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease;
    }

    .image-preview:hover img {
      transform: scale(1.05);
    }

    .image-name {
      padding: 8px 16px;
      display: block;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.87);
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      padding: 16px 0;
      position: sticky;
      bottom: 0;
      background: white;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }

    @media (max-width: 600px) {
      .dialog-container {
        height: 100vh;
      }

      .content-container {
        padding: 0 16px;
      }

      .ver-novedad-container {
        padding: 16px 0;
      }

      .info-grid {
        grid-template-columns: 1fr;
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
    this.consultasService.getNovedad(this.data.novedadId).subscribe({
      next: (novedad: any) => {
        this.novedad = {
          ...novedad,
          remision_proveedor_urls: this.parseImagenesArray(novedad.remision_proveedor_urls),
          foto_estado_urls: this.parseImagenesArray(novedad.foto_estado_urls)
        };
        console.log('Novedad cargada:', this.novedad);
      },
      error: (error) => {
        console.error('Error al cargar la novedad:', error);
      }
    });
  }

  private parseImagenesArray(urlsData: any): Array<{name: string, url: string}> {
    if (!urlsData) return [];
    
    try {
      if (Array.isArray(urlsData)) return urlsData;
      if (typeof urlsData === 'string') return JSON.parse(urlsData);
      return [];
    } catch (error) {
      console.error('Error al parsear imágenes:', error);
      return [];
    }
  }

  verImagen(imagen: any) {
    if (!imagen) return;
    
    this.dialog.open(ImageViewerComponent, {
      data: { 
        imageUrl: imagen.url, 
        imageTitle: imagen.name 
      },
      width: '40%',
      maxWidth: '400px'
    });
  }

  verProductos() {
    const dialogRef = this.dialog.open(ProductosNovedadComponent, {
      data: { novedadId: this.data.novedadId },
      width: '80%',
      maxWidth: '1200px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.cargarNovedad();
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}