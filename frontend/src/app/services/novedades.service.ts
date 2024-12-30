import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  getUltimaRemision(): Observable<any> {
    return this.http.get(`${this.apiUrl}/novedades/ultima-remision`, {
      headers: this.getHeaders()
    });
  }

  crearNovedad(novedad: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades`, novedad, {
      headers: this.getHeaders()
    });
  }
}