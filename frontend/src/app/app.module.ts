import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule.forRoot([
      {
        path: 'novedades',
        loadComponent: () => import('./components/novedades/novedades.component')
          .then(m => m.NovedadesComponent)
      },
      {
        path: 'consultas',
        loadComponent: () => import('./components/consultas/consultas.component')
          .then(m => m.ConsultasComponent)
      },
      {
        path: '',
        redirectTo: 'novedades',
        pathMatch: 'full'
      }
    ]),
    MatDialogModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    NgxExtendedPdfViewerModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 