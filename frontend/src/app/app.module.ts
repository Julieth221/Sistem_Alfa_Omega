import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
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
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { } 