import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NovedadesService } from '../../services/novedades.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-preview-pdf',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="preview-title">Vista previa del formato</h2>
    <mat-dialog-content>
      <div class="preview-content">
        <h3 class="main-title">Mercancía con Problemas en la Recepción</h3>
        
        <div class="header-info">
          <div class="info-row">
            <p><strong>N° DE REMISIÓN:</strong> {{ data.numeroRemision }}</p>
            <p><strong>FECHA:</strong> {{ data.formData.fecha | date:'dd/MM/yyyy' }}</p>
          </div>
        </div>

        <div class="productos-list">
          <div *ngFor="let producto of data.formData.productos" class="producto-item">
            <div class="producto-header">
              <h4>Producto</h4>
              <p class="referencia"><strong>Referencia:</strong> {{ producto.referencia }}</p>
            </div>
            
            <div class="detalles-grid">
              <div class="detalle-section">
                <p class="section-title"><strong>Cantidad de la novedad:</strong></p>
                <ul class="check-list">
                  <li *ngIf="producto.cantidad_m2" class="check-item">M2</li>
                  <li *ngIf="producto.cantidad_cajas" class="check-item">CAJAS</li>
                  <li *ngIf="producto.cantidad_unidades" class="check-item">UNIDADES</li>
                </ul>
              </div>

              <div class="detalle-section">
                <p class="section-title"><strong>Tipo de novedad:</strong></p>
                <ul class="check-list">
                  <li *ngIf="producto.roturas" class="check-item">Roturas</li>
                  <li *ngIf="producto.desportillado" class="check-item">Desportillado</li>
                  <li *ngIf="producto.golpeado" class="check-item">Golpeado</li>
                  <li *ngIf="producto.rayado" class="check-item">Rayado</li>
                  <li *ngIf="producto.incompleto" class="check-item">Incompleto</li>
                  <li *ngIf="producto.loteado" class="check-item">Loteado</li>
                  <li *ngIf="producto.otro" class="check-item">Otro</li>
                </ul>
              </div>
            </div>

            <div class="producto-footer">
              <p class="descripcion"><strong>Descripción:</strong> {{ producto.descripcion }}</p>
              <p class="accion"><strong>Acción realizada:</strong> {{ formatearAccion(producto.accion_realizada) }}</p>
              
              <div *ngIf="producto.foto_remision" class="imagen-container">
                <p class="image-title"><strong>Imagen de remisión:</strong></p>
                <img [src]="producto.foto_remision" alt="Foto de remisión" class="remision-image">
              </div>
            </div>
          </div>
        </div>

        <div class="footer-info">
          <p><strong>Diligenciado por:</strong> {{ data.formData.diligenciado_por }}</p>
          <div class="firma">
            <img *ngIf="firmaDigitalUrl" src="assets/images/FirmaDigital.png" alt="Firma digital" class="firma-image">
            <p>Representante ALFA Y OMEGA</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onModificar()" [disabled]="enviando">
        <mat-icon>edit</mat-icon> Modificar
      </button>
      <button mat-raised-button color="primary" (click)="onEnviar()" [disabled]="enviando">
        <mat-icon>send</mat-icon> {{ enviando ? 'Procesando...' : 'Enviar correo' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
    }

    .preview-title {
      color: #016165;
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #016165;
    }

    .main-title {
      color: #016165;
      text-align: center;
      margin-bottom: 2rem;
    }

    .header-info {
      background-color: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);

      .info-row {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
      }
    }

    .productos-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .producto-item {
      background-color: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);

      .producto-header {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 1rem;
        margin-bottom: 1rem;

        h4 {
          color: #016165;
          margin: 0 0 0.5rem 0;
        }
      }

      .detalles-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin: 1rem 0;
      }

      .section-title {
        color: #016165;
        margin-bottom: 0.5rem;
      }

      .check-list {
        list-style: none;
        padding: 0;
        margin: 0;

        .check-item {
          padding: 0.25rem 0;
          display: flex;
          align-items: center;
          
          &:before {
            content: "✓";
            color: #016165;
            margin-right: 0.5rem;
          }
        }
      }
    }

    .producto-footer {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;

      .descripcion, .accion {
        margin-bottom: 0.5rem;
      }
    }

    .imagen-container {
      margin-top: 1rem;
      
      .image-title {
        margin-bottom: 0.5rem;
      }

      .remision-image {
        max-width: 300px;
        max-height: 200px;
        object-fit: contain;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }
    }

    .footer-info {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 2px solid #016165;
      text-align: center;

      .firma {
        margin-top: 1.5rem;
        
        .firma-image {
          max-width: 150px;
          margin-bottom: 0.5rem;
        }

        p {
          color: #016165;
          font-weight: bold;
        }
      }
    }

    mat-dialog-actions {
      padding: 1rem;
      border-top: 1px solid #e0e0e0;
      margin-top: 1rem;
    }
  `]
})
export class PreviewPdfComponent {
  firmaDigitalUrl = 'assets/firma-digital.png';
  enviando = false;

  constructor(
    public dialogRef: MatDialogRef<PreviewPdfComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private novedadesService: NovedadesService,
    private snackBar: MatSnackBar
  ) {}

  formatearAccion(accion: string): string {
    return accion === 'rechazado_devuelto' ? 'Rechazado y Devuelto' : 'Rechazado y Descargado';
  }

  onModificar(): void {
    this.dialogRef.close({ action: 'modificar' });
  }

  async onEnviar(): Promise<void> {
    this.enviando = true;
    try {
      const result = await this.novedadesService.createNovedad(this.data.formData).toPromise();
      this.snackBar.open('¡Novedad creada y correo enviado exitosamente!', 'Cerrar', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      this.dialogRef.close({ action: 'success', result });
    } catch (error: any) {
      console.error('Error:', error);
      this.snackBar.open(
        'Error: ' + (error.error?.message || 'No se pudo procesar la solicitud'),
        'Cerrar',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    } finally {
      this.enviando = false;
    }
  }
}