import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = 'tu_url_api';

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

  createNovedad(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades`, formData);
  }

  getPdfPreview(formData: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/novedades/preview`, formData, {
      responseType: 'blob'
    });
  }

  submitNovedad(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades`, formData);
  }
}