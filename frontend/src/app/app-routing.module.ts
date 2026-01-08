import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NovedadesComponent } from './components/novedades/novedades.component';
import { ConsultasComponent } from './components/consultas/consultas.component';
import { AuthGuard } from './components/auth/guards/auth.guard';
import { ConsultarFacturaComponent } from './components/factura/consultarfactura.component';
import { MaterialPendienteComponent } from './components/factura/registrofactura.component'; 
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard],
    children: [
      { path: 'novedades', component: NovedadesComponent },
      { path: 'consultas', component: ConsultasComponent },
      { path: 'registrarfactura', component: MaterialPendienteComponent },
      { path: 'consultarfactura', component: ConsultarFacturaComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 