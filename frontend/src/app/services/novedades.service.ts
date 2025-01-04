import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getUltimoNumeroRemision(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/novedades/ultimo-numero`);
  }

  createNovedad(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/novedades`, data);
  }
}