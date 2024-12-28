import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent, EmailPreviewComponent } from './components';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    EmailPreviewComponent
  ],
  template: `
    <app-header></app-header>
    <main>
      <app-email-preview></app-email-preview>
    </main>
  `,
  styles: [`
    main {
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S.';
}
