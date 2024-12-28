import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HomeComponent
  ],
  template: `
    <app-header></app-header>
    <app-home></app-home>
  `
})
export class AppComponent {
  title = 'ALFA Y OMEGA ENCHAPES Y ACABADOS S.A.S.';
}
