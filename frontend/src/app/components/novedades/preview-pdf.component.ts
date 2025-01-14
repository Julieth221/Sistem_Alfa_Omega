import { Component, Inject, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NovedadesService } from '../../services/novedades.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-preview-pdf',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    NgxExtendedPdfViewerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="pdf-preview-container">
      <h2 mat-dialog-title>Vista Previa de la Novedad</h2>
      
      <mat-dialog-content>
        <div class="pdf-viewer">
          <ngx-extended-pdf-viewer
            [src]="pdfUrl"
            [height]="'70vh'"
            [useBrowserLocale]="true"
            [showDownloadButton]="true"
            [zoom]="'auto'"
            language="es-ES"
          >
          </ngx-extended-pdf-viewer>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          <mat-icon>edit</mat-icon> Modificar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSend()"
                [disabled]="isProcessing">
          <mat-icon>send</mat-icon> 
          {{ isProcessing ? 'Procesando...' : 'Enviar correo' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
    .pdf-preview-container {
      padding: 20px;
    }
    h2 {
      color: #016165;
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #016165;
    }
    mat-dialog-content {
      height: 70vh;
      overflow: hidden;
    }
    .pdf-viewer {
      height: 100%;
    }
    mat-dialog-actions {
      padding: 1rem;
      border-top: 1px solid #e0e0e0;
      margin-top: 1rem;
    }
  }
  `]
})
export class PreviewPdfComponent implements OnDestroy {
  pdfUrl: string;
  isProcessing = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<PreviewPdfComponent>
  ) {
    this.pdfUrl = URL.createObjectURL(data.pdfBlob);
  }

  onCancel(): void {
    this.dialogRef.close({ action: 'modify' });
  }

  onSend(): void {
    this.isProcessing = true;
    this.dialogRef.close({ action: 'send' });
  }

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.pdfUrl);
  }
}