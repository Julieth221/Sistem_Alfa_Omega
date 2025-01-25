import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-image-viewer',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="image-viewer-container">
      <img [src]="data.imageUrl" [alt]="data.imageTitle || 'Imagen'" class="preview-image">
      <div class="actions">
        <button mat-button (click)="closeDialog()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .image-viewer-container {
      padding: 20px;
      text-align: center;
    }
    .preview-image {
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
    }
    .actions {
      margin-top: 20px;
    }
  `]
})
export class ImageViewerComponent {
  constructor(
    public dialogRef: MatDialogRef<ImageViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { imageUrl: string; imageTitle?: string }
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
}