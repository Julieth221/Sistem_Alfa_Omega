import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

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
    <h2 mat-dialog-title>Vista previa del formato</h2>
    <mat-dialog-content>
      <div class="preview-content">
        <h3>Mercancía con Problemas en la Recepción</h3>
        
        <div class="header-info">
          <p><strong>N° DE REMISIÓN:</strong> {{ data.numeroRemision }}</p>
          <p><strong>FECHA:</strong> {{ data.formData.fecha | date:'dd/MM/yyyy' }}</p>
        </div>

        <div class="productos-list">
          <div *ngFor="let producto of data.formData.productos" class="producto-item">
            <h4>Producto</h4>
            <p><strong>Referencia:</strong> {{ producto.referencia }}</p>
            
            <p><strong>Cantidad de la novedad:</strong></p>
            <ul>
              <li *ngIf="producto.cantidad_m2">M2</li>
              <li *ngIf="producto.cantidad_cajas">CAJAS</li>
              <li *ngIf="producto.cantidad_unidades">UNIDADES</li>
            </ul>

            <p><strong>Tipo de novedad:</strong></p>
            <ul>
              <li *ngIf="producto.roturas">Roturas</li>
              <li *ngIf="producto.desportillado">Desportillado</li>
              <li *ngIf="producto.golpeado">Golpeado</li>
              <li *ngIf="producto.rayado">Rayado</li>
              <li *ngIf="producto.incompleto">Incompleto</li>
              <li *ngIf="producto.loteado">Loteado</li>
              <li *ngIf="producto.otro">Otro</li>
            </ul>

            <p><strong>Descripción:</strong> {{ producto.descripcion }}</p>
            <p><strong>Acción realizada:</strong> {{ formatearAccion(producto.accion_realizada) }}</p>
          </div>
        </div>

        <div class="footer-info">
          <p><strong>Diligenciado por:</strong> {{ data.formData.diligenciado_por }}</p>
          <div class="firma">
            <img [src]="firmaDigitalUrl" alt="Firma digital">
            <p>Representante ALFA Y OMEGA</p>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">
        <mat-icon>close</mat-icon> Modificar
      </button>
      <button mat-raised-button color="primary" (click)="onConfirm()">
        <mat-icon>send</mat-icon> Enviar correo
      </button>
    </mat-dialog-actions>
  `
})
export class PreviewPdfComponent {
  firmaDigitalUrl = 'assets/firma-digital.png';

  constructor(
    public dialogRef: MatDialogRef<PreviewPdfComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  formatearAccion(accion: string): string {
    return accion === 'rechazado_devuelto' ? 'Rechazado y Devuelto' : 'Rechazado y Descargado';
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}