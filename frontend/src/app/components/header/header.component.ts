import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header>
      <h1>{{ appName }}</h1>
    </header>
  `
})
export class HeaderComponent {
  appName = environment.appName;
} 