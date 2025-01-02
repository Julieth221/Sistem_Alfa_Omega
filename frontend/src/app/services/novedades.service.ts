import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = `${environment.apiUrl}/novedades`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUltimaRemision(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ultima-remision`, {
      headers: this.getHeaders()
    }).pipe(
      catchError(error => {
        console.error('Error al obtener última remisión:', error);
        // Si no hay remisiones, devolvemos un objeto con número inicial
        return of({ numero_remision: 'FNAO0000' });
      })
    );
  }

  crearNovedad(novedad: any): Observable<any> {
    return this.http.post(this.apiUrl, novedad, {
      headers: this.getHeaders()
    });
  }
}