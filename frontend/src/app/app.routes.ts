import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './components/auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
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
        path: 'registrarfactura',
        loadComponent: () => import('./components/factura/registrofactura.component')
          .then(m => m.MaterialPendienteComponent)
      },
      {
        path: 'consultarfactura',
        loadComponent: () => import('./components/factura/consultarfactura.component')
          .then(m => m.ConsultarFacturaComponent)
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./components/usuarios/usuarios.component')
          .then(m => m.UsuariosComponent)
      },
      { path: '', redirectTo: 'novedades', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
