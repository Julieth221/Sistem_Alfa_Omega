import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NovedadesService {
  private apiUrl = `${environment.apiUrl}/novedades`;

  constructor(private http: HttpClient) {}

  crearNovedad(novedad: any): Observable<any> {
    return this.http.post(this.apiUrl, novedad);
  }

  enviarCorreo(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar-correo`, datos);
  }

  obtenerNumeroRemision(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/numero-remision`);
  }

  subirArchivo(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }
}