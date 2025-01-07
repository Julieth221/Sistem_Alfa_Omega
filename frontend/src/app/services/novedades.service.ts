import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

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