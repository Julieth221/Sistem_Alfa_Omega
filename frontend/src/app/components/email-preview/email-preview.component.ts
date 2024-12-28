import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmailService } from '../../services/email.service';

interface EmailResponse {
  html: string;
}

@Component({
  selector: 'app-email-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="email-preview">
      <h3>Vista Previa del Correo</h3>
      <div [innerHTML]="previewHtml"></div>
      <div class="actions">
        <button (click)="sendEmail()">Enviar Correo</button>
        <button (click)="cancel()">Cancelar</button>
      </div>
    </div>
  `,
  styles: [`
    .email-preview {
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .actions {
      margin-top: 1rem;
    }
  `]
})
export class EmailPreviewComponent {
  previewHtml: string = '';
  
  constructor(private emailService: EmailService) {}

  preview(data: any) {
    this.emailService.previewEmail(data)
      .subscribe((response: EmailResponse) => {
        this.previewHtml = response.html;
      });
  }

  sendEmail() {
    // Lógica para enviar
  }

  cancel() {
    // Lógica para cancelar
  }
} 