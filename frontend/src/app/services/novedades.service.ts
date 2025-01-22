import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, tap, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  generatePreviewPDF(data: any): Observable<Blob> {
    const token = this.authService.getToken();
    return this.http.post(`${this.apiUrl}/novedades/preview`, data, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/pdf'
      }),
      responseType: 'arraybuffer'
    }).pipe(
      map(response => new Blob([response], { type: 'application/pdf' }))
    );
  }

  create(formData: any): Observable<any> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/novedades`, formData, { headers });
  }

  getUltimoNumeroRemision(): Observable<string> {
    return this.http.get<{ numeroRemision: string }>(`${this.apiUrl}/novedades/ultimo-numero`)
      .pipe(
        map(response => response.numeroRemision),
        catchError(error => {
          console.error('Error al obtener número de remisión:', error);
          return of('FNAO0001');
        })
      );
  }

  createNovedad(data: any): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.post(`${this.apiUrl}/novedades`, data, { headers });
  }
}
