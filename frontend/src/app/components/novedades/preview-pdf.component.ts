import { Component, Inject, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NovedadesService } from '../../services/novedades.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-preview-pdf',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    NgxExtendedPdfViewerModule,
    MatProgressSpinnerModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="pdf-preview-container">
      <h2 mat-dialog-title>Vista Previa de la Novedad</h2>
      
      <mat-dialog-content>
        <div class="pdf-viewer" *ngIf="!isLoading">
          <ngx-extended-pdf-viewer
            [src]="pdfSrc || ''" 
            [height]="'80vh'"
            [useBrowserLocale]="true"
            [showToolbar]="false"
            [showSidebarButton]="false"
            [showFindButton]="false"
            [showPagingButtons]="false"
            [showZoomButtons]="false"
            [showPresentationModeButton]="false"
            [showOpenFileButton]="false"
            [showPrintButton]="false"
            [showDownloadButton]="false"
            [showBookmarkButton]="false"
            [showSecondaryToolbarButton]="false"
            [showRotateButton]="false"
            [showHandToolButton]="false"
            [showScrollingButton]="false"
            [showSpreadButton]="false"
            [showPropertiesButton]="false"
            [showBorders]="false"
            [zoom]="'page-fit'"
          >
          </ngx-extended-pdf-viewer>
        </div>
        <mat-spinner *ngIf="isLoading" diameter="50"></mat-spinner>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onModificar()" [disabled]="isProcessing">
          <mat-icon>edit</mat-icon> Modificar
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onEnviar()"
                [disabled]="isProcessing">
          <mat-icon>send</mat-icon> 
          {{ isProcessing ? 'Procesando...' : 'Enviar correo' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .pdf-preview-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #fff;
    }
    
    mat-dialog-content {
      flex: 1;
      overflow: hidden;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .pdf-viewer {
      height: 100%;
      width: 100%;
    }
    
    ::ng-deep {
      .toolbar {
        display: none !important;
      }
      
      .pdfViewer {
        background: none !important;
      }

      .page {
        border: none !important;
        margin: 0 !important;
        box-shadow: none !important;
      }
    }

    h2[mat-dialog-title] {
      color: #016165;
      text-align: center;
      margin-bottom: 1rem;
    }

    mat-dialog-actions {
      padding: 16px;
      border-top: 1px solid #eee;
    }
  `]
})
export class PreviewPdfComponent implements OnInit, OnDestroy {
  pdfSrc: string | undefined;
  isLoading = true;
  isProcessing = false;
  private blobUrl: string | null = null;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { formData: any },
    private dialogRef: MatDialogRef<PreviewPdfComponent>,
    private novedadesService: NovedadesService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  async ngOnInit() {
    try {
      this.isLoading = true;
      const pdfBlob = await firstValueFrom(this.novedadesService.generatePreviewPDF(this.data.formData));
      
      if (!pdfBlob) {
        throw new Error('No se pudo generar el PDF');
      }

      const blobUrl = URL.createObjectURL(pdfBlob);
      this.blobUrl = blobUrl;
      
      this.pdfSrc = blobUrl;
      
      console.log('PDF URL generada:', this.pdfSrc);
    } catch (error) {
      console.error('Error al generar preview:', error);
      this.snackBar.open('Error al generar la vista previa', 'Cerrar', {
        duration: 5000
      });
      this.dialogRef.close();
    } finally {
      this.isLoading = false;
    }
  }

  onModificar() {
    this.dialogRef.close({ 
      action: 'modify',
      formData: this.data.formData
    });
  }

  async onEnviar() {
    this.isProcessing = true;
    try {
      if (!this.authService.isAuthenticated()) {
        throw new Error('No autorizado');
      }

      const result = await firstValueFrom(this.novedadesService.create(this.data.formData));
      this.snackBar.open('¡Novedad creada y correo enviado exitosamente!', 'Cerrar', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      this.dialogRef.close({ action: 'success', result });
    } catch (error: any) {
      console.error('Error:', error);
      if (error.status === 401) {
        this.authService.logout();
        this.router.navigate(['/login']);
      } else {
        this.snackBar.open(
          'Error: ' + (error.error?.message || 'No se pudo procesar la solicitud'),
          'Cerrar',
          { duration: 5000 }
        );
      }
    } finally {
      this.isProcessing = false;
    }
  }

  ngOnDestroy() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
    }
  }
}
