import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private apiUrl = `${environment.apiUrl}/novedades`;

  constructor(private http: HttpClient) {}

  getNovedades(filtro?: string): Observable<any> {
    let url = `${this.apiUrl}/consulta`;
    if (filtro) {
      url += `?remision_factura=${filtro}`;
    }
    return this.http.get(url);
  }

  getNovedad(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getProductosNovedad(novedadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${novedadId}/productos`);
  }

  actualizarNovedad(id: number, novedad: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, novedad);
  }

  eliminarNovedad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  agregarObservacion(novedadId: number, observacion: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${novedadId}/observaciones`, { observacion });
  }

  getObservaciones(novedadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${novedadId}/observaciones`);
  }

  enviarCorreo(novedadId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${novedadId}/enviar-correo`, {});
  }
} 