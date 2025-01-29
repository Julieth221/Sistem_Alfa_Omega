import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultasService {
  private apiUrl = `${environment.apiUrl}/consultas-novedades`;

  constructor(private http: HttpClient) {}

  getNovedades(remision_factura?: string): Observable<any> {
    let url = `${this.apiUrl}/consulta`;
    if (remision_factura) {
      url += `?remision_factura=${remision_factura}`;
    }
    console.log('URL de consulta:', url);
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error en la consulta:', error);
        throw error;
      })
    );
  }

  getNovedad(id: number): Observable<any> {
    const url = `${this.apiUrl}/${id}`;
    console.log('URL de novedad específica:', url);
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('Error al obtener novedad:', error);
        throw error;
      })
    );
  }

  getProductosNovedad(novedadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${novedadId}/productos`);
  }

  actualizarNovedad(id: number, datos: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, datos);
  }

  eliminarNovedad(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  agregarObservacion(novedadId: number, observacion: string): Observable<any> {
    const url = `${this.apiUrl}/${novedadId}/observaciones`;
    return this.http.post(url, { observacion }).pipe(
      catchError(error => {
        console.error('Error al agregar observación:', error);
        throw error;
      })
    );
  }

  getObservaciones(novedadId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${novedadId}/observaciones`);
  }

  enviarCorreo(novedadId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${novedadId}/enviar-correo`, {});
  }

  eliminarImagen(novedadId: number, tipo: string, imagenId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/novedades/${novedadId}/imagenes/${tipo}/${imagenId}`);
  }

  getCorreoDefault(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/consultas/correo-default`);
  }
} 